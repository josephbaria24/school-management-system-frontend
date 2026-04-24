"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Building2,
  FilePlus2,
  Save,
  Trash2,
  Pencil,
  Image as ImageIcon,
  Upload,
  Loader2,
  GraduationCap,
  BookMarked,
  Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AcademicProgramsTab } from "@/components/setup/AcademicProgramsTab";
import { ChedMajorDisciplinesTab } from "@/components/setup/ChedMajorDisciplinesTab";
import { MajorDisciplineGroupsTab } from "@/components/setup/MajorDisciplineGroupsTab";
import { uploadImageToCloudinary } from "@/lib/uploadImage";
import { toast } from "@/hooks/use-toast";

const API = process.env.NEXT_PUBLIC_API_URL;

type Campus = {
  id: number;
  acronym: string;
  campus_name: string | null;
};

type InstitutionHead = { id: number; full_name: string };

type CollegeRow = {
  id: number;
  campus_id: number;
  college_code: string;
  college_name: string;
  dean_head_id: number | null;
  dean_name?: string | null;
  number_code_1: string | null;
  number_code_2: string | null;
  logo_url: string | null;
  is_inactive: boolean;
};

const emptyForm = {
  campus_id: "" as string | number,
  college_code: "",
  college_name: "",
  dean_head_id: "" as string | number,
  number_code_1: "",
  number_code_2: "",
  logo_url: "",
  is_inactive: false,
};

export default function CollegesDepartmentsInstitutesPage() {
  const [tab, setTab] = useState("colleges");
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [heads, setHeads] = useState<InstitutionHead[]>([]);
  const [rows, setRows] = useState<CollegeRow[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const collegeLogoInputRef = useRef<HTMLInputElement>(null);
  const [logoUploading, setLogoUploading] = useState(false);

  const clearFieldError = (key: string) => {
    setFieldErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const loadHeads = useCallback(async () => {
    const res = await fetch(`${API}/api/institution-heads`);
    if (!res.ok) return;
    setHeads(await res.json());
  }, []);

  const campusIdNum = form.campus_id ? parseInt(String(form.campus_id), 10) : NaN;

  const loadColleges = useCallback(async () => {
    if (!Number.isFinite(campusIdNum)) {
      setRows([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(
        `${API}/api/colleges?campus_id=${encodeURIComponent(String(campusIdNum))}`
      );
      if (!res.ok) throw new Error("Failed to load colleges");
      setRows(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [campusIdNum]);

  useEffect(() => {
    (async () => {
      const res = await fetch(`${API}/api/campuses`);
      if (!res.ok) return;
      const data: Campus[] = await res.json();
      setCampuses(data);
      setForm((f) => {
        if (f.campus_id !== "" && f.campus_id !== undefined) return f;
        if (data.length === 0) return f;
        return { ...f, campus_id: String(data[0].id) };
      });
    })();
    loadHeads();
  }, [loadHeads]);

  useEffect(() => {
    loadColleges();
  }, [loadColleges]);

  const selected = rows.find((r) => r.id === selectedId) ?? null;

  useEffect(() => {
    if (!selected) return;
    setForm({
      campus_id: String(selected.campus_id),
      college_code: selected.college_code,
      college_name: selected.college_name,
      dean_head_id: selected.dean_head_id
        ? String(selected.dean_head_id)
        : "",
      number_code_1: selected.number_code_1 ?? "",
      number_code_2: selected.number_code_2 ?? "",
      logo_url: selected.logo_url ?? "",
      is_inactive: !!selected.is_inactive,
    });
  }, [selected]);

  const resetNew = () => {
    setSelectedId(null);
    setFieldErrors({});
    setForm({
      ...emptyForm,
      campus_id: form.campus_id || (campuses[0] ? String(campuses[0].id) : ""),
    });
  };

  const handleSave = async () => {
    const errors: Record<string, string> = {};
    const cid = parseInt(String(form.campus_id), 10);
    if (campuses.length === 0) {
      errors.campus_id = "No campuses exist yet. Add one under Academic Institution → Campus.";
    } else if (!Number.isFinite(cid)) {
      errors.campus_id = "Select a campus.";
    }
    if (!form.college_code.trim()) {
      errors.college_code = "College code is required.";
    }
    if (!form.college_name.trim()) {
      errors.college_name = "College name is required.";
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
        campus_id: cid,
        college_code: form.college_code.trim(),
        college_name: form.college_name.trim(),
        dean_head_id: form.dean_head_id
          ? parseInt(String(form.dean_head_id), 10)
          : null,
        number_code_1: form.number_code_1 || null,
        number_code_2: form.number_code_2 || null,
        logo_url: form.logo_url || null,
        is_inactive: form.is_inactive,
      };
      const url = selectedId
        ? `${API}/api/colleges/${selectedId}`
        : `${API}/api/colleges`;
      const method = selectedId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(result?.error || "Save failed");
      setSelectedId(result.id);
      if (typeof result.logo_url === "string" && result.logo_url) {
        setForm((f) => ({ ...f, logo_url: result.logo_url }));
      }
      toast({ title: "Saved", description: "College record saved successfully." });
      await loadColleges();
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
      const res = await fetch(`${API}/api/colleges/${selectedId}`, {
        method: "DELETE",
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(result?.error || "Delete failed");
      resetNew();
      await loadColleges();
      toast({ title: "Deleted", description: "College record deleted." });
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

  const campusLabel = (c: Campus) =>
    `${c.acronym}${c.campus_name ? ` — ${c.campus_name}` : ""}`;

  return (
    <div className="h-full bg-background relative overflow-x-hidden">
      <div className="w-full px-2 pt-2 pb-4">
        <div className="mb-6 space-y-1">
          <h1 className="text-base font-bold tracking-tight uppercase">
            Colleges | Academic Programs | Major Studies
          </h1>
          <p className="text-sm text-muted-foreground">
            Use this module to create colleges, configure academic programs, major
            disciplines, and more.
          </p>
        </div>

        <Card className="w-full overflow-hidden rounded-2xl bg-background premium-card">
          <div className="bg-muted/5 text-foreground px-4 py-3 flex items-center justify-between border-b border-border/60">
            <div className="flex items-center gap-2">
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-600 text-white shadow-sm">
                <Building2 className="h-4 w-4" />
              </div>
              <div className="leading-tight">
                <div className="text-sm font-semibold tracking-tight">
                  Colleges / Departments / Institutes
                </div>
                <div className="text-xs text-muted-foreground">
                  Setup manager • Colleges, programs, and majors
                </div>
              </div>
            </div>
            <div />
          </div>

          <div className="p-4 bg-background">
            <Tabs value={tab} onValueChange={setTab} className="w-full">
              <TabsList className="w-full flex flex-wrap h-auto gap-2 bg-muted/30 p-1.5 rounded-2xl mb-4 border border-border/60">
                <TabsTrigger
                  value="colleges"
                  className="premium-tab rounded-xl px-3 py-2 text-[11px] font-semibold data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-foreground"
                >
                  Colleges/Departments/Institutes
                </TabsTrigger>
                <TabsTrigger
                  value="programs"
                  className="premium-tab rounded-xl px-3 py-2 text-[11px] font-semibold data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-foreground gap-2 flex items-center"
                >
                  <GraduationCap className="h-3 w-3 shrink-0 opacity-80" />
                  Academic Programs
                </TabsTrigger>
                <TabsTrigger
                  value="ched"
                  className="premium-tab rounded-xl px-3 py-2 text-[11px] font-semibold data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-foreground gap-2 flex items-center"
                >
                  <BookMarked className="h-3 w-3 shrink-0 opacity-80" />
                  CHED Coded — Major Disciplines
                </TabsTrigger>
                <TabsTrigger
                  value="groups"
                  className="premium-tab rounded-xl px-3 py-2 text-[11px] font-semibold data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-foreground gap-2 flex items-center"
                >
                  <Layers className="h-3 w-3 shrink-0 opacity-80" />
                  Major Discipline Groups
                </TabsTrigger>
              </TabsList>

              <TabsContent value="colleges" className="mt-0 outline-none">
                <div className="grid grid-cols-12 gap-3 h-[560px]">
                  {/* Left form — scrollable */}
                  <div className="col-span-5 flex flex-col border border-border/60 rounded-2xl overflow-hidden bg-card shadow-sm h-full min-h-0">
                    <div className="bg-muted/5 text-foreground px-3 py-2 text-[11px] font-semibold tracking-tight shrink-0 border-b border-border/60">
                      College / Departments / Institutes Information
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
                      <div className="space-y-1">
                        <Label className="text-xs">Campus</Label>
                        <Select
                          value={String(form.campus_id)}
                          onValueChange={(v) => {
                            clearFieldError("campus_id");
                            setSelectedId(null);
                            setForm({
                              ...emptyForm,
                              campus_id: v,
                            });
                          }}
                        >
                          <SelectTrigger
                            className={cn(
                              "h-9 rounded-xl text-xs border-border/60 shadow-sm",
                              fieldErrors.campus_id &&
                                "border-destructive ring-1 ring-destructive/30"
                            )}
                          >
                            <SelectValue placeholder="Select campus" />
                          </SelectTrigger>
                          <SelectContent>
                            {campuses.map((c) => (
                              <SelectItem key={c.id} value={String(c.id)}>
                                {campusLabel(c)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {fieldErrors.campus_id && (
                          <p className="text-[10px] text-destructive">
                            {fieldErrors.campus_id}
                          </p>
                        )}
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">College Code</Label>
                        <Input
                          className={cn(
                            "h-9 rounded-xl text-sm uppercase border-border/60 shadow-sm",
                            fieldErrors.college_code &&
                              "border-destructive ring-1 ring-destructive/30"
                          )}
                          value={form.college_code}
                          onChange={(e) => {
                            clearFieldError("college_code");
                            setForm((f) => ({
                              ...f,
                              college_code: e.target.value,
                            }));
                          }}
                        />
                        {fieldErrors.college_code && (
                          <p className="text-[10px] text-destructive">
                            {fieldErrors.college_code}
                          </p>
                        )}
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">College Name</Label>
                        <Input
                          className={cn(
                            "h-9 rounded-xl text-sm border-border/60 shadow-sm",
                            fieldErrors.college_name &&
                              "border-destructive ring-1 ring-destructive/30"
                          )}
                          value={form.college_name}
                          onChange={(e) => {
                            clearFieldError("college_name");
                            setForm((f) => ({
                              ...f,
                              college_name: e.target.value,
                            }));
                          }}
                        />
                        {fieldErrors.college_name && (
                          <p className="text-[10px] text-destructive">
                            {fieldErrors.college_name}
                          </p>
                        )}
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">College Dean</Label>
                        <Select
                          value={form.dean_head_id ? String(form.dean_head_id) : "none"}
                          onValueChange={(v) =>
                            setForm((f) => ({
                              ...f,
                              dean_head_id: v === "none" ? "" : v,
                            }))
                          }
                        >
                          <SelectTrigger className="h-9 rounded-xl text-xs border-border/60 shadow-sm">
                            <SelectValue placeholder="Select dean" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">— None —</SelectItem>
                            {heads.map((h) => (
                              <SelectItem key={h.id} value={String(h.id)}>
                                {h.full_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label className="text-xs">Number Code</Label>
                          <Input
                            className="h-9 rounded-xl text-sm border-border/60 shadow-sm"
                            value={form.number_code_1}
                            onChange={(e) =>
                              setForm((f) => ({
                                ...f,
                                number_code_1: e.target.value,
                              }))
                            }
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs opacity-0">.</Label>
                          <Input
                            className="h-9 rounded-xl text-sm border-border/60 shadow-sm"
                            value={form.number_code_2}
                            onChange={(e) =>
                              setForm((f) => ({
                                ...f,
                                number_code_2: e.target.value,
                              }))
                            }
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">College Logo</Label>
                        <input
                          ref={collegeLogoInputRef}
                          type="file"
                          accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
                          className="sr-only"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            e.target.value = "";
                            if (!file) return;
                            setLogoUploading(true);
                            try {
                              const { url } = await uploadImageToCloudinary(
                                file,
                                "sms/college-logos"
                              );
                              setForm((f) => ({ ...f, logo_url: url }));
                            } catch (err) {
                              toast({
                                title: "Logo upload failed",
                                description:
                                  err instanceof Error
                                    ? err.message
                                    : "Logo upload failed",
                                variant: "destructive",
                              });
                            } finally {
                              setLogoUploading(false);
                            }
                          }}
                        />
                        <div className="flex flex-col items-start gap-2">
                          <div className="w-36 h-36 border border-dashed border-border/70 rounded-2xl bg-background/60 flex items-center justify-center overflow-hidden shadow-sm">
                            {form.logo_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={form.logo_url}
                                alt="College logo"
                                className="max-w-full max-h-full object-contain"
                              />
                            ) : (
                              <div className="text-muted-foreground flex flex-col items-center gap-1">
                                <ImageIcon className="h-8 w-8" />
                                <span className="text-[11px] font-semibold text-muted-foreground">
                                  No logo
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="flex gap-2 flex-wrap">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-9 rounded-xl text-xs font-semibold gap-2"
                              disabled={logoUploading}
                              onClick={() => collegeLogoInputRef.current?.click()}
                            >
                              {logoUploading ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <Upload className="h-3 w-3" />
                              )}
                              {logoUploading ? "Uploading…" : "Upload"}
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              className="h-9 w-9 rounded-xl"
                              disabled={logoUploading}
                              title="Paste image URL"
                              onClick={() => {
                                const url = window.prompt(
                                  "Logo image URL:",
                                  form.logo_url || ""
                                );
                                if (url !== null && url.trim())
                                  setForm((f) => ({
                                    ...f,
                                    logo_url: url.trim(),
                                  }));
                              }}
                            >
                              <Pencil className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/60">
                        <Label
                          htmlFor="inactive"
                          className="text-xs text-destructive cursor-pointer"
                        >
                          In-Active
                        </Label>
                        <Checkbox
                          id="inactive"
                          checked={form.is_inactive}
                          onCheckedChange={(v) =>
                            setForm((f) => ({ ...f, is_inactive: !!v }))
                          }
                        />
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
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-9 rounded-xl text-xs font-semibold gap-2"
                        disabled={saving || !selectedId}
                        onClick={() => selected && setSelectedId(selected.id)}
                      >
                        <Pencil className="h-3 w-3" />
                        Edit
                      </Button>
                    </div>
                  </div>

                  {/* Right table */}
                  <div className="col-span-7 flex flex-col border border-border/60 rounded-2xl overflow-hidden bg-card shadow-sm h-full min-h-0">
                    <div className="grid grid-cols-12 bg-muted/50 text-[11px] font-semibold text-muted-foreground shrink-0 border-b border-border/60">
                      <div className="col-span-2 px-2 py-1 border-r border-white/30">
                        Code
                      </div>
                      <div className="col-span-5 px-2 py-1 border-r border-white/30">
                        College Name
                      </div>
                      <div className="col-span-2 px-2 py-1 border-r border-white/30 text-center">
                        Dean ID
                      </div>
                      <div className="col-span-3 px-2 py-1">College Dean</div>
                    </div>
                    <div className="flex-1 overflow-auto min-h-0">
                      {loading ? (
                        <div className="p-4 text-xs text-muted-foreground">
                          Loading…
                        </div>
                      ) : rows.length === 0 ? (
                        <div className="p-4 text-xs text-muted-foreground italic">
                          No colleges for this campus.
                        </div>
                      ) : (
                        rows.map((row, idx) => (
                          <button
                            key={row.id}
                            type="button"
                            onClick={() => setSelectedId(row.id)}
                            className={cn(
                              "w-full grid grid-cols-12 text-left text-xs border-b border-border/40 transition-colors",
                              selectedId === row.id
                                ? "bg-emerald-500/10 font-medium"
                                : idx % 2 === 0
                                  ? "bg-background hover:bg-muted/40"
                                  : "bg-muted/10 hover:bg-muted/40"
                            )}
                          >
                            <div className="col-span-2 px-2 py-1.5 border-r border-border/40 truncate">
                              {row.college_code}
                            </div>
                            <div className="col-span-5 px-2 py-1.5 border-r border-border/40 truncate">
                              {row.college_name}
                            </div>
                            <div className="col-span-2 px-2 py-1.5 border-r border-border/40 text-center">
                              {row.dean_head_id ?? "—"}
                            </div>
                            <div className="col-span-3 px-2 py-1.5 truncate">
                              {row.dean_name ?? "—"}
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                    <div className="px-2 py-1.5 border-t border-border bg-muted/40 text-[10px] font-bold uppercase shrink-0">
                      Total number of record(s): {rows.length}
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="programs" className="mt-0 min-h-[200px]">
                <AcademicProgramsTab />
              </TabsContent>
              <TabsContent value="ched" className="mt-0 min-h-[200px]">
                <ChedMajorDisciplinesTab />
              </TabsContent>
              <TabsContent value="groups" className="mt-0 min-h-[200px]">
                <MajorDisciplineGroupsTab />
              </TabsContent>
            </Tabs>
          </div>
        </Card>
      </div>
    </div>
  );
}
