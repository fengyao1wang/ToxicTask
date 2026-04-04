import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.TARO_APP_SUPABASE_URL || '';
const supabaseAnonKey = process.env.TARO_APP_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('[Supabase] 缺少环境变量配置');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
