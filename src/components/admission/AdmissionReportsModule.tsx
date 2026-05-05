"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const API = process.env.NEXT_PUBLIC_API_URL;
const NONE = "__none__";

type AcademicYearTerm = { id: number; academic_year: string; term: string };
type Campus = { id: number; acronym: string; campus_name: string | null };
type College = { id: number; college_code?: string | null; college_name: string };
type AcademicProgram = { id: number; program_code: string; program_name: string };
type MajorDiscipline = { id: number; major_discipline: string };
type AcademicInstitution = { id: number; official_name?: string | null; institution_name?: string | null };
type ApplicationRow = {
  app_no: string;
  app_date: string;
  last_name: string;
  first_name: string;
  gender: string;
  date_of_birth: string | null;
  choice1_program_code?: string | null;
  choice1_program_name?: string | null;
};

const reportGroups = [
  "Applicants",
  "Statistics",
  "Course Choices",
  "Campus Choices",
  "Ranking",
  "Others",
];

export function AdmissionReportsModule() {
  const [yearTerms, setYearTerms] = useState<AcademicYearTerm[]>([]);
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [colleges, setColleges] = useState<College[]>([]);
  const [programs, setPrograms] = useState<AcademicProgram[]>([]);
  const [majors, setMajors] = useState<MajorDiscipline[]>([]);
  const [selectedTermId, setSelectedTermId] = useState<string>(NONE);
  const [selectedCampusId, setSelectedCampusId] = useState<string>(NONE);
  const [selectedCollegeId, setSelectedCollegeId] = useState<string>(NONE);
  const [selectedProgramId, setSelectedProgramId] = useState<string>(NONE);
  const [selectedMajorId, setSelectedMajorId] = useState<string>(NONE);
  const [institutionName, setInstitutionName] = useState<string>("Institution");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewRows, setPreviewRows] = useState<ApplicationRow[]>([]);

  useEffect(() => {
    const load = async () => {
      if (!API) return;
      try {
        const [termRes, campusRes, collegeRes, programRes, majorRes, institutionRes] = await Promise.all([
          fetch(`${API}/api/academic-year-terms`),
          fetch(`${API}/api/campuses`),
          fetch(`${API}/api/colleges`),
          fetch(`${API}/api/academic-programs?status=active`),
          fetch(`${API}/api/ched-major-disciplines`),
          fetch(`${API}/api/academic-institutions`),
        ]);
        if (termRes.ok) {
          const rows = (await termRes.json()) as AcademicYearTerm[];
          setYearTerms(rows);
          if (rows[0]) setSelectedTermId(String(rows[0].id));
        }
        if (campusRes.ok) {
          const rows = (await campusRes.json()) as Campus[];
          setCampuses(rows);
          if (rows[0]) setSelectedCampusId(String(rows[0].id));
        }
        if (collegeRes.ok) setColleges((await collegeRes.json()) as College[]);
        if (programRes.ok) setPrograms((await programRes.json()) as AcademicProgram[]);
        if (majorRes.ok) {
          const rows = (await majorRes.json()) as MajorDiscipline[];
          setMajors(rows);
        }
        if (institutionRes.ok) {
          const rows = (await institutionRes.json()) as AcademicInstitution[];
          if (rows[0]) {
            setInstitutionName(
              rows[0].official_name?.trim() ||
                rows[0].institution_name?.trim() ||
                "Institution"
            );
          }
        }
      } catch {
        // leave empty options if API unavailable
      }
    };
    void load();
  }, []);

  const openPreview = async () => {
    if (!API) return;
    const params = new URLSearchParams();
    if (selectedTermId !== NONE) params.set("term_id", selectedTermId);
    if (selectedCampusId !== NONE) params.set("campus_id", selectedCampusId);
    try {
      const res = await fetch(`${API}/api/admission/applications?${params.toString()}`);
      if (!res.ok) return;
      setPreviewRows((await res.json()) as ApplicationRow[]);
      setPreviewOpen(true);
    } catch {
      // keep closed if request fails
    }
  };

  return (
    <div className="h-full bg-background relative overflow-x-hidden">
      <div className="w-full px-2 pt-2 pb-4">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h1 className="setup-type-page-title">Admission Reports</h1>
            <p className="setup-type-page-desc">
              Select report type and run admission reports with campus, term, and grouping filters.
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <div className="setup-type-kicker-pill flex h-9 items-center rounded-xl border border-border/60 bg-background/70 px-3 shadow-sm backdrop-blur">
              Admission module
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl bg-background border border-border/40 shadow-sm">
          <div className="px-4 py-3 flex items-center gap-3 border-b border-border/40 bg-muted/5">
            <div className="leading-tight min-w-0">
              <div className="setup-type-module-title truncate">Admission Reports Workspace</div>
              <div className="setup-type-module-sub">Select report and other parameters</div>
            </div>
          </div>

          <div className="p-3 bg-background/60">
            <div className="grid grid-cols-1 xl:grid-cols-[260px_1fr] gap-3">
              <div className="rounded-2xl border border-border/60 overflow-auto bg-card shadow-sm premium-surface min-h-[460px]">
                <div className="sticky top-0 z-10 bg-muted/50 border-b border-border/60 px-3 py-2 text-xs font-semibold">
                  Select Report
                </div>
                <div className="p-3 space-y-1">
                  {reportGroups.map((group) => (
                    <button
                      key={group}
                      type="button"
                      className="w-full text-left rounded-lg px-2 py-1.5 text-sm font-medium hover:bg-muted/50 border border-transparent hover:border-border/50"
                    >
                      {group}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-border/60 bg-card shadow-sm premium-surface min-h-[460px]">
                <div className="px-3 py-2 border-b border-border/60 text-xs text-muted-foreground">
                  Select the Report and other parameters....
                </div>

                <div className="p-3 space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-[130px_1fr] gap-2 items-center text-xs">
                    <Label>Admission Report</Label>
                    <Select defaultValue="list-all-applicants">
                      <SelectTrigger className="h-8 rounded-xl text-xs border-border/60 shadow-sm bg-background">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="list-all-applicants">List of All Applicants</SelectItem>
                      </SelectContent>
                    </Select>

                    <Label>Academic Year</Label>
                    <Select value={selectedTermId} onValueChange={setSelectedTermId}>
                      <SelectTrigger className="h-8 rounded-xl text-xs border-border/60 shadow-sm bg-background">
                        <SelectValue placeholder="Select term" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NONE}>All terms</SelectItem>
                        {yearTerms.map((t) => (
                          <SelectItem key={t.id} value={String(t.id)}>
                            {t.academic_year} {t.term}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Label>Campus</Label>
                    <Select value={selectedCampusId} onValueChange={setSelectedCampusId}>
                      <SelectTrigger className="h-8 rounded-xl text-xs border-border/60 shadow-sm bg-background">
                        <SelectValue placeholder="Select campus" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NONE}>All Campus/es</SelectItem>
                        {campuses.map((c) => (
                          <SelectItem key={c.id} value={String(c.id)}>
                            {c.acronym || c.campus_name || `Campus ${c.id}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="border-t border-border/60 pt-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <Checkbox id="all-group" defaultChecked />
                      <Label htmlFor="all-group" className="text-xs">All Group</Label>
                    </div>

                    <div className="grid grid-cols-[110px_1fr_34px] gap-2 items-center">
                      <div className="flex items-center gap-2">
                        <Checkbox id="by-college" />
                        <Label htmlFor="by-college" className="text-xs">By College:</Label>
                      </div>
                      <Select value={selectedCollegeId} onValueChange={setSelectedCollegeId}>
                        <SelectTrigger className="h-8 rounded-xl text-xs border-border/60 shadow-sm bg-background">
                          <SelectValue placeholder="Select college" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={NONE}>All colleges</SelectItem>
                          {colleges.map((c) => (
                            <SelectItem key={c.id} value={String(c.id)}>
                              {c.college_code ? `${c.college_code} - ` : ""}{c.college_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <div />
                    </div>

                    <div className="grid grid-cols-[110px_1fr_34px] gap-2 items-center">
                      <div className="flex items-center gap-2">
                        <Checkbox id="by-program" />
                        <Label htmlFor="by-program" className="text-xs">By Program:</Label>
                      </div>
                      <Select value={selectedProgramId} onValueChange={setSelectedProgramId}>
                        <SelectTrigger className="h-8 rounded-xl text-xs border-border/60 shadow-sm bg-background">
                          <SelectValue placeholder="Select program" />
                        </SelectTrigger>
                        <SelectContent className="max-h-72 overflow-y-auto">
                          <SelectItem value={NONE}>All programs</SelectItem>
                          {programs.map((p) => (
                            <SelectItem key={p.id} value={String(p.id)}>
                              {p.program_code} - {p.program_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <div />
                    </div>

                    <div className="grid grid-cols-[110px_1fr] gap-2 items-center">
                      <Label className="text-xs">Major Study :</Label>
                      <Select value={selectedMajorId} onValueChange={setSelectedMajorId}>
                        <SelectTrigger className="h-8 rounded-xl text-xs border-border/60 shadow-sm bg-background">
                          <SelectValue placeholder="Select major study" />
                        </SelectTrigger>
                        <SelectContent className="max-h-72 overflow-y-auto">
                          <SelectItem value={NONE}>All majors</SelectItem>
                          {majors.map((m) => (
                            <SelectItem key={m.id} value={String(m.id)}>
                              {m.major_discipline}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="px-3 py-2 border-t border-border/60 bg-muted/20 flex justify-end gap-2">
                  <Button
                    onClick={() => void openPreview()}
                    className="h-8 rounded-xl px-4 text-xs font-semibold bg-primary hover:bg-primary/90"
                  >
                    Preview
                  </Button>
                  <Button variant="outline" className="h-8 rounded-xl px-4 text-xs">
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-[96vw] h-[90vh] p-0 gap-0 rounded-none border-[#2f69b0] overflow-hidden">
          <DialogHeader className="bg-gradient-to-b from-[#0f68d5] to-[#0a3f96] text-white px-3 py-1.5">
            <DialogTitle className="text-sm font-semibold">List of All Applicants</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-auto bg-[#9e9e9e] p-4">
            <div className="mx-auto w-[760px] min-h-[980px] bg-white border border-[#757575] shadow-sm p-6">
              <div className="text-center space-y-1">
                <div className="text-[15px] font-semibold">{institutionName}</div>
                <div className="text-[11px] uppercase tracking-wide">Admission Report</div>
                <div className="text-[11px] font-semibold">List of Applicants</div>
                <div className="text-[10px] text-muted-foreground">
                  {yearTerms.find((t) => String(t.id) === selectedTermId)
                    ? `${yearTerms.find((t) => String(t.id) === selectedTermId)?.academic_year} ${yearTerms.find((t) => String(t.id) === selectedTermId)?.term}`
                    : "All Terms"}
                  {" • "}
                  {selectedCampusId !== NONE
                    ? campuses.find((c) => String(c.id) === selectedCampusId)?.acronym || "Campus"
                    : "All Campuses"}
                </div>
              </div>

              <div className="mt-4 border-t border-b border-black/60">
                <table className="w-full text-[10px] border-collapse">
                  <thead>
                    <tr className="border-b border-black/40">
                      {["#", "App No", "Date", "Full Name", "Gender", "Age", "Code", "Program Choices", "Type"].map((h) => (
                        <th key={h} className="px-1 py-1 text-left font-semibold whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewRows.map((r, idx) => {
                      const age = r.date_of_birth
                        ? Math.max(0, new Date().getFullYear() - new Date(r.date_of_birth).getFullYear())
                        : "";
                      return (
                        <tr key={`${r.app_no}-${idx}`} className="border-b border-black/10">
                          <td className="px-1 py-0.5">{idx + 1}</td>
                          <td className="px-1 py-0.5 whitespace-nowrap">{r.app_no}</td>
                          <td className="px-1 py-0.5 whitespace-nowrap">{new Date(r.app_date).toLocaleDateString()}</td>
                          <td className="px-1 py-0.5 whitespace-nowrap">{`${r.last_name}, ${r.first_name}`}</td>
                          <td className="px-1 py-0.5">{r.gender}</td>
                          <td className="px-1 py-0.5">{age}</td>
                          <td className="px-1 py-0.5">{r.choice1_program_code ?? ""}</td>
                          <td className="px-1 py-0.5">{r.choice1_program_name ?? ""}</td>
                          <td className="px-1 py-0.5">Freshman</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

