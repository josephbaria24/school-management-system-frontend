import { notFound } from "next/navigation";
import { getRegistrarLabelForSlug } from "@/lib/registrar-nav";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StudentsProfileModule } from "@/components/registrar/StudentsProfileModule";
import { StudentMasterListModule } from "@/components/registrar/StudentMasterListModule";
import { SubjectFormationsMaintenanceModule } from "@/components/registrar/SubjectFormationsMaintenanceModule";
import { CoursesMasterListModule } from "@/components/colleges/CoursesMasterListModule";
import { GradingSystemModule } from "@/components/registrar/GradingSystemModule";
import { ScholasticDelinquencyModule } from "@/components/registrar/ScholasticDelinquencyModule";
import { AddDropChangeCoursesWithdrawalModule } from "@/components/registrar/AddDropChangeCoursesWithdrawalModule";
import { GradeSheetInventoryModule } from "@/components/registrar/GradeSheetInventoryModule";
import { UnpostedGradesInventoryModule } from "@/components/registrar/UnpostedGradesInventoryModule";
import { CorrectionOfGradesModule } from "@/components/registrar/CorrectionOfGradesModule";
import { StudentsWithIncompleteGradeModule } from "@/components/registrar/StudentsWithIncompleteGradeModule";
import { RecalculateSummaryOfGradesModule } from "@/components/registrar/RecalculateSummaryOfGradesModule";
import { GradeEncodingModule } from "@/components/registrar/GradeEncodingModule";
import { ReportOfGradesModule } from "@/components/registrar/ReportOfGradesModule";
import { GradePointAverageRankingModule } from "@/components/registrar/GradePointAverageRankingModule";
import { WorksheetForConsolidatedGradesModule } from "@/components/registrar/WorksheetForConsolidatedGradesModule";
import { TagGraduatingStudentsModule } from "@/components/registrar/TagGraduatingStudentsModule";
import { GraduateCandidatesForGraduationModule } from "@/components/registrar/GraduateCandidatesForGraduationModule";
import { CertificationModule } from "@/components/registrar/CertificationModule";
import { ChedReportsModule } from "@/components/registrar/ChedReportsModule";
import { ListOfReportsModule } from "@/components/registrar/ListOfReportsModule";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function RegistrarPage({ params }: Props) {
  const { slug } = await params;
  const title = getRegistrarLabelForSlug(slug);
  if (!title) notFound();
  if (slug === "students-profile") {
    return <StudentsProfileModule />;
  }
  if (slug === "student-master-list") {
    return <StudentMasterListModule />;
  }
  if (slug === "courses-master-list") {
    return <CoursesMasterListModule />;
  }
  if (slug === "subject-formations-maintenance-gs-hs") {
    return <SubjectFormationsMaintenanceModule />;
  }
  if (slug === "grading-system") {
    return <GradingSystemModule />;
  }
  if (slug === "scholastic-deliquency") {
    return <ScholasticDelinquencyModule />;
  }
  if (slug === "add-drop-change-of-courses-withdrawal") {
    return <AddDropChangeCoursesWithdrawalModule />;
  }
  if (slug === "inventory-of-grade-sheets") {
    return <GradeSheetInventoryModule />;
  }
  if (slug === "inventory-of-unposted-grades") {
    return <UnpostedGradesInventoryModule />;
  }
  if (slug === "correction-of-grades") {
    return <CorrectionOfGradesModule />;
  }
  if (slug === "students-with-incomplete-grade") {
    return <StudentsWithIncompleteGradeModule />;
  }
  if (slug === "recalculate-summary-of-grades") {
    return <RecalculateSummaryOfGradesModule />;
  }
  if (slug === "grade-encoding") {
    return <GradeEncodingModule />;
  }
  if (slug === "report-of-grades") {
    return <ReportOfGradesModule />;
  }
  if (slug === "grade-point-average-ranking") {
    return <GradePointAverageRankingModule />;
  }
  if (slug === "worksheet-for-consolidated-grades") {
    return <WorksheetForConsolidatedGradesModule />;
  }
  if (slug === "tag-graduating-students") {
    return <TagGraduatingStudentsModule />;
  }
  if (slug === "graduate-candidates-for-graduation") {
    return <GraduateCandidatesForGraduationModule />;
  }
  if (slug === "certification") {
    return <CertificationModule />;
  }
  if (slug === "ched-reports") {
    return <ChedReportsModule />;
  }
  if (slug === "list-of-reports") {
    return <ListOfReportsModule />;
  }

  return (
    <div className="h-full bg-[#f6f7fb] p-1">
      <div className="w-full border border-[#c8cedb] bg-white">
        <div className="bg-gradient-to-b from-[#eef1f8] to-[#dbe3f6] border-b border-[#c8cedb] px-2 py-1">
          <h1 className="text-[24px] leading-none tracking-tight text-[#4a566f] font-semibold uppercase">
            {title}
          </h1>
          <p className="text-[11px] text-[#5f6d88] mt-0.5">Registrar module workspace.</p>
        </div>
        <div className="p-2">
          <Card className="border border-[#dde3ef]">
            <CardHeader className="pb-2 px-3 pt-3">
              <CardTitle className="text-sm font-semibold">{title}</CardTitle>
              <CardDescription className="text-xs">
                This page is ready for full registrar workflow implementation.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-3 pb-3">
              <p className="text-xs text-muted-foreground">
                Add toolbar, form section, and records grid here when ready.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

