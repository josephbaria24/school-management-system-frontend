"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, GraduationCap, BookOpen, TrendingUp, ClipboardList, AlertCircle } from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend
} from "recharts";
import { enrollmentTrend, gradeDistribution, attendanceData, recentActivities } from "@/lib/data";
import { Badge } from "@/components/ui/badge";

const statCards = [
  { title: "Total Students", value: "270", change: "+12 this month", icon: Users, color: "text-blue-500" },
  { title: "Teachers", value: "8", change: "1 on leave", icon: GraduationCap, color: "text-green-500" },
  { title: "Active Classes", value: "6", change: "2 labs, 4 rooms", icon: BookOpen, color: "text-amber-500" },
  { title: "Avg GPA", value: "3.52", change: "+0.08 vs last term", icon: TrendingUp, color: "text-purple-500" },
];

const activityIcons: Record<string, React.ReactNode> = {
  enrollment: <Users className="h-3 w-3" />,
  grade: <TrendingUp className="h-3 w-3" />,
  attendance: <ClipboardList className="h-3 w-3" />,
  teacher: <GraduationCap className="h-3 w-3" />,
  class: <BookOpen className="h-3 w-3" />,
};

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false);
  const [backendStatus, setBackendStatus] = useState<"connecting" | "connected" | "failed">("connecting");

  useEffect(() => {
    setMounted(true);
    
    const checkBackend = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/health`);
        const data = await response.json();
        if (data.message === "Backend is connected") {
          setBackendStatus("connected");
        } else {
          setBackendStatus("failed");
        }
      } catch (err) {
        console.error("Backend connection failed:", err);
        setBackendStatus("failed");
      }
    };

    checkBackend();
  }, []);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold tracking-tight">Dashboard Overview</h1>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground mr-1">Server:</span>
          {backendStatus === "connecting" && (
            <Badge variant="secondary" className="animate-pulse">Connecting...</Badge>
          )}
          {backendStatus === "connected" && (
            <Badge variant="default" className="bg-emerald-500 hover:bg-emerald-600">Active</Badge>
          )}
          {backendStatus === "failed" && (
            <Badge variant="destructive">Offline</Badge>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.title} className="border border-border">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">{card.title}</p>
                    <p className="text-2xl font-bold text-foreground mt-1">{card.value}</p>
                    <p className="text-xs text-muted-foreground mt-1">{card.change}</p>
                  </div>
                  <div className={`p-2 rounded-md bg-muted ${card.color}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 border border-border">
          <CardHeader className="pb-2 px-4 pt-4">
            <CardTitle className="text-sm font-semibold">Enrollment Trend</CardTitle>
          </CardHeader>
          <CardContent className="px-2 pb-4">
            {mounted ? (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={enrollmentTrend} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorStudents" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.03} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} domain={[230, 280]} />
                  <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: "6px", fontSize: "12px" }} labelStyle={{ color: "hsl(var(--foreground))" }} />
                  <Area type="monotone" dataKey="students" stroke="#3b82f6" fill="url(#colorStudents)" strokeWidth={2} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: 200 }} className="bg-muted/30 rounded animate-pulse" />
            )}
          </CardContent>
        </Card>

        <Card className="border border-border">
          <CardHeader className="pb-2 px-4 pt-4">
            <CardTitle className="text-sm font-semibold">Grade Distribution</CardTitle>
          </CardHeader>
          <CardContent className="pb-4 px-2">
            <div style={{ height: 200 }}>
              {mounted ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={gradeDistribution} cx="50%" cy="45%" innerRadius={45} outerRadius={70} paddingAngle={2} dataKey="count" nameKey="name">
                      {gradeDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: "6px", fontSize: "12px" }} />
                    <Legend iconSize={10} wrapperStyle={{ fontSize: "11px" }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full bg-muted/30 rounded animate-pulse" />
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 border border-border">
          <CardHeader className="pb-2 px-4 pt-4">
            <CardTitle className="text-sm font-semibold">Weekly Attendance</CardTitle>
          </CardHeader>
          <CardContent className="px-2 pb-4">
            {mounted ? (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={attendanceData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tickFormatter={(v) => v.slice(8)} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                  <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: "6px", fontSize: "12px" }} />
                  <Bar dataKey="present" fill="#3b82f6" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="absent" fill="#ef4444" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="late" fill="#f59e0b" radius={[2, 2, 0, 0]} />
                  <Legend iconSize={10} wrapperStyle={{ fontSize: "11px" }} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: 180 }} className="bg-muted/30 rounded animate-pulse" />
            )}
          </CardContent>
        </Card>

        <Card className="border border-border">
          <CardHeader className="pb-2 px-4 pt-4">
            <CardTitle className="text-sm font-semibold">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="space-y-3">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-2.5">
                  <div className="mt-0.5 p-1.5 rounded-md bg-muted text-muted-foreground shrink-0">
                    {activityIcons[activity.type] || <AlertCircle className="h-3 w-3" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-foreground leading-snug">{activity.message}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
