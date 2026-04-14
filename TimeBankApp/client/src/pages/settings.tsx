import { useEffect, useState } from "react";
import { onAuthStateChanged, updateProfile, User as FirebaseUser } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";

import { auth, db } from "@/lib/firebase";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Bell, Lock, Shield, CreditCard, Save } from "lucide-react";

export default function Settings() {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [skills, setSkills] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  const [emailNotifications, setEmailNotifications] = useState(true);
  const [proximityAlerts, setProximityAlerts] = useState(true);
  const [showExactLocation, setShowExactLocation] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);

      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const data = userSnap.data();

          setDisplayName(data.displayName || user.displayName || "");
          setBio(data.bio || "");
          setSkills(data.skills || "");
          setAvatarUrl(data.avatarUrl || user.photoURL || "");
          setEmailNotifications(data.emailNotifications ?? true);
          setProximityAlerts(data.proximityAlerts ?? true);
          setShowExactLocation(data.showExactLocation ?? false);
        } else {
          setDisplayName(user.displayName || "");
          setBio("");
          setSkills("");
          setAvatarUrl(user.photoURL || "");
          setEmailNotifications(true);
          setProximityAlerts(true);
          setShowExactLocation(false);
        }
      } catch (error) {
        console.error("Failed to load settings:", error);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleSave = async () => {
    if (!currentUser) return;

    setSaving(true);

    try {
      await updateProfile(currentUser, {
        displayName,
        photoURL: avatarUrl || null,
      });

      const userRef = doc(db, "users", currentUser.uid);

      await setDoc(
        userRef,
        {
          uid: currentUser.uid,
          email: currentUser.email ?? "",
          displayName,
          bio,
          skills,
          avatarUrl,
          emailNotifications,
          proximityAlerts,
          showExactLocation,
        },
        { merge: true }
      );
    } catch (error) {
      console.error("Save failed:", error);
    } finally {
      setSaving(false);
    }
  };

  const initials = displayName
    ? displayName
        .trim()
        .split(" ")
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "U";

  if (loading) {
    return (
      <div className="p-6 md:p-10 max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Settings</h1>
        <p className="text-muted-foreground">Loading your profile and account preferences...</p>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Settings</h1>
        <p className="text-muted-foreground">
          Manage your profile and account preferences.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Settings Navigation */}
        <div className="w-full md:w-64 space-y-1">
          <Button
            variant="secondary"
            className="w-full justify-start font-medium bg-secondary text-secondary-foreground"
          >
            <User className="mr-2 h-4 w-4" /> Profile
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start text-muted-foreground hover:text-foreground"
          >
            <Bell className="mr-2 h-4 w-4" /> Notifications
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start text-muted-foreground hover:text-foreground"
          >
            <Lock className="mr-2 h-4 w-4" /> Privacy & Security
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start text-muted-foreground hover:text-foreground"
          >
            <Shield className="mr-2 h-4 w-4" /> Trust & Verification
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start text-muted-foreground hover:text-foreground"
          >
            <CreditCard className="mr-2 h-4 w-4" /> TimeBank Ledger
          </Button>
        </div>

        {/* Settings Content */}
        <div className="flex-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Public Profile</CardTitle>
              <CardDescription>
                This is how others in the TimeBank community will see you.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-6">
                <Avatar className="h-20 w-20 border-2 border-primary/20">
                  <AvatarImage src={avatarUrl} />
                  <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <Button variant="outline">Change Avatar</Button>
              </div>

              <div className="space-y-2">
                <Label htmlFor="displayName">Name</Label>
                <Input
                  id="displayName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="h-24"
                />
                <p className="text-xs text-muted-foreground">
                  Brief description for your profile.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="skills">Key Skills (Comma separated)</Label>
                <Input
                  id="skills"
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Preferences</CardTitle>
              <CardDescription>Manage your app experience.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive emails for new messages and task updates.
                  </p>
                </div>
                <Switch
                  checked={emailNotifications}
                  onCheckedChange={setEmailNotifications}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Proximity Alerts</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified when a new task is posted near you.
                  </p>
                </div>
                <Switch
                  checked={proximityAlerts}
                  onCheckedChange={setProximityAlerts}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Show exact location</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow others to see your exact address when matching tasks.
                  </p>
                </div>
                <Switch
                  checked={showExactLocation}
                  onCheckedChange={setShowExactLocation}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button className="gap-2" onClick={handleSave} disabled={saving}>
              <Save className="h-4 w-4" /> {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}