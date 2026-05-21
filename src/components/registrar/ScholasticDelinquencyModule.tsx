"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Archive, Loader2, Save, X } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL;

export type ScholasticDelinquencyRow = {
  id: string;
  minUnitsEnrolled: string;
  maxUnitsEnrolled: string;
  minPercentSubject: string;
  maxPercentSubject: string;
  status: string;
  lessToAllowable: string;
};

function uid() {
  return `tmp-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

type ApiScholasticRow = {
  id: number;
  sort_order: number;
  min_units_enrolled: string;
  max_units_enrolled: string;
  min_percent_subject: string;
  max_percent_subject: string;
  status_text: string;
  less_to_allowable: string;
};

function mapFromApi(r: ApiScholasticRow): ScholasticDelinquencyRow {
  return {
    id: String(r.id),
    minUnitsEnrolled: r.min_units_enrolled ?? "0.00",
    maxUnitsEnrolled: r.max_units_enrolled ?? "0.00",
    minPercentSubject: r.min_percent_subject ?? "0.00",
    maxPercentSubject: r.max_percent_subject ?? "0.00",
    status: r.status_text ?? "",
    lessToAllowable: r.less_to_allowable ?? "0.00",
  };
}

function mapToApiPayload(rows: ScholasticDelinquencyRow[]) {
  return rows.map((r) => ({
    min_units_enrolled: Number(r.minUnitsEnrolled) || 0,
    max_units_enrolled: Number(r.maxUnitsEnrolled) || 0,
    min_percent_subject: Number(r.minPercentSubject) || 0,
    max_percent_subject: Number(r.maxPercentSubject) || 0,
    status_text: r.status,
    less_to_allowable: Number(r.lessToAllowable) || 0,
  }));
}

export function ScholasticDelinquencyModule() {
  const router = useRouter();
  const [rows, setRows] = useState<ScholasticDelinquencyRow[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!API) {
      setLoading(false);
      toast({ title: "API not configured", description: "Set NEXT_PUBLIC_API_URL.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/registrar/scholastic-delinquency`);
      if (!res.ok) throw new Error(await res.text());
      const data = (await res.json()) as ApiScholasticRow[];
      const mapped = data.map(mapFromApi);
      setRows(mapped);
      setSelectedId(mapped[0]?.id ?? null);
    } catch (e) {
      console.error(e);
      toast({
        title: "Load failed",
        description: e instanceof Error ? e.message : "Could not load scholastic delinquency rules.",
        variant: "destructive",
      });
      setRows([]);
      setSelectedId(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const saveRows = async (next: ScholasticDelinquencyRow[], msg = "Saved to database.") => {
    if (!API) {
      toast({ title: "API not configured", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`${API}/api/registrar/scholastic-delinquency`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: mapToApiPayload(next) }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = (await res.json()) as ApiScholasticRow[];
      const mapped = data.map(mapFromApi);
      setRows(mapped);
      setSelectedId((prev) => {
        if (prev && mapped.some((r) => r.id === prev)) return prev;
        return mapped[0]?.id ?? null;
      });
      toast({ title: "Saved", description: msg });
    } catch (e) {
      console.error(e);
      toast({
        title: "Save failed",
        description: e instanceof Error ? e.message : "Could not save rules.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSave = () => {
    void saveRows(rows);
    setEditingId(null);
  };

  const insertRow = () => {
    const row: ScholasticDelinquencyRow = {
      id: uid(),
      minUnitsEnrolled: "0.00",
      maxUnitsEnrolled: "0.00",
      minPercentSubject: "0.00",
      maxPercentSubject: "0.00",
      status: "",
      lessToAllowable: "0.00",
    };
    const next = [...rows, row];
    setRows(next);
    setSelectedId(row.id);
    setEditingId(row.id);
  };

  const removeRow = () => {
    if (!selectedId) {
      toast({ title: "No row selected", description: "Click a row to select it, then remove.", variant: "destructive" });
      return;
    }
    const next = rows.filter((r) => r.id !== selectedId);
    setRows(next);
    setSelectedId(next[0]?.id ?? null);
    setEditingId((e) => (e === selectedId ? null : e));
    void saveRows(next, "Row removed.");
  };

  const updateCell = (id: string, key: keyof ScholasticDelinquencyRow, value: string) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, [key]: value } : r)));
  };

  return (
    <div className="h-full min-h-0 bg-background overflow-x-hidden flex flex-col">
      <div className="w-full px-2 pt-2 pb-4 space-y-3 flex-1 min-h-0 flex flex-col">
        <div className="flex items-start gap-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-border/60 bg-muted/30 text-muted-foreground">
            <Archive className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="setup-type-page-title">Scholastic Delinquency</h1>
            <p className="setup-type-page-desc">Allows you to configure Scholastic Delinquency Formula</p>
          </div>
          <div className="setup-type-kicker-pill hidden sm:flex h-9 items-center rounded-xl border border-border/60 bg-background/70 px-3 shadow-sm shrink-0">
            Registrar module
          </div>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card shadow-sm overflow-hidden flex flex-col flex-1 min-h-0">
          <Tabs defaultValue="table" className="flex flex-col flex-1 min-h-0">
            <div className="px-3 pt-3 border-b border-border/60 bg-muted/10">
              <TabsList className="h-9 w-fit max-w-max bg-muted/50 p-0.5 rounded-xl">
                <TabsTrigger
                  value="table"
                  className="rounded-lg px-4 text-xs font-semibold data-[state=active]:bg-background data-[state=active]:shadow-sm"
                >
                  Scholastic Delinquency Table
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="table" className="flex-1 min-h-0 flex flex-col m-0 p-0 border-0 outline-none data-[state=inactive]:hidden">
              <div className="flex-1 min-h-0 overflow-auto relative">
                {loading && (
                  <div className="absolute inset-0 z-10 grid place-items-center bg-background/60">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                )}
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40 hover:bg-muted/40 border-border/60">
                      <TableHead className="w-12 text-center text-[11px] font-semibold uppercase text-muted-foreground">
                        #
                      </TableHead>
                      <TableHead className="text-[11px] font-semibold uppercase text-muted-foreground whitespace-nowrap">
                        Minimum Units Enrolled
                      </TableHead>
                      <TableHead className="text-[11px] font-semibold uppercase text-muted-foreground whitespace-nowrap">
                        Maximum Units Enrolled
                      </TableHead>
                      <TableHead className="text-[11px] font-semibold uppercase text-muted-foreground whitespace-nowrap">
                        Min % of Subject
                      </TableHead>
                      <TableHead className="text-[11px] font-semibold uppercase text-muted-foreground whitespace-nowrap">
                        Max % of Subject
                      </TableHead>
                      <TableHead className="text-[11px] font-semibold uppercase text-muted-foreground min-w-[200px]">
                        Scholastic Delinquency Status
                      </TableHead>
                      <TableHead className="text-[11px] font-semibold uppercase text-muted-foreground whitespace-nowrap">
                        Less to Allowable
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((row, index) => {
                      const isSelected = row.id === selectedId;
                      const isEditing = row.id === editingId;
                      return (
                        <TableRow
                          key={row.id}
                          data-state={isSelected ? "selected" : undefined}
                          className={cn(
                            "cursor-pointer text-xs border-border/40",
                            isSelected &&
                              "bg-rose-50/70 dark:bg-rose-950/25 ring-1 ring-inset ring-rose-200/80 dark:ring-rose-900/50",
                            isEditing && "bg-muted/25"
                          )}
                          onClick={() => setSelectedId(row.id)}
                          onDoubleClick={() => {
                            setSelectedId(row.id);
                            setEditingId(row.id);
                          }}
                        >
                          <TableCell className="text-center font-mono text-muted-foreground">{index + 1}</TableCell>
                          {(
                            [
                              ["minUnitsEnrolled", row.minUnitsEnrolled],
                              ["maxUnitsEnrolled", row.maxUnitsEnrolled],
                              ["minPercentSubject", row.minPercentSubject],
                              ["maxPercentSubject", row.maxPercentSubject],
                              ["status", row.status],
                              ["lessToAllowable", row.lessToAllowable],
                            ] as const
                          ).map(([fieldKey, val]) => (
                            <TableCell key={fieldKey} className="font-mono tabular-nums">
                              {isEditing ? (
                                <Input
                                  value={val}
                                  onChange={(e) => updateCell(row.id, fieldKey, e.target.value)}
                                  className={cn(
                                    "h-8 rounded-lg text-xs border-border/60",
                                    fieldKey === "status" && "font-sans min-w-[220px]"
                                  )}
                                  onClick={(e) => e.stopPropagation()}
                                />
                              ) : (
                                <span
                                  className={fieldKey === "status" ? "font-sans font-normal whitespace-normal" : ""}
                                >
                                  {val || "—"}
                                </span>
                              )}
                            </TableCell>
                          ))}
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              <div className="border-t border-border/60 bg-muted/10 px-3 py-3 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between shrink-0">
                <p className="text-[11px] text-muted-foreground order-2 lg:order-1">
                  Note: Double Click to Modify Record
                </p>
                <div className="flex flex-wrap items-center justify-center gap-2 order-1 lg:order-2 lg:flex-1">
                  <Button type="button" variant="outline" className="h-8 text-xs rounded-xl" onClick={insertRow} disabled={saving}>
                    Insert Row
                  </Button>
                  <Button type="button" variant="outline" className="h-8 text-xs rounded-xl" onClick={removeRow} disabled={saving}>
                    Rem. Row
                  </Button>
                </div>
                <div className="flex flex-wrap justify-end gap-2 order-3">
                  <Button
                    type="button"
                    variant="default"
                    className="h-8 text-xs rounded-xl gap-1.5"
                    onClick={handleSave}
                    disabled={saving || loading}
                  >
                    {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                    Save
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-8 text-xs rounded-xl gap-1.5 text-destructive hover:text-destructive"
                    onClick={() => router.back()}
                  >
                    <X className="h-3.5 w-3.5" />
                    Close
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
