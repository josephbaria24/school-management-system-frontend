"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Search } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL;

type Campus = { id: number; acronym: string; campus_name: string | null };
type AcademicYearTerm = { id: number; academic_year: string; term: string };
type Program = { id: number; campus_id: number; program_code: string; program_name: string };

const YEAR_LEVELS = [
  "Grade 1",
  "Grade 2",
  "Grade 3",
  "Grade 4",
  "Grade 5",
  "Grade 6",
  "Grade 7",
  "Grade 8",
  "Grade 9",
  "Grade 10",
  "Grade 11",
  "Grade 12",
];

export function ClassSectioningGsHsModule() {
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [yearTerms, setYearTerms] = useState<AcademicYearTerm[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [campusId, setCampusId] = useState("");
  const [schoolYearId, setSchoolYearId] = useState("");
  const [programId, setProgramId] = useState("");
  const [yearLevel, setYearLevel] = useState("");

  useEffect(() => {
    const load = async () => {
      if (!API) return;
      try {
        const [cRes, yRes, pRes] = await Promise.all([
          fetch(`${API}/api/campuses`),
          fetch(`${API}/api/academic-year-terms`),
          fetch(`${API}/api/academic-programs`),
        ]);
        if (cRes.ok) {
          const c = (await cRes.json()) as Campus[];
          setCampuses(c);
          if (c[0]) setCampusId(String(c[0].id));
        }
        if (yRes.ok) {
          const y = (await yRes.json()) as AcademicYearTerm[];
          setYearTerms(y);
          if (y[0]) setSchoolYearId(String(y[0].id));
        }
        if (pRes.ok) setPrograms((await pRes.json()) as Program[]);
      } catch {
        // noop
      }
    };
    void load();
  }, []);

  const campusIdNum = useMemo(() => parseInt(campusId, 10), [campusId]);
  const filteredPrograms = useMemo(() => {
    if (!Number.isFinite(campusIdNum)) return programs;
    return programs.filter((p) => p.campus_id === campusIdNum);
  }, [programs, campusIdNum]);

  useEffect(() => {
    if (filteredPrograms.length === 0) {
      setProgramId("");
      return;
    }
    if (!programId || !filteredPrograms.some((p) => String(p.id) === programId)) {
      setProgramId(String(filteredPrograms[0].id));
    }
  }, [filteredPrograms, programId]);

  const handleSearch = () => {
    toast({
      title: "Search",
      description:
        "Filters are applied. Student enrollment APIs are not wired yet — lists will populate when connected.",
    });
  };

  return (
    <div className="h-full bg-[#f2fbf7] p-1">
      <div className="w-full border border-[#79b898] bg-white min-h-[620px]">
        <div className="bg-gradient-to-b from-[#def8ea] to-[#9fdbbc] border-b border-[#79b898] px-3 py-2">
          <h1 className="text-[22px] font-bold uppercase tracking-tight text-[#1f5e45]">
            Grade School / High School Class Sectioning
          </h1>
          <p className="text-[12px] text-[#35684f]">
            Use this module to arrange the students to their respective class section.
          </p>
        </div>

        <div className="grid grid-cols-12 gap-2 p-2">
          <div className="col-span-12 lg:col-span-3 border border-[#9ed9c1] bg-[#f8fdf9] p-2 space-y-2">
            <div className="space-y-1">
              <Label className="text-[12px] font-semibold text-[#1f5e45]">Campus</Label>
              <Select value={campusId} onValueChange={setCampusId}>
                <SelectTrigger className="h-8 text-[12px] bg-white">
                  <SelectValue placeholder="Select campus" />
                </SelectTrigger>
                <SelectContent>
                  {campuses.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.acronym}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-[12px] font-semibold text-[#1f5e45]">School Year</Label>
              <Select value={schoolYearId} onValueChange={setSchoolYearId}>
                <SelectTrigger className="h-8 text-[12px] bg-white">
                  <SelectValue placeholder="Select school year" />
                </SelectTrigger>
                <SelectContent>
                  {yearTerms.map((y) => (
                    <SelectItem key={y.id} value={String(y.id)}>
                      {y.academic_year} {y.term}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-[12px] font-semibold text-[#1f5e45]">Program</Label>
              <Select value={programId} onValueChange={setProgramId}>
                <SelectTrigger className="h-8 text-[12px] bg-white">
                  <SelectValue placeholder="Select program" />
                </SelectTrigger>
                <SelectContent>
                  {filteredPrograms.map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      {p.program_code} — {p.program_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-[12px] font-semibold text-[#1f5e45]">Year Level</Label>
              <Select value={yearLevel} onValueChange={setYearLevel}>
                <SelectTrigger className="h-8 text-[12px] bg-white">
                  <SelectValue placeholder="Select year level" />
                </SelectTrigger>
                <SelectContent>
                  {YEAR_LEVELS.map((yl) => (
                    <SelectItem key={yl} value={yl}>
                      {yl}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button type="button" className="w-full h-8 text-[12px] gap-1" onClick={handleSearch}>
              <Search className="h-3.5 w-3.5" />
              Search
            </Button>
          </div>

          <div className="col-span-12 lg:col-span-9 grid grid-cols-1 lg:grid-cols-2 gap-2">
            <div className="border border-[#79b898] bg-white flex flex-col min-h-[480px]">
              <div className="bg-gradient-to-b from-[#6ec79b] to-[#2f9b68] text-white text-[11px] font-bold px-2 py-1">
                List of Students without Class Section: 0
              </div>
              <div className="grid grid-cols-4 bg-[#f8fdf9] text-[11px] font-semibold text-[#1f5e45] border-b border-[#d4e8dc]">
                <div className="px-2 py-1 border-r border-[#d4e8dc]">RegID</div>
                <div className="px-2 py-1 border-r border-[#d4e8dc]">Student No.</div>
                <div className="px-2 py-1 border-r border-[#d4e8dc]">Fullname</div>
                <div className="px-2 py-1">Gender</div>
              </div>
              <div className="flex-1 overflow-auto min-h-[400px] text-[12px] text-muted-foreground p-2">
                No records to display.
              </div>
            </div>

            <div className="border border-[#79b898] bg-white flex flex-col min-h-[480px]">
              <div className="bg-gradient-to-b from-[#6ec79b] to-[#2f9b68] text-white text-[11px] font-bold px-2 py-1">
                List of Students in this Class Section:
              </div>
              <div className="grid grid-cols-9 bg-[#f8fdf9] text-[10px] font-semibold text-[#1f5e45] border-b border-[#d4e8dc]">
                <div className="px-1 py-1 border-r border-[#d4e8dc]">RegID</div>
                <div className="px-1 py-1 border-r border-[#d4e8dc]">Student No.</div>
                <div className="px-1 py-1 border-r border-[#d4e8dc]">Fullname</div>
                <div className="px-1 py-1 border-r border-[#d4e8dc]">Gender</div>
                <div className="px-1 py-1 border-r border-[#d4e8dc]">Age</div>
                <div className="px-1 py-1 border-r border-[#d4e8dc]">Date Validated</div>
                <div className="px-1 py-1 border-r border-[#d4e8dc]">Validated By</div>
                <div className="px-1 py-1 border-r border-[#d4e8dc]">ORNo</div>
                <div className="px-1 py-1">Parents</div>
              </div>
              <div className="flex-1 overflow-auto min-h-[400px] text-[12px] text-muted-foreground p-2">
                No records to display.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
