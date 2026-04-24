"use client";

import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import {
  Building2, ChevronDown, ChevronRight, School, BookOpen,
  LayoutList, Plus, Pencil, Trash2, UserCheck, Home, BookPlus, RefreshCw,
  GraduationCap, Save, Search, HelpCircle, X, Users,
} from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL;

type ClassSectionTab = {
  key:
  | "list-all"
  | "create-block-section"
  | "create-free-section"
  | "rename-class-section"
  | "delete-class-section"
  | "assign-adviser"
  | "assign-default-classroom"
  | "add-subject"
  | "replace-subject";
  label: string;
};

const tabs: ClassSectionTab[] = [
  { key: "list-all", label: "List All" },
  { key: "create-block-section", label: "Create Block Section" },
  { key: "create-free-section", label: "Create Free Section" },
  { key: "rename-class-section", label: "Rename Class Section" },
  { key: "delete-class-section", label: "Delete Class Section" },
  { key: "assign-adviser", label: "Assign Class Section Adviser" },
  { key: "assign-default-classroom", label: "Assign Default Classroom to Section" },
  { key: "add-subject", label: "Add Subject to Class Section" },
  { key: "replace-subject", label: "Replace Subject" },
];

type AcademicYearTerm = {
  id: number;
  campus: string | null;
  academic_year: string;
  term: string;
};

type Institution = {
  id: number;
  official_name: string;
};

type Campus = {
  id: number;
  institution_id?: number | null;
  acronym: string;
  campus_name: string | null;
};

type College = {
  id: number;
  campus_id: number;
  college_code: string;
  college_name: string;
  dean_name?: string | null;
  logo_url?: string | null;
};

type AcademicProgram = {
  id: number;
  college_id: number;
  program_code: string;
  program_name: string;
  no_of_years: number | null;
  max_residency: number | null;
  classification: string | null;
  thesis_option: string | null;
};

type ProgramCurriculum = {
  id: number;
  academic_program_id: number;
  curriculum_code: string;
  description: string | null;
  term_label: string | null;
  no_of_years: number | null;
  major_discipline: string | null;
};

type CurriculumSubject = {
  id: number;
  subject_code: string;
  descriptive_title: string;
  credit_unit: string | number | null;
  lecture_hour: string | number | null;
  lab_unit: string | number | null;
  laboratory_hour: string | number | null;
};

type CourseMaster = {
  id?: number;
  course_code: string;
  course_title?: string | null;
  credited_units?: string | number | null;
  lecture_hours?: string | number | null;
  laboratory_units?: string | number | null;
  laboratory_hours?: string | number | null;
  general_education: boolean;
  default_min_class_limit: number | null;
};

type FreeSectionEntry = {
  id: string;
  name: string;
  program_id: number;
  college_id: number;
  campus_id: number;
  subjects: Array<{ course_code: string; course_title: string }>;
  created_at: string;
};

const normCode = (v: string) => v.replace(/\s+/g, "").toLowerCase();
const prettyTerm = (v: string | null) =>
  (v || "")
    .toLowerCase()
    .replace(/\b\w/g, (m) => m.toUpperCase());
const FREE_SECTION_ROW_HEIGHT = 32;
const FREE_SECTION_OVERSCAN = 10;

export function ClassSectionsModule() {
  const [activeTab, setActiveTab] = useState<ClassSectionTab["key"]>("list-all");
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [yearTerms, setYearTerms] = useState<AcademicYearTerm[]>([]);
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [colleges, setColleges] = useState<College[]>([]);
  const [programs, setPrograms] = useState<AcademicProgram[]>([]);
  const [selectedYearTermId, setSelectedYearTermId] = useState<string>("");
  const [selectedCampusId, setSelectedCampusId] = useState<string>("");
  const [selectedCollegeId, setSelectedCollegeId] = useState<string>("");
  const [expandedCampusIds, setExpandedCampusIds] = useState<number[]>([]);
  const [expandedCollegeIds, setExpandedCollegeIds] = useState<number[]>([]);
  const [selectedProgramNodeId, setSelectedProgramNodeId] = useState<string>("");
  const [blockProgramId, setBlockProgramId] = useState<string>("");
  const [blockCurriculums, setBlockCurriculums] = useState<ProgramCurriculum[]>([]);
  const [selectedBlockCurriculumId, setSelectedBlockCurriculumId] = useState<string>("");
  const [blockSubjects, setBlockSubjects] = useState<CurriculumSubject[]>([]);
  const [courseMasters, setCourseMasters] = useState<CourseMaster[]>([]);
  const [searchText, setSearchText] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [yearTermText, setYearTermText] = useState("");
  const [appliedYearTerm, setAppliedYearTerm] = useState("");
  const [helpOpen, setHelpOpen] = useState(false);
  const [freeHelpOpen, setFreeHelpOpen] = useState(false);
  const [freeSearchText, setFreeSearchText] = useState("");
  const [freeAppliedSearch, setFreeAppliedSearch] = useState("");
  const [freeSelectedCodes, setFreeSelectedCodes] = useState<string[]>([]);
  const [freeGridScrollTop, setFreeGridScrollTop] = useState(0);
  const [freeSectionName, setFreeSectionName] = useState("");
  const [freeSections, setFreeSections] = useState<FreeSectionEntry[]>([]);
  const [expandedProgramIds, setExpandedProgramIds] = useState<number[]>([]);
  const [expandedFreeSectionIds, setExpandedFreeSectionIds] = useState<string[]>([]);
  const [freeInstitutionId, setFreeInstitutionId] = useState<string>("");
  const [freeCampusId, setFreeCampusId] = useState<string>("");
  const [freeCollegeId, setFreeCollegeId] = useState<string>("");
  const [freeProgramId, setFreeProgramId] = useState<string>("");

  const activeLabel = tabs.find((t) => t.key === activeTab)?.label ?? "List All";

  useEffect(() => {
    const load = async () => {
      if (!API) return;
      try {
        const [instRes, ytRes, campusRes, collegeRes, programRes] = await Promise.all([
          fetch(`${API}/api/academic-institutions`),
          fetch(`${API}/api/academic-year-terms`),
          fetch(`${API}/api/campuses`),
          fetch(`${API}/api/colleges`),
          fetch(`${API}/api/academic-programs`),
        ]);
        if (instRes.ok) {
          const i = (await instRes.json()) as Institution[];
          setInstitutions(i);
          if (i[0]) setFreeInstitutionId(String(i[0].id));
        }
        if (ytRes.ok) {
          const y = (await ytRes.json()) as AcademicYearTerm[];
          setYearTerms(y);
          if (y[0]) setSelectedYearTermId(String(y[0].id));
        }
        if (campusRes.ok) {
          const c = (await campusRes.json()) as Campus[];
          setCampuses(c);
          if (c[0]) {
            setSelectedCampusId(String(c[0].id));
            setExpandedCampusIds([c[0].id]);
            setFreeCampusId(String(c[0].id));
          }
        }
        if (collegeRes.ok) {
          const c = (await collegeRes.json()) as College[];
          setColleges(c);
          if (c[0]) setFreeCollegeId(String(c[0].id));
        }
        if (programRes.ok) {
          const p = (await programRes.json()) as AcademicProgram[];
          setPrograms(p);
          if (p[0]) setFreeProgramId(String(p[0].id));
        }
      } catch {
        // keep UI visible even if API is not yet ready
      }
    };
    void load();
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("class-sections:free-sections");
      if (!raw) return;
      const parsed = JSON.parse(raw) as FreeSectionEntry[];
      if (Array.isArray(parsed)) setFreeSections(parsed);
    } catch {
      // ignore malformed local cache
    }
  }, []);

  const selectedCampusIdNum = useMemo(() => parseInt(selectedCampusId, 10), [selectedCampusId]);

  const selectedCampusColleges = useMemo(() => {
    if (!Number.isFinite(selectedCampusIdNum)) return [];
    return colleges.filter((c) => c.campus_id === selectedCampusIdNum);
  }, [colleges, selectedCampusIdNum]);

  const selectedCollegeIdNum = useMemo(() => parseInt(selectedCollegeId, 10), [selectedCollegeId]);

  const selectedCollege = useMemo(() => {
    if (!Number.isFinite(selectedCollegeIdNum)) return null;
    return colleges.find((c) => c.id === selectedCollegeIdNum) ?? null;
  }, [colleges, selectedCollegeIdNum]);

  const selectedCollegePrograms = useMemo(() => {
    if (!Number.isFinite(selectedCollegeIdNum)) return [];
    return programs.filter((p) => p.college_id === selectedCollegeIdNum);
  }, [programs, selectedCollegeIdNum]);

  const freeInstitutionIdNum = useMemo(() => parseInt(freeInstitutionId, 10), [freeInstitutionId]);
  const freeCampusIdNum = useMemo(() => parseInt(freeCampusId, 10), [freeCampusId]);
  const freeCollegeIdNum = useMemo(() => parseInt(freeCollegeId, 10), [freeCollegeId]);
  const freeProgramIdNum = useMemo(() => parseInt(freeProgramId, 10), [freeProgramId]);

  const freeCampuses = useMemo(() => {
    if (!Number.isFinite(freeInstitutionIdNum)) return campuses;
    return campuses.filter((c) => Number(c.institution_id) === freeInstitutionIdNum);
  }, [campuses, freeInstitutionIdNum]);

  const freeColleges = useMemo(() => {
    if (!Number.isFinite(freeCampusIdNum)) return [];
    return colleges.filter((c) => c.campus_id === freeCampusIdNum);
  }, [colleges, freeCampusIdNum]);

  const freePrograms = useMemo(() => {
    if (!Number.isFinite(freeCollegeIdNum)) return [];
    return programs.filter((p) => p.college_id === freeCollegeIdNum);
  }, [programs, freeCollegeIdNum]);

  const selectedProgram = useMemo(() => {
    const id = parseInt(selectedProgramNodeId, 10);
    if (!Number.isFinite(id)) return null;
    return programs.find((p) => p.id === id) ?? null;
  }, [programs, selectedProgramNodeId]);

  const freeSelectedProgram = useMemo(() => {
    if (!Number.isFinite(freeProgramIdNum)) return null;
    return programs.find((p) => p.id === freeProgramIdNum) ?? null;
  }, [programs, freeProgramIdNum]);

  const programsByCollege = useMemo(() => {
    const m = new Map<number, AcademicProgram[]>();
    for (const p of programs) {
      const list = m.get(p.college_id) ?? [];
      list.push(p);
      m.set(p.college_id, list);
    }
    return m;
  }, [programs]);

  const freeSectionsByProgram = useMemo(() => {
    const m = new Map<number, FreeSectionEntry[]>();
    for (const s of freeSections) {
      const list = m.get(s.program_id) ?? [];
      list.push(s);
      m.set(s.program_id, list);
    }
    return m;
  }, [freeSections]);

  const programCountByCollege = useMemo(() => {
    const counts = new Map<number, number>();
    for (const p of programs) {
      counts.set(p.college_id, (counts.get(p.college_id) ?? 0) + 1);
    }
    return counts;
  }, [programs]);

  const availableProgramsForBlock = useMemo(() => {
    if (selectedCollege) return selectedCollegePrograms;
    return programs;
  }, [selectedCollege, selectedCollegePrograms, programs]);

  const selectedBlockCurriculum = useMemo(() => {
    const id = parseInt(selectedBlockCurriculumId, 10);
    if (!Number.isFinite(id)) return null;
    return blockCurriculums.find((c) => c.id === id) ?? null;
  }, [selectedBlockCurriculumId, blockCurriculums]);

  const courseMasterByCode = useMemo(() => {
    const m = new Map<string, CourseMaster>();
    for (const c of courseMasters) m.set(normCode(c.course_code), c);
    return m;
  }, [courseMasters]);

  const filteredBlockCurriculums = useMemo(() => {
    const q = appliedSearch.trim().toLowerCase();
    const y = appliedYearTerm.trim().toLowerCase();
    return blockCurriculums.filter((c) => {
      const yearTermDesc = `${c.no_of_years ?? ""} ${prettyTerm(c.term_label)}`.toLowerCase();
      const matchesSearch =
        !q ||
        c.curriculum_code.toLowerCase().includes(q) ||
        (c.description || "").toLowerCase().includes(q) ||
        (c.major_discipline || "").toLowerCase().includes(q);
      const matchesYearTerm = !y || yearTermDesc.includes(y);
      return matchesSearch && matchesYearTerm;
    });
  }, [blockCurriculums, appliedSearch, appliedYearTerm]);

  const filteredFreeSectionCourses = useMemo(() => {
    const q = freeAppliedSearch.trim().toLowerCase();
    const rows = [...courseMasters].sort((a, b) =>
      String(a.course_code ?? "").localeCompare(String(b.course_code ?? ""))
    );
    if (!q) return rows;
    return rows.filter((c) => {
      const code = String(c.course_code ?? "").toLowerCase();
      const title = String(c.course_title ?? "").toLowerCase();
      return code.includes(q) || title.includes(q);
    });
  }, [courseMasters, freeAppliedSearch]);

  const freeSelectedSet = useMemo(() => new Set(freeSelectedCodes), [freeSelectedCodes]);

  const freeGridViewportHeight = 420;
  const freeGridStartIndex = Math.max(
    0,
    Math.floor(freeGridScrollTop / FREE_SECTION_ROW_HEIGHT) - FREE_SECTION_OVERSCAN
  );
  const freeGridVisibleCount =
    Math.ceil(freeGridViewportHeight / FREE_SECTION_ROW_HEIGHT) + FREE_SECTION_OVERSCAN * 2;
  const freeGridEndIndex = Math.min(
    filteredFreeSectionCourses.length,
    freeGridStartIndex + freeGridVisibleCount
  );
  const visibleFreeSectionRows = filteredFreeSectionCourses.slice(freeGridStartIndex, freeGridEndIndex);
  const freeGridTopSpacer = freeGridStartIndex * FREE_SECTION_ROW_HEIGHT;
  const freeGridBottomSpacer =
    (filteredFreeSectionCourses.length - freeGridEndIndex) * FREE_SECTION_ROW_HEIGHT;

  const selectedYearTermLabel = useMemo(() => {
    const yt = yearTerms.find((y) => String(y.id) === selectedYearTermId);
    if (!yt) return "";
    const campus = campuses.find((c) => String(c.id) === selectedCampusId);
    const campusText = campus ? campus.acronym : "";
    const collegeText = selectedCollege ? selectedCollege.college_name : "";
    const trail = [campusText, collegeText].filter(Boolean).join(" | ");
    return `${yt.academic_year} ${yt.term}${trail ? ` | ${trail}` : ""}`;
  }, [yearTerms, selectedYearTermId, campuses, selectedCampusId, selectedCollege]);

  const toggleCampus = (campusId: number) => {
    setExpandedCampusIds((prev) =>
      prev.includes(campusId) ? prev.filter((x) => x !== campusId) : [...prev, campusId]
    );
  };

  useEffect(() => {
    const id = parseInt(selectedCollegeId, 10);
    if (!Number.isFinite(id)) return;
    setExpandedCollegeIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
  }, [selectedCollegeId]);

  useEffect(() => {
    if (activeTab !== "create-block-section") return;
    if (availableProgramsForBlock.length === 0) return;
    if (!blockProgramId) setBlockProgramId(String(availableProgramsForBlock[0].id));
  }, [activeTab, availableProgramsForBlock, blockProgramId]);

  useEffect(() => {
    if (activeTab !== "create-block-section" || !API || !blockProgramId) return;
    const load = async () => {
      try {
        const res = await fetch(`${API}/api/program-curriculums?academic_program_id=${blockProgramId}`);
        if (!res.ok) return;
        const rows = (await res.json()) as ProgramCurriculum[];
        setBlockCurriculums(rows);
        setSelectedBlockCurriculumId(rows[0] ? String(rows[0].id) : "");
      } catch {
        setBlockCurriculums([]);
      }
    };
    void load();
  }, [activeTab, blockProgramId]);

  useEffect(() => {
    if (activeTab !== "create-block-section" || !API || !selectedBlockCurriculumId) {
      setBlockSubjects([]);
      return;
    }
    const load = async () => {
      try {
        const res = await fetch(`${API}/api/program-curriculums/${selectedBlockCurriculumId}/subjects`);
        if (!res.ok) return;
        setBlockSubjects((await res.json()) as CurriculumSubject[]);
      } catch {
        setBlockSubjects([]);
      }
    };
    void load();
  }, [activeTab, selectedBlockCurriculumId]);

  useEffect(() => {
    if ((activeTab !== "create-block-section" && activeTab !== "create-free-section") || !API) return;
    if (courseMasters.length > 0) return;
    const load = async () => {
      try {
        const res = await fetch(`${API}/api/courses-master-list`);
        if (!res.ok) return;
        setCourseMasters((await res.json()) as CourseMaster[]);
      } catch {
        setCourseMasters([]);
      }
    };
    void load();
  }, [activeTab, courseMasters.length]);

  useEffect(() => {
    setFreeSelectedCodes([]);
  }, [selectedProgramNodeId]);

  useEffect(() => {
    if (!Number.isFinite(freeInstitutionIdNum)) return;
    const firstCampus = freeCampuses[0];
    if (firstCampus && String(firstCampus.id) !== freeCampusId) {
      setFreeCampusId(String(firstCampus.id));
    }
  }, [freeInstitutionIdNum, freeCampuses, freeCampusId]);

  useEffect(() => {
    const firstCollege = freeColleges[0];
    if (firstCollege && String(firstCollege.id) !== freeCollegeId) {
      setFreeCollegeId(String(firstCollege.id));
    }
  }, [freeColleges, freeCollegeId]);

  useEffect(() => {
    const firstProgram = freePrograms[0];
    if (firstProgram && String(firstProgram.id) !== freeProgramId) {
      setFreeProgramId(String(firstProgram.id));
    }
  }, [freePrograms, freeProgramId]);

  useEffect(() => {
    if (!freeSelectedProgram) return;
    setSelectedCampusId(String(freeCampusIdNum));
    setSelectedCollegeId(String(freeCollegeIdNum));
    setSelectedProgramNodeId(String(freeSelectedProgram.id));
    setExpandedCampusIds((prev) =>
      prev.includes(freeCampusIdNum) ? prev : [...prev, freeCampusIdNum]
    );
    setExpandedCollegeIds((prev) =>
      prev.includes(freeCollegeIdNum) ? prev : [...prev, freeCollegeIdNum]
    );
  }, [freeSelectedProgram, freeCampusIdNum, freeCollegeIdNum]);

  const handleSearch = () => {
    setAppliedSearch(searchText.trim());
    toast({ title: "Search applied", description: "Curriculum list has been searched." });
  };

  const handleFilter = () => {
    setAppliedYearTerm(yearTermText.trim());
    toast({ title: "Filter applied", description: "Year/term filter applied to curriculum list." });
  };

  const handleSaveBlockSection = () => {
    if (!selectedBlockCurriculum) {
      toast({
        title: "Select curriculum",
        description: "Please pick a curriculum before saving.",
        variant: "destructive",
      });
      return;
    }
    const payload = {
      saved_at: new Date().toISOString(),
      curriculum_id: selectedBlockCurriculum.id,
      curriculum_code: selectedBlockCurriculum.curriculum_code,
      subject_count: blockSubjects.length,
      program_id: blockProgramId,
    };
    localStorage.setItem("class-sections:create-block-section:last", JSON.stringify(payload));
    toast({
      title: "Saved",
      description: `Block section setup saved for ${selectedBlockCurriculum.curriculum_code}.`,
    });
  };

  const handleCancelBlockSection = () => {
    setSearchText("");
    setAppliedSearch("");
    setYearTermText("");
    setAppliedYearTerm("");
    setSelectedBlockCurriculumId(blockCurriculums[0] ? String(blockCurriculums[0].id) : "");
    toast({ title: "Cleared", description: "Create Block Section filters have been reset." });
  };

  const handleFreeSearch = () => {
    setFreeAppliedSearch(freeSearchText.trim());
    toast({ title: "Search applied", description: "Subject list search has been applied." });
  };

  const handleFreeRefresh = async () => {
    if (!API) return;
    try {
      const res = await fetch(`${API}/api/courses-master-list`);
      if (!res.ok) throw new Error("Refresh failed");
      setCourseMasters((await res.json()) as CourseMaster[]);
      toast({ title: "Refreshed", description: "Subject list refreshed." });
    } catch {
      toast({ title: "Refresh failed", description: "Unable to refresh subject list.", variant: "destructive" });
    }
  };

  const handleFreeSave = () => {
    if (!freeSelectedProgram) {
      toast({
        title: "Select program first",
        description: "Choose Institution/University/College/Program first before creating a free section.",
        variant: "destructive",
      });
      return;
    }
    if (!freeSectionName.trim()) {
      toast({
        title: "Section name required",
        description: "Enter a free section name (example: Section 1).",
        variant: "destructive",
      });
      return;
    }
    if (freeSelectedCodes.length === 0) {
      toast({
        title: "No subjects selected",
        description: "Please check at least one subject before saving.",
        variant: "destructive",
      });
      return;
    }
    const selectedRows = filteredFreeSectionCourses.filter((c) => freeSelectedCodes.includes(c.course_code));
    const entry: FreeSectionEntry = {
      id: crypto.randomUUID(),
      name: freeSectionName.trim(),
      program_id: freeSelectedProgram.id,
      college_id: freeSelectedProgram.college_id,
      campus_id: freeCampusIdNum,
      created_at: new Date().toISOString(),
      subjects: selectedRows.map((s) => ({ course_code: s.course_code, course_title: s.course_title ?? "" })),
    };
    const next = [...freeSections, entry];
    setFreeSections(next);
    localStorage.setItem("class-sections:free-sections", JSON.stringify(next));
    if (!expandedProgramIds.includes(freeSelectedProgram.id)) {
      setExpandedProgramIds((prev) => [...prev, freeSelectedProgram.id]);
    }
    setExpandedFreeSectionIds((prev) => [...prev, entry.id]);
    setSelectedProgramNodeId(String(freeSelectedProgram.id));
    setFreeSectionName("");
    setFreeSelectedCodes([]);
    toast({
      title: "Saved",
      description: `Created free section "${entry.name}" with ${selectedRows.length} subject(s).`,
    });
  };

  const handleFreeCancel = () => {
    setFreeSearchText("");
    setFreeAppliedSearch("");
    setFreeSelectedCodes([]);
    setFreeSectionName("");
    toast({ title: "Cleared", description: "Create Free Section selections cleared." });
  };

  const totalUnits = blockSubjects.reduce((sum, s) => sum + Number(s.credit_unit ?? 0), 0);
  const totalLecture = blockSubjects.reduce((sum, s) => sum + Number(s.lecture_hour ?? 0), 0);
  const totalLabUnits = blockSubjects.reduce((sum, s) => sum + Number(s.lab_unit ?? 0), 0);

  return (
    <div className="p-5 space-y-4">
      {/* Page header card */}
      <Card className="rounded-2xl border-border/60 shadow-sm overflow-hidden">
        <CardHeader className="pb-3 border-b border-border/40">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-600 text-white shadow-sm">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold tracking-tight">Class Sections</CardTitle>
              <p className="text-xs text-muted-foreground">Manage class sections and related assignments</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-3">
          <div className="flex flex-wrap gap-1.5">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "px-3 py-1.5 text-xs rounded-lg font-medium transition-colors border",
                  activeTab === tab.key
                    ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                    : "bg-background text-muted-foreground border-border/60 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tab content */}
      <div className="min-h-[600px]">
        {activeTab === "list-all" ? (
          <Card className="rounded-2xl border-border/60 shadow-sm overflow-hidden">
            {/* Year/Term filter bar */}
            <div className="flex items-center gap-3 border-b border-border/40 px-4 py-3 bg-muted/20 flex-wrap">
              <span className="text-xs font-medium text-muted-foreground shrink-0">Academic Year &amp; Term</span>
              <Select value={selectedYearTermId} onValueChange={setSelectedYearTermId}>
                <SelectTrigger className="h-9 rounded-xl border-border/60 text-xs shadow-sm w-60">
                  <SelectValue placeholder="Select Academic Year/Term" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {yearTerms.map((yt) => (
                    <SelectItem key={yt.id} value={String(yt.id)} className="text-xs">
                      {yt.academic_year} {yt.term}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedYearTermLabel && (
                <Badge className="bg-emerald-100 text-emerald-700 border-0 rounded-lg text-xs ml-auto">
                  {selectedYearTermLabel}
                </Badge>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[18rem_1fr] min-h-[560px]">
              {/* Sidebar tree */}
              <div className="border-r border-border/40 bg-muted/10">
                <div className="p-3 space-y-2 border-b border-border/40">
                  <Select
                    value={selectedCampusId}
                    onValueChange={(v) => {
                      setSelectedCampusId(v);
                      setSelectedCollegeId("");
                    }}
                  >
                    <SelectTrigger className="h-7 text-[12px]">
                      <SelectValue placeholder="Select Campus" />
                    </SelectTrigger>
                    <SelectContent>
                      {campuses.map((c) => (
                        <SelectItem key={c.id} value={String(c.id)}>
                          {c.acronym}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={selectedCollegeId} onValueChange={setSelectedCollegeId}>
                    <SelectTrigger className="h-7 text-[12px]">
                      <SelectValue placeholder="Select College" />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedCampusColleges.map((college) => (
                        <SelectItem key={college.id} value={String(college.id)}>
                          {college.college_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <ScrollArea className="h-[500px] p-2 text-xs">
                  <div className="flex items-center gap-1.5 px-2 py-1.5 font-semibold text-foreground">
                    <School className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Palawan State University</span>
                  </div>
                  {campuses.map((campus) => {
                    const expanded = expandedCampusIds.includes(campus.id);
                    const campusColleges = colleges.filter((x) => x.campus_id === campus.id);
                    return (
                      <div key={campus.id} className="ml-2">
                        <button
                          type="button"
                          onClick={() => {
                            toggleCampus(campus.id);
                            setSelectedCampusId(String(campus.id));
                            setSelectedCollegeId("");
                          }}
                          className={cn(
                            "w-full flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-left transition-colors hover:bg-emerald-50",
                            selectedCampusId === String(campus.id) && "bg-emerald-50 text-emerald-700 font-semibold"
                          )}
                        >
                          {expanded ? <ChevronDown className="h-3 w-3 shrink-0" /> : <ChevronRight className="h-3 w-3 shrink-0" />}
                          <School className="h-3 w-3 shrink-0 text-emerald-600" />
                          <span>{campus.acronym}</span>
                        </button>
                        {expanded && (
                          <div className="ml-4 border-l border-border/40 pl-1">
                            {campusColleges.map((college) => (
                              <div key={college.id}>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const cp = programsByCollege.get(college.id) ?? [];
                                    setSelectedCampusId(String(campus.id));
                                    setSelectedCollegeId(String(college.id));
                                    setSelectedProgramNodeId("");
                                    if (cp.length > 0 && !expandedCollegeIds.includes(college.id))
                                      setExpandedCollegeIds((prev) => [...prev, college.id]);
                                  }}
                                  className={cn(
                                    "w-full flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-left transition-colors hover:bg-emerald-50",
                                    selectedCollegeId === String(college.id) && "bg-emerald-50 text-emerald-700 font-semibold"
                                  )}
                                >
                                  {(() => {
                                    const cp = programsByCollege.get(college.id) ?? [];
                                    if (cp.length === 0) return <span className="w-3" />;
                                    return expandedCollegeIds.includes(college.id) ? <ChevronDown className="h-3 w-3 shrink-0" /> : <ChevronRight className="h-3 w-3 shrink-0" />;
                                  })()}
                                  <Building2 className="h-3 w-3 shrink-0 text-muted-foreground" />
                                  <span className="truncate">{college.college_name}</span>
                                </button>
                                {expandedCollegeIds.includes(college.id) && (
                                  <div className="ml-4 border-l border-border/30 pl-1">
                                    {(programsByCollege.get(college.id) ?? []).map((program) => {
                                      const programSections = freeSectionsByProgram.get(program.id) ?? [];
                                      const isProgramExpanded = expandedProgramIds.includes(program.id);
                                      return (
                                        <div key={program.id}>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setSelectedCampusId(String(campus.id));
                                              setSelectedCollegeId(String(college.id));
                                              setSelectedProgramNodeId(String(program.id));
                                              if (programSections.length > 0 && !isProgramExpanded) {
                                                setExpandedProgramIds((prev) => [...prev, program.id]);
                                              }
                                            }}
                                            className={cn(
                                              "w-full flex items-center gap-1 px-1 py-0.5 text-left hover:bg-[#e7f8ef]",
                                              selectedProgramNodeId === String(program.id) &&
                                              "bg-[#d9f3e5] text-[#1f5e45] font-semibold"
                                            )}
                                          >
                                            {programSections.length > 0 ? (
                                              isProgramExpanded ? (
                                                <ChevronDown className="h-3 w-3 shrink-0" />
                                              ) : (
                                                <ChevronRight className="h-3 w-3 shrink-0" />
                                              )
                                            ) : (
                                              <span className="w-3" />
                                            )}
                                            <BookOpen className="h-3 w-3 shrink-0 text-[#7f6a33]" />
                                            <span className="truncate">{program.program_name}</span>
                                          </button>

                                          {isProgramExpanded && (
                                            <div className="ml-4 border-l border-[#e3eee8] pl-1">
                                              {programSections.map((section) => (
                                                <div key={section.id}>
                                                  <button
                                                    type="button"
                                                    onClick={() =>
                                                      setExpandedFreeSectionIds((prev) =>
                                                        prev.includes(section.id)
                                                          ? prev.filter((x) => x !== section.id)
                                                          : [...prev, section.id]
                                                      )
                                                    }
                                                    className="w-full flex items-center gap-1 px-1 py-0.5 text-left hover:bg-[#e7f8ef]"
                                                  >
                                                    {expandedFreeSectionIds.includes(section.id) ? (
                                                      <ChevronDown className="h-3 w-3 shrink-0" />
                                                    ) : (
                                                      <ChevronRight className="h-3 w-3 shrink-0" />
                                                    )}
                                                    <Building2 className="h-3 w-3 shrink-0 text-[#8b5f3b]" />
                                                    <span className="truncate">{section.name}</span>
                                                  </button>

                                                  {expandedFreeSectionIds.includes(section.id) && (
                                                    <div className="ml-4 border-l border-[#edf5f0] pl-1">
                                                      {section.subjects.map((subject) => (
                                                        <div
                                                          key={`${section.id}-${subject.course_code}`}
                                                          className="flex items-center gap-1 px-1 py-0.5"
                                                        >
                                                          <BookOpen className="h-3 w-3 shrink-0 text-[#9b8a43]" />
                                                          <span className="truncate">{subject.course_title} (0)</span>
                                                        </div>
                                                      ))}
                                                    </div>
                                                  )}
                                                </div>
                                              ))}
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </ScrollArea>
              </div>

              {/* Main panel */}
              <div className="flex flex-col">
                {selectedCollege ? (
                  <>
                    <div className="grid grid-cols-12 border-b border-border/40 bg-muted/30">
                      <div className="col-span-1 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground border-r border-border/40">Prog.Code</div>
                      <div className="col-span-4 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground border-r border-border/40">Program Name</div>
                      <div className="col-span-1 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground border-r border-border/40 text-center">Years</div>
                      <div className="col-span-1 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground border-r border-border/40 text-center">Semesters</div>
                      <div className="col-span-1 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground border-r border-border/40 text-center">Max.Residency</div>
                      <div className="col-span-2 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground border-r border-border/40">Classification</div>
                      <div className="col-span-2 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Study Discipline</div>
                    </div>
                    <ScrollArea className="flex-1 h-[480px]">
                      {selectedCollegePrograms.map((p) => (
                        <div key={p.id} className="grid grid-cols-12 border-b border-border/30 hover:bg-emerald-50 transition-colors">
                          <div className="col-span-1 px-3 py-2.5 text-xs font-mono font-semibold text-emerald-700 border-r border-border/30">{p.program_code}</div>
                          <div className="col-span-4 px-3 py-2.5 text-xs border-r border-border/30">{p.program_name}</div>
                          <div className="col-span-1 px-3 py-2.5 text-xs text-center border-r border-border/30">{p.no_of_years ?? ""}</div>
                          <div className="col-span-1 px-3 py-2.5 text-xs text-center border-r border-border/30">{p.no_of_years ? p.no_of_years * 2 : ""}</div>
                          <div className="col-span-1 px-3 py-2.5 text-xs text-center border-r border-border/30">{p.max_residency ?? ""}</div>
                          <div className="col-span-2 px-3 py-2.5 text-xs truncate border-r border-border/30">{p.classification || "Baccalaureate Degree"}</div>
                          <div className="col-span-2 px-3 py-2.5 text-xs truncate">{p.thesis_option || "General"}</div>
                        </div>
                      ))}
                    </ScrollArea>
                  </>
                ) : (
                  <>
                    <div className="grid grid-cols-12 border-b border-border/40 bg-muted/30">
                      <div className="col-span-2 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground border-r border-border/40">College Code</div>
                      <div className="col-span-5 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground border-r border-border/40">The College</div>
                      <div className="col-span-2 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground border-r border-border/40 text-center">No. of Programs</div>
                      <div className="col-span-2 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground border-r border-border/40">College Dean</div>
                      <div className="col-span-1 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground text-center">Logo</div>
                    </div>
                    <ScrollArea className="flex-1 h-[480px]">
                      {selectedCampusColleges.map((college) => (
                        <div key={college.id} className="grid grid-cols-12 border-b border-border/30 hover:bg-emerald-50 transition-colors">
                          <div className="col-span-2 px-3 py-2.5 text-xs font-mono font-semibold text-emerald-700 border-r border-border/30">{college.college_code}</div>
                          <div className="col-span-5 px-3 py-2.5 text-xs border-r border-border/30">{college.college_name}</div>
                          <div className="col-span-2 px-3 py-2.5 text-xs text-center border-r border-border/30">{programCountByCollege.get(college.id) ?? 0}</div>
                          <div className="col-span-2 px-3 py-2.5 text-xs truncate border-r border-border/30">{college.dean_name || ""}</div>
                          <div className="col-span-1 px-3 py-2.5 text-xs text-center">{college.logo_url ? "✓" : "—"}</div>
                        </div>
                      ))}
                    </ScrollArea>
                  </>
                )}
              </div>
            </div>
          </Card>
        ) : activeTab === "create-block-section" ? (
          <div className="space-y-4">
            <Card className="rounded-2xl border-border/60 shadow-sm overflow-hidden">
              <CardHeader className="pb-3 border-b border-border/40">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <CardTitle className="text-sm font-semibold tracking-tight">
                      Create Block Section
                      {selectedBlockCurriculum && (
                        <Badge className="ml-2 bg-emerald-100 text-emerald-700 border-0 rounded-lg text-xs">
                          {selectedBlockCurriculum.curriculum_code}
                        </Badge>
                      )}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">Create a block section based on selected curriculum</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_14rem] gap-4">
                  {/* Curriculum table */}
                  <div className="border border-border/40 rounded-xl overflow-hidden">
                    <div className="grid grid-cols-12 border-b border-border/40 bg-muted/30">
                      <div className="col-span-1 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground border-r border-border/40">Code</div>
                      <div className="col-span-3 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground border-r border-border/40">Curriculum Code</div>
                      <div className="col-span-5 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground border-r border-border/40">Implementation</div>
                      <div className="col-span-3 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Year / Term</div>
                    </div>
                    <ScrollArea className="h-[150px]">
                      {filteredBlockCurriculums.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => setSelectedBlockCurriculumId(String(c.id))}
                          className={cn(
                            "w-full grid grid-cols-12 text-left border-b border-border/30 text-xs transition-colors hover:bg-emerald-50",
                            selectedBlockCurriculumId === String(c.id) && "bg-emerald-50 font-medium"
                          )}
                        >
                          <div className="col-span-1 px-3 py-2 border-r border-border/30 text-emerald-700 font-mono">{selectedCollege?.college_code || "-"}</div>
                          <div className="col-span-3 px-3 py-2 border-r border-border/30 truncate font-medium">{c.curriculum_code}</div>
                          <div className="col-span-5 px-3 py-2 border-r border-border/30 truncate text-muted-foreground">{c.description || "-"}</div>
                          <div className="col-span-3 px-3 py-2 text-muted-foreground truncate">
                            {c.no_of_years ? `${c.no_of_years} Year` : ""} — {prettyTerm(c.term_label)}
                          </div>
                        </button>
                      ))}
                    </ScrollArea>
                  </div>

                  {/* Sidebar filters */}
                  <div className="space-y-2">
                    <Select value={blockProgramId} onValueChange={setBlockProgramId}>
                      <SelectTrigger className="h-9 rounded-xl border-border/60 text-xs shadow-sm">
                        <SelectValue placeholder="Program" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        {availableProgramsForBlock.map((p) => (
                          <SelectItem key={p.id} value={String(p.id)} className="text-xs">
                            {p.program_code} — {p.program_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input className="h-9 text-xs rounded-xl border-border/60 shadow-sm" placeholder="Search curriculum..." value={searchText} onChange={(e) => setSearchText(e.target.value)} />
                    <Input className="h-9 text-xs rounded-xl border-border/60 shadow-sm" placeholder="Filter year/term..." value={yearTermText} onChange={(e) => setYearTermText(e.target.value)} />
                    <div className="flex gap-2">
                      <Button className="h-9 text-xs flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-700" onClick={handleSearch}><Search className="h-3.5 w-3.5 mr-1" />Search</Button>
                      <Button className="h-9 text-xs flex-1 rounded-xl" variant="outline" onClick={handleFilter}>Filter</Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-border/60 shadow-sm overflow-hidden">
              <CardHeader className="pb-3 border-b border-border/40">
                <CardTitle className="text-xs font-semibold tracking-tight text-muted-foreground uppercase">
                  Subjects — Curriculum {selectedBlockCurriculum?.curriculum_code || "--"}
                </CardTitle>
              </CardHeader>
              <div className="grid grid-cols-12 border-b border-border/40 bg-muted/30">
                {["Subject Code", "Descriptive Title", "Credit Units", "Lecture Hrs.", "Lab Units", "Lab Hrs.", "Gen. Ed", "Min. Size"].map((h, i) => (
                  <div key={i} className={cn("px-2 py-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground border-r last:border-r-0 border-border/40", i === 0 ? "col-span-2" : i === 1 ? "col-span-3" : "col-span-1")}>{h}</div>
                ))}
              </div>
              <ScrollArea className="h-[220px]">
                {blockSubjects.map((s) => {
                  const cm = courseMasterByCode.get(normCode(s.subject_code));
                  return (
                    <div key={s.id} className="grid grid-cols-12 border-b border-border/30 hover:bg-emerald-50 transition-colors text-xs">
                      <div className="col-span-2 px-2 py-2 border-r border-border/30 font-mono text-emerald-700">{s.subject_code}</div>
                      <div className="col-span-3 px-2 py-2 border-r border-border/30 truncate">{s.descriptive_title}</div>
                      <div className="col-span-1 px-2 py-2 border-r border-border/30 text-right">{Number(s.credit_unit ?? 0).toFixed(2)}</div>
                      <div className="col-span-1 px-2 py-2 border-r border-border/30 text-right">{Number(s.lecture_hour ?? 0).toFixed(2)}</div>
                      <div className="col-span-1 px-2 py-2 border-r border-border/30 text-right">{Number(s.lab_unit ?? 0).toFixed(2)}</div>
                      <div className="col-span-1 px-2 py-2 border-r border-border/30 text-right">{Number(s.laboratory_hour ?? 0).toFixed(2)}</div>
                      <div className="col-span-1 px-2 py-2 border-r border-border/30 flex items-center justify-center">
                        <Checkbox checked={!!cm?.general_education} onCheckedChange={() => { }} />
                      </div>
                      <div className="col-span-2 px-2 py-2 text-right">{cm?.default_min_class_limit ?? 15}</div>
                    </div>
                  );
                })}
              </ScrollArea>
              <div className="flex items-center justify-between border-t border-border/40 bg-muted/20 px-4 py-2.5">
                <div className="flex gap-4 text-xs text-muted-foreground">
                  <span>Subjects: <strong className="text-foreground">{blockSubjects.length}</strong></span>
                  <span>Units: <strong className="text-foreground">{totalUnits.toFixed(1)}</strong></span>
                  <span>Lecture Hrs: <strong className="text-foreground">{totalLecture.toFixed(1)}</strong></span>
                  <span>Lab Units: <strong className="text-foreground">{totalLabUnits.toFixed(1)}</strong></span>
                </div>
                <div className="flex gap-2">
                  <Button className="h-9 text-xs rounded-xl bg-emerald-600 hover:bg-emerald-700" onClick={handleSaveBlockSection}><Save className="h-3.5 w-3.5 mr-1" />Save</Button>
                  <Button className="h-9 text-xs rounded-xl" variant="outline" onClick={() => setHelpOpen(true)}><HelpCircle className="h-3.5 w-3.5 mr-1" />Help</Button>
                  <Button className="h-9 text-xs rounded-xl" variant="destructive" onClick={handleCancelBlockSection}><X className="h-3.5 w-3.5 mr-1" />Cancel</Button>
                </div>
              </div>
            </Card>

            <AlertDialog open={helpOpen} onOpenChange={setHelpOpen}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Create Block Section Help</AlertDialogTitle>
                  <AlertDialogDescription>
                    1) Select a Program and Curriculum row.
                    {"\n"}2) Use Search and Filter to narrow curriculum results.
                    {"\n"}3) Review subjects, then click Save to store the setup snapshot.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Close</AlertDialogCancel>
                  <AlertDialogAction onClick={() => setHelpOpen(false)}>Got it</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

        ) : activeTab === "create-free-section" ? (
          <div className="space-y-4">
            <Card className="rounded-2xl border-border/60 shadow-sm overflow-hidden">
              <CardHeader className="pb-3 border-b border-border/40 bg-muted/10">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <CardTitle className="text-sm font-semibold tracking-tight">Create Free Section</CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">Add subject(s) as part of Free Section / Special Classes</p>
                  </div>
                  {freeSelectedProgram && (
                    <Badge className="bg-emerald-100 text-emerald-700 border-0 rounded-lg text-xs">
                      {freeSelectedProgram.program_name}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_12rem] gap-4">
                  <div className="space-y-4">
                    {/* Header Controls */}
                    <div className="grid grid-cols-1 md:grid-cols-[1fr_14rem] gap-4 items-end">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Institution</label>
                          <Select value={freeInstitutionId} onValueChange={setFreeInstitutionId}>
                            <SelectTrigger className="h-9 rounded-xl border-border/60 text-xs shadow-sm bg-background">
                              <SelectValue placeholder="Institution" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl">
                              {institutions.map((inst) => (
                                <SelectItem key={inst.id} value={String(inst.id)} className="text-xs">
                                  {inst.official_name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Campus</label>
                          <Select value={freeCampusId} onValueChange={setFreeCampusId}>
                            <SelectTrigger className="h-9 rounded-xl border-border/60 text-xs shadow-sm bg-background">
                              <SelectValue placeholder="University / Campus" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl">
                              {freeCampuses.map((campus) => (
                                <SelectItem key={campus.id} value={String(campus.id)} className="text-xs">
                                  {campus.acronym} {campus.campus_name ? `- ${campus.campus_name}` : ""}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">College</label>
                          <Select value={freeCollegeId} onValueChange={setFreeCollegeId}>
                            <SelectTrigger className="h-9 rounded-xl border-border/60 text-xs shadow-sm bg-background">
                              <SelectValue placeholder="College" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl">
                              {freeColleges.map((college) => (
                                <SelectItem key={college.id} value={String(college.id)} className="text-xs">
                                  {college.college_name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Program</label>
                          <Select value={freeProgramId} onValueChange={setFreeProgramId}>
                            <SelectTrigger className="h-9 rounded-xl border-border/60 text-xs shadow-sm bg-background">
                              <SelectValue placeholder="Program" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl">
                              {freePrograms.map((program) => (
                                <SelectItem key={program.id} value={String(program.id)} className="text-xs">
                                  {program.program_code} - {program.program_name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Free Section Name</label>
                        <Input
                          className="h-9 rounded-xl border-border/60 text-xs shadow-sm focus-visible:ring-emerald-500"
                          placeholder="e.g. Section 1"
                          value={freeSectionName}
                          onChange={(e) => setFreeSectionName(e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Search Input */}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        className="h-10 pl-9 rounded-xl border-border/60 text-xs shadow-sm focus-visible:ring-emerald-500 bg-muted/20"
                        placeholder="Input a Subject Code / Title to Search..."
                        value={freeSearchText}
                        onChange={(e) => setFreeSearchText(e.target.value)}
                      />
                    </div>

                    {/* Subjects Grid */}
                    <div className="border border-border/40 rounded-xl overflow-hidden shadow-sm">
                      <div className="grid grid-cols-[3rem_8rem_1fr_4rem_4rem_4rem_4rem_4rem] bg-muted/30 border-b border-border/40 text-[10px] font-bold uppercase tracking-wider text-muted-foreground h-9 items-center px-2">
                        <div className="text-center">SID#</div>
                        <div className="px-2 border-l border-border/40">Subject Code</div>
                        <div className="px-2 border-l border-border/40">Subject Title</div>
                        <div className="text-center border-l border-border/40">Units</div>
                        <div className="text-center border-l border-border/40">Lab.Units</div>
                        <div className="text-center border-l border-border/40">Lect.Hrs</div>
                        <div className="text-center border-l border-border/40">Lab.Hrs</div>
                        <div className="text-center border-l border-border/40">Limit</div>
                      </div>
                      <ScrollArea
                        className="h-[380px]"
                        onScrollCapture={(e) => setFreeGridScrollTop(e.currentTarget.scrollTop)}
                      >
                        <div style={{ height: freeGridTopSpacer }} />
                        {visibleFreeSectionRows.map((row, idx) => (
                          <div
                            key={`${row.course_code}-${freeGridStartIndex + idx}`}
                            role="button"
                            tabIndex={0}
                            onClick={() =>
                              setFreeSelectedCodes((prev) =>
                                prev.includes(row.course_code)
                                  ? prev.filter((x) => x !== row.course_code)
                                  : [...prev, row.course_code]
                              )
                            }
                            onKeyDown={(e) => {
                              if (e.key !== "Enter" && e.key !== " ") return;
                              e.preventDefault();
                              setFreeSelectedCodes((prev) =>
                                prev.includes(row.course_code)
                                  ? prev.filter((x) => x !== row.course_code)
                                  : [...prev, row.course_code]
                              );
                            }}
                            className={cn(
                              "w-full grid grid-cols-[3rem_8rem_1fr_4rem_4rem_4rem_4rem_4rem] border-b border-border/20 text-xs items-center px-2 transition-colors hover:bg-emerald-50 cursor-pointer",
                              freeSelectedSet.has(row.course_code) && "bg-emerald-50/80"
                            )}
                            style={{ height: `${FREE_SECTION_ROW_HEIGHT}px` }}
                          >
                            <div
                              className="flex items-center justify-center h-full"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Checkbox
                                checked={freeSelectedSet.has(row.course_code)}
                                className="h-4 w-4 border-emerald-500/50 data-[state=checked]:bg-emerald-600"
                                onCheckedChange={(checked) =>
                                  setFreeSelectedCodes((prev) =>
                                    checked
                                      ? prev.includes(row.course_code)
                                        ? prev
                                        : [...prev, row.course_code]
                                      : prev.filter((x) => x !== row.course_code)
                                  )
                                }
                              />
                            </div>
                            <div className="px-2 font-mono text-emerald-700 font-semibold">{row.course_code}</div>
                            <div className="px-2 truncate">{row.course_title || "-"}</div>
                            <div className="text-center font-medium">{Number(row.credited_units ?? 0).toFixed(2)}</div>
                            <div className="text-center">{Number(row.laboratory_units ?? 0).toFixed(2)}</div>
                            <div className="text-center">{Number(row.lecture_hours ?? 0).toFixed(2)}</div>
                            <div className="text-center">{Number(row.laboratory_hours ?? 0).toFixed(2)}</div>
                            <div className="text-center text-muted-foreground">{row.default_min_class_limit ?? 40}</div>
                          </div>
                        ))}
                        <div style={{ height: freeGridBottomSpacer }} />
                      </ScrollArea>
                    </div>
                  </div>

                  {/* Action Sidebar */}
                  <div className="flex flex-col gap-2 pt-6 lg:pt-0">
                    <div className="p-3 bg-muted/20 rounded-xl border border-border/40 space-y-2">
                      <Button className="w-full h-9 text-xs rounded-xl bg-emerald-600 hover:bg-emerald-700 shadow-sm" onClick={handleFreeSearch} disabled={!freeSelectedProgram}>
                        <Search className="h-3.5 w-3.5 mr-2" /> Search
                      </Button>
                      <Button className="w-full h-9 text-xs rounded-xl shadow-sm" variant="outline" onClick={() => void handleFreeRefresh()} disabled={!freeSelectedProgram}>
                        <RefreshCw className="h-3.5 w-3.5 mr-2" /> Refresh
                      </Button>
                    </div>

                    <div className="flex-1 min-h-[100px]" />

                    <div className="p-3 bg-muted/20 rounded-xl border border-border/40 space-y-2">
                      <Button className="w-full h-9 text-xs rounded-xl shadow-sm" variant="outline" onClick={() => setFreeHelpOpen(true)} disabled={!freeSelectedProgram}>
                        <HelpCircle className="h-3.5 w-3.5 mr-2" /> Help
                      </Button>
                      <Separator className="my-2 bg-border/60" />
                      <Button className="w-full h-9 text-xs rounded-xl bg-emerald-600 hover:bg-emerald-700 shadow-sm" onClick={handleFreeSave} disabled={!freeSelectedProgram}>
                        <Save className="h-3.5 w-3.5 mr-2" /> Save
                      </Button>
                      <Button className="w-full h-9 text-xs rounded-xl shadow-sm" variant="destructive" onClick={handleFreeCancel} disabled={!freeSelectedProgram}>
                        <X className="h-3.5 w-3.5 mr-2" /> Cancel
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
              <div className="bg-muted/30 px-4 py-2 border-t border-border/40 flex items-center gap-2">
                <div className="p-1 rounded-md bg-emerald-100">
                  <HelpCircle className="h-3.5 w-3.5 text-emerald-600" />
                </div>
                <span className="text-[11px] text-muted-foreground font-medium">To select subject(s), put a checkmark on the left-most edge of the subject row.</span>
              </div>
            </Card>

            <AlertDialog open={freeHelpOpen} onOpenChange={setFreeHelpOpen}>
              <AlertDialogContent className="rounded-2xl border-border/60">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-xl font-bold tracking-tight">Create Free Section Help</AlertDialogTitle>
                  <Separator className="my-2" />
                  <AlertDialogDescription className="space-y-4 pt-2">
                    <div className="flex gap-3">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[10px] font-bold text-emerald-700">1</div>
                      <p className="text-sm font-medium text-foreground">Select a program from the filters and enter a Free Section name.</p>
                    </div>
                    <div className="flex gap-3">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[10px] font-bold text-emerald-700">2</div>
                      <p className="text-sm font-medium text-foreground">Search by subject code/title, then select subjects using the left checkbox.</p>
                    </div>
                    <div className="flex gap-3">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[10px] font-bold text-emerald-700">3</div>
                      <p className="text-sm font-medium text-foreground">Click Save to create the free section under that program.</p>
                    </div>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="mt-6 border-t pt-4">
                  <AlertDialogCancel className="rounded-xl h-10 px-6">Close</AlertDialogCancel>
                  <AlertDialogAction onClick={() => setFreeHelpOpen(false)} className="rounded-xl h-10 px-8 bg-emerald-600 hover:bg-emerald-700">Got it</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

        ) : activeTab === "rename-class-section" ? (
          <div className="space-y-4">
            <Card className="rounded-2xl border-border/40 shadow-sm overflow-hidden">
              <CardHeader className="pb-3 border-b border-border/40 bg-muted/5">
                <CardTitle className="text-sm font-semibold tracking-tight">Rename Class Section</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">Change the display name of an existing class section</p>
              </CardHeader>
              <CardContent className="p-6">
                <div className="max-w-md mx-auto space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Select Section to Rename</Label>
                    <Select>
                      <SelectTrigger className="h-10 rounded-xl border-border/60 text-xs shadow-sm">
                        <SelectValue placeholder="Choose a section..." />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="1" className="text-xs">Section 101 - A</SelectItem>
                        <SelectItem value="2" className="text-xs">Section 102 - B</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">New Section Name</Label>
                    <Input
                      className="h-10 rounded-xl border-border/60 text-sm shadow-sm focus-visible:ring-emerald-500"
                      placeholder="Enter new name..."
                    />
                  </div>
                  <div className="pt-2 flex gap-3">
                    <Button className="flex-1 h-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 shadow-sm text-xs">
                      <Save className="h-3.5 w-3.5 mr-2" /> Update Name
                    </Button>
                    <Button variant="outline" className="flex-1 h-10 rounded-xl text-xs shadow-sm">
                      Cancel
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : activeTab === "delete-class-section" ? (
          <div className="space-y-4">
            <Card className="rounded-2xl border-border/40 shadow-sm overflow-hidden">
              <CardHeader className="pb-3 border-b border-border/40 bg-muted/5">
                <CardTitle className="text-sm font-semibold tracking-tight">Delete Class Section</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">Permanently remove a class section from the system</p>
              </CardHeader>
              <CardContent className="p-6">
                <div className="max-w-md mx-auto space-y-6">
                  <div className="p-4 rounded-xl bg-destructive/5 border border-destructive/20 flex gap-3">
                    <div className="h-8 w-8 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-destructive">Warning: This action cannot be undone</p>
                      <p className="text-[11px] text-destructive/70 mt-0.5">Deleting a section will also remove all associated subject assignments and student enrollments for this specific section.</p>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Select Section to Delete</Label>
                    <Select>
                      <SelectTrigger className="h-10 rounded-xl border-border/60 text-xs shadow-sm">
                        <SelectValue placeholder="Choose a section..." />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="1" className="text-xs">Section 101 - A</SelectItem>
                        <SelectItem value="2" className="text-xs">Section 102 - B</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="pt-2 flex gap-3">
                    <Button variant="destructive" className="flex-1 h-10 rounded-xl shadow-sm text-xs">
                      <Trash2 className="h-3.5 w-3.5 mr-2" /> Confirm Deletion
                    </Button>
                    <Button variant="outline" className="flex-1 h-10 rounded-xl text-xs shadow-sm">
                      Cancel
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : activeTab === "assign-adviser" ? (
          <div className="space-y-4">
            <Card className="rounded-2xl border-border/40 shadow-sm overflow-hidden">
              <CardHeader className="pb-3 border-b border-border/40 bg-muted/5">
                <CardTitle className="text-sm font-semibold tracking-tight">Assign Class Section Adviser</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">Assign a faculty member as an adviser to a specific class section</p>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 max-w-4xl mx-auto">
                  <div className="md:col-span-6 space-y-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground uppercase tracking-wider font-bold">1. Select Target Section</Label>
                      <Select>
                        <SelectTrigger className="h-10 rounded-xl border-border/60 text-xs shadow-sm">
                          <SelectValue placeholder="Choose a section..." />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                          <SelectItem value="1" className="text-xs">Section 101 - A (BSCS)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="p-4 rounded-xl border border-dashed border-border/60 bg-muted/20 flex flex-col items-center justify-center gap-2 min-h-[140px]">
                      <Users className="h-8 w-8 text-muted-foreground/30" />
                      <p className="text-[11px] text-muted-foreground italic">Current Adviser: Not Assigned</p>
                    </div>
                  </div>
                  <div className="md:col-span-6 space-y-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground uppercase tracking-wider font-bold">2. Assign Faculty Adviser</Label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                        <Input className="h-10 pl-9 rounded-xl border-border/60 text-xs shadow-sm" placeholder="Search faculty name..." />
                      </div>
                      <ScrollArea className="h-[140px] border border-border/40 rounded-xl bg-background mt-2">
                        <div className="p-1 space-y-1">
                          {["Dr. John Smith", "Prof. Jane Doe", "Engr. Michael Brown"].map((f) => (
                            <button key={f} className="w-full text-left px-3 py-2 text-xs rounded-lg hover:bg-muted/50 transition-colors flex items-center justify-between">
                              <span>{f}</span>
                              <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 text-[10px]">Select</Badge>
                            </button>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  </div>
                  <div className="md:col-span-12 flex justify-end gap-3 pt-2">
                    <Button variant="outline" className="h-10 px-6 rounded-xl text-xs shadow-sm">Cancel</Button>
                    <Button className="h-10 px-8 rounded-xl bg-emerald-600 hover:bg-emerald-700 shadow-sm text-xs font-semibold">
                      Update Assignment
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card className="rounded-2xl border-border/40 shadow-sm overflow-hidden">
            <CardHeader className="pb-3 border-b border-border/40 bg-muted/5">
              <CardTitle className="text-sm font-semibold tracking-tight">{activeLabel}</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">Manage assignments and settings for the selected section</p>
            </CardHeader>
            <CardContent className="p-12 flex flex-col items-center justify-center gap-4 text-muted-foreground">
              <div className="h-16 w-16 rounded-full bg-emerald-100/50 flex items-center justify-center">
                <GraduationCap className="h-8 w-8 text-emerald-600 opacity-40" />
              </div>
              <div className="text-center space-y-1">
                <p className="text-sm font-semibold text-foreground">Advanced Configuration Required</p>
                <p className="text-xs opacity-60 leading-relaxed max-w-[280px]">The specialized workflow for &ldquo;{activeLabel}&rdquo; is being finalized to ensure data integrity.</p>
              </div>
              <Button variant="outline" className="mt-2 rounded-xl text-xs px-6">
                View Documentation
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
