import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Clock, MapPin, Search, Filter } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useTasks } from "@/lib/TaskContext";

export default function Tasks() {
  const [search, setSearch] = useState("");
  const { tasks } = useTasks();

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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-8">
        {tasks.map((task) => (
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
            <CardContent className="p-4 pt-0 flex-1">
              <p className="text-sm text-muted-foreground line-clamp-3">
                {task.description}
              </p>
            </CardContent>
            <CardFooter className="p-4 pt-0 flex justify-between items-center border-t mt-auto">
              <div className="flex items-center text-sm font-bold text-primary">
                <Clock className="h-4 w-4 mr-1.5" /> {task.hours} hr
                {task.hours > 1 ? "s" : ""}
              </div>
              <Button variant="outline" size="sm" className="rounded-full">
                View Details
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
