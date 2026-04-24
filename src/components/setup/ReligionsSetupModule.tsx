"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import {
  RefreshCw,
  Save,
  Trash2,
  FilePlus2,
  Church,
  Hash,
  FileText,
  Tag,
  Search,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

const API = process.env.NEXT_PUBLIC_API_URL;

type ReligionRow = {
  id: number;
  religion_name: string;
  short_name: string | null;
};

export function ReligionsSetupModule() {
  const [rows, setRows] = useState<ReligionRow[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [form, setForm] = useState({
    id_text: "",
    religion_name: "",
    short_name: "",
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/religions`);
      const data: ReligionRow[] = res.ok ? await res.json() : [];
      setRows(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const selected = useMemo(
    () => rows.find((r) => r.id === selectedId) ?? null,
    [rows, selectedId]
  );

  useEffect(() => {
    if (!selected) return;
    setForm({
      id_text: String(selected.id),
      religion_name: selected.religion_name,
      short_name: selected.short_name ?? "",
    });
  }, [selected]);

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        r.religion_name.toLowerCase().includes(q) ||
        (r.short_name ?? "").toLowerCase().includes(q)
    );
  }, [rows, search]);

  const handleNew = () => {
    setSelectedId(null);
    setForm({ id_text: "", religion_name: "", short_name: "" });
  };

  const handleSave = async () => {
    const religion_name = form.religion_name.trim();
    if (!religion_name) {
      toast({ title: "Validation error", description: "Religion name is required.", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const url = selectedId ? `${API}/api/religions/${selectedId}` : `${API}/api/religions`;
      const res = await fetch(url, {
        method: selectedId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ religion_name, short_name: form.short_name.trim() || null }),
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(result?.error || "Save failed");
      toast({ title: "Saved", description: "Religion record saved successfully." });
      setSelectedId(result.id ?? selectedId);
      await loadAll();
    } catch (err) {
      toast({ title: "Save failed", description: err instanceof Error ? err.message : "Save failed", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedId) return;
    if (!confirm("Delete this religion?")) return;
    setSaving(true);
    try {
      const res = await fetch(`${API}/api/religions/${selectedId}`, { method: "DELETE" });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(result?.error || "Delete failed");
      handleNew();
      await loadAll();
      toast({ title: "Deleted", description: "Religion record deleted." });
    } catch (err) {
      toast({ title: "Delete failed", description: err instanceof Error ? err.message : "Delete failed", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="h-full bg-background relative overflow-x-hidden">
      <div className="w-full px-2 pt-2 pb-4">

        {/* ── Page header ── */}
        <div className="mb-5 flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h1 className="setup-type-page-title">Religions</h1>
            <p className="setup-type-page-desc">
              Manage religion records for student and personnel records using the central database.
            </p>
          </div>
          <div className="hidden sm:flex flex-col items-end gap-2">
            <div className="setup-type-kicker-pill flex h-9 items-center rounded-xl border border-border/60 bg-background/70 px-3 shadow-sm backdrop-blur">
              Setup Manager module
            </div>
            <div className="setup-type-kicker-pill rounded-xl border border-border/60 bg-muted/30 px-2.5 py-1">
              Enrollment System v2.0
            </div>
          </div>
        </div>

        {/* ── Module card ── */}
        <Card className="overflow-hidden rounded-2xl bg-background border-border/40 shadow-sm">
          <div className="px-4 py-3 flex flex-wrap items-center justify-between gap-3 border-b border-border/40 bg-muted/5">
            <div className="flex items-center gap-3 min-w-0">
              <div className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 p-2 rounded-xl border border-emerald-500/20 shadow-sm shrink-0">
                <Church className="h-4 w-4" />
              </div>
              <div className="leading-tight min-w-0">
                <div className="setup-type-module-title">Religion management</div>
                <div className="setup-type-module-sub">Categorize and maintain religious affiliations</div>
              </div>
            </div>
          </div>

          <div className="p-3 bg-background/60 space-y-3">
            {/* ── Top row: Form + Stats ── */}
            <div className="grid grid-cols-12 gap-3">

              {/* ── Form panel ── */}
              <div className="col-span-12 lg:col-span-5 flex flex-col rounded-2xl bg-card border border-border/40 shadow-sm overflow-hidden min-h-0">
                <div className="setup-type-section-title shrink-0 border-b border-border/60 bg-muted/5 px-3 py-2.5 flex items-center justify-between">
                  <span>Religion details</span>
                  <span className="text-[10px] font-normal text-muted-foreground">
                    {selectedId ? `Editing #${selectedId}` : "New record"}
                  </span>
                </div>
                <div className="p-4 flex-1 flex flex-col">
                  <div className="space-y-3.5 flex-1">
                    <div className="space-y-1">
                      <Label className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5">
                        <Hash className="h-3 w-3" />
                        Religion ID
                      </Label>
                      <Input
                        className="h-10 rounded-xl text-xs border-border/60 shadow-sm font-mono bg-muted/20"
                        value={form.id_text}
                        readOnly
                        placeholder="Auto-assigned"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5">
                        <FileText className="h-3 w-3" />
                        Religion Name
                      </Label>
                      <Input
                        className="h-10 rounded-xl text-xs border-border/60 shadow-sm"
                        placeholder="e.g. Roman Catholic, Islam"
                        value={form.religion_name}
                        onChange={(e) => setForm((s) => ({ ...s, religion_name: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5">
                        <Tag className="h-3 w-3" />
                        Short Name
                      </Label>
                      <Input
                        className="h-10 rounded-xl text-xs border-border/60 shadow-sm uppercase tracking-wide"
                        placeholder="e.g. RC, INC"
                        value={form.short_name}
                        onChange={(e) => setForm((s) => ({ ...s, short_name: e.target.value }))}
                      />
                    </div>
                  </div>

                  {/* ── Actions ── */}
                  <div className="mt-4 pt-3.5 border-t border-border/60 flex flex-wrap gap-2">
                    <Button
                      type="button" variant="outline" size="sm"
                      className="h-8 gap-1.5 text-xs rounded-lg border-border/60 shadow-sm"
                      onClick={handleNew} disabled={saving}
                    >
                      <FilePlus2 className="h-3.5 w-3.5" /> New
                    </Button>
                    <Button
                      type="button" size="sm"
                      className="h-8 gap-1.5 text-xs rounded-lg shadow-sm bg-primary text-primary-foreground hover:bg-primary/90"
                      onClick={handleSave} disabled={saving}
                    >
                      {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                      Save
                    </Button>
                    <Button
                      type="button" variant="outline" size="sm"
                      className="h-8 gap-1.5 text-xs rounded-lg border-border/60 shadow-sm text-destructive hover:bg-destructive/10"
                      onClick={handleDelete} disabled={saving || !selectedId}
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Delete
                    </Button>
                    <Button
                      type="button" variant="outline" size="sm"
                      className="h-8 gap-1.5 text-xs rounded-lg border-border/60 shadow-sm ml-auto"
                      onClick={loadAll} disabled={saving || loading}
                    >
                      <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} /> Refresh
                    </Button>
                  </div>
                </div>
              </div>

              {/* ── Stats + Selected preview ── */}
              <div className="col-span-12 lg:col-span-7 flex flex-col gap-3">
                {/* Quick Stats */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-card border border-border/40 shadow-sm overflow-hidden p-4 flex flex-col items-center justify-center gap-1">
                    <span className="text-2xl font-bold tabular-nums text-primary tracking-tight font-mono">
                      {rows.length}
                    </span>
                    <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                      Total Religions
                    </span>
                  </div>
                  <div className="rounded-2xl bg-card border border-border/40 shadow-sm overflow-hidden p-4 flex flex-col items-center justify-center gap-1">
                    <span className="text-2xl font-bold tabular-nums text-foreground tracking-tight font-mono">
                      {rows.filter((r) => r.short_name).length}
                    </span>
                    <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                      With Acronyms
                    </span>
                  </div>
                </div>

                {/* Selected preview */}
                <div className="rounded-2xl bg-card border border-border/40 shadow-sm overflow-hidden p-4 flex-1 flex flex-col">
                  <div className="setup-type-section-title mb-3">Selected religion</div>
                  {selected ? (
                    <div className="flex-1 flex flex-col gap-2.5">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-muted/50 border border-border/40 flex items-center justify-center shrink-0">
                          <Church className="h-4 w-4 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate">
                            {selected.religion_name}
                          </p>
                          <p className="text-[11px] text-muted-foreground font-mono">
                            ID: {selected.id} · Short: {selected.short_name ?? "—"}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 flex items-center justify-center">
                      <p className="text-xs text-muted-foreground/60 italic">
                        Select a religion from the table below
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ── Data table ── */}
            <div className="rounded-2xl border border-border/40 bg-card shadow-sm overflow-hidden">
              <div className="px-3 py-2.5 border-b border-border/40 bg-muted/5 flex items-center justify-between gap-3">
                <div className="setup-type-section-title">
                  All religion entries
                  <span className="ml-2 text-[10px] font-normal text-muted-foreground">
                    ({filteredRows.length}{filteredRows.length !== rows.length ? ` of ${rows.length}` : ""} records)
                  </span>
                </div>
                <div className="relative w-48">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50" />
                  <Input
                    className="h-8 pl-8 rounded-lg text-xs border-border/60 bg-background shadow-sm"
                    placeholder="Search religions..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </div>
              <div className="overflow-auto max-h-[min(400px,50svh)] bg-background">
                <table className="w-full text-[11px] border-collapse">
                  <thead>
                    <tr className="sticky top-0 z-10 border-b border-border/60 bg-muted/50 shadow-sm">
                      {["ID", "Religion Name", "Short Name"].map((h) => (
                        <th
                          key={h}
                          className="setup-type-table-header border-r border-border/60 px-3 py-2 text-left last:border-r-0"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={3} className="px-4 py-8 text-center">
                          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin" /> Loading…
                          </div>
                        </td>
                      </tr>
                    ) : filteredRows.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="px-4 py-8 text-center text-sm text-muted-foreground italic">
                          {search ? "No religions match your search" : "No religions found"}
                        </td>
                      </tr>
                    ) : (
                      filteredRows.map((r, idx) => (
                        <tr
                          key={r.id}
                          role="button"
                          tabIndex={0}
                          onClick={() => setSelectedId(r.id)}
                          onKeyDown={(ev) => {
                            if (ev.key === "Enter" || ev.key === " ") {
                              ev.preventDefault();
                              setSelectedId(r.id);
                            }
                          }}
                          className={cn(
                            "premium-row cursor-pointer border-b border-border/40 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
                            idx % 2 === 1 && "bg-muted/10",
                            selectedId === r.id && "bg-emerald-500/10 font-medium ring-1 ring-inset ring-emerald-500/15"
                          )}
                        >
                          <td className="setup-font-mono-data border-r border-border/50 px-3 py-2 w-20">
                            {r.id}
                          </td>
                          <td className="px-3 py-2 border-r border-border/50 font-medium text-foreground">
                            {r.religion_name}
                          </td>
                          <td className="px-3 py-2 text-muted-foreground font-mono uppercase tracking-wide">
                            {r.short_name ?? "—"}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
