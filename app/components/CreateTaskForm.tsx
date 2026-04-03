import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useTaskStore } from '@/lib/stores/taskStore';
import { useAppStore } from '@/lib/stores/appStore';

interface CreateTaskFormProps {
  onSuccess?: () => void;
}

export default function CreateTaskForm({ onSuccess }: CreateTaskFormProps) {
  const [title, setTitle] = useState('');
  const [hours, setHours] = useState('1');
  const [minutes, setMinutes] = useState('0');
  const [betAmount, setBetAmount] = useState(10);

  const { createTask, loading } = useTaskStore();
  const { user, profile, updateProfile } = useAppStore();

  const handleCreate = async () => {
    if (!title.trim()) {
      Alert.alert('错误', '请输入任务名称');
      return;
    }

    if (!user || !profile) {
      Alert.alert('错误', '请先登录');
      return;
    }

    const totalMinutes = parseInt(hours) * 60 + parseInt(minutes);
    if (totalMinutes <= 0) {
      Alert.alert('错误', '请设置有效的倒计时');
      return;
    }

    if (betAmount > profile.dignity_coins) {
      Alert.alert('错误', '尊严币不足');
      return;
    }

    const deadline = new Date();
    deadline.setMinutes(deadline.getMinutes() + totalMinutes);

    const newTask = await createTask({
      user_id: user.id,
      title: title.trim(),
      bet_amount: betAmount,
      status: 'pending',
      deadline: deadline.toISOString(),
    });

    if (newTask) {
      // 扣除押金
      await updateProfile({
        dignity_coins: profile.dignity_coins - betAmount,
      });

      setTitle('');
      setHours('1');
      setMinutes('0');
      setBetAmount(10);

      Alert.alert('成功', '任务创建成功！');
      onSuccess?.();
    }
  };

  return (
    <View className="bg-gray-900 rounded-lg p-4 mb-4">
      <Text className="text-white text-lg font-bold mb-4">创建新任务</Text>

      {/* 任务名称 */}
      <View className="mb-4">
        <Text className="text-gray-400 text-sm mb-2">任务名称</Text>
        <TextInput
          className="bg-gray-800 text-white px-4 py-3 rounded-lg"
          placeholder="输入任务名称..."
          placeholderTextColor="#6B7280"
          value={title}
          onChangeText={setTitle}
          maxLength={50}
        />
      </View>

      {/* 倒计时 */}
      <View className="mb-4">
        <Text className="text-gray-400 text-sm mb-2">倒计时</Text>
        <View className="flex-row items-center">
          <TextInput
            className="bg-gray-800 text-white px-4 py-3 rounded-lg flex-1 mr-2"
            placeholder="小时"
            placeholderTextColor="#6B7280"
            keyboardType="number-pad"
            value={hours}
            onChangeText={setHours}
            maxLength={2}
          />
          <Text className="text-white mx-2">:</Text>
          <TextInput
            className="bg-gray-800 text-white px-4 py-3 rounded-lg flex-1 ml-2"
            placeholder="分钟"
            placeholderTextColor="#6B7280"
            keyboardType="number-pad"
            value={minutes}
            onChangeText={setMinutes}
            maxLength={2}
          />
        </View>
      </View>

      {/* 押注金额 */}
      <View className="mb-4">
        <Text className="text-gray-400 text-sm mb-2">
          押注金额: {betAmount} 尊严币
        </Text>
        <View className="flex-row items-center">
          <TouchableOpacity
            onPress={() => setBetAmount(Math.max(1, betAmount - 5))}
            className="bg-gray-800 px-4 py-2 rounded-lg"
          >
            <Text className="text-white text-xl">-</Text>
          </TouchableOpacity>

          <View className="flex-1 mx-4">
            <View className="bg-gray-800 h-2 rounded-full">
              <View
                className="bg-red-500 h-2 rounded-full"
                style={{ width: `${(betAmount / 50) * 100}%` }}
              />
            </View>
          </View>

          <TouchableOpacity
            onPress={() => setBetAmount(Math.min(50, betAmount + 5))}
            className="bg-gray-800 px-4 py-2 rounded-lg"
          >
            <Text className="text-white text-xl">+</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 创建按钮 */}
      <TouchableOpacity
        onPress={handleCreate}
        disabled={loading}
        className={`py-3 rounded-lg ${loading ? 'bg-gray-700' : 'bg-red-600'}`}
      >
        <Text className="text-white text-center font-bold">
          {loading ? '创建中...' : '创建任务'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
