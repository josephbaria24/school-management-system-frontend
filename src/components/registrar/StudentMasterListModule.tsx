"use client";

import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const API = process.env.NEXT_PUBLIC_API_URL;
const NONE = "__none__";

type Campus = { id: number; acronym: string; campus_name: string | null };
type YearTerm = { id: number; academic_year: string; term: string };
type College = {
  id: number;
  campus_id?: number | null;
  college_code?: string | null;
  college_name: string;
  dean_name?: string | null;
};
type Program = { id: number; college_id: number; campus_id?: number | null };

export function StudentMasterListModule() {
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [terms, setTerms] = useState<YearTerm[]>([]);
  const [colleges, setColleges] = useState<College[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);

  const [selectedCampusId, setSelectedCampusId] = useState<string>(NONE);
  const [selectedTermId, setSelectedTermId] = useState<string>(NONE);
  const [query, setQuery] = useState("");
  const [appliedQuery, setAppliedQuery] = useState("");

  useEffect(() => {
    const load = async () => {
      if (!API) return;
      try {
        const [campusRes, termRes, collegeRes, programRes] = await Promise.all([
          fetch(`${API}/api/campuses`),
          fetch(`${API}/api/academic-year-terms`),
          fetch(`${API}/api/colleges`),
          fetch(`${API}/api/academic-programs?status=active`),
        ]);
        if (campusRes.ok) {
          const rows = (await campusRes.json()) as Campus[];
          setCampuses(rows);
          if (rows[0]) setSelectedCampusId(String(rows[0].id));
        }
        if (termRes.ok) {
          const rows = (await termRes.json()) as YearTerm[];
          setTerms(rows);
        }
        if (collegeRes.ok) setColleges((await collegeRes.json()) as College[]);
        if (programRes.ok) setPrograms((await programRes.json()) as Program[]);
      } catch {
        // keep empty fallback UI
      }
    };
    void load();
  }, []);

  const filteredColleges = useMemo(() => {
    const q = appliedQuery.trim().toLowerCase();
    return colleges.filter((c) => {
      const byCampus = selectedCampusId === NONE || String(c.campus_id ?? "") === selectedCampusId;
      const byQuery =
        !q ||
        `${c.college_code || ""} ${c.college_name || ""} ${c.dean_name || ""}`.toLowerCase().includes(q);
      return byCampus && byQuery;
    });
  }, [colleges, selectedCampusId, appliedQuery]);

  const programCountByCollege = useMemo(() => {
    const map = new Map<number, number>();
    programs.forEach((p) => {
      if (!p.college_id) return;
      map.set(p.college_id, (map.get(p.college_id) || 0) + 1);
    });
    return map;
  }, [programs]);

  const selectedCampus = campuses.find((c) => String(c.id) === selectedCampusId) || null;

  return (
    <div className="h-full bg-background overflow-x-hidden">
      <div className="w-full px-2 pt-2 pb-4 space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="setup-type-page-title">Students Master List</h1>
            <p className="setup-type-page-desc">
              View student statistics and admitted list summary by campus and college.
            </p>
          </div>
          <div className="setup-type-kicker-pill hidden sm:flex h-9 items-center rounded-xl border border-border/60 bg-background/70 px-3 shadow-sm">
            Registrar module
          </div>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card shadow-sm overflow-hidden">
          <div className="p-3 border-b border-border/60 bg-muted/20 grid grid-cols-1 lg:grid-cols-[220px_220px_1fr_auto] gap-2 items-end">
            <div className="space-y-1">
              <Label className="text-[11px] text-muted-foreground uppercase">Select Campus</Label>
              <Select value={selectedCampusId} onValueChange={setSelectedCampusId}>
                <SelectTrigger className="h-8 rounded-xl text-xs border-border/60 bg-background">
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

            <div className="space-y-1">
              <Label className="text-[11px] text-muted-foreground uppercase">Academic Year</Label>
              <Select value={selectedTermId} onValueChange={setSelectedTermId}>
                <SelectTrigger className="h-8 rounded-xl text-xs border-border/60 bg-background">
                  <SelectValue placeholder="From Students Profile" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>From Students Profile</SelectItem>
                  {terms.map((t) => (
                    <SelectItem key={t.id} value={String(t.id)}>
                      {t.academic_year} {t.term}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-[11px] text-muted-foreground uppercase">Search</Label>
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search college code/name/dean"
                className="h-8 rounded-xl text-xs border-border/60 bg-background"
              />
            </div>
            <Button onClick={() => setAppliedQuery(query)} className="h-8 text-xs rounded-xl">
              Search
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr]">
            <div className="border-r border-border/60 p-3 bg-muted/10 min-h-[520px]">
              <div className="text-xs font-semibold mb-2">Campus Tree</div>
              <div className="rounded-xl border border-border/60 bg-background p-2 text-xs">
                <div className="font-semibold">{selectedCampus?.acronym || "All Campus/es"}</div>
                <div className="text-muted-foreground mt-1">
                  {selectedCampus?.campus_name || "Campus grouping"}
                </div>
              </div>
            </div>

            <div className="p-3 min-h-[520px]">
              <div className="rounded-xl border border-border/60 overflow-hidden">
                <div className="grid grid-cols-[90px_1fr_120px_120px_110px] text-[11px] font-semibold bg-muted/30 border-b border-border/60">
                  {["College Code", "College", "No. of Programs", "College Dean", "College Logo"].map((h) => (
                    <div key={h} className="px-2 py-2 border-r border-border/60 last:border-r-0">
                      {h}
                    </div>
                  ))}
                </div>
                <div className="max-h-[470px] overflow-y-auto">
                  {filteredColleges.map((c, idx) => (
                    <div
                      key={c.id}
                      className={`grid grid-cols-[90px_1fr_120px_120px_110px] text-xs border-b border-border/40 ${
                        idx % 2 ? "bg-muted/10" : ""
                      }`}
                    >
                      <div className="px-2 py-2 border-r border-border/40 font-mono text-emerald-700">
                        {c.college_code || "-"}
                      </div>
                      <div className="px-2 py-2 border-r border-border/40">{c.college_name}</div>
                      <div className="px-2 py-2 border-r border-border/40 text-right">
                        {programCountByCollege.get(c.id) || 0}
                      </div>
                      <div className="px-2 py-2 border-r border-border/40 truncate">{c.dean_name || ""}</div>
                      <div className="px-2 py-2 text-muted-foreground">NULL</div>
                    </div>
                  ))}
                  {!filteredColleges.length && (
                    <div className="px-2 py-6 text-xs text-muted-foreground">No colleges found.</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

