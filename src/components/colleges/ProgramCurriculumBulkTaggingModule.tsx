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
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const API = process.env.NEXT_PUBLIC_API_URL;

type Program = {
  id: number;
  campus_id: number;
  college_id: number;
  program_code: string;
  program_name: string;
};

type Curriculum = {
  id: number;
  academic_program_id: number;
  major_discipline_id: number | null;
  curriculum_code: string;
};

type StudentRow = {
  id: string;
  student_no: string;
  student_name: string;
  gender: string;
  college_name: string;
  academic_program: string;
  major_study: string;
  year_level: string;
};

const ALL = "__all__";

const yearLevels = [
  "1st Year",
  "2nd Year",
  "3rd Year",
  "4th Year",
  "5th Year",
  "6th Year",
  "Graduate",
];

export function ProgramCurriculumBulkTaggingModule() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [curriculums, setCurriculums] = useState<Curriculum[]>([]);
  const [selectedProgram, setSelectedProgram] = useState(ALL);
  const [selectedYearLevel, setSelectedYearLevel] = useState(ALL);
  const [selectedCurriculum, setSelectedCurriculum] = useState(ALL);
  const [studentsWithoutCurriculum, setStudentsWithoutCurriculum] = useState(true);
  const [rows, setRows] = useState<StudentRow[]>([]);
  const [checkedIds, setCheckedIds] = useState<string[]>([]);

  const filteredCurriculums = useMemo(() => {
    if (selectedProgram === ALL) return curriculums;
    const programId = parseInt(selectedProgram, 10);
    if (!Number.isFinite(programId)) return [];
    return curriculums.filter((x) => x.academic_program_id === programId);
  }, [curriculums, selectedProgram]);

  const loadReferences = async () => {
    if (!API) return;
    try {
      const [progRes, curRes] = await Promise.all([
        fetch(`${API}/api/academic-programs`),
        fetch(`${API}/api/program-curriculums`),
      ]);
      if (progRes.ok) setPrograms((await progRes.json()) as Program[]);
      if (curRes.ok) setCurriculums((await curRes.json()) as Curriculum[]);
    } catch {
      toast({
        title: "Load failed",
        description: "Unable to load bulk tagging references.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    void loadReferences();
  }, []);

  const makeList = () => {
    // Student source endpoint is not yet available in backend.
    setRows([]);
    setCheckedIds([]);
    toast({
      title: "No student source yet",
      description:
        "Bulk tagging filters are ready. Connect a student listing endpoint to populate this grid.",
    });
  };

  const toggleAll = (checked: boolean) => {
    setCheckedIds(checked ? rows.map((x) => x.id) : []);
  };

  const toggleOne = (id: string, checked: boolean) => {
    setCheckedIds((prev) => (checked ? [...prev, id] : prev.filter((x) => x !== id)));
  };

  const tagSelected = () => {
    if (!selectedCurriculum || selectedCurriculum === ALL) {
      toast({
        title: "Select curriculum",
        description: "Please select a curriculum code before tagging.",
        variant: "destructive",
      });
      return;
    }
    toast({
      title: "Not wired yet",
      description: "Tagging action can be connected once student bulk update API is available.",
    });
  };

  const emptyRows = Array.from({ length: 16 }, (_, i) => i);

  return (
    <div className="p-2">
      <div className="border border-[#79b898] bg-white">
        <div className="border-b border-[#79b898] bg-gradient-to-b from-[#def8ea] to-[#9fdbbc] px-3 py-2">
          <h2 className="text-[30px] leading-none font-semibold text-[#1f5e45]">
            Program Curriculum - Bulk Tagging
          </h2>
          <p className="text-[12px] text-[#35684f]">
            Use this module to tag a Program Curriculum to students without curriculum yet.
          </p>
        </div>

        <div className="border-b border-[#79b898] bg-[#f8fdf9] p-2 text-[12px]">
          <div className="grid grid-cols-12 gap-2">
            <div className="col-span-12 lg:col-span-7 space-y-2">
              <div className="grid grid-cols-12 items-center gap-2">
                <Label className="col-span-3">Program Code :</Label>
                <Select
                  value={selectedProgram}
                  onValueChange={(v) => {
                    setSelectedProgram(v);
                    setSelectedCurriculum(ALL);
                  }}
                >
                  <SelectTrigger className="col-span-9 h-7 text-[12px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL}>[ All Academic Programs ]</SelectItem>
                    {programs.map((p) => (
                      <SelectItem key={p.id} value={String(p.id)}>
                        {p.program_code} - {p.program_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-12 items-center gap-2">
                <Label className="col-span-3">Major Study :</Label>
                <Select value={ALL} disabled>
                  <SelectTrigger className="col-span-9 h-7 text-[12px]">
                    <SelectValue placeholder="[ All Major(s) under this program ]" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL}>[ All Major(s) under this program ]</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-12 items-center gap-2">
                <Label className="col-span-3">Curriculum Code :</Label>
                <Select value={selectedCurriculum} onValueChange={setSelectedCurriculum}>
                  <SelectTrigger className="col-span-9 h-7 text-[12px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL}>[ All Curriculums ]</SelectItem>
                    {filteredCurriculums.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.curriculum_code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="col-span-12 lg:col-span-5 space-y-2">
              <div className="grid grid-cols-12 items-center gap-2">
                <Label className="col-span-4">Year Level :</Label>
                <Select value={selectedYearLevel} onValueChange={setSelectedYearLevel}>
                  <SelectTrigger className="col-span-8 h-7 text-[12px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL}>[ All Year Levels ]</SelectItem>
                    {yearLevels.map((yl) => (
                      <SelectItem key={yl} value={yl}>
                        {yl}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2 text-[12px]">
                  <Checkbox
                    checked={studentsWithoutCurriculum}
                    onCheckedChange={(v) => setStudentsWithoutCurriculum(!!v)}
                  />
                  <span className="text-[#ab2c2c]">STUDENT WITHOUT CURRICULUM YET</span>
                </div>
                <Button className="h-7 text-[11px]" onClick={makeList}>
                  MAKE A LIST
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="border-b border-[#79b898]">
          <div className="grid grid-cols-12 bg-gradient-to-b from-[#6ec79b] to-[#2f9b68] text-[11px] font-bold uppercase text-white">
            <div className="col-span-1 border-r border-white/30 px-2 py-1">Select</div>
            <div className="col-span-2 border-r border-white/30 px-2 py-1">Student No</div>
            <div className="col-span-3 border-r border-white/30 px-2 py-1">Student Name</div>
            <div className="col-span-1 border-r border-white/30 px-2 py-1">Gender</div>
            <div className="col-span-2 border-r border-white/30 px-2 py-1">College Name</div>
            <div className="col-span-1 border-r border-white/30 px-2 py-1">Academic Prog</div>
            <div className="col-span-1 border-r border-white/30 px-2 py-1">Major Study</div>
            <div className="col-span-1 px-2 py-1">Year Level</div>
          </div>

          <div className="h-[360px] overflow-auto">
            {rows.length > 0 ? (
              <>
                <button
                  type="button"
                  className="grid w-full grid-cols-12 border-b border-[#d4e8dc] bg-[#eef9f2] text-[12px] text-left"
                  onClick={() => toggleAll(checkedIds.length !== rows.length)}
                >
                  <div className="col-span-1 border-r border-[#d4e8dc] px-2 py-1">
                    <Checkbox checked={checkedIds.length === rows.length && rows.length > 0} />
                  </div>
                  <div className="col-span-11 px-2 py-1 font-semibold">
                    Select / Deselect All
                  </div>
                </button>
                {rows.map((r) => {
                  const checked = checkedIds.includes(r.id);
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => toggleOne(r.id, !checked)}
                      className={cn(
                        "grid w-full grid-cols-12 border-b border-[#d4e8dc] text-[12px] text-left hover:bg-[#e7f8ef]",
                        checked && "bg-[#d9f3e5]"
                      )}
                    >
                      <div className="col-span-1 border-r border-[#d4e8dc] px-2 py-1">
                        <Checkbox checked={checked} />
                      </div>
                      <div className="col-span-2 border-r border-[#d4e8dc] px-2 py-1">{r.student_no}</div>
                      <div className="col-span-3 border-r border-[#d4e8dc] px-2 py-1">{r.student_name}</div>
                      <div className="col-span-1 border-r border-[#d4e8dc] px-2 py-1">{r.gender}</div>
                      <div className="col-span-2 border-r border-[#d4e8dc] px-2 py-1">{r.college_name}</div>
                      <div className="col-span-1 border-r border-[#d4e8dc] px-2 py-1">{r.academic_program}</div>
                      <div className="col-span-1 border-r border-[#d4e8dc] px-2 py-1">{r.major_study}</div>
                      <div className="col-span-1 px-2 py-1">{r.year_level}</div>
                    </button>
                  );
                })}
              </>
            ) : (
              emptyRows.map((r) => (
                <div key={r} className="grid grid-cols-12 border-b border-[#e2eee7] text-[12px]">
                  <div className="col-span-1 border-r border-[#e2eee7] px-2 py-1">
                    <Checkbox checked={false} />
                  </div>
                  <div className="col-span-2 border-r border-[#e2eee7] px-2 py-1">&nbsp;</div>
                  <div className="col-span-3 border-r border-[#e2eee7] px-2 py-1">&nbsp;</div>
                  <div className="col-span-1 border-r border-[#e2eee7] px-2 py-1">&nbsp;</div>
                  <div className="col-span-2 border-r border-[#e2eee7] px-2 py-1">&nbsp;</div>
                  <div className="col-span-1 border-r border-[#e2eee7] px-2 py-1">&nbsp;</div>
                  <div className="col-span-1 border-r border-[#e2eee7] px-2 py-1">&nbsp;</div>
                  <div className="col-span-1 px-2 py-1">&nbsp;</div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="flex items-center justify-between bg-[#f0faf4] px-2 py-1.5">
          <div className="text-[12px] font-semibold text-red-600">Total Record Affected: {checkedIds.length}</div>
          <div className="flex gap-1">
            <Button className="h-7 text-[11px]" onClick={tagSelected}>
              TAG SELECTED CURRICULUM
            </Button>
            <Button
              variant="outline"
              className="h-7 text-[11px]"
              onClick={() => {
                setCheckedIds([]);
                setRows([]);
              }}
            >
              CANCEL
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
