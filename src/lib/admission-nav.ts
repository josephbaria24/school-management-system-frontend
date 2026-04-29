export type AdmissionNavItem = {
  label: string;
  slug: string;
};

export const admissionNavItems: AdmissionNavItem[] = [
  { label: "Applicant's Profile", slug: "applications/applicant-profile" },
  { label: "List of Applications", slug: "applications/list-of-applications" },
  {
    label: "College Entrance Test Result Ranking",
    slug: "applications/college-entrance-test-result-ranking",
  },
  { label: "Admission Test Scores", slug: "admission-test-scores" },
  { label: "Testing Schedules", slug: "testing-schedules" },
  { label: "List of Examinees for Testing", slug: "list-of-examinees-for-testing" },
  { label: "List of Examinees for Medical", slug: "list-of-examinees-for-medical" },
  { label: "Admission Statistics", slug: "admission-statistics" },
  { label: "Admission Test Results", slug: "admission-test-results" },
  { label: "Admission Reports", slug: "admission-reports" },
  {
    label: "Configuration of Admission Limits",
    slug: "configuration-of-admission-limits",
  },
];

export function getAdmissionLabelForSlug(slug: string): string | undefined {
  const found = admissionNavItems.find((item) => item.slug === slug);
  return found?.label;
}

