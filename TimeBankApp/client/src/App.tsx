import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { TaskProvider } from "@/lib/TaskContext";

import { Layout } from "@/components/layout";
import Home from "@/pages/home";
import About from "@/pages/about";
import Tasks from "@/pages/tasks";
import NewPost from "@/pages/new-post";
import Chat from "@/pages/chat";
import Settings from "@/pages/settings";
import Auth from "@/pages/auth";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Auth} />
      <Route path="/auth" component={Auth} />
      
      {/* Protected Routes Wrapper */}
      <Route>
        <Layout>
          <Switch>
            <Route path="/home" component={Home} />
            <Route path="/about" component={About} />
            <Route path="/tasks" component={Tasks} />
            <Route path="/new-post" component={NewPost} />
            <Route path="/chat" component={Chat} />
            <Route path="/settings" component={Settings} />
            <Route component={NotFound} />
          </Switch>
        </Layout>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TaskProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </TaskProvider>
    </QueryClientProvider>
  );
}

export default App;
