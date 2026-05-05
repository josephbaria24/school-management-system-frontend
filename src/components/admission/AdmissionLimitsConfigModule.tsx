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
type College = { id: number; college_code?: string | null; college_name: string };
type AcademicProgram = { id: number; college_id: number; program_code: string; program_name: string };
type MajorStudyRow = { major_study?: string | null };
type TestingSchedule = { id: number; batch_id: string; testing_date: string | null };

type Row = {
  collegeCode: string;
  programCode: string;
  programName: string;
  major: string;
  quota: number;
  aptitude: number;
  enrollmentDate: string;
  venue: string;
  time: string;
};

export function AdmissionLimitsConfigModule() {
  const [terms, setTerms] = useState<AcademicYearTerm[]>([]);
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [colleges, setColleges] = useState<College[]>([]);
  const [programs, setPrograms] = useState<AcademicProgram[]>([]);
  const [batchSchedules, setBatchSchedules] = useState<TestingSchedule[]>([]);
  const [selectedTermId, setSelectedTermId] = useState<string>(NONE);
  const [selectedCampusId, setSelectedCampusId] = useState<string>(NONE);
  const [selectedBatchId, setSelectedBatchId] = useState<string>(NONE);
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    const loadLookups = async () => {
      if (!API) return;
      try {
        const [termRes, campusRes, collegeRes, programRes, scheduleRes] = await Promise.all([
          fetch(`${API}/api/academic-year-terms`),
          fetch(`${API}/api/campuses`),
          fetch(`${API}/api/colleges`),
          fetch(`${API}/api/academic-programs?status=active`),
          fetch(`${API}/api/admission/testing-schedules`),
        ]);
        if (termRes.ok) {
          const t = (await termRes.json()) as AcademicYearTerm[];
          setTerms(t);
          if (t[0]) setSelectedTermId(String(t[0].id));
        }
        if (campusRes.ok) {
          const c = (await campusRes.json()) as Campus[];
          setCampuses(c);
          if (c[0]) setSelectedCampusId(String(c[0].id));
        }
        if (collegeRes.ok) setColleges((await collegeRes.json()) as College[]);
        if (programRes.ok) setPrograms((await programRes.json()) as AcademicProgram[]);
        if (scheduleRes.ok) setBatchSchedules((await scheduleRes.json()) as TestingSchedule[]);
      } catch {
        // keep UI loaded
      }
    };
    void loadLookups();
  }, []);

  const coveredDate = useMemo(() => {
    const filtered = batchSchedules.filter((s) => selectedBatchId === NONE || s.batch_id === selectedBatchId);
    const withDates = filtered.map((s) => s.testing_date).filter(Boolean) as string[];
    if (!withDates.length) return "";
    const sorted = [...withDates].sort();
    return `${new Date(sorted[0]).toLocaleDateString()} - ${new Date(sorted[sorted.length - 1]).toLocaleDateString()}`;
  }, [batchSchedules, selectedBatchId]);

  const buildRows = async () => {
    if (!API) return;
    const filteredPrograms = programs;
    const majorsByProgram = await Promise.all(
      filteredPrograms.map(async (p) => {
        try {
          const res = await fetch(`${API}/api/academic-programs/${p.id}/major-studies`);
          if (!res.ok) return { programId: p.id, majors: [""] };
          const rows = (await res.json()) as MajorStudyRow[];
          const majors = Array.from(new Set(rows.map((r) => r.major_study?.trim() || "").filter(Boolean)));
          return { programId: p.id, majors: majors.length ? majors : [""] };
        } catch {
          return { programId: p.id, majors: [""] };
        }
      })
    );
    const majorMap = new Map<number, string[]>(majorsByProgram.map((x) => [x.programId, x.majors]));
    const collegeCodeMap = new Map<number, string>(
      colleges.map((c) => [c.id, c.college_code?.trim() || c.college_name.slice(0, 6).toUpperCase()])
    );

    const computed: Row[] = [];
    filteredPrograms.forEach((p) => {
      const majors = majorMap.get(p.id) || [""];
      majors.forEach((m) => {
        computed.push({
          collegeCode: collegeCodeMap.get(p.college_id) || "",
          programCode: p.program_code,
          programName: p.program_name,
          major: m,
          quota: 0,
          aptitude: 0,
          enrollmentDate: "",
          venue: "",
          time: "",
        });
      });
    });
    setRows(computed);
  };

  useEffect(() => {
    if (!programs.length || !colleges.length) return;
    void buildRows();
  }, [programs, colleges]);

  const selectedTermText = terms.find((t) => String(t.id) === selectedTermId)
    ? `${terms.find((t) => String(t.id) === selectedTermId)?.academic_year} ${terms.find((t) => String(t.id) === selectedTermId)?.term}`
    : "All terms";
  const selectedCampusText =
    selectedCampusId === NONE
      ? "All Campus/es"
      : campuses.find((c) => String(c.id) === selectedCampusId)?.acronym || "Campus";

  const batchIds = Array.from(new Set(batchSchedules.map((b) => b.batch_id).filter(Boolean)));

  return (
    <div className="h-full bg-background relative overflow-x-hidden">
      <div className="w-full px-2 pt-2 pb-4">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h1 className="setup-type-page-title">Configuration of Admission Limits</h1>
            <p className="setup-type-page-desc">Set and review examinee quota limits by program and major.</p>
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
              <div className="setup-type-module-title truncate">Admission Limits Workspace</div>
              <div className="setup-type-module-sub">Use this module to set quota of examinees</div>
            </div>
          </div>

          <div className="p-3 bg-background/60 space-y-3">
            <div className="rounded-2xl border border-border/60 p-3 bg-muted/15 shadow-sm space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Label className="text-xs">Select Batch Code :</Label>
                <Select value={selectedBatchId} onValueChange={setSelectedBatchId}>
                  <SelectTrigger className="h-8 rounded-xl text-xs border-border/60 shadow-sm bg-background min-w-[220px]">
                    <SelectValue placeholder="All batches" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>All batches</SelectItem>
                    {batchIds.map((b) => (
                      <SelectItem key={b} value={b}>{b}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="outline" className="h-8 rounded-xl px-3 text-xs">Open</Button>
                <Button variant="outline" className="h-8 rounded-xl px-3 text-xs">New</Button>
                <Button variant="outline" className="h-8 rounded-xl px-3 text-xs">Delete</Button>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-xs">
                <span><b>Academic Year And Term:</b> {selectedTermText}</span>
                <span><b>Campus Name:</b> {selectedCampusText}</span>
                <span><b>Covered Date:</b> {coveredDate || "-"}</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground uppercase">Academic Year & Term</Label>
                  <Select value={selectedTermId} onValueChange={setSelectedTermId}>
                    <SelectTrigger className="h-8 rounded-xl text-xs border-border/60 shadow-sm bg-background">
                      <SelectValue placeholder="Select term" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE}>All terms</SelectItem>
                      {terms.map((t) => (
                        <SelectItem key={t.id} value={String(t.id)}>{t.academic_year} {t.term}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground uppercase">Campus</Label>
                  <Select value={selectedCampusId} onValueChange={setSelectedCampusId}>
                    <SelectTrigger className="h-8 rounded-xl text-xs border-border/60 shadow-sm bg-background">
                      <SelectValue placeholder="Select campus" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE}>All Campus/es</SelectItem>
                      {campuses.map((c) => (
                        <SelectItem key={c.id} value={String(c.id)}>
                          {c.acronym || c.campus_name || `Campus ${c.id}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-border/60 overflow-auto bg-card shadow-sm premium-surface max-h-[560px]">
              <table className="w-full min-w-[1300px] border-collapse text-[11px]">
                <thead>
                  <tr className="sticky top-0 z-20 bg-muted/50 text-left shadow-sm">
                    {["College Code", "Program Code", "Program Name", "Major", "Quota", "Scholastic Aptitude Stanine", "Enrollment Date", "Venue", "Time"].map((h) => (
                      <th key={h} className="setup-type-table-header border-b border-r border-border/60 px-2 py-2 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, idx) => (
                    <tr key={`${r.collegeCode}-${r.programCode}-${r.major}-${idx}`} className={idx % 2 ? "bg-muted/10 border-b border-border/40" : "border-b border-border/40"}>
                      <td className="px-2 py-1 border-r border-border/30">{r.collegeCode}</td>
                      <td className="px-2 py-1 border-r border-border/30">{r.programCode}</td>
                      <td className="px-2 py-1 border-r border-border/30">{r.programName}</td>
                      <td className="px-2 py-1 border-r border-border/30">{r.major}</td>
                      <td className="px-2 py-1 border-r border-border/30 text-right">{r.quota}</td>
                      <td className="px-2 py-1 border-r border-border/30 text-right">{r.aptitude}</td>
                      <td className="px-2 py-1 border-r border-border/30">{r.enrollmentDate}</td>
                      <td className="px-2 py-1 border-r border-border/30">{r.venue}</td>
                      <td className="px-2 py-1">{r.time}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

