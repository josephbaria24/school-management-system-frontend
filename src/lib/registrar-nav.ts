export type RegistrarNavItem = {
  label: string;
  slug: string;
};

export type RegistrarNavGroup = {
  items: RegistrarNavItem[];
};

/** Mirrors the legacy “Registrar” submenu. */
export const registrarNavGroups: RegistrarNavGroup[] = [
  {
    items: [
      { label: "Student's Profile", slug: "students-profile" },
      { label: "Student Master List", slug: "student-master-list" },
      { label: "Upload Students Picture", slug: "upload-students-picture" },
      { label: "Courses Master List", slug: "courses-master-list" },
      { label: "Subject Formations Maintenance (GS/HS)", slug: "subject-formations-maintenance-gs-hs" },
      { label: "Grading System", slug: "grading-system" },
      { label: "Scholastic Deliquency", slug: "scholastic-deliquency" },
      { label: "Add/Drop/Change of Courses / Withdrawal", slug: "add-drop-change-of-courses-withdrawal" },
      { label: "Inventory of Grade Sheets", slug: "inventory-of-grade-sheets" },
      { label: "Inventory of Unposted Grades", slug: "inventory-of-unposted-grades" },
      { label: "Correction of Grades", slug: "correction-of-grades" },
      { label: "Students with Incomplete Grade", slug: "students-with-incomplete-grade" },
      { label: "Recalculate Summary of Grades", slug: "recalculate-summary-of-grades" },
      { label: "Grade Encoding", slug: "grade-encoding" },
      { label: "Report of Grades", slug: "report-of-grades" },
      { label: "Grade Point Average Ranking...", slug: "grade-point-average-ranking" },
      { label: "Worksheet for Consolidated Grades", slug: "worksheet-for-consolidated-grades" },
      { label: "Tag Graduating Students", slug: "tag-graduating-students" },
      { label: "Graduate/Candidates for Graduation", slug: "graduate-candidates-for-graduation" },
      { label: "Certification", slug: "certification" },
      { label: "Diploma Easy...", slug: "diploma-easy" },
      { label: "CHED Reports", slug: "ched-reports" },
      { label: "List of Reports...", slug: "list-of-reports" },
    ],
  },
];

export function getRegistrarLabelForSlug(slug: string): string | undefined {
  for (const group of registrarNavGroups) {
    const found = group.items.find((i) => i.slug === slug);
    if (found) return found.label;
  }
  return undefined;
}