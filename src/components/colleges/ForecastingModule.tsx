"use client";

import { useEffect, useMemo, useState } from "react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const API = process.env.NEXT_PUBLIC_API_URL;

type AcademicYearTerm = {
  id: number;
  academic_year: string;
  term: string;
};

type Campus = {
  id: number;
  acronym: string;
  campus_name: string | null;
};

type CourseMaster = {
  id?: number;
  course_code: string;
  course_title?: string | null;
};

type ForecastRow = {
  academic_program: string;
  major_study: string;
  year_level: string;
  expected_enrollee: number;
};

const FORECAST_ROWS: ForecastRow[] = [];

export function ForecastingModule() {
  const [yearTerms, setYearTerms] = useState<AcademicYearTerm[]>([]);
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [subjects, setSubjects] = useState<CourseMaster[]>([]);
  const [currentTermId, setCurrentTermId] = useState("");
  const [nextTermId, setNextTermId] = useState("");
  const [campusId, setCampusId] = useState("");

  useEffect(() => {
    const load = async () => {
      if (!API) return;
      try {
        const [ytRes, campusRes, courseRes] = await Promise.all([
          fetch(`${API}/api/academic-year-terms`),
          fetch(`${API}/api/campuses`),
          fetch(`${API}/api/courses-master-list`),
        ]);
        if (ytRes.ok) {
          const y = (await ytRes.json()) as AcademicYearTerm[];
          setYearTerms(y);
          if (y[0]) setCurrentTermId(String(y[0].id));
          if (y[1]) setNextTermId(String(y[1].id));
        }
        if (campusRes.ok) {
          const c = (await campusRes.json()) as Campus[];
          setCampuses(c);
          if (c[0]) setCampusId(String(c[0].id));
        }
        if (courseRes.ok) setSubjects((await courseRes.json()) as CourseMaster[]);
      } catch {
        // render shell layout even when APIs are not yet ready
      }
    };
    void load();
  }, []);

  const campusName = useMemo(() => {
    const campus = campuses.find((c) => String(c.id) === campusId);
    return campus?.campus_name || campus?.acronym || "";
  }, [campuses, campusId]);

  const totalEnrolled = useMemo(
    () => FORECAST_ROWS.reduce((sum, row) => sum + row.expected_enrollee, 0),
    [],
  );

  return (
    <div className="h-full bg-[#f2fbf7] p-1">
      <div className="w-full border border-[#79b898] bg-white min-h-[640px]">
        <div className="bg-gradient-to-b from-[#def8ea] to-[#9fdbbc] border-b border-[#79b898] px-3 py-2">
          <h1 className="text-[24px] leading-none tracking-tight text-[#1f5e45] font-semibold">
            Forecasting
          </h1>
          <p className="text-[11px] text-[#35684f] mt-0.5">
            Use this module to forecast the figures for the next semester.
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-0">
          <div className="xl:col-span-12 border-b border-[#b6cfbf] px-2 py-1.5">
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-2 items-end">
              <div className="xl:col-span-4 space-y-1">
                <Label className="text-[11px] font-semibold text-[#232323]">Current AY Term</Label>
                <Select value={currentTermId} onValueChange={setCurrentTermId}>
                  <SelectTrigger className="h-7 text-[11px] bg-white">
                    <SelectValue placeholder="Select current term" />
                  </SelectTrigger>
                  <SelectContent>
                    {yearTerms.map((y) => (
                      <SelectItem key={y.id} value={String(y.id)}>
                        {y.academic_year} {y.term}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="xl:col-span-4 space-y-1">
                <Label className="text-[11px] font-semibold text-[#232323]">Campus Name</Label>
                <Select value={campusId} onValueChange={setCampusId}>
                  <SelectTrigger className="h-7 text-[11px] bg-white">
                    <SelectValue placeholder="Select campus" />
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

              <div className="xl:col-span-4 space-y-1">
                <Label className="text-[11px] font-semibold text-[#8b1717]">Next School Semester is ----&gt;&gt;</Label>
                <Select value={nextTermId} onValueChange={setNextTermId}>
                  <SelectTrigger className="h-7 text-[11px] bg-white">
                    <SelectValue placeholder="School Year" />
                  </SelectTrigger>
                  <SelectContent>
                    {yearTerms.map((y) => (
                      <SelectItem key={y.id} value={String(y.id)}>
                        {y.academic_year} {y.term}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <p className="text-[11px] mt-1 font-semibold text-[#8b1717]">
              Total Enrolled Student(s): <span className="ml-1">{totalEnrolled}</span>
            </p>
            <p className="text-[10px] text-muted-foreground">{campusName}</p>
          </div>

          <div className="xl:col-span-4 border-r border-[#8ca4bf]">
            <div className="bg-gradient-to-b from-[#6ea4df] to-[#3d75bc] text-white text-[10px] font-bold px-2 py-1">
              List of Offered Subject(s)...
            </div>
            <div className="grid grid-cols-[60px_140px_1fr] text-[10px] font-bold bg-[#e8f1fd] border-b border-[#cad9ec]">
              <div className="px-2 py-1 border-r border-[#cad9ec]">SubjectID</div>
              <div className="px-2 py-1 border-r border-[#cad9ec]">Subject Code</div>
              <div className="px-2 py-1">Subject Title</div>
            </div>
            <div className="h-[560px] overflow-auto">
              {subjects.map((s, idx) => (
                <div
                  key={`${s.id ?? s.course_code}-${idx}`}
                  className="grid grid-cols-[60px_140px_1fr] text-[11px] border-b border-[#dce7f5] odd:bg-white even:bg-[#f7fbff]"
                >
                  <div className="px-2 py-1 border-r border-[#dce7f5]">{s.id ?? ""}</div>
                  <div className="px-2 py-1 border-r border-[#dce7f5]">{s.course_code}</div>
                  <div className="px-2 py-1">{s.course_title || ""}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="xl:col-span-8">
            <div className="grid grid-cols-[1.1fr_1fr_130px_130px] text-[10px] font-bold bg-gradient-to-b from-[#f7e8ad] to-[#ebcf7c] border-b border-[#c9ab56]">
              <div className="px-2 py-1 border-r border-[#d9be74]">Academic Program</div>
              <div className="px-2 py-1 border-r border-[#d9be74]">Major Study</div>
              <div className="px-2 py-1 border-r border-[#d9be74]">YearLevel</div>
              <div className="px-2 py-1">Expected Enrollee</div>
            </div>
            <div className="h-[560px] overflow-auto bg-[#b3b3b3]">
              {FORECAST_ROWS.length === 0 ? null : (
                <div className="min-w-[600px]">
                  {FORECAST_ROWS.map((r, i) => (
                    <div
                      key={`${r.academic_program}-${i}`}
                      className="grid grid-cols-[1.1fr_1fr_130px_130px] text-[11px] border-b border-[#d2d2d2] bg-white"
                    >
                      <div className="px-2 py-1 border-r border-[#e2e2e2]">{r.academic_program}</div>
                      <div className="px-2 py-1 border-r border-[#e2e2e2]">{r.major_study}</div>
                      <div className="px-2 py-1 border-r border-[#e2e2e2]">{r.year_level}</div>
                      <div className="px-2 py-1">{r.expected_enrollee}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
