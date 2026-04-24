"use client";

import { ReactNode, useEffect, useState } from "react";
import { Campus, CampusPayload, emptyCampus } from "@/types/campus";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  PenSquare,
  Trash2,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Plus,
  Search,
  MapPin,
  Building2,
  Landmark,
  CreditCard,
} from "lucide-react";
import { cn } from "@/lib/utils";

const API = process.env.NEXT_PUBLIC_API_URL;

interface InlineFieldProps {
  label: string;
  children: ReactNode;
  labelWidth?: string;
}

function InlineField({ label, children, labelWidth }: InlineFieldProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-[7.5rem_1fr] items-start sm:items-center gap-1.5 sm:gap-3">
      <Label
        className={`${labelWidth || "w-auto"} text-left sm:text-right font-medium text-muted-foreground sm:pr-2 text-[11px] leading-5`}
      >
        {label}
      </Label>
      <div className="flex-1">{children}</div>
    </div>
  );
}

interface CampusInformationTabProps {
  institutionId: number | null;
}

export function CampusInformationTab({ institutionId }: CampusInformationTabProps) {
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [formData, setFormData] = useState<CampusPayload>({
    ...emptyCampus,
    institution_id: institutionId,
  });
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const clearFieldError = (key: string) => {
    setFieldErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const validateCampusForm = () => {
    const errors: Record<string, string> = {};
    if (!institutionId || !Number.isFinite(institutionId)) {
      errors.institution_id =
        "Save the academic institution first so this campus can be linked.";
    }
    if (!formData.acronym?.trim()) {
      errors.acronym = "Acronym is required.";
    }
    if (!formData.campus_name?.trim()) {
      errors.campus_name = "Campus name is required.";
    }
    return errors;
  };

  const fetchCampuses = async () => {
    try {
      const res = await fetch(`${API}/api/campuses`);
      if (!res.ok) throw new Error("Failed to fetch campuses");
      const data: Campus[] = await res.json();
      setCampuses(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampuses();
  }, []);

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      institution_id: institutionId,
    }));
  }, [institutionId]);

  const selectCampus = (campus: Campus) => {
    setFieldErrors({});
    setSelectedId(campus.id);
    const { id, created_at, updated_at, ...rest } = campus;
    setFormData(rest as CampusPayload);
  };

  const handleNew = () => {
    setSelectedId(null);
    setFieldErrors({});
    setFormData({
      ...emptyCampus,
      institution_id: institutionId,
    });
  };

  const handleDelete = async () => {
    if (!selectedId) return;
    if (!confirm("Are you sure you want to delete this campus?")) return;
    try {
      await fetch(`${API}/api/campuses/${selectedId}`, { method: "DELETE" });
      setMessage({ type: "success", text: "Campus deleted." });
      handleNew();
      fetchCampuses();
    } catch (err) {
      setMessage({ type: "error", text: "Delete failed." });
    }
    setTimeout(() => setMessage(null), 3000);
  };

  const handleSave = async () => {
    const errors = validateCampusForm();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setMessage({
        type: "error",
        text: "Please complete the required fields below.",
      });
      setTimeout(() => setMessage(null), 5000);
      return;
    }
    setFieldErrors({});
    setSaving(true);
    try {
      const url = selectedId
        ? `${API}/api/campuses/${selectedId}`
        : `${API}/api/campuses`;
      const method = selectedId ? "PUT" : "POST";
      const payload: CampusPayload = {
        ...formData,
        acronym: formData.acronym.trim(),
        institution_id: formData.institution_id ?? institutionId,
      };
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Save failed");
      const saved: Campus = await res.json();
      setSelectedId(saved.id);
      setMessage({ type: "success", text: "Campus saved successfully!" });
      fetchCampuses();
    } catch (err) {
      setMessage({ type: "error", text: "Save failed. Check your data." });
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleAdd = async () => {
    const errors = validateCampusForm();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setMessage({
        type: "error",
        text: "Please complete the required fields below.",
      });
      setTimeout(() => setMessage(null), 5000);
      return;
    }
    setFieldErrors({});
    setSaving(true);
    try {
      const payload: CampusPayload = {
        ...formData,
        acronym: formData.acronym.trim(),
        institution_id: formData.institution_id ?? institutionId,
      };

      const res = await fetch(`${API}/api/campuses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(result?.error || "Add failed");

      setSelectedId(result.id);
      setMessage({ type: "success", text: "Campus added successfully!" });
      await fetchCampuses();
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Add failed. Check your data.",
      });
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handlePrimaryAction = async () => {
    // If a campus is selected, we update (PUT). Otherwise we create (POST).
    if (selectedId) return handleSave();
    return handleAdd();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    clearFieldError(name);
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckChange = (field: string, checked: boolean) => {
    setFormData((prev) => ({ ...prev, [field]: checked }));
  };

  const filtered = campuses.filter((c) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    const hay = `${c.acronym ?? ""} ${c.campus_name ?? ""} ${c.short_name ?? ""} ${c.short_name_by_site ?? ""}`.toLowerCase();
    return hay.includes(q);
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 animate-pulse">
        <Loader2 className="h-8 w-8 animate-spin text-primary/40" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[22rem_1fr] gap-6">
      {/* Left: campus list */}
      <Card className="rounded-2xl border-border/60 overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-0.5">
              <CardTitle className="text-sm font-semibold tracking-tight">
                Campuses
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Select a campus to edit, or create a new one.
              </p>
            </div>
            <Button
              type="button"
              onClick={handleNew}
              variant="outline"
              className="h-9 rounded-xl text-xs font-semibold gap-2"
            >
              <Plus className="h-4 w-4" />
              New
            </Button>
          </div>

          <div className="mt-3 relative">
            <Search className="h-4 w-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search campus…"
              className="h-9 rounded-xl pl-9 border-border/60 shadow-sm"
            />
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <ScrollArea className="h-112 pr-3">
            {filtered.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border/60 p-6 text-center">
                <p className="text-sm font-semibold">No results</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Try a different keyword, or create a new campus.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {filtered.map((campus) => {
                  const active = selectedId === campus.id;
                  return (
                    <button
                      key={campus.id}
                      type="button"
                      onClick={() => selectCampus(campus)}
                      className={cn(
                        "w-full text-left rounded-2xl border p-3 transition-colors",
                        active
                          ? "border-emerald-500/40 bg-emerald-500/10"
                          : "border-border/60 hover:bg-muted/40"
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <div
                              className={cn(
                                "grid h-8 w-8 place-items-center rounded-xl",
                                active ? "bg-emerald-600 text-white" : "bg-muted text-foreground"
                              )}
                            >
                              <Building2 className="h-4 w-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold truncate">
                                {campus.campus_name || "Untitled campus"}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">
                                {campus.acronym ? campus.acronym : "—"} • {campus.short_name || "No short name"}
                              </p>
                            </div>
                          </div>
                        </div>
                        {active && (
                          <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
                            Selected
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Right: editor */}
      <Card className="rounded-2xl border-border/60 overflow-hidden">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div className="space-y-0.5">
              <CardTitle className="text-sm font-semibold tracking-tight">
                Campus details
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                {selectedId ? "Editing selected campus." : "Creating a new campus."}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                type="button"
                onClick={handlePrimaryAction}
                disabled={saving}
                className="h-9 rounded-xl text-xs font-semibold gap-2"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                {selectedId ? "Save changes" : "Create campus"}
              </Button>
              <Button
                type="button"
                onClick={handleDelete}
                disabled={!selectedId}
                variant="outline"
                className="h-9 rounded-xl text-xs font-semibold gap-2 hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            </div>
          </div>

          {message && (
            <div
              className={`mt-3 flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold border ${
                message.type === "success"
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300"
                  : "bg-destructive/10 border-destructive/30 text-destructive"
              }`}
            >
              {message.type === "success" ? (
                <CheckCircle2 className="h-3.5 w-3.5" />
              ) : (
                <AlertCircle className="h-3.5 w-3.5" />
              )}
              {message.text}
            </div>
          )}

          {fieldErrors.institution_id && (
            <p className="mt-3 text-xs text-destructive font-medium border border-destructive/30 rounded-xl px-3 py-2 bg-destructive/5">
              {fieldErrors.institution_id}
            </p>
          )}
        </CardHeader>

        <CardContent className="space-y-7">
          {/* Identity */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Landmark className="h-4 w-4" />
              <span className="font-semibold text-foreground">Identity</span>
            </div>
            <Separator />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="space-y-1">
                <Label className="text-[11px] text-muted-foreground">Acronym</Label>
                <Input
                  name="acronym"
                  value={formData.acronym}
                  onChange={handleChange}
                  className={cn(
                    "h-9 rounded-xl border-border/60 shadow-sm font-semibold",
                    fieldErrors.acronym && "border-destructive ring-1 ring-destructive/30"
                  )}
                />
                {fieldErrors.acronym && (
                  <p className="text-[11px] text-destructive">{fieldErrors.acronym}</p>
                )}
              </div>
              <div className="space-y-1 lg:col-span-2">
                <Label className="text-[11px] text-muted-foreground">Campus name</Label>
                <Input
                  name="campus_name"
                  value={formData.campus_name || ""}
                  onChange={handleChange}
                  className={cn(
                    "h-9 rounded-xl border-border/60 shadow-sm",
                    fieldErrors.campus_name && "border-destructive ring-1 ring-destructive/30"
                  )}
                />
                {fieldErrors.campus_name && (
                  <p className="text-[11px] text-destructive">{fieldErrors.campus_name}</p>
                )}
              </div>
              <div className="space-y-1">
                <Label className="text-[11px] text-muted-foreground">Short name</Label>
                <Input
                  name="short_name"
                  value={formData.short_name || ""}
                  onChange={handleChange}
                  className="h-9 rounded-xl border-border/60 shadow-sm"
                />
              </div>
              <div className="space-y-1 lg:col-span-2">
                <Label className="text-[11px] text-muted-foreground">Short name (by site)</Label>
                <Input
                  name="short_name_by_site"
                  value={formData.short_name_by_site || ""}
                  onChange={handleChange}
                  className="h-9 rounded-xl border-border/60 shadow-sm"
                />
              </div>
            </div>
          </div>

          {/* Offices */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <CreditCard className="h-4 w-4" />
              <span className="font-semibold text-foreground">Offices</span>
            </div>
            <Separator />

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
              {[
                {
                  key: "registrar",
                  title: "Registrar",
                  icon: Landmark,
                  officeName: "registrar_office_name",
                  person: "registrar_name",
                  titleField: "registrar_title",
                  applies: "registrar_applies_to_all",
                },
                {
                  key: "accounting",
                  title: "Accounting",
                  icon: CreditCard,
                  officeName: "accounting_office_name",
                  person: "accountant_name",
                  titleField: "accountant_title",
                  applies: "accounting_applies_to_all",
                },
                {
                  key: "cashier",
                  title: "Cashier",
                  icon: Building2,
                  officeName: "cashier_office_name",
                  person: "cashier_name",
                  titleField: "cashier_title",
                  applies: "cashier_applies_to_all",
                },
              ].map((s) => {
                const Icon = s.icon;
                return (
                  <Card key={s.key} className="rounded-2xl border-border/60">
                    <CardHeader className="py-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <div className="grid h-9 w-9 place-items-center rounded-xl bg-muted">
                            <Icon className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold tracking-tight">{s.title}</p>
                            <p className="text-xs text-muted-foreground">Campus-level office</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>Applies to all</span>
                          <Checkbox
                            checked={!!(formData as any)[s.applies]}
                            onCheckedChange={(v) => handleCheckChange(s.applies, !!v)}
                            className="h-4 w-4"
                          />
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3 pb-5">
                      <div className="space-y-1">
                        <Label className="text-[11px] text-muted-foreground">Office name</Label>
                        <Input
                          name={s.officeName}
                          value={(formData as any)[s.officeName] || ""}
                          onChange={handleChange}
                          className="h-9 rounded-xl border-border/60 shadow-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[11px] text-muted-foreground">{s.title}</Label>
                        <Input
                          name={s.person}
                          value={(formData as any)[s.person] || ""}
                          onChange={handleChange}
                          className="h-9 rounded-xl border-border/60 shadow-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[11px] text-muted-foreground">Title</Label>
                        <Input
                          name={s.titleField}
                          value={(formData as any)[s.titleField] || ""}
                          onChange={handleChange}
                          className="h-9 rounded-xl border-border/60 shadow-sm"
                        />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Location & contact */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span className="font-semibold text-foreground">Location & contact</span>
            </div>
            <Separator />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-[11px] text-muted-foreground">Barangay</Label>
                <Input
                  name="barangay"
                  value={formData.barangay || ""}
                  onChange={handleChange}
                  className="h-9 rounded-xl border-border/60 shadow-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px] text-muted-foreground">Town / City</Label>
                <Input
                  name="town_city"
                  value={formData.town_city || ""}
                  onChange={handleChange}
                  className="h-9 rounded-xl border-border/60 shadow-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px] text-muted-foreground">Province</Label>
                <Input
                  name="province"
                  value={formData.province || ""}
                  onChange={handleChange}
                  className="h-9 rounded-xl border-border/60 shadow-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px] text-muted-foreground">Region</Label>
                <Input
                  name="region"
                  value={formData.region || ""}
                  onChange={handleChange}
                  className="h-9 rounded-xl border-border/60 shadow-sm"
                />
              </div>

              <div className="space-y-1 md:col-span-2">
                <Label className="text-[11px] text-muted-foreground">Mailing address</Label>
                <Input
                  name="mailing_address"
                  value={formData.mailing_address || ""}
                  onChange={handleChange}
                  className="h-9 rounded-xl border-border/60 shadow-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px] text-muted-foreground">Email</Label>
                <Input
                  name="email"
                  value={formData.email || ""}
                  onChange={handleChange}
                  className="h-9 rounded-xl border-border/60 shadow-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px] text-muted-foreground">Website</Label>
                <Input
                  name="website"
                  value={formData.website || ""}
                  onChange={handleChange}
                  className="h-9 rounded-xl border-border/60 shadow-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px] text-muted-foreground">Telephone</Label>
                <Input
                  name="telephone_no"
                  value={formData.telephone_no || ""}
                  onChange={handleChange}
                  className="h-9 rounded-xl border-border/60 shadow-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px] text-muted-foreground">Fax</Label>
                <Input
                  name="fax_no"
                  value={formData.fax_no || ""}
                  onChange={handleChange}
                  className="h-9 rounded-xl border-border/60 shadow-sm"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Legacy blocks removed (replaced by modern editor UI above). */}
    </div>
  );
}
