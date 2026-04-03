-- ============================================
-- ToxicTask Database Setup - Complete Script
-- 在 Supabase Dashboard 的 SQL Editor 中执行此脚本
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. Create Tables
-- ============================================

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  dignity_coins INTEGER NOT NULL DEFAULT 100,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  bet_amount INTEGER NOT NULL CHECK (bet_amount > 0),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  deadline TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create shame_logs table
CREATE TABLE IF NOT EXISTS shame_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  ai_comment TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 2. Create Indexes
-- ============================================

CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_deadline ON tasks(deadline);
CREATE INDEX IF NOT EXISTS idx_shame_logs_user_id ON shame_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_shame_logs_task_id ON shame_logs(task_id);

-- ============================================
-- 3. Create Functions
-- ============================================

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to handle task failure and deduct dignity coins
CREATE OR REPLACE FUNCTION handle_task_failure()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'failed' AND OLD.status != 'failed' THEN
    UPDATE profiles
    SET dignity_coins = dignity_coins - NEW.bet_amount
    WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to check dignity coins before creating task
CREATE OR REPLACE FUNCTION check_dignity_coins_before_task()
RETURNS TRIGGER AS $$
DECLARE
  user_coins INTEGER;
BEGIN
  SELECT dignity_coins INTO user_coins
  FROM profiles
  WHERE id = NEW.user_id;

  IF user_coins < NEW.bet_amount THEN
    RAISE EXCEPTION 'Insufficient dignity coins. You have % but need %', user_coins, NEW.bet_amount;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 4. Create Triggers
-- ============================================

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for task failure
CREATE TRIGGER on_task_failed
  AFTER UPDATE ON tasks
  FOR EACH ROW
  WHEN (NEW.status = 'failed' AND OLD.status != 'failed')
  EXECUTE FUNCTION handle_task_failure();

-- Trigger to check dignity coins before task creation
CREATE TRIGGER check_coins_before_task_insert
  BEFORE INSERT ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION check_dignity_coins_before_task();

-- ============================================
-- 5. Enable Row Level Security
-- ============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE shame_logs ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 6. Create RLS Policies
-- ============================================

-- Profiles policies
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Tasks policies
CREATE POLICY "Users can view own tasks"
  ON tasks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tasks"
  ON tasks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tasks"
  ON tasks FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own tasks"
  ON tasks FOR DELETE
  USING (auth.uid() = user_id);

-- Shame logs policies
CREATE POLICY "Anyone can view shame logs"
  ON shame_logs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert shame logs"
  ON shame_logs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- Setup Complete!
-- ============================================
