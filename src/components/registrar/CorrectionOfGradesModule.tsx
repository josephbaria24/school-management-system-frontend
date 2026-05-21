"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { computeCorrectionMetrics, type GradingRowLike } from "@/lib/correctionMetrics";
import { FileEdit, Loader2, LogOut, Printer, RotateCcw, Save, Search } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL;

type YearTerm = { id: number; academic_year: string; term: string };

type EnrollmentSnapshot = {
  student_name: string | null;
  year_level: string | null;
  college: string | null;
  program: string | null;
  campus?: string | null;
  registration_no: string | null;
  registration_date: string | null;
};

type WorkspaceMetrics = {
  total_subjects: number;
  total_units_enrolled: number;
  total_units_earned: number;
  gwa: number | null;
};

type GradingContext = { grade_level: string; format_key: string };

type CorrectionSession = {
  academic_year_term_id: number;
  student_no: string;
  registration_no: string | null;
  registration_date: string | null;
  year_level: string | null;
  college: string | null;
  program: string | null;
  encoded_by: string | null;
  date_posted: string | null;
};

type CorrectionLine = {
  id: number;
  academic_year_term_id: number;
  student_no: string;
  sort_order: number;
  class_section: string | null;
  subject_code: string | null;
  subject_title: string | null;
  midterm: string | null;
  final: string | null;
  re_exam: string | null;
  remarks: string | null;
  credit_units: string | null;
};

type Workspace = {
  session: CorrectionSession | null;
  lines: CorrectionLine[];
  enrollment_snapshot: EnrollmentSnapshot | null;
  metrics: WorkspaceMetrics;
  grading_context: GradingContext;
};

type LineDraft = {
  id: number;
  class_section: string;
  subject_code: string;
  subject_title: string;
  credit_units: string;
  midterm: string;
  final: string;
  re_exam: string;
  remarks: string;
};

function mergeSessionForm(s: CorrectionSession | null, snap: EnrollmentSnapshot | null) {
  return {
    registration_no: (s?.registration_no ?? snap?.registration_no) ?? "",
    registration_date: (s?.registration_date ?? snap?.registration_date) ?? "",
    year_level: (s?.year_level ?? snap?.year_level) ?? "",
    college: (s?.college ?? snap?.college) ?? "",
    program: (s?.program ?? snap?.program) ?? "",
    encoded_by: s?.encoded_by ?? "",
    date_posted: s?.date_posted ? String(s.date_posted).slice(0, 16) : "",
  };
}

function lineToDraft(r: CorrectionLine): LineDraft {
  return {
    id: r.id,
    class_section: r.class_section ?? "",
    subject_code: r.subject_code ?? "",
    subject_title: r.subject_title ?? "",
    credit_units: r.credit_units ?? "0",
    midterm: r.midterm ?? "",
    final: r.final ?? "",
    re_exam: r.re_exam ?? "",
    remarks: r.remarks ?? "",
  };
}

function StudentDatum({ label, value, className }: { label: string; value: string; className?: string }) {
  const v = value.trim();
  return (
    <div className={cn("min-w-0", className)}>
      <div className="text-[8px] uppercase tracking-wide text-muted-foreground leading-none">{label}</div>
      <div className="text-[11px] font-medium text-foreground leading-tight pt-px truncate">{v || "—"}</div>
    </div>
  );
}

function SummaryBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border/50 bg-muted/20 px-2 py-1.5 min-w-[120px]">
      <div className="text-[8px] font-semibold uppercase tracking-wide text-muted-foreground leading-tight">{label}</div>
      <div className="text-sm font-bold tabular-nums text-foreground">{value}</div>
    </div>
  );
}

export function CorrectionOfGradesModule() {
  const router = useRouter();
  const [terms, setTerms] = useState<YearTerm[]>([]);
  const [termId, setTermId] = useState("");
  const [studentInput, setStudentInput] = useState("");
  const [activeStudentNo, setActiveStudentNo] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sessionForm, setSessionForm] = useState({
    registration_no: "",
    registration_date: "",
    year_level: "",
    college: "",
    program: "",
    encoded_by: "",
    date_posted: "",
  });
  const [lines, setLines] = useState<LineDraft[]>([]);
  const [baseline, setBaseline] = useState<string>("");
  const [studentName, setStudentName] = useState("");
  const [gradeLevel, setGradeLevel] = useState("College");
  const [formatKey, setFormatKey] = useState("format_1");
  const [gradingRows, setGradingRows] = useState<GradingRowLike[]>([]);

  const snapshot = useMemo(
    () =>
      JSON.stringify({
        sessionForm,
        lines,
      }),
    [sessionForm, lines]
  );

  const dirty = baseline !== "" && snapshot !== baseline;

  const applyWorkspace = useCallback((data: Workspace) => {
    const s = data.session;
    const snap = data.enrollment_snapshot;
    const merged = mergeSessionForm(s, snap);
    setSessionForm(merged);
    setLines(data.lines.map(lineToDraft));
    setStudentName((snap?.student_name ?? "").trim());
    if (data.grading_context?.grade_level) setGradeLevel(data.grading_context.grade_level);
    if (data.grading_context?.format_key) setFormatKey(data.grading_context.format_key);
    setBaseline(
      JSON.stringify({
        sessionForm: merged,
        lines: data.lines.map(lineToDraft),
      })
    );
  }, []);

  const loadWorkspace = useCallback(
    async (studentNo: string) => {
      if (!API || !termId || !studentNo.trim()) {
        toast({ title: "Student number required", variant: "destructive" });
        return;
      }
      setLoading(true);
      try {
        const q = new URLSearchParams({
          academicYearTermId: termId,
          studentNo: studentNo.trim(),
          gradeLevel,
          format: formatKey,
        });
        const res = await fetch(`${API}/api/registrar/correction-of-grades?${q.toString()}`);
        if (!res.ok) throw new Error(await res.text());
        const data = (await res.json()) as Workspace;
        applyWorkspace(data);
        setActiveStudentNo(studentNo.trim());
      } catch (e) {
        console.error(e);
        toast({
          title: "Could not load student grades",
          description: e instanceof Error ? e.message : "Request failed.",
          variant: "destructive",
        });
        setLines([]);
        setBaseline("");
        setStudentName("");
      } finally {
        setLoading(false);
      }
    },
    [API, termId, gradeLevel, formatKey, applyWorkspace]
  );

  useEffect(() => {
    if (!API) return;
    let cancelled = false;
    (async () => {
      try {
        const gl = encodeURIComponent(gradeLevel.trim());
        const fk = encodeURIComponent(formatKey.trim());
        const res = await fetch(`${API}/api/registrar/grading-system?gradeLevel=${gl}&format=${fk}`);
        if (!res.ok || cancelled) return;
        const list = (await res.json()) as GradingRowLike[];
        if (cancelled) return;
        setGradingRows(
          list.map((r) => ({
            grade_point: String(r.grade_point ?? ""),
            letter_grade: String(r.letter_grade ?? ""),
            credit_unit: Boolean(r.credit_unit),
            compute_gwa: Boolean(r.compute_gwa),
          }))
        );
      } catch {
        if (!cancelled) setGradingRows([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [API, gradeLevel, formatKey]);

  useEffect(() => {
    if (!API) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API}/api/academic-year-terms`);
        if (!res.ok) return;
        const list = (await res.json()) as YearTerm[];
        if (cancelled) return;
        setTerms(list);
        setTermId((prev) => (prev ? prev : list[0] ? String(list[0].id) : ""));
      } catch {
        /* noop */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [API]);

  const hasGrading = gradingRows.length > 0;
  const liveMetrics = useMemo(() => {
    return computeCorrectionMetrics(
      lines.map((r) => ({
        credit_units: r.credit_units,
        midterm: r.midterm,
        final: r.final,
        re_exam: r.re_exam,
        remarks: r.remarks,
      })),
      gradingRows
    );
  }, [lines, gradingRows]);

  const handleSearch = () => {
    const sn = studentInput.trim();
    if (!sn) {
      toast({ title: "Enter a student number", variant: "destructive" });
      return;
    }
    void loadWorkspace(sn);
  };

  const handleReset = () => {
    if (activeStudentNo) void loadWorkspace(activeStudentNo);
    else {
      setLines([]);
      setSessionForm({
        registration_no: "",
        registration_date: "",
        year_level: "",
        college: "",
        program: "",
        encoded_by: "",
        date_posted: "",
      });
      setBaseline("");
      setActiveStudentNo("");
      setStudentName("");
    }
  };

  const handleModify = async () => {
    if (!API || !termId || !activeStudentNo) return;
    setSaving(true);
    try {
      const body = {
        academicYearTermId: Number(termId),
        studentNo: activeStudentNo,
        gradeLevel,
        format: formatKey,
        session: {
          registrationNo: sessionForm.registration_no || null,
          registrationDate: sessionForm.registration_date || null,
          yearLevel: sessionForm.year_level || null,
          college: sessionForm.college || null,
          program: sessionForm.program || null,
          encodedBy: sessionForm.encoded_by || null,
          datePosted: sessionForm.date_posted || null,
        },
        rows: lines.map((r, i) => ({
          classSection: r.class_section,
          subjectCode: r.subject_code,
          subjectTitle: r.subject_title,
          midterm: r.midterm,
          final: r.final,
          reExam: r.re_exam,
          remarks: r.remarks,
          creditUnits: r.credit_units,
          sortOrder: i,
        })),
      };
      const res = await fetch(`${API}/api/registrar/correction-of-grades`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = (await res.json()) as Workspace;
      applyWorkspace(data);
      toast({ title: "Grades updated", description: "Correction workspace saved to the database." });
    } catch (e) {
      console.error(e);
      toast({
        title: "Save failed",
        description: e instanceof Error ? e.message : "Could not save.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="h-full min-h-0 bg-background flex flex-col overflow-hidden">
      <div className="shrink-0 border-b border-border/60 bg-gradient-to-r from-sky-100/80 via-muted/30 to-muted/20 px-3 py-2">
        <div className="flex items-start gap-2">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-border/60 bg-background text-muted-foreground">
            <FileEdit className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="setup-type-page-title leading-tight">CORRECTION OF GRADES</h1>
            <p className="setup-type-page-desc mt-0.5 text-sky-900/85 dark:text-sky-200/80">
              Use this module to correct the grades of student.
            </p>
          </div>
        </div>
      </div>

      <div className="shrink-0 border-b border-border/60 bg-card px-3 py-2 space-y-2">
        <div className="flex flex-wrap items-end gap-2">
          <Label className="text-[10px] uppercase text-muted-foreground sr-only">Student</Label>
          <Input
            placeholder="Student no."
            value={studentInput}
            onChange={(e) => setStudentInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSearch();
            }}
            className="h-8 max-w-[200px] rounded-lg text-xs font-mono"
          />
          <Button type="button" size="sm" className="h-8 gap-1 text-xs" onClick={handleSearch} disabled={loading}>
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
            Search
          </Button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-border/40">
          <div className="min-w-0">
            <div className="text-[8px] uppercase tracking-wide text-muted-foreground leading-none">Student no.</div>
            <div className="text-[11px] font-medium text-foreground leading-tight pt-px truncate">
              {activeStudentNo.trim() || "—"}
            </div>
            {studentName ? (
              <div className="text-[10px] text-muted-foreground leading-tight pt-0.5 truncate" title={studentName}>
                {studentName}
              </div>
            ) : null}
          </div>
          <StudentDatum label="Year level" value={sessionForm.year_level} />
          <StudentDatum label="College" value={sessionForm.college} />
          <StudentDatum label="Program" value={sessionForm.program} />
        </div>
      </div>

      <div className="shrink-0 border-b border-amber-200/50 dark:border-amber-900/40 bg-gradient-to-r from-amber-50/90 to-muted/30 px-3 py-2">
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1 min-w-[200px]">
            <Label className="text-[10px] uppercase text-muted-foreground">Academic year</Label>
            <select
              className="h-8 w-full rounded-lg border border-border/60 bg-background px-2 text-xs"
              value={termId}
              onChange={(e) => setTermId(e.target.value)}
            >
              {terms.map((t) => (
                <option key={t.id} value={String(t.id)}>
                  {t.academic_year} {t.term}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1 min-w-[100px]">
            <Label className="text-[10px] uppercase text-muted-foreground">Grade level</Label>
            <Input
              className="h-8 rounded-lg text-xs"
              value={gradeLevel}
              onChange={(e) => setGradeLevel(e.target.value)}
              placeholder="College"
              title="Must match a row in the grading system (used for GWA / earned units)."
            />
          </div>
          <div className="space-y-1 min-w-[100px]">
            <Label className="text-[10px] uppercase text-muted-foreground">Grade format</Label>
            <Input
              className="h-8 rounded-lg text-xs font-mono"
              value={formatKey}
              onChange={(e) => setFormatKey(e.target.value)}
              placeholder="format_1"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] uppercase text-muted-foreground">Registration no.</Label>
            <Input
              readOnly
              className="h-8 w-[140px] rounded-lg text-xs bg-muted/30 border-border/60"
              value={sessionForm.registration_no}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] uppercase text-muted-foreground">Registration date</Label>
            <Input
              readOnly
              className="h-8 w-[140px] rounded-lg text-xs bg-muted/30 border-border/60"
              value={sessionForm.registration_date}
            />
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 p-2 flex flex-col gap-2">
        <div className="flex-1 min-h-0 rounded-xl border border-border/60 bg-card overflow-hidden flex flex-col">
          <ScrollArea className="flex-1 min-h-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-sky-100/60 dark:bg-sky-950/40 hover:bg-sky-100/60">
                  <TableHead className="text-[10px] font-semibold uppercase px-2">Class section</TableHead>
                  <TableHead className="text-[10px] font-semibold uppercase px-2">Subject code</TableHead>
                  <TableHead className="text-[10px] font-semibold uppercase px-2 min-w-[140px]">Subject title</TableHead>
                  <TableHead className="text-[10px] font-semibold uppercase px-2 w-16">Units</TableHead>
                  <TableHead className="text-[10px] font-semibold uppercase px-2 w-20">Midterm</TableHead>
                  <TableHead className="text-[10px] font-semibold uppercase px-2 w-20">Final</TableHead>
                  <TableHead className="text-[10px] font-semibold uppercase px-2 w-20">Re-exam</TableHead>
                  <TableHead className="text-[10px] font-semibold uppercase px-2 min-w-[100px]">Remarks</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12">
                      <Loader2 className="h-5 w-5 animate-spin inline text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ) : lines.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-xs text-muted-foreground py-14">
                      Search for a student to load grade lines from{" "}
                      <code className="font-mono text-[10px]">correction_of_grades_line</code>.
                    </TableCell>
                  </TableRow>
                ) : (
                  lines.map((r, idx) => (
                    <TableRow key={r.id} className="hover:bg-muted/20">
                      <TableCell className="p-1">
                        <Input
                          className="h-7 text-[11px]"
                          value={r.class_section}
                          onChange={(e) =>
                            setLines((prev) =>
                              prev.map((x, i) => (i === idx ? { ...x, class_section: e.target.value } : x))
                            )
                          }
                        />
                      </TableCell>
                      <TableCell className="p-1">
                        <Input
                          className="h-7 text-[11px] font-mono"
                          value={r.subject_code}
                          onChange={(e) =>
                            setLines((prev) =>
                              prev.map((x, i) => (i === idx ? { ...x, subject_code: e.target.value } : x))
                            )
                          }
                        />
                      </TableCell>
                      <TableCell className="p-1">
                        <Input
                          className="h-7 text-[11px]"
                          value={r.subject_title}
                          onChange={(e) =>
                            setLines((prev) =>
                              prev.map((x, i) => (i === idx ? { ...x, subject_title: e.target.value } : x))
                            )
                          }
                        />
                      </TableCell>
                      <TableCell className="p-1">
                        <Input
                          className="h-7 text-[11px] tabular-nums"
                          value={r.credit_units}
                          onChange={(e) =>
                            setLines((prev) =>
                              prev.map((x, i) => (i === idx ? { ...x, credit_units: e.target.value } : x))
                            )
                          }
                          inputMode="decimal"
                        />
                      </TableCell>
                      <TableCell className="p-1">
                        <Input
                          className="h-7 text-[11px]"
                          value={r.midterm}
                          onChange={(e) =>
                            setLines((prev) =>
                              prev.map((x, i) => (i === idx ? { ...x, midterm: e.target.value } : x))
                            )
                          }
                        />
                      </TableCell>
                      <TableCell className="p-1">
                        <Input
                          className="h-7 text-[11px]"
                          value={r.final}
                          onChange={(e) =>
                            setLines((prev) =>
                              prev.map((x, i) => (i === idx ? { ...x, final: e.target.value } : x))
                            )
                          }
                        />
                      </TableCell>
                      <TableCell className="p-1">
                        <Input
                          className="h-7 text-[11px]"
                          value={r.re_exam}
                          onChange={(e) =>
                            setLines((prev) =>
                              prev.map((x, i) => (i === idx ? { ...x, re_exam: e.target.value } : x))
                            )
                          }
                        />
                      </TableCell>
                      <TableCell className="p-1">
                        <Input
                          className="h-7 text-[11px]"
                          value={r.remarks}
                          onChange={(e) =>
                            setLines((prev) =>
                              prev.map((x, i) => (i === idx ? { ...x, remarks: e.target.value } : x))
                            )
                          }
                        />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </div>

        <div className="shrink-0 rounded-xl border border-border/60 bg-muted/15 px-3 py-2 flex flex-col lg:flex-row gap-3 lg:items-end lg:justify-between">
          <div className="flex flex-wrap gap-2">
            <SummaryBox label="Total subjects enrolled" value={String(liveMetrics.total_subjects)} />
            <SummaryBox label="Total credit units enrolled" value={liveMetrics.total_units_enrolled.toFixed(1)} />
            <SummaryBox
              label="Total credit units earned"
              value={hasGrading ? liveMetrics.total_units_earned.toFixed(1) : "—"}
            />
            <SummaryBox
              label="General weighted average"
              value={hasGrading && liveMetrics.gwa != null ? liveMetrics.gwa.toFixed(3) : "—"}
            />
          </div>
          <div className="text-[10px] text-muted-foreground space-y-0.5 lg:text-right">
            <div>
              <span className="font-semibold text-foreground/80">Encoded by:</span>{" "}
              {sessionForm.encoded_by.trim() || "—"}
            </div>
            <div>
              <span className="font-semibold text-foreground/80">Date posted:</span>{" "}
              {sessionForm.date_posted.trim() || "—"}
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5 justify-end">
            <Button type="button" variant="outline" size="sm" className="h-8 text-xs gap-1" onClick={handleReset}>
              <RotateCcw className="h-3.5 w-3.5" />
              Reset
            </Button>
            <Button
              type="button"
              size="sm"
              className="h-8 text-xs gap-1"
              disabled={!dirty || !activeStudentNo || saving}
              onClick={() => void handleModify()}
            >
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              Modify
            </Button>
            <Button type="button" variant="outline" size="sm" className="h-8 text-xs gap-1" onClick={() => window.print()}>
              <Printer className="h-3.5 w-3.5" />
              Print
            </Button>
            <Button type="button" variant="ghost" size="sm" className="h-8 text-xs gap-1" onClick={() => router.back()}>
              <LogOut className="h-3.5 w-3.5" />
              Exit
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
