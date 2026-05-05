"use client";

import { useEffect, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const API = process.env.NEXT_PUBLIC_API_URL;
const NONE = "__none__";

type AcademicYearTerm = { id: number; academic_year: string; term: string };
type Campus = { id: number; acronym: string; campus_name: string | null };
type College = { id: number; college_code?: string | null; college_name: string };

const statsHeaders = [
  "College Code",
  "College Name",
  "Total Limit",
  "Total In-Process",
  "Freshmen Admitted",
  "Total Admitted",
];

export function AdmissionStatisticsModule() {
  const [yearTerms, setYearTerms] = useState<AcademicYearTerm[]>([]);
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [colleges, setColleges] = useState<College[]>([]);
  const [selectedTermId, setSelectedTermId] = useState<string>(NONE);
  const [selectedCampusId, setSelectedCampusId] = useState<string>(NONE);

  useEffect(() => {
    const load = async () => {
      if (!API) return;
      try {
        const [termRes, campusRes, collegeRes] = await Promise.all([
          fetch(`${API}/api/academic-year-terms`),
          fetch(`${API}/api/campuses`),
          fetch(`${API}/api/colleges`),
        ]);
        if (termRes.ok) {
          const terms = (await termRes.json()) as AcademicYearTerm[];
          setYearTerms(terms);
          if (terms[0]) setSelectedTermId(String(terms[0].id));
        }
        if (campusRes.ok) {
          const rows = (await campusRes.json()) as Campus[];
          setCampuses(rows);
          if (rows[0]) setSelectedCampusId(String(rows[0].id));
        }
        if (collegeRes.ok) setColleges((await collegeRes.json()) as College[]);
      } catch {
        // keep UI visible
      }
    };
    void load();
  }, []);

  const selectedTermLabel =
    yearTerms.find((t) => String(t.id) === selectedTermId)
      ? `${yearTerms.find((t) => String(t.id) === selectedTermId)?.academic_year} ${yearTerms.find((t) => String(t.id) === selectedTermId)?.term}`
      : "Selected Term";

  return (
    <div className="h-full bg-background relative overflow-x-hidden">
      <div className="w-full px-2 pt-2 pb-4">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h1 className="setup-type-page-title">Admission Statistics</h1>
            <p className="setup-type-page-desc">
              View admitted-student statistics by selected academic year/term and campus.
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
              <div className="setup-type-module-title truncate">
                Admission Statistics of Admitted Students
              </div>
              <div className="setup-type-module-sub">{selectedTermLabel}</div>
            </div>
          </div>

          <div className="p-3 bg-background/60 space-y-3">
            <div className="rounded-2xl border border-border/60 p-3 bg-muted/15 shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-w-[680px]">
                <div className="space-y-1">
                  <div className="text-[11px] text-muted-foreground uppercase font-medium">Academic Year</div>
                  <Select value={selectedTermId} onValueChange={setSelectedTermId}>
                    <SelectTrigger className="h-8 rounded-xl text-xs border-border/60 shadow-sm bg-background">
                      <SelectValue placeholder="Select term" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE}>All terms</SelectItem>
                      {yearTerms.map((t) => (
                        <SelectItem key={t.id} value={String(t.id)}>
                          {t.academic_year} {t.term}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <div className="text-[11px] text-muted-foreground uppercase font-medium">Campus</div>
                  <Select value={selectedCampusId} onValueChange={setSelectedCampusId}>
                    <SelectTrigger className="h-8 rounded-xl text-xs border-border/60 shadow-sm bg-background">
                      <SelectValue placeholder="Select campus" />
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
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[320px_1fr] gap-3">
              <div className="rounded-2xl border border-border/60 overflow-auto bg-card shadow-sm premium-surface h-[520px]">
                <div className="sticky top-0 z-10 bg-muted/50 border-b border-border/60 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide">
                  Admission Statistics
                </div>
                <div className="p-2 space-y-1">
                  {colleges.map((c) => (
                    <div
                      key={c.id}
                      className="text-xs px-2 py-1 rounded-md border border-transparent hover:border-border/60 hover:bg-muted/40"
                    >
                      {c.college_name}
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-border/60 overflow-auto bg-card shadow-sm premium-surface h-[520px]">
                <table className="w-full min-w-[900px] border-collapse text-[11px]">
                  <thead>
                    <tr className="sticky top-0 z-20 bg-muted/50 text-left shadow-sm">
                      {statsHeaders.map((h) => (
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
                      <td className="px-2 py-1 border-r border-border/30" />
                      <td className="px-2 py-1 border-r border-border/30 font-semibold text-right">Total:</td>
                      <td className="px-2 py-1 border-r border-border/30 text-right">0</td>
                      <td className="px-2 py-1 border-r border-border/30 text-right">0</td>
                      <td className="px-2 py-1 border-r border-border/30 text-right">0</td>
                      <td className="px-2 py-1 text-right">0</td>
                    </tr>
                    <tr>
                      <td colSpan={statsHeaders.length} className="h-[450px] bg-background/50" />
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

