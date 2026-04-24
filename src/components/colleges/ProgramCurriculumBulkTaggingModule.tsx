"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  Tag,
  ListChecks,
  Users,
  GraduationCap,
  BookOpen,
  AlertCircle,
  X,
  CheckSquare,
} from "lucide-react";

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

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-[11px] text-muted-foreground font-medium pl-0.5">{label}</Label>
      {children}
    </div>
  );
}

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
      toast({ title: "Load failed", description: "Unable to load bulk tagging references.", variant: "destructive" });
    }
  };

  useEffect(() => { void loadReferences(); }, []);

  const makeList = () => {
    setRows([]);
    setCheckedIds([]);
    toast({
      title: "No student source yet",
      description: "Bulk tagging filters are ready. Connect a student listing endpoint to populate this grid.",
    });
  };

  const toggleAll = (checked: boolean) => setCheckedIds(checked ? rows.map((x) => x.id) : []);
  const toggleOne = (id: string, checked: boolean) =>
    setCheckedIds((prev) => (checked ? [...prev, id] : prev.filter((x) => x !== id)));

  const tagSelected = () => {
    if (!selectedCurriculum || selectedCurriculum === ALL) {
      toast({ title: "Select curriculum", description: "Please select a curriculum code before tagging.", variant: "destructive" });
      return;
    }
    toast({ title: "Not wired yet", description: "Tagging action can be connected once student bulk update API is available." });
  };

  const allChecked = rows.length > 0 && checkedIds.length === rows.length;

  return (
    <div className="p-5 space-y-5">
      {/* Filter Card */}
      <Card className="rounded-2xl border-border/60 shadow-sm overflow-hidden">
        <CardHeader className="pb-3 border-b border-border/40">
          <div className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-xl bg-emerald-600 text-white shadow-sm">
              <Tag className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold tracking-tight">Bulk Tagging Filters</CardTitle>
              <p className="text-xs text-muted-foreground">Filter students to tag a curriculum program</p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <FieldRow label="Program Code">
              <Select
                value={selectedProgram}
                onValueChange={(v) => { setSelectedProgram(v); setSelectedCurriculum(ALL); }}
              >
                <SelectTrigger className="h-9 rounded-xl border-border/60 text-xs shadow-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value={ALL} className="text-xs">[ All Academic Programs ]</SelectItem>
                  {programs.map((p) => (
                    <SelectItem key={p.id} value={String(p.id)} className="text-xs">
                      {p.program_code} – {p.program_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldRow>

            <FieldRow label="Major Study">
              <Select value={ALL} disabled>
                <SelectTrigger className="h-9 rounded-xl border-border/60 text-xs shadow-sm opacity-60">
                  <SelectValue placeholder="[ All Major(s) under this program ]" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value={ALL} className="text-xs">[ All Major(s) under this program ]</SelectItem>
                </SelectContent>
              </Select>
            </FieldRow>

            <FieldRow label="Year Level">
              <Select value={selectedYearLevel} onValueChange={setSelectedYearLevel}>
                <SelectTrigger className="h-9 rounded-xl border-border/60 text-xs shadow-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value={ALL} className="text-xs">[ All Year Levels ]</SelectItem>
                  {yearLevels.map((yl) => (
                    <SelectItem key={yl} value={yl} className="text-xs">{yl}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldRow>

            <FieldRow label="Curriculum Code">
              <Select value={selectedCurriculum} onValueChange={setSelectedCurriculum}>
                <SelectTrigger className="h-9 rounded-xl border-border/60 text-xs shadow-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value={ALL} className="text-xs">[ All Curriculums ]</SelectItem>
                  {filteredCurriculums.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)} className="text-xs">{c.curriculum_code}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldRow>

            <div className="flex items-end gap-3 md:col-span-2">
              <label className="flex items-center gap-2 cursor-pointer group">
                <Checkbox
                  checked={studentsWithoutCurriculum}
                  onCheckedChange={(v) => setStudentsWithoutCurriculum(!!v)}
                  className="data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500"
                />
                <span className="text-xs font-medium text-orange-600 dark:text-orange-400 flex items-center gap-1">
                  <AlertCircle className="h-3.5 w-3.5" />
                  Students without curriculum yet
                </span>
              </label>
              <Button
                type="button"
                onClick={makeList}
                className="h-9 rounded-xl text-xs bg-emerald-600 hover:bg-emerald-700 gap-1.5 ml-auto"
              >
                <ListChecks className="h-3.5 w-3.5" />
                Make a List
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Student Table Card */}
      <Card className="rounded-2xl border-border/60 shadow-sm overflow-hidden flex flex-col">
        <CardHeader className="pb-3 border-b border-border/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="grid h-8 w-8 place-items-center rounded-xl bg-muted">
                <Users className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-sm font-semibold tracking-tight">Student List</CardTitle>
                <p className="text-xs text-muted-foreground">
                  {rows.length > 0
                    ? `${rows.length} student${rows.length !== 1 ? "s" : ""} — ${checkedIds.length} selected`
                    : "Generate a list using the filters above"}
                </p>
              </div>
            </div>
            {checkedIds.length > 0 && (
              <Badge className="bg-emerald-100 text-emerald-700 rounded-lg text-xs border-0">
                {checkedIds.length} selected
              </Badge>
            )}
          </div>
        </CardHeader>

        {/* Table Header */}
        <div className="grid grid-cols-12 border-b border-border/40 bg-muted/30">
          {[
            { label: "Select", span: "col-span-1" },
            { label: "Student No", span: "col-span-2" },
            { label: "Student Name", span: "col-span-3" },
            { label: "Gender", span: "col-span-1" },
            { label: "College Name", span: "col-span-2" },
            { label: "Academic Prog", span: "col-span-1" },
            { label: "Major Study", span: "col-span-1" },
            { label: "Year Level", span: "col-span-1" },
          ].map(({ label, span }, i) => (
            <div
              key={i}
              className={cn(
                span,
                "px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground border-r last:border-r-0 border-border/40",
                i === 0 ? "flex items-center justify-center" : ""
              )}
            >
              {i === 0 && rows.length > 0 ? (
                <Checkbox
                  checked={allChecked}
                  onCheckedChange={(v) => toggleAll(!!v)}
                  className="data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
                />
              ) : (
                label
              )}
            </div>
          ))}
        </div>

        {/* Table Rows */}
        <ScrollArea className="h-80">
          {rows.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <Users className="h-8 w-8 mb-3 opacity-30" />
              <p className="text-sm font-medium">No students loaded</p>
              <p className="text-xs opacity-60 mt-1">Set filters above and click "Make a List"</p>
            </div>
          ) : (
            rows.map((r) => {
              const checked = checkedIds.includes(r.id);
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => toggleOne(r.id, !checked)}
                  className={cn(
                    "w-full grid grid-cols-12 text-left border-b border-border/30 transition-colors hover:bg-emerald-50 dark:hover:bg-emerald-950/20",
                    checked && "bg-emerald-50 dark:bg-emerald-950/30 border-l-2 border-l-emerald-500"
                  )}
                >
                  <div className="col-span-1 px-3 py-2.5 flex items-center justify-center border-r border-border/30">
                    <Checkbox
                      checked={checked}
                      className="data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
                      onClick={(e) => e.stopPropagation()}
                      onCheckedChange={(v) => toggleOne(r.id, !!v)}
                    />
                  </div>
                  <div className="col-span-2 px-3 py-2.5 text-xs font-mono font-semibold text-emerald-700 dark:text-emerald-400 border-r border-border/30">{r.student_no}</div>
                  <div className="col-span-3 px-3 py-2.5 text-xs border-r border-border/30 truncate">{r.student_name}</div>
                  <div className="col-span-1 px-3 py-2.5 text-xs border-r border-border/30">{r.gender}</div>
                  <div className="col-span-2 px-3 py-2.5 text-xs border-r border-border/30 truncate">{r.college_name}</div>
                  <div className="col-span-1 px-3 py-2.5 text-xs border-r border-border/30 truncate">{r.academic_program}</div>
                  <div className="col-span-1 px-3 py-2.5 text-xs border-r border-border/30 truncate">{r.major_study}</div>
                  <div className="col-span-1 px-3 py-2.5 text-xs">{r.year_level}</div>
                </button>
              );
            })
          )}
        </ScrollArea>

        {/* Footer Bar */}
        <div className="flex items-center justify-between border-t border-border/40 bg-muted/20 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">Total Records Affected:</span>
            <Badge
              variant={checkedIds.length > 0 ? "default" : "secondary"}
              className={cn(
                "rounded-lg text-xs",
                checkedIds.length > 0 ? "bg-emerald-100 text-emerald-700 border-0" : ""
              )}
            >
              {checkedIds.length}
            </Badge>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              onClick={tagSelected}
              disabled={checkedIds.length === 0}
              className="h-9 rounded-xl text-xs bg-emerald-600 hover:bg-emerald-700 gap-1.5"
            >
              <CheckSquare className="h-3.5 w-3.5" />
              Tag Selected Curriculum
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => { setCheckedIds([]); setRows([]); }}
              className="h-9 rounded-xl text-xs border-border/60 gap-1.5"
            >
              <X className="h-3.5 w-3.5" />
              Cancel
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
