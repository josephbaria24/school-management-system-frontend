"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  FilePlus2,
  Loader2,
  RefreshCw,
  Save,
  Trash2,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

const API = process.env.NEXT_PUBLIC_API_URL;

type Campus = { id: number; acronym: string; campus_name: string | null };
type CollegeRow = {
  id: number;
  campus_id: number;
  college_code: string;
  college_name: string;
};
export type DepartmentRow = {
  id: number;
  campus_id: number;
  college_id: number | null;
  dept_code: string;
  dept_name: string;
  campus_acronym?: string | null;
  campus_name?: string | null;
  college_code?: string | null;
  college_name?: string | null;
};

const NONE = "__none__";

function emptyForm() {
  return {
    campus_id: "" as string,
    college_id: "" as string,
    dept_code: "",
    dept_name: "",
  };
}

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: () => void;
};

export function MaintainDepartmentsDialog({
  open,
  onOpenChange,
  onSaved,
}: Props) {
  const [departments, setDepartments] = useState<DepartmentRow[]>([]);
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [colleges, setColleges] = useState<CollegeRow[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageVariant, setMessageVariant] = useState<"info" | "error">("info");

  const campusLabel = (c: Campus) =>
    `${c.acronym}${c.campus_name ? ` — ${c.campus_name}` : ""}`;

  const collegesForCampus = useMemo(() => {
    const cid = form.campus_id ? parseInt(form.campus_id, 10) : NaN;
    if (!Number.isFinite(cid)) return [];
    return colleges.filter((c) => c.campus_id === cid);
  }, [colleges, form.campus_id]);

  const loadDepartments = useCallback(async () => {
    const res = await fetch(`${API}/api/departments`);
    if (!res.ok) return;
    setDepartments(await res.json());
  }, []);

  const loadCampusesColleges = useCallback(async () => {
    const [cRes, colRes] = await Promise.all([
      fetch(`${API}/api/campuses`),
      fetch(`${API}/api/colleges`),
    ]);
    if (cRes.ok) setCampuses(await cRes.json());
    if (colRes.ok) setColleges(await colRes.json());
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([loadDepartments(), loadCampusesColleges()]);
    } finally {
      setLoading(false);
    }
  }, [loadCampusesColleges, loadDepartments]);

  useEffect(() => {
    if (!open) return;
    refresh();
  }, [open, refresh]);

  const selectRow = (d: DepartmentRow) => {
    setSelectedId(d.id);
    setForm({
      campus_id: String(d.campus_id),
      college_id: d.college_id != null ? String(d.college_id) : "",
      dept_code: d.dept_code,
      dept_name: d.dept_name,
    });
    setMessage(null);
  };

  const handleNew = () => {
    setSelectedId(null);
    setForm(emptyForm());
    setMessage(null);
  };

  const handleSave = async () => {
    const campus_id = form.campus_id
      ? parseInt(form.campus_id, 10)
      : NaN;
    const dept_code = form.dept_code.trim();
    const dept_name = form.dept_name.trim();
    if (!Number.isFinite(campus_id) || !dept_code || !dept_name) {
      setMessageVariant("error");
      setMessage("Campus, department code, and department name are required.");
      setTimeout(() => setMessage(null), 4000);
      return;
    }
    const college_id = form.college_id
      ? parseInt(form.college_id, 10)
      : null;
    const body = {
      campus_id,
      college_id: college_id != null && Number.isFinite(college_id)
        ? college_id
        : null,
      dept_code,
      dept_name,
    };
    setSaving(true);
    setMessage(null);
    try {
      const url = selectedId
        ? `${API}/api/departments/${selectedId}`
        : `${API}/api/departments`;
      const res = await fetch(url, {
        method: selectedId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(result?.error || "Save failed");
      setMessageVariant("info");
      setMessage("Saved.");
      if (result?.id) setSelectedId(result.id);
      await loadDepartments();
      onSaved?.();
    } catch (e) {
      setMessageVariant("error");
      setMessage(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(null), 4000);
    }
  };

  const handleDelete = async () => {
    if (!selectedId) return;
    if (!confirm("Delete this department?")) return;
    setSaving(true);
    try {
      const res = await fetch(`${API}/api/departments/${selectedId}`, {
        method: "DELETE",
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(result?.error || "Delete failed");
      handleNew();
      await loadDepartments();
      onSaved?.();
      setMessageVariant("info");
      setMessage("Deleted.");
    } catch (e) {
      setMessageVariant("error");
      setMessage(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(null), 4000);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-[min(96vw,56rem)] max-h-[90vh] gap-0 p-0 flex flex-col overflow-hidden"
        aria-describedby={undefined}
      >
        <DialogHeader className="px-4 py-3 border-b shrink-0">
          <DialogTitle className="text-base">Maintain Departments</DialogTitle>
        </DialogHeader>

        <div className="flex flex-wrap gap-1 px-3 py-2 border-b bg-muted/30 shrink-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 gap-1 text-xs"
            onClick={handleNew}
            disabled={saving}
          >
            <FilePlus2 className="h-3.5 w-3.5" />
            New
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 gap-1 text-xs"
            onClick={handleSave}
            disabled={saving || loading}
          >
            {saving ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Save className="h-3.5 w-3.5" />
            )}
            Save
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 gap-1 text-xs text-destructive"
            onClick={handleDelete}
            disabled={!selectedId || saving || loading}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 gap-1 text-xs"
            onClick={() => refresh()}
            disabled={loading || saving}
          >
            <RefreshCw
              className={cn("h-3.5 w-3.5", loading && "animate-spin")}
            />
            Refresh
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 gap-1 text-xs ml-auto"
            onClick={() => onOpenChange(false)}
          >
            <XCircle className="h-3.5 w-3.5" />
            Close
          </Button>
        </div>

        <div className="flex flex-1 min-h-0 flex-col md:flex-row">
          <div className="md:w-[220px] shrink-0 border-b md:border-b-0 md:border-r p-3 space-y-2 bg-muted/10">
            <div className="space-y-0.5">
              <Label className="text-[10px]">Campus</Label>
              <Select
                value={form.campus_id || NONE}
                onValueChange={(v) =>
                  setForm((s) => ({
                    ...s,
                    campus_id: v === NONE ? "" : v,
                    college_id: "",
                  }))
                }
              >
                <SelectTrigger className="h-7 text-xs">
                  <SelectValue placeholder="Select campus" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>—</SelectItem>
                  {campuses.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {campusLabel(c)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-0.5">
              <Label className="text-[10px]">College</Label>
              <Select
                value={form.college_id || NONE}
                onValueChange={(v) =>
                  setForm((s) => ({
                    ...s,
                    college_id: v === NONE ? "" : v,
                  }))
                }
                disabled={!form.campus_id}
              >
                <SelectTrigger className="h-7 text-xs">
                  <SelectValue placeholder="—" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>—</SelectItem>
                  {collegesForCampus.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.college_code} — {c.college_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-0.5">
              <Label className="text-[10px]">Dept. code</Label>
              <Input
                className="h-7 text-xs"
                value={form.dept_code}
                onChange={(e) =>
                  setForm((s) => ({ ...s, dept_code: e.target.value }))
                }
              />
            </div>
            <div className="space-y-0.5">
              <Label className="text-[10px]">Dept. name</Label>
              <Input
                className="h-7 text-xs"
                value={form.dept_name}
                onChange={(e) =>
                  setForm((s) => ({ ...s, dept_name: e.target.value }))
                }
              />
            </div>
          </div>

          <div className="flex-1 min-h-[240px] md:min-h-[320px] flex flex-col min-w-0">
            <div className="flex-1 overflow-auto border-t md:border-t-0">
              <table className="w-full text-[10px] border-collapse">
                <thead className="sticky top-0 bg-muted/80 z-[1] border-b">
                  <tr>
                    <th className="text-left font-semibold px-2 py-1 border-r">
                      DeptCode
                    </th>
                    <th className="text-left font-semibold px-2 py-1 border-r">
                      DeptName
                    </th>
                    <th className="text-left font-semibold px-2 py-1 border-r">
                      College
                    </th>
                    <th className="text-left font-semibold px-2 py-1">
                      Campus
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {departments.map((d, idx) => (
                    <tr
                      key={d.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => selectRow(d)}
                      onKeyDown={(ev) => {
                        if (ev.key === "Enter" || ev.key === " ") {
                          ev.preventDefault();
                          selectRow(d);
                        }
                      }}
                      className={cn(
                        "cursor-pointer border-b border-border/40",
                        idx % 2 === 1 && "bg-muted/20",
                        selectedId === d.id && "bg-amber-100/80 font-medium"
                      )}
                    >
                      <td className="px-2 py-0.5 border-r font-mono">
                        {d.dept_code}
                      </td>
                      <td className="px-2 py-0.5 border-r">{d.dept_name}</td>
                      <td className="px-2 py-0.5 border-r truncate max-w-[120px]">
                        {d.college_code ?? d.college_name ?? "—"}
                      </td>
                      <td className="px-2 py-0.5 truncate max-w-[100px]">
                        {d.campus_acronym ?? d.campus_name ?? "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div
              className={cn(
                "px-3 py-1.5 text-[11px] border-t shrink-0",
                messageVariant === "error"
                  ? "text-destructive"
                  : "text-muted-foreground"
              )}
            >
              {message ??
                `Total record/s: ${departments.length}${loading ? " (loading…)" : ""}`}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
