"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  User,
  Save,
  Trash2,
  FilePlus2,
  Upload,
  Loader2,
  UserCog,
  UserSquare2,
  PenSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { uploadImageToCloudinary } from "@/lib/uploadImage";
import { MaintainDepartmentsDialog } from "@/components/setup/MaintainDepartmentsDialog";
import type { DepartmentRow } from "@/components/setup/MaintainDepartmentsDialog";
import { MaintainPositionsDialog } from "@/components/setup/MaintainPositionsDialog";
import type { PositionRow } from "@/components/setup/MaintainPositionsDialog";

const API = process.env.NEXT_PUBLIC_API_URL;

type Campus = { id: number; acronym: string; campus_name: string | null };
type CollegeRow = {
  id: number;
  campus_id: number;
  college_code: string;
  college_name: string;
};
type OptionCategory =
  | "teaching_load_educ_level"
  | "degree_discipline"
  | "prc_licensure";
type OptionItem = {
  id: number;
  category: OptionCategory;
  value: string;
};

type EmployeeRow = {
  id: number;
  employee_id: string;
  title: string | null;
  last_name: string;
  first_name: string;
  middle_name: string | null;
  middle_initial: string | null;
  suffix: string | null;
  birthday: string | null;
  gender: string | null;
  civil_status: string | null;
  position_label: string | null;
  position_id: number | null;
  position_code_ref?: string | null;
  position_title_ref?: string | null;
  position_short_name_ref?: string | null;
  department_label: string | null;
  department_id: number | null;
  department_code?: string | null;
  department_name?: string | null;
  is_faculty: boolean;
  is_inactive: boolean;
  photo_url: string | null;
  signature_url: string | null;
  faculty_rank: string | null;
  is_full_time: boolean | null;
  campus_id: number | null;
  college_id: number | null;
  teaching_load_educ_level: string | null;
  degree_discipline: string | null;
  prc_licensure: string | null;
  campus_acronym?: string | null;
  college_code?: string | null;
  college_name?: string | null;
};

const TITLES = ["Mr.", "Ms.", "Mrs.", "Dr.", "Prof."];
const GENDERS = ["Male", "Female", "Other"];
const CIVIL = ["Single", "Married", "Widowed", "Separated", "Other"];
const NONE = "__none__";

function Req() {
  return <span className="text-destructive font-bold ml-0.5">*</span>;
}

function emptyFormState() {
  return {
    employee_id: "",
    title: "",
    last_name: "",
    first_name: "",
    middle_name: "",
    middle_initial: "",
    suffix: "",
    birthday: "",
    gender: "",
    civil_status: "",
    position_label: "",
    position_id: "" as string,
    department_label: "",
    department_id: "" as string,
    is_faculty: false,
    is_inactive: false,
    photo_url: "",
    signature_url: "",
    faculty_rank: "",
    employment: "" as "" | "full-time" | "part-time",
    campus_id: "" as string,
    college_id: "" as string,
    teaching_load_educ_level: "",
    degree_discipline: "",
    prc_licensure: "",
  };
}

type FormState = ReturnType<typeof emptyFormState>;

export function EmployeesFacultyModule({
  mode = "employees",
}: {
  mode?: "employees" | "faculty";
}) {
  const [rows, setRows] = useState<EmployeeRow[]>([]);
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [colleges, setColleges] = useState<CollegeRow[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(emptyFormState);
  const [hideInactive, setHideInactive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageVariant, setMessageVariant] = useState<"info" | "error">("info");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const photoRef = useRef<HTMLInputElement>(null);
  const sigRef = useRef<HTMLInputElement>(null);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [sigBusy, setSigBusy] = useState(false);
  const [departments, setDepartments] = useState<DepartmentRow[]>([]);
  const [maintainDeptOpen, setMaintainDeptOpen] = useState(false);
  const [positions, setPositions] = useState<PositionRow[]>([]);
  const [maintainPosOpen, setMaintainPosOpen] = useState(false);
  const [teachingLoadOptions, setTeachingLoadOptions] = useState<OptionItem[]>(
    []
  );
  const [degreeDisciplineOptions, setDegreeDisciplineOptions] = useState<
    OptionItem[]
  >([]);
  const [prcLicensureOptions, setPrcLicensureOptions] = useState<OptionItem[]>(
    []
  );
  const isFacultyMode = mode === "faculty";
  const pageTitle = isFacultyMode
    ? "Faculty information & management module"
    : "Employees and faculty";
  const pageDescription = isFacultyMode
    ? "Set up faculty college and department assignment details and teaching load information."
    : "Maintain employee master data, faculty flags, and teaching assignment context. Photo and signature upload to Cloudinary.";

  const clearField = (k: string) => {
    setFieldErrors((p) => {
      if (!p[k]) return p;
      const n = { ...p };
      delete n[k];
      return n;
    });
  };

  const loadRows = useCallback(async () => {
    setLoading(true);
    try {
      const q = hideInactive ? "?hide_inactive=true" : "";
      const res = await fetch(`${API}/api/employees${q}`);
      if (!res.ok) throw new Error("Failed to load employees");
      setRows(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [hideInactive]);

  const loadCampuses = useCallback(async () => {
    const res = await fetch(`${API}/api/campuses`);
    if (!res.ok) return;
    setCampuses(await res.json());
  }, []);

  const loadColleges = useCallback(async () => {
    const res = await fetch(`${API}/api/colleges`);
    if (!res.ok) return;
    setColleges(await res.json());
  }, []);

  const loadDepartments = useCallback(async () => {
    const res = await fetch(`${API}/api/departments`);
    if (!res.ok) return;
    setDepartments(await res.json());
  }, []);

  const loadPositions = useCallback(async () => {
    const res = await fetch(`${API}/api/positions`);
    if (!res.ok) return;
    setPositions(await res.json());
  }, []);

  const loadOptionItems = useCallback(async (category: OptionCategory) => {
    const res = await fetch(
      `${API}/api/employee-option-items?category=${encodeURIComponent(category)}`
    );
    if (!res.ok) return;
    const items: OptionItem[] = await res.json();
    if (category === "teaching_load_educ_level") setTeachingLoadOptions(items);
    if (category === "degree_discipline") setDegreeDisciplineOptions(items);
    if (category === "prc_licensure") setPrcLicensureOptions(items);
  }, []);

  const loadAllOptionItems = useCallback(async () => {
    await Promise.all([
      loadOptionItems("teaching_load_educ_level"),
      loadOptionItems("degree_discipline"),
      loadOptionItems("prc_licensure"),
    ]);
  }, [loadOptionItems]);

  useEffect(() => {
    loadCampuses();
    loadColleges();
    loadDepartments();
    loadPositions();
    loadAllOptionItems();
  }, [
    loadCampuses,
    loadColleges,
    loadDepartments,
    loadPositions,
    loadAllOptionItems,
  ]);

  useEffect(() => {
    loadRows();
  }, [loadRows]);

  const selected = rows.find((r) => r.id === selectedId) ?? null;

  useEffect(() => {
    if (!selected) return;
    let employment: "" | "full-time" | "part-time" = "";
    if (selected.is_full_time === true) employment = "full-time";
    else if (selected.is_full_time === false) employment = "part-time";
    setForm({
      employee_id: selected.employee_id,
      title: selected.title ?? "",
      last_name: selected.last_name,
      first_name: selected.first_name,
      middle_name: selected.middle_name ?? "",
      middle_initial: selected.middle_initial ?? "",
      suffix: selected.suffix ?? "",
      birthday: selected.birthday
        ? String(selected.birthday).slice(0, 10)
        : "",
      gender: selected.gender ?? "",
      civil_status: selected.civil_status ?? "",
      position_label: selected.position_label ?? "",
      position_id: selected.position_id
        ? String(selected.position_id)
        : "",
      department_label: selected.department_label ?? "",
      department_id: selected.department_id
        ? String(selected.department_id)
        : "",
      is_faculty: !!selected.is_faculty,
      is_inactive: !!selected.is_inactive,
      photo_url: selected.photo_url ?? "",
      signature_url: selected.signature_url ?? "",
      faculty_rank: selected.faculty_rank ?? "",
      employment,
      campus_id: selected.campus_id ? String(selected.campus_id) : "",
      college_id: selected.college_id ? String(selected.college_id) : "",
      teaching_load_educ_level: selected.teaching_load_educ_level ?? "",
      degree_discipline: selected.degree_discipline ?? "",
      prc_licensure: selected.prc_licensure ?? "",
    });
    setFieldErrors({});
  }, [selected]);

  const facultyColleges = useMemo(() => {
    if (!form.campus_id) return colleges;
    return colleges.filter(
      (c) => String(c.campus_id) === String(form.campus_id)
    );
  }, [colleges, form.campus_id]);

  const resetNew = () => {
    setSelectedId(null);
    setForm(emptyFormState());
    setFieldErrors({});
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.employee_id.trim()) e.employee_id = "Employee ID is required.";
    if (!form.last_name.trim()) e.last_name = "Last name is required.";
    if (!form.first_name.trim()) e.first_name = "First name is required.";
    if (form.is_faculty) {
      if (!form.faculty_rank.trim())
        e.faculty_rank = "Faculty rank is required for faculty.";
      if (!form.campus_id)
        e.campus_id = "Campus is required for faculty.";
      if (!form.college_id)
        e.college_id = "College is required for faculty.";
    }
    return e;
  };

  const buildBody = () => {
    const cid = form.campus_id ? parseInt(String(form.campus_id), 10) : null;
    const colid = form.college_id
      ? parseInt(String(form.college_id), 10)
      : null;
    let is_full_time: boolean | null = null;
    if (form.employment === "full-time") is_full_time = true;
    else if (form.employment === "part-time") is_full_time = false;
    const base = {
      employee_id: form.employee_id.trim(),
      title: form.title || null,
      last_name: form.last_name.trim(),
      first_name: form.first_name.trim(),
      middle_name: form.middle_name.trim() || null,
      middle_initial: form.middle_initial.trim() || null,
      suffix: form.suffix.trim() || null,
      birthday: form.birthday || null,
      gender: form.gender || null,
      civil_status: form.civil_status || null,
      position_label: form.position_label.trim() || null,
      position_id: (() => {
        if (!form.position_id) return null;
        const n = parseInt(String(form.position_id), 10);
        return Number.isFinite(n) ? n : null;
      })(),
      department_label: form.department_label.trim() || null,
      department_id: (() => {
        if (!form.department_id) return null;
        const n = parseInt(String(form.department_id), 10);
        return Number.isFinite(n) ? n : null;
      })(),
      is_faculty: form.is_faculty,
      is_inactive: form.is_inactive,
      photo_url: form.photo_url.trim() || null,
      signature_url: form.signature_url.trim() || null,
      faculty_rank: form.is_faculty ? form.faculty_rank.trim() || null : null,
      is_full_time: form.is_faculty ? is_full_time : null,
      campus_id: form.is_faculty ? cid : null,
      college_id: form.is_faculty ? colid : null,
      teaching_load_educ_level: form.is_faculty
        ? form.teaching_load_educ_level.trim() || null
        : null,
      degree_discipline: form.is_faculty
        ? form.degree_discipline.trim() || null
        : null,
      prc_licensure: form.is_faculty
        ? form.prc_licensure.trim() || null
        : null,
    };
    return base;
  };

  const handleSave = async () => {
    const e = validate();
    if (Object.keys(e).length) {
      setFieldErrors(e);
      setMessageVariant("error");
      setMessage("Please complete the required fields.");
      setTimeout(() => setMessage(null), 5000);
      return;
    }
    setFieldErrors({});
    setMessageVariant("info");
    setSaving(true);
    try {
      const body = buildBody();
      const url = selectedId
        ? `${API}/api/employees/${selectedId}`
        : `${API}/api/employees`;
      const res = await fetch(url, {
        method: selectedId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(result?.error || "Save failed");
      setSelectedId(result.id);
      setMessage("Saved.");
      await loadRows();
    } catch (err) {
      setMessageVariant("error");
      setMessage(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(null), 4000);
    }
  };

  const handleDelete = async () => {
    if (!selectedId) return;
    if (!confirm("Delete this employee record?")) return;
    setSaving(true);
    try {
      const res = await fetch(`${API}/api/employees/${selectedId}`, {
        method: "DELETE",
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(result?.error || "Delete failed");
      resetNew();
      await loadRows();
      setMessageVariant("info");
      setMessage("Deleted.");
    } catch (err) {
      setMessageVariant("error");
      setMessage(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(null), 4000);
    }
  };

  const campusLabel = (c: Campus) =>
    `${c.acronym}${c.campus_name ? ` — ${c.campus_name}` : ""}`;

  const getOptionsByCategory = (category: OptionCategory) => {
    if (category === "teaching_load_educ_level") return teachingLoadOptions;
    if (category === "degree_discipline") return degreeDisciplineOptions;
    return prcLicensureOptions;
  };

  const addOptionItem = async (
    category: OptionCategory,
    label: string,
    currentValue: string
  ) => {
    const input = prompt(`Add ${label} option`, currentValue || "");
    if (!input) return;
    const value = input.trim();
    if (!value) return;
    const res = await fetch(`${API}/api/employee-option-items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category, value }),
    });
    const result = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(result?.error || "Failed to add option");
    await loadOptionItems(category);
  };

  const editOptionItem = async (
    category: OptionCategory,
    label: string,
    selectedValue: string
  ) => {
    const options = getOptionsByCategory(category);
    const current = options.find((o) => o.value === selectedValue);
    if (!current) {
      throw new Error(`Select a ${label} option first.`);
    }
    const input = prompt(`Edit ${label} option`, current.value);
    if (!input) return;
    const value = input.trim();
    if (!value) return;
    const res = await fetch(`${API}/api/employee-option-items/${current.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ value }),
    });
    const result = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(result?.error || "Failed to edit option");
    await loadOptionItems(category);
    const k =
      category === "teaching_load_educ_level"
        ? "teaching_load_educ_level"
        : category === "degree_discipline"
          ? "degree_discipline"
          : "prc_licensure";
    setForm((s) => ({ ...s, [k]: value }));
  };

  const deleteOptionItem = async (
    category: OptionCategory,
    label: string,
    selectedValue: string
  ) => {
    const options = getOptionsByCategory(category);
    const current = options.find((o) => o.value === selectedValue);
    if (!current) {
      throw new Error(`Select a ${label} option first.`);
    }
    if (!confirm(`Delete selected ${label} option?`)) return;
    const res = await fetch(`${API}/api/employee-option-items/${current.id}`, {
      method: "DELETE",
    });
    const result = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(result?.error || "Failed to delete option");
    await loadOptionItems(category);
  };

  return (
    <div className="h-full bg-background relative overflow-x-hidden">
      <div className="w-full px-2 pt-2 pb-4">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h1 className="setup-type-page-title">{pageTitle}</h1>
            <p className="setup-type-page-desc">{pageDescription}</p>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <div className="setup-type-kicker-pill flex h-9 items-center rounded-xl border border-border/60 bg-background/70 px-3 shadow-sm backdrop-blur">
              Setup Manager module
            </div>
          </div>
        </div>

        <Card className="overflow-hidden rounded-2xl bg-background border-border/40 shadow-sm">
          <div className="px-4 py-3 flex items-center gap-3 border-b border-border/40 bg-muted/5">
            <div className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 p-2 rounded-xl border border-emerald-500/20 shadow-sm">
              {isFacultyMode ? (
                <UserSquare2 className="h-4 w-4" />
              ) : (
                <UserCog className="h-4 w-4" />
              )}
            </div>
            <div className="leading-tight min-w-0">
              <div className="setup-type-module-title truncate">{pageTitle}</div>
              <div className="setup-type-module-sub">
                {isFacultyMode
                  ? "Faculty assignment, teaching load, and supporting options"
                  : "Records, profile media, and faculty teaching context"}
              </div>
            </div>
          </div>

          <div className="p-3 bg-background/60">
            {message && (
              <div
                className={cn(
                  "mb-3 px-4 py-3 rounded-2xl text-xs border shadow-sm",
                  messageVariant === "error"
                    ? "border-destructive/50 bg-destructive/10 text-destructive"
                    : "border-border bg-muted/60"
                )}
              >
                {message}
              </div>
            )}

            <div className="grid grid-cols-12 gap-3 min-h-[620px]">
              {/* Left: employee form */}
              <div className="col-span-12 lg:col-span-3 flex flex-col rounded-2xl bg-card border border-border/40 shadow-sm min-h-0 max-h-[85vh] lg:max-h-none overflow-hidden">
                <div className="setup-type-section-title shrink-0 border-b border-border/60 bg-muted/5 px-3 py-2">
                  Employee information
                </div>
                <div className="flex-1 overflow-y-auto p-3 space-y-2.5 min-h-0">
                  <div className="flex flex-col items-center gap-1.5">
                    <div className="w-28 h-32 border border-border/60 rounded-xl bg-muted/20 flex items-center justify-center overflow-hidden shadow-inner ring-1 ring-black/4 dark:ring-white/6">
                      {form.photo_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={form.photo_url}
                          alt=""
                          className="max-w-full max-h-full object-contain"
                        />
                      ) : (
                        <User className="h-14 w-14 text-muted-foreground/35" />
                      )}
                    </div>
                    <input
                      ref={photoRef}
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={async (ev) => {
                        const f = ev.target.files?.[0];
                        ev.target.value = "";
                        if (!f) return;
                        setPhotoBusy(true);
                        try {
                          const { url } = await uploadImageToCloudinary(
                            f,
                            "sms/employee-photos"
                          );
                          setForm((s) => ({ ...s, photo_url: url }));
                        } catch (err) {
                          setMessageVariant("error");
                          setMessage(
                            err instanceof Error ? err.message : "Photo upload failed"
                          );
                          setTimeout(() => setMessage(null), 4000);
                        } finally {
                          setPhotoBusy(false);
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 rounded-xl text-xs font-semibold gap-1.5"
                      disabled={photoBusy}
                      onClick={() => photoRef.current?.click()}
                    >
                      {photoBusy ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Upload className="h-3 w-3" />
                      )}
                      Photo
                    </Button>
                  </div>

                  <div className="flex items-center justify-end gap-2">
                    <Label htmlFor="emp-inactive" className="text-[10px]">
                      In-active
                    </Label>
                    <Checkbox
                      id="emp-inactive"
                      checked={form.is_inactive}
                      onCheckedChange={(v) =>
                        setForm((s) => ({ ...s, is_inactive: !!v }))
                      }
                    />
                  </div>

                  <div className="space-y-0.5">
                    <Label className="text-[10px]">
                      Employee ID
                      <Req />
                    </Label>
                    <Input
                      className={cn(
                        "h-8 rounded-xl text-xs border-border/60 shadow-sm",
                        fieldErrors.employee_id &&
                          "border-destructive ring-1 ring-destructive/30"
                      )}
                      value={form.employee_id}
                      onChange={(e) => {
                        clearField("employee_id");
                        setForm((s) => ({ ...s, employee_id: e.target.value }));
                      }}
                    />
                    {fieldErrors.employee_id && (
                      <p className="text-[9px] text-destructive">
                        {fieldErrors.employee_id}
                      </p>
                    )}
                  </div>

                  <div className="space-y-0.5">
                    <Label className="text-[10px]">Title</Label>
                    <Select
                      value={form.title || NONE}
                      onValueChange={(v) =>
                        setForm((s) => ({
                          ...s,
                          title: v === NONE ? "" : v,
                        }))
                      }
                    >
                      <SelectTrigger className="h-8 rounded-xl text-xs border-border/60 shadow-sm">
                        <SelectValue placeholder="—" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NONE}>—</SelectItem>
                        {TITLES.map((t) => (
                          <SelectItem key={t} value={t}>
                            {t}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-0.5">
                    <Label className="text-[10px]">
                      Last name
                      <Req />
                    </Label>
                    <Input
                      className={cn(
                        "h-8 rounded-xl text-xs border-border/60 shadow-sm",
                        fieldErrors.last_name &&
                          "border-destructive ring-1 ring-destructive/30"
                      )}
                      value={form.last_name}
                      onChange={(e) => {
                        clearField("last_name");
                        setForm((s) => ({ ...s, last_name: e.target.value }));
                      }}
                    />
                    {fieldErrors.last_name && (
                      <p className="text-[9px] text-destructive">
                        {fieldErrors.last_name}
                      </p>
                    )}
                  </div>
                  <div className="space-y-0.5">
                    <Label className="text-[10px]">
                      First name
                      <Req />
                    </Label>
                    <Input
                      className={cn(
                        "h-8 rounded-xl text-xs border-border/60 shadow-sm",
                        fieldErrors.first_name &&
                          "border-destructive ring-1 ring-destructive/30"
                      )}
                      value={form.first_name}
                      onChange={(e) => {
                        clearField("first_name");
                        setForm((s) => ({ ...s, first_name: e.target.value }));
                      }}
                    />
                    {fieldErrors.first_name && (
                      <p className="text-[9px] text-destructive">
                        {fieldErrors.first_name}
                      </p>
                    )}
                  </div>
                  <div className="space-y-0.5">
                    <Label className="text-[10px]">Middle name</Label>
                    <Input
                      className="h-8 rounded-xl text-xs border-border/60 shadow-sm"
                      value={form.middle_name}
                      onChange={(e) =>
                        setForm((s) => ({ ...s, middle_name: e.target.value }))
                      }
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-1">
                    <div className="space-y-0.5">
                      <Label className="text-[10px]">M.I.</Label>
                      <Input
                        className="h-8 rounded-xl text-xs border-border/60 shadow-sm"
                        value={form.middle_initial}
                        onChange={(e) =>
                          setForm((s) => ({
                            ...s,
                            middle_initial: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-0.5">
                      <Label className="text-[10px]">Suffix</Label>
                      <Input
                        className="h-8 rounded-xl text-xs border-border/60 shadow-sm"
                        value={form.suffix}
                        onChange={(e) =>
                          setForm((s) => ({ ...s, suffix: e.target.value }))
                        }
                      />
                    </div>
                  </div>
                  <div className="space-y-0.5">
                    <Label className="text-[10px]">Birthday</Label>
                    <Input
                      type="date"
                      className="h-8 rounded-xl text-xs border-border/60 shadow-sm"
                      value={form.birthday}
                      onChange={(e) =>
                        setForm((s) => ({ ...s, birthday: e.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-0.5">
                    <Label className="text-[10px]">Gender</Label>
                    <Select
                      value={form.gender || NONE}
                      onValueChange={(v) =>
                        setForm((s) => ({
                          ...s,
                          gender: v === NONE ? "" : v,
                        }))
                      }
                    >
                      <SelectTrigger className="h-8 rounded-xl text-xs border-border/60 shadow-sm">
                        <SelectValue placeholder="—" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NONE}>—</SelectItem>
                        {GENDERS.map((g) => (
                          <SelectItem key={g} value={g}>
                            {g}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-0.5">
                    <Label className="text-[10px]">Civil status</Label>
                    <Select
                      value={form.civil_status || NONE}
                      onValueChange={(v) =>
                        setForm((s) => ({
                          ...s,
                          civil_status: v === NONE ? "" : v,
                        }))
                      }
                    >
                      <SelectTrigger className="h-8 rounded-xl text-xs border-border/60 shadow-sm">
                        <SelectValue placeholder="—" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NONE}>—</SelectItem>
                        {CIVIL.map((c) => (
                          <SelectItem key={c} value={c}>
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-0.5">
                    <Label className="text-[10px]">Position</Label>
                    <div className="flex gap-1">
                      <Select
                        value={form.position_id || NONE}
                        onValueChange={(v) => {
                          if (v === NONE) {
                            setForm((s) => ({
                              ...s,
                              position_id: "",
                              position_label: "",
                            }));
                            return;
                          }
                          const p = positions.find((x) => String(x.id) === v);
                          setForm((s) => ({
                            ...s,
                            position_id: v,
                            position_label:
                              p?.position_title ?? s.position_label,
                          }));
                        }}
                      >
                        <SelectTrigger className="h-8 rounded-xl text-xs border-border/60 shadow-sm flex-1 min-w-0">
                          <SelectValue placeholder="—" />
                        </SelectTrigger>
                        <SelectContent className="max-h-60">
                          <SelectItem value={NONE}>—</SelectItem>
                          {positions.map((p) => (
                            <SelectItem key={p.id} value={String(p.id)}>
                              {p.position_title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 shrink-0 rounded-xl border border-amber-500/50 shadow-sm"
                        title="Maintain positions"
                        onClick={() => setMaintainPosOpen(true)}
                      >
                        <PenSquare className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-0.5">
                    <Label className="text-[10px]">Department</Label>
                    <div className="flex gap-1">
                      <Select
                        value={form.department_id || NONE}
                        onValueChange={(v) => {
                          if (v === NONE) {
                            setForm((s) => ({
                              ...s,
                              department_id: "",
                              department_label: "",
                            }));
                            return;
                          }
                          const d = departments.find(
                            (x) => String(x.id) === v
                          );
                          setForm((s) => ({
                            ...s,
                            department_id: v,
                            department_label: d?.dept_name ?? s.department_label,
                          }));
                        }}
                      >
                        <SelectTrigger className="h-8 rounded-xl text-xs border-border/60 shadow-sm flex-1 min-w-0">
                          <SelectValue placeholder="—" />
                        </SelectTrigger>
                        <SelectContent className="max-h-60">
                          <SelectItem value={NONE}>—</SelectItem>
                          {departments.map((d) => (
                            <SelectItem key={d.id} value={String(d.id)}>
                              {d.dept_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 shrink-0 rounded-xl border border-amber-500/50 shadow-sm"
                        title="Maintain departments"
                        onClick={() => setMaintainDeptOpen(true)}
                      >
                        <PenSquare className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <Checkbox
                      id="is-faculty"
                      checked={form.is_faculty}
                      onCheckedChange={(v) =>
                        setForm((s) => ({ ...s, is_faculty: !!v }))
                      }
                    />
                    <Label htmlFor="is-faculty" className="text-[10px]">
                      Faculty information
                    </Label>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[10px]">Signature</Label>
                    <div className="h-16 border border-dashed border-border/60 rounded-xl flex items-center justify-center bg-muted/15 overflow-hidden">
                      {form.signature_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={form.signature_url}
                          alt=""
                          className="max-h-full max-w-full object-contain"
                        />
                      ) : (
                        <span className="text-[9px] text-muted-foreground">
                          No signature
                        </span>
                      )}
                    </div>
                    <input
                      ref={sigRef}
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={async (ev) => {
                        const f = ev.target.files?.[0];
                        ev.target.value = "";
                        if (!f) return;
                        setSigBusy(true);
                        try {
                          const { url } = await uploadImageToCloudinary(
                            f,
                            "sms/employee-signatures"
                          );
                          setForm((s) => ({ ...s, signature_url: url }));
                        } catch (err) {
                          setMessageVariant("error");
                          setMessage(
                            err instanceof Error
                              ? err.message
                              : "Signature upload failed"
                          );
                          setTimeout(() => setMessage(null), 4000);
                        } finally {
                          setSigBusy(false);
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 rounded-xl text-xs font-semibold w-full gap-1.5"
                      disabled={sigBusy}
                      onClick={() => sigRef.current?.click()}
                    >
                      {sigBusy ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Upload className="h-3 w-3" />
                      )}
                      Load signature
                    </Button>
                  </div>
                </div>
                <div className="px-3 py-2 border-t border-border/60 bg-muted/15 shrink-0 flex items-center justify-between gap-2">
                  <span className="text-[11px] font-medium text-muted-foreground">
                    Total records
                  </span>
                  <span className="text-[11px] font-semibold tabular-nums">
                    {rows.length}
                  </span>
                </div>
              </div>

              {/* Right: grid + faculty tabs */}
              <div className="col-span-12 lg:col-span-9 flex flex-col gap-2 min-h-0 min-w-0">
                <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-border/60 p-2 bg-muted/15 shadow-sm">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-9 rounded-xl text-xs font-semibold gap-2"
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
                    className="h-9 rounded-xl text-xs font-semibold gap-2"
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
                    className="h-9 rounded-xl text-xs font-semibold gap-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
                    disabled={saving || !selectedId}
                    onClick={handleDelete}
                  >
                    <Trash2 className="h-3 w-3" />
                    Delete
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-9 rounded-xl text-xs opacity-50"
                    disabled
                    title="Coming soon"
                  >
                    Import
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-9 rounded-xl text-xs opacity-50"
                    disabled
                    title="Coming soon"
                  >
                    Export
                  </Button>
                  <div className="flex-1" />
                  <div className="flex items-center gap-1.5">
                    <Checkbox
                      id="hide-inactive"
                      checked={hideInactive}
                      onCheckedChange={(v) => setHideInactive(!!v)}
                    />
                    <Label htmlFor="hide-inactive" className="text-[10px] cursor-pointer">
                      Hide inactive records
                    </Label>
                  </div>
                </div>

                <div className="flex-1 min-h-[220px] rounded-2xl border border-border/60 overflow-auto bg-card shadow-sm premium-surface">
                  <table className="w-full text-[10px] border-collapse min-w-[1100px]">
                    <thead>
                      <tr className="sticky top-0 z-20 bg-muted/50 text-left shadow-sm">
                        <th className="setup-type-table-header sticky left-0 z-30 border-b border-r border-border/60 bg-muted/95 px-2 py-2 text-left backdrop-blur-sm">
                          ID
                        </th>
                        <th className="setup-type-table-header border-b border-r border-border/60 px-2 py-2 text-left">
                          Prefix
                        </th>
                        <th className="setup-type-table-header border-b border-r border-border/60 px-2 py-2 text-left">
                          Last
                        </th>
                        <th className="setup-type-table-header border-b border-r border-border/60 px-2 py-2 text-left">
                          First
                        </th>
                        <th className="setup-type-table-header border-b border-r border-border/60 px-2 py-2 text-left">
                          Mid
                        </th>
                        <th className="setup-type-table-header border-b border-r border-border/60 px-2 py-2 text-left">
                          MI
                        </th>
                        <th className="setup-type-table-header border-b border-r border-border/60 px-2 py-2 text-left">
                          Ext
                        </th>
                        <th className="setup-type-table-header border-b border-r border-border/60 px-2 py-2 text-left">
                          Birth
                        </th>
                        <th className="setup-type-table-header border-b border-r border-border/60 px-2 py-2 text-left">
                          Gender
                        </th>
                        <th className="setup-type-table-header border-b border-r border-border/60 px-2 py-2 text-left">
                          Civil
                        </th>
                        <th className="setup-type-table-header border-b border-r border-border/60 px-2 py-2 text-left">
                          Position
                        </th>
                        <th className="setup-type-table-header border-b border-r border-border/60 px-2 py-2 text-left">
                          Dept
                        </th>
                        <th className="setup-type-table-header border-b border-r border-border/60 px-2 py-2 text-left">
                          Rank
                        </th>
                        <th className="setup-type-table-header w-8 border-b border-r border-border/60 px-2 py-2 text-center">
                          FT
                        </th>
                        <th className="setup-type-table-header border-b border-r border-border/60 px-2 py-2 text-left">
                          Campus
                        </th>
                        <th className="setup-type-table-header border-b border-border/60 px-2 py-2 text-left">
                          College
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr>
                          <td colSpan={16} className="p-4 text-muted-foreground">
                            Loading…
                          </td>
                        </tr>
                      ) : rows.length === 0 ? (
                        <tr>
                          <td colSpan={16} className="p-4 italic text-muted-foreground">
                            No employees yet.
                          </td>
                        </tr>
                      ) : (
                        rows.map((r, idx) => (
                          <tr
                            key={r.id}
                            role="button"
                            tabIndex={0}
                            onClick={() => setSelectedId(r.id)}
                            onKeyDown={(ev) => {
                              if (ev.key === "Enter" || ev.key === " ") {
                                ev.preventDefault();
                                setSelectedId(r.id);
                              }
                            }}
                            className={cn(
                              "premium-row cursor-pointer border-b border-border/40 transition-colors",
                              idx % 2 === 1 && "bg-muted/10",
                              selectedId === r.id &&
                                "bg-emerald-500/10 font-medium ring-1 ring-inset ring-emerald-500/15"
                            )}
                          >
                            <td
                              className={cn(
                                "setup-font-mono-data px-2 py-1 border-r border-border/50 sticky left-0 z-1 backdrop-blur-sm",
                                selectedId === r.id
                                  ? "bg-emerald-500/15"
                                  : idx % 2 === 1
                                    ? "bg-muted/10"
                                    : "bg-background/95"
                              )}
                            >
                              {r.employee_id}
                            </td>
                            <td className="px-2 py-1 border-r border-border/30 truncate max-w-[52px]">
                              {r.title ?? "—"}
                            </td>
                            <td className="px-2 py-1 border-r border-border/30 truncate max-w-[72px]">
                              {r.last_name}
                            </td>
                            <td className="px-2 py-1 border-r border-border/30 truncate max-w-[72px]">
                              {r.first_name}
                            </td>
                            <td className="px-2 py-1 border-r border-border/30 truncate max-w-[56px]">
                              {r.middle_name ?? "—"}
                            </td>
                            <td className="px-2 py-1 border-r border-border/30">
                              {r.middle_initial ?? "—"}
                            </td>
                            <td className="px-2 py-1 border-r border-border/30">
                              {r.suffix ?? "—"}
                            </td>
                            <td className="px-2 py-1 border-r border-border/30 whitespace-nowrap">
                              {r.birthday
                                ? String(r.birthday).slice(0, 10)
                                : "—"}
                            </td>
                            <td className="px-2 py-1 border-r border-border/30 truncate max-w-[48px]">
                              {r.gender ?? "—"}
                            </td>
                            <td className="px-2 py-1 border-r border-border/30 truncate max-w-[56px]">
                              {r.civil_status ?? "—"}
                            </td>
                            <td className="px-2 py-1 border-r border-border/30 truncate max-w-[100px]">
                              {r.position_title_ref ??
                                r.position_label ??
                                "—"}
                            </td>
                            <td className="px-2 py-1 border-r border-border/30 truncate max-w-[80px]">
                              {r.department_name ??
                                r.department_label ??
                                "—"}
                            </td>
                            <td className="px-2 py-1 border-r border-border/30 truncate max-w-[72px]">
                              {r.faculty_rank ?? "—"}
                            </td>
                            <td className="px-2 py-1 border-r border-border/30 text-center">
                              <Checkbox
                                checked={r.is_full_time === true}
                                disabled
                                className="h-3 w-3"
                                aria-hidden
                              />
                            </td>
                            <td className="px-2 py-1 border-r border-border/30 truncate max-w-[80px]">
                              {r.campus_acronym ?? "—"}
                            </td>
                            <td className="px-2 py-1 truncate max-w-[100px]">
                              {r.college_code ?? r.college_name ?? "—"}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="flex-1 min-h-[200px] rounded-2xl border border-border/60 bg-card shadow-sm flex flex-col overflow-hidden premium-card premium-surface">
                  <Tabs defaultValue="faculty" className="flex flex-col flex-1 min-h-0">
                    <TabsList className="h-auto flex-wrap gap-1 p-1.5 w-full justify-start rounded-none border-b border-border/60 bg-muted/20">
                      <TabsTrigger
                        value="faculty"
                        className="rounded-xl px-3 py-2 text-[11px] font-semibold data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-foreground text-muted-foreground"
                      >
                        Faculty / teaching load
                      </TabsTrigger>
                      <TabsTrigger
                        value="subjects"
                        className="rounded-xl px-3 py-2 text-[11px] font-semibold data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-foreground text-muted-foreground"
                      >
                        Subjects taught
                      </TabsTrigger>
                      <TabsTrigger
                        value="history"
                        className="rounded-xl px-3 py-2 text-[11px] font-semibold data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-foreground text-muted-foreground"
                      >
                        Teaching load history
                      </TabsTrigger>
                    </TabsList>
                    <TabsContent
                      value="faculty"
                      className="m-0 flex-1 overflow-y-auto p-3 bg-muted/10 outline-none"
                    >
                      {!form.is_faculty ? (
                        <p className="text-sm text-muted-foreground italic border border-dashed border-border/60 rounded-xl bg-background/80 p-4 shadow-sm">
                          Check &quot;Faculty information&quot; on the left to edit
                          faculty fields.
                        </p>
                      ) : (
                        <>
                          <div className="rounded-2xl border border-border/60 bg-card shadow-sm overflow-hidden border border-border/40">
                            <div className="setup-type-section-title border-b border-border/60 bg-muted/5 px-3 py-2">
                              Faculty / Teaching Load Information
                            </div>
                            <div className="p-3 grid grid-cols-12 gap-2 items-end">
                            <div className="space-y-0.5 col-span-12 md:col-span-5">
                              <Label className="text-[10px]">
                                Faculty rank
                                <Req />
                              </Label>
                              <Input
                                className={cn(
                                  "h-8 rounded-xl text-xs border-border/60 shadow-sm",
                                  fieldErrors.faculty_rank &&
                                    "border-destructive ring-1 ring-destructive/30"
                                )}
                                placeholder="e.g. Instructor III"
                                value={form.faculty_rank}
                                onChange={(e) => {
                                  clearField("faculty_rank");
                                  setForm((s) => ({
                                    ...s,
                                    faculty_rank: e.target.value,
                                  }));
                                }}
                              />
                              {fieldErrors.faculty_rank && (
                                <p className="text-[9px] text-destructive">
                                  {fieldErrors.faculty_rank}
                                </p>
                              )}
                            </div>
                            <div className="space-y-1 col-span-12 md:col-span-7">
                              <Label className="text-[10px]">Employment</Label>
                              <div className="flex gap-4 h-9 items-center rounded-xl border border-border/60 bg-background px-3 shadow-sm">
                                <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                                  <input
                                    type="radio"
                                    name="emp-ft"
                                    checked={form.employment === "full-time"}
                                    onChange={() =>
                                      setForm((s) => ({
                                        ...s,
                                        employment: "full-time",
                                      }))
                                    }
                                  />
                                  Full-time
                                </label>
                                <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                                  <input
                                    type="radio"
                                    name="emp-ft"
                                    checked={form.employment === "part-time"}
                                    onChange={() =>
                                      setForm((s) => ({
                                        ...s,
                                        employment: "part-time",
                                      }))
                                    }
                                  />
                                  Part-time
                                </label>
                              </div>
                            </div>
                            <div className="space-y-0.5 col-span-12 md:col-span-6">
                              <Label className="text-[10px]">
                                Campus
                                <Req />
                              </Label>
                              <Select
                                value={form.campus_id || "none"}
                                onValueChange={(v) => {
                                  clearField("campus_id");
                                  setForm((s) => ({
                                    ...s,
                                    campus_id: v === "none" ? "" : v,
                                    college_id: "",
                                  }));
                                }}
                              >
                                <SelectTrigger
                                  className={cn(
                                    "h-8 rounded-xl text-xs border-border/60 shadow-sm",
                                    fieldErrors.campus_id &&
                                      "border-destructive ring-1 ring-destructive/30"
                                  )}
                                >
                                  <SelectValue placeholder="Select" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="none">—</SelectItem>
                                  {campuses.map((c) => (
                                    <SelectItem
                                      key={c.id}
                                      value={String(c.id)}
                                    >
                                      {campusLabel(c)}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              {fieldErrors.campus_id && (
                                <p className="text-[9px] text-destructive">
                                  {fieldErrors.campus_id}
                                </p>
                              )}
                            </div>
                            <div className="space-y-0.5 col-span-12 md:col-span-6">
                              <Label className="text-[10px]">
                                College
                                <Req />
                              </Label>
                              <Select
                                value={form.college_id || "none"}
                                onValueChange={(v) => {
                                  clearField("college_id");
                                  setForm((s) => ({
                                    ...s,
                                    college_id: v === "none" ? "" : v,
                                  }));
                                }}
                              >
                                <SelectTrigger
                                  className={cn(
                                    "h-8 rounded-xl text-xs border-border/60 shadow-sm",
                                    fieldErrors.college_id &&
                                      "border-destructive ring-1 ring-destructive/30"
                                  )}
                                >
                                  <SelectValue placeholder="Select" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="none">—</SelectItem>
                                  {facultyColleges.map((c) => (
                                    <SelectItem
                                      key={c.id}
                                      value={String(c.id)}
                                    >
                                      {c.college_code} — {c.college_name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              {fieldErrors.college_id && (
                                <p className="text-[9px] text-destructive">
                                  {fieldErrors.college_id}
                                </p>
                              )}
                            </div>
                            <div className="space-y-0.5 col-span-12">
                              <Label className="text-[10px]">
                                Teaching load educ. level
                              </Label>
                              <Select
                                value={form.teaching_load_educ_level || "none"}
                                onValueChange={(v) =>
                                  setForm((s) => ({
                                    ...s,
                                    teaching_load_educ_level:
                                      v === "none" ? "" : v,
                                  }))
                                }
                              >
                                <SelectTrigger className="h-8 rounded-xl text-xs border-border/60 shadow-sm">
                                  <SelectValue placeholder="Select" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="none">—</SelectItem>
                                  {teachingLoadOptions.map((opt) => (
                                    <SelectItem key={opt.id} value={opt.value}>
                                      {opt.value}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <div className="flex flex-wrap gap-1 pt-0.5">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="h-6 px-2 text-[10px]"
                                  onClick={async () => {
                                    try {
                                      await addOptionItem(
                                        "teaching_load_educ_level",
                                        "teaching load educ. level",
                                        form.teaching_load_educ_level
                                      );
                                    } catch (err) {
                                      setMessageVariant("error");
                                      setMessage(
                                        err instanceof Error
                                          ? err.message
                                          : "Failed to add option"
                                      );
                                    }
                                  }}
                                >
                                  Add
                                </Button>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="h-6 px-2 text-[10px]"
                                  onClick={async () => {
                                    try {
                                      await editOptionItem(
                                        "teaching_load_educ_level",
                                        "teaching load educ. level",
                                        form.teaching_load_educ_level
                                      );
                                    } catch (err) {
                                      setMessageVariant("error");
                                      setMessage(
                                        err instanceof Error
                                          ? err.message
                                          : "Failed to edit option"
                                      );
                                    }
                                  }}
                                >
                                  Edit
                                </Button>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="h-6 px-2 text-[10px]"
                                  onClick={async () => {
                                    try {
                                      await deleteOptionItem(
                                        "teaching_load_educ_level",
                                        "teaching load educ. level",
                                        form.teaching_load_educ_level
                                      );
                                      setForm((s) => ({
                                        ...s,
                                        teaching_load_educ_level: "",
                                      }));
                                    } catch (err) {
                                      setMessageVariant("error");
                                      setMessage(
                                        err instanceof Error
                                          ? err.message
                                          : "Failed to delete option"
                                      );
                                    }
                                  }}
                                >
                                  Delete
                                </Button>
                              </div>
                            </div>
                            <div className="space-y-0.5 col-span-12">
                              <Label className="text-[10px]">
                                Degree discipline
                              </Label>
                              <Select
                                value={form.degree_discipline || "none"}
                                onValueChange={(v) =>
                                  setForm((s) => ({
                                    ...s,
                                    degree_discipline: v === "none" ? "" : v,
                                  }))
                                }
                              >
                                <SelectTrigger className="h-8 rounded-xl text-xs border-border/60 shadow-sm">
                                  <SelectValue placeholder="Select" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="none">—</SelectItem>
                                  {degreeDisciplineOptions.map((opt) => (
                                    <SelectItem key={opt.id} value={opt.value}>
                                      {opt.value}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <div className="flex flex-wrap gap-1 pt-0.5">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="h-6 px-2 text-[10px]"
                                  onClick={async () => {
                                    try {
                                      await addOptionItem(
                                        "degree_discipline",
                                        "degree discipline",
                                        form.degree_discipline
                                      );
                                    } catch (err) {
                                      setMessageVariant("error");
                                      setMessage(
                                        err instanceof Error
                                          ? err.message
                                          : "Failed to add option"
                                      );
                                    }
                                  }}
                                >
                                  Add
                                </Button>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="h-6 px-2 text-[10px]"
                                  onClick={async () => {
                                    try {
                                      await editOptionItem(
                                        "degree_discipline",
                                        "degree discipline",
                                        form.degree_discipline
                                      );
                                    } catch (err) {
                                      setMessageVariant("error");
                                      setMessage(
                                        err instanceof Error
                                          ? err.message
                                          : "Failed to edit option"
                                      );
                                    }
                                  }}
                                >
                                  Edit
                                </Button>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="h-6 px-2 text-[10px]"
                                  onClick={async () => {
                                    try {
                                      await deleteOptionItem(
                                        "degree_discipline",
                                        "degree discipline",
                                        form.degree_discipline
                                      );
                                      setForm((s) => ({
                                        ...s,
                                        degree_discipline: "",
                                      }));
                                    } catch (err) {
                                      setMessageVariant("error");
                                      setMessage(
                                        err instanceof Error
                                          ? err.message
                                          : "Failed to delete option"
                                      );
                                    }
                                  }}
                                >
                                  Delete
                                </Button>
                              </div>
                            </div>
                            <div className="space-y-0.5 col-span-12">
                              <Label className="text-[10px]">
                                PRC licensure
                              </Label>
                              <Select
                                value={form.prc_licensure || "none"}
                                onValueChange={(v) =>
                                  setForm((s) => ({
                                    ...s,
                                    prc_licensure: v === "none" ? "" : v,
                                  }))
                                }
                              >
                                <SelectTrigger className="h-8 rounded-xl text-xs border-border/60 shadow-sm">
                                  <SelectValue placeholder="Select" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="none">—</SelectItem>
                                  {prcLicensureOptions.map((opt) => (
                                    <SelectItem key={opt.id} value={opt.value}>
                                      {opt.value}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <div className="flex flex-wrap gap-1 pt-0.5">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="h-6 px-2 text-[10px]"
                                  onClick={async () => {
                                    try {
                                      await addOptionItem(
                                        "prc_licensure",
                                        "PRC licensure",
                                        form.prc_licensure
                                      );
                                    } catch (err) {
                                      setMessageVariant("error");
                                      setMessage(
                                        err instanceof Error
                                          ? err.message
                                          : "Failed to add option"
                                      );
                                    }
                                  }}
                                >
                                  Add
                                </Button>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="h-6 px-2 text-[10px]"
                                  onClick={async () => {
                                    try {
                                      await editOptionItem(
                                        "prc_licensure",
                                        "PRC licensure",
                                        form.prc_licensure
                                      );
                                    } catch (err) {
                                      setMessageVariant("error");
                                      setMessage(
                                        err instanceof Error
                                          ? err.message
                                          : "Failed to edit option"
                                      );
                                    }
                                  }}
                                >
                                  Edit
                                </Button>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="h-6 px-2 text-[10px]"
                                  onClick={async () => {
                                    try {
                                      await deleteOptionItem(
                                        "prc_licensure",
                                        "PRC licensure",
                                        form.prc_licensure
                                      );
                                      setForm((s) => ({
                                        ...s,
                                        prc_licensure: "",
                                      }));
                                    } catch (err) {
                                      setMessageVariant("error");
                                      setMessage(
                                        err instanceof Error
                                          ? err.message
                                          : "Failed to delete option"
                                      );
                                    }
                                  }}
                                >
                                  Delete
                                </Button>
                              </div>
                            </div>
                          </div>
                          </div>
                        </>
                      )}
                    </TabsContent>
                    <TabsContent
                      value="subjects"
                      className="m-0 flex-1 p-4 text-sm text-muted-foreground italic outline-none"
                    >
                      <div className="rounded-xl border border-border/60 bg-background/80 p-4 shadow-sm">
                        Subject assignments will connect to curriculum data in a
                        later phase.
                      </div>
                    </TabsContent>
                    <TabsContent
                      value="history"
                      className="m-0 flex-1 p-4 text-sm text-muted-foreground italic outline-none"
                    >
                      <div className="rounded-xl border border-border/60 bg-background/80 p-4 shadow-sm">
                        Teaching load history will be available when scheduling
                        and loads are integrated.
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
      <MaintainDepartmentsDialog
        open={maintainDeptOpen}
        onOpenChange={setMaintainDeptOpen}
        onSaved={loadDepartments}
      />
      <MaintainPositionsDialog
        open={maintainPosOpen}
        onOpenChange={setMaintainPosOpen}
        onSaved={loadPositions}
      />
    </div>
  );
}
