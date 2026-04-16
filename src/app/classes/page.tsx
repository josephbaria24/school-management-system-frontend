"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Users, MapPin, Clock, MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { classes } from "@/lib/data";

const subjectColors: Record<string, string> = {
  Mathematics: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  Physics: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  English: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  History: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  Chemistry: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  CS: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400",
};

export default function ClassesPage() {
  const [search, setSearch] = useState("");

  const filtered = classes.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.teacher.toLowerCase().includes(search.toLowerCase()) ||
      c.subject.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search classes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-8 text-sm"
          />
        </div>
        <Button size="sm" className="h-8 text-xs gap-1.5">
          <Plus className="h-3.5 w-3.5" />
          Add Class
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((cls) => (
          <Card key={cls.id} className="border border-border hover:border-primary/30 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium ${subjectColors[cls.subject] || "bg-muted text-muted-foreground"}`}>
                    {cls.subject}
                  </span>
                  <h3 className="mt-2 text-sm font-semibold text-foreground">{cls.name}</h3>
                  <p className="text-xs text-muted-foreground">{cls.teacher}</p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7 -mr-1 -mt-0.5">
                      <MoreHorizontal className="h-3.5 w-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem className="text-xs">View Details</DropdownMenuItem>
                    <DropdownMenuItem className="text-xs">Edit</DropdownMenuItem>
                    <DropdownMenuItem className="text-xs text-destructive">Delete</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="mt-4 space-y-1.5">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Users className="h-3.5 w-3.5 shrink-0" />
                  <span>{cls.students} students</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5 shrink-0" />
                  <span>Room {cls.room}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="h-3.5 w-3.5 shrink-0" />
                  <span>{cls.schedule}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      {filtered.length === 0 && (
        <div className="py-12 text-center text-sm text-muted-foreground">No classes found.</div>
      )}
    </div>
  );
}
