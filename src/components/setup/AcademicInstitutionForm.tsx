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
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Save,
  XCircle,
  Printer,
  HelpCircle,
  Loader2,
  Building2,
  MapPin,
  Phone,
  Mail,
  Globe,
  Calendar,
  ShieldCheck,
  FileText,
  Info,
  Hash,
  Landmark,
} from "lucide-react";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface Props {
  initialData?: AcademicInstitution;
  onSubmit: (data: AcademicInstitutionPayload) => Promise<void>;
  loading: boolean;
}

interface FieldWrapperProps {
  label: string;
  children: ReactNode;
  icon?: ReactNode;
  note?: string;
  error?: string;
  className?: string;
}

function FieldWrapper({ label, children, note, error, className }: FieldWrapperProps) {
  return (
    <div className={cn("space-y-1", className)}>
      <Label className="text-[11px] text-muted-foreground font-medium pl-0.5">
        {label}
      </Label>
      <div className="relative group">
        {children}
        {error && (
          <p className="mt-1 text-[11px] font-medium text-destructive animate-in fade-in slide-in-from-top-1">
            {error}
          </p>
        )}
      </div>
      {note && !error && (
        <p className="text-[10px] text-muted-foreground/60 italic pl-1 leading-tight">
          {note}
        </p>
      )}
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
    <Card className="w-full overflow-hidden rounded-2xl border border-border/60 bg-background shadow-[0_12px_40px_-24px_rgba(2,6,23,0.45)]">
      <CardHeader className="border-b border-border/60 bg-background pb-4 p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-600 text-white shadow-sm">
              <Building2 className="h-5 w-5" />
            </div>
            <div className="space-y-0.5">
              <CardTitle className="text-base font-bold tracking-tight text-emerald-950">
                Academic Institution
              </CardTitle>
              <p className="text-[11px] text-muted-foreground font-medium">
                Setup manager • Institution profile and campuses
              </p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <Badge variant="secondary" className="rounded-xl">
              Setup
            </Badge>
            {initialData?.id ? (
              <Badge className="rounded-xl bg-emerald-600 text-white hover:bg-emerald-600">
                Saved
              </Badge>
            ) : (
              <Badge variant="outline" className="rounded-xl">
                Not yet saved
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="px-4 pt-3 border-b border-border/60 bg-background">
            <TabsList className="h-10 bg-muted/50 p-1 rounded-xl gap-1">
              <TabsTrigger 
                value="institution" 
                className="rounded-lg px-4 text-xs font-semibold data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                Higher Educational Institution
              </TabsTrigger>
              <TabsTrigger 
                value="campus" 
                className="rounded-lg px-4 text-xs font-semibold data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                Campus Information
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="p-6 md:p-8 space-y-8 bg-background min-h-[620px]">
          <TabsContent value="institution" className="p-0 m-0 border-none outline-none animate-in fade-in slide-in-from-bottom-2">
            <div className="space-y-8 p-6 lg:p-8">
              {/* Institution Identity */}
              <div className="flex flex-col lg:flex-row gap-8 items-start">
                <LogoUploadField 
                  value={formData.logo_url || ""} 
                  onChange={(val) => setFormData(prev => ({ ...prev, logo_url: val }))}
                />

                <div className="flex-1 space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Landmark className="h-4 w-4" />
                      <span className="font-semibold text-foreground">Identity</span>
                    </div>
                    <Separator />
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FieldWrapper label="Official Name of the Institution" className="md:col-span-3">
                        <Input 
                          name="official_name"
                          value={formData.official_name}
                          onChange={handleInputChange}
                          className={cn(
                            "h-9 rounded-xl border-border/60 shadow-sm transition-all focus-visible:ring-emerald-500/30 font-semibold",
                            errors.official_name && "border-destructive ring-1 ring-destructive/30"
                          )}
                          placeholder="e.g. Palawan National School"
                        />
                      </FieldWrapper>

                      <FieldWrapper label="Classification">
                        <InstitutionClassificationSelect 
                          value={formData.classification_id?.toString() || ""}
                          onChange={(val) => setFormData(prev => ({ ...prev, classification_id: parseInt(val) }))}
                          error={errors.classification_id}
                        />
                      </FieldWrapper>

                      <FieldWrapper label="Head Person">
                        <InstitutionHeadSelect
                          value={formData.head_person_id?.toString() || ""}
                          onChange={(val) =>
                            setFormData((prev) => ({
                              ...prev,
                              head_person_id: val ? parseInt(val, 10) : undefined,
                            }))
                          }
                          error={errors.head_person_id}
                        />
                      </FieldWrapper>

                      <FieldWrapper label="Official Title">
                        <InstitutionHeadTitleSelect
                          value={formData.head_title || ""}
                          onChange={(val) => setFormData((prev) => ({ ...prev, head_title: val }))}
                          error={errors.head_title}
                        />
                      </FieldWrapper>
                    </div>
                  </div>
                </div>
              </div>

              {/* Location & Contact Section */}
              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span className="font-semibold text-foreground">Location & contact</span>
                  </div>
                  <Separator />

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FieldWrapper label="Institution ID">
                      <Input 
                        name="institution_unique_identifier"
                        value={formData.institution_unique_identifier || ""}
                        onChange={handleInputChange}
                        className="h-9 rounded-xl border-border/60 shadow-sm bg-background/50 font-mono text-xs"
                        placeholder="UID-000"
                      />
                    </FieldWrapper>

                    <FieldWrapper label="Year Established">
                      <Input 
                        type="number"
                        name="year_established"
                        value={formData.year_established || ""}
                        onChange={handleInputChange}
                        className="h-9 rounded-xl border-border/60 shadow-sm bg-background/50 text-xs"
                        placeholder="YYYY"
                      />
                    </FieldWrapper>

                    <FieldWrapper label="SEC Registration">
                      <Input 
                        name="latest_sec_registration"
                        value={formData.latest_sec_registration || ""}
                        onChange={handleInputChange}
                        className="h-9 rounded-xl border-border/60 shadow-sm bg-background/50 text-xs"
                        placeholder="Enabling Law or Charter"
                      />
                    </FieldWrapper>
                  </div>

                  <AddressFieldsGroup 
                    formData={formData} 
                    onChange={handleInputChange} 
                    errors={errors} 
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FieldWrapper label="Institutional Telephone">
                      <Input 
                        name="telephone_no"
                        value={formData.telephone_no || ""}
                        onChange={handleInputChange}
                        className="h-9 rounded-xl border-border/60 shadow-sm bg-background text-xs"
                      />
                    </FieldWrapper>
                    <FieldWrapper label="Institutional Fax">
                      <Input 
                        name="fax_no"
                        value={formData.fax_no || ""}
                        onChange={handleInputChange}
                        className="h-9 rounded-xl border-border/60 shadow-sm bg-background text-xs"
                      />
                    </FieldWrapper>
                    <FieldWrapper label="Head's Telephone">
                      <Input 
                        name="head_telephone"
                        value={formData.head_telephone || ""}
                        onChange={handleInputChange}
                        className="h-9 rounded-xl border-border/60 shadow-sm bg-background text-xs"
                      />
                    </FieldWrapper>
                    <FieldWrapper label="Email Address">
                      <Input 
                        name="email_address"
                        value={formData.email_address || ""}
                        onChange={handleInputChange}
                        className="h-9 rounded-xl border-border/60 shadow-sm bg-background text-xs"
                        placeholder="institution@domain.edu"
                      />
                    </FieldWrapper>
                    <FieldWrapper label="Web Site" className="md:col-span-2">
                      <Input 
                        name="website"
                        value={formData.website || ""}
                        onChange={handleInputChange}
                        className="h-9 rounded-xl border-border/60 shadow-sm bg-background text-xs"
                        placeholder="https://www.institution.edu.ph"
                      />
                    </FieldWrapper>
                  </div>
                </div>

                {/* Approvals & Conversions */}
                <div className="space-y-4 pt-4">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <FileText className="h-4 w-4" />
                    <span className="font-semibold text-foreground">Approvals & Conversions</span>
                  </div>
                  <Separator />

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FieldWrapper label="Date Granted/Approved">
                      <Input 
                        type="date"
                        name="date_granted_or_approved"
                        value={formData.date_granted_or_approved || ""}
                        onChange={handleInputChange}
                        className="h-9 rounded-xl border-border/60 shadow-sm bg-background text-xs font-medium"
                      />
                    </FieldWrapper>
                    
                    <FieldWrapper label="Converted to College">
                      <Input 
                        type="number"
                        name="year_converted_to_college"
                        value={formData.year_converted_to_college || ""}
                        onChange={handleInputChange}
                        className="h-9 rounded-xl border-border/60 shadow-sm bg-background text-xs"
                        placeholder="Year"
                      />
                    </FieldWrapper>

                    <FieldWrapper label="Converted to University">
                      <Input 
                        type="number"
                        name="year_converted_to_university"
                        value={formData.year_converted_to_university || ""}
                        onChange={handleInputChange}
                        className="h-9 rounded-xl border-border/60 shadow-sm bg-background text-xs"
                        placeholder="Year"
                      />
                    </FieldWrapper>
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
      <div className="sticky bottom-0 z-10 border-t border-border/60 bg-background/85 backdrop-blur supports-backdrop-filter:bg-background/70">
        <div className="px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <Button variant="outline" className="h-9 rounded-xl text-xs font-semibold gap-2">
          <HelpCircle className="h-4 w-4 text-amber-500" />
          Help
        </Button>

          <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
          <Button 
            onClick={() => handleSubmit()} 
            disabled={loading}
            className="h-9 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold gap-2 shadow-sm"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save
          </Button>
          <Button variant="outline" className="h-9 rounded-xl text-xs font-semibold gap-2 hover:bg-destructive/10 hover:text-destructive">
            <XCircle className="h-4 w-4" />
            Cancel
          </Button>
          <Button variant="outline" className="h-9 rounded-xl text-xs font-semibold gap-2">
            <Printer className="h-4 w-4" />
            Print
          </Button>
        </div>
        </div>
      </div>
    </Card>
  );
}
