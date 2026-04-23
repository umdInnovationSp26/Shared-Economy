import { useEffect, useState } from "react";
import { onAuthStateChanged, updateProfile, User as FirebaseUser } from "firebase/auth";
import {
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  orderBy,
  onSnapshot,
} from "firebase/firestore";

import { auth, db } from "@/lib/firebase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Bell, Lock, Shield, CreditCard, Save } from "lucide-react";

type SettingsTab =
  | "profile"
  | "notifications"
  | "privacy"
  | "trust"
  | "ledger";

type LedgerTransaction = {
  id: string;
  taskId?: string;
  title?: string;
  amount?: number;
  type?: "earned" | "spent";
  category?: string;
  description?: string;
  status?: string;
  timestamp?: any;
};

export default function Settings() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");

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

  const [transactions, setTransactions] = useState<LedgerTransaction[]>([]);

  const [saveMessage, setSaveMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let unsubscribeTransactions: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      setSaveMessage("");
      setErrorMessage("");

      if (!user) {
        setTransactions([]);
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

        const txRef = collection(db, "users", user.uid, "transactions");
        const txQuery = query(txRef, orderBy("timestamp", "desc"));

        unsubscribeTransactions = onSnapshot(txQuery, (snapshot) => {
          const txs = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as LedgerTransaction[];
          setTransactions(txs);
        });
      } catch (error) {
        console.error("Failed to load settings:", error);
        setErrorMessage("Failed to load settings.");
      } finally {
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeTransactions) unsubscribeTransactions();
    };
  }, []);

  const handleSave = async () => {
    if (!currentUser) {
      setErrorMessage("You must be signed in to save changes.");
      return;
    }

    setSaving(true);
    setSaveMessage("");
    setErrorMessage("");

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

      setSaveMessage("Changes saved successfully.");
    } catch (error) {
      console.error("Save failed:", error);
      setErrorMessage("Failed to save changes.");
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

  const tabButtonClass = (tab: SettingsTab) =>
    `w-full justify-start font-medium ${
      activeTab === tab
        ? "bg-secondary text-secondary-foreground"
        : "text-muted-foreground hover:text-foreground"
    }`;

  if (loading) {
    return (
      <div className="p-6 md:p-10 max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-2">Settings</h1>
          <p className="text-muted-foreground">
            Manage your profile and account preferences.
          </p>
        </div>
        <p className="text-muted-foreground">Loading settings...</p>
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
            variant={activeTab === "profile" ? "secondary" : "ghost"}
            className={tabButtonClass("profile")}
            onClick={() => setActiveTab("profile")}
          >
            <User className="mr-2 h-4 w-4" /> Profile
          </Button>
          <Button
            variant={activeTab === "notifications" ? "secondary" : "ghost"}
            className={tabButtonClass("notifications")}
            onClick={() => setActiveTab("notifications")}
          >
            <Bell className="mr-2 h-4 w-4" /> Notifications
          </Button>
          <Button
            variant={activeTab === "privacy" ? "secondary" : "ghost"}
            className={tabButtonClass("privacy")}
            onClick={() => setActiveTab("privacy")}
          >
            <Lock className="mr-2 h-4 w-4" /> Privacy & Security
          </Button>
          <Button
            variant={activeTab === "trust" ? "secondary" : "ghost"}
            className={tabButtonClass("trust")}
            onClick={() => setActiveTab("trust")}
          >
            <Shield className="mr-2 h-4 w-4" /> Trust & Verification
          </Button>
          <Button
            variant={activeTab === "ledger" ? "secondary" : "ghost"}
            className={tabButtonClass("ledger")}
            onClick={() => setActiveTab("ledger")}
          >
            <CreditCard className="mr-2 h-4 w-4" /> TimeBank Ledger
          </Button>
        </div>

        {/* Settings Content */}
        <div className="flex-1 space-y-6">
          {activeTab === "profile" && (
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
                  <div className="flex-1">
                    <Label htmlFor="avatarUrl" className="sr-only">
                      Avatar URL
                    </Label>
                    <Input
                      id="avatarUrl"
                      value={avatarUrl}
                      onChange={(e) => setAvatarUrl(e.target.value)}
                      placeholder="Paste avatar image URL"
                    />
                  </div>
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
          )}

          {activeTab === "notifications" && (
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
              </CardContent>
            </Card>
          )}

          {activeTab === "privacy" && (
            <Card>
              <CardHeader>
                <CardTitle>Privacy & Security</CardTitle>
                <CardDescription>
                  Control how your information is shared in the TimeBank community.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
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
          )}

          {activeTab === "trust" && (
            <Card>
              <CardHeader>
                <CardTitle>Trust & Verification</CardTitle>
                <CardDescription>
                  Review your trust and verification status in the community.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="rounded-lg border p-4">
                  <p className="font-medium">Community Status</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Verification tools and trust badges can be added here as this
                    feature grows.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === "ledger" && (
            <Card>
              <CardHeader>
                <CardTitle>TimeBank Ledger</CardTitle>
                <CardDescription>
                  Track your earned and spent hours over time.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {transactions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No transactions yet.</p>
                ) : (
                  <div className="space-y-3">
                    {transactions.map((tx) => (
                      <div
                        key={tx.id}
                        className="rounded-lg border p-4 flex items-start justify-between"
                      >
                        <div>
                          <p className="font-medium">{tx.title || "Untitled task"}</p>
                          <p className="text-sm text-muted-foreground">
                            {tx.description || "No description"}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {tx.category || "General"} •{" "}
                            {tx.timestamp?.toDate
                              ? tx.timestamp.toDate().toLocaleString()
                              : "Pending"}
                          </p>
                        </div>
                        <div
                          className={`font-semibold ${
                            tx.type === "earned" ? "text-green-600" : "text-red-500"
                          }`}
                        >
                          {tx.type === "earned" ? "+" : "-"}
                          {tx.amount || 0} hrs
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {(saveMessage || errorMessage) && (
            <div className="flex justify-end">
              <p
                className={
                  errorMessage
                    ? "text-sm text-red-500"
                    : "text-sm text-green-600"
                }
              >
                {errorMessage || saveMessage}
              </p>
            </div>
          )}

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