import { create } from 'zustand';
import { Profile, Task } from '@/types';
import { User } from '@supabase/supabase-js';

interface AppState {
  user: User | null;
  profile: Profile | null;
  tasks: Task[];
  setUser: (user: User | null) => void;
  setProfile: (profile: Profile | null) => void;
  setTasks: (tasks: Task[]) => void;
  addTask: (task: Task) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  removeTask: (id: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  user: null,
  profile: null,
  tasks: [],

  setUser: (user) => set({ user }),

  setProfile: (profile) => set({ profile }),

  setTasks: (tasks) => set({ tasks }),

  addTask: (task) => set((state) => ({
    tasks: [...state.tasks, task]
  })),

  updateTask: (id, updates) => set((state) => ({
    tasks: state.tasks.map((task) =>
      task.id === id ? { ...task, ...updates } : task
    ),
  })),

  removeTask: (id) => set((state) => ({
    tasks: state.tasks.filter((task) => task.id !== id),
  })),
}));
