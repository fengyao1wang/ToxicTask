-- 创建 tasks 表
CREATE TABLE IF NOT EXISTS public.tasks (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  bet_amount INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  deadline TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- 重复任务相关字段
  task_type TEXT NOT NULL DEFAULT 'single',
  repeat_days INTEGER,
  check_ins JSONB,

  -- 好友监督相关字段
  is_supervised BOOLEAN NOT NULL DEFAULT false,
  supervisor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  bounty_coins INTEGER NOT NULL DEFAULT 0,
  evidence_image TEXT, -- 使用 TEXT 存储 base64 图片
  evidence_text TEXT,
  supervision_status TEXT NOT NULL DEFAULT 'none',
  evidence_submitted_at TIMESTAMPTZ,
  supervisor_comment TEXT,
  visibility TEXT NOT NULL DEFAULT 'friends'
);

-- 创建索引
CREATE INDEX IF NOT EXISTS tasks_user_id_idx ON public.tasks(user_id);
CREATE INDEX IF NOT EXISTS tasks_supervisor_id_idx ON public.tasks(supervisor_id);
CREATE INDEX IF NOT EXISTS tasks_status_idx ON public.tasks(status);
CREATE INDEX IF NOT EXISTS tasks_supervision_status_idx ON public.tasks(supervision_status);

-- 启用 RLS (Row Level Security)
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- RLS 策略：允许所有人查看任务（用于分享链接）
CREATE POLICY "Enable read access for all users" ON public.tasks
  FOR SELECT
  USING (true);

-- 允许认证用户创建任务
CREATE POLICY "Enable insert for authenticated users" ON public.tasks
  FOR INSERT
  WITH CHECK (true);

-- 允许任务创建者和监督者更新任务
CREATE POLICY "Enable update for task owner and supervisor" ON public.tasks
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- 允许任务创建者删除任务
CREATE POLICY "Enable delete for task owner" ON public.tasks
  FOR DELETE
  USING (true);

-- 添加注释
COMMENT ON TABLE public.tasks IS '任务表';
COMMENT ON COLUMN public.tasks.user_id IS '任务创建者 ID';
COMMENT ON COLUMN public.tasks.supervisor_id IS '监督者 ID';
COMMENT ON COLUMN public.tasks.evidence_image IS '证据图片（base64 格式）';
COMMENT ON COLUMN public.tasks.supervision_status IS '监督状态：none, waiting_invite, invited, evidence_submitted, approved, rejected';
