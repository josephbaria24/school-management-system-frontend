"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const API = process.env.NEXT_PUBLIC_API_URL;
const NONE = "__none__";

type AcademicYearTerm = { id: number; academic_year: string; term: string };
type Campus = { id: number; acronym: string; campus_name: string | null };
type AcademicProgram = { id: number; program_code: string; program_name: string };
type MajorStudyRow = { major_study?: string | null };
type RankingSummary = {
  total_applications: number;
  total_course_applicant: number;
  male_count: number;
  female_count: number;
  quota_limit: number | null;
  min_app_date: string | null;
  max_app_date: string | null;
};

export function CollegeEntranceTestResultRankingModule() {
  const [choiceNo, setChoiceNo] = useState("1");
  const [rankBy, setRankBy] = useState("scholastic-aptitude");
  const [terms, setTerms] = useState<AcademicYearTerm[]>([]);
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [programs, setPrograms] = useState<AcademicProgram[]>([]);
  const [majors, setMajors] = useState<string[]>([]);
  const [selectedTermId, setSelectedTermId] = useState(NONE);
  const [selectedCampusId, setSelectedCampusId] = useState(NONE);
  const [selectedProgramId, setSelectedProgramId] = useState(NONE);
  const [selectedMajor, setSelectedMajor] = useState(NONE);
  const [summary, setSummary] = useState<RankingSummary>({
    total_applications: 0,
    total_course_applicant: 0,
    male_count: 0,
    female_count: 0,
    quota_limit: null,
    min_app_date: null,
    max_app_date: null,
  });

  useEffect(() => {
    const load = async () => {
      if (!API) return;
      try {
        const [termRes, campusRes] = await Promise.all([
          fetch(`${API}/api/academic-year-terms`),
          fetch(`${API}/api/campuses`),
        ]);
        if (termRes.ok) {
          const rows = (await termRes.json()) as AcademicYearTerm[];
          setTerms(rows);
          if (rows[0]) setSelectedTermId(String(rows[0].id));
        }
        if (campusRes.ok) setCampuses((await campusRes.json()) as Campus[]);
      } catch {
        // keep UI rendered
      }
    };
    void load();
  }, []);

  useEffect(() => {
    const loadPrograms = async () => {
      if (!API) return;
      try {
        const qs =
          selectedCampusId !== NONE ? `?status=active&campus_id=${selectedCampusId}` : "?status=active";
        const res = await fetch(`${API}/api/academic-programs${qs}`);
        if (!res.ok) return;
        setPrograms((await res.json()) as AcademicProgram[]);
      } catch {
        // noop
      }
    };
    void loadPrograms();
  }, [selectedCampusId]);

  useEffect(() => {
    const loadMajors = async () => {
      if (!API || selectedProgramId === NONE) {
        setMajors([]);
        setSelectedMajor(NONE);
        return;
      }
      try {
        const res = await fetch(`${API}/api/academic-programs/${selectedProgramId}/major-studies`);
        if (!res.ok) return;
        const rows = (await res.json()) as MajorStudyRow[];
        const values = Array.from(new Set(rows.map((r) => r.major_study?.trim() || "").filter(Boolean)));
        setMajors(values);
        setSelectedMajor(NONE);
      } catch {
        setMajors([]);
      }
    };
    void loadMajors();
  }, [selectedProgramId]);

  const loadSummary = async () => {
    if (!API) return;
    const params = new URLSearchParams();
    params.set("choice_no", choiceNo);
    if (selectedTermId !== NONE) params.set("term_id", selectedTermId);
    if (selectedCampusId !== NONE) params.set("campus_id", selectedCampusId);
    if (selectedProgramId !== NONE) params.set("course_id", selectedProgramId);
    if (selectedMajor !== NONE) params.set("major_study", selectedMajor);
    try {
      const res = await fetch(`${API}/api/admission/college-entrance-ranking/summary?${params.toString()}`);
      if (!res.ok) return;
      setSummary((await res.json()) as RankingSummary);
    } catch {
      // keep old summary
    }
  };

  useEffect(() => {
    void loadSummary();
  }, [choiceNo, selectedTermId, selectedCampusId, selectedProgramId, selectedMajor]);

  const coveredDate = useMemo(() => {
    if (!summary.min_app_date || !summary.max_app_date) return "";
    const min = new Date(summary.min_app_date).toLocaleDateString();
    const max = new Date(summary.max_app_date).toLocaleDateString();
    return `${min} - ${max}`;
  }, [summary.max_app_date, summary.min_app_date]);

  return (
    <div className="h-full bg-background relative overflow-x-hidden">
      <div className="w-full px-2 pt-2 pb-4">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h1 className="setup-type-page-title">College Entrance Test Result Ranking</h1>
            <p className="setup-type-page-desc">
              View and process applicant ranking with live term, campus, program, and major filters.
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <div className="setup-type-kicker-pill flex h-9 items-center rounded-xl border border-border/60 bg-background/70 px-3 shadow-sm backdrop-blur">
              Admission module
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl bg-background border border-border/40 shadow-sm">
          <div className="px-4 py-3 flex items-center gap-3 border-b border-border/40 bg-muted/5">
            <div className="leading-tight min-w-0">
              <div className="setup-type-module-title truncate">Ranking Workspace</div>
              <div className="setup-type-module-sub">Live data from admission applicants and selected filters</div>
            </div>
          </div>

          <div className="p-3 bg-background/60 space-y-3">
            <div className="rounded-2xl border border-border/60 p-3 bg-muted/15 shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-2">
                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground uppercase">Applicant Choice Ranking By</Label>
                  <Select value={choiceNo} onValueChange={setChoiceNo}>
                    <SelectTrigger className="h-8 rounded-xl text-xs border-border/60 shadow-sm bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Choice 1</SelectItem>
                      <SelectItem value="2">Choice 2</SelectItem>
                      <SelectItem value="3">Choice 3</SelectItem>
                      <SelectItem value="4">Choice 4</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground uppercase">Rank By</Label>
                  <Select value={rankBy} onValueChange={setRankBy}>
                    <SelectTrigger className="h-8 rounded-xl text-xs border-border/60 shadow-sm bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="scholastic-aptitude">Scholastic Aptitude</SelectItem>
                      <SelectItem value="total-score">Total Score</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground uppercase">AY / Term</Label>
                  <Select value={selectedTermId} onValueChange={setSelectedTermId}>
                    <SelectTrigger className="h-8 rounded-xl text-xs border-border/60 shadow-sm bg-background">
                      <SelectValue placeholder="All Terms" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE}>All Terms</SelectItem>
                      {terms.map((t) => (
                        <SelectItem key={t.id} value={String(t.id)}>
                          {t.academic_year} {t.term}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground uppercase">Campus</Label>
                  <Select value={selectedCampusId} onValueChange={setSelectedCampusId}>
                    <SelectTrigger className="h-8 rounded-xl text-xs border-border/60 shadow-sm bg-background">
                      <SelectValue placeholder="All campuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE}>All campuses</SelectItem>
                      {campuses.map((c) => (
                        <SelectItem key={c.id} value={String(c.id)}>
                          {c.acronym || c.campus_name || `Campus ${c.id}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground uppercase">Academic Program</Label>
                  <Select value={selectedProgramId} onValueChange={setSelectedProgramId}>
                    <SelectTrigger className="h-8 rounded-xl text-xs border-border/60 shadow-sm bg-background">
                      <SelectValue placeholder="All programs" />
                    </SelectTrigger>
                    <SelectContent className="max-h-72 overflow-y-auto">
                      <SelectItem value={NONE}>All programs</SelectItem>
                      {programs.map((p) => (
                        <SelectItem key={p.id} value={String(p.id)}>
                          {p.program_code} - {p.program_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground uppercase">Major</Label>
                  <Select value={selectedMajor} onValueChange={setSelectedMajor} disabled={selectedProgramId === NONE}>
                    <SelectTrigger className="h-8 rounded-xl text-xs border-border/60 shadow-sm bg-background">
                      <SelectValue placeholder="All majors" />
                    </SelectTrigger>
                    <SelectContent className="max-h-72 overflow-y-auto">
                      <SelectItem value={NONE}>All majors</SelectItem>
                      {majors.map((m) => (
                        <SelectItem key={m} value={m}>
                          {m}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground uppercase">Batch Covered</Label>
                  <Select defaultValue="batch-2">
                    <SelectTrigger className="h-8 rounded-xl text-xs border-border/60 shadow-sm bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="batch-1">Batch 1</SelectItem>
                      <SelectItem value="batch-2">Batch 2</SelectItem>
                      <SelectItem value="batch-3">Batch 3</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground uppercase">Covered Date Range</Label>
                  <Input
                    value={coveredDate}
                    readOnly
                    className="h-8 rounded-xl text-xs border-border/60 shadow-sm bg-amber-50/70 text-amber-800 font-semibold"
                  />
                </div>
              </div>

              <div className="mt-3 flex justify-end">
                <Button
                  type="button"
                  onClick={() => void loadSummary()}
                  className="h-8 rounded-xl px-4 text-xs font-semibold bg-primary hover:bg-primary/90"
                >
                  Process Ranking
                </Button>
              </div>
            </div>

            <div className="rounded-2xl border border-border/60 overflow-auto bg-card shadow-sm premium-surface">
              <table className="w-full text-[11px] border-collapse min-w-[980px]">
                <thead>
                  <tr className="sticky top-0 z-20 bg-muted/50 text-left shadow-sm">
                    {[
                      "Total Applications",
                      "Selected Campus",
                      "Total Course Applicant",
                      "Quota / Limit",
                      "Male",
                      "Female",
                    ].map((h) => (
                      <th
                        key={h}
                        className="setup-type-table-header border-b border-r border-border/60 px-2 py-2 text-left whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-border/40">
                    <td className="px-2 py-2 border-r border-border/30 text-rose-700 font-semibold">
                      {summary.total_applications.toLocaleString()}
                    </td>
                    <td className="px-2 py-2 border-r border-border/30">
                      {selectedCampusId !== NONE
                        ? campuses.find((c) => String(c.id) === selectedCampusId)?.acronym || "-"
                        : "ALL"}
                    </td>
                    <td className="px-2 py-2 border-r border-border/30">
                      {summary.total_course_applicant.toLocaleString()}
                    </td>
                    <td className="px-2 py-2 border-r border-border/30">{summary.quota_limit ?? "-"}</td>
                    <td className="px-2 py-2 border-r border-border/30">{summary.male_count.toLocaleString()}</td>
                    <td className="px-2 py-2">{summary.female_count.toLocaleString()}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

