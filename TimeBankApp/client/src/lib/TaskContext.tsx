import React, { createContext, useContext, useState, ReactNode } from 'react';
import gardeningImg from "@/assets/images/gardening.png";
import toolsImg from "@/assets/images/tools.png";
import tutoringImg from "@/assets/images/tutoring.png";

export type Task = {
  id: number;
  type: string;
  title: string;
  description: string;
  radius: string;
  hours: number;
  image: string;
  category: string;
};

const INITIAL_TASKS: Task[] = [
  {
    id: 1,
    type: "Offering",
    title: "Community Garden Maintenance",
    description: "I have experience with organic gardening and can help you set up or maintain your raised beds.",
    radius: "0.5 miles",
    hours: 2,
    image: gardeningImg,
    category: "Physical Labor"
  },
  {
    id: 2,
    type: "Requesting",
    title: "Need help fixing kitchen cabinet",
    description: "The hinges on my kitchen cabinet came loose and I don't have the tools to fix it properly. Hoping someone can help!",
    radius: "1.2 miles",
    hours: 1,
    image: toolsImg,
    category: "Home Repair"
  },
  {
    id: 3,
    type: "Offering",
    title: "Beginner Guitar Lessons",
    description: "I've been playing guitar for 10 years and would love to teach someone the basics (chords, strumming patterns).",
    radius: "2.5 miles",
    hours: 3,
    image: tutoringImg,
    category: "Education"
  },
  {
    id: 4,
    type: "Requesting",
    title: "Moving some heavy boxes",
    description: "Need an extra pair of hands to move about 10 heavy boxes from my living room to the basement. Shouldn't take long!",
    radius: "0.8 miles",
    hours: 1.5,
    image: toolsImg,
    category: "Physical Labor"
  }
];

interface TaskContextType {
  tasks: Task[];
  addTask: (task: Omit<Task, 'id' | 'image'>) => void;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export function TaskProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);

  const addTask = (newTaskData: Omit<Task, 'id' | 'image'>) => {
    const newTask: Task = {
      ...newTaskData,
      id: Date.now(),
      image: toolsImg, // Defaulting image for newly created mocked tasks
    };
    setTasks(prev => [newTask, ...prev]);
  };

  return (
    <TaskContext.Provider value={{ tasks, addTask }}>
      {children}
    </TaskContext.Provider>
  );
}

export function useTasks() {
  const context = useContext(TaskContext);
  if (context === undefined) {
    throw new Error('useTasks must be used within a TaskProvider');
  }
  return context;
}
