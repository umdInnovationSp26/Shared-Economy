import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Clock } from "lucide-react";

export default function Login() {
  const [, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate login delay
    setTimeout(() => {
      setIsLoading(false);
      setLocation("/home");
    }, 800);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 animate-in fade-in duration-700">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background -z-10" />

      <Card className="w-full max-w-md shadow-xl border-primary/10">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mb-2">
            <Clock className="h-8 w-8 text-primary" />
          </div>
          <div className="space-y-2">
            <CardTitle className="text-3xl font-display text-primary tracking-tight">
              TimeBank
            </CardTitle>
            <CardDescription className="text-base">
              Exchange services and build community.
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username or Email</Label>
                <Input
                  id="username"
                  placeholder="name@example.com"
                  required
                  className="bg-white/50 focus:bg-white transition-colors"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <a
                    href="#"
                    className="text-sm font-medium text-primary hover:underline"
                    onClick={(e) => e.preventDefault()}
                  >
                    Forgot password?
                  </a>
                </div>
                <Input
                  id="password"
                  type="password"
                  required
                  className="bg-white/50 focus:bg-white transition-colors"
                />
              </div>
            </div>

            <Button
              className="w-full text-base h-11 font-medium"
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? "Signing in..." : "Sign in"}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex flex-col space-y-4 border-t pt-6 bg-muted/20">
          <div className="text-sm text-center text-muted-foreground">
            Don't have an account?{" "}
            <a
              href="#"
              className="text-primary font-medium hover:underline"
              onClick={(e) => {
                e.preventDefault();
                setLocation("/auth"); // Optional hook for register route
              }}
            >
              Join your community
            </a>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
