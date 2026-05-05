"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const rawSectionsLeft = [
  "Verbal Reasoning",
  "Numerical Reasoning",
  "Abstract Reasoning",
  "Perceptual Speed",
  "Accuracy",
  "Spelling",
  "Language",
];

const rawSectionsRight = [
  "Mechanical Reasoning",
  "Space Relations",
  "Scholastic Aptitude",
];

export function AdmissionIndividualResultModule() {
  return (
    <div className="h-full bg-[#edf4ff] p-1">
      <div className="w-full border border-[#2f69b0] bg-white">
        <div className="bg-gradient-to-b from-[#0f68d5] to-[#0a3f96] text-white px-3 py-1 text-sm font-semibold">
          Admission Examination Result Module
        </div>

        <div className="bg-gradient-to-b from-[#dbe9ff] to-[#9fc0e7] border-b border-[#5a8fce] px-3 py-2">
          <h1 className="text-[36px] leading-none tracking-tight text-black font-semibold">
            Admission Individual Examination Result
          </h1>
          <p className="text-[12px] text-[#243b56] mt-1">
            Use this module to input Applicant&apos;s Examination Result.
          </p>
        </div>

        <div className="p-2 bg-[#b8cbe4] space-y-2">
          <div className="border border-[#5888c2]">
            <div className="bg-gradient-to-b from-[#7eaadd] to-[#4f80ba] text-white text-[12px] font-semibold px-2 py-0.5 uppercase tracking-wide">
              Applicant General Information
            </div>
            <div className="p-3 bg-[#aec3df] grid grid-cols-2 gap-x-8 gap-y-2 text-[12px]">
              <div className="space-y-2">
                <div className="grid grid-cols-[155px_1fr] items-center gap-2">
                  <Label className="text-[12px] font-semibold text-[#d90f0f] uppercase">Academic Year and Term</Label>
                  <Select defaultValue="2018-2019-2nd">
                    <SelectTrigger className="h-7 rounded-none border-[#6d97c9] bg-white text-[12px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2018-2019-2nd">2018-2019 Second Semester</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-[155px_1fr_auto] items-center gap-2">
                  <Label className="text-[12px] uppercase">Enter Application No :</Label>
                  <Input className="h-7 rounded-none border-[#6d97c9] bg-white text-[12px]" />
                  <Button className="h-7 rounded-none px-3 text-[11px] border border-[#6d97c9] bg-gradient-to-b from-[#fefefe] to-[#d8e7fb] text-[#17406e] hover:from-[#f6fbff] hover:to-[#c9ddf9]">
                    Search
                  </Button>
                </div>

                <div className="grid grid-cols-[155px_1fr] items-center gap-2">
                  <Label className="text-[12px] uppercase">Applicant Full Name :</Label>
                  <Input className="h-7 rounded-none border-[#6d97c9] bg-white text-[12px]" />
                </div>

                <div className="grid grid-cols-[155px_1fr] items-center gap-2">
                  <Label className="text-[12px] uppercase">Applicant Type :</Label>
                  <Input className="h-7 rounded-none border-[#6d97c9] bg-white text-[12px]" />
                </div>

                <div className="grid grid-cols-[155px_1fr] items-center gap-2">
                  <Label className="text-[12px] uppercase">Applicant Status :</Label>
                  <Input className="h-7 rounded-none border-[#6d97c9] bg-white text-[12px]" />
                </div>

                <div className="grid grid-cols-[155px_1fr] items-center gap-2">
                  <Label className="text-[12px] uppercase">Chosen Academic Program :</Label>
                  <Input className="h-7 rounded-none border-[#6d97c9] bg-white text-[12px]" />
                </div>

                <div className="grid grid-cols-[155px_1fr] items-center gap-2">
                  <Label className="text-[12px] uppercase">Examination Date :</Label>
                  <Input type="date" className="h-7 rounded-none border-[#6d97c9] bg-white text-[12px]" />
                </div>
              </div>

              <div className="space-y-2 pt-[38px]">
                <div className="grid grid-cols-[130px_1fr] items-center gap-2">
                  <Label className="text-[12px] uppercase">Application Date :</Label>
                  <Input className="h-7 rounded-none border-[#6d97c9] bg-white text-[12px]" />
                </div>
                <div className="grid grid-cols-[130px_1fr] items-center gap-2">
                  <Label className="text-[12px] uppercase">Gender :</Label>
                  <Input className="h-7 rounded-none border-[#6d97c9] bg-white text-[12px]" />
                </div>
              </div>
            </div>
          </div>

          <div className="h-7 bg-[#626970] text-white text-[12px] font-semibold flex items-center px-2 uppercase tracking-[2px]">
            College Level
            <span className="mx-4 opacity-60">|</span>
            High School Level
            <span className="mx-4 opacity-60">|</span>
          </div>

          <div className="grid grid-cols-[1fr_240px] gap-2">
            <div className="border border-[#5888c2]">
              <div className="bg-gradient-to-b from-[#7eaadd] to-[#4f80ba] text-white text-[12px] font-semibold px-2 py-0.5 uppercase tracking-wide">
                College Exam Score Sheet
              </div>
              <div className="p-2 bg-[#aec3df]">
                <div className="grid grid-cols-[1fr_120px_120px_1fr_120px_120px] text-[11px] font-semibold text-[#d21a1a]">
                  <div />
                  <div className="text-center">Raw Score</div>
                  <div className="text-center">Percentile</div>
                  <div />
                  <div className="text-center">Raw Score</div>
                  <div className="text-center">Percentile</div>
                </div>

                <div className="grid grid-cols-[1fr_120px_120px_1fr_120px_120px] gap-x-2 gap-y-1 mt-1">
                  {rawSectionsLeft.map((label, idx) => (
                    <div key={`${label}-${idx}`} className="contents">
                      <Label className="text-[12px] text-right pr-2">
                        {label}
                      </Label>
                      <Input className="h-6 rounded-none border-[#6d97c9] bg-white text-[12px]" />
                      <Input className="h-6 rounded-none border-[#6d97c9] bg-white text-[12px]" />
                      {idx < rawSectionsRight.length ? (
                        <>
                          <Label className="text-[12px] text-right pr-2">
                            {rawSectionsRight[idx]}
                          </Label>
                          <Input className="h-6 rounded-none border-[#6d97c9] bg-white text-[12px]" />
                          <Input className="h-6 rounded-none border-[#6d97c9] bg-white text-[12px]" />
                        </>
                      ) : (
                        <>
                          <div />
                          <div />
                          <div />
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="border border-[#5888c2]">
              <div className="bg-gradient-to-b from-[#7eaadd] to-[#4f80ba] text-white text-[12px] font-semibold px-2 py-0.5 uppercase tracking-wide">
                Exam Results
              </div>
              <div className="p-2 bg-[#aec3df] space-y-3">
                <div className="grid grid-cols-[1fr_95px] items-center gap-2">
                  <Label className="text-[12px] font-semibold uppercase text-center">Total Raw Score</Label>
                  <Input className="h-8 rounded-none border-[#6d97c9] bg-white text-[12px]" />
                </div>
                <div className="grid grid-cols-[1fr_95px] items-center gap-2">
                  <Label className="text-[12px] font-semibold uppercase text-center">English Language Ability (ELA)</Label>
                  <Input className="h-8 rounded-none border-[#6d97c9] bg-white text-[12px]" />
                </div>
                <div className="grid grid-cols-[1fr_95px] items-center gap-2">
                  <Label className="text-[12px] font-semibold uppercase text-center text-red-700">General Average</Label>
                  <Input className="h-8 rounded-none border-[#6d97c9] bg-white text-[12px]" />
                </div>
                <div className="grid grid-cols-[1fr_95px] items-center gap-2">
                  <Label className="text-[12px] font-semibold uppercase text-center text-blue-700">Total Ranking Score</Label>
                  <Input className="h-8 rounded-none border-[#6d97c9] bg-white text-[12px]" />
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between border border-[#5888c2] bg-[#a3bedf] p-2">
            <div className="flex items-center gap-2">
              <Button className="h-8 rounded-none border border-[#6d97c9] bg-gradient-to-b from-[#fefefe] to-[#d8e7fb] text-[#17406e] hover:from-[#f6fbff] hover:to-[#c9ddf9]">
                Print
              </Button>
              <div className="flex items-center gap-2 text-[12px]">
                <Checkbox id="print-save" />
                <Label htmlFor="print-save" className="text-[12px]">
                  Print Result upon save.
                </Label>
              </div>
            </div>

            <div className="text-[12px] leading-tight">
              <div>
                Last Printed by : <span className="font-semibold text-[#c11a1a]">Administrator</span>
              </div>
              <div>
                Last Date Printed : <span className="font-semibold text-[#c11a1a]">December 28, 2009 11:30 PM</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button className="h-8 rounded-none border border-[#6d97c9] bg-gradient-to-b from-[#fefefe] to-[#d8e7fb] text-[#17406e] hover:from-[#f6fbff] hover:to-[#c9ddf9]">
                Save Result
              </Button>
              <Button variant="destructive" className="h-8 rounded-none">
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

