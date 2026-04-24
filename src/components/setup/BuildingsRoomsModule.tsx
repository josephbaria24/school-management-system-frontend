 "use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Building2,
  ChevronDown,
  ChevronRight,
  DoorOpen,
  Home,
  Layers,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

const API = process.env.NEXT_PUBLIC_API_URL;

type TreeRecord = {
  institution_id: number | null;
  institution_name: string | null;
  campus_id: number;
  acronym: string;
  campus_name: string | null;
  building_id: number | null;
  building_name: string | null;
  floor_id: number | null;
  floor_name: string | null;
  room_count: number;
};
type TreeNode = {
  id: string;
  kind: "institution" | "campus" | "building" | "floor";
  refId: number | null;
  label: string;
  children?: TreeNode[];
};
type RoomRow = {
  id: number;
  floor_id: number;
  room_no: string;
  room_name: string;
  room_type: string | null;
  capacity: number;
  air_conditioned: boolean;
  fit_to_use: boolean;
  lan_member: boolean;
  night_class_allowed: boolean;
  shared: boolean;
};

/* ──────────────────────────── Tree item ──────────────────────────── */
function TreeItem({
  node,
  level = 0,
  activeId,
  expandedIds,
  onToggleExpand,
  onSelect,
  onDoubleSelect,
}: {
  node: TreeNode;
  level?: number;
  activeId: string;
  expandedIds: Set<string>;
  onToggleExpand: (id: string) => void;
  onSelect: (node: TreeNode) => void;
  onDoubleSelect: (node: TreeNode) => void;
}) {
  const hasChildren = !!node.children?.length;
  const expanded = expandedIds.has(node.id);
  const isActive = activeId === node.id;

  const iconForKind = () => {
    switch (node.kind) {
      case "institution":
        return <Building2 className="h-3.5 w-3.5 text-primary/70" />;
      case "campus":
        return <Building2 className="h-3.5 w-3.5 text-primary/70" />;
      case "building":
        return <Home className="h-3.5 w-3.5 text-primary/60" />;
      case "floor":
        return <Layers className="h-3.5 w-3.5 text-muted-foreground/60" />;
    }
  };

  return (
    <div>
      <div
        className={cn(
          "w-full flex items-center gap-1 text-[11px] py-1 rounded-md transition-colors",
          isActive
            ? "bg-emerald-500/12 text-foreground font-semibold ring-1 ring-inset ring-emerald-500/15"
            : "hover:bg-muted/40 text-foreground/80"
        )}
        style={{ paddingLeft: `${4 + level * 12}px`, paddingRight: 4 }}
      >
        <button
          type="button"
          className={cn(
            "h-3.5 w-3.5 grid place-items-center shrink-0 rounded transition-colors",
            hasChildren ? "text-muted-foreground hover:text-foreground hover:bg-muted/50" : "invisible"
          )}
          onClick={() => hasChildren && onToggleExpand(node.id)}
          aria-label={expanded ? "Collapse" : "Expand"}
        >
          {hasChildren &&
            (expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />)}
        </button>
        <button
          type="button"
          onClick={() => onSelect(node)}
          onDoubleClick={() => onDoubleSelect(node)}
          className="flex items-center gap-1.5 text-left flex-1 min-w-0"
        >
          {iconForKind()}
          <span className="truncate">{node.label}</span>
        </button>
      </div>
      {hasChildren &&
        expanded &&
        node.children!.map((child) => (
          <TreeItem
            key={child.id}
            node={child}
            level={level + 1}
            activeId={activeId}
            expandedIds={expandedIds}
            onToggleExpand={onToggleExpand}
            onSelect={onSelect}
            onDoubleSelect={onDoubleSelect}
          />
        ))}
    </div>
  );
}

/* ──────────────────────── Bool badge ──────────────────────── */
function BoolBadge({ value }: { value: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex h-5 w-5 items-center justify-center rounded-md text-[10px] font-bold",
        value
          ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
          : "bg-muted/30 text-muted-foreground/40"
      )}
    >
      {value ? "✓" : "—"}
    </span>
  );
}

/* ══════════════════════════════════════════════════════════════ */
export function BuildingsRoomsModule() {
  const [treeData, setTreeData] = useState<TreeNode[]>([]);
  const [activeNode, setActiveNode] = useState<TreeNode | null>(null);
  const [rows, setRows] = useState<RoomRow[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [addBuildingOpen, setAddBuildingOpen] = useState(false);
  const [addRoomOpen, setAddRoomOpen] = useState(false);
  const [addFloorOpen, setAddFloorOpen] = useState(false);
  const [buildingDialogMode, setBuildingDialogMode] = useState<"create" | "edit">("create");
  const [roomDialogMode, setRoomDialogMode] = useState<"create" | "edit">("create");
  const [floorDialogMode, setFloorDialogMode] = useState<"create" | "edit">("edit");
  const [editingBuildingId, setEditingBuildingId] = useState<number | null>(null);
  const [editingRoomId, setEditingRoomId] = useState<number | null>(null);
  const [editingFloorId, setEditingFloorId] = useState<number | null>(null);
  const [buildingForm, setBuildingForm] = useState({
    campus_id: "",
    building_name: "",
    popular_name: "",
    acronym: "",
    number_of_floors: "1",
    lan_ready: false,
  });
  const [roomForm, setRoomForm] = useState({
    campus_id: "",
    building_id: "",
    floor_id: "",
    room_no: "",
    room_name: "",
    room_type: "",
    capacity: "50",
    air_conditioned: false,
    fit_to_use: true,
    lan_member: false,
    night_class_allowed: false,
    shared: false,
  });
  const [floorForm, setFloorForm] = useState({
    campus_id: "",
    building_id: "",
    floor_name: "",
  });

  /* ── Data loading ── */
  const loadTree = useCallback(async () => {
    const res = await fetch(`${API}/api/buildings-rooms/tree`);
    if (!res.ok) return;
    const data: TreeRecord[] = await res.json();
    const institutionMap = new Map<string, TreeNode>();
    const campusMap = new Map<number, TreeNode>();
    const buildingMap = new Map<number, TreeNode>();
    for (const r of data) {
      const institutionKey = String(r.institution_id ?? 0);
      if (!institutionMap.has(institutionKey)) {
        institutionMap.set(institutionKey, {
          id: `institution-${institutionKey}`,
          kind: "institution",
          refId: r.institution_id ?? null,
          label: r.institution_name || "Institution",
          children: [],
        });
      }
      if (!campusMap.has(r.campus_id)) {
        const campusNode: TreeNode = {
          id: `campus-${r.campus_id}`,
          kind: "campus",
          refId: r.campus_id,
          label: `${r.acronym}${r.campus_name ? ` ${r.campus_name}` : ""}`,
          children: [],
        };
        campusMap.set(r.campus_id, campusNode);
        institutionMap.get(institutionKey)?.children?.push(campusNode);
      }
      if (r.building_id && !buildingMap.has(r.building_id)) {
        const bNode: TreeNode = {
          id: `building-${r.building_id}`,
          kind: "building",
          refId: r.building_id,
          label: r.building_name || `Building ${r.building_id}`,
          children: [],
        };
        buildingMap.set(r.building_id, bNode);
        campusMap.get(r.campus_id)?.children?.push(bNode);
      }
      if (r.floor_id && r.building_id) {
        buildingMap.get(r.building_id)?.children?.push({
          id: `floor-${r.floor_id}`,
          kind: "floor",
          refId: r.floor_id,
          label: `${r.floor_name || "Floor"} (${r.room_count || 0})`,
        });
      }
    }
    const tree = Array.from(institutionMap.values());
    setTreeData(tree);
    const nextExpanded = new Set<string>();
    for (const institution of tree) {
      nextExpanded.add(institution.id);
      for (const campus of institution.children || []) {
        nextExpanded.add(campus.id);
        for (const b of campus.children || []) nextExpanded.add(b.id);
      }
    }
    setExpandedIds(nextExpanded);
    if (!activeNode) {
      const firstFloor = tree
        .flatMap((i) => i.children || [])
        .flatMap((c) => c.children || [])
        .flatMap((b) => b.children || [])[0];
      setActiveNode(firstFloor ?? tree[0]?.children?.[0] ?? tree[0] ?? null);
    }
  }, [activeNode]);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const loadRooms = useCallback(async () => {
    if (!activeNode || activeNode.kind !== "floor" || !activeNode.refId) {
      setRows([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(
        `${API}/api/buildings-rooms/rooms?floor_id=${activeNode.refId}`
      );
      if (!res.ok) return;
      const data: RoomRow[] = await res.json();
      setRows(data);
      if (selectedRoomId && !data.some((r) => r.id === selectedRoomId)) {
        setSelectedRoomId(null);
      }
    } finally {
      setLoading(false);
    }
  }, [activeNode, selectedRoomId]);

  useEffect(() => { loadTree(); }, [loadTree]);
  useEffect(() => { loadRooms(); }, [loadRooms]);

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        r.room_no.toLowerCase().includes(q) ||
        r.room_name.toLowerCase().includes(q) ||
        String(r.room_type || "").toLowerCase().includes(q)
    );
  }, [rows, search]);

  const rightTitle = activeNode?.label || "Select a floor";

  /* ── CRUD handlers ── */
  const submitBuilding = async (saveAndAnother = false) => {
    const campusId = parseInt(buildingForm.campus_id, 10);
    if (!Number.isFinite(campusId) || !buildingForm.building_name.trim()) {
      toast({ title: "Validation error", description: "Campus and Building Name are required.", variant: "destructive" });
      return;
    }
    const endpoint = buildingDialogMode === "edit" && editingBuildingId
      ? `${API}/api/buildings-rooms/buildings/${editingBuildingId}`
      : `${API}/api/buildings-rooms/buildings`;
    const res = await fetch(endpoint, {
      method: buildingDialogMode === "edit" ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        campus_id: campusId,
        building_name: buildingForm.building_name.trim(),
        popular_name: buildingForm.popular_name.trim() || null,
        acronym: buildingForm.acronym.trim() || null,
        number_of_floors: parseInt(buildingForm.number_of_floors, 10) || 1,
        lan_ready: buildingForm.lan_ready,
      }),
    });
    const result = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast({ title: "Save failed", description: result?.error || "Failed to save building.", variant: "destructive" });
      return;
    }
    await loadTree();
    toast({ title: "Saved", description: buildingDialogMode === "edit" ? "Building updated." : "Building saved." });
    if (buildingDialogMode === "edit") { setAddBuildingOpen(false); return; }
    if (saveAndAnother) {
      setBuildingForm((s) => ({ ...s, building_name: "", popular_name: "", acronym: "", number_of_floors: "1", lan_ready: false }));
      return;
    }
    setAddBuildingOpen(false);
  };

  const submitRoom = async () => {
    const floorId = parseInt(roomForm.floor_id, 10);
    if (!Number.isFinite(floorId) || !roomForm.room_no.trim() || !roomForm.room_name.trim()) {
      toast({ title: "Validation error", description: "Floor location, room no, and room name are required.", variant: "destructive" });
      return;
    }
    const capacity = Number(roomForm.capacity || "0");
    const endpoint = roomDialogMode === "edit" && editingRoomId
      ? `${API}/api/buildings-rooms/rooms/${editingRoomId}`
      : `${API}/api/buildings-rooms/rooms`;
    const res = await fetch(endpoint, {
      method: roomDialogMode === "edit" ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        floor_id: floorId, room_no: roomForm.room_no.trim(), room_name: roomForm.room_name.trim(),
        room_type: roomForm.room_type.trim() || null, capacity: Number.isFinite(capacity) ? capacity : 0,
        air_conditioned: roomForm.air_conditioned, fit_to_use: roomForm.fit_to_use,
        lan_member: roomForm.lan_member, night_class_allowed: roomForm.night_class_allowed, shared: roomForm.shared,
      }),
    });
    const result = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast({ title: "Save failed", description: result?.error || "Failed to save room.", variant: "destructive" });
      return;
    }
    await loadRooms();
    await loadTree();
    toast({ title: "Saved", description: roomDialogMode === "edit" ? "Room updated." : "Room saved." });
  };

  const submitFloor = async () => {
    if (!editingFloorId || !floorForm.floor_name.trim()) {
      toast({ title: "Validation error", description: "Floor name is required.", variant: "destructive" });
      return;
    }
    const res = await fetch(`${API}/api/buildings-rooms/floors/${editingFloorId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ floor_name: floorForm.floor_name.trim() }),
    });
    const result = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast({ title: "Save failed", description: result?.error || "Failed to save floor.", variant: "destructive" });
      return;
    }
    toast({ title: "Saved", description: "Floor updated." });
    setAddFloorOpen(false);
    await loadTree();
  };

  /* ── Edit / delete helpers ── */
  const campusOptions = useMemo(
    () => treeData.flatMap((i) => i.children || []).filter((n) => n.kind === "campus" && n.refId),
    [treeData]
  );
  const buildingOptions = useMemo(() => {
    const campusId = parseInt(roomForm.campus_id, 10);
    if (!Number.isFinite(campusId)) return [];
    const campus = campusOptions.find((n) => n.kind === "campus" && n.refId === campusId);
    return (campus?.children || []).filter((n) => n.kind === "building" && n.refId);
  }, [roomForm.campus_id, campusOptions]);
  const buildingOptionsForFloor = useMemo(() => {
    const campusId = parseInt(floorForm.campus_id, 10);
    if (!Number.isFinite(campusId)) return [];
    const campus = campusOptions.find((n) => n.kind === "campus" && n.refId === campusId);
    return (campus?.children || []).filter((n) => n.kind === "building" && n.refId);
  }, [floorForm.campus_id, campusOptions]);
  const floorOptions = useMemo(() => {
    const buildingId = parseInt(roomForm.building_id, 10);
    if (!Number.isFinite(buildingId)) return [];
    const buildings = campusOptions.flatMap((c) => c.children || []);
    const building = buildings.find((b) => b.kind === "building" && b.refId === buildingId);
    return (building?.children || []).filter((n) => n.kind === "floor" && n.refId);
  }, [roomForm.building_id, campusOptions]);

  const openBuildingEditDialog = (node: TreeNode) => {
    if (node.kind !== "building" || !node.refId) return;
    const campus = campusOptions.find((c) => (c.children || []).some((b) => b.refId === node.refId));
    const building = (campus?.children || []).find((b) => b.refId === node.refId);
    const floorCount = (building?.children || []).length;
    setBuildingDialogMode("edit");
    setEditingBuildingId(node.refId);
    setBuildingForm({ campus_id: campus?.refId ? String(campus.refId) : "", building_name: node.label, popular_name: "", acronym: "", number_of_floors: String(Math.max(1, floorCount || 1)), lan_ready: false });
    setAddBuildingOpen(true);
  };
  const openFloorEditDialog = (node: TreeNode) => {
    if (node.kind !== "floor" || !node.refId) return;
    const building = campusOptions.flatMap((c) => c.children || []).find((b) => (b.children || []).some((f) => f.refId === node.refId));
    const campus = campusOptions.find((c) => (c.children || []).some((b) => b.refId === building?.refId));
    setFloorDialogMode("edit");
    setEditingFloorId(node.refId);
    setFloorForm({ campus_id: campus?.refId ? String(campus.refId) : "", building_id: building?.refId ? String(building.refId) : "", floor_name: node.label.replace(/\s*\(\d+\)\s*$/, "") });
    setAddFloorOpen(true);
  };
  const openRoomEditDialog = (row: RoomRow) => {
    const building = campusOptions.flatMap((c) => c.children || []).find((b) => (b.children || []).some((f) => f.refId === row.floor_id));
    const campus = campusOptions.find((c) => (c.children || []).some((b) => b.refId === building?.refId));
    setRoomDialogMode("edit");
    setEditingRoomId(row.id);
    setRoomForm({ campus_id: campus?.refId ? String(campus.refId) : "", building_id: building?.refId ? String(building.refId) : "", floor_id: String(row.floor_id), room_no: row.room_no, room_name: row.room_name, room_type: row.room_type || "", capacity: String(row.capacity ?? 0), air_conditioned: !!row.air_conditioned, fit_to_use: !!row.fit_to_use, lan_member: !!row.lan_member, night_class_allowed: !!row.night_class_allowed, shared: !!row.shared });
    setAddRoomOpen(true);
  };

  const editRoom = async () => {
    if (activeNode?.kind === "building" && activeNode.refId) { openBuildingEditDialog(activeNode); return; }
    if (activeNode?.kind === "floor" && activeNode.refId) { openFloorEditDialog(activeNode); return; }
    const row = rows.find((r) => r.id === selectedRoomId) ?? rows[0];
    if (!row) { toast({ title: "No selection", description: "Select a room to edit.", variant: "destructive" }); return; }
    openRoomEditDialog(row);
  };

  const deleteRoom = async () => {
    if (activeNode?.kind === "building" && activeNode.refId) {
      if (!confirm("Delete selected building and all its floors/rooms?")) return;
      const res = await fetch(`${API}/api/buildings-rooms/buildings/${activeNode.refId}`, { method: "DELETE" });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) { toast({ title: "Delete failed", description: result?.error || "Failed to delete building.", variant: "destructive" }); return; }
      toast({ title: "Deleted", description: "Building deleted." });
      setActiveNode(null); setSelectedRoomId(null);
      await loadTree(); await loadRooms(); return;
    }
    if (activeNode?.kind === "floor" && activeNode.refId) {
      if (!confirm("Delete selected floor and all its rooms?")) return;
      const res = await fetch(`${API}/api/buildings-rooms/floors/${activeNode.refId}`, { method: "DELETE" });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) { toast({ title: "Delete failed", description: result?.error || "Failed to delete floor.", variant: "destructive" }); return; }
      toast({ title: "Deleted", description: "Floor deleted." });
      setActiveNode(null); setSelectedRoomId(null);
      await loadTree(); await loadRooms(); return;
    }
    const rowId = selectedRoomId ?? rows[0]?.id ?? null;
    if (!rowId) { toast({ title: "No selection", description: "Select a room to delete.", variant: "destructive" }); return; }
    if (!confirm("Delete selected room?")) return;
    const res = await fetch(`${API}/api/buildings-rooms/rooms/${rowId}`, { method: "DELETE" });
    const result = await res.json().catch(() => ({}));
    if (!res.ok) { toast({ title: "Delete failed", description: result?.error || "Failed to delete room.", variant: "destructive" }); return; }
    setSelectedRoomId(null);
    toast({ title: "Deleted", description: "Room deleted." });
    await loadRooms(); await loadTree();
  };

  /* ══════════════════ JSX ══════════════════ */
  return (
    <div className="h-full bg-background relative overflow-x-hidden">
      <div className="w-full px-2 pt-2 pb-4">
        {/* ── Page header ── */}
        <div className="mb-5 flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h1 className="setup-type-page-title">Buildings &amp; Rooms</h1>
            <p className="setup-type-page-desc">
              Manage buildings, floors, and rooms across all campuses.
            </p>
          </div>
          <div className="hidden sm:flex flex-col items-end gap-2">
            <div className="setup-type-kicker-pill flex h-9 items-center rounded-xl border border-border/60 bg-background/70 px-3 shadow-sm backdrop-blur">
              Setup Manager module
            </div>
            <div className="setup-type-kicker-pill rounded-xl border border-border/60 bg-muted/30 px-2.5 py-1">
              Enrollment System v2.0
            </div>
          </div>
        </div>

        {/* ── Module card ── */}
        <Card className="overflow-hidden rounded-2xl bg-background border-border/40 shadow-sm">
          <div className="px-4 py-3 flex flex-wrap items-center justify-between gap-3 border-b border-border/40 bg-muted/5">
            <div className="flex items-center gap-3 min-w-0">
              <div className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 p-2 rounded-xl border border-emerald-500/20 shadow-sm shrink-0">
                <Building2 className="h-4 w-4" />
              </div>
              <div className="leading-tight min-w-0">
                <div className="setup-type-module-title">Building &amp; room management</div>
                <div className="setup-type-module-sub">Organize physical spaces by campus, building, floor, and room</div>
              </div>
            </div>
            {/* Action buttons */}
            <div className="flex flex-wrap items-center gap-1.5">
              <Button
                type="button" size="sm"
                className="h-8 gap-1.5 text-xs rounded-lg shadow-sm bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={() => {
                  const firstCampus = campusOptions[0];
                  setBuildingForm({ campus_id: firstCampus?.refId ? String(firstCampus.refId) : "", building_name: "", popular_name: "", acronym: "", number_of_floors: "1", lan_ready: false });
                  setBuildingDialogMode("create"); setEditingBuildingId(null); setAddBuildingOpen(true);
                }}
              >
                <Plus className="h-3.5 w-3.5" /> New Building
              </Button>
              <Button
                type="button" variant="outline" size="sm"
                className="h-8 gap-1.5 text-xs rounded-lg border-border/60 shadow-sm"
                onClick={() => {
                  const selectedFloor = activeNode?.kind === "floor" && activeNode.refId ? activeNode : null;
                  let defaultCampusId = ""; let defaultBuildingId = ""; let defaultFloorId = selectedFloor?.refId ? String(selectedFloor.refId) : "";
                  if (selectedFloor?.refId) {
                    const building = campusOptions.flatMap((c) => c.children || []).find((b) => (b.children || []).some((f) => f.refId === selectedFloor.refId));
                    if (building?.refId) { defaultBuildingId = String(building.refId); const campus = campusOptions.find((c) => (c.children || []).some((b) => b.refId === building.refId)); if (campus?.refId) defaultCampusId = String(campus.refId); }
                  }
                  if (!defaultCampusId) { const firstCampus = campusOptions[0]; defaultCampusId = firstCampus?.refId ? String(firstCampus.refId) : ""; }
                  setRoomForm({ campus_id: defaultCampusId, building_id: defaultBuildingId, floor_id: defaultFloorId, room_no: "", room_name: "", room_type: "", capacity: "50", air_conditioned: false, fit_to_use: true, lan_member: false, night_class_allowed: false, shared: false });
                  setRoomDialogMode("create"); setEditingRoomId(null); setAddRoomOpen(true);
                }}
              >
                <DoorOpen className="h-3.5 w-3.5" /> New Room
              </Button>
              <Button type="button" variant="outline" size="sm" className="h-8 gap-1.5 text-xs rounded-lg border-border/60 shadow-sm" onClick={editRoom}
                disabled={!((activeNode?.kind === "building" && activeNode.refId) || (activeNode?.kind === "floor" && activeNode.refId) || selectedRoomId)}>
                <Pencil className="h-3.5 w-3.5" /> Edit
              </Button>
              <Button type="button" variant="outline" size="sm" className="h-8 gap-1.5 text-xs rounded-lg border-border/60 shadow-sm text-destructive hover:bg-destructive/10" onClick={deleteRoom}
                disabled={!((activeNode?.kind === "building" && activeNode.refId) || (activeNode?.kind === "floor" && activeNode.refId) || selectedRoomId)}>
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </Button>
              <Button type="button" variant="outline" size="sm" className="h-8 gap-1.5 text-xs rounded-lg border-border/60 shadow-sm" onClick={async () => { await loadTree(); await loadRooms(); }}>
                <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} /> Refresh
              </Button>
            </div>
          </div>

          <div className="p-3 bg-background/60">
            <div className="grid grid-cols-12 gap-3 min-h-[520px]">
              {/* ── Left: Tree panel ── */}
              <div className="col-span-12 lg:col-span-3 flex flex-col rounded-2xl bg-card border border-border/40 shadow-sm overflow-hidden min-h-0">
                <div className="setup-type-section-title shrink-0 border-b border-border/60 bg-muted/5 px-3 py-2.5 flex items-center gap-2">
                  <Building2 className="h-3.5 w-3.5 text-primary/60" />
                  Buildings &amp; Rooms
                </div>
                <div className="px-2 pt-2 pb-1.5">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50" />
                    <Input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="h-8 pl-8 rounded-lg text-xs border-border/60 bg-background shadow-sm"
                      placeholder="Search rooms..."
                    />
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto overflow-x-hidden py-1">
                  {treeData.map((node) => (
                    <TreeItem
                      key={node.id}
                      node={node}
                      activeId={activeNode?.id || ""}
                      expandedIds={expandedIds}
                      onToggleExpand={toggleExpand}
                      onSelect={setActiveNode}
                      onDoubleSelect={(n) => {
                        setActiveNode(n);
                        if (n.kind === "building") openBuildingEditDialog(n);
                        if (n.kind === "floor") openFloorEditDialog(n);
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* ── Right: Room table ── */}
              <div className="col-span-12 lg:col-span-9 flex flex-col rounded-2xl bg-card border border-border/40 shadow-sm overflow-hidden min-h-0">
                <div className="setup-type-section-title shrink-0 border-b border-border/60 bg-muted/5 px-3 py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Layers className="h-3.5 w-3.5 text-primary/60" />
                    <span>{rightTitle}</span>
                  </div>
                  <span className="text-[10px] font-normal text-muted-foreground">
                    {filteredRows.length} room{filteredRows.length !== 1 ? "s" : ""}
                  </span>
                </div>
                <div className="flex-1 overflow-auto bg-background">
                  <table className="w-full text-[11px] border-collapse min-w-[820px]">
                    <thead>
                      <tr className="sticky top-0 z-10 border-b border-border/60 bg-muted/50 shadow-sm">
                        {["Room No.", "Room Name", "Type", "Capacity", "A/C", "Active", "LAN", "Night", "Shared"].map((h) => (
                          <th key={h} className="setup-type-table-header border-r border-border/60 px-2 py-2 text-left last:border-r-0">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr>
                          <td colSpan={9} className="px-4 py-8 text-center">
                            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                              <Loader2 className="h-4 w-4 animate-spin" /> Loading rooms…
                            </div>
                          </td>
                        </tr>
                      ) : filteredRows.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="px-4 py-12 text-center text-sm text-muted-foreground italic">
                            {activeNode?.kind === "floor" ? "No rooms on this floor" : "Select a floor to view rooms"}
                          </td>
                        </tr>
                      ) : (
                        filteredRows.map((r, idx) => (
                          <tr
                            key={r.id}
                            onClick={() => setSelectedRoomId(r.id)}
                            onDoubleClick={() => { setSelectedRoomId(r.id); openRoomEditDialog(r); }}
                            role="button" tabIndex={0}
                            onKeyDown={(ev) => { if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); setSelectedRoomId(r.id); } }}
                            className={cn(
                              "premium-row cursor-pointer border-b border-border/40 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
                              idx % 2 === 1 && "bg-muted/10",
                              selectedRoomId === r.id && "bg-emerald-500/10 font-medium ring-1 ring-inset ring-emerald-500/15"
                            )}
                          >
                            <td className="setup-font-mono-data border-r border-border/50 px-2 py-1.5">{r.room_no}</td>
                            <td className="px-2 py-1.5 border-r border-border/50 font-medium text-foreground">{r.room_name}</td>
                            <td className="px-2 py-1.5 border-r border-border/50 text-muted-foreground">{r.room_type || "—"}</td>
                            <td className="px-2 py-1.5 border-r border-border/50 tabular-nums text-center font-mono">{r.capacity}</td>
                            <td className="px-2 py-1.5 border-r border-border/50 text-center"><BoolBadge value={r.air_conditioned} /></td>
                            <td className="px-2 py-1.5 border-r border-border/50 text-center"><BoolBadge value={r.fit_to_use} /></td>
                            <td className="px-2 py-1.5 border-r border-border/50 text-center"><BoolBadge value={r.lan_member} /></td>
                            <td className="px-2 py-1.5 border-r border-border/50 text-center"><BoolBadge value={r.night_class_allowed} /></td>
                            <td className="px-2 py-1.5 text-center"><BoolBadge value={r.shared} /></td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* ══════════════════ Building Dialog ══════════════════ */}
      <Dialog open={addBuildingOpen} onOpenChange={setAddBuildingOpen}>
        <DialogContent className="max-w-[720px] p-0 gap-0 overflow-hidden rounded-2xl" aria-describedby={undefined}>
          <DialogHeader className="px-5 py-3.5 border-b border-border/60 bg-muted/5">
            <DialogTitle className="text-sm font-semibold">
              {buildingDialogMode === "edit" ? "Edit Building" : "Add New Building"}
            </DialogTitle>
          </DialogHeader>
          <div className="p-5 space-y-3.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1">
                <Label className="text-[11px] font-medium text-muted-foreground">Campus</Label>
                <Select value={buildingForm.campus_id || "__none__"} onValueChange={(v) => setBuildingForm((s) => ({ ...s, campus_id: v === "__none__" ? "" : v }))}>
                  <SelectTrigger className="h-10 rounded-xl text-xs border-border/60 shadow-sm bg-background"><SelectValue placeholder="Select campus" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Select campus</SelectItem>
                    {campusOptions.map((c) => (<SelectItem key={c.id} value={String(c.refId)}>{c.label}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-[11px] font-medium text-muted-foreground">Acronym</Label>
                <Input className="h-10 rounded-xl text-xs border-border/60 shadow-sm" placeholder="e.g. SCI" value={buildingForm.acronym} onChange={(e) => setBuildingForm((s) => ({ ...s, acronym: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-[11px] font-medium text-muted-foreground">Building Name</Label>
              <Input className="h-10 rounded-xl text-xs border-border/60 shadow-sm" placeholder="e.g. Science Building" value={buildingForm.building_name} onChange={(e) => setBuildingForm((s) => ({ ...s, building_name: e.target.value }))} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1">
                <Label className="text-[11px] font-medium text-muted-foreground">Popular Name</Label>
                <Input className="h-10 rounded-xl text-xs border-border/60 shadow-sm" value={buildingForm.popular_name} onChange={(e) => setBuildingForm((s) => ({ ...s, popular_name: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px] font-medium text-muted-foreground">Number of Floors</Label>
                <Input className="h-10 rounded-xl text-xs border-border/60 shadow-sm font-mono w-24" value={buildingForm.number_of_floors} onChange={(e) => setBuildingForm((s) => ({ ...s, number_of_floors: e.target.value }))} />
              </div>
            </div>
            <label className="flex items-center gap-2 text-xs cursor-pointer">
              <input type="checkbox" className="accent-primary rounded" checked={buildingForm.lan_ready} onChange={(e) => setBuildingForm((s) => ({ ...s, lan_ready: e.target.checked }))} />
              <span className="text-muted-foreground">LAN Ready (wired internally)</span>
            </label>
            <div className="flex items-center gap-2 pt-2 border-t border-border/60">
              <Button className="h-9 rounded-lg shadow-sm" onClick={() => submitBuilding(false)}>Save</Button>
              {buildingDialogMode === "create" && (<Button className="h-9 rounded-lg shadow-sm" variant="secondary" onClick={() => submitBuilding(true)}>Save &amp; Add Another</Button>)}
              <div className="flex-1" />
              <Button variant="outline" className="h-9 rounded-lg border-border/60" onClick={() => setAddBuildingOpen(false)}>Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ══════════════════ Room Dialog ══════════════════ */}
      <Dialog open={addRoomOpen} onOpenChange={setAddRoomOpen}>
        <DialogContent className="max-w-[720px] p-0 gap-0 overflow-hidden rounded-2xl" aria-describedby={undefined}>
          <DialogHeader className="px-5 py-3.5 border-b border-border/60 bg-muted/5">
            <DialogTitle className="text-sm font-semibold">
              {roomDialogMode === "edit" ? "Edit Room" : "Add New Room"}
            </DialogTitle>
          </DialogHeader>
          <div className="p-5 space-y-3.5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div className="space-y-1">
                <Label className="text-[11px] font-medium text-muted-foreground">Campus</Label>
                <Select value={roomForm.campus_id || "__none__"} onValueChange={(v) => setRoomForm((s) => ({ ...s, campus_id: v === "__none__" ? "" : v, building_id: "", floor_id: "" }))}>
                  <SelectTrigger className="h-10 rounded-xl text-xs border-border/60 shadow-sm bg-background"><SelectValue placeholder="Select campus" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Select campus</SelectItem>
                    {campusOptions.map((c) => (<SelectItem key={c.id} value={String(c.refId)}>{c.label}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-[11px] font-medium text-muted-foreground">Building</Label>
                <Select value={roomForm.building_id || "__none__"} onValueChange={(v) => setRoomForm((s) => ({ ...s, building_id: v === "__none__" ? "" : v, floor_id: "" }))}>
                  <SelectTrigger className="h-10 rounded-xl text-xs border-border/60 shadow-sm bg-background"><SelectValue placeholder="Select building" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Select building</SelectItem>
                    {buildingOptions.map((b) => (<SelectItem key={b.id} value={String(b.refId)}>{b.label}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-[11px] font-medium text-muted-foreground">Floor</Label>
                <Select value={roomForm.floor_id || "__none__"} onValueChange={(v) => setRoomForm((s) => ({ ...s, floor_id: v === "__none__" ? "" : v }))}>
                  <SelectTrigger className="h-10 rounded-xl text-xs border-border/60 shadow-sm bg-background"><SelectValue placeholder="Floor" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Floor</SelectItem>
                    {floorOptions.map((f) => (<SelectItem key={f.id} value={String(f.refId)}>{f.label}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1">
                <Label className="text-[11px] font-medium text-muted-foreground">Room No.</Label>
                <Input className="h-10 rounded-xl text-xs border-border/60 shadow-sm font-mono" value={roomForm.room_no} onChange={(e) => setRoomForm((s) => ({ ...s, room_no: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px] font-medium text-muted-foreground">Room Name</Label>
                <Input className="h-10 rounded-xl text-xs border-border/60 shadow-sm" value={roomForm.room_name} onChange={(e) => setRoomForm((s) => ({ ...s, room_name: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1">
                <Label className="text-[11px] font-medium text-muted-foreground">Room Type</Label>
                <Input className="h-10 rounded-xl text-xs border-border/60 shadow-sm" value={roomForm.room_type} onChange={(e) => setRoomForm((s) => ({ ...s, room_type: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px] font-medium text-muted-foreground">Capacity</Label>
                <Input className="h-10 rounded-xl text-xs border-border/60 shadow-sm font-mono w-24" value={roomForm.capacity} onChange={(e) => setRoomForm((s) => ({ ...s, capacity: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2 rounded-xl border border-border/60 bg-muted/10 p-3">
              {[
                { key: "air_conditioned" as const, label: "Air Conditioned" },
                { key: "fit_to_use" as const, label: "Fit to Use / Active" },
                { key: "lan_member" as const, label: "LAN Member" },
                { key: "night_class_allowed" as const, label: "Night Class Allowed" },
                { key: "shared" as const, label: "Shared" },
              ].map(({ key, label }) => (
                <label key={key} className="flex items-center gap-2 text-xs cursor-pointer text-muted-foreground hover:text-foreground transition-colors">
                  <input type="checkbox" className="accent-primary rounded" checked={roomForm[key] as boolean} onChange={(e) => setRoomForm((s) => ({ ...s, [key]: e.target.checked }))} />
                  {label}
                </label>
              ))}
            </div>
            <div className="flex items-center gap-2 pt-2 border-t border-border/60">
              <Button className="h-9 rounded-lg shadow-sm" onClick={async () => { await submitRoom(); setAddRoomOpen(false); }}>Save</Button>
              {roomDialogMode === "create" && (
                <Button className="h-9 rounded-lg shadow-sm" variant="secondary" onClick={async () => {
                  await submitRoom();
                  setRoomForm((s) => ({ ...s, room_no: "", room_name: "", room_type: "", capacity: "50", air_conditioned: false, fit_to_use: true, lan_member: false, night_class_allowed: false, shared: false }));
                }}>Save &amp; Add Another</Button>
              )}
              <div className="flex-1" />
              <Button variant="outline" className="h-9 rounded-lg border-border/60" onClick={() => setAddRoomOpen(false)}>Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ══════════════════ Floor Dialog ══════════════════ */}
      <Dialog open={addFloorOpen} onOpenChange={setAddFloorOpen}>
        <DialogContent className="max-w-[480px] p-0 gap-0 overflow-hidden rounded-2xl border border-border/40 shadow-sm" aria-describedby={undefined}>
          <DialogHeader className="px-5 py-3.5 border-b border-border/60 bg-muted/5">
            <DialogTitle className="text-sm font-semibold">
              {floorDialogMode === "edit" ? "Edit Floor" : "Add New Floor"}
            </DialogTitle>
          </DialogHeader>
          <div className="p-5 space-y-3.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1">
                <Label className="text-[11px] font-medium text-muted-foreground">Campus</Label>
                <Select value={floorForm.campus_id || "__none__"} disabled>
                  <SelectTrigger className="h-10 rounded-xl text-xs border-border/60 shadow-sm bg-background"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Select campus</SelectItem>
                    {campusOptions.map((c) => (<SelectItem key={c.id} value={String(c.refId)}>{c.label}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-[11px] font-medium text-muted-foreground">Building</Label>
                <Select value={floorForm.building_id || "__none__"} disabled>
                  <SelectTrigger className="h-10 rounded-xl text-xs border-border/60 shadow-sm bg-background"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Select building</SelectItem>
                    {buildingOptionsForFloor.map((b) => (<SelectItem key={b.id} value={String(b.refId)}>{b.label}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-[11px] font-medium text-muted-foreground">Floor Name</Label>
              <Input className="h-10 rounded-xl text-xs border-border/60 shadow-sm" value={floorForm.floor_name} onChange={(e) => setFloorForm((s) => ({ ...s, floor_name: e.target.value }))} />
            </div>
            <div className="flex items-center gap-2 pt-2 border-t border-border/60">
              <Button className="h-9 rounded-lg shadow-sm" onClick={submitFloor}>Save</Button>
              <div className="flex-1" />
              <Button variant="outline" className="h-9 rounded-lg border-border/60" onClick={() => setAddFloorOpen(false)}>Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
