"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { CoursesMasterListModule } from "@/components/colleges/CoursesMasterListModule";
import {
  BookOpen,
  GraduationCap,
  Plus,
  Save,
  Trash2,
  Lock,
  Unlock,
  ListChecks,
  FlaskConical,
  BookCopy,
  ClipboardList,
  X,
  CheckCircle2,
} from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL;

type Campus = { id: number; acronym: string; campus_name: string | null };
type Program = {
  id: number;
  campus_id: number;
  program_code: string;
  program_name: string;
};
type MajorDiscipline = {
  id: number;
  major_code: string;
  major_discipline: string;
};
type CurriculumRow = {
  id: number;
  campus_id: number;
  academic_program_id: number;
  major_discipline_id: number | null;
  term_label: string | null;
  no_of_years: number | null;
  total_terms: number | null;
  curriculum_code: string;
  description: string | null;
  notes: string | null;
  is_locked: boolean;
};
type SubjectRow = {
  id: number;
  curriculum_id: number;
  subject_code: string;
  descriptive_title: string;
  lab_unit: string | number | null;
  lec_unit: string | number | null;
  credit_unit: string | number | null;
  lecture_hour: string | number | null;
  laboratory_hour: string | number | null;
};

const emptyCurriculumForm = {
  campus_id: "",
  academic_program_id: "",
  major_discipline_id: "none",
  term_label: "1ST SEMESTER",
  no_of_years: "",
  total_terms: "",
  curriculum_code: "",
  description: "",
  notes: "",
  is_locked: false,
};

const emptySubjectForm = {
  subject_code: "",
  descriptive_title: "",
  lab_unit: "0",
  lec_unit: "0",
  credit_unit: "0",
  lecture_hour: "0",
  laboratory_hour: "0",
};

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-[11px] text-muted-foreground font-medium pl-0.5">{label}</Label>
      {children}
    </div>
  );
}

export function ProgramCurriculumsModule() {
  const [activeTab, setActiveTab] = useState<"courses" | "curriculums">("curriculums");
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [disciplines, setDisciplines] = useState<MajorDiscipline[]>([]);
  const [rows, setRows] = useState<CurriculumRow[]>([]);
  const [subjects, setSubjects] = useState<SubjectRow[]>([]);
  const [selectedCurriculumId, setSelectedCurriculumId] = useState<number | null>(null);
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | null>(null);
  const [curriculumForm, setCurriculumForm] = useState(emptyCurriculumForm);
  const [subjectForm, setSubjectForm] = useState(emptySubjectForm);

  const selectedCurriculum = useMemo(
    () => rows.find((r) => r.id === selectedCurriculumId) ?? null,
    [rows, selectedCurriculumId]
  );

  const filteredPrograms = useMemo(() => {
    const campusId = parseInt(curriculumForm.campus_id, 10);
    if (!Number.isFinite(campusId)) return [];
    return programs.filter((p) => p.campus_id === campusId);
  }, [programs, curriculumForm.campus_id]);

  const loadReferences = async () => {
    if (!API) return;
    try {
      const [campusRes, progRes, discRes] = await Promise.all([
        fetch(`${API}/api/campuses`),
        fetch(`${API}/api/academic-programs`),
        fetch(`${API}/api/ched-major-disciplines`),
      ]);
      if (campusRes.ok) {
        const c = (await campusRes.json()) as Campus[];
        setCampuses(c);
        if (c.length > 0) {
          setCurriculumForm((f) => (f.campus_id ? f : { ...f, campus_id: String(c[0].id) }));
        }
      }
      if (progRes.ok) setPrograms((await progRes.json()) as Program[]);
      if (discRes.ok) setDisciplines((await discRes.json()) as MajorDiscipline[]);
    } catch {
      toast({ title: "Load failed", description: "Failed to load program dependencies.", variant: "destructive" });
    }
  };

  const loadCurriculums = async (campusId?: string, programId?: string) => {
    if (!API) return;
    const q = new URLSearchParams();
    if (campusId) q.set("campus_id", campusId);
    if (programId) q.set("academic_program_id", programId);
    try {
      const res = await fetch(`${API}/api/program-curriculums?${q.toString()}`);
      if (!res.ok) return;
      setRows((await res.json()) as CurriculumRow[]);
    } catch {
      // keep previous state
    }
  };

  const loadSubjects = async (curriculumId: number) => {
    if (!API) return;
    try {
      const res = await fetch(`${API}/api/program-curriculums/${curriculumId}/subjects`);
      if (!res.ok) return;
      setSubjects((await res.json()) as SubjectRow[]);
    } catch {
      setSubjects([]);
    }
  };

  useEffect(() => { void loadReferences(); }, []);
  useEffect(() => { void loadCurriculums(curriculumForm.campus_id, curriculumForm.academic_program_id); }, [curriculumForm.campus_id, curriculumForm.academic_program_id]);
  useEffect(() => {
    if (!selectedCurriculum) { setSubjects([]); return; }
    setCurriculumForm({
      campus_id: String(selectedCurriculum.campus_id),
      academic_program_id: String(selectedCurriculum.academic_program_id),
      major_discipline_id: selectedCurriculum.major_discipline_id ? String(selectedCurriculum.major_discipline_id) : "none",
      term_label: selectedCurriculum.term_label ?? "",
      no_of_years: selectedCurriculum.no_of_years ? String(selectedCurriculum.no_of_years) : "",
      total_terms: selectedCurriculum.total_terms ? String(selectedCurriculum.total_terms) : "",
      curriculum_code: selectedCurriculum.curriculum_code,
      description: selectedCurriculum.description ?? "",
      notes: selectedCurriculum.notes ?? "",
      is_locked: selectedCurriculum.is_locked,
    });
    void loadSubjects(selectedCurriculum.id);
  }, [selectedCurriculum]);

  const saveCurriculum = async () => {
    if (!API) return;
    const campus_id = parseInt(curriculumForm.campus_id, 10);
    const academic_program_id = parseInt(curriculumForm.academic_program_id, 10);
    if (!Number.isFinite(campus_id) || !Number.isFinite(academic_program_id) || !curriculumForm.curriculum_code.trim()) {
      toast({ title: "Validation error", description: "Campus, Academic Program, and Curriculum Code are required.", variant: "destructive" });
      return;
    }
    const payload = {
      campus_id,
      academic_program_id,
      major_discipline_id: curriculumForm.major_discipline_id && curriculumForm.major_discipline_id !== "none"
        ? parseInt(curriculumForm.major_discipline_id, 10) : null,
      term_label: curriculumForm.term_label || null,
      no_of_years: curriculumForm.no_of_years ? parseInt(curriculumForm.no_of_years, 10) : null,
      total_terms: curriculumForm.total_terms ? parseInt(curriculumForm.total_terms, 10) : null,
      curriculum_code: curriculumForm.curriculum_code.trim(),
      description: curriculumForm.description || null,
      notes: curriculumForm.notes || null,
      is_locked: curriculumForm.is_locked,
    };
    try {
      const url = selectedCurriculumId ? `${API}/api/program-curriculums/${selectedCurriculumId}` : `${API}/api/program-curriculums`;
      const res = await fetch(url, { method: selectedCurriculumId ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(result?.error || "Failed to save curriculum");
      setSelectedCurriculumId(result.id);
      await loadCurriculums(curriculumForm.campus_id, curriculumForm.academic_program_id);
      toast({ title: "Saved", description: "Curriculum record saved." });
    } catch (err) {
      toast({ title: "Save failed", description: err instanceof Error ? err.message : "Failed to save curriculum", variant: "destructive" });
    }
  };

  const newCurriculum = () => {
    setSelectedCurriculumId(null);
    setSelectedSubjectId(null);
    setSubjects([]);
    setSubjectForm(emptySubjectForm);
    setCurriculumForm((f) => ({ ...emptyCurriculumForm, campus_id: f.campus_id || (campuses[0] ? String(campuses[0].id) : ""), academic_program_id: "" }));
  };

  const deleteCurriculum = async () => {
    if (!API || !selectedCurriculumId) return;
    try {
      const res = await fetch(`${API}/api/program-curriculums/${selectedCurriculumId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete curriculum");
      newCurriculum();
      await loadCurriculums(curriculumForm.campus_id, curriculumForm.academic_program_id);
      toast({ title: "Deleted", description: "Curriculum deleted." });
    } catch {
      toast({ title: "Delete failed", description: "Failed to delete curriculum.", variant: "destructive" });
    }
  };

  const saveSubject = async () => {
    if (!API || !selectedCurriculumId) return;
    if (!subjectForm.subject_code.trim() || !subjectForm.descriptive_title.trim()) {
      toast({ title: "Validation error", description: "Subject code and descriptive title are required.", variant: "destructive" });
      return;
    }
    const payload = {
      subject_code: subjectForm.subject_code,
      descriptive_title: subjectForm.descriptive_title,
      lab_unit: parseFloat(subjectForm.lab_unit || "0"),
      lec_unit: parseFloat(subjectForm.lec_unit || "0"),
      credit_unit: parseFloat(subjectForm.credit_unit || "0"),
      lecture_hour: parseFloat(subjectForm.lecture_hour || "0"),
      laboratory_hour: parseFloat(subjectForm.laboratory_hour || "0"),
    };
    try {
      const url = selectedSubjectId ? `${API}/api/program-curriculum-subjects/${selectedSubjectId}` : `${API}/api/program-curriculums/${selectedCurriculumId}/subjects`;
      const method = selectedSubjectId ? "PUT" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(result?.error || "Failed to save subject");
      await loadSubjects(selectedCurriculumId);
      setSelectedSubjectId(null);
      setSubjectForm(emptySubjectForm);
      toast({ title: "Saved", description: "Subject saved." });
    } catch (err) {
      toast({ title: "Save failed", description: err instanceof Error ? err.message : "Failed to save subject", variant: "destructive" });
    }
  };

  const deleteSubject = async () => {
    if (!API || !selectedSubjectId || !selectedCurriculumId) return;
    try {
      const res = await fetch(`${API}/api/program-curriculum-subjects/${selectedSubjectId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete subject");
      await loadSubjects(selectedCurriculumId);
      setSelectedSubjectId(null);
      setSubjectForm(emptySubjectForm);
      toast({ title: "Deleted", description: "Subject deleted." });
    } catch {
      toast({ title: "Delete failed", description: "Failed to delete subject.", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-0">
      {/* Tab Bar */}
      <div className="flex gap-1 px-6 pt-2 border-b border-border/60 bg-background">
        {(["courses", "curriculums"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "px-4 py-2 text-xs font-semibold rounded-t-xl border border-b-0 transition-colors",
              activeTab === tab
                ? "bg-background border-border/60 text-emerald-700 dark:text-emerald-400 -mb-px z-10"
                : "bg-muted/40 border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {tab === "courses" ? "Courses Master List" : "Program Curriculums"}
          </button>
        ))}
      </div>

      {activeTab === "courses" ? (
        <CoursesMasterListModule />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[22rem_1fr] gap-5 p-5">
          {/* LEFT — Curriculum Form + List */}
          <div className="flex flex-col gap-4">
            <Card className="rounded-2xl border-border/60 shadow-sm overflow-hidden">
              <CardHeader className="pb-3 border-b border-border/40">
                <div className="flex items-center gap-2">
                  <div className="grid h-8 w-8 place-items-center rounded-xl bg-emerald-600 text-white shadow-sm">
                    <GraduationCap className="h-4 w-4" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-semibold tracking-tight">Curriculum Details</CardTitle>
                    <p className="text-xs text-muted-foreground">
                      {selectedCurriculumId ? "Editing selected curriculum" : "Creating a new curriculum"}
                    </p>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-4 space-y-4">
                {/* Campus + Program */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <BookOpen className="h-3.5 w-3.5" />
                    <span className="font-semibold text-foreground">General Information</span>
                  </div>
                  <Separator />

                  <FieldRow label="Campus">
                    <Select
                      value={curriculumForm.campus_id}
                      onValueChange={(v) => { setSelectedCurriculumId(null); setCurriculumForm((f) => ({ ...f, campus_id: v, academic_program_id: "" })); }}
                    >
                      <SelectTrigger className="h-9 rounded-xl border-border/60 text-xs shadow-sm">
                        <SelectValue placeholder="Select campus" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        {campuses.map((c) => (
                          <SelectItem key={c.id} value={String(c.id)} className="text-xs">
                            {c.acronym}{c.campus_name ? ` – ${c.campus_name}` : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FieldRow>

                  <FieldRow label="Academic Program">
                    <Select
                      value={curriculumForm.academic_program_id}
                      onValueChange={(v) => { setSelectedCurriculumId(null); setCurriculumForm((f) => ({ ...f, academic_program_id: v })); }}
                    >
                      <SelectTrigger className="h-9 rounded-xl border-border/60 text-xs shadow-sm">
                        <SelectValue placeholder="Select program" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        {filteredPrograms.map((p) => (
                          <SelectItem key={p.id} value={String(p.id)} className="text-xs">
                            {p.program_code} – {p.program_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FieldRow>

                  <FieldRow label="Major Discipline">
                    <Select
                      value={curriculumForm.major_discipline_id}
                      onValueChange={(v) => setCurriculumForm((f) => ({ ...f, major_discipline_id: v }))}
                    >
                      <SelectTrigger className="h-9 rounded-xl border-border/60 text-xs shadow-sm">
                        <SelectValue placeholder="Select discipline" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="none" className="text-xs">— None —</SelectItem>
                        {disciplines.map((d) => (
                          <SelectItem key={d.id} value={String(d.id)} className="text-xs">
                            {d.major_code} – {d.major_discipline}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FieldRow>
                </div>

                {/* Curriculum Specifics */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <ClipboardList className="h-3.5 w-3.5" />
                    <span className="font-semibold text-foreground">Curriculum Info</span>
                  </div>
                  <Separator />

                  <FieldRow label="Curriculum Code">
                    <Input
                      className="h-9 rounded-xl border-border/60 shadow-sm text-xs font-mono"
                      placeholder="e.g. BSCS-2024"
                      value={curriculumForm.curriculum_code}
                      onChange={(e) => setCurriculumForm((f) => ({ ...f, curriculum_code: e.target.value }))}
                    />
                  </FieldRow>

                  <FieldRow label="Description">
                    <Input
                      className="h-9 rounded-xl border-border/60 shadow-sm text-xs"
                      placeholder="Brief description"
                      value={curriculumForm.description}
                      onChange={(e) => setCurriculumForm((f) => ({ ...f, description: e.target.value }))}
                    />
                  </FieldRow>

                  <FieldRow label="Notes">
                    <textarea
                      className="w-full h-16 text-xs rounded-xl border border-border/60 bg-background px-3 py-2 shadow-sm resize-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500/30"
                      placeholder="Additional notes..."
                      value={curriculumForm.notes}
                      onChange={(e) => setCurriculumForm((f) => ({ ...f, notes: e.target.value }))}
                    />
                  </FieldRow>

                  <div className="grid grid-cols-3 gap-2">
                    <FieldRow label="Term">
                      <Input
                        className="h-9 rounded-xl border-border/60 shadow-sm text-xs"
                        placeholder="e.g. 1ST SEM"
                        value={curriculumForm.term_label}
                        onChange={(e) => setCurriculumForm((f) => ({ ...f, term_label: e.target.value }))}
                      />
                    </FieldRow>
                    <FieldRow label="No. of Years">
                      <Input
                        type="number"
                        className="h-9 rounded-xl border-border/60 shadow-sm text-xs"
                        placeholder="4"
                        value={curriculumForm.no_of_years}
                        onChange={(e) => setCurriculumForm((f) => ({ ...f, no_of_years: e.target.value }))}
                      />
                    </FieldRow>
                    <FieldRow label="Total Terms">
                      <Input
                        type="number"
                        className="h-9 rounded-xl border-border/60 shadow-sm text-xs"
                        placeholder="8"
                        value={curriculumForm.total_terms}
                        onChange={(e) => setCurriculumForm((f) => ({ ...f, total_terms: e.target.value }))}
                      />
                    </FieldRow>
                  </div>

                  <div className="flex items-center gap-2 px-1 pt-1">
                    <Checkbox
                      id="locked"
                      checked={curriculumForm.is_locked}
                      onCheckedChange={(v) => setCurriculumForm((f) => ({ ...f, is_locked: !!v }))}
                    />
                    <label htmlFor="locked" className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground cursor-pointer">
                      {curriculumForm.is_locked ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
                      Locked Curriculum
                    </label>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={newCurriculum}
                    className="h-9 flex-1 rounded-xl text-xs border-border/60 gap-1.5"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    New
                  </Button>
                  <Button
                    type="button"
                    onClick={saveCurriculum}
                    className="h-9 flex-1 rounded-xl text-xs bg-emerald-600 hover:bg-emerald-700 gap-1.5"
                  >
                    <Save className="h-3.5 w-3.5" />
                    Save
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={deleteCurriculum}
                    disabled={!selectedCurriculumId}
                    className="h-9 rounded-xl text-xs gap-1.5"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Curriculum List */}
            <Card className="rounded-2xl border-border/60 shadow-sm overflow-hidden">
              <CardHeader className="pb-2 border-b border-border/40">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold tracking-tight">Curriculum Programs</CardTitle>
                  <Badge variant="secondary" className="text-xs rounded-lg">
                    {rows.length} records
                  </Badge>
                </div>
              </CardHeader>
              <div className="grid grid-cols-2 border-b border-border/40 bg-muted/30">
                <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground border-r border-border/40">Code</div>
                <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Description</div>
              </div>
              <ScrollArea className="h-44">
                {rows.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                    <ListChecks className="h-6 w-6 mb-2 opacity-40" />
                    <p className="text-xs">No curriculum records yet</p>
                  </div>
                ) : (
                  rows.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setSelectedCurriculumId(r.id)}
                      className={cn(
                        "w-full grid grid-cols-2 text-left border-b border-border/30 transition-colors hover:bg-emerald-50 dark:hover:bg-emerald-950/20",
                        selectedCurriculumId === r.id && "bg-emerald-50 dark:bg-emerald-950/30 border-l-2 border-l-emerald-500"
                      )}
                    >
                      <div className="px-3 py-2 text-xs font-semibold font-mono border-r border-border/30 text-emerald-700 dark:text-emerald-400 truncate">{r.curriculum_code}</div>
                      <div className="px-3 py-2 text-xs text-muted-foreground truncate">{r.description || "—"}</div>
                    </button>
                  ))
                )}
              </ScrollArea>
            </Card>
          </div>

          {/* RIGHT — Subjects Panel */}
          <Card className="rounded-2xl border-border/60 shadow-sm overflow-hidden flex flex-col">
            <CardHeader className="pb-3 border-b border-border/40">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <div className="grid h-8 w-8 place-items-center rounded-xl bg-muted">
                    <BookCopy className="h-4 w-4" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-semibold tracking-tight">Subjects</CardTitle>
                    <p className="text-xs text-muted-foreground">
                      {selectedCurriculumId
                        ? `${subjects.length} subject${subjects.length !== 1 ? "s" : ""} in this curriculum`
                        : "Select a curriculum to manage subjects"}
                    </p>
                  </div>
                </div>
                {selectedCurriculumId && (
                  <Badge className="bg-emerald-100 text-emerald-700 rounded-lg text-xs border-0">
                    {selectedCurriculum?.curriculum_code}
                  </Badge>
                )}
              </div>
            </CardHeader>

            {/* Subject Input Row */}
            <div className="p-4 border-b border-border/40 bg-muted/20">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                <FlaskConical className="h-3.5 w-3.5" />
                <span className="font-semibold text-foreground">
                  {selectedSubjectId ? "Edit Subject" : "Add Subject"}
                </span>
              </div>
              <div className="grid grid-cols-12 gap-2">
                <div className="col-span-2 space-y-1">
                  <Label className="text-[10px] text-muted-foreground font-medium">Code</Label>
                  <Input
                    className="h-9 rounded-xl border-border/60 shadow-sm text-xs font-mono"
                    placeholder="SUBJ101"
                    value={subjectForm.subject_code}
                    onChange={(e) => setSubjectForm((f) => ({ ...f, subject_code: e.target.value }))}
                  />
                </div>
                <div className="col-span-4 space-y-1">
                  <Label className="text-[10px] text-muted-foreground font-medium">Descriptive Title</Label>
                  <Input
                    className="h-9 rounded-xl border-border/60 shadow-sm text-xs"
                    placeholder="Subject name"
                    value={subjectForm.descriptive_title}
                    onChange={(e) => setSubjectForm((f) => ({ ...f, descriptive_title: e.target.value }))}
                  />
                </div>
                {[
                  { key: "lab_unit", label: "Lab" },
                  { key: "lec_unit", label: "Lec" },
                  { key: "credit_unit", label: "Credit" },
                  { key: "lecture_hour", label: "Lec Hr" },
                  { key: "laboratory_hour", label: "Lab Hr" },
                ].map(({ key, label }) => (
                  <div key={key} className="col-span-1 space-y-1">
                    <Label className="text-[10px] text-muted-foreground font-medium">{label}</Label>
                    <Input
                      type="number"
                      className="h-9 rounded-xl border-border/60 shadow-sm text-xs text-center"
                      value={(subjectForm as any)[key]}
                      onChange={(e) => setSubjectForm((f) => ({ ...f, [key]: e.target.value }))}
                    />
                  </div>
                ))}
              </div>
              <div className="flex gap-2 mt-3">
                <Button
                  type="button"
                  onClick={saveSubject}
                  disabled={!selectedCurriculumId}
                  className="h-8 rounded-xl text-xs bg-emerald-600 hover:bg-emerald-700 gap-1.5"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {selectedSubjectId ? "Save Subject" : "Add Subject"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => { setSelectedSubjectId(null); setSubjectForm(emptySubjectForm); }}
                  className="h-8 rounded-xl text-xs border-border/60 gap-1.5"
                >
                  <X className="h-3.5 w-3.5" />
                  Clear
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={deleteSubject}
                  disabled={!selectedSubjectId}
                  className="h-8 rounded-xl text-xs gap-1.5"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </Button>
              </div>
            </div>

            {/* Subject Table Header */}
            <div className="grid grid-cols-12 border-b border-border/40 bg-muted/30">
              {[
                { label: "Subject Code", span: "col-span-2" },
                { label: "Descriptive Title", span: "col-span-4" },
                { label: "Lab", span: "col-span-1" },
                { label: "Lec", span: "col-span-1" },
                { label: "Credit", span: "col-span-1" },
                { label: "Lec Hr", span: "col-span-1" },
                { label: "Lab Hr", span: "col-span-2" },
              ].map(({ label, span }, i) => (
                <div key={i} className={cn(span, "px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground border-r last:border-r-0 border-border/40 text-center first:text-left")}>
                  {label}
                </div>
              ))}
            </div>

            {/* Subject Rows */}
            <ScrollArea className="flex-1">
              {subjects.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                  <BookCopy className="h-8 w-8 mb-3 opacity-30" />
                  <p className="text-sm font-medium">No subjects added</p>
                  <p className="text-xs opacity-60 mt-1">
                    {selectedCurriculumId ? "Use the form above to add subjects" : "Select a curriculum first"}
                  </p>
                </div>
              ) : (
                subjects.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => {
                      setSelectedSubjectId(s.id);
                      setSubjectForm({
                        subject_code: s.subject_code,
                        descriptive_title: s.descriptive_title,
                        lab_unit: String(s.lab_unit ?? 0),
                        lec_unit: String(s.lec_unit ?? 0),
                        credit_unit: String(s.credit_unit ?? 0),
                        lecture_hour: String(s.lecture_hour ?? 0),
                        laboratory_hour: String(s.laboratory_hour ?? 0),
                      });
                    }}
                    className={cn(
                      "w-full grid grid-cols-12 text-left border-b border-border/30 transition-colors hover:bg-emerald-50 dark:hover:bg-emerald-950/20",
                      selectedSubjectId === s.id && "bg-emerald-50 dark:bg-emerald-950/30 border-l-2 border-l-emerald-500"
                    )}
                  >
                    <div className="col-span-2 px-3 py-2.5 text-xs font-semibold font-mono text-emerald-700 dark:text-emerald-400 border-r border-border/30">{s.subject_code}</div>
                    <div className="col-span-4 px-3 py-2.5 text-xs border-r border-border/30 truncate">{s.descriptive_title}</div>
                    <div className="col-span-1 px-3 py-2.5 text-xs text-center border-r border-border/30">{String(s.lab_unit ?? 0)}</div>
                    <div className="col-span-1 px-3 py-2.5 text-xs text-center border-r border-border/30">{String(s.lec_unit ?? 0)}</div>
                    <div className="col-span-1 px-3 py-2.5 text-xs text-center border-r border-border/30">{String(s.credit_unit ?? 0)}</div>
                    <div className="col-span-1 px-3 py-2.5 text-xs text-center border-r border-border/30">{String(s.lecture_hour ?? 0)}</div>
                    <div className="col-span-2 px-3 py-2.5 text-xs text-center">{String(s.laboratory_hour ?? 0)}</div>
                  </button>
                ))
              )}
            </ScrollArea>
          </Card>
        </div>
      )}
    </div>
  );
}
