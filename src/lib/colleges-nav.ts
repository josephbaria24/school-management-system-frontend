export type CollegesNavItem = {
  label: string;
  slug: string;
};

export type CollegesNavGroup = {
  items: CollegesNavItem[];
};

/** Mirrors the legacy “Colleges” submenu. */
export const collegesNavGroups: CollegesNavGroup[] = [
  {
    items: [
      { label: "Program Curriculums", slug: "program-curriculums" },
      { label: "Program Curriculum - Bulk Tagging", slug: "program-curriculum-bulk-tagging" },
      { label: "Class Sections", slug: "class-sections" },
      { label: "Class Sectioning (GS/HS)", slug: "class-sectioning-gs-hs" },
      { label: "Class Schedules/Room/Faculty", slug: "class-schedules-room-faculty" },
      { label: "Class Sections (Split/Merge)", slug: "class-sections-split-merge" },
      { label: "Class Schedules (Split/Merge)", slug: "class-schedules-split-merge" },
      { label: "Forecasting", slug: "forecasting" },
      { label: "List of Reports...", slug: "list-of-reports" },
    ],
  },
];

export function getCollegesLabelForSlug(slug: string): string | undefined {
  for (const group of collegesNavGroups) {
    const found = group.items.find((i) => i.slug === slug);
    if (found) return found.label;
  }
  return undefined;
}

