"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import {
  computeCorrectionMetrics,
  effectiveGradeLine,
  failingSubjectPercent,
  matchGradingRule,
  type CorrectionLineLike,
  type GradingRowLike,
} from "@/lib/correctionMetrics";
import {
  FileSpreadsheet,
  FolderOpen,
  Grid3X3,
  HelpCircle,
  Loader2,
  Pencil,
  Plus,
  Printer,
  RefreshCw,
  Save,
  Search,
  Star,
  Trash2,
} from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL;

type YearTerm = { id: number; academic_year: string; term: string };

type EnrollmentSnapshot = {
  student_name: string | null;
  year_level: string | null;
  college: string | null;
  program: string | null;
  campus: string | null;
  registration_no: string | null;
  registration_date: string | null;
};

type GradeEncodingProfile = {
  last_name: string;
  first_name: string;
  middle_name: string;
  mi: string;
  ext_name: string;
  gender: string;
  age: string;
  campus: string;
  college: string;
  academic_program: string;
  major_study: string;
  year_level: string;
  curriculum: string;
  date_graduated: string;
};

type ApiLine = {
  id: number;
  course_code: string | null;
  course_title: string | null;
  class_section: string | null;
  unit: string | null;
  midterm: string | null;
  final: string | null;
  re_exam: string | null;
  credited_units: string | null;
  remark: string | null;
  year_level: string | null;
  from_other_school: boolean;
  date_entered: string | null;
  date_posted: string | null;
  subject_id: string | null;
  grade_id: string | null;
  type_of_grade: string | null;
  compute_gwa: boolean;
  registration_id: string | null;
  status: string | null;
};

type ReportLine = ApiLine & {
  academic_year_term_label: string;
  lec_units?: string | null;
  lab_units?: string | null;
  course_id?: string | null;
  grade_idx?: string | null;
  schedule_id?: string | null;
  show_in_tor?: boolean;
  not_credited?: boolean;
};

type EvalLine = {
  id: number;
  year_term: string;
  course_code: string;
  course_title: string;
  unit: string;
  final: string;
  re_exam: string;
  credited_units: string;
  remarks: string;
  pre_requisites: string;
  equivalent: string;
  year_standing: string;
  academic_year_term_taken: string;
  year_level_taken: string;
  from_other_school: boolean;
  date_entered: string;
  date_posted: string;
};

type Workspace = {
  enrollment_snapshot: EnrollmentSnapshot | null;
  profile: GradeEncodingProfile;
  lines: ApiLine[];
  report_of_grades: ReportLine[];
  evaluation_lines: EvalLine[];
  transcript_lines: ReportLine[];
  include_summer: boolean;
  metrics: {
    total_subjects: number;
    total_units_enrolled: number;
    total_units_earned: number;
    gwa: number | null;
  };
  scholastic_status: string;
  grading_context: { grade_level: string; format_key: string };
};

type LineDraft = ApiLine & { clientKey?: string };

type ScholasticRule = {
  min_units_enrolled: string;
  max_units_enrolled: string;
  min_percent_subject: string;
  max_percent_subject: string;
  status_text: string;
};

function emptyDraft(clientKey: string): LineDraft {
  return {
    id: 0,
    course_code: "",
    course_title: "",
    class_section: "",
    unit: "0",
    midterm: "",
    final: "",
    re_exam: "",
    credited_units: "",
    remark: "",
    year_level: "",
    from_other_school: false,
    date_entered: "",
    date_posted: "",
    subject_id: "",
    grade_id: "",
    type_of_grade: "",
    compute_gwa: true,
    registration_id: "",
    status: "",
    clientKey,
  };
}

function apiLineToDraft(r: ApiLine): LineDraft {
  return {
    ...r,
    course_code: r.course_code ?? "",
    course_title: r.course_title ?? "",
    class_section: r.class_section ?? "",
    unit: r.unit ?? "0",
    midterm: r.midterm ?? "",
    final: r.final ?? "",
    re_exam: r.re_exam ?? "",
    credited_units: r.credited_units ?? "",
    remark: r.remark ?? "",
    year_level: r.year_level ?? "",
    date_entered: r.date_entered ?? "",
    date_posted: r.date_posted ?? "",
    subject_id: r.subject_id ?? "",
    grade_id: r.grade_id ?? "",
    type_of_grade: r.type_of_grade ?? "",
    registration_id: r.registration_id ?? "",
    status: r.status ?? "",
  };
}

function draftToPayload(r: LineDraft) {
  return {
    course_code: r.course_code || null,
    course_title: r.course_title || null,
    class_section: r.class_section || null,
    unit: r.unit || null,
    midterm: r.midterm || null,
    final: r.final || null,
    re_exam: r.re_exam || null,
    credited_units: r.credited_units || null,
    remark: r.remark || null,
    year_level: r.year_level || null,
    from_other_school: r.from_other_school,
    date_entered: r.date_entered || null,
    date_posted: r.date_posted || null,
    subject_id: r.subject_id || null,
    grade_id: r.grade_id || null,
    type_of_grade: r.type_of_grade || null,
    compute_gwa: r.compute_gwa,
    registration_id: r.registration_id || null,
    status: r.status || null,
  };
}

function lineLike(r: LineDraft): CorrectionLineLike {
  return {
    credit_units: r.credited_units || r.unit,
    midterm: r.midterm,
    final: r.final,
    re_exam: r.re_exam,
    remarks: r.remark,
  };
}

function scholasticFromRules(units: number, pct: number, rules: ScholasticRule[]): string {
  for (const rule of rules) {
    const minU = Number(rule.min_units_enrolled);
    const maxU = Number(rule.max_units_enrolled);
    const minP = Number(rule.min_percent_subject);
    const maxP = Number(rule.max_percent_subject);
    if (
      Number.isFinite(minU) &&
      Number.isFinite(maxU) &&
      units >= minU &&
      units <= maxU &&
      Number.isFinite(minP) &&
      Number.isFinite(maxP) &&
      pct >= minP &&
      pct <= maxP
    ) {
      return rule.status_text;
    }
  }
  return "Good standing";
}

function rowBgClass(r: LineDraft, gradingRows: GradingRowLike[]): string {
  if (r.from_other_school) return "bg-cyan-100/60 dark:bg-cyan-950/25";
  const rmk = (r.remark || "").toUpperCase();
  if (rmk.includes("UNOFFICIAL") && rmk.includes("DROP")) return "bg-sky-100/70 dark:bg-sky-950/25";
  if (rmk.includes("OFFICIAL") && rmk.includes("DROP")) return "bg-blue-200/50 dark:bg-blue-950/40";
  if (rmk.includes("WITHDRAW") && rmk.includes("UNAUTHOR")) return "bg-amber-200/60 dark:bg-amber-950/30";
  if (rmk.includes("WITHDRAW")) return "bg-yellow-100/70 dark:bg-yellow-950/25";
  const like = lineLike(r);
  const eff = effectiveGradeLine(like);
  if (!eff) return "bg-background";
  if (/INC/i.test(eff)) return "bg-orange-100/70 dark:bg-orange-950/25";
  const rule = matchGradingRule(eff, gradingRows);
  if (rule?.credit_unit) return "bg-emerald-100/55 dark:bg-emerald-950/25";
  const lg = (rule?.letter_grade || "").toUpperCase();
  if (lg.includes("FNC") || lg.includes("COND")) return "bg-pink-100/70 dark:bg-pink-950/25";
  const gp = rule ? parseFloat(String(rule.grade_point).replace(/,/g, ".")) : NaN;
  if (Number.isFinite(gp) && gp > 3) return "bg-red-100/65 dark:bg-red-950/30";
  return "bg-muted/15";
}

function fmt(v: string | null | undefined) {
  const s = v == null ? "" : String(v).trim();
  return s || "—";
}

function mapReportToDraft(r: ReportLine): ReportLine {
  return {
    ...r,
    academic_year_term_label: r.academic_year_term_label ?? "",
    course_code: r.course_code ?? "",
    course_title: r.course_title ?? "",
    class_section: r.class_section ?? "",
    unit: r.unit ?? "",
    lec_units: r.lec_units ?? r.unit ?? "",
    lab_units: r.lab_units ?? "",
    midterm: r.midterm ?? "",
    final: r.final ?? "",
    re_exam: r.re_exam ?? "",
    credited_units: r.credited_units ?? "",
    remark: r.remark ?? "",
    subject_id: r.subject_id ?? "",
    course_id: r.course_id ?? "",
    grade_id: r.grade_id ?? "",
    grade_idx: r.grade_idx ?? r.grade_id ?? "",
    date_entered: r.date_entered ?? "",
    date_posted: r.date_posted ?? "",
    registration_id: r.registration_id ?? "",
    schedule_id: r.schedule_id ?? "",
    show_in_tor: r.show_in_tor ?? true,
    not_credited: r.not_credited ?? false,
  };
}

function mapEvalApiToDraft(r: EvalLine & { id?: number }): EvalLine & { clientKey?: string } {
  return {
    id: r.id ?? 0,
    year_term: r.year_term ?? "",
    course_code: r.course_code ?? "",
    course_title: r.course_title ?? "",
    unit: r.unit ?? "",
    final: r.final ?? "",
    re_exam: r.re_exam ?? "",
    credited_units: r.credited_units ?? "",
    remarks: r.remarks ?? "",
    pre_requisites: r.pre_requisites ?? "",
    equivalent: r.equivalent ?? "",
    year_standing: r.year_standing ?? "",
    academic_year_term_taken: r.academic_year_term_taken ?? "",
    year_level_taken: r.year_level_taken ?? "",
    from_other_school: Boolean(r.from_other_school),
    date_entered: r.date_entered ?? "",
    date_posted: r.date_posted ?? "",
    clientKey: `ev-${r.id}`,
  };
}

function emptyEvalDraft(key: string): EvalLine & { clientKey: string } {
  return {
    id: 0,
    year_term: "",
    course_code: "",
    course_title: "",
    unit: "0",
    final: "",
    re_exam: "",
    credited_units: "",
    remarks: "",
    pre_requisites: "",
    equivalent: "",
    year_standing: "",
    academic_year_term_taken: "",
    year_level_taken: "",
    from_other_school: false,
    date_entered: "",
    date_posted: "",
    clientKey: key,
  };
}

function FieldRo({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <div className="text-[8px] uppercase tracking-wide text-muted-foreground leading-none">{label}</div>
      <div className="text-[11px] font-medium leading-tight pt-px truncate">{value.trim() || "—"}</div>
    </div>
  );
}

const MINI_TAB_TRIGGER =
  "relative z-0 rounded-t-md border border-b-0 px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wide transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:px-3 sm:text-[11px] data-[state=active]:z-20 data-[state=active]:-mb-px data-[state=active]:mb-0 data-[state=active]:border-border data-[state=active]:bg-card data-[state=active]:shadow-sm data-[state=inactive]:opacity-90 data-[state=inactive]:hover:opacity-100";

const LEGEND = [
  { color: "bg-background border border-border/50", label: "White: blank" },
  { color: "bg-emerald-100/55", label: "Green: passed" },
  { color: "bg-red-100/65", label: "Red: failed" },
  { color: "bg-orange-100/70", label: "Orange: incomplete" },
  { color: "bg-sky-100/70", label: "Light blue: unofficially dropped" },
  { color: "bg-blue-200/50", label: "Dark blue: officially dropped" },
  { color: "bg-pink-100/70", label: "Pink: conditional failure" },
  { color: "bg-amber-200/60", label: "Brown: unauthorized withdrawal" },
  { color: "bg-yellow-100/70", label: "Yellow: withdrawal" },
  { color: "bg-cyan-100/60", label: "Cyan: other school" },
] as const;

export function GradeEncodingModule() {
  const [terms, setTerms] = useState<YearTerm[]>([]);
  const [termId, setTermId] = useState("");
  const [studentInput, setStudentInput] = useState("");
  const [activeStudent, setActiveStudent] = useState("");
  const [gradeLevel, setGradeLevel] = useState("College");
  const [formatKey, setFormatKey] = useState("format_1");
  const [profile, setProfile] = useState<GradeEncodingProfile | null>(null);
  const [lines, setLines] = useState<LineDraft[]>([]);
  const [baseline, setBaseline] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [gradingRows, setGradingRows] = useState<GradingRowLike[]>([]);
  const [scholasticRules, setScholasticRules] = useState<ScholasticRule[]>([]);
  const [serverScholastic, setServerScholastic] = useState("");
  const [tab, setTab] = useState("encoding");
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [nextClientKey, setNextClientKey] = useState(1);
  const [reportRows, setReportRows] = useState<ReportLine[]>([]);
  const [evalRows, setEvalRows] = useState<(EvalLine & { clientKey?: string })[]>([]);
  const [transcriptRows, setTranscriptRows] = useState<ReportLine[]>([]);
  const [includeSummer, setIncludeSummer] = useState(false);
  const [evalBaseline, setEvalBaseline] = useState("");
  const [savingEval, setSavingEval] = useState(false);
  const [savingTranscript, setSavingTranscript] = useState(false);
  const [nextEvalKey, setNextEvalKey] = useState(1);

  const snapshot = useMemo(
    () => JSON.stringify({ lines: lines.map((l) => ({ ...l, clientKey: undefined })) }),
    [lines]
  );
  const dirty = baseline !== "" && snapshot !== baseline;

  const rowKey = (r: LineDraft, idx: number) => r.clientKey ?? `id-${r.id}-${idx}`;

  const selectKey = (r: LineDraft, idx: number) => rowKey(r, idx);

  const selectedKeys = useMemo(() => Object.entries(selected).filter(([, v]) => v).map(([k]) => k), [selected]);

  const liveMetrics = useMemo(() => {
    const mapped = lines.map((r) => lineLike(r));
    return computeCorrectionMetrics(mapped, gradingRows);
  }, [lines, gradingRows]);

  const liveScholastic = useMemo(() => {
    const mapped = lines.map((r) => lineLike(r));
    const pct = failingSubjectPercent(mapped, gradingRows);
    return scholasticFromRules(liveMetrics.total_units_enrolled, pct, scholasticRules);
  }, [lines, gradingRows, liveMetrics.total_units_enrolled, scholasticRules]);

  const applyWorkspace = useCallback((data: Workspace) => {
    setProfile(data.profile);
    setLines(data.lines.map(apiLineToDraft));
    setReportRows((data.report_of_grades ?? []).map(mapReportToDraft));
    const ev = (data.evaluation_lines ?? []).map((r) => mapEvalApiToDraft(r as EvalLine));
    setEvalRows(ev);
    setEvalBaseline(JSON.stringify(ev.map((l) => ({ ...l, clientKey: undefined }))));
    setTranscriptRows((data.transcript_lines ?? []).map(mapReportToDraft));
    setIncludeSummer(Boolean(data.include_summer));
    setServerScholastic(data.scholastic_status);
    if (data.grading_context?.grade_level) setGradeLevel(data.grading_context.grade_level);
    if (data.grading_context?.format_key) setFormatKey(data.grading_context.format_key);
    const normalized = data.lines.map(apiLineToDraft);
    setBaseline(JSON.stringify({ lines: normalized.map((l) => ({ ...l, clientKey: undefined })) }));
    setSelected({});
  }, []);

  const evalDirty = evalBaseline !== "" && evalBaseline !== JSON.stringify(evalRows.map((l) => ({ ...l, clientKey: undefined })));

  const rogSummary = useMemo(() => {
    const n = reportRows.length;
    let units = 0;
    for (const r of reportRows) units += Number(r.unit) || 0;
    return { count: n, units: units.toFixed(1) };
  }, [reportRows]);

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
        const res = await fetch(`${API}/api/registrar/grade-encoding?${q.toString()}`);
        if (!res.ok) throw new Error(await res.text());
        const data = (await res.json()) as Workspace;
        applyWorkspace(data);
        setActiveStudent(studentNo.trim());
      } catch (e) {
        console.error(e);
        toast({
          title: "Load failed",
          description: e instanceof Error ? e.message : "Request failed.",
          variant: "destructive",
        });
        setLines([]);
        setReportRows([]);
        setEvalRows([]);
        setTranscriptRows([]);
        setBaseline("");
        setEvalBaseline("");
        setProfile(null);
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
        const res = await fetch(`${API}/api/academic-year-terms`);
        if (!res.ok || cancelled) return;
        const list = (await res.json()) as YearTerm[];
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

  useEffect(() => {
    if (!API) return;
    let cancelled = false;
    (async () => {
      try {
        const gl = encodeURIComponent(gradeLevel.trim());
        const fk = encodeURIComponent(formatKey.trim());
        const [gRes, sRes] = await Promise.all([
          fetch(`${API}/api/registrar/grading-system?gradeLevel=${gl}&format=${fk}`),
          fetch(`${API}/api/registrar/scholastic-delinquency`),
        ]);
        if (cancelled) return;
        if (gRes.ok) {
          const list = (await gRes.json()) as GradingRowLike[];
          setGradingRows(
            list.map((r) => ({
              grade_point: String(r.grade_point ?? ""),
              letter_grade: String(r.letter_grade ?? ""),
              credit_unit: Boolean(r.credit_unit),
              compute_gwa: Boolean(r.compute_gwa),
            }))
          );
        }
        if (sRes.ok) setScholasticRules((await sRes.json()) as ScholasticRule[]);
      } catch {
        if (!cancelled) setGradingRows([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [API, gradeLevel, formatKey]);

  const handleSave = async () => {
    if (!API || !termId || !activeStudent) return;
    setSaving(true);
    try {
      const res = await fetch(`${API}/api/registrar/grade-encoding`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          academicYearTermId: Number(termId),
          studentNo: activeStudent,
          gradeLevel,
          format: formatKey,
          rows: lines.map((r) => draftToPayload(r)),
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = (await res.json()) as Workspace;
      applyWorkspace(data);
      toast({ title: "Saved", description: "Grade encoding rows stored." });
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

  const addRow = () => {
    const k = `new-${nextClientKey}`;
    setNextClientKey((n) => n + 1);
    setLines((prev) => [...prev, emptyDraft(k)]);
  };

  const deleteSelected = () => {
    const drop = new Set(selectedKeys);
    setLines((prev) => prev.filter((r, idx) => !drop.has(selectKey(r, idx))));
    setSelected({});
  };

  const toggleAll = (on: boolean) => {
    const next: Record<string, boolean> = {};
    if (on) lines.forEach((r, i) => (next[selectKey(r, i)] = true));
    setSelected(next);
  };

  const refreshIncludeSummer = async (next: boolean) => {
    if (!API || !termId || !activeStudent) {
      setIncludeSummer(next);
      return;
    }
    try {
      const res = await fetch(`${API}/api/registrar/grade-encoding/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          academicYearTermId: Number(termId),
          studentNo: activeStudent,
          includeSummer: next,
          gradeLevel,
          format: formatKey,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      applyWorkspace((await res.json()) as Workspace);
    } catch (e) {
      console.error(e);
      toast({ title: "Could not update summer filter", variant: "destructive" });
    }
  };

  const handleSaveEvaluation = async () => {
    if (!API || !activeStudent) return;
    setSavingEval(true);
    try {
      const res = await fetch(`${API}/api/registrar/grade-encoding/evaluation`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          academicYearTermId: Number(termId),
          studentNo: activeStudent,
          gradeLevel,
          format: formatKey,
          rows: evalRows.map((r) => ({
            yearTerm: r.year_term,
            courseCode: r.course_code,
            courseTitle: r.course_title,
            unit: r.unit,
            final: r.final,
            reExam: r.re_exam,
            creditedUnits: r.credited_units,
            remarks: r.remarks,
            preRequisites: r.pre_requisites,
            equivalent: r.equivalent,
            yearStanding: r.year_standing,
            academicYearTermTaken: r.academic_year_term_taken,
            yearLevelTaken: r.year_level_taken,
            fromOtherSchool: r.from_other_school,
            dateEntered: r.date_entered,
            datePosted: r.date_posted,
          })),
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      applyWorkspace((await res.json()) as Workspace);
      toast({ title: "Evaluation saved" });
    } catch (e) {
      console.error(e);
      toast({ title: "Save failed", description: e instanceof Error ? e.message : undefined, variant: "destructive" });
    } finally {
      setSavingEval(false);
    }
  };

  const handleSaveTranscript = async () => {
    if (!API || !termId || !activeStudent) return;
    setSavingTranscript(true);
    try {
      const res = await fetch(`${API}/api/registrar/grade-encoding/transcript`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          academicYearTermId: Number(termId),
          studentNo: activeStudent,
          gradeLevel,
          format: formatKey,
          flags: transcriptRows.map((r) => ({
            id: r.id,
            showInTor: r.show_in_tor ?? true,
            notCredited: r.not_credited ?? false,
          })),
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      applyWorkspace((await res.json()) as Workspace);
      toast({ title: "Transcript flags saved" });
    } catch (e) {
      console.error(e);
      toast({ title: "Save failed", variant: "destructive" });
    } finally {
      setSavingTranscript(false);
    }
  };

  const gridShell = "flex-1 min-h-0 rounded-lg border border-border/60 bg-card overflow-hidden flex flex-col";
  const thRog =
    "text-[9px] font-semibold uppercase px-1.5 h-8 bg-sky-100/80 dark:bg-sky-950/40 whitespace-nowrap";
  const thGrade = "text-[9px] font-semibold uppercase px-1.5 h-8 bg-pink-100/80 dark:bg-pink-950/40 whitespace-nowrap text-red-800 dark:text-red-200";
  const td = "p-1 text-[10px] whitespace-nowrap";

  return (
    <div className="h-full min-h-0 bg-background flex flex-col overflow-hidden text-xs">
      <div className="shrink-0 border-b border-border/60 bg-card px-3 py-2 flex items-start justify-between gap-2">
        <div>
          <h1 className="text-sm font-bold uppercase tracking-tight text-foreground">Grade encoding</h1>
          <p className="text-[11px] text-sky-800/90 dark:text-sky-200/80 mt-0.5">
            Allows user to enter the grades of the student.
          </p>
        </div>
        <div className="text-[10px] text-muted-foreground text-right hidden sm:block leading-tight">
          Enrollment-style workspace
        </div>
      </div>

      <div className="flex-1 min-h-0 flex flex-col lg:flex-row overflow-hidden">
        <aside className="shrink-0 w-full lg:w-[22rem] border-b lg:border-b-0 lg:border-r border-[#b8c4db] bg-gradient-to-b from-[#eef3fb] to-[#e2e9f5] p-2 flex flex-col gap-2 overflow-y-auto max-h-[min(52vh,520px)] lg:max-h-none">
          <div className="rounded-md border border-[#b8c4db] bg-card shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-sky-600 to-sky-500 px-2 py-1.5 text-[10px] font-bold uppercase tracking-wide text-white border-b border-sky-700/30">
              Student information
            </div>
            <div className="p-2 space-y-2">
              <div className="flex gap-2">
                <div className="h-20 w-20 shrink-0 rounded border border-border/60 bg-muted/50 grid place-items-center text-[9px] text-muted-foreground text-center leading-tight px-1">
                  Photo
                </div>
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex gap-0.5">
                    <Input
                      placeholder="Enter student no…"
                      value={studentInput}
                      onChange={(e) => setStudentInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") void loadWorkspace(studentInput);
                      }}
                      className="h-7 text-[10px] font-mono px-1.5"
                    />
                    <Button type="button" size="icon" variant="secondary" className="h-7 w-7 shrink-0" onClick={() => void loadWorkspace(studentInput)} disabled={loading}>
                      {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Search className="h-3 w-3" />}
                    </Button>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-6 w-full text-[9px] font-semibold"
                    onClick={() => {
                      setStudentInput("");
                      setActiveStudent("");
                      setLines([]);
                      setReportRows([]);
                      setEvalRows([]);
                      setTranscriptRows([]);
                      setIncludeSummer(false);
                      setProfile(null);
                      setBaseline("");
                      setEvalBaseline("");
                      setSelected({});
                    }}
                  >
                    Clear
                  </Button>
                </div>
              </div>
              <FieldRo label="Student no." value={activeStudent} />
              <div className="grid grid-cols-1 gap-1">
                <FieldRo label="Last name" value={profile?.last_name ?? ""} />
                <FieldRo label="First name" value={profile?.first_name ?? ""} />
                <FieldRo label="Middle name" value={profile?.middle_name ?? ""} />
              </div>
              <div className="grid grid-cols-2 gap-1">
                <FieldRo label="M.I." value={profile?.mi ?? ""} />
                <FieldRo label="Ext. name" value={profile?.ext_name ?? ""} />
                <FieldRo label="Gender" value={profile?.gender ?? ""} />
                <FieldRo label="Age" value={profile?.age ?? ""} />
              </div>
              <Button type="button" variant="link" className="h-auto p-0 text-[10px] text-sky-700" asChild>
                <Link href="/registrar/students-profile">Update personal info</Link>
              </Button>
            </div>
          </div>

          <Accordion type="single" collapsible defaultValue="general" className="rounded-md border border-[#b8c4db] bg-card shadow-sm overflow-hidden">
            <AccordionItem value="general" className="border-0">
              <AccordionTrigger className="py-2 px-2 text-[10px] font-bold uppercase tracking-wide text-white bg-gradient-to-r from-sky-600 to-sky-400 hover:no-underline [&>svg]:text-white">
                General information
              </AccordionTrigger>
              <AccordionContent className="px-2 pb-2 pt-0 space-y-1 bg-card">
                <FieldRo label="Campus" value={profile?.campus ?? ""} />
                <FieldRo label="College" value={profile?.college ?? ""} />
                <FieldRo label="Academic program" value={profile?.academic_program ?? ""} />
                <FieldRo label="Major study" value={profile?.major_study ?? ""} />
                <FieldRo label="Year level" value={profile?.year_level ?? ""} />
                <FieldRo label="Curriculum" value={profile?.curriculum ?? ""} />
                <FieldRo label="Date graduated" value={profile?.date_graduated ?? ""} />
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="entrance" className="border-0 border-t border-border/50">
              <AccordionTrigger className="py-2 px-2 text-[10px] font-bold uppercase tracking-wide text-amber-950 bg-gradient-to-r from-amber-200 to-amber-100 hover:no-underline [&>svg]:text-amber-900">
                Entrance data
              </AccordionTrigger>
              <AccordionContent className="px-2 pb-2 pt-0 space-y-1.5 bg-amber-50/30 dark:bg-amber-950/10">
                <FieldRo label="Date admitted" value="" />
                <FieldRo label="High school" value="" />
                <FieldRo label="Location" value="" />
                <FieldRo label="Date of graduation" value="" />
                <FieldRo label="School last attended" value="" />
                <FieldRo label="Admission credential" value="" />
                <p className="text-[9px] text-muted-foreground pt-1">Connect to admissions API when available.</p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="summary" className="border-0 border-t border-border/50">
              <AccordionTrigger className="py-2 px-2 text-[10px] font-bold uppercase tracking-wide text-emerald-950 bg-gradient-to-r from-emerald-300 to-emerald-100 hover:no-underline [&>svg]:text-emerald-900">
                Summary of evaluation
              </AccordionTrigger>
              <AccordionContent className="px-2 pb-2 pt-0 space-y-2 bg-emerald-50/25 dark:bg-emerald-950/15">
                <div className="text-[9px] font-semibold uppercase text-red-800/90 dark:text-red-300">Total course in curriculum</div>
                <div className="grid grid-cols-[1fr_auto] gap-x-2 text-[10px] pl-1">
                  <span className="text-muted-foreground">Lecture / lab / credit (placeholder)</span>
                  <span className="tabular-nums font-medium">0 / 0 / 0</span>
                </div>
                <div className="text-[9px] font-semibold uppercase text-red-800/90 dark:text-red-300">From current encoding grid</div>
                <div className="grid grid-cols-[1fr_auto] gap-x-2 text-[10px] pl-1">
                  <span className="text-muted-foreground">Subjects</span>
                  <span className="tabular-nums font-medium">{liveMetrics.total_subjects}</span>
                  <span className="text-muted-foreground">Credit units enrolled</span>
                  <span className="tabular-nums font-medium">{liveMetrics.total_units_enrolled.toFixed(1)}</span>
                  <span className="text-muted-foreground">Credit units earned</span>
                  <span className="tabular-nums font-medium">{gradingRows.length ? liveMetrics.total_units_earned.toFixed(1) : "—"}</span>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="legend" className="border-0 border-t border-border/50">
              <AccordionTrigger className="py-2 px-2 text-[10px] font-bold uppercase tracking-wide text-rose-950 bg-gradient-to-r from-rose-200 to-rose-100 hover:no-underline [&>svg]:text-rose-900">
                Color legend
              </AccordionTrigger>
              <AccordionContent className="px-2 pb-2 pt-0 bg-rose-50/30 dark:bg-rose-950/10">
                <div className="grid grid-cols-1 gap-1 max-h-48 overflow-y-auto pr-1">
                  {LEGEND.map((item) => (
                    <div key={item.label} className="flex items-center gap-1.5">
                      <span className={cn("h-3 w-5 shrink-0 rounded-sm border border-black/10", item.color)} />
                      <span className="text-[10px] leading-tight">{item.label}</span>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="grading" className="border-0 border-t border-border/50">
              <AccordionTrigger className="py-2 px-2 text-[10px] font-bold uppercase tracking-wide text-violet-950 bg-gradient-to-r from-violet-300 to-violet-100 hover:no-underline [&>svg]:text-violet-900">
                Grading system
              </AccordionTrigger>
              <AccordionContent className="px-0 pb-0 pt-0 bg-violet-50/25 dark:bg-violet-950/15">
                <ScrollArea className="max-h-40">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="text-[9px] h-7 px-2">Grade point</TableHead>
                        <TableHead className="text-[9px] h-7 px-2">Letter</TableHead>
                        <TableHead className="text-[9px] h-7 px-2">Remarks</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {gradingRows.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={3} className="text-[10px] text-muted-foreground py-3 text-center">
                            Load grading scale (grade level / format above).
                          </TableCell>
                        </TableRow>
                      ) : (
                        gradingRows.slice(0, 40).map((gr, i) => (
                          <TableRow key={i} className="h-7">
                            <TableCell className="py-0.5 px-2 text-[10px] font-mono">{gr.grade_point}</TableCell>
                            <TableCell className="py-0.5 px-2 text-[10px]">{gr.letter_grade}</TableCell>
                            <TableCell className="py-0.5 px-2 text-[9px] text-muted-foreground truncate max-w-[120px]">
                              {gr.credit_unit ? "Credit" : ""} {gr.compute_gwa ? "· GWA" : ""}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </aside>

        <main className="flex-1 min-h-0 flex flex-col overflow-hidden bg-[#f0f4fb] dark:bg-background p-2 gap-0">
          <Tabs value={tab} onValueChange={setTab} className="flex-1 min-h-0 flex flex-col gap-0 min-h-0">
            <div className="shrink-0 rounded-t-lg border border-b-0 border-[#b8c4db] bg-gradient-to-b from-[#e4ebf7] to-[#d4deec] px-1 pt-1">
              <TabsList className="flex h-auto flex-wrap items-end gap-0.5 rounded-none border-0 bg-transparent p-0 shadow-none">
                <TabsTrigger
                  value="encoding"
                  className={cn(MINI_TAB_TRIGGER, "data-[state=inactive]:bg-sky-300/50 data-[state=inactive]:text-sky-950/80")}
                >
                  Grade encoding
                </TabsTrigger>
                <TabsTrigger
                  value="rog"
                  className={cn(MINI_TAB_TRIGGER, "data-[state=inactive]:bg-amber-300/50 data-[state=inactive]:text-amber-950/80")}
                >
                  Report of grades
                </TabsTrigger>
                <TabsTrigger
                  value="eval"
                  className={cn(MINI_TAB_TRIGGER, "data-[state=inactive]:bg-emerald-300/50 data-[state=inactive]:text-emerald-950/80")}
                >
                  Evaluation
                </TabsTrigger>
                <TabsTrigger
                  value="transcript"
                  className={cn(MINI_TAB_TRIGGER, "data-[state=inactive]:bg-rose-300/50 data-[state=inactive]:text-rose-950/80")}
                >
                  Transcript
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent
              value="encoding"
              className="flex-1 min-h-0 flex flex-col gap-2 mt-0 rounded-b-lg rounded-tr-lg border border-[#b8c4db] border-t-0 bg-card p-2 shadow-sm data-[state=inactive]:hidden"
            >
              <div className="flex flex-wrap items-end gap-2 shrink-0">
                <div className="space-y-1 min-w-[200px]">
                  <Label className="text-[10px] uppercase text-muted-foreground">Academic year / term</Label>
                  <select
                    className="h-8 w-full max-w-xs rounded-md border border-border/60 bg-background px-2 text-[11px]"
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
                <div className="space-y-1 w-24">
                  <Label className="text-[10px] uppercase text-muted-foreground">Grade level</Label>
                  <Input className="h-8 text-[11px]" value={gradeLevel} onChange={(e) => setGradeLevel(e.target.value)} />
                </div>
                <div className="space-y-1 w-24">
                  <Label className="text-[10px] uppercase text-muted-foreground">Format</Label>
                  <Input className="h-8 text-[11px] font-mono" value={formatKey} onChange={(e) => setFormatKey(e.target.value)} />
                </div>
              </div>

              <div className="flex-1 min-h-0 rounded-lg border border-border/60 bg-card overflow-hidden flex flex-col">
                <ScrollArea className="flex-1 min-h-0 w-full">
                  <Table className="min-w-[1800px]">
                    <TableHeader>
                      <TableRow className="bg-sky-100/70 dark:bg-sky-950/35">
                        <TableHead className="w-8 p-1">
                          <Checkbox checked={lines.length > 0 && selectedKeys.length === lines.length} onCheckedChange={(v) => toggleAll(v === true)} />
                        </TableHead>
                        <TableHead className="text-[9px] uppercase p-1 min-w-[72px]">Course code</TableHead>
                        <TableHead className="text-[9px] uppercase p-1 min-w-[120px]">Course title</TableHead>
                        <TableHead className="text-[9px] uppercase p-1 min-w-[64px]">Class</TableHead>
                        <TableHead className="text-[9px] uppercase p-1 w-14">Unit</TableHead>
                        <TableHead className="text-[9px] uppercase p-1 w-16 bg-pink-100/80 dark:bg-pink-950/40">Midterm</TableHead>
                        <TableHead className="text-[9px] uppercase p-1 w-16 bg-pink-100/80 dark:bg-pink-950/40">Final</TableHead>
                        <TableHead className="text-[9px] uppercase p-1 w-16 bg-pink-100/80 dark:bg-pink-950/40">Re-ex</TableHead>
                        <TableHead className="text-[9px] uppercase p-1 w-16">Credited</TableHead>
                        <TableHead className="text-[9px] uppercase p-1 min-w-[80px]">Remark</TableHead>
                        <TableHead className="text-[9px] uppercase p-1 w-14">Yr.</TableHead>
                        <TableHead className="text-[9px] uppercase p-1 w-12">Oth.</TableHead>
                        <TableHead className="text-[9px] uppercase p-1 min-w-[88px]">Date entered</TableHead>
                        <TableHead className="text-[9px] uppercase p-1 min-w-[88px]">Date posted</TableHead>
                        <TableHead className="text-[9px] uppercase p-1 min-w-[72px]">Subject ID</TableHead>
                        <TableHead className="text-[9px] uppercase p-1 min-w-[72px]">Grade ID</TableHead>
                        <TableHead className="text-[9px] uppercase p-1 min-w-[72px]">Type</TableHead>
                        <TableHead className="text-[9px] uppercase p-1 w-12">GWA</TableHead>
                        <TableHead className="text-[9px] uppercase p-1 min-w-[72px]">Reg. ID</TableHead>
                        <TableHead className="text-[9px] uppercase p-1 min-w-[64px]">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        <TableRow>
                          <TableCell colSpan={20} className="text-center py-10">
                            <Loader2 className="h-5 w-5 animate-spin inline" />
                          </TableCell>
                        </TableRow>
                      ) : lines.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={20} className="text-center text-muted-foreground py-10 px-4">
                            Search for a student. Rows are stored in{" "}
                            <code className="font-mono text-[10px]">grade_encoding_line</code>.
                          </TableCell>
                        </TableRow>
                      ) : (
                        lines.map((r, idx) => (
                          <TableRow key={rowKey(r, idx)} className={cn("border-b border-border/40", rowBgClass(r, gradingRows))}>
                            <TableCell className="p-1 align-middle">
                              <Checkbox
                                checked={!!selected[selectKey(r, idx)]}
                                onCheckedChange={(v) =>
                                  setSelected((prev) => ({ ...prev, [selectKey(r, idx)]: v === true }))
                                }
                              />
                            </TableCell>
                            <TableCell className="p-0.5">
                              <Input className="h-7 text-[11px] font-mono" value={r.course_code} onChange={(e) => setLines((p) => p.map((x, i) => (i === idx ? { ...x, course_code: e.target.value } : x)))} />
                            </TableCell>
                            <TableCell className="p-0.5">
                              <Input className="h-7 text-[11px]" value={r.course_title} onChange={(e) => setLines((p) => p.map((x, i) => (i === idx ? { ...x, course_title: e.target.value } : x)))} />
                            </TableCell>
                            <TableCell className="p-0.5">
                              <Input className="h-7 text-[11px]" value={r.class_section} onChange={(e) => setLines((p) => p.map((x, i) => (i === idx ? { ...x, class_section: e.target.value } : x)))} />
                            </TableCell>
                            <TableCell className="p-0.5">
                              <Input className="h-7 text-[11px] tabular-nums" value={r.unit} onChange={(e) => setLines((p) => p.map((x, i) => (i === idx ? { ...x, unit: e.target.value } : x)))} />
                            </TableCell>
                            <TableCell className="p-0.5 bg-pink-50/50 dark:bg-pink-950/20">
                              <Input className="h-7 text-[11px]" value={r.midterm} onChange={(e) => setLines((p) => p.map((x, i) => (i === idx ? { ...x, midterm: e.target.value } : x)))} />
                            </TableCell>
                            <TableCell className="p-0.5 bg-pink-50/50 dark:bg-pink-950/20">
                              <Input className="h-7 text-[11px]" value={r.final} onChange={(e) => setLines((p) => p.map((x, i) => (i === idx ? { ...x, final: e.target.value } : x)))} />
                            </TableCell>
                            <TableCell className="p-0.5 bg-pink-50/50 dark:bg-pink-950/20">
                              <Input className="h-7 text-[11px]" value={r.re_exam} onChange={(e) => setLines((p) => p.map((x, i) => (i === idx ? { ...x, re_exam: e.target.value } : x)))} />
                            </TableCell>
                            <TableCell className="p-0.5">
                              <Input className="h-7 text-[11px] tabular-nums" value={r.credited_units} onChange={(e) => setLines((p) => p.map((x, i) => (i === idx ? { ...x, credited_units: e.target.value } : x)))} />
                            </TableCell>
                            <TableCell className="p-0.5">
                              <Input className="h-7 text-[11px]" value={r.remark} onChange={(e) => setLines((p) => p.map((x, i) => (i === idx ? { ...x, remark: e.target.value } : x)))} />
                            </TableCell>
                            <TableCell className="p-0.5">
                              <Input className="h-7 text-[11px]" value={r.year_level} onChange={(e) => setLines((p) => p.map((x, i) => (i === idx ? { ...x, year_level: e.target.value } : x)))} />
                            </TableCell>
                            <TableCell className="p-0.5 text-center">
                              <Checkbox checked={r.from_other_school} onCheckedChange={(v) => setLines((p) => p.map((x, i) => (i === idx ? { ...x, from_other_school: v === true } : x)))} />
                            </TableCell>
                            <TableCell className="p-0.5">
                              <Input type="date" className="h-7 text-[10px] px-1" value={r.date_entered} onChange={(e) => setLines((p) => p.map((x, i) => (i === idx ? { ...x, date_entered: e.target.value } : x)))} />
                            </TableCell>
                            <TableCell className="p-0.5">
                              <Input type="date" className="h-7 text-[10px] px-1" value={r.date_posted} onChange={(e) => setLines((p) => p.map((x, i) => (i === idx ? { ...x, date_posted: e.target.value } : x)))} />
                            </TableCell>
                            <TableCell className="p-0.5">
                              <Input className="h-7 text-[11px] font-mono" value={r.subject_id} onChange={(e) => setLines((p) => p.map((x, i) => (i === idx ? { ...x, subject_id: e.target.value } : x)))} />
                            </TableCell>
                            <TableCell className="p-0.5">
                              <Input className="h-7 text-[11px] font-mono" value={r.grade_id} onChange={(e) => setLines((p) => p.map((x, i) => (i === idx ? { ...x, grade_id: e.target.value } : x)))} />
                            </TableCell>
                            <TableCell className="p-0.5">
                              <Input className="h-7 text-[11px]" value={r.type_of_grade} onChange={(e) => setLines((p) => p.map((x, i) => (i === idx ? { ...x, type_of_grade: e.target.value } : x)))} />
                            </TableCell>
                            <TableCell className="p-0.5 text-center">
                              <Checkbox checked={r.compute_gwa} onCheckedChange={(v) => setLines((p) => p.map((x, i) => (i === idx ? { ...x, compute_gwa: v === true } : x)))} />
                            </TableCell>
                            <TableCell className="p-0.5">
                              <Input className="h-7 text-[11px] font-mono" value={r.registration_id} onChange={(e) => setLines((p) => p.map((x, i) => (i === idx ? { ...x, registration_id: e.target.value } : x)))} />
                            </TableCell>
                            <TableCell className="p-0.5">
                              <Input className="h-7 text-[11px]" value={r.status} onChange={(e) => setLines((p) => p.map((x, i) => (i === idx ? { ...x, status: e.target.value } : x)))} />
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </div>

              <div className="shrink-0 flex flex-wrap gap-1 items-center">
                <Button type="button" variant="outline" size="sm" className="h-8 text-[11px] gap-1" onClick={addRow} disabled={!activeStudent}>
                  <Plus className="h-3.5 w-3.5" />
                  New…
                </Button>
                <Button type="button" size="sm" className="h-8 text-[11px] gap-1" disabled={!dirty || !activeStudent || saving} onClick={() => void handleSave()}>
                  {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                  Save
                </Button>
                <Button type="button" variant="outline" size="sm" className="h-8 text-[11px] gap-1" disabled>
                  <Pencil className="h-3.5 w-3.5" />
                  Edit
                </Button>
                <Button type="button" variant="outline" size="sm" className="h-8 text-[11px] gap-1" onClick={deleteSelected} disabled={!selectedKeys.length}>
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </Button>
                <Button type="button" variant="outline" size="sm" className="h-8 text-[11px] gap-1" onClick={() => window.print()}>
                  <Printer className="h-3.5 w-3.5" />
                  Print
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 text-[11px] gap-1"
                  onClick={() => toast({ title: "Help", description: "Consult your registrar manual for grade encoding policies." })}
                >
                  <HelpCircle className="h-3.5 w-3.5" />
                  Help
                </Button>
              </div>

              <div className="shrink-0 grid grid-cols-1 xl:grid-cols-2 gap-2">
                <div className="rounded-lg border border-border/60 bg-muted/10 p-2">
                  <div className="text-[10px] font-semibold uppercase text-muted-foreground mb-1.5">Color legend</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                    {LEGEND.map((item) => (
                      <div key={item.label} className="flex items-center gap-1.5">
                        <span className={cn("h-3 w-5 shrink-0 rounded-sm", item.color)} />
                        <span className="text-[10px] leading-tight">{item.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded-lg border border-border/60 bg-muted/10 p-2 space-y-1">
                  <div className="text-[10px] font-semibold uppercase text-muted-foreground">Summary grade</div>
                  <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[11px]">
                    <span className="text-muted-foreground">Total subjects enrolled</span>
                    <span className="font-semibold tabular-nums text-right">{liveMetrics.total_subjects}</span>
                    <span className="text-muted-foreground">Total credit units enrolled</span>
                    <span className="font-semibold tabular-nums text-right">{liveMetrics.total_units_enrolled.toFixed(1)}</span>
                    <span className="text-muted-foreground">Total credit units earned</span>
                    <span className="font-semibold tabular-nums text-right">{gradingRows.length ? liveMetrics.total_units_earned.toFixed(1) : "—"}</span>
                    <span className="text-muted-foreground">GWA</span>
                    <span className="font-semibold tabular-nums text-right">
                      {gradingRows.length && liveMetrics.gwa != null ? liveMetrics.gwa.toFixed(3) : "—"}
                    </span>
                    <span className="text-muted-foreground">Scholastic status</span>
                    <span className="font-semibold text-right leading-tight">
                      {scholasticRules.length ? liveScholastic : serverScholastic || "—"}
                    </span>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent
              value="rog"
              className="flex-1 min-h-0 flex flex-col gap-2 mt-0 rounded-b-lg rounded-tr-lg border border-[#b8c4db] border-t-0 bg-card p-2 shadow-sm data-[state=inactive]:hidden"
            >
              <div className="shrink-0 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="include-summer"
                    checked={includeSummer}
                    onCheckedChange={(v) => void refreshIncludeSummer(v === true)}
                    disabled={!activeStudent}
                  />
                  <Label htmlFor="include-summer" className="text-[11px] cursor-pointer">
                    Include summer
                  </Label>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 text-[11px] gap-1"
                  disabled={!activeStudent}
                  onClick={() =>
                    toast({
                      title: "Summary of report of grades",
                      description: `${rogSummary.count} row(s), ${rogSummary.units} total units.`,
                    })
                  }
                >
                  <FileSpreadsheet className="h-3.5 w-3.5" />
                  Summary of report of grades
                </Button>
              </div>
              <div className={gridShell}>
                <ScrollArea className="flex-1 min-h-0 w-full">
                  <Table className="min-w-[2000px]">
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead className={thRog}>Academic year/term</TableHead>
                        <TableHead className={thRog}>Course code</TableHead>
                        <TableHead className={thRog}>Course title</TableHead>
                        <TableHead className={thRog}>Class section</TableHead>
                        <TableHead className={thRog}>Lec unit</TableHead>
                        <TableHead className={thRog}>Lab unit</TableHead>
                        <TableHead className={thRog}>Unit</TableHead>
                        <TableHead className={thGrade}>Midterm</TableHead>
                        <TableHead className={thGrade}>Final</TableHead>
                        <TableHead className={thGrade}>Re-ex</TableHead>
                        <TableHead className={thRog}>Credited units</TableHead>
                        <TableHead className={thRog}>Remarks</TableHead>
                        <TableHead className={thRog}>Term ID</TableHead>
                        <TableHead className={thRog}>Course ID</TableHead>
                        <TableHead className={thRog}>Grade idx</TableHead>
                        <TableHead className={thRog}>Date entered</TableHead>
                        <TableHead className={thRog}>Date posted</TableHead>
                        <TableHead className={thRog}>Sched. ID</TableHead>
                        <TableHead className={thRog}>Reg. no.</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        <TableRow>
                          <TableCell colSpan={18} className="text-center py-10">
                            <Loader2 className="h-5 w-5 animate-spin inline" />
                          </TableCell>
                        </TableRow>
                      ) : !activeStudent ? (
                        <TableRow>
                          <TableCell colSpan={18} className="text-center text-muted-foreground py-10">
                            Search for a student to load report of grades from{" "}
                            <code className="font-mono text-[10px]">grade_encoding_line</code>.
                          </TableCell>
                        </TableRow>
                      ) : reportRows.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={18} className="text-center text-muted-foreground py-10">
                            No grade rows yet. Enter grades on the Grade encoding tab and save.
                          </TableCell>
                        </TableRow>
                      ) : (
                        reportRows.map((r) => (
                          <TableRow key={`rog-${r.id}`} className={cn(rowBgClass(r as LineDraft, gradingRows))}>
                            <TableCell className={td}>{fmt(r.academic_year_term_label)}</TableCell>
                            <TableCell className={cn(td, "font-mono")}>{fmt(r.course_code)}</TableCell>
                            <TableCell className={td}>{fmt(r.course_title)}</TableCell>
                            <TableCell className={td}>{fmt(r.class_section)}</TableCell>
                            <TableCell className={cn(td, "tabular-nums")}>{fmt(r.lec_units)}</TableCell>
                            <TableCell className={cn(td, "tabular-nums")}>{fmt(r.lab_units)}</TableCell>
                            <TableCell className={cn(td, "tabular-nums")}>{fmt(r.unit)}</TableCell>
                            <TableCell className={cn(td, "text-red-800 dark:text-red-300")}>{fmt(r.midterm)}</TableCell>
                            <TableCell className={cn(td, "text-red-800 dark:text-red-300")}>{fmt(r.final)}</TableCell>
                            <TableCell className={cn(td, "text-red-800 dark:text-red-300")}>{fmt(r.re_exam)}</TableCell>
                            <TableCell className={cn(td, "tabular-nums")}>{fmt(r.credited_units)}</TableCell>
                            <TableCell className={td}>{fmt(r.remark)}</TableCell>
                            <TableCell className={cn(td, "font-mono")}>{fmt(r.subject_id)}</TableCell>
                            <TableCell className={cn(td, "font-mono")}>{fmt(r.course_id)}</TableCell>
                            <TableCell className={cn(td, "font-mono")}>{fmt(r.grade_idx ?? r.grade_id)}</TableCell>
                            <TableCell className={td}>{fmt(r.date_entered)}</TableCell>
                            <TableCell className={td}>{fmt(r.date_posted)}</TableCell>
                            <TableCell className={cn(td, "font-mono")}>{fmt(r.schedule_id)}</TableCell>
                            <TableCell className={cn(td, "font-mono")}>{fmt(r.registration_id)}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </div>
            </TabsContent>

            <TabsContent
              value="eval"
              className="flex-1 min-h-0 flex flex-col gap-2 mt-0 rounded-b-lg rounded-tr-lg border border-[#b8c4db] border-t-0 bg-card p-2 shadow-sm data-[state=inactive]:hidden"
            >
              <div className="shrink-0 flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap gap-1">
                  <Button type="button" variant="outline" size="sm" className="h-8 text-[10px] gap-1" disabled>
                    <Star className="h-3.5 w-3.5 text-amber-500" />
                    Candidate/graduate
                  </Button>
                  <Button type="button" variant="outline" size="sm" className="h-8 text-[10px] gap-1" disabled>
                    <FolderOpen className="h-3.5 w-3.5" />
                    Course taken
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1">
                  <Button type="button" variant="outline" size="icon" className="h-8 w-8" onClick={() => window.print()}>
                    <Printer className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    className="h-8 text-[10px] gap-1"
                    disabled={!evalDirty || !activeStudent || savingEval}
                    onClick={() => void handleSaveEvaluation()}
                  >
                    {savingEval ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                    Save
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    disabled={!activeStudent || loading}
                    onClick={() => void loadWorkspace(activeStudent)}
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                  </Button>
                  <Button type="button" variant="outline" size="icon" className="h-8 w-8">
                    <Grid3X3 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              <div className={gridShell}>
                <ScrollArea className="flex-1 min-h-0 w-full">
                  <Table className="min-w-[2200px]">
                    <TableHeader>
                      <TableRow className="hover:bg-transparent bg-emerald-50/70 dark:bg-emerald-950/30">
                        <TableHead className={thRog}>Year/term</TableHead>
                        <TableHead className={thRog}>Course code</TableHead>
                        <TableHead className={thRog}>Course title</TableHead>
                        <TableHead className={thRog}>Unit</TableHead>
                        <TableHead className={thGrade}>Final</TableHead>
                        <TableHead className={thGrade}>Re-ex</TableHead>
                        <TableHead className={thRog}>Credited</TableHead>
                        <TableHead className={thRog}>Remarks</TableHead>
                        <TableHead className={thRog}>Pre-requisites</TableHead>
                        <TableHead className={thRog}>Equivalent</TableHead>
                        <TableHead className={thRog}>Year standing</TableHead>
                        <TableHead className={thRog}>Academic year/term taken</TableHead>
                        <TableHead className={thRog}>Year level taken</TableHead>
                        <TableHead className={thRog}>Other school</TableHead>
                        <TableHead className={thRog}>Date entered</TableHead>
                        <TableHead className={thRog}>Date posted</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {!activeStudent ? (
                        <TableRow>
                          <TableCell colSpan={15} className="text-center text-muted-foreground py-10">
                            Search for a student. Evaluation rows are stored in{" "}
                            <code className="font-mono text-[10px]">grade_encoding_evaluation_line</code>.
                          </TableCell>
                        </TableRow>
                      ) : (
                        evalRows.map((r, idx) => (
                          <TableRow key={r.clientKey ?? `ev-${idx}`}>
                            <TableCell className="p-0.5">
                              <Input className="h-7 text-[10px]" value={r.year_term} onChange={(e) => setEvalRows((p) => p.map((x, i) => (i === idx ? { ...x, year_term: e.target.value } : x)))} />
                            </TableCell>
                            <TableCell className="p-0.5">
                              <Input className="h-7 text-[10px] font-mono" value={r.course_code} onChange={(e) => setEvalRows((p) => p.map((x, i) => (i === idx ? { ...x, course_code: e.target.value } : x)))} />
                            </TableCell>
                            <TableCell className="p-0.5">
                              <Input className="h-7 text-[10px]" value={r.course_title} onChange={(e) => setEvalRows((p) => p.map((x, i) => (i === idx ? { ...x, course_title: e.target.value } : x)))} />
                            </TableCell>
                            <TableCell className="p-0.5">
                              <Input className="h-7 text-[10px] tabular-nums w-14" value={r.unit} onChange={(e) => setEvalRows((p) => p.map((x, i) => (i === idx ? { ...x, unit: e.target.value } : x)))} />
                            </TableCell>
                            <TableCell className="p-0.5">
                              <Input className="h-7 text-[10px]" value={r.final} onChange={(e) => setEvalRows((p) => p.map((x, i) => (i === idx ? { ...x, final: e.target.value } : x)))} />
                            </TableCell>
                            <TableCell className="p-0.5">
                              <Input className="h-7 text-[10px]" value={r.re_exam} onChange={(e) => setEvalRows((p) => p.map((x, i) => (i === idx ? { ...x, re_exam: e.target.value } : x)))} />
                            </TableCell>
                            <TableCell className="p-0.5">
                              <Input className="h-7 text-[10px]" value={r.credited_units} onChange={(e) => setEvalRows((p) => p.map((x, i) => (i === idx ? { ...x, credited_units: e.target.value } : x)))} />
                            </TableCell>
                            <TableCell className="p-0.5">
                              <Input className="h-7 text-[10px]" value={r.remarks} onChange={(e) => setEvalRows((p) => p.map((x, i) => (i === idx ? { ...x, remarks: e.target.value } : x)))} />
                            </TableCell>
                            <TableCell className="p-0.5">
                              <Input className="h-7 text-[10px]" value={r.pre_requisites} onChange={(e) => setEvalRows((p) => p.map((x, i) => (i === idx ? { ...x, pre_requisites: e.target.value } : x)))} />
                            </TableCell>
                            <TableCell className="p-0.5">
                              <Input className="h-7 text-[10px]" value={r.equivalent} onChange={(e) => setEvalRows((p) => p.map((x, i) => (i === idx ? { ...x, equivalent: e.target.value } : x)))} />
                            </TableCell>
                            <TableCell className="p-0.5">
                              <Input className="h-7 text-[10px]" value={r.year_standing} onChange={(e) => setEvalRows((p) => p.map((x, i) => (i === idx ? { ...x, year_standing: e.target.value } : x)))} />
                            </TableCell>
                            <TableCell className="p-0.5">
                              <Input className="h-7 text-[10px]" value={r.academic_year_term_taken} onChange={(e) => setEvalRows((p) => p.map((x, i) => (i === idx ? { ...x, academic_year_term_taken: e.target.value } : x)))} />
                            </TableCell>
                            <TableCell className="p-0.5">
                              <Input className="h-7 text-[10px]" value={r.year_level_taken} onChange={(e) => setEvalRows((p) => p.map((x, i) => (i === idx ? { ...x, year_level_taken: e.target.value } : x)))} />
                            </TableCell>
                            <TableCell className="p-0.5 text-center">
                              <Checkbox checked={r.from_other_school} onCheckedChange={(v) => setEvalRows((p) => p.map((x, i) => (i === idx ? { ...x, from_other_school: v === true } : x)))} />
                            </TableCell>
                            <TableCell className="p-0.5">
                              <Input type="date" className="h-7 text-[10px] px-1" value={r.date_entered} onChange={(e) => setEvalRows((p) => p.map((x, i) => (i === idx ? { ...x, date_entered: e.target.value } : x)))} />
                            </TableCell>
                            <TableCell className="p-0.5">
                              <Input type="date" className="h-7 text-[10px] px-1" value={r.date_posted} onChange={(e) => setEvalRows((p) => p.map((x, i) => (i === idx ? { ...x, date_posted: e.target.value } : x)))} />
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </div>
              <div className="shrink-0 flex gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 text-[11px]"
                  disabled={!activeStudent}
                  onClick={() => {
                    const k = `ev-new-${nextEvalKey}`;
                    setNextEvalKey((n) => n + 1);
                    setEvalRows((p) => [...p, emptyEvalDraft(k)]);
                  }}
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Add row
                </Button>
              </div>
            </TabsContent>

            <TabsContent
              value="transcript"
              className="flex-1 min-h-0 flex flex-col gap-2 mt-0 rounded-b-lg rounded-tr-lg border border-[#b8c4db] border-t-0 bg-card p-2 shadow-sm data-[state=inactive]:hidden"
            >
              <div className="shrink-0 flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap gap-1">
                  <Button type="button" variant="outline" size="sm" className="h-8 text-[10px]" disabled>
                    Summary
                  </Button>
                  <Button type="button" variant="outline" size="sm" className="h-8 text-[10px]" disabled>
                    CRD
                  </Button>
                  <Button type="button" variant="outline" size="sm" className="h-8 text-[10px]" disabled>
                    GFO
                  </Button>
                  <Button type="button" variant="outline" size="sm" className="h-8 text-[10px]" disabled>
                    Transcript setup
                  </Button>
                </div>
                <Button
                  type="button"
                  size="sm"
                  className="h-8 text-[11px] gap-1"
                  disabled={!activeStudent || savingTranscript}
                  onClick={() => void handleSaveTranscript()}
                >
                  {savingTranscript ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                  Save TOR flags
                </Button>
              </div>
              <div className={gridShell}>
                <ScrollArea className="flex-1 min-h-0 w-full">
                  <Table className="min-w-[2400px]">
                    <TableHeader>
                      <TableRow className="hover:bg-transparent bg-rose-50/70 dark:bg-rose-950/30">
                        <TableHead className={thRog}>Academic year/term</TableHead>
                        <TableHead className={thRog}>Course code</TableHead>
                        <TableHead className={thRog}>Course title</TableHead>
                        <TableHead className={thRog}>Unit</TableHead>
                        <TableHead className={thGrade}>Final</TableHead>
                        <TableHead className={thGrade}>Re-ex</TableHead>
                        <TableHead className={thRog}>Credited units</TableHead>
                        <TableHead className={thRog}>Remarks</TableHead>
                        <TableHead className={thRog}>Term ID</TableHead>
                        <TableHead className={thRog}>Course ID</TableHead>
                        <TableHead className={thRog}>Grade ID</TableHead>
                        <TableHead className={thRog}>Date entered</TableHead>
                        <TableHead className={thRog}>Date posted</TableHead>
                        <TableHead className={thRog}>Schedule ID</TableHead>
                        <TableHead className={thRog}>Show in TOR</TableHead>
                        <TableHead className={thRog}>Not credited</TableHead>
                        <TableHead className={thRog}>Year level</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {!activeStudent ? (
                        <TableRow>
                          <TableCell colSpan={17} className="text-center text-muted-foreground py-10">
                            Search for a student. Transcript shows rows with Show in TOR from grade encoding.
                          </TableCell>
                        </TableRow>
                      ) : transcriptRows.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={17} className="text-center text-muted-foreground py-10">
                            No transcript rows (enable Show in TOR on saved grade lines).
                          </TableCell>
                        </TableRow>
                      ) : (
                        transcriptRows.map((r, idx) => (
                          <TableRow key={`tor-${r.id}-${idx}`}>
                            <TableCell className={td}>{fmt(r.academic_year_term_label)}</TableCell>
                            <TableCell className={cn(td, "font-mono")}>{fmt(r.course_code)}</TableCell>
                            <TableCell className={td}>{fmt(r.course_title)}</TableCell>
                            <TableCell className={cn(td, "tabular-nums")}>{fmt(r.unit)}</TableCell>
                            <TableCell className={td}>{fmt(r.final)}</TableCell>
                            <TableCell className={td}>{fmt(r.re_exam)}</TableCell>
                            <TableCell className={cn(td, "tabular-nums")}>{fmt(r.credited_units)}</TableCell>
                            <TableCell className={td}>{fmt(r.remark)}</TableCell>
                            <TableCell className={cn(td, "font-mono")}>{fmt(r.subject_id)}</TableCell>
                            <TableCell className={cn(td, "font-mono")}>{fmt(r.course_id)}</TableCell>
                            <TableCell className={cn(td, "font-mono")}>{fmt(r.grade_id)}</TableCell>
                            <TableCell className={td}>{fmt(r.date_entered)}</TableCell>
                            <TableCell className={td}>{fmt(r.date_posted)}</TableCell>
                            <TableCell className={cn(td, "font-mono")}>{fmt(r.schedule_id)}</TableCell>
                            <TableCell className="p-1 text-center">
                              <Checkbox
                                checked={r.show_in_tor ?? true}
                                onCheckedChange={(v) => {
                                  setTranscriptRows((p) =>
                                    p.map((x) => (x.id === r.id ? { ...x, show_in_tor: v === true } : x))
                                  );
                                }}
                              />
                            </TableCell>
                            <TableCell className="p-1 text-center">
                              <Checkbox
                                checked={r.not_credited ?? false}
                                onCheckedChange={(v) => {
                                  setTranscriptRows((p) =>
                                    p.map((x) => (x.id === r.id ? { ...x, not_credited: v === true } : x))
                                  );
                                }}
                              />
                            </TableCell>
                            <TableCell className={td}>{fmt(r.year_level)}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </div>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}
