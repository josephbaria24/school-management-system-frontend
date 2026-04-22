"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Eye, X } from "lucide-react";
import { toast } from "@/hooks/use-toast";
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

const REPORT_TITLES = [
  "Faculty Work Load Report",
  "Inventory of Academic Program Curriculums",
  "Inventory of Curriculum By Students",
  "Inventory of Enrolled Students by Descriptive Title",
  "Inventory of Faculty Academic Schedule",
  "Inventory of Oversized Class List",
  "List of Class Schedule by College",
  "List of Class Schedule by Program",
  "List of Class Schedules",
  "List of Faculty Load Sheet",
  "List of Offered Course",
  "List of Officially Enrolled by Course",
  "List of Room Schedules",
];

export function ListOfReportsModule() {
  const [yearTerms, setYearTerms] = useState<AcademicYearTerm[]>([]);
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [selectedReport, setSelectedReport] = useState(REPORT_TITLES[0]);
  const [yearTermId, setYearTermId] = useState("");
  const [campusId, setCampusId] = useState("");
  const [allGroups, setAllGroups] = useState(true);
  const [byCollege, setByCollege] = useState(false);
  const [byProgram, setByProgram] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!API) return;
      try {
        const [ytRes, campusRes] = await Promise.all([
          fetch(`${API}/api/academic-year-terms`),
          fetch(`${API}/api/campuses`),
        ]);
        if (ytRes.ok) {
          const rows = (await ytRes.json()) as AcademicYearTerm[];
          setYearTerms(rows);
          if (rows[0]) setYearTermId(String(rows[0].id));
        }
        if (campusRes.ok) {
          const rows = (await campusRes.json()) as Campus[];
          setCampuses(rows);
          if (rows[0]) setCampusId(String(rows[0].id));
        }
      } catch {
        // keep static layout visible while API is unavailable
      }
    };
    void load();
  }, []);

  const currentReport = useMemo(() => selectedReport, [selectedReport]);

  return (
    <div className="h-full bg-[#f2fbf7] p-2">
      <div className="w-full max-w-[980px] border-2 border-[#0e53c5] bg-white shadow-sm">
        <div className="h-7 px-2 bg-gradient-to-b from-[#2b7cec] to-[#115ec9] border-b border-[#0e53c5] flex items-center justify-between">
          <p className="text-[13px] font-semibold text-white">Colleges/Institute/Departments Reports</p>
          <button
            type="button"
            className="h-5 w-5 rounded-sm bg-[#e34c4c] text-white text-[12px] leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="grid grid-cols-12 gap-0 p-1.5 bg-[#e5eef9]">
          <div className="col-span-12 md:col-span-5 border border-[#7ca1d8] bg-white">
            <div className="bg-gradient-to-b from-[#a5c1e8] to-[#7ea2d5] border-b border-[#6f95cb] px-2 py-0.5">
              <p className="text-[11px] font-semibold text-[#0f2d62]">Report Title</p>
            </div>
            <div className="h-[350px] overflow-auto">
              {REPORT_TITLES.map((title) => (
                <button
                  key={title}
                  type="button"
                  onClick={() => setSelectedReport(title)}
                  className={cn(
                    "w-full text-left px-3 py-1 text-[12px] border-b border-[#d7e3f4] hover:bg-[#edf4ff]",
                    selectedReport === title && "bg-[#dbe9ff] font-semibold",
                  )}
                >
                  {title}
                </button>
              ))}
            </div>
          </div>

          <div className="col-span-12 md:col-span-7 border border-l-0 border-[#7ca1d8] bg-[#f9fcff]">
            <div className="bg-gradient-to-b from-[#a5c1e8] to-[#7ea2d5] border-b border-[#6f95cb] px-2 py-0.5">
              <p className="text-[11px] font-semibold text-white">Select the Report and other parameters....</p>
            </div>

            <div className="p-3 space-y-2">
              <div className="grid grid-cols-[130px_1fr] items-center gap-2">
                <Label className="text-[12px] font-semibold">Academic Year &amp; Term</Label>
                <Select value={yearTermId} onValueChange={setYearTermId}>
                  <SelectTrigger className="h-7 text-[12px] bg-white">
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

              <div className="grid grid-cols-[130px_1fr] items-center gap-2">
                <Label className="text-[12px] font-semibold">Campus</Label>
                <Select value={campusId} onValueChange={setCampusId}>
                  <SelectTrigger className="h-7 text-[12px] bg-white">
                    <SelectValue placeholder="Select campus" />
                  </SelectTrigger>
                  <SelectContent>
                    {campuses.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.acronym} {c.campus_name ? `- ${c.campus_name}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="border-t border-[#9eb8dc] pt-2" />

              <div className="grid grid-cols-[130px_1fr] items-center gap-2">
                <div className="flex items-center gap-2">
                  <Checkbox checked={allGroups} onCheckedChange={(v) => setAllGroups(Boolean(v))} />
                  <Label className="text-[12px] text-[#a51616]">All Groups</Label>
                </div>
                <p className="text-[12px] text-[#a51616]">All Colleges and Academic Program</p>
              </div>

              <div className="grid grid-cols-[130px_1fr_22px] items-center gap-2">
                <div className="flex items-center gap-2">
                  <Checkbox checked={byCollege} onCheckedChange={(v) => setByCollege(Boolean(v))} />
                  <Label className="text-[12px] text-muted-foreground">By College :</Label>
                </div>
                <Input className="h-7 text-[12px] bg-white" disabled={!byCollege} />
                <Button type="button" variant="outline" size="icon" className="h-6 w-6" disabled={!byCollege}>
                  🔎
                </Button>
              </div>

              <div className="grid grid-cols-[130px_1fr_22px] items-center gap-2">
                <div className="flex items-center gap-2">
                  <Checkbox checked={byProgram} onCheckedChange={(v) => setByProgram(Boolean(v))} />
                  <Label className="text-[12px] text-muted-foreground">By Program :</Label>
                </div>
                <Input className="h-7 text-[12px] bg-white" disabled={!byProgram} />
                <Button type="button" variant="outline" size="icon" className="h-6 w-6" disabled={!byProgram}>
                  🔎
                </Button>
              </div>

              <div className="border-t border-[#9eb8dc] pt-2" />

              <div className="grid grid-cols-[130px_1fr] items-center gap-2">
                <Label className="text-[12px] font-semibold">Subject Code</Label>
                <Select defaultValue={NONE}>
                  <SelectTrigger className="h-7 text-[12px] bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}> </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-[130px_1fr_22px] items-center gap-2">
                <Label className="text-[12px] font-semibold">Faculty Name</Label>
                <Input className="h-7 text-[12px] bg-white" value="[Select All Faculty Available]" readOnly />
                <Button type="button" variant="outline" size="icon" className="h-6 w-6">
                  🔎
                </Button>
              </div>

              <div className="border-t border-[#9eb8dc] pt-2 flex items-center justify-between">
                <Button
                  type="button"
                  className="h-8 px-4 text-[12px] bg-[#2e75c8] hover:bg-[#255ea1]"
                  onClick={() => toast({ title: "Add Report", description: `${currentReport} queued.` })}
                >
                  Add Report
                </Button>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    className="h-8 px-4 text-[12px] bg-[#3d8ed8] hover:bg-[#2f74b1]"
                    onClick={() => toast({ title: "Preview", description: `Previewing "${currentReport}".` })}
                  >
                    <Eye className="h-3.5 w-3.5 mr-1" />
                    Preview
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    className="h-8 px-4 text-[12px]"
                    onClick={() => toast({ title: "Cancel", description: "Report request cancelled." })}
                  >
                    <X className="h-3.5 w-3.5 mr-1" />
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
