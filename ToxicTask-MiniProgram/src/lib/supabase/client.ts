import { createClient } from '@supabase/supabase-js';

// 小程序环境中直接使用配置值
const supabaseUrl = 'https://jtgiggzizzipxhwgnavx.supabase.co';
const supabaseAnonKey = 'sb_publishable_XAO3ZvtPxZ8ZdaZmsppkgA_4Pko-mrK';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('[Supabase] 缺少环境变量配置');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
