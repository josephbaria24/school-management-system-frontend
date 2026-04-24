"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { 
  Eye, 
  X, 
  FileText, 
  Search, 
  Filter, 
  ChevronRight, 
  BookOpen, 
  Printer, 
  Settings2,
  Calendar,
  MapPin,
  ClipboardList,
  SearchCode
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

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

const REPORT_TITLES = [
  "Faculty Work Load Report",
  "Inventory of Academic Program Curriculums",
  "Inventory of Curriculum By Students",
  "Inventory of Enrolled Students by Descriptive Title",
  "Inventory of Faculty Academic Schedule",
  "Inventory of Oversized Class List",
  "List of Class Schedule by College",
  "List of Class Schedule by Program",
  "List of Class Schedules",
  "List of Faculty Load Sheet",
  "List of Offered Course",
  "List of Officially Enrolled by Course",
  "List of Room Schedules",
];

/**
 * Modernized List of Reports Module
 * Features a searchable sidebar and standardized parameter controls.
 */
export function ListOfReportsModule() {
  const [yearTerms, setYearTerms] = useState<AcademicYearTerm[]>([]);
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [selectedReport, setSelectedReport] = useState(REPORT_TITLES[0]);
  const [yearTermId, setYearTermId] = useState("");
  const [campusId, setCampusId] = useState("");
  const [allGroups, setAllGroups] = useState(true);
  const [byCollege, setByCollege] = useState(false);
  const [byProgram, setByProgram] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const load = async () => {
      if (!API) return;
      try {
        const [ytRes, campusRes] = await Promise.all([
          fetch(`${API}/api/academic-year-terms`),
          fetch(`${API}/api/campuses`),
        ]);
        if (ytRes.ok) {
          const rows = (await ytRes.json()) as AcademicYearTerm[];
          setYearTerms(rows);
          if (rows[0]) setYearTermId(String(rows[0].id));
        }
        if (campusRes.ok) {
          const rows = (await campusRes.json()) as Campus[];
          setCampuses(rows);
          if (rows[0]) setCampusId(String(rows[0].id));
        }
      } catch (err) {
        console.error("Failed to load reports data", err);
      }
    };
    void load();
  }, []);

  const filteredReports = useMemo(() => {
    return REPORT_TITLES.filter(title => 
      title.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm]);

  const campusName = useMemo(() => {
    const campus = campuses.find((c) => String(c.id) === campusId);
    return campus?.campus_name || campus?.acronym || "";
  }, [campuses, campusId]);

  return (
    <div className="p-6 space-y-6 bg-muted/5 min-h-screen font-geist">
      {/* Module Header */}
      <Card className="rounded-2xl border-border/60 shadow-sm overflow-hidden">
        <CardHeader className="p-0">
          <div className="bg-background p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40">
            <div className="flex items-center gap-4 text-foreground">
              <div className="bg-emerald-600 p-2.5 rounded-xl shadow-sm">
                <ClipboardList className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold tracking-tight text-emerald-950">Institutional Reports</CardTitle>
                <p className="text-muted-foreground text-xs font-medium mt-0.5">
                  Generate and export comprehensive reports for colleges, institutes, and departments.
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
               <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-emerald-100 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                System Status: Ready
              </Badge>
            </div>
          </div>
          
          <div className="bg-background px-6 py-4 border-b border-border/40 flex items-center justify-between flex-wrap gap-6 text-xs text-muted-foreground font-medium">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-emerald-600" />
              <span>Colleges</span>
              <ChevronRight className="h-3.5 w-3.5" />
              <span className="text-foreground font-semibold">List of Reports</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 font-bold text-indigo-600 tracking-tight">
                <FileText className="h-3.5 w-3.5" /> Active Select: {selectedReport}
              </span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="grid grid-cols-12 min-h-[600px]">
            {/* SEARCHABLE SIDEBAR */}
            <div className="col-span-12 md:col-span-4 border-r border-border/40 bg-muted/10 flex flex-col">
              <div className="p-4 border-b border-border/40 bg-background/50 backdrop-blur-sm sticky top-0 z-10 space-y-3">
                <div className="flex items-center justify-between">
                   <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Select Report Type</p>
                   <Badge variant="outline" className="text-[9px] font-extrabold bg-white border-border/60">{filteredReports.length} Items</Badge>
                </div>
                <div className="relative group">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground group-focus-within:text-indigo-600 transition-colors" />
                  <Input 
                    placeholder="Search reports..." 
                    className="h-9 pl-9 text-xs bg-white border-border/40 rounded-xl shadow-sm focus-visible:ring-indigo-500/20"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              <ScrollArea className="flex-1 bg-white/40">
                <div className="p-2 space-y-1">
                  {filteredReports.map((title) => (
                    <button
                      key={title}
                      type="button"
                      onClick={() => setSelectedReport(title)}
                      className={cn(
                        "w-full text-left px-4 py-3 text-xs rounded-xl transition-all duration-200 group flex items-start gap-3",
                        selectedReport === title 
                          ? "bg-indigo-600 text-white shadow-md shadow-indigo-200" 
                          : "hover:bg-indigo-50 text-foreground/80 hover:text-indigo-900"
                      )}
                    >
                      <div className={cn(
                        "mt-0.5 p-1 rounded-md transition-colors",
                        selectedReport === title ? "bg-indigo-500 text-white" : "bg-indigo-50 text-indigo-600 group-hover:bg-indigo-100"
                      )}>
                        <FileText className="h-3 w-3" />
                      </div>
                      <span className="font-semibold leading-relaxed">{title}</span>
                    </button>
                  ))}
                  {filteredReports.length === 0 && (
                    <div className="p-12 text-center space-y-2 opacity-50">
                       <SearchCode className="h-8 w-8 mx-auto text-muted-foreground" />
                       <p className="text-[11px] font-medium">No reports found matching your search</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
              
              <div className="p-4 border-t border-border/40 bg-muted/20">
                 <div className="bg-white p-3 rounded-xl border border-border/40 shadow-sm flex items-center gap-3">
                    <div className="bg-emerald-50 p-2 rounded-lg">
                       <Printer className="h-4 w-4 text-emerald-600" />
                    </div>
                    <div>
                       <p className="text-[10px] font-bold uppercase tracking-tighter text-muted-foreground">Queue Status</p>
                       <p className="text-xs font-extrabold text-emerald-950">System Print Ready</p>
                    </div>
                 </div>
              </div>
            </div>

            {/* PARAMETERS PANEL */}
            <div className="col-span-12 md:col-span-8 bg-background flex flex-col">
              <div className="p-6 bg-muted/10 border-b border-border/40 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Settings2 className="h-5 w-5 text-indigo-600" />
                  <div>
                    <h3 className="text-sm font-bold text-foreground">Report Parameters</h3>
                    <p className="text-[11px] text-muted-foreground">Configure filters for the selected report</p>
                  </div>
                </div>
              </div>

              <div className="flex-1 p-8 space-y-8 overflow-auto">
                {/* Routing Controls */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 mb-1">
                      <Calendar className="h-3.5 w-3.5 text-indigo-600" />
                      <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Academic Year & Term</Label>
                    </div>
                    <Select value={yearTermId} onValueChange={setYearTermId}>
                      <SelectTrigger className="h-10 border-border/40 bg-white rounded-xl text-xs font-semibold shadow-sm focus:ring-indigo-500/20">
                        <SelectValue placeholder="Select term" />
                      </SelectTrigger>
                      <SelectContent>
                        {yearTerms.map((y) => (
                          <SelectItem key={y.id} value={String(y.id)} className="text-xs">
                            {y.academic_year} - {y.term}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 mb-1">
                      <MapPin className="h-3.5 w-3.5 text-emerald-600" />
                      <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Target Campus</Label>
                    </div>
                    <Select value={campusId} onValueChange={setCampusId}>
                      <SelectTrigger className="h-10 border-border/40 bg-white rounded-xl text-xs font-semibold shadow-sm focus:ring-indigo-500/20">
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
                </div>

                <Separator className="bg-border/40" />

                {/* Scope Selection */}
                <div className="space-y-6 bg-muted/20 p-6 rounded-2xl border border-border/40">
                  <div className="flex items-center justify-between">
                     <div className="flex items-center gap-2">
                        <Checkbox 
                          id="allGroups"
                          checked={allGroups} 
                          onCheckedChange={(v) => setAllGroups(Boolean(v))}
                          className="rounded-md border-indigo-200 data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600"
                        />
                        <Label htmlFor="allGroups" className="text-xs font-bold text-indigo-900 cursor-pointer">Include All Colleges & Programs</Label>
                     </div>
                     <Badge variant="outline" className={cn("text-[9px] font-extrabold px-3 py-0.5", allGroups ? "bg-indigo-50 text-indigo-700 border-indigo-100" : "bg-muted text-muted-foreground")}>
                       {allGroups ? "GLOBAL SCOPE" : "FILTERED"}
                     </Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 opacity-100 transition-opacity">
                    <div className="space-y-2">
                       <div className="flex items-center gap-2">
                          <Checkbox 
                            id="byCollege"
                            checked={byCollege} 
                            onCheckedChange={(v) => setByCollege(Boolean(v))}
                            className="rounded-md border-border/60"
                          />
                          <Label htmlFor="byCollege" className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Filter by College</Label>
                       </div>
                       <div className="relative flex items-center gap-2">
                          <Input className="h-9 text-xs bg-white border-border/40 rounded-xl shadow-sm" disabled={!byCollege} placeholder="Search College..." />
                          <Button variant="outline" size="icon" className="h-9 w-9 rounded-xl shrink-0 border-border/40 hover:bg-indigo-50" disabled={!byCollege}>
                             <Search className="h-3.5 w-3.5 text-indigo-600" />
                          </Button>
                       </div>
                    </div>

                    <div className="space-y-2">
                       <div className="flex items-center gap-2">
                          <Checkbox 
                            id="byProgram"
                            checked={byProgram} 
                            onCheckedChange={(v) => setByProgram(Boolean(v))}
                            className="rounded-md border-border/60"
                          />
                          <Label htmlFor="byProgram" className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Filter by Program</Label>
                       </div>
                       <div className="relative flex items-center gap-2">
                          <Input className="h-9 text-xs bg-white border-border/40 rounded-xl shadow-sm" disabled={!byProgram} placeholder="Search Program..." />
                          <Button variant="outline" size="icon" className="h-9 w-9 rounded-xl shrink-0 border-border/40 hover:bg-indigo-50" disabled={!byProgram}>
                             <Search className="h-3.5 w-3.5 text-indigo-600" />
                          </Button>
                       </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Specific Subject Code</Label>
                    <Select defaultValue={NONE}>
                      <SelectTrigger className="h-10 border-border/40 bg-white rounded-xl text-xs font-semibold shadow-sm">
                        <SelectValue placeholder="All Subjects" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NONE} className="text-xs">All Course Codes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Assigned Faculty Name</Label>
                    <div className="flex items-center gap-2">
                       <Input className="h-10 text-xs bg-muted/30 border-border/40 rounded-xl font-medium" value="[All Faculty Available]" readOnly />
                       <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl shrink-0 border-border/40 hover:bg-emerald-50">
                          <Search className="h-4 w-4 text-emerald-600" />
                       </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Bar */}
              <div className="p-6 border-t border-border/40 bg-muted/10 backdrop-blur-sm flex flex-col sm:flex-row items-center justify-between gap-4">
                <Button
                  type="button"
                  className="h-10 rounded-xl px-6 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all active:scale-95 text-white w-full sm:w-auto"
                  onClick={() => toast({ title: "Report Queued", description: `"${selectedReport}" has been added to generator.` })}
                >
                  <ClipboardList className="h-4 w-4 mr-2" />
                  ADD TO REPORT QUEUE
                </Button>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <Button
                    type="button"
                    className="h-10 rounded-xl px-6 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition-all active:scale-95 text-white flex-1 sm:flex-initial"
                    onClick={() => toast({ title: "Preview Generated", description: `Rendering "${selectedReport}"...` })}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    PREVIEW REPORT
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-10 rounded-xl px-6 text-xs font-bold border-border/60 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all active:scale-95 flex-1 sm:flex-initial"
                    onClick={() => toast({ title: "Action Cancelled", description: "Parameters reset." })}
                  >
                    <X className="h-4 w-4 mr-2" />
                    CANCEL
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
