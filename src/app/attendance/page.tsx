"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Clock, Download } from "lucide-react";
import { students, attendanceData } from "@/lib/data";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

const attendanceRecords = students.map((s) => ({
  ...s,
  todayStatus: s.attendance > 90 ? "present" : s.attendance > 80 ? "late" : "absent",
}));

export default function AttendancePage() {
  const [records, setRecords] = useState(attendanceRecords);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const toggleStatus = (id: number) => {
    setRecords((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        const statuses = ["present", "late", "absent"] as const;
        const current = statuses.indexOf(r.todayStatus as "present" | "late" | "absent");
        return { ...r, todayStatus: statuses[(current + 1) % 3] };
      })
    );
  };

  const present = records.filter((r) => r.todayStatus === "present").length;
  const absent = records.filter((r) => r.todayStatus === "absent").length;
  const late = records.filter((r) => r.todayStatus === "late").length;

  return (
    <div className="p-6 space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <Card className="border border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Present</p>
              <p className="text-2xl font-bold">{present}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <XCircle className="h-5 w-5 text-red-500 shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Absent</p>
              <p className="text-2xl font-bold">{absent}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <Clock className="h-5 w-5 text-amber-500 shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Late</p>
              <p className="text-2xl font-bold">{late}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <Card className="lg:col-span-3 border border-border">
          <CardHeader className="pb-2 px-4 pt-4">
            <CardTitle className="text-sm font-semibold">Weekly Overview</CardTitle>
          </CardHeader>
          <CardContent className="px-2 pb-4">
            {mounted ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={attendanceData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tickFormatter={(v) => v.slice(8)} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                  <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: "6px", fontSize: "12px" }} />
                  <Bar dataKey="present" name="Present" fill="#22c55e" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="absent" name="Absent" fill="#ef4444" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="late" name="Late" fill="#f59e0b" radius={[2, 2, 0, 0]} />
                  <Legend iconSize={10} wrapperStyle={{ fontSize: "11px" }} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: 200 }} className="bg-muted/30 rounded animate-pulse" />
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 border border-border">
          <CardHeader className="pb-2 px-4 pt-4 flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold">Today&apos;s Attendance</CardTitle>
            <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5">
              <Download className="h-3 w-3" />
              Export
            </Button>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="space-y-1.5 max-h-[240px] overflow-y-auto pr-1">
              {records.map((student) => (
                <div
                  key={student.id}
                  className="flex items-center justify-between py-1.5 px-2 rounded-md hover:bg-muted/50 cursor-pointer"
                  onClick={() => toggleStatus(student.id)}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className={`h-2 w-2 rounded-full shrink-0 ${student.todayStatus === "present" ? "bg-green-500" : student.todayStatus === "late" ? "bg-amber-500" : "bg-red-500"}`} />
                    <span className="text-xs text-foreground truncate">{student.name}</span>
                  </div>
                  <Badge
                    variant="outline"
                    className={`text-[11px] shrink-0 ${student.todayStatus === "present" ? "border-green-200 text-green-700 dark:border-green-800 dark:text-green-400" : student.todayStatus === "late" ? "border-amber-200 text-amber-700 dark:border-amber-800 dark:text-amber-400" : "border-red-200 text-red-700 dark:border-red-800 dark:text-red-400"}`}
                  >
                    {student.todayStatus}
                  </Badge>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground mt-2">Click a student to cycle their status</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
