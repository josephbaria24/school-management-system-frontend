"use client";

import { ReactNode, useEffect, useState } from "react";
import { Campus, CampusPayload, emptyCampus } from "@/types/campus";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
    <div className="flex items-center gap-2">
      <Label
        className={`${labelWidth || "w-28"} text-right font-medium text-muted-foreground shrink-0 pr-2 text-[11px]`}
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    clearFieldError(name);
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckChange = (field: string, checked: boolean) => {
    setFormData((prev) => ({ ...prev, [field]: checked }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 animate-pulse">
        <Loader2 className="h-8 w-8 animate-spin text-primary/40" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Feedback Message */}
      {message && (
        <div
          className={`flex items-center gap-2 px-4 py-2 rounded-sm text-xs font-bold border-2 animate-in slide-in-from-top-2 duration-300 ${
            message.type === "success"
              ? "bg-emerald-50 border-emerald-300 text-emerald-700"
              : "bg-red-50 border-red-300 text-red-700"
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

      {/* Top Row: Acronym, Campus Name, Short Name */}
      <div className="flex flex-wrap items-start gap-4">
        <div className="space-y-0.5">
          <InlineField label="Acronym" labelWidth="w-16">
            <Input
              name="acronym"
              value={formData.acronym}
              onChange={handleChange}
              className={cn(
                "h-8 w-28 rounded-sm border-muted-foreground/30 shadow-sm font-bold",
                fieldErrors.acronym &&
                  "border-destructive ring-1 ring-destructive/30"
              )}
            />
          </InlineField>
          {fieldErrors.acronym && (
            <p className="text-[10px] text-destructive pl-[4.5rem]">
              {fieldErrors.acronym}
            </p>
          )}
        </div>
        <div className="space-y-0.5 flex-1 min-w-[200px]">
          <InlineField label="Campus Name" labelWidth="w-24">
            <Input
              name="campus_name"
              value={formData.campus_name || ""}
              onChange={handleChange}
              className={cn(
                "h-8 rounded-sm border-muted-foreground/30 shadow-sm",
                fieldErrors.campus_name &&
                  "border-destructive ring-1 ring-destructive/30"
              )}
            />
          </InlineField>
          {fieldErrors.campus_name && (
            <p className="text-[10px] text-destructive pl-[6.5rem]">
              {fieldErrors.campus_name}
            </p>
          )}
        </div>
        <InlineField label="Short Name" labelWidth="w-20">
          <Input
            name="short_name"
            value={formData.short_name || ""}
            onChange={handleChange}
            className="h-8 rounded-sm border-muted-foreground/30 shadow-sm"
          />
        </InlineField>
      </div>
      {fieldErrors.institution_id && (
        <p className="text-xs text-destructive font-medium border border-destructive/30 rounded-sm px-3 py-2 bg-destructive/5">
          {fieldErrors.institution_id}
        </p>
      )}

      {/* Campus List Table */}
      <div className="border-2 border-muted-foreground/20 rounded-sm overflow-hidden shadow-inner bg-white dark:bg-slate-900">
        <div className="grid grid-cols-3 bg-slate-200 dark:bg-slate-800 text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground border-b border-border/60">
          <div className="px-3 py-1.5 border-r border-white/50 dark:border-slate-700">Acronym</div>
          <div className="px-3 py-1.5 border-r border-white/50 dark:border-slate-700">ShortName</div>
          <div className="px-3 py-1.5">ShortNameBySite</div>
        </div>
        <div className="max-h-36 overflow-y-auto">
          {campuses.length === 0 ? (
            <div className="px-3 py-6 text-center text-xs text-muted-foreground italic">
              No campuses registered yet. Click ADD to create one.
            </div>
          ) : (
            campuses.map((campus) => (
              <div
                key={campus.id}
                onClick={() => selectCampus(campus)}
                className={`grid grid-cols-3 text-xs cursor-pointer border-b border-muted/30 transition-colors duration-150 ${
                  selectedId === campus.id
                    ? "bg-emerald-700 dark:bg-emerald-900 text-white font-bold"
                    : "hover:bg-emerald-50 dark:hover:bg-slate-800"
                }`}
              >
                <div className="px-3 py-1.5 border-r border-muted/20 truncate">
                  {campus.acronym}
                </div>
                <div className="px-3 py-1.5 border-r border-muted/20 truncate">
                  {campus.short_name}
                </div>
                <div className="px-3 py-1.5 truncate">
                  {campus.short_name_by_site}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ADD / DELETE Buttons */}
      <div className="flex justify-end gap-2">
        <Button
          type="button"
          onClick={handleSave}
          disabled={saving}
          variant="outline"
          size="sm"
          className="h-7 rounded-sm border-2 border-muted-foreground/30 text-[10px] font-bold uppercase gap-1 shadow-[2px_2px_0_rgba(0,0,0,0.08)] bg-white dark:bg-slate-900 dark:shadow-none"
        >
          {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3 text-emerald-600" />}
          SAVE
        </Button>
        <Button
          type="button"
          onClick={handleAdd}
          disabled={saving}
          variant="outline"
          size="sm"
          className="h-7 rounded-sm border-2 border-muted-foreground/30 text-[10px] font-bold uppercase gap-1 shadow-[2px_2px_0_rgba(0,0,0,0.08)] bg-white dark:bg-slate-900 dark:shadow-none"
        >
          <PenSquare className="h-3 w-3 text-green-600" />
          ADD
        </Button>
        <Button
          type="button"
          onClick={handleDelete}
          disabled={!selectedId}
          variant="outline"
          size="sm"
          className="h-7 rounded-sm border-2 border-muted-foreground/30 text-[10px] font-bold uppercase gap-1 shadow-[2px_2px_0_rgba(0,0,0,0.08)] bg-white dark:bg-slate-900 dark:shadow-none hover:bg-destructive/10 hover:text-destructive"
        >
          <Trash2 className="h-3 w-3 text-destructive" />
          DELETE
        </Button>
      </div>

      {/* Office Grid: Registrar | Accounting | Cashier */}
      <div className="grid grid-cols-3 gap-3">
        {/* Registrar */}
        <div className="border-2 border-muted-foreground/20 rounded-sm p-3 space-y-3 bg-white/80 dark:bg-slate-900/80">
          <div className="flex items-center justify-between border-b border-muted/40 pb-1.5">
            <span className="text-[10px] font-extrabold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
              Campus Registrar
            </span>
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] italic text-muted-foreground">
                Applies to All
              </span>
              <Checkbox
                checked={formData.registrar_applies_to_all}
                onCheckedChange={(v) =>
                  handleCheckChange("registrar_applies_to_all", !!v)
                }
                className="h-3.5 w-3.5"
              />
            </div>
          </div>
          <InlineField label="Office Name" labelWidth="w-20">
            <Input
              name="registrar_office_name"
              value={formData.registrar_office_name || ""}
              onChange={handleChange}
              className="h-7 text-[11px] rounded-sm border-muted-foreground/30"
            />
          </InlineField>
          <InlineField label="Registrar" labelWidth="w-20">
            <Input
              name="registrar_name"
              value={formData.registrar_name || ""}
              onChange={handleChange}
              className="h-7 text-[11px] rounded-sm border-muted-foreground/30"
            />
          </InlineField>
          <p className="text-center text-[10px] text-muted-foreground italic mt-1">
            {formData.registrar_title || "Title"}
          </p>
        </div>

        {/* Accounting */}
        <div className="border-2 border-muted-foreground/20 rounded-sm p-3 space-y-3 bg-white/80 dark:bg-slate-900/80">
          <div className="flex items-center justify-between border-b border-muted/40 pb-1.5">
            <span className="text-[10px] font-extrabold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
              Campus Accounting
            </span>
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] italic text-muted-foreground">
                Applies to All
              </span>
              <Checkbox
                checked={formData.accounting_applies_to_all}
                onCheckedChange={(v) =>
                  handleCheckChange("accounting_applies_to_all", !!v)
                }
                className="h-3.5 w-3.5"
              />
            </div>
          </div>
          <InlineField label="Office Name" labelWidth="w-20">
            <Input
              name="accounting_office_name"
              value={formData.accounting_office_name || ""}
              onChange={handleChange}
              className="h-7 text-[11px] rounded-sm border-muted-foreground/30"
            />
          </InlineField>
          <InlineField label="Accountant" labelWidth="w-20">
            <Input
              name="accountant_name"
              value={formData.accountant_name || ""}
              onChange={handleChange}
              className="h-7 text-[11px] rounded-sm border-muted-foreground/30"
            />
          </InlineField>
          <p className="text-center text-[10px] text-muted-foreground italic mt-1">
            {formData.accountant_title || "Title"}
          </p>
        </div>

        {/* Cashier */}
        <div className="border-2 border-muted-foreground/20 rounded-sm p-3 space-y-3 bg-white/80 dark:bg-slate-900/80">
          <div className="flex items-center justify-between border-b border-muted/40 pb-1.5">
            <span className="text-[10px] font-extrabold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
              Campus Cashier
            </span>
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] italic text-muted-foreground">
                Applies to All
              </span>
              <Checkbox
                checked={formData.cashier_applies_to_all}
                onCheckedChange={(v) =>
                  handleCheckChange("cashier_applies_to_all", !!v)
                }
                className="h-3.5 w-3.5"
              />
            </div>
          </div>
          <InlineField label="Office Name" labelWidth="w-20">
            <Input
              name="cashier_office_name"
              value={formData.cashier_office_name || ""}
              onChange={handleChange}
              className="h-7 text-[11px] rounded-sm border-muted-foreground/30"
            />
          </InlineField>
          <InlineField label="Cashier" labelWidth="w-20">
            <Input
              name="cashier_name"
              value={formData.cashier_name || ""}
              onChange={handleChange}
              className="h-7 text-[11px] rounded-sm border-muted-foreground/30"
            />
          </InlineField>
          <p className="text-center text-[10px] text-muted-foreground italic mt-1">
            {formData.cashier_title || "Title"}
          </p>
        </div>
      </div>

      {/* Campus Location and Mailing Address */}
      <div className="border-2 border-muted-foreground/20 rounded-sm p-4 space-y-4 bg-white/80 dark:bg-slate-900/80">
        <div className="border-b border-muted/40 pb-1.5 mb-3">
          <span className="text-[10px] font-extrabold text-emerald-700 dark:text-emerald-400 uppercase tracking-widest">
            Campus Location and Mailing Address
          </span>
        </div>

        <div className="grid grid-cols-2 gap-x-6 gap-y-3">
          <InlineField label="Barangay" labelWidth="w-20">
            <Input
              name="barangay"
              value={formData.barangay || ""}
              onChange={handleChange}
              className="h-7 text-[11px] rounded-sm border-muted-foreground/30"
            />
          </InlineField>
          <InlineField label="Town/City" labelWidth="w-20">
            <Input
              name="town_city"
              value={formData.town_city || ""}
              onChange={handleChange}
              className="h-7 text-[11px] rounded-sm border-muted-foreground/30"
            />
          </InlineField>
          <InlineField label="District ID" labelWidth="w-20">
            <Input
              name="district_id"
              value={formData.district_id || ""}
              onChange={handleChange}
              className="h-7 w-20 text-[11px] rounded-sm border-muted-foreground/30"
            />
          </InlineField>
          <InlineField label="Zip Code" labelWidth="w-20">
            <Input
              name="zip_code"
              value={formData.zip_code || ""}
              onChange={handleChange}
              className="h-7 w-20 text-[11px] rounded-sm border-muted-foreground/30"
            />
          </InlineField>
          <InlineField label="Province" labelWidth="w-20">
            <Input
              name="province"
              value={formData.province || ""}
              onChange={handleChange}
              className="h-7 text-[11px] rounded-sm border-muted-foreground/30"
            />
          </InlineField>
          <InlineField label="Region" labelWidth="w-20">
            <Select
              value={formData.region || ""}
              onValueChange={(v) =>
                setFormData((prev) => ({ ...prev, region: v }))
              }
            >
              <SelectTrigger className="h-7 text-[11px] rounded-sm border-muted-foreground/30">
                <SelectValue placeholder="Select Region" />
              </SelectTrigger>
              <SelectContent>
                {[
                  "NCR",
                  "CAR",
                  "Region I",
                  "Region II",
                  "Region III",
                  "Region IV-A",
                  "Region IV-B",
                  "Region V",
                  "Region VI",
                  "Region VII",
                  "Region VIII",
                  "Region IX",
                  "Region X",
                  "Region XI",
                  "Region XII",
                  "Region XIII",
                  "BARMM",
                ].map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </InlineField>
        </div>

        <div className="border-t border-muted/30 pt-3 space-y-3">
          <InlineField label="Mailing Address" labelWidth="w-28">
            <Input
              name="mailing_address"
              value={formData.mailing_address || ""}
              onChange={handleChange}
              className="h-7 text-[11px] rounded-sm border-muted-foreground/30"
            />
          </InlineField>
          <div className="grid grid-cols-2 gap-x-6 gap-y-3">
            <InlineField label="Email" labelWidth="w-28">
              <Input
                name="email"
                value={formData.email || ""}
                onChange={handleChange}
                className="h-7 text-[11px] rounded-sm border-muted-foreground/30"
              />
            </InlineField>
            <InlineField label="Website" labelWidth="w-20">
              <Input
                name="website"
                value={formData.website || ""}
                onChange={handleChange}
                className="h-7 text-[11px] rounded-sm border-muted-foreground/30"
              />
            </InlineField>
            <InlineField label="Telephone no." labelWidth="w-28">
              <Input
                name="telephone_no"
                value={formData.telephone_no || ""}
                onChange={handleChange}
                className="h-7 w-40 text-[11px] rounded-sm border-muted-foreground/30"
              />
            </InlineField>
            <InlineField label="Fax no." labelWidth="w-20">
              <Input
                name="fax_no"
                value={formData.fax_no || ""}
                onChange={handleChange}
                className="h-7 w-40 text-[11px] rounded-sm border-muted-foreground/30"
              />
            </InlineField>
          </div>
        </div>
      </div>
    </div>
  );
}
