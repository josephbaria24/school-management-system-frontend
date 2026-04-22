 "use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Home,
  Pencil,
  Plus,
  RefreshCw,
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
  return (
    <div>
      <div
        className={cn(
          "w-full flex items-center gap-1 text-[11px] py-0.5 hover:bg-[#dcf6ea]",
          activeId === node.id && "bg-[#c8efd9] font-semibold"
        )}
        style={{ paddingLeft: `${4 + level * 14}px` }}
      >
        <button
          type="button"
          className={cn(
            "h-4 w-4 grid place-items-center text-[#1f7a57]",
            !hasChildren && "opacity-30 cursor-default"
          )}
          onClick={() => hasChildren && onToggleExpand(node.id)}
          aria-label={expanded ? "Collapse" : "Expand"}
        >
          {hasChildren ? (
            expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />
          ) : (
            <span className="h-3 w-3" />
          )}
        </button>
        <button
          type="button"
          onClick={() => onSelect(node)}
          onDoubleClick={() => onDoubleSelect(node)}
          className="flex items-center gap-1.5 text-left flex-1"
        >
          {hasChildren ? (
            <Building2 className="h-3 w-3 text-[#1f7a57]" />
          ) : (
            <Home className="h-3 w-3 text-[#1f7a57]" />
          )}
          <span className="truncate">{node.label}</span>
        </button>
      </div>
      {hasChildren && expanded &&
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

  useEffect(() => {
    loadTree();
  }, [loadTree]);

  useEffect(() => {
    loadRooms();
  }, [loadRooms]);

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

  const submitBuilding = async (saveAndAnother = false) => {
    const campusId = parseInt(buildingForm.campus_id, 10);
    if (!Number.isFinite(campusId) || !buildingForm.building_name.trim()) {
      toast({
        title: "Validation error",
        description: "Campus and Building Name are required.",
        variant: "destructive",
      });
      return;
    }
    const endpoint =
      buildingDialogMode === "edit" && editingBuildingId
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
      toast({
        title: "Save failed",
        description: result?.error || "Failed to save building.",
        variant: "destructive",
      });
      return;
    }
    await loadTree();
    toast({
      title: "Saved",
      description: buildingDialogMode === "edit" ? "Building updated." : "Building saved.",
    });
    if (buildingDialogMode === "edit") {
      setAddBuildingOpen(false);
      return;
    }
    if (saveAndAnother) {
      setBuildingForm((s) => ({
        ...s,
        building_name: "",
        popular_name: "",
        acronym: "",
        number_of_floors: "1",
        lan_ready: false,
      }));
      return;
    }
    setAddBuildingOpen(false);
  };

  const submitRoom = async () => {
    const floorId = parseInt(roomForm.floor_id, 10);
    if (!Number.isFinite(floorId) || !roomForm.room_no.trim() || !roomForm.room_name.trim()) {
      toast({
        title: "Validation error",
        description: "Floor location, room no, and room name are required.",
        variant: "destructive",
      });
      return;
    }
    const capacity = Number(roomForm.capacity || "0");
    const endpoint =
      roomDialogMode === "edit" && editingRoomId
        ? `${API}/api/buildings-rooms/rooms/${editingRoomId}`
        : `${API}/api/buildings-rooms/rooms`;
    const res = await fetch(endpoint, {
      method: roomDialogMode === "edit" ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        floor_id: floorId,
        room_no: roomForm.room_no.trim(),
        room_name: roomForm.room_name.trim(),
        room_type: roomForm.room_type.trim() || null,
        capacity: Number.isFinite(capacity) ? capacity : 0,
        air_conditioned: roomForm.air_conditioned,
        fit_to_use: roomForm.fit_to_use,
        lan_member: roomForm.lan_member,
        night_class_allowed: roomForm.night_class_allowed,
        shared: roomForm.shared,
      }),
    });
    const result = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast({
        title: "Save failed",
        description: result?.error || "Failed to save room.",
        variant: "destructive",
      });
      return;
    }
    await loadRooms();
    await loadTree();
    toast({
      title: "Saved",
      description: roomDialogMode === "edit" ? "Room updated." : "Room saved.",
    });
  };

  const submitFloor = async () => {
    if (!editingFloorId || !floorForm.floor_name.trim()) {
      toast({
        title: "Validation error",
        description: "Floor name is required.",
        variant: "destructive",
      });
      return;
    }
    const res = await fetch(`${API}/api/buildings-rooms/floors/${editingFloorId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ floor_name: floorForm.floor_name.trim() }),
    });
    const result = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast({
        title: "Save failed",
        description: result?.error || "Failed to save floor.",
        variant: "destructive",
      });
      return;
    }
    toast({ title: "Saved", description: "Floor updated." });
    setAddFloorOpen(false);
    await loadTree();
  };

  const openBuildingEditDialog = (node: TreeNode) => {
    if (node.kind !== "building" || !node.refId) return;
    const campus = campusOptions.find((c) =>
      (c.children || []).some((b) => b.refId === node.refId)
    );
    const building = (campus?.children || []).find((b) => b.refId === node.refId);
    const floorCount = (building?.children || []).length;
    setBuildingDialogMode("edit");
    setEditingBuildingId(node.refId);
    setBuildingForm({
      campus_id: campus?.refId ? String(campus.refId) : "",
      building_name: node.label,
      popular_name: "",
      acronym: "",
      number_of_floors: String(Math.max(1, floorCount || 1)),
      lan_ready: false,
    });
    setAddBuildingOpen(true);
  };

  const openFloorEditDialog = (node: TreeNode) => {
    if (node.kind !== "floor" || !node.refId) return;
    const building = campusOptions
      .flatMap((c) => c.children || [])
      .find((b) => (b.children || []).some((f) => f.refId === node.refId));
    const campus = campusOptions.find((c) =>
      (c.children || []).some((b) => b.refId === building?.refId)
    );
    setFloorDialogMode("edit");
    setEditingFloorId(node.refId);
    setFloorForm({
      campus_id: campus?.refId ? String(campus.refId) : "",
      building_id: building?.refId ? String(building.refId) : "",
      floor_name: node.label.replace(/\s*\(\d+\)\s*$/, ""),
    });
    setAddFloorOpen(true);
  };

  const openRoomEditDialog = (row: RoomRow) => {
    const building = campusOptions
      .flatMap((c) => c.children || [])
      .find((b) => (b.children || []).some((f) => f.refId === row.floor_id));
    const campus = campusOptions.find((c) =>
      (c.children || []).some((b) => b.refId === building?.refId)
    );
    setRoomDialogMode("edit");
    setEditingRoomId(row.id);
    setRoomForm({
      campus_id: campus?.refId ? String(campus.refId) : "",
      building_id: building?.refId ? String(building.refId) : "",
      floor_id: String(row.floor_id),
      room_no: row.room_no,
      room_name: row.room_name,
      room_type: row.room_type || "",
      capacity: String(row.capacity ?? 0),
      air_conditioned: !!row.air_conditioned,
      fit_to_use: !!row.fit_to_use,
      lan_member: !!row.lan_member,
      night_class_allowed: !!row.night_class_allowed,
      shared: !!row.shared,
    });
    setAddRoomOpen(true);
  };

  const editRoom = async () => {
    if (activeNode?.kind === "building" && activeNode.refId) {
      openBuildingEditDialog(activeNode);
      return;
    }
    if (activeNode?.kind === "floor" && activeNode.refId) {
      openFloorEditDialog(activeNode);
      return;
    }
    const row = rows.find((r) => r.id === selectedRoomId) ?? rows[0];
    if (!row) {
      toast({
        title: "No selection",
        description: "Select a room to edit.",
        variant: "destructive",
      });
      return;
    }
    openRoomEditDialog(row);
  };

  const deleteRoom = async () => {
    if (activeNode?.kind === "building" && activeNode.refId) {
      if (!confirm("Delete selected building and all its floors/rooms?")) return;
      const res = await fetch(`${API}/api/buildings-rooms/buildings/${activeNode.refId}`, {
        method: "DELETE",
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast({
          title: "Delete failed",
          description: result?.error || "Failed to delete building.",
          variant: "destructive",
        });
        return;
      }
      toast({ title: "Deleted", description: "Building deleted." });
      setActiveNode(null);
      setSelectedRoomId(null);
      await loadTree();
      await loadRooms();
      return;
    }
    if (activeNode?.kind === "floor" && activeNode.refId) {
      if (!confirm("Delete selected floor and all its rooms?")) return;
      const res = await fetch(`${API}/api/buildings-rooms/floors/${activeNode.refId}`, {
        method: "DELETE",
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast({
          title: "Delete failed",
          description: result?.error || "Failed to delete floor.",
          variant: "destructive",
        });
        return;
      }
      toast({ title: "Deleted", description: "Floor deleted." });
      setActiveNode(null);
      setSelectedRoomId(null);
      await loadTree();
      await loadRooms();
      return;
    }
    const rowId = selectedRoomId ?? rows[0]?.id ?? null;
    if (!rowId) {
      toast({
        title: "No selection",
        description: "Select a room to delete.",
        variant: "destructive",
      });
      return;
    }
    if (!confirm("Delete selected room?")) return;
    const res = await fetch(`${API}/api/buildings-rooms/rooms/${rowId}`, {
      method: "DELETE",
    });
    const result = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast({
        title: "Delete failed",
        description: result?.error || "Failed to delete room.",
        variant: "destructive",
      });
      return;
    }
    setSelectedRoomId(null);
    toast({ title: "Deleted", description: "Room deleted." });
    await loadRooms();
    await loadTree();
  };

  const campusOptions = useMemo(
    () =>
      treeData
        .flatMap((i) => i.children || [])
        .filter((n) => n.kind === "campus" && n.refId),
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

  return (
    <div className="h-full bg-[#f2fbf7] p-1">
      <div className="border border-[#79b898] bg-white">
        <div className="bg-gradient-to-b from-[#def8ea] to-[#9fdbbc] border-b border-[#79b898] px-2 py-1">
          <h1 className="text-[28px] leading-none tracking-tight text-[#1f5e45] font-semibold">
            BUILDINGS AND ROOMS
          </h1>
          <p className="text-[11px] text-[#35684f] -mt-0.5">
            Use this module to add, edit and delete building and rooms.....
          </p>
        </div>

        <div className="grid grid-cols-12 min-h-[520px]">
          <div className="col-span-12 lg:col-span-3 border-r border-[#79b898]">
            <div className="bg-gradient-to-b from-[#6ec79b] to-[#2f9b68] text-white text-[11px] px-1 py-0.5">
              Buildings And Rooms
            </div>
            <div className="p-1 border-b border-[#cfe6da]">
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-6 text-[11px]"
                placeholder="Search rooms"
              />
            </div>
            <div className="h-[455px] overflow-auto bg-white">
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

          <div className="col-span-12 lg:col-span-9">
            <div className="bg-gradient-to-b from-[#ffe9ac] to-[#eecf76] border-b border-[#c9ab56] px-1 py-0.5 text-[11px] font-semibold">
              {rightTitle}
            </div>
            <div className="flex items-center gap-1 p-1 border-b border-[#79b898] bg-gradient-to-b from-[#e4f8ee] to-[#9ed9c1] flex-wrap">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-6 px-2 text-[10px] border-[#9ed9c1] bg-white"
                onClick={() => {
                  const firstCampus = campusOptions[0];
                  setBuildingForm({
                    campus_id: firstCampus?.refId ? String(firstCampus.refId) : "",
                    building_name: "",
                    popular_name: "",
                    acronym: "",
                    number_of_floors: "1",
                    lan_ready: false,
                  });
                  setBuildingDialogMode("create");
                  setEditingBuildingId(null);
                  setAddBuildingOpen(true);
                }}
              >
                <Plus className="h-3 w-3" />
                Create New Building
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-6 px-2 text-[10px] border-[#9ed9c1] bg-white"
                onClick={() => {
                  const selectedFloor =
                    activeNode?.kind === "floor" && activeNode.refId ? activeNode : null;
                  let defaultCampusId = "";
                  let defaultBuildingId = "";
                  let defaultFloorId = selectedFloor?.refId ? String(selectedFloor.refId) : "";
                  if (selectedFloor?.refId) {
                    const building = campusOptions
                      .flatMap((c) => c.children || [])
                      .find((b) => (b.children || []).some((f) => f.refId === selectedFloor.refId));
                    if (building?.refId) {
                      defaultBuildingId = String(building.refId);
                      const campus = campusOptions.find((c) =>
                        (c.children || []).some((b) => b.refId === building.refId)
                      );
                      if (campus?.refId) defaultCampusId = String(campus.refId);
                    }
                  }
                  if (!defaultCampusId) {
                    const firstCampus = campusOptions[0];
                    defaultCampusId = firstCampus?.refId ? String(firstCampus.refId) : "";
                  }
                  setRoomForm({
                    campus_id: defaultCampusId,
                    building_id: defaultBuildingId,
                    floor_id: defaultFloorId,
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
                  setRoomDialogMode("create");
                  setEditingRoomId(null);
                  setAddRoomOpen(true);
                }}
              >
                <Plus className="h-3 w-3" />
                Create New Room
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-6 px-2 text-[10px] border-[#9ed9c1] bg-white"
                onClick={editRoom}
                disabled={
                  !(
                    (activeNode?.kind === "building" && activeNode.refId) ||
                    (activeNode?.kind === "floor" && activeNode.refId) ||
                    selectedRoomId
                  )
                }
              >
                <Pencil className="h-3 w-3" />
                Edit
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-6 px-2 text-[10px] border-[#9ed9c1] bg-white"
                onClick={deleteRoom}
                disabled={
                  !(
                    (activeNode?.kind === "building" && activeNode.refId) ||
                    (activeNode?.kind === "floor" && activeNode.refId) ||
                    selectedRoomId
                  )
                }
              >
                <Trash2 className="h-3 w-3" />
                Delete
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-6 px-2 text-[10px] border-[#9ed9c1] bg-white"
                onClick={async () => {
                  await loadTree();
                  await loadRooms();
                }}
              >
                <RefreshCw className="h-3 w-3" />
                Refresh
              </Button>
            </div>
            <div className="overflow-auto h-[482px]">
              <table className="w-full text-[11px] border-collapse min-w-[820px]">
                <thead>
                  <tr className="bg-gradient-to-b from-[#6ec79b] to-[#2f9b68] text-white">
                    {[
                      "Room No.",
                      "Room Name",
                      "Type",
                      "Capacity",
                      "Air Conditioned",
                      "Fit to Use",
                      "LAN Member",
                      "Night Class Allowed",
                      "Shared",
                    ].map((h) => (
                      <th key={h} className="px-1 py-0.5 text-left border-r border-white/35 text-[10px] font-bold">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={9} className="px-2 py-2 text-muted-foreground">
                        Loading...
                      </td>
                    </tr>
                  ) : (
                    filteredRows.map((r, idx) => (
                    <tr
                      key={r.id}
                      onClick={() => setSelectedRoomId(r.id)}
                      onDoubleClick={() => {
                        setSelectedRoomId(r.id);
                        openRoomEditDialog(r);
                      }}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(ev) => {
                        if (ev.key === "Enter" || ev.key === " ") {
                          ev.preventDefault();
                          setSelectedRoomId(r.id);
                        }
                      }}
                      className={cn(
                        "cursor-pointer",
                        idx % 2 ? "bg-[#f8fdf9]" : "bg-white",
                        selectedRoomId === r.id && "bg-[#c8efd9]"
                      )}
                    >
                      <td className="px-1 py-0.5 border border-[#d4e8dc]">{r.room_no}</td>
                      <td className="px-1 py-0.5 border border-[#d4e8dc]">{r.room_name}</td>
                      <td className="px-1 py-0.5 border border-[#d4e8dc]">{r.room_type || ""}</td>
                      <td className="px-1 py-0.5 border border-[#d4e8dc]">{r.capacity}</td>
                      <td className="px-1 py-0.5 border border-[#d4e8dc]">
                        <input type="checkbox" checked={r.air_conditioned} readOnly />
                      </td>
                      <td className="px-1 py-0.5 border border-[#d4e8dc]">
                        <input type="checkbox" checked={r.fit_to_use} readOnly />
                      </td>
                      <td className="px-1 py-0.5 border border-[#d4e8dc]">
                        <input type="checkbox" checked={r.lan_member} readOnly />
                      </td>
                      <td className="px-1 py-0.5 border border-[#d4e8dc]">
                        <input type="checkbox" checked={r.night_class_allowed} readOnly />
                      </td>
                      <td className="px-1 py-0.5 border border-[#d4e8dc]">
                        <input type="checkbox" checked={r.shared} readOnly />
                      </td>
                    </tr>
                  )))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>
      <Dialog open={addBuildingOpen} onOpenChange={setAddBuildingOpen}>
        <DialogContent className="max-w-[780px] p-0 gap-0 overflow-hidden border-2 border-[#0e8f63]">
          <DialogHeader className="bg-gradient-to-b from-[#16b67a] to-[#0f8f62] text-white px-3 py-1 border-b border-[#0c7752]">
            <DialogTitle className="text-base">
              {buildingDialogMode === "edit" ? "Edit Building" : "Add New Building"}
            </DialogTitle>
          </DialogHeader>
          <div className="p-3 bg-white grid grid-cols-12 gap-3">
            <div className="col-span-9 border border-[#9ed9c1] p-3 space-y-2">
              <div className="grid grid-cols-[110px_1fr] items-center gap-2">
                <Label className="text-[12px]">Campus</Label>
                <Select
                  value={buildingForm.campus_id || "__none__"}
                  onValueChange={(v) =>
                    setBuildingForm((s) => ({ ...s, campus_id: v === "__none__" ? "" : v }))
                  }
                >
                  <SelectTrigger className="h-7 text-[12px]">
                    <SelectValue placeholder="Select campus" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Select campus</SelectItem>
                    {campusOptions.map((c) => (
                      <SelectItem key={c.id} value={String(c.refId)}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-[110px_1fr] items-center gap-2">
                <Label className="text-[12px]">Building Name</Label>
                <Input
                  className="h-7 text-[12px]"
                  value={buildingForm.building_name}
                  onChange={(e) =>
                    setBuildingForm((s) => ({ ...s, building_name: e.target.value }))
                  }
                />
              </div>
              <div className="grid grid-cols-[110px_1fr] items-center gap-2">
                <Label className="text-[12px]">Popular Name</Label>
                <Input
                  className="h-7 text-[12px]"
                  value={buildingForm.popular_name}
                  onChange={(e) =>
                    setBuildingForm((s) => ({ ...s, popular_name: e.target.value }))
                  }
                />
              </div>
              <div className="grid grid-cols-[110px_1fr] items-center gap-2">
                <Label className="text-[12px]">Acronym</Label>
                <Input
                  className="h-7 text-[12px]"
                  value={buildingForm.acronym}
                  onChange={(e) =>
                    setBuildingForm((s) => ({ ...s, acronym: e.target.value }))
                  }
                />
              </div>
              <div className="grid grid-cols-[110px_1fr] items-center gap-2">
                <Label className="text-[12px]">Number of Floors or Storeys</Label>
                <Input
                  className="h-7 text-[12px] w-20"
                  value={buildingForm.number_of_floors}
                  onChange={(e) =>
                    setBuildingForm((s) => ({ ...s, number_of_floors: e.target.value }))
                  }
                />
              </div>
              <div className="grid grid-cols-[110px_1fr] items-center gap-2">
                <Label className="text-[12px]">Local Area Network Ready</Label>
                <label className="flex items-center gap-2 text-[12px] text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={buildingForm.lan_ready}
                    onChange={(e) =>
                      setBuildingForm((s) => ({ ...s, lan_ready: e.target.checked }))
                    }
                  />
                  Put a checkmark if the Building/Facility is wired internally.
                </label>
              </div>
            </div>
            <div className="col-span-3 flex flex-col gap-2">
              <Button className="h-10" onClick={() => submitBuilding(false)}>
                Save
              </Button>
              {buildingDialogMode === "create" && (
                <Button className="h-10" variant="secondary" onClick={() => submitBuilding(true)}>
                  Save &amp; Add Another
                </Button>
              )}
              <div className="flex-1" />
              <Button variant="destructive" className="h-10" onClick={() => setAddBuildingOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={addRoomOpen} onOpenChange={setAddRoomOpen}>
        <DialogContent className="max-w-[820px] p-0 gap-0 overflow-hidden border-2 border-[#0e8f63]">
          <DialogHeader className="bg-gradient-to-b from-[#16b67a] to-[#0f8f62] text-white px-3 py-1 border-b border-[#0c7752]">
            <DialogTitle className="text-base">
              {roomDialogMode === "edit" ? "Edit Room" : "Add New Rooms"}
            </DialogTitle>
          </DialogHeader>
          <div className="p-3 bg-white grid grid-cols-12 gap-3">
            <div className="col-span-9 border border-[#9ed9c1] p-3 space-y-2">
              <div className="grid grid-cols-[100px_1fr] items-center gap-2">
                <Label className="text-[12px]">Campus</Label>
                <Select
                  value={roomForm.campus_id || "__none__"}
                  onValueChange={(v) =>
                    setRoomForm((s) => ({
                      ...s,
                      campus_id: v === "__none__" ? "" : v,
                      building_id: "",
                      floor_id: "",
                    }))
                  }
                >
                  <SelectTrigger className="h-7 text-[12px]">
                    <SelectValue placeholder="Select campus" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Select campus</SelectItem>
                    {campusOptions.map((c) => (
                      <SelectItem key={c.id} value={String(c.refId)}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-[100px_1fr] items-center gap-2">
                <Label className="text-[12px]">Building</Label>
                <Select
                  value={roomForm.building_id || "__none__"}
                  onValueChange={(v) =>
                    setRoomForm((s) => ({
                      ...s,
                      building_id: v === "__none__" ? "" : v,
                      floor_id: "",
                    }))
                  }
                >
                  <SelectTrigger className="h-7 text-[12px]">
                    <SelectValue placeholder="Select building" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Select building</SelectItem>
                    {buildingOptions.map((b) => (
                      <SelectItem key={b.id} value={String(b.refId)}>
                        {b.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-[100px_120px] items-center gap-2">
                <Label className="text-[12px]">Floor Location</Label>
                <Select
                  value={roomForm.floor_id || "__none__"}
                  onValueChange={(v) =>
                    setRoomForm((s) => ({ ...s, floor_id: v === "__none__" ? "" : v }))
                  }
                >
                  <SelectTrigger className="h-7 text-[12px]">
                    <SelectValue placeholder="Floor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Floor</SelectItem>
                    {floorOptions.map((f) => (
                      <SelectItem key={f.id} value={String(f.refId)}>
                        {f.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-[100px_160px] items-center gap-2">
                <Label className="text-[12px]">Room No.</Label>
                <Input
                  className="h-7 text-[12px]"
                  value={roomForm.room_no}
                  onChange={(e) => setRoomForm((s) => ({ ...s, room_no: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-[100px_1fr] items-center gap-2">
                <Label className="text-[12px]">Popular Name</Label>
                <Input
                  className="h-7 text-[12px]"
                  value={roomForm.room_name}
                  onChange={(e) => setRoomForm((s) => ({ ...s, room_name: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-[100px_1fr] items-center gap-2">
                <Label className="text-[12px]">Room Type</Label>
                <Input
                  className="h-7 text-[12px]"
                  value={roomForm.room_type}
                  onChange={(e) => setRoomForm((s) => ({ ...s, room_type: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid grid-cols-[100px_80px] items-center gap-2">
                  <Label className="text-[12px]">Capacity</Label>
                  <Input
                    className="h-7 text-[12px]"
                    value={roomForm.capacity}
                    onChange={(e) => setRoomForm((s) => ({ ...s, capacity: e.target.value }))}
                  />
                </div>
                <div />
                <label className="flex items-center gap-2 text-[12px]">
                  <span className="w-[100px]">Air Conditioned</span>
                  <input
                    type="checkbox"
                    checked={roomForm.air_conditioned}
                    onChange={(e) =>
                      setRoomForm((s) => ({ ...s, air_conditioned: e.target.checked }))
                    }
                  />
                </label>
                <label className="flex items-center gap-2 text-[12px]">
                  <span className="w-[100px]">Night Class Allowed</span>
                  <input
                    type="checkbox"
                    checked={roomForm.night_class_allowed}
                    onChange={(e) =>
                      setRoomForm((s) => ({ ...s, night_class_allowed: e.target.checked }))
                    }
                  />
                </label>
                <label className="flex items-center gap-2 text-[12px]">
                  <span className="w-[100px]">Fit to Use/Active</span>
                  <input
                    type="checkbox"
                    checked={roomForm.fit_to_use}
                    onChange={(e) =>
                      setRoomForm((s) => ({ ...s, fit_to_use: e.target.checked }))
                    }
                  />
                </label>
                <label className="flex items-center gap-2 text-[12px]">
                  <span className="w-[100px]">LAN Member</span>
                  <input
                    type="checkbox"
                    checked={roomForm.lan_member}
                    onChange={(e) =>
                      setRoomForm((s) => ({ ...s, lan_member: e.target.checked }))
                    }
                  />
                </label>
                <div />
                <label className="flex items-center gap-2 text-[12px]">
                  <span className="w-[100px]">Shared</span>
                  <input
                    type="checkbox"
                    checked={roomForm.shared}
                    onChange={(e) => setRoomForm((s) => ({ ...s, shared: e.target.checked }))}
                  />
                </label>
              </div>
            </div>
            <div className="col-span-3 flex flex-col gap-2">
              <Button
                className="h-10"
                onClick={async () => {
                  await submitRoom();
                  if (roomDialogMode === "edit") setAddRoomOpen(false);
                  else setAddRoomOpen(false);
                }}
              >
                Save
              </Button>
              {roomDialogMode === "create" && (
                <Button
                  className="h-10"
                  variant="secondary"
                  onClick={async () => {
                    await submitRoom();
                    setRoomForm((s) => ({
                      ...s,
                      room_no: "",
                      room_name: "",
                      room_type: "",
                      capacity: "50",
                      air_conditioned: false,
                      fit_to_use: true,
                      lan_member: false,
                      night_class_allowed: false,
                      shared: false,
                    }));
                  }}
                >
                  Save &amp; Add Another
                </Button>
              )}
              <div className="flex-1" />
              <Button variant="destructive" className="h-10" onClick={() => setAddRoomOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={addFloorOpen} onOpenChange={setAddFloorOpen}>
        <DialogContent className="max-w-[700px] p-0 gap-0 overflow-hidden border-2 border-[#0e8f63]">
          <DialogHeader className="bg-gradient-to-b from-[#16b67a] to-[#0f8f62] text-white px-3 py-1 border-b border-[#0c7752]">
            <DialogTitle className="text-base">
              {floorDialogMode === "edit" ? "Edit Floor" : "Add New Floor"}
            </DialogTitle>
          </DialogHeader>
          <div className="p-3 bg-white grid grid-cols-12 gap-3">
            <div className="col-span-9 border border-[#9ed9c1] p-3 space-y-2">
              <div className="grid grid-cols-[100px_1fr] items-center gap-2">
                <Label className="text-[12px]">Campus</Label>
                <Select value={floorForm.campus_id || "__none__"} disabled>
                  <SelectTrigger className="h-7 text-[12px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Select campus</SelectItem>
                    {campusOptions.map((c) => (
                      <SelectItem key={c.id} value={String(c.refId)}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-[100px_1fr] items-center gap-2">
                <Label className="text-[12px]">Building</Label>
                <Select value={floorForm.building_id || "__none__"} disabled>
                  <SelectTrigger className="h-7 text-[12px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Select building</SelectItem>
                    {buildingOptions.map((b) => (
                      <SelectItem key={b.id} value={String(b.refId)}>
                        {b.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-[100px_1fr] items-center gap-2">
                <Label className="text-[12px]">Floor Name</Label>
                <Input
                  className="h-7 text-[12px]"
                  value={floorForm.floor_name}
                  onChange={(e) =>
                    setFloorForm((s) => ({ ...s, floor_name: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="col-span-3 flex flex-col gap-2">
              <Button className="h-10" onClick={submitFloor}>
                Save
              </Button>
              <div className="flex-1" />
              <Button variant="destructive" className="h-10" onClick={() => setAddFloorOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

