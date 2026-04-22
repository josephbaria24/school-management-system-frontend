"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
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
    <div className="h-full bg-[#edf4ff] p-1">
      <div className="w-full border border-[#5a8fce] bg-white min-h-[690px]">
        <div className="bg-gradient-to-b from-[#dbe9ff] to-[#91bceb] border-b border-[#5a8fce] px-3 py-1.5">
          <h1 className="text-[32px] leading-none tracking-tight text-[#556b7d] font-semibold uppercase">
            Admission Module
          </h1>
          <p className="text-[11px] text-[#4e6781] mt-0.5">
            Use this module to accept new applicant, admit or deny an applicant, record entrance
            exam result, etc...
          </p>
        </div>

        <div className="p-1.5 space-y-2">
          <div className="border border-[#7ca1d8] bg-[#f4f8ff]">
            <div className="bg-gradient-to-b from-[#6ea4df] to-[#3d75bc] text-white text-[10px] font-bold px-2 py-0.5">
              Application Information
            </div>
            <div className="p-2 space-y-2">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-2">
                <div className="lg:col-span-4 space-y-1">
                  <Label className="text-[11px]">ACAD. YEAR &amp; TERM:</Label>
                  <Select value={yearTermId} onValueChange={setYearTermId}>
                    <SelectTrigger className="h-7 text-[11px] bg-white">
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
                  <Label className="text-[11px]">APPLICATION TYPE:</Label>
                  <Select defaultValue="freshman">
                    <SelectTrigger className="h-7 text-[11px] bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="freshman">Freshman</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="lg:col-span-2 space-y-1">
                  <Label className="text-[11px]">APPLICATION DATE:</Label>
                  <Input className="h-7 text-[11px] bg-white" />
                </div>
                <div className="lg:col-span-2 space-y-1">
                  <Label className="text-[11px]">LAST UPDATE:</Label>
                  <Input className="h-7 text-[11px] bg-white" />
                </div>
                <div className="lg:col-span-1 space-y-1">
                  <Label className="text-[11px]">O.R. NUMBER</Label>
                  <Input className="h-7 text-[11px] bg-white" />
                </div>
                <div className="lg:col-span-1 space-y-1">
                  <Label className="text-[11px]">STATUS</Label>
                  <Input className="h-7 text-[11px] bg-white" />
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                {[0, 1, 2, 3].map((choiceIdx) => (
                  <div key={choiceIdx} className="border border-[#7ca1d8] bg-white">
                    <div className="bg-gradient-to-b from-[#6ea4df] to-[#3d75bc] text-white text-[10px] font-bold px-2 py-0.5">
                      CHOICE {choiceIdx + 1}: Select Campus/Branch
                    </div>
                    <div className="p-2 space-y-1.5">
                      <Select
                        value={choiceCampusIds[choiceIdx]}
                        onValueChange={(v) => setChoice(choiceIdx, v)}
                      >
                        <SelectTrigger className="h-7 text-[11px] bg-white">
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
                      <div className="grid grid-cols-[92px_1fr_28px] gap-1">
                        <Label className="text-[11px] self-center">Course/Program</Label>
                        <Select defaultValue={NONE}>
                          <SelectTrigger className="h-7 text-[11px] bg-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={NONE}>Select course/program</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button type="button" variant="outline" className="h-7 w-7 p-0">
                          📝
                        </Button>
                      </div>
                      <div className="grid grid-cols-[92px_1fr_28px] gap-1">
                        <Label className="text-[11px] self-center">Major Study</Label>
                        <Select defaultValue={NONE}>
                          <SelectTrigger className="h-7 text-[11px] bg-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={NONE}>Select major study</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button type="button" variant="outline" className="h-7 w-7 p-0">
                          📝
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-0.5 border-b border-[#7ca1d8]">
            {lowerTabs.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveLowerTab(tab)}
                className={cn(
                  "px-3 py-1 text-[12px] border border-b-0 border-[#9dbde4] rounded-t-sm",
                  activeLowerTab === tab
                    ? "bg-[#f5e8a8] text-[#4f4a2f] font-semibold"
                    : "bg-[#e7ecf8] text-[#556b7d]",
                )}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-2 border border-[#7ca1d8] bg-[#dfe8f8] p-1.5">
            <div className="lg:col-span-6 border border-[#7ca1d8] bg-[#edf3ff]">
              <div className="bg-gradient-to-b from-[#c8d9f4] to-[#9dbde4] text-[#2c4f7c] text-[10px] font-bold px-2 py-0.5">
                PERSONAL INFORMATION
              </div>
              <div className="p-2 grid grid-cols-[100px_1fr_90px] gap-1 items-center text-[11px]">
                <Label>Last Name</Label>
                <Input className="h-7 text-[11px] bg-white" />
                <span />
                <Label>Given Name</Label>
                <Input className="h-7 text-[11px] bg-white" />
                <span />
                <Label>Middle Name</Label>
                <Input className="h-7 text-[11px] bg-white" />
                <span />
                <Label>Middle Initial</Label>
                <Input className="h-7 text-[11px] bg-white w-20" />
                <Input className="h-7 text-[11px] bg-white" placeholder="Ext. Name" />
                <Label>Gender</Label>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-1">
                    <input type="radio" name="gender" /> Male
                  </label>
                  <label className="flex items-center gap-1">
                    <input type="radio" name="gender" /> Female
                  </label>
                </div>
                <span />
                <Label>Civil Status</Label>
                <Select defaultValue="single">
                  <SelectTrigger className="h-7 text-[11px] bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single">Single</SelectItem>
                  </SelectContent>
                </Select>
                <span />
                <Label>Date of Birth</Label>
                <Input className="h-7 text-[11px] bg-white" placeholder="mm/dd/yyyy" />
                <span className="text-muted-foreground">mm/dd/yyyy</span>
                <Label>Place of Birth</Label>
                <Input className="h-7 text-[11px] bg-white" />
                <span />
                <Label>Nationality</Label>
                <Select defaultValue="filipino">
                  <SelectTrigger className="h-7 text-[11px] bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="filipino">Filipino</SelectItem>
                  </SelectContent>
                </Select>
                <label className="flex items-center gap-1 text-[11px]">
                  <Checkbox /> Foreign Student?
                </label>
              </div>
            </div>

            <div className="lg:col-span-6 border border-[#7ca1d8] bg-[#edf3ff]">
              <div className="flex flex-wrap gap-0.5 border-b border-[#9dbde4] p-0.5">
                {rightMiniTabs.map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveMiniTab(tab)}
                    className={cn(
                      "px-2 py-0.5 text-[11px] border border-[#9dbde4] rounded-sm",
                      activeMiniTab === tab
                        ? "bg-[#f5e8a8] text-[#4f4a2f] font-semibold"
                        : "bg-[#e7ecf8] text-[#556b7d]",
                    )}
                  >
                    {tab}
                  </button>
                ))}
              </div>
              <div className="p-2 space-y-2 text-[11px]">
                <div className="border border-[#7ca1d8] bg-white p-2">
                  <p className="text-[10px] font-bold text-[#2c4f7c] mb-1">RESIDENCE/PRESENT ADDRESS</p>
                  <div className="grid grid-cols-2 gap-1">
                    <Input className="h-7 text-[11px] bg-white" placeholder="Residence" />
                    <Input className="h-7 text-[11px] bg-white" placeholder="Street" />
                    <Input className="h-7 text-[11px] bg-white" placeholder="Barangay" />
                    <Input className="h-7 text-[11px] bg-white" placeholder="Town/City" />
                    <Input className="h-7 text-[11px] bg-white" placeholder="Province" />
                    <Input className="h-7 text-[11px] bg-white" placeholder="Zip Code" />
                  </div>
                </div>
                <div className="border border-[#7ca1d8] bg-white p-2">
                  <p className="text-[10px] font-bold text-[#2c4f7c] mb-1">PERMANENT ADDRESS</p>
                  <div className="grid grid-cols-2 gap-1">
                    <Input className="h-7 text-[11px] bg-white" placeholder="Residence" />
                    <Input className="h-7 text-[11px] bg-white" placeholder="Street" />
                    <Input className="h-7 text-[11px] bg-white" placeholder="Barangay" />
                    <Input className="h-7 text-[11px] bg-white" placeholder="Town/City" />
                    <Input className="h-7 text-[11px] bg-white" placeholder="Province" />
                    <Input className="h-7 text-[11px] bg-white" placeholder="Zip Code" />
                  </div>
                  <div className="mt-2 flex justify-end">
                    <Button type="button" variant="outline" className="h-8 text-[10px]">
                      COPY RESIDENCE ADDRESS
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

