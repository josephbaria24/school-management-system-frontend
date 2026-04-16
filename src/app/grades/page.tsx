"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, TrendingUp, TrendingDown } from "lucide-react";
import { students, gradeDistribution } from "@/lib/data";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
  RadarChart, PolarGrid, PolarAngleAxis, Radar,
} from "recharts";

const getLetterGrade = (gpa: number) => {
  if (gpa >= 3.7) return "A";
  if (gpa >= 3.0) return "B";
  if (gpa >= 2.0) return "C";
  if (gpa >= 1.0) return "D";
  return "F";
};

const getGradeColor = (grade: string) => {
  switch (grade) {
    case "A": return "text-blue-600 dark:text-blue-400";
    case "B": return "text-green-600 dark:text-green-400";
    case "C": return "text-amber-600 dark:text-amber-400";
    case "D": return "text-orange-600 dark:text-orange-400";
    default: return "text-red-600 dark:text-red-400";
  }
};

const subjectPerformance = [
  { subject: "Math", avg: 78 },
  { subject: "Physics", avg: 72 },
  { subject: "English", avg: 85 },
  { subject: "History", avg: 80 },
  { subject: "Chemistry", avg: 74 },
  { subject: "CS", avg: 88 },
];

export default function GradesPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div className="p-6 space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-1 border border-border">
          <CardHeader className="pb-2 px-4 pt-4">
            <CardTitle className="text-sm font-semibold">Grade Distribution</CardTitle>
          </CardHeader>
          <CardContent className="pb-4 px-2">
            <div style={{ height: 200 }}>
              {mounted ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={gradeDistribution} cx="50%" cy="45%" outerRadius={70} paddingAngle={2} dataKey="count" nameKey="name">
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

        <Card className="lg:col-span-2 border border-border">
          <CardHeader className="pb-2 px-4 pt-4">
            <CardTitle className="text-sm font-semibold">Subject Performance (Avg %)</CardTitle>
          </CardHeader>
          <CardContent className="px-2 pb-4">
            <div style={{ height: 200 }}>
              {mounted ? (
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={subjectPerformance}>
                    <PolarGrid stroke="hsl(var(--border))" />
                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                    <Radar name="Average" dataKey="avg" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.15} strokeWidth={2} />
                    <Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: "6px", fontSize: "12px" }} />
                  </RadarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full bg-muted/30 rounded animate-pulse" />
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border border-border">
        <CardHeader className="pb-2 px-4 pt-4 flex-row items-center justify-between">
          <CardTitle className="text-sm font-semibold">Student Grades</CardTitle>
          <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5">
            <Download className="h-3 w-3" />
            Export
          </Button>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Student</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">Grade</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground">GPA</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground hidden md:table-cell">Letter</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground hidden lg:table-cell">Trend</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => {
                const letter = getLetterGrade(student.gpa);
                return (
                  <tr key={student.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                    <td className="py-3 px-4 text-xs font-medium text-foreground">{student.name}</td>
                    <td className="py-3 px-4">
                      <Badge variant="outline" className="text-[11px] font-normal">{student.grade}</Badge>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-24 bg-muted rounded-full overflow-hidden hidden sm:block">
                          <div className="h-full rounded-full bg-blue-500" style={{ width: `${(student.gpa / 4.0) * 100}%` }} />
                        </div>
                        <span className="text-xs font-medium">{student.gpa.toFixed(1)}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 hidden md:table-cell">
                      <span className={`text-sm font-bold ${getGradeColor(letter)}`}>{letter}</span>
                    </td>
                    <td className="py-3 px-4 hidden lg:table-cell">
                      {student.gpa >= 3.5 ? (
                        <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                          <TrendingUp className="h-3.5 w-3.5" />
                          <span className="text-xs">Above avg</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                          <TrendingDown className="h-3.5 w-3.5" />
                          <span className="text-xs">Below avg</span>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
