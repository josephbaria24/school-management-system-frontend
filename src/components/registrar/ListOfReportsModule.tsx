"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { ClipboardList, HelpCircle, Loader2, LogOut, Printer, Search } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL;

type YearTerm = { id: number; academic_year: string; term: string };
type Campus = { id: number; acronym: string; campus_name: string | null };

type ReportOption = { key: string; label: string };

type CategoryOption = {
  key: string;
  label: string;
  color: string;
  reports: ReportOption[];
};

type OptionsPayload = {
  categories: CategoryOption[];
  sort_options: ReportOption[];
  year_levels: ReportOption[];
};

type TableSection = {
  heading: string;
  columns: string[];
  rows: string[][];
};

type PreviewPayload = {
  category: string;
  category_label: string;
  report_key: string;
  report_label: string;
  term_label: string;
  campus_name: string;
  filter_summary: string;
  sections: TableSection[];
};

const CATEGORY_HEADER: Record<string, string> = {
  grade_school: "bg-sky-600 text-white hover:bg-sky-600/90",
  high_school: "bg-amber-500 text-amber-950 hover:bg-amber-500/90",
  undergraduate: "bg-emerald-600 text-white hover:bg-emerald-600/90",
  graduate_school: "bg-rose-600 text-white hover:bg-rose-600/90",
};

function fmt(v: string) {
  return v.trim() || "—";
}

function openReportPrint(data: PreviewPayload) {
  const sectionsHtml = data.sections
    .map((sec) => {
      const head = sec.columns.map((c) => `<th>${c}</th>`).join("");
      const body =
        sec.rows.length > 0
          ? sec.rows
              .map((row) => `<tr>${row.map((c) => `<td>${fmt(c)}</td>`).join("")}</tr>`)
              .join("")
          : `<tr><td colspan="${sec.columns.length || 1}" style="text-align:center;padding:8px;color:#666">No data.</td></tr>`;
      return `<h2 style="font-size:12px;margin:16px 0 6px;text-transform:uppercase">${sec.heading}</h2>
        <table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;
    })
    .join("");

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>${data.report_label}</title>
    <style>
      body{font-family:Tahoma,Arial,sans-serif;font-size:10px;margin:16px;color:#111}
      h1{font-size:14px;margin:0 0 4px;text-transform:uppercase}
      .sub{color:#444;margin-bottom:12px;font-size:11px}
      table{width:100%;border-collapse:collapse;margin-bottom:8px}
      th,td{border:1px solid #999;padding:4px 6px;vertical-align:top}
      th{background:#c6d9f1;font-size:9px;text-transform:uppercase}
      @media print{body{margin:8mm}@page{size:landscape}}
    </style></head><body>
    <h1>${fmt(data.report_label)}</h1>
    <p class="sub">${fmt(data.campus_name)} · ${fmt(data.term_label)} · ${fmt(data.category_label)} · ${fmt(data.filter_summary)}</p>
    ${sectionsHtml}
    <script>window.onload=function(){window.print()}</script>
  </body></html>`;

  const w = window.open("", "_blank", "noopener,noreferrer,width=1000,height=760");
  if (!w) {
    toast({ title: "Pop-up blocked", variant: "destructive" });
    return;
  }
  w.document.write(html);
  w.document.close();
}

const selectClass =
  "h-8 w-full min-w-0 rounded-lg border border-border/60 bg-background px-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function ListOfReportsModule() {
  const router = useRouter();

  const [terms, setTerms] = useState<YearTerm[]>([]);
  const [termId, setTermId] = useState("");
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [campusId, setCampusId] = useState("");
  const [options, setOptions] = useState<OptionsPayload | null>(null);

  const [categoryKey, setCategoryKey] = useState("graduate_school");
  const [reportKey, setReportKey] = useState("official_enrollment_list");
  const [allGroups, setAllGroups] = useState(true);
  const [byCollege, setByCollege] = useState(false);
  const [byProgram, setByProgram] = useState(false);
  const [collegeCode, setCollegeCode] = useState("");
  const [program, setProgram] = useState("");
  const [majorStudy, setMajorStudy] = useState("");
  const [yearLevel, setYearLevel] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [printing, setPrinting] = useState(false);

  const categories = options?.categories ?? [];
  const activeCategory = useMemo(
    () => categories.find((c) => c.key === categoryKey) ?? categories[0],
    [categories, categoryKey]
  );
  const reportList = activeCategory?.reports ?? [];

  useEffect(() => {
    if (!reportList.some((r) => r.key === reportKey) && reportList[0]) {
      setReportKey(reportList[0].key);
    }
  }, [reportList, reportKey]);

  useEffect(() => {
    if (!API) return;
    let cancelled = false;
    (async () => {
      try {
        const [tRes, cRes, oRes] = await Promise.all([
          fetch(`${API}/api/academic-year-terms`),
          fetch(`${API}/api/campuses`),
          fetch(`${API}/api/registrar/list-of-reports/options`),
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

  const handlePrintPreview = useCallback(async () => {
    if (!API || !termId || !campusId) {
      toast({ title: "Select academic year and campus", variant: "destructive" });
      return;
    }
    if (!allGroups && byCollege && !collegeCode.trim()) {
      toast({ title: "Enter a college code", variant: "destructive" });
      return;
    }
    if (!allGroups && byProgram && !program.trim()) {
      toast({ title: "Enter a program", variant: "destructive" });
      return;
    }

    setPrinting(true);
    try {
      const res = await fetch(`${API}/api/registrar/list-of-reports/preview`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          academicYearTermId: Number(termId),
          campusId: Number(campusId),
          category: categoryKey,
          reportKey,
          allGroups,
          byCollege: !allGroups && byCollege,
          byProgram: !allGroups && byProgram,
          collegeCode: collegeCode.trim() || undefined,
          program: program.trim() || undefined,
          majorStudy: majorStudy.trim() || undefined,
          yearLevel: yearLevel.trim() || undefined,
          sortBy,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = (await res.json()) as PreviewPayload;
      openReportPrint(data);
    } catch (e) {
      console.error(e);
      toast({
        title: "Print preview failed",
        description: e instanceof Error ? e.message : "Could not build report.",
        variant: "destructive",
      });
    } finally {
      setPrinting(false);
    }
  }, [
    termId,
    campusId,
    categoryKey,
    reportKey,
    allGroups,
    byCollege,
    byProgram,
    collegeCode,
    program,
    majorStudy,
    yearLevel,
    sortBy,
  ]);

  const selectedReportLabel =
    reportList.find((r) => r.key === reportKey)?.label ?? "Select a report";

  return (
    <div className="h-full min-h-0 bg-background flex flex-col overflow-hidden">
      <div className="shrink-0 border-b border-border/60 bg-gradient-to-r from-sky-100/80 via-muted/30 to-muted/20 px-3 py-2">
        <div className="flex items-start gap-2">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-border/60 bg-background text-muted-foreground">
            <ClipboardList className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="setup-type-page-title leading-tight">LIST OF REPORTS</h1>
            <p className="setup-type-page-desc mt-0.5 text-sky-900/85 dark:text-sky-200/80">
              Enrollment statistics and official enrollment reports by school level.
            </p>
          </div>
        </div>
      </div>

      <div className="shrink-0 border-b border-amber-200/50 dark:border-amber-900/40 bg-gradient-to-r from-amber-50/90 to-muted/30 px-3 py-2">
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1 min-w-[200px]">
            <Label className="text-[10px] uppercase text-muted-foreground">Academic year & term</Label>
            <select className={selectClass} value={termId} onChange={(e) => setTermId(e.target.value)}>
              {terms.map((t) => (
                <option key={t.id} value={String(t.id)}>
                  {t.academic_year} {t.term}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1 min-w-[180px]">
            <Label className="text-[10px] uppercase text-muted-foreground">Campus name</Label>
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
        <div className="flex-1 min-h-0 rounded-xl border border-border/60 bg-card overflow-hidden flex">
          <aside className="w-[260px] shrink-0 border-r border-border/60 bg-muted/10 flex flex-col min-h-0">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground px-2 py-2 border-b border-border/60">
              Reports
            </p>
            <ScrollArea className="flex-1 min-h-0">
              <Accordion
                type="single"
                collapsible
                value={categoryKey}
                onValueChange={(v) => {
                  if (v) {
                    setCategoryKey(v);
                    const cat = categories.find((c) => c.key === v);
                    if (cat?.reports[0]) setReportKey(cat.reports[0].key);
                  }
                }}
                className="px-1"
              >
                {categories.map((cat) => (
                  <AccordionItem key={cat.key} value={cat.key} className="border-none">
                    <AccordionTrigger
                      className={cn(
                        "rounded-md px-2 py-2 text-[11px] font-semibold hover:no-underline [&[data-state=open]]:rounded-b-none",
                        CATEGORY_HEADER[cat.key] ?? "bg-muted text-foreground"
                      )}
                    >
                      {cat.label}
                    </AccordionTrigger>
                    <AccordionContent className="pb-1 pt-0">
                      <ul className="space-y-0.5 px-1 pb-1">
                        {cat.reports.map((r) => (
                          <li key={r.key}>
                            <button
                              type="button"
                              onClick={() => {
                                setCategoryKey(cat.key);
                                setReportKey(r.key);
                              }}
                              className={cn(
                                "w-full text-left rounded-md px-2 py-1.5 text-[11px] leading-snug transition-colors",
                                categoryKey === cat.key && reportKey === r.key
                                  ? "bg-rose-100/90 text-rose-950 font-medium dark:bg-rose-950/50 dark:text-rose-100"
                                  : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                              )}
                            >
                              {r.label}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </ScrollArea>
          </aside>

          <div className="flex-1 min-h-0 flex flex-col">
            <div className="shrink-0 border-b border-border/60 px-3 py-2 bg-muted/15">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Report parameters
              </p>
              <p className="text-xs font-medium text-foreground mt-0.5">{selectedReportLabel}</p>
            </div>

            <ScrollArea className="flex-1 min-h-0">
              <div className="p-4 space-y-4 max-w-xl">
                <div className="space-y-3 rounded-lg border border-border/60 bg-muted/10 p-3">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="allGroups"
                      checked={allGroups}
                      onCheckedChange={(v) => {
                        const on = Boolean(v);
                        setAllGroups(on);
                        if (on) {
                          setByCollege(false);
                          setByProgram(false);
                        }
                      }}
                    />
                    <Label htmlFor="allGroups" className="text-xs font-medium cursor-pointer">
                      All groups
                    </Label>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="byCollege"
                        checked={byCollege}
                        disabled={allGroups}
                        onCheckedChange={(v) => {
                          setByCollege(Boolean(v));
                          if (v) setAllGroups(false);
                        }}
                      />
                      <Label htmlFor="byCollege" className="text-xs cursor-pointer">
                        By college
                      </Label>
                    </div>
                    <div className="flex gap-1">
                      <Input
                        className="h-8 text-xs"
                        disabled={allGroups || !byCollege}
                        placeholder="College code"
                        value={collegeCode}
                        onChange={(e) => setCollegeCode(e.target.value)}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 shrink-0"
                        disabled={allGroups || !byCollege}
                        onClick={() =>
                          toast({ title: "College filter", description: "Enter college code to filter." })
                        }
                      >
                        <Search className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="byProgram"
                        checked={byProgram}
                        disabled={allGroups}
                        onCheckedChange={(v) => {
                          setByProgram(Boolean(v));
                          if (v) setAllGroups(false);
                        }}
                      />
                      <Label htmlFor="byProgram" className="text-xs cursor-pointer">
                        By program
                      </Label>
                    </div>
                    <div className="flex gap-1">
                      <Input
                        className="h-8 text-xs"
                        disabled={allGroups || !byProgram}
                        placeholder="Program"
                        value={program}
                        onChange={(e) => setProgram(e.target.value)}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 shrink-0"
                        disabled={allGroups || !byProgram}
                        onClick={() =>
                          toast({ title: "Program filter", description: "Enter program name to filter." })
                        }
                      >
                        <Search className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-[10px] uppercase text-muted-foreground">Major study</Label>
                    <Input
                      className="h-8 text-xs"
                      value={majorStudy}
                      onChange={(e) => setMajorStudy(e.target.value)}
                      placeholder="Optional"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] uppercase text-muted-foreground">Year level</Label>
                    <select
                      className={selectClass}
                      value={yearLevel}
                      onChange={(e) => setYearLevel(e.target.value)}
                    >
                      {(options?.year_levels ?? [{ key: "", label: "[All year level]" }]).map((yl) => (
                        <option key={yl.key || "all"} value={yl.key}>
                          {yl.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <Label className="text-[10px] uppercase text-muted-foreground">Sorted by</Label>
                    <select className={selectClass} value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                      {(options?.sort_options ?? []).map((s) => (
                        <option key={s.key} value={s.key}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </ScrollArea>
          </div>
        </div>

        <div className="shrink-0 mt-2 rounded-xl border border-border/60 bg-muted/15 px-3 py-2 flex flex-wrap items-center justify-between gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 text-xs gap-1"
            onClick={() =>
              toast({
                title: "List of reports",
                description:
                  "Select a school level and report, set filters, then use Print preview. Data comes from student grade summary and grade encoding.",
              })
            }
          >
            <HelpCircle className="h-3.5 w-3.5" />
            Help
          </Button>
          <div className="flex flex-wrap gap-1.5">
            <Button
              type="button"
              size="sm"
              className="h-8 text-xs gap-1"
              onClick={() => void handlePrintPreview()}
              disabled={printing}
            >
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