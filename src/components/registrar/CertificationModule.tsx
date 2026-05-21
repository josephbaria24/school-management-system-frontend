"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
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
import { Award, Loader2, LogOut, Printer, Save, Search, Settings } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL;

type YearTerm = { id: number; academic_year: string; term: string };
type Campus = { id: number; acronym: string; campus_name: string | null };

type StudentProfile = {
  student_no: string;
  status: string;
  last_name: string;
  first_name: string;
  middle_name: string;
  ext_name: string;
  gender: string;
  age: string;
  college: string;
  year_level: string;
  academic_program: string;
  major_study: string;
  graduate_remarks: string;
  so_number: string;
  res_number: string;
  date_graduated: string;
};

type TermOption = { academic_year_term_id: number; label: string };

type SignatoryRow = {
  id: number;
  signatory_name: string;
  signatory_title: string;
  sort_order: number;
};

type PrintHistoryRow = {
  id: number;
  certificate_type: string;
  or_no: string | null;
  issued_to: string | null;
  issued_on: string | null;
  purpose_key: string | null;
  printed_at: string | null;
  final_copy: boolean;
};

type PreviewPayload = {
  certificate_label: string;
  student: StudentProfile;
  selected_terms: string[];
  purpose_label: string;
  or_no: string;
  issued_to: string;
  issued_on: string;
  signatories: SignatoryRow[];
  grade_lines: Array<{
    term_label: string;
    course_code: string | null;
    course_title: string | null;
    unit: string | null;
    final: string | null;
  }>;
};

type OptionsPayload = {
  certificate_types: { key: string; label: string }[];
  purpose_options: { key: string; label: string }[];
};

function fmt(v: string | null | undefined) {
  const s = v == null ? "" : String(v).trim();
  return s || "—";
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

const selectClass =
  "h-8 w-full min-w-0 rounded-lg border border-border/60 bg-background px-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

const readOnlyClass =
  "h-8 rounded-lg border border-border/60 bg-muted/30 px-2 text-xs read-only:text-foreground";

function openCertPrint(data: PreviewPayload, finalCopy: boolean) {
  const name = [data.student.last_name, data.student.first_name, data.student.middle_name]
    .filter(Boolean)
    .join(", ");
  const gradeRows =
    data.grade_lines.length > 0
      ? data.grade_lines
          .map(
            (g) =>
              `<tr><td>${fmt(g.term_label)}</td><td>${fmt(g.course_code)}</td><td>${fmt(g.course_title)}</td><td style="text-align:right">${fmt(g.unit)}</td><td style="text-align:center">${fmt(g.final)}</td></tr>`
          )
          .join("")
      : `<tr><td colspan="5" style="text-align:center;padding:8px;color:#666">No grade lines for selected terms.</td></tr>`;

  const sigs = data.signatories
    .map(
      (s) =>
        `<p style="margin-top:32px;text-align:center"><strong>${fmt(s.signatory_name)}</strong><br/>${fmt(s.signatory_title)}</p>`
    )
    .join("");

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Certification</title>
    <style>body{font-family:Times New Roman,serif;font-size:12pt;margin:24px;color:#111}
    h1{font-size:14pt;text-align:center;text-transform:uppercase;margin:0 0 16px}
    .meta{font-size:11pt;margin-bottom:12px} table{width:100%;border-collapse:collapse;margin:12px 0}
    th,td{border:1px solid #333;padding:4px 6px;font-size:10pt} th{background:#eee}
    .final{position:fixed;top:8px;right:8px;font-size:9pt;color:#c00;font-weight:bold}
    </style></head><body>
    ${finalCopy ? '<div class="final">FINAL COPY</div>' : ""}
    <h1>Certification — ${fmt(data.certificate_label)}</h1>
    <p class="meta">This is to certify that <strong>${fmt(name)}</strong> (${fmt(data.student.student_no)}), ${fmt(data.student.college)}, ${fmt(data.student.academic_program)}, is/was enrolled as indicated below.</p>
    <p class="meta"><strong>Purpose:</strong> ${fmt(data.purpose_label)} · <strong>OR #:</strong> ${fmt(data.or_no)} · <strong>Issued to:</strong> ${fmt(data.issued_to)} · <strong>Issued on:</strong> ${fmt(data.issued_on)}</p>
    <p class="meta"><strong>Terms:</strong> ${data.selected_terms.map(fmt).join("; ") || "—"}</p>
    <table><thead><tr><th>Term</th><th>Code</th><th>Title</th><th>Units</th><th>Grade</th></tr></thead><tbody>${gradeRows}</tbody></table>
    ${sigs}
    <script>window.onload=function(){window.print()}</script></body></html>`;

  const w = window.open("", "_blank", "noopener,noreferrer,width=800,height=900");
  if (!w) {
    toast({ title: "Pop-up blocked", variant: "destructive" });
    return;
  }
  w.document.write(html);
  w.document.close();
}

export function CertificationModule() {
  const router = useRouter();

  const [terms, setTerms] = useState<YearTerm[]>([]);
  const [termId, setTermId] = useState("");
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [campusId, setCampusId] = useState("");
  const [options, setOptions] = useState<OptionsPayload | null>(null);

  const [studentQuery, setStudentQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [termOptions, setTermOptions] = useState<TermOption[]>([]);
  const [selectedTermIds, setSelectedTermIds] = useState<Set<number>>(new Set());

  const [certType, setCertType] = useState("enrolment");
  const [configTab, setConfigTab] = useState("parameters");

  const [includeCredited, setIncludeCredited] = useState(true);
  const [includeSummer, setIncludeSummer] = useState(false);
  const [includeOtherSchool, setIncludeOtherSchool] = useState(false);

  const [orNo, setOrNo] = useState("");
  const [issuedTo, setIssuedTo] = useState("");
  const [issuedOn, setIssuedOn] = useState(today);
  const [dateRequest, setDateRequest] = useState(today);
  const [dateRelease, setDateRelease] = useState(today);
  const [purposeKey, setPurposeKey] = useState("employment");
  const [purposeRemarks, setPurposeRemarks] = useState("");
  const [finalCopy, setFinalCopy] = useState(false);

  const [signatories, setSignatories] = useState<SignatoryRow[]>([]);
  const [history, setHistory] = useState<PrintHistoryRow[]>([]);
  const [printing, setPrinting] = useState(false);

  useEffect(() => {
    if (!API) return;
    let cancelled = false;
    (async () => {
      try {
        const [tRes, cRes, oRes] = await Promise.all([
          fetch(`${API}/api/academic-year-terms`),
          fetch(`${API}/api/campuses`),
          fetch(`${API}/api/registrar/certification/options`),
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
        if (oRes.ok) setOptions((await oRes.json()) as OptionsPayload);
      } catch {
        /* noop */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const loadSignatories = useCallback(async (type: string) => {
    if (!API) return;
    try {
      const q = new URLSearchParams({ certificateType: type });
      const res = await fetch(`${API}/api/registrar/certification/signatories?${q}`);
      if (res.ok) setSignatories((await res.json()) as SignatoryRow[]);
    } catch {
      /* noop */
    }
  }, []);

  useEffect(() => {
    void loadSignatories(certType);
  }, [certType, loadSignatories]);

  const loadHistory = useCallback(async (studentNo: string) => {
    if (!API || !studentNo.trim()) return;
    try {
      const q = new URLSearchParams({ studentNo });
      const res = await fetch(`${API}/api/registrar/certification/print-history?${q}`);
      if (res.ok) setHistory((await res.json()) as PrintHistoryRow[]);
    } catch {
      setHistory([]);
    }
  }, []);

  const runSearch = useCallback(async () => {
    const q = studentQuery.trim();
    if (!API || !termId || !campusId || !q) return;
    setSearching(true);
    try {
      const params = new URLSearchParams({ academicYearTermId: termId, campusId, q });
      const res = await fetch(`${API}/api/registrar/certification/students?${params}`);
      if (!res.ok) throw new Error(await res.text());
      const hits = (await res.json()) as { student_no: string }[];
      if (!hits.length) {
        toast({ title: "No student found", variant: "destructive" });
        return;
      }
      const sn = hits[0].student_no;
      const wq = new URLSearchParams({ academicYearTermId: termId, campusId, studentNo: sn });
      const wRes = await fetch(`${API}/api/registrar/certification/student?${wq}`);
      if (!wRes.ok) throw new Error(await wRes.text());
      const data = (await wRes.json()) as { profile: StudentProfile; terms: TermOption[] };
      setProfile(data.profile);
      setTermOptions(data.terms);
      setSelectedTermIds(new Set(data.terms.map((t) => t.academic_year_term_id)));
      setIssuedTo(data.profile.student_no);
      setStudentQuery(sn);
      void loadHistory(sn);
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
  }, [termId, campusId, studentQuery, loadHistory]);

  const clearStudent = () => {
    setStudentQuery("");
    setProfile(null);
    setTermOptions([]);
    setSelectedTermIds(new Set());
    setHistory([]);
  };

  const toggleTerm = (id: number) => {
    setSelectedTermIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAllTerms = (all: boolean) => {
    if (all) setSelectedTermIds(new Set(termOptions.map((t) => t.academic_year_term_id)));
    else setSelectedTermIds(new Set());
  };

  const buildBody = () => ({
    academicYearTermId: Number(termId),
    campusId: Number(campusId),
    studentNo: profile?.student_no ?? "",
    certificateType: certType,
    termIds: [...selectedTermIds],
    orNo,
    issuedTo,
    issuedOn,
    dateRequest,
    dateRelease,
    purposeKey,
    purposeRemarks,
    includeCreditedCourses: includeCredited,
    includeSummerCgpa: includeSummer,
    includeOtherSchoolGrades: includeOtherSchool,
    finalCopy,
  });

  const handlePrint = useCallback(async () => {
    if (!API || !profile?.student_no) {
      toast({ title: "Find a student first", variant: "destructive" });
      return;
    }
    setPrinting(true);
    try {
      const res = await fetch(`${API}/api/registrar/certification/print`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildBody()),
      });
      if (!res.ok) throw new Error(await res.text());
      const { preview } = (await res.json()) as { preview: PreviewPayload };
      openCertPrint(preview, finalCopy);
      void loadHistory(profile.student_no);
    } catch (e) {
      console.error(e);
      toast({
        title: "Print failed",
        description: e instanceof Error ? e.message : "Could not print certification.",
        variant: "destructive",
      });
    } finally {
      setPrinting(false);
    }
  }, [profile, buildBody, finalCopy, loadHistory]);

  const saveSignatories = async () => {
    if (!API) return;
    try {
      const res = await fetch(`${API}/api/registrar/certification/signatories`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          certificateType: certType,
          rows: signatories.map((s, i) => ({
            signatory_name: s.signatory_name,
            signatory_title: s.signatory_title,
            sort_order: i,
          })),
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      setSignatories((await res.json()) as SignatoryRow[]);
      toast({ title: "Signatories saved" });
    } catch (e) {
      toast({
        title: "Save failed",
        description: e instanceof Error ? e.message : "Could not save signatories.",
        variant: "destructive",
      });
    }
  };

  const certTypes = options?.certificate_types ?? [{ key: "enrolment", label: "Enrolment" }];
  const purposes = options?.purpose_options ?? [];

  return (
    <div className="h-full min-h-0 bg-background flex flex-col overflow-hidden">
      <div className="shrink-0 border-b border-border/60 bg-gradient-to-r from-sky-100/80 via-muted/30 to-muted/20 px-3 py-2">
        <div className="flex items-start gap-2">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-border/60 bg-background text-muted-foreground">
            <Award className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="setup-type-page-title leading-tight">CERTIFICATION MODULE</h1>
            <p className="setup-type-page-desc mt-0.5 text-sky-900/85 dark:text-sky-200/80">
              Use this module to create student certification.
            </p>
          </div>
        </div>
      </div>

      <div className="shrink-0 border-b border-amber-200/50 dark:border-amber-900/40 bg-gradient-to-r from-amber-50/90 to-muted/30 px-3 py-2 space-y-2">
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1 min-w-[160px]">
            <Label className="text-[10px] uppercase text-muted-foreground">Campus</Label>
            <select className={selectClass} value={campusId} onChange={(e) => setCampusId(e.target.value)}>
              {campuses.map((c) => (
                <option key={c.id} value={String(c.id)}>
                  {[c.acronym, c.campus_name].filter(Boolean).join(" — ")}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1 min-w-[180px]">
            <Label className="text-[10px] uppercase text-muted-foreground">Default term (search)</Label>
            <select className={selectClass} value={termId} onChange={(e) => setTermId(e.target.value)}>
              {terms.map((t) => (
                <option key={t.id} value={String(t.id)}>
                  {t.academic_year} {t.term}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1 flex-1 min-w-[200px]">
            <Label className="text-[10px] uppercase text-muted-foreground">Find student</Label>
            <div className="flex gap-1">
              <Input
                className="h-8 flex-1 rounded-lg text-xs font-mono"
                placeholder="Student no."
                value={studentQuery}
                onChange={(e) => setStudentQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && void runSearch()}
              />
              <Button type="button" size="sm" variant="secondary" className="h-8 text-xs" onClick={() => void runSearch()} disabled={searching}>
                {searching ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
                Search
              </Button>
              <Button type="button" size="sm" variant="outline" className="h-8 text-xs" onClick={clearStudent}>
                Clear
              </Button>
            </div>
          </div>
        </div>

        {profile && (
          <div className="rounded-lg border border-border/60 bg-card/80 p-2 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2 text-xs">
            <div><span className="text-muted-foreground">Student no.</span><p className="font-mono font-semibold">{profile.student_no}</p></div>
            <div><span className="text-muted-foreground">Status</span><p>{fmt(profile.status)}</p></div>
            <div><span className="text-muted-foreground">Name</span><p>{fmt(profile.last_name)}, {fmt(profile.first_name)}</p></div>
            <div><span className="text-muted-foreground">College</span><p>{fmt(profile.college)}</p></div>
            <div><span className="text-muted-foreground">Program</span><p>{fmt(profile.academic_program)}</p></div>
            <div><span className="text-muted-foreground">Year level</span><p>{fmt(profile.year_level)}</p></div>
            <div className="col-span-2 sm:col-span-4 lg:col-span-6 grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 border-t border-border/40">
              <div><Label className="text-[10px]">Graduate remarks</Label><Input className={readOnlyClass} readOnly value={profile.graduate_remarks} /></div>
              <div><Label className="text-[10px]">S.O. #</Label><Input className="h-8 text-xs" value={profile.so_number} onChange={(e) => setProfile({ ...profile, so_number: e.target.value })} /></div>
              <div><Label className="text-[10px]">Date graduated</Label><Input className={readOnlyClass} readOnly value={profile.date_graduated} /></div>
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 min-h-0 p-2 flex flex-col gap-2">
        <div className="flex-1 min-h-0 rounded-xl border border-border/60 bg-card overflow-hidden flex min-h-0">
          <aside className="w-[150px] shrink-0 border-r border-border/60 bg-muted/15 flex flex-col">
            <p className="text-[10px] font-semibold uppercase px-2 py-2 text-muted-foreground">Certificate for</p>
            <ScrollArea className="flex-1">
              <ul className="p-1 space-y-0.5">
                {certTypes.map((c) => (
                  <li key={c.key}>
                    <button
                      type="button"
                      onClick={() => setCertType(c.key)}
                      className={cn(
                        "w-full text-left rounded-md px-2 py-1.5 text-[11px]",
                        certType === c.key
                          ? "bg-amber-100/90 text-amber-950 font-medium dark:bg-amber-950/50"
                          : "text-muted-foreground hover:bg-muted/60"
                      )}
                    >
                      {c.label}
                    </button>
                  </li>
                ))}
              </ul>
            </ScrollArea>
          </aside>

          <div className="flex-1 min-h-0 flex flex-col">
            <Tabs value={configTab} onValueChange={setConfigTab} className="flex-1 min-h-0 flex flex-col">
              <TabsList className="shrink-0 w-fit m-2 h-8 bg-muted/50 p-0.5">
                <TabsTrigger value="parameters" className="text-xs h-7 px-3">Parameters</TabsTrigger>
                <TabsTrigger value="signatories" className="text-xs h-7 px-3">Signatories</TabsTrigger>
                <TabsTrigger value="history" className="text-xs h-7 px-3">Print history</TabsTrigger>
              </TabsList>

              <TabsContent value="parameters" className="flex-1 min-h-0 mt-0 data-[state=inactive]:hidden">
                <ScrollArea className="h-full max-h-[calc(100vh-320px)]">
                  <div className="p-3 grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="rounded-lg border border-border/60 p-3 space-y-2">
                      <p className="text-[10px] font-semibold uppercase text-muted-foreground">Select academic year/term</p>
                      <div className="flex gap-1">
                        <Button type="button" size="sm" variant="outline" className="h-7 text-xs" onClick={() => selectAllTerms(true)}>All</Button>
                        <Button type="button" size="sm" variant="outline" className="h-7 text-xs" onClick={() => selectAllTerms(false)}>None</Button>
                      </div>
                      <div className="max-h-40 overflow-y-auto border border-border/60 rounded-lg">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-8" />
                              <TableHead className="text-[10px]">Academic year/term</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {termOptions.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={2} className="text-xs text-center text-muted-foreground py-4">
                                  Load a student to list terms.
                                </TableCell>
                              </TableRow>
                            ) : (
                              termOptions.map((t) => (
                                <TableRow key={t.academic_year_term_id}>
                                  <TableCell>
                                    <Checkbox
                                      checked={selectedTermIds.has(t.academic_year_term_id)}
                                      onCheckedChange={() => toggleTerm(t.academic_year_term_id)}
                                    />
                                  </TableCell>
                                  <TableCell className="text-xs">{t.label}</TableCell>
                                </TableRow>
                              ))
                            )}
                          </TableBody>
                        </Table>
                      </div>
                      <div className="space-y-1.5 pt-1">
                        <div className="flex items-center gap-2">
                          <Checkbox id="inc-cred" checked={includeCredited} onCheckedChange={(v) => setIncludeCredited(v === true)} />
                          <Label htmlFor="inc-cred" className="text-xs cursor-pointer">Include credited courses</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <Checkbox id="inc-sum" checked={includeSummer} onCheckedChange={(v) => setIncludeSummer(v === true)} />
                          <Label htmlFor="inc-sum" className="text-xs cursor-pointer">Include summer in CGPA</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <Checkbox id="inc-oth" checked={includeOtherSchool} onCheckedChange={(v) => setIncludeOtherSchool(v === true)} />
                          <Label htmlFor="inc-oth" className="text-xs cursor-pointer">Include grades from other schools</Label>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-lg border border-border/60 p-3 space-y-2">
                      <p className="text-[10px] font-semibold uppercase text-muted-foreground">General information</p>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label className="text-[10px]">OR #</Label>
                          <Input className="h-8 text-xs" value={orNo} onChange={(e) => setOrNo(e.target.value)} />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px]">Issued to</Label>
                          <Input className="h-8 text-xs" value={issuedTo} onChange={(e) => setIssuedTo(e.target.value)} />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px]">Issued on</Label>
                          <Input type="date" className="h-8 text-xs" value={issuedOn} onChange={(e) => setIssuedOn(e.target.value)} />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px]">Date request</Label>
                          <Input type="date" className="h-8 text-xs" value={dateRequest} onChange={(e) => setDateRequest(e.target.value)} />
                        </div>
                        <div className="space-y-1 col-span-2">
                          <Label className="text-[10px]">Date release</Label>
                          <Input type="date" className="h-8 text-xs" value={dateRelease} onChange={(e) => setDateRelease(e.target.value)} />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px]">Purpose</Label>
                        <RadioGroup value={purposeKey} onValueChange={setPurposeKey} className="space-y-1">
                          {purposes.map((p) => (
                            <div key={p.key} className="flex items-center gap-2">
                              <RadioGroupItem value={p.key} id={`purpose-${p.key}`} />
                              <Label htmlFor={`purpose-${p.key}`} className="text-xs cursor-pointer">{p.label}</Label>
                            </div>
                          ))}
                        </RadioGroup>
                        {purposeKey === "other" && (
                          <Textarea className="mt-2 text-xs min-h-[60px]" value={purposeRemarks} onChange={(e) => setPurposeRemarks(e.target.value)} placeholder="Other remarks…" />
                        )}
                      </div>
                    </div>
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="signatories" className="flex-1 min-h-0 mt-0 p-3 data-[state=inactive]:hidden">
                <div className="space-y-2 max-w-lg">
                  {signatories.map((s, i) => (
                    <div key={s.id || i} className="grid grid-cols-2 gap-2">
                      <Input
                        className="h-8 text-xs"
                        placeholder="Name"
                        value={s.signatory_name}
                        onChange={(e) =>
                          setSignatories((prev) =>
                            prev.map((x, j) => (j === i ? { ...x, signatory_name: e.target.value } : x))
                          )
                        }
                      />
                      <Input
                        className="h-8 text-xs"
                        placeholder="Title"
                        value={s.signatory_title}
                        onChange={(e) =>
                          setSignatories((prev) =>
                            prev.map((x, j) => (j === i ? { ...x, signatory_title: e.target.value } : x))
                          )
                        }
                      />
                    </div>
                  ))}
                  <div className="flex gap-1">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-8 text-xs"
                      onClick={() =>
                        setSignatories((prev) => [
                          ...prev,
                          { id: 0, signatory_name: "", signatory_title: "", sort_order: prev.length },
                        ])
                      }
                    >
                      Add signatory
                    </Button>
                    <Button type="button" size="sm" className="h-8 text-xs gap-1" onClick={() => void saveSignatories()}>
                      <Save className="h-3.5 w-3.5" />
                      Save
                    </Button>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="history" className="flex-1 min-h-0 mt-0 data-[state=inactive]:hidden">
                <ScrollArea className="h-full max-h-[calc(100vh-320px)] p-2">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-[10px]">Type</TableHead>
                        <TableHead className="text-[10px]">OR #</TableHead>
                        <TableHead className="text-[10px]">Issued to</TableHead>
                        <TableHead className="text-[10px]">Printed</TableHead>
                        <TableHead className="text-[10px]">Final</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {history.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-xs text-center text-muted-foreground py-6">
                            No print history for this student.
                          </TableCell>
                        </TableRow>
                      ) : (
                        history.map((h) => (
                          <TableRow key={h.id}>
                            <TableCell className="text-xs">{h.certificate_type}</TableCell>
                            <TableCell className="text-xs">{fmt(h.or_no)}</TableCell>
                            <TableCell className="text-xs">{fmt(h.issued_to)}</TableCell>
                            <TableCell className="text-xs">{fmt(h.printed_at?.slice(0, 16))}</TableCell>
                            <TableCell className="text-xs">{h.final_copy ? "Yes" : "No"}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        <div className="shrink-0 rounded-xl border border-border/60 bg-muted/15 px-3 py-2 flex flex-wrap items-center justify-between gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 text-xs gap-1"
            onClick={() => toast({ title: "Layout settings", description: "Certificate layout uses the default template." })}
          >
            <Settings className="h-3.5 w-3.5" />
            Layout settings
          </Button>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2">
              <Checkbox id="final-copy" checked={finalCopy} onCheckedChange={(v) => setFinalCopy(v === true)} />
              <Label htmlFor="final-copy" className="text-xs cursor-pointer whitespace-nowrap">
                Print preview as final copy
              </Label>
            </div>
            <Button type="button" size="sm" className="h-8 text-xs gap-1" onClick={() => void handlePrint()} disabled={printing || !profile}>
              {printing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Printer className="h-3.5 w-3.5" />}
              Print preview
            </Button>
            <Button type="button" variant="ghost" size="sm" className="h-8 text-xs gap-1" onClick={() => router.back()}>
              <LogOut className="h-3.5 w-3.5" />
              Exit
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
