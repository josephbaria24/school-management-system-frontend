"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Calendar,
  ChevronDown,
  ChevronUp,
  FilePlus2,
  Save,
  Trash2,
  Pencil,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

const API = process.env.NEXT_PUBLIC_API_URL;

type CalendarRow = {
  id: number;
  calendar_date: string;
  description: string | null;
  non_working_day: boolean;
};

function formatDateDisplay(iso: string) {
  if (!iso) return "";
  const d = String(iso).slice(0, 10);
  const [y, m, day] = d.split("-");
  if (!y || !m || !day) return d;
  return `${m}/${day}/${y}`;
}

export default function SchoolCalendarPage() {
  const [year, setYear] = useState(() => new Date().getFullYear());
  const [rows, setRows] = useState<CalendarRow[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [calendarDate, setCalendarDate] = useState("");
  const [description, setDescription] = useState("");
  const [nonWorkingDay, setNonWorkingDay] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isNewRecord, setIsNewRecord] = useState(true);

  const loadRows = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `${API}/api/school-calendar?year=${encodeURIComponent(String(year))}`
      );
      if (!res.ok) throw new Error("Failed to load calendar");
      const data: CalendarRow[] = await res.json();
      setRows(data);
    } catch (e) {
      console.error(e);
      toast({
        title: "Load failed",
        description: "Could not load school calendar.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [year]);

  useEffect(() => {
    loadRows();
  }, [loadRows]);

  const selected = rows.find((r) => r.id === selectedId) ?? null;

  useEffect(() => {
    if (!selected) return;
    setCalendarDate(String(selected.calendar_date).slice(0, 10));
    setDescription(selected.description ?? "");
    setNonWorkingDay(!!selected.non_working_day);
    setIsNewRecord(false);
  }, [selected]);

  const resetFormForNew = () => {
    setSelectedId(null);
    setCalendarDate("");
    setDescription("");
    setNonWorkingDay(false);
    setIsNewRecord(true);
  };

  const handleSave = async () => {
    if (!calendarDate.trim()) {
      toast({
        title: "Validation error",
        description: "Date is required.",
        variant: "destructive",
      });
      return;
    }
    setSaving(true);
    try {
      const url = selectedId
        ? `${API}/api/school-calendar/${selectedId}`
        : `${API}/api/school-calendar`;
      const method = selectedId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          calendar_date: calendarDate,
          description: description || null,
          non_working_day: nonWorkingDay,
        }),
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(result?.error || "Save failed");
      setSelectedId(result.id);
      setIsNewRecord(false);
      toast({ title: "Saved", description: "School calendar record saved successfully." });
      await loadRows();
    } catch (e) {
      toast({
        title: "Save failed",
        description: e instanceof Error ? e.message : "Save failed",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedId) return;
    setSaving(true);
    try {
      const res = await fetch(`${API}/api/school-calendar/${selectedId}`, {
        method: "DELETE",
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(result?.error || "Delete failed");
      resetFormForNew();
      toast({ title: "Deleted", description: "School calendar record deleted." });
      await loadRows();
    } catch (e) {
      toast({
        title: "Delete failed",
        description: e instanceof Error ? e.message : "Delete failed",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const bumpYear = (delta: number) => {
    setYear((y) => y + delta);
    resetFormForNew();
  };

  return (
    <div className="h-full bg-background relative overflow-x-hidden">
      <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-primary/5 to-transparent -z-10" />
      <div className="w-full px-2 pt-2 pb-4">
        <div className="mb-6 space-y-1">
          <h1 className="text-lg font-bold tracking-tight uppercase">
            School Calendar
          </h1>
          <p className="text-sm text-muted-foreground">
            This module allows you to enter the school calendar.
          </p>
        </div>

        <Card className="border-2 border-primary/20 shadow-2xl rounded-md overflow-hidden bg-slate-50 dark:bg-slate-900">
          <div className="bg-emerald-700 dark:bg-emerald-900 text-white px-4 py-1.5 flex items-center justify-between border-b border-primary/30">
            <div className="flex items-center gap-2">
              <div className="bg-white dark:bg-slate-100 p-0.5 rounded-sm">
                <Calendar className="h-4 w-4 text-emerald-700 dark:text-emerald-900" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider">
                School Calendar
              </span>
            </div>
            <div />
          </div>

          <div className="p-3 bg-white/70 dark:bg-slate-950/60 h-[640px]">
            <div className="grid grid-cols-12 gap-3 h-[580px]">
              {/* Left: Schedules list */}
              <div className="col-span-5 flex flex-col border border-border rounded-sm overflow-hidden bg-background h-full">
                <div className="flex items-center justify-between gap-2 bg-emerald-600 dark:bg-emerald-800 text-white px-2 py-1.5">
                  <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider">
                    <Calendar className="h-3.5 w-3.5" />
                    Schedules
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] font-semibold uppercase">
                      Year
                    </span>
                    <div className="flex flex-col">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-5 w-6 p-0 text-white hover:bg-white/20"
                        onClick={() => bumpYear(1)}
                      >
                        <ChevronUp className="h-3 w-3" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-5 w-6 p-0 text-white hover:bg-white/20"
                        onClick={() => bumpYear(-1)}
                      >
                        <ChevronDown className="h-3 w-3" />
                      </Button>
                    </div>
                    <Input
                      type="number"
                      className="h-7 w-16 text-xs bg-white text-foreground text-center"
                      value={year}
                      onChange={(e) => {
                        const v = parseInt(e.target.value, 10);
                        if (!Number.isNaN(v)) setYear(v);
                      }}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-12 bg-slate-200 dark:bg-slate-800 text-[10px] font-bold uppercase border-b border-border/60">
                  <div className="col-span-3 px-2 py-1 border-r border-border/60">
                    Date
                  </div>
                  <div className="col-span-6 px-2 py-1 border-r border-border/60">
                    Description
                  </div>
                  <div className="col-span-3 px-2 py-1 text-center">
                    Non-working
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto min-h-0">
                  {loading ? (
                    <div className="p-4 text-xs text-muted-foreground">
                      Loading…
                    </div>
                  ) : rows.length === 0 ? (
                    <div className="p-4 text-xs text-muted-foreground italic">
                      No entries for {year}.
                    </div>
                  ) : (
                    rows.map((row) => (
                      <button
                        key={row.id}
                        type="button"
                        onClick={() => setSelectedId(row.id)}
                        className={cn(
                          "w-full grid grid-cols-12 text-left text-xs border-b border-border/50",
                          selectedId === row.id
                            ? "bg-emerald-100 dark:bg-emerald-950/50 font-medium"
                            : "hover:bg-muted/50"
                        )}
                      >
                        <div className="col-span-3 px-2 py-1.5 border-r border-border/40 truncate">
                          {formatDateDisplay(row.calendar_date)}
                        </div>
                        <div className="col-span-6 px-2 py-1.5 border-r border-border/40 truncate">
                          {row.description || "—"}
                        </div>
                        <div className="col-span-3 px-2 py-1.5 text-center">
                          {row.non_working_day ? "Yes" : "No"}
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>

              {/* Right: General information */}
              <div className="col-span-7 flex flex-col border border-border rounded-sm overflow-hidden bg-background h-full">
                <div className="flex items-center justify-between bg-emerald-600 dark:bg-emerald-800 text-white px-2 py-1.5 text-[10px] font-bold uppercase">
                  <span>General Information</span>
                  <span className="opacity-90">
                    {isNewRecord ? "Create New Record!" : "Edit Record"}
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5 p-2 border-b border-border/60 bg-muted/30">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 text-[10px] gap-1"
                    disabled={saving}
                    onClick={resetFormForNew}
                  >
                    <FilePlus2 className="h-3 w-3" />
                    New
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 text-[10px] gap-1"
                    disabled={saving}
                    onClick={handleSave}
                  >
                    <Save className="h-3 w-3" />
                    Save
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 text-[10px] gap-1 text-destructive hover:text-destructive"
                    disabled={saving || !selectedId}
                    onClick={handleDelete}
                  >
                    <Trash2 className="h-3 w-3" />
                    Delete
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 text-[10px] gap-1"
                    disabled={saving || !selectedId}
                    onClick={() => {
                      if (selected) {
                        setCalendarDate(
                          String(selected.calendar_date).slice(0, 10)
                        );
                        setDescription(selected.description ?? "");
                        setNonWorkingDay(!!selected.non_working_day);
                        setIsNewRecord(false);
                      }
                    }}
                  >
                    <Pencil className="h-3 w-3" />
                    Edit
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 text-[10px] gap-1 ml-auto"
                    asChild
                  >
                    <Link href="/">
                      <LogOut className="h-3 w-3 mr-1" />
                      Close
                    </Link>
                  </Button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
                  <div className="space-y-1">
                    <Label className="text-xs">Date</Label>
                    <div className="flex flex-wrap items-center gap-2">
                      <Input
                        type="date"
                        className="h-8 max-w-[200px] text-sm"
                        value={calendarDate}
                        onChange={(e) => setCalendarDate(e.target.value)}
                      />
                      <span className="text-[10px] text-muted-foreground">
                        Format: MM/DD/YYYY (use date picker)
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1 flex-1 min-h-[200px] flex flex-col">
                    <Label className="text-xs">Description</Label>
                    <Textarea
                      className="min-h-[180px] text-sm resize-y"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Enter description…"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="nwd"
                      checked={nonWorkingDay}
                      onCheckedChange={(v) => setNonWorkingDay(!!v)}
                    />
                    <Label
                      htmlFor="nwd"
                      className="text-sm font-medium text-destructive cursor-pointer"
                    >
                      Non-Working Day?
                    </Label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
