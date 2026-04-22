-- 修复 evidence_image 字段类型
-- 如果字段类型不是 TEXT，将其改为 TEXT 以支持大型 base64 图片

-- 方案1：直接修改字段类型（如果表已存在）
ALTER TABLE public.tasks
ALTER COLUMN evidence_image TYPE TEXT;

-- 如果上面的命令失败（字段不存在），则忽略错误
-- 你可以在 Supabase Dashboard 的 SQL Editor 中执行这个脚本
