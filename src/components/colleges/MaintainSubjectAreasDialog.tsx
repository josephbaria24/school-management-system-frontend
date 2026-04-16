"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const API = process.env.NEXT_PUBLIC_API_URL;

export type SubjectAreaRow = {
  id: number;
  area_code: number;
  area_name: string;
  short_name: string | null;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChanged?: () => void;
};

export function MaintainSubjectAreasDialog({ open, onOpenChange, onChanged }: Props) {
  const [rows, setRows] = useState<SubjectAreaRow[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [areaCode, setAreaCode] = useState("");
  const [areaName, setAreaName] = useState("");
  const [shortName, setShortName] = useState("");

  const load = useCallback(async () => {
    if (!API) return;
    try {
      const res = await fetch(`${API}/api/subject-areas`);
      if (!res.ok) return;
      setRows((await res.json()) as SubjectAreaRow[]);
    } catch {
      // noop
    }
  }, []);

  useEffect(() => {
    if (open) void load();
  }, [open, load]);

  const applyRow = (r: SubjectAreaRow | null) => {
    if (!r) {
      setSelectedId(null);
      setAreaCode("");
      setAreaName("");
      setShortName("");
      return;
    }
    setSelectedId(r.id);
    setAreaCode(String(r.area_code));
    setAreaName(r.area_name);
    setShortName(r.short_name ?? "");
  };

  const nextCode = () => {
    if (rows.length === 0) return "1";
    const max = Math.max(...rows.map((x) => x.area_code), 0);
    return String(max + 1);
  };

  const newRecord = () => {
    setSelectedId(null);
    setAreaCode(nextCode());
    setAreaName("");
    setShortName("");
  };

  const save = async () => {
    if (!API) return;
    const code = parseInt(areaCode, 10);
    const name = areaName.trim();
    if (!Number.isFinite(code)) {
      toast({ title: "Validation", description: "Subject area ID (code) is required.", variant: "destructive" });
      return;
    }
    if (!name) {
      toast({ title: "Validation", description: "Subject area name is required.", variant: "destructive" });
      return;
    }
    const body = {
      area_code: code,
      area_name: name,
      short_name: shortName.trim() || null,
    };
    try {
      const url = selectedId ? `${API}/api/subject-areas/${selectedId}` : `${API}/api/subject-areas`;
      const res = await fetch(url, {
        method: selectedId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(result?.error || "Save failed");
      toast({ title: "Saved", description: "Subject area saved." });
      await load();
      onChanged?.();
      if (result?.id) applyRow(result as SubjectAreaRow);
    } catch (e) {
      toast({
        title: "Save failed",
        description: e instanceof Error ? e.message : "Failed to save",
        variant: "destructive",
      });
    }
  };

  const remove = async () => {
    if (!API || !selectedId) return;
    try {
      const res = await fetch(`${API}/api/subject-areas/${selectedId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      toast({ title: "Deleted", description: "Subject area removed." });
      newRecord();
      await load();
      onChanged?.();
    } catch {
      toast({ title: "Delete failed", variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-3xl gap-0 overflow-hidden border-[#79b898] bg-[#f8fdf9] p-0 sm:rounded-md"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader className="border-b border-[#9ed9c1] bg-[#f0faf4] px-3 py-2">
          <DialogTitle className="text-left text-[13px] font-bold text-[#1f5e45]">
            Maintain Subject Areas
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-wrap gap-1 border-b border-[#d4e8dc] bg-white px-2 py-1.5">
          <Button type="button" variant="outline" size="sm" className="h-7 text-[11px]" onClick={newRecord}>
            New
          </Button>
          <Button type="button" variant="outline" size="sm" className="h-7 text-[11px]" onClick={() => void save()}>
            Save
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 text-[11px] text-red-700 hover:text-red-800"
            onClick={() => void remove()}
            disabled={!selectedId}
          >
            Delete
          </Button>
          <Button type="button" variant="outline" size="sm" className="h-7 text-[11px]" onClick={() => void load()}>
            Refresh
          </Button>
          <Button type="button" variant="outline" size="sm" className="h-7 text-[11px] ml-auto" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>

        <div className="space-y-2 bg-white px-3 py-2">
          <div className="text-[11px] font-semibold text-[#1f5e45]">General</div>
          <div className="grid grid-cols-12 gap-2 items-center text-[12px]">
            <Label className="col-span-3">Subject Area ID</Label>
            <Input
              className="col-span-2 h-7 text-[12px]"
              value={areaCode}
              onChange={(e) => setAreaCode(e.target.value)}
            />
            <Label className="col-span-2 text-right">Subject Area Name</Label>
            <Input
              className="col-span-5 h-7 text-[12px]"
              value={areaName}
              onChange={(e) => setAreaName(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-12 gap-2 items-center text-[12px]">
            <Label className="col-span-3">Short Name</Label>
            <Input
              className="col-span-9 h-7 text-[12px]"
              value={shortName}
              onChange={(e) => setShortName(e.target.value)}
            />
          </div>
        </div>

        <div className="border-t border-[#79b898] bg-white">
          <div className="grid grid-cols-12 bg-gradient-to-b from-[#6ec79b] to-[#2f9b68] text-[11px] font-bold uppercase text-white">
            <div className="col-span-2 border-r border-white/30 px-2 py-1">Code</div>
            <div className="col-span-8 border-r border-white/30 px-2 py-1">Name / Description</div>
            <div className="col-span-2 px-2 py-1">Short Name</div>
          </div>
          <div className="max-h-[220px] overflow-auto">
            {rows.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => applyRow(r)}
                className={cn(
                  "grid w-full grid-cols-12 border-b border-[#d4e8dc] text-left text-[12px] hover:bg-[#e7f8ef]",
                  selectedId === r.id && "bg-[#d9f3e5]"
                )}
              >
                <div className="col-span-2 border-r border-[#d4e8dc] px-2 py-1">{r.area_code}</div>
                <div className="col-span-8 border-r border-[#d4e8dc] px-2 py-1">{r.area_name}</div>
                <div className="col-span-2 px-2 py-1">{r.short_name ?? ""}</div>
              </button>
            ))}
          </div>
          <div className="border-t border-[#79b898] px-2 py-1 text-[12px] font-semibold text-red-600">
            TOTAL RECORD: {rows.length}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
