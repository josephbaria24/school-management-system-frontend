"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL;

type GradeLevelKey =
  | "pre_school"
  | "grade_school_1_6"
  | "grade_school_7_9"
  | "high_school"
  | "school_year"
  | "college"
  | "baccalaureate"
  | "post_baccalaureate"
  | "master"
  | "doctoral";

type FormatKey = "format_1" | "format_2";

type GradeEncodingRow = {
  id: string;
  gradePoint: string;
  equivalence: string;
  letterGrade: string;
  description: string;
  remarks: string;
  disqualifyScholarshipAcademicHonor: boolean;
  hideFromFacultyGradeEncoding: boolean;
  gradesAlsoForFollowingPeriods: boolean;
  hideFromEvaluationForm: boolean;
  hideFromReportOfGrade: boolean;
  credit: boolean;
  compute: boolean;
  hideFinal: boolean;
  hideMidterm: boolean;
  gradesForOtherSchool: boolean;
  gradeAppliesFor: "GENERAL" | "GENERAL STUDIES" | "PSU" | "NO CREDIT";
};

type ApiGradingRow = {
  id: number;
  grade_level: string;
  format_key: string;
  sort_order: number;
  grade_point: string;
  equivalence: string;
  letter_grade: string;
  description: string;
  remarks: string;
  disqualify_scholarship: boolean;
  hide_faculty_encoding: boolean;
  grades_following_periods: boolean;
  hide_evaluation: boolean;
  hide_report_grade: boolean;
  credit_unit: boolean;
  compute_gwa: boolean;
  hide_final: boolean;
  hide_midterm: boolean;
  grades_other_school: boolean;
  grade_applies_for: string;
};

const gradeLevels: Array<{ key: GradeLevelKey; label: string }> = [
  { key: "pre_school", label: "Pre-School" },
  { key: "grade_school_1_6", label: "Grade School 1-6" },
  { key: "grade_school_7_9", label: "Grade School 7-9" },
  { key: "high_school", label: "High School" },
  { key: "school_year", label: "School Year" },
  { key: "college", label: "College" },
  { key: "baccalaureate", label: "Baccalaureate" },
  { key: "post_baccalaureate", label: "Post-Baccalaureate" },
  { key: "master", label: "Master" },
  { key: "doctoral", label: "Doctoral" },
];

const formatKeys: Array<{ key: FormatKey; label: string }> = [
  { key: "format_1", label: "Format 1" },
  { key: "format_2", label: "Format 2" },
];

const appliesOptions = ["GENERAL", "GENERAL STUDIES", "PSU", "NO CREDIT"] as const;

function parseApplies(v: string): GradeEncodingRow["gradeAppliesFor"] {
  if ((appliesOptions as readonly string[]).includes(v)) return v as GradeEncodingRow["gradeAppliesFor"];
  return "GENERAL";
}

function mapDbToClient(r: ApiGradingRow): GradeEncodingRow {
  return {
    id: String(r.id),
    gradePoint: r.grade_point ?? "",
    equivalence: r.equivalence ?? "",
    letterGrade: r.letter_grade ?? "",
    description: r.description ?? "",
    remarks: r.remarks ?? "",
    disqualifyScholarshipAcademicHonor: !!r.disqualify_scholarship,
    hideFromFacultyGradeEncoding: !!r.hide_faculty_encoding,
    gradesAlsoForFollowingPeriods: !!r.grades_following_periods,
    hideFromEvaluationForm: !!r.hide_evaluation,
    hideFromReportOfGrade: !!r.hide_report_grade,
    credit: !!r.credit_unit,
    compute: !!r.compute_gwa,
    hideFinal: !!r.hide_final,
    hideMidterm: !!r.hide_midterm,
    gradesForOtherSchool: !!r.grades_other_school,
    gradeAppliesFor: parseApplies(r.grade_applies_for || "GENERAL"),
  };
}

function mapRowToApiPayload(r: GradeEncodingRow) {
  return {
    grade_point: r.gradePoint,
    equivalence: r.equivalence,
    letter_grade: r.letterGrade,
    description: r.description,
    remarks: r.remarks,
    disqualify_scholarship: r.disqualifyScholarshipAcademicHonor,
    hide_faculty_encoding: r.hideFromFacultyGradeEncoding,
    grades_following_periods: r.gradesAlsoForFollowingPeriods,
    hide_evaluation: r.hideFromEvaluationForm,
    hide_report_grade: r.hideFromReportOfGrade,
    credit_unit: r.credit,
    compute_gwa: r.compute,
    hide_final: r.hideFinal,
    hide_midterm: r.hideMidterm,
    grades_other_school: r.gradesForOtherSchool,
    grade_applies_for: r.gradeAppliesFor,
  };
}

function uid() {
  return `tmp-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function GradingSystemModule() {
  const [activeLevel, setActiveLevel] = useState<GradeLevelKey>("pre_school");
  const [format, setFormat] = useState<FormatKey>("format_1");
  const [defaultFormat, setDefaultFormat] = useState<FormatKey>("format_1");
  const [rows, setRows] = useState<GradeEncodingRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);

  const [form, setForm] = useState<{
    gradePoint: string;
    equivalence: string;
    letterGrade: string;
    description: string;
    remarks: string;
    disqualifyScholarshipAcademicHonor: boolean;
    hideFromFacultyGradeEncoding: boolean;
    gradesAlsoForFollowingPeriods: boolean;
    hideFromEvaluationForm: boolean;
    hideFromReportOfGrade: boolean;
  }>({
    gradePoint: "",
    equivalence: "",
    letterGrade: "",
    description: "",
    remarks: "",
    disqualifyScholarshipAcademicHonor: false,
    hideFromFacultyGradeEncoding: false,
    gradesAlsoForFollowingPeriods: false,
    hideFromEvaluationForm: false,
    hideFromReportOfGrade: false,
  });

  const loadRows = useCallback(async () => {
    if (!API) {
      toast({ title: "API not configured", description: "Set NEXT_PUBLIC_API_URL.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const qs = new URLSearchParams({ gradeLevel: activeLevel, format });
      const res = await fetch(`${API}/api/registrar/grading-system?${qs.toString()}`);
      if (!res.ok) throw new Error(await res.text());
      const data = (await res.json()) as ApiGradingRow[];
      setRows(data.map(mapDbToClient));
      setSelectedRowId(null);
      setForm({
        gradePoint: "",
        equivalence: "",
        letterGrade: "",
        description: "",
        remarks: "",
        disqualifyScholarshipAcademicHonor: false,
        hideFromFacultyGradeEncoding: false,
        gradesAlsoForFollowingPeriods: false,
        hideFromEvaluationForm: false,
        hideFromReportOfGrade: false,
      });
    } catch (e) {
      console.error(e);
      toast({
        title: "Load failed",
        description: e instanceof Error ? e.message : "Could not load grading rows.",
        variant: "destructive",
      });
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [activeLevel, format]);

  useEffect(() => {
    void loadRows();
  }, [loadRows]);

  const selectedRow = useMemo(() => {
    if (!selectedRowId) return null;
    return rows.find((r) => r.id === selectedRowId) ?? null;
  }, [rows, selectedRowId]);

  const applySelectedRowToForm = (row: GradeEncodingRow | null) => {
    if (!row) {
      setForm({
        gradePoint: "",
        equivalence: "",
        letterGrade: "",
        description: "",
        remarks: "",
        disqualifyScholarshipAcademicHonor: false,
        hideFromFacultyGradeEncoding: false,
        gradesAlsoForFollowingPeriods: false,
        hideFromEvaluationForm: false,
        hideFromReportOfGrade: false,
      });
      return;
    }
    setForm({
      gradePoint: row.gradePoint,
      equivalence: row.equivalence,
      letterGrade: row.letterGrade,
      description: row.description,
      remarks: row.remarks,
      disqualifyScholarshipAcademicHonor: row.disqualifyScholarshipAcademicHonor,
      hideFromFacultyGradeEncoding: row.hideFromFacultyGradeEncoding,
      gradesAlsoForFollowingPeriods: row.gradesAlsoForFollowingPeriods,
      hideFromEvaluationForm: row.hideFromEvaluationForm,
      hideFromReportOfGrade: row.hideFromReportOfGrade,
    });
  };

  const persistRows = async (next: GradeEncodingRow[], message = "Saved to database.") => {
    if (!API) {
      toast({ title: "API not configured", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`${API}/api/registrar/grading-system`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gradeLevel: activeLevel,
          format,
          rows: next.map(mapRowToApiPayload),
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = (await res.json()) as ApiGradingRow[];
      const mapped = data.map(mapDbToClient);
      setRows(mapped);
      setSelectedRowId((prev) => {
        if (prev && mapped.some((r) => r.id === prev)) return prev;
        return null;
      });
      toast({ title: "Saved", description: message });
    } catch (e) {
      console.error(e);
      toast({
        title: "Save failed",
        description: e instanceof Error ? e.message : "Could not save grading rows.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleLevelChange = (next: string) => {
    setActiveLevel(next as GradeLevelKey);
  };

  const handleFormatChange = (next: string) => {
    setFormat(next as FormatKey);
  };

  const updateRow = (id: string, patch: Partial<GradeEncodingRow>) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };

  const handleToolbarSave = () => {
    const merged = rows.map((r) =>
      r.id === selectedRowId
        ? {
            ...r,
            gradePoint: form.gradePoint,
            equivalence: form.equivalence,
            letterGrade: form.letterGrade,
            description: form.description,
            remarks: form.remarks,
            disqualifyScholarshipAcademicHonor: form.disqualifyScholarshipAcademicHonor,
            hideFromFacultyGradeEncoding: form.hideFromFacultyGradeEncoding,
            gradesAlsoForFollowingPeriods: form.gradesAlsoForFollowingPeriods,
            hideFromEvaluationForm: form.hideFromEvaluationForm,
            hideFromReportOfGrade: form.hideFromReportOfGrade,
          }
        : r
    );
    void persistRows(merged);
  };

  const addNewRow = () => {
    const row: GradeEncodingRow = {
      id: uid(),
      gradePoint: "",
      equivalence: "",
      letterGrade: "",
      description: "",
      remarks: "",
      disqualifyScholarshipAcademicHonor: false,
      hideFromFacultyGradeEncoding: false,
      gradesAlsoForFollowingPeriods: false,
      hideFromEvaluationForm: false,
      hideFromReportOfGrade: false,
      credit: false,
      compute: false,
      hideFinal: false,
      hideMidterm: false,
      gradesForOtherSchool: false,
      gradeAppliesFor: "GENERAL",
    };
    setRows((prev) => [...prev, row]);
    setSelectedRowId(row.id);
    applySelectedRowToForm(row);
  };

  const deleteSelectedRow = () => {
    if (!selectedRowId) {
      toast({ title: "No row selected", variant: "destructive" });
      return;
    }
    const next = rows.filter((r) => r.id !== selectedRowId);
    setRows(next);
    setSelectedRowId(null);
    applySelectedRowToForm(null);
    void persistRows(next, "Row removed.");
  };

  const selectedRowClass = (rowId: string) => (rowId === selectedRowId ? "bg-emerald-50/70" : undefined);

  return (
    <div className="h-full bg-background overflow-x-hidden">
      <div className="w-full px-2 pt-2 pb-4 space-y-3 h-full min-h-0 flex flex-col">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="setup-type-page-title">Grading System</h1>
            <p className="setup-type-page-desc">Grade point ↔ equivalence ↔ letter grade encoding (database-backed).</p>
          </div>
          <div className="setup-type-kicker-pill hidden sm:flex h-9 items-center rounded-xl border border-border/60 bg-background/70 px-3 shadow-sm">
            Registrar module
          </div>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card shadow-sm overflow-hidden flex flex-col min-h-0">
          <div className="px-3 py-2 border-b border-border/60 bg-muted/20 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Button variant="outline" className="h-8 text-xs" onClick={addNewRow} disabled={saving || loading}>
                New
              </Button>
              <Button variant="outline" className="h-8 text-xs gap-1" onClick={handleToolbarSave} disabled={saving || loading}>
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                Save
              </Button>
              <Button variant="outline" className="h-8 text-xs" disabled>
                Save As
              </Button>
              <Button variant="outline" className="h-8 text-xs" onClick={deleteSelectedRow} disabled={saving || loading}>
                Delete
              </Button>
              <Button variant="outline" className="h-8 text-xs" onClick={() => window.print()}>
                Print
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" className="h-8 text-xs" disabled>
                Close
              </Button>
              <Button variant="outline" className="h-8 text-xs" disabled>
                Help
              </Button>
            </div>
          </div>

          <div className="p-2 min-h-0 flex flex-col relative">
            {loading && (
              <div className="absolute inset-0 z-10 grid place-items-center bg-background/50 rounded-xl">
                <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
              </div>
            )}
            <Tabs value={activeLevel} onValueChange={handleLevelChange} className="w-full">
              <TabsList className="w-fit max-w-max bg-muted/50 p-1 rounded-xl gap-1">
                {gradeLevels.map((l) => (
                  <TabsTrigger
                    key={l.key}
                    value={l.key}
                    className="rounded-lg px-3 text-xs font-semibold data-[state=active]:bg-background data-[state=active]:shadow-sm"
                  >
                    {l.label}
                  </TabsTrigger>
                ))}
              </TabsList>

              <TabsContent value={activeLevel} className="mt-2 min-h-0">
                <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-2 min-h-0 h-full">
                  <div className="rounded-xl border border-border/60 overflow-hidden bg-background flex flex-col min-h-0">
                    <div className="p-2 bg-muted/20 border-b border-border/60">
                      <div className="flex items-center justify-between gap-2">
                        <Tabs value={format} onValueChange={handleFormatChange} className="w-full">
                          <TabsList className="h-8 w-full bg-muted/30 p-0.5 rounded-xl">
                            {formatKeys.map((f) => (
                              <TabsTrigger
                                key={f.key}
                                value={f.key}
                                className="h-7 rounded-lg px-3 text-[11px] font-semibold data-[state=active]:bg-background data-[state=active]:shadow-sm"
                              >
                                {f.label}
                              </TabsTrigger>
                            ))}
                          </TabsList>
                        </Tabs>
                      </div>

                      <div className="flex items-center gap-2 mt-2">
                        <Label className="text-[11px] uppercase text-muted-foreground w-[110px]">Default Format</Label>
                        <Select value={defaultFormat} onValueChange={(v) => setDefaultFormat(v as FormatKey)}>
                          <SelectTrigger className="h-8 rounded-xl text-xs border-border/60 bg-background">
                            <SelectValue placeholder="Default format" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="format_1">DEFAULT FORMAT 1</SelectItem>
                            <SelectItem value="format_2">DEFAULT FORMAT 2</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="p-3 space-y-3 flex-1 min-h-0 overflow-y-auto">
                      <div className="grid grid-cols-1 gap-2">
                        <div className="space-y-1">
                          <Label className="text-[11px] text-muted-foreground uppercase">Grade Point</Label>
                          <Input
                            value={form.gradePoint}
                            onChange={(e) => setForm((p) => ({ ...p, gradePoint: e.target.value }))}
                            className="h-8 rounded-xl text-xs border-border/60"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[11px] text-muted-foreground uppercase">Equivalence</Label>
                          <Input
                            value={form.equivalence}
                            onChange={(e) => setForm((p) => ({ ...p, equivalence: e.target.value }))}
                            className="h-8 rounded-xl text-xs border-border/60"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[11px] text-muted-foreground uppercase">Letter Grade</Label>
                          <Select
                            value={form.letterGrade}
                            onValueChange={(v) => setForm((p) => ({ ...p, letterGrade: v }))}
                          >
                            <SelectTrigger className="h-8 rounded-xl text-xs border-border/60 bg-background">
                              <SelectValue placeholder="Select letter grade" />
                            </SelectTrigger>
                            <SelectContent>
                              {["A", "B", "C", "D", "E", "F", "RE-ENROLLED", "INC", "NC"].map((x) => (
                                <SelectItem key={x} value={x}>
                                  {x}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[11px] text-muted-foreground uppercase">Description</Label>
                          <Select
                            value={form.description}
                            onValueChange={(v) => setForm((p) => ({ ...p, description: v }))}
                          >
                            <SelectTrigger className="h-8 rounded-xl text-xs border-border/60 bg-background">
                              <SelectValue placeholder="Select description" />
                            </SelectTrigger>
                            <SelectContent>
                              {[
                                "Excellent",
                                "Satisfactory",
                                "Passing",
                                "Conditional Failure",
                                "Incomplete",
                                "No Credit",
                                "Re-enrolled",
                              ].map((x) => (
                                <SelectItem key={x} value={x}>
                                  {x}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[11px] text-muted-foreground uppercase">Remarks</Label>
                          <Select
                            value={form.remarks}
                            onValueChange={(v) => setForm((p) => ({ ...p, remarks: v }))}
                          >
                            <SelectTrigger className="h-8 rounded-xl text-xs border-border/60 bg-background">
                              <SelectValue placeholder="Select remarks" />
                            </SelectTrigger>
                            <SelectContent>
                              {[
                                "Passed",
                                "Conditional",
                                "Failure",
                                "Incomplete",
                                "No Credit",
                                "RE-ENROLLED",
                                "Officially Dropped",
                                "Unofficially Dropped",
                              ].map((x) => (
                                <SelectItem key={x} value={x}>
                                  {x}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        {selectedRow && (
                          <div className="space-y-1">
                            <Label className="text-[11px] text-muted-foreground uppercase">Apply for</Label>
                            <Select
                              value={selectedRow.gradeAppliesFor}
                              onValueChange={(v) =>
                                updateRow(selectedRow.id, { gradeAppliesFor: parseApplies(v) })
                              }
                            >
                              <SelectTrigger className="h-8 rounded-xl text-xs border-border/60 bg-background">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {appliesOptions.map((x) => (
                                  <SelectItem key={x} value={x}>
                                    {x}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2 pt-1 border-t border-border/60">
                        <Label className="text-[11px] text-muted-foreground uppercase">Visibility / Eligibility</Label>
                        <div className="space-y-2">
                          {(
                            [
                              ["disqualifyScholarshipAcademicHonor", "Disqualify Scholarship/Academic Honor"],
                              ["hideFromFacultyGradeEncoding", "Hide this Grade from Faculty Grade Encoding"],
                              ["gradesAlsoForFollowingPeriods", "Grades also for the following periods"],
                              ["hideFromEvaluationForm", "Hide this Grade from Evaluation Form"],
                              ["hideFromReportOfGrade", "Hide this Grade from Report of Grade"],
                            ] as const
                          ).map(([key, label]) => (
                            <div key={key} className="flex items-center gap-2 text-xs">
                              <Checkbox
                                checked={form[key]}
                                onCheckedChange={(v) => setForm((p) => ({ ...p, [key]: Boolean(v) }))}
                              />
                              {label}
                            </div>
                          ))}
                        </div>
                        <div className="pt-1 text-[11px] text-muted-foreground leading-relaxed">
                          To qualify any of the scholarships or academic honor, no grade of incomplete on low grade in
                          any academic year.
                        </div>
                      </div>

                      <div className="pt-2 inline-flex flex-wrap gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs"
                          onClick={() => {
                            setSelectedRowId(null);
                            applySelectedRowToForm(null);
                          }}
                        >
                          New
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs gap-1"
                          onClick={handleToolbarSave}
                          disabled={saving || loading}
                        >
                          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                          Save
                        </Button>
                        <Button variant="outline" size="sm" className="h-8 text-xs" disabled>
                          Save As
                        </Button>
                        <Button variant="outline" size="sm" className="h-8 text-xs" onClick={deleteSelectedRow} disabled={saving}>
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-border/60 bg-background overflow-hidden flex flex-col min-h-0">
                    <div className="p-2 border-b border-border/60 bg-muted/20 flex items-center justify-between gap-2">
                      <div className="text-xs font-semibold text-muted-foreground">Grade Encoding Grid</div>
                      <div className="text-[11px] text-muted-foreground">
                        {rows.length} records • {activeLevel.replaceAll("_", " ")}
                      </div>
                    </div>

                    <ScrollArea className="flex-1 min-h-0">
                      <div className="min-w-max">
                        <table className="w-full border-separate border-spacing-0 text-xs">
                          <thead>
                            <tr className="bg-muted/40 text-[11px] uppercase text-muted-foreground">
                              <th className="px-2 py-2 border-r border-border/60 text-left">Grade Point</th>
                              <th className="px-2 py-2 border-r border-border/60 text-left">Equivalence</th>
                              <th className="px-2 py-2 border-r border-border/60 text-left">Letter Grade</th>
                              <th className="px-2 py-2 border-r border-border/60 text-left">Description</th>
                              <th className="px-2 py-2 border-r border-border/60 text-left">Remarks</th>
                              <th className="px-2 py-2 border-r border-border/60 text-center">Credit</th>
                              <th className="px-2 py-2 border-r border-border/60 text-center">Compute</th>
                              <th className="px-2 py-2 border-r border-border/60 text-center">Hide Midterm</th>
                              <th className="px-2 py-2 border-r border-border/60 text-center">Hide Final</th>
                              <th className="px-2 py-2 border-r border-border/60 text-center">Other School</th>
                              <th className="px-2 py-2 text-left">Apply For</th>
                            </tr>
                          </thead>
                          <tbody>
                            {rows.map((r) => (
                              <tr
                                key={r.id}
                                className={cn(
                                  "cursor-pointer border-t border-border/40",
                                  selectedRowClass(r.id),
                                  "hover:bg-muted/30"
                                )}
                                onClick={() => {
                                  setSelectedRowId(r.id);
                                  applySelectedRowToForm(r);
                                }}
                              >
                                <td className="px-2 py-2 border-r border-border/40 font-mono">{r.gradePoint}</td>
                                <td className="px-2 py-2 border-r border-border/40">{r.equivalence}</td>
                                <td className="px-2 py-2 border-r border-border/40">{r.letterGrade}</td>
                                <td className="px-2 py-2 border-r border-border/40">{r.description}</td>
                                <td className="px-2 py-2 border-r border-border/40">{r.remarks}</td>
                                <td className="px-2 py-2 border-r border-border/40 text-center">
                                  <Checkbox
                                    checked={r.credit}
                                    onCheckedChange={(v) => updateRow(r.id, { credit: Boolean(v) })}
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                </td>
                                <td className="px-2 py-2 border-r border-border/40 text-center">
                                  <Checkbox
                                    checked={r.compute}
                                    onCheckedChange={(v) => updateRow(r.id, { compute: Boolean(v) })}
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                </td>
                                <td className="px-2 py-2 border-r border-border/40 text-center">
                                  <Checkbox
                                    checked={r.hideMidterm}
                                    onCheckedChange={(v) => updateRow(r.id, { hideMidterm: Boolean(v) })}
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                </td>
                                <td className="px-2 py-2 border-r border-border/40 text-center">
                                  <Checkbox
                                    checked={r.hideFinal}
                                    onCheckedChange={(v) => updateRow(r.id, { hideFinal: Boolean(v) })}
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                </td>
                                <td className="px-2 py-2 border-r border-border/40 text-center">
                                  <Checkbox
                                    checked={r.gradesForOtherSchool}
                                    onCheckedChange={(v) => updateRow(r.id, { gradesForOtherSchool: Boolean(v) })}
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                </td>
                                <td className="px-2 py-2">{r.gradeAppliesFor}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </ScrollArea>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}
