"use client";

import { useEffect, useMemo, useState } from "react";
import { UserSquare2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

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
    <div className="h-full bg-[#f2fbf7] p-1">
      <div className="w-full border border-[#79b898] bg-white shadow-sm">
        <div className="flex items-center justify-between bg-gradient-to-b from-[#def8ea] to-[#9fdbbc] border-b border-[#79b898] px-3 py-2">
          <div className="flex items-center gap-2">
            <div className="rounded bg-white p-0.5 border border-[#79b898]">
              <UserSquare2 className="h-5 w-5 text-[#1f7a57]" />
            </div>
            <div>
              <h1 className="text-[14px] font-bold uppercase tracking-wide text-[#1f5e45]">
                Faculty Information &amp; Management Module
              </h1>
              <p className="text-[10px] text-[#1f5e45]/80">
                Use this module to set-up the list of faculty college/department assignment.
              </p>
            </div>
          </div>
          <div className="text-[11px] font-semibold text-[#9d6b00] border border-[#9d6b00]/30 bg-white/80 px-2 py-1">
            Enrollment System v2.0
          </div>
        </div>

        <div className="grid grid-cols-12 gap-1 p-1 bg-[#e6f8ef] border-b border-[#79b898]">
          <div className="col-span-12 lg:col-span-5 border border-[#79b898] bg-[#f2fbf7]">
            <div className="bg-gradient-to-b from-[#6ec79b] to-[#2f9b68] text-white text-[10px] px-2 py-0.5 font-bold uppercase">
              Employee General Information
            </div>
            <div className="grid grid-cols-12 gap-1 p-2 text-[11px]">
              <div className="col-span-3 border border-[#9dbde4] bg-white h-[102px]" />
              <div className="col-span-9 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-16 text-right text-[10px] font-semibold">Full Name</span>
                  <Input className="h-7 text-[12px] font-bold text-[#b01010]" value={fullName} readOnly />
                </div>
                <div className="flex items-center gap-3 text-[11px]">
                  <span className="w-16 text-right text-[10px] font-semibold">Gender</span>
                  <label className="flex items-center gap-1">
                    <input type="radio" checked={selected?.gender === "Male"} readOnly />
                    Male
                  </label>
                  <label className="flex items-center gap-1">
                    <input type="radio" checked={selected?.gender === "Female"} readOnly />
                    Female
                  </label>
                  <span className="text-[#b01010] font-semibold">
                    {selected?.birthday ? String(selected.birthday).slice(0, 10) : ""}
                  </span>
                </div>
                <div className="grid grid-cols-[64px_1fr] items-center gap-2">
                  <span className="text-right text-[10px] font-semibold">Position</span>
                  <span className="text-[#b15c00] font-bold">
                    {selected?.position_title_ref ?? selected?.position_label ?? ""}
                  </span>
                </div>
                <div className="grid grid-cols-[64px_1fr] items-center gap-2">
                  <span className="text-right text-[10px] font-semibold">Campus</span>
                  <span className="text-[#b15c00] font-bold">{selected?.campus_acronym ?? ""}</span>
                </div>
                <div className="grid grid-cols-[64px_1fr] items-center gap-2">
                  <span className="text-right text-[10px] font-semibold">Employee ID</span>
                  <span className="text-[#b15c00] text-[28px] leading-none font-bold">
                    {selected?.employee_id ?? ""}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="col-span-12 lg:col-span-7 border border-[#79b898] bg-[#f2fbf7]">
            <div className="bg-gradient-to-b from-[#6ec79b] to-[#2f9b68] text-white text-[10px] px-2 py-0.5 font-bold uppercase">
              Faculty / Teaching Load Information
            </div>
            <div className="grid grid-cols-12 gap-1 p-2 text-[11px]">
              <span className="col-span-3 text-right text-[10px] font-semibold self-center">Faculty Rank</span>
              <Input className="col-span-5 h-7 text-[11px]" value={selected?.faculty_rank ?? ""} readOnly />
              <div className="col-span-4 flex items-center justify-end gap-3 text-[11px]">
                <label className="flex items-center gap-1">
                  <input type="radio" checked={selected?.is_full_time === true} readOnly />
                  Full-Time
                </label>
                <label className="flex items-center gap-1">
                  <input type="radio" checked={selected?.is_full_time === false} readOnly />
                  Part-Time
                </label>
              </div>

              <span className="col-span-3 text-right text-[10px] font-semibold self-center">Campus</span>
              <div className="col-span-9">
                <Select value={selected?.campus_id ? String(selected.campus_id) : NONE} disabled>
                  <SelectTrigger className="h-7 text-[11px] bg-white">
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

              <span className="col-span-3 text-right text-[10px] font-semibold self-center">College</span>
              <div className="col-span-9">
                <Select value={selected?.college_id ? String(selected.college_id) : NONE} disabled>
                  <SelectTrigger className="h-7 text-[11px] bg-white">
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

              <span className="col-span-3 text-right text-[10px] font-semibold self-center">Teaching Load Educ Level</span>
              <div className="col-span-9">
                <Select value={selected?.teaching_load_educ_level || NONE} disabled>
                  <SelectTrigger className="h-7 text-[11px] bg-white">
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

              <span className="col-span-3 text-right text-[10px] font-semibold self-center">Degree Discipline</span>
              <div className="col-span-9">
                <Select value={selected?.degree_discipline || NONE} disabled>
                  <SelectTrigger className="h-7 text-[11px] bg-white">
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

              <span className="col-span-3 text-right text-[10px] font-semibold self-center">PRC Licensure</span>
              <div className="col-span-9">
                <Select value={selected?.prc_licensure || NONE} disabled>
                  <SelectTrigger className="h-7 text-[11px] bg-white">
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

        <Tabs defaultValue="employees" className="w-full">
          <TabsList className="h-7 rounded-none bg-[#e6f8ef] border-b border-[#79b898] p-0 w-full justify-start">
            <TabsTrigger value="employees" className="h-7 rounded-none text-[11px] px-3 data-[state=active]:bg-[#f6fcf8]">
              List of Employees
            </TabsTrigger>
            <TabsTrigger value="subjects" className="h-7 rounded-none text-[11px] px-3 data-[state=active]:bg-[#f6fcf8]">
              Subjects Taught
            </TabsTrigger>
            <TabsTrigger value="history" className="h-7 rounded-none text-[11px] px-3 data-[state=active]:bg-[#f6fcf8]">
              Teaching Load History
            </TabsTrigger>
          </TabsList>
          <TabsContent value="employees" className="m-0">
            <div className="overflow-auto h-[430px] bg-white">
              <table className="w-full text-[11px] border-collapse min-w-[980px]">
                <thead>
                  <tr className="bg-[#f2fbf7] border-b border-[#9ed9c1]">
                    {["EMP. ID", "FULL NAME", "BIRTH DATE", "EMP. STATUS", "POSITION", "DEPT. NAME", "EMAIL", "RANK"].map((h) => (
                      <th key={h} className="text-left px-2 py-1 border-r border-[#c2dfcf] font-semibold text-[10px]">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="px-2 py-3 text-muted-foreground">
                        Loading...
                      </td>
                    </tr>
                  ) : (
                    rows.map((r, idx) => (
                      <tr
                        key={r.id}
                        onClick={() => setSelectedId(r.id)}
                        className={cn(
                          "cursor-pointer border-b border-[#d4e8dc]",
                          idx % 2 === 0 ? "bg-white" : "bg-[#f8fdf9]",
                          selectedId === r.id && "bg-[#d9f3e5]"
                        )}
                      >
                        <td className="px-2 py-0.5 border-r border-[#d4e8dc]">{r.employee_id}</td>
                        <td className="px-2 py-0.5 border-r border-[#d4e8dc]">
                          {`${r.last_name}, ${r.first_name}${r.middle_name ? ` ${r.middle_name}` : ""}`}
                        </td>
                        <td className="px-2 py-0.5 border-r border-[#d4e8dc]">
                          {r.birthday ? String(r.birthday).slice(0, 10) : ""}
                        </td>
                        <td className="px-2 py-0.5 border-r border-[#d4e8dc]">{"Active"}</td>
                        <td className="px-2 py-0.5 border-r border-[#d4e8dc]">
                          {r.position_title_ref ?? r.position_label ?? ""}
                        </td>
                        <td className="px-2 py-0.5 border-r border-[#d4e8dc]">
                          {r.department_name ?? r.department_label ?? ""}
                        </td>
                        <td className="px-2 py-0.5 border-r border-[#d4e8dc]"></td>
                        <td className="px-2 py-0.5">{r.faculty_rank ?? ""}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </TabsContent>
          <TabsContent value="subjects" className="m-0 p-4 text-xs text-muted-foreground">
            Subject assignments will be shown here.
          </TabsContent>
          <TabsContent value="history" className="m-0 p-4 text-xs text-muted-foreground">
            Teaching load history will be shown here.
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

