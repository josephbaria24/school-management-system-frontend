"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { AlertCircle, Ban, CircleArrowDown, Loader2, Printer, RefreshCw, Users } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL;

type YearTerm = { id: number; academic_year: string; term: string };
type Campus = { id: number; acronym: string; campus_name: string | null };

type IncompleteRow = {
  id: number;
  reg_id: string | null;
  student_no: string;
  student_name: string | null;
  college_code: string | null;
  course: string | null;
  major_study: string | null;
  year_level: string | null;
  subject_code: string | null;
  subject_title: string | null;
  lec_units: string | null;
  lab_units: string | null;
  credit_units: string | null;
  final: string | null;
  re_exam_completed: string | null;
  remarks: string | null;
  sched_id: string | null;
  faculty_name: string | null;
  date_encoded: string | null;
  posted_date: string | null;
  regtabid: string | null;
  inc_status: string | null;
  grade_id: string | null;
};

function fmt(v: string | null | undefined) {
  return v?.trim() ? v : "—";
}

function formatLongDate(iso: string | null) {
  if (!iso) return "—";
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
}

const COLS = [
  { key: "sel", label: "", w: "w-10" },
  { key: "reg_id", label: "Reg ID", w: "min-w-[72px]" },
  { key: "student_no", label: "Student no.", w: "min-w-[88px]" },
  { key: "student_name", label: "Student name", w: "min-w-[140px]" },
  { key: "college_code", label: "College code", w: "min-w-[88px]" },
  { key: "course", label: "Course", w: "min-w-[120px]" },
  { key: "major_study", label: "Major study", w: "min-w-[100px]" },
  { key: "year_level", label: "Yr.", w: "min-w-[48px]" },
  { key: "subject_code", label: "Subject code", w: "min-w-[88px]" },
  { key: "subject_title", label: "Subject title", w: "min-w-[160px]" },
  { key: "lec_units", label: "Lec units", w: "min-w-[64px]" },
  { key: "lab_units", label: "Lab units", w: "min-w-[64px]" },
  { key: "credit_units", label: "Credit units", w: "min-w-[72px]" },
  { key: "final", label: "Final", w: "min-w-[56px]" },
  { key: "re_exam_completed", label: "Re-exam / completed", w: "min-w-[100px]" },
  { key: "remarks", label: "Remarks", w: "min-w-[120px]" },
  { key: "sched_id", label: "Sched. ID", w: "min-w-[72px]" },
  { key: "faculty_name", label: "Faculty name", w: "min-w-[120px]" },
  { key: "date_encoded", label: "Date encoded", w: "min-w-[96px]" },
  { key: "posted_date", label: "Posted date", w: "min-w-[96px]" },
  { key: "regtabid", label: "Regtabid", w: "min-w-[88px]" },
  { key: "inc_status", label: "INC status", w: "min-w-[88px]" },
  { key: "grade_id", label: "Grade ID", w: "min-w-[88px]" },
] as const;

export function StudentsWithIncompleteGradeModule() {
  const [terms, setTerms] = useState<YearTerm[]>([]);
  const [termId, setTermId] = useState("");
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [campusId, setCampusId] = useState("");
  const [incDueInput, setIncDueInput] = useState("");
  const [incDueSaved, setIncDueSaved] = useState<string | null>(null);
  const [eligibleOnly, setEligibleOnly] = useState(true);
  const [rows, setRows] = useState<IncompleteRow[]>([]);
  const [selected, setSelected] = useState<Record<number, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [savingDue, setSavingDue] = useState(false);
  const [converting, setConverting] = useState(false);

  const selectedIds = useMemo(
    () => Object.entries(selected).filter(([, v]) => v).map(([k]) => Number(k)),
    [selected]
  );

  const allSelected = useMemo(() => {
    if (!rows.length) return false;
    return rows.every((r) => selected[r.id]);
  }, [rows, selected]);

  useEffect(() => {
    if (!API) return;
    let cancelled = false;
    (async () => {
      try {
        const [tRes, cRes] = await Promise.all([
          fetch(`${API}/api/academic-year-terms`),
          fetch(`${API}/api/campuses`),
        ]);
        if (cancelled) return;
        if (tRes.ok) {
          const list = (await tRes.json()) as YearTerm[];
          setTerms(list);
          setTermId((prev) => (prev ? prev : list[0] ? String(list[0].id) : ""));
        }
        if (cRes.ok) {
          const list = (await cRes.json()) as Campus[];
          setCampuses(list);
          setCampusId((prev) => (prev ? prev : list[0] ? String(list[0].id) : ""));
        }
      } catch {
        /* noop */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const loadList = useCallback(async () => {
    if (!API || !termId || !campusId) {
      toast({ title: "Select term and campus", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const q = new URLSearchParams({
        academicYearTermId: termId,
        campusId,
        eligibleOnly: eligibleOnly ? "true" : "false",
      });
      const res = await fetch(`${API}/api/registrar/students-with-incomplete-grade?${q.toString()}`);
      if (!res.ok) throw new Error(await res.text());
      const data = (await res.json()) as { inc_due_date: string | null; rows: IncompleteRow[] };
      setRows(data.rows);
      setIncDueSaved(data.inc_due_date);
      setIncDueInput(data.inc_due_date ?? "");
      setSelected({});
    } catch (e) {
      console.error(e);
      toast({
        title: "Could not load list",
        description: e instanceof Error ? e.message : "Request failed.",
        variant: "destructive",
      });
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [API, termId, campusId, eligibleOnly]);

  const saveIncDueDate = async () => {
    if (!API || !termId || !campusId) return;
    setSavingDue(true);
    try {
      const res = await fetch(`${API}/api/registrar/students-with-incomplete-grade/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          academicYearTermId: Number(termId),
          campusId: Number(campusId),
          incDueDate: incDueInput.trim() || null,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = (await res.json()) as { inc_due_date: string | null };
      setIncDueSaved(data.inc_due_date);
      toast({ title: "INC due date saved" });
    } catch (e) {
      console.error(e);
      toast({
        title: "Save failed",
        description: e instanceof Error ? e.message : "Could not save.",
        variant: "destructive",
      });
    } finally {
      setSavingDue(false);
    }
  };

  const toggleAll = (checked: boolean) => {
    const next: Record<number, boolean> = {};
    if (checked) rows.forEach((r) => (next[r.id] = true));
    setSelected(next);
  };

  const handleConvert = async () => {
    if (!API || !selectedIds.length) {
      toast({ title: "Select at least one row", variant: "destructive" });
      return;
    }
    setConverting(true);
    try {
      const res = await fetch(`${API}/api/registrar/students-with-incomplete-grade/convert`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ids: selectedIds,
          failingGrade: "5.00",
          remarksAppend: "Converted from INC (past due).",
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = (await res.json()) as { affected: number };
      toast({
        title: "Conversion complete",
        description: `${data.affected} record(s) updated to failing grade.`,
      });
      await loadList();
    } catch (e) {
      console.error(e);
      toast({
        title: "Conversion failed",
        description: e instanceof Error ? e.message : "Request failed.",
        variant: "destructive",
      });
    } finally {
      setConverting(false);
    }
  };

  const termLabel = terms.find((t) => String(t.id) === termId);
  const campusLabel = campuses.find((c) => String(c.id) === campusId);

  return (
    <div className="h-full min-h-0 bg-background flex flex-col overflow-hidden">
      <div className="shrink-0 border-b border-border/60 bg-gradient-to-r from-sky-100/80 via-muted/30 to-muted/20 px-3 py-2">
        <div className="flex items-start gap-2">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-border/60 bg-background text-muted-foreground">
            <AlertCircle className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="setup-type-page-title leading-tight">Students with Incomplete Grade</h1>
            <p className="setup-type-page-desc mt-0.5 text-sky-900/85 dark:text-sky-200/80">
              Use this module to convert the student&apos;s INC grades that have met the due date to failing grade.
            </p>
          </div>
        </div>
      </div>

      <div className="shrink-0 border-b border-border/60 bg-card px-3 py-2 flex flex-wrap items-end gap-3">
        <div className="space-y-1 min-w-[220px]">
          <Label className="text-[10px] uppercase text-muted-foreground">Academic year and semester</Label>
          <select
            className="h-8 w-full max-w-xs rounded-lg border border-border/60 bg-background px-2 text-xs"
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
        <div className="space-y-1 min-w-[180px]">
          <Label className="text-[10px] uppercase text-muted-foreground">Campus name</Label>
          <select
            className="h-8 w-full max-w-xs rounded-lg border border-border/60 bg-background px-2 text-xs"
            value={campusId}
            onChange={(e) => setCampusId(e.target.value)}
          >
            {campuses.map((c) => (
              <option key={c.id} value={String(c.id)}>
                {c.acronym || c.campus_name || `Campus ${c.id}`}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1 min-w-[160px]">
          <Label className="text-[10px] uppercase text-muted-foreground">INC due date</Label>
          <div className="flex flex-wrap items-center gap-2">
            <Input
              type="date"
              className="h-8 w-[140px] rounded-lg text-xs"
              value={incDueInput}
              onChange={(e) => setIncDueInput(e.target.value)}
            />
            <Button type="button" variant="outline" size="sm" className="h-8 text-xs" disabled={savingDue} onClick={() => void saveIncDueDate()}>
              {savingDue ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Save date"}
            </Button>
          </div>
          <p className="text-[11px] font-medium text-destructive">
            {formatLongDate(incDueSaved)}
          </p>
        </div>
        <div className="flex items-center gap-2 pb-0.5">
          <Checkbox
            id="eligible"
            checked={eligibleOnly}
            onCheckedChange={(v) => setEligibleOnly(v === true)}
          />
          <Label htmlFor="eligible" className="text-[11px] cursor-pointer leading-tight max-w-[200px]">
            Only rows past INC due date (requires saved due date)
          </Label>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Button type="button" size="sm" className="h-8 text-xs gap-1" onClick={() => void loadList()} disabled={loading}>
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Users className="h-3.5 w-3.5" />}
            Generate list
          </Button>
          <Button type="button" variant="outline" size="sm" className="h-8 text-xs gap-1" onClick={() => void loadList()} disabled={loading}>
            <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
            Refresh
          </Button>
          <Button type="button" variant="outline" size="sm" className="h-8 text-xs gap-1" onClick={() => window.print()}>
            <Printer className="h-3.5 w-3.5" />
            Print
          </Button>
        </div>
      </div>

      <div className="flex-1 min-h-0 p-2 flex flex-col gap-2">
        <div className="flex-1 min-h-0 rounded-xl border border-border/60 bg-card overflow-hidden flex flex-col">
          <ScrollArea className="flex-1 min-h-0 w-full">
            <Table className="min-w-[2200px]">
              <TableHeader>
                <TableRow className="bg-emerald-50/70 dark:bg-emerald-950/30 hover:bg-emerald-50/70">
                  {COLS.map((c) => (
                    <TableHead key={c.key} className={cn("text-[9px] font-semibold uppercase px-1.5 h-8", c.w)}>
                      {c.key === "sel" ? (
                        <Checkbox
                          checked={allSelected}
                          onCheckedChange={(v) => toggleAll(v === true)}
                          aria-label="Select all"
                        />
                      ) : (
                        c.label
                      )}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={COLS.length} className="text-center py-12">
                      <Loader2 className="h-5 w-5 animate-spin inline text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ) : rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={COLS.length} className="text-center text-xs text-muted-foreground py-14">
                      No records. Choose term and campus, set INC due date if filtering by due date, then{" "}
                      <strong>Generate list</strong>. Rows are stored in{" "}
                      <code className="font-mono text-[10px]">incomplete_grade_line</code>.
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((r, idx) => (
                    <TableRow
                      key={r.id}
                      className={cn("hover:bg-muted/20", idx % 2 === 1 && "bg-emerald-50/25 dark:bg-emerald-950/15")}
                    >
                      <TableCell className="p-1">
                        <Checkbox
                          checked={!!selected[r.id]}
                          onCheckedChange={(v) =>
                            setSelected((prev) => ({ ...prev, [r.id]: v === true }))
                          }
                          aria-label={`Select ${r.student_no}`}
                        />
                      </TableCell>
                      <TableCell className="p-1 text-[11px] font-mono">{fmt(r.reg_id)}</TableCell>
                      <TableCell className="p-1 text-[11px] font-mono">{fmt(r.student_no)}</TableCell>
                      <TableCell className="p-1 text-[11px]">{fmt(r.student_name)}</TableCell>
                      <TableCell className="p-1 text-[11px]">{fmt(r.college_code)}</TableCell>
                      <TableCell className="p-1 text-[11px]">{fmt(r.course)}</TableCell>
                      <TableCell className="p-1 text-[11px]">{fmt(r.major_study)}</TableCell>
                      <TableCell className="p-1 text-[11px]">{fmt(r.year_level)}</TableCell>
                      <TableCell className="p-1 text-[11px] font-mono">{fmt(r.subject_code)}</TableCell>
                      <TableCell className="p-1 text-[11px]">{fmt(r.subject_title)}</TableCell>
                      <TableCell className="p-1 text-[11px] tabular-nums">{fmt(r.lec_units)}</TableCell>
                      <TableCell className="p-1 text-[11px] tabular-nums">{fmt(r.lab_units)}</TableCell>
                      <TableCell className="p-1 text-[11px] tabular-nums">{fmt(r.credit_units)}</TableCell>
                      <TableCell className="p-1 text-[11px] font-medium">{fmt(r.final)}</TableCell>
                      <TableCell className="p-1 text-[11px]">{fmt(r.re_exam_completed)}</TableCell>
                      <TableCell className="p-1 text-[11px]">{fmt(r.remarks)}</TableCell>
                      <TableCell className="p-1 text-[11px] font-mono">{fmt(r.sched_id)}</TableCell>
                      <TableCell className="p-1 text-[11px]">{fmt(r.faculty_name)}</TableCell>
                      <TableCell className="p-1 text-[11px]">{fmt(r.date_encoded)}</TableCell>
                      <TableCell className="p-1 text-[11px]">{fmt(r.posted_date)}</TableCell>
                      <TableCell className="p-1 text-[11px] font-mono">{fmt(r.regtabid)}</TableCell>
                      <TableCell className="p-1 text-[11px]">{fmt(r.inc_status)}</TableCell>
                      <TableCell className="p-1 text-[11px] font-mono">{fmt(r.grade_id)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </div>

        <div className="shrink-0 rounded-xl border border-border/60 bg-muted/15 px-3 py-2 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <div className="text-[11px] space-y-0.5">
            <div>
              <span className="font-semibold text-foreground/80">Total no. of record(s):</span>{" "}
              <span className="tabular-nums">{rows.length}</span>
            </div>
            <div className="text-destructive">
              <span className="font-semibold">Total no. of record(s) affected (selected):</span>{" "}
              <span className="tabular-nums">{selectedIds.length}</span>
            </div>
            <div className="text-[10px] text-muted-foreground hidden md:block">
              {termLabel ? `${termLabel.academic_year} ${termLabel.term}` : ""}
              {campusLabel ? ` · ${campusLabel.acronym || campusLabel.campus_name}` : ""}
            </div>
          </div>
          <div className="flex flex-wrap gap-2 justify-center sm:justify-end">
            <Button
              type="button"
              size="sm"
              className="h-8 text-xs gap-1 bg-emerald-600 hover:bg-emerald-700"
              disabled={!selectedIds.length || converting}
              onClick={() => void handleConvert()}
            >
              {converting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CircleArrowDown className="h-3.5 w-3.5" />}
              INC to failing grade
            </Button>
            <Button type="button" variant="outline" size="sm" className="h-8 text-xs gap-1" onClick={() => setSelected({})}>
              <Ban className="h-3.5 w-3.5" />
              Stop
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
