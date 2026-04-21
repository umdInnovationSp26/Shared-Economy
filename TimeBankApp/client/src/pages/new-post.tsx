import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter, } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "@/components/ui/select";
import { PlusSquare, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTasks } from "@/lib/TaskContext";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

export default function NewPost() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { addTask } = useTasks();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [type, setType] = useState("Requesting");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [hours, setHours] = useState("");
  const [category, setCategory] = useState("");
  const [radius, setRadius] = useState("5 miles");
  const [madeBy, setMadeBy] = useState("Requesting");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    //check signed in
    const user = auth.currentUser;
  if (!user) {
    toast({
      title: "Not signed in",
      description: "You must be signed in to create a post.",
      variant: "destructive",
    });
    return;
  }

  const userRef = doc(db, "users", user.uid);
  const userSnap = await getDoc(userRef);
  const data = userSnap.data();
  if (!data) {
    toast({
      title: "User data missing",
      description: "Could not fetch your user profile.",
      variant: "destructive",
    });
    return;
  }

  setMadeBy(data.displayName);

    // Basic field verification
    if (!title.trim() || !description.trim() || !hours || !category) {
      toast({
        title: "Missing fields",
        description: "Please fill out all required fields before publishing.",
        variant: "destructive",
      });
      return;
    }

    if (parseFloat(hours) <= 0) {
      toast({
        title: "Invalid hours",
        description: "Estimated time must be greater than 0.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    // Create new task and add to context
    addTask({
      type,
      title: title.trim(),
      description: description.trim(),
      hours: parseFloat(hours),
      category,
      radius,
      isAssigned: false,
      madeBy: data.displayName,
    });

    // Simulate API delay FIREBASE IMPLEMENTATION HERE!!
    setTimeout(() => {
      setIsSubmitting(false);
      toast({
        title: "Post created successfully!",
        description: "Your task has been added to the local exchange network.",
      });
      setLocation("/tasks");
    }, 1000);
  };

  // Sanitization helper
  const handleTextChange =
    (setter: React.Dispatch<React.SetStateAction<string>>) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      // Basic sanitization: remove multiple consecutive spaces and trim
      setter(e.target.value.replace(/\s{3,}/g, " "));
    };

  return (
    <div className="p-6 md:p-10 max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">
          Create a New Post
        </h1>
        <p className="text-muted-foreground">
          Offer a service to the community or request help with a task.
        </p>
      </div>

      <Card className="shadow-md border-border/50">
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Post Details</CardTitle>
            <CardDescription>
              Fill out the details below so others can find your post easily.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <Label>Post Type</Label>
              <RadioGroup
                value={type}
                onValueChange={setType}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2 border rounded-lg p-3 flex-1 cursor-pointer hover:bg-muted/50 transition-colors">
                  <RadioGroupItem value="Requesting" id="request" />
                  <Label
                    htmlFor="request"
                    className="cursor-pointer font-medium"
                  >
                    Requesting Help
                  </Label>
                </div>
                <div className="flex items-center space-x-2 border rounded-lg p-3 flex-1 cursor-pointer hover:bg-muted/50 transition-colors">
                  <RadioGroupItem value="Offering" id="offer" />
                  <Label htmlFor="offer" className="cursor-pointer font-medium">
                    Offering Service
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="e.g., Need help moving heavy boxes"
                value={title}
                onChange={handleTextChange(setTitle)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe what you need help with, or what service you are offering in detail..."
                className="min-h-[120px]"
                value={description}
                onChange={handleTextChange(setDescription)}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="category">Category Tag</Label>
                <Select value={category} onValueChange={setCategory} required>
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="physical">
                      Physical Labor (e.g. moving, lifting)
                    </SelectItem>
                    <SelectItem value="repair">
                      Home Repair (e.g. plumbing, carpentry)
                    </SelectItem>
                    <SelectItem value="education">
                      Education / Tutoring (e.g. math, music)
                    </SelectItem>
                    <SelectItem value="tech">
                      Tech Support (e.g. computer help)
                    </SelectItem>
                    <SelectItem value="errands">
                      Errands (e.g. groceries, delivery)
                    </SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tools">Necessary Tools</Label>
                <Select>
                  <SelectTrigger id="tools">
                    <SelectValue placeholder="Tools required?" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None required</SelectItem>
                    <SelectItem value="i_have">
                      I have the tools (e.g. I have the shovel)
                    </SelectItem>
                    <SelectItem value="bring_own">
                      Please bring your own (e.g. bring your truck)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="hours">Estimated Time (Hours)</Label>
                <Input
                  id="hours"
                  type="number"
                  step="0.5"
                  min="0.5"
                  placeholder="e.g., 2"
                  value={hours}
                  onChange={(e) => setHours(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="radius">Location Radius</Label>
                <Select value={radius} onValueChange={setRadius}>
                  <SelectTrigger id="radius">
                    <SelectValue placeholder="Select radius" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1 mile">Within 1 mile</SelectItem>
                    <SelectItem value="5 miles">Within 5 miles</SelectItem>
                    <SelectItem value="10 miles">Within 10 miles</SelectItem>
                    <SelectItem value="Anywhere">Anywhere in city</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="bg-primary/5 text-primary p-4 rounded-lg flex gap-3 text-sm items-start">
              <Info className="h-5 w-5 shrink-0 mt-0.5" />
              <p>
                When someone accepts your request, the estimated hours will be
                temporarily reserved from your available TimeBank balance.
              </p>
            </div>
          </CardContent>
          <CardFooter className="bg-muted/30 pt-6">
            <Button
              type="submit"
              className="w-full sm:w-auto"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                "Posting..."
              ) : (
                <>
                  <PlusSquare className="mr-2 h-4 w-4" /> Publish Post
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
