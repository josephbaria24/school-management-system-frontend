"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const API = process.env.NEXT_PUBLIC_API_URL;
const NONE = "__none__";

type Campus = { id: number; acronym: string; campus_name: string | null };
type AcademicProgram = { id: number; program_code: string; program_name: string };
type AcademicYearTerm = { id: number; academic_year: string; term: string };
type MajorStudyOption = { major_study?: string | null };
type ApplicationRow = {
  app_no: string;
  app_date: string;
  last_name: string;
  first_name: string;
  gender: string;
  date_of_birth: string | null;
  choice1_campus: string | null;
  choice1_program_code: string | null;
  choice1_program_name: string | null;
};

export function ListOfApplicationsModule() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [programs, setPrograms] = useState<AcademicProgram[]>([]);
  const [terms, setTerms] = useState<AcademicYearTerm[]>([]);
  const [selectedTermId, setSelectedTermId] = useState<string>(NONE);
  const [selectedCampusId, setSelectedCampusId] = useState<string>(NONE);
  const [rows, setRows] = useState<ApplicationRow[]>([]);

  const [newAppNo, setNewAppNo] = useState("");
  const [newLastName, setNewLastName] = useState("");
  const [newFirstName, setNewFirstName] = useState("");
  const [newMiddleName, setNewMiddleName] = useState("");
  const [newMiddleInitial, setNewMiddleInitial] = useState("");
  const [newGender, setNewGender] = useState<"M" | "F">("M");
  const [newBirthDate, setNewBirthDate] = useState("");
  const [newCourseId, setNewCourseId] = useState<string>(NONE);
  const [majorStudies, setMajorStudies] = useState<string[]>([]);
  const [newMajorStudy, setNewMajorStudy] = useState<string>(NONE);
  const [newApplyType, setNewApplyType] = useState("freshman");
  const [newTestingDate, setNewTestingDate] = useState("");
  const [newOrNo, setNewOrNo] = useState("");

  useEffect(() => {
    const load = async () => {
      if (!API) return;
      try {
        const [campusRes, programsRes, termsRes] = await Promise.all([
          fetch(`${API}/api/campuses`),
          fetch(`${API}/api/academic-programs?status=active`),
          fetch(`${API}/api/academic-year-terms`),
        ]);
        if (campusRes.ok) {
          const campusRows = (await campusRes.json()) as Campus[];
          setCampuses(campusRows);
          if (campusRows[0]) setSelectedCampusId(String(campusRows[0].id));
        }
        if (programsRes.ok) setPrograms((await programsRes.json()) as AcademicProgram[]);
        if (termsRes.ok) {
          const termRows = (await termsRes.json()) as AcademicYearTerm[];
          setTerms(termRows);
          if (termRows[0]) setSelectedTermId(String(termRows[0].id));
        }
      } catch {
        // keep static fallback UI
      }
    };
    void load();
  }, []);

  useEffect(() => {
    const loadRows = async () => {
      if (!API) return;
      const params = new URLSearchParams();
      if (selectedTermId !== NONE) params.set("term_id", selectedTermId);
      if (selectedCampusId !== NONE) params.set("campus_id", selectedCampusId);
      const query = params.toString();
      const url = `${API}/api/admission/applications${query ? `?${query}` : ""}`;
      try {
        const res = await fetch(url);
        if (!res.ok) return;
        setRows((await res.json()) as ApplicationRow[]);
      } catch {
        // keep current rows
      }
    };
    void loadRows();
  }, [selectedTermId, selectedCampusId]);

  useEffect(() => {
    const loadMajorStudies = async () => {
      if (!API || newCourseId === NONE) {
        setMajorStudies([]);
        setNewMajorStudy(NONE);
        return;
      }
      try {
        const res = await fetch(`${API}/api/academic-programs/${newCourseId}/major-studies`);
        if (!res.ok) {
          setMajorStudies([]);
          setNewMajorStudy(NONE);
          return;
        }
        const rows = (await res.json()) as Array<string | MajorStudyOption>;
        const names = rows
          .map((row) => (typeof row === "string" ? row : row?.major_study ?? ""))
          .map((v) => v.trim())
          .filter(Boolean);
        setMajorStudies(names);
        setNewMajorStudy((prev) => (prev !== NONE && names.includes(prev) ? prev : NONE));
      } catch {
        setMajorStudies([]);
        setNewMajorStudy(NONE);
      }
    };
    void loadMajorStudies();
  }, [newCourseId]);

  const applyTypeToId: Record<string, number> = {
    freshman: 1,
    transferee: 2,
    "cross-enrollee": 3,
    returnee: 4,
  };

  const createNewApplication = async () => {
    if (!API) return;
    if (selectedTermId === NONE || selectedCampusId === NONE) return;
    const body = {
      app_no: newAppNo || undefined,
      app_date: newTestingDate || null,
      term_id: Number(selectedTermId),
      apply_type_id: applyTypeToId[newApplyType] ?? null,
      last_name: newLastName,
      first_name: newFirstName,
      middle_name: newMiddleName,
      middle_initial: newMiddleInitial,
      gender: newGender,
      date_of_birth: newBirthDate || null,
      choice1_campus_id: Number(selectedCampusId),
      choice1_course: newCourseId !== NONE ? Number(newCourseId) : null,
      choice1_major_study: newMajorStudy !== NONE ? newMajorStudy : null,
      or_no: newOrNo,
    };
    const res = await fetch(`${API}/api/admission/applications`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) return;
    const created = (await res.json()) as { app_no?: string };
    const createdAppNo = (created.app_no || "").trim();
    setOpen(false);
    setNewAppNo("");
    setNewLastName("");
    setNewFirstName("");
    setNewMiddleName("");
    setNewMiddleInitial("");
    setNewGender("M");
    setNewBirthDate("");
    setNewCourseId(NONE);
    setMajorStudies([]);
    setNewMajorStudy(NONE);
    setNewApplyType("freshman");
    setNewTestingDate("");
    setNewOrNo("");
    if (createdAppNo) {
      router.push(`/admission/applications/applicant-profile?app_no=${encodeURIComponent(createdAppNo)}`);
      return;
    }

    const params = new URLSearchParams();
    if (selectedTermId !== NONE) params.set("term_id", selectedTermId);
    if (selectedCampusId !== NONE) params.set("campus_id", selectedCampusId);
    const listRes = await fetch(`${API}/api/admission/applications?${params.toString()}`);
    if (listRes.ok) setRows((await listRes.json()) as ApplicationRow[]);
  };

  return (
    <div className="h-full bg-background relative overflow-x-hidden">
      <div className="w-full px-2 pt-2 pb-4">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h1 className="setup-type-page-title">List of Applications</h1>
            <p className="setup-type-page-desc">
              View and create student admission applications by selected term and campus.
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
              <div className="setup-type-module-title truncate">Applications Workspace</div>
              <div className="setup-type-module-sub">Academic year/term and campus filtered list</div>
            </div>
          </div>

          <div className="p-3 bg-background/60 space-y-3">
            <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-border/60 p-2 bg-muted/15 shadow-sm">
              <Button
                type="button"
                onClick={() => setOpen(true)}
                className="h-9 rounded-xl px-3 text-xs font-semibold bg-primary hover:bg-primary/90"
              >
                New
              </Button>
              <div className="flex items-center gap-2">
                <Label className="text-[11px] text-muted-foreground uppercase">Academic Year / Term</Label>
                <Select value={selectedTermId} onValueChange={setSelectedTermId}>
                  <SelectTrigger className="h-8 rounded-xl text-xs min-w-[220px] border-border/60 shadow-sm bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {terms.map((t) => (
                      <SelectItem key={t.id} value={String(t.id)}>
                        {t.academic_year} {t.term}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Label className="text-[11px] text-muted-foreground uppercase">Campus</Label>
                <Select value={selectedCampusId} onValueChange={setSelectedCampusId}>
                  <SelectTrigger className="h-8 rounded-xl text-xs min-w-[160px] border-border/60 shadow-sm bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>All Campuses</SelectItem>
                    {campuses.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.acronym || c.campus_name || `Campus ${c.id}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1" />
              <span className="text-[11px] font-semibold text-muted-foreground">
                TOTAL APPLICANTS: {rows.length}
              </span>
            </div>

            <div className="rounded-2xl border border-border/60 overflow-auto bg-card shadow-sm premium-surface">
              <table className="w-full text-[10px] border-collapse min-w-[980px]">
                <thead>
                  <tr className="sticky top-0 z-20 bg-muted/50 text-left shadow-sm">
                    {[
                      "Application No.",
                      "App Date",
                      "Last Name",
                      "First Name",
                      "Gender",
                      "Date of Birth",
                      "Campus - Choice 1",
                      "Course - Choice 1",
                      "Major Study - Choice 1",
                    ].map((h) => (
                      <th
                        key={h}
                        className="setup-type-table-header border-b border-r border-border/60 px-2 py-2 text-left whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-4 italic text-muted-foreground">
                        THERE ARE NO RECORD TO SHOW.....
                      </td>
                    </tr>
                  ) : (
                    rows.map((r, idx) => (
                      <tr
                        key={r.app_no}
                        className={idx % 2 === 1 ? "bg-muted/10 border-b border-border/40" : "border-b border-border/40"}
                      >
                        <td className="px-2 py-1 border-r border-border/30">{r.app_no}</td>
                        <td className="px-2 py-1 border-r border-border/30">{new Date(r.app_date).toLocaleDateString()}</td>
                        <td className="px-2 py-1 border-r border-border/30">{r.last_name}</td>
                        <td className="px-2 py-1 border-r border-border/30">{r.first_name}</td>
                        <td className="px-2 py-1 border-r border-border/30">{r.gender}</td>
                        <td className="px-2 py-1 border-r border-border/30">
                          {r.date_of_birth ? new Date(r.date_of_birth).toLocaleDateString() : ""}
                        </td>
                        <td className="px-2 py-1 border-r border-border/30">{r.choice1_campus ?? ""}</td>
                        <td className="px-2 py-1 border-r border-border/30">{r.choice1_program_name ?? ""}</td>
                        <td className="px-2 py-1">{r.choice1_program_code ?? ""}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-[820px] max-h-[80vh] p-0 gap-0 rounded-2xl border-border/60 overflow-hidden shadow-2xl flex flex-col" aria-describedby={undefined}>
          <DialogHeader className="bg-primary text-primary-foreground px-4 py-2">
            <DialogTitle className="text-sm font-semibold tracking-wide uppercase">New Student Application</DialogTitle>
          </DialogHeader>
          <div className="bg-muted/20 px-4 py-3 border-b border-border/60">
            <h2 className="text-2xl leading-none text-foreground font-semibold">New Application Form</h2>
            <p className="text-xs text-muted-foreground mt-1">
              Please verify that all information entered in this form are true and correct.
            </p>
          </div>
          <div className="flex-1 overflow-y-auto">
            <div className="bg-background p-4 grid grid-cols-[220px_1fr] gap-4">
              <div className="rounded-2xl border border-border/60 bg-muted/10 p-3 flex items-end shadow-sm">
                <div className="w-full rounded-xl border border-border/60 bg-background text-center py-1 text-base font-semibold text-foreground">
                  {terms.find((t) => String(t.id) === selectedTermId)
                    ? `${terms.find((t) => String(t.id) === selectedTermId)?.academic_year} ${terms.find((t) => String(t.id) === selectedTermId)?.term}`
                    : "Selected Term"}
                </div>
              </div>

              <div className="space-y-2 text-[11px]">
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-[11px]">Application No.</Label>
                    <Input value={newAppNo} onChange={(e) => setNewAppNo(e.target.value)} className="h-7 rounded-md text-[11px] border-border/60 bg-background shadow-sm" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px]">Official Receipt <span className="text-muted-foreground">(if any)</span></Label>
                    <Input value={newOrNo} onChange={(e) => setNewOrNo(e.target.value)} className="h-7 rounded-md text-[11px] border-border/60 bg-background shadow-sm" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-[11px]">Last Name</Label>
                    <Input value={newLastName} onChange={(e) => setNewLastName(e.target.value)} className="h-7 rounded-md text-[11px] border-border/60 bg-background shadow-sm" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px]">First Name</Label>
                    <Input value={newFirstName} onChange={(e) => setNewFirstName(e.target.value)} className="h-7 rounded-md text-[11px] border-border/60 bg-background shadow-sm" />
                  </div>
                </div>

                <div className="grid grid-cols-[1fr_110px] gap-2">
                  <div className="space-y-1">
                    <Label className="text-[11px]">Middle Name</Label>
                    <Input
                      value={newMiddleName}
                      onChange={(e) => {
                        const value = e.target.value;
                        setNewMiddleName(value);
                        const trimmed = value.trim();
                        setNewMiddleInitial(trimmed ? trimmed.charAt(0).toUpperCase() : "");
                      }}
                      className="h-7 rounded-md text-[11px] border-border/60 bg-background shadow-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px]">Middle Initial</Label>
                    <Input value={newMiddleInitial} onChange={(e) => setNewMiddleInitial(e.target.value)} className="h-7 rounded-md text-[11px] border-border/60 bg-background shadow-sm" />
                  </div>
                </div>

                <div className="grid grid-cols-[1fr_1fr] gap-2 items-end">
                  <div className="space-y-1">
                    <Label className="text-[11px]">Date of Birth</Label>
                    <Input type="date" value={newBirthDate} onChange={(e) => setNewBirthDate(e.target.value)} className="h-7 rounded-md text-[11px] border-border/60 bg-background shadow-sm" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px]">Gender</Label>
                    <div className="h-7 px-2 border border-border/60 rounded-md bg-background shadow-sm flex items-center gap-6">
                      <label className="flex items-center gap-1"><input type="radio" name="new-app-gender" checked={newGender === "M"} onChange={() => setNewGender("M")} /> Male</label>
                      <label className="flex items-center gap-1"><input type="radio" name="new-app-gender" checked={newGender === "F"} onChange={() => setNewGender("F")} /> Female</label>
                    </div>
                  </div>
                </div>

                <Label className="font-semibold text-primary uppercase tracking-wide text-[11px] pt-1">General Admission Information</Label>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-[11px]">Campus Choice</Label>
                    <Select value={selectedCampusId} onValueChange={setSelectedCampusId}>
                      <SelectTrigger className="h-7 rounded-md text-[11px] border-border/60 bg-background shadow-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NONE}>Select campus</SelectItem>
                        {campuses.map((c) => (
                          <SelectItem key={c.id} value={String(c.id)}>
                            {c.acronym || c.campus_name || `Campus ${c.id}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px]">Academic Program</Label>
                    <Select value={newCourseId} onValueChange={setNewCourseId}>
                      <SelectTrigger className="h-7 rounded-md text-[11px] border-border/60 bg-background shadow-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="max-h-72 overflow-y-auto">
                        <SelectItem value={NONE}>Select program</SelectItem>
                        {programs.map((p) => (
                          <SelectItem key={p.id} value={String(p.id)}>
                            {p.program_code} - {p.program_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-[11px]">Major Study</Label>
                    <Select value={newMajorStudy} onValueChange={setNewMajorStudy} disabled={newCourseId === NONE || majorStudies.length === 0}>
                      <SelectTrigger className="h-7 rounded-md text-[11px] border-border/60 bg-background shadow-sm">
                        <SelectValue placeholder={newCourseId === NONE ? "Select program first" : "Select major study"} />
                      </SelectTrigger>
                      <SelectContent className="max-h-72 overflow-y-auto">
                        <SelectItem value={NONE}>Select major study</SelectItem>
                        {majorStudies.map((m) => (
                          <SelectItem key={m} value={m}>
                            {m}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px]">Testing Center</Label>
                    <Input className="h-7 rounded-md text-[11px] border-border/60 bg-background shadow-sm" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-[11px]">Application Type</Label>
                    <Select value={newApplyType} onValueChange={setNewApplyType}>
                      <SelectTrigger className="h-7 rounded-md text-[11px] border-border/60 bg-background shadow-sm">
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
                  <div className="space-y-1">
                    <Label className="text-[11px]">Testing Date</Label>
                    <Input type="date" value={newTestingDate} onChange={(e) => setNewTestingDate(e.target.value)} className="h-7 rounded-md text-[11px] border-border/60 bg-background shadow-sm" />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-muted/20 px-4 pb-4 pt-1 flex justify-end gap-2 border-t border-border/60">
            <Button type="button" className="h-8 rounded-xl px-4 text-xs bg-emerald-600 hover:bg-emerald-700" onClick={() => void createNewApplication()}>
              Ok
            </Button>
            <Button type="button" variant="outline" className="h-8 rounded-xl px-4 text-xs" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

