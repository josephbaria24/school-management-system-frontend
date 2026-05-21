 "use client";

import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const API = process.env.NEXT_PUBLIC_API_URL;

const lowerTabs = [
  "Personal Information",
  "Family Background",
  "Educational Background",
  "Attachments",
  "Medical Records",
  "Counseling Record",
  "Others",
] as const;

type LowerTab = (typeof lowerTabs)[number];

type ApplicationRow = {
  app_no: string;
  app_date: string;
  last_name: string;
  first_name: string;
  middle_name?: string | null;
  middle_initial?: string | null;
  gender: string;
  date_of_birth: string | null;
  choice1_campus?: string | null;
  choice1_program_code?: string | null;
  choice1_program_name?: string | null;
  adm_status_id?: number | null;
};

type ApplicantProfilePayload = {
  inputDraft?: Record<string, string | boolean>;
};

type ApplicantProfileDbRow = {
  app_no?: string;
  app_date?: string | null;
  adm_status_id?: number | null;
  or_no?: string | null;
  last_name?: string | null;
  first_name?: string | null;
  middle_name?: string | null;
  middle_initial?: string | null;
  gender?: string | null;
  date_of_birth?: string | null;
  payload?: ApplicantProfilePayload;
};

const statusLabel = (id?: number | null) => {
  if (id === 3) return "APPROVED";
  if (id === 4) return "DENIED";
  if (id === 5) return "CANCELLED";
  if (id === 2) return "IN PROCESS";
  return "PENDING";
};

export function StudentsProfileModule() {
  const [rows, setRows] = useState<ApplicationRow[]>([]);
  const [search, setSearch] = useState("");
  const [selectedAppNo, setSelectedAppNo] = useState("");
  const [profile, setProfile] = useState<ApplicantProfileDbRow | null>(null);
  const [activeLowerTab, setActiveLowerTab] = useState<LowerTab>("Personal Information");

  useEffect(() => {
    const loadRows = async () => {
      if (!API) return;
      try {
        const res = await fetch(`${API}/api/admission/applications`);
        if (!res.ok) return;
        const data = (await res.json()) as ApplicationRow[];
        setRows(data);
        if (data[0]?.app_no) setSelectedAppNo(data[0].app_no);
      } catch {
        // ignore
      }
    };
    void loadRows();
  }, []);

  useEffect(() => {
    const loadProfile = async () => {
      if (!API || !selectedAppNo) return setProfile(null);
      try {
        const res = await fetch(`${API}/api/admission/applicant-profile?profile_key=${encodeURIComponent(selectedAppNo)}`);
        if (!res.ok) return setProfile(null);
        setProfile((await res.json()) as ApplicantProfileDbRow);
      } catch {
        setProfile(null);
      }
    };
    void loadProfile();
  }, [selectedAppNo]);

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows.slice(0, 10);
    return rows
      .filter((r) => `${r.app_no} ${r.last_name} ${r.first_name} ${r.middle_name || ""}`.toLowerCase().includes(q))
      .slice(0, 10);
  }, [rows, search]);

  const selectedSummary = useMemo(() => rows.find((r) => r.app_no === selectedAppNo) || null, [rows, selectedAppNo]);
  const draft = profile?.payload?.inputDraft ?? {};
  const getDraft = (name: string) => {
    const v = draft[`input::${name}`] ?? draft[`textarea::${name}`] ?? draft[name];
    return typeof v === "string" ? v : "";
  };

  const appInputClass = "h-8 rounded-xl text-xs border-border/60 shadow-sm bg-background";
  const sectionClass = "rounded-2xl border border-border/60 bg-card shadow-sm";
  const sectionTitleClass = "px-3 py-2 text-xs font-semibold border-b border-border/60 bg-muted/30";

  return (
    <div className="h-full bg-background overflow-x-hidden">
      <div className="w-full px-2 pt-2 pb-4 space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="setup-type-page-title">Students Profile</h1>
            <p className="setup-type-page-desc">Same content flow as Applicant Profile, in your modern compact design.</p>
          </div>
          <div className="setup-type-kicker-pill hidden sm:flex h-9 items-center rounded-xl border border-border/60 bg-background/70 px-3 shadow-sm">
            Registrar module
          </div>
        </div>

        <div className={sectionClass}>
          <div className={sectionTitleClass}>Student Search</div>
          <div className="p-3 space-y-2">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-2">
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search student no., last name, or first name..."
                className={appInputClass}
              />
              <div className="h-8 rounded-xl border border-border/60 px-3 text-xs flex items-center justify-between bg-muted/20">
                <span className="text-muted-foreground">Selected Student</span>
                <span className="font-semibold">{selectedAppNo || "-"}</span>
              </div>
            </div>
            {!!filteredRows.length && (
              <div className="rounded-xl border border-border/60 max-h-40 overflow-y-auto">
                {filteredRows.map((r) => (
                  <button
                    key={r.app_no}
                    type="button"
                    onClick={() => setSelectedAppNo(r.app_no)}
                    className={cn(
                      "w-full text-left px-3 py-1.5 text-xs border-b last:border-b-0 border-border/40 hover:bg-muted/30",
                      selectedAppNo === r.app_no && "bg-muted/40"
                    )}
                  >
                    <span className="font-semibold">{r.app_no}</span> - {r.last_name}, {r.first_name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className={sectionClass}>
          <div className="p-3 border-b border-border/60 bg-muted/20 flex items-center gap-2">
            <Badge variant="outline" className="rounded-full text-[11px]">
              {statusLabel(profile?.adm_status_id ?? selectedSummary?.adm_status_id)}
            </Badge>
            <span className="text-sm font-semibold">
              {[profile?.last_name ?? selectedSummary?.last_name, profile?.first_name ?? selectedSummary?.first_name, profile?.middle_name ?? selectedSummary?.middle_name]
                .filter(Boolean)
                .join(", ") || "No student selected"}
            </span>
          </div>

          <div className="p-2">
            <div className="flex flex-wrap gap-1 border border-border/60 rounded-xl bg-muted/20 p-1 mb-2">
              {lowerTabs.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveLowerTab(tab)}
                  className={cn(
                    "px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors",
                    activeLowerTab === tab ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:bg-background/60"
                  )}
                >
                  {tab}
                </button>
              ))}
            </div>

            {activeLowerTab === "Personal Information" && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-2">
                <div className="lg:col-span-4 space-y-2">
                  <div className={sectionClass}>
                    <div className={sectionTitleClass}>Student Profile</div>
                    <div className="p-3 space-y-2">
                    <div className="rounded-xl border border-dashed border-border/60 bg-muted/20 h-40 grid place-items-center text-xs text-muted-foreground">
                      Student Picture
                    </div>
                      <div className="grid grid-cols-[1fr_auto] gap-2">
                        <Input value={selectedAppNo || ""} readOnly className={appInputClass} placeholder="Student No..." />
                        <Button variant="outline" className="h-8 text-xs">Profile History</Button>
                      </div>
                      <div className="grid grid-cols-1 gap-2">
                        <Field label="Last Name" value={profile?.last_name || selectedSummary?.last_name || ""} />
                        <Field label="First Name" value={profile?.first_name || selectedSummary?.first_name || ""} />
                        <Field label="Middle Name" value={profile?.middle_name || selectedSummary?.middle_name || ""} />
                      </div>
                      <div className="grid grid-cols-4 gap-2">
                        <Field label="M.I." value={profile?.middle_initial || selectedSummary?.middle_initial || ""} />
                        <Field label="Ext. Name" value={getDraft("ext_name")} />
                        <Field label="Gender" value={profile?.gender || selectedSummary?.gender || ""} />
                        <Field label="Age" value={getDraft("age")} />
                      </div>
                    </div>
                  </div>

                  <div className={sectionClass}>
                    <div className={sectionTitleClass}>Program Study Information</div>
                    <div className="p-3 space-y-1.5">
                      <InfoRow label="Campus" value={selectedSummary?.choice1_campus || ""} />
                      <InfoRow label="College" value={getDraft("college")} />
                      <InfoRow
                        label="Academic Program"
                        value={
                          selectedSummary?.choice1_program_code
                            ? `${selectedSummary.choice1_program_code} - ${selectedSummary.choice1_program_name || ""}`
                            : selectedSummary?.choice1_program_name || ""
                        }
                      />
                      <InfoRow label="Major Study" value={getDraft("major_study_enrolled")} />
                      <InfoRow label="Year Level" value={getDraft("year_level_enrolled")} />
                      <InfoRow label="Curriculum Code" value={getDraft("curriculum_enrolled")} />
                      <InfoRow label="Date Admitted" value={getDraft("date_admitted")} />
                      <InfoRow label="Expected Year Graduation" value={getDraft("expected_year_graduation")} />
                      <InfoRow label="Total No. of Courses in Curriculum" value={getDraft("total_courses")} />
                      <InfoRow label="Total Units Required" value={getDraft("total_units_required")} />
                      <InfoRow label="Total Units Earned" value={getDraft("total_units_earned")} />
                      <InfoRow label="Total Units Deficient" value={getDraft("total_units_deficient")} />
                      <InfoRow label="Allowed Max. Units Load" value={getDraft("allowed_max_units")} />
                      <div className="pt-1 inline-flex items-center gap-2 text-xs text-muted-foreground">
                        <Checkbox checked={Boolean(draft["input::inactive_student"])} />
                        Inactive Student
                      </div>
                    </div>
                  </div>

                  <div className={sectionClass}>
                    <div className={sectionTitleClass}>Status Information</div>
                    <div className="p-3 space-y-2">
                      <div className="space-y-1">
                        <Label className="text-[10px] uppercase text-muted-foreground">Status</Label>
                        <Select value={statusLabel(profile?.adm_status_id ?? selectedSummary?.adm_status_id)} onValueChange={() => undefined}>
                          <SelectTrigger className={appInputClass}><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="PENDING">PENDING</SelectItem>
                            <SelectItem value="IN PROCESS">IN PROCESS</SelectItem>
                            <SelectItem value="APPROVED">APPROVED</SelectItem>
                            <SelectItem value="DENIED">DENIED</SelectItem>
                            <SelectItem value="CANCELLED">CANCELLED</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] uppercase text-muted-foreground">Remarks</Label>
                        <Textarea readOnly value={getDraft("registrar_remarks")} className="min-h-[70px] rounded-xl text-xs border-border/60 bg-background" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-8 space-y-2">
                  <div className={sectionClass}>
                    <div className={sectionTitleClass}>Personal Information</div>
                    <div className="p-3 grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2">
                      <div className="space-y-1">
                        <Label className="text-[10px] uppercase text-muted-foreground">Civil Status</Label>
                        <Input readOnly value={getDraft("civil_status")} className={appInputClass} />
                      </div>
                      <div className="grid grid-cols-[1fr_56px] gap-2">
                        <Field label="Height" value={getDraft("height")} />
                        <Field label="Unit" value="ft" />
                      </div>
                      <Field label="Date of Birth" value={profile?.date_of_birth || selectedSummary?.date_of_birth || ""} />
                      <div className="grid grid-cols-[1fr_56px] gap-2">
                        <Field label="Weight" value={getDraft("weight")} />
                        <Field label="Unit" value="lbs." />
                      </div>
                      <Field label="Nationality" value={getDraft("nationality")} />
                      <Field label="Blood Type" value={getDraft("blood_type")} />
                      <div className="space-y-1">
                        <Label className="text-[10px] uppercase text-muted-foreground">Foreign Student?</Label>
                        <div className="h-8 rounded-xl border border-border/60 px-3 flex items-center bg-background text-xs">
                          <Checkbox checked={Boolean(draft["input::foreign_student"])} />
                        </div>
                      </div>
                      <Field label="Place of Birth" value={getDraft("place_of_birth")} />
                      <Field label="Religion" value={getDraft("religion")} />
                      <Field label="Mobile Phone" value={getDraft("mobile_no")} />
                      <Field label="Email" value={getDraft("email")} />
                      <Field label="Telephone No." value={getDraft("tel_no")} />
                      <Field label="Socio Economic Status" value={getDraft("socio_economic_status")} />
                    </div>
                  </div>

                  <div className={sectionClass}>
                    <div className={sectionTitleClass}>Residence / Present Address</div>
                    <div className="p-3 grid grid-cols-1 md:grid-cols-2 gap-2">
                      <Field label="Residence" value={getDraft("res_address")} />
                      <Field label="Street" value={getDraft("res_street")} />
                      <Field label="Barangay" value={getDraft("res_barangay")} />
                      <Field label="Town/City" value={getDraft("res_town_city")} />
                      <Field label="Province" value={getDraft("res_province")} />
                      <div className="grid grid-cols-[1fr_auto] gap-2">
                        <Field label="Zip Code" value={getDraft("res_zip_code")} />
                        <Button variant="outline" className="h-8 text-xs mt-5">Copy Permanent Address</Button>
                      </div>
                    </div>
                  </div>

                  <div className={sectionClass}>
                    <div className={sectionTitleClass}>Permanent Address</div>
                    <div className="p-3 grid grid-cols-1 md:grid-cols-2 gap-2">
                      <Field label="Residence" value={getDraft("perm_address")} />
                      <Field label="Street" value={getDraft("perm_street")} />
                      <Field label="Barangay" value={getDraft("perm_barangay")} />
                      <Field label="Town/City" value={getDraft("perm_town_city")} />
                      <Field label="Province" value={getDraft("perm_province")} />
                      <div className="grid grid-cols-[1fr_auto] gap-2">
                        <Field label="Zip Code" value={getDraft("perm_zip_code")} />
                        <Button variant="outline" className="h-8 text-xs mt-5">Copy Present Address</Button>
                      </div>
                    </div>
                  </div>

                  <div className={sectionClass}>
                    <div className={sectionTitleClass}>Kiosk Information</div>
                    <div className="p-3 grid grid-cols-1 md:grid-cols-[220px_auto] gap-2 items-end">
                      <Field label="Default Password" value={getDraft("kiosk_default_password")} />
                      <Button variant="outline" className="h-8 text-xs">Reset Password</Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeLowerTab === "Family Background" && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                <div className={sectionClass}>
                  <div className={sectionTitleClass}>Father</div>
                  <div className="p-3 grid grid-cols-1 md:grid-cols-2 gap-2">
                    <Field label="Name" value={getDraft("father")} />
                    <Field label="Date of Birth" value={getDraft("father_birth_date")} />
                    <Field label="Educational Attainment" value={getDraft("father_educ_attainment")} />
                    <Field label="No. of Brothers" value={getDraft("father_no_brothers")} />
                    <Field label="Occupation" value={getDraft("father_occupation")} />
                    <Field label="Company" value={getDraft("father_company")} />
                    <Field label="Email" value={getDraft("father_email")} />
                    <Field label="Tel No." value={getDraft("father_tel_no")} />
                    <div className="md:col-span-2">
                      <Field label="Company Address" value={getDraft("father_company_address")} />
                    </div>
                  </div>
                </div>
                <div className={sectionClass}>
                  <div className={sectionTitleClass}>Mother</div>
                  <div className="p-3 grid grid-cols-1 md:grid-cols-2 gap-2">
                    <Field label="Name" value={getDraft("mother")} />
                    <Field label="Date of Birth" value={getDraft("mother_birth_date")} />
                    <Field label="Educational Attainment" value={getDraft("mother_educ_attainment")} />
                    <Field label="No. of Sisters" value={getDraft("mother_no_sisters")} />
                    <Field label="Occupation" value={getDraft("mother_occupation")} />
                    <Field label="Company" value={getDraft("mother_company")} />
                    <Field label="Email" value={getDraft("mother_email")} />
                    <Field label="Tel No." value={getDraft("mother_tel_no")} />
                    <div className="md:col-span-2">
                      <Field label="Company Address" value={getDraft("mother_company_address")} />
                    </div>
                  </div>
                </div>
                <div className={sectionClass}>
                  <div className={sectionTitleClass}>Guardian</div>
                  <div className="p-3 grid grid-cols-1 md:grid-cols-2 gap-2">
                    <Field label="Name" value={getDraft("guardian")} />
                    <Field label="Relationship" value={getDraft("guardian_relationship")} />
                    <Field label="Occupation" value={getDraft("guardian_occupation")} />
                    <Field label="Company" value={getDraft("guardian_company")} />
                    <Field label="Email" value={getDraft("guardian_email")} />
                    <Field label="Tel No." value={getDraft("guardian_tel_no")} />
                    <Field label="Address" value={getDraft("guardian_address")} />
                  </div>
                </div>
                <div className={sectionClass}>
                  <div className={sectionTitleClass}>Emergency Contact</div>
                  <div className="p-3 grid grid-cols-1 md:grid-cols-2 gap-2">
                    <Field label="Contact Person" value={getDraft("emergency_contact")} />
                    <div className="md:col-span-2">
                      <Field label="Address" value={getDraft("emergency_address")} />
                    </div>
                    <Field label="Mobile No." value={getDraft("emergency_mobile_no")} />
                    <Field label="Tel No." value={getDraft("emergency_tel_no")} />
                  </div>
                </div>
              </div>
            )}

            {activeLowerTab === "Educational Background" && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                <div className={sectionClass}>
                  <div className={sectionTitleClass}>Grade School / Elementary School</div>
                  <div className="p-3 grid grid-cols-1 gap-2">
                    <Field label="School" value={getDraft("elem_school")} />
                    <Field label="Address" value={getDraft("elem_address")} />
                    <Field label="Inclusive Dates" value={getDraft("elem_incl_dates")} />
                    <Field label="Awards/Honors/Scholarship Grants" value={getDraft("elem_awards")} />
                  </div>
                </div>
                <div className={sectionClass}>
                  <div className={sectionTitleClass}>Vocational / Trade Course</div>
                  <div className="p-3 grid grid-cols-1 md:grid-cols-2 gap-2">
                    <Field label="School" value={getDraft("voc_school")} />
                    <Field label="Address" value={getDraft("voc_address")} />
                    <Field label="Degree/Course" value={getDraft("voc_degree")} />
                    <Field label="Inclusive Dates" value={getDraft("voc_dates")} />
                  </div>
                </div>
                <div className={sectionClass}>
                  <div className={sectionTitleClass}>Secondary School / High School</div>
                  <div className="p-3 grid grid-cols-1 gap-2">
                    <Field label="School" value={getDraft("hs_school")} />
                    <Field label="Address" value={getDraft("hs_address")} />
                    <Field label="Inclusive Dates" value={getDraft("hs_incl_dates")} />
                    <Field label="Awards/Honors/Scholarship Grants" value={getDraft("hs_awards")} />
                  </div>
                </div>
                <div className={sectionClass}>
                  <div className={sectionTitleClass}>College</div>
                  <div className="p-3 grid grid-cols-1 gap-2">
                    <Field label="School" value={getDraft("college_school")} />
                    <Field label="Address" value={getDraft("college_address")} />
                    <Field label="Degree/Course" value={getDraft("college_degree")} />
                    <Field label="Inclusive Dates" value={getDraft("college_dates")} />
                    <Field label="Awards/Honors/Scholarship Grants" value={getDraft("college_awards")} />
                  </div>
                </div>
                <div className={cn(sectionClass, "lg:col-span-2")}>
                  <div className={sectionTitleClass}>Graduate Studies</div>
                  <div className="p-3 grid grid-cols-1 md:grid-cols-2 gap-2">
                    <Field label="School" value={getDraft("grad_school")} />
                    <Field label="Address" value={getDraft("grad_address")} />
                    <Field label="Degree/Course" value={getDraft("grad_degree")} />
                    <Field label="Inclusive Dates" value={getDraft("grad_dates")} />
                  </div>
                </div>
              </div>
            )}

            {activeLowerTab === "Attachments" && (
              <div className={sectionClass}>
                <div className={sectionTitleClass}>Attachments</div>
                <div className="p-3 space-y-3">
                  <div className="rounded-xl border border-border/60 overflow-hidden">
                    <div className="grid grid-cols-5 text-[11px] font-semibold bg-muted/30 border-b border-border/60">
                      {["ID", "Date", "Particular", "Document", "Remarks"].map((h) => (
                        <div key={h} className="px-2 py-2 border-r border-border/60 last:border-r-0">{h}</div>
                      ))}
                    </div>
                    <div className="h-24 px-2 py-2 text-xs text-muted-foreground">No records found.</div>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <Button variant="outline" className="h-8 text-xs">Add New...</Button>
                    <Button variant="outline" className="h-8 text-xs">Remove</Button>
                    <Button variant="outline" className="h-8 text-xs">Preview</Button>
                  </div>
                </div>
              </div>
            )}

            {activeLowerTab === "Medical Records" && (
              <div className={sectionClass}>
                <div className={sectionTitleClass}>Medical Records</div>
                <div className="p-3 space-y-3">
                  <div className="rounded-xl border border-border/60 overflow-hidden">
                    <div className="grid grid-cols-6 text-[11px] font-semibold bg-muted/30 border-b border-border/60">
                      {["ID", "Date", "Complain", "Diagnosis", "Physician", "Attachment"].map((h) => (
                        <div key={h} className="px-2 py-2 border-r border-border/60 last:border-r-0">{h}</div>
                      ))}
                    </div>
                    <div className="h-24 px-2 py-2 text-xs text-muted-foreground">No records found.</div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" className="h-8 text-xs">Add New...</Button>
                    <Button variant="outline" className="h-8 text-xs">Remove</Button>
                    <Button variant="outline" className="h-8 text-xs">Preview</Button>
                  </div>
                </div>
              </div>
            )}

            {activeLowerTab === "Counseling Record" && (
              <div className={sectionClass}>
                <div className={sectionTitleClass}>Counseling Record</div>
                <div className="p-3 space-y-3">
                  <div className="rounded-xl border border-border/60 overflow-hidden">
                    <div className="grid grid-cols-[220px_1fr_1fr] text-[11px] border-b border-border/60 bg-muted/30 font-semibold">
                      <div className="px-2 py-2 border-r border-border/60">Test Record</div>
                      <div className="px-2 py-2 border-r border-border/60">Result</div>
                      <div className="px-2 py-2">Remarks</div>
                    </div>
                    <div className="max-h-[340px] overflow-y-auto">
                      {[
                        "Interest Exam","I.Q. Test","Personality Test","Career","Intends to be?","Course, whose choice?","Favorite Area and Activity",
                        "Social","Club in or out of school","Leadership (responsible)","Person you admire or emulate","Person to whom you open problems",
                        "Counseling Session Nature","Follow-up Nature","Referral Nature"
                      ].map((row) => (
                        <div key={row} className="grid grid-cols-[220px_1fr_1fr] text-xs border-b border-border/40">
                          <div className="px-2 py-2 border-r border-border/40">{row}</div>
                          <div className="px-2 py-2 border-r border-border/40">{getDraft(`counseling_${row.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`)}</div>
                          <div className="px-2 py-2">{getDraft(`counseling_remark_${row.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-[180px_1fr_auto] gap-2 items-center">
                    <Label className="text-xs text-muted-foreground">Counselor / Recorder</Label>
                    <Input readOnly value={getDraft("counselor_name")} className="h-8 rounded-xl text-xs border-border/60 bg-background" />
                    <Button variant="outline" className="h-8 text-xs">Preview</Button>
                  </div>
                </div>
              </div>
            )}

            {activeLowerTab === "Others" && (
              <div className="space-y-2">
                <div className={sectionClass}>
                  <div className="flex items-center justify-between px-3 py-2 border-b border-border/60 bg-muted/30">
                    <div className="text-xs font-semibold">Organizational Membership/Fellowship</div>
                    <div className="flex gap-1">
                      <Button variant="outline" className="h-7 text-[11px] px-2">(+ ) Add</Button>
                      <Button variant="outline" className="h-7 text-[11px] px-2">( - ) Delete</Button>
                    </div>
                  </div>
                  <div className="rounded-b-2xl overflow-hidden">
                    <div className="grid grid-cols-2 text-[11px] font-semibold bg-muted/30 border-b border-border/60">
                      <div className="px-2 py-2 border-r border-border/60">Name of Organization</div>
                      <div className="px-2 py-2">Position</div>
                    </div>
                    <div className="h-24 px-2 py-2 text-xs text-muted-foreground">No records found.</div>
                  </div>
                </div>
                <div className={sectionClass}>
                  <div className="flex items-center justify-between px-3 py-2 border-b border-border/60 bg-muted/30">
                    <div className="text-xs font-semibold">Trainings/Seminars Attended</div>
                    <div className="flex gap-1">
                      <Button variant="outline" className="h-7 text-[11px] px-2">(+ ) Add</Button>
                      <Button variant="outline" className="h-7 text-[11px] px-2">( - ) Delete</Button>
                    </div>
                  </div>
                  <div className="rounded-b-2xl overflow-hidden">
                    <div className="grid grid-cols-4 text-[11px] font-semibold bg-muted/30 border-b border-border/60">
                      <div className="px-2 py-2 border-r border-border/60">Training/Seminar Title</div>
                      <div className="px-2 py-2 border-r border-border/60">Inclusive Dates</div>
                      <div className="px-2 py-2 border-r border-border/60">Venue</div>
                      <div className="px-2 py-2">Sponsor</div>
                    </div>
                    <div className="h-24 px-2 py-2 text-xs text-muted-foreground">No records found.</div>
                  </div>
                </div>
                <div className={sectionClass}>
                  <div className="flex items-center justify-between px-3 py-2 border-b border-border/60 bg-muted/30">
                    <div className="text-xs font-semibold">Talents and Skills / Interests and Hobbies</div>
                    <div className="flex gap-1">
                      <Button variant="outline" className="h-7 text-[11px] px-3">Save</Button>
                      <Button variant="outline" className="h-7 text-[11px] px-3">Clear</Button>
                    </div>
                  </div>
                  <div className="p-3">
                    <Textarea readOnly value={getDraft("talents_and_hobbies")} className="min-h-[140px] rounded-xl text-xs border-border/60 bg-background" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <Label className="text-[10px] uppercase text-muted-foreground">{label}</Label>
      <Input value={value || ""} readOnly className="h-8 rounded-xl text-xs border-border/60 shadow-sm bg-background" />
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[170px_1fr] gap-2 text-xs">
      <div className="text-muted-foreground">{label}</div>
      <div className="font-medium">{value || "-"}</div>
    </div>
  );
}
