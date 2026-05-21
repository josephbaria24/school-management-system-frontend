"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  ArrowLeftRight,
  BookPlus,
  BookX,
  CalendarClock,
  Loader2,
  RefreshCw,
  Save,
  Search,
  Settings2,
  Trash2,
  UserMinus,
  X,
} from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL;

type YearTerm = { id: number; academic_year: string; term: string };

const ADD_DROP_CAMPUSES = ["PSU Narra", "Main Campus", "Extension campus"] as const;

type AdcChargingMode =
  | "no_charge"
  | "charge_once"
  | "charge_per_subject"
  | "charge_per_transactions";

type AddDropModuleConfig = {
  defaultAcademicYearTermId: string;
  defaultCampus: string;
  checkScheduleConflict: boolean;
  checkPrereq: boolean;
  allowIncGrade: boolean;
  allowOverload: boolean;
  allowCrossEnroll: boolean;
  autoHideFullSchedule: boolean;
  printAssessmentAfterSave: boolean;
  adcChargingMode: AdcChargingMode;
  revisionAmount: string;
  chargeDrop: boolean;
  chargeAdd: boolean;
  chargeChange: boolean;
  chargeReservationFee: boolean;
  chargeLabFee: boolean;
  chargeMiscFee: boolean;
  tfRegLectUnits: boolean;
  lfRegLabUnits: boolean;
  tfSplRegLectUnits: boolean;
  lfSplRegLabUnits: boolean;
  internetCondition: boolean;
};

function defaultAddDropModuleConfig(): AddDropModuleConfig {
  return {
    defaultAcademicYearTermId: "",
    defaultCampus: "PSU Narra",
    checkScheduleConflict: true,
    checkPrereq: false,
    allowIncGrade: false,
    allowOverload: false,
    allowCrossEnroll: true,
    autoHideFullSchedule: true,
    printAssessmentAfterSave: true,
    adcChargingMode: "no_charge",
    revisionAmount: "0.00",
    chargeDrop: true,
    chargeAdd: true,
    chargeChange: true,
    chargeReservationFee: false,
    chargeLabFee: true,
    chargeMiscFee: false,
    tfRegLectUnits: true,
    lfRegLabUnits: true,
    tfSplRegLectUnits: true,
    lfSplRegLabUnits: true,
    internetCondition: true,
  };
}

function adcChargingModeLabel(mode: AdcChargingMode) {
  switch (mode) {
    case "no_charge":
      return "No Charge";
    case "charge_once":
      return "Charge Once";
    case "charge_per_subject":
      return "Charge Per Subject";
    case "charge_per_transactions":
      return "Charge Per Transactions";
    default:
      return mode;
  }
}

function parseAdcChargingMode(v: unknown): AdcChargingMode {
  const s = String(v ?? "no_charge");
  if (
    s === "no_charge" ||
    s === "charge_once" ||
    s === "charge_per_subject" ||
    s === "charge_per_transactions"
  ) {
    return s;
  }
  return "no_charge";
}

function moduleConfigFromApi(data: unknown): AddDropModuleConfig {
  const d = defaultAddDropModuleConfig();
  if (!data || typeof data !== "object" || Array.isArray(data)) return d;
  const r = data as Record<string, unknown>;
  return {
    ...d,
    defaultAcademicYearTermId: String(r.defaultAcademicYearTermId ?? "").trim(),
    defaultCampus: String(r.defaultCampus ?? d.defaultCampus).slice(0, 200),
    checkScheduleConflict: Boolean(r.checkScheduleConflict ?? d.checkScheduleConflict),
    checkPrereq: Boolean(r.checkPrereq),
    allowIncGrade: Boolean(r.allowIncGrade),
    allowOverload: Boolean(r.allowOverload),
    allowCrossEnroll: Boolean(r.allowCrossEnroll ?? d.allowCrossEnroll),
    autoHideFullSchedule: Boolean(r.autoHideFullSchedule ?? d.autoHideFullSchedule),
    printAssessmentAfterSave: Boolean(r.printAssessmentAfterSave ?? d.printAssessmentAfterSave),
    adcChargingMode: parseAdcChargingMode(r.adcChargingMode),
    revisionAmount: String(r.revisionAmount ?? d.revisionAmount).slice(0, 32),
    chargeDrop: Boolean(r.chargeDrop ?? d.chargeDrop),
    chargeAdd: Boolean(r.chargeAdd ?? d.chargeAdd),
    chargeChange: Boolean(r.chargeChange ?? d.chargeChange),
    chargeReservationFee: Boolean(r.chargeReservationFee),
    chargeLabFee: Boolean(r.chargeLabFee ?? d.chargeLabFee),
    chargeMiscFee: Boolean(r.chargeMiscFee),
    tfRegLectUnits: Boolean(r.tfRegLectUnits ?? d.tfRegLectUnits),
    lfRegLabUnits: Boolean(r.lfRegLabUnits ?? d.lfRegLabUnits),
    tfSplRegLectUnits: Boolean(r.tfSplRegLectUnits ?? d.tfSplRegLectUnits),
    lfSplRegLabUnits: Boolean(r.lfSplRegLabUnits ?? d.lfSplRegLabUnits),
    internetCondition: Boolean(r.internetCondition ?? d.internetCondition),
  };
}

function ConfigFlagLine({ label, on }: { label: string; on: boolean }) {
  return (
    <div className="flex justify-between gap-2 text-[10px] leading-snug">
      <span className="text-muted-foreground pr-1">{label}</span>
      <span className="shrink-0 font-medium tabular-nums">{on ? "Yes" : "No"}</span>
    </div>
  );
}

type MainTab = "registration" | "transactions" | "withdrawn";
type RegSubTab = "transaction-details" | "assessment";

const scheduleCols = [
  "SCHED.ID",
  "SUBJECT.CODE",
  "SUBJECT.TITLE",
  "SECTION",
  "UNITS",
  "LAB",
  "SCHEDULE.1",
  "ROOM.1",
  "SCHEDULE.2",
  "ROOM.2",
  "SCHEDULE.3",
  "ROOM.3",
  "SCHEDULE.4",
  "ROOM.4",
] as const;

const stagingCols = ["SCHED.ID", "REV.TYPE", "SUBJECT.CODE", "SUBJECT.TITLE", "SECTION", "UNITS"] as const;

const transactionListCols = [
  "TRANS.ID",
  "DATE",
  "REG.ID",
  "STUDENT.NO",
  "STUDENT NAME",
  "FACILITATOR",
  "ASSESSED DATE",
  "ASSESSED BY",
  "EMAIL",
  "CLASSIFICATION",
  "INACTIVE",
  "CLASSID",
  "INDEXID",
] as const;

const withdrawnCols = [
  "TRANS.ID",
  "DATE",
  "REG.ID",
  "STUDENT.NO",
  "FULL NAME",
  "FACILITATOR",
  "ASSESSED.DATE",
  "ASSESSED.BY",
  "OR.NBR.",
  "VALIDATION.DATE",
  "CASHER",
  "TOTAL.NET.ASSESSED",
  "TOTAL.PAYMENT",
  "TOTAL.DISCOUNT",
  "WITHDRAWN BY",
] as const;

type TransactionListRow = {
  id: number;
  trans_date: string | null;
  reg_id: string | null;
  student_no: string | null;
  student_name: string | null;
  facilitator: string | null;
  assessed_date: string | null;
  assessed_by: string | null;
  email: string | null;
  classification: string | null;
  inactive: string | null;
  classid: string | null;
  indexid: string | null;
};

type WithdrawnListRow = {
  id: number;
  trans_date: string | null;
  reg_id: string | null;
  student_no: string | null;
  full_name: string | null;
  facilitator: string | null;
  assessed_date: string | null;
  assessed_by: string | null;
  or_nbr: string | null;
  validation_date: string | null;
  casher: string | null;
  total_net_assessed: string | null;
  total_payment: string | null;
  total_discount: string | null;
  withdrawn_by: string | null;
};

type ScheduleLineRow = {
  id: number;
  sched_id: string | null;
  subject_code: string | null;
  subject_title: string | null;
  section: string | null;
  units: string | null;
  lab: string | null;
  schedule_1: string | null;
  room_1: string | null;
  schedule_2: string | null;
  room_2: string | null;
  schedule_3: string | null;
  room_3: string | null;
  schedule_4: string | null;
  room_4: string | null;
};

type StagingLineRow = {
  id: number;
  sched_id: string | null;
  rev_type: string | null;
  subject_code: string | null;
  subject_title: string | null;
  section: string | null;
  units: string | null;
};

function fmtCell(v: string | null | undefined) {
  return v ?? "";
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[1fr_auto] gap-x-2 gap-y-0.5 text-[11px] border-b border-border/40 py-1.5 last:border-b-0">
      <span className="text-muted-foreground truncate" title={label}>
        {label}
      </span>
      <span className="font-medium text-right tabular-nums max-w-[140px] truncate" title={value}>
        {value || "—"}
      </span>
    </div>
  );
}

function ReviewUnitLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[1fr_auto] gap-x-1 text-[10px] border-b border-border/30 py-1 last:border-b-0">
      <span className="text-muted-foreground leading-tight">{label}</span>
      <span className="text-amber-600 dark:text-amber-400 font-semibold tabular-nums text-right">{value}</span>
    </div>
  );
}

function normalizeStagingRevType(s: string | null | undefined): "add" | "drop" | "change" | "unknown" {
  const t = (s ?? "").trim().toLowerCase();
  if (!t) return "unknown";
  if (/\badd\b|^a[\s.:_-]|^\+|^new\b/.test(t) || t.startsWith("add")) return "add";
  if (/\bdrop\b|^d[\s.:_-]|^del\b|^remove\b/.test(t) || t.startsWith("drop")) return "drop";
  if (/\bchange\b|^ch|^c[\s.:_-]/.test(t) || t.includes("chg")) return "change";
  return "unknown";
}

function subjectLooksSpecial(code: string | null | undefined) {
  const c = (code ?? "").toUpperCase();
  return c.includes("SPCL") || c.startsWith("SP") || c.includes("SPECIAL");
}

/** Read-only label + value for the student snapshot panel (not form inputs). */
function StudentDatum({
  label,
  value,
  className,
  valueClassName,
}: {
  label: string;
  value: string;
  className?: string;
  valueClassName?: string;
}) {
  const v = value.trim();
  return (
    <div className={cn("min-w-0", className)}>
      <div className="text-[7px] uppercase tracking-wide text-muted-foreground leading-none">{label}</div>
      <div
        className={cn(
          "text-[10px] font-medium text-foreground leading-tight pt-px truncate tabular-nums",
          valueClassName
        )}
        title={v || undefined}
      >
        {v ? value : "—"}
      </div>
    </div>
  );
}

export function AddDropChangeCoursesWithdrawalModule() {
  const [terms, setTerms] = useState<YearTerm[]>([]);
  const [termId, setTermId] = useState<string>("");
  const [transactionId, setTransactionId] = useState("00000000");
  const [studentNo, setStudentNo] = useState("");
  const [mainTab, setMainTab] = useState<MainTab>("registration");
  const [regSubTab, setRegSubTab] = useState<RegSubTab>("transaction-details");
  const [moduleConfig, setModuleConfig] = useState<AddDropModuleConfig>(defaultAddDropModuleConfig);
  const [moduleConfigLoading, setModuleConfigLoading] = useState(false);
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [configDraft, setConfigDraft] = useState<AddDropModuleConfig>(defaultAddDropModuleConfig);
  const [configDialogTab, setConfigDialogTab] = useState<"transaction" | "assessment">("transaction");
  const [configSaving, setConfigSaving] = useState(false);
  const [transactions, setTransactions] = useState<TransactionListRow[]>([]);
  const [withdrawn, setWithdrawn] = useState<WithdrawnListRow[]>([]);
  const [scheduleRows, setScheduleRows] = useState<ScheduleLineRow[]>([]);
  const [stagingRows, setStagingRows] = useState<StagingLineRow[]>([]);
  const [loadingLists, setLoadingLists] = useState(false);
  const [loadingStudent, setLoadingStudent] = useState(false);

  const loadTermLists = useCallback(async () => {
    if (!API || !termId) return;
    setLoadingLists(true);
    try {
      const [txRes, wdRes] = await Promise.all([
        fetch(`${API}/api/registrar/add-drop/transactions?academicYearTermId=${encodeURIComponent(termId)}`),
        fetch(`${API}/api/registrar/add-drop/withdrawals?academicYearTermId=${encodeURIComponent(termId)}`),
      ]);
      if (txRes.ok) setTransactions((await txRes.json()) as TransactionListRow[]);
      if (wdRes.ok) setWithdrawn((await wdRes.json()) as WithdrawnListRow[]);
    } catch {
      /* noop */
    } finally {
      setLoadingLists(false);
    }
  }, [termId]);

  const loadStudentWorkspace = useCallback(async (overrideStudentNo?: string) => {
    if (!API || !termId) {
      toast({ title: "Select a term", variant: "destructive" });
      return;
    }
    const sn = (overrideStudentNo ?? studentNo).trim();
    if (!sn) {
      toast({ title: "Student number required", description: "Enter a student number, then search.", variant: "destructive" });
      return;
    }
    setLoadingStudent(true);
    try {
      const tc = transactionId.trim() || "00000000";
      const [scRes, stRes] = await Promise.all([
        fetch(
          `${API}/api/registrar/add-drop/schedule?academicYearTermId=${encodeURIComponent(termId)}&studentNo=${encodeURIComponent(sn)}`
        ),
        fetch(
          `${API}/api/registrar/add-drop/staging?academicYearTermId=${encodeURIComponent(termId)}&studentNo=${encodeURIComponent(sn)}&transactionCode=${encodeURIComponent(tc)}`
        ),
      ]);
      if (!scRes.ok) throw new Error(await scRes.text());
      if (!stRes.ok) throw new Error(await stRes.text());
      setScheduleRows((await scRes.json()) as ScheduleLineRow[]);
      setStagingRows((await stRes.json()) as StagingLineRow[]);
    } catch (e) {
      console.error(e);
      toast({
        title: "Could not load student workspace",
        description: e instanceof Error ? e.message : "Schedule / staging request failed.",
        variant: "destructive",
      });
      setScheduleRows([]);
      setStagingRows([]);
    } finally {
      setLoadingStudent(false);
    }
  }, [API, termId, studentNo, transactionId]);

  const scheduleTotals = useMemo(() => {
    const n = scheduleRows.length;
    let lect = 0;
    let lab = 0;
    for (const r of scheduleRows) {
      lect += Number(r.units) || 0;
      lab += Number(r.lab) || 0;
    }
    return { subjects: n, lect: lect || "—", lab: lab || "—" };
  }, [scheduleRows]);

  /** Unit review panel: derived from staging lines (lab split not available on staging rows). */
  const reviewTotals = useMemo(() => {
    const bucket = () => ({ reg: 0, regLab: 0, spcl: 0, spclLab: 0 });
    const added = bucket();
    const dropped = bucket();
    for (const r of stagingRows) {
      const u = Number(r.units) || 0;
      const spcl = subjectLooksSpecial(r.subject_code);
      const kind = normalizeStagingRevType(r.rev_type);
      if (kind === "add") {
        if (spcl) added.spcl += u;
        else added.reg += u;
      } else if (kind === "drop") {
        if (spcl) dropped.spcl += u;
        else dropped.reg += u;
      }
    }
    const fmt = (n: number) => n.toFixed(1);
    const z = bucket();
    return {
      added,
      dropped,
      changeFrom: z,
      changeTo: z,
      fmt,
    };
  }, [stagingRows]);

  useEffect(() => {
    const load = async () => {
      if (!API) return;
      try {
        const res = await fetch(`${API}/api/academic-year-terms`);
        if (!res.ok) return;
        const rows = (await res.json()) as YearTerm[];
        setTerms(rows);
        if (rows[0]) setTermId(String(rows[0].id));
      } catch {
        /* noop */
      }
    };
    void load();
  }, []);

  useEffect(() => {
    void loadTermLists();
  }, [loadTermLists]);

  useEffect(() => {
    if (!API) return;
    let cancelled = false;
    (async () => {
      setModuleConfigLoading(true);
      try {
        const res = await fetch(`${API}/api/registrar/add-drop/module-config`);
        if (!res.ok) throw new Error(await res.text());
        const data: unknown = await res.json();
        if (!cancelled) setModuleConfig(moduleConfigFromApi(data));
      } catch (e) {
        console.error(e);
        if (!cancelled) {
          toast({
            title: "Could not load add/drop configuration",
            description: e instanceof Error ? e.message : "Check API and database.",
            variant: "destructive",
          });
        }
      } finally {
        if (!cancelled) setModuleConfigLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const termLabel = useMemo(() => {
    const t = terms.find((x) => String(x.id) === termId);
    if (!t) return "";
    return `${t.academic_year} ${t.term}`.toUpperCase();
  }, [terms, termId]);

  const defaultTermLabel = useMemo(() => {
    const id = moduleConfig.defaultAcademicYearTermId;
    if (!id) return "—";
    const t = terms.find((x) => String(x.id) === id);
    if (!t) return `#${id}`;
    return `${t.academic_year} ${t.term}`;
  }, [terms, moduleConfig.defaultAcademicYearTermId]);

  const headerTitle = termLabel ? `ADD/DROP/CHANGE [${termLabel}]` : "ADD/DROP/CHANGE";

  return (
    <div className="h-full min-h-0 bg-background flex flex-col overflow-hidden">
      <div className="shrink-0 border-b border-border/60 bg-muted/20 px-3 py-2">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-2 min-w-0">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-border/60 bg-background text-muted-foreground">
              <ArrowLeftRight className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h1 className="setup-type-page-title leading-tight">{headerTitle}</h1>
              <p className="setup-type-page-desc mt-0.5">
                This module facilitates adding, dropping, or changing courses and schedules, and withdrawal of
                registration.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-end gap-2 lg:justify-end">
            <div className="space-y-1 min-w-[140px]">
              <Label className="text-[10px] uppercase text-muted-foreground">Academic year / term</Label>
              <select
                className="h-8 w-full min-w-[200px] rounded-xl border border-border/60 bg-background px-2 text-xs"
                value={termId}
                onChange={(e) => setTermId(e.target.value)}
              >
                {terms.map((t) => (
                  <option key={t.id} value={String(t.id)}>
                    {t.academic_year} {t.term}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1 min-w-[120px]">
              <Label className="text-[10px] uppercase text-muted-foreground">Transaction ID</Label>
              <Input
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                className="h-8 rounded-xl text-xs font-mono border-border/60 bg-background"
              />
            </div>
            <Button
              type="button"
              variant="outline"
              className="h-8 text-xs rounded-xl gap-1.5"
              onClick={() => {
                toast({ title: "Validate", description: "Post-enrollment validation rules can be added here." });
              }}
            >
              <CalendarClock className="h-3.5 w-3.5" />
              Validate
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-8 text-xs rounded-xl gap-1.5"
              onClick={() => {
                setConfigDraft(moduleConfig);
                setConfigDialogTab("transaction");
                setConfigDialogOpen(true);
              }}
            >
              <Settings2 className="h-3.5 w-3.5" />
              Configuration
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 p-2 grid grid-cols-1 xl:grid-cols-[minmax(220px,248px)_1fr] gap-2">
        {/* Left column */}
        <aside className="flex flex-col min-h-0 overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
          <div className="shrink-0 border-b border-border/50 bg-muted/15 px-2 py-1">
            <div className="flex items-center gap-1 min-w-0">
              <Input
                placeholder="Student no."
                aria-label="Student number lookup"
                value={studentNo}
                onChange={(e) => setStudentNo(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") void loadStudentWorkspace();
                }}
                className="h-7 min-w-0 flex-1 rounded-md border-border/60 bg-background px-2 text-[10px] font-mono"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-7 w-7 shrink-0 rounded-md"
                onClick={() => void loadStudentWorkspace()}
                disabled={loadingStudent}
                title="Load student"
              >
                {loadingStudent ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 px-1.5 text-[9px] font-semibold rounded-md shrink-0"
                onClick={() => setStudentNo("")}
              >
                Clear
              </Button>
            </div>
          </div>
          <div className="shrink-0 border-b border-border/60 bg-muted/25 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">
            Student Information
          </div>
          <div className="shrink-0 px-2 py-1.5 border-b border-border/40 bg-card">
            <div className="grid grid-cols-[48px_1fr] gap-1.5">
              <div className="w-12 h-[52px] shrink-0 rounded-md border border-dashed border-border/50 bg-muted/15 grid place-items-center text-[7px] text-center text-muted-foreground leading-tight px-0.5">
                Photo
              </div>
              <div className="grid grid-cols-2 gap-x-1 gap-y-0.5 content-start min-w-0">
                <StudentDatum label="Last name" value="" />
                <StudentDatum label="First name" value="" />
                <StudentDatum label="Middle" value="" className="col-span-2" />
                <StudentDatum label="M.I." value="" />
                <StudentDatum label="Ext. name" value="" />
                <StudentDatum label="Gender" value="" />
                <StudentDatum label="Age" value="" />
              </div>
            </div>
          </div>

          <Separator className="shrink-0" />

          <ScrollArea className="flex-1 min-h-[140px]">
            <Accordion type="single" collapsible defaultValue="registration" className="w-full">
              <AccordionItem value="registration" className="border-border/60 px-0">
                <AccordionTrigger
                  className="px-3 py-2 text-[11px] font-semibold hover:no-underline bg-muted/35 border-b border-border/40 rounded-none"
                >
                  Registration Information
                </AccordionTrigger>
                <AccordionContent className="px-0 pb-0 pt-0">
                  <div className="px-3 pb-2 space-y-0">
                    {[
                      "College Code",
                      "Acad. Program",
                      "Major Study",
                      "Year Level",
                      "Max. Units Allowed",
                      "Curriculum Code",
                      "Table of Fees",
                      "Registration No",
                      "Date of Registration",
                      "Validation Date",
                      "O.R. No",
                      "Assessed By",
                      "Validated By",
                    ].map((lbl) => (
                      <InfoLine key={lbl} label={lbl} value="" />
                    ))}
                    <div className="mt-2 rounded-xl border border-border/60 bg-muted/15 p-2 space-y-0">
                      <div className="text-[10px] font-semibold uppercase text-muted-foreground pb-1">Financial summary</div>
                      {["Total Assessment", "Total Financial Aid", "Total Payment", "Total Balance"].map((lbl) => (
                        <InfoLine key={lbl} label={lbl} value="" />
                      ))}
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="reviews" className="border-border/60 px-0">
                <AccordionTrigger
                  className="px-3 py-2 text-[11px] font-semibold hover:no-underline bg-amber-100/90 text-amber-950 dark:bg-amber-950/45 dark:text-amber-50 border-b border-amber-200/60 dark:border-amber-800/50 rounded-none"
                >
                  Transaction Reviews
                </AccordionTrigger>
                <AccordionContent className="px-0 pb-0 pt-0">
                  <div className="px-3 pb-2 pt-1 space-y-2 text-[10px]">
                    <div className="font-semibold uppercase tracking-wide text-muted-foreground">Total added subject</div>
                    <ReviewUnitLine label="ADD REG.UNITS" value={reviewTotals.fmt(reviewTotals.added.reg)} />
                    <ReviewUnitLine label="ADD REG.LAB.UNITS" value={reviewTotals.fmt(reviewTotals.added.regLab)} />
                    <ReviewUnitLine label="ADD SPCL.UNITS" value={reviewTotals.fmt(reviewTotals.added.spcl)} />
                    <ReviewUnitLine label="ADD SPCL.LAB.UNITS" value={reviewTotals.fmt(reviewTotals.added.spclLab)} />
                    <div className="font-semibold uppercase tracking-wide text-muted-foreground pt-1">Total drop subject</div>
                    <ReviewUnitLine label="DROP REG.UNITS" value={reviewTotals.fmt(reviewTotals.dropped.reg)} />
                    <ReviewUnitLine label="DROP REG.LAB.UNITS" value={reviewTotals.fmt(reviewTotals.dropped.regLab)} />
                    <ReviewUnitLine label="DROP SPCL.UNITS" value={reviewTotals.fmt(reviewTotals.dropped.spcl)} />
                    <ReviewUnitLine label="DROP SPCL.LAB.UNITS" value={reviewTotals.fmt(reviewTotals.dropped.spclLab)} />
                    <div className="font-semibold uppercase tracking-wide text-muted-foreground pt-1">Total change subject</div>
                    <div className="text-[9px] font-semibold text-muted-foreground/90">Change from</div>
                    <ReviewUnitLine label="REG.UNITS" value={reviewTotals.fmt(reviewTotals.changeFrom.reg)} />
                    <ReviewUnitLine label="REG.LAB.UNITS" value={reviewTotals.fmt(reviewTotals.changeFrom.regLab)} />
                    <ReviewUnitLine label="SPCL.UNITS" value={reviewTotals.fmt(reviewTotals.changeFrom.spcl)} />
                    <ReviewUnitLine label="SPCL.LAB UNITS" value={reviewTotals.fmt(reviewTotals.changeFrom.spclLab)} />
                    <div className="text-[9px] font-semibold text-muted-foreground/90 pt-1">Change to</div>
                    <ReviewUnitLine label="REG.UNITS" value={reviewTotals.fmt(reviewTotals.changeTo.reg)} />
                    <ReviewUnitLine label="REG.LAB.UNITS" value={reviewTotals.fmt(reviewTotals.changeTo.regLab)} />
                    <ReviewUnitLine label="SPCL.UNITS" value={reviewTotals.fmt(reviewTotals.changeTo.spcl)} />
                    <ReviewUnitLine label="SPCL.LAB UNITS" value={reviewTotals.fmt(reviewTotals.changeTo.spclLab)} />
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="configuration" className="border-border/60 border-b-0 px-0">
                <AccordionTrigger
                  className="px-3 py-2 text-[11px] font-semibold hover:no-underline bg-emerald-100/90 text-emerald-950 dark:bg-emerald-950/45 dark:text-emerald-50 border-b border-emerald-200/60 dark:border-emerald-800/50 rounded-none"
                >
                  Configuration
                </AccordionTrigger>
                <AccordionContent className="px-0 pb-0 pt-0">
                  <div className="px-3 pb-3 pt-1 space-y-2 text-[10px]">
                    {moduleConfigLoading ? (
                      <div className="flex items-center gap-2 text-muted-foreground py-2">
                        <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
                        <span>Loading configuration…</span>
                      </div>
                    ) : (
                      <>
                        <div className="rounded-md border border-border/50 bg-muted/20 px-2 py-1.5 space-y-1">
                          <InfoLine label="Default term" value={defaultTermLabel} />
                          <InfoLine label="Default campus" value={moduleConfig.defaultCampus} />
                        </div>
                        <div className="text-[9px] font-semibold uppercase text-muted-foreground">Transaction rules</div>
                        <div className="space-y-1">
                          <ConfigFlagLine label="Conflict of schedule" on={moduleConfig.checkScheduleConflict} />
                          <ConfigFlagLine label="Pre-requisite check" on={moduleConfig.checkPrereq} />
                          <ConfigFlagLine label="Allow 'INC' grade" on={moduleConfig.allowIncGrade} />
                          <ConfigFlagLine label="Overloading" on={moduleConfig.allowOverload} />
                          <ConfigFlagLine label="Cross enroll" on={moduleConfig.allowCrossEnroll} />
                          <ConfigFlagLine label="Auto hide full schedule" on={moduleConfig.autoHideFullSchedule} />
                          <ConfigFlagLine label="Print assessment after SAVE" on={moduleConfig.printAssessmentAfterSave} />
                        </div>
                        <Separator />
                        <div className="space-y-1 text-destructive font-medium text-[10px]">
                          <div className="flex justify-between gap-2">
                            <span>ADC charging</span>
                            <span className="tabular-nums">{adcChargingModeLabel(moduleConfig.adcChargingMode)}</span>
                          </div>
                          <div className="flex justify-between gap-2">
                            <span>Revision (Php)</span>
                            <span className="tabular-nums">{moduleConfig.revisionAmount}</span>
                          </div>
                        </div>
                        <Separator />
                        <div className="text-[9px] font-semibold uppercase text-muted-foreground">Assessment / fees</div>
                        <div className="space-y-1">
                          <ConfigFlagLine label="Charge on DROP" on={moduleConfig.chargeDrop} />
                          <ConfigFlagLine label="Charge on ADD" on={moduleConfig.chargeAdd} />
                          <ConfigFlagLine label="Charge on CHANGE" on={moduleConfig.chargeChange} />
                          <ConfigFlagLine label="Reservation fee" on={moduleConfig.chargeReservationFee} />
                          <ConfigFlagLine label="Lab fee" on={moduleConfig.chargeLabFee} />
                          <ConfigFlagLine label="Misc. fee" on={moduleConfig.chargeMiscFee} />
                          <ConfigFlagLine label="TFReg × Lect" on={moduleConfig.tfRegLectUnits} />
                          <ConfigFlagLine label="LFReg × Lab" on={moduleConfig.lfRegLabUnits} />
                          <ConfigFlagLine label="TFSPLReg × Lect" on={moduleConfig.tfSplRegLectUnits} />
                          <ConfigFlagLine label="LFSPLReg × Lab" on={moduleConfig.lfSplRegLabUnits} />
                          <ConfigFlagLine label="Internet condition" on={moduleConfig.internetCondition} />
                        </div>
                        <Separator />
                      </>
                    )}
                    <div className="text-[10px] font-semibold uppercase text-muted-foreground">Transaction icons legend</div>
                    <div className="flex flex-col gap-1.5 pt-1 text-[10px]">
                      <div className="flex items-center gap-2">
                        <BookPlus className="h-4 w-4 text-green-600 shrink-0" />
                        <span>Adding transaction</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <BookX className="h-4 w-4 text-red-600 shrink-0" />
                        <span>Dropping transaction</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <ArrowLeftRight className="h-4 w-4 text-blue-600 shrink-0" />
                        <span>Changing transaction</span>
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </ScrollArea>
        </aside>

        {/* Main workspace */}
        <main className="min-h-0 flex flex-col rounded-2xl border border-border/60 bg-card shadow-sm overflow-hidden">
          <Tabs value={mainTab} onValueChange={(v) => setMainTab(v as MainTab)} className="flex flex-col flex-1 min-h-0">
            <div className="shrink-0 border-b border-border/60 bg-muted/10 px-2 pt-2">
              <TabsList className="h-9 w-full sm:w-auto sm:max-w-max flex flex-wrap gap-1 bg-muted/50 p-0.5 rounded-xl justify-start">
                <TabsTrigger
                  value="registration"
                  className="rounded-lg px-3 text-xs font-semibold data-[state=active]:bg-background data-[state=active]:shadow-sm"
                >
                  Registration Details
                </TabsTrigger>
                <TabsTrigger
                  value="transactions"
                  className="rounded-lg px-3 text-xs font-semibold data-[state=active]:bg-background data-[state=active]:shadow-sm"
                >
                  List of Transactions
                </TabsTrigger>
                <TabsTrigger
                  value="withdrawn"
                  className="rounded-lg px-3 text-xs font-semibold data-[state=active]:bg-background data-[state=active]:shadow-sm"
                >
                  Withdrawn List
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent
              value="registration"
              className="flex-1 min-h-0 flex flex-col m-0 p-0 border-0 outline-none data-[state=inactive]:hidden"
            >
              <div className="flex-1 min-h-0 flex flex-col gap-2 p-2 overflow-hidden">
                <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide px-1">
                  Current schedule
                </div>
                <div className="rounded-xl border border-border/60 overflow-hidden flex-1 min-h-[140px] max-h-[38vh]">
                  <ScrollArea className="h-full w-full">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/40 hover:bg-muted/40">
                          {scheduleCols.map((c) => (
                            <TableHead
                              key={c}
                              className="whitespace-nowrap text-[10px] font-semibold uppercase text-muted-foreground px-2"
                            >
                              {c}
                            </TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {scheduleRows.length === 0 ? (
                          <TableRow>
                            <TableCell
                              colSpan={scheduleCols.length}
                              className="text-center text-xs text-muted-foreground py-8"
                            >
                              {loadingStudent
                                ? "Loading schedule…"
                                : "No enrolled subjects. Enter student number and search."}
                            </TableCell>
                          </TableRow>
                        ) : (
                          scheduleRows.map((r) => (
                            <TableRow key={r.id}>
                              <TableCell className="font-mono text-[11px]">{fmtCell(r.sched_id)}</TableCell>
                              <TableCell className="font-mono text-[11px]">{fmtCell(r.subject_code)}</TableCell>
                              <TableCell className="text-[11px] max-w-[200px] truncate" title={fmtCell(r.subject_title)}>
                                {fmtCell(r.subject_title)}
                              </TableCell>
                              <TableCell className="text-[11px]">{fmtCell(r.section)}</TableCell>
                              <TableCell className="text-[11px]">{fmtCell(r.units)}</TableCell>
                              <TableCell className="text-[11px]">{fmtCell(r.lab)}</TableCell>
                              <TableCell className="text-[11px]">{fmtCell(r.schedule_1)}</TableCell>
                              <TableCell className="text-[11px]">{fmtCell(r.room_1)}</TableCell>
                              <TableCell className="text-[11px]">{fmtCell(r.schedule_2)}</TableCell>
                              <TableCell className="text-[11px]">{fmtCell(r.room_2)}</TableCell>
                              <TableCell className="text-[11px]">{fmtCell(r.schedule_3)}</TableCell>
                              <TableCell className="text-[11px]">{fmtCell(r.room_3)}</TableCell>
                              <TableCell className="text-[11px]">{fmtCell(r.schedule_4)}</TableCell>
                              <TableCell className="text-[11px]">{fmtCell(r.room_4)}</TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </div>

                <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between shrink-0">
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" variant="outline" className="h-9 text-xs rounded-xl gap-1.5">
                      <BookX className="h-4 w-4 text-destructive" />
                      Drop Course
                    </Button>
                    <Button type="button" variant="outline" className="h-9 text-xs rounded-xl gap-1.5">
                      <RefreshCw className="h-4 w-4" />
                      Change Course/Schedule
                    </Button>
                    <Button type="button" variant="outline" className="h-9 text-xs rounded-xl gap-1.5">
                      <BookPlus className="h-4 w-4 text-emerald-600" />
                      Add Course(s)
                    </Button>
                    <Button type="button" variant="outline" className="h-9 text-xs rounded-xl gap-1.5">
                      <UserMinus className="h-4 w-4" />
                      Withdraw Registration
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { label: "TOTAL SUBJECTS", value: String(scheduleTotals.subjects) },
                      { label: "LECT. UNITS", value: String(scheduleTotals.lect) },
                      { label: "LAB UNITS", value: String(scheduleTotals.lab) },
                    ].map((b) => (
                      <div
                        key={b.label}
                        className="rounded-xl border border-border/60 bg-muted/30 px-3 py-2 min-w-[110px] text-center"
                      >
                        <div className="text-[9px] font-semibold uppercase text-muted-foreground leading-tight">
                          {b.label}
                        </div>
                        <div className="text-sm font-mono font-semibold tabular-nums">{b.value}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex-1 min-h-[160px] flex flex-col rounded-xl border border-border/60 overflow-hidden">
                  <Tabs
                    value={regSubTab}
                    onValueChange={(v) => setRegSubTab(v as RegSubTab)}
                    className="flex flex-col flex-1 min-h-0"
                  >
                    <div className="shrink-0 border-b border-border/60 bg-muted/20 px-2 pt-2">
                      <TabsList className="h-8 w-fit max-w-max bg-muted/50 p-0.5 rounded-xl">
                        <TabsTrigger
                          value="transaction-details"
                          className="rounded-lg px-3 text-[11px] font-semibold data-[state=active]:bg-background"
                        >
                          Transaction Details
                        </TabsTrigger>
                        <TabsTrigger
                          value="assessment"
                          className="rounded-lg px-3 text-[11px] font-semibold data-[state=active]:bg-background"
                        >
                          Assessment
                        </TabsTrigger>
                      </TabsList>
                    </div>
                    <TabsContent
                      value="transaction-details"
                      className="flex-1 min-h-0 m-0 p-0 border-0 flex flex-col data-[state=inactive]:hidden"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 px-2 py-2 border-b border-border/60 bg-background/80">
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs rounded-xl gap-1 text-destructive border-destructive/30"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Remove Selected
                          </Button>
                          <Button type="button" variant="outline" size="sm" className="h-8 text-xs rounded-xl gap-1">
                            <RefreshCw className="h-3.5 w-3.5 text-emerald-600" />
                            Reset All
                          </Button>
                        </div>
                        <div className="text-[11px] font-semibold text-muted-foreground">
                          TOTAL #: <span className="text-foreground tabular-nums">{stagingRows.length}</span>
                        </div>
                      </div>
                      <ScrollArea className="flex-1 min-h-0">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-muted/40 hover:bg-muted/40">
                              {stagingCols.map((c) => (
                                <TableHead
                                  key={c}
                                  className="whitespace-nowrap text-[10px] font-semibold uppercase text-muted-foreground px-2"
                                >
                                  {c}
                                </TableHead>
                              ))}
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {stagingRows.length === 0 ? (
                              <TableRow>
                                <TableCell
                                  colSpan={stagingCols.length}
                                  className="text-center text-xs text-muted-foreground py-8"
                                >
                                  {loadingStudent
                                    ? "Loading staging lines…"
                                    : "No pending lines. Search a student or add rows via your enrollment workflow."}
                                </TableCell>
                              </TableRow>
                            ) : (
                              stagingRows.map((r) => (
                                <TableRow key={r.id}>
                                  <TableCell className="font-mono text-[11px]">{fmtCell(r.sched_id)}</TableCell>
                                  <TableCell className="text-[11px]">{fmtCell(r.rev_type)}</TableCell>
                                  <TableCell className="font-mono text-[11px]">{fmtCell(r.subject_code)}</TableCell>
                                  <TableCell className="text-[11px] max-w-[200px] truncate" title={fmtCell(r.subject_title)}>
                                    {fmtCell(r.subject_title)}
                                  </TableCell>
                                  <TableCell className="text-[11px]">{fmtCell(r.section)}</TableCell>
                                  <TableCell className="text-[11px]">{fmtCell(r.units)}</TableCell>
                                </TableRow>
                              ))
                            )}
                          </TableBody>
                        </Table>
                      </ScrollArea>
                    </TabsContent>
                    <TabsContent
                      value="assessment"
                      className="flex-1 min-h-0 m-0 p-2 text-xs text-muted-foreground data-[state=inactive]:hidden"
                    >
                      <div className="rounded-xl border border-dashed border-border/60 bg-muted/10 p-4 min-h-[120px] grid place-items-center text-center">
                        Assessment totals, adjustments, and payment breakdown for this transaction will display here
                        when connected to billing.
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
              </div>
            </TabsContent>

            <TabsContent
              value="transactions"
              className="flex-1 min-h-0 flex flex-col m-0 p-0 border-0 outline-none data-[state=inactive]:hidden"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-3 py-2 border-b border-border/60 bg-muted/10 shrink-0">
                <p className="text-[11px] text-muted-foreground max-w-xl">
                  Double-click a row to load and edit a transaction (or use an Open action when the API is available).
                </p>
                <Button type="button" variant="outline" className="h-8 text-xs rounded-xl shrink-0 self-start sm:self-auto">
                  Remove Validation
                </Button>
              </div>
              <ScrollArea className="flex-1 min-h-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40 hover:bg-muted/40">
                      {transactionListCols.map((c) => (
                        <TableHead
                          key={c}
                          className="whitespace-nowrap text-[10px] font-semibold uppercase text-muted-foreground px-2"
                        >
                          {c}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingLists ? (
                      <TableRow>
                        <TableCell colSpan={transactionListCols.length} className="text-center py-10">
                          <Loader2 className="h-5 w-5 animate-spin inline text-muted-foreground" />
                        </TableCell>
                      </TableRow>
                    ) : transactions.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={transactionListCols.length}
                          className="text-center text-xs text-muted-foreground py-10"
                        >
                          No transactions for this term.
                        </TableCell>
                      </TableRow>
                    ) : (
                      transactions.map((t) => (
                        <TableRow
                          key={t.id}
                          className="cursor-pointer hover:bg-muted/40"
                          onDoubleClick={() => {
                            if (t.student_no) {
                              setStudentNo(t.student_no);
                              void loadStudentWorkspace(t.student_no);
                            }
                          }}
                        >
                          <TableCell className="font-mono text-[11px]">{t.id}</TableCell>
                          <TableCell className="text-[11px]">{fmtCell(t.trans_date)}</TableCell>
                          <TableCell className="text-[11px]">{fmtCell(t.reg_id)}</TableCell>
                          <TableCell className="font-mono text-[11px]">{fmtCell(t.student_no)}</TableCell>
                          <TableCell className="text-[11px]">{fmtCell(t.student_name)}</TableCell>
                          <TableCell className="text-[11px]">{fmtCell(t.facilitator)}</TableCell>
                          <TableCell className="text-[11px]">{fmtCell(t.assessed_date)}</TableCell>
                          <TableCell className="text-[11px]">{fmtCell(t.assessed_by)}</TableCell>
                          <TableCell className="text-[11px]">{fmtCell(t.email)}</TableCell>
                          <TableCell className="text-[11px]">{fmtCell(t.classification)}</TableCell>
                          <TableCell className="text-[11px]">{fmtCell(t.inactive)}</TableCell>
                          <TableCell className="text-[11px]">{fmtCell(t.classid)}</TableCell>
                          <TableCell className="text-[11px]">{fmtCell(t.indexid)}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
              <div className="shrink-0 border-t border-border/60 px-3 py-2 text-[11px] font-semibold text-destructive">
                Total #: {transactions.length}
              </div>
            </TabsContent>

            <TabsContent
              value="withdrawn"
              className="flex-1 min-h-0 flex flex-col m-0 p-0 border-0 outline-none data-[state=inactive]:hidden"
            >
              <div className="flex justify-end px-3 py-2 border-b border-border/60 bg-muted/10 shrink-0">
                <Button type="button" variant="outline" className="h-8 text-xs rounded-xl">
                  Cancel Withdrawal
                </Button>
              </div>
              <ScrollArea className="flex-1 min-h-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40 hover:bg-muted/40">
                      {withdrawnCols.map((c) => (
                        <TableHead
                          key={c}
                          className="whitespace-nowrap text-[10px] font-semibold uppercase text-muted-foreground px-2"
                        >
                          {c}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingLists ? (
                      <TableRow>
                        <TableCell colSpan={withdrawnCols.length} className="text-center py-10">
                          <Loader2 className="h-5 w-5 animate-spin inline text-muted-foreground" />
                        </TableCell>
                      </TableRow>
                    ) : withdrawn.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={withdrawnCols.length}
                          className="text-center text-xs text-muted-foreground py-10"
                        >
                          No withdrawn students for this term.
                        </TableCell>
                      </TableRow>
                    ) : (
                      withdrawn.map((w) => (
                        <TableRow key={w.id} className="hover:bg-muted/40">
                          <TableCell className="font-mono text-[11px]">{w.id}</TableCell>
                          <TableCell className="text-[11px]">{fmtCell(w.trans_date)}</TableCell>
                          <TableCell className="text-[11px]">{fmtCell(w.reg_id)}</TableCell>
                          <TableCell className="font-mono text-[11px]">{fmtCell(w.student_no)}</TableCell>
                          <TableCell className="text-[11px]">{fmtCell(w.full_name)}</TableCell>
                          <TableCell className="text-[11px]">{fmtCell(w.facilitator)}</TableCell>
                          <TableCell className="text-[11px]">{fmtCell(w.assessed_date)}</TableCell>
                          <TableCell className="text-[11px]">{fmtCell(w.assessed_by)}</TableCell>
                          <TableCell className="text-[11px]">{fmtCell(w.or_nbr)}</TableCell>
                          <TableCell className="text-[11px]">{fmtCell(w.validation_date)}</TableCell>
                          <TableCell className="text-[11px]">{fmtCell(w.casher)}</TableCell>
                          <TableCell className="text-[11px]">{fmtCell(w.total_net_assessed)}</TableCell>
                          <TableCell className="text-[11px]">{fmtCell(w.total_payment)}</TableCell>
                          <TableCell className="text-[11px]">{fmtCell(w.total_discount)}</TableCell>
                          <TableCell className="text-[11px]">{fmtCell(w.withdrawn_by)}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
              <div className="shrink-0 border-t border-border/60 px-3 py-2 text-[11px] font-semibold text-destructive">
                Total #: {withdrawn.length}
              </div>
            </TabsContent>
          </Tabs>
        </main>
      </div>

      <Dialog open={configDialogOpen} onOpenChange={setConfigDialogOpen}>
        <DialogContent className="flex max-h-[min(90vh,760px)] w-[calc(100vw-1.5rem)] max-w-2xl flex-col gap-0 overflow-hidden p-0 sm:rounded-xl">
          <DialogHeader className="shrink-0 space-y-1 border-b border-border/60 px-4 py-3 text-left">
            <DialogTitle className="text-base">Add/Drop/Change Configuration</DialogTitle>
            <DialogDescription className="sr-only">
              Transaction defaults and assessment charging options for add, drop, and change of courses.
            </DialogDescription>
          </DialogHeader>

          <Tabs
            value={configDialogTab}
            onValueChange={(v) => setConfigDialogTab(v as "transaction" | "assessment")}
            className="flex min-h-0 flex-1 flex-col"
          >
            <div className="shrink-0 border-b border-border/60 bg-muted/20 px-4 py-2">
              <TabsList className="grid h-9 w-full max-w-md grid-cols-2 rounded-lg bg-muted/60 p-1">
                <TabsTrigger value="transaction" className="rounded-md text-xs font-semibold data-[state=active]:bg-background">
                  Transaction Configuration
                </TabsTrigger>
                <TabsTrigger value="assessment" className="rounded-md text-xs font-semibold data-[state=active]:bg-background">
                  Assessment Configuration
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent
              value="transaction"
              className="m-0 flex-1 overflow-y-auto px-4 py-3 text-xs data-[state=inactive]:hidden"
            >
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-[11px] font-medium">Default Academic Year &amp; Term</Label>
                  <select
                    className="h-9 w-full rounded-lg border border-border/60 bg-background px-2 text-xs"
                    value={configDraft.defaultAcademicYearTermId || (terms[0] ? String(terms[0].id) : "")}
                    onChange={(e) =>
                      setConfigDraft((d) => ({ ...d, defaultAcademicYearTermId: e.target.value }))
                    }
                  >
                    {terms.map((t) => (
                      <option key={t.id} value={String(t.id)}>
                        {t.academic_year} {t.term}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] font-medium">Default Campus</Label>
                  <select
                    className="h-9 w-full rounded-lg border border-border/60 bg-background px-2 text-xs"
                    value={configDraft.defaultCampus}
                    onChange={(e) => setConfigDraft((d) => ({ ...d, defaultCampus: e.target.value }))}
                  >
                    {ADD_DROP_CAMPUSES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <Separator />
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2.5">
                    {(
                      [
                        ["checkScheduleConflict", "Check for Conflict of Schedule"],
                        ["checkPrereq", "Check for Pre-Requisite"],
                        ["allowIncGrade", "Allow 'INC' grade ?"],
                        ["allowOverload", "Allow Overloading"],
                      ] as const
                    ).map(([key, label]) => (
                      <label key={key} className="flex cursor-pointer items-start gap-2 leading-snug">
                        <Checkbox
                          className="mt-0.5"
                          checked={configDraft[key]}
                          onCheckedChange={(v) => setConfigDraft((d) => ({ ...d, [key]: v === true }))}
                        />
                        <span>{label}</span>
                      </label>
                    ))}
                  </div>
                  <div className="space-y-2.5">
                    {(
                      [
                        ["allowCrossEnroll", "Allow Cross Enroll"],
                        ["autoHideFullSchedule", "Auto Hide Full Schedule?"],
                        ["printAssessmentAfterSave", "Print Assessment after 'SAVE'"],
                      ] as const
                    ).map(([key, label]) => (
                      <label key={key} className="flex cursor-pointer items-start gap-2 leading-snug">
                        <Checkbox
                          className="mt-0.5"
                          checked={configDraft[key]}
                          onCheckedChange={(v) => setConfigDraft((d) => ({ ...d, [key]: v === true }))}
                        />
                        <span>{label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent
              value="assessment"
              className="m-0 flex-1 overflow-y-auto px-4 py-3 text-xs data-[state=inactive]:hidden"
            >
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-[11px] font-medium">ADC Charging Mode</Label>
                  <select
                    className="h-9 w-full rounded-lg border border-border/60 bg-background px-2 text-xs"
                    value={configDraft.adcChargingMode}
                    onChange={(e) =>
                      setConfigDraft((d) => ({
                        ...d,
                        adcChargingMode: e.target.value as AdcChargingMode,
                      }))
                    }
                  >
                    <option value="no_charge">No Charge</option>
                    <option value="charge_once">Charge Once</option>
                    <option value="charge_per_subject">Charge Per Subject</option>
                    <option value="charge_per_transactions">Charge Per Transactions</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] font-medium">Revision Amount</Label>
                  <div className="flex h-9 max-w-xs items-center gap-2 rounded-lg border border-border/60 bg-background px-2">
                    <span className="shrink-0 text-[11px] font-semibold text-muted-foreground">Php</span>
                    <Input
                      className="h-8 flex-1 border-0 bg-transparent p-0 text-xs shadow-none focus-visible:ring-0"
                      value={configDraft.revisionAmount}
                      onChange={(e) => setConfigDraft((d) => ({ ...d, revisionAmount: e.target.value }))}
                      inputMode="decimal"
                    />
                  </div>
                </div>
                <Separator />
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2.5">
                    {(
                      [
                        ["chargeDrop", "Charge On 'DROP'"],
                        ["chargeAdd", "Charge on 'ADD'"],
                        ["chargeChange", "Charge on 'CHANGE'"],
                        ["chargeReservationFee", "Charge Reservation Fee"],
                        ["chargeLabFee", "Charge Lab Fee"],
                        ["chargeMiscFee", "Charge Misc. Fee"],
                      ] as const
                    ).map(([key, label]) => (
                      <label key={key} className="flex cursor-pointer items-start gap-2 leading-snug">
                        <Checkbox
                          className="mt-0.5"
                          checked={configDraft[key]}
                          onCheckedChange={(v) => setConfigDraft((d) => ({ ...d, [key]: v === true }))}
                        />
                        <span>{label}</span>
                      </label>
                    ))}
                  </div>
                  <div className="space-y-2.5">
                    {(
                      [
                        ["tfRegLectUnits", "TFReg × Lect Units"],
                        ["lfRegLabUnits", "LFReg × Lab Units"],
                        ["tfSplRegLectUnits", "TFSPLReg × Lect Units"],
                        ["lfSplRegLabUnits", "LFSPLReg × Lab Units"],
                        ["internetCondition", "Internet Condition"],
                      ] as const
                    ).map(([key, label]) => (
                      <label key={key} className="flex cursor-pointer items-start gap-2 leading-snug">
                        <Checkbox
                          className="mt-0.5"
                          checked={configDraft[key]}
                          onCheckedChange={(v) => setConfigDraft((d) => ({ ...d, [key]: v === true }))}
                        />
                        <span>{label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="shrink-0 gap-2 border-t border-border/60 bg-muted/10 px-4 py-3 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              className="gap-1.5"
              onClick={() => setConfigDialogOpen(false)}
            >
              <X className="h-4 w-4 text-destructive" />
              Cancel
            </Button>
            <Button
              type="button"
              className="gap-1.5"
              disabled={configSaving}
              onClick={async () => {
                if (!API) {
                  toast({
                    title: "API not configured",
                    description: "Set NEXT_PUBLIC_API_URL to save configuration.",
                    variant: "destructive",
                  });
                  return;
                }
                setConfigSaving(true);
                try {
                  const res = await fetch(`${API}/api/registrar/add-drop/module-config`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(configDraft),
                  });
                  if (!res.ok) throw new Error(await res.text());
                  const data: unknown = await res.json();
                  setModuleConfig(moduleConfigFromApi(data));
                  setConfigDialogOpen(false);
                  toast({
                    title: "Configuration saved",
                    description: "Add/drop defaults were written to the database.",
                  });
                } catch (e) {
                  console.error(e);
                  toast({
                    title: "Save failed",
                    description: e instanceof Error ? e.message : "Could not persist configuration.",
                    variant: "destructive",
                  });
                } finally {
                  setConfigSaving(false);
                }
              }}
            >
              {configSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <footer className="shrink-0 border-t border-border/60 bg-muted/20 px-3 py-1.5 flex flex-wrap items-center justify-between gap-2 text-[10px] text-muted-foreground">
        <span>{new Date().toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}</span>
        <span className="font-medium text-foreground/80">Registrar • Add/Drop workspace</span>
        <span className="hidden sm:inline">API: {API ? "configured" : "not set"}</span>
      </footer>
    </div>
  );
}
