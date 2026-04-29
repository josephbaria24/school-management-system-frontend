import { notFound } from "next/navigation";
import { getAdmissionLabelForSlug } from "@/lib/admission-nav";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ApplicantProfileModule } from "@/components/admission/ApplicantProfileModule";
import { ListOfApplicationsModule } from "@/components/admission/ListOfApplicationsModule";

type Props = {
  params: Promise<{ slug: string[] }>;
};

export default async function AdmissionPage({ params }: Props) {
  const { slug } = await params;
  const slugPath = slug.join("/");
  const title = getAdmissionLabelForSlug(slugPath);
  if (!title) notFound();

  if (slugPath === "applications/applicant-profile") {
    return <ApplicantProfileModule />;
  }
  if (slugPath === "applications/list-of-applications") {
    return <ListOfApplicationsModule />;
  }

  return (
    <div className="h-full bg-[#edf4ff] p-1">
      <div className="w-full border border-[#5a8fce] bg-white">
        <div className="bg-gradient-to-b from-[#dbe9ff] to-[#91bceb] border-b border-[#5a8fce] px-2 py-1">
          <h1 className="text-[24px] leading-none tracking-tight text-[#556b7d] font-semibold uppercase">
            {title}
          </h1>
          <p className="text-[11px] text-[#4e6781] mt-0.5">Admission module workspace.</p>
        </div>
        <div className="p-2">
          <Card className="border border-[#9dbde0]">
            <CardHeader className="pb-2 px-3 pt-3">
              <CardTitle className="text-sm font-semibold">{title}</CardTitle>
              <CardDescription className="text-xs">
                This page is ready for full legacy-form implementation.
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

