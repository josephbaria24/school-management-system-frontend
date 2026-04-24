"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Calendar,
  ChevronDown,
  ChevronUp,
  FilePlus2,
  Save,
  Trash2,
  Pencil,
  LogOut,
  Search,
  CalendarRange,
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
  const [query, setQuery] = useState("");

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

  const filteredRows = rows.filter((row) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    const hay = `${formatDateDisplay(row.calendar_date)} ${row.description ?? ""} ${
      row.non_working_day ? "non-working" : ""
    }`.toLowerCase();
    return hay.includes(q);
  });

  return (
    <div className="h-full bg-background relative overflow-x-hidden">
      <div className="w-full px-2 pt-2 pb-4">
        <Card className="w-full overflow-hidden rounded-2xl border border-border/60 bg-background shadow-[0_12px_40px_-24px_rgba(2,6,23,0.45)]">
          <CardHeader className="border-b border-border/60 bg-muted/5 pb-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-600 text-white shadow-sm">
                  <Calendar className="h-5 w-5" />
                </div>
                <div className="space-y-0.5">
                  <CardTitle className="text-base font-semibold tracking-tight">
                    School Calendar
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">
                    Setup manager • Schedule key dates and holidays
                  </p>
                </div>
              </div>

              <div className="hidden sm:flex items-center gap-2">
                <Badge variant="secondary" className="rounded-xl">
                  {year}
                </Badge>
                {isNewRecord ? (
                  <Badge variant="outline" className="rounded-xl">
                    New
                  </Badge>
                ) : (
                  <Badge className="rounded-xl bg-emerald-600 text-white hover:bg-emerald-600">
                    Editing
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-[26rem_minmax(0,1fr)] gap-6 lg:min-h-[calc(100svh-14.5rem)]">
              {/* Left: list */}
              <Card className="rounded-2xl border-border/60 overflow-hidden">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-0.5">
                      <p className="text-sm font-semibold tracking-tight">Schedules</p>
                      <p className="text-xs text-muted-foreground">
                        {filteredRows.length} shown • {rows.length} total
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-9 w-9 rounded-xl"
                        onClick={() => bumpYear(-1)}
                        aria-label="Previous year"
                      >
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                      <div className="relative">
                        <Input
                          type="number"
                          className="h-9 w-24 rounded-xl text-xs text-center border-border/60 shadow-sm"
                          value={year}
                          onChange={(e) => {
                            const v = parseInt(e.target.value, 10);
                            if (!Number.isNaN(v)) setYear(v);
                          }}
                        />
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-9 w-9 rounded-xl"
                        onClick={() => bumpYear(1)}
                        aria-label="Next year"
                      >
                        <ChevronUp className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="mt-3 relative">
                    <Search className="h-4 w-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                    <Input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Search date or description…"
                      className="h-9 rounded-xl pl-9 border-border/60 shadow-sm"
                    />
                  </div>
                </CardHeader>

                <CardContent className="pt-0">
                  <div className="grid grid-cols-12 bg-muted/40 text-[11px] font-semibold text-muted-foreground border border-border/60 rounded-xl overflow-hidden shadow-sm">
                    <div className="col-span-3 px-3 py-2 border-r border-border/60">Date</div>
                    <div className="col-span-7 px-3 py-2 border-r border-border/60">Description</div>
                    <div className="col-span-2 px-3 py-2 text-center">NWD</div>
                  </div>
                  <div className="mt-2 border border-border/60 rounded-2xl overflow-hidden">
                    <ScrollArea className="h-[calc(100svh-24rem)] lg:h-[calc(100svh-20.5rem)] min-h-120">
                      <div className="pr-6">
                        {loading && (
                          <div className="px-4 py-8 text-sm text-muted-foreground">
                            Loading entries…
                          </div>
                        )}
                        {!loading && filteredRows.length === 0 && (
                          <div className="px-4 py-10 text-center">
                            <p className="text-sm font-semibold">No entries</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Add dates like holidays, events, or non-working days.
                            </p>
                          </div>
                        )}
                        {!loading &&
                          filteredRows.map((row, idx) => (
                            <button
                              key={row.id}
                              type="button"
                              onClick={() => setSelectedId(row.id)}
                              className={cn(
                                "w-full grid grid-cols-12 text-left text-xs border-b border-border/40 transition-colors",
                                selectedId === row.id
                                  ? "bg-emerald-500/10"
                                  : idx % 2 === 0
                                    ? "bg-background hover:bg-muted/40"
                                    : "bg-muted/10 hover:bg-muted/40"
                              )}
                            >
                              <div className="col-span-3 px-3 py-2 border-r border-border/40 truncate">
                                {formatDateDisplay(row.calendar_date)}
                              </div>
                              <div className="col-span-7 px-3 py-2 border-r border-border/40 truncate">
                                {row.description || "—"}
                              </div>
                              <div className="col-span-2 px-3 py-2 text-center">
                                {row.non_working_day ? "Yes" : "No"}
                              </div>
                            </button>
                          ))}
                      </div>
                    </ScrollArea>
                  </div>
                </CardContent>
              </Card>

              {/* Right: editor */}
              <Card className="rounded-2xl border-border/60 overflow-hidden">
                <CardHeader className="pb-4">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="space-y-0.5">
                      <p className="text-sm font-semibold tracking-tight">General information</p>
                      <p className="text-xs text-muted-foreground">
                        {isNewRecord ? "Create a new calendar entry." : "Update the selected entry."}
                      </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button
                        type="button"
                        onClick={resetFormForNew}
                        disabled={saving}
                        variant="outline"
                        className="h-9 rounded-xl text-xs font-semibold gap-2"
                      >
                        <FilePlus2 className="h-4 w-4" />
                        New
                      </Button>
                      <Button
                        type="button"
                        onClick={handleSave}
                        disabled={saving}
                        className="h-9 rounded-xl text-xs font-semibold gap-2"
                      >
                        <Save className="h-4 w-4" />
                        {selectedId ? "Save changes" : "Create"}
                      </Button>
                      <Button
                        type="button"
                        onClick={handleDelete}
                        disabled={saving || !selectedId}
                        variant="outline"
                        className="h-9 rounded-xl text-xs font-semibold gap-2 hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="h-9 rounded-xl text-xs font-semibold gap-2"
                        asChild
                      >
                        <Link href="/">
                          <LogOut className="h-4 w-4" />
                          Close
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pt-0">
                  <ScrollArea className="h-[calc(100svh-22rem)] lg:h-[calc(100svh-19rem)] min-h-120">
                    <div className="space-y-6 pr-6">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <CalendarRange className="h-4 w-4" />
                          <span className="font-semibold text-foreground">Date</span>
                        </div>
                        <Separator />
                        <div className="space-y-1.5">
                          <Label className="text-[11px] text-muted-foreground">Calendar date</Label>
                          <Input
                            type="date"
                            className="h-9 rounded-xl text-xs border-border/60 shadow-sm max-w-xs"
                            value={calendarDate}
                            onChange={(e) => setCalendarDate(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="space-y-3">
                        <p className="text-sm font-semibold tracking-tight">Description</p>
                        <Separator />
                        <Textarea
                          className="min-h-44 rounded-2xl text-sm resize-y border-border/60 shadow-sm"
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          placeholder="Enter description…"
                        />
                      </div>

                      <div className="space-y-3">
                        <p className="text-sm font-semibold tracking-tight">Status</p>
                        <Separator />
                        <div className="flex items-center gap-3 rounded-2xl border border-border/60 p-4 bg-muted/10">
                          <Checkbox
                            id="nwd"
                            checked={nonWorkingDay}
                            onCheckedChange={(v) => setNonWorkingDay(!!v)}
                          />
                          <div className="min-w-0">
                            <Label htmlFor="nwd" className="text-sm font-semibold cursor-pointer">
                              Non-working day
                            </Label>
                            <p className="text-xs text-muted-foreground">
                              Mark holidays and official non-working dates.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
