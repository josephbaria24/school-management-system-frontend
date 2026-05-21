"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Pencil,
  Plus,
  Save,
  Trash2,
  BookOpen,
  Search,
  FlaskConical,
  Tag,
  Info,
  Lock,
  EyeOff,
} from "lucide-react";
import { MaintainSubjectAreasDialog } from "@/components/colleges/MaintainSubjectAreasDialog";
import { MaintainSubjectModesDialog } from "@/components/colleges/MaintainSubjectModesDialog";

const API = process.env.NEXT_PUBLIC_API_URL;
const LOOKUP_NONE = "__none__";

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
  { key: "general_education", label: "General Education" },
  { key: "major_course", label: "Major Course" },
  { key: "elective_course", label: "Elective Course" },
  { key: "computer_course", label: "Computer Course" },
  { key: "e_learning", label: "E-Learning" },
  { key: "course_with_internet", label: "Course with Internet" },
  { key: "include_in_gwa", label: 'Include in GWA / GPA' },
  { key: "non_academic_course", label: "Non-Academic Course" },
  { key: "club_organization_course", label: "Club/Organization Course" },
  { key: "from_other_school", label: "From Other School" },
  { key: "use_transmuted_grade", label: "Use Transmuted Grade" },
];

type SubjectAreaRow = { id: number; area_code: number; area_name: string; short_name: string | null };
type SubjectModeRow = { id: number; mode_code: number; mode_name: string; short_name: string | null };
type CampusRow = { id: number; acronym: string; campus_name: string | null };
type ProgramRow = { id: number; program_code: string; program_name: string };
type CurriculumRow = { id: number; curriculum_code: string; description: string | null };
type CurriculumSubjectRow = {
  id: number;
  subject_code: string;
  descriptive_title: string;
  laboratory_units: number | null;
  lecture_units: number | null;
  credited_units: number | null;
  lecture_hours: number | null;
  laboratory_hours: number | null;
};

function FieldRow({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("space-y-1", className)}>
      <Label className="text-[11px] text-muted-foreground font-medium pl-0.5">{label}</Label>
      {children}
    </div>
  );
}

export function CoursesMasterListModule() {
  const [activeTopTab, setActiveTopTab] = useState<"courses" | "curriculums">("courses");
  const [rows, setRows] = useState<CourseRow[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState("");
  const [subjectAreas, setSubjectAreas] = useState<SubjectAreaRow[]>([]);
  const [subjectModes, setSubjectModes] = useState<SubjectModeRow[]>([]);
  const [maintainAreasOpen, setMaintainAreasOpen] = useState(false);
  const [maintainModesOpen, setMaintainModesOpen] = useState(false);
  const [campuses, setCampuses] = useState<CampusRow[]>([]);
  const [programs, setPrograms] = useState<ProgramRow[]>([]);
  const [selectedCampusId, setSelectedCampusId] = useState<string>(LOOKUP_NONE);
  const [selectedProgramId, setSelectedProgramId] = useState<string>(LOOKUP_NONE);
  const [selectedCurriculumId, setSelectedCurriculumId] = useState<string>(LOOKUP_NONE);
  const [curriculums, setCurriculums] = useState<CurriculumRow[]>([]);
  const [curriculumSubjects, setCurriculumSubjects] = useState<CurriculumSubjectRow[]>([]);

  const selected = useMemo(() => rows.find((r) => r.id === selectedId) ?? null, [rows, selectedId]);
  const areaNames = useMemo(() => subjectAreas.map((a) => a.area_name), [subjectAreas]);
  const modeNames = useMemo(() => subjectModes.map((m) => m.mode_name), [subjectModes]);
  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => `${r.course_code} ${r.course_title}`.toLowerCase().includes(q));
  }, [rows, search]);

  const loadSubjectLookups = async () => {
    if (!API) return;
    try {
      const [aRes, mRes] = await Promise.all([fetch(`${API}/api/subject-areas`), fetch(`${API}/api/subject-modes`)]);
      if (aRes.ok) setSubjectAreas((await aRes.json()) as SubjectAreaRow[]);
      if (mRes.ok) setSubjectModes((await mRes.json()) as SubjectModeRow[]);
    } catch { /* noop */ }
  };

  const loadRows = async () => {
    if (!API) return;
    try {
      const res = await fetch(`${API}/api/courses-master-list`);
      if (!res.ok) return;
      setRows((await res.json()) as CourseRow[]);
    } catch { /* noop */ }
  };

  const loadCurriculumLookups = async () => {
    if (!API) return;
    try {
      const [campusRes, programRes] = await Promise.all([
        fetch(`${API}/api/campuses`),
        fetch(`${API}/api/academic-programs?status=active`),
      ]);
      if (campusRes.ok) {
        const rows = (await campusRes.json()) as CampusRow[];
        setCampuses(rows);
        if (rows[0]) setSelectedCampusId(String(rows[0].id));
      }
      if (programRes.ok) {
        const rows = (await programRes.json()) as ProgramRow[];
        setPrograms(rows);
      }
    } catch {
      // noop
    }
  };

  useEffect(() => { void loadRows(); void loadSubjectLookups(); void loadCurriculumLookups(); }, []);

  useEffect(() => {
    const loadCurriculums = async () => {
      if (!API) return;
      try {
        const q = new URLSearchParams();
        if (selectedProgramId !== LOOKUP_NONE) q.set("academic_program_id", selectedProgramId);
        const res = await fetch(`${API}/api/program-curriculums?${q.toString()}`);
        if (!res.ok) return;
        const rows = (await res.json()) as CurriculumRow[];
        setCurriculums(rows);
        if (rows[0]) setSelectedCurriculumId(String(rows[0].id));
      } catch {
        // noop
      }
    };
    void loadCurriculums();
  }, [selectedProgramId]);

  useEffect(() => {
    const loadSubjects = async () => {
      if (!API || selectedCurriculumId === LOOKUP_NONE) {
        setCurriculumSubjects([]);
        return;
      }
      try {
        const res = await fetch(`${API}/api/program-curriculums/${selectedCurriculumId}/subjects`);
        if (!res.ok) return;
        setCurriculumSubjects((await res.json()) as CurriculumSubjectRow[]);
      } catch {
        setCurriculumSubjects([]);
      }
    };
    void loadSubjects();
  }, [selectedCurriculumId]);

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
      toast({ title: "Validation error", description: "Course code and course title are required.", variant: "destructive" });
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
      const res = await fetch(url, { method: selectedId ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(result?.error || "Failed to save");
      setSelectedId(result.id);
      await loadRows();
      toast({ title: "Saved", description: "Course saved successfully." });
    } catch (err) {
      toast({ title: "Save failed", description: err instanceof Error ? err.message : "Failed to save", variant: "destructive" });
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

  const newRecord = () => { setSelectedId(null); setForm(emptyForm); };

  if (activeTopTab === "curriculums") {
    const selectedCampus = campuses.find((c) => String(c.id) === selectedCampusId);
    const selectedProgram = programs.find((p) => String(p.id) === selectedProgramId);
    const selectedCurriculum = curriculums.find((c) => String(c.id) === selectedCurriculumId);
    return (
      <div className="h-full min-h-0 overflow-hidden p-3 flex flex-col">
        <div className="mb-2 inline-flex w-fit max-w-max overflow-hidden rounded-xl border border-border/60 bg-background shadow-sm divide-x divide-border/60">
          <Button
            type="button"
            variant="ghost"
            className="h-8 text-xs rounded-none"
            onClick={() => setActiveTopTab("courses")}
          >
            Courses Master List
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="h-8 text-xs rounded-none bg-muted/40 font-semibold"
            onClick={() => setActiveTopTab("curriculums")}
          >
            Program Curriculums
          </Button>
        </div>
        <div className="flex-1 min-h-0 rounded-2xl border border-border/60 bg-card overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-[24rem_1fr] gap-2 h-full p-2 min-h-0">
            <div className="rounded-xl border border-border/60 bg-card overflow-hidden flex flex-col">
              <div className="px-3 py-2 text-xs font-semibold border-b border-border/60 bg-muted/30">General Information</div>
              <div className="p-3 space-y-2 overflow-auto">
                <FieldRow label="Campus">
                  <Select value={selectedCampusId} onValueChange={setSelectedCampusId}>
                    <SelectTrigger className="h-8 rounded-xl text-xs"><SelectValue placeholder="Select campus" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value={LOOKUP_NONE}>Select campus</SelectItem>
                      {campuses.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.acronym || c.campus_name || `Campus ${c.id}`}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </FieldRow>
                <FieldRow label="Academic Program">
                  <Select value={selectedProgramId} onValueChange={setSelectedProgramId}>
                    <SelectTrigger className="h-8 rounded-xl text-xs"><SelectValue placeholder="Select program" /></SelectTrigger>
                    <SelectContent className="max-h-72 overflow-y-auto">
                      <SelectItem value={LOOKUP_NONE}>Select program</SelectItem>
                      {programs.map((p) => <SelectItem key={p.id} value={String(p.id)}>{p.program_code} - {p.program_name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </FieldRow>
                <FieldRow label="Major Discipline">
                  <Input value="-" readOnly className="h-8 rounded-xl text-xs border-border/60 bg-muted/20" />
                </FieldRow>
                <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground pt-1">
                  <div>Term: <span className="font-medium text-foreground">{selectedCampus?.acronym || "-"}</span></div>
                  <div>No. of Years: <span className="font-medium text-foreground">4</span></div>
                  <div>Total Terms: <span className="font-medium text-foreground">8</span></div>
                </div>
                <div className="grid grid-cols-[1fr_auto] gap-2">
                  <FieldRow label="Curriculum Code">
                    <Input value={selectedCurriculum?.curriculum_code || ""} readOnly className="h-8 rounded-xl text-xs border-border/60 bg-muted/20" />
                  </FieldRow>
                  <Button variant="outline" className="h-8 text-xs mt-6">Save as</Button>
                </div>
                <FieldRow label="Description">
                  <Input value={selectedCurriculum?.description || ""} readOnly className="h-8 rounded-xl text-xs border-border/60 bg-muted/20" />
                </FieldRow>
                <FieldRow label="Notes">
                  <textarea className="w-full h-16 text-xs rounded-xl border border-border/60 bg-muted/20 px-3 py-2 resize-none" readOnly />
                </FieldRow>
                <label className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                  <Checkbox />
                  Locked Curriculum - No more modifications allowed.
                </label>
                <div className="rounded-xl border border-border/60 overflow-hidden">
                  <div className="grid grid-cols-2 text-[11px] font-semibold bg-muted/30 border-b border-border/60">
                    <div className="px-2 py-2 border-r border-border/60">Curriculum Code</div>
                    <div className="px-2 py-2">Description</div>
                  </div>
                  <div className="max-h-48 overflow-y-auto">
                    {curriculums.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setSelectedCurriculumId(String(c.id))}
                        className={cn(
                          "w-full grid grid-cols-2 text-xs text-left border-b border-border/40 hover:bg-muted/20",
                          String(c.id) === selectedCurriculumId && "bg-muted/30"
                        )}
                      >
                        <div className="px-2 py-2 border-r border-border/40">{c.curriculum_code}</div>
                        <div className="px-2 py-2 truncate">{c.description || ""}</div>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs pt-1">
                  <span>Total Curricular Program(s): {curriculums.length}</span>
                  <Button variant="outline" className="h-8 text-xs">Course Outline</Button>
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-border/60 bg-card overflow-hidden flex flex-col min-h-0">
              <div className="grid grid-cols-[110px_1fr_72px_72px_72px_72px_72px] text-[11px] font-semibold bg-muted/30 border-b border-border/60">
                {["Subject Code","Descriptive Title","Lab Unit","Lec Unit","Credit Unit","Lecture Hour","Laboratory Hour"].map((h) => (
                  <div key={h} className="px-2 py-2 border-r border-border/60 last:border-r-0">{h}</div>
                ))}
              </div>
              <ScrollArea className="flex-1 min-h-0">
                {curriculumSubjects.map((s) => (
                  <div key={s.id} className="grid grid-cols-[110px_1fr_72px_72px_72px_72px_72px] text-xs border-b border-border/40">
                    <div className="px-2 py-2 border-r border-border/40">{s.subject_code}</div>
                    <div className="px-2 py-2 border-r border-border/40 truncate">{s.descriptive_title}</div>
                    <div className="px-2 py-2 border-r border-border/40 text-center">{s.laboratory_units ?? 0}</div>
                    <div className="px-2 py-2 border-r border-border/40 text-center">{s.lecture_units ?? 0}</div>
                    <div className="px-2 py-2 border-r border-border/40 text-center">{s.credited_units ?? 0}</div>
                    <div className="px-2 py-2 border-r border-border/40 text-center">{s.lecture_hours ?? 0}</div>
                    <div className="px-2 py-2 text-center">{s.laboratory_hours ?? 0}</div>
                  </div>
                ))}
                {!curriculumSubjects.length && (
                  <div className="px-3 py-8 text-xs text-muted-foreground">No subjects for selected curriculum.</div>
                )}
              </ScrollArea>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full min-h-0 overflow-hidden p-3 flex flex-col">
      <div className="mb-2 inline-flex w-fit max-w-max overflow-hidden rounded-xl border border-border/60 bg-background shadow-sm divide-x divide-border/60">
        <Button
          type="button"
          variant="ghost"
          className="h-8 text-xs rounded-none bg-muted/40 font-semibold"
          onClick={() => setActiveTopTab("courses")}
        >
          Courses Master List
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="h-8 text-xs rounded-none"
          onClick={() => setActiveTopTab("curriculums")}
        >
          Program Curriculums
        </Button>
      </div>
    <div className="grid grid-cols-1 lg:grid-cols-[26rem_1fr] gap-5 flex-1 min-h-0">
      {/* LEFT — Course Form */}
      <div className="flex flex-col gap-0 min-h-0">
        <Card className="rounded-2xl border-border/60 shadow-sm overflow-hidden h-full flex flex-col">
          <CardHeader className="pb-3 border-b border-border/40">
            <div className="flex items-center gap-2">
              <div className="grid h-8 w-8 place-items-center rounded-xl bg-emerald-600 text-white shadow-sm">
                <BookOpen className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-sm font-semibold tracking-tight">Course Information</CardTitle>
                <p className="text-xs text-muted-foreground">
                  {selectedId ? "Editing selected course" : "Creating a new course"}
                </p>
              </div>
            </div>
          </CardHeader>

          <ScrollArea className="h-full">
          <CardContent className="p-4 space-y-5">
            {/* Basic Info */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <BookOpen className="h-3.5 w-3.5" />
                <span className="font-semibold text-foreground">Basic Information</span>
              </div>
              <Separator />
              <FieldRow label="Course Code">
                <Input
                  className="h-9 rounded-xl border-border/60 shadow-sm text-xs font-mono"
                  placeholder="e.g. CS101"
                  value={form.course_code}
                  onChange={(e) => setForm((f) => ({ ...f, course_code: e.target.value }))}
                />
              </FieldRow>
              <FieldRow label="Course Title">
                <Input
                  className="h-9 rounded-xl border-border/60 shadow-sm text-xs"
                  placeholder="Full descriptive title"
                  value={form.course_title}
                  onChange={(e) => setForm((f) => ({ ...f, course_title: e.target.value }))}
                />
              </FieldRow>
              <FieldRow label="Course Description">
                <textarea
                  className="w-full h-16 text-xs rounded-xl border border-border/60 bg-background px-3 py-2 shadow-sm resize-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500/30"
                  placeholder="Brief description of the course..."
                  value={form.course_description}
                  onChange={(e) => setForm((f) => ({ ...f, course_description: e.target.value }))}
                />
              </FieldRow>
            </div>

            {/* Units & Hours */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <FlaskConical className="h-3.5 w-3.5" />
                <span className="font-semibold text-foreground">Units & Hours</span>
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-3">
                {[
                  { key: "laboratory_units", label: "Laboratory Units" },
                  { key: "academic_units_lecture", label: "Academic Units (Lec)" },
                  { key: "credited_units", label: "Credited Units" },
                  { key: "lecture_hours", label: "Lecture Hours" },
                  { key: "laboratory_hours", label: "Laboratory Hours" },
                ].map(({ key, label }) => (
                  <FieldRow key={key} label={label}>
                    <Input
                      type="number"
                      className="h-9 rounded-xl border-border/60 shadow-sm text-xs text-right"
                      value={(form as any)[key]}
                      onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                    />
                  </FieldRow>
                ))}
              </div>
            </div>

            {/* Course Type Flags */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Tag className="h-3.5 w-3.5" />
                <span className="font-semibold text-foreground">Course Type</span>
              </div>
              <Separator />
              <div className="grid grid-cols-1 gap-1.5">
                {checkboxFields.map((x) => (
                  <label key={String(x.key)} className="flex items-center gap-2 text-xs cursor-pointer hover:text-foreground text-muted-foreground group">
                    <Checkbox
                      checked={Boolean(form[x.key])}
                      onCheckedChange={(v) => setForm((f) => ({ ...f, [x.key]: !!v }))}
                      className="data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
                    />
                    <span className="group-hover:text-foreground transition-colors">{x.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Aliases */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Tag className="h-3.5 w-3.5" />
                <span className="font-semibold text-foreground">Aliases & Reference</span>
              </div>
              <Separator />
              <div className="grid grid-cols-1 gap-3">
                <FieldRow label="Code Alias 1">
                  <Input className="h-9 rounded-xl border-border/60 shadow-sm text-xs font-mono" value={form.code_alias_1} onChange={(e) => setForm((f) => ({ ...f, code_alias_1: e.target.value }))} />
                </FieldRow>
                <FieldRow label="Code Alias 2">
                  <Input className="h-9 rounded-xl border-border/60 shadow-sm text-xs font-mono" value={form.code_alias_2} onChange={(e) => setForm((f) => ({ ...f, code_alias_2: e.target.value }))} />
                </FieldRow>
                <FieldRow label="Parent Code">
                  <Input className="h-9 rounded-xl border-border/60 shadow-sm text-xs font-mono" value={form.parent_code} onChange={(e) => setForm((f) => ({ ...f, parent_code: e.target.value }))} />
                </FieldRow>
              </div>
            </div>

            {/* Other Information */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Info className="h-3.5 w-3.5" />
                <span className="font-semibold text-foreground">Other Information</span>
              </div>
              <Separator />

              <FieldRow label="Course Level">
                <Select value={form.course_level || COURSE_LEVEL_NONE} onValueChange={(v) => setForm((f) => ({ ...f, course_level: v === COURSE_LEVEL_NONE ? "" : v }))}>
                  <SelectTrigger className="h-9 rounded-xl border-border/60 text-xs shadow-sm"><SelectValue placeholder="Select course level" /></SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value={COURSE_LEVEL_NONE} className="text-xs">(None)</SelectItem>
                    {form.course_level && !(COURSE_LEVEL_OPTIONS as readonly string[]).includes(form.course_level) && (
                      <SelectItem value={form.course_level} className="text-xs">{form.course_level}</SelectItem>
                    )}
                    {COURSE_LEVEL_OPTIONS.map((opt) => (
                      <SelectItem key={opt} value={opt} className="text-xs">{opt}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FieldRow>

              <FieldRow label="Course Area">
                <div className="flex gap-1.5">
                  <Select value={form.course_area || LOOKUP_NONE} onValueChange={(v) => setForm((f) => ({ ...f, course_area: v === LOOKUP_NONE ? "" : v }))}>
                    <SelectTrigger className="h-9 flex-1 rounded-xl border-border/60 text-xs shadow-sm"><SelectValue placeholder="Select course area" /></SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value={LOOKUP_NONE} className="text-xs">(None)</SelectItem>
                      {form.course_area && !areaNames.includes(form.course_area) && <SelectItem value={form.course_area} className="text-xs">{form.course_area}</SelectItem>}
                      {subjectAreas.map((a) => <SelectItem key={a.id} value={a.area_name} className="text-xs">{a.area_name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Button type="button" variant="outline" size="icon" className="h-9 w-9 shrink-0 rounded-xl border-border/60" title="Maintain subject areas" onClick={() => setMaintainAreasOpen(true)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </FieldRow>

              <FieldRow label="Course Mode">
                <div className="flex gap-1.5">
                  <Select value={form.course_mode || LOOKUP_NONE} onValueChange={(v) => setForm((f) => ({ ...f, course_mode: v === LOOKUP_NONE ? "" : v }))}>
                    <SelectTrigger className="h-9 flex-1 rounded-xl border-border/60 text-xs shadow-sm"><SelectValue placeholder="Select course mode" /></SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value={LOOKUP_NONE} className="text-xs">(None)</SelectItem>
                      {form.course_mode && !modeNames.includes(form.course_mode) && <SelectItem value={form.course_mode} className="text-xs">{form.course_mode}</SelectItem>}
                      {subjectModes.map((m) => <SelectItem key={m.id} value={m.mode_name} className="text-xs">{m.mode_name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Button type="button" variant="outline" size="icon" className="h-9 w-9 shrink-0 rounded-xl border-border/60" title="Maintain subject modes" onClick={() => setMaintainModesOpen(true)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </FieldRow>

              <div className="grid grid-cols-2 gap-3">
                <FieldRow label="Min Class Limit">
                  <Input type="number" className="h-9 rounded-xl border-border/60 shadow-sm text-xs" value={form.default_min_class_limit} onChange={(e) => setForm((f) => ({ ...f, default_min_class_limit: e.target.value }))} />
                </FieldRow>
                <FieldRow label="Max Class Limit">
                  <Input type="number" className="h-9 rounded-xl border-border/60 shadow-sm text-xs" value={form.default_max_class_limit} onChange={(e) => setForm((f) => ({ ...f, default_max_class_limit: e.target.value }))} />
                </FieldRow>
              </div>

              <div className="flex flex-col gap-2 pt-1">
                <label className="flex items-center gap-2 text-xs cursor-pointer text-muted-foreground hover:text-foreground">
                  <Checkbox checked={form.is_locked_subject} onCheckedChange={(v) => setForm((f) => ({ ...f, is_locked_subject: !!v }))} className="data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600" />
                  <Lock className="h-3 w-3" />
                  Locked Subject
                </label>
                <label className="flex items-center gap-2 text-xs cursor-pointer text-muted-foreground hover:text-foreground">
                  <Checkbox checked={form.is_inactive} onCheckedChange={(v) => setForm((f) => ({ ...f, is_inactive: !!v }))} className="data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500" />
                  <EyeOff className="h-3 w-3" />
                  Inactive Record
                </label>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-1">
              <Button type="button" variant="outline" onClick={newRecord} className="h-9 flex-1 rounded-xl text-xs border-border/60 gap-1.5">
                <Plus className="h-3.5 w-3.5" />New
              </Button>
              <Button type="button" onClick={save} className="h-9 flex-1 rounded-xl text-xs bg-emerald-600 hover:bg-emerald-700 gap-1.5">
                <Save className="h-3.5 w-3.5" />Save
              </Button>
              <Button type="button" variant="destructive" onClick={remove} disabled={!selectedId} className="h-9 rounded-xl text-xs gap-1.5">
                <Trash2 className="h-3.5 w-3.5" />Delete
              </Button>
            </div>
          </CardContent>
          </ScrollArea>
        </Card>
      </div>

      {/* RIGHT — Course List */}
      <Card className="rounded-2xl border-border/60 shadow-sm overflow-hidden flex flex-col min-h-0">
        <CardHeader className="pb-3 border-b border-border/40">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="grid h-8 w-8 place-items-center rounded-xl bg-muted">
                <BookOpen className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-sm font-semibold tracking-tight">Courses Master List</CardTitle>
                <p className="text-xs text-muted-foreground">
                  {filteredRows.length} record{filteredRows.length !== 1 ? "s" : ""}
                  {search.trim() ? ` (filtered from ${rows.length})` : ""}
                </p>
              </div>
            </div>
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <Input
                className="h-9 rounded-xl border-border/60 shadow-sm pl-9 text-xs"
                placeholder="Search by code or title…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>

        {/* Table Header */}
        <div className="grid grid-cols-12 border-b border-border/40 bg-muted/30">
          {[
            { label: "Course Code", span: "col-span-2" },
            { label: "Descriptive Title", span: "col-span-5" },
            { label: "Lab", span: "col-span-1" },
            { label: "Lec", span: "col-span-1" },
            { label: "Credit", span: "col-span-1" },
            { label: "Lec Hr", span: "col-span-1" },
            { label: "Lab Hr", span: "col-span-1" },
          ].map(({ label, span }, i) => (
            <div key={i} className={cn(span, "px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground border-r last:border-r-0 border-border/40 text-center first:text-left")}>
              {label}
            </div>
          ))}
        </div>

        {/* Table Rows */}
        <ScrollArea className="flex-1 min-h-0">
          {filteredRows.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <BookOpen className="h-8 w-8 mb-3 opacity-30" />
              <p className="text-sm font-medium">{search ? "No matching courses" : "No courses yet"}</p>
              <p className="text-xs opacity-60 mt-1">{search ? "Try a different keyword" : "Use the form to add a new course"}</p>
            </div>
          ) : (
            filteredRows.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setSelectedId(r.id)}
                className={cn(
                  "w-full grid grid-cols-12 text-left border-b border-border/30 transition-colors hover:bg-emerald-50 dark:hover:bg-emerald-950/20",
                  selectedId === r.id && "bg-emerald-50 dark:bg-emerald-950/30 border-l-2 border-l-emerald-500"
                )}
              >
                <div className="col-span-2 px-3 py-2.5 text-xs font-semibold font-mono text-emerald-700 dark:text-emerald-400 border-r border-border/30 truncate">{r.course_code}</div>
                <div className="col-span-5 px-3 py-2.5 text-xs border-r border-border/30 truncate">{r.course_title}</div>
                <div className="col-span-1 px-2 py-2.5 text-xs text-center border-r border-border/30">{String(r.laboratory_units ?? 0)}</div>
                <div className="col-span-1 px-2 py-2.5 text-xs text-center border-r border-border/30">{String(r.academic_units_lecture ?? 0)}</div>
                <div className="col-span-1 px-2 py-2.5 text-xs text-center border-r border-border/30">{String(r.credited_units ?? 0)}</div>
                <div className="col-span-1 px-2 py-2.5 text-xs text-center border-r border-border/30">{String(r.lecture_hours ?? 0)}</div>
                <div className="col-span-1 px-2 py-2.5 text-xs text-center">{String(r.laboratory_hours ?? 0)}</div>
              </button>
            ))
          )}
        </ScrollArea>
      </Card>

      <MaintainSubjectAreasDialog open={maintainAreasOpen} onOpenChange={setMaintainAreasOpen} onChanged={() => void loadSubjectLookups()} />
      <MaintainSubjectModesDialog open={maintainModesOpen} onOpenChange={setMaintainModesOpen} onChanged={() => void loadSubjectLookups()} />
    </div>
    </div>
  );
}
