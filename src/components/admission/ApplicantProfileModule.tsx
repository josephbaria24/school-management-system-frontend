"use client";

import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { UserSquare2, Pencil } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const API = process.env.NEXT_PUBLIC_API_URL;
const NONE = "__none__";

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

type College = {
  id: number;
  campus_id: number;
  college_code: string;
  college_name: string;
};

type AcademicProgram = {
  id: number;
  college_id: number;
  program_code: string;
  program_name: string;
};

type ProgramCurriculum = {
  id: number;
  major_discipline: string | null;
  description: string | null;
};

const lowerTabs = [
  "Personal Information",
  "Family Background",
  "Educational Background",
  "Admission Test Results & Submitted Requirements",
  "Interview Assessment",
] as const;

const rightMiniTabs = [
  "Resident/Permanent Address",
  "Applicant Photo",
  "Enrolled Program Study",
] as const;

export function ApplicantProfileModule() {
  const [yearTerms, setYearTerms] = useState<AcademicYearTerm[]>([]);
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [colleges, setColleges] = useState<College[]>([]);
  const [programs, setPrograms] = useState<AcademicProgram[]>([]);
  const [yearTermId, setYearTermId] = useState("");
  const [campusId, setCampusId] = useState("");
  const [choiceCampusIds, setChoiceCampusIds] = useState<string[]>([NONE, NONE, NONE, NONE]);
  const [choiceProgramIds, setChoiceProgramIds] = useState<string[]>([NONE, NONE, NONE, NONE]);
  const [choiceProgramSearches, setChoiceProgramSearches] = useState<string[]>(["", "", "", ""]);
  const [choiceMajorValues, setChoiceMajorValues] = useState<string[]>([NONE, NONE, NONE, NONE]);
  const [choiceMajorSearches, setChoiceMajorSearches] = useState<string[]>(["", "", "", ""]);
  const [choiceMajorOptions, setChoiceMajorOptions] = useState<string[][]>([[], [], [], []]);
  const [activeLowerTab, setActiveLowerTab] = useState<(typeof lowerTabs)[number]>(
    "Personal Information",
  );
  const [activeMiniTab, setActiveMiniTab] = useState<(typeof rightMiniTabs)[number]>(
    "Resident/Permanent Address",
  );

  useEffect(() => {
    const load = async () => {
      if (!API) return;
      try {
        const [yRes, cRes, colRes, progRes] = await Promise.all([
          fetch(`${API}/api/academic-year-terms`),
          fetch(`${API}/api/campuses`),
          fetch(`${API}/api/colleges`),
          fetch(`${API}/api/academic-programs`),
        ]);
        if (yRes.ok) {
          const y = (await yRes.json()) as AcademicYearTerm[];
          setYearTerms(y);
          if (y[0]) setYearTermId(String(y[0].id));
        }
        if (cRes.ok) {
          const c = (await cRes.json()) as Campus[];
          setCampuses(c);
          if (c[0]) {
            const first = String(c[0].id);
            setCampusId(first);
            setChoiceCampusIds([first, NONE, NONE, NONE]);
          }
        }
        if (colRes.ok) setColleges((await colRes.json()) as College[]);
        if (progRes.ok) setPrograms((await progRes.json()) as AcademicProgram[]);
      } catch {
        // fallback shell UI
      }
    };
    void load();
  }, []);

  const setChoiceCampus = (idx: number, value: string) => {
    setChoiceCampusIds((prev) => prev.map((v, i) => (i === idx ? value : v)));
    setChoiceProgramIds((prev) => prev.map((v, i) => (i === idx ? NONE : v)));
    setChoiceProgramSearches((prev) => prev.map((v, i) => (i === idx ? "" : v)));
    setChoiceMajorValues((prev) => prev.map((v, i) => (i === idx ? NONE : v)));
    setChoiceMajorSearches((prev) => prev.map((v, i) => (i === idx ? "" : v)));
    setChoiceMajorOptions((prev) => prev.map((v, i) => (i === idx ? [] : v)));
  };

  const programsByChoice = useMemo(() => {
    return choiceCampusIds.map((campusIdStr) => {
      const cId = parseInt(campusIdStr, 10);
      if (!Number.isFinite(cId)) return [] as AcademicProgram[];
      const collegeIds = colleges
        .filter((c) => c.campus_id === cId)
        .map((c) => c.id);
      return programs.filter((p) => collegeIds.includes(p.college_id));
    });
  }, [choiceCampusIds, colleges, programs]);

  const filteredProgramsByChoice = useMemo(() => {
    return programsByChoice.map((programRows, idx) => {
      const q = choiceProgramSearches[idx]?.trim().toLowerCase();
      if (!q) return programRows;
      return programRows.filter(
        (p) =>
          p.program_code.toLowerCase().includes(q) || p.program_name.toLowerCase().includes(q),
      );
    });
  }, [programsByChoice, choiceProgramSearches]);

  const filteredMajorsByChoice = useMemo(() => {
    return choiceMajorOptions.map((majorRows, idx) => {
      const q = choiceMajorSearches[idx]?.trim().toLowerCase();
      if (!q) return majorRows;
      return majorRows.filter((m) => m.toLowerCase().includes(q));
    });
  }, [choiceMajorOptions, choiceMajorSearches]);

  const setChoiceProgram = async (idx: number, programId: string) => {
    setChoiceProgramIds((prev) => prev.map((v, i) => (i === idx ? programId : v)));
    setChoiceMajorValues((prev) => prev.map((v, i) => (i === idx ? NONE : v)));
    setChoiceMajorSearches((prev) => prev.map((v, i) => (i === idx ? "" : v)));
    if (!API || programId === NONE) {
      setChoiceMajorOptions((prev) => prev.map((v, i) => (i === idx ? [] : v)));
      return;
    }
    try {
      const res = await fetch(`${API}/api/program-curriculums?academic_program_id=${programId}`);
      if (!res.ok) throw new Error("failed to load majors");
      const rows = (await res.json()) as ProgramCurriculum[];
      const uniq = Array.from(
        new Set(
          rows
            .map((r) => r.major_discipline?.trim() || r.description?.trim() || "")
            .filter(Boolean),
        ),
      );
      setChoiceMajorOptions((prev) => prev.map((v, i) => (i === idx ? uniq : v)));
      setChoiceMajorValues((prev) =>
        prev.map((v, i) => (i === idx ? (uniq[0] ? uniq[0] : NONE) : v)),
      );
    } catch {
      setChoiceMajorOptions((prev) => prev.map((v, i) => (i === idx ? [] : v)));
    }
  };

  const legacyInputClass = "h-7 text-[11px] bg-white rounded-none border-[#7ca1d8]";
  const personalLabelClass = "text-[11px] leading-[1.15] font-semibold text-[#12345b]";
  const addressLabelClass = "text-[11px] leading-[1.15] font-semibold text-[#12345b]";
  const interviewScale = ["Excellent", "Good", "Average", "Poor"] as const;

  const renderLowerTabContent = () => {
    if (activeLowerTab === "Family Background") {
      return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-2 border border-[#7ca1d8] bg-[#dfe8f8] p-1.5">
          <div className="lg:col-span-6 space-y-2">
            <div className="border border-[#7ca1d8] bg-[#edf3ff]">
              <div className="bg-gradient-to-b from-[#dce9fb] to-[#b8cdee] text-[#1e3d63] text-[10px] font-bold px-2 py-0.5">
                FATHER
              </div>
              <div className="p-2 grid grid-cols-[86px_1fr] gap-1 items-center text-[11px]">
                <Label>Father</Label>
                <Input className={legacyInputClass} />
                <Label>Occupation</Label>
                <Input className={legacyInputClass} />
                <Label>Company</Label>
                <Input className={legacyInputClass} />
                <Label>Company Address</Label>
                <Textarea className="min-h-[46px] text-[11px] bg-white rounded-none border-[#7ca1d8]" />
                <Label>Email</Label>
                <Input className={legacyInputClass} />
                <Label>Tel No.</Label>
                <div className="flex gap-2">
                  <Input className={cn(legacyInputClass, "max-w-[160px]")} />
                  <Button type="button" variant="outline" className="h-7 text-[10px] rounded-none border-[#7ca1d8]">
                    📄 COPY TO GUARDIAN INFO
                  </Button>
                </div>
              </div>
            </div>
            <div className="border border-[#7ca1d8] bg-[#edf3ff]">
              <div className="bg-gradient-to-b from-[#dce9fb] to-[#b8cdee] text-[#1e3d63] text-[10px] font-bold px-2 py-0.5">
                MOTHER
              </div>
              <div className="p-2 grid grid-cols-[86px_1fr] gap-1 items-center text-[11px]">
                <Label>Mother</Label>
                <Input className={legacyInputClass} />
                <Label>Occupation</Label>
                <Input className={legacyInputClass} />
                <Label>Company</Label>
                <Input className={legacyInputClass} />
                <Label>Company Address</Label>
                <Textarea className="min-h-[46px] text-[11px] bg-white rounded-none border-[#7ca1d8]" />
                <Label>Email</Label>
                <Input className={legacyInputClass} />
                <Label>Tel No.</Label>
                <div className="flex gap-2">
                  <Input className={cn(legacyInputClass, "max-w-[160px]")} />
                  <Button type="button" variant="outline" className="h-7 text-[10px] rounded-none border-[#7ca1d8]">
                    📄 COPY TO GUARDIAN INFO
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6 space-y-2">
            <div className="border border-[#7ca1d8] bg-[#edf3ff]">
              <div className="bg-gradient-to-b from-[#dce9fb] to-[#b8cdee] text-[#1e3d63] text-[10px] font-bold px-2 py-0.5">
                GUARDIAN
              </div>
              <div className="p-2 grid grid-cols-[86px_1fr] gap-1 items-center text-[11px]">
                <Label>Guardian</Label>
                <Input className={legacyInputClass} />
                <Label>Relationship</Label>
                <Input className={legacyInputClass} />
                <Label>Address</Label>
                <Textarea className="min-h-[46px] text-[11px] bg-white rounded-none border-[#7ca1d8]" />
                <Label>Tel No.</Label>
                <Input className={cn(legacyInputClass, "max-w-[160px]")} />
                <Label>Email</Label>
                <Input className={legacyInputClass} />
                <Label>Occupation</Label>
                <Input className={legacyInputClass} />
                <Label>Company</Label>
                <Input className={legacyInputClass} />
              </div>
            </div>
            <div className="border border-[#7ca1d8] bg-[#edf3ff]">
              <div className="bg-gradient-to-b from-[#ad0000] to-[#7f0000] text-white text-[10px] font-bold px-2 py-0.5">
                EMERGENCY CONTACT PERSON
              </div>
              <div className="p-2 grid grid-cols-[86px_1fr] gap-1 items-center text-[11px]">
                <Label>Contact Person</Label>
                <Input className={legacyInputClass} />
                <Label>Address</Label>
                <Textarea className="min-h-[46px] text-[11px] bg-white rounded-none border-[#7ca1d8]" />
                <Label>Mobile No.</Label>
                <Input className={cn(legacyInputClass, "max-w-[160px]")} />
                <Label>Tel No.</Label>
                <div className="flex gap-2">
                  <Input className={cn(legacyInputClass, "max-w-[160px]")} />
                  <Button type="button" variant="outline" className="h-7 text-[10px] rounded-none border-[#7ca1d8]">
                    📄 COPY GUARDIAN INFO
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (activeLowerTab === "Educational Background") {
      return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-2 border border-[#7ca1d8] bg-[#dfe8f8] p-1.5">
          <div className="lg:col-span-6 space-y-2">
            <div className="border border-[#7ca1d8] bg-[#edf3ff]">
              <div className="bg-gradient-to-b from-[#dce9fb] to-[#b8cdee] text-[#1e3d63] text-[10px] font-bold px-2 py-0.5">
                ELEMENTARY SCHOOL
              </div>
              <div className="p-2 grid grid-cols-[96px_1fr_26px] gap-1 items-center text-[11px]">
                <Label>Name of School</Label>
                <Input className={legacyInputClass} />
                <Button type="button" variant="outline" className="h-7 w-7 p-0 rounded-none border-[#7ca1d8]">
                  📝
                </Button>
                <Label>Address</Label>
                <Textarea className="min-h-[56px] text-[11px] bg-white rounded-none border-[#7ca1d8]" />
                <span />
                <Label>Inclusive Dates</Label>
                <Input className={legacyInputClass} />
                <span />
              </div>
            </div>
            <div className="border border-[#7ca1d8] bg-[#edf3ff]">
              <div className="bg-gradient-to-b from-[#dce9fb] to-[#b8cdee] text-[#1e3d63] text-[10px] font-bold px-2 py-0.5">
                SECONDARY SCHOOL
              </div>
              <div className="p-2 grid grid-cols-[96px_1fr_26px] gap-1 items-center text-[11px]">
                <Label>Name of School</Label>
                <Input className={legacyInputClass} />
                <Button type="button" variant="outline" className="h-7 w-7 p-0 rounded-none border-[#7ca1d8]">
                  📝
                </Button>
                <Label>Address</Label>
                <Textarea className="min-h-[56px] text-[11px] bg-white rounded-none border-[#7ca1d8]" />
                <span />
                <Label>Inclusive Dates</Label>
                <Input className={legacyInputClass} />
                <span />
                <Label>Form 137 GW</Label>
                <Input className={cn(legacyInputClass, "max-w-[160px]")} />
                <Label className="justify-self-end">Form 137 English</Label>
                <Input className={cn(legacyInputClass, "max-w-[160px]")} />
                <Label>Form 137 Math</Label>
                <Input className={cn(legacyInputClass, "max-w-[160px]")} />
                <Label className="justify-self-end">Form 137 Science</Label>
                <Input className={cn(legacyInputClass, "max-w-[160px]")} />
                <Label>NCAE</Label>
                <Select defaultValue={NONE}>
                  <SelectTrigger className={legacyInputClass}>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>Select</SelectItem>
                    <SelectItem value="none">N/A</SelectItem>
                  </SelectContent>
                </Select>
                <span />
              </div>
            </div>
          </div>

          <div className="lg:col-span-6 space-y-2">
            {["VOCATIONAL/TRADE COURSE", "COLLEGE", "GRADUATE STUDIES"].map((title) => (
              <div key={title} className="border border-[#7ca1d8] bg-[#edf3ff]">
                <div className="bg-gradient-to-b from-[#dce9fb] to-[#b8cdee] text-[#1e3d63] text-[10px] font-bold px-2 py-0.5">
                  {title}
                </div>
                <div className="p-2 grid grid-cols-[96px_1fr_26px] gap-1 items-center text-[11px]">
                  <Label>Name of School</Label>
                  <Input className={legacyInputClass} />
                  <Button type="button" variant="outline" className="h-7 w-7 p-0 rounded-none border-[#7ca1d8]">
                    📝
                  </Button>
                  <Label>Address</Label>
                  <Input className={legacyInputClass} />
                  <span />
                  <Label>Degree/Course</Label>
                  <Input className={legacyInputClass} />
                  <span />
                  <Label>Inclusive Dates</Label>
                  <Input className={legacyInputClass} />
                  <span />
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (activeLowerTab === "Admission Test Results & Submitted Requirements") {
      const docItems = [
        "Certified True Copy of Report Card",
        "Form 137 (card)",
        "Form 138",
        "Authenticated NSO Birth Certificate",
        "Transcript of Records",
        "Letter of Recommendation",
        "Good Moral Character",
        "Passport-Size Color Photo",
        "Honorable Dismissal/ Transfer Credential",
        "Baptismal Certificate",
        "Non-Catholic Religion",
        "Scholarship Application",
        "Income Tax Return (ITR)",
        "Medical Certificate",
        "Letter of Application",
        "Passport with Student Visa",
        "Self-stamped Mailing Envelope",
        "ACR",
        "Study Permit",
      ];

      return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-2 border border-[#7ca1d8] bg-[#dfe8f8] p-1.5">
          <div className="lg:col-span-5 border border-[#7ca1d8] bg-[#edf3ff]">
            <div className="bg-gradient-to-b from-[#dce9fb] to-[#b8cdee] text-[#1e3d63] text-[10px] font-bold px-2 py-0.5">
              ADMISSION ENTRANCE EXAM
            </div>
            <div className="p-2 space-y-1 text-[11px]">
              <div className="grid grid-cols-[78px_1fr] gap-1 items-center">
                <Label>Exam Date:</Label>
                <div className="grid grid-cols-[120px_1fr] gap-1">
                  <Input className={legacyInputClass} defaultValue="01/09/2006" />
                  <span className="text-muted-foreground self-center">dd/mm/yyyy</span>
                </div>
                <Label>Testing Ref:</Label>
                <Select defaultValue={NONE}>
                  <SelectTrigger className={legacyInputClass}>
                    <SelectValue placeholder="" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>Select</SelectItem>
                  </SelectContent>
                </Select>
                <Label>Exam Ref No:</Label>
                <Input className={legacyInputClass} />
                <Label>Proctor:</Label>
                <div className="grid grid-cols-[1fr_28px] gap-1">
                  <Select defaultValue={NONE}>
                    <SelectTrigger className={legacyInputClass}>
                      <SelectValue placeholder="" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE}>Select</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button type="button" variant="outline" className="h-7 w-7 p-0 rounded-none border-[#7ca1d8]">
                    📝
                  </Button>
                </div>
                <Label>Deny Reason:</Label>
                <Textarea className="min-h-[52px] text-[11px] bg-white rounded-none border-[#7ca1d8]" />
              </div>

              <div className="border border-[#9dbde4] mt-1">
                <div className="grid grid-cols-9 text-[10px] font-semibold bg-white border-b border-[#9dbde4]">
                  {[
                    "",
                    "Verbal Reasoning",
                    "Numerical Reasoning",
                    "Abstract Reasoning",
                    "Perceptual Speed",
                    "Accuracy",
                    "Spelling",
                    "Language",
                    "Mechanical Reasoning",
                  ].map((h) => (
                    <div key={h || "blank"} className="px-1 py-1 border-r border-[#9dbde4] last:border-r-0 text-center">
                      {h}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-9 text-[10px] bg-white">
                  <div className="px-1 py-1 border-r border-[#9dbde4] font-semibold">Raw Score</div>
                  {Array.from({ length: 8 }).map((_, idx) => (
                    <div key={idx} className="px-1 py-1 border-r border-[#9dbde4] last:border-r-0">
                      <Input className="h-6 text-[10px] rounded-none border-[#7ca1d8]" />
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between text-[11px] pt-1">
                <span>Last Modified by:</span>
                <span>Last Modified Date :</span>
                <Button type="button" variant="outline" className="h-7 text-[10px] rounded-none border-[#7ca1d8] px-3">
                  Print Result
                </Button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-3 border border-[#7ca1d8] bg-[#edf3ff]">
            <div className="bg-gradient-to-b from-[#dce9fb] to-[#b8cdee] text-[#1e3d63] text-[10px] font-bold px-2 py-0.5">
              ADMIT STUDENT (F4) | DENY STUDENT (F5)
            </div>
            <div className="p-2 space-y-2 text-[11px]">
              <div className="border border-[#9dbde4] bg-white p-1 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold">ENTRANCE EXAM RESULT (2ND SCHED)</span>
                  <Button type="button" variant="outline" className="h-6 text-[10px] rounded-none border-[#7ca1d8] px-2">
                    RE-COMPUTE
                  </Button>
                </div>
                <div className="grid grid-cols-3 gap-1">
                  <Input className="h-6 text-[10px] rounded-none border-[#7ca1d8]" placeholder="RESULT" />
                  <Input className="h-6 text-[10px] rounded-none border-[#7ca1d8]" placeholder="TAKE 1@" />
                  <Input className="h-6 text-[10px] rounded-none border-[#7ca1d8]" placeholder="REMARKS" />
                </div>
              </div>
              <div className="border border-[#9dbde4] bg-white p-1 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold">MEDICAL RESULT (2ND SCHED)</span>
                  <Button type="button" variant="outline" className="h-6 text-[10px] rounded-none border-[#7ca1d8] px-2">
                    SCHEDULE
                  </Button>
                </div>
                <div className="grid grid-cols-3 gap-1">
                  <Input className="h-6 text-[10px] rounded-none border-[#7ca1d8]" placeholder="SCHEDULE" />
                  <Input className="h-6 text-[10px] rounded-none border-[#7ca1d8]" placeholder=" " />
                  <Input className="h-6 text-[10px] rounded-none border-[#7ca1d8]" placeholder="REMARKS" />
                </div>
              </div>
              <label className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <Checkbox /> RECONSIDERED APPLICANT
              </label>
            </div>
          </div>

          <div className="lg:col-span-4 border border-[#c88b8b] bg-[#fff6f6]">
            <div className="bg-gradient-to-b from-[#ffd9d9] to-[#f5bcbc] text-[#6d1f1f] text-[10px] font-bold px-2 py-0.5">
              DOCUMENTS SUBMITTED
            </div>
            <div className="p-2 grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
              {docItems.map((doc) => (
                <label key={doc} className="flex items-center gap-1">
                  <Checkbox />
                  <span>{doc}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      );
    }

    if (activeLowerTab === "Interview Assessment") {
      const criteria = [
        "LEADERSHIP POTENTIAL",
        "DETERMINATION AND PERSEVERANCE",
        "CAREER CHOICE",
        "PASSION AND ATTITUDE",
        "COMMUNICATION SKILLS",
      ];

      return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-2 border border-[#7ca1d8] bg-[#dfe8f8] p-1.5">
          <div className="lg:col-span-7 space-y-2">
            <div className="grid grid-cols-[120px_1fr] gap-1 items-center text-[11px]">
              <Label>Date of Interview :</Label>
              <Input className={cn(legacyInputClass, "max-w-[220px]")} defaultValue="05 Jan 2006" />
              <Label>Interviewer In Charge :</Label>
              <Select defaultValue="administrator">
                <SelectTrigger className={cn(legacyInputClass, "max-w-[380px]")}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="administrator">Administrator</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="border border-[#7ca1d8] bg-white">
              <div className="bg-gradient-to-b from-[#dce9fb] to-[#b8cdee] text-[#1e3d63] text-[10px] font-bold px-2 py-0.5">
                REMARKS / COMMENTS
              </div>
              <div className="p-2">
                <Textarea className="min-h-[110px] text-[11px] bg-white rounded-none border-[#7ca1d8]" />
                <div className="flex justify-end mt-2">
                  <Button type="button" variant="outline" className="h-7 text-[10px] rounded-none border-[#7ca1d8]">
                    🧹 Clear
                  </Button>
                </div>
              </div>
            </div>
            <div className="border border-[#7ca1d8] bg-white p-2 flex flex-wrap items-center gap-2 text-[11px]">
              <span className="text-[28px] leading-none text-[#c00000] font-bold">Over- All Recommendation</span>
              <Input className={cn(legacyInputClass, "w-[72px] text-center text-[20px] font-bold")} defaultValue="0.0" />
              <label className="flex items-center gap-1">
                <input type="radio" name="overall-result" /> Passed
              </label>
              <label className="flex items-center gap-1">
                <input type="radio" name="overall-result" /> Failed
              </label>
              <Button type="button" variant="outline" className="h-7 text-[10px] rounded-none border-[#7ca1d8] px-3">
                Reset
              </Button>
            </div>
          </div>

          <div className="lg:col-span-5 space-y-2">
            {criteria.map((title) => (
              <div key={title} className="border border-[#7ca1d8] bg-white">
                <div className="bg-gradient-to-b from-[#dce9fb] to-[#b8cdee] text-[#1e3d63] text-[10px] font-bold px-2 py-0.5">
                  {title}
                </div>
                <div className="p-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px]">
                  {interviewScale.map((option) => (
                    <label key={`${title}-${option}`} className="flex items-center gap-1">
                      <input type="radio" name={`interview-${title}`} /> {option}
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-2 border border-[#7ca1d8] bg-[#dfe8f8] p-1.5">
        <div className="lg:col-span-5 border border-[#5f88c4] bg-[#edf3ff]">
          <div className="bg-gradient-to-b from-[#d6e6fb] to-[#9bbce7] text-[#2c4f7c] text-[10px] font-bold px-2 py-0.5 border-b border-[#7ca1d8]">
            PERSONAL INFORMATION
          </div>
          <div className="p-2 grid grid-cols-[74px_1fr_70px_1fr] gap-x-1.5 gap-y-1.5 items-center text-[11px]">
            <Label className={personalLabelClass}>Last Name</Label>
            <Input className={cn(legacyInputClass, "col-span-3")} defaultValue="Baria" />
            <Label className={personalLabelClass}>Given Name</Label>
            <Input className={cn(legacyInputClass, "col-span-3")} defaultValue="Joseph" />
            <Label className={personalLabelClass}>Middle Name</Label>
            <Input className={cn(legacyInputClass, "col-span-3")} defaultValue="Lucas" />
            <Label className={personalLabelClass}>Middle Initial</Label>
            <Input className={legacyInputClass} defaultValue="L" />
            <Label className={cn(personalLabelClass, "text-right")}>Ext. Name</Label>
            <Input className={legacyInputClass} />
            <Label className={personalLabelClass}>Gender</Label>
            <div className="col-span-3 flex items-center gap-4">
              <label className="flex items-center gap-1 text-[11px] leading-4">
                <input type="radio" name="gender" defaultChecked /> Male
              </label>
              <label className="flex items-center gap-1 text-[11px] leading-4">
                <input type="radio" name="gender" /> Female
              </label>
            </div>
            <Label className={personalLabelClass}>Civil Status</Label>
            <Select defaultValue="single">
              <SelectTrigger className={legacyInputClass}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="single">Single</SelectItem>
              </SelectContent>
            </Select>
            <span />
            <span />
            <Label className={personalLabelClass}>Date of Birth</Label>
            <Input className={legacyInputClass} defaultValue="January 05, 2006" />
            <span className="text-muted-foreground text-[10px] col-span-2">mm/dd/yyyy</span>
            <Label className={personalLabelClass}>Place of Birth</Label>
            <Input className={cn(legacyInputClass, "col-span-3")} defaultValue="PPC" />
            <Label className={personalLabelClass}>Nationality</Label>
            <Select defaultValue="filipino">
              <SelectTrigger className={legacyInputClass}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="filipino">Filipino</SelectItem>
              </SelectContent>
            </Select>
            <span />
            <label className="col-span-2 flex items-center gap-1 text-[11px] leading-4">
              <Checkbox /> Foreign Student?
            </label>
            <Label className={personalLabelClass}>Religion</Label>
            <Select defaultValue="born-again">
              <SelectTrigger className={legacyInputClass}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="born-again">Born Again Christian</SelectItem>
                <SelectItem value="roman-catholic">Roman Catholic</SelectItem>
                <SelectItem value="islam">Islam</SelectItem>
              </SelectContent>
            </Select>
            <span />
            <span />
            <Label className={personalLabelClass}>Telephone No.</Label>
            <Input className={legacyInputClass} />
            <Label className={cn(personalLabelClass, "text-right")}>Mobile Phone</Label>
            <Input className={legacyInputClass} />
            <Label className={personalLabelClass}>Email</Label>
            <Input className={cn(legacyInputClass, "col-span-3")} />
            <Label className={personalLabelClass}>Testing Date</Label>
            <Input className={cn(legacyInputClass, "bg-[#fff9bf]")} />
            <Label className={cn(personalLabelClass, "text-right")}>Ctr (0)</Label>
            <Input className={legacyInputClass} />
          </div>
        </div>

        <div className="lg:col-span-7 border border-[#5f88c4] bg-[#edf3ff]">
          <div className="flex flex-wrap gap-0.5 border-b border-[#9dbde4] p-0.5">
            {rightMiniTabs.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveMiniTab(tab)}
                className={cn(
                  "px-2 py-0.5 text-[11px] border border-[#9dbde4] rounded-none",
                  activeMiniTab === tab
                    ? "bg-[#f5e8a8] text-[#4f4a2f] font-semibold"
                    : "bg-[#e7ecf8] text-[#556b7d]",
                )}
              >
                {tab}
              </button>
            ))}
          </div>
          {activeMiniTab === "Resident/Permanent Address" ? (
            <div className="p-1.5 space-y-1.5 text-[11px]">
              <div className="border border-[#7ca1d8] bg-white p-2">
                <p className="text-[10px] font-bold text-[#2c4f7c] mb-1">RESIDENCE/PRESENT ADDRESS</p>
                <div className="grid grid-cols-[74px_1fr_66px_1fr] gap-x-1.5 gap-y-1.5 items-center">
                  <Label className={addressLabelClass}>Residence</Label>
                  <Input className={legacyInputClass} />
                  <Label className={cn(addressLabelClass, "text-right")}>Street</Label>
                  <Input className={legacyInputClass} />
                  <Label className={addressLabelClass}>Barangay</Label>
                  <Input className={legacyInputClass} />
                  <Label className={cn(addressLabelClass, "text-right")}>Town/City</Label>
                  <Input className={legacyInputClass} />
                  <Label className={addressLabelClass}>Province</Label>
                  <Input className={legacyInputClass} defaultValue="Puerto Princesa" />
                  <Label className={cn(addressLabelClass, "text-right")}>Zip Code</Label>
                  <Input className={legacyInputClass} />
                </div>
              </div>
              <div className="border border-[#7ca1d8] bg-white p-2">
                <p className="text-[10px] font-bold text-[#2c4f7c] mb-1">PERMANENT ADDRESS</p>
                <div className="grid grid-cols-[74px_1fr_66px_1fr] gap-x-1.5 gap-y-1.5 items-center">
                  <Label className={addressLabelClass}>Residence</Label>
                  <Input className={legacyInputClass} />
                  <Label className={cn(addressLabelClass, "text-right")}>Street</Label>
                  <Input className={legacyInputClass} />
                  <Label className={addressLabelClass}>Barangay</Label>
                  <Input className={legacyInputClass} />
                  <Label className={cn(addressLabelClass, "text-right")}>Town/City</Label>
                  <Input className={legacyInputClass} />
                  <Label className={addressLabelClass}>Province</Label>
                  <Input className={legacyInputClass} defaultValue="Puerto Princesa" />
                  <Label className={cn(addressLabelClass, "text-right")}>Zip Code</Label>
                  <div className="grid grid-cols-[1fr_auto] gap-1">
                    <Input className={legacyInputClass} />
                    <Button
                      type="button"
                      variant="outline"
                      className="h-10 px-2 text-[10px] leading-tight rounded-none border-[#7ca1d8]"
                    >
                      COPY
                      <br />
                      RESIDENCE
                      <br />
                      ADDRESS
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ) : activeMiniTab === "Applicant Photo" ? (
            <div className="p-1.5">
              <div className="border border-[#7ca1d8] bg-[#ffe184] p-1.5 grid grid-cols-1 lg:grid-cols-[1fr_210px] gap-1.5 min-h-[270px]">
                <div className="border border-[#7ca1d8] bg-white flex items-center justify-center p-2">
                  <div className="w-full h-full min-h-[220px] flex items-center justify-center bg-white">
                    <div className="w-[235px] h-[235px] rounded-full border-[6px] border-black flex items-center justify-center relative">
                      <div className="w-[140px] h-[140px] border-[5px] border-black rounded-md bg-white flex items-center justify-center text-center px-2">
                        <span className="text-[12px] font-bold tracking-wide">
                          APPLICANT
                          <br />
                          PHOTO
                        </span>
                      </div>
                      <span className="absolute text-[8px] font-semibold top-3">STATE UNIVERSITY</span>
                      <span className="absolute text-[8px] font-semibold bottom-3">PHILIPPINES</span>
                    </div>
                  </div>
                </div>
                <div className="border border-[#7ca1d8] bg-[#ffe184] p-1.5 text-[11px] space-y-1.5">
                  <div className="space-y-0.5">
                    <Label className="text-[11px] font-semibold">Device:</Label>
                    <Select defaultValue="default-cam">
                      <SelectTrigger className={cn(legacyInputClass, "h-6")}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="default-cam">HP Wide Vision HD Camera</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-1">
                    <Button type="button" variant="outline" className="h-6 px-2 text-[10px] rounded-none border-[#7ca1d8]">
                      CONNECT
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="h-6 px-2 text-[10px] rounded-none border-[#7ca1d8] text-muted-foreground"
                      disabled
                    >
                      CONFIGURE
                    </Button>
                  </div>
                  <div className="space-y-0.5">
                    <Label className="text-[11px] font-semibold">Capture Resolution:</Label>
                    <Select defaultValue="res-default">
                      <SelectTrigger className={cn(legacyInputClass, "h-6")}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="res-default">Default</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-6 px-2 text-[10px] rounded-none border-[#7ca1d8] text-muted-foreground"
                    disabled
                  >
                    PREVIEW OFF
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-10 text-[22px] leading-none rounded-none border-[#7ca1d8] bg-[#e6dcc1] text-[#8f865f]"
                  >
                    📸 Take Picture!
                  </Button>
                  <div className="grid grid-cols-2 gap-1">
                    <Button type="button" variant="outline" className="h-8 text-[11px] rounded-none border-[#7ca1d8]">
                      💾 Save Photo
                    </Button>
                    <Button type="button" variant="outline" className="h-8 text-[11px] rounded-none border-[#7ca1d8]">
                      🧹 Delete Photo
                    </Button>
                  </div>
                  <Button type="button" variant="outline" className="w-full h-8 text-[11px] rounded-none border-[#7ca1d8]">
                    📂 Load Picture from Files...
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-1.5">
              <div className="border border-[#7ca1d8] bg-[#c8d9b1] p-2 min-h-[270px]">
                <div className="grid grid-cols-[92px_1fr] gap-1.5 items-center text-[11px]">
                  <Label className="text-[11px] font-semibold">Student Number:</Label>
                  <Input className={cn(legacyInputClass, "max-w-[140px]")} />
                  <Label className="text-[11px] font-semibold">College/Dept:</Label>
                  <Input className={cn(legacyInputClass, "max-w-[370px]")} />
                  <Label className="text-[11px] font-semibold">Academic Program:</Label>
                  <Input className={cn(legacyInputClass, "max-w-[370px]")} />
                  <Label className="text-[11px] font-semibold">Major Study:</Label>
                  <Input className={cn(legacyInputClass, "max-w-[370px]")} />
                  <Label className="text-[11px] font-semibold">Curriculum:</Label>
                  <Input className={cn(legacyInputClass, "max-w-[370px]")} />
                  <Label className="text-[11px] font-semibold">Year Level:</Label>
                  <Input className={cn(legacyInputClass, "max-w-[140px]")} />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="h-full bg-background relative overflow-x-hidden">
      <div className="w-full px-2 pt-2 pb-4">
        <div className="mb-6 space-y-2">
          <h1 className="text-xl font-extrabold tracking-tight uppercase">
            Admission Module
          </h1>
          <p className="text-base text-muted-foreground">
            Use this module to accept new applicant, admit or deny an applicant, record entrance
            exam result, etc...
          </p>
        </div>

        <Card className="w-full overflow-hidden rounded-2xl border border-border/40 bg-background shadow-sm">
          <div className="bg-muted/5 text-foreground px-4 py-3 flex items-center justify-between border-b border-border/40">
            <div className="flex items-center gap-3">
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm">
                <UserSquare2 className="h-5 w-5" />
              </div>
              <div className="leading-tight">
                <div className="text-base font-bold tracking-tight">
                  Applicant Profile Management
                </div>
                <div className="text-sm text-muted-foreground font-medium">
                  Admission manager • Create and manage applicant records
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 space-y-4">
            <div className="border border-border/60 rounded-2xl overflow-hidden bg-card shadow-sm">
              <div className="bg-muted/5 text-foreground px-3 py-2 text-xs font-bold tracking-tight shrink-0 border-b border-border/60 uppercase">
                Application Information
              </div>
            <div className="p-2 space-y-2">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-2">
                <div className="lg:col-span-4 space-y-1">
                  <Label className="text-[11px] text-muted-foreground">ACAD. YEAR &amp; TERM:</Label>
                  <Select value={yearTermId} onValueChange={setYearTermId}>
                    <SelectTrigger className="h-9 rounded-xl text-xs border-border/60 shadow-sm bg-background">
                      <SelectValue placeholder="Select term" />
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

                <div className="lg:col-span-2 space-y-1">
                  <Label className="text-[11px] text-muted-foreground">APPLICATION TYPE:</Label>
                  <Select defaultValue="freshman">
                    <SelectTrigger className="h-9 rounded-xl text-xs border-border/60 shadow-sm bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="freshman">Freshman</SelectItem>
                      <SelectItem value="transferee">Transferee</SelectItem>
                      <SelectItem value="cross-enrollee">Cross-Enrollee</SelectItem>
                      <SelectItem value="returnee">Returnee</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="lg:col-span-2 space-y-1">
                  <Label className="text-[11px] text-muted-foreground">APPLICATION DATE:</Label>
                  <Input type="date" className="h-9 rounded-xl text-xs border-border/60 shadow-sm bg-background" />
                </div>
                <div className="lg:col-span-2 space-y-1">
                  <Label className="text-[11px] text-muted-foreground">LAST UPDATE:</Label>
                  <Input disabled className="h-9 rounded-xl text-xs border-border/60 shadow-sm bg-muted/20" />
                </div>
                <div className="lg:col-span-1 space-y-1">
                  <Label className="text-[11px] text-muted-foreground">O.R. NO.</Label>
                  <Input className="h-9 rounded-xl text-xs border-border/60 shadow-sm bg-background px-2" />
                </div>
                <div className="lg:col-span-1 space-y-1">
                  <Label className="text-[11px] text-muted-foreground uppercase">Status</Label>
                  <div className="flex h-9 items-center justify-center">
                    <Badge variant="outline" className="rounded-full bg-emerald-500/10 text-emerald-700 border-emerald-200/50 px-4 py-1.5 text-sm font-bold tracking-tight shadow-none">
                      PENDING
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mt-4">
                {[0, 1, 2, 3].map((choiceIdx) => (
                  <div key={choiceIdx} className="border border-border/60 rounded-2xl overflow-hidden bg-card shadow-sm">
                    <div className="bg-muted/5 text-foreground px-3 py-2 text-xs font-extrabold tracking-tight border-b border-border/60 uppercase">
                      CHOICE {choiceIdx + 1}: Select Campus/Branch
                    </div>
                    <div className="p-3 space-y-3">
                      <div className="space-y-1.5">
                        <Label className="text-[11px] text-muted-foreground">Campus</Label>
                        <Select
                          value={choiceCampusIds[choiceIdx]}
                          onValueChange={(v) => setChoice(choiceIdx, v)}
                        >
                          <SelectTrigger className="h-9 rounded-xl text-xs border-border/60 shadow-sm bg-background">
                            <SelectValue placeholder="Select campus" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={NONE}>Select campus</SelectItem>
                            {campuses.map((c) => (
                              <SelectItem key={c.id} value={String(c.id)}>
                                {c.acronym}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-[1fr_36px] gap-2 items-end">
                        <div className="space-y-1.5">
                          <Label className="text-[11px] text-muted-foreground">Course/Program</Label>
                          <Select defaultValue={NONE}>
                            <SelectTrigger className="h-9 rounded-xl text-xs border-border/60 shadow-sm bg-background">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value={NONE}>Select course/program</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <Button type="button" variant="outline" className="h-9 w-9 rounded-xl text-muted-foreground hover:text-primary">
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-[1fr_36px] gap-2 items-end">
                        <div className="space-y-1.5">
                          <Label className="text-[11px] text-muted-foreground">Major Study</Label>
                          <Select defaultValue={NONE}>
                            <SelectTrigger className="h-9 rounded-xl text-xs border-border/60 shadow-sm bg-background">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value={NONE}>Select major study</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <Button type="button" variant="outline" className="h-9 w-9 rounded-xl text-muted-foreground hover:text-primary">
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-1 border-b border-border/40 bg-muted/20 p-1.5 rounded-xl">
            {lowerTabs.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveLowerTab(tab)}
                className={cn(
                  "px-4 py-2 text-sm font-bold rounded-lg transition-all",
                  activeLowerTab === tab
                    ? "bg-background text-foreground shadow-md"
                    : "text-muted-foreground hover:bg-background/50 hover:text-foreground",
                )}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-6 border border-border/60 rounded-2xl overflow-hidden bg-card shadow-sm">
              <div className="bg-muted/5 text-foreground px-3 py-2 text-xs font-extrabold tracking-tight border-b border-border/60 uppercase">
                PERSONAL INFORMATION
              </div>
              <div className="p-4 space-y-4">
                <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-[11px] text-muted-foreground uppercase">Last Name</Label>
                    <Input className="h-9 rounded-xl text-xs border-border/60 shadow-sm bg-background" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[11px] text-muted-foreground uppercase">Given Name</Label>
                    <Input className="h-9 rounded-xl text-xs border-border/60 shadow-sm bg-background" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[11px] text-muted-foreground uppercase">Middle Name</Label>
                    <Input className="h-9 rounded-xl text-xs border-border/60 shadow-sm bg-background" />
                  </div>
                  <div className="grid grid-cols-[1fr_2fr] gap-2">
                    <div className="space-y-1.5">
                      <Label className="text-[11px] text-muted-foreground uppercase">M.I.</Label>
                      <Input className="h-9 rounded-xl text-xs border-border/60 shadow-sm bg-background" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[11px] text-muted-foreground uppercase">Ext. Name</Label>
                      <Input className="h-9 rounded-xl text-xs border-border/60 shadow-sm bg-background" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-[11px] text-muted-foreground uppercase">Gender</Label>
                    <div className="flex h-9 items-center gap-6 rounded-xl border border-border/60 bg-background px-3 shadow-sm">
                      <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                        <input type="radio" name="gender" className="accent-primary h-3.5 w-3.5" /> 
                        <span>Male</span>
                      </label>
                      <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                        <input type="radio" name="gender" className="accent-primary h-3.5 w-3.5" /> 
                        <span>Female</span>
                      </label>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[11px] text-muted-foreground uppercase">Civil Status</Label>
                    <Select defaultValue="single">
                      <SelectTrigger className="h-9 rounded-xl text-xs border-border/60 shadow-sm bg-background">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="single">Single</SelectItem>
                        <SelectItem value="married">Married</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[11px] text-muted-foreground uppercase">Date of Birth</Label>
                    <div className="space-y-1">
                      <Input type="date" className="h-9 rounded-xl text-xs border-border/60 shadow-sm bg-background" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[11px] text-muted-foreground uppercase">Place of Birth</Label>
                    <Input className="h-9 rounded-xl text-xs border-border/60 shadow-sm bg-background" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[11px] text-muted-foreground uppercase">Nationality</Label>
                  <div className="grid grid-cols-[1fr_auto] gap-4 items-center">
                    <Select defaultValue="filipino">
                      <SelectTrigger className="h-9 rounded-xl text-xs border-border/60 shadow-sm bg-background">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="filipino">Filipino</SelectItem>
                      </SelectContent>
                    </Select>
                    <label className="flex items-center gap-2 text-[11px] font-medium text-muted-foreground cursor-pointer">
                      <Checkbox className="rounded-md border-border/60" /> 
                      <span>Foreign Student?</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-6 border border-border/60 rounded-2xl overflow-hidden bg-card shadow-sm">
              <div className="flex flex-wrap gap-1 border-b border-border/60 bg-muted/20 p-1">
                {rightMiniTabs.map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveMiniTab(tab)}
                    className={cn(
                      "px-3 py-1.5 text-xs font-bold rounded-lg transition-all",
                      activeMiniTab === tab
                        ? "bg-background text-foreground shadow-md"
                        : "text-muted-foreground hover:bg-background/40 hover:text-foreground",
                    )}
                  >
                    {tab}
                  </button>
                ))}
              </div>
              <div className="p-4 space-y-4">
                <div className="border border-border/40 rounded-xl bg-muted/5 overflow-hidden">
                  <div className="bg-background/50 px-3 py-1.5 border-b border-border/40">
                    <p className="text-[10px] font-bold text-foreground">RESIDENCE/PRESENT ADDRESS</p>
                  </div>
                  <div className="p-3 grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-[10px] text-muted-foreground uppercase">Residence</Label>
                      <Input className="h-9 rounded-lg text-xs border-border/60 shadow-sm bg-background" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] text-muted-foreground uppercase">Street</Label>
                      <Input className="h-9 rounded-lg text-xs border-border/60 shadow-sm bg-background" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] text-muted-foreground uppercase">Barangay</Label>
                      <Input className="h-9 rounded-lg text-xs border-border/60 shadow-sm bg-background" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] text-muted-foreground uppercase">Town/City</Label>
                      <Input className="h-9 rounded-lg text-xs border-border/60 shadow-sm bg-background" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] text-muted-foreground uppercase">Province</Label>
                      <Input className="h-9 rounded-lg text-xs border-border/60 shadow-sm bg-background" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] text-muted-foreground uppercase">Zip Code</Label>
                      <Input className="h-9 rounded-lg text-xs border-border/60 shadow-sm bg-background" />
                    </div>
                  </div>
                </div>

                <div className="border border-border/40 rounded-xl bg-muted/5 overflow-hidden">
                  <div className="bg-background/50 px-3 py-1.5 border-b border-border/40">
                    <p className="text-[10px] font-bold text-foreground">PERMANENT ADDRESS</p>
                  </div>
                  <div className="p-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-[10px] text-muted-foreground uppercase">Residence</Label>
                        <Input className="h-9 rounded-lg text-xs border-border/60 shadow-sm bg-background" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] text-muted-foreground uppercase">Street</Label>
                        <Input className="h-9 rounded-lg text-xs border-border/60 shadow-sm bg-background" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] text-muted-foreground uppercase">Barangay</Label>
                        <Input className="h-9 rounded-lg text-xs border-border/60 shadow-sm bg-background" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] text-muted-foreground uppercase">Town/City</Label>
                        <Input className="h-9 rounded-lg text-xs border-border/60 shadow-sm bg-background" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] text-muted-foreground uppercase">Province</Label>
                        <Input className="h-9 rounded-lg text-xs border-border/60 shadow-sm bg-background" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] text-muted-foreground uppercase">Zip Code</Label>
                        <Input className="h-9 rounded-lg text-xs border-border/60 shadow-sm bg-background" />
                      </div>
                    </div>
                    <div className="mt-4 flex justify-end">
                      <Button type="button" variant="outline" className="h-8 rounded-lg text-[10px] px-3 font-semibold shadow-sm">
                        COPY RESIDENCE ADDRESS
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  </div>
);
}

