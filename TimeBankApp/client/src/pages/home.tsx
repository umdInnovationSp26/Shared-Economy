import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Clock, MapPin } from "lucide-react";
import gardeningImg from "@/assets/images/gardening.png";
import toolsImg from "@/assets/images/tools.png";
import { auth, db } from "@/lib/firebase";
import {
  doc,
  getDoc,
  updateDoc,
  arrayRemove,
  increment,
  arrayUnion,
} from "firebase/firestore";
import { useTasks } from "@/lib/TaskContext";
import { completeTask } from "@/lib/transactions";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

export default function Home() {
  const [displayName, setDisplayName] = useState("");
  const [credits, setCredits] = useState(0);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [userTaskIds, setUserTaskIds] = useState<string[]>([]);
  const { tasks } = useTasks();
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [enteredHours, setEnteredHours] = useState("");

  const handleCancel = async (taskId: string) => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      const userRef = doc(db, "users", user.uid);
      const taskRef = doc(db, "tasks", taskId);

      await updateDoc(userRef, {
        CurrentTasks: arrayRemove(taskId),
      });

      await updateDoc(taskRef, {
        isAssigned: false,
      });

      setUserTaskIds((prev) => prev.filter((id) => id !== taskId));

      toast({
        title: "Task cancelled",
        description: "The task was removed from your current tasks.",
      });
    } catch (e) {
      console.warn("Unable to remove or unassign task:", e);

      toast({
        title: "Failed to cancel task",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    const fetchUserProfile = async () => {
      const user = auth.currentUser;
      if (!user) return;

      try {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const data = userSnap.data();
          setDisplayName(data.displayName || "User");
          setCredits(data.credits || 0);

          if (Array.isArray(data.CurrentTasks)) {
            setUserTaskIds(data.CurrentTasks);
          } else {
            setUserTaskIds([]);
          }
        } else {
          setDisplayName("User");
          setUserTaskIds([]);
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
        setDisplayName("User");
        setUserTaskIds([]);
      }
    };

    fetchUserProfile();
  }, []);

  const currentTasks = tasks.filter((task) => userTaskIds.includes(task.id));

  const handleSubmitLoggedHours = async () => {
    const user = auth.currentUser;

    if (!user || !selectedTaskId) {
      toast({
        title: "No task selected",
        description: "Please choose a task to complete.",
        variant: "destructive",
      });
      return;
    }

    if (!enteredHours || Number(enteredHours) <= 0) {
      toast({
        title: "Invalid hours",
        description: "Please enter a valid number of hours.",
        variant: "destructive",
      });
      return;
    }

    const selectedTask = tasks.find((task) => task.id === selectedTaskId);

    if (!selectedTask) {
      toast({
        title: "Task not found",
        description: "Unable to find the selected task.",
        variant: "destructive",
      });
      return;
    }

    try {
      const userRef = doc(db, "users", user.uid);

      await completeTask(user.uid, {
        ...selectedTask,
        hours: Number(enteredHours),
      });

      await updateDoc(userRef, {
        CurrentTasks: arrayRemove(selectedTaskId),
        CompletedTasks: arrayUnion(selectedTaskId),
        credits: increment(Number(enteredHours)),
      });

      setCredits((prev) => prev + Number(enteredHours));
      setUserTaskIds((prev) => prev.filter((id) => id !== selectedTaskId));
      setSelectedTaskId(null);
      setEnteredHours("");

      toast({
        title: "Task completed!",
        description:
          "Your logged hours were submitted, your ledger was updated, and your balance was increased.",
      });
    } catch (err) {
      console.error(err);

      toast({
        title: "Failed to submit hours",
        description: "Something went wrong while completing the task.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">
          Welcome back, {displayName || "User"}! 👋
        </h1>
        <p className="text-muted-foreground">
          Here's your TimeBank summary for this week.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-12 px-6">
        <Card className="bg-primary text-primary-foreground border-none shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium opacity-80">
              Available Hours
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-display">{credits} hrs</div>
            <p className="text-xs opacity-80 mt-1">Ready to spend</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4" /> Underway
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-display">
              {currentTasks.reduce((total, task) => total + task.hours, 0)} hrs
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {currentTasks.length} active request
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="space-y-4 lg:col-span-1">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Current Tasks</h2>
          </div>

          {currentTasks.length > 0 ? (
            currentTasks.map((task) => (
              <Card
                key={task.id}
                className="border border-primary/20 bg-primary/5 shadow-none"
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{task.title}</CardTitle>
                  <CardDescription>
                    {task.madeBy.length > 0
                      ? "An exchange with " + task.madeBy
                      : "No name found"}
                  </CardDescription>
                </CardHeader>

                <CardContent>
                  <div className="flex justify-between items-end">
                    <div className="space-y-1">
                      <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                        In Progress
                      </span>
                      <div className="text-sm text-muted-foreground flex items-center mt-2">
                        <Clock className="mr-1 h-3 w-3" /> {task.hours} hrs
                        locked
                      </div>
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="justify-end">
                  <div className="grid grid-cols-2 gap-3 w-full">
                    <Button
                      onClick={() => handleCancel(task.id)}
                      variant="outline"
                      className="border-primary text-center text-primary rounded-md hover:bg-primary/10 text-xs px-2 whitespace-nowrap"
                    >
                      Cancel task
                    </Button>

                    <Button
                      variant="default"
                      className="border-primary rounded-md text-xs px-2 whitespace-nowrap"
                      onClick={() => {
                        setSelectedTaskId(task.id);
                        setEnteredHours(task.hours.toString());
                      }}
                    >
                      Mark Complete
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            ))
          ) : (
            <div className="text-muted-foreground text-center py-4">
              No tasks found.
            </div>
          )}
        </div>

        <div className="space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Available Nearby</h2>
            <button
              onClick={() => setLocation("/tasks")}
              className="text-sm text-primary hover:underline font-medium"
            >
              View all
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="overflow-hidden hover:shadow-md transition-shadow group cursor-pointer">
              <div className="h-32 w-full overflow-hidden">
                <img
                  src={gardeningImg}
                  alt="Gardening"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <CardHeader className="p-4 pb-2">
                <div className="flex justify-between items-start mb-1">
                  <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">
                    Offering
                  </span>
                  <div className="flex items-center text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3 mr-1" /> 0.5 miles
                  </div>
                </div>
                <CardTitle className="text-base">
                  Community Garden Help
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <p className="text-sm text-muted-foreground line-clamp-2">
                  Looking for an extra set of hands to help weed and plant new
                  seeds in the neighborhood patch.
                </p>
                <div className="mt-3 flex items-center text-sm font-medium text-primary">
                  <Clock className="h-4 w-4 mr-1" /> 2 hours
                </div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden hover:shadow-md transition-shadow group cursor-pointer">
              <div className="h-32 w-full overflow-hidden">
                <img
                  src={toolsImg}
                  alt="Tools"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <CardHeader className="p-4 pb-2">
                <div className="flex justify-between items-start mb-1">
                  <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-md">
                    Requesting
                  </span>
                  <div className="flex items-center text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3 mr-1" /> 1.2 miles
                  </div>
                </div>
                <CardTitle className="text-base">
                  Fix broken cabinet door
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <p className="text-sm text-muted-foreground line-clamp-2">
                  The hinges on my kitchen cabinet came loose and I don't have
                  the tools to fix it properly.
                </p>
                <div className="mt-3 flex items-center text-sm font-medium text-primary">
                  <Clock className="h-4 w-4 mr-1" /> 1 hour
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {selectedTaskId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
          <div className="bg-white p-6 rounded-lg shadow-lg w-80">
            <h2 className="text-lg font-bold mb-4">Log Hours</h2>

            <input
              type="number"
              placeholder="Enter hours"
              className="w-full border rounded-md p-2 mb-4"
              value={enteredHours}
              onChange={(e) => setEnteredHours(e.target.value)}
            />

            <div className="flex gap-2">
              <button
                className="w-full bg-primary text-white py-2 rounded-md"
                onClick={handleSubmitLoggedHours}
              >
                Submit
              </button>

              <button
                className="w-full border border-gray-300 text-gray-700 py-2 rounded-md hover:bg-gray-100"
                onClick={() => {
                  setSelectedTaskId(null);
                  setEnteredHours("");
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}