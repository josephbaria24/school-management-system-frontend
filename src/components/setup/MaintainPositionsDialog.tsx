"use client";

import { useCallback, useEffect, useState } from "react";
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
  FilePlus2,
  Loader2,
  RefreshCw,
  Save,
  Trash2,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

const API = process.env.NEXT_PUBLIC_API_URL;

export type PositionRow = {
  id: number;
  position_code: string;
  position_title: string;
  short_name: string | null;
};

function emptyForm() {
  return {
    position_code: "",
    position_title: "",
    short_name: "",
  };
}

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: () => void;
};

export function MaintainPositionsDialog({
  open,
  onOpenChange,
  onSaved,
}: Props) {
  const [positions, setPositions] = useState<PositionRow[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageVariant, setMessageVariant] = useState<"info" | "error">("info");

  const loadPositions = useCallback(async () => {
    const res = await fetch(`${API}/api/positions`);
    if (!res.ok) return;
    setPositions(await res.json());
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      await loadPositions();
    } finally {
      setLoading(false);
    }
  }, [loadPositions]);

  useEffect(() => {
    if (!open) return;
    refresh();
  }, [open, refresh]);

  const selectRow = (p: PositionRow) => {
    setSelectedId(p.id);
    setForm({
      position_code: p.position_code,
      position_title: p.position_title,
      short_name: p.short_name ?? "",
    });
    setMessage(null);
  };

  const handleNew = () => {
    setSelectedId(null);
    setForm(emptyForm());
    setMessage(null);
  };

  const handleSave = async () => {
    const position_code = form.position_code.trim();
    const position_title = form.position_title.trim();
    if (!position_code || !position_title) {
      setMessageVariant("error");
      setMessage("Position code and position title are required.");
      setTimeout(() => setMessage(null), 4000);
      return;
    }
    const short_name = form.short_name.trim() || null;
    setSaving(true);
    setMessage(null);
    try {
      const url = selectedId
        ? `${API}/api/positions/${selectedId}`
        : `${API}/api/positions`;
      const res = await fetch(url, {
        method: selectedId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          position_code,
          position_title,
          short_name,
        }),
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(result?.error || "Save failed");
      setMessageVariant("info");
      setMessage("Saved.");
      if (result?.id) setSelectedId(result.id);
      await loadPositions();
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
    if (!confirm("Delete this position?")) return;
    setSaving(true);
    try {
      const res = await fetch(`${API}/api/positions/${selectedId}`, {
        method: "DELETE",
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(result?.error || "Delete failed");
      handleNew();
      await loadPositions();
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
        className="max-w-[min(96vw,48rem)] max-h-[90vh] gap-0 p-0 flex flex-col overflow-hidden"
        aria-describedby={undefined}
      >
        <DialogHeader className="px-4 py-3 border-b shrink-0">
          <DialogTitle className="text-base">Positions</DialogTitle>
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
            <div className="rounded-sm border bg-background/80 px-2 py-1 text-[10px] font-medium text-muted-foreground">
              General
            </div>
            <div className="space-y-0.5">
              <Label className="text-[10px]">Position code</Label>
              <Input
                className="h-7 text-xs font-mono uppercase"
                value={form.position_code}
                onChange={(e) =>
                  setForm((s) => ({ ...s, position_code: e.target.value }))
                }
              />
            </div>
            <div className="space-y-0.5">
              <Label className="text-[10px]">Position title</Label>
              <Input
                className="h-7 text-xs"
                value={form.position_title}
                onChange={(e) =>
                  setForm((s) => ({ ...s, position_title: e.target.value }))
                }
              />
            </div>
            <div className="space-y-0.5">
              <Label className="text-[10px]">Short name</Label>
              <Input
                className="h-7 text-xs"
                value={form.short_name}
                onChange={(e) =>
                  setForm((s) => ({ ...s, short_name: e.target.value }))
                }
              />
            </div>
          </div>

          <div className="flex-1 min-h-[240px] md:min-h-[300px] flex flex-col min-w-0">
            <div className="flex-1 overflow-auto border-t md:border-t-0">
              <table className="w-full text-[10px] border-collapse">
                <thead className="sticky top-0 bg-muted/80 z-[1] border-b">
                  <tr>
                    <th className="text-left font-semibold px-2 py-1 border-r">
                      Code
                    </th>
                    <th className="text-left font-semibold px-2 py-1 border-r">
                      Name / description
                    </th>
                    <th className="text-left font-semibold px-2 py-1">
                      Short name
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {positions.map((p, idx) => (
                    <tr
                      key={p.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => selectRow(p)}
                      onKeyDown={(ev) => {
                        if (ev.key === "Enter" || ev.key === " ") {
                          ev.preventDefault();
                          selectRow(p);
                        }
                      }}
                      className={cn(
                        "cursor-pointer border-b border-border/40",
                        idx % 2 === 1 && "bg-muted/20",
                        selectedId === p.id && "bg-amber-100/80 font-medium"
                      )}
                    >
                      <td className="px-2 py-0.5 border-r font-mono">
                        {p.position_code}
                      </td>
                      <td className="px-2 py-0.5 border-r">{p.position_title}</td>
                      <td className="px-2 py-0.5">{p.short_name ?? ""}</td>
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
              {message != null
                ? message
                : `Total record/s: ${positions.length}${loading ? " (loading…)" : ""}`}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
