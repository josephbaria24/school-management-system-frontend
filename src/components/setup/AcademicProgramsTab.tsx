"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
import { FilePlus2, Globe, Save, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

const API = process.env.NEXT_PUBLIC_API_URL;

type Campus = { id: number; acronym: string; campus_name: string | null };
type CollegeRow = {
  id: number;
  campus_id: number;
  college_code: string;
  college_name: string;
};
type ProgramRow = {
  id: number;
  campus_id: number;
  college_id: number;
  program_code: string;
  program_name: string;
  short_name: string | null;
  admission_number_code: string | null;
  status: string | null;
  term: string | null;
  program_alias: boolean;
  no_of_years: number | null;
  max_residency: number | null;
  total_academic_subjects: number | null;
  total_academic_credit_units: string | null;
  academic_program_weight: string | null;
  total_ge_units: string | null;
  total_major_units: string | null;
  total_elective_units: string | null;
  total_lecture_units: string | null;
  total_non_lecture_units: string | null;
  classification: string | null;
  thesis_option: string | null;
  board_exam: string | null;
  ladder: string | null;
  parent_program: string | null;
  date_recognized: string | null;
  date_revised: string | null;
  college_code?: string;
  college_name?: string;
};

type ChedRow = {
  id: number;
  major_code: string;
  major_discipline: string;
  major_group_id: number;
  group_description: string;
};

type LinkRow = {
  id: number;
  academic_program_id: number;
  ched_major_discipline_id: number;
  offer: boolean;
  is_inactive: boolean;
  major_code: string;
  major_discipline: string;
  major_group_name: string;
};

function str(v: unknown) {
  if (v === null || v === undefined) return "";
  return String(v);
}

function emptyForm(campusId: string, collegeId: string) {
  return {
    campus_id: campusId,
    college_id: collegeId,
    program_code: "",
    program_name: "",
    short_name: "",
    admission_number_code: "",
    status: "active",
    term: "",
    program_alias: false,
    no_of_years: "",
    max_residency: "",
    total_academic_subjects: "",
    total_academic_credit_units: "",
    academic_program_weight: "",
    total_ge_units: "",
    total_major_units: "",
    total_elective_units: "",
    total_lecture_units: "",
    total_non_lecture_units: "",
    classification: "",
    thesis_option: "",
    board_exam: "",
    ladder: "",
    parent_program: "",
    date_recognized: "",
    date_revised: "",
  };
}

export function AcademicProgramsTab() {
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [colleges, setColleges] = useState<CollegeRow[]>([]);
  const [programs, setPrograms] = useState<ProgramRow[]>([]);
  const [chedList, setChedList] = useState<ChedRow[]>([]);
  const [links, setLinks] = useState<LinkRow[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [form, setForm] = useState(() => emptyForm("", ""));
  const [groupFilter, setGroupFilter] = useState<string>("all");
  const [addDisciplineId, setAddDisciplineId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageVariant, setMessageVariant] = useState<"info" | "error">("info");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const clearFieldError = (key: string) => {
    setFieldErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const campusIdNum = form.campus_id
    ? parseInt(String(form.campus_id), 10)
    : NaN;
  const collegeIdNum = form.college_id
    ? parseInt(String(form.college_id), 10)
    : NaN;

  const campusLabel = (c: Campus) =>
    `${c.acronym}${c.campus_name ? ` — ${c.campus_name}` : ""}`;

  const loadCampuses = useCallback(async () => {
    const res = await fetch(`${API}/api/campuses`);
    if (!res.ok) return;
    const data: Campus[] = await res.json();
    setCampuses(data);
    setForm((f) => {
      if (f.campus_id) return f;
      if (data.length === 0) return f;
      return { ...f, campus_id: String(data[0].id) };
    });
  }, []);

  const loadColleges = useCallback(async () => {
    if (!Number.isFinite(campusIdNum)) {
      setColleges([]);
      return;
    }
    const res = await fetch(
      `${API}/api/colleges?campus_id=${encodeURIComponent(String(campusIdNum))}`
    );
    if (!res.ok) return;
    const data: CollegeRow[] = await res.json();
    setColleges(data);
    setForm((f) => {
      if (!Number.isFinite(campusIdNum)) return f;
      const still = data.some((c) => String(c.id) === String(f.college_id));
      if (still) return f;
      if (data.length === 0) return { ...f, college_id: "" };
      return { ...f, college_id: String(data[0].id) };
    });
  }, [campusIdNum]);

  const loadPrograms = useCallback(async () => {
    if (!Number.isFinite(collegeIdNum)) {
      setPrograms([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(
        `${API}/api/academic-programs?college_id=${encodeURIComponent(String(collegeIdNum))}`
      );
      if (!res.ok) throw new Error("programs");
      setPrograms(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [collegeIdNum]);

  const loadChed = useCallback(async () => {
    const res = await fetch(`${API}/api/ched-major-disciplines`);
    if (!res.ok) return;
    setChedList(await res.json());
  }, []);

  const loadLinks = useCallback(async (programId: number) => {
    const res = await fetch(
      `${API}/api/academic-programs/${programId}/major-disciplines`
    );
    if (!res.ok) return;
    setLinks(await res.json());
  }, []);

  useEffect(() => {
    loadCampuses();
    loadChed();
  }, [loadCampuses, loadChed]);

  useEffect(() => {
    loadColleges();
  }, [loadColleges]);

  useEffect(() => {
    loadPrograms();
  }, [loadPrograms]);

  useEffect(() => {
    if (selectedId) loadLinks(selectedId);
    else setLinks([]);
  }, [selectedId, loadLinks]);

  const selected = programs.find((p) => p.id === selectedId) ?? null;

  useEffect(() => {
    if (!selected) return;
    setForm({
      campus_id: String(selected.campus_id),
      college_id: String(selected.college_id),
      program_code: selected.program_code,
      program_name: selected.program_name,
      short_name: str(selected.short_name),
      admission_number_code: str(selected.admission_number_code),
      status: str(selected.status) || "active",
      term: str(selected.term),
      program_alias: !!selected.program_alias,
      no_of_years: str(selected.no_of_years),
      max_residency: str(selected.max_residency),
      total_academic_subjects: str(selected.total_academic_subjects),
      total_academic_credit_units: str(selected.total_academic_credit_units),
      academic_program_weight: str(selected.academic_program_weight),
      total_ge_units: str(selected.total_ge_units),
      total_major_units: str(selected.total_major_units),
      total_elective_units: str(selected.total_elective_units),
      total_lecture_units: str(selected.total_lecture_units),
      total_non_lecture_units: str(selected.total_non_lecture_units),
      classification: str(selected.classification),
      thesis_option: str(selected.thesis_option),
      board_exam: str(selected.board_exam),
      ladder: str(selected.ladder),
      parent_program: str(selected.parent_program),
      date_recognized: selected.date_recognized
        ? String(selected.date_recognized).slice(0, 10)
        : "",
      date_revised: selected.date_revised
        ? String(selected.date_revised).slice(0, 10)
        : "",
    });
  }, [selected]);

  const filteredChed = useMemo(() => {
    if (groupFilter === "all") return chedList;
    return chedList.filter((c) => c.group_description === groupFilter);
  }, [chedList, groupFilter]);

  const groupNames = useMemo(() => {
    const s = new Set<string>();
    chedList.forEach((c) => s.add(c.group_description));
    return ["all", ...Array.from(s).sort()];
  }, [chedList]);

  const resetNew = () => {
    setSelectedId(null);
    setFieldErrors({});
    const cid = Number.isFinite(campusIdNum)
      ? String(campusIdNum)
      : campuses[0]
        ? String(campuses[0].id)
        : "";
    const colid = colleges[0] ? String(colleges[0].id) : "";
    setForm(emptyForm(cid, colid));
  };

  const buildProgramBody = () => ({
    campus_id: parseInt(String(form.campus_id), 10),
    college_id: parseInt(String(form.college_id), 10),
    program_code: form.program_code.trim(),
    program_name: form.program_name.trim(),
    short_name: form.short_name || null,
    admission_number_code: form.admission_number_code || null,
    status: form.status || "active",
    term: form.term || null,
    program_alias: form.program_alias,
    no_of_years: form.no_of_years || null,
    max_residency: form.max_residency || null,
    total_academic_subjects: form.total_academic_subjects || null,
    total_academic_credit_units: form.total_academic_credit_units || null,
    academic_program_weight: form.academic_program_weight || null,
    total_ge_units: form.total_ge_units || null,
    total_major_units: form.total_major_units || null,
    total_elective_units: form.total_elective_units || null,
    total_lecture_units: form.total_lecture_units || null,
    total_non_lecture_units: form.total_non_lecture_units || null,
    classification: form.classification || null,
    thesis_option: form.thesis_option || null,
    board_exam: form.board_exam || null,
    ladder: form.ladder || null,
    parent_program: form.parent_program || null,
    date_recognized: form.date_recognized || null,
    date_revised: form.date_revised || null,
  });

  const handleSave = async () => {
    const errors: Record<string, string> = {};
    const cid = parseInt(String(form.campus_id), 10);
    const colid = parseInt(String(form.college_id), 10);
    if (campuses.length === 0) {
      errors.campus_id = "No campuses available.";
    } else if (!Number.isFinite(cid)) {
      errors.campus_id = "Select a campus.";
    }
    if (!Number.isFinite(colid)) {
      errors.college_id = "Select a college.";
    } else if (colleges.length === 0 && Number.isFinite(cid)) {
      errors.college_id =
        "No colleges for this campus. Add one in the Colleges tab.";
    }
    if (!form.program_code.trim()) {
      errors.program_code = "Program code is required.";
    }
    if (!form.program_name.trim()) {
      errors.program_name = "Program name is required.";
    }
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setMessageVariant("error");
      setMessage("Please complete the required fields below.");
      setTimeout(() => setMessage(null), 5000);
      return;
    }
    setFieldErrors({});
    setMessageVariant("info");
    const body = buildProgramBody();
    setSaving(true);
    try {
      const url = selectedId
        ? `${API}/api/academic-programs/${selectedId}`
        : `${API}/api/academic-programs`;
      const res = await fetch(url, {
        method: selectedId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(result?.error || "Save failed");
      setSelectedId(result.id);
      setMessageVariant("info");
      setMessage("Saved.");
      await loadPrograms();
    } catch (e) {
      setMessageVariant("error");
      setMessage(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleDelete = async () => {
    if (!selectedId) return;
    setSaving(true);
    try {
      const res = await fetch(`${API}/api/academic-programs/${selectedId}`, {
        method: "DELETE",
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(result?.error || "Delete failed");
      resetNew();
      await loadPrograms();
      setMessage("Deleted.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const updateLink = async (
    linkId: number,
    patch: { offer: boolean; is_inactive: boolean }
  ) => {
    const res = await fetch(
      `${API}/api/academic-program-major-disciplines/${linkId}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      }
    );
    if (!res.ok) return;
    if (selectedId) await loadLinks(selectedId);
  };

  const addLink = async () => {
    if (!selectedId || !addDisciplineId) return;
    const res = await fetch(
      `${API}/api/academic-programs/${selectedId}/major-disciplines`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ched_major_discipline_id: parseInt(addDisciplineId, 10),
          offer: true,
          is_inactive: false,
        }),
      }
    );
    const result = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMessage(result?.error || "Could not add discipline");
      setTimeout(() => setMessage(null), 3000);
      return;
    }
    setAddDisciplineId("");
    await loadLinks(selectedId);
  };

  const numField = (
    label: string,
    key: keyof ReturnType<typeof emptyForm>
  ) => (
    <div className="space-y-1">
      <Label className="text-[10px] leading-tight">{label}</Label>
      <Input
        type="number"
        step="any"
        className="h-7 text-xs"
        value={String(form[key] ?? "")}
        onChange={(e) =>
          setForm((f) => ({ ...f, [key]: e.target.value } as typeof f))
        }
      />
    </div>
  );

  return (
    <div>
      {message && (
        <div
          className={cn(
            "mb-2 px-3 py-2 rounded-sm text-xs border",
            messageVariant === "error"
              ? "border-destructive/50 bg-destructive/10 text-destructive"
              : "border-border bg-muted/60"
          )}
        >
          {message}
        </div>
      )}
      <div className="grid grid-cols-12 gap-3 min-h-[560px]">
        <div className="col-span-5 flex flex-col border border-border rounded-sm overflow-hidden bg-background max-h-[720px] min-h-[560px]">
          <div className="bg-amber-600 dark:bg-amber-800 text-white px-2 py-1.5 text-[10px] font-bold uppercase shrink-0">
            Academic program information
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0">
            <div className="space-y-1">
              <Label className="text-xs">Campus</Label>
              <Select
                value={form.campus_id ? String(form.campus_id) : ""}
                onValueChange={(v) => {
                  clearFieldError("campus_id");
                  setSelectedId(null);
                  setForm((f) => ({ ...f, campus_id: v, college_id: "" }));
                }}
              >
                <SelectTrigger
                  className={cn(
                    "h-8 text-xs",
                    fieldErrors.campus_id &&
                      "border-destructive ring-1 ring-destructive/30"
                  )}
                >
                  <SelectValue placeholder="Campus" />
                </SelectTrigger>
                <SelectContent>
                  {campuses.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {campusLabel(c)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fieldErrors.campus_id && (
                <p className="text-[10px] text-destructive">
                  {fieldErrors.campus_id}
                </p>
              )}
            </div>
            <div className="space-y-1">
              <Label className="text-xs">College</Label>
              <Select
                value={form.college_id ? String(form.college_id) : ""}
                onValueChange={(v) => {
                  clearFieldError("college_id");
                  setSelectedId(null);
                  setForm((f) => ({ ...f, college_id: v }));
                }}
              >
                <SelectTrigger
                  className={cn(
                    "h-8 text-xs",
                    fieldErrors.college_id &&
                      "border-destructive ring-1 ring-destructive/30"
                  )}
                >
                  <SelectValue placeholder="College" />
                </SelectTrigger>
                <SelectContent>
                  {colleges.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.college_code} — {c.college_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fieldErrors.college_id && (
                <p className="text-[10px] text-destructive">
                  {fieldErrors.college_id}
                </p>
              )}
            </div>
            <div className="flex flex-wrap gap-2 items-end">
              <div className="space-y-1 flex-1 min-w-[120px]">
                <Label className="text-xs">Program code</Label>
                <Input
                  className={cn(
                    "h-8 text-sm font-mono",
                    fieldErrors.program_code &&
                      "border-destructive ring-1 ring-destructive/30"
                  )}
                  value={form.program_code}
                  onChange={(e) => {
                    clearFieldError("program_code");
                    setForm((f) => ({ ...f, program_code: e.target.value }));
                  }}
                />
                {fieldErrors.program_code && (
                  <p className="text-[10px] text-destructive">
                    {fieldErrors.program_code}
                  </p>
                )}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 text-[10px]"
                onClick={() => {
                  setSelectedId(null);
                  setFieldErrors({});
                  setForm((f) => ({
                    ...emptyForm(
                      f.campus_id ? String(f.campus_id) : "",
                      f.college_id ? String(f.college_id) : ""
                    ),
                  }));
                }}
              >
                Open
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 text-[10px]"
                onClick={resetNew}
              >
                Save as
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(v) => setForm((f) => ({ ...f, status: v }))}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Term</Label>
                <Input
                  className="h-8 text-xs"
                  value={form.term}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, term: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Program name</Label>
              <Input
                className={cn(
                  "h-8 text-sm",
                  fieldErrors.program_name &&
                    "border-destructive ring-1 ring-destructive/30"
                )}
                value={form.program_name}
                onChange={(e) => {
                  clearFieldError("program_name");
                  setForm((f) => ({ ...f, program_name: e.target.value }));
                }}
              />
              {fieldErrors.program_name && (
                <p className="text-[10px] text-destructive">
                  {fieldErrors.program_name}
                </p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Short name</Label>
                <Input
                  className="h-8 text-xs"
                  value={form.short_name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, short_name: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Admission no. code</Label>
                <Input
                  className="h-8 text-xs font-mono"
                  value={form.admission_number_code}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      admission_number_code: e.target.value,
                    }))
                  }
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="palias"
                checked={form.program_alias}
                onCheckedChange={(v) =>
                  setForm((f) => ({ ...f, program_alias: !!v }))
                }
              />
              <Label htmlFor="palias" className="text-xs flex items-center gap-1 cursor-pointer">
                <Globe className="h-3.5 w-3.5 text-primary" />
                Program alias
              </Label>
            </div>
            <div className="grid grid-cols-2 gap-x-2 gap-y-2">
              {numField("No. of years", "no_of_years")}
              {numField("Total GE units", "total_ge_units")}
              {numField("Maximum residency", "max_residency")}
              {numField("Total major units", "total_major_units")}
              {numField("Total academic subjects", "total_academic_subjects")}
              {numField("Total elective units", "total_elective_units")}
              {numField("Total academic credit units", "total_academic_credit_units")}
              {numField("Total lecture units", "total_lecture_units")}
              {numField("Academic program weight", "academic_program_weight")}
              {numField("Total non-lecture units", "total_non_lecture_units")}
            </div>
          </div>

          <div className="border-t border-border bg-muted/20 shrink-0">
            <div className="px-2 py-1 text-[10px] font-bold uppercase text-amber-900 dark:text-amber-200 bg-amber-100/80 dark:bg-amber-950/50">
              Other information
            </div>
            <div className="p-3 space-y-2 border-t border-border/60">
              <div className="space-y-1">
                <Label className="text-xs">Classification</Label>
                <Input
                  className="h-8 text-xs"
                  value={form.classification}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, classification: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Thesis option</Label>
                <Input
                  className="h-8 text-xs"
                  value={form.thesis_option}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, thesis_option: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Board exam</Label>
                <Input
                  className="h-8 text-xs"
                  value={form.board_exam}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, board_exam: e.target.value }))
                  }
                />
              </div>
              <p className="text-[10px] text-muted-foreground leading-snug">
                If this program is ladderized, indicate the position in the ladder.
              </p>
              <div className="space-y-1">
                <Label className="text-xs">Ladder</Label>
                <Input
                  className="h-8 text-xs"
                  value={form.ladder}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, ladder: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Parent</Label>
                <Input
                  className="h-8 text-xs"
                  value={form.parent_program}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, parent_program: e.target.value }))
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">Date recognized</Label>
                  <Input
                    type="date"
                    className="h-8 text-xs"
                    value={form.date_recognized}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        date_recognized: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Date revise</Label>
                  <Input
                    type="date"
                    className="h-8 text-xs"
                    value={form.date_revised}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, date_revised: e.target.value }))
                    }
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5 p-2 border-t border-border bg-muted/30 shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 text-[10px] gap-1"
              disabled={saving}
              onClick={resetNew}
            >
              <FilePlus2 className="h-3 w-3" />
              New
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 text-[10px] gap-1"
              disabled={saving}
              onClick={handleSave}
            >
              <Save className="h-3 w-3" />
              Save
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 text-[10px] gap-1 text-destructive"
              disabled={saving || !selectedId}
              onClick={handleDelete}
            >
              <Trash2 className="h-3 w-3" />
              Delete
            </Button>
          </div>
        </div>

        <div className="col-span-7 flex flex-col gap-2 min-h-[560px]">
          <div className="flex-1 flex flex-col border border-border rounded-sm overflow-hidden bg-background min-h-0">
            <div className="grid grid-cols-12 bg-amber-600 dark:bg-amber-800 text-white text-[10px] font-bold uppercase shrink-0">
              <div className="col-span-2 px-2 py-1 border-r border-white/30 font-mono">
                Code
              </div>
              <div className="col-span-10 px-2 py-1">Program name</div>
            </div>
            <div className="flex-1 overflow-auto min-h-0 max-h-[200px]">
              {loading ? (
                <div className="p-3 text-xs text-muted-foreground">Loading…</div>
              ) : programs.length === 0 ? (
                <div className="p-3 text-xs text-muted-foreground italic">
                  No programs for this college.
                </div>
              ) : (
                programs.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelectedId(p.id)}
                    className={cn(
                      "w-full grid grid-cols-12 text-left text-xs border-b border-border/50",
                      selectedId === p.id
                        ? "bg-amber-100 dark:bg-amber-950/40 font-medium"
                        : "hover:bg-muted/50"
                    )}
                  >
                    <div className="col-span-2 px-2 py-1.5 border-r border-border/40 font-mono truncate">
                      {p.program_code}
                    </div>
                    <div className="col-span-10 px-2 py-1.5 truncate">
                      {p.program_name}
                    </div>
                  </button>
                ))
              )}
            </div>
            <div className="px-2 py-1 border-t border-border bg-muted/40 text-[10px] font-bold uppercase">
              Programs: {programs.length}
            </div>
          </div>

          <div className="flex-1 flex flex-col border border-border rounded-sm overflow-hidden bg-background min-h-0">
            <div className="flex items-center justify-between gap-2 bg-amber-600 dark:bg-amber-800 text-white px-2 py-1.5 shrink-0">
              <span className="text-[10px] font-bold uppercase">
                Major discipline category
              </span>
              <Select value={groupFilter} onValueChange={setGroupFilter}>
                <SelectTrigger className="h-7 w-[200px] text-[10px] bg-white/15 border-white/40 text-white [&_svg]:text-white">
                  <SelectValue placeholder="Filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All groups</SelectItem>
                  {groupNames
                    .filter((g) => g !== "all")
                    .map((g) => (
                      <SelectItem key={g} value={g}>
                        {g}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 px-2 py-1.5 border-b border-border bg-muted/20 items-end shrink-0">
              <div className="flex-1 space-y-0.5 min-w-0">
                <Label className="text-[10px]">Add CHED discipline</Label>
                <Select
                  value={addDisciplineId}
                  onValueChange={setAddDisciplineId}
                >
                  <SelectTrigger className="h-7 text-[10px]">
                    <SelectValue placeholder="Select…" />
                  </SelectTrigger>
                  <SelectContent className="max-h-64">
                    {filteredChed.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        <span className="font-mono">{c.major_code}</span> —{" "}
                        {c.major_discipline}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                type="button"
                size="sm"
                className="h-7 text-[10px]"
                disabled={!selectedId || !addDisciplineId}
                onClick={addLink}
              >
                Add
              </Button>
            </div>
            <div className="flex-1 overflow-auto min-h-0">
              <div className="grid grid-cols-12 bg-muted text-[10px] font-bold uppercase border-b border-border">
                <div className="col-span-2 px-2 py-1 border-r font-mono">
                  Major code
                </div>
                <div className="col-span-5 px-2 py-1 border-r truncate">
                  Major discipline
                </div>
                <div className="col-span-2 px-2 py-1 border-r text-center">
                  Offer
                </div>
                <div className="col-span-3 px-2 py-1 text-center">Inactive</div>
              </div>
              {!selectedId ? (
                <div className="p-4 text-xs text-muted-foreground italic">
                  Select a program to manage linked disciplines.
                </div>
              ) : links.length === 0 ? (
                <div className="p-4 text-xs text-muted-foreground italic">
                  No linked disciplines.
                </div>
              ) : (
                links.map((l) => (
                  <div
                    key={l.id}
                    className="grid grid-cols-12 text-xs border-b border-border/50 items-center"
                  >
                    <div className="col-span-2 px-2 py-1.5 border-r font-mono">
                      {l.major_code}
                    </div>
                    <div className="col-span-5 px-2 py-1.5 border-r truncate">
                      {l.major_discipline}
                    </div>
                    <div className="col-span-2 px-2 py-1.5 border-r flex justify-center">
                      <Checkbox
                        checked={l.offer}
                        onCheckedChange={(v) =>
                          updateLink(l.id, {
                            offer: !!v,
                            is_inactive: l.is_inactive,
                          })
                        }
                      />
                    </div>
                    <div className="col-span-3 px-2 py-1.5 flex justify-center">
                      <Checkbox
                        checked={l.is_inactive}
                        onCheckedChange={(v) =>
                          updateLink(l.id, {
                            offer: l.offer,
                            is_inactive: !!v,
                          })
                        }
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
