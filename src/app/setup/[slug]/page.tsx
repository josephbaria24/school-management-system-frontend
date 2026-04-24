import { notFound } from "next/navigation";
import { getSetupLabelForSlug } from "@/lib/setup-nav";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function SetupManagerPage({ params }: Props) {
  const { slug } = await params;
  const title = getSetupLabelForSlug(slug);
  if (!title) notFound();

  return (
    <div className="h-full bg-background p-1">
      <div className="w-full border border-border/40 bg-background">
        <div className="bg-muted/5 border-b border-border/40 px-2 py-1">
          <h1 className="text-[24px] leading-none tracking-tight text-[#556b7d] font-semibold uppercase">
            {title}
          </h1>
          <p className="text-[11px] text-[#4e6781] mt-0.5">
            Setup Manager module workspace.
          </p>
        </div>
        <div className="p-2">
          <Card className="border border-[#9dbde0]">
            <CardHeader className="pb-2 px-3 pt-3">
              <CardTitle className="text-sm font-semibold">{title}</CardTitle>
              <CardDescription className="text-xs">
                This page is still a placeholder. You can now continue with the same full-width setup layout used by Buildings and Rooms.
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
