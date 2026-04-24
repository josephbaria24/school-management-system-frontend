"use client";

import { useEffect, useMemo, useState } from "react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  LineChart, 
  Search, 
  Filter, 
  MapPin, 
  ChevronRight, 
  BookOpen, 
  Users,
  Backpack,
  ChartBar,
  GraduationCap,
  School
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

const API = process.env.NEXT_PUBLIC_API_URL;

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

type CourseMaster = {
  id?: number;
  course_code: string;
  course_title?: string | null;
};

type ForecastRow = {
  academic_program: string;
  major_study: string;
  year_level: string;
  expected_enrollee: number;
};

const FORECAST_ROWS: ForecastRow[] = [];

/**
 * Modernized Forecasting Module
 * Features a dual-panel layout for subject analysis and enrollment forecasting.
 */
export function ForecastingModule() {
  const [yearTerms, setYearTerms] = useState<AcademicYearTerm[]>([]);
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [subjects, setSubjects] = useState<CourseMaster[]>([]);
  const [currentTermId, setCurrentTermId] = useState("");
  const [nextTermId, setNextTermId] = useState("");
  const [campusId, setCampusId] = useState("");

  useEffect(() => {
    const load = async () => {
      if (!API) return;
      try {
        const [ytRes, campusRes, courseRes] = await Promise.all([
          fetch(`${API}/api/academic-year-terms`),
          fetch(`${API}/api/campuses`),
          fetch(`${API}/api/courses-master-list`),
        ]);
        if (ytRes.ok) {
          const y = (await ytRes.json()) as AcademicYearTerm[];
          setYearTerms(y);
          if (y[0]) setCurrentTermId(String(y[0].id));
          if (y[1]) setNextTermId(String(y[1].id));
        }
        if (campusRes.ok) {
          const c = (await campusRes.json()) as Campus[];
          setCampuses(c);
          if (c[0]) setCampusId(String(c[0].id));
        }
        if (courseRes.ok) setSubjects((await courseRes.json()) as CourseMaster[]);
      } catch (err) {
        console.error("Failed to load forecasting data", err);
      }
    };
    void load();
  }, []);

  const campusName = useMemo(() => {
    const campus = campuses.find((c) => String(c.id) === campusId);
    return campus?.campus_name || campus?.acronym || "";
  }, [campuses, campusId]);

  const totalEnrolled = useMemo(
    () => FORECAST_ROWS.reduce((sum, row) => sum + row.expected_enrollee, 0),
    [],
  );

  return (
    <div className="p-6 space-y-6 bg-muted/5 min-h-screen font-geist">
      {/* Module Header */}
      <Card className="rounded-2xl border-border/60 shadow-sm overflow-hidden">
        <CardHeader className="p-0">
          <div className="bg-background p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40">
            <div className="flex items-center gap-4 text-foreground">
              <div className="bg-emerald-600 p-2.5 rounded-xl shadow-sm">
                <LineChart className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold tracking-tight text-emerald-950">Forecasting Module</CardTitle>
                <p className="text-muted-foreground text-xs font-medium mt-0.5">
                  Analyze trends and forecast figures for upcoming academic semesters.
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
               <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-emerald-100 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                Status: Analysis Active
              </Badge>
            </div>
          </div>
          
          <div className="bg-background px-6 py-4 border-b border-border/40 flex items-center justify-between flex-wrap gap-6 text-xs text-muted-foreground font-medium">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-emerald-600" />
              <span>Colleges</span>
              <ChevronRight className="h-3.5 w-3.5" />
              <span className="text-foreground font-semibold">Forecasting</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5"><ChartBar className="h-3.5 w-3.5 text-indigo-500" /> Projected Growth: +0%</span>
              <span className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5 text-emerald-500" /> Total Enrollees: {totalEnrolled}</span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {/* Controls Routing Card */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-end bg-muted/20 p-6 rounded-2xl border border-border/40 shadow-inner">
            <div className="lg:col-span-3 space-y-2">
              <div className="flex items-center gap-2 mb-1">
                <div className="h-2 w-2 rounded-full bg-emerald-500" />
                <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Current SY Term</Label>
              </div>
              <Select value={currentTermId} onValueChange={setCurrentTermId}>
                <SelectTrigger className="h-9 border-border/40 bg-white rounded-xl text-xs font-semibold shadow-sm">
                  <SelectValue placeholder="Current term" />
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

            <div className="lg:col-span-4 space-y-2">
              <div className="flex items-center gap-2 mb-1">
                <div className="h-2 w-2 rounded-full bg-indigo-500" />
                <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Target Campus</Label>
              </div>
              <Select value={campusId} onValueChange={setCampusId}>
                <SelectTrigger className="h-9 border-border/40 bg-white rounded-xl text-xs font-semibold shadow-sm">
                  <SelectValue placeholder="Select campus" />
                </SelectTrigger>
                <SelectContent>
                  {campuses.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)} className="text-xs">
                      {c.acronym} {c.campus_name ? `- ${c.campus_name}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="lg:col-span-3 space-y-2">
              <div className="flex items-center gap-2 mb-1">
                <div className="h-2 w-2 rounded-full bg-red-500" />
                <Label className="text-[11px] font-bold uppercase tracking-wider text-red-700/80">Next Forecast Semester</Label>
              </div>
              <Select value={nextTermId} onValueChange={setNextTermId}>
                <SelectTrigger className="h-9 border-red-100 bg-white rounded-xl text-xs font-bold text-red-900 shadow-sm">
                  <SelectValue placeholder="Next term" />
                </SelectTrigger>
                <SelectContent>
                  {yearTerms.map((y) => (
                    <SelectItem key={y.id} value={String(y.id)} className="text-xs">
                      {y.academic_year} {y.term}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="lg:col-span-2 space-y-1">
               <div className="bg-background border border-border/40 p-3 rounded-xl shadow-sm">
                  <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-tighter">Campus Status</p>
                  <p className="text-xs font-extrabold text-foreground truncate">{campusName || "No Campus Selected"}</p>
               </div>
            </div>
          </div>

          {/* Forecast Analysis Panels */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* SUBJECTS LIST PANEL */}
            <Card className="lg:col-span-4 rounded-2xl border-indigo-100 shadow-sm overflow-hidden flex flex-col h-[550px]">
              <CardHeader className="p-4 bg-indigo-50/70 border-b border-indigo-100/50">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-indigo-600" />
                  <CardTitle className="text-xs font-bold uppercase tracking-widest text-indigo-900">List of Offered Subjects</CardTitle>
                </div>
              </CardHeader>
              
              <div className="grid grid-cols-[60px_1fr] px-4 py-2.5 bg-indigo-100/20 text-[10px] font-extrabold uppercase tracking-widest text-indigo-800 border-b border-indigo-50">
                <div className="flex items-center gap-1.5"><Filter className="h-3 w-3" /> ID</div>
                <div className="flex items-center gap-1.5"><Search className="h-3 w-3" /> Subject Details</div>
              </div>

              <ScrollArea className="flex-1 bg-white">
                <div className="p-0">
                  {subjects.map((s, idx) => (
                    <div key={idx} className="grid grid-cols-[60px_1fr] px-4 py-3 text-xs border-b border-border/10 hover:bg-indigo-50/30 transition-colors group">
                      <span className="font-bold text-indigo-950/60 tracking-tighter">{s.id || idx + 100}</span>
                      <div className="space-y-0.5">
                        <p className="font-extrabold text-foreground leading-none">{s.course_code}</p>
                        <p className="text-[10px] text-muted-foreground truncate group-hover:text-indigo-900 transition-colors">{s.course_title || "No Title Available"}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              
              <div className="p-3 bg-muted/5 border-t border-indigo-50">
                 <Badge variant="outline" className="bg-white text-indigo-700 border-indigo-100 rounded-lg py-1 px-3 shadow-xs">
                    <span className="text-[10px] font-extrabold uppercase tracking-tighter">Total Subjects: {subjects.length}</span>
                 </Badge>
              </div>
            </Card>

            {/* FORECASTED ENROLLMENT PANEL */}
            <Card className="lg:col-span-8 rounded-2xl border-emerald-100 shadow-sm overflow-hidden flex flex-col h-[550px]">
              <CardHeader className="p-4 bg-emerald-50/70 border-b border-emerald-100/50">
                <div className="flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 text-emerald-600" />
                  <CardTitle className="text-xs font-bold uppercase tracking-widest text-emerald-900">Projected Academic Program Enrollment</CardTitle>
                </div>
              </CardHeader>
              
              <div className="grid grid-cols-[1.5fr_1fr_100px_140px] px-4 py-2.5 bg-emerald-100/20 text-[10px] font-extrabold uppercase tracking-widest text-emerald-800 border-b border-emerald-50">
                <div className="flex items-center gap-1.5"><School className="h-3.5 w-3.5" /> Academic Program</div>
                <div>Major Study</div>
                <div className="text-center">YearLevel</div>
                <div className="text-right pr-4">Expected Enrollee</div>
              </div>

              <ScrollArea className="flex-1 bg-white">
                <div className="p-0 h-full">
                  {FORECAST_ROWS.length === 0 ? (
                    <div className="flex flex-col items-center justify-start pt-16 h-full text-muted-foreground/30 space-y-4 bg-muted/5 pb-12">
                       <div className="bg-white p-6 rounded-full shadow-sm border border-border/20 group hover:border-emerald-200 transition-colors">
                          <ChartBar className="h-14 w-14 text-emerald-600/30 group-hover:text-emerald-600/50 transition-all duration-500" />
                       </div>
                       <div className="text-center">
                         <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/60">No Forecast Data Available</p>
                         <p className="text-[10px] mt-1 font-medium italic text-muted-foreground/40">Adjust filters to generate projection data.</p>
                       </div>
                    </div>
                  ) : (
                    FORECAST_ROWS.map((r, i) => (
                      <div key={i} className="grid grid-cols-[1.5fr_1fr_100px_140px] px-4 py-3 text-xs border-b border-border/10 hover:bg-emerald-50/30 transition-colors">
                        <span className="font-extrabold text-foreground">{r.academic_program}</span>
                        <span className="text-muted-foreground font-medium">{r.major_study}</span>
                        <span className="text-center font-bold text-indigo-950/70">{r.year_level}</span>
                        <div className="text-right pr-4">
                           <Badge className="bg-emerald-100 text-emerald-900 border-emerald-200/50 rounded-lg hover:bg-emerald-200">
                             {r.expected_enrollee}
                           </Badge>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
              
              <div className="p-4 bg-muted/5 border-t border-emerald-50 flex items-center justify-between">
                 <div className="flex items-center gap-3">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-800/60">Aggregate Projection:</span>
                    <Badge variant="outline" className="bg-white text-emerald-700 border-emerald-100 rounded-lg py-1 px-3 shadow-xs">
                       <span className="text-[10px] font-bold">{totalEnrolled} Students</span>
                    </Badge>
                 </div>
                 <Badge variant="secondary" className="bg-emerald-50 text-emerald-600 border-emerald-100/50 rounded-lg py-1 px-3 text-[10px] font-bold uppercase tracking-wider">
                    Next Semester Coverage
                 </Badge>
              </div>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
