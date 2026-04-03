-- Function to handle task failure and deduct dignity coins
CREATE OR REPLACE FUNCTION handle_task_failure()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if task status changed to 'failed'
  IF NEW.status = 'failed' AND OLD.status != 'failed' THEN
    -- Deduct bet_amount from user's dignity_coins
    UPDATE profiles
    SET dignity_coins = dignity_coins - NEW.bet_amount
    WHERE id = NEW.user_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to handle task completion and return dignity coins
CREATE OR REPLACE FUNCTION handle_task_completion()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if task status changed to 'completed'
  IF NEW.status = 'completed' AND OLD.status = 'pending' THEN
    -- Return bet_amount to user's dignity_coins (already deducted when task was created)
    -- Actually, we don't deduct on creation, so no need to return
    -- This is just a placeholder for future logic
    NULL;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for task failure
CREATE TRIGGER on_task_failed
  AFTER UPDATE ON tasks
  FOR EACH ROW
  WHEN (NEW.status = 'failed' AND OLD.status != 'failed')
  EXECUTE FUNCTION handle_task_failure();

-- Function to check if user has enough dignity coins before creating task
CREATE OR REPLACE FUNCTION check_dignity_coins_before_task()
RETURNS TRIGGER AS $$
DECLARE
  user_coins INTEGER;
BEGIN
  -- Get user's current dignity coins
  SELECT dignity_coins INTO user_coins
  FROM profiles
  WHERE id = NEW.user_id;

  -- Check if user has enough coins
  IF user_coins < NEW.bet_amount THEN
    RAISE EXCEPTION 'Insufficient dignity coins. You have % but need %', user_coins, NEW.bet_amount;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to check dignity coins before task creation
CREATE TRIGGER check_coins_before_task_insert
  BEFORE INSERT ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION check_dignity_coins_before_task();
