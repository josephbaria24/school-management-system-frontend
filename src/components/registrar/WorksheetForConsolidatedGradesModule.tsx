"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Loader2, LogOut, Printer, Search, Sheet, Square } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL;

type YearTerm = { id: number; academic_year: string; term: string };
type Campus = { id: number; acronym: string; campus_name: string | null };
type CollegeRow = { id: number; campus_id?: number | null; college_code: string; college_name: string };
type ProgramRow = { id: number; college_id: number; program_code?: string | null; program_name?: string | null };

type WorksheetCourseColumn = {
  key: string;
  course_code: string;
  course_title: string;
  class_section: string;
};

type WorksheetStudentRow = {
  student_no: string;
  student_name: string | null;
  college: string | null;
  program: string | null;
  year_level: string | null;
  grades: Record<string, string>;
};

type PreviewPayload = {
  layout: string;
  layout_label: string;
  term_label: string;
  campus_name: string;
  college_label: string | null;
  program_label: string | null;
  courses: WorksheetCourseColumn[];
  students: WorksheetStudentRow[];
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

function courseHeader(c: WorksheetCourseColumn) {
  const code = c.course_code.trim();
  const sec = c.class_section.trim();
  return sec ? `${code}\n${sec}` : code || "—";
}

function openWorksheetPrintPreview(data: PreviewPayload) {
  const courseCols = data.courses;
  const headStudent = ["Student no.", "Name", "Year"];
  const headCourse = courseCols.map((c) => courseHeader(c).replace(/\n/g, "<br/>"));
  const headerRow = [...headStudent, ...headCourse]
    .map((h) => `<th>${h}</th>`)
    .join("");

  const bodyRows = data.students
    .map((s) => {
      const gradeCells = courseCols
        .map((c) => `<td style="text-align:center">${fmt(s.grades[c.key])}</td>`)
        .join("");
      return `<tr>
        <td>${fmt(s.student_no)}</td>
        <td>${fmt(s.student_name)}</td>
        <td style="text-align:center">${fmt(s.year_level)}</td>
        ${gradeCells}
      </tr>`;
    })
    .join("");

  const filterBits = [
    data.college_label ? `College: ${fmt(data.college_label)}` : null,
    data.program_label ? `Program: ${fmt(data.program_label)}` : null,
  ].filter(Boolean);

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Worksheet for consolidated grades</title>
    <style>
      body { font-family: Tahoma, Arial, sans-serif; font-size: 9px; margin: 12px; color: #111; }
      h1 { font-size: 14px; margin: 0 0 4px; text-transform: uppercase; }
      .subtitle { color: #444; margin-bottom: 8px; font-size: 10px; }
      .filters { margin-bottom: 10px; font-size: 10px; color: #333; }
      table { width: 100%; border-collapse: collapse; }
      th, td { border: 1px solid #999; padding: 3px 4px; vertical-align: middle; }
      th { background: #c6d9f1; font-size: 8px; text-transform: uppercase; }
      th:first-child, td:first-child { white-space: nowrap; }
      @media print {
        body { margin: 6mm; }
        @page { size: landscape; }
      }
    </style></head><body>
    <h1>Worksheet of consolidated grades</h1>
    <p class="subtitle">${fmt(data.layout_label)} · ${fmt(data.campus_name)} · ${fmt(data.term_label)}</p>
    ${filterBits.length ? `<p class="filters">${filterBits.join(" · ")}</p>` : ""}
    <table>
      <thead><tr>${headerRow}</tr></thead>
      <tbody>${bodyRows || `<tr><td colspan="${headStudent.length + courseCols.length}" style="text-align:center;padding:12px;color:#666">No students or grade data matched your filters.</td></tr>`}</tbody>
    </table>
    <script>window.onload = function(){ window.print(); }</script>
  </body></html>`;

  const w = window.open("", "_blank", "noopener,noreferrer,width=1100,height=760");
  if (!w) {
    toast({ title: "Pop-up blocked", description: "Allow pop-ups to print the worksheet.", variant: "destructive" });
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

export function WorksheetForConsolidatedGradesModule() {
  const router = useRouter();
  const collegePickerRef = useRef<HTMLDivElement>(null);
  const programPickerRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const [terms, setTerms] = useState<YearTerm[]>([]);
  const [termId, setTermId] = useState("");
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [campusId, setCampusId] = useState("");
  const [colleges, setColleges] = useState<CollegeRow[]>([]);
  const [programs, setPrograms] = useState<ProgramRow[]>([]);
  const [options, setOptions] = useState<OptionsPayload | null>(null);
  const [layout, setLayout] = useState("default");

  const [byCollege, setByCollege] = useState(true);
  const [collegeId, setCollegeId] = useState("");
  const [collegeFilter, setCollegeFilter] = useState("");
  const [collegePickerOpen, setCollegePickerOpen] = useState(false);

  const [byProgram, setByProgram] = useState(false);
  const [programId, setProgramId] = useState("");
  const [programFilter, setProgramFilter] = useState("");
  const [programPickerOpen, setProgramPickerOpen] = useState(false);

  const [yearLevel, setYearLevel] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [printing, setPrinting] = useState(false);

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
          fetch(`${API}/api/registrar/worksheet-for-consolidated-grades/options`),
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

  const handleStop = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setPrinting(false);
    toast({ title: "Stopped", description: "Worksheet generation was cancelled." });
  }, []);

  const handlePrint = useCallback(async () => {
    if (!API || !termId || !campusId) {
      toast({ title: "Select academic year and campus", variant: "destructive" });
      return;
    }
    if (byCollege && !selectedCollege) {
      toast({ title: "Select a college", variant: "destructive" });
      return;
    }
    if (byProgram && !selectedProgram) {
      toast({ title: "Select a program", variant: "destructive" });
      return;
    }
    if (!byCollege && !byProgram) {
      toast({
        title: "Select a filter",
        description: "Enable By college or By program to scope the worksheet.",
        variant: "destructive",
      });
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setPrinting(true);

    try {
      const body: Record<string, unknown> = {
        academicYearTermId: Number(termId),
        campusId: Number(campusId),
        layout,
        byCollege,
        byProgram,
        yearLevel: yearLevel.trim() || undefined,
        sortBy,
      };

      if (byCollege && selectedCollege) {
        body.collegeCode = selectedCollege.college_code.trim();
      }
      if (byProgram && selectedProgram) {
        body.program =
          selectedProgram.program_name?.trim() ||
          selectedProgram.program_code?.trim() ||
          String(selectedProgram.id);
      }

      const res = await fetch(`${API}/api/registrar/worksheet-for-consolidated-grades/preview`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      if (!res.ok) throw new Error(await res.text());
      const data = (await res.json()) as PreviewPayload;

      if (!data.students?.length) {
        toast({
          title: "No worksheet generated",
          description: "No students matched your filters or no grade encoding data exists for this term.",
        });
        return;
      }
      openWorksheetPrintPreview(data);
    } catch (e) {
      if (e instanceof Error && e.name === "AbortError") return;
      console.error(e);
      toast({
        title: "Print failed",
        description: e instanceof Error ? e.message : "Could not build worksheet preview.",
        variant: "destructive",
      });
    } finally {
      if (abortRef.current === controller) {
        abortRef.current = null;
      }
      setPrinting(false);
    }
  }, [
    termId,
    campusId,
    layout,
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
            <Sheet className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="setup-type-page-title leading-tight">WORKSHEET OF CONSOLIDATED GRADES</h1>
            <p className="setup-type-page-desc mt-0.5 text-sky-900/85 dark:text-sky-200/80">
              Allows you to print worksheet of consolidated grades.
            </p>
          </div>
        </div>
      </div>

      <div className="shrink-0 border-b border-amber-200/50 dark:border-amber-900/40 bg-gradient-to-r from-amber-50/90 to-muted/30 px-3 py-2">
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1 min-w-[160px]">
            <Label className="text-[10px] uppercase text-muted-foreground">Report layout</Label>
            <select className={selectClass} value={layout} onChange={(e) => setLayout(e.target.value)}>
              {(options?.layouts ?? [{ key: "default", label: "Default layout" }]).map((l) => (
                <option key={l.key} value={l.key}>
                  {l.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1 min-w-[200px]">
            <Label className="text-[10px] uppercase text-muted-foreground">Academic year / term</Label>
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
        </div>
      </div>

      <div className="flex-1 min-h-0 p-2 flex flex-col gap-2">
        <div className="flex-1 min-h-0 rounded-xl border border-border/60 bg-card overflow-hidden flex flex-col">
          <ScrollArea className="flex-1 min-h-0">
            <div className="p-3 space-y-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Report options
              </p>

              <div className="space-y-3 rounded-lg border border-border/60 bg-muted/10 p-3">
                <div className="grid grid-cols-1 sm:grid-cols-[120px_1fr] items-center gap-2">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="wcg-by-college"
                      checked={byCollege}
                      onCheckedChange={(v) => setByCollege(v === true)}
                    />
                    <Label htmlFor="wcg-by-college" className="text-xs cursor-pointer">
                      By college
                    </Label>
                  </div>
                  <div className="relative min-w-0" ref={collegePickerRef}>
                    <SearchField
                      value={collegeDisplay}
                      onSearch={() => {
                        setCollegeFilter("");
                        setCollegePickerOpen((o) => !o);
                      }}
                      disabled={!byCollege}
                    />
                    {collegePickerOpen && byCollege && (
                      <div className="absolute z-20 left-0 right-0 top-full mt-1 rounded-lg border border-border/60 bg-popover shadow-md">
                        <Input
                          className="h-8 rounded-none border-0 border-b text-xs"
                          placeholder="Filter college…"
                          value={collegeFilter}
                          onChange={(e) => setCollegeFilter(e.target.value)}
                          autoFocus
                        />
                        <div className="max-h-28 overflow-y-auto">
                          {filteredColleges.map((c) => (
                            <button
                              key={c.id}
                              type="button"
                              className="w-full text-left px-2 py-1 text-xs hover:bg-muted"
                              onClick={() => {
                                setCollegeId(String(c.id));
                                setCollegePickerOpen(false);
                              }}
                            >
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
                    <Checkbox
                      id="wcg-by-program"
                      checked={byProgram}
                      onCheckedChange={(v) => setByProgram(v === true)}
                    />
                    <Label htmlFor="wcg-by-program" className="text-xs cursor-pointer">
                      By program
                    </Label>
                  </div>
                  <div className="relative min-w-0" ref={programPickerRef}>
                    <SearchField
                      value={programDisplay}
                      onSearch={() => {
                        setProgramFilter("");
                        setProgramPickerOpen((o) => !o);
                      }}
                      disabled={!byProgram}
                    />
                    {programPickerOpen && byProgram && (
                      <div className="absolute z-20 left-0 right-0 top-full mt-1 rounded-lg border border-border/60 bg-popover shadow-md">
                        <Input
                          className="h-8 rounded-none border-0 border-b text-xs"
                          placeholder="Filter program…"
                          value={programFilter}
                          onChange={(e) => setProgramFilter(e.target.value)}
                          autoFocus
                        />
                        <div className="max-h-28 overflow-y-auto">
                          {filteredPrograms.map((p) => (
                            <button
                              key={p.id}
                              type="button"
                              className="w-full text-left px-2 py-1 text-xs hover:bg-muted"
                              onClick={() => {
                                setProgramId(String(p.id));
                                setProgramPickerOpen(false);
                              }}
                            >
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
                    <select
                      className={selectClass}
                      value={yearLevel}
                      onChange={(e) => setYearLevel(e.target.value)}
                    >
                      {(options?.year_levels ?? [{ key: "", label: "[All years]" }]).map((yl) => (
                        <option key={yl.key || "all"} value={yl.key}>
                          {yl.label}
                        </option>
                      ))}
                    </select>
                  </FieldRow>
                  <FieldRow label="Sorted by">
                    <select className={selectClass} value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                      {(options?.sort_options ?? [{ key: "name", label: "Last name, first name" }]).map((s) => (
                        <option key={s.key} value={s.key}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </FieldRow>
                </div>
              </div>
            </div>
          </ScrollArea>
        </div>

        <div className="shrink-0 rounded-xl border border-border/60 bg-muted/15 px-3 py-2 flex flex-wrap items-center justify-between gap-1.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 text-xs gap-1 text-destructive border-destructive/40 hover:bg-destructive/10"
            onClick={handleStop}
            disabled={!printing}
          >
            <Square className="h-3.5 w-3.5 fill-current" />
            Stop process
          </Button>
          <div className="flex flex-wrap items-center gap-1.5">
            <Button
              type="button"
              size="sm"
              className="h-8 text-xs gap-1"
              onClick={() => void handlePrint()}
              disabled={printing}
            >
              {printing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Printer className="h-3.5 w-3.5" />}
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


