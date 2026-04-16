"use client";

import { useCallback, useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FilePlus2, HandCoins, Plus, Save, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

const API = process.env.NEXT_PUBLIC_API_URL;

type GroupRow = {
  id: number;
  group_code: string;
  group_name: string;
};

type ProviderRow = {
  id: number;
  provider_code: string;
  provider_name: string;
  short_name: string | null;
  acronym: string | null;
  remarks: string | null;
  group_id: number | null;
  is_inactive: boolean;
  auto_credit_financial_aid: boolean;
  group_code?: string | null;
  group_name?: string | null;
};

const emptyForm = {
  provider_code: "",
  provider_name: "",
  short_name: "",
  acronym: "",
  remarks: "",
  group_id: "" as string | number,
  is_inactive: false,
  auto_credit_financial_aid: false,
};

export default function ScholarshipProvidersPage() {
  const [groups, setGroups] = useState<GroupRow[]>([]);
  const [rows, setRows] = useState<ProviderRow[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [groupDialogOpen, setGroupDialogOpen] = useState(false);
  const [newGroup, setNewGroup] = useState({ group_code: "", group_name: "" });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [newGroupErrors, setNewGroupErrors] = useState<Record<string, string>>(
    {}
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
    const res = await fetch(`${API}/api/scholarship-provider-groups`);
    if (!res.ok) return;
    setGroups(await res.json());
  }, []);

  const loadProviders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/scholarship-providers`);
      if (!res.ok) throw new Error("load");
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
    loadProviders();
  }, [loadProviders]);

  const selected = rows.find((r) => r.id === selectedId) ?? null;

  useEffect(() => {
    if (!selected) return;
    setForm({
      provider_code: selected.provider_code,
      provider_name: selected.provider_name,
      short_name: selected.short_name ?? "",
      acronym: selected.acronym ?? "",
      remarks: selected.remarks ?? "",
      group_id: selected.group_id ? String(selected.group_id) : "",
      is_inactive: !!selected.is_inactive,
      auto_credit_financial_aid: !!selected.auto_credit_financial_aid,
    });
  }, [selected]);

  const resetNew = () => {
    setSelectedId(null);
    setFieldErrors({});
    setForm(emptyForm);
  };

  const handleSave = async () => {
    const errors: Record<string, string> = {};
    if (!form.provider_code.trim()) {
      errors.provider_code = "Provider code is required.";
    }
    if (!form.provider_name.trim()) {
      errors.provider_name = "Provider name is required.";
    }
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      toast({
        title: "Validation error",
        description: "Please complete the required fields below.",
        variant: "destructive",
      });
      return;
    }
    setFieldErrors({});
    setSaving(true);
    try {
      const body = {
        provider_code: form.provider_code.trim(),
        provider_name: form.provider_name.trim(),
        short_name: form.short_name.trim() || null,
        acronym: form.acronym.trim() || null,
        remarks: form.remarks.trim() || null,
        group_id: form.group_id ? parseInt(String(form.group_id), 10) : null,
        is_inactive: form.is_inactive,
        auto_credit_financial_aid: form.auto_credit_financial_aid,
      };
      const url = selectedId
        ? `${API}/api/scholarship-providers/${selectedId}`
        : `${API}/api/scholarship-providers`;
      const res = await fetch(url, {
        method: selectedId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(result?.error || "Save failed");
      setSelectedId(result.id);
      toast({ title: "Saved", description: "Scholarship provider saved." });
      await loadProviders();
    } catch (e) {
      toast({
        title: "Save failed",
        description: e instanceof Error ? e.message : "Save failed",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedId) return;
    setSaving(true);
    try {
      const res = await fetch(`${API}/api/scholarship-providers/${selectedId}`, {
        method: "DELETE",
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(result?.error || "Delete failed");
      resetNew();
      await loadProviders();
      toast({ title: "Deleted", description: "Scholarship provider deleted." });
    } catch (e) {
      toast({
        title: "Delete failed",
        description: e instanceof Error ? e.message : "Delete failed",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const saveNewGroup = async () => {
    const gErr: Record<string, string> = {};
    if (!newGroup.group_code.trim()) {
      gErr.group_code = "Group code is required.";
    }
    if (!newGroup.group_name.trim()) {
      gErr.group_name = "Group name is required.";
    }
    if (Object.keys(gErr).length > 0) {
      setNewGroupErrors(gErr);
      return;
    }
    setNewGroupErrors({});
    const res = await fetch(`${API}/api/scholarship-provider-groups`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        group_code: newGroup.group_code.trim(),
        group_name: newGroup.group_name.trim(),
      }),
    });
    const result = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast({
        title: "Create group failed",
        description: result?.error || "Could not add group",
        variant: "destructive",
      });
      return;
    }
    setGroupDialogOpen(false);
    setNewGroup({ group_code: "", group_name: "" });
    await loadGroups();
    setForm((f) => ({ ...f, group_id: String(result.id) }));
  };

  return (
    <div className="h-full bg-background relative overflow-x-hidden">
      <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-primary/5 to-transparent -z-10" />
      <div className="w-full px-2 pt-2 pb-4">
        <div className="mb-6 space-y-1">
          <h1 className="text-base font-bold tracking-tight uppercase">
            Scholarship providers
          </h1>
          <p className="text-sm text-muted-foreground">
            Maintain scholarship provider codes, names, groups, and financial aid
            options.
          </p>
        </div>

        <Card className="border-2 border-primary/20 shadow-2xl rounded-md overflow-hidden bg-slate-50 dark:bg-slate-900">
          <div className="bg-emerald-700 dark:bg-emerald-900 text-white px-4 py-1.5 flex items-center justify-between border-b border-primary/30">
            <div className="flex items-center gap-2">
              <div className="bg-white dark:bg-slate-100 p-0.5 rounded-sm">
                <HandCoins className="h-4 w-4 text-emerald-700 dark:text-emerald-900" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider">
                Scholarship providers
              </span>
            </div>
          </div>

          <div className="p-3 bg-white/70 dark:bg-slate-950/60">
            <div className="grid grid-cols-12 gap-3 min-h-[520px]">
              <div className="col-span-5 flex flex-col border border-border rounded-sm overflow-hidden bg-background h-full min-h-0">
                <div className="bg-emerald-600 dark:bg-emerald-800 text-white px-2 py-1.5 text-[10px] font-bold uppercase shrink-0">
                  Scholarship provider information
                </div>
                <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0">
                  <div className="space-y-1">
                    <Label className="text-xs">Code</Label>
                    <Input
                      className={cn(
                        "h-8 text-sm font-mono uppercase",
                        fieldErrors.provider_code &&
                          "border-destructive ring-1 ring-destructive/30"
                      )}
                      value={form.provider_code}
                      onChange={(e) => {
                        clearFieldError("provider_code");
                        setForm((f) => ({
                          ...f,
                          provider_code: e.target.value,
                        }));
                      }}
                    />
                    {fieldErrors.provider_code && (
                      <p className="text-[10px] text-destructive">
                        {fieldErrors.provider_code}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Provider name</Label>
                    <Input
                      className={cn(
                        "h-8 text-sm",
                        fieldErrors.provider_name &&
                          "border-destructive ring-1 ring-destructive/30"
                      )}
                      value={form.provider_name}
                      onChange={(e) => {
                        clearFieldError("provider_name");
                        setForm((f) => ({
                          ...f,
                          provider_name: e.target.value,
                        }));
                      }}
                    />
                    {fieldErrors.provider_name && (
                      <p className="text-[10px] text-destructive">
                        {fieldErrors.provider_name}
                      </p>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs">Short name</Label>
                      <Input
                        className="h-8 text-xs"
                        value={form.short_name}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, short_name: e.target.value }))
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Acronym</Label>
                      <Input
                        className="h-8 text-xs font-mono uppercase"
                        value={form.acronym}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, acronym: e.target.value }))
                        }
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <Label className="text-xs">Group</Label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 text-[10px] gap-0.5 px-1"
                        onClick={() => setGroupDialogOpen(true)}
                      >
                        <Plus className="h-3 w-3" />
                        New group
                      </Button>
                    </div>
                    <Select
                      value={
                        form.group_id !== "" && form.group_id !== undefined
                          ? String(form.group_id)
                          : "none"
                      }
                      onValueChange={(v) =>
                        setForm((f) => ({
                          ...f,
                          group_id: v === "none" ? "" : v,
                        }))
                      }
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="— None —" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">— None —</SelectItem>
                        {groups.map((g) => (
                          <SelectItem key={g.id} value={String(g.id)}>
                            {g.group_code} — {g.group_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Remarks</Label>
                    <Textarea
                      className="text-xs min-h-[100px] resize-y"
                      value={form.remarks}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, remarks: e.target.value }))
                      }
                    />
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <Checkbox
                      id="inactive"
                      checked={form.is_inactive}
                      onCheckedChange={(v) =>
                        setForm((f) => ({ ...f, is_inactive: !!v }))
                      }
                    />
                    <Label htmlFor="inactive" className="text-xs cursor-pointer">
                      Inactive
                    </Label>
                  </div>
                  <div className="flex items-center gap-2 border-t border-border pt-3">
                    <Checkbox
                      id="autocredit"
                      checked={form.auto_credit_financial_aid}
                      onCheckedChange={(v) =>
                        setForm((f) => ({
                          ...f,
                          auto_credit_financial_aid: !!v,
                        }))
                      }
                    />
                    <Label htmlFor="autocredit" className="text-xs cursor-pointer leading-snug">
                      Auto credit — financial aid
                    </Label>
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
                <div className="grid grid-cols-12 bg-emerald-600 dark:bg-emerald-800 text-white text-[10px] font-bold uppercase shrink-0">
                  <div className="col-span-1 px-1 py-1 border-r border-white/30 font-mono text-center">
                    Code
                  </div>
                  <div className="col-span-4 px-1 py-1 border-r border-white/30 truncate">
                    Provider name
                  </div>
                  <div className="col-span-1 px-1 py-1 border-r border-white/30 truncate">
                    Short
                  </div>
                  <div className="col-span-1 px-1 py-1 border-r border-white/30 font-mono text-center">
                    Acr.
                  </div>
                  <div className="col-span-2 px-1 py-1 border-r border-white/30 truncate">
                    Group
                  </div>
                  <div className="col-span-1 px-1 py-1 border-r border-white/30 text-center">
                    Inact.
                  </div>
                  <div className="col-span-2 px-1 py-1 truncate">Remarks</div>
                </div>
                <div className="flex-1 overflow-auto min-h-0">
                  {loading ? (
                    <div className="p-4 text-xs text-muted-foreground">
                      Loading…
                    </div>
                  ) : rows.length === 0 ? (
                    <div className="p-4 text-xs text-muted-foreground italic">
                      No providers yet.
                    </div>
                  ) : (
                    rows.map((row, idx) => (
                      <div
                        key={row.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => setSelectedId(row.id)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            setSelectedId(row.id);
                          }
                        }}
                        className={cn(
                          "w-full grid grid-cols-12 text-left text-[11px] border-b border-border/50 items-stretch cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ring",
                          idx % 2 === 1 && "bg-emerald-50/80 dark:bg-emerald-950/20",
                          selectedId === row.id &&
                            "bg-emerald-200/90 dark:bg-emerald-900/40 font-medium ring-1 ring-emerald-400/50"
                        )}
                      >
                        <div className="col-span-1 px-1 py-1.5 border-r border-border/40 font-mono truncate text-center">
                          {row.provider_code}
                        </div>
                        <div className="col-span-4 px-1 py-1.5 border-r border-border/40 truncate">
                          {row.provider_name}
                        </div>
                        <div className="col-span-1 px-1 py-1.5 border-r border-border/40 truncate">
                          {row.short_name ?? "—"}
                        </div>
                        <div className="col-span-1 px-1 py-1.5 border-r border-border/40 font-mono text-center truncate">
                          {row.acronym ?? "—"}
                        </div>
                        <div className="col-span-2 px-1 py-1.5 border-r border-border/40 truncate">
                          {row.group_code ?? row.group_name ?? "—"}
                        </div>
                        <div className="col-span-1 px-1 py-1.5 border-r border-border/40 flex justify-center items-center">
                          <Checkbox
                            checked={row.is_inactive}
                            disabled
                            aria-hidden
                            className="h-3.5 w-3.5 pointer-events-none opacity-100"
                          />
                        </div>
                        <div
                          className="col-span-2 px-1 py-1.5 truncate text-muted-foreground"
                          title={row.remarks ?? ""}
                        >
                          {row.remarks
                            ? row.remarks.length > 40
                              ? `${row.remarks.slice(0, 40)}…`
                              : row.remarks
                            : "—"}
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <div className="px-2 py-1.5 border-t border-border bg-muted/40 text-[10px] font-bold uppercase shrink-0">
                  Total record(s): {rows.length}
                </div>
              </div>
            </div>
          </div>
        </Card>

        <Dialog
          open={groupDialogOpen}
          onOpenChange={(open) => {
            setGroupDialogOpen(open);
            if (!open) setNewGroupErrors({});
          }}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-sm">New scholarship group</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <div className="space-y-1">
                <Label className="text-xs">Group code</Label>
                <Input
                  className={cn(
                    "h-8 text-xs font-mono",
                    newGroupErrors.group_code &&
                      "border-destructive ring-1 ring-destructive/30"
                  )}
                  value={newGroup.group_code}
                  onChange={(e) => {
                    setNewGroupErrors((er) => {
                      if (!er.group_code) return er;
                      const n = { ...er };
                      delete n.group_code;
                      return n;
                    });
                    setNewGroup((g) => ({ ...g, group_code: e.target.value }));
                  }}
                />
                {newGroupErrors.group_code && (
                  <p className="text-[10px] text-destructive">
                    {newGroupErrors.group_code}
                  </p>
                )}
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Group name</Label>
                <Input
                  className={cn(
                    "h-8 text-xs",
                    newGroupErrors.group_name &&
                      "border-destructive ring-1 ring-destructive/30"
                  )}
                  value={newGroup.group_name}
                  onChange={(e) => {
                    setNewGroupErrors((er) => {
                      if (!er.group_name) return er;
                      const n = { ...er };
                      delete n.group_name;
                      return n;
                    });
                    setNewGroup((g) => ({ ...g, group_name: e.target.value }));
                  }}
                />
                {newGroupErrors.group_name && (
                  <p className="text-[10px] text-destructive">
                    {newGroupErrors.group_name}
                  </p>
                )}
              </div>
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setGroupDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="button" size="sm" onClick={saveNewGroup}>
                Add group
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
