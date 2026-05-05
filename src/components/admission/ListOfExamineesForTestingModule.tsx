"use client";

import { useEffect, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const API = process.env.NEXT_PUBLIC_API_URL;
const NONE = "__none__";

type AcademicYearTerm = { id: number; academic_year: string; term: string };
type Campus = { id: number; acronym: string; campus_name: string | null };

const columns = [
  "Schedule",
  "Full Name",
  "Application No.",
  "Gender",
  "Age",
  "Birth Date",
  "Actual Exam.",
  "Exam Ref. #",
  "Exam Type",
  "Type",
  "Campus - Choice 1",
  "Course - Choice 1",
  "Course - Choice 2",
];

export function ListOfExamineesForTestingModule() {
  const [yearTerms, setYearTerms] = useState<AcademicYearTerm[]>([]);
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [selectedTermId, setSelectedTermId] = useState<string>(NONE);
  const [selectedCampusId, setSelectedCampusId] = useState<string>(NONE);

  useEffect(() => {
    const load = async () => {
      if (!API) return;
      try {
        const [termRes, campusRes] = await Promise.all([
          fetch(`${API}/api/academic-year-terms`),
          fetch(`${API}/api/campuses`),
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
      } catch {
        // keep empty selectors if request fails
      }
    };
    void load();
  }, []);

  return (
    <div className="h-full bg-background relative overflow-x-hidden">
      <div className="w-full px-2 pt-2 pb-4">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h1 className="setup-type-page-title">List of Examinees for Testing</h1>
            <p className="setup-type-page-desc">
              View the examinees queue and test details by selected campus and academic year/term.
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
              <div className="setup-type-module-title truncate">Examinees Workspace</div>
              <div className="setup-type-module-sub">Testing list and basic applicant exam information</div>
            </div>
          </div>

          <div className="p-3 bg-background/60 space-y-3">
            <div className="rounded-2xl border border-border/60 p-3 bg-muted/15 shadow-sm">
              <div className="grid grid-cols-[1fr_auto] gap-2 items-end max-w-[520px]">
                <div className="space-y-1">
                  <div className="text-[11px] text-muted-foreground uppercase font-medium">
                    Select Campus and Academic Year/Term
                  </div>
                  <div className="grid grid-cols-2 gap-2">
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
                </div>
                <button className="h-8 rounded-xl px-4 text-xs font-semibold border border-border/60 bg-background hover:bg-muted/50">
                  OK
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-border/60 overflow-auto bg-card shadow-sm premium-surface">
              <table className="w-full min-w-[1400px] border-collapse text-[11px]">
                <thead>
                  <tr className="sticky top-0 z-20 bg-muted/50 text-left shadow-sm">
                    {columns.map((h) => (
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
                  <tr>
                    <td colSpan={columns.length} className="h-[420px] bg-background/50" />
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

