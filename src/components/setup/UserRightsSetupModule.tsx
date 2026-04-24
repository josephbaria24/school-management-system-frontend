"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import {
  ChevronDown,
  ChevronRight,
  FolderOpen,
  Lock,
  LogOut,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  UserCog,
  UserRound,
  Users,
  Wallpaper,
  UserPlus2,
  ShieldAlert,
  HardDrive,
  Layout,
  KeyRound,
  Eye,
  Edit3,
  CheckCircle2,
  SearchCode,
  Hash,
  FileText,
  Loader2,
} from "lucide-react";

type UserRow = {
  id: string;
  employee_name: string;
  username: string;
  user_group: string;
  position_title: string;
  department: string;
  level: string;
  date_created?: string;
  logged_version?: string;
  logged_date?: string;
  computer_name?: string;
  ip_address?: string;
  mac_address?: string;
};

type EmployeeCandidate = {
  employee_id: string;
  employee_name: string;
  position_title: string;
  department: string;
};

type GroupRow = {
  id: number;
  name: string;
  description: string;
  wallpaper: string;
};

type PrivilegeRow = {
  id: number;
  module: string;
  description: string;
  read: boolean;
  write: boolean;
  delete: boolean;
  print: boolean;
  export: boolean;
  ref_id: string;
};

type PrivilegeDisplayRow =
  | (PrivilegeRow & { isModuleHeader: false })
  | {
      id: string;
      module: string;
      description: string;
      read: boolean;
      write: boolean;
      delete: boolean;
      print: boolean;
      export: boolean;
      ref_id: string;
      isModuleHeader: true;
    };

const API = process.env.NEXT_PUBLIC_API_URL;

export function UserRightsSetupModule() {
  const [activeTab, setActiveTab] = useState<"users" | "privileges">("users");
  const [search, setSearch] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [treeOpen, setTreeOpen] = useState({
    root: true,
    users: true,
    groups: true,
  });
  const [userRows, setUserRows] = useState<UserRow[]>([]);
  const [addUserOpen, setAddUserOpen] = useState(false);
  const [employeeRows, setEmployeeRows] = useState<EmployeeCandidate[]>([]);
  const [employeeLoading, setEmployeeLoading] = useState(false);
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [groupRows, setGroupRows] = useState<GroupRow[]>([]);
  const [groupPickerOpen, setGroupPickerOpen] = useState(false);
  const [editUsernameOpen, setEditUsernameOpen] = useState(false);
  const [usernameDraft, setUsernameDraft] = useState("");
  const [selectedGroupName, setSelectedGroupName] = useState<string>("");
  const [newGroupOpen, setNewGroupOpen] = useState(false);
  const [editGroupOpen, setEditGroupOpen] = useState(false);
  const [groupForm, setGroupForm] = useState({
    name: "",
    description: "",
    wallpaper: "",
  });
  const [groupPrivileges, setGroupPrivileges] = useState<Record<string, PrivilegeRow[]>>({});

  useEffect(() => {
    const loadData = async () => {
      if (!API) return;
      try {
        const [u, g] = await Promise.all([
          fetch(`${API}/api/user-rights/users`),
          fetch(`${API}/api/user-rights/groups`),
        ]);
        if (u.ok) {
          const users = (await u.json()) as UserRow[];
          setUserRows(users);
          if (users.length > 0 && !selectedUserId) setSelectedUserId(users[0].id);
        }
        if (g.ok) {
          const groups = (await g.json()) as GroupRow[];
          setGroupRows(groups);
          if (groups.length > 0) {
            setSelectedGroupName((curr) => curr || groups[0].name);
          }
        }
      } catch {
        // Keep empty-state UI if API is unavailable.
      }
    };
    loadData();
  }, []);

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return userRows;
    return userRows.filter(
      (u) =>
        u.employee_name.toLowerCase().includes(q) ||
        u.username.toLowerCase().includes(q) ||
        u.id.toLowerCase().includes(q)
    );
  }, [search, userRows]);

  const filteredGroups = useMemo(() => {
    const groups = groupRows.map((g) => g.name);
    const q = search.trim().toLowerCase();
    if (!q) return groups;
    return groups.filter((g) => g.toLowerCase().includes(q));
  }, [search, groupRows]);

  const selectedUser = useMemo(
    () => userRows.find((u) => u.id === selectedUserId) ?? null,
    [userRows, selectedUserId]
  );

  const activeGroupName = selectedGroupName || selectedUser?.user_group || "";
  const activeGroupPrivileges = useMemo(
    () => (activeGroupName ? groupPrivileges[activeGroupName] || [] : []),
    [activeGroupName, groupPrivileges]
  );
  const privilegeDisplayRows = useMemo<PrivilegeDisplayRow[]>(() => {
    const grouped = new Map<string, PrivilegeRow[]>();
    for (const row of activeGroupPrivileges) {
      const current = grouped.get(row.module) ?? [];
      current.push(row);
      grouped.set(row.module, current);
    }

    const rows: PrivilegeDisplayRow[] = [];
    for (const [module, moduleRows] of grouped.entries()) {
      rows.push({
        id: `module:${module}`,
        module,
        description: module,
        ref_id: `${module}-group`,
        read: moduleRows.every((r) => r.read),
        write: moduleRows.every((r) => r.write),
        delete: moduleRows.every((r) => r.delete),
        print: moduleRows.every((r) => r.print),
        export: moduleRows.every((r) => r.export),
        isModuleHeader: true,
      });
      for (const row of moduleRows) {
        rows.push({ ...row, isModuleHeader: false });
      }
    }
    return rows;
  }, [activeGroupPrivileges]);

  useEffect(() => {
    if (groupRows.length === 0) return;
    setGroupPrivileges((prev) => {
      const next: Record<string, PrivilegeRow[]> = {};
      for (const g of groupRows) {
        next[g.name] = prev[g.name] ? prev[g.name] : [];
      }
      return next;
    });
    setSelectedGroupName((curr) => {
      if (curr && groupRows.some((g) => g.name === curr)) return curr;
      return groupRows[0]?.name || "";
    });
  }, [groupRows]);

  useEffect(() => {
    if (!API || !selectedGroupName) return;
    const group = groupRows.find((g) => g.name === selectedGroupName);
    if (!group) return;
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch(`${API}/api/user-rights/groups/${group.id}/privileges`);
        if (!res.ok) throw new Error("Failed to load privileges");
        const rows = (await res.json()) as PrivilegeRow[];
        if (!cancelled) {
          setGroupPrivileges((prev) => ({ ...prev, [selectedGroupName]: rows }));
        }
      } catch {
        if (!cancelled) {
          setGroupPrivileges((prev) => ({ ...prev, [selectedGroupName]: [] }));
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedGroupName, groupRows]);

  const filteredEmployees = useMemo(() => {
    const q = employeeSearch.trim().toLowerCase();
    if (!q) return employeeRows;
    return employeeRows.filter(
      (e) =>
        e.employee_id.toLowerCase().includes(q) ||
        e.employee_name.toLowerCase().includes(q) ||
        e.position_title.toLowerCase().includes(q) ||
        e.department.toLowerCase().includes(q)
    );
  }, [employeeRows, employeeSearch]);

  const selectedEmployee = useMemo(
    () => employeeRows.find((e) => e.employee_id === selectedEmployeeId) ?? null,
    [employeeRows, selectedEmployeeId]
  );

  const makeNickname = (employeeName: string, employeeId: string) => {
    const token = employeeName
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .find(Boolean);
    return token || employeeId.toLowerCase();
  };

  const loadEmployees = async () => {
    if (!API) return;
    setEmployeeLoading(true);
    try {
      const res = await fetch(`${API}/api/employees`);
      if (!res.ok) throw new Error("Failed to load employees");
      const rows = (await res.json()) as Array<Record<string, unknown>>;
      const mapped: EmployeeCandidate[] = rows.map((r) => {
        const employee_id = String(r.employee_id ?? r.id ?? "");
        const fullName =
          String(r.full_name ?? "").trim() ||
          [
            String(r.last_name ?? "").trim(),
            String(r.first_name ?? "").trim(),
            String(r.middle_name ?? "").trim(),
            String(r.suffix ?? "").trim(),
          ]
            .filter(Boolean)
            .join(" ")
            .replace(/\s+/g, " ")
            .trim();
        return {
          employee_id,
          employee_name: fullName || employee_id || "Unknown Employee",
          position_title: String(
            r.position_title_ref ?? r.position_title ?? r.position_code_ref ?? ""
          ).trim(),
          department: String(r.department_name ?? r.department ?? "").trim(),
        };
      });
      setEmployeeRows(mapped.filter((m) => m.employee_id));
      if (mapped.length > 0) setSelectedEmployeeId(mapped[0].employee_id);
    } catch (err) {
      toast({
        title: "Load failed",
        description: err instanceof Error ? err.message : "Failed to load employees",
        variant: "destructive",
      });
    } finally {
      setEmployeeLoading(false);
    }
  };

  const openAddUserDialog = () => {
    setAddUserOpen(true);
    setEmployeeSearch("");
    setSelectedEmployeeId(null);
    void loadEmployees();
  };

  const createUserFromEmployee = () => {
    if (!selectedEmployee) {
      toast({
        title: "No employee selected",
        description: "Please select an employee from the list.",
        variant: "destructive",
      });
      return;
    }
    if (userRows.some((u) => u.id === selectedEmployee.employee_id)) {
      toast({
        title: "Already exists",
        description: "This employee already exists in users list.",
        variant: "destructive",
      });
      return;
    }
    if (!API) return;
    void (async () => {
      try {
        const res = await fetch(`${API}/api/user-rights/users`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ employee_id: selectedEmployee.employee_id }),
        });
        const result = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(result?.error || "Failed to create user");
        setUserRows((prev) => [result as UserRow, ...prev]);
        setSelectedUserId((result as UserRow).id);
        setAddUserOpen(false);
        toast({ title: "User created", description: "New user was added successfully." });
      } catch (err) {
        toast({
          title: "Create failed",
          description: err instanceof Error ? err.message : "Failed to create user",
          variant: "destructive",
        });
      }
    })();
  };

  const openGroupPicker = () => {
    if (!selectedUser) {
      toast({
        title: "No user selected",
        description: "Select a user first.",
        variant: "destructive",
      });
      return;
    }
    setSelectedGroupName(selectedUser.user_group || groupRows[0]?.name || "");
    setGroupPickerOpen(true);
  };

  const openEditUsernameDialog = () => {
    if (!selectedUser) {
      toast({
        title: "No user selected",
        description: "Select a user first.",
        variant: "destructive",
      });
      return;
    }
    setUsernameDraft(selectedUser.username || "");
    setEditUsernameOpen(true);
  };

  const saveEditedUsername = () => {
    if (!selectedUserId || !API) return;
    const username = usernameDraft.trim();
    if (!username) {
      toast({
        title: "Validation error",
        description: "Username is required.",
        variant: "destructive",
      });
      return;
    }

    void (async () => {
      try {
        const res = await fetch(`${API}/api/user-rights/users/${encodeURIComponent(selectedUserId)}/username`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username }),
        });
        const result = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(result?.error || "Failed to update username");

        setUserRows((prev) => prev.map((u) => (u.id === selectedUserId ? { ...u, username } : u)));
        setEditUsernameOpen(false);
        toast({ title: "Updated", description: "Username updated successfully." });
      } catch (err) {
        toast({
          title: "Update failed",
          description: err instanceof Error ? err.message : "Failed to update username",
          variant: "destructive",
        });
      }
    })();
  };

  const applySelectedGroup = () => {
    if (!selectedUserId || !selectedGroupName || !API) {
      setGroupPickerOpen(false);
      return;
    }
    const group = groupRows.find((g) => g.name === selectedGroupName);
    if (!group) return;
    void (async () => {
      try {
        const res = await fetch(`${API}/api/user-rights/users/${encodeURIComponent(selectedUserId)}/group`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ group_id: group.id }),
        });
        const result = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(result?.error || "Failed to update group");
        setUserRows((prev) =>
          prev.map((u) => (u.id === selectedUserId ? { ...u, user_group: selectedGroupName } : u))
        );
        setGroupPickerOpen(false);
        toast({ title: "Updated", description: "User group updated." });
      } catch (err) {
        toast({
          title: "Update failed",
          description: err instanceof Error ? err.message : "Failed to update group",
          variant: "destructive",
        });
      }
    })();
  };

  const openNewGroupDialog = () => {
    setGroupForm({ name: "", description: "", wallpaper: "" });
    setNewGroupOpen(true);
  };

  const createGroup = () => {
    const name = groupForm.name.trim();
    if (!name) {
      toast({
        title: "Validation error",
        description: "Group Name is required.",
        variant: "destructive",
      });
      return;
    }
    if (groupRows.some((g) => g.name.toLowerCase() === name.toLowerCase())) {
      toast({
        title: "Already exists",
        description: "Group already exists.",
        variant: "destructive",
      });
      return;
    }
    if (!API) return;
    void (async () => {
      try {
        const res = await fetch(`${API}/api/user-rights/groups`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            description: groupForm.description.trim(),
            wallpaper: groupForm.wallpaper.trim(),
          }),
        });
        const result = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(result?.error || "Failed to create group");
        const created = result as GroupRow;
        setGroupRows((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
        setSelectedGroupName(created.name);
        setNewGroupOpen(false);
        toast({ title: "Created", description: "Group created successfully." });
      } catch (err) {
        toast({
          title: "Create failed",
          description: err instanceof Error ? err.message : "Failed to create group",
          variant: "destructive",
        });
      }
    })();
  };

  const openEditGroupDialog = () => {
    const group = groupRows.find((g) => g.name === selectedGroupName);
    if (!group) {
      toast({
        title: "No group selected",
        description: "Select a group to edit.",
        variant: "destructive",
      });
      return;
    }
    setGroupForm({
      name: group.name,
      description: group.description,
      wallpaper: group.wallpaper,
    });
    setEditGroupOpen(true);
  };

  const saveEditedGroup = () => {
    const nextName = groupForm.name.trim();
    if (!nextName) {
      toast({
        title: "Validation error",
        description: "Group Name is required.",
        variant: "destructive",
      });
      return;
    }
    const oldName = selectedGroupName;
    if (!oldName) return;
    const group = groupRows.find((g) => g.name === oldName);
    if (!group || !API) return;
    const duplicate = groupRows.some(
      (g) => g.name.toLowerCase() === nextName.toLowerCase() && g.name !== oldName
    );
    if (duplicate) {
      toast({
        title: "Already exists",
        description: "Another group with this name already exists.",
        variant: "destructive",
      });
      return;
    }
    void (async () => {
      try {
        const res = await fetch(`${API}/api/user-rights/groups/${group.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: nextName,
            description: groupForm.description.trim(),
            wallpaper: groupForm.wallpaper.trim(),
          }),
        });
        const result = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(result?.error || "Failed to update group");
        const updated = result as GroupRow;
        setGroupRows((prev) =>
          prev.map((g) => (g.id === updated.id ? updated : g)).sort((a, b) => a.name.localeCompare(b.name))
        );
        setUserRows((prev) =>
          prev.map((u) => (u.user_group === oldName ? { ...u, user_group: updated.name } : u))
        );
        setSelectedGroupName(updated.name);
        setEditGroupOpen(false);
        toast({ title: "Updated", description: "Group updated successfully." });
      } catch (err) {
        toast({
          title: "Update failed",
          description: err instanceof Error ? err.message : "Failed to update group",
          variant: "destructive",
        });
      }
    })();
  };

  const deleteSelectedGroup = () => {
    const target = selectedGroupName.trim();
    if (!target) {
      toast({
        title: "No group selected",
        description: "Select a group to delete.",
        variant: "destructive",
      });
      return;
    }
    const group = groupRows.find((g) => g.name === target);
    if (!group || !API) return;
    if (!confirm(`Delete group "${target}"?`)) return;
    void (async () => {
      try {
        const res = await fetch(`${API}/api/user-rights/groups/${group.id}`, {
          method: "DELETE",
        });
        const result = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(result?.error || "Failed to delete group");
        setGroupRows((prev) => prev.filter((g) => g.id !== group.id));
        setGroupPrivileges((prev) => {
          const next = { ...prev };
          delete next[target];
          return next;
        });
        setUserRows((prev) =>
          prev.map((u) => (u.user_group === target ? { ...u, user_group: "Custom" } : u))
        );
        setSelectedGroupName("Custom");
        toast({ title: "Deleted", description: "Group deleted successfully." });
      } catch (err) {
        toast({
          title: "Delete failed",
          description: err instanceof Error ? err.message : "Failed to delete group",
          variant: "destructive",
        });
      }
    })();
  };

  const persistPrivilegeRow = async (
    groupId: number,
    row: PrivilegeRow,
    next: Pick<PrivilegeRow, "read" | "write" | "delete" | "print" | "export">
  ) => {
    if (!API) throw new Error("API is not configured");
    const res = await fetch(
      `${API}/api/user-rights/groups/${groupId}/privileges/${row.id}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...next, ref_id: row.ref_id }),
      }
    );
    if (!res.ok) throw new Error("Failed to save privilege");
  };

  const togglePrivilege = (
    rowId: number,
    key: "read" | "write" | "delete" | "print" | "export",
    checked: boolean
  ) => {
    if (!activeGroupName) return;
    const group = groupRows.find((g) => g.name === activeGroupName);
    const currentRow = activeGroupPrivileges.find((r) => r.id === rowId);
    if (!group || !currentRow || !API) return;
    const updatedRow = { ...currentRow, [key]: checked };
    setGroupPrivileges((prev) => {
      const rows = prev[activeGroupName] || [];
      const nextRows = rows.map((r) => (r.id === rowId ? updatedRow : r));
      return { ...prev, [activeGroupName]: nextRows };
    });
    void (async () => {
      try {
        await persistPrivilegeRow(group.id, currentRow, {
          read: updatedRow.read,
          write: updatedRow.write,
          delete: updatedRow.delete,
          print: updatedRow.print,
          export: updatedRow.export,
        });
      } catch {
        setGroupPrivileges((prev) => {
          const rows = prev[activeGroupName] || [];
          const revertedRows = rows.map((r) => (r.id === rowId ? currentRow : r));
          return { ...prev, [activeGroupName]: revertedRows };
        });
        toast({
          title: "Update failed",
          description: "Unable to save privilege change.",
          variant: "destructive",
        });
      }
    })();
  };

  const applyAllPermissionsInRow = (row: PrivilegeDisplayRow) => {
    if (!activeGroupName || !API) return;
    const group = groupRows.find((g) => g.name === activeGroupName);
    if (!group) return;

    if (row.isModuleHeader) {
      const moduleRows = activeGroupPrivileges.filter((r) => r.module === row.module);
      if (moduleRows.length === 0) return;
      const shouldCheckAll = moduleRows.some(
        (r) => !(r.read && r.write && r.delete && r.print && r.export)
      );
      const snapshot = moduleRows.map((r) => ({ ...r }));
      setGroupPrivileges((prev) => {
        const rows = prev[activeGroupName] || [];
        const nextRows = rows.map((r) =>
          r.module === row.module
            ? {
                ...r,
                read: shouldCheckAll,
                write: shouldCheckAll,
                delete: shouldCheckAll,
                print: shouldCheckAll,
                export: shouldCheckAll,
              }
            : r
        );
        return { ...prev, [activeGroupName]: nextRows };
      });
      void (async () => {
        try {
          await Promise.all(
            moduleRows.map((r) =>
              persistPrivilegeRow(group.id, r, {
                read: shouldCheckAll,
                write: shouldCheckAll,
                delete: shouldCheckAll,
                print: shouldCheckAll,
                export: shouldCheckAll,
              })
            )
          );
        } catch {
          setGroupPrivileges((prev) => {
            const rows = prev[activeGroupName] || [];
            const snapshotById = new Map(snapshot.map((s) => [s.id, s]));
            const revertedRows = rows.map((r) => snapshotById.get(r.id) ?? r);
            return { ...prev, [activeGroupName]: revertedRows };
          });
          toast({
            title: "Update failed",
            description: "Unable to save privilege change.",
            variant: "destructive",
          });
        }
      })();
      return;
    }

    const detailRow = row as PrivilegeRow;
    const previous: PrivilegeRow = { ...detailRow };
    const isFullyChecked =
      detailRow.read &&
      detailRow.write &&
      detailRow.delete &&
      detailRow.print &&
      detailRow.export;
    const next = {
      read: !isFullyChecked,
      write: !isFullyChecked,
      delete: !isFullyChecked,
      print: !isFullyChecked,
      export: !isFullyChecked,
    };
    setGroupPrivileges((prev) => {
      const rows = prev[activeGroupName] || [];
      const nextRows = rows.map((r) => (r.id === detailRow.id ? { ...r, ...next } : r));
      return { ...prev, [activeGroupName]: nextRows };
    });
    void (async () => {
      try {
        await persistPrivilegeRow(group.id, previous, next);
      } catch {
        setGroupPrivileges((prev) => {
          const rows = prev[activeGroupName] || [];
          const revertedRows = rows.map((r) => (r.id === detailRow.id ? previous : r));
          return { ...prev, [activeGroupName]: revertedRows };
        });
        toast({
          title: "Update failed",
          description: "Unable to save privilege change.",
          variant: "destructive",
        });
      }
    })();
  };

  const handlePrivilegeCheckboxChange = (
    row: PrivilegeDisplayRow,
    key: "read" | "write" | "delete" | "print" | "export",
    checked: boolean
  ) => {
    if (row.isModuleHeader) return;
    const detailRow = row as PrivilegeRow;
    togglePrivilege(detailRow.id, key, checked);
  };

  return (
    <div className="h-full bg-background relative overflow-x-hidden">
      <div className="flex flex-col h-full p-2 gap-3">
        {/* ── Page Header ── */}
        <div className="flex flex-wrap items-start justify-between gap-4 px-1">
          <div className="space-y-1">
            <h1 className="setup-type-page-title">User Rights</h1>
            <p className="setup-type-page-desc max-w-2xl">
              Centralized security management. Create users, define groups, and manage granular privilege modules
              across the institution.
            </p>
          </div>
          <div className="hidden sm:flex flex-col items-end gap-2">
            <div className="setup-type-kicker-pill flex h-9 items-center rounded-xl border border-border/60 bg-background/70 px-3 shadow-sm backdrop-blur">
              Security & Access Control
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs rounded-lg border-border/60 shadow-sm hover:bg-destructive/10 hover:text-destructive">
                <Lock className="h-3.5 w-3.5" /> Lockdown
              </Button>
              <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs rounded-lg border-border/60 shadow-sm">
                <LogOut className="h-3.5 w-3.5" /> Exit
              </Button>
            </div>
          </div>
        </div>

        <Card className="flex-1 flex flex-col overflow-hidden rounded-2xl bg-background border border-border/40 shadow-sm min-h-0">


          <div className="flex-1 grid grid-cols-12 min-h-0 overflow-hidden">
            {/* ── Sidebar Tree ── */}
            <div className="col-span-12 lg:col-span-3 border-r border-border/60 flex flex-col min-h-0 bg-muted/5">
              <div className="px-3 py-2.5 border-b border-border/60 bg-muted/5 flex items-center gap-2 shrink-0">
                <Users className="h-4 w-4 text-emerald-600" />
                <span className="text-xs font-bold text-foreground/80 uppercase tracking-wider">Navigation</span>
              </div>
              <div className="p-2 border-b border-border/60 bg-background/50 sticky top-0 z-10">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50" />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search users/groups..."
                    className="h-8 pl-8 text-xs rounded-xl border-border/60 bg-background shadow-sm focus-visible:ring-emerald-500/20"
                  />
                </div>
              </div>
              <div className="flex-1 overflow-auto px-2 py-2 text-[11px] space-y-1 scrollbar-thin">
                <button
                  type="button"
                  onClick={() => setTreeOpen((s) => ({ ...s, root: !s.root }))}
                  className="w-full flex items-center gap-2 font-bold text-foreground/80 hover:bg-emerald-500/5 px-2 py-1.5 rounded-lg transition-colors group outline-none"
                >
                  <div className="shrink-0 transition-transform group-hover:scale-110">
                    {treeOpen.root ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                  </div>
                  <ShieldCheck className="h-4 w-4 text-emerald-500" />
                  Access Directory
                </button>
                {treeOpen.root && (
                  <div className="pl-3 mt-1 space-y-1 font-medium">
                    <button
                      type="button"
                      onClick={() => setTreeOpen((s) => ({ ...s, users: !s.users }))}
                      className="w-full flex items-center gap-2 font-semibold text-muted-foreground hover:text-emerald-700 hover:bg-emerald-500/5 px-2 py-1.5 rounded-lg transition-colors outline-none"
                    >
                      <div className="shrink-0">
                        {treeOpen.users ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                      </div>
                      <UserRound className="h-3.5 w-3.5" />
                      Users
                      <span className="ml-auto text-[10px] bg-muted px-1.5 rounded-md font-mono text-muted-foreground/70">
                        {userRows.length}
                      </span>
                    </button>
                    {treeOpen.users && (
                      <div className="pl-5 space-y-0.5 border-l border-emerald-500/10 ml-3.5 py-1">
                        {filteredUsers.map((u) => (
                          <button
                            type="button"
                            key={u.id}
                            onClick={() => {
                              setSelectedUserId(u.id);
                              setActiveTab("users");
                            }}
                            className={cn(
                              "w-full text-left px-2 py-1.5 flex items-center gap-2 rounded-lg transition-all group outline-none",
                              u.id === selectedUserId 
                                ? "bg-emerald-500/10 text-emerald-700 font-bold ring-1 ring-inset ring-emerald-500/20 shadow-xs" 
                                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                            )}
                          >
                            <UserRound className={cn("h-3 w-3", u.id === selectedUserId ? "text-emerald-600" : "text-muted-foreground/40")} />
                            <span className="truncate">{u.employee_name}</span>
                          </button>
                        ))}
                        {filteredUsers.length === 0 && (
                          <div className="text-[10px] text-muted-foreground/60 px-2 py-2 italic font-light">
                            No match found
                          </div>
                        )}
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => setTreeOpen((s) => ({ ...s, groups: !s.groups }))}
                      className="w-full flex items-center gap-2 font-semibold text-muted-foreground hover:text-emerald-700 hover:bg-emerald-500/5 px-2 py-1.5 rounded-lg transition-colors outline-none"
                    >
                      <div className="shrink-0">
                        {treeOpen.groups ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                      </div>
                      <Users className="h-3.5 w-3.5" />
                      Groups
                      <span className="ml-auto text-[10px] bg-muted px-1.5 rounded-md font-mono text-muted-foreground/70">
                        {groupRows.length}
                      </span>
                    </button>
                    {treeOpen.groups && (
                      <div className="pl-5 space-y-0.5 border-l border-emerald-500/10 ml-3.5 py-1">
                        {filteredGroups.map((group) => (
                          <button
                            type="button"
                            key={group}
                            onClick={() => {
                              setSelectedGroupName(group);
                              setActiveTab("privileges");
                            }}
                            className={cn(
                              "w-full text-left px-2 py-1.5 flex items-center gap-2 rounded-lg transition-all outline-none",
                              selectedGroupName === group 
                                ? "bg-emerald-500/10 text-emerald-700 font-bold ring-1 ring-inset ring-emerald-500/20 shadow-xs" 
                                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                            )}
                          >
                            <Users className={cn("h-3 w-3", selectedGroupName === group ? "text-emerald-600" : "text-muted-foreground/40")} />
                            <span className="truncate">{group}</span>
                          </button>
                        ))}
                        {filteredGroups.length === 0 && (
                          <div className="text-[10px] text-muted-foreground/60 px-2 py-2 italic font-light">
                            No groups found
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* ── Main Workspace ── */}
            <div className="col-span-12 lg:col-span-9 flex flex-col min-h-0 bg-background/40">
              <div className="border-b border-border/60 bg-muted/5">
                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "users" | "privileges")}>
                  <TabsList className="h-10 rounded-none bg-transparent p-0 w-full justify-start border-none">
                    <TabsTrigger 
                      value="users" 
                      className="h-10 rounded-none border-b-2 border-transparent data-[state=active]:border-emerald-500 data-[state=active]:bg-emerald-500/5 data-[state=active]:text-emerald-700 text-[11px] font-bold px-5 transition-all outline-none"
                    >
                      Users & Accounts
                      {selectedUser && (
                        <span className="ml-2 text-[9px] font-normal opacity-70 bg-emerald-500/10 px-1.5 py-0.5 rounded-full border border-emerald-500/10">
                          {selectedUser.employee_name}
                        </span>
                      )}
                    </TabsTrigger>
                    <TabsTrigger 
                      value="privileges" 
                      className="h-10 rounded-none border-b-2 border-transparent data-[state=active]:border-emerald-500 data-[state=active]:bg-emerald-500/5 data-[state=active]:text-emerald-700 text-[11px] font-bold px-5 transition-all outline-none"
                    >
                      Module Privileges
                      <span className="ml-2 text-[9px] font-normal opacity-70 bg-emerald-500/10 px-1.5 py-0.5 rounded-full border border-emerald-500/10">
                        {activeGroupName || "Global"}
                      </span>
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              <div className="flex flex-wrap items-center gap-2 p-2.5 border-b border-border/60 bg-background/80 backdrop-blur-sm sticky top-0 z-20 overflow-x-auto no-scrollbar">
                <Button
                  size="sm"
                  className="h-8 gap-1.5 text-xs rounded-lg shadow-sm bg-primary text-primary-foreground hover:bg-primary/90"
                  onClick={openAddUserDialog}
                >
                  <UserPlus2 className="h-3.5 w-3.5" />
                  New User
                </Button>
                <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs rounded-lg border-border/60 shadow-sm text-destructive hover:bg-destructive/10">
                  <Trash2 className="h-3.5 w-3.5" /> Delete User
                </Button>
                
                <div className="w-px h-5 bg-border/60 mx-1 shrink-0" />

                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 gap-1.5 text-xs rounded-lg border-border/60 shadow-sm"
                  onClick={openGroupPicker}
                >
                  <Users className="h-3.5 w-3.5" />
                  Users Group
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 gap-1.5 text-xs rounded-lg border-border/60 shadow-sm"
                  onClick={openEditUsernameDialog}
                >
                  <UserCog className="h-3.5 w-3.5" />
                  Edit Username
                </Button>
                <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs rounded-lg border-border/60 shadow-sm">
                  <KeyRound className="h-3.5 w-3.5" /> Password Reset
                </Button>
                <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs rounded-lg border-border/60 shadow-sm">
                  <ShieldCheck className="h-3.5 w-3.5" /> Program Access
                </Button>
                <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs rounded-lg border-border/60 shadow-sm ml-auto opacity-50 hover:opacity-100">
                  <Wallpaper className="h-3.5 w-3.5" />
                </Button>
              </div>

              <div className="flex-1 overflow-auto min-h-0 bg-background relative">
                {activeTab === "users" ? (
                  <div className="h-full">
                    <table className="w-full text-[11px] border-collapse min-w-[1600px]">
                      <thead>
                        <tr className="sticky top-0 z-30 bg-muted/90 backdrop-blur shadow-sm uppercase text-[10px] font-bold text-muted-foreground/80 tracking-wider">
                          {[
                            "User ID",
                            "Employee Name",
                            "Username",
                            "Users Group",
                            "Position Title",
                            "Department",
                            "Date Created",
                            "Logged Version",
                            "Logged Date",
                            "Computer",
                            "IP Address",
                            "MAC Address",
                            "Level",
                          ].map((h) => (
                            <th key={h} className="text-left px-3 py-2.5 border-r border-border/40 last:border-r-0">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {userRows.map((r, idx) => (
                          <tr 
                            key={r.id} 
                            role="button"
                            tabIndex={0}
                            onClick={() => setSelectedUserId(r.id)}
                            className={cn(
                              "premium-row cursor-pointer transition-colors outline-none",
                              idx % 2 === 1 ? "bg-muted/10" : "bg-background",
                              r.id === selectedUserId && "bg-emerald-500/10 font-medium ring-1 ring-inset ring-emerald-500/20 shadow-xs"
                            )}
                          >
                            <td className="setup-font-mono-data border-r border-border/40 px-3 py-2.5 font-bold opacity-70">{r.id}</td>
                            <td className="px-3 py-2.5 border-r border-border/40 font-medium text-foreground">{r.employee_name}</td>
                            <td className="px-3 py-2.5 border-r border-border/40 font-mono text-emerald-700 bg-emerald-500/5">{r.username}</td>
                            <td className="px-3 py-2.5 border-r border-border/40 flex items-center gap-1.5 font-medium">
                              <Users className="h-3 w-3 text-muted-foreground/60" />
                              {r.user_group}
                            </td>
                            <td className="px-3 py-2.5 border-r border-border/40 italic text-muted-foreground">{r.position_title}</td>
                            <td className="px-3 py-2.5 border-r border-border/40 text-muted-foreground font-medium">{r.department}</td>
                            <td className="px-3 py-2.5 border-r border-border/40 tabular-nums">{r.date_created || "—"}</td>
                            <td className="px-3 py-2.5 border-r border-border/40 text-center font-mono opacity-60 italic">{r.logged_version || "—"}</td>
                            <td className="px-3 py-2.5 border-r border-border/40 opacity-70">{r.logged_date || "—"}</td>
                            <td className="px-3 py-2.5 border-r border-border/40 flex items-center gap-1.5 opacity-60">
                              <HardDrive className="h-3 w-3" /> {r.computer_name || "—"}
                            </td>
                            <td className="px-3 py-2.5 border-r border-border/40 font-mono opacity-60">{r.ip_address || "—"}</td>
                            <td className="px-3 py-2.5 border-r border-border/40 font-mono opacity-40 uppercase">{r.mac_address || "—"}</td>
                            <td className="px-3 py-2.5"><span className="bg-muted px-1.5 py-0.5 rounded border border-border/50 text-[10px] font-medium">{r.level}</span></td>
                          </tr>
                        ))}
                        {userRows.length === 0 && (
                          <tr>
                            <td colSpan={13} className="px-4 py-20 text-center text-muted-foreground italic bg-muted/5">
                              <ShieldAlert className="h-8 w-8 mx-auto mb-2 opacity-20" />
                              No user-rights records available.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="h-full">
                    <table className="w-full text-[11px] border-collapse min-w-[1150px]">
                      <thead>
                        <tr className="sticky top-0 z-30 bg-muted/90 backdrop-blur shadow-sm uppercase text-[10px] font-bold text-muted-foreground/80 tracking-wider">
                          {["Module", "Task Action Item", "Read", "Write", "Delete", "Print", "XLSX", "Ref. ID"].map((h) => (
                            <th key={h} className="text-left px-3 py-2.5 border-r border-border/40 last:border-r-0">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {privilegeDisplayRows.map((r, idx) => {
                          const prev = privilegeDisplayRows[idx - 1];
                          const showModule = idx === 0 || prev?.module !== r.module;
                          return (
                            <tr
                              key={`${String(r.id)}-${r.ref_id}-${idx}`}
                              className={cn(
                                "premium-row transition-colors group",
                                idx % 2 === 1 ? "bg-muted/10" : "bg-background",
                                r.isModuleHeader && "font-bold bg-emerald-500/5 text-emerald-800"
                              )}
                            >
                              <td className="px-3 py-1.5 border-r border-border/40 font-black text-emerald-900/80">
                                {showModule && (
                                  <div className="flex items-center gap-1.5 uppercase tracking-tighter">
                                    <Layout className="h-3.5 w-3.5 opacity-40" />
                                    {r.module}
                                  </div>
                                )}
                              </td>
                              <td
                                onDoubleClick={() => applyAllPermissionsInRow(r)}
                                title="Double-click to check all permissions in this row"
                                className={cn(
                                  "px-3 py-1.5 border-r border-border/40 whitespace-nowrap cursor-pointer select-none transition-colors font-medium",
                                  !r.isModuleHeader ? "pl-8 text-muted-foreground hover:text-foreground" : "font-black"
                                )}
                              >
                                <div className="flex items-center gap-2">
                                  {!r.isModuleHeader && <div className="w-1.5 h-1.5 rounded-full bg-border group-hover:bg-emerald-400 shrink-0" />}
                                  {r.description}
                                </div>
                              </td>
                              {["read", "write", "delete", "print", "export"].map((key) => (
                                <td key={key} className="px-3 py-1.5 border-r border-border/40 text-center">
                                  <label className="flex items-center justify-center cursor-pointer group/check">
                                    <input
                                      type="checkbox"
                                      checked={(r as any)[key]}
                                      onChange={(e) => handlePrivilegeCheckboxChange(r, key as any, e.target.checked)}
                                      className="h-4 w-4 rounded-sm border-emerald-500/30 text-emerald-600 focus:ring-emerald-500 transition-all cursor-pointer opacity-70 group-hover/check:opacity-100"
                                    />
                                  </label>
                                </td>
                              ))}
                              <td className="px-3 py-1.5 font-mono text-[9px] opacity-30 group-hover:opacity-100 truncate">{r.ref_id}</td>
                            </tr>
                          )})}
                        {activeGroupPrivileges.length === 0 && (
                          <tr>
                            <td colSpan={8} className="px-4 py-20 text-center text-muted-foreground italic bg-muted/5">
                              <ShieldAlert className="h-8 w-8 mx-auto mb-2 opacity-20" />
                              No privileges defined for this group.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                    <div className="sticky bottom-0 z-20 bg-emerald-600 text-white px-4 py-2 text-[10px] font-bold flex items-center justify-between shadow-[0_-2px_10px_rgba(0,0,0,0.1)]">
                      <div className="flex items-center gap-3">
                        <Layout className="h-3.5 w-3.5" />
                        SYSTEM PERMISSION GRID V1.0
                        <span className="opacity-40 font-normal">|</span>
                        <span className="bg-white/20 px-1.5 rounded font-mono">STABLE</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1.5">
                          <Users className="h-3 w-3" />
                          GROUP: {activeGroupName.toUpperCase()}
                        </span>
                        <span className="opacity-40">|</span>
                        <span>{activeGroupPrivileges.length} ENTRIES LOADED</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>
      </div>

      <Dialog open={addUserOpen} onOpenChange={setAddUserOpen}>
        <DialogContent className="max-w-[860px] p-0 gap-0 overflow-hidden border-none shadow-2xl rounded-2xl">
          <DialogHeader className="bg-primary px-4 py-3 border-b border-white/10 shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/15 rounded-xl border border-white/20">
                <UserPlus2 className="h-5 w-5 text-white" />
              </div>
              <div className="text-left">
                <DialogTitle className="text-base font-bold text-white tracking-tight leading-tight">Create User Account</DialogTitle>
                <p className="text-[10px] text-white/70 font-medium">Link Employee profile to System Access List</p>
              </div>
            </div>
          </DialogHeader>

          <div className="p-4 bg-background space-y-4">
            <div className="flex items-center gap-3 bg-muted/40 p-3 rounded-2xl border border-border/40">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                <Input
                  value={employeeSearch}
                  onChange={(e) => setEmployeeSearch(e.target.value)}
                  className="h-10 pl-10 text-xs rounded-xl border-border/60 bg-background shadow-inner focus-visible:ring-emerald-500/30"
                  placeholder="Filter employees by name, ID or department..."
                />
              </div>
              <Button size="sm" className="h-10 px-4 gap-2 text-xs rounded-xl bg-emerald-600 hover:bg-emerald-700 shadow-md transition-all active:scale-95 shrink-0" onClick={loadEmployees}>
                {employeeLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                Refresh List
              </Button>
            </div>

            <div className="grid grid-cols-12 gap-5 min-h-[160px]">
              <div className="col-span-12 md:col-span-3">
                <div className="aspect-[4/5] rounded-2xl bg-muted/20 border border-dashed border-border/60 flex flex-col items-center justify-center gap-2 relative overflow-hidden group">
                  <div className="absolute inset-0 bg-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <UserRound className="h-12 w-12 text-muted-foreground/30 group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest">No Profile Pic</span>
                </div>
              </div>
              
              <div className="col-span-12 md:col-span-9 grid grid-cols-2 gap-x-4 gap-y-3 p-1">
                {[
                  { label: "Suggested Username", value: selectedEmployee ? makeNickname(selectedEmployee.employee_name, selectedEmployee.employee_id) : "", icon: UserRound, mono: true, emerald: true },
                  { label: "Employee ID", value: selectedEmployee?.employee_id ?? "", icon: Hash, mono: true },
                  { label: "Employee Name", value: selectedEmployee?.employee_name ?? "", icon: FileText, bold: true },
                  { label: "Position / Designation", value: selectedEmployee?.position_title ?? "", icon: ShieldCheck },
                  { label: "Department / Office", value: selectedEmployee?.department ?? "", icon: FolderOpen, span: 2 },
                ].map((f, idx) => (
                  <div key={idx} className={cn("space-y-1.5", f.span === 2 && "col-span-2")}>
                    <Label className="text-[10px] font-bold text-muted-foreground flex items-center gap-1.5 uppercase tracking-wide">
                      <f.icon className="h-3 w-3" /> {f.label}
                    </Label>
                    <div className={cn(
                      "h-9 px-3 flex items-center rounded-xl border border-border/40 text-xs shadow-sm bg-muted/10",
                      f.mono && "font-mono tracking-tight",
                      f.emerald && "bg-emerald-500/5 text-emerald-700 border-emerald-500/20 font-bold",
                      f.bold && "font-bold text-foreground"
                    )}>
                      {f.value || <span className="opacity-30 italic">Not selected</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-border/60 overflow-hidden shadow-sm bg-background/50">
              <div className="bg-muted/80 px-3 py-2 border-b border-border/60 flex items-center justify-between">
                <span className="text-[10px] font-black uppercase text-muted-foreground/80 tracking-widest flex items-center gap-2">
                  <SearchCode className="h-3 w-3 text-emerald-600" /> Select Employee Candidate
                </span>
                <span className="text-[10px] font-mono opacity-60">Result(s): {filteredEmployees.length}</span>
              </div>
              <div className="max-h-[300px] overflow-auto scrollbar-thin">
                <table className="w-full text-left text-[11px] border-collapse relative">
                  <thead className="sticky top-0 z-10 bg-background shadow-[0_1px_0_rgba(0,0,0,0.1)]">
                    <tr className="text-[10px] font-bold text-muted-foreground/60 uppercase">
                      <th className="px-3 py-2 border-r border-border/40">ID</th>
                      <th className="px-3 py-2 border-r border-border/40">Name</th>
                      <th className="px-3 py-2">Position</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employeeLoading ? (
                      <tr><td colSpan={3} className="px-4 py-8 text-center"><Loader2 className="h-5 w-5 animate-spin mx-auto opacity-30" /></td></tr>
                    ) : filteredEmployees.length === 0 ? (
                      <tr><td colSpan={3} className="px-4 py-8 text-center text-muted-foreground opacity-50">No candidates available</td></tr>
                    ) : (
                      filteredEmployees.map((e, idx) => (
                        <tr
                          key={e.employee_id}
                          role="button"
                          tabIndex={0}
                          onClick={() => setSelectedEmployeeId(e.employee_id)}
                          className={cn(
                            "cursor-pointer border-b border-border/40 hover:bg-emerald-500/5 transition-colors group outline-none",
                            idx % 2 === 1 && "bg-muted/5",
                            selectedEmployeeId === e.employee_id && "bg-emerald-500/10 font-bold"
                          )}
                        >
                          <td className="px-3 py-2 border-r border-border/40 font-mono text-[10px] opacity-70">{e.employee_id}</td>
                          <td className="px-3 py-2 border-r border-border/40 font-bold text-foreground/80">{e.employee_name}</td>
                          <td className="px-3 py-2 text-muted-foreground truncate max-w-[200px] italic">{e.position_title}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="outline"
                className="h-10 px-6 font-semibold text-xs border-border/60 hover:bg-muted/50 rounded-xl"
                onClick={() => setAddUserOpen(false)}
              >
                DISCARD
              </Button>
              <Button
                className="h-10 px-8 font-bold text-xs bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-500/20 rounded-xl transition-all active:scale-95"
                onClick={createUserFromEmployee}
              >
                GENERATE USER PROFILE
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={groupPickerOpen} onOpenChange={setGroupPickerOpen}>
        <DialogContent className="max-w-[650px] p-0 gap-0 overflow-hidden border-none shadow-2xl rounded-2xl">
          <DialogHeader className="bg-primary px-4 py-3 border-b border-white/10 shrink-0">
             <div className="flex items-center gap-3">
              <div className="p-2 bg-white/15 rounded-xl border border-white/20">
                <Users className="h-5 w-5 text-white" />
              </div>
              <div className="text-left">
                <DialogTitle className="text-base font-bold text-white tracking-tight leading-tight">Users Group Manager</DialogTitle>
                <p className="text-[10px] text-white/70 font-medium">Assigned group defines the core privilege set</p>
              </div>
            </div>
          </DialogHeader>

          <div className="p-4 bg-background space-y-4">
            <div className="rounded-2xl border border-border/60 overflow-hidden shadow-sm bg-background/50">
              <div className="bg-muted/80 px-3 py-2 border-b border-border/60 flex items-center justify-between">
                <span className="text-[10px] font-black uppercase text-muted-foreground/80 tracking-widest flex items-center gap-2">
                  <ShieldCheck className="h-3.5 w-3.5 opacity-50 text-emerald-600" /> Available System Groups
                </span>
                <span className="text-[10px] font-mono opacity-60">Count: {groupRows.length}</span>
              </div>
              <div className="max-h-[300px] overflow-auto scrollbar-thin">
                <table className="w-full text-left text-[11px] border-collapse font-medium">
                  <tbody>
                    {groupRows.length === 0 ? (
                      <tr><td className="px-4 py-8 text-center text-muted-foreground italic">No security groups found.</td></tr>
                    ) : (
                      groupRows.map((g, idx) => (
                        <tr
                          key={g.name}
                          role="button"
                          tabIndex={0}
                          onClick={() => setSelectedGroupName(g.name)}
                          className={cn(
                            "cursor-pointer border-b border-border/40 hover:bg-emerald-500/5 transition-colors group outline-none",
                            idx % 2 === 1 && "bg-muted/5",
                            selectedGroupName === g.name && "bg-emerald-500/10 font-bold"
                          )}
                        >
                          <td className="px-4 py-4 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className={cn(
                                "w-2.5 h-2.5 rounded-full ring-2 ring-offset-2 ring-transparent transition-all",
                                selectedGroupName === g.name ? "bg-emerald-500 ring-emerald-500/20 scale-125 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-muted shadow-inner"
                              )} />
                              <span className="text-xs uppercase font-bold tracking-widest">{g.name}</span>
                            </div>
                            {selectedGroupName === g.name && <CheckCircle2 className="h-4 w-4 text-emerald-600" />}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-3">
                <Button variant="link" className="text-emerald-700 h-auto p-0 font-bold text-[11px] hover:text-emerald-800 decoration-emerald-500/30" onClick={openNewGroupDialog}>
                   <Plus className="h-3 w-3" /> New Group
                </Button>
                <span className="text-muted-foreground/30 text-[10px]">|</span>
                <Button variant="link" className="text-emerald-700 h-auto p-0 font-bold text-[11px] hover:text-emerald-800 decoration-emerald-500/30" onClick={openEditGroupDialog}>
                   <Edit3 className="h-3 w-3" /> Edit Group
                </Button>
                <span className="text-muted-foreground/30 text-[10px]">|</span>
                <Button variant="link" className="text-destructive/70 h-auto p-0 font-bold text-[11px] hover:text-destructive decoration-destructive/30" onClick={deleteSelectedGroup}>
                   <Trash2 className="h-3 w-3" /> Delete Group
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button variant="outline" className="h-9 px-6 font-semibold text-xs rounded-xl border-border/60" onClick={() => setGroupPickerOpen(false)}>CANCEL</Button>
              <Button className="h-9 px-8 font-bold text-xs bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-lg shadow-emerald-500/10 transition-all active:scale-95" onClick={applySelectedGroup}>APPLY GROUP</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={editUsernameOpen} onOpenChange={setEditUsernameOpen}>
        <DialogContent className="max-w-[430px] p-0 gap-0 overflow-hidden border-none shadow-2xl rounded-2xl">
          <DialogHeader className="bg-primary px-4 py-3 border-b border-white/10 shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/15 rounded-xl border border-white/20">
                <UserCog className="h-5 w-5 text-white" />
              </div>
              <DialogTitle className="text-base font-bold text-white tracking-tight leading-tight">Edit Username</DialogTitle>
            </div>
          </DialogHeader>
          <div className="p-4 bg-background space-y-4">
            <div className="space-y-4">
              <div className="space-y-1.5 px-1">
                <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">User ID Reference</Label>
                <div className="h-10 px-3 flex items-center rounded-xl border border-border/40 text-xs font-mono bg-muted/30 opacity-60 shadow-inner">
                  {selectedUser?.id ?? "—"}
                </div>
              </div>
              <div className="space-y-1.5 px-1">
                <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                  <Edit3 className="h-3 w-3 text-emerald-600" /> New System Identifier
                </Label>
                <Input
                  className="h-11 px-3 rounded-xl border-border/60 bg-background text-xs font-bold font-mono tracking-tight text-emerald-700 focus-visible:ring-emerald-500/30 shadow-sm"
                  value={usernameDraft}
                  onChange={(e) => setUsernameDraft(e.target.value)}
                  placeholder="Enter new username..."
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button variant="outline" className="h-10 px-6 font-semibold text-xs rounded-xl border-border/60 hover:bg-muted/50" onClick={() => setEditUsernameOpen(false)}>CANCEL</Button>
              <Button className="h-10 px-8 font-bold text-xs bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-lg shadow-emerald-500/10 transition-all active:scale-95" onClick={saveEditedUsername}>UPDATE RECORD</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={newGroupOpen} onOpenChange={setNewGroupOpen}>
        <DialogContent className="max-w-[620px] p-0 gap-0 overflow-hidden border-none shadow-2xl rounded-2xl">
          <DialogHeader className="bg-primary px-4 py-3 border-b border-white/10 shrink-0">
             <div className="flex items-center gap-3">
              <div className="p-2 bg-white/15 rounded-xl border border-white/20">
                <Users className="h-5 w-5 text-white" />
              </div>
              <DialogTitle className="text-base font-bold text-white tracking-tight leading-tight">Create Security Group</DialogTitle>
            </div>
          </DialogHeader>
          <div className="p-5 bg-background space-y-4">
            <div className="grid grid-cols-12 gap-4 font-semibold">
              <div className="col-span-12 space-y-1.5 px-1">
                <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Group Base Name</Label>
                <Input 
                  className="h-11 rounded-xl border-border/60 bg-background text-xs font-bold tracking-widest focus-visible:ring-emerald-500/30 uppercase shadow-sm" 
                  value={groupForm.name} 
                  onChange={(e) => setGroupForm((s) => ({ ...s, name: e.target.value }))}
                  placeholder="e.g. ADMINISTRATORS"
                />
              </div>
              <div className="col-span-12 space-y-1.5 px-1">
                <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Detailed Description</Label>
                <Input 
                  className="h-11 rounded-xl border-border/60 bg-background text-xs focus-visible:ring-emerald-500/30 shadow-sm" 
                  value={groupForm.description} 
                  onChange={(e) => setGroupForm((s) => ({ ...s, description: e.target.value }))}
                  placeholder="Internal notes on group purpose..."
                />
              </div>
              <div className="col-span-12 space-y-1.5 px-1">
                 <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Group Assets (Wallpaper)</Label>
                 <div className="flex items-center gap-3">
                    <div className="h-11 flex-1 px-3 flex items-center rounded-xl border border-border/40 text-[10px] font-mono bg-muted/20 opacity-50 truncate overflow-hidden shadow-inner font-medium">
                      {groupForm.wallpaper || "system_default_v1.png"}
                    </div>
                    <Button variant="outline" className="h-11 px-4 text-xs font-bold border-border/60 rounded-xl shadow-sm hover:bg-muted/50 shrink-0">BROWSE...</Button>
                 </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 pt-3">
               <Button variant="outline" className="h-11 px-6 font-semibold text-xs rounded-xl border-border/60" onClick={() => setNewGroupOpen(false)}>ABORT</Button>
               <Button className="h-11 px-8 font-bold text-xs bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-lg shadow-emerald-500/20 transition-all active:scale-95" onClick={createGroup}>PROVISION GROUP</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={editGroupOpen} onOpenChange={setEditGroupOpen}>
        <DialogContent className="max-w-[620px] p-0 gap-0 overflow-hidden border-none shadow-2xl rounded-2xl">
          <DialogHeader className="bg-primary px-4 py-3 border-b border-white/10 shrink-0">
             <div className="flex items-center gap-3">
              <div className="p-2 bg-white/15 rounded-xl border border-white/20">
                <Edit3 className="h-5 w-5 text-white" />
              </div>
              <DialogTitle className="text-base font-bold text-white tracking-tight leading-tight">Edit Group Profile</DialogTitle>
            </div>
          </DialogHeader>
          <div className="p-5 bg-background space-y-4">
            <div className="grid grid-cols-12 gap-4 font-semibold">
              <div className="col-span-12 space-y-1.5 px-1">
                <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Update Identity</Label>
                <Input 
                  className="h-11 rounded-xl border-border/60 bg-background text-xs font-bold tracking-widest focus-visible:ring-emerald-500/30 uppercase shadow-sm" 
                  value={groupForm.name} 
                  onChange={(e) => setGroupForm((s) => ({ ...s, name: e.target.value }))}
                />
              </div>
              <div className="col-span-12 space-y-1.5 px-1">
                <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Update Description</Label>
                <Input 
                  className="h-11 rounded-xl border-border/60 bg-background text-xs focus-visible:ring-emerald-500/30 shadow-sm" 
                  value={groupForm.description} 
                  onChange={(e) => setGroupForm((s) => ({ ...s, description: e.target.value }))}
                />
              </div>
              <div className="col-span-12 space-y-1.5 px-1">
                 <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Configuration Assets</Label>
                 <div className="flex items-center gap-3">
                    <div className="h-11 flex-1 px-3 flex items-center rounded-xl border border-border/40 text-[10px] font-mono bg-muted/20 opacity-50 truncate overflow-hidden shadow-inner font-medium">
                      {groupForm.wallpaper || "system_default_v1.png"}
                    </div>
                    <Button variant="outline" className="h-11 px-4 text-xs font-bold border-border/60 rounded-xl shadow-sm hover:bg-muted/50 shrink-0">BROWSE...</Button>
                 </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 pt-3">
               <Button variant="outline" className="h-11 px-6 font-semibold text-xs rounded-xl border-border/60" onClick={() => setEditGroupOpen(false)}>CANCEL</Button>
               <Button className="h-11 px-8 font-bold text-xs bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-lg shadow-emerald-500/20 transition-all active:scale-95" onClick={saveEditedGroup}>COMMIT CHANGES</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

