"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  BookOpen,
  Lock,
  Plus,
  Save,
  Trash2,
  X,
  Search,
  CalendarRange,
  EyeOff,
  Eye,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

type TermRow = {
  id: number;
  campus?: string | null;
  academic_year: string;
  term: string;
  start_date: string;
  end_date: string;
  locked: boolean;
  hidden?: boolean;
  enrollment_start?: string | null;
  enrollment_end?: string | null;
  late_enrolment_date?: string | null;
  add_change_start?: string | null;
  add_change_end?: string | null;
  dropping_start?: string | null;
  dropping_end?: string | null;
  incomplete_due_date?: string | null;
  encoding_first_start?: string | null;
  encoding_first_end?: string | null;
  encoding_second_start?: string | null;
  encoding_second_end?: string | null;
  encoding_third_start?: string | null;
  encoding_third_end?: string | null;
  encoding_fourth_start?: string | null;
  encoding_fourth_end?: string | null;
};

type TermPayload = Omit<TermRow, "id">;
type CampusRow = {
  id: number;
  acronym: string;
  campus_name: string | null;
};

const API = process.env.NEXT_PUBLIC_API_URL;
const emptyForm: TermPayload = {
  campus: "PSU Narra",
  academic_year: "",
  term: "",
  start_date: "",
  end_date: "",
  locked: false,
  hidden: false,
  enrollment_start: "",
  enrollment_end: "",
  late_enrolment_date: "",
  add_change_start: "",
  add_change_end: "",
  dropping_start: "",
  dropping_end: "",
  incomplete_due_date: "",
  encoding_first_start: "",
  encoding_first_end: "",
  encoding_second_start: "",
  encoding_second_end: "",
  encoding_third_start: "",
  encoding_third_end: "",
  encoding_fourth_start: "",
  encoding_fourth_end: "",
};

export default function AcademicYearAndTermsPage() {
  const [rows, setRows] = useState<TermRow[]>([]);
  const [campuses, setCampuses] = useState<CampusRow[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [formData, setFormData] = useState<TermPayload>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeFilter, setActiveFilter] = useState<"all" | "active" | "hidden" | "locked">("all");
  const [query, setQuery] = useState("");

  const selected = useMemo(
    () => rows.find((r) => r.id === selectedId) ?? null,
    [rows, selectedId]
  );

  const visibleRows = useMemo(() => {
    const base =
      activeFilter === "all"
        ? rows
        : activeFilter === "locked"
          ? rows.filter((r) => r.locked)
          : activeFilter === "hidden"
            ? rows.filter((r) => !!r.hidden)
            : rows.filter((r) => !r.locked && !r.hidden);

    const q = query.trim().toLowerCase();
    if (!q) return base;
    return base.filter((r) => {
      const hay = `${r.campus ?? ""} ${r.academic_year ?? ""} ${r.term ?? ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [rows, activeFilter, query]);

  const fetchRows = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/academic-year-terms`);
      if (!res.ok) throw new Error("Failed to fetch academic year terms");
      const data: TermRow[] = await res.json();
      setRows(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCampuses = async () => {
    try {
      const res = await fetch(`${API}/api/campuses`);
      if (!res.ok) throw new Error("Failed to fetch campuses");
      const data: CampusRow[] = await res.json();
      setCampuses(data);
      setFormData((prev) => {
        if (prev.campus?.trim()) return prev;
        return { ...prev, campus: data[0]?.acronym || prev.campus };
      });
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchRows();
    fetchCampuses();
  }, []);

  const toInputDate = (value?: string | null) => (value ? String(value).slice(0, 10) : "");

  useEffect(() => {
    if (!selected) return;
    setFormData({
      campus: selected.campus || "PSU Narra",
      academic_year: selected.academic_year || "",
      term: selected.term || "",
      start_date: toInputDate(selected.start_date),
      end_date: toInputDate(selected.end_date),
      locked: !!selected.locked,
      hidden: !!selected.hidden,
      enrollment_start: toInputDate(selected.enrollment_start),
      enrollment_end: toInputDate(selected.enrollment_end),
      late_enrolment_date: toInputDate(selected.late_enrolment_date),
      add_change_start: toInputDate(selected.add_change_start),
      add_change_end: toInputDate(selected.add_change_end),
      dropping_start: toInputDate(selected.dropping_start),
      dropping_end: toInputDate(selected.dropping_end),
      incomplete_due_date: toInputDate(selected.incomplete_due_date),
      encoding_first_start: toInputDate(selected.encoding_first_start),
      encoding_first_end: toInputDate(selected.encoding_first_end),
      encoding_second_start: toInputDate(selected.encoding_second_start),
      encoding_second_end: toInputDate(selected.encoding_second_end),
      encoding_third_start: toInputDate(selected.encoding_third_start),
      encoding_third_end: toInputDate(selected.encoding_third_end),
      encoding_fourth_start: toInputDate(selected.encoding_fourth_start),
      encoding_fourth_end: toInputDate(selected.encoding_fourth_end),
    });
  }, [selected]);

  const updateForm = (patch: Partial<TermPayload>) => {
    setFormData((prev) => ({ ...prev, ...patch }));
  };

  const campusOptionValues = useMemo(() => {
    const values = campuses.map((c) => c.acronym);
    const current = formData.campus?.trim();
    if (current && !values.includes(current)) values.unshift(current);
    return values;
  }, [campuses, formData.campus]);

  const handleNew = () => {
    setSelectedId(null);
    setFormData(emptyForm);
  };

  const handleSave = async () => {
    if (!formData.academic_year.trim() || !formData.term.trim()) {
      toast({
        title: "Validation error",
        description: "Academic year and term are required.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const url = selectedId
        ? `${API}/api/academic-year-terms/${selectedId}`
        : `${API}/api/academic-year-terms`;
      const method = selectedId ? "PUT" : "POST";
      const payload = {
        ...formData,
        campus: formData.campus?.trim() || null,
        academic_year: formData.academic_year.trim(),
        term: formData.term.trim(),
      };
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(result?.error || "Save failed");
      setSelectedId(result.id);
      toast({ title: "Saved", description: "Academic year/term saved successfully." });
      await fetchRows();
    } catch (err) {
      toast({
        title: "Save failed",
        description: err instanceof Error ? err.message : "Save failed",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const deleteSelected = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const res = await fetch(`${API}/api/academic-year-terms/${selected.id}`, {
        method: "DELETE",
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(result?.error || "Delete failed");
      setSelectedId(null);
      setFormData(emptyForm);
      toast({ title: "Deleted", description: "Academic year/term deleted successfully." });
      await fetchRows();
    } catch (err) {
      toast({
        title: "Delete failed",
        description: err instanceof Error ? err.message : "Delete failed",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="h-full bg-background relative overflow-x-hidden">

      <div className="w-full px-2 pt-2 pb-4">
        <Card className="w-full overflow-hidden rounded-2xl border border-border/60 bg-background shadow-[0_12px_40px_-24px_rgba(2,6,23,0.45)]">
          <CardHeader className="border-b border-border/60 bg-muted/5 pb-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-600 text-white shadow-sm">
                  <BookOpen className="h-5 w-5" />
                </div>
                <div className="space-y-0.5">
                  <CardTitle className="text-base font-semibold tracking-tight">
                    Academic Year & Terms
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">
                    Setup manager • Term windows and deadlines
                  </p>
                </div>
              </div>

              <div className="hidden sm:flex items-center gap-2">
                <Badge variant="secondary" className="rounded-xl">
                  Setup
                </Badge>
                {selectedId ? (
                  <Badge className="rounded-xl bg-emerald-600 text-white hover:bg-emerald-600">
                    Editing
                  </Badge>
                ) : (
                  <Badge variant="outline" className="rounded-xl">
                    New
                  </Badge>
                )}
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 rounded-xl"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-[28rem_minmax(0,1fr)] xl:grid-cols-[30rem_minmax(0,1fr)] gap-6 lg:min-h-[calc(100svh-14.5rem)]">
              {/* Left: editor */}
              <Card className="rounded-2xl border-border/60 overflow-hidden">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-0.5">
                      <p className="text-sm font-semibold tracking-tight">Term details</p>
                      <p className="text-xs text-muted-foreground">
                        {selectedId ? "Update the selected term window." : "Create a new academic year/term."}
                      </p>
                    </div>
                    <div className="flex gap-2">
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
                        variant="outline"
                        onClick={handleNew}
                        disabled={saving}
                        className="h-9 rounded-xl text-xs font-semibold gap-2"
                      >
                        <Plus className="h-4 w-4" />
                        New
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
                          <span className="font-semibold text-foreground">Campus & term</span>
                        </div>
                        <Separator />

                        <div className="space-y-1.5">
                          <Label className="text-[11px] text-muted-foreground">Campus</Label>
                          <Select
                            value={formData.campus?.trim() || "__none__"}
                            onValueChange={(v) => updateForm({ campus: v === "__none__" ? "" : v })}
                          >
                            <SelectTrigger className="h-9 rounded-xl text-xs border-border/60 shadow-sm">
                              <SelectValue placeholder="Select campus" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="__none__">Select campus</SelectItem>
                              {campusOptionValues.map((acronym) => (
                                <SelectItem key={acronym} value={acronym}>
                                  {(() => {
                                    const c = campuses.find((row) => row.acronym === acronym);
                                    return c?.campus_name ? `${c.acronym} - ${c.campus_name}` : acronym;
                                  })()}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <Label className="text-[11px] text-muted-foreground">Academic year</Label>
                            <Input
                              className="h-9 rounded-xl text-xs border-border/60 shadow-sm"
                              value={formData.academic_year}
                              onChange={(e) => updateForm({ academic_year: e.target.value })}
                              placeholder="e.g. 2026-2027"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-[11px] text-muted-foreground">Term</Label>
                            <Select value={formData.term} onValueChange={(v) => updateForm({ term: v })}>
                              <SelectTrigger className="h-9 rounded-xl text-xs border-border/60 shadow-sm">
                                <SelectValue placeholder="Select term" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="1st Semester">1st Semester</SelectItem>
                                <SelectItem value="2nd Semester">2nd Semester</SelectItem>
                                <SelectItem value="3rd Term">3rd Term</SelectItem>
                                <SelectItem value="Summer">Summer</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <CalendarRange className="h-4 w-4" />
                            <span className="font-semibold text-foreground">Period</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Lock className="h-4 w-4 text-amber-500" />
                            <span>Locked</span>
                            <Checkbox
                              checked={formData.locked}
                              onCheckedChange={(v) => updateForm({ locked: !!v })}
                            />
                          </div>
                        </div>
                        <Separator />
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <Label className="text-[11px] text-muted-foreground">Start</Label>
                            <Input
                              type="date"
                              className="h-9 rounded-xl text-xs border-border/60 shadow-sm"
                              value={formData.start_date}
                              onChange={(e) => updateForm({ start_date: e.target.value })}
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-[11px] text-muted-foreground">End</Label>
                            <Input
                              type="date"
                              className="h-9 rounded-xl text-xs border-border/60 shadow-sm"
                              value={formData.end_date}
                              onChange={(e) => updateForm({ end_date: e.target.value })}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <p className="text-sm font-semibold tracking-tight">Enrollment</p>
                        <Separator />
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <Label className="text-[11px] text-muted-foreground">Enrollment start</Label>
                            <Input
                              type="date"
                              className="h-9 rounded-xl text-xs border-border/60 shadow-sm"
                              value={formData.enrollment_start || ""}
                              onChange={(e) => updateForm({ enrollment_start: e.target.value })}
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-[11px] text-muted-foreground">Enrollment end</Label>
                            <Input
                              type="date"
                              className="h-9 rounded-xl text-xs border-border/60 shadow-sm"
                              value={formData.enrollment_end || ""}
                              onChange={(e) => updateForm({ enrollment_end: e.target.value })}
                            />
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-[11px] text-muted-foreground">Late enrollment date</Label>
                          <Input
                            type="date"
                            className="h-9 rounded-xl text-xs border-border/60 shadow-sm"
                            value={formData.late_enrolment_date || ""}
                            onChange={(e) => updateForm({ late_enrolment_date: e.target.value })}
                          />
                          <p className="text-[11px] text-muted-foreground/80">
                            Beyond this date, registration is considered late.
                          </p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <p className="text-sm font-semibold tracking-tight">Add / Drop / Incomplete</p>
                        <Separator />
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <Label className="text-[11px] text-muted-foreground">Add/Change start</Label>
                            <Input
                              type="date"
                              className="h-9 rounded-xl text-xs border-border/60 shadow-sm"
                              value={formData.add_change_start || ""}
                              onChange={(e) => updateForm({ add_change_start: e.target.value })}
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-[11px] text-muted-foreground">Add/Change end</Label>
                            <Input
                              type="date"
                              className="h-9 rounded-xl text-xs border-border/60 shadow-sm"
                              value={formData.add_change_end || ""}
                              onChange={(e) => updateForm({ add_change_end: e.target.value })}
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-[11px] text-muted-foreground">Dropping start</Label>
                            <Input
                              type="date"
                              className="h-9 rounded-xl text-xs border-border/60 shadow-sm"
                              value={formData.dropping_start || ""}
                              onChange={(e) => updateForm({ dropping_start: e.target.value })}
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-[11px] text-muted-foreground">Dropping end</Label>
                            <Input
                              type="date"
                              className="h-9 rounded-xl text-xs border-border/60 shadow-sm"
                              value={formData.dropping_end || ""}
                              onChange={(e) => updateForm({ dropping_end: e.target.value })}
                            />
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-[11px] text-muted-foreground">Incomplete grades due</Label>
                          <Input
                            type="date"
                            className="h-9 rounded-xl text-xs border-border/60 shadow-sm"
                            value={formData.incomplete_due_date || ""}
                            onChange={(e) => updateForm({ incomplete_due_date: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className="space-y-3">
                        <p className="text-sm font-semibold tracking-tight">Encoding of grades</p>
                        <Separator />
                        <div className="space-y-3">
                          {[
                            { key: "first", label: "First" },
                            { key: "second", label: "Second" },
                            { key: "third", label: "Third" },
                            { key: "fourth", label: "Fourth" },
                          ].map((period) => (
                            <div key={period.key} className="grid grid-cols-1 sm:grid-cols-[5rem_1fr_1fr] gap-2 items-center">
                              <span className="text-xs text-muted-foreground font-medium">{period.label}</span>
                              <Input
                                type="date"
                                className="h-9 rounded-xl text-xs border-border/60 shadow-sm"
                                value={(formData as any)[`encoding_${period.key}_start`] || ""}
                                onChange={(e) => updateForm({ [`encoding_${period.key}_start`]: e.target.value } as any)}
                              />
                              <Input
                                type="date"
                                className="h-9 rounded-xl text-xs border-border/60 shadow-sm"
                                value={(formData as any)[`encoding_${period.key}_end`] || ""}
                                onChange={(e) => updateForm({ [`encoding_${period.key}_end`]: e.target.value } as any)}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Right: list */}
              <Card className="rounded-2xl border-border/60 overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="space-y-0.5">
                      <p className="text-sm font-semibold tracking-tight">Records</p>
                      <p className="text-xs text-muted-foreground">
                        {visibleRows.length} shown • {rows.length} total
                      </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2">
                      <div className="relative">
                        <Search className="h-4 w-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                        <Input
                          value={query}
                          onChange={(e) => setQuery(e.target.value)}
                          placeholder="Search year, term, campus…"
                          className="h-9 rounded-xl pl-9 border-border/60 shadow-sm w-full sm:w-[18rem]"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        className="h-9 rounded-xl text-xs font-semibold gap-2"
                        disabled={!selectedId}
                        onClick={() => {
                          if (!selected) return;
                          updateForm({ hidden: !formData.hidden });
                          setTimeout(() => handleSave(), 0);
                        }}
                      >
                        {formData.hidden ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                        {formData.hidden ? "Unhide" : "Hide"}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="h-9 rounded-xl text-xs font-semibold gap-2 hover:bg-destructive/10 hover:text-destructive"
                        onClick={deleteSelected}
                        disabled={saving || !selectedId}
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </Button>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {[
                      { key: "all", label: "All" },
                      { key: "active", label: "Active" },
                      { key: "hidden", label: "Hidden" },
                      { key: "locked", label: "Locked" },
                    ].map((tab) => (
                      <Button
                        key={tab.key}
                        type="button"
                        size="sm"
                        variant={activeFilter === tab.key ? "default" : "outline"}
                        className={cn(
                          "h-8 rounded-xl text-xs font-semibold px-3",
                          activeFilter === tab.key && "bg-emerald-600 hover:bg-emerald-700"
                        )}
                        onClick={() => setActiveFilter(tab.key as typeof activeFilter)}
                      >
                        {tab.label}
                      </Button>
                    ))}
                  </div>
                </CardHeader>

                <CardContent className="pt-0">
                  <div className="grid grid-cols-12 bg-muted/40 text-[11px] font-semibold text-muted-foreground border border-border/60 rounded-xl overflow-hidden shadow-sm">
                    <div className="col-span-3 px-3 py-2 border-r border-border/60">Academic Year</div>
                    <div className="col-span-3 px-3 py-2 border-r border-border/60">Term</div>
                    <div className="col-span-2 px-3 py-2 border-r border-border/60">Start</div>
                    <div className="col-span-2 px-3 py-2 border-r border-border/60">End</div>
                    <div className="col-span-2 px-3 py-2">Locked</div>
                  </div>
                  <div className="mt-2 border border-border/60 rounded-2xl overflow-hidden">
                    <ScrollArea className="h-[calc(100svh-24rem)] lg:h-[calc(100svh-20.5rem)] min-h-120">
                      {loading && (
                        <div className="px-4 py-8 text-sm text-muted-foreground">
                          Loading records…
                        </div>
                      )}
                      {!loading && visibleRows.length === 0 && (
                        <div className="px-4 py-10 text-center">
                          <p className="text-sm font-semibold">No records</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Create a new academic year/term to get started.
                          </p>
                        </div>
                      )}
                      {!loading &&
                        visibleRows.map((row, idx) => (
                          <button
                            key={row.id}
                            type="button"
                            onClick={() => setSelectedId(row.id)}
                            className={cn(
                              "w-full grid grid-cols-12 text-left text-xs border-b border-border/40 transition-colors pr-6",
                              selectedId === row.id
                                ? "bg-emerald-500/10"
                                : idx % 2 === 0
                                  ? "bg-background hover:bg-muted/40"
                                  : "bg-muted/10 hover:bg-muted/40"
                            )}
                          >
                            <div className="col-span-3 px-3 py-2 border-r border-border/40 truncate">
                              {row.academic_year}
                            </div>
                            <div className="col-span-3 px-3 py-2 border-r border-border/40 truncate">
                              {row.term}
                            </div>
                            <div className="col-span-2 px-3 py-2 border-r border-border/40">
                              {row.start_date ? String(row.start_date).slice(0, 10) : ""}
                            </div>
                            <div className="col-span-2 px-3 py-2 border-r border-border/40">
                              {row.end_date ? String(row.end_date).slice(0, 10) : ""}
                            </div>
                            <div className="col-span-2 px-3 py-2">
                              {row.locked ? "Yes" : "No"}
                            </div>
                          </button>
                        ))}
                    </ScrollArea>
                  </div>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
