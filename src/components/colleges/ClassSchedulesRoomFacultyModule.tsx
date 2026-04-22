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
import { toast } from "@/hooks/use-toast";
import { Building2, Eraser, Printer, UserRound } from "lucide-react";
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
        tab: "from-[#f7e8ad] to-[#ebcf7c] text-[#59430e]",
        activeTab: "bg-[#e0b94f] text-[#3c2d05]",
        right: "from-[#fff5cd] to-[#f3e195]",
        gridHead: "from-[#f7e8ad] to-[#ebcf7c] text-[#4f3e10]",
      };
    }
    if (scheduleView === "faculty") {
      return {
        tab: "from-[#ddeecf] to-[#c6dfb1] text-[#26432d]",
        activeTab: "bg-[#98bd75] text-[#17311f]",
        right: "from-[#eef8e5] to-[#d8ebc8]",
        gridHead: "from-[#ddeecf] to-[#c6dfb1] text-[#26432d]",
      };
    }
    return {
      tab: "from-[#d7e0ff] to-[#b8c7ff] text-[#1b285f]",
      activeTab: "bg-[#4f70db] text-white",
      right: "from-[#e6eeff] to-[#c8d8ff]",
      gridHead: "from-[#d7e0ff] to-[#b8c7ff] text-[#1b285f]",
    };
  }, [scheduleView]);

  const scheduleTabs = [
    { id: "class" as const, label: "Class Schedule" },
    {
      id: "room" as const,
      label: `Room Schedule${selectedRoom ? ` [${selectedRoom.building_name} - ${selectedRoom.room_no}]` : ""}`,
    },
    { id: "faculty" as const, label: "Faculty Schedule" },
  ];

  const reportAction = (label: string) =>
    toast({ title: label, description: "This action will be connected to schedule APIs." });

  return (
    <div className="h-full bg-[#f2fbf7] p-1">
      <div className="w-full border border-[#79b898] bg-white min-h-[640px] flex flex-col">
        <div className="bg-gradient-to-b from-[#def8ea] to-[#9fdbbc] border-b border-[#79b898] px-3 py-2 shrink-0">
          <h1 className="text-[20px] font-bold uppercase tracking-tight text-[#1f5e45]">Class Scheduling Module</h1>
          <p className="text-[11px] text-[#35684f] max-w-4xl">
            Use this module to create, modify and manage the schedules for class sections, rooms and faculty.
          </p>
        </div>

        <div className="flex-1 p-2 min-h-0">
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-2 h-full min-h-[560px]">
            <div className="xl:col-span-4 flex flex-col gap-2 min-h-0">
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <Label className="text-[11px] font-semibold text-[#1f5e45]">AY. Term</Label>
                  <Select value={ayTermId} onValueChange={setAyTermId}>
                    <SelectTrigger className="h-8 text-[11px] bg-white">
                      <SelectValue placeholder="Select term" />
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
                  <Label className="text-[11px] font-semibold text-[#1f5e45]">Campus</Label>
                  <Select value={campusId} onValueChange={setCampusId}>
                    <SelectTrigger className="h-8 text-[11px] bg-white">
                      <SelectValue placeholder="Campus" />
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
                  <Label className="text-[11px] font-semibold text-[#1f5e45]">Program</Label>
                  <Select value={programId} onValueChange={setProgramId}>
                    <SelectTrigger className="h-8 text-[11px] bg-white">
                      <SelectValue placeholder="Program" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredPrograms.map((p) => (
                        <SelectItem key={p.id} value={String(p.id)}>
                          {p.program_code} - {p.program_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-12 gap-2 min-h-[150px]">
                <div className="col-span-12 lg:col-span-5 border border-[#79b898] bg-white flex flex-col min-h-[150px]">
                  <div className="flex border-b border-[#9ed9c1]">
                    <button
                      type="button"
                      onClick={() => setListTab("sections")}
                      className={cn(
                        "flex-1 text-[10px] font-bold py-1 px-1 uppercase",
                        listTab === "sections" ? "bg-[#2f9b68] text-white" : "bg-[#c8ead9] text-[#1f5e45]",
                      )}
                    >
                      Class Sections
                    </button>
                    <button
                      type="button"
                      onClick={() => setListTab("year")}
                      className={cn(
                        "flex-1 text-[10px] font-bold py-1 px-1 uppercase border-l border-[#79b898]",
                        listTab === "year" ? "bg-[#2f9b68] text-white" : "bg-[#c8ead9] text-[#1f5e45]",
                      )}
                    >
                      Year Level
                    </button>
                  </div>
                  <div className="flex-1 p-2 text-[11px] text-muted-foreground">
                    {listTab === "sections"
                      ? "There are no item to show in this view."
                      : "Year level listing will appear when schedule data is connected."}
                  </div>
                </div>
                <div className="col-span-12 lg:col-span-7 border border-[#79b898] bg-white flex flex-col min-h-[150px]">
                  <div
                    className={cn(
                      "grid grid-cols-12 text-[10px] font-bold px-1 py-0.5 border-b border-[#c9ab56] bg-gradient-to-b",
                      palette.tab,
                    )}
                  >
                    <div className="col-span-2 border-r border-white/40 px-1">CODE</div>
                    <div className="col-span-8 border-r border-white/40 px-1">SUBJECT TITLE</div>
                    <div className="col-span-2 text-center">UNITS</div>
                  </div>
                  <div className="flex-1 p-2 text-[11px] text-muted-foreground">There are no item to show in this view.</div>
                </div>
              </div>

              <div className="border border-[#79b898] bg-white flex flex-col shrink-0 h-[360px]">
                <div className="flex border-b border-[#9ed9c1] shrink-0">
                  {scheduleTabs.map((t, i) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setScheduleView(t.id)}
                      className={cn(
                        "flex-1 text-[10px] font-bold py-1.5 px-1",
                        scheduleView === t.id ? palette.activeTab : "bg-[#eef3ff] text-[#28447d]",
                        i > 0 && "border-l border-[#79b898]",
                      )}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
                <div className="flex-1 overflow-auto min-h-0 p-1">
                  <div
                    className="grid text-[9px] min-w-[540px]"
                    style={{ gridTemplateColumns: `72px repeat(${visibleDays.length}, ${columnWidth}px)` }}
                  >
                    <div className={cn("border p-0.5 font-semibold", "bg-[#f8fdf9] border-[#c5e3d4]")} />
                    {visibleDays.map((d) => (
                      <div
                        key={d}
                        className={cn(
                          "border p-0.5 text-center font-bold bg-gradient-to-b border-[#c5e3d4]",
                          palette.gridHead,
                        )}
                      >
                        {d}
                      </div>
                    ))}
                    {TIME_ROWS.map((time, rowIdx) => (
                      <Fragment key={rowIdx}>
                        <div className="bg-white border border-[#d4e8dc] px-0.5 py-0 whitespace-nowrap">{time}</div>
                        {visibleDays.map((d, dayIdx) => {
                          const selected = selectedCell.day === dayIdx && selectedCell.row === rowIdx;
                          return (
                            <button
                              key={`${d}-${rowIdx}`}
                              type="button"
                              aria-label={`${d} ${time}`}
                              onClick={() => setSelectedCell({ day: dayIdx, row: rowIdx })}
                              className={cn(
                                "border border-[#d9e1ef] bg-white hover:bg-[#eef6ff]",
                                selected && "bg-[#007bd6] hover:bg-[#007bd6]",
                              )}
                              style={{ height: `${rowHeight}px` }}
                            />
                          );
                        })}
                      </Fragment>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div
              className={cn(
                "xl:col-span-8 border border-[#79b898] bg-gradient-to-b flex flex-col min-h-0 overflow-hidden",
                palette.right,
              )}
            >
              <div className="flex w-full h-7 shrink-0 border-b border-[#79b898] bg-[#c8ead9]">
                {(["1", "2", "3", "4", "5"] as const).map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setSchedSegment(n)}
                    className={cn(
                      "flex-1 text-[9px] font-bold border-r border-[#79b898] last:border-r-0",
                      schedSegment === n ? "bg-[#2f9b68] text-white" : "text-[#1f5e45] hover:bg-[#b8e6cc]",
                    )}
                  >
                    Sched.{n}
                  </button>
                ))}
              </div>

              <div className="p-1.5 border-b border-[#b8d6c5] space-y-1">
                <div className="flex flex-wrap gap-x-2 gap-y-1 items-center">
                  {DAYS.map((d) => (
                    <label key={d} className="flex items-center gap-1 text-[9px]">
                      <Checkbox className="h-3.5 w-3.5" />
                      {d}
                    </label>
                  ))}
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-1.5">
                  <div className="space-y-1">
                    <Label className="text-[9px]">Start Time</Label>
                    <Input className="h-6 text-[10px] bg-white" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[9px]">End Time</Label>
                    <Input className="h-6 text-[10px] bg-white" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[9px]">Building</Label>
                    <Select value={buildingId} onValueChange={setBuildingId}>
                      <SelectTrigger className="h-6 text-[10px] bg-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NONE}>Select building</SelectItem>
                        {buildingOptions.map((b) => (
                          <SelectItem key={b.id} value={String(b.id)}>
                            {b.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[9px]">Room</Label>
                    <Select value={roomId} onValueChange={setRoomId}>
                      <SelectTrigger className="h-6 text-[10px] bg-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NONE}>Select room</SelectItem>
                        {roomOptions.map((r) => (
                          <SelectItem key={r.id} value={String(r.id)}>
                            {r.room_no} - {r.room_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-1.5 items-end">
                  <div className="space-y-1">
                    <Label className="text-[9px]">Event</Label>
                    <Select defaultValue="lecture">
                      <SelectTrigger className="h-6 text-[10px] bg-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="lecture">Lecture Only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[9px]">Faculty</Label>
                    <div className="flex gap-1">
                      <Select>
                        <SelectTrigger className="h-6 text-[10px] bg-white flex-1">
                          <SelectValue placeholder="Select faculty" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={NONE}>Select faculty</SelectItem>
                          {facultyRows.slice(0, 50).map((f) => (
                            <SelectItem key={f.id} value={String(f.id)}>
                              {facultyName(f)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button type="button" variant="outline" size="icon" className="h-6 w-6 shrink-0">
                        <UserRound className="h-3.5 w-3.5" />
                      </Button>
                      <Button type="button" variant="outline" size="icon" className="h-6 w-6 shrink-0">
                        <Eraser className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                  <label className="flex items-center gap-1 text-[9px]">
                    <Checkbox className="h-3.5 w-3.5" />
                    <span className="text-red-600 font-medium">Special Class</span>
                  </label>
                  <label className="flex items-center gap-1 text-[9px]">
                    <Checkbox className="h-3.5 w-3.5" />
                    Over-ride Conflict
                  </label>
                </div>
              </div>

              <div className="flex-1 min-h-0 overflow-auto p-1.5">
                {scheduleView === "class" && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-end gap-2">
                      <Button type="button" variant="outline" className="h-6 text-[9px]" onClick={() => reportAction("List of Post Class Schedules")}>
                        List of Post Class Schedules
                      </Button>
                      <Button type="button" variant="outline" className="h-6 text-[9px]" onClick={() => reportAction("Report Signatory")}>
                        Report Signatory
                      </Button>
                    </div>
                    <div className="border border-[#87a6e6] bg-[#dbe6ff] p-1.5 text-[10px]">
                      <div className="font-bold text-[#193271] mb-0.5">Class Section Summary</div>
                      <div>No. of Subjects: 0</div>
                      <div>Total Units: 0</div>
                      <div>Total No. of Hrs/Wk: 0</div>
                    </div>
                    <div className="border border-[#87a6e6] bg-[#dbe6ff] p-1.5 text-[10px] space-y-1.5">
                      <div className="font-bold text-[#193271]">Hide Columns and Rows</div>
                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-1">
                          <Checkbox checked={hideSunday} onCheckedChange={(v) => setHideSunday(Boolean(v))} />
                          Hide Sunday Column
                        </label>
                        <label className="flex items-center gap-1">
                          <Checkbox checked={hideSaturday} onCheckedChange={(v) => setHideSaturday(Boolean(v))} />
                          Hide Saturday Column
                        </label>
                      </div>
                      <div className="grid grid-cols-2 gap-1.5 max-w-[330px]">
                        <div>
                          <Label className="text-[9px]">Start</Label>
                          <Input className="h-6 text-[10px] bg-white" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
                        </div>
                        <div>
                          <Label className="text-[9px]">End</Label>
                          <Input className="h-6 text-[10px] bg-white" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
                        </div>
                      </div>
                      <Button type="button" variant="outline" className="h-6 text-[9px]" onClick={() => reportAction("Hide Time Range")}>
                        Hide Time Range
                      </Button>
                    </div>
                    <div className="border border-[#87a6e6] bg-[#dbe6ff] p-1.5 text-[10px]">
                      <div className="font-bold text-[#193271] mb-0.5">Adjust Row Height and Column Width</div>
                      <div className="grid grid-cols-2 gap-1.5 max-w-[290px]">
                        <div>
                          <Label className="text-[9px]">Row Height</Label>
                          <Input
                            className="h-6 text-[10px] bg-white"
                            value={String(rowHeight)}
                            onChange={(e) => setRowHeight(Math.max(14, Number(e.target.value) || 18))}
                          />
                        </div>
                        <div>
                          <Label className="text-[9px]">Column Width</Label>
                          <Input
                            className="h-6 text-[10px] bg-white"
                            value={String(columnWidth)}
                            onChange={(e) => setColumnWidth(Math.max(70, Number(e.target.value) || 95))}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Select defaultValue="1">
                        <SelectTrigger className="h-6 w-[100px] text-[9px] bg-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">Format - 1</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button type="button" variant="outline" className="h-6 text-[9px] gap-1" onClick={() => reportAction("Print Class Schedule Grid")}>
                        <Printer className="h-3 w-3" />
                        Print Class Schedule Grid
                      </Button>
                    </div>
                  </div>
                )}

                {scheduleView === "room" && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-end">
                      <Button type="button" variant="outline" className="h-6 text-[9px]" onClick={() => reportAction("Report Signatory")}>
                        Report Signatory
                      </Button>
                    </div>
                    <div className="border border-[#d2b86a] bg-[#fff3c9] p-1.5">
                      <div className="flex items-center gap-2 mb-1.5">
                        <Building2 className="h-4 w-4 text-[#7a611f]" />
                        <Label className="text-[10px] font-bold">Building</Label>
                        <Select value={buildingId} onValueChange={setBuildingId}>
                          <SelectTrigger className="h-6 text-[9px] bg-white w-[200px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={NONE}>Select building</SelectItem>
                            {buildingOptions.map((b) => (
                              <SelectItem key={b.id} value={String(b.id)}>
                                {b.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="border border-[#d2b86a] bg-white overflow-auto max-h-[160px]">
                        <table className="w-full text-[10px]">
                          <thead className="bg-[#f3e3ab]">
                            <tr>
                              <th className="text-left px-2 py-1 border-r">ROOM NO</th>
                              <th className="text-left px-2 py-1">ROOM NAME</th>
                            </tr>
                          </thead>
                          <tbody>
                            {roomOptions.map((r) => (
                              <tr
                                key={r.id}
                                onClick={() => setRoomId(String(r.id))}
                                className={cn("cursor-pointer", roomId === String(r.id) && "bg-[#ffe593]")}
                              >
                                <td className="px-2 py-1 border-t border-r">{r.room_no}</td>
                                <td className="px-2 py-1 border-t">{r.room_name}</td>
                              </tr>
                            ))}
                            {roomOptions.length === 0 && (
                              <tr>
                                <td colSpan={2} className="px-2 py-2 text-muted-foreground border-t">
                                  No rooms available.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-[10px]">Subject(s) Count:</span>
                        <span className="text-[10px] font-bold">0</span>
                        <span className="text-[10px]">Total Hours Per Week</span>
                        <span className="text-[10px] font-bold">0</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Select defaultValue="1">
                          <SelectTrigger className="h-6 w-[100px] text-[9px] bg-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">Format - 1</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button type="button" variant="outline" className="h-6 text-[9px] gap-1" onClick={() => reportAction("Print Room Schedule Grid")}>
                          <Printer className="h-3 w-3" />
                          Print Room Schedule Grid
                        </Button>
                      </div>
                    </div>
                    <div className="border border-[#d2b86a] bg-[#fff3c9] p-1.5">
                      <div className="font-bold text-[10px] text-[#7a611f] mb-1">Room Utilization Meter</div>
                      <div className="grid grid-cols-7 gap-2 items-end">
                        {DAYS.map((d) => (
                          <div key={d} className="text-center">
                            <div className="h-16 border border-[#b1d38c] bg-[#f4ffea] flex items-end">
                              <div className="w-full bg-[#54c647]" style={{ height: "64%" }} />
                            </div>
                            <div className="text-[10px]">{d}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {scheduleView === "faculty" && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-end">
                      <Button type="button" variant="outline" className="h-6 text-[9px]" onClick={() => reportAction("Report Signatory")}>
                        Report Signatory
                      </Button>
                    </div>
                    <div className="border border-[#8bb07d] bg-[#e5f3d8] p-1.5">
                      <div className="font-bold text-[11px] text-[#1d4b2a] mb-1">Members of the Faculty/Teaching Staff</div>
                      <div className="border border-[#8bb07d] bg-white overflow-auto max-h-[220px]">
                        <table className="w-full text-[10px]">
                          <thead className="bg-[#d5edbf]">
                            <tr>
                              <th className="text-left px-2 py-1 border-r">FACULTY</th>
                              <th className="text-left px-2 py-1">COLLEGE CODE</th>
                            </tr>
                          </thead>
                          <tbody>
                            {facultyRows.slice(0, 80).map((f) => (
                              <tr key={f.id} className="odd:bg-white even:bg-[#f8fff3]">
                                <td className="px-2 py-1 border-t border-r">{facultyName(f)}</td>
                                <td className="px-2 py-1 border-t">{f.college_code || ""}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                    <div className="border border-[#8bb07d] bg-[#e5f3d8] p-1.5">
                      <div className="font-bold text-[10px] text-[#1d4b2a] mb-1">Teaching Load Statistics</div>
                      <div className="flex items-center gap-3 text-[10px]">
                        <span>No. of Subject</span>
                        <span className="font-bold">0</span>
                        <span>Hours Load Per Week</span>
                        <span className="font-bold">0</span>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <Select defaultValue="1">
                          <SelectTrigger className="h-6 w-[100px] text-[9px] bg-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">Format - 1</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button type="button" variant="outline" className="h-6 text-[9px] gap-1" onClick={() => reportAction("Print Faculty Schedule Grid")}>
                          <Printer className="h-3 w-3" />
                          Print Faculty Schedule Grid
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
