"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Search, Plus, MoreHorizontal, BookOpen, Clock } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { teachers } from "@/lib/data";

const subjectColors: Record<string, string> = {
  Mathematics: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  Physics: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  "English Literature": "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  History: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  Chemistry: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  "Physical Education": "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  Art: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400",
  "Computer Science": "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400",
};

export default function TeachersPage() {
  const [search, setSearch] = useState("");

  const filtered = teachers.filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.subject.toLowerCase().includes(search.toLowerCase()) ||
      t.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search teachers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-8 text-sm"
          />
        </div>
        <Button size="sm" className="h-8 text-xs gap-1.5">
          <Plus className="h-3.5 w-3.5" />
          Add Teacher
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((teacher) => (
          <Card key={teacher.id} className="border border-border hover:border-primary/30 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="text-xs bg-primary/10 text-primary font-medium">
                      {teacher.name
                        .split(" ")
                        .filter((n) => !["Dr.", "Mr.", "Ms."].includes(n))
                        .map((n) => n[0])
                        .join("")
                        .slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium text-foreground leading-tight">{teacher.name}</p>
                    <p className="text-xs text-muted-foreground">{teacher.email}</p>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7 -mr-1 -mt-0.5">
                      <MoreHorizontal className="h-3.5 w-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem className="text-xs">View Profile</DropdownMenuItem>
                    <DropdownMenuItem className="text-xs">Edit</DropdownMenuItem>
                    <DropdownMenuItem className="text-xs text-destructive">Remove</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="mt-3">
                <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium ${subjectColors[teacher.subject] || "bg-muted text-muted-foreground"}`}>
                  {teacher.subject}
                </span>
              </div>
              <div className="mt-3 flex items-center gap-4">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <BookOpen className="h-3.5 w-3.5" />
                  <span>{teacher.classes} classes</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" />
                  <span>{teacher.experience} yrs exp.</span>
                </div>
                <Badge variant={teacher.status === "active" ? "default" : "secondary"} className="ml-auto text-[11px]">
                  {teacher.status}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      {filtered.length === 0 && (
        <div className="py-12 text-center text-sm text-muted-foreground">No teachers found.</div>
      )}
    </div>
  );
}
