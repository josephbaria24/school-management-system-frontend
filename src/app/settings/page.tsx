"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/lib/theme";
import { Sun, Moon, Bell, Shield, Database } from "lucide-react";

export default function SettingsPage() {
  const { theme, toggleTheme } = useTheme();
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [attendanceAlerts, setAttendanceAlerts] = useState(true);
  const [gradeAlerts, setGradeAlerts] = useState(false);
  const [twoFactor, setTwoFactor] = useState(false);

  return (
    <div className="p-6 space-y-4 max-w-2xl">
      <Card className="border border-border">
        <CardHeader className="pb-3 px-4 pt-4">
          <CardTitle className="text-sm font-semibold">School Information</CardTitle>
          <CardDescription className="text-xs">Basic details about your school</CardDescription>
        </CardHeader>
        <CardContent className="px-4 pb-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">School Name</Label>
              <Input defaultValue="EduManage Academy" className="h-8 text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">School Code</Label>
              <Input defaultValue="EMA-001" className="h-8 text-sm" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Address</Label>
            <Input defaultValue="123 Education St, Learning City, LC 12345" className="h-8 text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Phone</Label>
              <Input defaultValue="+1 (555) 123-4567" className="h-8 text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Email</Label>
              <Input defaultValue="admin@edumanage.edu" className="h-8 text-sm" />
            </div>
          </div>
          <Button size="sm" className="h-8 text-xs">Save Changes</Button>
        </CardContent>
      </Card>

      <Card className="border border-border">
        <CardHeader className="pb-3 px-4 pt-4">
          <CardTitle className="text-sm font-semibold">Appearance</CardTitle>
          <CardDescription className="text-xs">Customize the look and feel</CardDescription>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-1.5 rounded-md bg-muted">
                {theme === "dark" ? <Moon className="h-4 w-4 text-muted-foreground" /> : <Sun className="h-4 w-4 text-muted-foreground" />}
              </div>
              <div>
                <p className="text-sm font-medium">Dark Mode</p>
                <p className="text-xs text-muted-foreground">Currently {theme} mode</p>
              </div>
            </div>
            <Switch checked={theme === "dark"} onCheckedChange={toggleTheme} />
          </div>
        </CardContent>
      </Card>

      <Card className="border border-border">
        <CardHeader className="pb-3 px-4 pt-4">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm font-semibold">Notifications</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Email Notifications</p>
              <p className="text-xs text-muted-foreground">Receive alerts via email</p>
            </div>
            <Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Attendance Alerts</p>
              <p className="text-xs text-muted-foreground">Alert when attendance drops below threshold</p>
            </div>
            <Switch checked={attendanceAlerts} onCheckedChange={setAttendanceAlerts} />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Grade Alerts</p>
              <p className="text-xs text-muted-foreground">Notify when a student fails</p>
            </div>
            <Switch checked={gradeAlerts} onCheckedChange={setGradeAlerts} />
          </div>
        </CardContent>
      </Card>

      <Card className="border border-border">
        <CardHeader className="pb-3 px-4 pt-4">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm font-semibold">Security</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Two-Factor Authentication</p>
              <p className="text-xs text-muted-foreground">Add an extra layer of security</p>
            </div>
            <div className="flex items-center gap-2">
              {twoFactor && <Badge variant="default" className="text-[11px]">Enabled</Badge>}
              <Switch checked={twoFactor} onCheckedChange={setTwoFactor} />
            </div>
          </div>
          <Separator />
          <div className="space-y-2">
            <p className="text-sm font-medium">Change Password</p>
            <div className="space-y-2">
              <Input type="password" placeholder="Current password" className="h-8 text-sm" />
              <Input type="password" placeholder="New password" className="h-8 text-sm" />
              <Input type="password" placeholder="Confirm new password" className="h-8 text-sm" />
            </div>
            <Button size="sm" variant="outline" className="h-8 text-xs">Update Password</Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-border">
        <CardHeader className="pb-3 px-4 pt-4">
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm font-semibold">Data Management</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Export Data</p>
              <p className="text-xs text-muted-foreground">Download all school data as CSV</p>
            </div>
            <Button variant="outline" size="sm" className="h-8 text-xs">Export</Button>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-destructive">Clear All Data</p>
              <p className="text-xs text-muted-foreground">Permanently delete all records</p>
            </div>
            <Button variant="destructive" size="sm" className="h-8 text-xs">Delete</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
