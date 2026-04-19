import { create } from 'zustand';
import Taro from '@tarojs/taro';
import { CoinTransaction, TransactionType, STORAGE_KEYS } from '../../types';

interface CoinState {
  transactions: CoinTransaction[];
  loadTransactions: (userId: string) => void;
  addTransaction: (
    userId: string,
    type: TransactionType,
    amount: number,
    sourceId?: string,
    description?: string
  ) => Promise<void>;
  getBalance: (userId: string) => number;
  getTransactionsByType: (userId: string, type: TransactionType) => CoinTransaction[];
}

// 生成唯一ID
const generateId = (): string => {
  return `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
};

// 从本地存储加载交易记录
const loadTransactionsFromStorage = (userId: string): CoinTransaction[] => {
  try {
    const allTransactions = Taro.getStorageSync(STORAGE_KEYS.TRANSACTIONS) || {};
    return allTransactions[userId] || [];
  } catch (error) {
    console.error('[CoinStore][Error] 加载交易记录失败:', error);
    return [];
  }
};

// 保存交易记录到本地存储
const saveTransactionsToStorage = (userId: string, transactions: CoinTransaction[]) => {
  try {
    const allTransactions = Taro.getStorageSync(STORAGE_KEYS.TRANSACTIONS) || {};
    allTransactions[userId] = transactions;
    Taro.setStorageSync(STORAGE_KEYS.TRANSACTIONS, allTransactions);
  } catch (error) {
    console.error('[CoinStore][Error] 保存交易记录失败:', error);
    throw error;
  }
};

// 更新用户尊严币余额
const updateUserBalance = (userId: string, newBalance: number) => {
  try {
    const allProfiles = Taro.getStorageSync(STORAGE_KEYS.PROFILES) || {};
    console.log('[CoinStore][Debug] 更新余额前:', {
      userId,
      oldBalance: allProfiles[userId]?.dignity_coins,
      newBalance,
      profileExists: !!allProfiles[userId],
    });
    if (allProfiles[userId]) {
      allProfiles[userId].dignity_coins = newBalance;
      allProfiles[userId].updated_at = new Date().toISOString();
      Taro.setStorageSync(STORAGE_KEYS.PROFILES, allProfiles);
      console.log('[CoinStore][Debug] 余额已更新:', newBalance);
    } else {
      console.error('[CoinStore][Error] 用户 profile 不存在，无法更新余额');
    }
  } catch (error) {
    console.error('[CoinStore][Error] 更新用户余额失败:', error);
    throw error;
  }
};

// 获取当前余额
const getCurrentBalance = (userId: string): number => {
  try {
    const allProfiles = Taro.getStorageSync(STORAGE_KEYS.PROFILES) || {};
    return allProfiles[userId]?.dignity_coins || 0;
  } catch (error) {
    console.error('[CoinStore][Error] 获取当前余额失败:', error);
    return 0;
  }
};

export const useCoinStore = create<CoinState>((set, get) => ({
  transactions: [],

  // 加载交易记录
  loadTransactions: (userId: string) => {
    const transactions = loadTransactionsFromStorage(userId);
    set({ transactions });
  },

  // 添加交易记录
  addTransaction: async (
    userId: string,
    type: TransactionType,
    amount: number,
    sourceId?: string,
    description?: string
  ) => {
    try {
      // 获取当前余额
      const currentBalance = getCurrentBalance(userId);
      const newBalance = currentBalance + amount;

      // 检查余额是否足够（支出时）
      if (amount < 0 && newBalance < 0) {
        throw new Error('尊严币余额不足');
      }

      // 创建交易记录
      const transaction: CoinTransaction = {
        id: generateId(),
        user_id: userId,
        type,
        amount,
        balance_after: newBalance,
        source_id: sourceId,
        description: description || getDefaultDescription(type),
        created_at: new Date().toISOString(),
      };

      // 保存交易记录
      const transactions = loadTransactionsFromStorage(userId);
      transactions.unshift(transaction); // 最新的记录放在前面
      saveTransactionsToStorage(userId, transactions);

      // 更新用户余额
      updateUserBalance(userId, newBalance);

      // 更新状态
      set({ transactions });

      console.log('[CoinStore][Info] 交易记录已创建:', {
        type,
        amount,
        balance_after: newBalance,
      });
    } catch (error) {
      console.error('[CoinStore][Error] 创建交易记录失败:', error);
      throw error;
    }
  },

  // 获取余额
  getBalance: (userId: string) => {
    return getCurrentBalance(userId);
  },

  // 按类型筛选交易记录
  getTransactionsByType: (userId: string, type: TransactionType) => {
    const transactions = loadTransactionsFromStorage(userId);
    return transactions.filter((t) => t.type === type);
  },
}));

// 获取默认描述
const getDefaultDescription = (type: TransactionType): string => {
  const descriptions: Record<TransactionType, string> = {
    task_bet: '任务押注',
    task_refund: '任务完成退款',
    task_penalty: '任务失败扣款',
    check_in: '每日签到',
    achievement: '成就奖励',
    invite: '邀请奖励',
    ad_watch: '观看广告',
    recharge: '充值',
    bounty_freeze: '冻结监督赏金',
    bounty_reward: '监督奖励',
    bounty_refund: '赏金退回',
  };
  return descriptions[type] || '未知交易';
};
