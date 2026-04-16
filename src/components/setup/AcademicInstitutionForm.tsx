"use client";

import { useState } from "react";
import { AcademicInstitution, AcademicInstitutionPayload } from "@/types/institution";
import { InstitutionClassificationSelect } from "./InstitutionClassificationSelect";
import { InstitutionHeadSelect } from "./InstitutionHeadSelect";
import { InstitutionHeadTitleSelect } from "./InstitutionHeadTitleSelect";
import { AddressFieldsGroup } from "./AddressFieldsGroup";
import { LogoUploadField } from "./LogoUploadField";
import { CampusInformationTab } from "./CampusInformationTab";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Save, 
  XCircle, 
  Printer, 
  HelpCircle,
  Loader2,
  Building2,
  MapPin
} from "lucide-react";
import { ReactNode } from "react";

interface Props {
  initialData?: AcademicInstitution;
  onSubmit: (data: AcademicInstitutionPayload) => Promise<void>;
  loading: boolean;
}

interface InlineFieldProps {
  label: string;
  children: ReactNode;
  note?: string;
  error?: string;
}

function InlineField({ label, children, note, error }: InlineFieldProps) {
  return (
    <div className="flex items-center gap-4 group">
      <Label className={`w-48 text-right font-medium text-muted-foreground shrink-0 pr-4 ${error ? "text-destructive" : ""}`}>
        {label}
      </Label>
      <div className="flex-1 flex items-center gap-4">
        <div className="relative flex-1">
          {children}
          {error && <p className="absolute -bottom-4 left-0 text-[10px] font-bold text-destructive animate-bounce">{error}</p>}
        </div>
        {note && <span className="text-[10px] text-muted-foreground/60 italic w-48 shrink-0">{note}</span>}
      </div>
    </div>
  );
}

export function AcademicInstitutionForm({ initialData, onSubmit, loading }: Props) {
  const [activeTab, setActiveTab] = useState("institution");
  const [formData, setFormData] = useState<Partial<AcademicInstitutionPayload>>(
    initialData || {
      official_name: "",
      classification_id: 0,
      head_title: "",
      head_person_id: undefined,
      institution_unique_identifier: "",
      address_street: "",
      address_municipality: "",
      address_province_city: "",
      address_region: "",
      address_zip_code: "",
      telephone_no: "",
      fax_no: "",
      head_telephone: "",
      email_address: "",
      website: "",
      year_established: undefined,
      latest_sec_registration: "",
      date_granted_or_approved: "",
      year_converted_to_college: undefined,
      year_converted_to_university: undefined,
      logo_url: ""
    }
  );

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.official_name) newErrors.official_name = "Required";
    if (!formData.classification_id) newErrors.classification_id = "Required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: name.includes("year") ? (value ? parseInt(value) : undefined) : value 
    }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: "" }));
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!validate()) return;
    await onSubmit(formData as AcademicInstitutionPayload);
  };

  return (
    <Card className="w-full border-2 border-primary/20 shadow-2xl rounded-md overflow-hidden bg-slate-50 dark:bg-slate-900">
      {/* Legacy blue title bar */}
      <div className="bg-emerald-700 dark:bg-emerald-900 text-white px-4 py-1.5 flex items-center justify-between border-b border-primary/30">
        <div className="flex items-center gap-2">
          <div className="bg-white dark:bg-slate-100 p-0.5 rounded-sm">
            <Building2 className="h-4 w-4 text-emerald-700 dark:text-emerald-900" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider">Setup - Institution and Campus</span>
        </div>
        <div />
      </div>

      <CardContent className="p-0">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="px-4 pt-1 bg-muted/40 border-b border-border/50">
            <TabsList className="h-9 bg-transparent p-0 gap-1">
              <TabsTrigger 
                value="institution" 
                className="rounded-t-lg rounded-b-none border-x border-t border-border bg-muted/30 data-[state=active]:bg-background data-[state=active]:border-b-background -mb-[1px] px-6 text-xs font-bold uppercase tracking-tight transition-all duration-300"
              >
                Higher Educational Institution
              </TabsTrigger>
              <TabsTrigger 
                value="campus" 
                className="rounded-t-lg rounded-b-none border-x border-t border-border bg-muted/30 data-[state=active]:bg-background data-[state=active]:border-b-background -mb-[1px] px-6 text-xs font-bold uppercase tracking-tight transition-all duration-300 opacity-60"
              >
                Campus Information
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="p-8 space-y-8 bg-white/70 dark:bg-slate-950/60 backdrop-blur-sm min-h-[600px]">
            <TabsContent value="institution" className="m-0 space-y-10 mt-0 focus-visible:ring-0">
              {/* Header section with Logo and Primary fields */}
              <div className="flex gap-10 items-start">
                <LogoUploadField 
                  value={formData.logo_url || ""} 
                  onChange={(val) => setFormData(prev => ({ ...prev, logo_url: val }))}
                />

                <div className="flex-1 space-y-5">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] uppercase font-extrabold text-muted-foreground/60 tracking-widest pl-1">
                      Official Name of the Higher Educational Institution
                    </Label>
                    <Input 
                      name="official_name"
                      value={formData.official_name}
                      onChange={handleInputChange}
                      className={`h-11 text-xl font-black italic tracking-tight rounded-sm border-2 transition-all duration-300 ${errors.official_name ? "border-destructive/50 ring-destructive/10" : "border-muted-foreground/20 focus:border-primary shadow-sm"}`}
                      placeholder="ENTER INSTITUTION NAME"
                    />
                  </div>

                  <InlineField label="Classification of this Institution">
                    <InstitutionClassificationSelect 
                      value={formData.classification_id?.toString() || ""}
                      onChange={(val) => setFormData(prev => ({ ...prev, classification_id: parseInt(val) }))}
                      error={errors.classification_id}
                    />
                  </InlineField>

                  <InlineField label="Head of the Institution">
                    <InstitutionHeadSelect
                      value={formData.head_person_id?.toString() || ""}
                      onChange={(val) =>
                        setFormData((prev) => ({
                          ...prev,
                          head_person_id: val ? parseInt(val, 10) : undefined,
                        }))
                      }
                    />
                  </InlineField>

                  <InlineField label="Official Title of the Head of this Institution">
                    <InstitutionHeadTitleSelect
                      value={formData.head_title || ""}
                      onChange={(val) => setFormData((prev) => ({ ...prev, head_title: val }))}
                    />
                  </InlineField>
                </div>
              </div>

              {/* Middle Section fields */}
              <div className="space-y-4 pt-4 border-t border-dashed border-border/60">
                <InlineField label="Institution Unique Identifier">
                  <Input 
                    name="institution_unique_identifier"
                    value={formData.institution_unique_identifier || ""}
                    onChange={handleInputChange}
                    className="h-8 rounded-sm border-muted-foreground/30 shadow-sm"
                  />
                </InlineField>

                <AddressFieldsGroup 
                  formData={formData} 
                  onChange={handleInputChange} 
                  errors={errors} 
                />

                <div className="grid grid-cols-1 gap-4">
                  {[
                    { name: "telephone_no", label: "Institutional Telephone No.", note: "* Include Area Code (e.g. (02) 366-43-234 )" },
                    { name: "fax_no", label: "Institutional Fax No.", note: "* Include Area Code" },
                    { name: "head_telephone", label: "Institutional Head's Telephone", note: "* Include Area Code" },
                    { name: "email_address", label: "Institutional Email Address" },
                    { name: "website", label: "Institutional Web Site" },
                    { name: "year_established", label: "Year Established", type: "number" },
                    { name: "latest_sec_registration", label: "Latest SEC Registration", note: "* Enabling Law or Charter" },
                  ].map((field: any) => (
                    <InlineField key={field.name} label={field.label} note={field.note}>
                      <Input 
                        type={field.type || "text"}
                        name={field.name}
                        value={formData[field.name] || ""}
                        onChange={handleInputChange}
                        className="h-8 rounded-sm border-muted-foreground/30 shadow-sm"
                      />
                    </InlineField>
                  ))}

                  <div className="flex items-center gap-4">
                    <Label className="w-48 text-right font-medium text-muted-foreground shrink-0 pr-4">
                      Date Granted or Approved?
                    </Label>
                    <div className="flex-1 flex gap-4 items-center">
                      <Input 
                        type="date"
                        name="date_granted_or_approved"
                        value={formData.date_granted_or_approved || ""}
                        onChange={handleInputChange}
                        className="h-8 w-48 rounded-sm border-muted-foreground/30 shadow-sm"
                      />
                      <div className="flex-1 flex items-center gap-4">
                        <Label className="font-medium text-muted-foreground shrink-0 whitespace-nowrap">Year Converted to College</Label>
                        <Input 
                          type="number"
                          name="year_converted_to_college"
                          value={formData.year_converted_to_college || ""}
                          onChange={handleInputChange}
                          className="h-8 flex-1 rounded-sm border-muted-foreground/30 shadow-sm"
                        />
                        <Label className="font-medium text-muted-foreground shrink-0 whitespace-nowrap">Year Converted to University</Label>
                        <Input 
                          type="number"
                          name="year_converted_to_university"
                          value={formData.year_converted_to_university || ""}
                          onChange={handleInputChange}
                          className="h-8 flex-1 rounded-sm border-muted-foreground/30 shadow-sm"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="campus" className="m-0 mt-0 focus-visible:ring-0">
              <CampusInformationTab institutionId={initialData?.id ?? null} />
            </TabsContent>
          </div>
        </Tabs>
      </CardContent>

      {/* Footer Action Bar */}
      <div className="bg-slate-200 dark:bg-slate-800 border-t-2 border-white/50 dark:border-slate-700 p-4 flex items-center justify-between shadow-[inset_0_2px_4px_rgba(255,255,255,1)] dark:shadow-none">
        <Button variant="outline" className="bg-slate-100 dark:bg-slate-900 border-slate-400 dark:border-slate-600 px-6 h-9 rounded-sm shadow-[2px_2px_0_rgba(0,0,0,0.1)] dark:shadow-none text-xs font-bold gap-2">
          <HelpCircle className="h-4 w-4 text-amber-500" />
          Help
        </Button>

        <div className="flex gap-2">
          <Button 
            onClick={() => handleSubmit()} 
            disabled={loading}
            className="bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-800 dark:hover:bg-emerald-700 text-white px-8 h-9 rounded-sm shadow-[2px_2px_0_rgba(0,0,0,0.2)] dark:shadow-none text-xs font-bold gap-2 active:translate-y-[1px] active:shadow-none transition-all"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save
          </Button>
          <Button variant="outline" className="bg-slate-100 dark:bg-slate-900 border-slate-400 dark:border-slate-600 px-8 h-9 rounded-sm shadow-[2px_2px_0_rgba(0,0,0,0.1)] dark:shadow-none text-xs font-bold gap-2 transition-all hover:bg-destructive/10 hover:text-destructive">
            <XCircle className="h-4 w-4" />
            Cancel
          </Button>
          <Button variant="outline" className="bg-slate-100 dark:bg-slate-900 border-slate-400 dark:border-slate-600 px-6 h-9 rounded-sm shadow-[2px_2px_0_rgba(0,0,0,0.1)] dark:shadow-none text-xs font-bold gap-2">
            <Printer className="h-4 w-4" />
            Print
          </Button>
        </div>
      </div>
    </Card>
  );
}
