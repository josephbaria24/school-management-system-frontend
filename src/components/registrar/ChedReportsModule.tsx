"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Building2, Loader2, LogOut, Printer, Settings } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL;

type YearTerm = { id: number; academic_year: string; term: string };
type Campus = { id: number; acronym: string; campus_name: string | null };

type ReportOption = { key: string; label: string };

type OptionsPayload = {
  levels: ReportOption[];
  college_reports: ReportOption[];
  masteral_reports: ReportOption[];
};

type TableSection = {
  heading: string;
  columns: string[];
  rows: string[][];
};

type PreviewPayload = {
  report_key: string;
  report_label: string;
  level: string;
  level_label: string;
  term_label: string;
  campus_name: string;
  sections: TableSection[];
};

function fmt(v: string) {
  return v.trim() || "—";
}

function openChedPrint(data: PreviewPayload) {
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

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>CHED report</title>
    <style>
      body{font-family:Tahoma,Arial,sans-serif;font-size:10px;margin:16px;color:#111}
      h1{font-size:14px;margin:0 0 4px;text-transform:uppercase}
      .sub{color:#444;margin-bottom:12px;font-size:11px}
      table{width:100%;border-collapse:collapse;margin-bottom:8px}
      th,td{border:1px solid #999;padding:4px 6px;vertical-align:top}
      th{background:#c6d9f1;font-size:9px;text-transform:uppercase}
      @media print{body{margin:8mm}@page{size:landscape}}
    </style></head><body>
    <h1>CHED report — ${fmt(data.report_label)}</h1>
    <p class="sub">${fmt(data.campus_name)} · ${fmt(data.term_label)} · ${fmt(data.level_label)}</p>
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

export function ChedReportsModule() {
  const router = useRouter();

  const [terms, setTerms] = useState<YearTerm[]>([]);
  const [termId, setTermId] = useState("");
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [campusId, setCampusId] = useState("");
  const [options, setOptions] = useState<OptionsPayload | null>(null);

  const [levelTab, setLevelTab] = useState("college");
  const [reportKey, setReportKey] = useState("institution_profile");
  const [printing, setPrinting] = useState(false);

  const reportList = useMemo(() => {
    if (levelTab === "masteral") return options?.masteral_reports ?? [];
    return options?.college_reports ?? [];
  }, [levelTab, options]);

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
          fetch(`${API}/api/registrar/ched-reports/options`),
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
    setPrinting(true);
    try {
      const res = await fetch(`${API}/api/registrar/ched-reports/preview`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          academicYearTermId: Number(termId),
          campusId: Number(campusId),
          level: levelTab,
          reportKey,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = (await res.json()) as PreviewPayload;
      openChedPrint(data);
    } catch (e) {
      console.error(e);
      toast({
        title: "Print preview failed",
        description: e instanceof Error ? e.message : "Could not build CHED report.",
        variant: "destructive",
      });
    } finally {
      setPrinting(false);
    }
  }, [termId, campusId, levelTab, reportKey]);

  return (
    <div className="h-full min-h-0 bg-background flex flex-col overflow-hidden">
      <div className="shrink-0 border-b border-border/60 bg-gradient-to-r from-sky-100/80 via-muted/30 to-muted/20 px-3 py-2">
        <div className="flex items-start gap-2">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-border/60 bg-background text-muted-foreground">
            <Building2 className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="setup-type-page-title leading-tight">CHED REPORTS</h1>
            <p className="setup-type-page-desc mt-0.5 text-sky-900/85 dark:text-sky-200/80">
              Allows you to print report of Commission on Higher Education.
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
        <Tabs
          value={levelTab}
          onValueChange={(v) => {
            setLevelTab(v);
            const list = v === "masteral" ? options?.masteral_reports : options?.college_reports;
            if (list?.[0]) {
              setReportKey(list[0].key);
            } else if (v === "masteral") {
              setReportKey("enrollment_list");
            }
          }}
          className="flex-1 min-h-0 flex flex-col"
        >
          <TabsList className="w-fit shrink-0 bg-muted/50 p-1 h-9 rounded-xl">
            <TabsTrigger value="college" className="text-xs h-7 px-4 rounded-lg">
              College
            </TabsTrigger>
            <TabsTrigger value="masteral" className="text-xs h-7 px-4 rounded-lg">
              Masteral
            </TabsTrigger>
          </TabsList>

          <TabsContent value={levelTab} className="flex-1 min-h-0 mt-2 data-[state=inactive]:hidden">
            <div
              className={cn(
                "flex-1 min-h-0 h-full rounded-xl border overflow-hidden flex",
                levelTab === "masteral"
                  ? "bg-amber-50/50 border-amber-200/60 dark:bg-amber-950/25 dark:border-amber-900/50"
                  : "bg-card border-border/60"
              )}
            >
              <aside className="w-[280px] shrink-0 border-r border-border/60 bg-muted/10 flex flex-col min-h-0">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground px-2 py-2 border-b border-border/60">
                  Report list
                </p>
                <ScrollArea className="flex-1 min-h-0">
                  <ul className="p-1 space-y-0.5">
                    {reportList.map((r) => (
                      <li key={r.key}>
                        <button
                          type="button"
                          onClick={() => setReportKey(r.key)}
                          className={cn(
                            "w-full text-left rounded-md px-2 py-2 text-[11px] leading-snug transition-colors",
                            reportKey === r.key
                              ? "bg-amber-100/90 text-amber-950 font-medium dark:bg-amber-950/50 dark:text-amber-100"
                              : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                          )}
                        >
                          {r.label}
                        </button>
                      </li>
                    ))}
                  </ul>
                </ScrollArea>
              </aside>
              <div className="flex-1 min-h-0 flex items-center justify-center p-6 text-center">
                <div className="max-w-sm space-y-2">
                  <p className="text-sm font-medium text-foreground">
                    {reportList.find((r) => r.key === reportKey)?.label ?? "Select a report"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Choose a report from the list, then use Print preview to generate the CHED report for the
                    selected campus and term. Run recalculate summary of grades if enrollment lists are empty.
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="shrink-0 rounded-xl border border-border/60 bg-muted/15 px-3 py-2 flex flex-wrap items-center justify-between gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 text-xs gap-1"
            onClick={() =>
              toast({
                title: "Report settings",
                description: "CHED reports use the default layout for the selected report type.",
              })
            }
          >
            <Settings className="h-3.5 w-3.5" />
            Settings
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
