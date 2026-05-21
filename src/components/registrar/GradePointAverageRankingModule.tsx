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
import { Award, Loader2, LogOut, Printer, Search } from "lucide-react";

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

type GwaListingRow = {
  rank: number;
  student_no: string;
  student_name: string | null;
  reg_id: string | null;
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

type CorrectionListingRow = {
  student_no: string;
  student_name: string | null;
  subject_code: string | null;
  subject_title: string | null;
  class_section: string | null;
  midterm: string | null;
  final: string | null;
  re_exam: string | null;
  remarks: string | null;
  credit_units: string | null;
};

type CorrectionStatsRow = { label: string; count: number };

type PreviewPayload = {
  report_key: string;
  report_label: string;
  term_label: string;
  campus_name: string;
  gwa_rows: GwaListingRow[];
  correction_rows: CorrectionListingRow[];
  correction_stats: CorrectionStatsRow[];
  grouped_by_year_level: { year_level: string; rows: GwaListingRow[] }[];
};

type OptionsPayload = {
  report_titles: { key: string; label: string }[];
  sort_options: { key: string; label: string }[];
  year_levels: { key: string; label: string }[];
  condition_fields: { key: string; label: string }[];
};

function fmt(v: string | number | null | undefined) {
  const s = v == null ? "" : String(v).trim();
  return s || "—";
}

function openGpaPrintPreview(data: PreviewPayload) {
  const isStats = data.report_key === "correction_stats";
  const isCorrection =
    data.report_key === "correction_list_1" ||
    data.report_key === "correction_list_2" ||
    isStats;

  let body = "";

  if (isStats) {
    const rows = data.correction_stats
      .map(
        (s) =>
          `<tr><td>${fmt(s.label)}</td><td style="text-align:right">${s.count}</td></tr>`
      )
      .join("");
    body = `<table><thead><tr><th>Statistic</th><th>Count</th></tr></thead><tbody>${rows || `<tr><td colspan="2" style="text-align:center;padding:12px;color:#666">No data.</td></tr>`}</tbody></table>`;
  } else if (isCorrection) {
    const cols = ["Student no.", "Name", "Code", "Title", "Section", "Mid", "Final", "Re-ex", "Units", "Remarks"];
    const rows = data.correction_rows
      .map(
        (r) =>
          `<tr>
            <td>${fmt(r.student_no)}</td>
            <td>${fmt(r.student_name)}</td>
            <td>${fmt(r.subject_code)}</td>
            <td>${fmt(r.subject_title)}</td>
            <td>${fmt(r.class_section)}</td>
            <td>${fmt(r.midterm)}</td>
            <td>${fmt(r.final)}</td>
            <td>${fmt(r.re_exam)}</td>
            <td style="text-align:right">${fmt(r.credit_units)}</td>
            <td>${fmt(r.remarks)}</td>
          </tr>`
      )
      .join("");
    body = `<table><thead><tr>${cols.map((c) => `<th>${c}</th>`).join("")}</tr></thead><tbody>${rows || `<tr><td colspan="${cols.length}" style="text-align:center;padding:12px;color:#666">No correction rows on file.</td></tr>`}</tbody></table>`;
  } else if (data.report_key === "gwa_by_year_level" && data.grouped_by_year_level.length) {
    body = data.grouped_by_year_level
      .map((g) => {
        const table = renderGwaTable(g.rows, data.report_key);
        return `<section class="group-block"><h2>Year level: ${fmt(g.year_level)}</h2>${table}</section>`;
      })
      .join("");
  } else {
    body = renderGwaTable(data.gwa_rows, data.report_key);
  }

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Grade point average listing</title>
    <style>
      body { font-family: Tahoma, Arial, sans-serif; font-size: 11px; margin: 16px; color: #111; }
      h1 { font-size: 16px; margin: 0 0 4px; text-transform: uppercase; }
      .subtitle { color: #444; margin-bottom: 16px; }
      .group-block { page-break-inside: avoid; margin-bottom: 20px; }
      .group-block h2 { font-size: 12px; margin: 0 0 8px; color: #333; }
      table { width: 100%; border-collapse: collapse; }
      th, td { border: 1px solid #999; padding: 4px 6px; vertical-align: top; }
      th { background: #c6d9f1; font-size: 9px; text-transform: uppercase; }
      @media print { body { margin: 8mm; } }
    </style></head><body>
    <h1>Grade point average listing</h1>
    <p class="subtitle">${fmt(data.report_label)} · ${fmt(data.campus_name)} · ${fmt(data.term_label)}</p>
    ${body}
    <script>window.onload = function(){ window.print(); }</script>
  </body></html>`;

  const w = window.open("", "_blank", "noopener,noreferrer,width=960,height=720");
  if (!w) {
    toast({ title: "Pop-up blocked", description: "Allow pop-ups to print the report.", variant: "destructive" });
    return;
  }
  w.document.open();
  w.document.write(html);
  w.document.close();
}

function renderGwaTable(rows: GwaListingRow[], reportKey: string) {
  const layout2 = reportKey === "gwa_layout_2";
  const cols = layout2
    ? ["Rank", "Student no.", "Name", "Reg. ID", "College", "Program", "Year", "GWA", "Units enrolled", "Units earned", "Qualified", "Remarks"]
    : ["Rank", "Student no.", "Name", "College", "Program", "Year", "GWA", "Units earned", "Qualified"];
  const body = rows
    .map((r) => {
      if (layout2) {
        return `<tr>
          <td style="text-align:center">${r.rank}</td>
          <td>${fmt(r.student_no)}</td>
          <td>${fmt(r.student_name)}</td>
          <td>${fmt(r.reg_id)}</td>
          <td>${fmt(r.college)}</td>
          <td>${fmt(r.program)}</td>
          <td>${fmt(r.year_level)}</td>
          <td style="text-align:right">${fmt(r.gwa)}</td>
          <td style="text-align:right">${fmt(r.credit_units_enrolled)}</td>
          <td style="text-align:right">${fmt(r.credit_units_earned)}</td>
          <td style="text-align:center">${fmt(r.qualified)}</td>
          <td>${fmt(r.remarks)}</td>
        </tr>`;
      }
      return `<tr>
        <td style="text-align:center">${r.rank}</td>
        <td>${fmt(r.student_no)}</td>
        <td>${fmt(r.student_name)}</td>
        <td>${fmt(r.college)}</td>
        <td>${fmt(r.program)}</td>
        <td>${fmt(r.year_level)}</td>
        <td style="text-align:right">${fmt(r.gwa)}</td>
        <td style="text-align:right">${fmt(r.credit_units_earned)}</td>
        <td style="text-align:center">${fmt(r.qualified)}</td>
      </tr>`;
    })
    .join("");
  return `<table><thead><tr>${cols.map((c) => `<th>${c}</th>`).join("")}</tr></thead><tbody>${body || `<tr><td colspan="${cols.length}" style="text-align:center;padding:12px;color:#666">No GWA summary rows on file. Run recalculate summary of grades first.</td></tr>`}</tbody></table>`;
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

export function GradePointAverageRankingModule() {
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
  const [reportKey, setReportKey] = useState("gwa_layout_1");

  const [printMode, setPrintMode] = useState<"individual" | "bulk">("bulk");
  const [studentQuery, setStudentQuery] = useState("");
  const [searchHits, setSearchHits] = useState<ReportStudentPick[]>([]);
  const [searching, setSearching] = useState(false);
  const [picked, setPicked] = useState<ReportStudentPick[]>([]);
  const [studentListOpen, setStudentListOpen] = useState(false);
  const [printing, setPrinting] = useState(false);

  const [allGroups, setAllGroups] = useState(true);
  const [byCollege, setByCollege] = useState(false);
  const [collegeId, setCollegeId] = useState("");
  const [collegeFilter, setCollegeFilter] = useState("");
  const [collegePickerOpen, setCollegePickerOpen] = useState(false);

  const [byProgram, setByProgram] = useState(false);
  const [programId, setProgramId] = useState("");
  const [programFilter, setProgramFilter] = useState("");
  const [programPickerOpen, setProgramPickerOpen] = useState(false);

  const [majorStudy, setMajorStudy] = useState("");
  const [yearLevel, setYearLevel] = useState("");
  const [sortBy, setSortBy] = useState("rank");
  const [withCondition, setWithCondition] = useState(false);
  const [conditionField, setConditionField] = useState("");
  const [conditionValue, setConditionValue] = useState("");

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

  const reportTitles = options?.report_titles ?? [
    { key: "gwa_layout_1", label: "Grade Point/Weighted Average List [Layout 1]" },
  ];

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
          fetch(`${API}/api/registrar/grade-point-average-ranking/options`),
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
      const res = await fetch(
        `${API}/api/registrar/grade-point-average-ranking/students?${params.toString()}`
      );
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
  }, [termId, campusId, studentQuery]);

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
    if (printMode === "bulk" && !allGroups && byCollege && !selectedCollege) {
      toast({ title: "Select a college", variant: "destructive" });
      return;
    }
    if (printMode === "bulk" && !allGroups && byProgram && !selectedProgram) {
      toast({ title: "Select a program", variant: "destructive" });
      return;
    }

    setPrinting(true);
    try {
      const body: Record<string, unknown> = {
        academicYearTermId: Number(termId),
        campusId: Number(campusId),
        reportKey,
        mode: printMode,
        sortBy,
        withCondition,
        conditionField: withCondition ? conditionField : "",
        conditionValue: withCondition ? conditionValue : "",
      };

      if (printMode === "individual") {
        body.studentNos = picked.map((p) => p.student_no);
      } else {
        body.allGroups = allGroups;
        if (!allGroups && byCollege && selectedCollege) {
          body.collegeCode = selectedCollege.college_code.trim();
        }
        if (!allGroups && byProgram && selectedProgram) {
          body.program =
            selectedProgram.program_name?.trim() ||
            selectedProgram.program_code?.trim() ||
            String(selectedProgram.id);
        }
        if (majorStudy.trim()) body.majorStudy = majorStudy.trim();
        if (yearLevel.trim()) body.yearLevel = yearLevel.trim();
      }

      const res = await fetch(`${API}/api/registrar/grade-point-average-ranking/preview`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = (await res.json()) as PreviewPayload;

      const hasGwa = (data.gwa_rows?.length ?? 0) > 0;
      const hasCorr = (data.correction_rows?.length ?? 0) > 0;
      const hasStats = (data.correction_stats?.length ?? 0) > 0;
      const hasGrouped = (data.grouped_by_year_level?.length ?? 0) > 0;

      if (!hasGwa && !hasCorr && !hasStats && !hasGrouped) {
        toast({
          title: "No reports generated",
          description: "No data matched your selection. Recalculate summary of grades if GWA lists are empty.",
        });
        return;
      }
      openGpaPrintPreview(data);
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
    termId,
    campusId,
    reportKey,
    printMode,
    picked,
    allGroups,
    byCollege,
    byProgram,
    selectedCollege,
    selectedProgram,
    majorStudy,
    yearLevel,
    sortBy,
    withCondition,
    conditionField,
    conditionValue,
  ]);

  return (
    <div className="h-full min-h-0 bg-background flex flex-col overflow-hidden">
      <div className="shrink-0 border-b border-border/60 bg-gradient-to-r from-sky-100/80 via-muted/30 to-muted/20 px-3 py-2">
        <div className="flex items-start gap-2">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-border/60 bg-background text-muted-foreground">
            <Award className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="setup-type-page-title leading-tight">GRADE POINT AVERAGE</h1>
            <p className="setup-type-page-desc mt-0.5 text-sky-900/85 dark:text-sky-200/80">
              Use this module to print GWA individually or by bulk printing.
            </p>
          </div>
        </div>
      </div>

      <div className="shrink-0 border-b border-amber-200/50 dark:border-amber-900/40 bg-gradient-to-r from-amber-50/90 to-muted/30 px-3 py-2">
        <div className="flex flex-wrap items-end gap-3">
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
        <div className="flex-1 min-h-0 rounded-xl border border-border/60 bg-card overflow-hidden flex min-h-0">
          <div className="w-[220px] shrink-0 border-r border-border/60 bg-muted/15 flex flex-col min-h-0">
            <div className="shrink-0 px-2 py-2 border-b border-border/60">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Report title
              </p>
            </div>
            <ScrollArea className="flex-1 min-h-0">
              <ul className="p-1 space-y-0.5">
                {reportTitles.map((r) => {
                  const active = reportKey === r.key;
                  return (
                    <li key={r.key}>
                      <button
                        type="button"
                        onClick={() => setReportKey(r.key)}
                        className={cn(
                          "w-full text-left rounded-md px-2 py-1.5 text-[11px] leading-snug transition-colors",
                          active
                            ? "bg-amber-100/90 text-amber-950 font-medium dark:bg-amber-950/50 dark:text-amber-100"
                            : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                        )}
                      >
                        {r.label}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </ScrollArea>
          </div>

          <div className="flex-1 min-h-0 flex flex-col min-w-0">
            <ScrollArea className="flex-1 min-h-0">
              <div className="p-3 space-y-3">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Parameters
                </p>

                <RadioGroup
                  value={printMode}
                  onValueChange={(v) => setPrintMode(v as "individual" | "bulk")}
                  className="space-y-4"
                >
                  <div className="space-y-2 rounded-lg border border-border/60 bg-muted/10 p-3">
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="individual" id="gpa-individual" />
                      <Label htmlFor="gpa-individual" className="text-xs font-medium cursor-pointer">
                        Individual printing
                      </Label>
                    </div>
                    <div
                      className={cn("space-y-2 pl-1", printMode !== "individual" && "opacity-50 pointer-events-none")}
                    >
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
                              {searching ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Search className="h-3.5 w-3.5" />
                              )}
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
                          Students list ({picked.length})
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
                      <RadioGroupItem value="bulk" id="gpa-bulk" />
                      <Label htmlFor="gpa-bulk" className="text-xs font-medium cursor-pointer">
                        Bulk printing
                      </Label>
                    </div>
                    <div
                      className={cn("space-y-3 pl-1", printMode !== "bulk" && "opacity-50 pointer-events-none")}
                    >
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="all-groups"
                          checked={allGroups}
                          onCheckedChange={(v) => setAllGroups(v === true)}
                          disabled={printMode !== "bulk"}
                        />
                        <Label htmlFor="all-groups" className="text-xs cursor-pointer">
                          All groups
                        </Label>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-[120px_1fr] items-center gap-2">
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id="gpa-by-college"
                            checked={byCollege}
                            onCheckedChange={(v) => setByCollege(v === true)}
                            disabled={printMode !== "bulk" || allGroups}
                          />
                          <Label htmlFor="gpa-by-college" className="text-xs cursor-pointer">
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
                            disabled={printMode !== "bulk" || allGroups || !byCollege}
                          />
                          {collegePickerOpen && byCollege && printMode === "bulk" && !allGroups && (
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
                            id="gpa-by-program"
                            checked={byProgram}
                            onCheckedChange={(v) => setByProgram(v === true)}
                            disabled={printMode !== "bulk" || allGroups}
                          />
                          <Label htmlFor="gpa-by-program" className="text-xs cursor-pointer">
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
                            disabled={printMode !== "bulk" || allGroups || !byProgram}
                          />
                          {programPickerOpen && byProgram && printMode === "bulk" && !allGroups && (
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
                        <FieldRow label="Major study">
                          <Input
                            className="h-8 rounded-lg text-xs"
                            placeholder="[Select major study]"
                            value={majorStudy}
                            onChange={(e) => setMajorStudy(e.target.value)}
                            disabled={printMode !== "bulk"}
                          />
                        </FieldRow>
                        <FieldRow label="Year level">
                          <select
                            className={selectClass}
                            value={yearLevel}
                            onChange={(e) => setYearLevel(e.target.value)}
                            disabled={printMode !== "bulk"}
                          >
                            {(options?.year_levels ?? [{ key: "", label: "[All year level]" }]).map((yl) => (
                              <option key={yl.key || "all"} value={yl.key}>
                                {yl.label}
                              </option>
                            ))}
                          </select>
                        </FieldRow>
                        <FieldRow label="Sorted by">
                          <select
                            className={selectClass}
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            disabled={printMode !== "bulk"}
                          >
                            {(options?.sort_options ?? [{ key: "rank", label: "Rank" }]).map((s) => (
                              <option key={s.key} value={s.key}>
                                {s.label}
                              </option>
                            ))}
                          </select>
                        </FieldRow>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id="with-condition"
                            checked={withCondition}
                            onCheckedChange={(v) => setWithCondition(v === true)}
                            disabled={printMode !== "bulk"}
                          />
                          <Label htmlFor="with-condition" className="text-xs cursor-pointer">
                            With condition?
                          </Label>
                        </div>
                        <div
                          className={cn(
                            "grid grid-cols-1 sm:grid-cols-2 gap-2 pl-6",
                            !withCondition && "opacity-50 pointer-events-none"
                          )}
                        >
                          <select
                            className={selectClass}
                            value={conditionField}
                            onChange={(e) => setConditionField(e.target.value)}
                            disabled={printMode !== "bulk" || !withCondition}
                          >
                            {(options?.condition_fields ?? [{ key: "", label: "—" }]).map((f) => (
                              <option key={f.key || "none"} value={f.key}>
                                {f.label}
                              </option>
                            ))}
                          </select>
                          <Input
                            className="h-8 rounded-lg text-xs"
                            placeholder="Value"
                            value={conditionValue}
                            onChange={(e) => setConditionValue(e.target.value)}
                            disabled={printMode !== "bulk" || !withCondition}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </RadioGroup>
              </div>
            </ScrollArea>
          </div>
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
            <DialogTitle>Students list ({picked.length})</DialogTitle>
            <DialogDescription>Students queued for individual GWA printing.</DialogDescription>
          </DialogHeader>
          <div className="max-h-64 overflow-y-auto rounded-lg border border-border/60">
            {picked.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No students in list.</p>
            ) : (
              <ul className="divide-y divide-border/60">
                {picked.map((p) => (
                  <li key={p.student_no} className="flex items-center justify-between gap-2 px-2 py-2 text-sm">
                    <span>
                      <span className="font-mono font-semibold">{p.student_no}</span> — {fmt(p.student_name)}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => setPicked((prev) => prev.filter((x) => x.student_no !== p.student_no))}
                    >
                      Remove
                    </Button>
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
