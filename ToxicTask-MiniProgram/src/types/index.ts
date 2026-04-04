export interface Profile {
  id: string;
  username: string;
  avatar_url?: string;
  dignity_coins: number;
  created_at: string;
  updated_at: string;
}

export type TaskStatus = 'pending' | 'completed' | 'failed';

export interface Task {
  id: string;
  user_id: string;
  title: string;
  bet_amount: number;
  status: TaskStatus;
  deadline: string;
  created_at: string;
  updated_at: string;
}

export interface ShameLog {
  id: string;
  task_id: string;
  user_id: string;
  ai_comment: string;
  created_at: string;
  task?: Task;
}
