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
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { 
  Search, 
  School, 
  ChevronRight, 
  Users, 
  UserCheck, 
  Filter,
  GraduationCap
} from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL;

type Campus = { id: number; acronym: string; campus_name: string | null };
type AcademicYearTerm = { id: number; academic_year: string; term: string };
type Program = { id: number; campus_id: number; program_code: string; program_name: string };

const YEAR_LEVELS = [
  "Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6",
  "Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12",
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
      title: "Class Sectioning Search",
      description: "Student recruitment lists will populate when the enrollment API is connected.",
    });
  };

  return (
    <div className="p-6 space-y-6 bg-muted/5 min-h-screen">
      {/* Header Card */}
      <Card className="rounded-2xl border-border/60 shadow-sm overflow-hidden">
        <CardHeader className="p-0">
          <div className="bg-background p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40">
            <div className="flex items-center gap-4 text-foreground">
              <div className="bg-emerald-600 p-2.5 rounded-xl shadow-sm">
                <School className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold tracking-tight text-emerald-950">Class Sectioning (GS/HS)</CardTitle>
                <p className="text-muted-foreground text-xs font-medium mt-0.5">
                  Grade School & High School Class Arrangement Manager
                </p>
              </div>
            </div>
          </div>
          <div className="bg-background px-6 py-3 border-b border-border/40 flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <span>Colleges</span>
              <ChevronRight className="h-3.5 w-3.5" />
              <span className="text-foreground font-semibold">Class Sectioning</span>
            </div>
            {programId && (
              <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-emerald-100 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                Active Program: {programs.find(p => String(p.id) === programId)?.program_code}
              </Badge>
            )}
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-[20rem_1fr] lg:grid-cols-[22rem_1fr] gap-6">
        {/* Sidebar Filters */}
        <div className="space-y-6">
          <Card className="rounded-2xl border-border/60 shadow-sm overflow-hidden">
            <CardHeader className="pb-3 border-b border-border/40 bg-muted/5">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-emerald-600" />
                <CardTitle className="text-sm font-semibold tracking-tight">Selection Filters</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Campus</label>
                <Select value={campusId} onValueChange={setCampusId}>
                  <SelectTrigger className="h-9 rounded-xl border-border/60 text-xs shadow-sm bg-background">
                    <SelectValue placeholder="Select campus" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {campuses.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)} className="text-xs">
                        {c.acronym}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Academic Year / Term</label>
                <Select value={schoolYearId} onValueChange={setSchoolYearId}>
                  <SelectTrigger className="h-9 rounded-xl border-border/60 text-xs shadow-sm bg-background">
                    <SelectValue placeholder="Select school year" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {yearTerms.map((y) => (
                      <SelectItem key={y.id} value={String(y.id)} className="text-xs">
                        {y.academic_year} — {y.term}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Program</label>
                <Select value={programId} onValueChange={setProgramId}>
                  <SelectTrigger className="h-9 rounded-xl border-border/60 text-xs shadow-sm bg-background">
                    <SelectValue placeholder="Select program" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl max-h-[300px]">
                    {filteredPrograms.map((p) => (
                      <SelectItem key={p.id} value={String(p.id)} className="text-xs">
                        {p.program_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Year Level</label>
                <Select value={yearLevel} onValueChange={setYearLevel}>
                  <SelectTrigger className="h-9 rounded-xl border-border/60 text-xs shadow-sm bg-background">
                    <SelectValue placeholder="Select year level" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {YEAR_LEVELS.map((yl) => (
                      <SelectItem key={yl} value={yl} className="text-xs">
                        {yl}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button 
                onClick={handleSearch} 
                className="w-full h-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 shadow-sm transition-all duration-200 mt-2"
              >
                <Search className="h-4 w-4 mr-2" />
                Find Students
              </Button>
            </CardContent>
          </Card>

          {/* Quick Info Card */}
          <Card className="rounded-2xl border-border/60 shadow-sm bg-emerald-50/50 border-emerald-100 overflow-hidden">
            <CardContent className="p-4 flex items-start gap-4">
              <div className="bg-emerald-100/80 p-2.5 rounded-xl">
                <GraduationCap className="h-5 w-5 text-emerald-600" />
              </div>
              <div className="space-y-1 mt-0.5">
                <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Quick Actions</h4>
                <p className="text-[11px] text-emerald-700/80 leading-relaxed font-medium">
                  Select students from the left panel to move them to the class section on the right.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Panels */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-6">
          {/* Pending Students */}
          <Card className="rounded-2xl border-border/60 shadow-sm overflow-hidden h-[600px] flex flex-col">
            <CardHeader className="pb-3 border-b border-border/40 bg-muted/5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-emerald-600" />
                  <CardTitle className="text-sm font-semibold tracking-tight">Available Students</CardTitle>
                </div>
                <Badge className="bg-muted text-muted-foreground border-0 rounded-lg text-[10px] font-bold">COUNT: 0</Badge>
              </div>
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mt-1 opacity-70">Without Class Section</p>
            </CardHeader>
            <div className="bg-muted/30 grid grid-cols-[5rem_6rem_1fr_4rem] border-b border-border/40 text-[10px] font-bold uppercase tracking-wider text-muted-foreground py-2.5 px-3">
              <div>RegID</div>
              <div className="border-l border-border/40 px-2">ID No.</div>
              <div className="border-l border-border/40 px-2">Full Name</div>
              <div className="border-l border-border/40 text-center">Gen</div>
            </div>
            <ScrollArea className="flex-1">
              <CardContent className="p-0">
                <div className="flex flex-col items-center justify-center h-[400px] text-muted-foreground space-y-2 opacity-50">
                  <Users className="h-10 w-10 opacity-20" />
                  <p className="text-xs font-medium">No students found</p>
                </div>
              </CardContent>
            </ScrollArea>
          </Card>

          {/* Sectioned Students */}
          <Card className="rounded-2xl border-border/60 shadow-sm overflow-hidden h-[600px] flex flex-col">
            <CardHeader className="pb-3 border-b border-border/40 bg-muted/5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <UserCheck className="h-4 w-4 text-emerald-600" />
                  <CardTitle className="text-sm font-semibold tracking-tight">In-Section Students</CardTitle>
                </div>
                <Badge className="bg-emerald-100 text-emerald-700 border-0 rounded-lg text-[10px] font-bold tracking-tight">ACTIVE SECTION</Badge>
              </div>
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mt-1 opacity-70">Current Class Selection</p>
            </CardHeader>
            <ScrollArea className="flex-1">
              <div className="bg-muted/30 grid grid-cols-[4rem_5rem_1fr_3rem_2rem_5rem] border-b border-border/40 text-[9px] font-bold uppercase tracking-wider text-muted-foreground py-2.5 px-3">
                <div>RegID</div>
                <div className="border-l border-border/40 px-1">ID No.</div>
                <div className="border-l border-border/40 px-1">Name</div>
                <div className="border-l border-border/40 text-center">Gen</div>
                <div className="border-l border-border/40 text-center">Age</div>
                <div className="border-l border-border/40 px-1 uppercase leading-tight text-center">Status</div>
              </div>
              <CardContent className="p-0">
                <div className="flex flex-col items-center justify-center h-[400px] text-muted-foreground space-y-2 opacity-50">
                  <UserCheck className="h-10 w-10 opacity-20" />
                  <p className="text-xs font-medium font-geist">Selection list empty</p>
                </div>
              </CardContent>
            </ScrollArea>
            <div className="bg-muted/30 border-t border-border/40 p-4 space-y-3">
                <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none">Total Students</span>
                    <span className="text-sm font-bold text-foreground leading-none">0</span>
                </div>
                <Separator className="bg-border/60" />
                <div className="flex gap-2">
                    <Button variant="outline" className="flex-1 rounded-xl h-9 text-xs border-border/60 shadow-sm">Clear Selection</Button>
                    <Button className="flex-1 rounded-xl h-9 text-xs bg-emerald-600 hover:bg-emerald-700 shadow-sm">Save Arrangement</Button>
                </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
