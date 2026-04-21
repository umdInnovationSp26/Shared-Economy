import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { Home, CircleQuestionMarkIcon, ListTodo, PlusSquare, MessageSquare, Settings, Clock, Menu } from "lucide-react";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const NAV_ITEMS = [
  { icon: Home, label: "Home", href: "/home" },
  { icon: CircleQuestionMarkIcon, label: "About", href: "/about" },
  { icon: ListTodo, label: "Available Tasks", href: "/tasks" },
  { icon: PlusSquare, label: "New Post", href: "/new-post" },
  { icon: MessageSquare, label: "Chat", href: "/chat" },
  { icon: Settings, label: "Settings", href: "/settings" },
];

function SidebarContent() {
  const [location, setLocation] = useLocation();
  const [displayName, setDisplayName] = useState("Jane Doe");
  const [hoursAvailable, setHoursAvailable] = useState("12 hrs available");
  const [avatarUrl, setAvatarUrl] = useState("");

  useEffect(() => {
    let unsubscribeProfile: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (unsubscribeProfile) {
        unsubscribeProfile();
        unsubscribeProfile = undefined;
      }

      if (!user) {
        setDisplayName("Jane Doe");
        setHoursAvailable("12 hrs available");
        setAvatarUrl("");
        return;
      }

      const userRef = doc(db, "users", user.uid);

      unsubscribeProfile = onSnapshot(
        userRef,
        (userSnap) => {
          if (userSnap.exists()) {
            const data = userSnap.data();

            setDisplayName(
              data.displayName || user.displayName || user.email?.split("@")[0] || "Jane Doe"
            );

            if (typeof data.credits === "number") {
              setHoursAvailable(`${data.credits} hrs available`);
            } else {
              setHoursAvailable("12 hrs available");
            }

            setAvatarUrl(data.avatarUrl || user.photoURL || "");
          } else {
            setDisplayName(user.displayName || user.email?.split("@")[0] || "Jane Doe");
            setHoursAvailable("12 hrs available");
            setAvatarUrl(user.photoURL || "");
          }
        },
        (error) => {
          console.error("Failed to load user profile:", error);
          setDisplayName(user.displayName || user.email?.split("@")[0] || "Jane Doe");
          setHoursAvailable("12 hrs available");
          setAvatarUrl(user.photoURL || "");
        }
      );
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
    };
  }, []);

  const initials = displayName
    ? displayName
        .trim()
        .split(" ")
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "JD";

  return (
    <div className="flex h-full flex-col bg-card border-r">
      <div className="flex h-16 items-center px-6 border-b">
        <Clock className="h-6 w-6 text-primary mr-2" />
        <span className="text-xl font-bold font-display text-primary">TimeBank</span>
      </div>
      <div className="flex-1 overflow-auto py-6 flex flex-col gap-2 px-4">
        {NAV_ITEMS.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.href} href={item.href}>
              <Button
                variant={isActive ? "secondary" : "ghost"}
                className={`w-full justify-start ${isActive ? 'bg-secondary text-secondary-foreground font-semibold' : 'text-muted-foreground'}`}
              >
                <item.icon className="mr-3 h-5 w-5" />
                {item.label}
              </Button>
            </Link>
          );
        })}
      </div>
      <div className="p-6 border-t mt-auto">
        <div className="flex items-center gap-3 mb-4">
          <Avatar className="h-10 w-10">
            <AvatarImage src={avatarUrl} />
            <AvatarFallback className="bg-primary/10 text-primary font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-semibold">{displayName}</p>
            <p className="text-xs text-muted-foreground">{hoursAvailable}</p>
          </div>
        </div>
        <Button
          onClick={async () => {
            try {
              await signOut(auth);
              setLocation("/");
            } catch (error) {
              console.error("Sign out failed:", error);
            }
          }}
          className="w-full justify-center bg-primary text-primary-foreground border-none shadow-md font-bold hover:bg-primary/90"
        >
          Sign Out
        </Button>
      </div>
    </div>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden md:block w-64 flex-shrink-0">
        <SidebarContent />
      </aside>

      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center h-16 px-4 border-b bg-card">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="mr-2">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-64">
              <SidebarContent />
            </SheetContent>
          </Sheet>
          <Clock className="h-5 w-5 text-primary mr-2" />
          <span className="text-lg font-bold font-display text-primary">TimeBank</span>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}