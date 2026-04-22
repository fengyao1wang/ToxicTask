-- 修复 tasks 表的 RLS 策略
-- 删除旧策略
DROP POLICY IF EXISTS "Allow all select" ON public.tasks;
DROP POLICY IF EXISTS "Allow all insert" ON public.tasks;
DROP POLICY IF EXISTS "Allow all update" ON public.tasks;
DROP POLICY IF EXISTS "Allow all delete" ON public.tasks;

-- 创建新的宽松策略（用于开发测试）
-- 注意：生产环境需要更严格的策略

-- 允许所有人查看任务
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

-- 确保 RLS 已启用
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
