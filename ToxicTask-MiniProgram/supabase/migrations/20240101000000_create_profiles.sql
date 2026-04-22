-- 创建 profiles 表
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  openid TEXT UNIQUE NOT NULL,
  username TEXT NOT NULL DEFAULT '微信用户',
  avatar_url TEXT DEFAULT '',
  dignity_coins INTEGER NOT NULL DEFAULT 100,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS profiles_openid_idx ON public.profiles(openid);

-- 启用 RLS (Row Level Security)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS 策略：用户只能访问自己的数据
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  USING (true); -- 暂时允许所有人查看，后续可以改为 auth.uid() = id

CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  USING (true); -- 暂时允许所有人更新，后续可以改为 auth.uid() = id

CREATE POLICY "Users can insert own profile"
  ON public.profiles
  FOR INSERT
  WITH CHECK (true); -- 暂时允许所有人插入，后续可以改为 auth.uid() = id

-- 添加注释
COMMENT ON TABLE public.profiles IS '用户资料表';
COMMENT ON COLUMN public.profiles.openid IS '微信 openid';
COMMENT ON COLUMN public.profiles.username IS '用户昵称';
COMMENT ON COLUMN public.profiles.avatar_url IS '头像 URL';
COMMENT ON COLUMN public.profiles.dignity_coins IS '尊严币余额';
