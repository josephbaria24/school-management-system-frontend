"use client";

import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Building2, ChevronDown, ChevronRight, School, BookOpen } from "lucide-react";

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
    <div className="h-full bg-[#f2fbf7] p-1">
      <div className="w-full border border-[#79b898] bg-white">
        <div className="bg-gradient-to-b from-[#def8ea] to-[#9fdbbc] border-b border-[#79b898] px-2 py-1">
          <h1 className="text-[34px] leading-none text-[#1f5e45] font-semibold">Class Sections</h1>
          <p className="text-[12px] text-[#35684f]">
            Use this module to manage class sections and related assignments.
          </p>
        </div>

        <div className="px-2 pt-1.5 border-b border-[#9ed9c1] bg-[#f2fbf7]">
          <div className="flex flex-wrap gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "px-2 py-0.5 text-[12px] border border-[#79b898]",
                  activeTab === tab.key
                    ? "bg-[#d9f3e5] text-[#1f5e45] font-semibold"
                    : "bg-white text-[#35684f]"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-2 min-h-[620px] bg-[#f2fbf7]">
          {activeTab === "list-all" ? (
            <div className="h-full border border-[#79b898] bg-white">
              <div className="grid grid-cols-12 border-b border-[#9ed9c1] bg-[#f8fdf9] px-2 py-1 text-[12px] items-center gap-2">
                <div className="col-span-4 font-semibold text-[#1f5e45]">
                  Please select the Academic Year and Term
                </div>
                <div className="col-span-4">
                  <Select value={selectedYearTermId} onValueChange={setSelectedYearTermId}>
                    <SelectTrigger className="h-7 text-[12px]">
                      <SelectValue placeholder="Select Academic Year/Term" />
                    </SelectTrigger>
                    <SelectContent>
                      {yearTerms.map((yt) => (
                        <SelectItem key={yt.id} value={String(yt.id)}>
                          {yt.academic_year} {yt.term}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-4 text-right text-[#35684f] text-[11px]">
                  {selectedYearTermLabel || "No Academic Year/Term selected"}
                </div>
              </div>

              <div className="grid grid-cols-12 min-h-[560px]">
                <div className="col-span-12 lg:col-span-3 border-r border-[#9ed9c1] bg-[#f6fcf9]">
                  <div className="border-b border-[#9ed9c1] p-1 space-y-1">
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

                  <div className="h-[520px] overflow-auto p-1 text-[12px]">
                    <div className="flex items-center gap-1 px-1 py-0.5 font-semibold text-[#1f5e45]">
                      <School className="h-3.5 w-3.5" />
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
                              "w-full flex items-center gap-1 px-1 py-0.5 text-left hover:bg-[#e7f8ef]",
                              selectedCampusId === String(campus.id) && "bg-[#d9f3e5] text-[#1f5e45] font-semibold"
                            )}
                          >
                            {expanded ? (
                              <ChevronDown className="h-3 w-3 shrink-0" />
                            ) : (
                              <ChevronRight className="h-3 w-3 shrink-0" />
                            )}
                            <School className="h-3 w-3 shrink-0 text-[#2f9b68]" />
                            <span>{campus.acronym}</span>
                          </button>
                          {expanded && (
                            <div className="ml-4 border-l border-[#cfe6da] pl-1">
                              {campusColleges.map((college) => (
                                <div key={college.id}>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const collegePrograms = programsByCollege.get(college.id) ?? [];
                                      setSelectedCampusId(String(campus.id));
                                      setSelectedCollegeId(String(college.id));
                                      setSelectedProgramNodeId("");
                                    if (collegePrograms.length > 0 && !expandedCollegeIds.includes(college.id)) {
                                      setExpandedCollegeIds((prev) => [...prev, college.id]);
                                    }
                                    }}
                                    className={cn(
                                      "w-full flex items-center gap-1 px-1 py-0.5 text-left hover:bg-[#e7f8ef]",
                                      selectedCollegeId === String(college.id) &&
                                        "bg-[#d9f3e5] text-[#1f5e45] font-semibold"
                                    )}
                                  >
                                    {(() => {
                                      const collegePrograms = programsByCollege.get(college.id) ?? [];
                                      if (collegePrograms.length === 0) return <span className="w-3" />;
                                      return expandedCollegeIds.includes(college.id) ? (
                                        <ChevronDown className="h-3 w-3 shrink-0" />
                                      ) : (
                                        <ChevronRight className="h-3 w-3 shrink-0" />
                                      );
                                    })()}
                                    <Building2 className="h-3 w-3 shrink-0 text-[#6a8f7c]" />
                                    <span className="truncate">{college.college_name}</span>
                                  </button>
                                  {expandedCollegeIds.includes(college.id) && (
                                    <div className="ml-4 border-l border-[#d9e9df] pl-1">
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
                  </div>
                </div>

                <div className="col-span-12 lg:col-span-9 bg-white">
                  {selectedCollege ? (
                    <>
                      <div className="grid grid-cols-12 bg-gradient-to-b from-[#6ec79b] to-[#2f9b68] text-white text-[11px] font-bold uppercase">
                        <div className="col-span-1 px-2 py-1 border-r border-white/30">Prog.Code</div>
                        <div className="col-span-4 px-2 py-1 border-r border-white/30">Program Name</div>
                        <div className="col-span-1 px-2 py-1 border-r border-white/30 text-center">Years</div>
                        <div className="col-span-1 px-2 py-1 border-r border-white/30 text-center">Semesters</div>
                        <div className="col-span-1 px-2 py-1 border-r border-white/30 text-center">Max.Residency</div>
                        <div className="col-span-2 px-2 py-1 border-r border-white/30">Program Classification</div>
                        <div className="col-span-2 px-2 py-1">Study Discipline</div>
                      </div>
                      <div className="h-[520px] overflow-auto">
                        {selectedCollegePrograms.map((p) => (
                          <div
                            key={p.id}
                            className="grid grid-cols-12 border-b border-[#d4e8dc] text-[12px] hover:bg-[#e7f8ef]"
                          >
                            <div className="col-span-1 px-2 py-1 border-r border-[#d4e8dc]">{p.program_code}</div>
                            <div className="col-span-4 px-2 py-1 border-r border-[#d4e8dc]">{p.program_name}</div>
                            <div className="col-span-1 px-2 py-1 border-r border-[#d4e8dc] text-center">
                              {p.no_of_years ?? ""}
                            </div>
                            <div className="col-span-1 px-2 py-1 border-r border-[#d4e8dc] text-center">
                              {p.no_of_years ? p.no_of_years * 2 : ""}
                            </div>
                            <div className="col-span-1 px-2 py-1 border-r border-[#d4e8dc] text-center">
                              {p.max_residency ?? ""}
                            </div>
                            <div className="col-span-2 px-2 py-1 border-r border-[#d4e8dc] truncate">
                              {p.classification || "Baccalaureate Degree"}
                            </div>
                            <div className="col-span-2 px-2 py-1 truncate">{p.thesis_option || "General"}</div>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="grid grid-cols-12 bg-gradient-to-b from-[#6ec79b] to-[#2f9b68] text-white text-[11px] font-bold uppercase">
                        <div className="col-span-2 px-2 py-1 border-r border-white/30">College Code</div>
                        <div className="col-span-5 px-2 py-1 border-r border-white/30">The College</div>
                        <div className="col-span-2 px-2 py-1 border-r border-white/30 text-center">No. of Programs</div>
                        <div className="col-span-2 px-2 py-1 border-r border-white/30">College Dean</div>
                        <div className="col-span-1 px-2 py-1 text-center">College Logo</div>
                      </div>
                      <div className="h-[520px] overflow-auto">
                        {selectedCampusColleges.map((college) => (
                          <div
                            key={college.id}
                            className="grid grid-cols-12 border-b border-[#d4e8dc] text-[12px] hover:bg-[#e7f8ef]"
                          >
                            <div className="col-span-2 px-2 py-1 border-r border-[#d4e8dc]">{college.college_code}</div>
                            <div className="col-span-5 px-2 py-1 border-r border-[#d4e8dc]">{college.college_name}</div>
                            <div className="col-span-2 px-2 py-1 border-r border-[#d4e8dc] text-center">
                              {programCountByCollege.get(college.id) ?? 0}
                            </div>
                            <div className="col-span-2 px-2 py-1 border-r border-[#d4e8dc] truncate">
                              {college.dean_name || ""}
                            </div>
                            <div className="col-span-1 px-2 py-1 text-center truncate">
                              {college.logo_url ? "OK" : "NULL"}
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          ) : activeTab === "create-block-section" ? (
            <div className="h-full border border-[#79b898] bg-[#dbeff5] p-1.5 space-y-1.5">
              <div className="border border-[#79b898] bg-white">
                <div className="bg-gradient-to-b from-[#6ec79b] to-[#2f9b68] px-2 py-1 text-white">
                  <div className="text-[22px] leading-none font-semibold">
                    BLOCK SECTION - Curriculum Code: {selectedBlockCurriculum?.curriculum_code || "--"}
                  </div>
                  <div className="text-[11px] opacity-95">Create a block section based on selected curriculum.</div>
                </div>

                <div className="grid grid-cols-12 gap-1 p-1">
                  <div className="col-span-12 lg:col-span-9 border border-[#9ed9c1]">
                    <div className="grid grid-cols-12 bg-[#f8fdf9] text-[11px] font-semibold text-[#1f5e45] border-b border-[#d4e8dc]">
                      <div className="col-span-1 px-1 py-1 border-r border-[#d4e8dc]">College Code</div>
                      <div className="col-span-3 px-1 py-1 border-r border-[#d4e8dc]">Curriculum Code</div>
                      <div className="col-span-5 px-1 py-1 border-r border-[#d4e8dc]">Implementation</div>
                      <div className="col-span-3 px-1 py-1">YearTermDesc</div>
                    </div>
                    <div className="h-[150px] overflow-auto text-[12px]">
                      {filteredBlockCurriculums.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => setSelectedBlockCurriculumId(String(c.id))}
                          className={cn(
                            "w-full grid grid-cols-12 text-left border-b border-[#d4e8dc] hover:bg-[#e7f8ef]",
                            selectedBlockCurriculumId === String(c.id) && "bg-[#d9f3e5]"
                          )}
                        >
                          <div className="col-span-1 px-1 py-1 border-r border-[#d4e8dc]">{selectedCollege?.college_code || "-"}</div>
                          <div className="col-span-3 px-1 py-1 border-r border-[#d4e8dc] truncate">{c.curriculum_code}</div>
                          <div className="col-span-5 px-1 py-1 border-r border-[#d4e8dc] truncate">{c.description || "-"}</div>
                          <div className="col-span-3 px-1 py-1 truncate">
                            {(c.no_of_years ? `${c.no_of_years} Year` : "")} - {prettyTerm(c.term_label)}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="col-span-12 lg:col-span-3 border border-[#9ed9c1] p-1 space-y-1 text-[11px]">
                    <Select value={blockProgramId} onValueChange={setBlockProgramId}>
                      <SelectTrigger className="h-7 text-[12px]">
                        <SelectValue placeholder="Program" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableProgramsForBlock.map((p) => (
                          <SelectItem key={p.id} value={String(p.id)}>
                            {p.program_code} - {p.program_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      className="h-7 text-[12px]"
                      placeholder="Search curriculum..."
                      value={searchText}
                      onChange={(e) => setSearchText(e.target.value)}
                    />
                    <Input
                      className="h-7 text-[12px]"
                      placeholder="Filter year/term..."
                      value={yearTermText}
                      onChange={(e) => setYearTermText(e.target.value)}
                    />
                    <div className="flex gap-1">
                      <Button className="h-7 text-[11px] flex-1" onClick={handleSearch}>Search</Button>
                      <Button className="h-7 text-[11px] flex-1" variant="outline" onClick={handleFilter}>Filter</Button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border border-[#79b898] bg-white">
                <div className="bg-gradient-to-b from-[#6ec79b] to-[#2f9b68] text-white text-[11px] font-bold px-2 py-1 uppercase">
                  List of Subjects under the Curriculum Code {selectedBlockCurriculum?.curriculum_code || "--"}
                </div>
                <div className="grid grid-cols-12 bg-[#f8fdf9] text-[11px] font-semibold text-[#1f5e45] border-b border-[#d4e8dc]">
                  <div className="col-span-2 px-1 py-1 border-r border-[#d4e8dc]">Subject Code</div>
                  <div className="col-span-3 px-1 py-1 border-r border-[#d4e8dc]">Descriptive Title</div>
                  <div className="col-span-1 px-1 py-1 border-r border-[#d4e8dc] text-center">Credit Units</div>
                  <div className="col-span-1 px-1 py-1 border-r border-[#d4e8dc] text-center">Lecture Hrs.</div>
                  <div className="col-span-1 px-1 py-1 border-r border-[#d4e8dc] text-center">Lab Units</div>
                  <div className="col-span-1 px-1 py-1 border-r border-[#d4e8dc] text-center">Lab Hrs.</div>
                  <div className="col-span-1 px-1 py-1 border-r border-[#d4e8dc] text-center">Gen. Ed</div>
                  <div className="col-span-2 px-1 py-1 text-center">Min. Size</div>
                </div>
                <div className="h-[220px] overflow-auto text-[12px]">
                  {blockSubjects.map((s) => {
                    const cm = courseMasterByCode.get(normCode(s.subject_code));
                    return (
                      <div key={s.id} className="grid grid-cols-12 border-b border-[#d4e8dc] hover:bg-[#f3fbf6]">
                        <div className="col-span-2 px-1 py-1 border-r border-[#d4e8dc]">{s.subject_code}</div>
                        <div className="col-span-3 px-1 py-1 border-r border-[#d4e8dc] truncate">{s.descriptive_title}</div>
                        <div className="col-span-1 px-1 py-1 border-r border-[#d4e8dc] text-right">{Number(s.credit_unit ?? 0).toFixed(2)}</div>
                        <div className="col-span-1 px-1 py-1 border-r border-[#d4e8dc] text-right">{Number(s.lecture_hour ?? 0).toFixed(2)}</div>
                        <div className="col-span-1 px-1 py-1 border-r border-[#d4e8dc] text-right">{Number(s.lab_unit ?? 0).toFixed(2)}</div>
                        <div className="col-span-1 px-1 py-1 border-r border-[#d4e8dc] text-right">{Number(s.laboratory_hour ?? 0).toFixed(2)}</div>
                        <div className="col-span-1 px-1 py-1 border-r border-[#d4e8dc] flex items-center justify-center">
                          <Checkbox checked={!!cm?.general_education} onCheckedChange={() => {}} />
                        </div>
                        <div className="col-span-2 px-1 py-1 text-right">{cm?.default_min_class_limit ?? 15}</div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between border-t border-[#79b898] bg-[#f8fdf9] px-2 py-1 text-[12px]">
                  <div className="flex gap-4">
                    <span>TOTAL SUBJECTS COUNT: {blockSubjects.length}</span>
                    <span>TOTAL UNITS: {totalUnits.toFixed(1)}</span>
                    <span>TOTAL LECTURE HRS: {totalLecture.toFixed(1)}</span>
                    <span>TOTAL LAB UNITS: {totalLabUnits.toFixed(1)}</span>
                  </div>
                  <div className="flex gap-1">
                    <Button className="h-7 text-[11px]" onClick={handleSaveBlockSection}>Save</Button>
                    <Button className="h-7 text-[11px]" variant="outline" onClick={() => setHelpOpen(true)}>Help</Button>
                    <Button className="h-7 text-[11px]" variant="destructive" onClick={handleCancelBlockSection}>Cancel</Button>
                  </div>
                </div>
              </div>

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
            <div className="h-full border border-[#79b898] bg-[#dbeff5] p-1">
              <div className="border border-[#79b898] bg-white">
                <div className="bg-gradient-to-b from-[#6ec79b] to-[#2f9b68] px-2 py-1 text-white">
                  <div className="text-[30px] leading-none font-semibold">CREATE FREE SECTION</div>
                  <div className="text-[11px] opacity-95">
                    Use this module to add subject(s) as part of the Free Section/Special Classes.
                  </div>
                </div>

                <div className="grid grid-cols-12 gap-1 p-1">
                  <div className="col-span-12 lg:col-span-10 space-y-1">
                    <div className="grid grid-cols-12 gap-2 text-[12px] items-center">
                      <div className="col-span-7 font-semibold text-[#1f5e45]">
                        Selected Program: {freeSelectedProgram ? freeSelectedProgram.program_name : "Please select using dropdowns"}
                      </div>
                      <div className="col-span-5 flex items-center gap-2">
                        <span className="whitespace-nowrap font-semibold text-[#1f5e45]">Free Section Name:</span>
                        <Input
                          className="h-7 text-[12px]"
                          placeholder="e.g. Section 1"
                          value={freeSectionName}
                          onChange={(e) => setFreeSectionName(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-12 gap-2 text-[12px]">
                      <div className="col-span-3">
                        <Select value={freeInstitutionId} onValueChange={setFreeInstitutionId}>
                          <SelectTrigger className="h-7 text-[12px]">
                            <SelectValue placeholder="Institution" />
                          </SelectTrigger>
                          <SelectContent>
                            {institutions.map((inst) => (
                              <SelectItem key={inst.id} value={String(inst.id)}>
                                {inst.official_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-3">
                        <Select value={freeCampusId} onValueChange={setFreeCampusId}>
                          <SelectTrigger className="h-7 text-[12px]">
                            <SelectValue placeholder="University / Campus" />
                          </SelectTrigger>
                          <SelectContent>
                            {freeCampuses.map((campus) => (
                              <SelectItem key={campus.id} value={String(campus.id)}>
                                {campus.acronym} {campus.campus_name ? `- ${campus.campus_name}` : ""}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-3">
                        <Select value={freeCollegeId} onValueChange={setFreeCollegeId}>
                          <SelectTrigger className="h-7 text-[12px]">
                            <SelectValue placeholder="College" />
                          </SelectTrigger>
                          <SelectContent>
                            {freeColleges.map((college) => (
                              <SelectItem key={college.id} value={String(college.id)}>
                                {college.college_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-3">
                        <Select value={freeProgramId} onValueChange={setFreeProgramId}>
                          <SelectTrigger className="h-7 text-[12px]">
                            <SelectValue placeholder="Program" />
                          </SelectTrigger>
                          <SelectContent>
                            {freePrograms.map((program) => (
                              <SelectItem key={program.id} value={String(program.id)}>
                                {program.program_code} - {program.program_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-[12px]">
                      <span className="font-semibold text-[#1f5e45]">Input a Subject Code / Title to Search :</span>
                      <Input
                        className="h-7 text-[12px] flex-1"
                        value={freeSearchText}
                        onChange={(e) => setFreeSearchText(e.target.value)}
                      />
                    </div>

                    <div className="border border-[#9ed9c1]">
                      <div className="grid grid-cols-12 bg-[#f8fdf9] text-[11px] font-semibold text-[#1f5e45] border-b border-[#d4e8dc]">
                        <div className="col-span-1 px-1 py-1 border-r border-[#d4e8dc] text-center">SID#</div>
                        <div className="col-span-2 px-1 py-1 border-r border-[#d4e8dc]">Subject Code</div>
                        <div className="col-span-4 px-1 py-1 border-r border-[#d4e8dc]">Subject Title</div>
                        <div className="col-span-1 px-1 py-1 border-r border-[#d4e8dc] text-center">Units</div>
                        <div className="col-span-1 px-1 py-1 border-r border-[#d4e8dc] text-center">Lab.Units</div>
                        <div className="col-span-1 px-1 py-1 border-r border-[#d4e8dc] text-center">Lect.Hrs</div>
                        <div className="col-span-1 px-1 py-1 border-r border-[#d4e8dc] text-center">Lab.Hrs</div>
                        <div className="col-span-1 px-1 py-1 text-center">Limit</div>
                      </div>
                      <div
                        className="h-[420px] overflow-auto text-[12px]"
                        onScroll={(e) => setFreeGridScrollTop(e.currentTarget.scrollTop)}
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
                              "w-full grid grid-cols-12 border-b border-[#d4e8dc] text-left hover:bg-[#f3fbf6] cursor-pointer",
                              freeSelectedSet.has(row.course_code) && "bg-[#d9f3e5]"
                            )}
                            style={{ height: `${FREE_SECTION_ROW_HEIGHT}px` }}
                          >
                            <div
                              className="col-span-1 px-1 py-1 border-r border-[#d4e8dc] flex items-center justify-center"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Checkbox
                                checked={freeSelectedSet.has(row.course_code)}
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
                            <div className="col-span-2 px-1 py-1 border-r border-[#d4e8dc]">{row.course_code}</div>
                            <div className="col-span-4 px-1 py-1 border-r border-[#d4e8dc] truncate">{row.course_title || "-"}</div>
                            <div className="col-span-1 px-1 py-1 border-r border-[#d4e8dc] text-right">{Number(row.credited_units ?? 0).toFixed(2)}</div>
                            <div className="col-span-1 px-1 py-1 border-r border-[#d4e8dc] text-right">{Number(row.laboratory_units ?? 0).toFixed(2)}</div>
                            <div className="col-span-1 px-1 py-1 border-r border-[#d4e8dc] text-right">{Number(row.lecture_hours ?? 0).toFixed(2)}</div>
                            <div className="col-span-1 px-1 py-1 border-r border-[#d4e8dc] text-right">{Number(row.laboratory_hours ?? 0).toFixed(2)}</div>
                            <div className="col-span-1 px-1 py-1 text-right">{row.default_min_class_limit ?? 40}</div>
                          </div>
                        ))}
                        <div style={{ height: freeGridBottomSpacer }} />
                      </div>
                    </div>
                  </div>

                  <div className="col-span-12 lg:col-span-2 space-y-1">
                    <Button className="w-full h-8 text-[12px]" onClick={handleFreeSearch} disabled={!freeSelectedProgram}>
                      Search
                    </Button>
                    <Button className="w-full h-8 text-[12px]" variant="outline" onClick={() => void handleFreeRefresh()} disabled={!freeSelectedProgram}>
                      Refresh
                    </Button>
                    <Button className="w-full h-8 text-[12px]" variant="outline" onClick={() => setFreeHelpOpen(true)} disabled={!freeSelectedProgram}>
                      Help
                    </Button>
                    <div className="h-40" />
                    <Button className="w-full h-8 text-[12px]" onClick={handleFreeSave} disabled={!freeSelectedProgram}>
                      Save
                    </Button>
                    <Button className="w-full h-8 text-[12px]" variant="destructive" onClick={handleFreeCancel} disabled={!freeSelectedProgram}>
                      Cancel
                    </Button>
                  </div>
                </div>

                <div className="border-t border-[#79b898] px-2 py-1 text-[12px] text-[#1f5e45]">
                  To select subject(s), put a checkmark on the left-most edge of the subject row.
                </div>
              </div>

              <AlertDialog open={freeHelpOpen} onOpenChange={setFreeHelpOpen}>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Create Free Section Help</AlertDialogTitle>
                    <AlertDialogDescription>
                      1) Select a program from the left tree and enter a Free Section name.
                      {"\n"}2) Search by subject code/title, then select subjects using the left checkbox.
                      {"\n"}3) Click Save to create the free section under that program.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Close</AlertDialogCancel>
                    <AlertDialogAction onClick={() => setFreeHelpOpen(false)}>Got it</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          ) : (
            <div className="h-full border border-[#79b898] bg-white">
              <div className="bg-[#f8fdf9] border-b border-[#9ed9c1] px-2 py-1 text-[12px] font-bold text-[#1f5e45] uppercase">
                {activeLabel}
              </div>
              <div className="p-3 text-[12px] text-[#35684f]">
                This tab is ready for the full workflow UI. Tell me which tab to implement next and I will build it.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
