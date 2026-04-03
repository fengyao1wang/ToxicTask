import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { Task } from '@/types';
import { useTaskStore } from '@/lib/stores/taskStore';

interface TaskItemProps {
  task: Task;
  onComplete: (taskId: string) => void;
}

function TaskItem({ task, onComplete }: TaskItemProps) {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date().getTime();
      const deadline = new Date(task.deadline).getTime();
      const diff = deadline - now;

      if (diff <= 0) {
        setTimeLeft('已超时');
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft(`${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [task.deadline]);

  const getStatusColor = () => {
    switch (task.status) {
      case 'completed':
        return 'bg-green-900 border-green-500';
      case 'failed':
        return 'bg-red-900 border-red-500';
      default:
        return 'bg-gray-900 border-gray-700';
    }
  };

  const getStatusText = () => {
    switch (task.status) {
      case 'completed':
        return '已完成';
      case 'failed':
        return '已失败';
      default:
        return '进行中';
    }
  };

  return (
    <View className={`${getStatusColor()} border-2 rounded-lg p-4 mb-3`}>
      <View className="flex-row justify-between items-start mb-2">
        <Text className="text-white text-lg font-bold flex-1">{task.title}</Text>
        <View className="bg-gray-800 px-3 py-1 rounded-full">
          <Text className="text-yellow-400 text-sm font-bold">
            {task.bet_amount} 币
          </Text>
        </View>
      </View>

      <View className="flex-row justify-between items-center">
        <View>
          <Text className="text-gray-400 text-sm">
            {task.status === 'pending' ? `剩余: ${timeLeft}` : getStatusText()}
          </Text>
        </View>

        {task.status === 'pending' && (
          <TouchableOpacity
            onPress={() => onComplete(task.id)}
            className="bg-green-600 px-4 py-2 rounded-lg"
          >
            <Text className="text-white font-bold">完成</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

interface TaskListProps {
  userId: string;
}

export default function TaskList({ userId }: TaskListProps) {
  const { tasks, loading, fetchTasks, updateTaskStatus } = useTaskStore();

  useEffect(() => {
    fetchTasks(userId);
  }, [userId]);

  const handleComplete = async (taskId: string) => {
    await updateTaskStatus(taskId, 'completed');
  };

  if (loading && tasks.length === 0) {
    return (
      <View className="flex-1 justify-center items-center">
        <Text className="text-gray-400">加载中...</Text>
      </View>
    );
  }

  if (tasks.length === 0) {
    return (
      <View className="flex-1 justify-center items-center">
        <Text className="text-gray-400 text-lg">暂无任务</Text>
        <Text className="text-gray-500 text-sm mt-2">创建你的第一个任务吧！</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={tasks}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <TaskItem task={item} onComplete={handleComplete} />
      )}
      contentContainerStyle={{ paddingBottom: 20 }}
    />
  );
}
