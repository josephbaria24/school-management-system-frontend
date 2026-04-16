"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RefreshCw, Save, Trash2, FilePlus2, XCircle, FolderOpen } from "lucide-react";
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

  useEffect(() => {
    loadAll();
  }, [loadAll]);

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

  const handleNew = () => {
    setSelectedId(null);
    setForm({ id_text: "", religion_name: "", short_name: "" });
  };

  const handleSave = async () => {
    const religion_name = form.religion_name.trim();
    if (!religion_name) {
      toast({
        title: "Validation error",
        description: "Religion name is required.",
        variant: "destructive",
      });
      return;
    }
    setSaving(true);
    try {
      const url = selectedId ? `${API}/api/religions/${selectedId}` : `${API}/api/religions`;
      const res = await fetch(url, {
        method: selectedId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          religion_name,
          short_name: form.short_name.trim() || null,
        }),
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(result?.error || "Save failed");
      toast({ title: "Saved", description: "Religion record saved successfully." });
      setSelectedId(result.id ?? selectedId);
      await loadAll();
    } catch (err) {
      toast({
        title: "Save failed",
        description: err instanceof Error ? err.message : "Save failed",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedId) return;
    if (!confirm("Delete this religion?")) return;
    setSaving(true);
    try {
      const res = await fetch(`${API}/api/religions/${selectedId}`, {
        method: "DELETE",
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(result?.error || "Delete failed");
      handleNew();
      await loadAll();
      toast({ title: "Deleted", description: "Religion record deleted." });
    } catch (err) {
      toast({
        title: "Delete failed",
        description: err instanceof Error ? err.message : "Delete failed",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="h-full bg-[#f2fbf7] p-1">
      <div className="w-full border-2 border-[#0e8f63] bg-white">
        <div className="flex items-center justify-between bg-gradient-to-b from-[#16b67a] to-[#0f8f62] px-2 py-1 text-white border-b border-[#0c7752]">
          <div className="flex items-center gap-2 font-bold text-[13px]">
            <FolderOpen className="h-4 w-4" />
            Maintain Religions
          </div>
          <button
            type="button"
            className="h-5 w-5 grid place-items-center rounded-sm border border-white/50 bg-red-500/80"
            aria-label="Close"
          >
            <XCircle className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="flex gap-1 p-1 border-b border-[#9ed9c1] bg-[#f2fbf7]">
          <Button type="button" variant="outline" size="sm" className="h-6 px-2 text-[10px] border-[#9ed9c1] bg-white" onClick={handleNew} disabled={saving}>
            <FilePlus2 className="h-3 w-3" />
            New
          </Button>
          <Button type="button" variant="outline" size="sm" className="h-6 px-2 text-[10px] border-[#9ed9c1] bg-white" onClick={handleSave} disabled={saving}>
            <Save className="h-3 w-3" />
            Save
          </Button>
          <Button type="button" variant="outline" size="sm" className="h-6 px-2 text-[10px] border-[#9ed9c1] bg-white" onClick={handleDelete} disabled={saving || !selectedId}>
            <Trash2 className="h-3 w-3" />
            Delete
          </Button>
          <Button type="button" variant="outline" size="sm" className="h-6 px-2 text-[10px] border-[#9ed9c1] bg-white" onClick={loadAll} disabled={saving || loading}>
            <RefreshCw className={cn("h-3 w-3", loading && "animate-spin")} />
            Refresh
          </Button>
          <Button type="button" variant="outline" size="sm" className="h-6 px-2 text-[10px] border-[#9ed9c1] bg-white" disabled>
            <XCircle className="h-3 w-3" />
            Close
          </Button>
        </div>

        <div className="p-2">
          <div className="w-[430px] border border-[#79b898] bg-white mb-2">
            <div className="px-2 py-0.5 text-[10px] font-bold bg-[#fff6cc] border-b border-[#d6c37a] w-fit">
              General
            </div>
            <div className="p-2 space-y-1.5">
              <div className="flex items-center gap-2">
                <Label className="w-28 text-right text-[11px]">Religion ID</Label>
                <Input className="h-6 text-[11px] w-[160px]" value={form.id_text} readOnly />
              </div>
              <div className="flex items-center gap-2">
                <Label className="w-28 text-right text-[11px]">Religion Name</Label>
                <Input className="h-6 text-[11px] w-[250px]" value={form.religion_name} onChange={(e) => setForm((s) => ({ ...s, religion_name: e.target.value }))} />
              </div>
              <div className="flex items-center gap-2">
                <Label className="w-28 text-right text-[11px]">Short Name</Label>
                <Input className="h-6 text-[11px] w-[180px]" value={form.short_name} onChange={(e) => setForm((s) => ({ ...s, short_name: e.target.value }))} />
              </div>
            </div>
          </div>

          <div className="border border-[#79b898] bg-white">
            <div className="grid grid-cols-12 bg-gradient-to-b from-[#6ec79b] to-[#2f9b68] text-white text-[10px] font-bold uppercase">
              <div className="col-span-2 px-2 py-1 border-r border-white/35">Code</div>
              <div className="col-span-6 px-2 py-1 border-r border-white/35">Name / Description</div>
              <div className="col-span-4 px-2 py-1">Short Name</div>
            </div>
            <div className="max-h-[420px] overflow-auto">
              {rows.map((r, idx) => (
                <button
                  type="button"
                  key={r.id}
                  onClick={() => setSelectedId(r.id)}
                  className={cn(
                    "w-full grid grid-cols-12 text-left text-[11px] border-b border-[#cfe6da]",
                    idx % 2 ? "bg-[#f8fdf9]" : "bg-white",
                    selectedId === r.id && "bg-[#d9f3e5] font-medium"
                  )}
                >
                  <div className="col-span-2 px-2 py-0.5 border-r border-[#d8ebdf]">{r.id}</div>
                  <div className="col-span-6 px-2 py-0.5 border-r border-[#d8ebdf] truncate">{r.religion_name}</div>
                  <div className="col-span-4 px-2 py-0.5 truncate">{r.short_name ?? ""}</div>
                </button>
              ))}
            </div>
            <div className="px-2 py-1 text-[11px] font-bold border-t border-[#79b898] text-[#c00]">
              {`TOTAL RECORD: ${rows.length}`}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

