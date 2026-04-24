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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
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

type ScheduleOption = {
  id: string;
  label: string;
};

type StudentScheduleRow = {
  student_no: string;
  full_name: string;
  program: string;
  year_level: string;
};

const EMPTY_ROWS: StudentScheduleRow[] = [];

/**
 * Modernized Class Schedules (Split/Merge) Module
 * Features a twin-panel layout for student transfers between schedules.
 */
export function ClassSchedulesSplitMergeModule() {
  const [yearTerms, setYearTerms] = useState<AcademicYearTerm[]>([]);
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [scheduleOptions, setScheduleOptions] = useState<ScheduleOption[]>([]);
  const [yearTermId, setYearTermId] = useState("");
  const [sourceCampusId, setSourceCampusId] = useState("");
  const [destinationCampusId, setDestinationCampusId] = useState("");
  const [sourceScheduleId, setSourceScheduleId] = useState(NONE);
  const [destinationScheduleId, setDestinationScheduleId] = useState(NONE);
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
          if (c[0]) {
            setSourceCampusId(String(c[0].id));
            setDestinationCampusId(String(c[0].id));
          }
        }
      } catch (err) {
        console.error("Failed to load initial data", err);
      }
    };
    void load();
  }, []);

  useEffect(() => {
    const loadSchedules = async () => {
      if (!API) return;
      try {
        const res = await fetch(`${API}/api/buildings-rooms/tree`);
        if (!res.ok) return;
        const rows = (await res.json()) as Array<{ building_id: number | null; building_name: string | null }>;
        const seen = new Set<number>();
        const opts: ScheduleOption[] = [];
        for (const row of rows) {
          if (!row.building_id || seen.has(row.building_id)) continue;
          seen.add(row.building_id);
          opts.push({
            id: String(row.building_id),
            label: row.building_name || `Class Schedule ${row.building_id}`,
          });
        }
        setScheduleOptions(opts);
        setSourceScheduleId(opts[0] ? opts[0].id : NONE);
        setDestinationScheduleId(opts[1] ? opts[1].id : NONE);
      } catch (err) {
        console.error("Failed to load schedules", err);
        setScheduleOptions([]);
      }
    };
    void loadSchedules();
  }, []);

  const sourceCampusLabel = useMemo(
    () => campuses.find((c) => String(c.id) === sourceCampusId)?.acronym || "-",
    [campuses, sourceCampusId],
  );
  const destinationCampusLabel = useMemo(
    () => campuses.find((c) => String(c.id) === destinationCampusId)?.acronym || "-",
    [campuses, destinationCampusId],
  );

  const sourceRows = useMemo(() => EMPTY_ROWS, []);
  const destinationRows = useMemo(() => EMPTY_ROWS, []);

  const transferSelected = () => {
    if (sourceScheduleId === NONE || destinationScheduleId === NONE) {
      toast({
        title: "Select schedules",
        description: "Choose source and destination class schedules first.",
        variant: "destructive",
      });
      return;
    }
    toast({
      title: "Transfer selected",
      description: "Class schedule split/merge action initiated.",
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
                <CardTitle className="text-lg font-bold tracking-tight text-emerald-950">Class Schedules (Split/Merge)</CardTitle>
                <p className="text-muted-foreground text-xs font-medium mt-0.5">
                  Use this module to transfer student schedules from one class schedule to another safely.
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
               <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-emerald-100 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                System Status: Active
              </Badge>
            </div>
          </div>
          
          <div className="bg-background px-6 py-4 border-b border-border/40 flex items-center justify-between flex-wrap gap-6 text-xs text-muted-foreground">
            <div className="flex items-center gap-2 font-medium">
              <BookOpen className="h-4 w-4 text-emerald-600" />
              <span>Colleges</span>
              <ChevronRight className="h-3.5 w-3.5" />
              <span className="text-foreground font-semibold">Schedules Split/Merge</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> Campus Management</span>
              <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> 2024 - 2025</span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {/* Main Controls Overlay */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-end bg-muted/20 p-6 rounded-2xl border border-border/40">
            <div className="lg:col-span-3 space-y-2">
              <div className="flex items-center gap-2 mb-1">
                <div className="h-2 w-2 rounded-full bg-emerald-500" />
                <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">SY Term</Label>
              </div>
              <Select value={yearTermId} onValueChange={setYearTermId}>
                <SelectTrigger className="h-9 border-border/40 bg-white rounded-xl text-xs font-semibold shadow-sm">
                  <SelectValue placeholder="SY Term" />
                </SelectTrigger>
                <SelectContent>
                  {yearTerms.map((y) => (
                    <SelectItem key={y.id} value={String(y.id)} className="text-xs">
                      SY: {y.academic_year} - {y.term}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="lg:col-span-3 space-y-2">
              <div className="flex items-center gap-2 mb-1">
                <div className="h-2 w-2 rounded-full bg-indigo-500" />
                <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Source Campus</Label>
              </div>
              <Select value={sourceCampusId} onValueChange={setSourceCampusId}>
                <SelectTrigger className="h-9 border-border/40 bg-white rounded-xl text-xs font-semibold shadow-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {campuses.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)} className="text-xs">{c.acronym}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="lg:col-span-3 space-y-2">
              <div className="flex items-center gap-2 mb-1">
                <div className="h-2 w-2 rounded-full bg-emerald-500" />
                <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Destination Campus</Label>
              </div>
              <Select value={destinationCampusId} onValueChange={setDestinationCampusId}>
                <SelectTrigger className="h-9 border-border/40 bg-white rounded-xl text-xs font-semibold shadow-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {campuses.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)} className="text-xs">{c.acronym}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Transfer Routing Info */}
            <div className="lg:col-span-3 border border-indigo-100 bg-indigo-50/50 rounded-2xl p-4 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-[10px] uppercase font-bold text-indigo-600 tracking-tighter">Source</p>
                <p className="text-xs font-extrabold text-indigo-950">{sourceCampusLabel}</p>
              </div>
              <div className="bg-white p-2 rounded-full shadow-sm">
                <ArrowLeftRight className="h-4 w-4 text-indigo-400" />
              </div>
              <div className="space-y-1 text-right">
                <p className="text-[10px] uppercase font-bold text-emerald-600 tracking-tighter">Destination</p>
                <p className="text-xs font-extrabold text-emerald-950">{destinationCampusLabel}</p>
              </div>
            </div>
          </div>

          {/* Twin Student Panels */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* SOURCE PANEL */}
            <Card className="rounded-2xl border-indigo-100 shadow-sm overflow-hidden flex flex-col h-[550px]">
              <CardHeader className="p-4 bg-indigo-50/70 border-b border-indigo-100/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-indigo-600" />
                    <CardTitle className="text-xs font-bold uppercase tracking-widest text-indigo-900">Source Class Schedule</CardTitle>
                  </div>
                </div>
                <div className="mt-3">
                  <Select value={sourceScheduleId} onValueChange={setSourceScheduleId}>
                    <SelectTrigger className="h-9 border-indigo-200/50 bg-white rounded-xl text-xs shadow-sm font-medium">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE} className="text-xs">Select source schedule</SelectItem>
                      {scheduleOptions.map((s) => (
                        <SelectItem key={s.id} value={s.id} className="text-xs">{s.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              
              <div className="grid grid-cols-4 px-4 py-2.5 bg-indigo-100/20 text-[10px] font-extrabold uppercase tracking-widest text-indigo-800 border-b border-indigo-50">
                <div className="flex items-center gap-1.5"><Search className="h-3 w-3" /> Student No</div>
                <div>Full Name</div>
                <div className="flex items-center gap-1.5"><Filter className="h-3 w-3" /> Program</div>
                <div>Year</div>
              </div>

              <ScrollArea className="flex-1 bg-white">
                <div className="p-0">
                  {sourceRows.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground/60 space-y-2">
                       <UserCheck className="h-8 w-8 opacity-20" />
                       <p className="text-[11px] font-medium italic">No students loaded from source</p>
                    </div>
                  ) : (
                    sourceRows.map((row, idx) => (
                      <div key={idx} className="grid grid-cols-4 px-4 py-2.5 text-xs border-b border-border/20 hover:bg-muted/10 transition-colors">
                        <span className="font-bold text-indigo-950/80 tracking-tighter">{row.student_no}</span>
                        <span className="font-semibold text-foreground/80">{row.full_name}</span>
                        <span className="text-[11px] truncate">{row.program}</span>
                        <span className="text-center">{row.year_level}</span>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>

              <div className="p-4 bg-muted/5 border-t border-indigo-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-white text-indigo-700 border-indigo-100 rounded-lg py-1 px-3 shadow-xs">
                    <span className="text-[10px] font-bold">Total: {sourceRows.length}</span>
                  </Badge>
                </div>
              </div>
            </Card>

            {/* DESTINATION PANEL */}
            <Card className="rounded-2xl border-emerald-100 shadow-sm overflow-hidden flex flex-col h-[550px]">
              <CardHeader className="p-4 bg-emerald-50/70 border-b border-emerald-100/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-emerald-600" />
                    <CardTitle className="text-xs font-bold uppercase tracking-widest text-emerald-900">Destination Class Schedule</CardTitle>
                  </div>
                </div>
                <div className="mt-3">
                  <Select value={destinationScheduleId} onValueChange={setDestinationScheduleId}>
                    <SelectTrigger className="h-9 border-emerald-200/50 bg-white rounded-xl text-xs shadow-sm font-medium">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE} className="text-xs">Select destination schedule</SelectItem>
                      {scheduleOptions.map((s) => (
                        <SelectItem key={s.id} value={s.id} className="text-xs">{s.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              
              <div className="grid grid-cols-4 px-4 py-2.5 bg-emerald-100/20 text-[10px] font-extrabold uppercase tracking-widest text-emerald-800 border-b border-emerald-50">
                <div>Student No</div>
                <div>Full Name</div>
                <div>Program</div>
                <div>Year</div>
              </div>

              <ScrollArea className="flex-1 bg-white">
                <div className="p-0">
                  {destinationRows.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground/60 space-y-2">
                       <UserCheck className="h-8 w-8 opacity-20" />
                       <p className="text-[11px] font-medium italic">Ready for transfer...</p>
                    </div>
                  ) : (
                    destinationRows.map((row, idx) => (
                      <div key={idx} className="grid grid-cols-4 px-4 py-2.5 text-xs border-b border-border/20 hover:bg-muted/10 transition-colors">
                        <span className="font-bold text-emerald-950/80 tracking-tighter">{row.student_no}</span>
                        <span className="font-semibold text-foreground/80">{row.full_name}</span>
                        <span className="text-[11px] truncate">{row.program}</span>
                        <span className="text-center">{row.year_level}</span>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>

              <div className="p-4 bg-muted/5 border-t border-emerald-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="bg-white text-emerald-700 border-emerald-100 rounded-lg py-1 px-3 shadow-xs">
                    <span className="text-[10px] font-bold">Total: {destinationRows.length}</span>
                  </Badge>
                  <Badge variant="secondary" className="bg-emerald-100/50 text-emerald-900 border-emerald-200/50 rounded-lg py-1 px-3 shadow-xs">
                    <span className="text-[10px] font-bold">Limit: 0</span>
                  </Badge>
                </div>
              </div>
            </Card>
          </div>

          <Separator className="bg-border/40" />

          {/* Action Footer */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-2">
            <div className="flex items-center gap-4">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground leading-none mb-1">Transfer Tracking</span>
                <div className="flex items-center gap-2">
                   <div className="flex -space-x-2">
                      {[1,2,3].map(i => <div key={i} className="h-7 w-7 rounded-full border-2 border-white bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground">?</div>)}
                   </div>
                   <span className="text-xs font-bold text-foreground/80 ml-2">
                    <span className="text-emerald-600 font-extrabold">{selectedCount}</span> Selected for transfer
                   </span>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-9 w-9 rounded-xl border-border/60 hover:bg-indigo-50 hover:text-indigo-600 transition-all shadow-sm"
                onClick={() => setSelectedCount((v) => Math.max(0, v - 1))}
              >
                <ArrowLeftRight className="h-4 w-4" />
              </Button>
            </div>

            <Button
              type="button"
              disabled={selectedCount === 0 && sourceRows.length === 0}
              className="h-10 rounded-xl px-8 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-200/50 transition-all duration-200 active:scale-95 gap-2"
              onClick={transferSelected}
            >
              <Send className="h-3.5 w-3.5" />
              TRANSFER SELECTED SCHEDULES
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
