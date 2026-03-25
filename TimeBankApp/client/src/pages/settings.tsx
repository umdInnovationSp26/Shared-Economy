import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Bell, Lock, Shield, CreditCard, Save } from "lucide-react";

export default function Settings() {
  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Settings</h1>
        <p className="text-muted-foreground">Manage your profile and account preferences.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        
        {/* Settings Navigation */}
        <div className="w-full md:w-64 space-y-1">
          <Button variant="secondary" className="w-full justify-start font-medium bg-secondary text-secondary-foreground">
            <User className="mr-2 h-4 w-4" /> Profile
          </Button>
          <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-foreground">
            <Bell className="mr-2 h-4 w-4" /> Notifications
          </Button>
          <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-foreground">
            <Lock className="mr-2 h-4 w-4" /> Privacy & Security
          </Button>
          <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-foreground">
            <Shield className="mr-2 h-4 w-4" /> Trust & Verification
          </Button>
          <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-foreground">
            <CreditCard className="mr-2 h-4 w-4" /> TimeBank Ledger
          </Button>
        </div>

        {/* Settings Content */}
        <div className="flex-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Public Profile</CardTitle>
              <CardDescription>This is how others in the TimeBank community will see you.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-6">
                <Avatar className="h-20 w-20 border-2 border-primary/20">
                  <AvatarFallback className="text-2xl bg-primary/10 text-primary">JD</AvatarFallback>
                </Avatar>
                <Button variant="outline">Change Avatar</Button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input id="firstName" defaultValue="Jane" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input id="lastName" defaultValue="Doe" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea 
                  id="bio" 
                  defaultValue="Enthusiastic gardener and DIY repair hobbyist. I love helping neighbors and learning new skills!"
                  className="h-24"
                />
                <p className="text-xs text-muted-foreground">Brief description for your profile.</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="skills">Key Skills (Comma separated)</Label>
                <Input id="skills" defaultValue="Gardening, Basic Carpentry, Cooking" />
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
                  <p className="text-sm text-muted-foreground">Receive emails for new messages and task updates.</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Proximity Alerts</Label>
                  <p className="text-sm text-muted-foreground">Get notified when a new task is posted near you.</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Show exact location</Label>
                  <p className="text-sm text-muted-foreground">Allow others to see your exact address when matching tasks.</p>
                </div>
                <Switch />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button className="gap-2">
              <Save className="h-4 w-4" /> Save Changes
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
