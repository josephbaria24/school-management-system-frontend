"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { User, UserSquare2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

/** Read-only value slot — matches height/radius of inputs for visual consistency */
function ReadOnlyField({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex min-h-10 w-full items-center rounded-xl border border-border/60 bg-background px-3 py-2.5 text-sm font-medium text-foreground shadow-sm",
        className
      )}
    >
      {children}
    </div>
  );
}

const API = process.env.NEXT_PUBLIC_API_URL;
const NONE = "__none__";

type EmployeeRow = {
  id: number;
  employee_id: string;
  title: string | null;
  last_name: string;
  first_name: string;
  middle_name: string | null;
  suffix: string | null;
  birthday: string | null;
  gender: string | null;
  position_label: string | null;
  position_title_ref?: string | null;
  department_label: string | null;
  department_name?: string | null;
  faculty_rank: string | null;
  is_full_time: boolean | null;
  campus_id: number | null;
  college_id: number | null;
  campus_acronym?: string | null;
  college_code?: string | null;
  teaching_load_educ_level: string | null;
  degree_discipline: string | null;
  prc_licensure: string | null;
};

type Campus = { id: number; acronym: string; campus_name: string | null };
type CollegeRow = {
  id: number;
  campus_id: number;
  college_code: string;
  college_name: string;
};
type OptionItem = { id: number; value: string };

export function FacultyInformationModule() {
  const [rows, setRows] = useState<EmployeeRow[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [colleges, setColleges] = useState<CollegeRow[]>([]);
  const [teachingLoadOptions, setTeachingLoadOptions] = useState<OptionItem[]>([]);
  const [degreeDisciplineOptions, setDegreeDisciplineOptions] = useState<OptionItem[]>([]);
  const [prcLicensureOptions, setPrcLicensureOptions] = useState<OptionItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [e, c, col, t, d, p] = await Promise.all([
          fetch(`${API}/api/employees?hide_inactive=true`),
          fetch(`${API}/api/campuses`),
          fetch(`${API}/api/colleges`),
          fetch(`${API}/api/employee-option-items?category=teaching_load_educ_level`),
          fetch(`${API}/api/employee-option-items?category=degree_discipline`),
          fetch(`${API}/api/employee-option-items?category=prc_licensure`),
        ]);
        const employees: EmployeeRow[] = e.ok ? await e.json() : [];
        setRows(employees);
        setCampuses(c.ok ? await c.json() : []);
        setColleges(col.ok ? await col.json() : []);
        setTeachingLoadOptions(t.ok ? await t.json() : []);
        setDegreeDisciplineOptions(d.ok ? await d.json() : []);
        setPrcLicensureOptions(p.ok ? await p.json() : []);
        if (employees.length > 0) setSelectedId(employees[0].id);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const selected = rows.find((r) => r.id === selectedId) ?? null;
  const fullName = selected
    ? `${selected.last_name}, ${selected.first_name}${selected.middle_name ? ` ${selected.middle_name}` : ""}${selected.suffix ? ` ${selected.suffix}` : ""}`
    : "";
  const campusOptions = useMemo(() => campuses, [campuses]);
  const collegeOptions = useMemo(() => {
    if (!selected?.campus_id) return colleges;
    return colleges.filter((c) => c.campus_id === selected.campus_id);
  }, [colleges, selected?.campus_id]);

  return (
    <div className="h-full bg-background relative overflow-x-hidden">
      <div className="w-full px-2 pt-2 pb-4">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h1 className="setup-type-page-title">Faculty information</h1>
            <p className="setup-type-page-desc">
              Review faculty assignments and teaching-load fields. Data is read-only
              here; edit on Employees &amp; Faculty Info.
            </p>
          </div>
          <div className="hidden sm:flex flex-col items-end gap-2">
            <div className="setup-type-kicker-pill flex h-9 items-center rounded-xl border border-border/60 bg-background/70 px-3 shadow-sm backdrop-blur">
              Setup Manager module
            </div>
            <div className="setup-type-kicker-pill rounded-xl border border-border/60 bg-muted/30 px-2.5 py-1">
              Enrollment System v2.0
            </div>
          </div>
        </div>

        <Card className="overflow-hidden rounded-2xl bg-background border-border/40 shadow-sm">
          <div className="px-4 py-3 flex flex-wrap items-center justify-between gap-3 border-b border-border/40 bg-muted/5">
            <div className="flex items-center gap-3 min-w-0">
              <div className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 p-2 rounded-xl border border-emerald-500/20 shadow-sm shrink-0">
                <UserSquare2 className="h-4 w-4" />
              </div>
              <div className="leading-tight min-w-0">
                <div className="setup-type-module-title">
                  Faculty information &amp; management
                </div>
                <div className="setup-type-module-sub">
                  College, campus, rank, and credential context for each faculty member
                </div>
              </div>
            </div>
          </div>

          <div className="p-3 bg-background/60 space-y-3">
            <div className="grid grid-cols-12 gap-3">
              <div className="col-span-12 lg:col-span-5 flex flex-col rounded-2xl bg-card border border-border/40 shadow-sm overflow-hidden min-h-0">
                <div className="setup-type-section-title shrink-0 border-b border-border/60 bg-muted/5 px-3 py-2.5">
                  Employee general information
                </div>
                <div className="p-4 flex-1 flex flex-col">
                  <div className="flex flex-col gap-5 sm:flex-row sm:items-start flex-1">
                    <aside className="flex shrink-0 flex-col items-center gap-1.5">
                      <div className="flex h-[148px] w-[120px] items-center justify-center overflow-hidden rounded-xl border border-border/60 bg-muted/20 shadow-inner ring-1 ring-black/4 dark:ring-white/6">
                        <User className="h-12 w-12 text-muted-foreground/30" />
                      </div>
                      <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70">
                        Photo
                      </span>
                    </aside>

                    <div className="min-w-0 flex-1 space-y-3.5">
                      <div className="space-y-1">
                        <Label className="text-[11px] font-medium text-muted-foreground">
                          Full name
                        </Label>
                        <ReadOnlyField className="capitalize font-semibold">
                          {fullName.trim() ? fullName : "—"}
                        </ReadOnlyField>
                      </div>

                      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                        <div className="space-y-1">
                          <Label className="text-[11px] font-medium text-muted-foreground">
                            Gender
                          </Label>
                          <ReadOnlyField className="flex-wrap gap-x-4 gap-y-1 py-2">
                            <label className="flex cursor-default items-center gap-1.5 text-sm">
                              <input
                                type="radio"
                                className="accent-primary"
                                checked={selected?.gender === "Male"}
                                readOnly
                              />
                              <span>Male</span>
                            </label>
                            <label className="flex cursor-default items-center gap-1.5 text-sm">
                              <input
                                type="radio"
                                className="accent-primary"
                                checked={selected?.gender === "Female"}
                                readOnly
                              />
                              <span>Female</span>
                            </label>
                          </ReadOnlyField>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[11px] font-medium text-muted-foreground">
                            Birth date
                          </Label>
                          <ReadOnlyField className="tabular-nums">
                            {selected?.birthday
                              ? String(selected.birthday).slice(0, 10)
                              : "—"}
                          </ReadOnlyField>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                        <div className="space-y-1">
                          <Label className="text-[11px] font-medium text-muted-foreground">
                            Position
                          </Label>
                          <ReadOnlyField className="capitalize wrap-break-word">
                            {selected?.position_title_ref ??
                              selected?.position_label ??
                              "—"}
                          </ReadOnlyField>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[11px] font-medium text-muted-foreground">
                            Campus
                          </Label>
                          <ReadOnlyField className="uppercase tracking-wide">
                            {selected?.campus_acronym?.trim()
                              ? selected.campus_acronym
                              : "—"}
                          </ReadOnlyField>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 rounded-xl border border-border/60 bg-muted/5 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
                        <div className="space-y-0.5">
                          <Label className="text-[11px] font-medium text-muted-foreground">
                            Employee ID
                          </Label>
                          <p className="text-[10px] text-muted-foreground/70">
                            Official roster identifier
                          </p>
                        </div>
                        <div className="text-left font-mono text-2xl font-bold tabular-nums tracking-tight text-primary sm:text-right sm:text-3xl">
                          {selected?.employee_id ?? "—"}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-span-12 lg:col-span-7 flex flex-col rounded-2xl bg-card border border-border/40 shadow-sm overflow-hidden min-h-0">
                <div className="setup-type-section-title shrink-0 border-b border-border/60 bg-muted/5 px-3 py-2.5">
                  Faculty / teaching load information
                </div>
                <div className="p-4 flex-1 flex flex-col">
                  {/* Row 1: Faculty rank + Employment type */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-3.5">
                    <div className="space-y-1">
                      <Label className="text-[11px] font-medium text-muted-foreground">
                        Faculty rank
                      </Label>
                      <Input
                        className="h-10 rounded-xl text-xs border-border/60 shadow-sm"
                        value={selected?.faculty_rank ?? ""}
                        readOnly
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px] font-medium text-muted-foreground">
                        Employment type
                      </Label>
                      <div className="flex flex-wrap items-center gap-5 rounded-xl border border-border/60 bg-background px-3 h-10 shadow-sm">
                        <label className="flex items-center gap-1.5 cursor-default text-xs font-medium">
                          <input
                            type="radio"
                            className="accent-primary"
                            checked={selected?.is_full_time === true}
                            readOnly
                          />
                          Full-time
                        </label>
                        <label className="flex items-center gap-1.5 cursor-default text-xs font-medium">
                          <input
                            type="radio"
                            className="accent-primary"
                            checked={selected?.is_full_time === false}
                            readOnly
                          />
                          Part-time
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Row 2: Campus + College */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-3.5">
                    <div className="space-y-1">
                      <Label className="text-[11px] font-medium text-muted-foreground">
                        Campus
                      </Label>
                      <Select value={selected?.campus_id ? String(selected.campus_id) : NONE} disabled>
                        <SelectTrigger className="h-10 rounded-xl text-xs border-border/60 shadow-sm bg-background">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={NONE}>—</SelectItem>
                          {campusOptions.map((c) => (
                            <SelectItem key={c.id} value={String(c.id)}>
                              {c.acronym} — {c.campus_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px] font-medium text-muted-foreground">
                        College
                      </Label>
                      <Select value={selected?.college_id ? String(selected.college_id) : NONE} disabled>
                        <SelectTrigger className="h-10 rounded-xl text-xs border-border/60 shadow-sm bg-background">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={NONE}>—</SelectItem>
                          {collegeOptions.map((c) => (
                            <SelectItem key={c.id} value={String(c.id)}>
                              {c.college_code} — {c.college_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Row 3: Teaching load educ level + Degree discipline */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-3.5">
                    <div className="space-y-1">
                      <Label className="text-[11px] font-medium text-muted-foreground">
                        Teaching load educ. level
                      </Label>
                      <Select value={selected?.teaching_load_educ_level || NONE} disabled>
                        <SelectTrigger className="h-10 rounded-xl text-xs border-border/60 shadow-sm bg-background">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={NONE}>—</SelectItem>
                          {teachingLoadOptions.map((o) => (
                            <SelectItem key={o.id} value={o.value}>
                              {o.value}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px] font-medium text-muted-foreground">
                        Degree discipline
                      </Label>
                      <Select value={selected?.degree_discipline || NONE} disabled>
                        <SelectTrigger className="h-10 rounded-xl text-xs border-border/60 shadow-sm bg-background">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={NONE}>—</SelectItem>
                          {degreeDisciplineOptions.map((o) => (
                            <SelectItem key={o.id} value={o.value}>
                              {o.value}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Row 4: PRC licensure (full width) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div className="space-y-1">
                      <Label className="text-[11px] font-medium text-muted-foreground">
                        PRC licensure
                      </Label>
                      <Select value={selected?.prc_licensure || NONE} disabled>
                        <SelectTrigger className="h-10 rounded-xl text-xs border-border/60 shadow-sm bg-background">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={NONE}>—</SelectItem>
                          {prcLicensureOptions.map((o) => (
                            <SelectItem key={o.id} value={o.value}>
                              {o.value}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-border/60 bg-card shadow-sm overflow-hidden premium-card">
              <Tabs defaultValue="employees" className="w-full flex flex-col">
                <TabsList className="h-auto flex-wrap gap-1 p-1.5 w-full justify-start rounded-none border-b border-border/60 bg-muted/20">
                  <TabsTrigger
                    value="employees"
                    className="rounded-xl px-3 py-2 text-[11px] font-semibold data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-foreground text-muted-foreground"
                  >
                    List of employees
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
                <TabsContent value="employees" className="m-0 outline-none">
                  <div className="overflow-auto max-h-[min(430px,50svh)] bg-background">
                    <table className="w-full text-[11px] border-collapse min-w-[980px]">
                      <thead>
                        <tr className="sticky top-0 z-10 border-b border-border/60 bg-muted/50 shadow-sm">
                          {[
                            "Emp. ID",
                            "Full name",
                            "Birth date",
                            "Emp. status",
                            "Position",
                            "Dept. name",
                            "Email",
                            "Rank",
                          ].map((h) => (
                            <th
                              key={h}
                              className="setup-type-table-header border-r border-border/60 px-2 py-2 text-left last:border-r-0"
                            >
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {loading ? (
                          <tr>
                            <td
                              colSpan={8}
                              className="px-4 py-6 text-sm text-muted-foreground"
                            >
                              Loading…
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
                                "premium-row cursor-pointer border-b border-border/40 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
                                idx % 2 === 1 && "bg-muted/10",
                                selectedId === r.id &&
                                  "bg-emerald-500/10 font-medium ring-1 ring-inset ring-emerald-500/15"
                              )}
                            >
                              <td className="setup-font-mono-data border-r border-border/50 px-2 py-1.5">
                                {r.employee_id}
                              </td>
                              <td className="px-2 py-1.5 border-r border-border/50 font-medium text-primary underline-offset-2 decoration-primary/40 hover:underline">
                                {`${r.last_name}, ${r.first_name}${r.middle_name ? ` ${r.middle_name}` : ""}`}
                              </td>
                              <td className="px-2 py-1.5 border-r border-border/50 tabular-nums text-muted-foreground">
                                {r.birthday
                                  ? String(r.birthday).slice(0, 10)
                                  : "—"}
                              </td>
                              <td className="px-2 py-1.5 border-r border-border/50">
                                Active
                              </td>
                              <td className="px-2 py-1.5 border-r border-border/50">
                                {r.position_title_ref ?? r.position_label ?? "—"}
                              </td>
                              <td className="px-2 py-1.5 border-r border-border/50">
                                {r.department_name ?? r.department_label ?? "—"}
                              </td>
                              <td className="px-2 py-1.5 border-r border-border/50 text-muted-foreground">
                                —
                              </td>
                              <td className="px-2 py-1.5">
                                {r.faculty_rank ?? "—"}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </TabsContent>
                <TabsContent
                  value="subjects"
                  className="m-0 p-4 text-sm text-muted-foreground outline-none"
                >
                  <div className="rounded-xl border border-border/60 bg-background/80 p-4 shadow-sm italic">
                    Subject assignments will be shown here.
                  </div>
                </TabsContent>
                <TabsContent
                  value="history"
                  className="m-0 p-4 text-sm text-muted-foreground outline-none"
                >
                  <div className="rounded-xl border border-border/60 bg-background/80 p-4 shadow-sm italic">
                    Teaching load history will be shown here.
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

