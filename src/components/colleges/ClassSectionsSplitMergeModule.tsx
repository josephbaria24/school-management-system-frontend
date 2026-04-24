"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
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
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeftRight, 
  Send, 
  Users, 
  School, 
  Calendar, 
  MapPin, 
  ChevronRight, 
  BookOpen,
  Split,
  Search,
  Filter,
  UserCheck
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const API = process.env.NEXT_PUBLIC_API_URL;
const NONE = "__none__";

type AcademicYearTerm = {
  id: number;
  academic_year: string;
  term: string;
};

type Campus = {
  id: number;
  acronym: string;
  campus_name: string | null;
};

type ClassSectionOption = {
  id: string;
  label: string;
};

type StudentRow = {
  student_no: string;
  full_name: string;
  program: string;
  year_level: string;
};

const EMPTY_ROWS: StudentRow[] = [];

export function ClassSectionsSplitMergeModule() {
  const [yearTerms, setYearTerms] = useState<AcademicYearTerm[]>([]);
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [sections, setSections] = useState<ClassSectionOption[]>([]);
  const [yearTermId, setYearTermId] = useState("");
  const [campusId, setCampusId] = useState("");
  const [sourceSectionId, setSourceSectionId] = useState(NONE);
  const [destinationSectionId, setDestinationSectionId] = useState(NONE);
  const [selectedCount, setSelectedCount] = useState(0);

  useEffect(() => {
    const load = async () => {
      if (!API) return;
      try {
        const [ytRes, campusRes] = await Promise.all([
          fetch(`${API}/api/academic-year-terms`),
          fetch(`${API}/api/campuses`),
        ]);

        if (ytRes.ok) {
          const y = (await ytRes.json()) as AcademicYearTerm[];
          setYearTerms(y);
          if (y[0]) setYearTermId(String(y[0].id));
        }
        if (campusRes.ok) {
          const c = (await campusRes.json()) as Campus[];
          setCampuses(c);
          if (c[0]) setCampusId(String(c[0].id));
        }
      } catch {
        // keep UI usable in offline/partial API mode
      }
    };
    void load();
  }, []);

  useEffect(() => {
    const loadSections = async () => {
      if (!API) return;
      const cId = parseInt(campusId, 10);
      if (!Number.isFinite(cId)) {
        setSections([]);
        setSourceSectionId(NONE);
        setDestinationSectionId(NONE);
        return;
      }
      try {
        const res = await fetch(`${API}/api/buildings-rooms/tree`);
        if (!res.ok) return;
        const rows = (await res.json()) as Array<{ building_id: number | null; building_name: string | null; campus_id: number }>;
        const seen = new Set<number>();
        const opts: ClassSectionOption[] = [];
        for (const row of rows) {
          if (!row.building_id || seen.has(row.building_id) || row.campus_id !== cId) continue;
          seen.add(row.building_id);
          opts.push({
            id: String(row.building_id),
            label: row.building_name || `Section ${row.building_id}`,
          });
        }
        setSections(opts);
        setSourceSectionId(opts[0] ? opts[0].id : NONE);
        setDestinationSectionId(opts[1] ? opts[1].id : NONE);
      } catch {
        setSections([]);
      }
    };
    void loadSections();
  }, [campusId]);

  const sourceRows = useMemo(() => EMPTY_ROWS, []);
  const destinationRows = useMemo(() => EMPTY_ROWS, []);

  const transferSelected = () => {
    if (sourceSectionId === NONE || destinationSectionId === NONE) {
      toast({
        title: "Select sections",
        description: "Choose both source and destination class sections first.",
        variant: "destructive",
      });
      return;
    }
    toast({
      title: "Transfer selected",
      description: "Student transfer action will be wired to API.",
    });
  };

  return (
    <div className="p-6 space-y-6 bg-muted/5 min-h-screen font-geist">
      {/* Module Header */}
      <Card className="rounded-2xl border-border/60 shadow-sm overflow-hidden">
        <CardHeader className="p-0">
          <div className="bg-background p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40">
            <div className="flex items-center gap-4 text-foreground">
              <div className="bg-emerald-600 p-2.5 rounded-xl shadow-sm">
                <Split className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold tracking-tight text-emerald-950">Class Sections (Split/Merge)</CardTitle>
                <p className="text-muted-foreground text-xs font-medium mt-0.5">
                  Manage student transfers between class sections efficiently.
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
               <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-emerald-100 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                System Status: Active
              </Badge>
            </div>
          </div>
          
          <div className="bg-background px-6 py-4 border-b border-border/40 flex items-center justify-between flex-wrap gap-6">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <BookOpen className="h-4 w-4 text-emerald-600" />
              <span>Colleges</span>
              <ChevronRight className="h-3.5 w-3.5 opacity-50" />
              <span className="text-foreground font-semibold">Class Sections (Split/Merge)</span>
            </div>

            {/* Quick Filters */}
            <div className="flex items-center gap-4">
               <div className="flex items-center gap-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground whitespace-nowrap">SY Term</label>
                <Select value={yearTermId} onValueChange={setYearTermId}>
                  <SelectTrigger className="h-9 w-[200px] rounded-xl border-border/60 text-xs shadow-sm bg-background">
                    <SelectValue placeholder="Select term" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {yearTerms.map((y) => (
                      <SelectItem key={y.id} value={String(y.id)} className="text-xs">
                        {y.academic_year} {y.term}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground whitespace-nowrap">Campus</label>
                <Select value={campusId} onValueChange={setCampusId}>
                  <SelectTrigger className="h-9 w-[120px] rounded-xl border-border/60 text-xs shadow-sm bg-background">
                    <SelectValue placeholder="Campus" />
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
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 gap-6">
        {/* Routing Control Card */}
        <Card className="rounded-2xl border-border/60 shadow-sm overflow-hidden bg-white/50 backdrop-blur-sm">
           <CardHeader className="pb-3 border-b border-border/40 bg-muted/5">
            <div className="flex items-center gap-2">
              <ArrowLeftRight className="h-4 w-4 text-emerald-600" />
              <CardTitle className="text-xs font-bold uppercase tracking-wider">Transfer Routing</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-4 grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
             <div className="space-y-2">
              <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">
                <Users className="h-3 w-3" /> Source Class Section
              </label>
              <Select value={sourceSectionId} onValueChange={setSourceSectionId}>
                <SelectTrigger className="h-10 rounded-xl border-border/60 text-sm shadow-sm bg-background">
                  <SelectValue placeholder="Select source" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value={NONE} className="italic text-xs">Select source section</SelectItem>
                  {sections.map((s) => (
                    <SelectItem key={s.id} value={s.id} className="text-xs">{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">
                 <UserCheck className="h-3 w-3" /> Destination Class Section
              </label>
              <Select value={destinationSectionId} onValueChange={setDestinationSectionId}>
                <SelectTrigger className="h-10 rounded-xl border-border/60 text-sm shadow-sm bg-background">
                  <SelectValue placeholder="Select destination" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                   <SelectItem value={NONE} className="italic text-xs">Select destination section</SelectItem>
                  {sections.map((s) => (
                    <SelectItem key={s.id} value={s.id} className="text-xs">{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Twin Student Panels */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
           {/* Source Panel */}
           <Card className="rounded-2xl border-border/60 shadow-sm overflow-hidden flex flex-col h-[520px]">
              <CardHeader className="p-3 border-b border-indigo-100 bg-indigo-50/30 shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-indigo-100 rounded-lg">
                      <Users className="h-4 w-4 text-indigo-600" />
                    </div>
                    <CardTitle className="text-xs font-bold uppercase tracking-wider text-indigo-900">Source Class Section</CardTitle>
                  </div>
                   <Badge variant="secondary" className="bg-white text-indigo-700 border-indigo-100 text-[10px] font-bold">
                    {sourceRows.length} Students
                  </Badge>
                </div>
              </CardHeader>
              
              <div className="grid grid-cols-[100px_1fr_120px_80px] bg-indigo-100/50 text-[10px] font-bold uppercase tracking-widest px-4 py-2 border-b border-indigo-100 shadow-sm z-10 shrink-0">
                <div className="text-indigo-900/60">ID Number</div>
                <div className="text-indigo-900/60 border-l border-indigo-200/50 px-3">Student Name</div>
                <div className="text-indigo-900/60 border-l border-indigo-200/50 px-3">Program</div>
                <div className="text-indigo-900/60 border-l border-indigo-200/50 px-3 text-center">Year</div>
              </div>

              <ScrollArea className="flex-1">
                <CardContent className="p-0">
                  {sourceRows.length === 0 ? (
                    <div className="p-12 text-center text-xs text-muted-foreground/50 italic flex flex-col items-center justify-center min-h-[360px]">
                       <UserCheck className="h-8 w-8 mb-2 opacity-10" />
                       No students found in source section.
                    </div>
                  ) : null}
                </CardContent>
              </ScrollArea>
              
              <div className="p-3 bg-muted/5 border-t border-border/40 flex items-center justify-between shrink-0">
                 <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Section Total</span>
                 <p className="text-xs font-bold text-foreground">{sourceRows.length}</p>
              </div>
           </Card>

           {/* Destination Panel */}
           <Card className="rounded-2xl border-border/60 shadow-sm overflow-hidden flex flex-col h-[520px]">
              <CardHeader className="p-3 border-b border-emerald-100 bg-emerald-50/30 shrink-0">
                 <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-emerald-100 rounded-lg">
                      <UserCheck className="h-4 w-4 text-emerald-600" />
                    </div>
                    <CardTitle className="text-xs font-bold uppercase tracking-wider text-emerald-900">Destination Class Section</CardTitle>
                  </div>
                   <Badge variant="secondary" className="bg-white text-emerald-700 border-emerald-100 text-[10px] font-bold">
                    {destinationRows.length} Students
                  </Badge>
                </div>
              </CardHeader>

              <div className="grid grid-cols-[100px_1fr_120px_80px] bg-emerald-100/50 text-[10px] font-bold uppercase tracking-widest px-4 py-2 border-b border-emerald-100 shadow-sm z-10 shrink-0">
                <div className="text-emerald-900/60">ID Number</div>
                <div className="text-emerald-900/60 border-l border-emerald-200/50 px-3">Student Name</div>
                <div className="text-emerald-900/60 border-l border-emerald-200/50 px-3">Program</div>
                <div className="text-emerald-900/60 border-l border-emerald-200/50 px-3 text-center">Year</div>
              </div>

              <ScrollArea className="flex-1">
                <CardContent className="p-0">
                  {destinationRows.length === 0 ? (
                    <div className="p-12 text-center text-xs text-muted-foreground/50 italic flex flex-col items-center justify-center min-h-[360px]">
                       <UserCheck className="h-8 w-8 mb-2 opacity-10" />
                       No students found in destination section.
                    </div>
                  ) : null}
                </CardContent>
              </ScrollArea>

              <div className="p-3 bg-muted/5 border-t border-border/40 flex items-center justify-between shrink-0">
                 <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Section Total</span>
                 <p className="text-xs font-bold text-foreground">{destinationRows.length}</p>
              </div>
           </Card>
        </div>

        {/* Action Bar */}
        <Card className="rounded-2xl border-border/60 shadow-sm overflow-hidden bg-background">
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-6">
               <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Transfer Mode</span>
                  <span className="text-xs font-bold text-emerald-700">Student Split/Merge</span>
               </div>
               <Separator orientation="vertical" className="h-8" />
               <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Selected to Transfer</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-red-600">{selectedCount}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 rounded-md hover:bg-red-50 hover:text-red-600 transition-colors"
                      onClick={() => setSelectedCount((v) => Math.max(0, v - 1))}
                    >
                      <ArrowLeftRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>
               </div>
            </div>

            <div className="flex items-center gap-3">
              <Button variant="ghost" className="h-10 rounded-xl text-xs font-bold text-muted-foreground hover:text-emerald-600 px-4">
                Clear Selection
              </Button>
              <Button
                className="h-10 rounded-xl px-8 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-200/50"
                onClick={transferSelected}
              >
                <Send className="h-3.5 w-3.5 mr-2" />
                Transfer Selected Candidates
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
