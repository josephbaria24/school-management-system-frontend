"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FilePlus2, Save, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

const API = process.env.NEXT_PUBLIC_API_URL;

export type MajorGroupRow = {
  id: number;
  group_code: string;
  group_description: string;
};

const empty = { group_code: "", group_description: "" };

export function MajorDisciplineGroupsTab() {
  const [rows, setRows] = useState<MajorGroupRow[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [form, setForm] = useState(empty);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [bannerVariant, setBannerVariant] = useState<"default" | "destructive">(
    "default"
  );

  const clearFieldError = (key: string) => {
    setFieldErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/major-discipline-groups`);
      if (!res.ok) throw new Error("Load failed");
      setRows(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const selected = rows.find((r) => r.id === selectedId) ?? null;
  useEffect(() => {
    if (!selected) return;
    setForm({
      group_code: selected.group_code,
      group_description: selected.group_description,
    });
  }, [selected]);

  const resetNew = () => {
    setSelectedId(null);
    setFieldErrors({});
    setForm(empty);
  };

  const handleSave = async () => {
    const errors: Record<string, string> = {};
    if (!form.group_code.trim()) {
      errors.group_code = "Group code is required.";
    }
    if (!form.group_description.trim()) {
      errors.group_description = "Group description is required.";
    }
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setBannerVariant("destructive");
      setMessage("Please complete the required fields below.");
      setTimeout(() => setMessage(null), 5000);
      return;
    }
    setFieldErrors({});
    setBannerVariant("default");
    setSaving(true);
    try {
      const url = selectedId
        ? `${API}/api/major-discipline-groups/${selectedId}`
        : `${API}/api/major-discipline-groups`;
      const res = await fetch(url, {
        method: selectedId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(result?.error || "Save failed");
      setSelectedId(result.id);
      setBannerVariant("default");
      setMessage("Saved.");
      await load();
    } catch (e) {
      setBannerVariant("destructive");
      setMessage(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleDelete = async () => {
    if (!selectedId) return;
    setSaving(true);
    try {
      const res = await fetch(
        `${API}/api/major-discipline-groups/${selectedId}`,
        { method: "DELETE" }
      );
      const result = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(result?.error || "Delete failed");
      resetNew();
      await load();
      setMessage("Deleted.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  return (
    <div>
      {message && (
        <div
          className={cn(
            "mb-2 px-4 py-3 rounded-2xl text-xs border shadow-sm",
            bannerVariant === "destructive"
              ? "border-destructive/50 bg-destructive/10 text-destructive"
              : "border-border bg-muted/60"
          )}
        >
          {message}
        </div>
      )}
      <div className="grid grid-cols-12 gap-3 h-[560px]">
        <div className="col-span-5 flex flex-col rounded-2xl overflow-hidden bg-card border border-border/40 shadow-sm h-full min-h-0">
          <div className="bg-muted/5 text-foreground px-3 py-2 text-[11px] font-semibold tracking-tight shrink-0 border-b border-border/60">
            Major group information
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
            <div className="space-y-1">
              <Label className="text-xs">Group code</Label>
              <Input
                className={cn(
                  "h-9 rounded-xl text-sm font-mono border-border/60 shadow-sm",
                  fieldErrors.group_code &&
                    "border-destructive ring-1 ring-destructive/30"
                )}
                value={form.group_code}
                onChange={(e) => {
                  clearFieldError("group_code");
                  setForm((f) => ({ ...f, group_code: e.target.value }));
                }}
              />
              {fieldErrors.group_code && (
                <p className="text-[10px] text-destructive">
                  {fieldErrors.group_code}
                </p>
              )}
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Group description</Label>
              <Input
                className={cn(
                  "h-9 rounded-xl text-sm border-border/60 shadow-sm",
                  fieldErrors.group_description &&
                    "border-destructive ring-1 ring-destructive/30"
                )}
                value={form.group_description}
                onChange={(e) => {
                  clearFieldError("group_description");
                  setForm((f) => ({
                    ...f,
                    group_description: e.target.value,
                  }));
                }}
              />
              {fieldErrors.group_description && (
                <p className="text-[10px] text-destructive">
                  {fieldErrors.group_description}
                </p>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-2 p-3 border-t border-border/60 bg-muted/30 shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9 rounded-xl text-xs font-semibold gap-2"
              disabled={saving}
              onClick={resetNew}
            >
              <FilePlus2 className="h-3 w-3" />
              New
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9 rounded-xl text-xs font-semibold gap-2"
              disabled={saving}
              onClick={handleSave}
            >
              <Save className="h-3 w-3" />
              Save
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9 rounded-xl text-xs font-semibold gap-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
              disabled={saving || !selectedId}
              onClick={handleDelete}
            >
              <Trash2 className="h-3 w-3" />
              Delete
            </Button>
          </div>
        </div>

        <div className="col-span-7 flex flex-col rounded-2xl overflow-hidden bg-card border border-border/40 shadow-sm h-full min-h-0">
          <div className="grid grid-cols-12 bg-muted/50 text-[11px] font-semibold text-muted-foreground shrink-0 border-b border-border/60 sticky top-0 z-10">
            <div className="col-span-3 px-2 py-2 border-r border-border/60 font-mono">
              Group code
            </div>
            <div className="col-span-9 px-2 py-2">Group description</div>
          </div>
          <div className="flex-1 overflow-auto min-h-0">
            {loading ? (
              <div className="p-4 text-xs text-muted-foreground">Loading…</div>
            ) : rows.length === 0 ? (
              <div className="p-4 text-xs text-muted-foreground italic">
                No groups.
              </div>
            ) : (
              rows.map((row, idx) => (
                <button
                  key={row.id}
                  type="button"
                  onClick={() => setSelectedId(row.id)}
                  className={cn(
                    "premium-row w-full grid grid-cols-12 text-left text-xs border-b border-border/40 transition-colors",
                    selectedId === row.id
                      ? "bg-red-500/10 font-medium"
                      : idx % 2 === 0
                        ? "bg-background hover:bg-muted/40"
                        : "bg-muted/10 hover:bg-muted/40"
                  )}
                >
                  <div className="col-span-3 px-2 py-2 border-r border-border/60 font-mono truncate">
                    {row.group_code}
                  </div>
                  <div className="col-span-9 px-2 py-2 truncate">
                    {row.group_description}
                  </div>
                </button>
              ))
            )}
          </div>
          <div className="px-2 py-1.5 border-t border-border bg-muted/40 text-[10px] font-bold uppercase shrink-0">
            Total: {rows.length}
          </div>
        </div>
      </div>
    </div>
  );
}
