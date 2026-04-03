import { create } from 'zustand';
import { Profile, Task } from '@/types';

interface AppState {
  profile: Profile | null;
  tasks: Task[];
  setProfile: (profile: Profile | null) => void;
  setTasks: (tasks: Task[]) => void;
  addTask: (task: Task) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  removeTask: (id: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  profile: null,
  tasks: [],

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
