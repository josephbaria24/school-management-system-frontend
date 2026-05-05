"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const API = process.env.NEXT_PUBLIC_API_URL;
const NONE = "__none__";

type TestingScheduleRow = {
  id: number;
  term_id: number | null;
  campus_id: number | null;
  testing_center: string;
  program_class: string;
  batch_name: string;
  application_type: string;
  testing_room: string;
  testing_date: string | null;
  time_from: string;
  time_to: string;
  session: string;
  limit_count: number;
  batch_id: string;
};
type AcademicYearTerm = { id: number; academic_year: string; term: string };
type Campus = { id: number; acronym: string; campus_name: string | null };

export function TestingSchedulesModule() {
  const [rows, setRows] = useState<TestingScheduleRow[]>([]);
  const [yearTerms, setYearTerms] = useState<AcademicYearTerm[]>([]);
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [selectedTermId, setSelectedTermId] = useState<string>(NONE);
  const [selectedCampusId, setSelectedCampusId] = useState<string>(NONE);
  const [selectedRowIdx, setSelectedRowIdx] = useState<number | null>(null);
  const [newOpen, setNewOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const [formBatchName, setFormBatchName] = useState("");
  const [formApplicationType, setFormApplicationType] = useState("All Types");
  const [formTestingCenter, setFormTestingCenter] = useState("[All Testing Center]");
  const [formTestingRoom, setFormTestingRoom] = useState("");
  const [formTestingDate, setFormTestingDate] = useState("");
  const [formTimeFrom, setFormTimeFrom] = useState("09:00 AM");
  const [formTimeTo, setFormTimeTo] = useState("12:00 PM");
  const [formSession, setFormSession] = useState("AM");
  const [formLimit, setFormLimit] = useState("50");
  const [formBatchId, setFormBatchId] = useState("Batch 1");
  const [formProgramClass, setFormProgramClass] = useState("Baccalaureate Degree");
  const [formTermId, setFormTermId] = useState<number | null>(null);
  const [formCampusId, setFormCampusId] = useState<number | null>(null);

  const loadSchedules = async () => {
    if (!API) return;
    try {
      const params = new URLSearchParams();
      if (selectedTermId !== NONE) params.set("term_id", selectedTermId);
      if (selectedCampusId !== NONE) params.set("campus_id", selectedCampusId);
      const q = params.toString();
      const res = await fetch(`${API}/api/admission/testing-schedules${q ? `?${q}` : ""}`);
      if (!res.ok) return;
      setRows((await res.json()) as TestingScheduleRow[]);
    } catch {
      // no-op
    }
  };

  useEffect(() => {
    const loadLookups = async () => {
      if (!API) return;
      try {
        const [termRes, campusRes] = await Promise.all([
          fetch(`${API}/api/academic-year-terms`),
          fetch(`${API}/api/campuses`),
        ]);
        if (termRes.ok) {
          const terms = (await termRes.json()) as AcademicYearTerm[];
          setYearTerms(terms);
          if (terms[0]) setSelectedTermId(String(terms[0].id));
        }
        if (campusRes.ok) {
          const rows = (await campusRes.json()) as Campus[];
          setCampuses(rows);
          if (rows[0]) setSelectedCampusId(String(rows[0].id));
        }
      } catch {
        // no-op
      }
    };
    void loadLookups();
  }, []);

  useEffect(() => {
    void loadSchedules();
  }, [selectedTermId, selectedCampusId]);

  const openNewDialog = () => {
    setFormBatchName("");
    setFormApplicationType("All Types");
    setFormTestingCenter("[All Testing Center]");
    setFormTestingRoom("");
    setFormTestingDate(new Date().toISOString().slice(0, 10));
    setFormTimeFrom("09:00 AM");
    setFormTimeTo("12:00 PM");
    setFormSession("AM");
    setFormLimit("50");
    setFormBatchId("Batch 1");
    setNewOpen(true);
  };

  const openEditDialog = () => {
    if (selectedRowIdx === null) return;
    const row = rows[selectedRowIdx];
    if (!row) return;
    setFormBatchName(row.batch_name);
    setFormApplicationType(row.application_type || "All Types");
    setFormTestingCenter(row.testing_center || "Main");
    setFormProgramClass(row.program_class || "Baccalaureate Degree");
    setFormTestingRoom(row.testing_room || "");
    setFormTestingDate(row.testing_date ? new Date(row.testing_date).toISOString().slice(0, 10) : "");
    setFormTimeFrom(row.time_from || "08:00 AM");
    setFormTimeTo(row.time_to || "12:00 PM");
    setFormSession(row.session || "AM");
    setFormLimit(String(row.limit_count ?? 0));
    setFormBatchId(row.batch_id || "Batch 1");
    setFormTermId(row.term_id);
    setFormCampusId(row.campus_id);
    setEditOpen(true);
  };

  const saveNew = async () => {
    if (!API) return;
    try {
      const res = await fetch(`${API}/api/admission/testing-schedules`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          term_id: formTermId,
          campus_id: formCampusId,
          testing_center: formTestingCenter,
          program_class: formProgramClass,
          batch_name: formBatchName,
          application_type: formApplicationType,
          testing_room: formTestingRoom,
          testing_date: formTestingDate || null,
          time_from: formTimeFrom,
          time_to: formTimeTo,
          session: formSession,
          limit_count: Number(formLimit) || 0,
          batch_id: formBatchId,
        }),
      });
      if (!res.ok) return;
      setNewOpen(false);
      await loadSchedules();
    } catch {
      // no-op
    }
  };

  const saveEdit = async () => {
    if (!API || selectedRowIdx === null) return;
    const row = rows[selectedRowIdx];
    if (!row) return;
    try {
      const res = await fetch(`${API}/api/admission/testing-schedules/${row.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          term_id: formTermId,
          campus_id: formCampusId,
          testing_center: formTestingCenter,
          program_class: formProgramClass,
          batch_name: formBatchName,
          application_type: formApplicationType,
          testing_room: formTestingRoom,
          testing_date: formTestingDate || null,
          time_from: formTimeFrom,
          time_to: formTimeTo,
          session: formSession,
          limit_count: Number(formLimit) || 0,
          batch_id: formBatchId,
        }),
      });
      if (!res.ok) return;
      setEditOpen(false);
      await loadSchedules();
    } catch {
      // no-op
    }
  };

  const deleteSelected = async () => {
    if (!API || selectedRowIdx === null) return;
    const row = rows[selectedRowIdx];
    if (!row) return;
    try {
      const res = await fetch(`${API}/api/admission/testing-schedules/${row.id}`, {
        method: "DELETE",
      });
      if (!res.ok) return;
      setSelectedRowIdx(null);
      await loadSchedules();
    } catch {
      // no-op
    }
  };

  return (
    <div className="h-full bg-background relative overflow-x-hidden">
      <div className="w-full px-2 pt-2 pb-4">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h1 className="setup-type-page-title">List of Testing Schedules</h1>
            <p className="setup-type-page-desc">
              Manage testing schedule batches, rooms, and date/time slots for admission applicants.
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
              <div className="setup-type-module-title truncate">Testing Schedules Workspace</div>
              <div className="setup-type-module-sub">Filter, review, and maintain testing batches</div>
            </div>
          </div>

          <div className="p-3 bg-background/60 space-y-3">
            <div className="rounded-2xl border border-border/60 p-3 bg-muted/15 shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground uppercase">Academic Year & Term</Label>
                  <Select value={selectedTermId} onValueChange={setSelectedTermId}>
                    <SelectTrigger className="h-8 rounded-xl text-xs border-border/60 shadow-sm bg-background">
                      <SelectValue placeholder="Select term" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE}>All terms</SelectItem>
                      {yearTerms.map((t) => (
                        <SelectItem key={t.id} value={String(t.id)}>
                          {t.academic_year} {t.term}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground uppercase">Testing School / Campus Name</Label>
                  <Select value={selectedCampusId} onValueChange={setSelectedCampusId}>
                    <SelectTrigger className="h-8 rounded-xl text-xs border-border/60 shadow-sm bg-background">
                      <SelectValue placeholder="Select campus" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE}>All Campus/es</SelectItem>
                      {campuses.map((c) => (
                        <SelectItem key={c.id} value={String(c.id)}>
                          {c.acronym || c.campus_name || `Campus ${c.id}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground uppercase">Testing Center</Label>
                  <Select defaultValue="all-center">
                    <SelectTrigger className="h-8 rounded-xl text-xs border-border/60 shadow-sm bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all-center">[All Testing Center]</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground uppercase">Program Class</Label>
                  <Select defaultValue="baccalaureate">
                    <SelectTrigger className="h-8 rounded-xl text-xs border-border/60 shadow-sm bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="baccalaureate">Baccalaureate Degree</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground uppercase">Batch ID</Label>
                  <Select defaultValue="all-batches">
                    <SelectTrigger className="h-8 rounded-xl text-xs border-border/60 shadow-sm bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all-batches">All Batches</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                <Button onClick={() => void loadSchedules()} className="h-8 rounded-xl px-4 text-xs font-semibold bg-primary hover:bg-primary/90">
                    Refresh
                  </Button>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-border/60 overflow-auto bg-card shadow-sm premium-surface max-h-[420px]">
              <table className="w-full min-w-[900px] border-collapse text-[12px]">
                <thead>
                  <tr className="sticky top-0 z-20 bg-muted/50 text-left shadow-sm">
                    {["Batch Name", "Application Type", "Testing Center", "Room", "Testing Date / Time", "Limit", "Batch ID"].map((h) => (
                      <th key={h} className="setup-type-table-header border-b border-r border-border/60 px-2 py-2 text-left whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, idx) => (
                    <tr
                      key={`${r.id}-${idx}`}
                      className={
                        selectedRowIdx === idx
                          ? "bg-primary/10 border-b border-border/40"
                          : idx % 2 === 1
                            ? "bg-muted/10 border-b border-border/40"
                            : "border-b border-border/40"
                      }
                      onClick={() => setSelectedRowIdx(idx)}
                    >
                      <td className="border-r border-border/30 px-2 py-1 whitespace-nowrap">{r.batch_name}</td>
                      <td className="border-r border-border/30 px-2 py-1 whitespace-nowrap">{r.application_type}</td>
                      <td className="border-r border-border/30 px-2 py-1 whitespace-nowrap">{r.testing_center}</td>
                      <td className="border-r border-border/30 px-2 py-1 whitespace-nowrap">{r.testing_room}</td>
                      <td className="border-r border-border/30 px-2 py-1 whitespace-nowrap">
                        {r.testing_date ? `${new Date(r.testing_date).toLocaleDateString()} ${r.time_from} to ${r.time_to}` : ""}
                      </td>
                      <td className="border-r border-border/30 px-2 py-1 whitespace-nowrap">{r.limit_count}</td>
                      <td className="border-r border-border/30 px-2 py-1 whitespace-nowrap">{r.batch_id}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between rounded-2xl border border-border/60 p-2 bg-muted/15 shadow-sm">
              <div className="flex items-center gap-2">
                <Button onClick={openNewDialog} className="h-8 rounded-xl px-3 text-xs font-semibold bg-primary hover:bg-primary/90">New...</Button>
                <Button onClick={openEditDialog} disabled={selectedRowIdx === null} className="h-8 rounded-xl px-3 text-xs font-semibold bg-primary hover:bg-primary/90 disabled:opacity-50">Edit</Button>
                <Button onClick={() => void deleteSelected()} variant="destructive" disabled={selectedRowIdx === null} className="h-8 rounded-xl px-3 text-xs disabled:opacity-50">Delete</Button>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" className="h-8 rounded-xl px-3 text-xs">Print</Button>
                <Button variant="outline" className="h-8 rounded-xl px-3 text-xs">Close</Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={newOpen} onOpenChange={setNewOpen}>
        <DialogContent className="max-w-[560px] p-0 overflow-hidden rounded-2xl border-border/60">
          <DialogHeader className="bg-primary text-primary-foreground px-4 py-2">
            <DialogTitle className="text-sm font-semibold tracking-wide uppercase">New Entry</DialogTitle>
          </DialogHeader>
          <div className="bg-background p-4 grid grid-cols-[110px_1fr] gap-x-2 gap-y-2 text-xs">
            <Label>Batch Name:</Label>
            <Input value={formBatchName} onChange={(e) => setFormBatchName(e.target.value)} className="h-8 rounded-lg border-border/60 bg-background text-xs" />
            <Label>Application Type:</Label>
            <Select value={formApplicationType} onValueChange={setFormApplicationType}>
              <SelectTrigger className="h-8 rounded-lg border-border/60 bg-background text-xs"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="All Types">All Types</SelectItem><SelectItem value="Freshman">Freshman</SelectItem></SelectContent>
            </Select>
            <Label>Testing Center:</Label>
            <Select value={formTestingCenter} onValueChange={setFormTestingCenter}>
              <SelectTrigger className="h-8 rounded-lg border-border/60 bg-background text-xs"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="[All Testing Center]">[All Testing Center]</SelectItem><SelectItem value="Main">Main</SelectItem></SelectContent>
            </Select>
            <Label>Testing Room:</Label>
            <Input value={formTestingRoom} onChange={(e) => setFormTestingRoom(e.target.value)} className="h-8 rounded-lg border-border/60 bg-background text-xs" />
            <Label>Testing Date:</Label>
            <Input type="date" value={formTestingDate} onChange={(e) => setFormTestingDate(e.target.value)} className="h-8 rounded-lg border-border/60 bg-background text-xs" />
            <Label>Time From:</Label>
            <div className="grid grid-cols-[1fr_24px_1fr] gap-2 items-center">
              <Input value={formTimeFrom} onChange={(e) => setFormTimeFrom(e.target.value)} className="h-8 rounded-lg border-border/60 bg-background text-xs" />
              <span className="text-center">To:</span>
              <Input value={formTimeTo} onChange={(e) => setFormTimeTo(e.target.value)} className="h-8 rounded-lg border-border/60 bg-background text-xs" />
            </div>
            <Label>Session:</Label>
            <Select value={formSession} onValueChange={setFormSession}>
              <SelectTrigger className="h-8 rounded-lg border-border/60 bg-background text-xs"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="AM">AM</SelectItem><SelectItem value="PM">PM</SelectItem></SelectContent>
            </Select>
            <Label>Limit:</Label>
            <Input value={formLimit} onChange={(e) => setFormLimit(e.target.value)} className="h-8 rounded-lg border-border/60 bg-background text-xs" />
            <Label>Batch ID :</Label>
            <Select value={formBatchId} onValueChange={setFormBatchId}>
              <SelectTrigger className="h-8 rounded-lg border-border/60 bg-background text-xs"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="Batch 1">Batch 1</SelectItem><SelectItem value="Batch 2">Batch 2</SelectItem></SelectContent>
            </Select>
          </div>
          <DialogFooter className="bg-muted/20 p-3 border-t border-border/60">
            <Button onClick={() => void saveNew()} className="h-8 rounded-xl px-4 text-xs font-semibold bg-primary hover:bg-primary/90">Ok</Button>
            <Button variant="outline" className="h-8 rounded-xl px-4 text-xs" onClick={() => setNewOpen(false)}>Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-[560px] p-0 overflow-hidden rounded-2xl border-border/60">
          <DialogHeader className="bg-primary text-primary-foreground px-4 py-2">
            <DialogTitle className="text-sm font-semibold tracking-wide uppercase">Edit Entry</DialogTitle>
          </DialogHeader>
          <div className="bg-background p-4 grid grid-cols-[110px_1fr] gap-x-2 gap-y-2 text-xs">
            <Label>Batch Name:</Label>
            <Input value={formBatchName} onChange={(e) => setFormBatchName(e.target.value)} className="h-8 rounded-lg border-border/60 bg-background text-xs" />
            <Label>Application Type:</Label>
            <Select value={formApplicationType} onValueChange={setFormApplicationType}>
              <SelectTrigger className="h-8 rounded-lg border-border/60 bg-background text-xs"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="All Types">All Types</SelectItem><SelectItem value="Freshman">Freshman</SelectItem></SelectContent>
            </Select>
            <Label>Testing Center:</Label>
            <Select value={formTestingCenter} onValueChange={setFormTestingCenter}>
              <SelectTrigger className="h-8 rounded-lg border-border/60 bg-background text-xs"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="[All Testing Center]">[All Testing Center]</SelectItem><SelectItem value="Main">Main</SelectItem></SelectContent>
            </Select>
            <Label>Testing Room:</Label>
            <Input value={formTestingRoom} onChange={(e) => setFormTestingRoom(e.target.value)} className="h-8 rounded-lg border-border/60 bg-background text-xs" />
            <Label>Testing Date:</Label>
            <Input type="date" value={formTestingDate} onChange={(e) => setFormTestingDate(e.target.value)} className="h-8 rounded-lg border-border/60 bg-background text-xs" />
            <Label>Time From:</Label>
            <div className="grid grid-cols-[1fr_24px_1fr] gap-2 items-center">
              <Input value={formTimeFrom} onChange={(e) => setFormTimeFrom(e.target.value)} className="h-8 rounded-lg border-border/60 bg-background text-xs" />
              <span className="text-center">To:</span>
              <Input value={formTimeTo} onChange={(e) => setFormTimeTo(e.target.value)} className="h-8 rounded-lg border-border/60 bg-background text-xs" />
            </div>
            <Label>Session:</Label>
            <Select value={formSession} onValueChange={setFormSession}>
              <SelectTrigger className="h-8 rounded-lg border-border/60 bg-background text-xs"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="AM">AM</SelectItem><SelectItem value="PM">PM</SelectItem></SelectContent>
            </Select>
            <Label>Limit:</Label>
            <Input value={formLimit} onChange={(e) => setFormLimit(e.target.value)} className="h-8 rounded-lg border-border/60 bg-background text-xs" />
            <Label>Batch ID :</Label>
            <Select value={formBatchId} onValueChange={setFormBatchId}>
              <SelectTrigger className="h-8 rounded-lg border-border/60 bg-background text-xs"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="Batch 1">Batch 1</SelectItem><SelectItem value="Batch 2">Batch 2</SelectItem></SelectContent>
            </Select>
          </div>
          <DialogFooter className="bg-muted/20 p-3 border-t border-border/60">
            <Button onClick={() => void saveEdit()} className="h-8 rounded-xl px-4 text-xs font-semibold bg-primary hover:bg-primary/90">Ok</Button>
            <Button variant="outline" className="h-8 rounded-xl px-4 text-xs" onClick={() => setEditOpen(false)}>Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

