import { notFound } from "next/navigation";
import { getRegistrarLabelForSlug } from "@/lib/registrar-nav";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function RegistrarPage({ params }: Props) {
  const { slug } = await params;
  const title = getRegistrarLabelForSlug(slug);
  if (!title) notFound();

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

