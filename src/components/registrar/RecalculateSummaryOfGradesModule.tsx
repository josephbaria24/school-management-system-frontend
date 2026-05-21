"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { Loader2, Printer, RefreshCw, Search, XCircle } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL;

type YearTerm = { id: number; academic_year: string; term: string };
type Campus = { id: number; acronym: string; campus_name: string | null };
type CollegeRow = { id: number; campus_id?: number | null; college_code: string; college_name: string };

type SummaryRow = {
  id: number;
  reg_id: string | null;
  student_no: string;
  student_name: string | null;
  college: string | null;
  program: string | null;
  year_level: string | null;
  enrolled_courses: number;
  credit_units_enrolled: string;
  credit_units_earned: string;
  gwa: string | null;
  qualified: string | null;
  remarks: string | null;
  scholastic_delinquency: string | null;
};

function fmt(v: string | number | null | undefined) {
  if (v === null || v === undefined) return "—";
  const s = String(v).trim();
  return s === "" ? "—" : s;
}

export function RecalculateSummaryOfGradesModule() {
  const abortRef = useRef<AbortController | null>(null);
  const [terms, setTerms] = useState<YearTerm[]>([]);
  const [termId, setTermId] = useState("");
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [campusId, setCampusId] = useState("");
  const [colleges, setColleges] = useState<CollegeRow[]>([]);
  const [collegeId, setCollegeId] = useState("");
  const [gradeLevel, setGradeLevel] = useState("College");
  const [formatKey, setFormatKey] = useState("format_1");
  const [rows, setRows] = useState<SummaryRow[]>([]);
  const [selected, setSelected] = useState<Record<number, boolean>>({});
  const [applyEntireList, setApplyEntireList] = useState(false);
  const [recomputeAllTerms, setRecomputeAllTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [recalculating, setRecalculating] = useState(false);

  const selectedCollege = useMemo(
    () => colleges.find((c) => String(c.id) === collegeId),
    [colleges, collegeId]
  );

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
        const [tRes, cRes, colRes] = await Promise.all([
          fetch(`${API}/api/academic-year-terms`),
          fetch(`${API}/api/campuses`),
          fetch(`${API}/api/colleges`),
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
        if (colRes.ok) setColleges((await colRes.json()) as CollegeRow[]);
      } catch {
        /* noop */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!campusId) return;
    const cid = Number(campusId);
    const match = colleges.filter((c) => (c.campus_id == null ? true : Number(c.campus_id) === cid));
    if (!match.length) {
      setCollegeId("");
      return;
    }
    setCollegeId((prev) => {
      if (prev && match.some((c) => String(c.id) === prev)) return prev;
      return String(match[0].id);
    });
  }, [campusId, colleges]);

  const loadList = useCallback(async () => {
    if (!API || !termId || !campusId || !selectedCollege) {
      toast({ title: "Select campus and college", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const q = new URLSearchParams({
        academicYearTermId: termId,
        campusId,
        collegeCode: selectedCollege.college_code.trim(),
      });
      const res = await fetch(`${API}/api/registrar/recalculate-summary-of-grades?${q.toString()}`);
      if (!res.ok) throw new Error(await res.text());
      const data = (await res.json()) as SummaryRow[];
      setRows(data);
      setSelected({});
    } catch (e) {
      console.error(e);
      toast({
        title: "Search failed",
        description: e instanceof Error ? e.message : "Could not load summaries.",
        variant: "destructive",
      });
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [API, termId, campusId, selectedCollege]);

  const stopRecalc = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    setRecalculating(false);
  };

  const runRecalculate = async () => {
    if (!API || !termId || !campusId || !selectedCollege) return;
    if (!applyEntireList && !selectedIds.length) {
      toast({ title: "Select rows or enable entire list", variant: "destructive" });
      return;
    }
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    const signal = abortRef.current.signal;
    setRecalculating(true);
    try {
      const body: Record<string, unknown> = {
        gradeLevel,
        format: formatKey,
        recomputeAllTerms,
      };
      if (applyEntireList) {
        body.allInFilter = {
          academicYearTermId: Number(termId),
          campusId: Number(campusId),
          collegeCode: selectedCollege.college_code.trim(),
        };
      } else {
        body.ids = selectedIds;
      }
      const res = await fetch(`${API}/api/registrar/recalculate-summary-of-grades`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal,
      });
      if (!res.ok) throw new Error(await res.text());
      const data = (await res.json()) as { processed: number };
      toast({
        title: "Recalculation finished",
        description: `${data.processed} summary row(s) updated.`,
      });
      await loadList();
    } catch (e) {
      if (e instanceof Error && e.name === "AbortError") {
        toast({ title: "Stopped", description: "Recalculation was cancelled." });
      } else {
        console.error(e);
        toast({
          title: "Recalculation failed",
          description: e instanceof Error ? e.message : "Request failed.",
          variant: "destructive",
        });
      }
    } finally {
      setRecalculating(false);
      abortRef.current = null;
    }
  };

  const canRecalculate = rows.length > 0 && (applyEntireList || selectedIds.length > 0);

  return (
    <div className="h-full min-h-0 bg-background flex flex-col overflow-hidden">
      <div className="shrink-0 border-b border-border/60 bg-gradient-to-r from-sky-100/80 via-muted/30 to-muted/20 px-3 py-2">
        <div className="flex items-start gap-2">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-border/60 bg-background text-muted-foreground">
            <RefreshCw className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="setup-type-page-title leading-tight">RECALCULATE SUMMARY OF GRADES</h1>
            <p className="setup-type-page-desc mt-0.5 text-sky-900/85 dark:text-sky-200/80">
              Use this module to recompute the courses enrolled, credit units enrolled, credit units earned and GWA.
            </p>
          </div>
        </div>
      </div>

      <div className="shrink-0 border-b border-border/60 bg-muted/30 px-3 py-2 flex flex-wrap items-end gap-3">
        <div className="space-y-1 min-w-[140px]">
          <Label className="text-[10px] uppercase text-muted-foreground">Select campus</Label>
          <select
            className="h-8 w-full max-w-[200px] rounded-lg border border-border/60 bg-background px-2 text-xs"
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
        <div className="space-y-1 min-w-[200px]">
          <Label className="text-[10px] uppercase text-muted-foreground">Academic year / term</Label>
          <select
            className="h-8 w-full max-w-[260px] rounded-lg border border-border/60 bg-background px-2 text-xs"
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
        <div className="space-y-1 min-w-[160px]">
          <Label className="text-[10px] uppercase text-muted-foreground">College</Label>
          <select
            className="h-8 w-full max-w-[220px] rounded-lg border border-border/60 bg-background px-2 text-xs"
            value={collegeId}
            onChange={(e) => setCollegeId(e.target.value)}
            disabled={!colleges.filter((c) => !campusId || c.campus_id == null || Number(c.campus_id) === Number(campusId)).length}
          >
            {colleges
              .filter((c) => !campusId || c.campus_id == null || Number(c.campus_id) === Number(campusId))
              .map((c) => (
                <option key={c.id} value={String(c.id)}>
                  {c.college_code} — {c.college_name}
                </option>
              ))}
          </select>
        </div>
        <div className="space-y-1 min-w-[90px]">
          <Label className="text-[10px] uppercase text-muted-foreground">Grade level</Label>
          <Input className="h-8 text-xs" value={gradeLevel} onChange={(e) => setGradeLevel(e.target.value)} />
        </div>
        <div className="space-y-1 min-w-[90px]">
          <Label className="text-[10px] uppercase text-muted-foreground">Format</Label>
          <Input className="h-8 text-xs font-mono" value={formatKey} onChange={(e) => setFormatKey(e.target.value)} />
        </div>
        <Button type="button" size="sm" className="h-8 text-xs gap-1" onClick={() => void loadList()} disabled={loading}>
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
          Search
        </Button>
        <div className="flex items-center gap-2 pb-0.5">
          <Checkbox
            id="allTerms"
            checked={recomputeAllTerms}
            onCheckedChange={(v) => setRecomputeAllTerms(v === true)}
          />
          <Label htmlFor="allTerms" className="text-[11px] cursor-pointer leading-tight max-w-[160px]">
            Recompute all terms (same student_no across stored summaries)
          </Label>
        </div>
        <div className="flex items-center gap-2 pb-0.5">
          <Checkbox
            id="entire"
            checked={applyEntireList}
            onCheckedChange={(v) => setApplyEntireList(v === true)}
          />
          <Label htmlFor="entire" className="text-[11px] cursor-pointer">
            Recalculate entire result set (ignore row selection)
          </Label>
        </div>
        <Button
          type="button"
          size="sm"
          className="h-8 text-xs gap-1"
          disabled={!canRecalculate || recalculating}
          onClick={() => void runRecalculate()}
        >
          {recalculating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
          Recalculate!
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 text-xs gap-1"
          disabled={!recalculating}
          onClick={stopRecalc}
        >
          <XCircle className="h-3.5 w-3.5" />
          Stop!
        </Button>
        <Button type="button" variant="ghost" size="sm" className="h-8 text-xs gap-1" onClick={() => window.print()}>
          <Printer className="h-3.5 w-3.5" />
          Print
        </Button>
      </div>

      <div className="flex-1 min-h-0 p-2 flex flex-col gap-2">
        <div className="flex-1 min-h-0 rounded-xl border border-border/60 bg-card overflow-hidden flex flex-col">
          <ScrollArea className="flex-1 min-h-0 w-full">
            <Table className="min-w-[1400px]">
              <TableHeader>
                <TableRow className="bg-sky-100/70 dark:bg-sky-950/35 hover:bg-sky-100/70">
                  <TableHead className="text-[9px] font-semibold uppercase px-1.5 w-10">
                    <Checkbox
                      checked={allSelected}
                      onCheckedChange={(v) => {
                        const next: Record<number, boolean> = {};
                        if (v === true) rows.forEach((r) => (next[r.id] = true));
                        setSelected(next);
                      }}
                      aria-label="Select all"
                    />
                  </TableHead>
                  <TableHead className="text-[9px] font-semibold uppercase px-1.5 min-w-[72px]">Reg. ID</TableHead>
                  <TableHead className="text-[9px] font-semibold uppercase px-1.5 min-w-[88px]">Student no.</TableHead>
                  <TableHead className="text-[9px] font-semibold uppercase px-1.5 min-w-[140px]">Student name</TableHead>
                  <TableHead className="text-[9px] font-semibold uppercase px-1.5 min-w-[100px]">College</TableHead>
                  <TableHead className="text-[9px] font-semibold uppercase px-1.5 min-w-[120px]">Program</TableHead>
                  <TableHead className="text-[9px] font-semibold uppercase px-1.5 min-w-[56px]">Year level</TableHead>
                  <TableHead className="text-[9px] font-semibold uppercase px-1.5 min-w-[72px]">Enrolled courses</TableHead>
                  <TableHead className="text-[9px] font-semibold uppercase px-1.5 min-w-[88px]">Credit units enrolled</TableHead>
                  <TableHead className="text-[9px] font-semibold uppercase px-1.5 min-w-[88px]">Credit units earned</TableHead>
                  <TableHead className="text-[9px] font-semibold uppercase px-1.5 min-w-[72px]">GWA / GPA</TableHead>
                  <TableHead className="text-[9px] font-semibold uppercase px-1.5 min-w-[56px]">Qualified</TableHead>
                  <TableHead className="text-[9px] font-semibold uppercase px-1.5 min-w-[140px]">Remarks</TableHead>
                  <TableHead className="text-[9px] font-semibold uppercase px-1.5 min-w-[160px]">Scholastic delinquency</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={14} className="text-center py-12">
                      <Loader2 className="h-5 w-5 animate-spin inline text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ) : rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={14} className="text-center text-xs text-muted-foreground py-14 px-4">
                      No rows for this campus, term, and college. Populate{" "}
                      <code className="font-mono text-[10px]">student_grade_summary</code> and use correction grade
                      lines for the same student and term to drive recomputation.
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((r, idx) => (
                    <TableRow
                      key={r.id}
                      className={cn("hover:bg-muted/20", idx % 2 === 1 && "bg-sky-50/40 dark:bg-sky-950/20")}
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
                      <TableCell className="p-1 text-[11px]">{fmt(r.college)}</TableCell>
                      <TableCell className="p-1 text-[11px]">{fmt(r.program)}</TableCell>
                      <TableCell className="p-1 text-[11px]">{fmt(r.year_level)}</TableCell>
                      <TableCell className="p-1 text-[11px] tabular-nums">{r.enrolled_courses}</TableCell>
                      <TableCell className="p-1 text-[11px] tabular-nums">{fmt(r.credit_units_enrolled)}</TableCell>
                      <TableCell className="p-1 text-[11px] tabular-nums">{fmt(r.credit_units_earned)}</TableCell>
                      <TableCell className="p-1 text-[11px] tabular-nums font-medium">{fmt(r.gwa)}</TableCell>
                      <TableCell className="p-1 text-[11px]">{fmt(r.qualified)}</TableCell>
                      <TableCell className="p-1 text-[11px] max-w-[200px] truncate" title={r.remarks ?? ""}>
                        {fmt(r.remarks)}
                      </TableCell>
                      <TableCell className="p-1 text-[11px] max-w-[220px] truncate" title={r.scholastic_delinquency ?? ""}>
                        {fmt(r.scholastic_delinquency)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </div>

        <div className="shrink-0 rounded-xl border border-border/60 bg-muted/15 px-3 py-2 text-[11px] flex flex-wrap gap-4 justify-between">
          <div>
            <span className="font-semibold text-foreground/80">Total no. of record(s):</span>{" "}
            <span className="tabular-nums">{rows.length}</span>
          </div>
          <div className="text-destructive">
            <span className="font-semibold">Selected for recalculation:</span>{" "}
            <span className="tabular-nums">{applyEntireList ? rows.length : selectedIds.length}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
