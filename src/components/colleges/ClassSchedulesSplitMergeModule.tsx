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
import { ArrowLeftRight, Send } from "lucide-react";
import { toast } from "@/hooks/use-toast";

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
      } catch {
        // fallback to static shell UI
      }
    };
    void load();
  }, []);

  useEffect(() => {
    const loadSchedules = async () => {
      if (!API) return;
      try {
        // Placeholder source for schedule options until class-schedule API is available.
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
      } catch {
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
      description: "Class schedule split/merge action will be wired to API.",
    });
  };

  return (
    <div className="h-full bg-[#f2fbf7] p-1">
      <div className="w-full border border-[#79b898] bg-white min-h-[640px]">
        <div className="bg-gradient-to-b from-[#def8ea] to-[#9fdbbc] border-b border-[#79b898] px-3 py-2">
          <h1 className="text-[24px] leading-none tracking-tight text-[#1f5e45] font-semibold uppercase">
            Class Schedules (Split/Merge)
          </h1>
          <p className="text-[11px] text-[#35684f] mt-0.5">
            Use this module to transfer student schedules from one class schedule to another.
          </p>
        </div>

        <div className="p-2 space-y-2">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-2">
            <div className="lg:col-span-3 space-y-1">
              <Label className="text-[11px] font-semibold text-[#7a1f1f]">Academic Year &amp; Semester</Label>
              <Select value={yearTermId} onValueChange={setYearTermId}>
                <SelectTrigger className="h-8 text-[11px] bg-white">
                  <SelectValue placeholder="Select AY/Term" />
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

            <div className="lg:col-span-3 space-y-1">
              <Label className="text-[11px] font-semibold text-[#7a1f1f]">Source Campus</Label>
              <Select value={sourceCampusId} onValueChange={setSourceCampusId}>
                <SelectTrigger className="h-8 text-[11px] bg-white">
                  <SelectValue placeholder="Source campus" />
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

            <div className="lg:col-span-3 space-y-1">
              <Label className="text-[11px] font-semibold text-[#7a1f1f]">Destination Campus</Label>
              <Select value={destinationCampusId} onValueChange={setDestinationCampusId}>
                <SelectTrigger className="h-8 text-[11px] bg-white">
                  <SelectValue placeholder="Destination campus" />
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

            <div className="lg:col-span-3 border border-[#c8d6e6] bg-[#f3f8fd] rounded-sm p-2">
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <p className="font-semibold text-[#245789]">&lt;&lt; Source &gt;&gt;</p>
                  <p className="mt-1">
                    Campus: <span className="font-bold text-[#7a1f1f]">{sourceCampusLabel}</span>
                  </p>
                  <p>Class Section: </p>
                </div>
                <div>
                  <p className="font-semibold text-[#245789]">&lt;&lt; Destination &gt;&gt;</p>
                  <p className="mt-1">
                    Campus: <span className="font-bold text-[#7a1f1f]">{destinationCampusLabel}</span>
                  </p>
                  <p>Class Section: </p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
            <div className="border border-[#7d95b8] bg-white">
              <div className="bg-gradient-to-b from-[#6ea4df] to-[#3d75bc] text-white text-[10px] font-bold uppercase px-2 py-1">
                Source Class Schedule
              </div>
              <div className="px-1 py-1 border-b border-[#c7d6ec]">
                <Select value={sourceScheduleId} onValueChange={setSourceScheduleId}>
                  <SelectTrigger className="h-7 text-[11px] bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>Select source schedule</SelectItem>
                    {scheduleOptions.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 text-[10px] font-bold bg-[#edf4ff] border-b border-[#c7d6ec]">
                <div className="px-2 py-1 border-r">Student No</div>
                <div className="px-2 py-1 border-r">Full Name</div>
                <div className="px-2 py-1 border-r">Program</div>
                <div className="px-2 py-1">Year Level</div>
              </div>
              <div className="h-[410px] overflow-auto text-[11px] text-muted-foreground p-2">
                {sourceRows.length === 0 ? "No students loaded." : null}
              </div>
              <div className="border-t border-[#c7d6ec] px-2 py-1 text-[11px]">
                Total Students: <span className="font-bold text-[#a52828]">{sourceRows.length}</span>
              </div>
            </div>

            <div className="border border-[#7d95b8] bg-white">
              <div className="bg-gradient-to-b from-[#6ea4df] to-[#3d75bc] text-white text-[10px] font-bold uppercase px-2 py-1">
                Destination Class Schedule
              </div>
              <div className="px-1 py-1 border-b border-[#c7d6ec]">
                <Select value={destinationScheduleId} onValueChange={setDestinationScheduleId}>
                  <SelectTrigger className="h-7 text-[11px] bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>Select destination schedule</SelectItem>
                    {scheduleOptions.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 text-[10px] font-bold bg-[#edf4ff] border-b border-[#c7d6ec]">
                <div className="px-2 py-1 border-r">Student No</div>
                <div className="px-2 py-1 border-r">Full Name</div>
                <div className="px-2 py-1 border-r">Program</div>
                <div className="px-2 py-1">Year Level</div>
              </div>
              <div className="h-[410px] overflow-auto text-[11px] text-muted-foreground p-2">
                {destinationRows.length === 0 ? "No students loaded." : null}
              </div>
              <div className="border-t border-[#c7d6ec] px-2 py-1 text-[11px] flex items-center justify-between">
                <span>
                  Total Students: <span className="font-bold text-[#a52828]">{destinationRows.length}</span>
                </span>
                <span>
                  Class Limit: <span className="font-bold text-[#a52828]">0</span>
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 border-t border-[#bdd2e9] pt-2">
            <span className="text-[11px] text-[#3a4a5f]">
              Selected: <span className="font-bold text-[#a52828]">{selectedCount}</span>
            </span>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-7 px-2 border-[#9ab7d6] bg-white text-[10px]"
              onClick={() => setSelectedCount((v) => Math.max(0, v - 1))}
            >
              <ArrowLeftRight className="h-3.5 w-3.5" />
            </Button>
            <Button
              type="button"
              size="sm"
              className="h-7 px-3 text-[10px] bg-[#2f5f99] hover:bg-[#254d7c]"
              onClick={transferSelected}
            >
              <Send className="h-3.5 w-3.5 mr-1" />
              Transfer Selected
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
