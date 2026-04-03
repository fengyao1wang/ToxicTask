-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE shame_logs ENABLE ROW LEVEL SECURITY;

-- Profiles policies
-- Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Tasks policies
-- Users can view their own tasks
CREATE POLICY "Users can view own tasks"
  ON tasks FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own tasks
CREATE POLICY "Users can insert own tasks"
  ON tasks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own tasks
CREATE POLICY "Users can update own tasks"
  ON tasks FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own tasks
CREATE POLICY "Users can delete own tasks"
  ON tasks FOR DELETE
  USING (auth.uid() = user_id);

-- Shame logs policies
-- Everyone can view all shame logs (public shame wall)
CREATE POLICY "Anyone can view shame logs"
  ON shame_logs FOR SELECT
  TO authenticated
  USING (true);

-- Only system/authenticated users can insert shame logs
CREATE POLICY "Authenticated users can insert shame logs"
  ON shame_logs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can view their own shame logs
CREATE POLICY "Users can view own shame logs"
  ON shame_logs FOR SELECT
  USING (auth.uid() = user_id);
