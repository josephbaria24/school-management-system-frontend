import { notFound } from "next/navigation";
import { getCollegesLabelForSlug } from "@/lib/colleges-nav";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ProgramCurriculumsModule } from "@/components/colleges/ProgramCurriculumsModule";
import { ProgramCurriculumBulkTaggingModule } from "@/components/colleges/ProgramCurriculumBulkTaggingModule";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function CollegesPage({ params }: Props) {
  const { slug } = await params;
  const title = getCollegesLabelForSlug(slug);
  if (!title) notFound();
  if (slug === "program-curriculums") {
    return <ProgramCurriculumsModule />;
  }
  if (slug === "program-curriculum-bulk-tagging") {
    return <ProgramCurriculumBulkTaggingModule />;
  }

  return (
    <div className="h-full bg-[#f2fbf7] p-1">
      <div className="w-full border border-[#79b898] bg-white">
        <div className="bg-gradient-to-b from-[#def8ea] to-[#9fdbbc] border-b border-[#79b898] px-2 py-1">
          <h1 className="text-[24px] leading-none tracking-tight text-[#1f5e45] font-semibold uppercase">
            {title}
          </h1>
          <p className="text-[11px] text-[#35684f] mt-0.5">
            Colleges module workspace.
          </p>
        </div>
        <div className="p-2">
          <Card className="border border-[#9ed9c1]">
            <CardHeader className="pb-2 px-3 pt-3">
              <CardTitle className="text-sm font-semibold">{title}</CardTitle>
              <CardDescription className="text-xs">
                This page is ready for the full colleges module layout and workflow.
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

