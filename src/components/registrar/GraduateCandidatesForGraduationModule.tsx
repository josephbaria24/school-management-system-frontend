"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { Eye, GraduationCap, Loader2, LogOut, Printer } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL;

type YearTerm = { id: number; academic_year: string; term: string };
type Campus = { id: number; acronym: string; campus_name: string | null };
type CollegeRow = { id: number; campus_id?: number | null; college_code: string; college_name: string };
type ProgramRow = { id: number; college_id: number; program_code?: string | null; program_name?: string | null };

type GraduateCandidateRow = {
  ref_no: string;
  student_no: string;
  fullname: string | null;
  gender: string | null;
  college_code: string | null;
  program_code: string | null;
  date_graduated: string | null;
  honor: string | null;
  remarks: string | null;
  billing_no: string | null;
  template_used: string | null;
  validating_officer_id: string | null;
  validation_date: string | null;
  or_no: string | null;
};

type ListPayload = {
  term_label: string;
  campus_name: string;
  expand_groups: boolean;
  groups: { college_code: string; gender: string; rows: GraduateCandidateRow[] }[];
  rows: GraduateCandidateRow[];
};

function fmt(v: string | null | undefined) {
  const s = v == null ? "" : String(v).trim();
  return s || "—";
}

const selectClass =
  "h-8 w-full min-w-0 rounded-lg border border-border/60 bg-background px-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

function CandidateTable({ rows }: { rows: GraduateCandidateRow[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="text-[10px] whitespace-nowrap">Ref no.</TableHead>
          <TableHead className="text-[10px] whitespace-nowrap">Student no.</TableHead>
          <TableHead className="text-[10px] min-w-[140px]">Full name</TableHead>
          <TableHead className="text-[10px]">Gender</TableHead>
          <TableHead className="text-[10px] whitespace-nowrap">Date graduated</TableHead>
          <TableHead className="text-[10px]">Honor</TableHead>
          <TableHead className="text-[10px] min-w-[100px]">Remarks</TableHead>
          <TableHead className="text-[10px]">Billing no.</TableHead>
          <TableHead className="text-[10px]">Template used</TableHead>
          <TableHead className="text-[10px]">Validating officer</TableHead>
          <TableHead className="text-[10px] whitespace-nowrap">Validation date</TableHead>
          <TableHead className="text-[10px]">OR no.</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((r) => (
          <TableRow key={`${r.ref_no}-${r.student_no}`}>
            <TableCell className="text-xs font-mono">{fmt(r.ref_no)}</TableCell>
            <TableCell className="text-xs font-mono">{fmt(r.student_no)}</TableCell>
            <TableCell className="text-xs">{fmt(r.fullname)}</TableCell>
            <TableCell className="text-xs">{fmt(r.gender)}</TableCell>
            <TableCell className="text-xs">{fmt(r.date_graduated)}</TableCell>
            <TableCell className="text-xs">{fmt(r.honor)}</TableCell>
            <TableCell className="text-xs">{fmt(r.remarks)}</TableCell>
            <TableCell className="text-xs">{fmt(r.billing_no)}</TableCell>
            <TableCell className="text-xs">{fmt(r.template_used)}</TableCell>
            <TableCell className="text-xs">{fmt(r.validating_officer_id)}</TableCell>
            <TableCell className="text-xs">{fmt(r.validation_date)}</TableCell>
            <TableCell className="text-xs">{fmt(r.or_no)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function openPrintPreview(data: ListPayload) {
  const cols = [
    "Ref no.",
    "Student no.",
    "Full name",
    "Gender",
    "Date graduated",
    "Honor",
    "Remarks",
    "Billing no.",
    "Template",
    "Officer ID",
    "Validation date",
    "OR no.",
  ];

  const renderRows = (rows: GraduateCandidateRow[]) =>
    rows
      .map(
        (r) =>
          `<tr>
            <td>${fmt(r.ref_no)}</td>
            <td>${fmt(r.student_no)}</td>
            <td>${fmt(r.fullname)}</td>
            <td>${fmt(r.gender)}</td>
            <td>${fmt(r.date_graduated)}</td>
            <td>${fmt(r.honor)}</td>
            <td>${fmt(r.remarks)}</td>
            <td>${fmt(r.billing_no)}</td>
            <td>${fmt(r.template_used)}</td>
            <td>${fmt(r.validating_officer_id)}</td>
            <td>${fmt(r.validation_date)}</td>
            <td>${fmt(r.or_no)}</td>
          </tr>`
      )
      .join("");

  let body = "";
  if (data.expand_groups && data.groups.length) {
    body = data.groups
      .map(
        (g) => `
        <h3 style="font-size:12px;margin:16px 0 6px">College: ${fmt(g.college_code)} · Gender: ${fmt(g.gender)}</h3>
        <table><thead><tr>${cols.map((c) => `<th>${c}</th>`).join("")}</tr></thead>
        <tbody>${renderRows(g.rows)}</tbody></table>`
      )
      .join("");
  } else {
    body = `<table><thead><tr>${cols.map((c) => `<th>${c}</th>`).join("")}</tr></thead>
      <tbody>${renderRows(data.rows) || `<tr><td colspan="${cols.length}" style="text-align:center;padding:12px">No records</td></tr>`}</tbody></table>`;
  }

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Graduates and candidates</title>
    <style>
      body{font-family:Tahoma,Arial,sans-serif;font-size:10px;margin:14px;color:#111}
      h1{font-size:15px;margin:0 0 4px;text-transform:uppercase}
      .sub{color:#444;margin-bottom:12px}
      table{width:100%;border-collapse:collapse;margin-bottom:8px}
      th,td{border:1px solid #999;padding:4px 5px}
      th{background:#c6d9f1;font-size:9px}
      @media print{body{margin:8mm}@page{size:landscape}}
    </style></head><body>
    <h1>Graduates and candidates for graduation</h1>
    <p class="sub">${fmt(data.campus_name)} · ${fmt(data.term_label)}</p>
    ${body}
    <script>window.onload=function(){window.print()}</script></body></html>`;

  const w = window.open("", "_blank", "noopener,noreferrer,width=1100,height=760");
  if (!w) {
    toast({ title: "Pop-up blocked", variant: "destructive" });
    return;
  }
  w.document.write(html);
  w.document.close();
}

export function GraduateCandidatesForGraduationModule() {
  const router = useRouter();

  const [terms, setTerms] = useState<YearTerm[]>([]);
  const [termId, setTermId] = useState("");
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [campusId, setCampusId] = useState("");
  const [colleges, setColleges] = useState<CollegeRow[]>([]);
  const [programs, setPrograms] = useState<ProgramRow[]>([]);

  const [collegeFilter, setCollegeFilter] = useState("");
  const [programFilter, setProgramFilter] = useState("");
  const [expandGroups, setExpandGroups] = useState(false);

  const [data, setData] = useState<ListPayload | null>(null);
  const [loading, setLoading] = useState(false);

  const campusColleges = useMemo(() => {
    if (!campusId) return colleges;
    const cid = Number(campusId);
    return colleges.filter((c) => c.campus_id == null || Number(c.campus_id) === cid);
  }, [colleges, campusId]);

  const collegePrograms = useMemo(() => {
    const cc = collegeFilter.trim();
    if (!cc) return programs;
    const col = colleges.find((c) => c.college_code === cc);
    if (!col) return programs;
    return programs.filter((p) => p.college_id === col.id);
  }, [programs, collegeFilter, colleges]);

  useEffect(() => {
    if (!API) return;
    let cancelled = false;
    (async () => {
      try {
        const [tRes, cRes, colRes, pRes] = await Promise.all([
          fetch(`${API}/api/academic-year-terms`),
          fetch(`${API}/api/campuses`),
          fetch(`${API}/api/colleges`),
          fetch(`${API}/api/academic-programs`),
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
        if (pRes.ok) setPrograms((await pRes.json()) as ProgramRow[]);
      } catch {
        /* noop */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleView = useCallback(async () => {
    if (!API || !termId || !campusId) {
      toast({ title: "Select campus and term", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const q = new URLSearchParams({
        academicYearTermId: termId,
        campusId,
        expandGroups: String(expandGroups),
      });
      if (collegeFilter.trim()) q.set("collegeCode", collegeFilter.trim());
      if (programFilter.trim()) q.set("program", programFilter.trim());

      const res = await fetch(`${API}/api/registrar/graduate-candidates-for-graduation?${q}`);
      if (!res.ok) throw new Error(await res.text());
      const payload = (await res.json()) as ListPayload;
      setData(payload);
      if (!payload.rows.length) {
        toast({
          title: "No records",
          description: "Tag graduating students first to populate this list.",
        });
      }
    } catch (e) {
      console.error(e);
      toast({
        title: "View failed",
        description: e instanceof Error ? e.message : "Could not load list.",
        variant: "destructive",
      });
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [termId, campusId, collegeFilter, programFilter, expandGroups]);

  const totalRecords = data?.rows.length ?? 0;

  return (
    <div className="h-full min-h-0 bg-background flex flex-col overflow-hidden">
      <div className="shrink-0 border-b border-border/60 bg-gradient-to-r from-sky-100/80 via-muted/30 to-muted/20 px-3 py-2">
        <div className="flex items-start gap-2">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-border/60 bg-background text-muted-foreground">
            <GraduationCap className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="setup-type-page-title leading-tight">GRADUATES AND CANDIDATES FOR GRADUATION</h1>
            <p className="setup-type-page-desc mt-0.5 text-sky-900/85 dark:text-sky-200/80">
              Allows user to view all the students graduated and candidate for graduation.
            </p>
          </div>
        </div>
      </div>

      <div className="shrink-0 border-b border-amber-200/50 dark:border-amber-900/40 bg-gradient-to-r from-amber-50/90 to-muted/30 px-3 py-2">
        <div className="flex flex-wrap items-end gap-3">
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
          <div className="space-y-1 min-w-[200px]">
            <Label className="text-[10px] uppercase text-muted-foreground">AY term</Label>
            <select className={selectClass} value={termId} onChange={(e) => setTermId(e.target.value)}>
              {terms.map((t) => (
                <option key={t.id} value={String(t.id)}>
                  {t.academic_year} {t.term}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1 min-w-[160px]">
            <Label className="text-[10px] uppercase text-muted-foreground">College</Label>
            <select className={selectClass} value={collegeFilter} onChange={(e) => setCollegeFilter(e.target.value)}>
              <option value="">[All]</option>
              {campusColleges.map((c) => (
                <option key={c.id} value={c.college_code}>
                  {c.college_code} — {c.college_name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1 min-w-[180px]">
            <Label className="text-[10px] uppercase text-muted-foreground">Program</Label>
            <select className={selectClass} value={programFilter} onChange={(e) => setProgramFilter(e.target.value)}>
              <option value="">[All]</option>
              {collegePrograms.map((p) => (
                <option key={p.id} value={p.program_code ?? String(p.id)}>
                  {[p.program_code, p.program_name].filter(Boolean).join(" — ") || `Program #${p.id}`}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2 pb-0.5">
            <Checkbox
              id="expand-groups"
              checked={expandGroups}
              onCheckedChange={(v) => setExpandGroups(v === true)}
            />
            <Label htmlFor="expand-groups" className="text-xs cursor-pointer whitespace-nowrap">
              Expand groups
            </Label>
          </div>
          <Button type="button" size="sm" className="h-8 text-xs gap-1" onClick={() => void handleView()} disabled={loading}>
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Eye className="h-3.5 w-3.5" />}
            View
          </Button>
        </div>
      </div>

      <div className="flex-1 min-h-0 p-2 flex flex-col gap-2">
        <div className="flex-1 min-h-0 rounded-xl border border-border/60 bg-card overflow-hidden flex flex-col">
          <div className="shrink-0 px-3 py-2 border-b border-border/60 flex items-center justify-between gap-2">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Graduates / candidates
            </p>
            <span className="text-xs text-muted-foreground">
              Total record: <strong className="text-foreground">{totalRecords}</strong>
            </span>
          </div>
          <ScrollArea className="flex-1 min-h-0">
            {loading ? (
              <div className="flex items-center justify-center py-16 text-sm text-muted-foreground gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading…
              </div>
            ) : !data ? (
              <p className="text-sm text-muted-foreground text-center py-16">
                Select filters and click View to load records.
              </p>
            ) : data.expand_groups && data.groups.length > 0 ? (
              <div className="p-2 space-y-4">
                {data.groups.map((g) => (
                  <div key={`${g.college_code}-${g.gender}`}>
                    <p className="text-xs font-semibold text-muted-foreground mb-1 px-1">
                      College: {fmt(g.college_code)} · Gender: {fmt(g.gender)}
                    </p>
                    <CandidateTable rows={g.rows} />
                  </div>
                ))}
              </div>
            ) : data.rows.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-16">
                No tagged graduating students for this campus and term.
              </p>
            ) : (
              <div className="p-1">
                <CandidateTable rows={data.rows} />
              </div>
            )}
          </ScrollArea>
        </div>

        <div className="shrink-0 rounded-xl border border-border/60 bg-muted/15 px-3 py-2 flex flex-wrap items-center justify-end gap-1.5">
          <Button
            type="button"
            size="sm"
            className="h-8 text-xs gap-1"
            onClick={() => data && openPrintPreview(data)}
            disabled={!data?.rows.length}
          >
            <Printer className="h-3.5 w-3.5" />
            Print
          </Button>
          <Button type="button" variant="ghost" size="sm" className="h-8 text-xs gap-1" onClick={() => router.back()}>
            <LogOut className="h-3.5 w-3.5" />
            Exit
          </Button>
        </div>
      </div>
    </div>
  );
}
