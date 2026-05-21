"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const API = process.env.NEXT_PUBLIC_API_URL;
const NONE = "__none__";

type YearTerm = { id: number; academic_year: string; term: string };

export function SubjectFormationsMaintenanceModule() {
  const [terms, setTerms] = useState<YearTerm[]>([]);
  const [selectedTermId, setSelectedTermId] = useState<string>(NONE);
  const [selectedFormation, setSelectedFormation] = useState<string>(NONE);

  useEffect(() => {
    const loadTerms = async () => {
      if (!API) return;
      try {
        const res = await fetch(`${API}/api/academic-year-terms`);
        if (!res.ok) return;
        const rows = (await res.json()) as YearTerm[];
        setTerms(rows);
        if (rows[0]) setSelectedTermId(String(rows[0].id));
      } catch {
        // noop
      }
    };
    void loadTerms();
  }, []);

  return (
    <div className="h-full bg-background overflow-x-hidden">
      <div className="w-full px-2 pt-2 pb-4 space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="setup-type-page-title">Subject Formations Maintenance (GS/HS)</h1>
            <p className="setup-type-page-desc">Manage formation per period and tagged components.</p>
          </div>
          <div className="setup-type-kicker-pill hidden sm:flex h-9 items-center rounded-xl border border-border/60 bg-background/70 px-3 shadow-sm">
            Registrar module
          </div>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card shadow-sm overflow-hidden">
          <div className="p-3 border-b border-border/60 bg-muted/20 grid grid-cols-1 lg:grid-cols-[280px_280px_auto_1fr] gap-2 items-end">
            <div className="space-y-1">
              <Label className="text-[11px] text-muted-foreground uppercase">Academic Year</Label>
              <Select value={selectedTermId} onValueChange={setSelectedTermId}>
                <SelectTrigger className="h-8 rounded-xl text-xs border-border/60 bg-background">
                  <SelectValue placeholder="Select academic year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>Select academic year</SelectItem>
                  {terms.map((t) => (
                    <SelectItem key={t.id} value={String(t.id)}>
                      {t.academic_year} {t.term}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-[11px] text-muted-foreground uppercase">Select Formation</Label>
              <Select value={selectedFormation} onValueChange={setSelectedFormation}>
                <SelectTrigger className="h-8 rounded-xl text-xs border-border/60 bg-background">
                  <SelectValue placeholder="Select formation" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>Select formation</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="h-8 text-xs">Add New</Button>
              <Button variant="outline" className="h-8 text-xs">Edit</Button>
              <Button variant="outline" className="h-8 text-xs">Delete</Button>
            </div>
            <div className="text-xs text-muted-foreground">
              Please make sure that there are no formations tagged with the same period.
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-2 p-2 min-h-[560px]">
            <div className="rounded-xl border border-border/60 overflow-hidden">
              <div className="px-3 py-2 text-xs font-semibold bg-muted/30 border-b border-border/60">Formation Per Period</div>
              <div className="h-[500px] overflow-y-auto bg-background" />
              <div className="p-2 border-t border-border/60 flex gap-2">
                <Button variant="outline" className="h-8 text-xs">Add New</Button>
                <Button variant="outline" className="h-8 text-xs">Edit</Button>
                <Button variant="outline" className="h-8 text-xs">Delete</Button>
              </div>
            </div>

            <div className="rounded-xl border border-border/60 overflow-hidden">
              <div className="px-3 py-2 text-xs font-semibold bg-muted/30 border-b border-border/60">Components</div>
              <div className="h-[542px] overflow-y-auto bg-background" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

