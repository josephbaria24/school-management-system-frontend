"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { UserSquare2, Pencil } from "lucide-react";
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
import { cn } from "@/lib/utils";

const API = process.env.NEXT_PUBLIC_API_URL;
const NONE = "__none__";

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
  const [yearTerms, setYearTerms] = useState<AcademicYearTerm[]>([]);
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [yearTermId, setYearTermId] = useState("");
  const [campusId, setCampusId] = useState("");
  const [choiceCampusIds, setChoiceCampusIds] = useState<string[]>([NONE, NONE, NONE, NONE]);
  const [activeLowerTab, setActiveLowerTab] = useState<(typeof lowerTabs)[number]>(
    "Personal Information",
  );
  const [activeMiniTab, setActiveMiniTab] = useState<(typeof rightMiniTabs)[number]>(
    "Resident/Permanent Address",
  );

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

  const setChoice = (idx: number, value: string) => {
    setChoiceCampusIds((prev) => prev.map((v, i) => (i === idx ? value : v)));
  };

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

        <Card className="w-full overflow-hidden rounded-2xl border border-border/40 bg-background shadow-sm">
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
                  <Label className="text-[11px] text-muted-foreground">APPLICATION TYPE:</Label>
                  <Select defaultValue="freshman">
                    <SelectTrigger className="h-9 rounded-xl text-xs border-border/60 shadow-sm bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="freshman">Freshman</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="lg:col-span-2 space-y-1">
                  <Label className="text-[11px] text-muted-foreground">APPLICATION DATE:</Label>
                  <Input type="date" className="h-9 rounded-xl text-xs border-border/60 shadow-sm bg-background" />
                </div>
                <div className="lg:col-span-2 space-y-1">
                  <Label className="text-[11px] text-muted-foreground">LAST UPDATE:</Label>
                  <Input disabled className="h-9 rounded-xl text-xs border-border/60 shadow-sm bg-muted/20" />
                </div>
                <div className="lg:col-span-1 space-y-1">
                  <Label className="text-[11px] text-muted-foreground">O.R. NO.</Label>
                  <Input className="h-9 rounded-xl text-xs border-border/60 shadow-sm bg-background px-2" />
                </div>
                <div className="lg:col-span-1 space-y-1">
                  <Label className="text-[11px] text-muted-foreground uppercase">Status</Label>
                  <div className="flex h-9 items-center justify-center">
                    <Badge variant="outline" className="rounded-full bg-emerald-500/10 text-emerald-700 border-emerald-200/50 px-4 py-1.5 text-sm font-bold tracking-tight shadow-none">
                      PENDING
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
                          onValueChange={(v) => setChoice(choiceIdx, v)}
                        >
                          <SelectTrigger className="h-9 rounded-xl text-xs border-border/60 shadow-sm bg-background">
                            <SelectValue placeholder="Select campus" />
                          </SelectTrigger>
                          <SelectContent>
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
                          <Select defaultValue={NONE}>
                            <SelectTrigger className="h-9 rounded-xl text-xs border-border/60 shadow-sm bg-background">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value={NONE}>Select course/program</SelectItem>
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
                          <Select defaultValue={NONE}>
                            <SelectTrigger className="h-9 rounded-xl text-xs border-border/60 shadow-sm bg-background">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value={NONE}>Select major study</SelectItem>
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

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-6 border border-border/60 rounded-2xl overflow-hidden bg-card shadow-sm">
              <div className="bg-muted/5 text-foreground px-3 py-2 text-xs font-extrabold tracking-tight border-b border-border/60 uppercase">
                PERSONAL INFORMATION
              </div>
              <div className="p-4 space-y-4">
                <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-[11px] text-muted-foreground uppercase">Last Name</Label>
                    <Input className="h-9 rounded-xl text-xs border-border/60 shadow-sm bg-background" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[11px] text-muted-foreground uppercase">Given Name</Label>
                    <Input className="h-9 rounded-xl text-xs border-border/60 shadow-sm bg-background" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[11px] text-muted-foreground uppercase">Middle Name</Label>
                    <Input className="h-9 rounded-xl text-xs border-border/60 shadow-sm bg-background" />
                  </div>
                  <div className="grid grid-cols-[1fr_2fr] gap-2">
                    <div className="space-y-1.5">
                      <Label className="text-[11px] text-muted-foreground uppercase">M.I.</Label>
                      <Input className="h-9 rounded-xl text-xs border-border/60 shadow-sm bg-background" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[11px] text-muted-foreground uppercase">Ext. Name</Label>
                      <Input className="h-9 rounded-xl text-xs border-border/60 shadow-sm bg-background" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-[11px] text-muted-foreground uppercase">Gender</Label>
                    <div className="flex h-9 items-center gap-6 rounded-xl border border-border/60 bg-background px-3 shadow-sm">
                      <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                        <input type="radio" name="gender" className="accent-primary h-3.5 w-3.5" /> 
                        <span>Male</span>
                      </label>
                      <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                        <input type="radio" name="gender" className="accent-primary h-3.5 w-3.5" /> 
                        <span>Female</span>
                      </label>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[11px] text-muted-foreground uppercase">Civil Status</Label>
                    <Select defaultValue="single">
                      <SelectTrigger className="h-9 rounded-xl text-xs border-border/60 shadow-sm bg-background">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="single">Single</SelectItem>
                        <SelectItem value="married">Married</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[11px] text-muted-foreground uppercase">Date of Birth</Label>
                    <div className="space-y-1">
                      <Input type="date" className="h-9 rounded-xl text-xs border-border/60 shadow-sm bg-background" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[11px] text-muted-foreground uppercase">Place of Birth</Label>
                    <Input className="h-9 rounded-xl text-xs border-border/60 shadow-sm bg-background" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[11px] text-muted-foreground uppercase">Nationality</Label>
                  <div className="grid grid-cols-[1fr_auto] gap-4 items-center">
                    <Select defaultValue="filipino">
                      <SelectTrigger className="h-9 rounded-xl text-xs border-border/60 shadow-sm bg-background">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="filipino">Filipino</SelectItem>
                      </SelectContent>
                    </Select>
                    <label className="flex items-center gap-2 text-[11px] font-medium text-muted-foreground cursor-pointer">
                      <Checkbox className="rounded-md border-border/60" /> 
                      <span>Foreign Student?</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-6 border border-border/60 rounded-2xl overflow-hidden bg-card shadow-sm">
              <div className="flex flex-wrap gap-1 border-b border-border/60 bg-muted/20 p-1">
                {rightMiniTabs.map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveMiniTab(tab)}
                    className={cn(
                      "px-3 py-1.5 text-xs font-bold rounded-lg transition-all",
                      activeMiniTab === tab
                        ? "bg-background text-foreground shadow-md"
                        : "text-muted-foreground hover:bg-background/40 hover:text-foreground",
                    )}
                  >
                    {tab}
                  </button>
                ))}
              </div>
              <div className="p-4 space-y-4">
                <div className="border border-border/40 rounded-xl bg-muted/5 overflow-hidden">
                  <div className="bg-background/50 px-3 py-1.5 border-b border-border/40">
                    <p className="text-[10px] font-bold text-foreground">RESIDENCE/PRESENT ADDRESS</p>
                  </div>
                  <div className="p-3 grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-[10px] text-muted-foreground uppercase">Residence</Label>
                      <Input className="h-9 rounded-lg text-xs border-border/60 shadow-sm bg-background" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] text-muted-foreground uppercase">Street</Label>
                      <Input className="h-9 rounded-lg text-xs border-border/60 shadow-sm bg-background" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] text-muted-foreground uppercase">Barangay</Label>
                      <Input className="h-9 rounded-lg text-xs border-border/60 shadow-sm bg-background" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] text-muted-foreground uppercase">Town/City</Label>
                      <Input className="h-9 rounded-lg text-xs border-border/60 shadow-sm bg-background" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] text-muted-foreground uppercase">Province</Label>
                      <Input className="h-9 rounded-lg text-xs border-border/60 shadow-sm bg-background" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] text-muted-foreground uppercase">Zip Code</Label>
                      <Input className="h-9 rounded-lg text-xs border-border/60 shadow-sm bg-background" />
                    </div>
                  </div>
                </div>

                <div className="border border-border/40 rounded-xl bg-muted/5 overflow-hidden">
                  <div className="bg-background/50 px-3 py-1.5 border-b border-border/40">
                    <p className="text-[10px] font-bold text-foreground">PERMANENT ADDRESS</p>
                  </div>
                  <div className="p-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-[10px] text-muted-foreground uppercase">Residence</Label>
                        <Input className="h-9 rounded-lg text-xs border-border/60 shadow-sm bg-background" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] text-muted-foreground uppercase">Street</Label>
                        <Input className="h-9 rounded-lg text-xs border-border/60 shadow-sm bg-background" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] text-muted-foreground uppercase">Barangay</Label>
                        <Input className="h-9 rounded-lg text-xs border-border/60 shadow-sm bg-background" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] text-muted-foreground uppercase">Town/City</Label>
                        <Input className="h-9 rounded-lg text-xs border-border/60 shadow-sm bg-background" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] text-muted-foreground uppercase">Province</Label>
                        <Input className="h-9 rounded-lg text-xs border-border/60 shadow-sm bg-background" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] text-muted-foreground uppercase">Zip Code</Label>
                        <Input className="h-9 rounded-lg text-xs border-border/60 shadow-sm bg-background" />
                      </div>
                    </div>
                    <div className="mt-4 flex justify-end">
                      <Button type="button" variant="outline" className="h-8 rounded-lg text-[10px] px-3 font-semibold shadow-sm">
                        COPY RESIDENCE ADDRESS
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  </div>
);
}

