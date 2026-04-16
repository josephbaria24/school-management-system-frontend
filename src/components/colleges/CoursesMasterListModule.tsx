"use client";

import { useEffect, useMemo, useState } from "react";
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
import { cn } from "@/lib/utils";
import { Pencil } from "lucide-react";
import { MaintainSubjectAreasDialog } from "@/components/colleges/MaintainSubjectAreasDialog";
import { MaintainSubjectModesDialog } from "@/components/colleges/MaintainSubjectModesDialog";

const API = process.env.NEXT_PUBLIC_API_URL;

const LOOKUP_NONE = "__none__";

/** Fixed course levels (legacy / CHED-style list). */
const COURSE_LEVEL_OPTIONS = [
  "Pre-School",
  "Elementary: Primary Level",
  "Elementary: Intermediate Level",
  "Secondary Level",
  "Technical / Vocational",
  "Pre-Baccalaureate Diploma, Certificate or Associate Degree",
  "Baccalaureate Degree",
  "Post-Baccalaureate Degree Diploma or Certificate",
  "Bachelor of Laws, Doctor of Jurisprudence",
  "MD",
] as const;

const COURSE_LEVEL_NONE = "__none__";

type CourseRow = {
  id: number;
  course_code: string;
  course_title: string;
  course_description: string | null;
  laboratory_units: string | number | null;
  academic_units_lecture: string | number | null;
  credited_units: string | number | null;
  lecture_hours: string | number | null;
  laboratory_hours: string | number | null;
  general_education: boolean;
  major_course: boolean;
  elective_course: boolean;
  computer_course: boolean;
  e_learning: boolean;
  course_with_internet: boolean;
  include_in_gwa: boolean;
  non_academic_course: boolean;
  club_organization_course: boolean;
  from_other_school: boolean;
  use_transmuted_grade: boolean;
  is_inactive: boolean;
  code_alias_1: string | null;
  code_alias_2: string | null;
  parent_code: string | null;
  course_level: string | null;
  course_area: string | null;
  course_mode: string | null;
  default_min_class_limit: number | null;
  default_max_class_limit: number | null;
  is_locked_subject: boolean;
};

const emptyForm = {
  course_code: "",
  course_title: "",
  course_description: "",
  laboratory_units: "0",
  academic_units_lecture: "0",
  credited_units: "0",
  lecture_hours: "0",
  laboratory_hours: "0",
  general_education: false,
  major_course: false,
  elective_course: false,
  computer_course: false,
  e_learning: false,
  course_with_internet: false,
  include_in_gwa: false,
  non_academic_course: false,
  club_organization_course: false,
  from_other_school: false,
  use_transmuted_grade: false,
  is_inactive: false,
  code_alias_1: "",
  code_alias_2: "",
  parent_code: "",
  course_level: "",
  course_area: "",
  course_mode: "",
  default_min_class_limit: "15",
  default_max_class_limit: "60",
  is_locked_subject: false,
};

const checkboxFields: Array<{ key: keyof typeof emptyForm; label: string }> = [
  { key: "general_education", label: "GENERAL EDUCATION" },
  { key: "major_course", label: "MAJOR COURSE" },
  { key: "elective_course", label: "ELECTIVE COURSE" },
  { key: "computer_course", label: "COMPUTER COURSE" },
  { key: "e_learning", label: "E-LEARNING" },
  { key: "course_with_internet", label: "COURSE WITH INTERNET" },
  { key: "include_in_gwa", label: `INCLUDE IN "GWA" or "GPA"` },
  { key: "non_academic_course", label: "NON-ACADEMIC COURSE" },
  { key: "club_organization_course", label: "CLUB/ORGANIZATION COURSE" },
  { key: "from_other_school", label: "FROM OTHER SCHOOL" },
  { key: "use_transmuted_grade", label: "USE TRANSMUTED GRADE" },
];

type SubjectAreaRow = { id: number; area_code: number; area_name: string; short_name: string | null };
type SubjectModeRow = { id: number; mode_code: number; mode_name: string; short_name: string | null };

export function CoursesMasterListModule() {
  const [rows, setRows] = useState<CourseRow[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState("");
  const [subjectAreas, setSubjectAreas] = useState<SubjectAreaRow[]>([]);
  const [subjectModes, setSubjectModes] = useState<SubjectModeRow[]>([]);
  const [maintainAreasOpen, setMaintainAreasOpen] = useState(false);
  const [maintainModesOpen, setMaintainModesOpen] = useState(false);

  const selected = useMemo(() => rows.find((r) => r.id === selectedId) ?? null, [rows, selectedId]);

  const areaNames = useMemo(() => subjectAreas.map((a) => a.area_name), [subjectAreas]);
  const modeNames = useMemo(() => subjectModes.map((m) => m.mode_name), [subjectModes]);
  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) =>
      `${r.course_code} ${r.course_title}`.toLowerCase().includes(q)
    );
  }, [rows, search]);

  const loadSubjectLookups = async () => {
    if (!API) return;
    try {
      const [aRes, mRes] = await Promise.all([
        fetch(`${API}/api/subject-areas`),
        fetch(`${API}/api/subject-modes`),
      ]);
      if (aRes.ok) setSubjectAreas((await aRes.json()) as SubjectAreaRow[]);
      if (mRes.ok) setSubjectModes((await mRes.json()) as SubjectModeRow[]);
    } catch {
      // noop
    }
  };

  const loadRows = async () => {
    if (!API) return;
    try {
      const res = await fetch(`${API}/api/courses-master-list`);
      if (!res.ok) return;
      setRows((await res.json()) as CourseRow[]);
    } catch {
      // noop
    }
  };

  useEffect(() => {
    void loadRows();
    void loadSubjectLookups();
  }, []);

  useEffect(() => {
    if (!selected) return;
    setForm({
      course_code: selected.course_code,
      course_title: selected.course_title,
      course_description: selected.course_description ?? "",
      laboratory_units: String(selected.laboratory_units ?? 0),
      academic_units_lecture: String(selected.academic_units_lecture ?? 0),
      credited_units: String(selected.credited_units ?? 0),
      lecture_hours: String(selected.lecture_hours ?? 0),
      laboratory_hours: String(selected.laboratory_hours ?? 0),
      general_education: !!selected.general_education,
      major_course: !!selected.major_course,
      elective_course: !!selected.elective_course,
      computer_course: !!selected.computer_course,
      e_learning: !!selected.e_learning,
      course_with_internet: !!selected.course_with_internet,
      include_in_gwa: !!selected.include_in_gwa,
      non_academic_course: !!selected.non_academic_course,
      club_organization_course: !!selected.club_organization_course,
      from_other_school: !!selected.from_other_school,
      use_transmuted_grade: !!selected.use_transmuted_grade,
      is_inactive: !!selected.is_inactive,
      code_alias_1: selected.code_alias_1 ?? "",
      code_alias_2: selected.code_alias_2 ?? "",
      parent_code: selected.parent_code ?? "",
      course_level: selected.course_level ?? "",
      course_area: selected.course_area ?? "",
      course_mode: selected.course_mode ?? "",
      default_min_class_limit: String(selected.default_min_class_limit ?? 15),
      default_max_class_limit: String(selected.default_max_class_limit ?? 60),
      is_locked_subject: !!selected.is_locked_subject,
    });
  }, [selected]);

  const save = async () => {
    if (!API) return;
    if (!form.course_code.trim() || !form.course_title.trim()) {
      toast({
        title: "Validation error",
        description: "Course code and course title are required.",
        variant: "destructive",
      });
      return;
    }
    const payload = {
      ...form,
      course_code: form.course_code.trim(),
      course_title: form.course_title.trim(),
      course_description: form.course_description || null,
      laboratory_units: parseFloat(form.laboratory_units || "0"),
      academic_units_lecture: parseFloat(form.academic_units_lecture || "0"),
      credited_units: parseFloat(form.credited_units || "0"),
      lecture_hours: parseFloat(form.lecture_hours || "0"),
      laboratory_hours: parseFloat(form.laboratory_hours || "0"),
      code_alias_1: form.code_alias_1 || null,
      code_alias_2: form.code_alias_2 || null,
      parent_code: form.parent_code || null,
      course_level: form.course_level || null,
      course_area: form.course_area || null,
      course_mode: form.course_mode || null,
      default_min_class_limit: parseInt(form.default_min_class_limit || "0", 10) || null,
      default_max_class_limit: parseInt(form.default_max_class_limit || "0", 10) || null,
    };
    try {
      const url = selectedId ? `${API}/api/courses-master-list/${selectedId}` : `${API}/api/courses-master-list`;
      const res = await fetch(url, {
        method: selectedId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(result?.error || "Failed to save");
      setSelectedId(result.id);
      await loadRows();
      toast({ title: "Saved", description: "Course saved successfully." });
    } catch (err) {
      toast({
        title: "Save failed",
        description: err instanceof Error ? err.message : "Failed to save",
        variant: "destructive",
      });
    }
  };

  const remove = async () => {
    if (!API || !selectedId) return;
    try {
      const res = await fetch(`${API}/api/courses-master-list/${selectedId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      setSelectedId(null);
      setForm(emptyForm);
      await loadRows();
      toast({ title: "Deleted", description: "Course deleted." });
    } catch {
      toast({ title: "Delete failed", description: "Failed to delete course.", variant: "destructive" });
    }
  };

  const newRecord = () => {
    setSelectedId(null);
    setForm(emptyForm);
  };

  return (
    <div className="grid grid-cols-12 gap-2 p-2 min-h-[620px] bg-[#f2fbf7]">
      <div className="col-span-12 lg:col-span-5 border border-[#79b898] bg-white">
        <div className="bg-[#f8fdf9] border-b border-[#9ed9c1] px-2 py-1 text-[12px] font-bold text-[#1f5e45] uppercase">
          Course Information
        </div>
        <div className="p-2 space-y-1.5 text-[12px]">
          <div className="grid grid-cols-12 items-center gap-2">
            <Label className="col-span-3 text-[12px]">Course Code</Label>
            <Input className="col-span-9 h-7 text-[12px]" value={form.course_code} onChange={(e) => setForm((f) => ({ ...f, course_code: e.target.value }))} />
          </div>
          <div className="grid grid-cols-12 items-center gap-2">
            <Label className="col-span-3 text-[12px]">Course Title</Label>
            <Input className="col-span-9 h-7 text-[12px]" value={form.course_title} onChange={(e) => setForm((f) => ({ ...f, course_title: e.target.value }))} />
          </div>
          <div className="grid grid-cols-12 items-start gap-2">
            <Label className="col-span-3 text-[12px] pt-1">Course Description</Label>
            <textarea className="col-span-9 h-16 text-[12px] border rounded-sm px-2 py-1" value={form.course_description} onChange={(e) => setForm((f) => ({ ...f, course_description: e.target.value }))} />
          </div>

          <div className="grid grid-cols-12 gap-2 pt-1">
            <div className="col-span-5 space-y-1">
              <div className="grid grid-cols-2 items-center gap-1">
                <Label className="text-[#1f7a57]">Laboratory Units</Label>
                <Input className="h-7 text-[12px]" value={form.laboratory_units} onChange={(e) => setForm((f) => ({ ...f, laboratory_units: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 items-center gap-1">
                <Label className="text-[#1f7a57]">Academic Units (Lecture)</Label>
                <Input className="h-7 text-[12px]" value={form.academic_units_lecture} onChange={(e) => setForm((f) => ({ ...f, academic_units_lecture: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 items-center gap-1">
                <Label className="text-[#1f7a57]">Credited Units</Label>
                <Input className="h-7 text-[12px]" value={form.credited_units} onChange={(e) => setForm((f) => ({ ...f, credited_units: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 items-center gap-1">
                <Label>Lecture Hours</Label>
                <Input className="h-7 text-[12px]" value={form.lecture_hours} onChange={(e) => setForm((f) => ({ ...f, lecture_hours: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 items-center gap-1">
                <Label>Laboratory Hours</Label>
                <Input className="h-7 text-[12px]" value={form.laboratory_hours} onChange={(e) => setForm((f) => ({ ...f, laboratory_hours: e.target.value }))} />
              </div>
            </div>
            <div className="col-span-7 space-y-1 border-l border-[#d4e8dc] pl-2">
              {checkboxFields.map((x) => (
                <div key={String(x.key)} className="flex items-center gap-2">
                  <Checkbox
                    checked={Boolean(form[x.key])}
                    onCheckedChange={(v) => setForm((f) => ({ ...f, [x.key]: !!v }))}
                  />
                  <span className="text-[12px]">{x.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-12 items-center gap-2 pt-1">
            <Label className="col-span-3 text-[12px]">Code Alias 1:</Label>
            <Input className="col-span-9 h-7 text-[12px]" value={form.code_alias_1} onChange={(e) => setForm((f) => ({ ...f, code_alias_1: e.target.value }))} />
          </div>
          <div className="grid grid-cols-12 items-center gap-2">
            <Label className="col-span-3 text-[12px]">Code Alias 2:</Label>
            <Input className="col-span-9 h-7 text-[12px]" value={form.code_alias_2} onChange={(e) => setForm((f) => ({ ...f, code_alias_2: e.target.value }))} />
          </div>
          <div className="grid grid-cols-12 items-center gap-2">
            <Label className="col-span-3 text-[12px]">Parent Code:</Label>
            <Input className="col-span-9 h-7 text-[12px]" value={form.parent_code} onChange={(e) => setForm((f) => ({ ...f, parent_code: e.target.value }))} />
          </div>

          <div className="border border-[#79b898] bg-[#f8fdf9] mt-2">
            <div className="px-2 py-1 text-[12px] font-bold text-[#1f5e45] uppercase border-b border-[#9ed9c1]">Other Information</div>
            <div className="p-2 space-y-1">
              <div className="grid grid-cols-12 items-center gap-2">
                <Label className="col-span-3 text-[12px]">Course Level</Label>
                <div className="col-span-9">
                  <Select
                    value={form.course_level || COURSE_LEVEL_NONE}
                    onValueChange={(v) =>
                      setForm((f) => ({ ...f, course_level: v === COURSE_LEVEL_NONE ? "" : v }))
                    }
                  >
                    <SelectTrigger className="h-7 text-[12px]">
                      <SelectValue placeholder="Select course level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={COURSE_LEVEL_NONE} className="text-[12px]">
                        (None)
                      </SelectItem>
                      {form.course_level &&
                        !(COURSE_LEVEL_OPTIONS as readonly string[]).includes(form.course_level) && (
                          <SelectItem value={form.course_level} className="text-[12px]">
                            {form.course_level} (current — pick a standard level)
                          </SelectItem>
                        )}
                      {COURSE_LEVEL_OPTIONS.map((opt) => (
                        <SelectItem key={opt} value={opt} className="text-[12px]">
                          {opt}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-12 items-center gap-2">
                <Label className="col-span-3 text-[12px]">
                  Course <span className="underline">A</span>rea
                </Label>
                <div className="col-span-9 flex items-center gap-1 min-w-0">
                  <Select
                    value={form.course_area || LOOKUP_NONE}
                    onValueChange={(v) =>
                      setForm((f) => ({ ...f, course_area: v === LOOKUP_NONE ? "" : v }))
                    }
                  >
                    <SelectTrigger className="h-7 flex-1 min-w-0 text-[12px]">
                      <SelectValue placeholder="Select course area" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={LOOKUP_NONE} className="text-[12px]">
                        (None)
                      </SelectItem>
                      {form.course_area && !areaNames.includes(form.course_area) && (
                        <SelectItem value={form.course_area} className="text-[12px]">
                          {form.course_area} (current — pick a listed area)
                        </SelectItem>
                      )}
                      {subjectAreas.map((a) => (
                        <SelectItem key={a.id} value={a.area_name} className="text-[12px]">
                          {a.area_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-7 w-7 shrink-0 border-[#79b898] bg-white text-[#1f5e45] hover:bg-[#e7f8ef]"
                    title="Maintain subject areas"
                    onClick={() => setMaintainAreasOpen(true)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-12 items-center gap-2">
                <Label className="col-span-3 text-[12px]">
                  Course <span className="underline">M</span>ode
                </Label>
                <div className="col-span-9 flex items-center gap-1 min-w-0">
                  <Select
                    value={form.course_mode || LOOKUP_NONE}
                    onValueChange={(v) =>
                      setForm((f) => ({ ...f, course_mode: v === LOOKUP_NONE ? "" : v }))
                    }
                  >
                    <SelectTrigger className="h-7 flex-1 min-w-0 text-[12px]">
                      <SelectValue placeholder="Select course mode" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={LOOKUP_NONE} className="text-[12px]">
                        (None)
                      </SelectItem>
                      {form.course_mode && !modeNames.includes(form.course_mode) && (
                        <SelectItem value={form.course_mode} className="text-[12px]">
                          {form.course_mode} (current — pick a listed mode)
                        </SelectItem>
                      )}
                      {subjectModes.map((m) => (
                        <SelectItem key={m.id} value={m.mode_name} className="text-[12px]">
                          {m.mode_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-7 w-7 shrink-0 border-[#79b898] bg-white text-[#1f5e45] hover:bg-[#e7f8ef]"
                    title="Maintain subject mode"
                    onClick={() => setMaintainModesOpen(true)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-12 items-center gap-2 pt-1">
                <Label className="col-span-6 text-[12px]">Default Minimum Class Limit:</Label>
                <Input className="col-span-2 h-7 text-[12px]" value={form.default_min_class_limit} onChange={(e) => setForm((f) => ({ ...f, default_min_class_limit: e.target.value }))} />
                <div className="col-span-4 flex items-center gap-2">
                  <Checkbox checked={form.is_locked_subject} onCheckedChange={(v) => setForm((f) => ({ ...f, is_locked_subject: !!v }))} />
                  <span className="text-[12px] font-semibold">Locked Subject</span>
                </div>
              </div>
              <div className="grid grid-cols-12 items-center gap-2">
                <Label className="col-span-6 text-[12px]">Default Maximum Class Limit:</Label>
                <Input className="col-span-2 h-7 text-[12px]" value={form.default_max_class_limit} onChange={(e) => setForm((f) => ({ ...f, default_max_class_limit: e.target.value }))} />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2">
              <Checkbox checked={form.is_inactive} onCheckedChange={(v) => setForm((f) => ({ ...f, is_inactive: !!v }))} />
              <span className="text-[12px] font-semibold">Inactive Record</span>
            </div>
            <div className="flex gap-1">
              <Button className="h-7 text-[11px]" onClick={newRecord}>New</Button>
              <Button className="h-7 text-[11px]" onClick={save}>Save</Button>
              <Button className="h-7 text-[11px]" variant="destructive" onClick={remove} disabled={!selectedId}>Delete</Button>
            </div>
          </div>
        </div>
      </div>

      <div className="col-span-12 lg:col-span-7 border border-[#79b898] bg-white flex flex-col">
        <div className="border-b border-[#9ed9c1] bg-[#f8fdf9] px-2 py-1">
          <Input
            className="h-7 text-[12px]"
            placeholder="Search by course code or descriptive title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-12 bg-gradient-to-b from-[#6ec79b] to-[#2f9b68] text-white text-[11px] font-bold uppercase">
          <div className="col-span-2 px-2 py-1 border-r border-white/30">Course Code</div>
          <div className="col-span-5 px-2 py-1 border-r border-white/30">Descriptive Title</div>
          <div className="col-span-1 px-2 py-1 border-r border-white/30 text-center">Lab Unit</div>
          <div className="col-span-1 px-2 py-1 border-r border-white/30 text-center">Lec Unit</div>
          <div className="col-span-1 px-2 py-1 border-r border-white/30 text-center">Credit Unit</div>
          <div className="col-span-1 px-2 py-1 border-r border-white/30 text-center">Lecture Hour</div>
          <div className="col-span-1 px-2 py-1 text-center">Laboratory Hour</div>
        </div>
        <div className="h-[520px] overflow-auto">
          {filteredRows.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => setSelectedId(r.id)}
              className={cn(
                "w-full grid grid-cols-12 text-[12px] text-left border-b border-[#d4e8dc] hover:bg-[#e7f8ef]",
                selectedId === r.id && "bg-[#d9f3e5]"
              )}
            >
              <div className="col-span-2 px-2 py-1 border-r border-[#d4e8dc]">{r.course_code}</div>
              <div className="col-span-5 px-2 py-1 border-r border-[#d4e8dc] truncate">{r.course_title}</div>
              <div className="col-span-1 px-2 py-1 border-r border-[#d4e8dc] text-center">{String(r.laboratory_units ?? 0)}</div>
              <div className="col-span-1 px-2 py-1 border-r border-[#d4e8dc] text-center">{String(r.academic_units_lecture ?? 0)}</div>
              <div className="col-span-1 px-2 py-1 border-r border-[#d4e8dc] text-center">{String(r.credited_units ?? 0)}</div>
              <div className="col-span-1 px-2 py-1 border-r border-[#d4e8dc] text-center">{String(r.lecture_hours ?? 0)}</div>
              <div className="col-span-1 px-2 py-1 text-center">{String(r.laboratory_hours ?? 0)}</div>
            </button>
          ))}
        </div>
        <div className="px-2 py-1 text-[12px] font-bold border-t border-[#79b898]">
          Total Number of Record(s): {filteredRows.length}
          {search.trim() ? ` (filtered from ${rows.length})` : ""}
        </div>
      </div>

      <MaintainSubjectAreasDialog
        open={maintainAreasOpen}
        onOpenChange={setMaintainAreasOpen}
        onChanged={() => void loadSubjectLookups()}
      />
      <MaintainSubjectModesDialog
        open={maintainModesOpen}
        onOpenChange={setMaintainModesOpen}
        onChanged={() => void loadSubjectLookups()}
      />
    </div>
  );
}

