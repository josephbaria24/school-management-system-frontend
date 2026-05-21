"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { FileBarChart, Loader2, LogOut, Printer, Search } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL;

type YearTerm = { id: number; academic_year: string; term: string };
type Campus = { id: number; acronym: string; campus_name: string | null };
type CollegeRow = { id: number; campus_id?: number | null; college_code: string; college_name: string };
type ProgramRow = { id: number; college_id: number; program_code?: string | null; program_name?: string | null };

type ReportStudentPick = {
  student_no: string;
  student_name: string | null;
  college: string | null;
  program: string | null;
  year_level: string | null;
};

type ReportGradeRow = {
  academic_year_term_label: string;
  course_code: string | null;
  course_title: string | null;
  class_section: string | null;
  unit: string | null;
  midterm: string | null;
  final: string | null;
  re_exam: string | null;
  credited_units: string | null;
  remark: string | null;
};

type StudentReport = {
  student_no: string;
  student_name: string | null;
  college: string | null;
  program: string | null;
  year_level: string | null;
  campus: string | null;
  registration_no: string | null;
  lines: ReportGradeRow[];
};

type PreviewPayload = {
  layout: string;
  layout_label: string;
  term_label: string;
  campus_name: string;
  reports: StudentReport[];
};

type OptionsPayload = {
  layouts: { key: string; label: string }[];
  sort_options: { key: string; label: string }[];
  year_levels: { key: string; label: string }[];
};

function fmt(v: string | null | undefined) {
  const s = v == null ? "" : String(v).trim();
  return s || "—";
}

function openPrintPreview(data: PreviewPayload) {
  const layout = data.layout;
  const gradeCols =
    layout === "midterm"
      ? ["Midterm"]
      : layout === "full"
        ? ["Midterm", "Final", "Re-ex"]
        : ["Final", "Re-ex"];

  const headCols = ["Year/term", "Code", "Title", "Section", "Units", ...gradeCols, "Credited", "Remarks"];

  const blocks = data.reports
    .map((rep) => {
      const rows =
        rep.lines.length === 0
          ? `<tr><td colspan="${headCols.length}" style="text-align:center;padding:12px;color:#666">No grade rows on file.</td></tr>`
          : rep.lines
              .map((ln) => {
                const grades =
                  layout === "midterm"
                    ? `<td>${fmt(ln.midterm)}</td>`
                    : layout === "full"
                      ? `<td>${fmt(ln.midterm)}</td><td>${fmt(ln.final)}</td><td>${fmt(ln.re_exam)}</td>`
                      : `<td>${fmt(ln.final)}</td><td>${fmt(ln.re_exam)}</td>`;
                return `<tr>
                  <td>${fmt(ln.academic_year_term_label)}</td>
                  <td>${fmt(ln.course_code)}</td>
                  <td>${fmt(ln.course_title)}</td>
                  <td>${fmt(ln.class_section)}</td>
                  <td style="text-align:right">${fmt(ln.unit)}</td>
                  ${grades}
                  <td style="text-align:right">${fmt(ln.credited_units)}</td>
                  <td>${fmt(ln.remark)}</td>
                </tr>`;
              })
              .join("");
      return `
        <section class="report-block">
          <h2>Report of grades — ${fmt(rep.student_name)} (${fmt(rep.student_no)})</h2>
          <p class="meta">
            ${fmt(data.campus_name)} · ${fmt(data.term_label)} · ${fmt(rep.college)} · ${fmt(rep.program)} · ${fmt(rep.year_level)}
            ${rep.registration_no ? ` · Reg. ${fmt(rep.registration_no)}` : ""}
          </p>
          <table>
            <thead><tr>${headCols.map((c) => `<th>${c}</th>`).join("")}</tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </section>
      `;
    })
    .join("");

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Report of grades</title>
    <style>
      body { font-family: Tahoma, Arial, sans-serif; font-size: 11px; margin: 16px; color: #111; }
      h1 { font-size: 16px; margin: 0 0 4px; text-transform: uppercase; }
      .subtitle { color: #444; margin-bottom: 16px; }
      .report-block { page-break-inside: avoid; margin-bottom: 24px; }
      .report-block h2 { font-size: 13px; margin: 0 0 4px; }
      .meta { margin: 0 0 8px; color: #333; font-size: 10px; }
      table { width: 100%; border-collapse: collapse; }
      th, td { border: 1px solid #999; padding: 4px 6px; vertical-align: top; }
      th { background: #c6d9f1; font-size: 9px; text-transform: uppercase; }
      @media print { body { margin: 8mm; } }
    </style></head><body>
    <h1>Report of grades</h1>
    <p class="subtitle">${fmt(data.layout_label)} · ${fmt(data.campus_name)} · ${fmt(data.term_label)}</p>
    ${blocks}
    <script>window.onload = function(){ window.print(); }</script>
  </body></html>`;

  const w = window.open("", "_blank", "noopener,noreferrer,width=900,height=700");
  if (!w) {
    toast({ title: "Pop-up blocked", description: "Allow pop-ups to print the report.", variant: "destructive" });
    return;
  }
  w.document.open();
  w.document.write(html);
  w.document.close();
}

const selectClass =
  "h-8 w-full min-w-0 rounded-lg border border-border/60 bg-background px-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

function FieldRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-[120px_1fr] items-center gap-2">
      <Label className="text-[10px] uppercase text-muted-foreground">{label}</Label>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

function SearchField({
  value,
  onSearch,
  disabled,
}: {
  value: string;
  onSearch: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex gap-1">
      <Input
        readOnly
        className="h-8 flex-1 rounded-lg text-xs"
        value={value}
        placeholder="Search to select…"
        disabled={disabled}
      />
      <Button
        type="button"
        size="icon"
        variant="secondary"
        className="h-8 w-8 shrink-0"
        onClick={onSearch}
        disabled={disabled}
      >
        <Search className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

export function ReportOfGradesModule() {
  const router = useRouter();
  const collegePickerRef = useRef<HTMLDivElement>(null);
  const programPickerRef = useRef<HTMLDivElement>(null);

  const [terms, setTerms] = useState<YearTerm[]>([]);
  const [termId, setTermId] = useState("");
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [campusId, setCampusId] = useState("");
  const [colleges, setColleges] = useState<CollegeRow[]>([]);
  const [programs, setPrograms] = useState<ProgramRow[]>([]);
  const [options, setOptions] = useState<OptionsPayload | null>(null);
  const [layout, setLayout] = useState("final_grade");

  const [printMode, setPrintMode] = useState<"individual" | "bulk">("individual");
  const [studentQuery, setStudentQuery] = useState("");
  const [searchHits, setSearchHits] = useState<ReportStudentPick[]>([]);
  const [searching, setSearching] = useState(false);
  const [picked, setPicked] = useState<ReportStudentPick[]>([]);
  const [studentListOpen, setStudentListOpen] = useState(false);
  const [printing, setPrinting] = useState(false);

  const [byCollege, setByCollege] = useState(false);
  const [collegeId, setCollegeId] = useState("");
  const [collegeFilter, setCollegeFilter] = useState("");
  const [collegePickerOpen, setCollegePickerOpen] = useState(false);

  const [byProgram, setByProgram] = useState(false);
  const [programId, setProgramId] = useState("");
  const [programFilter, setProgramFilter] = useState("");
  const [programPickerOpen, setProgramPickerOpen] = useState(false);

  const [yearLevel, setYearLevel] = useState("");
  const [sortBy, setSortBy] = useState("name");

  const selectedCollege = useMemo(
    () => colleges.find((c) => String(c.id) === collegeId),
    [colleges, collegeId]
  );

  const selectedProgram = useMemo(
    () => programs.find((p) => String(p.id) === programId),
    [programs, programId]
  );

  const collegeDisplay = selectedCollege
    ? `${selectedCollege.college_code} — ${selectedCollege.college_name}`
    : "";

  const programDisplay = selectedProgram
    ? [selectedProgram.program_code, selectedProgram.program_name].filter(Boolean).join(" ") ||
      `Program #${selectedProgram.id}`
    : "";

  const campusColleges = useMemo(() => {
    if (!campusId) return colleges;
    const cid = Number(campusId);
    return colleges.filter((c) => c.campus_id == null || Number(c.campus_id) === cid);
  }, [colleges, campusId]);

  const filteredColleges = useMemo(() => {
    const q = collegeFilter.trim().toLowerCase();
    if (!q) return campusColleges;
    return campusColleges.filter((c) =>
      `${c.college_code} ${c.college_name}`.toLowerCase().includes(q)
    );
  }, [campusColleges, collegeFilter]);

  const collegePrograms = useMemo(() => {
    if (!selectedCollege) return programs;
    return programs.filter((p) => p.college_id === selectedCollege.id);
  }, [programs, selectedCollege]);

  const filteredPrograms = useMemo(() => {
    const q = programFilter.trim().toLowerCase();
    const base = collegePrograms;
    if (!q) return base;
    return base.filter((p) =>
      `${p.program_code ?? ""} ${p.program_name ?? ""}`.toLowerCase().includes(q)
    );
  }, [collegePrograms, programFilter]);

  useEffect(() => {
    if (!API) return;
    let cancelled = false;
    (async () => {
      try {
        const [tRes, cRes, colRes, pRes, oRes] = await Promise.all([
          fetch(`${API}/api/academic-year-terms`),
          fetch(`${API}/api/campuses`),
          fetch(`${API}/api/colleges`),
          fetch(`${API}/api/academic-programs`),
          fetch(`${API}/api/registrar/report-of-grades/options`),
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
        if (pRes.ok) setPrograms((await pRes.json()) as ProgramRow[]);
        if (oRes.ok) {
          const opts = (await oRes.json()) as OptionsPayload;
          setOptions(opts);
          if (opts.layouts?.[0]) setLayout((prev) => prev || opts.layouts[0].key);
          if (opts.sort_options?.[0]) setSortBy((prev) => prev || opts.sort_options[0].key);
        }
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
    const match = campusColleges;
    if (!match.length) {
      setCollegeId("");
      return;
    }
    setCollegeId((prev) => {
      if (prev && match.some((c) => String(c.id) === prev)) return prev;
      return String(match[0].id);
    });
  }, [campusId, campusColleges]);

  useEffect(() => {
    if (!selectedCollege) {
      setProgramId("");
      return;
    }
    const match = programs.filter((p) => p.college_id === selectedCollege.id);
    if (!match.length) {
      setProgramId("");
      return;
    }
    setProgramId((prev) => {
      if (prev && match.some((p) => String(p.id) === prev)) return prev;
      return String(match[0].id);
    });
  }, [selectedCollege, programs]);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      const t = e.target as Node;
      if (collegePickerRef.current && !collegePickerRef.current.contains(t)) {
        setCollegePickerOpen(false);
      }
      if (programPickerRef.current && !programPickerRef.current.contains(t)) {
        setProgramPickerOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const addStudent = useCallback((row: ReportStudentPick) => {
    setPicked((prev) => {
      if (prev.some((x) => x.student_no.toUpperCase() === row.student_no.toUpperCase())) return prev;
      return [...prev, row];
    });
    setStudentQuery("");
    setSearchHits([]);
  }, []);

  const runSearch = useCallback(async () => {
    const q = studentQuery.trim();
    if (!API || !termId || !campusId || !q) {
      setSearchHits([]);
      return;
    }
    setSearching(true);
    try {
      const params = new URLSearchParams({
        academicYearTermId: termId,
        campusId,
        q,
      });
      const res = await fetch(`${API}/api/registrar/report-of-grades/students?${params.toString()}`);
      if (!res.ok) throw new Error(await res.text());
      const rows = (await res.json()) as ReportStudentPick[];
      setSearchHits(rows);
      if (!rows.length) {
        toast({ title: "No students found", description: "Try a different student number or name." });
      }
    } catch (e) {
      console.error(e);
      toast({
        title: "Search failed",
        description: e instanceof Error ? e.message : "Could not search students.",
        variant: "destructive",
      });
      setSearchHits([]);
    } finally {
      setSearching(false);
    }
  }, [API, termId, campusId, studentQuery]);

  const addByNumber = useCallback(async () => {
    const q = studentQuery.trim();
    if (!q) return;
    if (searchHits.length === 1) {
      addStudent(searchHits[0]);
      return;
    }
    if (searchHits.length > 1) {
      const exact = searchHits.find((h) => h.student_no.toUpperCase() === q.toUpperCase());
      if (exact) {
        addStudent(exact);
        return;
      }
      toast({ title: "Select a student", description: "Pick a row from the search results." });
      return;
    }
    addStudent({
      student_no: q,
      student_name: null,
      college: null,
      program: null,
      year_level: null,
    });
  }, [studentQuery, searchHits, addStudent]);

  const handlePrint = useCallback(async () => {
    if (!API || !termId || !campusId) {
      toast({ title: "Select academic year and campus", variant: "destructive" });
      return;
    }
    if (printMode === "individual" && !picked.length) {
      toast({ title: "Add at least one student", variant: "destructive" });
      return;
    }
    if (printMode === "bulk" && byCollege && !selectedCollege) {
      toast({ title: "Select a college", variant: "destructive" });
      return;
    }
    if (printMode === "bulk" && byProgram && !selectedProgram) {
      toast({ title: "Select a program", variant: "destructive" });
      return;
    }

    setPrinting(true);
    try {
      const body: Record<string, unknown> = {
        academicYearTermId: Number(termId),
        campusId: Number(campusId),
        layout,
        mode: printMode,
      };

      if (printMode === "individual") {
        body.studentNos = picked.map((p) => p.student_no);
      } else {
        if (byCollege && selectedCollege) {
          body.collegeCode = selectedCollege.college_code.trim();
        }
        if (byProgram && selectedProgram) {
          body.program =
            selectedProgram.program_name?.trim() ||
            selectedProgram.program_code?.trim() ||
            String(selectedProgram.id);
        }
        if (yearLevel.trim()) body.yearLevel = yearLevel.trim();
        body.sortBy = sortBy;
      }

      const res = await fetch(`${API}/api/registrar/report-of-grades/preview`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = (await res.json()) as PreviewPayload;
      if (!data.reports?.length) {
        toast({ title: "No reports generated", description: "No grade data matched your selection." });
        return;
      }
      openPrintPreview(data);
    } catch (e) {
      console.error(e);
      toast({
        title: "Print failed",
        description: e instanceof Error ? e.message : "Could not build report preview.",
        variant: "destructive",
      });
    } finally {
      setPrinting(false);
    }
  }, [
    API,
    termId,
    campusId,
    layout,
    printMode,
    picked,
    byCollege,
    byProgram,
    selectedCollege,
    selectedProgram,
    yearLevel,
    sortBy,
  ]);

  return (
    <div className="h-full min-h-0 bg-background flex flex-col overflow-hidden">
      <div className="shrink-0 border-b border-border/60 bg-gradient-to-r from-sky-100/80 via-muted/30 to-muted/20 px-3 py-2">
        <div className="flex items-start gap-2">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-border/60 bg-background text-muted-foreground">
            <FileBarChart className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="setup-type-page-title leading-tight">REPORT OF GRADES</h1>
            <p className="setup-type-page-desc mt-0.5 text-sky-900/85 dark:text-sky-200/80">
              Allows you to print report of grades by individual and bulk printing.
            </p>
          </div>
        </div>
      </div>

      <div className="shrink-0 border-b border-amber-200/50 dark:border-amber-900/40 bg-gradient-to-r from-amber-50/90 to-muted/30 px-3 py-2">
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1 min-w-[200px]">
            <Label className="text-[10px] uppercase text-muted-foreground">Academic year</Label>
            <select className={selectClass} value={termId} onChange={(e) => setTermId(e.target.value)}>
              {terms.map((t) => (
                <option key={t.id} value={String(t.id)}>
                  {t.academic_year} {t.term}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1 min-w-[180px]">
            <Label className="text-[10px] uppercase text-muted-foreground">Campus</Label>
            <select className={selectClass} value={campusId} onChange={(e) => setCampusId(e.target.value)}>
              {campuses.map((c) => (
                <option key={c.id} value={String(c.id)}>
                  {[c.acronym, c.campus_name].filter(Boolean).join(" — ")}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1 min-w-[140px]">
            <Label className="text-[10px] uppercase text-muted-foreground">Layout</Label>
            <select className={selectClass} value={layout} onChange={(e) => setLayout(e.target.value)}>
              {(options?.layouts ?? [{ key: "final_grade", label: "Final Grade" }]).map((l) => (
                <option key={l.key} value={l.key}>
                  {l.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 p-2 flex flex-col gap-2">
        <div className="flex-1 min-h-0 rounded-xl border border-border/60 bg-card overflow-hidden flex flex-col">
          <ScrollArea className="flex-1 min-h-0">
            <div className="p-3 space-y-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Report options</p>

              <RadioGroup
                value={printMode}
                onValueChange={(v) => setPrintMode(v as "individual" | "bulk")}
                className="space-y-4"
              >
                <div className="space-y-2 rounded-lg border border-border/60 bg-muted/10 p-3">
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="individual" id="rog-individual" />
                    <Label htmlFor="rog-individual" className="text-xs font-medium cursor-pointer">
                      Individual printing
                    </Label>
                  </div>
                  <div className={cn("space-y-2 pl-1", printMode !== "individual" && "opacity-50 pointer-events-none")}>
                    <FieldRow label="Select student">
                      <div className="relative">
                        <div className="flex gap-1">
                          <Input
                            className="h-8 flex-1 rounded-lg text-xs font-mono"
                            placeholder="Student no. or name"
                            value={studentQuery}
                            onChange={(e) => setStudentQuery(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") void (searchHits.length ? addByNumber() : runSearch());
                            }}
                            disabled={printMode !== "individual"}
                          />
                          <Button
                            type="button"
                            size="icon"
                            variant="secondary"
                            className="h-8 w-8 shrink-0"
                            onClick={() => void runSearch()}
                            disabled={printMode !== "individual" || searching}
                          >
                            {searching ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
                          </Button>
                        </div>
                        {searchHits.length > 0 && printMode === "individual" && (
                          <div className="absolute z-20 left-0 right-9 top-full mt-1 max-h-28 overflow-y-auto rounded-lg border border-border/60 bg-popover shadow-md">
                            {searchHits.map((h) => (
                              <button
                                key={h.student_no}
                                type="button"
                                className="w-full text-left px-2 py-1 text-xs hover:bg-muted"
                                onClick={() => addStudent(h)}
                              >
                                <span className="font-mono font-semibold">{h.student_no}</span>
                                <span className="text-muted-foreground"> — {fmt(h.student_name)}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </FieldRow>
                    <div className="flex flex-wrap gap-1.5">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        className="h-8 text-xs"
                        onClick={() => setStudentListOpen(true)}
                        disabled={printMode !== "individual"}
                      >
                        Student list ({picked.length})
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs"
                        onClick={() => void addByNumber()}
                        disabled={printMode !== "individual" || !studentQuery.trim()}
                      >
                        Add
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs"
                        onClick={() => setPicked([])}
                        disabled={printMode !== "individual" || !picked.length}
                      >
                        Clear all
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 rounded-lg border border-border/60 bg-muted/10 p-3">
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="bulk" id="rog-bulk" />
                    <Label htmlFor="rog-bulk" className="text-xs font-medium cursor-pointer">
                      Bulk printing
                    </Label>
                  </div>
                  <div className={cn("space-y-3 pl-1", printMode !== "bulk" && "opacity-50 pointer-events-none")}>
                    <div className="grid grid-cols-1 sm:grid-cols-[120px_1fr] items-center gap-2">
                      <div className="flex items-center gap-2">
                        <Checkbox id="by-college" checked={byCollege} onCheckedChange={(v) => setByCollege(v === true)} disabled={printMode !== "bulk"} />
                        <Label htmlFor="by-college" className="text-xs cursor-pointer">By college</Label>
                      </div>
                      <div className="relative min-w-0" ref={collegePickerRef}>
                        <SearchField value={collegeDisplay} onSearch={() => { setCollegeFilter(""); setCollegePickerOpen((o) => !o); }} disabled={printMode !== "bulk" || !byCollege} />
                        {collegePickerOpen && byCollege && printMode === "bulk" && (
                          <div className="absolute z-20 left-0 right-0 top-full mt-1 rounded-lg border border-border/60 bg-popover shadow-md">
                            <Input className="h-8 rounded-none border-0 border-b text-xs" placeholder="Filter college…" value={collegeFilter} onChange={(e) => setCollegeFilter(e.target.value)} autoFocus />
                            <div className="max-h-28 overflow-y-auto">
                              {filteredColleges.map((c) => (
                                <button key={c.id} type="button" className="w-full text-left px-2 py-1 text-xs hover:bg-muted" onClick={() => { setCollegeId(String(c.id)); setCollegePickerOpen(false); }}>
                                  {c.college_code} — {c.college_name}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-[120px_1fr] items-center gap-2">
                      <div className="flex items-center gap-2">
                        <Checkbox id="by-program" checked={byProgram} onCheckedChange={(v) => setByProgram(v === true)} disabled={printMode !== "bulk"} />
                        <Label htmlFor="by-program" className="text-xs cursor-pointer">By program</Label>
                      </div>
                      <div className="relative min-w-0" ref={programPickerRef}>
                        <SearchField value={programDisplay} onSearch={() => { setProgramFilter(""); setProgramPickerOpen((o) => !o); }} disabled={printMode !== "bulk" || !byProgram} />
                        {programPickerOpen && byProgram && printMode === "bulk" && (
                          <div className="absolute z-20 left-0 right-0 top-full mt-1 rounded-lg border border-border/60 bg-popover shadow-md">
                            <Input className="h-8 rounded-none border-0 border-b text-xs" placeholder="Filter program…" value={programFilter} onChange={(e) => setProgramFilter(e.target.value)} autoFocus />
                            <div className="max-h-28 overflow-y-auto">
                              {filteredPrograms.map((p) => (
                                <button key={p.id} type="button" className="w-full text-left px-2 py-1 text-xs hover:bg-muted" onClick={() => { setProgramId(String(p.id)); setProgramPickerOpen(false); }}>
                                  {p.program_code ?? ""} {p.program_name ?? `Program #${p.id}`}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <FieldRow label="Year level">
                        <select className={selectClass} value={yearLevel} onChange={(e) => setYearLevel(e.target.value)} disabled={printMode !== "bulk"}>
                          {(options?.year_levels ?? [{ key: "", label: "[All years]" }]).map((yl) => (
                            <option key={yl.key || "all"} value={yl.key}>{yl.label}</option>
                          ))}
                        </select>
                      </FieldRow>
                      <FieldRow label="Sorted by">
                        <select className={selectClass} value={sortBy} onChange={(e) => setSortBy(e.target.value)} disabled={printMode !== "bulk"}>
                          {(options?.sort_options ?? [{ key: "name", label: "LastName, FirstName" }]).map((s) => (
                            <option key={s.key} value={s.key}>{s.label}</option>
                          ))}
                        </select>
                      </FieldRow>
                    </div>
                  </div>
                </div>
              </RadioGroup>
            </div>
          </ScrollArea>
        </div>

        <div className="shrink-0 rounded-xl border border-border/60 bg-muted/15 px-3 py-2 flex flex-wrap items-center justify-end gap-1.5">
          <Button type="button" size="sm" className="h-8 text-xs gap-1" onClick={() => void handlePrint()} disabled={printing}>
            {printing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Printer className="h-3.5 w-3.5" />}
            Print
          </Button>
          <Button type="button" variant="ghost" size="sm" className="h-8 text-xs gap-1" onClick={() => router.back()}>
            <LogOut className="h-3.5 w-3.5" />
            Exit
          </Button>
        </div>
      </div>

      <Dialog open={studentListOpen} onOpenChange={setStudentListOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Student list ({picked.length})</DialogTitle>
            <DialogDescription>Students queued for individual report printing.</DialogDescription>
          </DialogHeader>
          <div className="max-h-64 overflow-y-auto rounded-lg border border-border/60">
            {picked.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No students in list.</p>
            ) : (
              <ul className="divide-y divide-border/60">
                {picked.map((p) => (
                  <li key={p.student_no} className="flex items-center justify-between gap-2 px-2 py-2 text-sm">
                    <span><span className="font-mono font-semibold">{p.student_no}</span> — {fmt(p.student_name)}</span>
                    <Button type="button" variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setPicked((prev) => prev.filter((x) => x.student_no !== p.student_no))}>Remove</Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
