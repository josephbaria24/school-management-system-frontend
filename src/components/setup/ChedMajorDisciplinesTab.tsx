"use client";

import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FilePlus2, Save, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MajorGroupRow } from "./MajorDisciplineGroupsTab";

const API = process.env.NEXT_PUBLIC_API_URL;

type ChedRow = {
  id: number;
  major_code: string;
  major_discipline: string;
  major_group_id: number;
  group_code: string;
  group_description: string;
};

const empty = {
  major_code: "",
  major_discipline: "",
  major_group_id: "" as string | number,
};

type TableRowEntry = {
  row: ChedRow;
  groupLabel: string;
  groupRowspan: number;
  showGroup: boolean;
};

const ChedDisciplineTableRow = memo(function ChedDisciplineTableRow({
  entry,
  isSelected,
  onSelect,
}: {
  entry: TableRowEntry;
  isSelected: boolean;
  onSelect: (id: number) => void;
}) {
  const { row, groupLabel, groupRowspan, showGroup } = entry;

  return (
    <tr>
      {showGroup ? (
        <td
          rowSpan={groupRowspan}
          className="align-top px-2 py-1.5 border-b border-border/60 border-r border-border/40 bg-emerald-50/80 dark:bg-emerald-950/30 text-[11px] leading-snug"
        >
          {groupLabel}
        </td>
      ) : null}
      <td
        className={cn(
          "px-2 py-1.5 border-b border-border/60 border-l border-border/40 font-mono",
          isSelected && "bg-emerald-600 text-white dark:bg-emerald-700"
        )}
      >
        <button type="button" className="w-full text-left" onClick={() => onSelect(row.id)}>
          {row.major_code}
        </button>
      </td>
      <td
        className={cn(
          "px-2 py-1.5 border-b border-border/60 border-l border-border/40",
          isSelected && "bg-emerald-600 text-white dark:bg-emerald-700"
        )}
      >
        <button type="button" className="w-full text-left" onClick={() => onSelect(row.id)}>
          {row.major_discipline}
        </button>
      </td>
    </tr>
  );
});

export function ChedMajorDisciplinesTab() {
  const [groups, setGroups] = useState<MajorGroupRow[]>([]);
  const [rows, setRows] = useState<ChedRow[]>([]);
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

  const loadGroups = useCallback(async () => {
    const res = await fetch(`${API}/api/major-discipline-groups`);
    if (!res.ok) return;
    setGroups(await res.json());
  }, []);

  const loadDisciplines = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/ched-major-disciplines`);
      if (!res.ok) throw new Error("Load failed");
      setRows(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadGroups();
  }, [loadGroups]);

  useEffect(() => {
    loadDisciplines();
  }, [loadDisciplines]);

  const selected = rows.find((r) => r.id === selectedId) ?? null;
  useEffect(() => {
    if (!selected) return;
    setForm({
      major_code: selected.major_code,
      major_discipline: selected.major_discipline,
      major_group_id: String(selected.major_group_id),
    });
  }, [selected]);

  const tableRows = useMemo(() => {
    const out: TableRowEntry[] = [];
    let i = 0;
    while (i < rows.length) {
      const label = rows[i].group_description;
      let j = i;
      while (j < rows.length && rows[j].group_description === label) j++;
      const span = j - i;
      for (let k = i; k < j; k++) {
        out.push({
          row: rows[k],
          groupLabel: label,
          groupRowspan: span,
          showGroup: k === i,
        });
      }
      i = j;
    }
    return out;
  }, [rows]);

  const resetNew = () => {
    setSelectedId(null);
    setFieldErrors({});
    setForm({
      ...empty,
      major_group_id: groups[0] ? String(groups[0].id) : "",
    });
  };

  useEffect(() => {
    if (selectedId !== null) return;
    if (form.major_group_id !== "" && form.major_group_id !== undefined) return;
    if (groups[0]) setForm((f) => ({ ...f, major_group_id: String(groups[0].id) }));
  }, [groups, selectedId, form.major_group_id]);

  const handleSave = async () => {
    const errors: Record<string, string> = {};
    const gid = parseInt(String(form.major_group_id), 10);
    if (!form.major_code.trim()) {
      errors.major_code = "Major code is required.";
    }
    if (!form.major_discipline.trim()) {
      errors.major_discipline = "Major discipline name is required.";
    }
    if (groups.length === 0) {
      errors.major_group_id = "Create a major group first.";
    } else if (!Number.isFinite(gid)) {
      errors.major_group_id = "Select a major group.";
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
      const body = {
        major_code: form.major_code.trim(),
        major_discipline: form.major_discipline.trim(),
        major_group_id: gid,
      };
      const url = selectedId
        ? `${API}/api/ched-major-disciplines/${selectedId}`
        : `${API}/api/ched-major-disciplines`;
      const res = await fetch(url, {
        method: selectedId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(result?.error || "Save failed");
      setSelectedId(result.id);
      setBannerVariant("default");
      setMessage("Saved.");
      await loadDisciplines();
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
      const res = await fetch(`${API}/api/ched-major-disciplines/${selectedId}`, {
        method: "DELETE",
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(result?.error || "Delete failed");
      resetNew();
      await loadDisciplines();
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
            "mb-2 px-3 py-2 rounded-sm text-xs border",
            bannerVariant === "destructive"
              ? "border-destructive/50 bg-destructive/10 text-destructive"
              : "border-border bg-muted/60"
          )}
        >
          {message}
        </div>
      )}
      <div className="grid grid-cols-12 gap-3 h-[560px]">
        <div className="col-span-5 flex flex-col border border-border rounded-sm overflow-hidden bg-background h-full min-h-0">
          <div className="bg-emerald-700 dark:bg-emerald-900 text-white px-2 py-1.5 text-[10px] font-bold uppercase shrink-0">
            Major discipline information
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0">
            <div className="space-y-1">
              <Label className="text-xs">Major code</Label>
              <Input
                className={cn(
                  "h-8 text-sm font-mono",
                  fieldErrors.major_code &&
                    "border-destructive ring-1 ring-destructive/30"
                )}
                value={form.major_code}
                onChange={(e) => {
                  clearFieldError("major_code");
                  setForm((f) => ({ ...f, major_code: e.target.value }));
                }}
              />
              {fieldErrors.major_code && (
                <p className="text-[10px] text-destructive">
                  {fieldErrors.major_code}
                </p>
              )}
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Major discipline</Label>
              <Input
                className={cn(
                  "h-8 text-sm",
                  fieldErrors.major_discipline &&
                    "border-destructive ring-1 ring-destructive/30"
                )}
                value={form.major_discipline}
                onChange={(e) => {
                  clearFieldError("major_discipline");
                  setForm((f) => ({ ...f, major_discipline: e.target.value }));
                }}
              />
              {fieldErrors.major_discipline && (
                <p className="text-[10px] text-destructive">
                  {fieldErrors.major_discipline}
                </p>
              )}
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Major group</Label>
              <Select
                value={form.major_group_id ? String(form.major_group_id) : ""}
                onValueChange={(v) => {
                  clearFieldError("major_group_id");
                  setForm((f) => ({ ...f, major_group_id: v }));
                }}
              >
                <SelectTrigger
                  className={cn(
                    "h-8 text-xs",
                    fieldErrors.major_group_id &&
                      "border-destructive ring-1 ring-destructive/30"
                  )}
                >
                  <SelectValue placeholder="Select group" />
                </SelectTrigger>
                <SelectContent>
                  {groups.map((g) => (
                    <SelectItem key={g.id} value={String(g.id)}>
                      {g.group_description}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fieldErrors.major_group_id && (
                <p className="text-[10px] text-destructive">
                  {fieldErrors.major_group_id}
                </p>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5 p-2 border-t border-border bg-muted/30 shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 text-[10px] gap-1"
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
              className="h-7 text-[10px] gap-1"
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
              className="h-7 text-[10px] gap-1 text-destructive"
              disabled={saving || !selectedId}
              onClick={handleDelete}
            >
              <Trash2 className="h-3 w-3" />
              Delete
            </Button>
          </div>
        </div>

        <div className="col-span-7 flex flex-col border border-border rounded-sm overflow-hidden bg-background h-full min-h-0">
          <div className="overflow-auto flex-1 min-h-0">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-emerald-600 dark:bg-emerald-900 text-white">
                  <th className="text-left font-bold uppercase px-2 py-1.5 border-b border-white/20 w-[38%]">
                    Major group
                  </th>
                  <th className="text-left font-bold uppercase px-2 py-1.5 border-b border-white/20 border-l border-white/20 w-[22%] font-mono">
                    Major code
                  </th>
                  <th className="text-left font-bold uppercase px-2 py-1.5 border-b border-white/20 border-l border-white/20">
                    Major discipline
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={3} className="p-4 text-muted-foreground">
                      Loading…
                    </td>
                  </tr>
                ) : tableRows.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="p-4 text-muted-foreground italic">
                      No disciplines.
                    </td>
                  </tr>
                ) : (
                  tableRows.map((entry) => (
                    <ChedDisciplineTableRow
                      key={entry.row.id}
                      entry={entry}
                      isSelected={selectedId === entry.row.id}
                      onSelect={setSelectedId}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="px-2 py-1.5 border-t border-border bg-muted/40 text-[10px] font-bold uppercase shrink-0">
            Total: {rows.length}
          </div>
        </div>
      </div>
    </div>
  );
}
