"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { scheduleData } from "@/lib/data";

const days = ["monday", "tuesday", "wednesday", "thursday", "friday"] as const;
const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri"];

const subjectColors: Record<string, string> = {
  "Mathematics 10A": "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  "Physics 11B": "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  "English Lit 9C": "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  "History 12A": "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  "Chemistry 11A": "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  "CS 10B": "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400",
};

export default function SchedulePage() {
  return (
    <div className="p-6 space-y-4">
      <Card className="border border-border">
        <CardHeader className="pb-2 px-4 pt-4">
          <CardTitle className="text-sm font-semibold">Weekly Schedule</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr>
                  <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground w-28">Time</th>
                  {dayLabels.map((day) => (
                    <th key={day} className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">{day}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {scheduleData.map((slot) => (
                  <tr key={slot.id} className="border-t border-border">
                    <td className="py-2.5 px-3 text-xs text-muted-foreground whitespace-nowrap font-mono">{slot.time}</td>
                    {days.map((day) => {
                      const cls = slot[day];
                      return (
                        <td key={day} className="py-2 px-2">
                          {cls ? (
                            <span className={`inline-flex items-center px-2 py-1 rounded-md text-[11px] font-medium whitespace-nowrap ${subjectColors[cls] || "bg-muted text-muted-foreground"}`}>
                              {cls}
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground/40">—</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {Object.entries(subjectColors).map(([subject, color]) => (
          <div key={subject} className={`px-2 py-1.5 rounded-md text-[11px] font-medium ${color}`}>
            {subject}
          </div>
        ))}
      </div>
    </div>
  );
}
