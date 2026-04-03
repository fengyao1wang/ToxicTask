-- ============================================
-- 自动创建 Profile 的触发器
-- 当 auth.users 表新增用户时，自动在 public.profiles 表中插入记录
-- ============================================

-- 1. 创建触发器函数
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, dignity_coins)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    100
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. 创建触发器
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 3. 更新 RLS 策略 - 允许用户在注册时插入自己的 profile
-- （实际上现在不需要了，因为触发器会自动创建）
-- 但保留这个策略以防万一
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ============================================
-- 执行完成！
-- ============================================
-- 说明：
-- 1. 当用户注册时，触发器会自动创建 profile
-- 2. username 会从 user_metadata 中获取，如果没有则使用邮箱前缀
-- 3. 初始尊严币为 100
