"use client";

import { usePathname } from "next/navigation";
import { Bell, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/lib/theme";
import { getSetupLabelForSlug } from "@/lib/setup-nav";
import { getCollegesLabelForSlug } from "@/lib/colleges-nav";

const pageMeta: Record<string, { title: string; subtitle: string }> = {
  "/": { title: "Dashboard", subtitle: "Overview of your school" },
  "/students": { title: "Students", subtitle: "Manage student records" },
  "/teachers": { title: "Teachers", subtitle: "Staff directory" },
  "/classes": { title: "Classes", subtitle: "Active classes this semester" },
  "/attendance": { title: "Attendance", subtitle: "Track daily attendance" },
  "/grades": { title: "Grades", subtitle: "Academic performance" },
  "/schedule": { title: "Schedule", subtitle: "Weekly timetable" },
  "/settings": { title: "Settings", subtitle: "System configuration" },
};

export function Header() {
  const pathname = usePathname();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const setupMatch = pathname.match(/^\/setup\/([^/]+)$/);
  const collegesMatch = pathname.match(/^\/colleges\/([^/]+)$/);
  const setupLabel = setupMatch ? getSetupLabelForSlug(setupMatch[1]) : undefined;
  const collegesLabel = collegesMatch ? getCollegesLabelForSlug(collegesMatch[1]) : undefined;
  const meta =
    pageMeta[pathname] ??
    (setupLabel
      ? { title: setupLabel, subtitle: "Setup Manager module" }
      : collegesLabel
      ? { title: collegesLabel, subtitle: "Colleges module" }
      : { title: "SphereX", subtitle: "" });

  return (
    <header
      className={`flex items-center justify-between px-6 py-4 sticky top-0 z-10 border-b ${
        isDark
          ? "border-emerald-500/20 bg-gradient-to-r from-[#0d1f1a] via-[#0f251f] to-[#123027]"
          : "border-emerald-200 bg-gradient-to-r from-[#f7fffb] via-[#f2fff9] to-[#ecfdf5]"
      }`}
    >
      <div className="md:ml-0 ml-10">
        <h1 className={`text-lg font-semibold ${isDark ? "text-emerald-100" : "text-emerald-900"}`}>
          {meta.title}
        </h1>
        {meta.subtitle && (
          <p className={`text-xs ${isDark ? "text-emerald-300/80" : "text-emerald-700/80"}`}>
            {meta.subtitle}
          </p>
        )}
      </div>
      <div className="flex items-center gap-2">
        <div className="hidden sm:flex relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search..."
            className="pl-8 h-8 w-44 text-sm bg-muted border-0 focus-visible:ring-1"
          />
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8 relative">
          <Bell className="h-4 w-4" />
          <Badge className="absolute -top-0.5 -right-0.5 h-4 w-4 p-0 text-[10px] flex items-center justify-center">
            3
          </Badge>
        </Button>
      </div>
    </header>
  );
}
