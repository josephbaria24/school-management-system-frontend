"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
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
import { FolderOpen, Loader2, RefreshCw } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL;

const CAMPUSES = ["PSU Narra", "Main Campus", "Extension campus"] as const;

const VIEW_OPTIONS = [
  { value: "all", label: "- All Available Grade Sheets -" },
  { value: "available", label: "Available only" },
] as const;

type YearTerm = { id: number; academic_year: string; term: string };

type GradeSheetRow = {
  id: number;
  academic_year_term_id: number;
  campus: string | null;
  subject_code: string | null;
  subject_title: string | null;
  section: string | null;
  identifier: string | null;
  sheet_status: string | null;
  sort_order: number;
  notes: string | null;
};

const tableCols = [
  "ID",
  "CAMPUS",
  "SUBJ. CODE",
  "SUBJECT TITLE",
  "SECTION",
  "IDENTIFIER",
  "STATUS",
  "NOTES",
] as const;

type GroupBy = "none" | "subject_code" | "section" | "sheet_status";

function fmt(v: string | null | undefined) {
  return v ?? "—";
}

export function GradeSheetInventoryModule() {
  const [terms, setTerms] = useState<YearTerm[]>([]);
  const [termId, setTermId] = useState("");
  const [campus, setCampus] = useState<string>(CAMPUSES[0]);
  const [view, setView] = useState<string>(VIEW_OPTIONS[0].value);
  const [subjectFilter, setSubjectFilter] = useState("");
  const [sectionFilter, setSectionFilter] = useState("");
  const [rows, setRows] = useState<GradeSheetRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [groupBy, setGroupBy] = useState<GroupBy>("none");

  const loadInventory = useCallback(async () => {
    if (!API || !termId || !campus.trim()) return;
    setLoading(true);
    try {
      const q = new URLSearchParams({
        academicYearTermId: termId,
        campus: campus.trim(),
        view,
        subjectCode: subjectFilter.trim(),
        section: sectionFilter.trim(),
      });
      const res = await fetch(`${API}/api/registrar/grade-sheet-inventory?${q.toString()}`);
      if (!res.ok) throw new Error(await res.text());
      setRows((await res.json()) as GradeSheetRow[]);
    } catch (e) {
      console.error(e);
      toast({
        title: "Could not load grade sheets",
        description: e instanceof Error ? e.message : "Request failed.",
        variant: "destructive",
      });
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [API, termId, campus, view, subjectFilter, sectionFilter]);

  useEffect(() => {
    if (!API) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API}/api/academic-year-terms`);
        if (!res.ok) return;
        const list = (await res.json()) as YearTerm[];
        if (cancelled) return;
        setTerms(list);
        setTermId((prev) => (prev ? prev : list[0] ? String(list[0].id) : ""));
      } catch {
        /* noop */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [API]);

  useEffect(() => {
    void loadInventory();
  }, [loadInventory]);

  const grouped = useMemo(() => {
    if (groupBy === "none") return [{ key: "_all", label: "", items: rows }];
    const map = new Map<string, GradeSheetRow[]>();
    for (const r of rows) {
      let k = "";
      if (groupBy === "subject_code") k = (r.subject_code ?? "").trim() || "(blank)";
      else if (groupBy === "section") k = (r.section ?? "").trim() || "(blank)";
      else k = (r.sheet_status ?? "").trim() || "(blank)";
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(r);
    }
    return Array.from(map.entries()).map(([key, items]) => ({
      key,
      label: key,
      items,
    }));
  }, [rows, groupBy]);

  const flatRows = useMemo(() => {
    const out: Array<{ type: "group"; label: string } | { type: "row"; row: GradeSheetRow }> = [];
    for (const g of grouped) {
      if (groupBy !== "none") out.push({ type: "group", label: g.label });
      for (const row of g.items) out.push({ type: "row", row });
    }
    return out;
  }, [grouped, groupBy]);

  const termLabel = useMemo(() => {
    const t = terms.find((x) => String(x.id) === termId);
    if (!t) return "";
    return `${t.academic_year} ${t.term}`;
  }, [terms, termId]);

  return (
    <div className="h-full min-h-0 bg-background flex flex-col overflow-hidden">
      <div className="shrink-0 border-b border-border/60 bg-muted/20 px-3 py-2">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <h1 className="setup-type-page-title leading-tight">GRADE SHEET INVENTORY</h1>
            <p className="setup-type-page-desc mt-0.5 max-w-3xl">
              This module facilitates the inventory of all grade sheets for the selected campus and academic term.
            </p>
          </div>
          <div className="flex flex-wrap items-end gap-2 lg:justify-end">
            <div className="space-y-1 min-w-[200px]">
              <Label className="text-[10px] uppercase text-muted-foreground">View</Label>
              <select
                className="h-8 w-full min-w-[220px] rounded-xl border border-border/60 bg-background px-2 text-xs"
                value={view}
                onChange={(e) => setView(e.target.value)}
              >
                {VIEW_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <Button
              type="button"
              variant="outline"
              className="h-8 text-xs rounded-xl gap-1.5"
              onClick={() => void loadInventory()}
              disabled={loading}
            >
              {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
              Refresh
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 p-2 flex flex-col gap-2">
        <Tabs defaultValue="inventory" className="flex flex-col flex-1 min-h-0 gap-2">
          <div className="shrink-0 flex flex-wrap items-center justify-between gap-2">
            <TabsList className="h-9 bg-muted/50 p-0.5 rounded-xl">
              <TabsTrigger
                value="inventory"
                className="rounded-lg px-3 text-xs font-semibold gap-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                <FolderOpen className="h-3.5 w-3.5" />
                Inventory of Grade Sheets
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="inventory" className="flex-1 min-h-0 flex flex-col gap-2 m-0 p-0 border-0 outline-none data-[state=inactive]:hidden">
            <div className="shrink-0 rounded-xl border border-border/60 bg-gradient-to-r from-sky-950 via-sky-900 to-sky-950 text-sky-50 shadow-sm overflow-hidden">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
                <div className="p-3 space-y-2 border-b lg:border-b-0 lg:border-r border-sky-800/50">
                  <div className="text-[10px] font-bold uppercase tracking-wide text-sky-200/95">
                    Select the campus, academic year and term
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-[10px] uppercase text-sky-200/90">Campus</Label>
                      <select
                        className="h-8 w-full rounded-lg border border-sky-700/60 bg-sky-950/40 px-2 text-xs text-sky-50"
                        value={campus}
                        onChange={(e) => setCampus(e.target.value)}
                      >
                        {CAMPUSES.map((c) => (
                          <option key={c} value={c} className="text-foreground">
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] uppercase text-sky-200/90">Academic year and term</Label>
                      <select
                        className="h-8 w-full rounded-lg border border-sky-700/60 bg-sky-950/40 px-2 text-xs text-sky-50"
                        value={termId}
                        onChange={(e) => setTermId(e.target.value)}
                      >
                        {terms.map((t) => (
                          <option key={t.id} value={String(t.id)} className="text-foreground">
                            {t.academic_year} {t.term}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  {termLabel ? (
                    <p className="text-[10px] text-sky-200/80 pt-0.5">Active term: {termLabel}</p>
                  ) : null}
                </div>
                <div className="p-3 bg-gradient-to-br from-amber-100/95 via-orange-50/90 to-background dark:from-amber-950/40 dark:via-background dark:to-background">
                  <div className="text-[10px] font-bold uppercase tracking-wide text-amber-950/90 dark:text-amber-200/90 mb-2">
                    Subject / section
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-[10px] uppercase text-muted-foreground">Subject code contains</Label>
                      <Input
                        value={subjectFilter}
                        onChange={(e) => setSubjectFilter(e.target.value)}
                        placeholder="e.g. MATH"
                        className="h-8 rounded-lg text-xs bg-background/90 border-amber-200/60 dark:border-border"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] uppercase text-muted-foreground">Section contains</Label>
                      <Input
                        value={sectionFilter}
                        onChange={(e) => setSectionFilter(e.target.value)}
                        placeholder="e.g. A"
                        className="h-8 rounded-lg text-xs bg-background/90 border-amber-200/60 dark:border-border"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-1 min-h-0 flex flex-col rounded-2xl border border-border/60 bg-card shadow-sm overflow-hidden">
              <div className="shrink-0 flex flex-wrap items-center justify-between gap-2 border-b border-border/60 bg-muted/50 px-3 py-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-[10px] font-semibold uppercase text-muted-foreground whitespace-nowrap">
                    Group by
                  </span>
                  <select
                    className="h-8 rounded-lg border border-border/60 bg-background px-2 text-[11px] max-w-[180px]"
                    value={groupBy}
                    onChange={(e) => setGroupBy(e.target.value as GroupBy)}
                  >
                    <option value="none">(none)</option>
                    <option value="subject_code">Subject code</option>
                    <option value="section">Section</option>
                    <option value="sheet_status">Status</option>
                  </select>
                </div>
                <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Grade sheets</span>
              </div>
              <div className="shrink-0 border-b border-border/40 bg-muted/25 px-3 py-1.5">
                <p className="text-[10px] text-muted-foreground italic">
                  Drag a column header here to group by that column — use the &quot;Group by&quot; control above for the
                  same effect on this web grid.
                </p>
              </div>
              <ScrollArea className="flex-1 min-h-[200px]">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40 hover:bg-muted/40">
                      {tableCols.map((c) => (
                        <TableHead
                          key={c}
                          className="whitespace-nowrap text-[10px] font-semibold uppercase text-muted-foreground px-2"
                        >
                          {c}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading && rows.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={tableCols.length} className="text-center py-10">
                          <Loader2 className="h-5 w-5 animate-spin inline text-muted-foreground" />
                        </TableCell>
                      </TableRow>
                    ) : rows.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={tableCols.length}
                          className="text-center text-xs text-muted-foreground py-12 bg-muted/10"
                        >
                          No grade sheet rows for this campus and term. Records are stored in PostgreSQL (
                          <code className="font-mono text-[10px]">grade_sheet_inventory</code>) — use the PUT
                          endpoint or admin tools to load rows.
                        </TableCell>
                      </TableRow>
                    ) : (
                      flatRows.map((entry, idx) =>
                        entry.type === "group" ? (
                          <TableRow key={`g-${entry.label}-${idx}`} className="bg-muted/60 hover:bg-muted/60">
                            <TableCell
                              colSpan={tableCols.length}
                              className="text-[10px] font-semibold uppercase text-muted-foreground py-1.5"
                            >
                              {entry.label}
                            </TableCell>
                          </TableRow>
                        ) : (
                          <TableRow key={entry.row.id} className="hover:bg-muted/30">
                            <TableCell className="font-mono text-[11px]">{entry.row.id}</TableCell>
                            <TableCell className="text-[11px]">{fmt(entry.row.campus)}</TableCell>
                            <TableCell className="font-mono text-[11px]">{fmt(entry.row.subject_code)}</TableCell>
                            <TableCell
                              className="text-[11px] max-w-[200px] truncate"
                              title={fmt(entry.row.subject_title)}
                            >
                              {fmt(entry.row.subject_title)}
                            </TableCell>
                            <TableCell className="text-[11px]">{fmt(entry.row.section)}</TableCell>
                            <TableCell className="font-mono text-[11px]">{fmt(entry.row.identifier)}</TableCell>
                            <TableCell className="text-[11px]">{fmt(entry.row.sheet_status)}</TableCell>
                            <TableCell className="text-[11px] max-w-[160px] truncate" title={fmt(entry.row.notes)}>
                              {fmt(entry.row.notes)}
                            </TableCell>
                          </TableRow>
                        )
                      )
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
              <div className="shrink-0 border-t border-border/60 px-3 py-1.5 flex flex-wrap items-center justify-between gap-2 text-[10px] text-muted-foreground">
                <span>
                  Rows: <span className="font-semibold text-foreground">{rows.length}</span>
                </span>
                <span className="hidden sm:inline">API: {API ? "configured" : "not set"}</span>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <footer className="shrink-0 border-t border-border/60 bg-muted/20 px-3 py-1.5 text-[10px] text-muted-foreground">
        <span className="font-medium text-foreground/80">Registrar • Grade sheet inventory</span>
      </footer>
    </div>
  );
}
