"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { BookOpen, Lock, Plus, Save, Pencil, Trash2, X } from "lucide-react";
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
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [formData, setFormData] = useState<TermPayload>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeFilter, setActiveFilter] = useState<"all" | "active" | "hidden" | "locked">("all");

  const selected = useMemo(
    () => rows.find((r) => r.id === selectedId) ?? null,
    [rows, selectedId]
  );

  const visibleRows = useMemo(() => {
    if (activeFilter === "all") return rows;
    if (activeFilter === "locked") return rows.filter((r) => r.locked);
    if (activeFilter === "hidden") return rows.filter((r) => !!r.hidden);
    return rows.filter((r) => !r.locked && !r.hidden);
  }, [rows, activeFilter]);

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

  useEffect(() => {
    fetchRows();
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
      <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-primary/5 to-transparent -z-10" />
      <div className="absolute top-48 -right-48 w-96 h-96 bg-primary/10 rounded-full blur-[100px] -z-10" />
      <div className="absolute bottom-48 -left-48 w-96 h-96 bg-emerald-500/10 rounded-full blur-[100px] -z-10" />

      <div className="w-full px-2 pt-2 pb-4">
        <Card className="w-full border-2 border-primary/20 shadow-2xl rounded-md overflow-hidden bg-slate-50 dark:bg-slate-900">
          <div className="bg-emerald-700 dark:bg-emerald-900 text-white px-4 py-1.5 flex items-center justify-between border-b border-primary/30">
            <div className="flex items-center gap-2">
              <div className="bg-white dark:bg-slate-100 p-0.5 rounded-sm">
                <BookOpen className="h-4 w-4 text-emerald-700 dark:text-emerald-900" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider">Academic Year and Terms</span>
            </div>
            <div className="w-4 h-4 rounded-sm bg-destructive/80 hover:bg-destructive cursor-pointer flex items-center justify-center">
              <X className="h-3 w-3" />
            </div>
          </div>

          <div className="p-3 bg-white/70 dark:bg-slate-950/60 h-[640px]">
            <div className="grid grid-cols-12 gap-3 h-[580px]">
              <div className="col-span-4 space-y-3 overflow-y-auto pr-1">
                <div className="border border-border rounded-sm overflow-hidden bg-background">
                  <div className="bg-slate-200 dark:bg-slate-800 px-2 py-1 text-[10px] font-bold uppercase tracking-wider">Select the Campus</div>
                  <div className="p-2">
                    <Select
                      value={formData.campus || "PSU Narra"}
                      onValueChange={(v) => updateForm({ campus: v })}
                    >
                      <SelectTrigger className="h-7 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="psu-narra">PSU Narra</SelectItem>
                        <SelectItem value="psu-main">PSU Main</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="border border-border rounded-sm overflow-hidden bg-background">
                  <div className="bg-slate-200 dark:bg-slate-800 px-2 py-1 text-[10px] font-bold uppercase tracking-wider">Period of This Academic Year/Term</div>
                  <div className="p-3 space-y-2">
                    <div className="grid grid-cols-3 gap-2 items-center">
                      <Label className="text-xs">Academic Year</Label>
                      <Input
                        className="col-span-2 h-7 text-xs"
                        value={formData.academic_year}
                        onChange={(e) => updateForm({ academic_year: e.target.value })}
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-2 items-center">
                      <Label className="text-xs">School Term</Label>
                      <Select value={formData.term} onValueChange={(v) => updateForm({ term: v })}>
                        <SelectTrigger className="col-span-2 h-7 text-xs">
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

                <div className="border border-border rounded-sm overflow-hidden bg-background">
                  <div className="bg-slate-200 dark:bg-slate-800 px-2 py-1 text-[10px] font-bold uppercase tracking-wider">Period</div>
                  <div className="p-3 grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">Start</Label>
                      <Input
                        type="date"
                        className="h-7 text-xs"
                        value={formData.start_date}
                        onChange={(e) => updateForm({ start_date: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">End</Label>
                      <Input
                        type="date"
                        className="h-7 text-xs"
                        value={formData.end_date}
                        onChange={(e) => updateForm({ end_date: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div className="border border-border rounded-sm overflow-hidden bg-background">
                  <div className="bg-slate-200 dark:bg-slate-800 px-2 py-1 text-[10px] font-bold uppercase tracking-wider">Status</div>
                  <div className="p-3 flex items-center justify-between text-xs">
                    <span className="text-xs inline-flex items-center gap-2">
                      <Lock className="h-3.5 w-3.5 text-amber-500" />
                      Locked
                    </span>
                    <Checkbox
                      checked={formData.locked}
                      onCheckedChange={(v) => updateForm({ locked: !!v })}
                    />
                  </div>
                </div>

                <div className="border border-border rounded-sm overflow-hidden bg-background">
                  <div className="bg-slate-200 dark:bg-slate-800 px-2 py-1 text-[10px] font-bold uppercase tracking-wider">Enrollment Period</div>
                  <div className="p-2 grid grid-cols-2 gap-2 items-end">
                    <div>
                      <Label className="text-xs">Start</Label>
                      <Input
                        type="date"
                        className="h-7 text-xs"
                        value={formData.enrollment_start || ""}
                        onChange={(e) => updateForm({ enrollment_start: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">End</Label>
                      <Input
                        type="date"
                        className="h-7 text-xs"
                        value={formData.enrollment_end || ""}
                        onChange={(e) => updateForm({ enrollment_end: e.target.value })}
                      />
                    </div>
                    <p className="col-span-2 text-[10px] text-muted-foreground">Registration will only be effective during the above dates.</p>
                  </div>
                </div>

                <div className="border border-border rounded-sm overflow-hidden bg-background">
                  <div className="bg-slate-200 dark:bg-slate-800 px-2 py-1 text-[10px] font-bold uppercase tracking-wider">Late Enrolment Date</div>
                  <div className="p-2 space-y-1">
                    <Input
                      type="date"
                      className="h-7 text-xs"
                      value={formData.late_enrolment_date || ""}
                      onChange={(e) => updateForm({ late_enrolment_date: e.target.value })}
                    />
                    <p className="text-[10px] text-muted-foreground">
                      All Certificate of Registration which falls past this date shall be classed as Late Enrollment.
                    </p>
                  </div>
                </div>

                <div className="border border-border rounded-sm overflow-hidden bg-background">
                  <div className="bg-slate-200 dark:bg-slate-800 px-2 py-1 text-[10px] font-bold uppercase tracking-wider">Add/Change Subject(s) Period</div>
                  <div className="p-2 grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">Start</Label>
                      <Input
                        type="date"
                        className="h-7 text-xs"
                        value={formData.add_change_start || ""}
                        onChange={(e) => updateForm({ add_change_start: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">End</Label>
                      <Input
                        type="date"
                        className="h-7 text-xs"
                        value={formData.add_change_end || ""}
                        onChange={(e) => updateForm({ add_change_end: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div className="border border-border rounded-sm overflow-hidden bg-background">
                  <div className="bg-slate-200 dark:bg-slate-800 px-2 py-1 text-[10px] font-bold uppercase tracking-wider">Dropping of Subject(s) Period</div>
                  <div className="p-2 grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">Start</Label>
                      <Input
                        type="date"
                        className="h-7 text-xs"
                        value={formData.dropping_start || ""}
                        onChange={(e) => updateForm({ dropping_start: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">End</Label>
                      <Input
                        type="date"
                        className="h-7 text-xs"
                        value={formData.dropping_end || ""}
                        onChange={(e) => updateForm({ dropping_end: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div className="border border-border rounded-sm overflow-hidden bg-background">
                  <div className="bg-slate-200 dark:bg-slate-800 px-2 py-1 text-[10px] font-bold uppercase tracking-wider">Due Date for Incomplete Grades</div>
                  <div className="p-2 space-y-2">
                    <Input
                      type="date"
                      className="h-7 text-xs"
                      value={formData.incomplete_due_date || ""}
                      onChange={(e) => updateForm({ incomplete_due_date: e.target.value })}
                    />
                    <p className="text-[10px] text-muted-foreground">
                      All incomplete INC grades in this semester will turn to failing when beyond this date.
                    </p>
                  </div>
                </div>

                <div className="border border-border rounded-sm overflow-hidden bg-background">
                  <div className="bg-slate-200 dark:bg-slate-800 px-2 py-1 text-[10px] font-bold uppercase tracking-wider">Encoding of Grades</div>
                  <div className="p-2 space-y-2">
                    {[
                      { key: "first", label: "First" },
                      { key: "second", label: "Second" },
                      { key: "third", label: "Third" },
                      { key: "fourth", label: "Fourth" },
                    ].map((period) => (
                      <div key={period.key} className="grid grid-cols-12 gap-2 items-center">
                        <span className="col-span-3 text-xs">{period.label}:</span>
                        <Input
                          type="date"
                          className="col-span-4 h-7 text-xs"
                          value={(formData as any)[`encoding_${period.key}_start`] || ""}
                          onChange={(e) => updateForm({ [`encoding_${period.key}_start`]: e.target.value } as any)}
                        />
                        <Input
                          type="date"
                          className="col-span-5 h-7 text-xs"
                          value={(formData as any)[`encoding_${period.key}_end`] || ""}
                          onChange={(e) => updateForm({ [`encoding_${period.key}_end`]: e.target.value } as any)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="col-span-8 border border-border rounded-sm overflow-hidden bg-background h-full">
                <div className="px-2 py-1 border-b border-border/60 bg-slate-100 dark:bg-slate-900 flex items-center gap-2">
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
                      className="h-6 text-[10px] px-3"
                      onClick={() => setActiveFilter(tab.key as typeof activeFilter)}
                    >
                      {tab.label}
                    </Button>
                  ))}
                </div>
                <div className="grid grid-cols-12 bg-emerald-500 dark:bg-emerald-800 text-white text-[10px] font-bold uppercase">
                  <div className="col-span-3 px-2 py-1 border-r border-white/30">Academic Year</div>
                  <div className="col-span-3 px-2 py-1 border-r border-white/30">Term</div>
                  <div className="col-span-2 px-2 py-1 border-r border-white/30">Start</div>
                  <div className="col-span-2 px-2 py-1 border-r border-white/30">End</div>
                  <div className="col-span-2 px-2 py-1">Lock</div>
                </div>
                <div className="h-[530px] overflow-auto">
                  {(loading ? [] : visibleRows).map((row) => (
                    <button
                      key={row.id}
                      type="button"
                      onClick={() => setSelectedId(row.id)}
                      className={`w-full grid grid-cols-12 text-left text-xs border-b border-border/60 ${
                        selectedId === row.id ? "bg-emerald-50 dark:bg-emerald-950/40" : "hover:bg-muted/50"
                      }`}
                    >
                      <div className="col-span-3 px-2 py-1.5 border-r border-border/60 truncate">{row.academic_year}</div>
                      <div className="col-span-3 px-2 py-1.5 border-r border-border/60 truncate">{row.term}</div>
                      <div className="col-span-2 px-2 py-1.5 border-r border-border/60">{row.start_date ? String(row.start_date).slice(0, 10) : ""}</div>
                      <div className="col-span-2 px-2 py-1.5 border-r border-border/60">{row.end_date ? String(row.end_date).slice(0, 10) : ""}</div>
                      <div className="col-span-2 px-2 py-1.5">{row.locked ? "Yes" : "No"}</div>
                    </button>
                  ))}
                  {loading && (
                    <div className="px-3 py-6 text-xs text-muted-foreground">Loading records...</div>
                  )}
                  {!loading && visibleRows.length === 0 && (
                    <div className="px-3 py-6 text-xs text-muted-foreground">No records yet.</div>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-3 flex items-center justify-end gap-2">
              <Button type="button" variant="outline" size="sm" className="h-8 text-xs gap-1.5" onClick={handleSave} disabled={saving}>
                <Save className="h-3.5 w-3.5" />
                Save
              </Button>
              <Button type="button" variant="outline" size="sm" className="h-8 text-xs gap-1.5" onClick={handleNew} disabled={saving}>
                <Plus className="h-3.5 w-3.5" />
                New
              </Button>
              <Button type="button" variant="outline" size="sm" className="h-8 text-xs gap-1.5" onClick={handleSave} disabled={saving}>
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </Button>
              <Button type="button" variant="outline" size="sm" className="h-8 text-xs gap-1.5" onClick={deleteSelected} disabled={saving || !selectedId}>
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 text-xs"
                disabled={!selectedId}
                onClick={() => {
                  if (!selected) return;
                  updateForm({ hidden: !formData.hidden });
                  setTimeout(() => handleSave(), 0);
                }}
              >
                {formData.hidden ? "Unhide" : "Hide"}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
