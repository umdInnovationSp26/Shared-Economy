import React, { createContext, useContext,useEffect, useState, ReactNode } from "react";
import toolsImg from "@/assets/images/tools.png";
import { db } from "../lib/firebase";
import { addDoc, collection, onSnapshot} from "firebase/firestore";

export type Task = {
  id: string;
  type: string;
  title: string;
  description: string;
  radius: string;
  hours: number;
  image: string;
  category: string;
  isAssigned: boolean;
};

interface TaskContextType {
  tasks: Task[];
  addTask: (task: Omit<Task, "id" | "image">) => Promise<void>;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export function TaskProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>([]);

useEffect(() => {
  const unsubscribe = onSnapshot(collection(db, "tasks"), (snapshot) => {
    const firebaseTasks: Task[] = snapshot.docs.map((doc) => {
      const data = doc.data();

      return {
        id: doc.id,
        type: data.type || "",
        title: data.title || "",
        description: data.description || "",
        radius: data.radius || "",
        hours: data.hours || 0,
        image: data.image || toolsImg,
        category: data.category || "",
        isAssigned: false
      };
    });

    setTasks(firebaseTasks);
  });

  return () => unsubscribe();
}, []);


 const addTask = async (newTaskData: Omit<Task, "id" | "image">) => {
  try {
    await addDoc(collection(db, "tasks"), {
      ...newTaskData,
      image: toolsImg,
    });

    console.log("Document written successfully");
  } catch (e) {
    console.error("Error adding document: ", e);
  }
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
    throw new Error("useTasks must be used within a TaskProvider");
  }
  return context;
}
