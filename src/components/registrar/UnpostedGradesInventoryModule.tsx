"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { FileUp, Loader2, Search } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL;

const CAMPUSES = ["PSU Narra", "Main Campus", "Extension campus"] as const;

const YEAR_LEVELS = [
  { value: "", label: "[All Year Levels]" },
  { value: "1", label: "1st Year" },
  { value: "2", label: "2nd Year" },
  { value: "3", label: "3rd Year" },
  { value: "4", label: "4th Year" },
  { value: "5", label: "5th Year" },
  { value: "6", label: "6th Year" },
] as const;

type YearTerm = { id: number; academic_year: string; term: string };

type CollegeRow = { id: number; college_code: string; college_name: string };

type ProgramRow = {
  id: number;
  college_id?: number;
  program_code: string;
  program_name: string;
};

type UnpostedRow = {
  id: number;
  academic_year_term_id: number;
  campus: string | null;
  college_code: string | null;
  program_code: string | null;
  year_level: string | null;
  grade_idx: string | null;
  student_no: string | null;
  student_name: string | null;
  college: string | null;
  program: string | null;
  year_level_display: string | null;
  course_code: string | null;
  course_title: string | null;
  class_section: string | null;
  midterm: string | null;
  final: string | null;
  remarks: string | null;
  reg_id: string | null;
  sort_order: number;
};

const cols = [
  "SELECT",
  "GRADE IDX",
  "STUDENT NO.",
  "STUDENT NAME",
  "COLLEGE",
  "PROGRAM",
  "YEAR LEVEL",
  "COURSE CODE",
  "COURSE TITLE",
  "CLASS SECTION",
  "MIDTERM",
  "FINAL",
  "REMARKS",
  "REGID",
] as const;

function fmt(v: string | null | undefined) {
  return v ?? "—";
}

export function UnpostedGradesInventoryModule() {
  const [terms, setTerms] = useState<YearTerm[]>([]);
  const [termId, setTermId] = useState("");
  const [campus, setCampus] = useState<string>(CAMPUSES[0]);
  const [colleges, setColleges] = useState<CollegeRow[]>([]);
  const [collegeId, setCollegeId] = useState<number | "">("");
  const [programs, setPrograms] = useState<ProgramRow[]>([]);
  const [programCode, setProgramCode] = useState("");
  const [yearLevel, setYearLevel] = useState("");
  const [rows, setRows] = useState<UnpostedRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Record<number, boolean>>({});

  const selectedCollege = useMemo(
    () => colleges.find((c) => c.id === collegeId),
    [colleges, collegeId]
  );

  const selectedCount = useMemo(() => Object.values(selected).filter(Boolean).length, [selected]);

  const loadRows = useCallback(async () => {
    if (!API || !termId || !campus || !selectedCollege) return;
    setLoading(true);
    try {
      const q = new URLSearchParams({
        academicYearTermId: termId,
        campus: campus.trim(),
        collegeCode: selectedCollege.college_code.trim(),
        programCode: programCode.trim(),
        yearLevel: yearLevel.trim(),
      });
      const res = await fetch(`${API}/api/registrar/unposted-grades-inventory?${q.toString()}`);
      if (!res.ok) throw new Error(await res.text());
      setRows((await res.json()) as UnpostedRow[]);
      setSelected({});
    } catch (e) {
      console.error(e);
      toast({
        title: "Search failed",
        description: e instanceof Error ? e.message : "Could not load unposted grades.",
        variant: "destructive",
      });
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [API, termId, campus, selectedCollege, programCode, yearLevel]);

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

  useEffect(() => {
    if (!API) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API}/api/colleges`);
        if (!res.ok) return;
        const list = (await res.json()) as CollegeRow[];
        if (cancelled) return;
        setColleges(list);
        setCollegeId((prev) => {
          if (prev !== "") return prev;
          const cah = list.find((c) => String(c.college_code).toUpperCase() === "CAH");
          return cah?.id ?? list[0]?.id ?? "";
        });
      } catch {
        /* noop */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [API]);

  useEffect(() => {
    if (!API || collegeId === "") return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API}/api/academic-programs?college_id=${encodeURIComponent(String(collegeId))}`);
        if (!res.ok) {
          setPrograms([]);
          return;
        }
        const list = (await res.json()) as ProgramRow[];
        if (!cancelled) setPrograms(list);
      } catch {
        if (!cancelled) setPrograms([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [API, collegeId]);

  const allSelected = rows.length > 0 && rows.every((r) => selected[r.id]);

  const toggleAll = (on: boolean) => {
    const next: Record<number, boolean> = {};
    if (on) for (const r of rows) next[r.id] = true;
    setSelected(next);
  };

  return (
    <div className="h-full min-h-0 bg-background flex flex-col overflow-hidden">
      <div className="shrink-0 bg-gradient-to-b from-sky-100/90 via-sky-50/50 to-muted/30 border-b border-border/60 px-3 py-2">
        <div className="flex flex-col gap-1 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <h1 className="setup-type-page-title leading-tight text-foreground">INVENTORY OF UNPOSTED GRADES</h1>
            <p className="text-xs sm:text-sm text-sky-800/90 dark:text-sky-200/90 mt-0.5 max-w-3xl">
              Use this module to trace the unposted grades before to generate the report of grades.
            </p>
          </div>
        </div>
      </div>

      <div className="shrink-0 border-b border-border/60 bg-muted/25 px-3 py-2">
        <div className="flex flex-col gap-2 xl:flex-row xl:items-end xl:justify-between">
          <div className="flex flex-wrap items-end gap-2">
            <div className="space-y-1 min-w-[120px]">
              <Label className="text-[10px] uppercase text-muted-foreground">Select campus</Label>
              <select
                className="h-8 w-full rounded-lg border border-border/60 bg-background px-2 text-xs"
                value={campus}
                onChange={(e) => setCampus(e.target.value)}
              >
                {CAMPUSES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1 min-w-[180px]">
              <Label className="text-[10px] uppercase text-muted-foreground">Academic year / term</Label>
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
              <Label className="text-[10px] uppercase text-muted-foreground">College</Label>
              <select
                className="h-8 w-full min-w-[100px] rounded-lg border border-border/60 bg-background px-2 text-xs"
                value={collegeId === "" ? "" : String(collegeId)}
                onChange={(e) => {
                  const v = e.target.value;
                  setCollegeId(v === "" ? "" : Number(v));
                  setProgramCode("");
                }}
              >
                {colleges.length === 0 ? (
                  <option value="">—</option>
                ) : (
                  colleges.map((c) => (
                    <option key={c.id} value={String(c.id)}>
                      {c.college_code} — {c.college_name}
                    </option>
                  ))
                )}
              </select>
            </div>
            <div className="space-y-1 min-w-[160px]">
              <Label className="text-[10px] uppercase text-muted-foreground">Program</Label>
              <select
                className="h-8 w-full min-w-[160px] rounded-lg border border-border/60 bg-background px-2 text-xs"
                value={programCode}
                onChange={(e) => setProgramCode(e.target.value)}
                disabled={collegeId === ""}
              >
                <option value="">[All Academic Programs]</option>
                {programs.map((p) => (
                  <option key={p.id} value={p.program_code}>
                    {p.program_code} — {p.program_name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1 min-w-[130px]">
              <Label className="text-[10px] uppercase text-muted-foreground">Year level</Label>
              <select
                className="h-8 w-full rounded-lg border border-border/60 bg-background px-2 text-xs"
                value={yearLevel}
                onChange={(e) => setYearLevel(e.target.value)}
              >
                {YEAR_LEVELS.map((y) => (
                  <option key={y.value || "all"} value={y.value}>
                    {y.label}
                  </option>
                ))}
              </select>
            </div>
            <Button
              type="button"
              className="h-8 text-xs gap-1.5 rounded-lg"
              onClick={() => void loadRows()}
              disabled={loading || !selectedCollege}
            >
              {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
              Search
            </Button>
          </div>
          <Button
            type="button"
            variant="secondary"
            className="h-9 text-xs gap-1.5 shrink-0"
            disabled={selectedCount === 0}
            onClick={() =>
              toast({
                title: "Post grades",
                description: `${selectedCount} row(s) selected. Grade posting will be wired to the encoding service in a later step.`,
              })
            }
          >
            <FileUp className="h-4 w-4" />
            Post Grades!
          </Button>
        </div>
      </div>

      <div className="flex-1 min-h-0 p-2 flex flex-col">
        <div className="flex-1 min-h-0 rounded-xl border border-border/60 bg-card shadow-sm overflow-hidden flex flex-col">
          <div className="shrink-0 bg-sky-200/50 dark:bg-sky-950/40 border-b border-border/50 px-2 py-1 flex justify-end">
            <span className="text-[11px] font-bold uppercase tracking-wide text-foreground/80">
              Unposted grade lines
            </span>
          </div>
          <ScrollArea className="flex-1 min-h-[200px]">
            <Table>
              <TableHeader>
                <TableRow className="bg-sky-100/70 dark:bg-sky-950/50 hover:bg-sky-100/70 dark:hover:bg-sky-950/50">
                  <TableHead className="w-10 px-1">
                    <Checkbox
                      checked={allSelected}
                      onCheckedChange={(v) => toggleAll(v === true)}
                      disabled={rows.length === 0}
                      aria-label="Select all"
                    />
                  </TableHead>
                  {cols.slice(1).map((c) => (
                    <TableHead
                      key={c}
                      className="whitespace-nowrap text-[10px] font-semibold uppercase text-foreground px-1.5"
                    >
                      {c}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={cols.length} className="text-center py-12">
                      <Loader2 className="h-5 w-5 animate-spin inline text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ) : rows.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={cols.length}
                      className="text-center text-xs text-muted-foreground py-14 bg-muted/15"
                    >
                      No rows yet. Choose campus, term, and college, then click <strong>Search</strong>. Data is stored
                      in <code className="font-mono text-[10px]">unposted_grades_inventory</code> (PostgreSQL).
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((r) => (
                    <TableRow key={r.id} className="hover:bg-muted/30">
                      <TableCell className="px-1">
                        <Checkbox
                          checked={!!selected[r.id]}
                          onCheckedChange={(v) =>
                            setSelected((s) => ({
                              ...s,
                              [r.id]: v === true,
                            }))
                          }
                          aria-label={`Select row ${r.id}`}
                        />
                      </TableCell>
                      <TableCell className="font-mono text-[11px]">{fmt(r.grade_idx)}</TableCell>
                      <TableCell className="font-mono text-[11px]">{fmt(r.student_no)}</TableCell>
                      <TableCell className="text-[11px] max-w-[140px] truncate" title={fmt(r.student_name)}>
                        {fmt(r.student_name)}
                      </TableCell>
                      <TableCell className="text-[11px]">{fmt(r.college)}</TableCell>
                      <TableCell className="text-[11px] max-w-[120px] truncate" title={fmt(r.program)}>
                        {fmt(r.program)}
                      </TableCell>
                      <TableCell className="text-[11px]">{fmt(r.year_level_display)}</TableCell>
                      <TableCell className="font-mono text-[11px]">{fmt(r.course_code)}</TableCell>
                      <TableCell className="text-[11px] max-w-[160px] truncate" title={fmt(r.course_title)}>
                        {fmt(r.course_title)}
                      </TableCell>
                      <TableCell className="text-[11px]">{fmt(r.class_section)}</TableCell>
                      <TableCell className="text-[11px]">{fmt(r.midterm)}</TableCell>
                      <TableCell className="text-[11px]">{fmt(r.final)}</TableCell>
                      <TableCell className="text-[11px] max-w-[100px] truncate" title={fmt(r.remarks)}>
                        {fmt(r.remarks)}
                      </TableCell>
                      <TableCell className="font-mono text-[11px]">{fmt(r.reg_id)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </ScrollArea>
          <div className="shrink-0 border-t border-border/60 px-3 py-1.5 flex flex-wrap justify-between gap-2 text-[10px] text-muted-foreground">
            <span>
              Rows: <span className="font-semibold text-foreground">{rows.length}</span>
              {selectedCount > 0 ? (
                <span className="ml-2">
                  Selected: <span className="font-semibold text-foreground">{selectedCount}</span>
                </span>
              ) : null}
            </span>
            <span className="hidden sm:inline">API: {API ? "configured" : "not set"}</span>
          </div>
        </div>
      </div>

      <footer className="shrink-0 border-t border-border/60 bg-muted/20 px-3 py-1 text-[10px] text-muted-foreground">
        Registrar • Inventory of unposted grades
      </footer>
    </div>
  );
}
