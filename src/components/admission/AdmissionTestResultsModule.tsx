"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function AdmissionTestResultsModule() {
  return (
    <div className="h-full bg-background relative overflow-x-hidden">
      <div className="w-full px-2 pt-2 pb-4">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h1 className="setup-type-page-title">Admission Test Results</h1>
            <p className="setup-type-page-desc">
              Configure report filters and preview admission test result output.
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <div className="setup-type-kicker-pill flex h-9 items-center rounded-xl border border-border/60 bg-background/70 px-3 shadow-sm backdrop-blur">
              Admission module
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl bg-background border border-border/40 shadow-sm">
          <div className="px-4 py-3 flex items-center gap-3 border-b border-border/40 bg-muted/5">
            <div className="leading-tight min-w-0">
              <div className="setup-type-module-title truncate">Admission Test Result Report</div>
              <div className="setup-type-module-sub">Preview by report type, campus, term, filters, and applicant list</div>
            </div>
          </div>

          <div className="p-3 bg-background/60 space-y-3">
            <div className="rounded-2xl border border-border/60 p-3 bg-muted/15 shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-[170px_1fr] gap-x-3 gap-y-2 text-xs">
                <Label>Report Title</Label>
                <Select defaultValue="individual-test-result">
                  <SelectTrigger className="h-8 rounded-xl text-xs border-border/60 shadow-sm bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="individual-test-result">Individual Test Result</SelectItem>
                    <SelectItem value="batch-test-result">Batch Test Result</SelectItem>
                  </SelectContent>
                </Select>

                <Label>Campus</Label>
                <Select defaultValue="all-campus">
                  <SelectTrigger className="h-8 rounded-xl text-xs border-border/60 shadow-sm bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all-campus">All Campus/es</SelectItem>
                  </SelectContent>
                </Select>

                <Label>Academic Year &amp; Term</Label>
                <Select defaultValue="2018-2019-2nd">
                  <SelectTrigger className="h-8 rounded-xl text-xs border-border/60 shadow-sm bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2018-2019-2nd">2018-2019 Second Semester</SelectItem>
                  </SelectContent>
                </Select>

                <Label>App. Batch Code</Label>
                <Input className="h-8 rounded-xl text-xs border-border/60 shadow-sm bg-background" />

                <Label>Exam Date</Label>
                <div className="grid grid-cols-[1fr_26px_1fr] gap-2 items-center">
                  <Input type="date" defaultValue="2026-05-05" className="h-8 rounded-xl text-xs border-border/60 shadow-sm bg-background" />
                  <span className="text-center text-xs text-muted-foreground">To</span>
                  <Input type="date" defaultValue="2026-05-05" className="h-8 rounded-xl text-xs border-border/60 shadow-sm bg-background" />
                </div>

                <Label>Classification</Label>
                <Select defaultValue="baccalaureate">
                  <SelectTrigger className="h-8 rounded-xl text-xs border-border/60 shadow-sm bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="baccalaureate">Baccalaureate Degree</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="rounded-2xl border border-border/60 p-3 bg-muted/15 shadow-sm space-y-3">
              <div className="flex items-center gap-2">
                <Checkbox id="select-all" defaultChecked />
                <Label htmlFor="select-all" className="text-xs">Select All</Label>
              </div>

              <div className="grid grid-cols-[120px_1fr_34px] gap-2 items-center">
                <div className="flex items-center gap-2">
                  <Checkbox id="college-choice" />
                  <Label htmlFor="college-choice" className="text-xs">College Choice</Label>
                </div>
                <Input className="h-8 rounded-xl text-xs border-border/60 shadow-sm bg-background" />
                <Button variant="outline" className="h-8 rounded-xl px-2 text-xs">...</Button>
              </div>

              <div className="grid grid-cols-[120px_1fr_34px] gap-2 items-center">
                <div className="flex items-center gap-2">
                  <Checkbox id="program-choice" />
                  <Label htmlFor="program-choice" className="text-xs">Program Choice</Label>
                </div>
                <Input className="h-8 rounded-xl text-xs border-border/60 shadow-sm bg-background" />
                <Button variant="outline" className="h-8 rounded-xl px-2 text-xs">...</Button>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <Checkbox id="selected-applicant-only" />
                <Label htmlFor="selected-applicant-only" className="text-xs">Selected Applicant Only</Label>
              </div>

              <div className="grid grid-cols-[120px_1fr_34px] gap-2 items-center">
                <Label className="text-xs">Applicant Name</Label>
                <Input className="h-8 rounded-xl text-xs border-border/60 shadow-sm bg-background" />
                <Button variant="outline" className="h-8 rounded-xl px-2 text-xs">...</Button>
              </div>

              <div className="flex items-center gap-2 justify-start">
                <Button variant="outline" className="h-8 rounded-xl px-3 text-xs">Add List</Button>
                <Button variant="outline" className="h-8 rounded-xl px-3 text-xs">Remove List</Button>
                <Button variant="outline" className="h-8 rounded-xl px-3 text-xs">View List</Button>
              </div>
            </div>

            <div className="rounded-2xl border border-border/60 p-2 bg-muted/15 shadow-sm flex justify-end gap-2">
              <Button className="h-8 rounded-xl px-4 text-xs font-semibold bg-primary hover:bg-primary/90">Preview</Button>
              <Button variant="outline" className="h-8 rounded-xl px-4 text-xs">Cancel</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

