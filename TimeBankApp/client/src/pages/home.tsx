import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, ArrowUpRight, ArrowDownRight, MapPin } from "lucide-react";
import gardeningImg from "@/assets/images/gardening.png";
import toolsImg from "@/assets/images/tools.png";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, updateDoc, arrayRemove, increment } from "firebase/firestore";
import {
  Dialog,
  DialogTrigger,
  DialogTitle,
  DialogContent,
  DialogClose,
  DialogOverlay,
  DialogPortal,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

import { useTasks } from "@/lib/TaskContext";

export default function Home() {
  const [displayName, setDisplayName] = useState("");
  const [credits, setCredits] = useState(0);

  const [userTaskIds, setUserTaskIds] = useState<string[]>([]);
  const { tasks } = useTasks();
  const [enteredHours, setEnteredHours] = useState("");

  useEffect(() => {
    const fetchUserProfile = async () => {
      const user = auth.currentUser;


      if (!user) return;

      try {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const data = userSnap.data();
          console.log("Fetched user document:", data);
          setDisplayName(data.displayName || "User");

          setCredits(data.credits || 0);

          if (Array.isArray(data.CurrentTasks)) {
            console.log("CurrentTasks field:", data.CurrentTasks);
            setUserTaskIds(data.CurrentTasks);
          } else {
            console.warn("CurrentTasks field missing or not an array", data.CurrentTasks);
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

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header section */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">
          Welcome back, {displayName || "User"}! 👋
        </h1>
        <p className="text-muted-foreground">
          Here's your TimeBank summary for this week.
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
              {tasks
              .filter((task) => userTaskIds.includes(task.id))
              .reduce((total, task) => total + task.hours, 0)} hrs
              </div>
            <p className="text-xs text-muted-foreground mt-1">
              {tasks.filter((task) => userTaskIds.includes(task.id)).length} active request
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <ArrowUpRight className="h-4 w-4 text-emerald-500" /> Given (This
              Week)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-display">4 hrs</div>
            <p className="text-xs text-muted-foreground mt-1">
              +2 hrs from last week
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <ArrowDownRight className="h-4 w-4 text-blue-500" /> Received
              (This Week)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-display">1.5 hrs</div>
            <p className="text-xs text-muted-foreground mt-1">
              Lawn mowing service
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Underway Tasks */}
        <div className="space-y-4 lg:col-span-1">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Current Tasks</h2>
          </div>
          {tasks && userTaskIds.length > 0 ? (
            tasks.filter((task) => userTaskIds.includes(task.id)).map((task) => (
                <Card key={task.id} className="border border-primary/20 bg-primary/5 shadow-none">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">{task.title}</CardTitle>
                    <CardDescription>{task.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-end">
                      <div className="space-y-1">
                        <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                          In Progress
                        </span>
                        <div className="text-sm text-muted-foreground flex items-center mt-2">
                          <Clock className="mr-1 h-3 w-3" /> {task.hours} hrs locked
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex gap-2">
  <Dialog>
    <DialogTrigger asChild>
      <Button
  size="sm"
  variant="outline"
  className="flex-1 border-primary text-primary hover:bg-primary/10"
>
        Cancel Task
      </Button>
    </DialogTrigger>

    <DialogPortal>
      <DialogOverlay className="backdrop-blur-sm">
        <DialogContent>
          <DialogTitle>Cancel this task?</DialogTitle>
          <DialogDescription>
            This will remove the task from your current tasks.
          </DialogDescription>

          <div className="flex justify-end mt-4">
            <DialogClose asChild>
              <Button
                className="bg-primary text-white"
                onClick={async () => {
                  const user = auth.currentUser;
                  if (!user) return;

                  const userRef = doc(db, "users", user.uid);

                  await updateDoc(userRef, {
                    CurrentTasks: arrayRemove(task.id),
                  });

                  setUserTaskIds((prev) =>
                    prev.filter((id) => id !== task.id)
                  );
                }}
              >
                Yes, Cancel Task
              </Button>
            </DialogClose>
          </div>
        </DialogContent>
      </DialogOverlay>
    </DialogPortal>
  </Dialog>

  <Dialog>
    <DialogTrigger asChild>
     <Button
  size="sm"
  className="flex-1 bg-primary text-white"
>
        Mark Complete
      </Button>
    </DialogTrigger>

    <DialogPortal>
      <DialogOverlay className="backdrop-blur-sm">
        <DialogContent>
          <DialogTitle>Log Hours</DialogTitle>
          <DialogDescription>
            Enter how many hours this task took.
          </DialogDescription>

          <input
            type="number"
            placeholder="Enter hours"
            className="w-full border rounded-md p-2 mt-4 mb-4"
            value={enteredHours}
            onChange={(e) => setEnteredHours(e.target.value)}
          />

          <div className="flex justify-end">
            <DialogClose asChild>
              <Button
                className="bg-primary text-white"
                onClick={async () => {
                  const user = auth.currentUser;
                  if (!user || !enteredHours) return;

                  const userRef = doc(db, "users", user.uid);

                  await updateDoc(userRef, {
                    CurrentTasks: arrayRemove(task.id),
                    credits: increment(Number(enteredHours)),
                  });

                  setCredits((prev) => prev + Number(enteredHours));
                  setUserTaskIds((prev) =>
                    prev.filter((id) => id !== task.id)
                  );
                  setEnteredHours("");
                }}
              >
                Submit
              </Button>
            </DialogClose>
          </div>
        </DialogContent>
      </DialogOverlay>
    </DialogPortal>
  </Dialog>
</CardFooter>
                   </Card>
               
              ))
          ) : (
            <div className="text-muted-foreground text-center py-4">
              No tasks found.
            </div>
          )}
        </div>

        {/* Nearby Available Tasks */}
        <div className="space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Available Nearby</h2>
            <button className="text-sm text-primary hover:underline font-medium">
              View all
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Task 1 */}
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

            {/* Task 2 */}
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

      
    </div>
  );
}
