"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  ClipboardList,
  Filter,
  Loader2,
  LogOut,
  Printer,
  Save,
  Search,
  Square,
  Tags,
  X,
} from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL;

type YearTerm = { id: number; academic_year: string; term: string };
type Campus = { id: number; acronym: string; campus_name: string | null };
type CollegeRow = { id: number; campus_id?: number | null; college_code: string; college_name: string };

type GraduatingRow = {
  id: number;
  student_no: string;
  student_name: string | null;
  college_code: string | null;
  program_code: string | null;
  date_graduated: string | null;
  graduation_fee_template: string | null;
  remarks: string | null;
  graduation_application_approved: boolean;
  date_entry: string | null;
};

type MassCandidate = {
  student_no: string;
  student_name: string | null;
  college_code: string | null;
  program_code: string | null;
  major_study: string | null;
  year_level: string | null;
  curriculum_total_load: string | null;
  already_tagged: boolean;
};

type StudentProfile = {
  student_no: string;
  last_name: string;
  first_name: string;
  middle_name: string;
  ext_name: string;
  college: string;
  academic_program: string;
  major_study: string;
  year_level: string;
};

type OptionsPayload = {
  graduation_fee_templates: { key: string; label: string }[];
};

function fmt(v: string | null | undefined) {
  const s = v == null ? "" : String(v).trim();
  return s || "—";
}

function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

function nowTime() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

const selectClass =
  "h-8 w-full min-w-0 rounded-lg border border-border/60 bg-background px-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

const readOnlyInput =
  "h-8 rounded-lg border border-border/60 bg-muted/30 px-2 text-xs read-only:text-foreground";

function applyTagToForm(
  tag: GraduatingRow | null,
  setters: {
    setActiveTagId: (id: number | null) => void;
    setFeeTemplate: (v: string) => void;
    setRemarks: (v: string) => void;
    setApproved: (v: boolean) => void;
    setDateEntry: (v: string) => void;
    setTimeEntry: (v: string) => void;
  }
) {
  if (!tag) {
    setters.setActiveTagId(null);
    return;
  }
  setters.setActiveTagId(tag.id);
  setters.setFeeTemplate(tag.graduation_fee_template ?? "default");
  setters.setRemarks(tag.remarks ?? "");
  setters.setApproved(tag.graduation_application_approved);
  if (tag.date_entry) {
    const d = new Date(tag.date_entry);
    if (!Number.isNaN(d.getTime())) {
      setters.setDateEntry(d.toISOString().slice(0, 10));
      setters.setTimeEntry(
        `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`
      );
    }
  }
}

export function TagGraduatingStudentsModule() {
  const router = useRouter();
  const abortRef = useRef<AbortController | null>(null);

  const [terms, setTerms] = useState<YearTerm[]>([]);
  const [termId, setTermId] = useState("");
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [campusId, setCampusId] = useState("");
  const [colleges, setColleges] = useState<CollegeRow[]>([]);
  const [options, setOptions] = useState<OptionsPayload | null>(null);
  const [activeTab, setActiveTab] = useState("individual");

  const [taggedList, setTaggedList] = useState<GraduatingRow[]>([]);
  const [loadingList, setLoadingList] = useState(false);

  const [studentQuery, setStudentQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [activeTagId, setActiveTagId] = useState<number | null>(null);

  const [feeTemplate, setFeeTemplate] = useState("default");
  const [remarks, setRemarks] = useState("");
  const [approved, setApproved] = useState(false);
  const [dateEntry, setDateEntry] = useState(todayDate);
  const [timeEntry, setTimeEntry] = useState(nowTime);
  const [saving, setSaving] = useState(false);

  const [massCollegeId, setMassCollegeId] = useState("");
  const [massProgram, setMassProgram] = useState("");
  const [massYearLevel, setMassYearLevel] = useState("");
  const [candidates, setCandidates] = useState<MassCandidate[]>([]);
  const [selectedMass, setSelectedMass] = useState<Set<string>>(new Set());
  const [loadingMass, setLoadingMass] = useState(false);
  const [massTagging, setMassTagging] = useState(false);

  const selectedCollege = useMemo(
    () => colleges.find((c) => String(c.id) === massCollegeId),
    [colleges, massCollegeId]
  );

  const campusColleges = useMemo(() => {
    if (!campusId) return colleges;
    const cid = Number(campusId);
    return colleges.filter((c) => c.campus_id == null || Number(c.campus_id) === cid);
  }, [colleges, campusId]);

  const loadTaggedList = useCallback(async () => {
    if (!API || !termId || !campusId) return;
    setLoadingList(true);
    try {
      const q = new URLSearchParams({ academicYearTermId: termId, campusId });
      const res = await fetch(`${API}/api/registrar/tag-graduating-students/list?${q}`);
      if (!res.ok) throw new Error(await res.text());
      setTaggedList((await res.json()) as GraduatingRow[]);
    } catch (e) {
      console.error(e);
      setTaggedList([]);
    } finally {
      setLoadingList(false);
    }
  }, [termId, campusId]);

  useEffect(() => {
    if (!API) return;
    let cancelled = false;
    (async () => {
      try {
        const [tRes, cRes, colRes, oRes] = await Promise.all([
          fetch(`${API}/api/academic-year-terms`),
          fetch(`${API}/api/campuses`),
          fetch(`${API}/api/colleges`),
          fetch(`${API}/api/registrar/tag-graduating-students/options`),
        ]);
        if (cancelled) return;
        if (tRes.ok) {
          const list = (await tRes.json()) as YearTerm[];
          setTerms(list);
          setTermId((prev) => (prev ? prev : list[0] ? String(list[0].id) : ""));
        }
        if (cRes.ok) {
          const list = (await cRes.json()) as Campus[];
          setCampuses(list);
          setCampusId((prev) => (prev ? prev : list[0] ? String(list[0].id) : ""));
        }
        if (colRes.ok) setColleges((await colRes.json()) as CollegeRow[]);
        if (oRes.ok) {
          const opts = (await oRes.json()) as OptionsPayload;
          setOptions(opts);
          if (opts.graduation_fee_templates?.[0]) {
            setFeeTemplate((prev) => prev || opts.graduation_fee_templates[0].key);
          }
        }
      } catch {
        /* noop */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    void loadTaggedList();
  }, [loadTaggedList]);

  useEffect(() => {
    if (!campusColleges.length) {
      setMassCollegeId("");
      return;
    }
    setMassCollegeId((prev) => {
      if (prev && campusColleges.some((c) => String(c.id) === prev)) return prev;
      return String(campusColleges[0].id);
    });
  }, [campusColleges]);

  const runSearch = useCallback(async () => {
    const q = studentQuery.trim();
    if (!API || !termId || !campusId || !q) return;
    setSearching(true);
    try {
      const params = new URLSearchParams({ academicYearTermId: termId, campusId, q });
      const res = await fetch(`${API}/api/registrar/tag-graduating-students/students?${params}`);
      if (!res.ok) throw new Error(await res.text());
      const hits = (await res.json()) as { student_no: string }[];
      if (!hits.length) {
        toast({ title: "No student found", variant: "destructive" });
        return;
      }
      const sn = hits[0].student_no;
      const wq = new URLSearchParams({ academicYearTermId: termId, campusId, studentNo: sn });
      const wRes = await fetch(`${API}/api/registrar/tag-graduating-students/student?${wq}`);
      if (!wRes.ok) throw new Error(await wRes.text());
      const data = (await wRes.json()) as { profile: StudentProfile; tag: GraduatingRow | null };
      setProfile(data.profile);
      applyTagToForm(data.tag, {
        setActiveTagId,
        setFeeTemplate,
        setRemarks,
        setApproved,
        setDateEntry,
        setTimeEntry,
      });
      setStudentQuery(sn);
    } catch (e) {
      console.error(e);
      toast({
        title: "Search failed",
        description: e instanceof Error ? e.message : "Could not load student.",
        variant: "destructive",
      });
    } finally {
      setSearching(false);
    }
  }, [termId, campusId, studentQuery, feeTemplate, remarks]);

  const clearStudent = useCallback(() => {
    setStudentQuery("");
    setProfile(null);
    setActiveTagId(null);
    setRemarks("");
    setApproved(false);
    setDateEntry(todayDate());
    setTimeEntry(nowTime());
  }, []);

  const handleSave = useCallback(async () => {
    if (!API || !termId || !campusId || !profile?.student_no) {
      toast({ title: "Search a student first", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const dateIso = `${dateEntry}T${timeEntry}:00`;
      const res = await fetch(`${API}/api/registrar/tag-graduating-students`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          academicYearTermId: Number(termId),
          campusId: Number(campusId),
          studentNo: profile.student_no,
          dateEntry: dateIso,
          graduationFeeTemplate: feeTemplate,
          remarks,
          graduationApplicationApproved: approved,
          majorStudy: profile.major_study,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const row = (await res.json()) as GraduatingRow;
      setActiveTagId(row.id);
      toast({ title: "Saved", description: "Graduating candidacy tagged. Student will be charged for graduation fee." });
      void loadTaggedList();
    } catch (e) {
      console.error(e);
      toast({
        title: "Save failed",
        description: e instanceof Error ? e.message : "Could not save tag.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }, [termId, campusId, profile, dateEntry, timeEntry, feeTemplate, remarks, approved, loadTaggedList]);

  const handleVoid = useCallback(async () => {
    if (!API || !activeTagId) {
      toast({ title: "No active tag to void", variant: "destructive" });
      return;
    }
    try {
      const res = await fetch(`${API}/api/registrar/tag-graduating-students/void`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: activeTagId }),
      });
      if (!res.ok) throw new Error(await res.text());
      toast({ title: "Voided", description: "Graduating tag has been voided." });
      setActiveTagId(null);
      void loadTaggedList();
    } catch (e) {
      console.error(e);
      toast({
        title: "Void failed",
        description: e instanceof Error ? e.message : "Could not void tag.",
        variant: "destructive",
      });
    }
  }, [activeTagId, loadTaggedList]);

  const handlePrint = useCallback(() => {
    if (!profile) {
      toast({ title: "Search a student first", variant: "destructive" });
      return;
    }
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Graduating candidacy</title>
      <style>body{font-family:Tahoma,Arial,sans-serif;font-size:12px;margin:16px}h1{font-size:16px}</style>
      </head><body>
      <h1>Tag graduating student</h1>
      <p><strong>${fmt(profile.student_no)}</strong> — ${fmt(profile.last_name)}, ${fmt(profile.first_name)} ${fmt(profile.middle_name)}</p>
      <p>College: ${fmt(profile.college)} · Program: ${fmt(profile.academic_program)} · Year: ${fmt(profile.year_level)}</p>
      <p>Fee template: ${fmt(feeTemplate)} · Remarks: ${fmt(remarks)} · Approved: ${approved ? "Yes" : "No"}</p>
      <script>window.onload=function(){window.print()}</script></body></html>`;
    const w = window.open("", "_blank", "noopener,noreferrer,width=700,height=600");
    if (!w) {
      toast({ title: "Pop-up blocked", variant: "destructive" });
      return;
    }
    w.document.write(html);
    w.document.close();
  }, [profile, feeTemplate, remarks, approved]);

  const loadMassCandidates = useCallback(async () => {
    if (!API || !termId || !campusId) return;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoadingMass(true);
    setSelectedMass(new Set());
    try {
      const q = new URLSearchParams({ academicYearTermId: termId, campusId });
      if (selectedCollege) q.set("collegeCode", selectedCollege.college_code);
      if (massProgram.trim()) q.set("program", massProgram.trim());
      if (massYearLevel.trim()) q.set("yearLevel", massYearLevel.trim());
      const res = await fetch(`${API}/api/registrar/tag-graduating-students/candidates?${q}`, {
        signal: controller.signal,
      });
      if (!res.ok) throw new Error(await res.text());
      const rows = (await res.json()) as MassCandidate[];
      setCandidates(rows.filter((r) => !r.already_tagged));
    } catch (e) {
      if (e instanceof Error && e.name === "AbortError") return;
      console.error(e);
      toast({
        title: "Filter failed",
        description: e instanceof Error ? e.message : "Could not load candidates.",
        variant: "destructive",
      });
      setCandidates([]);
    } finally {
      if (abortRef.current === controller) abortRef.current = null;
      setLoadingMass(false);
    }
  }, [termId, campusId, selectedCollege, massProgram, massYearLevel]);

  const handleStopMass = useCallback(() => {
    abortRef.current?.abort();
    setMassTagging(false);
    setLoadingMass(false);
    toast({ title: "Stopped", description: "Mass operation cancelled." });
  }, []);

  const toggleMassRow = (sn: string) => {
    setSelectedMass((prev) => {
      const next = new Set(prev);
      const key = sn.toUpperCase();
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleMassAll = () => {
    if (selectedMass.size === candidates.length) {
      setSelectedMass(new Set());
    } else {
      setSelectedMass(new Set(candidates.map((c) => c.student_no.toUpperCase())));
    }
  };

  const handleMassTag = useCallback(async () => {
    if (!API || !termId || !campusId) return;
    const nos = candidates
      .filter((c) => selectedMass.has(c.student_no.toUpperCase()))
      .map((c) => c.student_no);
    if (!nos.length) {
      toast({ title: "Select students", variant: "destructive" });
      return;
    }
    setMassTagging(true);
    try {
      const res = await fetch(`${API}/api/registrar/tag-graduating-students/mass`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          academicYearTermId: Number(termId),
          campusId: Number(campusId),
          studentNos: nos,
          graduationFeeTemplate: feeTemplate,
          remarks,
          graduationApplicationApproved: approved,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const result = (await res.json()) as { tagged: number; skipped: number };
      toast({
        title: "Mass tagging complete",
        description: `${result.tagged} tagged, ${result.skipped} skipped.`,
      });
      setSelectedMass(new Set());
      void loadTaggedList();
      void loadMassCandidates();
    } catch (e) {
      console.error(e);
      toast({
        title: "Mass tagging failed",
        description: e instanceof Error ? e.message : "Could not tag students.",
        variant: "destructive",
      });
    } finally {
      setMassTagging(false);
    }
  }, [
    termId,
    campusId,
    candidates,
    selectedMass,
    feeTemplate,
    remarks,
    approved,
    loadTaggedList,
    loadMassCandidates,
  ]);

  const feeLabel = (key: string) =>
    options?.graduation_fee_templates?.find((t) => t.key === key)?.label ?? key;

  return (
    <div className="h-full min-h-0 bg-background flex flex-col overflow-hidden">
      <div className="shrink-0 border-b border-border/60 bg-gradient-to-r from-sky-100/80 via-muted/30 to-muted/20 px-3 py-2">
        <div className="flex items-start gap-2">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-border/60 bg-background text-muted-foreground">
            <Tags className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="setup-type-page-title leading-tight">TAG GRADUATING STUDENTS</h1>
            <p className="setup-type-page-desc mt-0.5 text-sky-900/85 dark:text-sky-200/80">
              Tag students as candidates for graduation individually or in bulk.
            </p>
          </div>
        </div>
      </div>

      <div className="shrink-0 border-b border-amber-200/50 dark:border-amber-900/40 bg-gradient-to-r from-amber-50/90 to-muted/30 px-3 py-2">
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1 min-w-[200px]">
            <Label className="text-[10px] uppercase text-muted-foreground">Academic year / term</Label>
            <select className={selectClass} value={termId} onChange={(e) => setTermId(e.target.value)}>
              {terms.map((t) => (
                <option key={t.id} value={String(t.id)}>
                  {t.academic_year} {t.term}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1 min-w-[180px]">
            <Label className="text-[10px] uppercase text-muted-foreground">Campus</Label>
            <select className={selectClass} value={campusId} onChange={(e) => setCampusId(e.target.value)}>
              {campuses.map((c) => (
                <option key={c.id} value={String(c.id)}>
                  {[c.acronym, c.campus_name].filter(Boolean).join(" — ")}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 p-2 flex flex-col gap-2">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 min-h-0 flex flex-col">
          <TabsList className="w-fit shrink-0 bg-muted/50 p-1 rounded-xl h-9">
            <TabsTrigger value="individual" className="text-xs px-3 h-7 rounded-lg">
              Individual tagging of candidacy
            </TabsTrigger>
            <TabsTrigger value="mass" className="text-xs px-3 h-7 rounded-lg">
              Mass tagging of candidacy
            </TabsTrigger>
          </TabsList>

          <TabsContent value="individual" className="flex-1 min-h-0 mt-2 data-[state=inactive]:hidden flex gap-2">
            <div className="w-[340px] shrink-0 rounded-xl border border-border/60 bg-card flex flex-col min-h-0 overflow-hidden">
              <ScrollArea className="flex-1 min-h-0">
                <div className="p-3 space-y-3">
                  <p className="text-[10px] font-semibold uppercase text-muted-foreground">General information</p>
                  <div className="flex gap-1">
                    <Input
                      className="h-8 flex-1 rounded-lg text-xs font-mono"
                      placeholder="Student no."
                      value={studentQuery}
                      onChange={(e) => setStudentQuery(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && void runSearch()}
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      className="h-8 text-xs"
                      onClick={() => void runSearch()}
                      disabled={searching}
                    >
                      {searching ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
                    </Button>
                    <Button type="button" size="sm" variant="outline" className="h-8 text-xs" onClick={clearStudent}>
                      Clear
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-[10px] text-muted-foreground">Last name</Label>
                      <Input className={readOnlyInput} readOnly value={profile?.last_name ?? ""} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] text-muted-foreground">First name</Label>
                      <Input className={readOnlyInput} readOnly value={profile?.first_name ?? ""} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] text-muted-foreground">Middle name</Label>
                      <Input className={readOnlyInput} readOnly value={profile?.middle_name ?? ""} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] text-muted-foreground">Ext. name</Label>
                      <Input className={readOnlyInput} readOnly value={profile?.ext_name ?? ""} />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] text-muted-foreground">College</Label>
                    <Input className={readOnlyInput} readOnly value={profile?.college ?? ""} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] text-muted-foreground">Academic program</Label>
                    <Input className={readOnlyInput} readOnly value={profile?.academic_program ?? ""} />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-[10px] text-muted-foreground">Major study</Label>
                      <Input
                        className="h-8 rounded-lg text-xs"
                        value={profile?.major_study ?? ""}
                        onChange={(e) =>
                          setProfile((p) => (p ? { ...p, major_study: e.target.value } : p))
                        }
                        disabled={!profile}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] text-muted-foreground">Year level</Label>
                      <Input className={readOnlyInput} readOnly value={profile?.year_level ?? ""} />
                    </div>
                  </div>

                  <p className="text-[10px] font-semibold uppercase text-muted-foreground pt-1">
                    Tagging for graduating student
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-[10px] text-muted-foreground">Date entry</Label>
                      <Input
                        type="date"
                        className="h-8 rounded-lg text-xs"
                        value={dateEntry}
                        onChange={(e) => setDateEntry(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] text-muted-foreground">Time entry</Label>
                      <Input
                        type="time"
                        className="h-8 rounded-lg text-xs"
                        value={timeEntry}
                        onChange={(e) => setTimeEntry(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] text-muted-foreground">Graduation fee template</Label>
                    <select className={selectClass} value={feeTemplate} onChange={(e) => setFeeTemplate(e.target.value)}>
                      {(options?.graduation_fee_templates ?? []).map((t) => (
                        <option key={t.key} value={t.key}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] text-muted-foreground">Remarks</Label>
                    <Input className="h-8 rounded-lg text-xs" value={remarks} onChange={(e) => setRemarks(e.target.value)} />
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="grad-approved"
                      checked={approved}
                      onCheckedChange={(v) => setApproved(v === true)}
                    />
                    <Label htmlFor="grad-approved" className="text-xs cursor-pointer">
                      Graduation application approved?
                    </Label>
                  </div>
                  <p className="text-[11px] text-destructive font-medium">
                    Note: Student will be charged for graduation fee.
                  </p>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    <Button type="button" size="sm" className="h-8 text-xs gap-1" onClick={() => void handleSave()} disabled={saving || !profile}>
                      {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                      Save
                    </Button>
                    <Button type="button" size="sm" variant="secondary" className="h-8 text-xs gap-1" onClick={handlePrint} disabled={!profile}>
                      <Printer className="h-3.5 w-3.5" />
                      Print
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-8 text-xs gap-1"
                      onClick={() => void handleVoid()}
                      disabled={!activeTagId}
                    >
                      <X className="h-3.5 w-3.5" />
                      Void
                    </Button>
                  </div>
                </div>
              </ScrollArea>
            </div>

            <div className="flex-1 min-h-0 rounded-xl border border-border/60 bg-card flex flex-col overflow-hidden">
              <div className="shrink-0 px-3 py-2 border-b border-border/60">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  List of graduating / graduated students
                </p>
              </div>
              <ScrollArea className="flex-1 min-h-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-[10px]">Student no.</TableHead>
                      <TableHead className="text-[10px]">Full name</TableHead>
                      <TableHead className="text-[10px]">Program code</TableHead>
                      <TableHead className="text-[10px]">Date graduated</TableHead>
                      <TableHead className="text-[10px]">Template</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingList ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-xs text-muted-foreground py-8">
                          <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
                          Loading…
                        </TableCell>
                      </TableRow>
                    ) : taggedList.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-xs text-muted-foreground py-8">
                          No tagged students for this term and campus.
                        </TableCell>
                      </TableRow>
                    ) : (
                      taggedList.map((r) => (
                        <TableRow
                          key={r.id}
                          className={cn(
                            "cursor-pointer",
                            activeTagId === r.id && "bg-amber-50/80 dark:bg-amber-950/30"
                          )}
                          onClick={() => {
                            setStudentQuery(r.student_no);
                            void (async () => {
                              const wq = new URLSearchParams({
                                academicYearTermId: termId,
                                campusId,
                                studentNo: r.student_no,
                              });
                              const wRes = await fetch(
                                `${API}/api/registrar/tag-graduating-students/student?${wq}`
                              );
                              if (wRes.ok) {
                                const data = (await wRes.json()) as {
                                  profile: StudentProfile;
                                  tag: GraduatingRow | null;
                                };
                                setProfile(data.profile);
                                if (data.tag) {
                                  applyTagToForm(data.tag, {
                                    setActiveTagId,
                                    setFeeTemplate,
                                    setRemarks,
                                    setApproved,
                                    setDateEntry,
                                    setTimeEntry,
                                  });
                                } else {
                                  setActiveTagId(r.id);
                                }
                              }
                            })();
                          }}
                        >
                          <TableCell className="font-mono text-xs">{r.student_no}</TableCell>
                          <TableCell className="text-xs">{fmt(r.student_name)}</TableCell>
                          <TableCell className="text-xs">{fmt(r.program_code)}</TableCell>
                          <TableCell className="text-xs">{fmt(r.date_graduated)}</TableCell>
                          <TableCell className="text-xs">{feeLabel(r.graduation_fee_template ?? "")}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </div>
          </TabsContent>

          <TabsContent value="mass" className="flex-1 min-h-0 mt-2 data-[state=inactive]:hidden flex flex-col gap-2">
            <div className="shrink-0 rounded-xl border border-border/60 bg-muted/10 px-3 py-2 flex flex-wrap items-end gap-3">
              <div className="space-y-1 min-w-[160px]">
                <Label className="text-[10px] uppercase text-muted-foreground">College</Label>
                <select
                  className={selectClass}
                  value={massCollegeId}
                  onChange={(e) => setMassCollegeId(e.target.value)}
                >
                  {campusColleges.map((c) => (
                    <option key={c.id} value={String(c.id)}>
                      {c.college_code} — {c.college_name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1 min-w-[140px]">
                <Label className="text-[10px] uppercase text-muted-foreground">Program</Label>
                <Input
                  className="h-8 rounded-lg text-xs"
                  placeholder="Filter program…"
                  value={massProgram}
                  onChange={(e) => setMassProgram(e.target.value)}
                />
              </div>
              <div className="space-y-1 min-w-[120px]">
                <Label className="text-[10px] uppercase text-muted-foreground">Year level</Label>
                <Input
                  className="h-8 rounded-lg text-xs"
                  placeholder="[All years]"
                  value={massYearLevel}
                  onChange={(e) => setMassYearLevel(e.target.value)}
                />
              </div>
              <Button
                type="button"
                size="sm"
                className="h-8 text-xs gap-1"
                onClick={() => void loadMassCandidates()}
                disabled={loadingMass}
              >
                {loadingMass ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Filter className="h-3.5 w-3.5" />
                )}
                Filter
              </Button>
            </div>

            <div className="flex-1 min-h-0 rounded-xl border border-border/60 bg-card overflow-hidden flex flex-col">
              <ScrollArea className="flex-1 min-h-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10">
                        <Checkbox
                          checked={candidates.length > 0 && selectedMass.size === candidates.length}
                          onCheckedChange={toggleMassAll}
                        />
                      </TableHead>
                      <TableHead className="text-[10px]">Student number</TableHead>
                      <TableHead className="text-[10px]">Student name</TableHead>
                      <TableHead className="text-[10px]">College code</TableHead>
                      <TableHead className="text-[10px]">Program code</TableHead>
                      <TableHead className="text-[10px]">Major study</TableHead>
                      <TableHead className="text-[10px]">Year level</TableHead>
                      <TableHead className="text-[10px]">Curriculum total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingMass ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center text-xs py-8 text-muted-foreground">
                          <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
                          Loading candidates…
                        </TableCell>
                      </TableRow>
                    ) : candidates.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center text-xs py-8 text-muted-foreground">
                          Use Filter to load students. Run recalculate summary of grades if the list is empty.
                        </TableCell>
                      </TableRow>
                    ) : (
                      candidates.map((c) => (
                        <TableRow key={c.student_no}>
                          <TableCell>
                            <Checkbox
                              checked={selectedMass.has(c.student_no.toUpperCase())}
                              onCheckedChange={() => toggleMassRow(c.student_no)}
                            />
                          </TableCell>
                          <TableCell className="font-mono text-xs">{c.student_no}</TableCell>
                          <TableCell className="text-xs">{fmt(c.student_name)}</TableCell>
                          <TableCell className="text-xs">{fmt(c.college_code)}</TableCell>
                          <TableCell className="text-xs">{fmt(c.program_code)}</TableCell>
                          <TableCell className="text-xs">{fmt(c.major_study)}</TableCell>
                          <TableCell className="text-xs">{fmt(c.year_level)}</TableCell>
                          <TableCell className="text-xs text-right">{fmt(c.curriculum_total_load)}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </div>

            <div className="shrink-0 rounded-xl border border-border/60 bg-muted/15 px-3 py-2 flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs text-muted-foreground">
                Total record: <strong className="text-foreground">{candidates.length}</strong>
                {selectedMass.size > 0 && (
                  <span className="ml-2">· Selected: {selectedMass.size}</span>
                )}
              </span>
              <div className="flex flex-wrap gap-1.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs gap-1"
                  onClick={handleStopMass}
                  disabled={!loadingMass && !massTagging}
                >
                  <Square className="h-3.5 w-3.5 fill-current" />
                  Stop
                </Button>
                <Button
                  type="button"
                  size="sm"
                  className="h-8 text-xs gap-1"
                  onClick={() => void handleMassTag()}
                  disabled={massTagging || selectedMass.size === 0}
                >
                  {massTagging ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <ClipboardList className="h-3.5 w-3.5" />
                  )}
                  Make a list
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="shrink-0 rounded-xl border border-border/60 bg-muted/15 px-3 py-2 flex justify-end gap-1.5">
          <Button type="button" variant="ghost" size="sm" className="h-8 text-xs gap-1" onClick={() => router.back()}>
            <LogOut className="h-3.5 w-3.5" />
            Exit
          </Button>
        </div>
      </div>
    </div>
  );
}
