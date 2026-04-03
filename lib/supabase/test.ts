import { supabase } from './client';

/**
 * 测试 Supabase 数据库连接
 */
export async function testSupabaseConnection() {
  try {
    console.log('🔍 Testing Supabase connection...');

    // 测试基本连接
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);

    if (error) {
      console.error('❌ Connection failed:', error.message);
      return false;
    }

    console.log('✅ Supabase connection successful!');
    return true;
  } catch (err) {
    console.error('❌ Unexpected error:', err);
    return false;
  }
}

/**
 * 测试用户注册流程
 */
export async function testUserSignup(email: string, password: string) {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      console.error('❌ Signup failed:', error.message);
      return null;
    }

    console.log('✅ User signed up:', data.user?.id);
    return data.user;
  } catch (err) {
    console.error('❌ Unexpected error:', err);
    return null;
  }
}

/**
 * 测试用户登录流程
 */
export async function testUserLogin(email: string, password: string) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('❌ Login failed:', error.message);
      return null;
    }

    console.log('✅ User logged in:', data.user?.id);
    return data.user;
  } catch (err) {
    console.error('❌ Unexpected error:', err);
    return null;
  }
}
