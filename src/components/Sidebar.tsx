"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useTheme } from "@/lib/theme";
import { setupNavGroups } from "@/lib/setup-nav";
import { collegesNavGroups } from "@/lib/colleges-nav";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  ClipboardList,
  BarChart3,
  Calendar,
  Settings,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Sun,
  Moon,
  School,
  Menu,
  X,
  Settings2,
  School2,
  CalendarClock,
  CalendarDays,
  Building2,
  BookCopy,
  GraduationCapIcon,
  HandCoins,
  UserCog,
  UserSquare2,
  Building,
  Flag,
  Church,
  Landmark,
  ShieldCheck,
  LibraryBig,
  BookMarked,
  GitBranch,
  CalendarRange,
  MapPinned,
  SplitSquareHorizontal,
  TrendingUp,
  FileText,
  UserPlus,
  FolderOpen,
  ClipboardCheck,
  CalendarCheck2,
  ListChecks,
  Stethoscope,
  ChartNoAxesCombined,
  ClipboardList as ClipboardListIcon,
  FileBarChart,
  SlidersHorizontal,
  ArrowLeftRight,
} from "lucide-react";

interface NavItem {
  label: string;
  icon: React.ElementType;
  href: string;
}

const navItems: NavItem[] = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/" },
  { label: "Students", icon: Users, href: "/students" },
  { label: "Teachers", icon: GraduationCap, href: "/teachers" },
  { label: "Classes", icon: BookOpen, href: "/classes" },
  { label: "Attendance", icon: ClipboardList, href: "/attendance" },
  { label: "Grades", icon: BarChart3, href: "/grades" },
  { label: "Schedule", icon: Calendar, href: "/schedule" },
  { label: "Settings", icon: Settings, href: "/settings" },
];

type AdmissionNavItem = {
  label: string;
  slug?: string;
  items?: Array<{ label: string; slug: string }>;
};

const admissionNavItems: AdmissionNavItem[] = [
  {
    label: "Applications",
    items: [
      { label: "Applicant's Profile...", slug: "applications/applicant-profile" },
      { label: "List of Applications...", slug: "applications/list-of-applications" },
      { label: "Admit New Student", slug: "applications/admit-new-student" },
      { label: "Deny an Applicant", slug: "applications/deny-an-applicant" },
      {
        label: "Cancel Admit/Deny of Applicant",
        slug: "applications/cancel-admit-deny-of-applicant",
      },
      {
        label: "College Entrance Test Result Ranking",
        slug: "applications/college-entrance-test-result-ranking",
      },
    ],
  },
  { label: "Admission Test Scores", slug: "admission-test-scores" },
  { label: "Testing Schedules", slug: "testing-schedules" },
  { label: "List of Examinees for Testing", slug: "list-of-examinees-for-testing" },
  { label: "List of Examinees for Medical", slug: "list-of-examinees-for-medical" },
  { label: "Admission Statistics...", slug: "admission-statistics" },
  { label: "Admission Test Results", slug: "admission-test-results" },
  { label: "Admission Reports", slug: "admission-reports" },
  { label: "Configuration of Admission Limits...", slug: "configuration-of-admission-limits" },
];

const admissionIconBySlug: Record<string, React.ElementType> = {
  "applications/applicant-profile": UserPlus,
  "applications/list-of-applications": FolderOpen,
  "applications/admit-new-student": UserPlus,
  "applications/deny-an-applicant": X,
  "applications/cancel-admit-deny-of-applicant": ArrowLeftRight,
  "applications/college-entrance-test-result-ranking": BarChart3,
  applications: FolderOpen,
  "admission-test-scores": ClipboardCheck,
  "testing-schedules": CalendarCheck2,
  "list-of-examinees-for-testing": ListChecks,
  "list-of-examinees-for-medical": Stethoscope,
  "admission-statistics": ChartNoAxesCombined,
  "admission-test-results": ClipboardListIcon,
  "admission-reports": FileBarChart,
  "configuration-of-admission-limits": SlidersHorizontal,
};

const setupIconBySlug: Record<string, React.ElementType> = {
  "academic-institution": School2,
  "academic-year-terms": CalendarClock,
  "school-calendar": CalendarDays,
  "colleges-departments-institutes": Building2,
  "academic-programs": BookCopy,
  "major-study": GraduationCapIcon,
  "scholarship-providers": HandCoins,
  "employees-faculty-info": UserCog,
  "faculty-information": UserSquare2,
  "departments": Building,
  "buildings-rooms": Building2,
  "nationalities": Flag,
  "religions": Church,
  "other-schools": Landmark,
  "user-rights": ShieldCheck,
};

const collegesIconBySlug: Record<string, React.ElementType> = {
  "program-curriculums": LibraryBig,
  "program-curriculum-bulk-tagging": BookMarked,
  "class-sections": BookCopy,
  "class-sectioning-gs-hs": GraduationCapIcon,
  "class-schedules-room-faculty": CalendarRange,
  "class-sections-split-merge": SplitSquareHorizontal,
  "class-schedules-split-merge": GitBranch,
  forecasting: TrendingUp,
  "list-of-reports": FileText,
};

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [admissionOpen, setAdmissionOpen] = useState(false);
  const [admissionApplicationsOpen, setAdmissionApplicationsOpen] = useState(false);
  const [setupOpen, setSetupOpen] = useState(false);
  const [collegesOpen, setCollegesOpen] = useState(false);
  const navScrollRef = useRef<HTMLElement | null>(null);
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();

  const persistSidebarScroll = () => {
    const navEl = navScrollRef.current;
    if (!navEl) return;
    sessionStorage.setItem("sidebar:scrollTop", String(navEl.scrollTop));
  };

  const handleNavItemClick = () => {
    persistSidebarScroll();
    setMobileOpen(false);
  };

  useEffect(() => {
    const readBool = (key: string) => localStorage.getItem(key) === "1";
    setCollapsed(readBool("sidebar:collapsed"));
    setAdmissionOpen(readBool("sidebar:admissionOpen"));
    setAdmissionApplicationsOpen(readBool("sidebar:admissionApplicationsOpen"));
    setSetupOpen(readBool("sidebar:setupOpen"));
    setCollegesOpen(readBool("sidebar:collegesOpen"));
  }, []);

  useEffect(() => {
    localStorage.setItem("sidebar:collapsed", collapsed ? "1" : "0");
  }, [collapsed]);

  useEffect(() => {
    localStorage.setItem("sidebar:admissionOpen", admissionOpen ? "1" : "0");
  }, [admissionOpen]);

  useEffect(() => {
    localStorage.setItem(
      "sidebar:admissionApplicationsOpen",
      admissionApplicationsOpen ? "1" : "0"
    );
  }, [admissionApplicationsOpen]);

  useEffect(() => {
    localStorage.setItem("sidebar:setupOpen", setupOpen ? "1" : "0");
  }, [setupOpen]);

  useEffect(() => {
    localStorage.setItem("sidebar:collegesOpen", collegesOpen ? "1" : "0");
  }, [collegesOpen]);

  useEffect(() => {
    if (pathname.startsWith("/admission/")) setAdmissionOpen(true);
    if (pathname.startsWith("/admission/applications/")) setAdmissionApplicationsOpen(true);
    if (pathname.startsWith("/setup/")) setSetupOpen(true);
    if (pathname.startsWith("/colleges/")) setCollegesOpen(true);
  }, [pathname]);

  useLayoutEffect(() => {
    const navEl = navScrollRef.current;
    if (!navEl) return;
    const saved = sessionStorage.getItem("sidebar:scrollTop");
    if (saved === null) return;
    const parsed = Number(saved);
    if (!Number.isFinite(parsed)) return;
    requestAnimationFrame(() => {
      navEl.scrollTop = parsed;
    });
    const timeoutId = window.setTimeout(() => {
      navEl.scrollTop = parsed;
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [pathname]);

  useEffect(() => {
    const navEl = navScrollRef.current;
    if (!navEl) return;
    const handleScroll = () => {
      sessionStorage.setItem("sidebar:scrollTop", String(navEl.scrollTop));
    };
    navEl.addEventListener("scroll", handleScroll, { passive: true });
    return () => navEl.removeEventListener("scroll", handleScroll);
  }, [pathname]);

  const NavLink = ({ item }: { item: NavItem }) => {
    const isActive = pathname === item.href;
    const Icon = item.icon;

    const linkContent = (
      <Link
        href={item.href}
        scroll={false}
        onClick={handleNavItemClick}
        className={cn(
          "w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
          "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
          isActive
            ? "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
            : "text-sidebar-foreground"
        )}
      >
        <Icon className="h-4 w-4 shrink-0" />
        {!collapsed && <span className="truncate">{item.label}</span>}
      </Link>
    );

    if (collapsed) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
          <TooltipContent side="right">{item.label}</TooltipContent>
        </Tooltip>
      );
    }

    return linkContent;
  };

  const SidebarContent = ({ mobile = false }: { mobile?: boolean }) => (
    <div
      className={cn(
        "flex flex-col h-full bg-sidebar border-r border-sidebar-border",
        !mobile && (collapsed ? "w-14" : "w-56"),
        "transition-all duration-200"
      )}
    >
      <div
        className={cn(
          "flex items-center border-b border-sidebar-border h-14",
          collapsed ? "px-3 justify-center" : "px-4 gap-2"
        )}
      >
        <div className="flex items-center justify-center w-7 h-7 bg-primary rounded-md shrink-0">
          <School className="h-4 w-4 text-primary-foreground" />
        </div>
        {!collapsed && (
          <span className="font-semibold text-sidebar-foreground text-sm truncate">
            SphereX
          </span>
        )}
        {!collapsed && !mobile && (
          <Button
            variant="ghost"
            size="icon"
            className="ml-auto h-7 w-7 text-muted-foreground hover:text-foreground"
            onClick={() => setCollapsed(true)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        )}
        {mobile && (
          <Button
            variant="ghost"
            size="icon"
            className="ml-auto h-7 w-7"
            onClick={() => setMobileOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <nav
        ref={navScrollRef}
        className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5"
      >
        {navItems.map((item) => (
          <NavLink key={item.href} item={item} />
        ))}

        {collapsed ? (
          <>
          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full h-9 px-3 justify-start gap-3 rounded-md text-sm font-medium",
                      pathname.startsWith("/admission/")
                        ? "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
                        : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    )}
                  >
                    <UserPlus className="h-4 w-4 shrink-0" />
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent side="right">Admission</TooltipContent>
            </Tooltip>
            <DropdownMenuContent side="right" align="start" className="w-64 max-h-[min(70vh,28rem)] overflow-y-auto">
              <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground">
                Admission
              </DropdownMenuLabel>
              {admissionNavItems.map((item) => {
                if (item.items?.length) {
                  return (
                    <div key={item.label}>
                      <DropdownMenuSeparator />
                      <DropdownMenuLabel className="text-[10px] uppercase text-muted-foreground">
                        {item.label}
                      </DropdownMenuLabel>
                      {item.items.map((sub) => (
                        <DropdownMenuItem key={sub.slug} asChild>
                          <Link
                            href={`/admission/${sub.slug}`}
                            scroll={false}
                            onClick={handleNavItemClick}
                            className="cursor-pointer flex items-center gap-2"
                          >
                            {(() => {
                              const Icon = admissionIconBySlug[sub.slug] ?? FolderOpen;
                              return <Icon className="h-3.5 w-3.5 text-muted-foreground" />;
                            })()}
                            {sub.label}
                          </Link>
                        </DropdownMenuItem>
                      ))}
                    </div>
                  );
                }
                if (!item.slug) return null;
                return (
                  <DropdownMenuItem key={item.slug} asChild>
                    <Link
                      href={`/admission/${item.slug}`}
                      scroll={false}
                      onClick={handleNavItemClick}
                      className="cursor-pointer flex items-center gap-2"
                    >
                      {(() => {
                        const Icon = admissionIconBySlug[item.slug!] ?? UserPlus;
                        return <Icon className="h-3.5 w-3.5 text-muted-foreground" />;
                      })()}
                      {item.label}
                    </Link>
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full h-9 px-3 justify-start gap-3 rounded-md text-sm font-medium",
                      pathname.startsWith("/setup/")
                        ? "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
                        : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    )}
                  >
                    <Settings2 className="h-4 w-4 shrink-0" />
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent side="right">Setup Manager</TooltipContent>
            </Tooltip>
            <DropdownMenuContent side="right" align="start" className="w-64 max-h-[min(70vh,28rem)] overflow-y-auto">
              <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground">
                Setup Manager
              </DropdownMenuLabel>
              {setupNavGroups.map((group, gi) => (
                <div key={gi}>
                  {gi > 0 && <DropdownMenuSeparator />}
                  {group.items.map((item) => (
                    <DropdownMenuItem key={item.slug} asChild>
                      <Link
                        href={`/setup/${item.slug}`}
                        scroll={false}
                        onClick={handleNavItemClick}
                        className="cursor-pointer flex items-center gap-2"
                      >
                        {(() => {
                          const Icon = setupIconBySlug[item.slug] ?? Settings2;
                          return <Icon className="h-3.5 w-3.5 text-muted-foreground" />;
                        })()}
                        {item.label}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </div>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full h-9 px-3 justify-start gap-3 rounded-md text-sm font-medium",
                      pathname.startsWith("/colleges/")
                        ? "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
                        : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    )}
                  >
                    <LibraryBig className="h-4 w-4 shrink-0" />
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent side="right">Colleges</TooltipContent>
            </Tooltip>
            <DropdownMenuContent side="right" align="start" className="w-64 max-h-[min(70vh,28rem)] overflow-y-auto">
              <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground">
                Colleges
              </DropdownMenuLabel>
              {collegesNavGroups.map((group, gi) => (
                <div key={gi}>
                  {gi > 0 && <DropdownMenuSeparator />}
                  {group.items.map((item) => (
                    <DropdownMenuItem key={item.slug} asChild>
                      <Link
                        href={`/colleges/${item.slug}`}
                        scroll={false}
                        onClick={handleNavItemClick}
                        className="cursor-pointer flex items-center gap-2"
                      >
                        {(() => {
                          const Icon = collegesIconBySlug[item.slug] ?? LibraryBig;
                          return <Icon className="h-3.5 w-3.5 text-muted-foreground" />;
                        })()}
                        {item.label}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </div>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          </>
        ) : (
          <>
          <Collapsible open={admissionOpen} onOpenChange={setAdmissionOpen}>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className={cn(
                  "w-full h-9 px-3 justify-start gap-3 rounded-md text-sm font-medium",
                  pathname.startsWith("/admission/")
                    ? "bg-primary/15 text-sidebar-foreground hover:bg-primary/20"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <UserPlus className="h-4 w-4 shrink-0" />
                <span className="truncate flex-1 text-left">Admission</span>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 shrink-0 opacity-60 transition-transform",
                    admissionOpen && "rotate-180"
                  )}
                />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-0 pt-0.5 pb-1">
              {admissionNavItems.map((item) => {
                if (item.items?.length) {
                  return (
                    <Collapsible
                      key={item.label}
                      open={admissionApplicationsOpen}
                      onOpenChange={setAdmissionApplicationsOpen}
                    >
                      <CollapsibleTrigger asChild>
                        <Button
                          variant="ghost"
                          className={cn(
                            "w-full h-8 pl-7 pr-3 justify-start gap-2 rounded-md text-xs font-medium",
                            pathname.startsWith("/admission/applications/")
                              ? "bg-primary/15 text-sidebar-foreground hover:bg-primary/20"
                              : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                          )}
                        >
                          <FolderOpen className="h-3.5 w-3.5 shrink-0 opacity-90" />
                          <span className="truncate flex-1 text-left">{item.label}</span>
                          <ChevronDown
                            className={cn(
                              "h-3.5 w-3.5 shrink-0 opacity-60 transition-transform",
                              admissionApplicationsOpen && "rotate-180"
                            )}
                          />
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="space-y-0.5 pt-0.5">
                        {item.items.map((sub) => {
                          const href = `/admission/${sub.slug}`;
                          const active = pathname === href;
                          const Icon = admissionIconBySlug[sub.slug] ?? FolderOpen;
                          return (
                            <Link
                              key={sub.slug}
                              href={href}
                              scroll={false}
                              onClick={handleNavItemClick}
                              className={cn(
                                "flex items-center gap-2 pl-11 pr-3 py-1.5 rounded-md text-[11px] font-medium transition-colors",
                                "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                                active
                                  ? "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
                                  : "text-muted-foreground"
                              )}
                            >
                              <Icon className="h-3.5 w-3.5 shrink-0 opacity-90" />
                              <span className="truncate">{sub.label}</span>
                            </Link>
                          );
                        })}
                      </CollapsibleContent>
                    </Collapsible>
                  );
                }
                if (!item.slug) return null;
                const href = `/admission/${item.slug}`;
                const active = pathname === href;
                const Icon = admissionIconBySlug[item.slug] ?? UserPlus;
                return (
                  <Link
                    key={item.slug}
                    href={href}
                    scroll={false}
                    onClick={handleNavItemClick}
                    className={cn(
                      "flex items-center gap-2 pl-7 pr-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                      "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                      active
                        ? "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
                        : "text-muted-foreground"
                    )}
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0 opacity-90" />
                    <span className="truncate">{item.label}</span>
                  </Link>
                );
              })}
            </CollapsibleContent>
          </Collapsible>
          <Collapsible open={setupOpen} onOpenChange={setSetupOpen}>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className={cn(
                  "w-full h-9 px-3 justify-start gap-3 rounded-md text-sm font-medium",
                  pathname.startsWith("/setup/")
                    ? "bg-primary/15 text-sidebar-foreground hover:bg-primary/20"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <Settings2 className="h-4 w-4 shrink-0" />
                <span className="truncate flex-1 text-left">Setup Manager</span>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 shrink-0 opacity-60 transition-transform",
                    setupOpen && "rotate-180"
                  )}
                />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-0 pt-0.5 pb-1">
              {setupNavGroups.map((group, gi) => (
                <div key={gi} className="space-y-0.5">
                  {gi > 0 && (
                    <div className="my-1.5 mx-3 border-t border-sidebar-border" role="separator" />
                  )}
                  {group.items.map((item) => {
                    const href = `/setup/${item.slug}`;
                    const active = pathname === href;
                    const Icon = setupIconBySlug[item.slug] ?? Settings2;
                    return (
                      <Link
                        key={item.slug}
                        href={href}
                        scroll={false}
                        onClick={handleNavItemClick}
                        className={cn(
                          "flex items-center gap-2 pl-7 pr-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                          "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                          active
                            ? "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
                            : "text-muted-foreground"
                        )}
                      >
                        <Icon className="h-3.5 w-3.5 shrink-0 opacity-90" />
                        <span className="truncate">{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              ))}
            </CollapsibleContent>
          </Collapsible>
          <Collapsible open={collegesOpen} onOpenChange={setCollegesOpen}>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className={cn(
                  "w-full h-9 px-3 justify-start gap-3 rounded-md text-sm font-medium",
                  pathname.startsWith("/colleges/")
                    ? "bg-primary/15 text-sidebar-foreground hover:bg-primary/20"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <LibraryBig className="h-4 w-4 shrink-0" />
                <span className="truncate flex-1 text-left">Colleges</span>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 shrink-0 opacity-60 transition-transform",
                    collegesOpen && "rotate-180"
                  )}
                />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-0 pt-0.5 pb-1">
              {collegesNavGroups.map((group, gi) => (
                <div key={gi} className="space-y-0.5">
                  {gi > 0 && (
                    <div className="my-1.5 mx-3 border-t border-sidebar-border" role="separator" />
                  )}
                  {group.items.map((item) => {
                    const href = `/colleges/${item.slug}`;
                    const active = pathname === href;
                    const Icon = collegesIconBySlug[item.slug] ?? LibraryBig;
                    return (
                      <Link
                        key={item.slug}
                        href={href}
                        scroll={false}
                        onClick={handleNavItemClick}
                        className={cn(
                          "flex items-center gap-2 pl-7 pr-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                          "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                          active
                            ? "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
                            : "text-muted-foreground"
                        )}
                      >
                        <Icon className="h-3.5 w-3.5 shrink-0 opacity-90" />
                        <span className="truncate">{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              ))}
            </CollapsibleContent>
          </Collapsible>
          </>
        )}
      </nav>

      <div
        className={cn(
          "border-t border-sidebar-border p-2 flex",
          collapsed ? "flex-col gap-1" : "items-center gap-2"
        )}
      >
        {collapsed ? (
          <>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-8 h-8 text-muted-foreground"
                  onClick={toggleTheme}
                >
                  {theme === "dark" ? (
                    <Sun className="h-4 w-4" />
                  ) : (
                    <Moon className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Toggle theme</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-8 h-8 text-muted-foreground"
                  onClick={() => setCollapsed(false)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Expand sidebar</TooltipContent>
            </Tooltip>
          </>
        ) : (
          <>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-sidebar-foreground truncate">
                Admin User
              </p>
              <p className="text-xs text-muted-foreground truncate">
                admin@school.edu
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground shrink-0"
              onClick={toggleTheme}
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>
          </>
        )}
      </div>
    </div>
  );

  return (
    <>
      <div className="hidden md:flex h-screen sticky top-0">
        <SidebarContent />
      </div>

      <div className="md:hidden fixed top-0 left-0 z-50 p-3">
        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9 bg-background"
          onClick={() => setMobileOpen(true)}
        >
          <Menu className="h-4 w-4" />
        </Button>
      </div>

      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative w-56 h-full">
            <SidebarContent mobile />
          </div>
        </div>
      )}
    </>
  );
}
