import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardFooter, } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "@/components/ui/select";
import { Clock, MapPin, Search, Filter } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Task, } from "@/lib/TaskContext";
import { Dialog, DialogTrigger, DialogTitle, DialogContent, DialogClose, DialogOverlay, DialogPortal, DialogDescription, } from "@/components/ui/dialog";
import "./tasks.css";

import { auth, db } from "@/lib/firebase";
import { arrayUnion, collection, doc, getDocs, query, updateDoc, where, } from "firebase/firestore";

const handleAssignment = async (taskId: string) => {
  const user = auth.currentUser;
  if (!user) return;
  try {
    const userRef = doc(db, "users", user.uid);
    const taskRef = doc(db,"tasks", taskId);

    await updateDoc(userRef, {
      CurrentTasks: arrayUnion(taskId),
    });
    console.log("task %s added to user", taskId);
    
    await updateDoc(taskRef, {
      isAssigned: true,
      assignedTo: user.uid,
      assignedAt: new Date(),
      status: "assigned"
    });

    console.log("task %s set to true", taskId);

  } catch (error) {
    console.error("Error assigning task:", error);
  }
};

export default function Tasks() {
  const [search, setSearch] = useState("");
  const [unassignedTasks, setUnassignedTasks] = useState<Task[]>([]);
  const [, setLocation] = useLocation()

  useEffect(() => {
    async function fetchUnassignedTasks() {
      const tasksRef = collection(db, "tasks");
      const unassignedQuery = query(tasksRef, where("isAssigned", "==", false));
      const querySnapshot = await getDocs(unassignedQuery);

      return querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          title: data.title,
          image: data.image,
          type: data.type,
          category: data.category,
          radius: data.radius,
          hours: data.hours,
          description: data.description,
          isAssigned: data.isAssigned,
        };
      });
    }
    fetchUnassignedTasks().then((tasks) => {
      setUnassignedTasks(tasks);
    });
  }, []);

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">
            Available Tasks
          </h1>
          <p className="text-muted-foreground">
            Find services requested or offered in your community.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tasks..."
              className="pl-9 w-full sm:w-[250px] bg-white"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select defaultValue="all">
            <SelectTrigger className="w-full sm:w-[140px] bg-white">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="offering">Offering Services</SelectItem>
              <SelectItem value="requesting">Requesting Help</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/*Shows unassigned tasks only*/}
      {unassignedTasks.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-8">
          {unassignedTasks.map((task) => (
            <Card
              key={task.id}
              className="overflow-hidden flex flex-col hover:shadow-lg transition-all duration-300 group"
            >
              <div className="h-40 w-full overflow-hidden relative">
                <img
                  src={task.image}
                  alt={task.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-2 left-2 flex gap-2">
                  <Badge
                    variant={task.type === "Offering" ? "default" : "secondary"}
                    className="shadow-sm font-semibold"
                  >
                    {task.type}
                  </Badge>
                </div>
              </div>
              <CardHeader className="p-4 pb-2">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-medium text-muted-foreground">
                    {task.category}
                  </span>
                  <div className="flex items-center text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3 mr-1" /> {task.radius}
                  </div>
                </div>
                <CardTitle className="text-base line-clamp-1 leading-snug">
                  {task.title}
                </CardTitle>
              </CardHeader>
              <CardFooter className="p-2 flex justify-between items-center border-t mt-auto">
                <div className="flex items-center text-sm font-bold text-primary">
                  <Clock className="h-4 w-4 mr-1.5" /> {task.hours} hr
                  {task.hours > 1 ? "s" : ""}
                </div>
                <Dialog>
                  <DialogTrigger>
                    <Button size="sm" className="rounded-full primary">
                      View Details
                    </Button>
                  </DialogTrigger>
                  <DialogPortal>
                    <DialogOverlay className="backdrop-blur-sm">
                      <DialogContent>
                        <DialogTitle>{task.title}</DialogTitle>
                        <DialogDescription>
                          {task.description}
                        </DialogDescription>
                        <DialogClose>
                          <Button
                            size="sm"
                            className="rounded-full take-task-btn"
                            onClick={() => handleAssignment(task.id).then(() => setLocation("/home"))}
                          >
                            Take on this task
                          </Button>
                        </DialogClose>
                      </DialogContent>
                    </DialogOverlay>
                  </DialogPortal>
                </Dialog>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-muted-foreground text-center py-4">
          No tasks found.
        </div>
      )}
    </div>
  );
}
