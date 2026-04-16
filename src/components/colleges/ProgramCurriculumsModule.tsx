"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { CoursesMasterListModule } from "@/components/colleges/CoursesMasterListModule";

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

  useEffect(() => {
    void loadReferences();
  }, []);

  useEffect(() => {
    void loadCurriculums(curriculumForm.campus_id, curriculumForm.academic_program_id);
  }, [curriculumForm.campus_id, curriculumForm.academic_program_id]);

  useEffect(() => {
    if (!selectedCurriculum) {
      setSubjects([]);
      return;
    }
    setCurriculumForm({
      campus_id: String(selectedCurriculum.campus_id),
      academic_program_id: String(selectedCurriculum.academic_program_id),
      major_discipline_id: selectedCurriculum.major_discipline_id
        ? String(selectedCurriculum.major_discipline_id)
        : "none",
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
      toast({
        title: "Validation error",
        description: "Campus, Academic Program, and Curriculum Code are required.",
        variant: "destructive",
      });
      return;
    }
    const payload = {
      campus_id,
      academic_program_id,
      major_discipline_id:
        curriculumForm.major_discipline_id && curriculumForm.major_discipline_id !== "none"
          ? parseInt(curriculumForm.major_discipline_id, 10)
          : null,
      term_label: curriculumForm.term_label || null,
      no_of_years: curriculumForm.no_of_years ? parseInt(curriculumForm.no_of_years, 10) : null,
      total_terms: curriculumForm.total_terms ? parseInt(curriculumForm.total_terms, 10) : null,
      curriculum_code: curriculumForm.curriculum_code.trim(),
      description: curriculumForm.description || null,
      notes: curriculumForm.notes || null,
      is_locked: curriculumForm.is_locked,
    };
    try {
      const url = selectedCurriculumId
        ? `${API}/api/program-curriculums/${selectedCurriculumId}`
        : `${API}/api/program-curriculums`;
      const res = await fetch(url, {
        method: selectedCurriculumId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(result?.error || "Failed to save curriculum");
      setSelectedCurriculumId(result.id);
      await loadCurriculums(curriculumForm.campus_id, curriculumForm.academic_program_id);
      toast({ title: "Saved", description: "Curriculum record saved." });
    } catch (err) {
      toast({
        title: "Save failed",
        description: err instanceof Error ? err.message : "Failed to save curriculum",
        variant: "destructive",
      });
    }
  };

  const newCurriculum = () => {
    setSelectedCurriculumId(null);
    setSelectedSubjectId(null);
    setSubjects([]);
    setSubjectForm(emptySubjectForm);
    setCurriculumForm((f) => ({
      ...emptyCurriculumForm,
      campus_id: f.campus_id || (campuses[0] ? String(campuses[0].id) : ""),
      academic_program_id: "",
    }));
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
      toast({
        title: "Validation error",
        description: "Subject code and descriptive title are required.",
        variant: "destructive",
      });
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
      const url = selectedSubjectId
        ? `${API}/api/program-curriculum-subjects/${selectedSubjectId}`
        : `${API}/api/program-curriculums/${selectedCurriculumId}/subjects`;
      const method = selectedSubjectId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(result?.error || "Failed to save subject");
      await loadSubjects(selectedCurriculumId);
      setSelectedSubjectId(null);
      setSubjectForm(emptySubjectForm);
      toast({ title: "Saved", description: "Subject saved." });
    } catch (err) {
      toast({
        title: "Save failed",
        description: err instanceof Error ? err.message : "Failed to save subject",
        variant: "destructive",
      });
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
    <div className="h-full bg-[#f2fbf7] p-1">
      <div className="w-full border border-[#79b898] bg-white">
        <div className="bg-gradient-to-b from-[#def8ea] to-[#9fdbbc] border-b border-[#79b898] px-2 py-1">
          <h1 className="text-[34px] leading-none text-[#1f5e45] font-semibold">Program Curriculums</h1>
          <p className="text-[12px] text-[#35684f]">
            Use this module to add/edit/delete subjects and create curriculum programs.
          </p>
        </div>

        <div className="px-2 pt-1 flex gap-1 border-b border-[#9ed9c1] bg-[#f2fbf7]">
          <button
            onClick={() => setActiveTab("courses")}
            className={cn(
              "px-2 py-0.5 text-[12px] border border-[#79b898]",
              activeTab === "courses" ? "bg-[#d9f3e5] text-[#1f5e45] font-semibold" : "bg-white text-[#35684f]"
            )}
          >
            Courses Master List
          </button>
          <button
            onClick={() => setActiveTab("curriculums")}
            className={cn(
              "px-2 py-0.5 text-[12px] border border-[#79b898]",
              activeTab === "curriculums" ? "bg-[#d9f3e5] text-[#1f5e45] font-semibold" : "bg-white text-[#35684f]"
            )}
          >
            Program Curriculums
          </button>
        </div>

        {activeTab === "courses" ? (
          <CoursesMasterListModule />
        ) : (
        <div className="grid grid-cols-12 gap-2 p-2 min-h-[620px] bg-[#f2fbf7]">
          <div className="col-span-12 lg:col-span-5 border border-[#79b898] bg-white">
            <div className="bg-[#f8fdf9] border-b border-[#9ed9c1] px-2 py-1 text-[12px] font-bold text-[#1f5e45] uppercase">
              General Information
            </div>
            <div className="p-2 space-y-1.5 text-[12px]">
              <div className="grid grid-cols-12 items-center gap-2">
                <Label className="col-span-3 text-[12px]">Campus</Label>
                <Select
                  value={curriculumForm.campus_id}
                  onValueChange={(v) => {
                    setSelectedCurriculumId(null);
                    setCurriculumForm((f) => ({ ...f, campus_id: v, academic_program_id: "" }));
                  }}
                >
                  <SelectTrigger className="col-span-9 h-7 text-[12px]">
                    <SelectValue placeholder="Campus" />
                  </SelectTrigger>
                  <SelectContent>
                    {campuses.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.acronym} {c.campus_name ? `- ${c.campus_name}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-12 items-center gap-2">
                <Label className="col-span-3 text-[12px]">Academic Program</Label>
                <Select
                  value={curriculumForm.academic_program_id}
                  onValueChange={(v) => {
                    setSelectedCurriculumId(null);
                    setCurriculumForm((f) => ({ ...f, academic_program_id: v }));
                  }}
                >
                  <SelectTrigger className="col-span-9 h-7 text-[12px]">
                    <SelectValue placeholder="Academic Program" />
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
              <div className="grid grid-cols-12 items-center gap-2">
                <Label className="col-span-3 text-[12px]">Major Discipline</Label>
                <Select
                  value={curriculumForm.major_discipline_id}
                  onValueChange={(v) => setCurriculumForm((f) => ({ ...f, major_discipline_id: v }))}
                >
                  <SelectTrigger className="col-span-9 h-7 text-[12px]">
                    <SelectValue placeholder="Major Discipline" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">-- None --</SelectItem>
                    {disciplines.map((d) => (
                      <SelectItem key={d.id} value={String(d.id)}>
                        {d.major_code} - {d.major_discipline}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-12 items-center gap-2 text-[#1f7a57] text-[12px] pt-1">
                <div className="col-span-4">TERM: {curriculumForm.term_label || "-"}</div>
                <div className="col-span-4">NO. OF YEARS: {curriculumForm.no_of_years || "-"}</div>
                <div className="col-span-4">TOTAL NO. OF TERMS: {curriculumForm.total_terms || "-"}</div>
              </div>
              <div className="grid grid-cols-12 items-center gap-2">
                <Label className="col-span-3 text-[12px]">Curriculum Code</Label>
                <Input
                  className="col-span-9 h-7 text-[12px]"
                  value={curriculumForm.curriculum_code}
                  onChange={(e) => setCurriculumForm((f) => ({ ...f, curriculum_code: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-12 items-center gap-2">
                <Label className="col-span-3 text-[12px]">Description</Label>
                <Input
                  className="col-span-9 h-7 text-[12px]"
                  value={curriculumForm.description}
                  onChange={(e) => setCurriculumForm((f) => ({ ...f, description: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-12 items-start gap-2">
                <Label className="col-span-3 text-[12px] pt-1">Notes</Label>
                <textarea
                  className="col-span-9 h-16 text-[12px] border rounded-sm px-2 py-1"
                  value={curriculumForm.notes}
                  onChange={(e) => setCurriculumForm((f) => ({ ...f, notes: e.target.value }))}
                />
              </div>
              <div className="flex items-center gap-2 pt-1">
                <Checkbox
                  checked={curriculumForm.is_locked}
                  onCheckedChange={(v) => setCurriculumForm((f) => ({ ...f, is_locked: !!v }))}
                />
                <span className="text-[12px] font-semibold text-muted-foreground">Locked Curriculum</span>
              </div>
              <div className="grid grid-cols-3 gap-1 pt-1">
                <Input
                  className="h-7 text-[12px]"
                  placeholder="Term"
                  value={curriculumForm.term_label}
                  onChange={(e) => setCurriculumForm((f) => ({ ...f, term_label: e.target.value }))}
                />
                <Input
                  className="h-7 text-[12px]"
                  placeholder="No. of years"
                  value={curriculumForm.no_of_years}
                  onChange={(e) => setCurriculumForm((f) => ({ ...f, no_of_years: e.target.value }))}
                />
                <Input
                  className="h-7 text-[12px]"
                  placeholder="Total terms"
                  value={curriculumForm.total_terms}
                  onChange={(e) => setCurriculumForm((f) => ({ ...f, total_terms: e.target.value }))}
                />
              </div>
              <div className="flex gap-1 pt-1">
                <Button className="h-7 text-[11px]" onClick={newCurriculum}>New</Button>
                <Button className="h-7 text-[11px]" onClick={saveCurriculum}>Save</Button>
                <Button className="h-7 text-[11px]" variant="destructive" onClick={deleteCurriculum} disabled={!selectedCurriculumId}>
                  Delete
                </Button>
              </div>
            </div>
            <div className="border-t border-[#79b898]">
              <div className="grid grid-cols-2 bg-gradient-to-b from-[#6ec79b] to-[#2f9b68] text-white text-[11px] font-bold uppercase">
                <div className="px-2 py-1 border-r border-white/30">Curriculum Code</div>
                <div className="px-2 py-1">Description</div>
              </div>
              <div className="max-h-[230px] overflow-auto">
                {rows.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setSelectedCurriculumId(r.id)}
                    className={cn(
                      "w-full grid grid-cols-2 text-[12px] text-left border-b border-[#d4e8dc] hover:bg-[#e7f8ef]",
                      selectedCurriculumId === r.id && "bg-[#d9f3e5]"
                    )}
                  >
                    <div className="px-2 py-1 border-r border-[#d4e8dc]">{r.curriculum_code}</div>
                    <div className="px-2 py-1 truncate">{r.description || "-"}</div>
                  </button>
                ))}
              </div>
              <div className="px-2 py-1 text-[12px] font-bold">Total Curricular Program(s): {rows.length}</div>
            </div>
          </div>

          <div className="col-span-12 lg:col-span-7 border border-[#79b898] bg-white flex flex-col">
            <div className="grid grid-cols-12 bg-gradient-to-b from-[#6ec79b] to-[#2f9b68] border-b border-[#79b898] text-[11px] font-bold uppercase text-white">
              <div className="col-span-2 px-2 py-1 border-r">Subject Code</div>
              <div className="col-span-4 px-2 py-1 border-r">Descriptive Title</div>
              <div className="col-span-1 px-2 py-1 border-r text-center">Lab</div>
              <div className="col-span-1 px-2 py-1 border-r text-center">Lec</div>
              <div className="col-span-1 px-2 py-1 border-r text-center">Credit</div>
              <div className="col-span-1 px-2 py-1 border-r text-center">Lecture Hr</div>
              <div className="col-span-2 px-2 py-1 text-center">Laboratory Hr</div>
            </div>

            <div className="p-1 border-b border-[#d4e8dc] grid grid-cols-12 gap-1 bg-[#f8fdf9]">
              <Input
                className="col-span-2 h-7 text-[12px]"
                placeholder="Code"
                value={subjectForm.subject_code}
                onChange={(e) => setSubjectForm((f) => ({ ...f, subject_code: e.target.value }))}
              />
              <Input
                className="col-span-4 h-7 text-[12px]"
                placeholder="Descriptive title"
                value={subjectForm.descriptive_title}
                onChange={(e) => setSubjectForm((f) => ({ ...f, descriptive_title: e.target.value }))}
              />
              <Input className="col-span-1 h-7 text-[12px]" value={subjectForm.lab_unit} onChange={(e) => setSubjectForm((f) => ({ ...f, lab_unit: e.target.value }))} />
              <Input className="col-span-1 h-7 text-[12px]" value={subjectForm.lec_unit} onChange={(e) => setSubjectForm((f) => ({ ...f, lec_unit: e.target.value }))} />
              <Input className="col-span-1 h-7 text-[12px]" value={subjectForm.credit_unit} onChange={(e) => setSubjectForm((f) => ({ ...f, credit_unit: e.target.value }))} />
              <Input className="col-span-1 h-7 text-[12px]" value={subjectForm.lecture_hour} onChange={(e) => setSubjectForm((f) => ({ ...f, lecture_hour: e.target.value }))} />
              <Input className="col-span-2 h-7 text-[12px]" value={subjectForm.laboratory_hour} onChange={(e) => setSubjectForm((f) => ({ ...f, laboratory_hour: e.target.value }))} />
            </div>

            <div className="p-1 border-b border-[#d4e8dc] flex gap-1 bg-[#f8fdf9]">
              <Button className="h-7 text-[11px]" onClick={saveSubject} disabled={!selectedCurriculumId}>
                {selectedSubjectId ? "Save Subject" : "Add Subject"}
              </Button>
              <Button
                className="h-7 text-[11px]"
                variant="outline"
                onClick={() => {
                  setSelectedSubjectId(null);
                  setSubjectForm(emptySubjectForm);
                }}
              >
                Clear
              </Button>
              <Button className="h-7 text-[11px]" variant="destructive" onClick={deleteSubject} disabled={!selectedSubjectId}>
                Delete
              </Button>
            </div>

            <div className="flex-1 overflow-auto">
              {subjects.map((s) => (
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
                    "w-full grid grid-cols-12 text-[12px] text-left border-b border-[#d4e8dc] hover:bg-[#e7f8ef]",
                    selectedSubjectId === s.id && "bg-[#d9f3e5]"
                  )}
                >
                  <div className="col-span-2 px-2 py-1 border-r border-[#d4e8dc]">{s.subject_code}</div>
                  <div className="col-span-4 px-2 py-1 border-r border-[#d4e8dc] truncate">{s.descriptive_title}</div>
                  <div className="col-span-1 px-2 py-1 border-r border-[#d4e8dc] text-center">{String(s.lab_unit ?? 0)}</div>
                  <div className="col-span-1 px-2 py-1 border-r border-[#d4e8dc] text-center">{String(s.lec_unit ?? 0)}</div>
                  <div className="col-span-1 px-2 py-1 border-r border-[#d4e8dc] text-center">{String(s.credit_unit ?? 0)}</div>
                  <div className="col-span-1 px-2 py-1 border-r border-[#d4e8dc] text-center">{String(s.lecture_hour ?? 0)}</div>
                  <div className="col-span-2 px-2 py-1 text-center">{String(s.laboratory_hour ?? 0)}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
        )}
      </div>
    </div>
  );
}

