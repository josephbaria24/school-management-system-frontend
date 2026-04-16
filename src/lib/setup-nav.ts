export type SetupNavItem = {
  label: string;
  slug: string;
};

export type SetupNavGroup = {
  items: SetupNavItem[];
};

/** Mirrors the legacy “Setup Manager” menu: groups are separated in the sidebar. */
export const setupNavGroups: SetupNavGroup[] = [
  {
    items: [
      { label: "Academic Institution", slug: "academic-institution" },
      { label: "Academic Year and Terms", slug: "academic-year-terms" },
      { label: "School Calendar", slug: "school-calendar" },
    ],
  },
  {
    items: [
      { label: "Colleges/Departments/Institutes", slug: "colleges-departments-institutes" },
    ],
  },
  {
    items: [{ label: "Scholarship Providers", slug: "scholarship-providers" }],
  },
  {
    items: [
      { label: "Employees And Faculty Info.", slug: "employees-faculty-info" },
      { label: "Faculty Information", slug: "faculty-information" },
      { label: "Departments", slug: "departments" },
    ],
  },
  {
    items: [{ label: "Buildings and Rooms", slug: "buildings-rooms" }],
  },
  {
    items: [
      { label: "Nationalities", slug: "nationalities" },
      { label: "Religions", slug: "religions" },
    ],
  },
  {
    items: [{ label: "Other Schools...", slug: "other-schools" }],
  },
  {
    items: [{ label: "User Rights...", slug: "user-rights" }],
  },
];

export function getSetupLabelForSlug(slug: string): string | undefined {
  for (const group of setupNavGroups) {
    const found = group.items.find((i) => i.slug === slug);
    if (found) return found.label;
  }
  return undefined;
}
