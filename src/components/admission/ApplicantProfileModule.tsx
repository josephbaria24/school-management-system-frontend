"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { UserSquare2, Pencil, ChevronDown } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { useSearchParams } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_URL;
const NONE = "__none__";
const APPLICANT_PROFILE_DRAFT_KEY = "admission:applicant-profile:draft:v1";
const APPLICANT_PROFILE_DB_KEY = "applicant-profile";

type AcademicYearTerm = {
  id: number;
  academic_year: string;
  term: string;
};

type Campus = {
  id: number;
  acronym: string;
  campus_name: string | null;
};

type AcademicProgram = {
  id: number;
  college_id: number;
  program_code: string;
  program_name: string;
};

type ProgramCurriculum = {
  id: number;
  major_discipline: string | null;
  description: string | null;
};

type ProgramMajorStudyRow = {
  major_study: string;
  source?: string;
};

type ApplicantProfilePayload = {
  controlledDraft?: Partial<{
    yearTermId: string;
    campusId: string;
    choiceCampusIds: string[];
    choiceProgramIds: string[];
    choiceProgramSearches: string[];
    choiceMajorValues: string[];
    choiceMajorSearches: string[];
    choiceMajorOptions: string[][];
    activeLowerTab: (typeof lowerTabs)[number];
    activeMiniTab: (typeof rightMiniTabs)[number];
  }>;
  inputDraft?: Record<string, string | boolean>;
};

type ApplicantProfileDbRow = {
  app_no?: string;
  term_id?: number | null;
  apply_type_id?: number | null;
  app_date?: string | null;
  updated_at?: string | null;
  adm_status_id?: number | null;
  or_no?: string | null;
  last_name?: string | null;
  first_name?: string | null;
  middle_name?: string | null;
  middle_initial?: string | null;
  gender?: string | null;
  date_of_birth?: string | null;
  choice1_campus_id?: number | null;
  choice1_course?: number | null;
  choice1_course_major?: number | null;
  payload?: ApplicantProfilePayload;
};

const lowerTabs = [
  "Personal Information",
  "Family Background",
  "Educational Background",
  "Admission Test Results & Submitted Requirements",
  "Interview Assessment",
] as const;

const rightMiniTabs = [
  "Resident/Permanent Address",
  "Applicant Photo",
  "Enrolled Program Study",
] as const;

export function ApplicantProfileModule() {
  const searchParams = useSearchParams();
  const appNoFromQuery = searchParams.get("app_no")?.trim() || "";
  const profileKey = appNoFromQuery || APPLICANT_PROFILE_DB_KEY;
  const formRootRef = useRef<HTMLDivElement | null>(null);
  const programOptionsCacheRef = useRef<Record<string, AcademicProgram[]>>({});
  const [yearTerms, setYearTerms] = useState<AcademicYearTerm[]>([]);
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [choiceProgramOptions, setChoiceProgramOptions] = useState<AcademicProgram[][]>([
    [],
    [],
    [],
    [],
  ]);
  const [yearTermId, setYearTermId] = useState("");
  const [campusId, setCampusId] = useState("");
  const [choiceCampusIds, setChoiceCampusIds] = useState<string[]>([NONE, NONE, NONE, NONE]);
  const [choiceProgramIds, setChoiceProgramIds] = useState<string[]>([NONE, NONE, NONE, NONE]);
  const [choiceProgramSearches, setChoiceProgramSearches] = useState<string[]>(["", "", "", ""]);
  const [choiceMajorValues, setChoiceMajorValues] = useState<string[]>([NONE, NONE, NONE, NONE]);
  const [choiceMajorSearches, setChoiceMajorSearches] = useState<string[]>(["", "", "", ""]);
  const [choiceMajorOptions, setChoiceMajorOptions] = useState<string[][]>([[], [], [], []]);
  const [activeLowerTab, setActiveLowerTab] = useState<(typeof lowerTabs)[number]>(
    "Personal Information",
  );
  const [activeMiniTab, setActiveMiniTab] = useState<(typeof rightMiniTabs)[number]>(
    "Resident/Permanent Address",
  );
  const [applicationType, setApplicationType] = useState("freshman");
  const [applicationStatus, setApplicationStatus] = useState("PENDING");
  const [lastUpdateText, setLastUpdateText] = useState("");
  const [currentAppNo, setCurrentAppNo] = useState(appNoFromQuery);
  const [admitDialogOpen, setAdmitDialogOpen] = useState(false);
  const [denyDialogOpen, setDenyDialogOpen] = useState(false);
  const [denyReason, setDenyReason] = useState("");

  const applyTypeIdToValue = (id?: number | null) => {
    if (id === 2) return "transferee";
    if (id === 3) return "cross-enrollee";
    if (id === 4) return "returnee";
    return "freshman";
  };

  const statusFromId = (id?: number | null) => {
    if (id === 2) return "IN PROCESS";
    if (id === 3) return "APPROVED";
    if (id === 4) return "DENIED";
    if (id === 5) return "CANCELLED";
    return "PENDING";
  };

  const getFieldSaveKey = (
    el: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement,
    idx: number,
  ) => {
    const existing = el.getAttribute("data-applicant-save-key");
    if (existing) return existing;
    const explicit = el.name || el.id;
    const key = explicit
      ? `${el.tagName.toLowerCase()}::${explicit}`
      : `${el.tagName.toLowerCase()}::auto-${idx}`;
    el.setAttribute("data-applicant-save-key", key);
    return key;
  };

  const collectApplicantProfilePayload = () => {
    const root = formRootRef.current;
    if (!root) return null;

    const fields = Array.from(
      root.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(
        "input, textarea, select",
      ),
    );

    const inputDraft: Record<string, string | boolean> = {};
    fields.forEach((el, idx) => {
      if (el instanceof HTMLInputElement && (el.type === "button" || el.type === "submit")) return;
      const key = getFieldSaveKey(el, idx);
      if (el instanceof HTMLInputElement && (el.type === "checkbox" || el.type === "radio")) {
        inputDraft[key] = el.checked;
      } else {
        inputDraft[key] = el.value;
      }
    });

    const controlledDraft = {
      yearTermId,
      campusId,
      choiceCampusIds,
      choiceProgramIds,
      choiceProgramSearches,
      choiceMajorValues,
      choiceMajorSearches,
      choiceMajorOptions,
      activeLowerTab,
      activeMiniTab,
    };

    return { controlledDraft, inputDraft };
  };

  const applyApplicantProfilePayload = (payload: ApplicantProfilePayload) => {
    const d = payload.controlledDraft;
    if (d) {
      if (typeof d.yearTermId === "string") setYearTermId(d.yearTermId);
      if (typeof d.campusId === "string") setCampusId(d.campusId);
      if (Array.isArray(d.choiceCampusIds) && d.choiceCampusIds.length === 4) setChoiceCampusIds(d.choiceCampusIds);
      if (Array.isArray(d.choiceProgramIds) && d.choiceProgramIds.length === 4) setChoiceProgramIds(d.choiceProgramIds);
      if (Array.isArray(d.choiceProgramSearches) && d.choiceProgramSearches.length === 4)
        setChoiceProgramSearches(d.choiceProgramSearches);
      if (Array.isArray(d.choiceMajorValues) && d.choiceMajorValues.length === 4) setChoiceMajorValues(d.choiceMajorValues);
      if (Array.isArray(d.choiceMajorSearches) && d.choiceMajorSearches.length === 4)
        setChoiceMajorSearches(d.choiceMajorSearches);
      if (Array.isArray(d.choiceMajorOptions) && d.choiceMajorOptions.length === 4) setChoiceMajorOptions(d.choiceMajorOptions);
      if (d.activeLowerTab && lowerTabs.includes(d.activeLowerTab)) setActiveLowerTab(d.activeLowerTab);
      if (d.activeMiniTab && rightMiniTabs.includes(d.activeMiniTab)) setActiveMiniTab(d.activeMiniTab);
    }

    requestAnimationFrame(() => {
      const root = formRootRef.current;
      if (!root || !payload.inputDraft) return;
      const fields = Array.from(
        root.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(
          "input, textarea, select",
        ),
      );
      fields.forEach((el, idx) => {
        if (el instanceof HTMLInputElement && (el.type === "button" || el.type === "submit")) return;
        const key = getFieldSaveKey(el, idx);
        const savedValue = payload.inputDraft?.[key];
        if (savedValue === undefined) return;
        if (el instanceof HTMLInputElement && (el.type === "checkbox" || el.type === "radio")) {
          el.checked = Boolean(savedValue);
          return;
        }
        el.value = String(savedValue);
        el.dispatchEvent(new Event("input", { bubbles: true }));
      });
    });
  };

  const setNamedFieldValue = (name: string, value: string) => {
    const root = formRootRef.current;
    if (!root) return;
    const el = root.querySelector<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(
      `[name="${name}"]`,
    );
    if (!el) return;
    el.value = value;
    el.dispatchEvent(new Event("input", { bubbles: true }));
  };

  const getNamedFieldValue = (name: string) => {
    const root = formRootRef.current;
    if (!root) return "";
    const el = root.querySelector<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(
      `[name="${name}"]`,
    );
    return el?.value?.trim() || "";
  };

  const applyApplicantProfileRow = (row: ApplicantProfileDbRow) => {
    setCurrentAppNo(row.app_no?.trim() || "");
    if (row.term_id) setYearTermId(String(row.term_id));
    if (row.choice1_campus_id) {
      const c1 = String(row.choice1_campus_id);
      setCampusId(c1);
      setChoiceCampusIds([c1, NONE, NONE, NONE]);
    }
    if (row.choice1_course) {
      setChoiceProgramIds([String(row.choice1_course), NONE, NONE, NONE]);
    }
    setApplicationType(applyTypeIdToValue(row.apply_type_id ?? null));
    setApplicationStatus(statusFromId(row.adm_status_id ?? null));
    setLastUpdateText(row.updated_at ? new Date(row.updated_at).toLocaleString() : "");

    requestAnimationFrame(() => {
      setNamedFieldValue("app_no", row.app_no ?? "");
      setNamedFieldValue(
        "app_date",
        row.app_date ? new Date(row.app_date).toISOString().slice(0, 10) : "",
      );
      setNamedFieldValue(
        "date_of_birth",
        row.date_of_birth ? new Date(row.date_of_birth).toISOString().slice(0, 10) : "",
      );
      setNamedFieldValue("or_no", row.or_no ?? "");
      setNamedFieldValue("last_name", row.last_name ?? "");
      setNamedFieldValue("first_name", row.first_name ?? "");
      setNamedFieldValue("middle_name", row.middle_name ?? "");
      setNamedFieldValue("middle_initial", row.middle_initial ?? "");
      setNamedFieldValue("gender", row.gender ?? "");
    });
  };

  const getEffectiveAppNo = () => {
    return currentAppNo || appNoFromQuery || getNamedFieldValue("app_no");
  };

  const runStatusAction = async (action: "admit" | "deny" | "cancel", reason?: string) => {
    if (!API) return;
    const appNo = getEffectiveAppNo();
    if (!appNo) {
      toast({
        title: "Missing application number",
        description: "Open or create an applicant first before applying actions.",
        variant: "destructive",
      });
      return;
    }
    try {
      const res = await fetch(`${API}/api/admission/applications/${encodeURIComponent(appNo)}/status-action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          deny_reason: reason || "",
        }),
      });
      if (!res.ok) throw new Error("failed");
      const row = (await res.json()) as {
        adm_status_id?: number | null;
        updated_at?: string | null;
      };
      setApplicationStatus(statusFromId(row.adm_status_id ?? null));
      setLastUpdateText(row.updated_at ? new Date(row.updated_at).toLocaleString() : "");
      if (action === "deny") setNamedFieldValue("deny_reason", reason || "");
      if (action === "cancel") setNamedFieldValue("deny_reason", "");
      toast({
        title: "Status updated",
        description: `Application is now ${statusFromId(row.adm_status_id ?? null)}.`,
      });
    } catch {
      toast({
        title: "Action failed",
        description: "Could not update applicant status.",
        variant: "destructive",
      });
    }
  };

  const saveApplicantProfileDraft = () => {
    const payload = collectApplicantProfilePayload();
    if (!payload) return;

    localStorage.setItem(
      APPLICANT_PROFILE_DRAFT_KEY,
      JSON.stringify({
        controlledDraft: payload.controlledDraft,
        inputDraft: payload.inputDraft,
        savedAt: new Date().toISOString(),
      }),
    );

    toast({
      title: "Draft saved",
      description: "Applicant profile inputs saved locally on this browser.",
    });
  };

  const saveApplicantProfileToDatabase = async () => {
    if (!API) return;
    const payload = collectApplicantProfilePayload();
    if (!payload) return;

    try {
      const res = await fetch(`${API}/api/admission/applicant-profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile_key: profileKey,
          payload,
        }),
      });
      if (!res.ok) throw new Error("failed");
      toast({
        title: "Saved to database",
        description: "Applicant profile form has been saved to server database.",
      });
    } catch {
      toast({
        title: "Save failed",
        description: "Could not save applicant profile to database.",
        variant: "destructive",
      });
    }
  };

  const clearApplicantProfileDraft = () => {
    localStorage.removeItem(APPLICANT_PROFILE_DRAFT_KEY);
    toast({
      title: "Draft cleared",
      description: "Saved applicant profile draft has been removed.",
    });
  };

  useEffect(() => {
    const load = async () => {
      if (!API) return;
      try {
        const [yRes, cRes] = await Promise.all([
          fetch(`${API}/api/academic-year-terms`),
          fetch(`${API}/api/campuses`),
        ]);
        if (yRes.ok) {
          const y = (await yRes.json()) as AcademicYearTerm[];
          setYearTerms(y);
          if (y[0]) setYearTermId(String(y[0].id));
        }
        if (cRes.ok) {
          const c = (await cRes.json()) as Campus[];
          setCampuses(c);
          if (c[0]) {
            const first = String(c[0].id);
            setCampusId(first);
            setChoiceCampusIds([first, NONE, NONE, NONE]);
          }
        }
      } catch {
        // fallback shell UI
      }
    };
    void load();
  }, []);

  useEffect(() => {
    if (appNoFromQuery) setCurrentAppNo(appNoFromQuery);
  }, [appNoFromQuery]);

  useEffect(() => {
    if (appNoFromQuery) return;
    const raw = localStorage.getItem(APPLICANT_PROFILE_DRAFT_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as {
        controlledDraft?: Partial<{
          yearTermId: string;
          campusId: string;
          choiceCampusIds: string[];
          choiceProgramIds: string[];
          choiceProgramSearches: string[];
          choiceMajorValues: string[];
          choiceMajorSearches: string[];
          choiceMajorOptions: string[][];
          activeLowerTab: (typeof lowerTabs)[number];
          activeMiniTab: (typeof rightMiniTabs)[number];
        }>;
        inputDraft?: Record<string, string | boolean>;
      };

      applyApplicantProfilePayload(parsed);
    } catch {
      // Ignore malformed draft data.
    }
  }, [appNoFromQuery]);

  useEffect(() => {
    const loadFromDatabase = async () => {
      if (!API) return;
      const hasLocalDraft = Boolean(localStorage.getItem(APPLICANT_PROFILE_DRAFT_KEY));
      if (hasLocalDraft && !appNoFromQuery) return;
      try {
        const res = await fetch(`${API}/api/admission/applicant-profile?profile_key=${encodeURIComponent(profileKey)}`);
        if (!res.ok) return;
        const row = (await res.json()) as ApplicantProfileDbRow | null;
        if (!row) return;
        applyApplicantProfileRow(row);
        if (row.payload) {
          applyApplicantProfilePayload(row.payload);
        }
      } catch {
        // keep silent, local UI remains editable
      }
    };
    void loadFromDatabase();
  }, [appNoFromQuery, profileKey]);

  const setChoiceCampus = (idx: number, value: string) => {
    setChoiceCampusIds((prev) => prev.map((v, i) => (i === idx ? value : v)));
    setChoiceProgramIds((prev) => prev.map((v, i) => (i === idx ? NONE : v)));
    setChoiceProgramSearches((prev) => prev.map((v, i) => (i === idx ? "" : v)));
    setChoiceMajorValues((prev) => prev.map((v, i) => (i === idx ? NONE : v)));
    setChoiceMajorSearches((prev) => prev.map((v, i) => (i === idx ? "" : v)));
    setChoiceMajorOptions((prev) => prev.map((v, i) => (i === idx ? [] : v)));
    setChoiceProgramOptions((prev) => prev.map((v, i) => (i === idx ? [] : v)));
  };

  const loadProgramsForChoice = async (idx: number, campusIdStr: string) => {
    const cId = parseInt(campusIdStr, 10);
    if (!API || !Number.isFinite(cId)) {
      setChoiceProgramOptions((prev) => prev.map((v, i) => (i === idx ? [] : v)));
      return;
    }

    const cacheKey = String(cId);
    const cached = programOptionsCacheRef.current[cacheKey];
    if (cached) {
      setChoiceProgramOptions((prev) => prev.map((v, i) => (i === idx ? cached : v)));
      return;
    }

    try {
      const res = await fetch(`${API}/api/academic-programs?status=active&campus_id=${cId}`);
      if (!res.ok) throw new Error("failed to load programs");
      const rows = (await res.json()) as AcademicProgram[];
      programOptionsCacheRef.current[cacheKey] = rows;
      setChoiceProgramOptions((prev) => prev.map((v, i) => (i === idx ? rows : v)));
    } catch {
      setChoiceProgramOptions((prev) => prev.map((v, i) => (i === idx ? [] : v)));
    }
  };

  useEffect(() => {
    choiceCampusIds.forEach((campusChoice, idx) => {
      void loadProgramsForChoice(idx, campusChoice);
    });
  }, [choiceCampusIds]);

  const filteredProgramsByChoice = useMemo(() => {
    return choiceProgramOptions.map((programRows, idx) => {
      const q = choiceProgramSearches[idx]?.trim().toLowerCase();
      if (!q) return programRows;
      return programRows.filter(
        (p) =>
          p.program_code.toLowerCase().includes(q) || p.program_name.toLowerCase().includes(q),
      );
    });
  }, [choiceProgramOptions, choiceProgramSearches]);

  const filteredMajorsByChoice = useMemo(() => {
    return choiceMajorOptions.map((majorRows, idx) => {
      const q = choiceMajorSearches[idx]?.trim().toLowerCase();
      if (!q) return majorRows;
      return majorRows.filter((m) => m.toLowerCase().includes(q));
    });
  }, [choiceMajorOptions, choiceMajorSearches]);

  const setChoiceProgram = async (idx: number, programId: string) => {
    setChoiceProgramIds((prev) => prev.map((v, i) => (i === idx ? programId : v)));
    setChoiceMajorValues((prev) => prev.map((v, i) => (i === idx ? NONE : v)));
    setChoiceMajorSearches((prev) => prev.map((v, i) => (i === idx ? "" : v)));
    if (!API || programId === NONE) {
      setChoiceMajorOptions((prev) => prev.map((v, i) => (i === idx ? [] : v)));
      return;
    }
    try {
      const majorStudyRes = await fetch(`${API}/api/academic-programs/${programId}/major-studies`);
      let uniq: string[] = [];

      if (majorStudyRes.ok) {
        const rows = (await majorStudyRes.json()) as ProgramMajorStudyRow[];
        uniq = Array.from(
          new Set(rows.map((r) => r.major_study?.trim() || "").filter(Boolean)),
        );
      }

      if (uniq.length === 0) {
        const res = await fetch(`${API}/api/program-curriculums?academic_program_id=${programId}`);
        if (!res.ok) throw new Error("failed to load majors");
        const rows = (await res.json()) as ProgramCurriculum[];
        uniq = Array.from(
          new Set(
            rows
              .map((r) => r.major_discipline?.trim() || r.description?.trim() || "")
              .filter(Boolean),
          ),
        );
      }

      setChoiceMajorOptions((prev) => prev.map((v, i) => (i === idx ? uniq : v)));
      setChoiceMajorValues((prev) =>
        prev.map((v, i) => (i === idx ? (uniq[0] ? uniq[0] : NONE) : v)),
      );
    } catch {
      setChoiceMajorOptions((prev) => prev.map((v, i) => (i === idx ? [] : v)));
    }
  };

  const legacyInputClass = "h-7 text-[11px] bg-white rounded-none border-[#7ca1d8]";
  const miniTabInputClass = "h-7 text-[11px] bg-white rounded-sm border-[#7ca1d8]";
  const personalLabelClass = "text-[11px] leading-[1.15] font-semibold text-[#12345b]";
  const addressLabelClass = "text-[11px] leading-[1.15] font-semibold text-[#12345b]";
  const interviewScale = ["Excellent", "Good", "Average", "Poor"] as const;

  const renderLowerTabContent = () => {
    if (activeLowerTab === "Family Background") {
      return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-2 border border-[#7ca1d8] bg-[#dfe8f8] p-1.5">
          <div className="lg:col-span-6 space-y-2">
            <div className="border border-[#7ca1d8] bg-[#edf3ff]">
              <div className="bg-gradient-to-b from-[#dce9fb] to-[#b8cdee] text-[#1e3d63] text-[10px] font-bold px-2 py-0.5">
                FATHER
              </div>
              <div className="p-2 grid grid-cols-[86px_1fr] gap-1 items-center text-[11px]">
                <Label>Father</Label>
                <Input name="father" className={legacyInputClass} />
                <Label>Occupation</Label>
                <Input name="father_occupation" className={legacyInputClass} />
                <Label>Company</Label>
                <Input name="father_company" className={legacyInputClass} />
                <Label>Company Address</Label>
                <Textarea name="father_company_address" className="min-h-[46px] text-[11px] bg-white rounded-none border-[#7ca1d8]" />
                <Label>Email</Label>
                <Input name="father_email" className={legacyInputClass} />
                <Label>Tel No.</Label>
                <div className="flex gap-2">
                  <Input name="father_tel_no" className={cn(legacyInputClass, "max-w-[160px]")} />
                  <Button type="button" variant="outline" className="h-7 text-[10px] rounded-none border-[#7ca1d8]">
                    📄 COPY TO GUARDIAN INFO
                  </Button>
                </div>
              </div>
            </div>
            <div className="border border-[#7ca1d8] bg-[#edf3ff]">
              <div className="bg-gradient-to-b from-[#dce9fb] to-[#b8cdee] text-[#1e3d63] text-[10px] font-bold px-2 py-0.5">
                MOTHER
              </div>
              <div className="p-2 grid grid-cols-[86px_1fr] gap-1 items-center text-[11px]">
                <Label>Mother</Label>
                <Input name="mother" className={legacyInputClass} />
                <Label>Occupation</Label>
                <Input name="mother_occupation" className={legacyInputClass} />
                <Label>Company</Label>
                <Input name="mother_company" className={legacyInputClass} />
                <Label>Company Address</Label>
                <Textarea name="mother_company_address" className="min-h-[46px] text-[11px] bg-white rounded-none border-[#7ca1d8]" />
                <Label>Email</Label>
                <Input name="mother_email" className={legacyInputClass} />
                <Label>Tel No.</Label>
                <div className="flex gap-2">
                  <Input name="mother_tel_no" className={cn(legacyInputClass, "max-w-[160px]")} />
                  <Button type="button" variant="outline" className="h-7 text-[10px] rounded-none border-[#7ca1d8]">
                    📄 COPY TO GUARDIAN INFO
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6 space-y-2">
            <div className="border border-[#7ca1d8] bg-[#edf3ff]">
              <div className="bg-gradient-to-b from-[#dce9fb] to-[#b8cdee] text-[#1e3d63] text-[10px] font-bold px-2 py-0.5">
                GUARDIAN
              </div>
              <div className="p-2 grid grid-cols-[86px_1fr] gap-1 items-center text-[11px]">
                <Label>Guardian</Label>
                <Input name="guardian" className={legacyInputClass} />
                <Label>Relationship</Label>
                <Input name="guardian_relationship" className={legacyInputClass} />
                <Label>Address</Label>
                <Textarea name="guardian_address" className="min-h-[46px] text-[11px] bg-white rounded-none border-[#7ca1d8]" />
                <Label>Tel No.</Label>
                <Input name="guardian_tel_no" className={cn(legacyInputClass, "max-w-[160px]")} />
                <Label>Email</Label>
                <Input name="guardian_email" className={legacyInputClass} />
                <Label>Occupation</Label>
                <Input name="guardian_occupation" className={legacyInputClass} />
                <Label>Company</Label>
                <Input name="guardian_company" className={legacyInputClass} />
              </div>
            </div>
            <div className="border border-[#7ca1d8] bg-[#edf3ff]">
              <div className="bg-gradient-to-b from-[#ad0000] to-[#7f0000] text-white text-[10px] font-bold px-2 py-0.5">
                EMERGENCY CONTACT PERSON
              </div>
              <div className="p-2 grid grid-cols-[86px_1fr] gap-1 items-center text-[11px]">
                <Label>Contact Person</Label>
                <Input name="emergency_contact" className={legacyInputClass} />
                <Label>Address</Label>
                <Textarea name="emergency_address" className="min-h-[46px] text-[11px] bg-white rounded-none border-[#7ca1d8]" />
                <Label>Mobile No.</Label>
                <Input name="emergency_mobile_no" className={cn(legacyInputClass, "max-w-[160px]")} />
                <Label>Tel No.</Label>
                <div className="flex gap-2">
                  <Input name="emergency_tel_no" className={cn(legacyInputClass, "max-w-[160px]")} />
                  <Button type="button" variant="outline" className="h-7 text-[10px] rounded-none border-[#7ca1d8]">
                    📄 COPY GUARDIAN INFO
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (activeLowerTab === "Educational Background") {
      return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-2 border border-[#7ca1d8] bg-[#dfe8f8] p-1.5">
          <div className="lg:col-span-6 space-y-2">
            <div className="border border-[#7ca1d8] bg-[#edf3ff]">
              <div className="bg-gradient-to-b from-[#dce9fb] to-[#b8cdee] text-[#1e3d63] text-[10px] font-bold px-2 py-0.5">
                ELEMENTARY SCHOOL
              </div>
              <div className="p-2 grid grid-cols-[96px_1fr_26px] gap-1 items-center text-[11px]">
                <Label>Name of School</Label>
                <Input name="elem_school" className={legacyInputClass} />
                <Button type="button" variant="outline" className="h-7 w-7 p-0 rounded-none border-[#7ca1d8]">
                  📝
                </Button>
                <Label>Address</Label>
                <Textarea name="elem_address" className="min-h-[56px] text-[11px] bg-white rounded-none border-[#7ca1d8]" />
                <span />
                <Label>Inclusive Dates</Label>
                <Input name="elem_incl_dates" className={legacyInputClass} />
                <span />
              </div>
            </div>
            <div className="border border-[#7ca1d8] bg-[#edf3ff]">
              <div className="bg-gradient-to-b from-[#dce9fb] to-[#b8cdee] text-[#1e3d63] text-[10px] font-bold px-2 py-0.5">
                SECONDARY SCHOOL
              </div>
              <div className="p-2 grid grid-cols-[96px_1fr_26px] gap-1 items-center text-[11px]">
                <Label>Name of School</Label>
                <Input name="hs_school" className={legacyInputClass} />
                <Button type="button" variant="outline" className="h-7 w-7 p-0 rounded-none border-[#7ca1d8]">
                  📝
                </Button>
                <Label>Address</Label>
                <Textarea name="hs_address" className="min-h-[56px] text-[11px] bg-white rounded-none border-[#7ca1d8]" />
                <span />
                <Label>Inclusive Dates</Label>
                <Input name="hs_incl_dates" className={legacyInputClass} />
                <span />
                <Label>Form 137 GW</Label>
                <Input name="form137_gwa" className={cn(legacyInputClass, "max-w-[160px]")} />
                <Label className="justify-self-end">Form 137 English</Label>
                <Input name="form137_english" className={cn(legacyInputClass, "max-w-[160px]")} />
                <Label>Form 137 Math</Label>
                <Input name="form137_math" className={cn(legacyInputClass, "max-w-[160px]")} />
                <Label className="justify-self-end">Form 137 Science</Label>
                <Input name="form137_science" className={cn(legacyInputClass, "max-w-[160px]")} />
                <Label>NCAE</Label>
                <Select defaultValue={NONE}>
                  <SelectTrigger className={legacyInputClass}>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>Select</SelectItem>
                    <SelectItem value="none">N/A</SelectItem>
                  </SelectContent>
                </Select>
                <span />
              </div>
            </div>
          </div>

          <div className="lg:col-span-6 space-y-2">
            {["VOCATIONAL/TRADE COURSE", "COLLEGE", "GRADUATE STUDIES"].map((title) => (
              <div key={title} className="border border-[#7ca1d8] bg-[#edf3ff]">
                <div className="bg-gradient-to-b from-[#dce9fb] to-[#b8cdee] text-[#1e3d63] text-[10px] font-bold px-2 py-0.5">
                  {title}
                </div>
                <div className="p-2 grid grid-cols-[96px_1fr_26px] gap-1 items-center text-[11px]">
                  <Label>Name of School</Label>
                  <Input className={legacyInputClass} />
                  <Button type="button" variant="outline" className="h-7 w-7 p-0 rounded-none border-[#7ca1d8]">
                    📝
                  </Button>
                  <Label>Address</Label>
                  <Input className={legacyInputClass} />
                  <span />
                  <Label>Degree/Course</Label>
                  <Input className={legacyInputClass} />
                  <span />
                  <Label>Inclusive Dates</Label>
                  <Input className={legacyInputClass} />
                  <span />
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (activeLowerTab === "Admission Test Results & Submitted Requirements") {
      const docItems = [
        "Certified True Copy of Report Card",
        "Form 137 (card)",
        "Form 138",
        "Authenticated NSO Birth Certificate",
        "Transcript of Records",
        "Letter of Recommendation",
        "Good Moral Character",
        "Passport-Size Color Photo",
        "Honorable Dismissal/ Transfer Credential",
        "Baptismal Certificate",
        "Non-Catholic Religion",
        "Scholarship Application",
        "Income Tax Return (ITR)",
        "Medical Certificate",
        "Letter of Application",
        "Passport with Student Visa",
        "Self-stamped Mailing Envelope",
        "ACR",
        "Study Permit",
      ];

      return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-2 border border-[#7ca1d8] bg-[#dfe8f8] p-1.5">
          <div className="lg:col-span-5 border border-[#7ca1d8] bg-[#edf3ff]">
            <div className="bg-gradient-to-b from-[#dce9fb] to-[#b8cdee] text-[#1e3d63] text-[10px] font-bold px-2 py-0.5">
              ADMISSION ENTRANCE EXAM
            </div>
            <div className="p-2 space-y-1 text-[11px]">
              <div className="grid grid-cols-[78px_1fr] gap-1 items-center">
                <Label>Exam Date:</Label>
                <div className="grid grid-cols-[120px_1fr] gap-1">
                  <Input className={legacyInputClass} defaultValue="01/09/2006" />
                  <span className="text-muted-foreground self-center">dd/mm/yyyy</span>
                </div>
                <Label>Testing Ref:</Label>
                <Select defaultValue={NONE}>
                  <SelectTrigger className={legacyInputClass}>
                    <SelectValue placeholder="" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>Select</SelectItem>
                  </SelectContent>
                </Select>
                <Label>Exam Ref No:</Label>
                <Input className={legacyInputClass} />
                <Label>Proctor:</Label>
                <div className="grid grid-cols-[1fr_28px] gap-1">
                  <Select defaultValue={NONE}>
                    <SelectTrigger className={legacyInputClass}>
                      <SelectValue placeholder="" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE}>Select</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button type="button" variant="outline" className="h-7 w-7 p-0 rounded-none border-[#7ca1d8]">
                    📝
                  </Button>
                </div>
                <Label>Deny Reason:</Label>
                <Textarea className="min-h-[52px] text-[11px] bg-white rounded-none border-[#7ca1d8]" />
              </div>

              <div className="border border-[#9dbde4] mt-1">
                <div className="grid grid-cols-9 text-[10px] font-semibold bg-white border-b border-[#9dbde4]">
                  {[
                    "",
                    "Verbal Reasoning",
                    "Numerical Reasoning",
                    "Abstract Reasoning",
                    "Perceptual Speed",
                    "Accuracy",
                    "Spelling",
                    "Language",
                    "Mechanical Reasoning",
                  ].map((h) => (
                    <div key={h || "blank"} className="px-1 py-1 border-r border-[#9dbde4] last:border-r-0 text-center">
                      {h}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-9 text-[10px] bg-white">
                  <div className="px-1 py-1 border-r border-[#9dbde4] font-semibold">Raw Score</div>
                  {Array.from({ length: 8 }).map((_, idx) => (
                    <div key={idx} className="px-1 py-1 border-r border-[#9dbde4] last:border-r-0">
                      <Input className="h-6 text-[10px] rounded-none border-[#7ca1d8]" />
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between text-[11px] pt-1">
                <span>Last Modified by:</span>
                <span>Last Modified Date :</span>
                <Button type="button" variant="outline" className="h-7 text-[10px] rounded-none border-[#7ca1d8] px-3">
                  Print Result
                </Button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-3 border border-[#7ca1d8] bg-[#edf3ff]">
            <div className="bg-gradient-to-b from-[#dce9fb] to-[#b8cdee] text-[#1e3d63] text-[10px] font-bold px-2 py-0.5">
              ADMIT STUDENT (F4) | DENY STUDENT (F5)
            </div>
            <div className="p-2 space-y-2 text-[11px]">
              <div className="border border-[#9dbde4] bg-white p-1 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold">ENTRANCE EXAM RESULT (2ND SCHED)</span>
                  <Button type="button" variant="outline" className="h-6 text-[10px] rounded-none border-[#7ca1d8] px-2">
                    RE-COMPUTE
                  </Button>
                </div>
                <div className="grid grid-cols-3 gap-1">
                  <Input className="h-6 text-[10px] rounded-none border-[#7ca1d8]" placeholder="RESULT" />
                  <Input className="h-6 text-[10px] rounded-none border-[#7ca1d8]" placeholder="TAKE 1@" />
                  <Input className="h-6 text-[10px] rounded-none border-[#7ca1d8]" placeholder="REMARKS" />
                </div>
              </div>
              <div className="border border-[#9dbde4] bg-white p-1 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold">MEDICAL RESULT (2ND SCHED)</span>
                  <Button type="button" variant="outline" className="h-6 text-[10px] rounded-none border-[#7ca1d8] px-2">
                    SCHEDULE
                  </Button>
                </div>
                <div className="grid grid-cols-3 gap-1">
                  <Input className="h-6 text-[10px] rounded-none border-[#7ca1d8]" placeholder="SCHEDULE" />
                  <Input className="h-6 text-[10px] rounded-none border-[#7ca1d8]" placeholder=" " />
                  <Input className="h-6 text-[10px] rounded-none border-[#7ca1d8]" placeholder="REMARKS" />
                </div>
              </div>
              <label className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <Checkbox /> RECONSIDERED APPLICANT
              </label>
            </div>
          </div>

          <div className="lg:col-span-4 border border-[#c88b8b] bg-[#fff6f6]">
            <div className="bg-gradient-to-b from-[#ffd9d9] to-[#f5bcbc] text-[#6d1f1f] text-[10px] font-bold px-2 py-0.5">
              DOCUMENTS SUBMITTED
            </div>
            <div className="p-2 grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
              {docItems.map((doc) => (
                <label key={doc} className="flex items-center gap-1">
                  <Checkbox />
                  <span>{doc}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      );
    }

    if (activeLowerTab === "Interview Assessment") {
      const criteria = [
        "LEADERSHIP POTENTIAL",
        "DETERMINATION AND PERSEVERANCE",
        "CAREER CHOICE",
        "PASSION AND ATTITUDE",
        "COMMUNICATION SKILLS",
      ];

      return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-2 border border-[#7ca1d8] bg-[#dfe8f8] p-1.5">
          <div className="lg:col-span-7 space-y-2">
            <div className="grid grid-cols-[120px_1fr] gap-1 items-center text-[11px]">
              <Label>Date of Interview :</Label>
              <Input className={cn(legacyInputClass, "max-w-[220px]")} defaultValue="05 Jan 2006" />
              <Label>Interviewer In Charge :</Label>
              <Select defaultValue="administrator">
                <SelectTrigger className={cn(legacyInputClass, "max-w-[380px]")}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="administrator">Administrator</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="border border-[#7ca1d8] bg-white">
              <div className="bg-gradient-to-b from-[#dce9fb] to-[#b8cdee] text-[#1e3d63] text-[10px] font-bold px-2 py-0.5">
                REMARKS / COMMENTS
              </div>
              <div className="p-2">
                <Textarea className="min-h-[110px] text-[11px] bg-white rounded-none border-[#7ca1d8]" />
                <div className="flex justify-end mt-2">
                  <Button type="button" variant="outline" className="h-7 text-[10px] rounded-none border-[#7ca1d8]">
                    🧹 Clear
                  </Button>
                </div>
              </div>
            </div>
            <div className="border border-[#7ca1d8] bg-white p-2 flex flex-wrap items-center gap-2 text-[11px]">
              <span className="text-[28px] leading-none text-[#c00000] font-bold">Over- All Recommendation</span>
              <Input className={cn(legacyInputClass, "w-[72px] text-center text-[20px] font-bold")} defaultValue="0.0" />
              <label className="flex items-center gap-1">
                <input type="radio" name="overall-result" /> Passed
              </label>
              <label className="flex items-center gap-1">
                <input type="radio" name="overall-result" /> Failed
              </label>
              <Button type="button" variant="outline" className="h-7 text-[10px] rounded-none border-[#7ca1d8] px-3">
                Reset
              </Button>
            </div>
          </div>

          <div className="lg:col-span-5 space-y-2">
            {criteria.map((title) => (
              <div key={title} className="border border-[#7ca1d8] bg-white">
                <div className="bg-gradient-to-b from-[#dce9fb] to-[#b8cdee] text-[#1e3d63] text-[10px] font-bold px-2 py-0.5">
                  {title}
                </div>
                <div className="p-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px]">
                  {interviewScale.map((option) => (
                    <label key={`${title}-${option}`} className="flex items-center gap-1">
                      <input type="radio" name={`interview-${title}`} /> {option}
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-2 border border-[#7ca1d8] bg-[#dfe8f8] p-1.5">
        <div className="lg:col-span-5 border border-[#5f88c4] bg-[#edf3ff]">
          <div className="bg-gradient-to-b from-[#d6e6fb] to-[#9bbce7] text-[#2c4f7c] text-[10px] font-bold px-2 py-0.5 border-b border-[#7ca1d8]">
            PERSONAL INFORMATION
          </div>
          <div className="p-2 grid grid-cols-[74px_1fr_70px_1fr] gap-x-1.5 gap-y-1.5 items-center text-[11px]">
            <Label className={personalLabelClass}>Last Name</Label>
            <Input name="last_name" className={cn(legacyInputClass, "col-span-3")} defaultValue="Baria" />
            <Label className={personalLabelClass}>Given Name</Label>
            <Input name="first_name" className={cn(legacyInputClass, "col-span-3")} defaultValue="Joseph" />
            <Label className={personalLabelClass}>Middle Name</Label>
            <Input name="middle_name" className={cn(legacyInputClass, "col-span-3")} defaultValue="Lucas" />
            <Label className={personalLabelClass}>Middle Initial</Label>
            <Input name="middle_initial" className={legacyInputClass} defaultValue="L" />
            <Label className={cn(personalLabelClass, "text-right")}>Ext. Name</Label>
            <Input name="ext_name" className={legacyInputClass} />
            <Label className={personalLabelClass}>Gender</Label>
            <div className="col-span-3 flex items-center gap-4">
              <label className="flex items-center gap-1 text-[11px] leading-4">
                <input type="radio" name="gender" value="M" defaultChecked /> Male
              </label>
              <label className="flex items-center gap-1 text-[11px] leading-4">
                <input type="radio" name="gender" value="F" /> Female
              </label>
            </div>
            <Label className={personalLabelClass}>Civil Status</Label>
            <Select defaultValue="single">
              <SelectTrigger className={legacyInputClass}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="single">Single</SelectItem>
              </SelectContent>
            </Select>
            <span />
            <span />
            <Label className={personalLabelClass}>Date of Birth</Label>
            <Input name="date_of_birth" className={legacyInputClass} defaultValue="January 05, 2006" />
            <span className="text-muted-foreground text-[10px] col-span-2">mm/dd/yyyy</span>
            <Label className={personalLabelClass}>Place of Birth</Label>
            <Input name="place_of_birth" className={cn(legacyInputClass, "col-span-3")} defaultValue="PPC" />
            <Label className={personalLabelClass}>Nationality</Label>
            <Select defaultValue="filipino">
              <SelectTrigger className={legacyInputClass}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="filipino">Filipino</SelectItem>
              </SelectContent>
            </Select>
            <span />
            <label className="col-span-2 flex items-center gap-1 text-[11px] leading-4">
              <Checkbox /> Foreign Student?
            </label>
            <Label className={personalLabelClass}>Religion</Label>
            <Select defaultValue="born-again">
              <SelectTrigger className={legacyInputClass}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="born-again">Born Again Christian</SelectItem>
                <SelectItem value="roman-catholic">Roman Catholic</SelectItem>
                <SelectItem value="islam">Islam</SelectItem>
              </SelectContent>
            </Select>
            <span />
            <span />
            <Label className={personalLabelClass}>Telephone No.</Label>
            <Input name="tel_no" className={legacyInputClass} />
            <Label className={cn(personalLabelClass, "text-right")}>Mobile Phone</Label>
            <Input name="mobile_no" className={legacyInputClass} />
            <Label className={personalLabelClass}>Email</Label>
            <Input name="email" className={cn(legacyInputClass, "col-span-3")} />
            <Label className={personalLabelClass}>Testing Date</Label>
            <Input className={cn(legacyInputClass, "bg-[#fff9bf]")} />
            <Label className={cn(personalLabelClass, "text-right")}>Ctr (0)</Label>
            <Input className={legacyInputClass} />
          </div>
        </div>

        <div className="lg:col-span-7 border border-[#5f88c4] bg-[#edf3ff]">
          <div className="flex flex-wrap gap-0.5 border-b border-[#9dbde4] p-0.5">
            {rightMiniTabs.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveMiniTab(tab)}
                className={cn(
                  "px-2 py-0.5 text-[11px] border border-[#9dbde4] rounded-none",
                  activeMiniTab === tab
                    ? "bg-[#f5e8a8] text-[#4f4a2f] font-semibold"
                    : "bg-[#e7ecf8] text-[#556b7d]",
                )}
              >
                {tab}
              </button>
            ))}
          </div>
          {activeMiniTab === "Resident/Permanent Address" ? (
            <div className="p-1.5 space-y-1.5 text-[11px]">
              <div className="border border-[#7ca1d8] bg-white p-2">
                <p className="text-[10px] font-bold text-[#2c4f7c] mb-1">RESIDENCE/PRESENT ADDRESS</p>
                <div className="grid grid-cols-[74px_1fr_66px_1fr] gap-x-1.5 gap-y-1.5 items-center">
                  <Label className={addressLabelClass}>Residence</Label>
                  <Input name="res_address" className={legacyInputClass} />
                  <Label className={cn(addressLabelClass, "text-right")}>Street</Label>
                  <Input name="res_street" className={legacyInputClass} />
                  <Label className={addressLabelClass}>Barangay</Label>
                  <Input name="res_barangay" className={legacyInputClass} />
                  <Label className={cn(addressLabelClass, "text-right")}>Town/City</Label>
                  <Input name="res_town_city" className={legacyInputClass} />
                  <Label className={addressLabelClass}>Province</Label>
                  <Input name="res_province" className={legacyInputClass} defaultValue="Puerto Princesa" />
                  <Label className={cn(addressLabelClass, "text-right")}>Zip Code</Label>
                  <Input name="res_zip_code" className={legacyInputClass} />
                </div>
              </div>
              <div className="border border-[#7ca1d8] bg-white p-2">
                <p className="text-[10px] font-bold text-[#2c4f7c] mb-1">PERMANENT ADDRESS</p>
                <div className="grid grid-cols-[74px_1fr_66px_1fr] gap-x-1.5 gap-y-1.5 items-center">
                  <Label className={addressLabelClass}>Residence</Label>
                  <Input name="perm_address" className={legacyInputClass} />
                  <Label className={cn(addressLabelClass, "text-right")}>Street</Label>
                  <Input name="perm_street" className={legacyInputClass} />
                  <Label className={addressLabelClass}>Barangay</Label>
                  <Input name="perm_barangay" className={legacyInputClass} />
                  <Label className={cn(addressLabelClass, "text-right")}>Town/City</Label>
                  <Input name="perm_town_city" className={legacyInputClass} />
                  <Label className={addressLabelClass}>Province</Label>
                  <Input name="perm_province" className={legacyInputClass} defaultValue="Puerto Princesa" />
                  <Label className={cn(addressLabelClass, "text-right")}>Zip Code</Label>
                  <div className="grid grid-cols-[1fr_auto] gap-1">
                    <Input name="perm_zip_code" className={legacyInputClass} />
                    <Button
                      type="button"
                      variant="outline"
                      className="h-10 px-2 text-[10px] leading-tight rounded-none border-[#7ca1d8]"
                    >
                      COPY
                      <br />
                      RESIDENCE
                      <br />
                      ADDRESS
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ) : activeMiniTab === "Applicant Photo" ? (
            <div className="p-1.5">
              <div className="border border-[#5f86c2] bg-[#f0d274] p-1 grid grid-cols-1 lg:grid-cols-[1fr_212px] gap-1 min-h-[290px]">
                <div className="border border-[#5f86c2] bg-[#efefef] flex items-center justify-center p-1">
                  <div className="w-full h-full min-h-[262px] border border-[#5f86c2] bg-white flex items-center justify-center p-2">
                    <div className="w-[250px] h-[250px] rounded-full border-[5px] border-black flex items-center justify-center relative bg-[#f8f8f8]">
                      <div className="w-[142px] h-[142px] border-[4px] border-black rounded-sm bg-white flex items-center justify-center text-center px-2">
                        <span className="text-[11px] font-bold tracking-wide leading-tight">
                          APPLICANT PHOTO
                        </span>
                      </div>
                      <span className="absolute text-[7px] font-semibold top-2.5">PALAWAN STATE UNIVERSITY</span>
                      <span className="absolute text-[7px] font-semibold bottom-2.5">PHILIPPINES</span>
                    </div>
                  </div>
                </div>
                <div className="border border-[#5f86c2] bg-[#f0d274] p-1.5 text-[11px] space-y-1.5">
                  <div className="space-y-0.5">
                    <Label className="text-[11px] font-semibold">Device:</Label>
                    <Select defaultValue="default-cam">
                      <SelectTrigger className={cn(legacyInputClass, "h-6 bg-white border-[#8c8c8c] rounded-none")}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="default-cam">HP Wide Vision HD Camera</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-1">
                    <Button type="button" variant="outline" className="h-6 px-3 text-[10px] rounded-none border-[#5f86c2] bg-white text-black">
                      CONNECT
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="h-6 px-2 text-[10px] rounded-none border-[#b9b9b9] bg-[#e9e2bf] text-[#9a9a9a]"
                      disabled
                    >
                      CONFIGURE
                    </Button>
                  </div>
                  <div className="space-y-0.5">
                    <Label className="text-[11px] font-semibold">Capture Resolution:</Label>
                    <Select defaultValue="res-default">
                      <SelectTrigger className={cn(legacyInputClass, "h-6 bg-white border-[#8c8c8c] rounded-none")}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="res-default">Default</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-6 w-[95px] px-2 text-[10px] rounded-none border-[#b9b9b9] bg-[#e9e2bf] text-[#9a9a9a]"
                    disabled
                  >
                    PREVIEW OFF
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-12 text-[31px] leading-none rounded-none border-[#9a9a9a] bg-[#d6d6d6] text-[#8b8b8b] font-bold"
                  >
                    Take Picture!
                  </Button>
                  <div className="grid grid-cols-2 gap-1">
                    <Button type="button" variant="outline" className="h-8 text-[11px] rounded-none border-[#5f86c2] bg-white">
                      Save Photo
                    </Button>
                    <Button type="button" variant="outline" className="h-8 text-[11px] rounded-none border-[#5f86c2] bg-white">
                      Delete Photo
                    </Button>
                  </div>
                  <Button type="button" variant="outline" className="w-full h-8 text-[11px] rounded-none border-[#5f86c2] bg-white">
                    Load Picture from Files...
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-1.5">
              <div className="border border-[#7ca1d8] bg-[#c8d9b1] p-2 min-h-[270px]">
                <div className="grid grid-cols-[92px_1fr] gap-1.5 items-center text-[11px]">
                  <Label className="text-[11px] font-semibold">Student Number:</Label>
                  <Input className={cn(legacyInputClass, "max-w-[140px]")} />
                  <Label className="text-[11px] font-semibold">College/Dept:</Label>
                  <Input className={cn(legacyInputClass, "max-w-[370px]")} />
                  <Label className="text-[11px] font-semibold">Academic Program:</Label>
                  <Input className={cn(legacyInputClass, "max-w-[370px]")} />
                  <Label className="text-[11px] font-semibold">Major Study:</Label>
                  <Input className={cn(legacyInputClass, "max-w-[370px]")} />
                  <Label className="text-[11px] font-semibold">Curriculum:</Label>
                  <Input className={cn(legacyInputClass, "max-w-[370px]")} />
                  <Label className="text-[11px] font-semibold">Year Level:</Label>
                  <Input className={cn(legacyInputClass, "max-w-[140px]")} />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const hasApplicantKey = Boolean((currentAppNo || appNoFromQuery).trim());
  const applicantFullName = [getNamedFieldValue("last_name"), getNamedFieldValue("first_name"), getNamedFieldValue("middle_name")]
    .filter(Boolean)
    .join(", ");
  const applicantDob = getNamedFieldValue("date_of_birth");
  const applicantGender = getNamedFieldValue("gender");
  const applicantNationality = getNamedFieldValue("nationality_id");
  const statusBadgeClass =
    applicationStatus === "DENIED"
      ? "rounded-full bg-red-500/10 text-red-700 border-red-200/50"
      : applicationStatus === "APPROVED"
        ? "rounded-full bg-emerald-500/10 text-emerald-700 border-emerald-200/50"
        : applicationStatus === "CANCELLED"
          ? "rounded-full bg-slate-500/10 text-slate-700 border-slate-200/50"
          : "rounded-full bg-amber-500/10 text-amber-700 border-amber-200/50";

  return (
    <div className="h-full bg-background relative overflow-x-hidden">
      <div className="w-full px-2 pt-2 pb-4">
        <div className="mb-6 space-y-2">
          <h1 className="text-xl font-extrabold tracking-tight uppercase">
            Admission Module
          </h1>
          <p className="text-base text-muted-foreground">
            Use this module to accept new applicant, admit or deny an applicant, record entrance
            exam result, etc...
          </p>
        </div>

        <Card ref={formRootRef} className="w-full overflow-hidden rounded-2xl border border-border/40 bg-background shadow-sm">
          <div className="flex items-center justify-end px-3 pt-2">
            <div className="inline-flex overflow-hidden rounded-xl border border-border/60 bg-background shadow-sm divide-x divide-border/60">
            <Button
              type="button"
              variant="ghost"
              className="h-8 text-[11px] rounded-none border-0 text-emerald-700 hover:bg-emerald-500/10 hover:text-emerald-800"
              disabled={!hasApplicantKey}
              onClick={() => setAdmitDialogOpen(true)}
            >
              Admit New Student
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="h-8 text-[11px] rounded-none border-0 text-red-700 hover:bg-red-500/10 hover:text-red-800"
              disabled={!hasApplicantKey}
              onClick={() => setDenyDialogOpen(true)}
            >
              Deny an Applicant
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="h-8 text-[11px] rounded-none border-0 text-amber-700 hover:bg-amber-500/10 hover:text-amber-800"
              disabled={!hasApplicantKey}
              onClick={() => void runStatusAction("cancel")}
            >
              Cancel Admit/Deny
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  className="h-8 text-[11px] rounded-none border-0 hover:bg-muted/60 gap-1"
                >
                  Save
                  <ChevronDown className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[150px] text-xs">
                <DropdownMenuItem onClick={() => void saveApplicantProfileToDatabase()}>
                  Save to DB
                </DropdownMenuItem>
                <DropdownMenuItem onClick={saveApplicantProfileDraft}>
                  Save Draft
                </DropdownMenuItem>
                <DropdownMenuItem onClick={clearApplicantProfileDraft}>
                  Clear Draft
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            </div>
          </div>
          <div className="bg-muted/5 text-foreground px-4 py-3 flex items-center justify-between border-b border-border/40">
            <div className="flex items-center gap-3">
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm">
                <UserSquare2 className="h-5 w-5" />
              </div>
              <div className="leading-tight">
                <div className="text-base font-bold tracking-tight">
                  Applicant Profile Management
                </div>
                <div className="text-sm text-muted-foreground font-medium">
                  Admission manager • Create and manage applicant records
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 space-y-4">
            <div className="border border-border/60 rounded-2xl overflow-hidden bg-card shadow-sm">
              <div className="bg-muted/5 text-foreground px-3 py-2 text-xs font-bold tracking-tight shrink-0 border-b border-border/60 uppercase">
                Application Information
              </div>
            <div className="p-2 space-y-2">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-2">
                <div className="lg:col-span-4 space-y-1">
                  <Label className="text-[11px] text-muted-foreground">ACAD. YEAR &amp; TERM:</Label>
                  <Select value={yearTermId} onValueChange={setYearTermId}>
                    <SelectTrigger className="h-9 rounded-xl text-xs border-border/60 shadow-sm bg-background">
                      <SelectValue placeholder="Select term" />
                    </SelectTrigger>
                    <SelectContent>
                      {yearTerms.map((y) => (
                        <SelectItem key={y.id} value={String(y.id)}>
                          {y.academic_year} {y.term}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="lg:col-span-2 space-y-1">
                  <Label className="text-[11px] text-muted-foreground">APPLICATION NO.:</Label>
                  <Input
                    name="app_no"
                    value={currentAppNo}
                    onChange={(e) => setCurrentAppNo(e.target.value)}
                    className="h-9 rounded-xl text-xs border-border/60 shadow-sm bg-background"
                  />
                </div>

                <div className="lg:col-span-2 space-y-1">
                  <Label className="text-[11px] text-muted-foreground">APPLICATION TYPE:</Label>
                  <Select value={applicationType} onValueChange={setApplicationType}>
                    <SelectTrigger className="h-9 rounded-xl text-xs border-border/60 shadow-sm bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="freshman">Freshman</SelectItem>
                      <SelectItem value="transferee">Transferee</SelectItem>
                      <SelectItem value="cross-enrollee">Cross-Enrollee</SelectItem>
                      <SelectItem value="returnee">Returnee</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="lg:col-span-2 space-y-1">
                  <Label className="text-[11px] text-muted-foreground">APPLICATION DATE:</Label>
                  <Input name="app_date" type="date" className="h-9 rounded-xl text-xs border-border/60 shadow-sm bg-background" />
                </div>
                <div className="lg:col-span-2 space-y-1">
                  <Label className="text-[11px] text-muted-foreground">LAST UPDATE:</Label>
                  <Input value={lastUpdateText} disabled className="h-9 rounded-xl text-xs border-border/60 shadow-sm bg-muted/20" />
                </div>
                <div className="lg:col-span-1 space-y-1">
                  <Label className="text-[11px] text-muted-foreground">O.R. NO.</Label>
                  <Input name="or_no" className="h-9 rounded-xl text-xs border-border/60 shadow-sm bg-background px-2" />
                </div>
                <div className="lg:col-span-1 space-y-1">
                  <Label className="text-[11px] text-muted-foreground uppercase">Status</Label>
                  <div className="flex h-9 items-center justify-center">
                    <Badge variant="outline" className={`${statusBadgeClass} px-4 py-1.5 text-sm font-bold tracking-tight shadow-none`}>
                      {applicationStatus}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mt-4">
                {[0, 1, 2, 3].map((choiceIdx) => (
                  <div key={choiceIdx} className="border border-border/60 rounded-2xl overflow-hidden bg-card shadow-sm">
                    <div className="bg-muted/5 text-foreground px-3 py-2 text-xs font-extrabold tracking-tight border-b border-border/60 uppercase">
                      CHOICE {choiceIdx + 1}: Select Campus/Branch
                    </div>
                    <div className="p-3 space-y-3">
                      <div className="space-y-1.5">
                        <Label className="text-[11px] text-muted-foreground">Campus</Label>
                        <Select
                          value={choiceCampusIds[choiceIdx]}
                          onValueChange={(v) => setChoiceCampus(choiceIdx, v)}
                        >
                          <SelectTrigger className="h-9 rounded-xl text-xs border-border/60 shadow-sm bg-background">
                            <SelectValue placeholder="Select campus" />
                          </SelectTrigger>
                          <SelectContent className="max-h-72 overflow-y-auto">
                            <SelectItem value={NONE}>Select campus</SelectItem>
                            {campuses.map((c) => (
                              <SelectItem key={c.id} value={String(c.id)}>
                                {c.acronym}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-[1fr_36px] gap-2 items-end">
                        <div className="space-y-1.5">
                          <Label className="text-[11px] text-muted-foreground">Course/Program</Label>
                          <Select
                            value={choiceProgramIds[choiceIdx]}
                            onValueChange={(v) => {
                              void setChoiceProgram(choiceIdx, v);
                            }}
                          >
                            <SelectTrigger className="h-9 rounded-xl text-xs border-border/60 shadow-sm bg-background">
                              <SelectValue placeholder="Select course/program" />
                            </SelectTrigger>
                            <SelectContent className="max-h-72 overflow-y-auto">
                              <div className="px-2 pt-2 pb-1 sticky top-0 bg-popover z-10 border-b border-border/40">
                                <Input
                                  value={choiceProgramSearches[choiceIdx]}
                                  onChange={(e) =>
                                    setChoiceProgramSearches((prev) =>
                                      prev.map((v, i) => (i === choiceIdx ? e.target.value : v)),
                                    )
                                  }
                                  onKeyDown={(e) => e.stopPropagation()}
                                  onKeyUp={(e) => e.stopPropagation()}
                                  placeholder="Search program code/name"
                                  className="h-8 text-xs"
                                />
                              </div>
                              <SelectItem value={NONE}>Select course/program</SelectItem>
                              {filteredProgramsByChoice[choiceIdx]?.map((p) => (
                                <SelectItem key={p.id} value={String(p.id)}>
                                  {p.program_code} - {p.program_name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <Button type="button" variant="outline" className="h-9 w-9 rounded-xl text-muted-foreground hover:text-primary">
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-[1fr_36px] gap-2 items-end">
                        <div className="space-y-1.5">
                          <Label className="text-[11px] text-muted-foreground">Major Study</Label>
                          <Select
                            value={choiceMajorValues[choiceIdx]}
                            onValueChange={(v) =>
                              setChoiceMajorValues((prev) => prev.map((cv, i) => (i === choiceIdx ? v : cv)))
                            }
                          >
                            <SelectTrigger className="h-9 rounded-xl text-xs border-border/60 shadow-sm bg-background">
                              <SelectValue placeholder="Select major study" />
                            </SelectTrigger>
                            <SelectContent className="max-h-72 overflow-y-auto">
                              <div className="px-2 pt-2 pb-1 sticky top-0 bg-popover z-10 border-b border-border/40">
                                <Input
                                  value={choiceMajorSearches[choiceIdx]}
                                  onChange={(e) =>
                                    setChoiceMajorSearches((prev) =>
                                      prev.map((v, i) => (i === choiceIdx ? e.target.value : v)),
                                    )
                                  }
                                  onKeyDown={(e) => e.stopPropagation()}
                                  onKeyUp={(e) => e.stopPropagation()}
                                  placeholder="Search major study"
                                  className="h-8 text-xs"
                                />
                              </div>
                              <SelectItem value={NONE}>Select major study</SelectItem>
                              {filteredMajorsByChoice[choiceIdx]?.map((major) => (
                                <SelectItem key={major} value={major}>
                                  {major}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <Button type="button" variant="outline" className="h-9 w-9 rounded-xl text-muted-foreground hover:text-primary">
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-1 border-b border-border/40 bg-muted/20 p-1.5 rounded-xl">
            {lowerTabs.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveLowerTab(tab)}
                className={cn(
                  "px-4 py-2 text-sm font-bold rounded-lg transition-all",
                  activeLowerTab === tab
                    ? "bg-background text-foreground shadow-md"
                    : "text-muted-foreground hover:bg-background/50 hover:text-foreground",
                )}
              >
                {tab}
              </button>
            ))}
          </div>

          {renderLowerTabContent()}
        </div>
      </Card>

      <Dialog open={admitDialogOpen} onOpenChange={setAdmitDialogOpen}>
        <DialogContent className="max-w-[860px] p-0 overflow-hidden rounded-none border-[#2f6ead]">
          <DialogHeader className="bg-gradient-to-b from-[#2d7ce2] to-[#0f4da8] px-3 py-1.5">
            <DialogTitle className="text-white text-base font-semibold">Admit New Student</DialogTitle>
          </DialogHeader>
          <div className="bg-[#bfd6f2] p-3 grid grid-cols-1 md:grid-cols-2 gap-3 text-[12px]">
            <div className="border border-[#5f88c4] bg-[#d6e5f8]">
              <div className="px-2 py-1 bg-[#3a6fae] text-white text-[11px] font-semibold">ADMISSION REQUIREMENTS CHECKLIST</div>
              <div className="p-2 space-y-1">
                {[
                  "Form 137A / Form 138",
                  "Certificate of Good Moral Character",
                  "Passport-Size ID Photo",
                  "True Copy of Exam Test Result",
                ].map((t) => (
                  <label key={t} className="flex items-center gap-2">
                    <Checkbox />
                    <span>{t}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="border border-[#5f88c4] bg-[#d6e5f8] p-2 space-y-1.5">
              <div><span className="font-semibold">Application No.</span> <span className="text-red-700 font-bold">{getEffectiveAppNo()}</span></div>
              <div><span className="font-semibold">Type:</span> {applicationType}</div>
              <div><span className="font-semibold">Date:</span> {getNamedFieldValue("app_date")}</div>
              <div><span className="font-semibold">Full Name:</span> {applicantFullName}</div>
              <div><span className="font-semibold">Date of Birth:</span> {applicantDob}</div>
              <div><span className="font-semibold">Gender:</span> {applicantGender}</div>
              <div><span className="font-semibold">Nationality:</span> {applicantNationality}</div>
            </div>
          </div>
          <DialogFooter className="bg-[#9fc0e7] p-2 border-t border-[#5f88c4]">
            <Button type="button" className="h-8 rounded-none bg-[#4d9b4d] hover:bg-[#3a843a]" onClick={async () => { await runStatusAction("admit"); setAdmitDialogOpen(false); }}>
              Ok
            </Button>
            <Button type="button" variant="destructive" className="h-8 rounded-none" onClick={() => setAdmitDialogOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={denyDialogOpen} onOpenChange={setDenyDialogOpen}>
        <DialogContent className="max-w-[760px] p-0 overflow-hidden rounded-none border-[#2f6ead]">
          <DialogHeader className="bg-gradient-to-b from-[#2d7ce2] to-[#0f4da8] px-3 py-1.5">
            <DialogTitle className="text-white text-base font-semibold">Deny an Application</DialogTitle>
          </DialogHeader>
          <div className="bg-[#bfd6f2] p-3 grid grid-cols-1 md:grid-cols-[1fr_300px] gap-3 text-[12px]">
            <div>
              <Label className="text-[12px]">Reason in denying this application.</Label>
              <Textarea
                value={denyReason}
                onChange={(e) => setDenyReason(e.target.value)}
                className="mt-1 min-h-[150px] rounded-none border-[#7ca1d8] bg-white text-[12px]"
              />
            </div>
            <div className="border border-[#5f88c4] bg-[#d6e5f8] p-2 space-y-1.5">
              <div><span className="font-semibold">Application No.</span> <span className="text-red-700 font-bold">{getEffectiveAppNo()}</span></div>
              <div><span className="font-semibold">Type:</span> {applicationType}</div>
              <div><span className="font-semibold">Date:</span> {getNamedFieldValue("app_date")}</div>
              <div><span className="font-semibold">Full Name:</span> {applicantFullName}</div>
              <div><span className="font-semibold">Date of Birth:</span> {applicantDob}</div>
              <div><span className="font-semibold">Gender:</span> {applicantGender}</div>
            </div>
          </div>
          <DialogFooter className="bg-[#9fc0e7] p-2 border-t border-[#5f88c4]">
            <Button type="button" className="h-8 rounded-none bg-[#4d9b4d] hover:bg-[#3a843a]" onClick={async () => { await runStatusAction("deny", denyReason); setDenyDialogOpen(false); }}>
              Ok
            </Button>
            <Button type="button" variant="destructive" className="h-8 rounded-none" onClick={() => setDenyDialogOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  </div>
);
}

