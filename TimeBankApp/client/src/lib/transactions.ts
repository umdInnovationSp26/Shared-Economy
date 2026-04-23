import {
  addDoc,
  collection,
  doc,
  updateDoc,
  increment,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

type TaskTransactionInput = {
  id: string;
  title?: string;
  hours?: number;
  category?: string;
  description?: string;
};

export async function completeTask(userId: string, task: TaskTransactionInput) {
  const safeHours = typeof task.hours === "number" && task.hours > 0 ? task.hours : 1;

  await addDoc(collection(db, "users", userId, "transactions"), {
    taskId: task.id,
    title: task.title || "Untitled task",
    amount: safeHours,
    type: "earned",
    category: task.category || "General",
    description: task.description || "",
    status: "completed",
    timestamp: serverTimestamp(),
  });

  await updateDoc(doc(db, "users", userId), {
    credits: increment(safeHours),
  });

  await updateDoc(doc(db, "tasks", task.id), {
    status: "completed",
    completedAt: serverTimestamp(),
  });
}