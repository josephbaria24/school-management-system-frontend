"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
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
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { 
  Building2, 
  Eraser, 
  Printer, 
  UserRound, 
  Calendar, 
  Clock, 
  MapPin, 
  GraduationCap, 
  Search,
  Filter,
  Users,
  Settings2,
  RefreshCw,
  Layout,
  Table as TableIcon,
  ChevronRight,
  BookOpen
} from "lucide-react";
import { cn } from "@/lib/utils";

const API = process.env.NEXT_PUBLIC_API_URL;
const NONE = "__none__";
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

type Campus = { id: number; acronym: string; campus_name: string | null };
type AcademicYearTerm = { id: number; academic_year: string; term: string };
type Program = { id: number; campus_id: number; program_code: string; program_name: string };
type TreeRecord = {
  campus_id: number;
  building_id: number | null;
  building_name: string | null;
  floor_id: number | null;
};
type RoomRow = {
  id: number;
  floor_id: number;
  room_no: string;
  room_name: string;
};
type RoomCatalog = {
  id: number;
  room_no: string;
  room_name: string;
  floor_id: number;
  campus_id: number;
  building_id: number | null;
  building_name: string;
};
type BuildingCatalog = {
  campus_id: number;
  building_id: number;
  building_name: string;
};
type FacultyRow = {
  id: number;
  is_faculty: boolean;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  suffix: string | null;
  college_code?: string | null;
};

function buildHalfHourLabels(): string[] {
  const out: string[] = [];
  for (let h = 6; h <= 20; h++) {
    for (const m of [0, 30]) {
      if (h === 20 && m === 30) break;
      const hour12 = h > 12 ? h - 12 : h;
      const mm = m === 0 ? "00" : "30";
      out.push(`${hour12}:${mm} ${h < 12 ? "AM" : "PM"}`);
    }
  }
  return out;
}

function facultyName(f: FacultyRow) {
  return `${f.last_name}, ${f.first_name}${f.middle_name ? ` ${f.middle_name}` : ""}${f.suffix ? ` ${f.suffix}` : ""}`;
}

const TIME_ROWS = buildHalfHourLabels();

export function ClassSchedulesRoomFacultyModule() {
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [yearTerms, setYearTerms] = useState<AcademicYearTerm[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [roomsCatalog, setRoomsCatalog] = useState<RoomCatalog[]>([]);
  const [buildingsCatalog, setBuildingsCatalog] = useState<BuildingCatalog[]>([]);
  const [facultyRows, setFacultyRows] = useState<FacultyRow[]>([]);
  const [campusId, setCampusId] = useState("");
  const [ayTermId, setAyTermId] = useState("");
  const [programId, setProgramId] = useState("");
  const [buildingId, setBuildingId] = useState(NONE);
  const [roomId, setRoomId] = useState(NONE);
  const [listTab, setListTab] = useState<"sections" | "year">("sections");
  const [scheduleView, setScheduleView] = useState<"class" | "room" | "faculty">("class");
  const [schedSegment, setSchedSegment] = useState("1");
  const [hideSunday, setHideSunday] = useState(false);
  const [hideSaturday, setHideSaturday] = useState(false);
  const [rowHeight, setRowHeight] = useState(18);
  const [columnWidth, setColumnWidth] = useState(95);
  const [startTime, setStartTime] = useState("6:00 AM");
  const [endTime, setEndTime] = useState("7:00 AM");
  const [selectedCell, setSelectedCell] = useState<{ day: number; row: number }>({ day: 0, row: 1 });

  useEffect(() => {
    const load = async () => {
      if (!API) return;
      try {
        const [cRes, yRes, pRes, treeRes, facultyRes] = await Promise.all([
          fetch(`${API}/api/campuses`),
          fetch(`${API}/api/academic-year-terms`),
          fetch(`${API}/api/academic-programs`),
          fetch(`${API}/api/buildings-rooms/tree`),
          fetch(`${API}/api/employees?hide_inactive=true`),
        ]);

        if (cRes.ok) {
          const c = (await cRes.json()) as Campus[];
          setCampuses(c);
          if (c[0]) setCampusId(String(c[0].id));
        }
        if (yRes.ok) {
          const y = (await yRes.json()) as AcademicYearTerm[];
          setYearTerms(y);
          if (y[0]) setAyTermId(String(y[0].id));
        }
        if (pRes.ok) setPrograms((await pRes.json()) as Program[]);
        if (facultyRes.ok) {
          const employees = (await facultyRes.json()) as FacultyRow[];
          setFacultyRows(employees.filter((e) => e.is_faculty));
        }

        if (treeRes.ok) {
          const tree = (await treeRes.json()) as TreeRecord[];
          const buildingsMap = new Map<number, BuildingCatalog>();
          const floorMeta = new Map<
            number,
            { campus_id: number; building_id: number | null; building_name: string }
          >();
          for (const row of tree) {
            if (row.building_id) {
              buildingsMap.set(row.building_id, {
                campus_id: row.campus_id,
                building_id: row.building_id,
                building_name: row.building_name || "Building",
              });
            }
            if (row.floor_id) {
              floorMeta.set(row.floor_id, {
                campus_id: row.campus_id,
                building_id: row.building_id ?? null,
                building_name: row.building_name || "Building",
              });
            }
          }
          setBuildingsCatalog(Array.from(buildingsMap.values()));
          const floorIds = Array.from(floorMeta.keys());
          const roomsResponses = await Promise.allSettled(
            floorIds.map(async (fid) => {
              const res = await fetch(`${API}/api/buildings-rooms/rooms?floor_id=${fid}`);
              if (!res.ok) return [] as RoomCatalog[];
              const rows = (await res.json()) as RoomRow[];
              const meta = floorMeta.get(fid);
              return rows.map((r) => ({
                id: r.id,
                room_no: r.room_no,
                room_name: r.room_name,
                floor_id: r.floor_id,
                campus_id: meta?.campus_id ?? 0,
                building_id: meta?.building_id ?? null,
                building_name: meta?.building_name || "Building",
              }));
            }),
          );
          const merged: RoomCatalog[] = [];
          for (const res of roomsResponses) {
            if (res.status === "fulfilled") merged.push(...res.value);
          }
          setRoomsCatalog(merged);
        }
      } catch {
        toast({
          title: "Load issue",
          description: "Some scheduling references could not be loaded.",
          variant: "destructive",
        });
      }
    };
    void load();
  }, []);

  const campusIdNum = useMemo(() => parseInt(campusId, 10), [campusId]);
  const filteredPrograms = useMemo(() => {
    if (!Number.isFinite(campusIdNum)) return programs;
    return programs.filter((p) => p.campus_id === campusIdNum);
  }, [programs, campusIdNum]);

  const campusRooms = useMemo(() => {
    if (!Number.isFinite(campusIdNum)) return roomsCatalog;
    return roomsCatalog.filter((r) => r.campus_id === campusIdNum);
  }, [roomsCatalog, campusIdNum]);

  const buildingOptions = useMemo(() => {
    if (!Number.isFinite(campusIdNum)) return [];
    return buildingsCatalog
      .filter((b) => b.campus_id === campusIdNum)
      .map((b) => ({ id: b.building_id, label: b.building_name }));
  }, [buildingsCatalog, campusIdNum]);

  const roomOptions = useMemo(() => {
    const bId = parseInt(buildingId, 10);
    if (!Number.isFinite(bId)) return [];
    return campusRooms.filter((r) => r.building_id === bId);
  }, [buildingId, campusRooms]);

  const selectedRoom = useMemo(
    () => roomOptions.find((r) => String(r.id) === roomId) ?? null,
    [roomOptions, roomId],
  );

  useEffect(() => {
    if (filteredPrograms.length === 0) {
      setProgramId("");
      return;
    }
    if (!programId || !filteredPrograms.some((p) => String(p.id) === programId)) {
      setProgramId(String(filteredPrograms[0].id));
    }
  }, [filteredPrograms, programId]);

  useEffect(() => {
    if (buildingOptions.length === 0) {
      setBuildingId(NONE);
      return;
    }
    if (!buildingOptions.some((b) => String(b.id) === buildingId)) {
      setBuildingId(String(buildingOptions[0].id));
    }
  }, [buildingId, buildingOptions]);

  useEffect(() => {
    if (roomOptions.length === 0) {
      setRoomId(NONE);
      return;
    }
    if (!roomOptions.some((r) => String(r.id) === roomId)) {
      setRoomId(String(roomOptions[0].id));
    }
  }, [roomId, roomOptions]);

  const visibleDays = useMemo(
    () =>
      DAYS.filter((d) => {
        if (hideSunday && d === "Sun") return false;
        if (hideSaturday && d === "Sat") return false;
        return true;
      }),
    [hideSunday, hideSaturday],
  );

  const palette = useMemo(() => {
    if (scheduleView === "room") {
      return {
        tab: "bg-amber-600 shadow-amber-200/50",
        activeTab: "bg-amber-600 text-white shadow-md shadow-amber-200",
        inactiveTab: "bg-amber-50 text-amber-700 hover:bg-amber-100",
        gridTint: "bg-amber-50/30",
        accent: "text-amber-700",
        border: "border-amber-200/60",
        gridHead: "bg-amber-100 text-amber-900 border-amber-200",
        right: "bg-[#fffdf2]/50",
      };
    }
    if (scheduleView === "faculty") {
      return {
        tab: "bg-emerald-600 shadow-emerald-200/50",
        activeTab: "bg-emerald-600 text-white shadow-md shadow-emerald-200",
        inactiveTab: "bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
        gridTint: "bg-emerald-50/30",
        accent: "text-emerald-700",
        border: "border-emerald-200/60",
        gridHead: "bg-emerald-100 text-emerald-900 border-emerald-200",
        right: "bg-[#f9fffb]/50",
      };
    }
    return {
      tab: "bg-indigo-600 shadow-indigo-200/50",
      activeTab: "bg-indigo-600 text-white shadow-md shadow-indigo-200",
      inactiveTab: "bg-indigo-50 text-indigo-700 hover:bg-indigo-100",
      gridTint: "bg-indigo-50/30",
      accent: "text-indigo-700",
      border: "border-indigo-200/60",
      gridHead: "bg-indigo-100 text-indigo-900 border-indigo-200",
      right: "bg-[#fafdff]/50",
    };
  }, [scheduleView]);

  const scheduleTabs = [
    { id: "class" as const, label: "Class Schedule" },
    {
      id: "room" as const,
      label: `Room Schedule${selectedRoom ? ` [${selectedRoom.room_no}]` : ""}`,
    },
    { id: "faculty" as const, label: "Faculty Schedule" },
  ];

  const reportAction = (label: string) =>
    toast({ title: label, description: "This action will be connected to schedule APIs." });

  return (
    <div className="p-6 space-y-6 bg-muted/5 min-h-screen font-geist">
      {/* Module Header */}
      <Card className="rounded-2xl border-border/60 shadow-sm overflow-hidden">
        <CardHeader className="p-0">
          <div className="bg-background p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40">
            <div className="flex items-center gap-4 text-foreground">
              <div className="bg-emerald-600 p-2.5 rounded-xl shadow-sm">
                <Calendar className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold tracking-tight text-emerald-950">Class Scheduling Module</CardTitle>
                <p className="text-muted-foreground text-xs font-medium mt-0.5">
                  Manage schedules for class sections, rooms, and teaching faculty.
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
              <span className="text-foreground font-semibold">Class Scheduling</span>
            </div>

            {/* Quick Filters */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground whitespace-nowrap">SY Term</label>
                <Select value={ayTermId} onValueChange={setAyTermId}>
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
                  <SelectTrigger className="h-9 w-[100px] rounded-xl border-border/60 text-xs shadow-sm bg-background">
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
              <div className="flex items-center gap-2 text-xs">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground whitespace-nowrap">Program</label>
                <Select value={programId} onValueChange={setProgramId}>
                  <SelectTrigger className="h-9 w-[220px] rounded-xl border-border/60 text-xs shadow-sm bg-background">
                    <SelectValue placeholder="Program" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl max-h-[300px]">
                    {filteredPrograms.map((p) => (
                      <SelectItem key={p.id} value={String(p.id)} className="text-xs">
                        {p.program_code} - {p.program_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Navigation & Grid Sidebar */}
        <div className="xl:col-span-4 space-y-6">
          <div className="grid grid-cols-2 gap-4">
             {/* Sections / Year Tabs */}
            <Card className="col-span-2 rounded-2xl border-border/60 shadow-sm overflow-hidden flex flex-col h-[280px]">
              <CardHeader className="p-0 border-b border-border/40 shrink-0">
                <Tabs value={listTab} onValueChange={(v) => setListTab(v as any)} className="w-full">
                  <TabsList className="w-full h-11 bg-muted/20 p-1 rounded-none gap-1">
                    <TabsTrigger value="sections" className="flex-1 rounded-lg text-[10px] font-bold uppercase tracking-wider data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-emerald-700">
                      Class Sections
                    </TabsTrigger>
                    <TabsTrigger value="year" className="flex-1 rounded-lg text-[10px] font-bold uppercase tracking-wider data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-emerald-700">
                      Year Level
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </CardHeader>
              <ScrollArea className="flex-1">
                <CardContent className="p-4 text-xs text-muted-foreground/60 font-medium italic flex flex-col items-center justify-center min-h-[180px]">
                   <Users className="h-8 w-8 mb-2 opacity-10" />
                  {listTab === "sections"
                    ? "Currently no class sections listed."
                    : "Year level listing will appear when connected."}
                </CardContent>
              </ScrollArea>
              <div className="p-3 border-t border-border/40 bg-muted/5 flex items-center justify-between">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Total Items</span>
                <Badge variant="outline" className="bg-white text-[10px] h-5 rounded-md">0</Badge>
              </div>
            </Card>

            {/* Subject List */}
            <Card className="col-span-2 rounded-2xl border-border/60 shadow-sm overflow-hidden flex flex-col h-[240px]">
               <CardHeader className="pb-2 border-b border-border/40 bg-muted/5">
                <div className="flex items-center gap-2">
                  <TableIcon className={cn("h-4 w-4", palette.accent)} />
                  <CardTitle className="text-xs font-bold uppercase tracking-wider">Scheduled Subjects</CardTitle>
                </div>
              </CardHeader>
              <div className={cn("grid grid-cols-[5rem_1fr_4rem] text-[9px] font-bold uppercase tracking-widest py-2 px-3 border-b", palette.gridHead)}>
                <div>Code</div>
                <div className="px-2 border-l border-black/5">Subject Title</div>
                <div className="text-center border-l border-black/5">Units</div>
              </div>
              <ScrollArea className="flex-1">
                <CardContent className="p-4 text-xs text-muted-foreground/50 text-center flex flex-col items-center justify-center min-h-[140px]">
                  <Layout className="h-6 w-6 mb-2 opacity-10" />
                  No subjects scheduled.
                </CardContent>
              </ScrollArea>
            </Card>
          </div>

          {/* Visual Schedule Grid */}
          <Card className="rounded-2xl border-border/60 shadow-sm overflow-hidden flex flex-col h-[400px]">
             <CardHeader className="p-0 border-b border-border/40 shrink-0">
               <div className="p-1 flex items-center gap-1 bg-muted/20">
                  {scheduleTabs.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setScheduleView(t.id)}
                      className={cn(
                        "flex-1 text-[9px] font-bold py-2 px-1 rounded-xl transition-all duration-200",
                        scheduleView === t.id ? palette.activeTab : "bg-transparent text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                      )}
                    >
                      {t.label}
                    </button>
                  ))}
               </div>
              </CardHeader>
              <ScrollArea className="flex-1">
                <div
                    className="grid text-[9px] p-2 min-w-max"
                    style={{ gridTemplateColumns: `64px repeat(${visibleDays.length}, ${columnWidth}px)` }}
                  >
                    <div className="border border-border/20 p-2 font-semibold bg-muted/30 rounded-tl-xl h-9" />
                    {visibleDays.map((d, i) => (
                      <div
                        key={d}
                        className={cn(
                          "border-y border-r border-border/20 p-2 text-center font-bold uppercase tracking-widest flex items-center justify-center h-9",
                          palette.gridHead,
                          i === visibleDays.length - 1 && "rounded-tr-xl"
                        )}
                      >
                        {d}
                      </div>
                    ))}
                    {TIME_ROWS.map((time, rowIdx) => (
                      <Fragment key={rowIdx}>
                        <div className="bg-muted/10 border-x border-b border-border/20 px-2 py-1 flex items-center font-medium h-9 text-[8px]">{time}</div>
                        {visibleDays.map((d, dayIdx) => {
                          const selected = selectedCell.day === dayIdx && selectedCell.row === rowIdx;
                          return (
                            <button
                              key={`${d}-${rowIdx}`}
                              type="button"
                              onClick={() => setSelectedCell({ day: dayIdx, row: rowIdx })}
                              className={cn(
                                "border-r border-b border-border/10 bg-background transition-colors h-9",
                                selected ? cn(palette.tab, "ring-2 ring-inset ring-black/5 shadow-inner") : "hover:bg-muted/30",
                              )}
                              style={{ height: `${rowHeight > 18 ? rowHeight * 1.5 : 36}px` }}
                            />
                          );
                        })}
                      </Fragment>
                    ))}
                  </div>
                  <ScrollBar orientation="horizontal" />
              </ScrollArea>
          </Card>
        </div>

        {/* Main Control Panel */}
        <div className="xl:col-span-8">
           <Card className={cn("rounded-2xl border-border/60 shadow-sm overflow-hidden min-h-[920px] flex flex-col transition-colors duration-500", palette.right)}>
              <CardHeader className="p-0 border-b border-border/40 shrink-0">
                <div className="flex bg-muted/20 p-1.5 gap-1.5">
                   {(["1", "2", "3", "4", "5"] as const).map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setSchedSegment(n)}
                      className={cn(
                        "flex-1 h-10 rounded-xl text-xs font-bold transition-all duration-200 border border-transparent shadow-sm flex items-center justify-center gap-2",
                        schedSegment === n 
                          ? "bg-white text-emerald-700 border-emerald-100 shadow-md scale-[1.02]" 
                          : "bg-transparent text-muted-foreground hover:bg-white/40 hover:text-emerald-600"
                      )}
                    >
                      <Settings2 className="h-3.5 w-3.5 opacity-50" />
                      Segment {n}
                    </button>
                  ))}
                </div>
              </CardHeader>

              <CardContent className="p-6 space-y-8 flex-1">
                {/* Time & Days Group */}
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_20rem] gap-8">
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                       <div className="space-y-2">
                        <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">
                          <Clock className="h-3 w-3" /> Start Time
                        </label>
                        <Input 
                          className="h-10 rounded-xl border-border/60 text-sm shadow-sm bg-background focus-visible:ring-emerald-500" 
                          value={startTime} 
                          onChange={(e) => setStartTime(e.target.value)} 
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">
                           <Clock className="h-3 w-3" /> End Time
                        </label>
                        <Input 
                          className="h-10 rounded-xl border-border/60 text-sm shadow-sm bg-background focus-visible:ring-emerald-500" 
                          value={endTime} 
                          onChange={(e) => setEndTime(e.target.value)} 
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                       <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1 block">Scheduled Days</label>
                       <div className="bg-background border border-border/40 p-4 rounded-xl flex flex-wrap gap-4 shadow-inner">
                         {DAYS.map((d) => (
                          <label key={d} className="flex items-center gap-2 cursor-pointer group">
                             <div className="relative flex items-center">
                              <Checkbox 
                                className="h-5 w-5 rounded-md border-border/30 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-transparent" 
                              />
                            </div>
                            <span className="text-xs font-semibold text-muted-foreground group-hover:text-foreground transition-colors">{d}</span>
                          </label>
                        ))}
                       </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">
                         <MapPin className="h-3 w-3" /> Building
                      </label>
                      <Select value={buildingId} onValueChange={setBuildingId}>
                        <SelectTrigger className="h-10 rounded-xl border-border/60 text-sm shadow-sm bg-background">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                          <SelectItem value={NONE} className="text-sm italic">Select building</SelectItem>
                          {buildingOptions.map((b) => (
                            <SelectItem key={b.id} value={String(b.id)} className="text-sm">
                              {b.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">
                         <Layout className="h-3 w-3" /> Room Selection
                      </label>
                      <Select value={roomId} onValueChange={setRoomId}>
                        <SelectTrigger className="h-10 rounded-xl border-border/60 text-sm shadow-sm bg-background">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                          <SelectItem value={NONE} className="text-sm italic">Select room</SelectItem>
                          {roomOptions.map((r) => (
                            <SelectItem key={r.id} value={String(r.id)} className="text-sm">
                              {r.room_no} — {r.room_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1 block">Instructional Event</label>
                    <Select defaultValue="lecture">
                      <SelectTrigger className="h-10 rounded-xl border-border/60 text-sm shadow-sm bg-background">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="lecture" className="text-sm">Lecture Only</SelectItem>
                        <SelectItem value="laboratory" className="text-sm">Laboratory Only</SelectItem>
                        <SelectItem value="mixed" className="text-sm">Mixed (Lec/Lab)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">
                       <UserRound className="h-3 w-3" /> Assigned Faculty
                    </label>
                    <div className="flex gap-2">
                      <Select>
                        <SelectTrigger className="h-10 rounded-xl border-border/60 text-sm shadow-sm bg-background flex-1">
                          <SelectValue placeholder="Select faculty" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl max-h-[400px]">
                          <SelectItem value={NONE} className="text-sm italic">Select faculty</SelectItem>
                          {facultyRows.slice(0, 50).map((f) => (
                            <SelectItem key={f.id} value={String(f.id)} className="text-sm">
                              {facultyName(f)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button type="button" variant="outline" size="icon" className="h-10 w-10 shrink-0 rounded-xl border-border/60 hover:bg-emerald-50 hover:border-emerald-200 group">
                        <Eraser className="h-4 w-4 text-muted-foreground group-hover:text-emerald-600" />
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-6 bg-muted/10 p-4 rounded-2xl border border-border/20 border-dashed">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <Checkbox className="h-4 w-4 rounded border-border/40 data-[state=checked]:bg-red-500 data-[state=checked]:border-transparent" />
                    <span className="text-xs font-bold text-red-600 uppercase tracking-wider group-hover:text-red-700 transition-colors">Special Class Engagement</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <Checkbox className="h-4 w-4 rounded border-border/40 data-[state=checked]:bg-emerald-600 data-[state=checked]:border-transparent" />
                    <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider group-hover:text-emerald-900 transition-colors">Over-ride Scheduling Conflict</span>
                  </label>
                </div>

                <Separator className="bg-border/40" />

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                   {/* Summary Area */}
                   <div className="space-y-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Layout className="h-4 w-4 text-emerald-600" />
                         <span className="text-xs font-bold uppercase tracking-widest text-foreground">Section Summary</span>
                      </div>
                      <Card className="rounded-2xl border-indigo-100 shadow-none bg-indigo-50/30 overflow-hidden">
                        <CardContent className="p-4 grid grid-cols-3 gap-4">
                          <div className="text-center space-y-1">
                            <span className="text-[9px] font-bold text-indigo-700 uppercase tracking-wider">Subjects</span>
                            <p className="text-lg font-bold text-indigo-900 tracking-tight">0</p>
                          </div>
                          <div className="text-center space-y-1 border-x border-indigo-100">
                            <span className="text-[9px] font-bold text-indigo-700 uppercase tracking-wider">Units</span>
                            <p className="text-lg font-bold text-indigo-900 tracking-tight">0.00</p>
                          </div>
                          <div className="text-center space-y-1">
                            <span className="text-[9px] font-bold text-indigo-700 uppercase tracking-wider">Total Hr/Wk</span>
                            <p className="text-lg font-bold text-indigo-900 tracking-tight">0</p>
                          </div>
                        </CardContent>
                      </Card>
                   </div>

                   {/* Grid Settings Area */}
                   <div className="space-y-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Settings2 className="h-4 w-4 text-emerald-600" />
                         <span className="text-xs font-bold uppercase tracking-widest text-foreground">Grid View Controls</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                         <div className="space-y-1.5">
                            <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Row Density</label>
                            <Input
                              type="number"
                              className="h-9 rounded-xl border-border/40 text-xs shadow-sm bg-background"
                              value={rowHeight}
                              onChange={(e) => setRowHeight(Math.max(14, Number(e.target.value) || 18))}
                            />
                         </div>
                         <div className="space-y-1.5">
                            <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Column Width</label>
                            <Input
                               type="number"
                              className="h-9 rounded-xl border-border/40 text-xs shadow-sm bg-background"
                              value={columnWidth}
                              onChange={(e) => setColumnWidth(Math.max(70, Number(e.target.value) || 95))}
                            />
                         </div>
                      </div>
                   </div>
                </div>

                {/* Print & Reports Footer */}
                <div className="bg-muted/10 p-4 rounded-2xl border border-border/40 flex flex-wrap items-center justify-between gap-4">
                   <div className="flex items-center gap-3">
                      <Select defaultValue="1">
                        <SelectTrigger className="h-9 w-[160px] rounded-xl text-xs bg-background shadow-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                          <SelectItem value="1" className="text-xs">Standard Format</SelectItem>
                          <SelectItem value="2" className="text-xs">Compact Format</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button className="h-9 rounded-xl px-4 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 shadow-sm" onClick={() => reportAction("Print Class Schedule Grid")}>
                        <Printer className="h-3 w-3 mr-2 text-indigo-100" /> Print Schedule Grid
                      </Button>
                   </div>

                   <div className="flex items-center gap-2">
                      <Button variant="outline" className="h-9 rounded-xl px-4 text-xs font-bold shadow-sm border-border/60 hover:bg-white" onClick={() => reportAction("List of Post Class Schedules")}>
                        History Log
                      </Button>
                      <Button variant="secondary" className="h-9 rounded-xl px-4 text-xs font-bold shadow-sm bg-muted/60" onClick={() => reportAction("Report Signatory")}>
                        Signatories
                      </Button>
                   </div>
                </div>
              </CardContent>
              
              <div className="p-4 bg-background border-t border-border/40 flex items-center justify-between">
                 <div className="flex items-center gap-4">
                    <Button variant="ghost" className="h-9 rounded-xl text-xs font-bold text-muted-foreground hover:text-emerald-600">
                      <RefreshCw className="h-3.5 w-3.5 mr-2" /> Reset Form
                    </Button>
                    <Separator orientation="vertical" className="h-6" />
                    <Button variant="ghost" className="h-9 rounded-xl text-xs font-bold text-muted-foreground hover:text-red-600">
                       Cancel Arrangement
                    </Button>
                 </div>
                 <Button className="h-10 rounded-xl px-8 text-sm font-bold bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-200/50">
                    Commit Selection
                 </Button>
              </div>
           </Card>
        </div>
      </div>
    </div>
  );
}
