"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
    <div className="h-full bg-[#f2fbf7] p-1">
      <div className="border border-[#79b898] bg-white">
        <div className="flex items-center justify-between bg-gradient-to-b from-[#def8ea] to-[#9fdbbc] border-b border-[#79b898] px-2 py-1">
          <div>
            <h1 className="text-[31px] leading-none tracking-tight text-[#1f5e45] font-semibold uppercase">
              USER RIGHTS
            </h1>
            <p className="text-[11px] text-[#35684f] -mt-0.5">
              This module allows you to create new user, users group and modify privileges.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" className="h-6 text-[10px] border-[#9ed9c1] bg-white">
              <Lock className="h-3 w-3" />
              Lockdown
            </Button>
            <Button size="sm" variant="outline" className="h-6 text-[10px] border-[#9ed9c1] bg-white">
              <LogOut className="h-3 w-3" />
              Exit
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-12 min-h-[610px]">
          <div className="col-span-12 lg:col-span-3 border-r border-[#79b898]">
            <div className="bg-gradient-to-b from-[#6ec79b] to-[#2f9b68] text-white text-[11px] px-1 py-0.5 font-semibold">
              List of Users and Users Group
            </div>
            <div className="p-1 border-b border-[#cfe6da]">
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search user..."
                className="h-6 text-[11px]"
              />
            </div>
            <div className="h-[548px] overflow-auto p-1 text-[11px]">
              <button
                type="button"
                onClick={() => setTreeOpen((s) => ({ ...s, root: !s.root }))}
                className="w-full flex items-center gap-1 font-semibold text-[#1f5e45] hover:bg-[#e7f8ef] px-0.5 py-0.5"
              >
                {treeOpen.root ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                <Users className="h-3.5 w-3.5" />
                Users and Groups
              </button>
              {treeOpen.root && (
                <div className="pl-4 mt-0.5 space-y-0.5">
                  <button
                    type="button"
                    onClick={() => setTreeOpen((s) => ({ ...s, users: !s.users }))}
                    className="w-full flex items-center gap-1 font-semibold text-[#1f5e45] hover:bg-[#e7f8ef] px-0.5 py-0.5 text-left"
                  >
                    {treeOpen.users ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                    <FolderOpen className="h-3.5 w-3.5" />
                    Users ({userRows.length})
                  </button>
                  {treeOpen.users && (
                    <div className="pl-3 space-y-0.5">
                      {filteredUsers.map((u) => (
                        <button
                          type="button"
                          key={u.id}
                          onClick={() => {
                            setSelectedUserId(u.id);
                            setActiveTab("users");
                          }}
                          className={cn(
                            "w-full text-left px-1 py-0.5 flex items-center gap-1 hover:bg-[#e7f8ef]",
                            u.id === selectedUserId && "bg-[#d9f3e5]"
                          )}
                        >
                          <UserRound className="h-3 w-3 text-[#1f7a57]" />
                          <span className="truncate">{u.employee_name}</span>
                        </button>
                      ))}
                      {filteredUsers.length === 0 && (
                        <div className="text-[11px] text-muted-foreground px-1 py-1.5 italic">
                          No users found.
                        </div>
                      )}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => setTreeOpen((s) => ({ ...s, groups: !s.groups }))}
                    className="w-full flex items-center gap-1 font-semibold text-[#1f5e45] hover:bg-[#e7f8ef] px-0.5 py-0.5 text-left"
                  >
                    {treeOpen.groups ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                    <FolderOpen className="h-3.5 w-3.5" />
                    Groups ({filteredGroups.length})
                  </button>
                  {treeOpen.groups && (
                    <div className="pl-3 space-y-0.5">
                      {filteredGroups.map((group) => (
                        <button
                          type="button"
                          key={group}
                          onClick={() => {
                            setSelectedGroupName(group);
                            setActiveTab("privileges");
                          }}
                          className={cn(
                            "w-full text-left px-1 py-0.5 flex items-center gap-1 hover:bg-[#e7f8ef]",
                            selectedGroupName === group && "bg-[#d9f3e5]"
                          )}
                        >
                          <Users className="h-3 w-3 text-[#1f7a57]" />
                          <span className="truncate">{group}</span>
                        </button>
                      ))}
                      {filteredGroups.length === 0 && (
                        <div className="text-[11px] text-muted-foreground px-1 py-1.5 italic">
                          No groups found.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="col-span-12 lg:col-span-9">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "users" | "privileges")}>
              <TabsList className="h-7 rounded-none bg-[#e6f8ef] border-b border-[#79b898] p-0 w-full justify-start">
                <TabsTrigger value="users" className="h-7 rounded-none text-[11px] px-3 data-[state=active]:bg-[#f6fcf8]">
                  Users: [{selectedUser?.employee_name ?? ""}]
                </TabsTrigger>
                <TabsTrigger value="privileges" className="h-7 rounded-none text-[11px] px-3 data-[state=active]:bg-[#f6fcf8]">
                  Privileges: [{activeGroupName}]
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="flex items-center gap-1 p-1 border-b border-[#79b898] bg-gradient-to-b from-[#e4f8ee] to-[#9ed9c1]">
              <Button
                size="sm"
                variant="outline"
                className="h-6 text-[11px] border-[#9ed9c1] bg-white"
                onClick={openAddUserDialog}
              >
                <Plus className="h-3 w-3" />
                Add New User
              </Button>
              <Button size="sm" variant="outline" className="h-6 text-[11px] border-[#9ed9c1] bg-white"><Trash2 className="h-3 w-3" />Delete User</Button>
              <Button
                size="sm"
                variant="outline"
                className="h-6 text-[11px] border-[#9ed9c1] bg-white"
                onClick={openGroupPicker}
              >
                <Users className="h-3 w-3" />
                Users Group
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-6 text-[11px] border-[#9ed9c1] bg-white"
                onClick={openEditUsernameDialog}
              >
                <UserCog className="h-3 w-3" />
                Edit Username
              </Button>
              <Button size="sm" variant="outline" className="h-6 text-[11px] border-[#9ed9c1] bg-white"><RefreshCw className="h-3 w-3" />Reset Password</Button>
              <Button size="sm" variant="outline" className="h-6 text-[11px] border-[#9ed9c1] bg-white"><ShieldCheck className="h-3 w-3" />Program Access</Button>
              <Button size="sm" variant="outline" className="h-6 text-[11px] border-[#9ed9c1] bg-white"><Wallpaper className="h-3 w-3" />Wallpaper</Button>
            </div>

            <div className="overflow-auto h-[548px]">
              {activeTab === "users" ? (
                <table className="w-full text-[11px] border-collapse min-w-[1560px]">
                  <thead>
                    <tr className="bg-gradient-to-b from-[#6ec79b] to-[#2f9b68] text-white uppercase">
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
                        "Logged Computer Name",
                        "Logged IP Address",
                        "Logged MAC Address",
                        "Level",
                      ].map((h) => (
                        <th key={h} className="text-left px-2 py-1 border border-white/25">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {userRows.map((r, idx) => (
                      <tr key={r.id} className={cn(idx % 2 ? "bg-[#f8fdf9]" : "bg-white", r.id === selectedUserId && "bg-[#d9f3e5]")}>
                        <td className="px-2 py-0.5 border border-[#d4e8dc]">{r.id}</td>
                        <td className="px-2 py-0.5 border border-[#d4e8dc]">{r.employee_name}</td>
                        <td className="px-2 py-0.5 border border-[#d4e8dc]">{r.username}</td>
                        <td className="px-2 py-0.5 border border-[#d4e8dc]">{r.user_group}</td>
                        <td className="px-2 py-0.5 border border-[#d4e8dc]">{r.position_title}</td>
                        <td className="px-2 py-0.5 border border-[#d4e8dc]">{r.department}</td>
                        <td className="px-2 py-0.5 border border-[#d4e8dc]">{r.date_created ?? ""}</td>
                        <td className="px-2 py-0.5 border border-[#d4e8dc]">{r.logged_version ?? ""}</td>
                        <td className="px-2 py-0.5 border border-[#d4e8dc]">{r.logged_date ?? ""}</td>
                        <td className="px-2 py-0.5 border border-[#d4e8dc]">{r.computer_name ?? ""}</td>
                        <td className="px-2 py-0.5 border border-[#d4e8dc]">{r.ip_address ?? ""}</td>
                        <td className="px-2 py-0.5 border border-[#d4e8dc]">{r.mac_address ?? ""}</td>
                        <td className="px-2 py-0.5 border border-[#d4e8dc]">{r.level}</td>
                      </tr>
                    ))}
                    {userRows.length === 0 && (
                      <tr>
                        <td colSpan={13} className="px-2 py-3 border border-[#d4e8dc] text-muted-foreground italic">
                          No user-rights records available.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              ) : (
                <table className="w-full text-[11px] border-collapse min-w-[1150px]">
                  <thead>
                    <tr className="bg-gradient-to-b from-[#6ec79b] to-[#2f9b68] text-white uppercase">
                      {["Module", "Description", "Read", "Write", "Delete", "Print", "Export", "Ref. ID"].map((h) => (
                        <th key={h} className="text-left px-2 py-1 border border-white/25">{h}</th>
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
                          idx % 2 ? "bg-[#f8fdf9]" : "bg-white",
                          r.isModuleHeader && "font-semibold bg-[#eef8f2]"
                        )}
                      >
                        <td className="px-2 py-0.5 border border-[#d4e8dc] whitespace-nowrap">{showModule ? r.module : ""}</td>
                        <td
                          onDoubleClick={() => applyAllPermissionsInRow(r)}
                          title="Double-click to check all permissions in this row"
                          className={cn(
                            "px-2 py-0.5 border border-[#d4e8dc] whitespace-nowrap cursor-pointer select-none",
                            !r.isModuleHeader && "pl-6"
                          )}
                        >
                          {r.description}
                        </td>
                        <td className="px-2 py-0.5 border border-[#d4e8dc] text-center">
                          <input
                            type="checkbox"
                            checked={r.read}
                            onChange={(e) => handlePrivilegeCheckboxChange(r, "read", e.target.checked)}
                          />
                        </td>
                        <td className="px-2 py-0.5 border border-[#d4e8dc] text-center">
                          <input
                            type="checkbox"
                            checked={r.write}
                            onChange={(e) => handlePrivilegeCheckboxChange(r, "write", e.target.checked)}
                          />
                        </td>
                        <td className="px-2 py-0.5 border border-[#d4e8dc] text-center">
                          <input
                            type="checkbox"
                            checked={r.delete}
                            onChange={(e) => handlePrivilegeCheckboxChange(r, "delete", e.target.checked)}
                          />
                        </td>
                        <td className="px-2 py-0.5 border border-[#d4e8dc] text-center">
                          <input
                            type="checkbox"
                            checked={r.print}
                            onChange={(e) => handlePrivilegeCheckboxChange(r, "print", e.target.checked)}
                          />
                        </td>
                        <td className="px-2 py-0.5 border border-[#d4e8dc] text-center">
                          <input
                            type="checkbox"
                            checked={r.export}
                            onChange={(e) => handlePrivilegeCheckboxChange(r, "export", e.target.checked)}
                          />
                        </td>
                        <td className="px-2 py-0.5 border border-[#d4e8dc] whitespace-nowrap">{r.ref_id}</td>
                      </tr>
                    )})}
                    {activeGroupPrivileges.length === 0 && (
                      <tr>
                        <td colSpan={8} className="px-2 py-3 border border-[#d4e8dc] text-muted-foreground italic">
                          No privileges available for this group.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>

      <Dialog open={addUserOpen} onOpenChange={setAddUserOpen}>
        <DialogContent className="max-w-[860px] p-0 gap-0 overflow-hidden border-2 border-[#0e8f63]">
          <DialogHeader className="bg-gradient-to-b from-[#16b67a] to-[#0f8f62] text-white px-3 py-1 border-b border-[#0c7752]">
            <DialogTitle className="text-[13px] font-bold">New User</DialogTitle>
          </DialogHeader>

          <div className="p-2 bg-white">
            <div className="flex items-center gap-2 mb-2">
              <div className="text-[12px] font-semibold w-12">Find...</div>
              <Input
                value={employeeSearch}
                onChange={(e) => setEmployeeSearch(e.target.value)}
                className="h-7 text-[12px]"
                placeholder="Search employee"
              />
              <Button size="sm" variant="outline" className="h-7 text-[11px] border-[#9ed9c1] bg-white">
                <Search className="h-3.5 w-3.5" />
                Search
              </Button>
            </div>

            <div className="grid grid-cols-12 gap-2 mb-2">
              <div className="col-span-2 border border-[#9ed9c1] h-[118px] grid place-items-center text-[12px] text-muted-foreground">
                No Picture
              </div>
              <div className="col-span-10 space-y-1">
                <div className="grid grid-cols-12 items-center gap-2">
                  <div className="col-span-2 text-[12px] font-semibold">Nickname</div>
                  <Input
                    className="col-span-10 h-7 text-[12px]"
                    value={
                      selectedEmployee
                        ? makeNickname(selectedEmployee.employee_name, selectedEmployee.employee_id)
                        : ""
                    }
                    readOnly
                  />
                </div>
                <div className="grid grid-cols-12 items-center gap-2">
                  <div className="col-span-2 text-[12px] font-semibold">Employee ID</div>
                  <Input className="col-span-10 h-7 text-[12px]" value={selectedEmployee?.employee_id ?? ""} readOnly />
                </div>
                <div className="grid grid-cols-12 items-center gap-2">
                  <div className="col-span-2 text-[12px] font-semibold">Employee Name</div>
                  <Input className="col-span-10 h-7 text-[12px]" value={selectedEmployee?.employee_name ?? ""} readOnly />
                </div>
                <div className="grid grid-cols-12 items-center gap-2">
                  <div className="col-span-2 text-[12px] font-semibold">Title</div>
                  <Input className="col-span-10 h-7 text-[12px]" value={selectedEmployee?.position_title ?? ""} readOnly />
                </div>
                <div className="grid grid-cols-12 items-center gap-2">
                  <div className="col-span-2 text-[12px] font-semibold">Department</div>
                  <Input className="col-span-10 h-7 text-[12px]" value={selectedEmployee?.department ?? ""} readOnly />
                </div>
              </div>
            </div>

            <div className="border border-[#79b898]">
              <div className="grid grid-cols-12 bg-gradient-to-b from-[#6ec79b] to-[#2f9b68] text-white text-[10px] font-bold uppercase">
                <div className="col-span-2 px-2 py-1 border-r border-white/25">Employee ID</div>
                <div className="col-span-6 px-2 py-1 border-r border-white/25">Employee Name</div>
                <div className="col-span-4 px-2 py-1">Position Title</div>
              </div>
              <div className="max-h-[260px] overflow-auto">
                {employeeLoading ? (
                  <div className="px-2 py-3 text-[12px] text-muted-foreground">Loading employees...</div>
                ) : filteredEmployees.length === 0 ? (
                  <div className="px-2 py-3 text-[12px] text-muted-foreground">No employees found.</div>
                ) : (
                  filteredEmployees.map((e, idx) => (
                    <button
                      type="button"
                      key={e.employee_id}
                      onClick={() => setSelectedEmployeeId(e.employee_id)}
                      className={cn(
                        "w-full grid grid-cols-12 text-left text-[11px] border-b border-[#d4e8dc]",
                        idx % 2 ? "bg-[#f8fdf9]" : "bg-white",
                        selectedEmployeeId === e.employee_id && "bg-[#d9f3e5]"
                      )}
                    >
                      <div className="col-span-2 px-2 py-0.5 border-r border-[#d4e8dc]">{e.employee_id}</div>
                      <div className="col-span-6 px-2 py-0.5 border-r border-[#d4e8dc] truncate">{e.employee_name}</div>
                      <div className="col-span-4 px-2 py-0.5 truncate">{e.position_title}</div>
                    </button>
                  ))
                )}
              </div>
              <div className="px-2 py-1 text-[11px] font-bold border-t border-[#79b898] text-[#c00]">
                TOTAL RECORD(S): {filteredEmployees.length}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 mt-2">
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-[11px] border-[#9ed9c1] bg-white"
                onClick={createUserFromEmployee}
              >
                CREATE
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-[11px] border-[#9ed9c1] bg-white"
                onClick={() => setAddUserOpen(false)}
              >
                CANCEL
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={groupPickerOpen} onOpenChange={setGroupPickerOpen}>
        <DialogContent className="max-w-[650px] p-0 gap-0 overflow-hidden border-2 border-[#0e8f63]">
          <DialogHeader className="bg-gradient-to-b from-[#16b67a] to-[#0f8f62] text-white px-3 py-1 border-b border-[#0c7752]">
            <DialogTitle className="text-[13px] font-bold">Select Group:</DialogTitle>
          </DialogHeader>

          <div className="p-2 bg-white">
            <div className="border border-[#79b898]">
              <div className="grid grid-cols-12 bg-gradient-to-b from-[#6ec79b] to-[#2f9b68] text-white text-[10px] font-bold uppercase">
                <div className="col-span-1 px-2 py-1 border-r border-white/25" />
                <div className="col-span-11 px-2 py-1">Users Group Name</div>
              </div>
              <div className="max-h-[250px] overflow-auto">
                {groupRows.length === 0 ? (
                  <div className="px-2 py-3 text-[12px] text-muted-foreground">No groups found.</div>
                ) : (
                  groupRows.map((g, idx) => (
                    <button
                      type="button"
                      key={g.name}
                      onClick={() => setSelectedGroupName(g.name)}
                      className={cn(
                        "w-full grid grid-cols-12 text-left text-[11px] border-b border-[#d4e8dc]",
                        idx % 2 ? "bg-[#f8fdf9]" : "bg-white",
                        selectedGroupName === g.name && "bg-[#d9f3e5]"
                      )}
                    >
                      <div className="col-span-1 px-2 py-0.5 border-r border-[#d4e8dc]">
                        <Users className="h-3 w-3 text-[#1f7a57]" />
                      </div>
                      <div className="col-span-11 px-2 py-0.5 truncate">{g.name}</div>
                    </button>
                  ))
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 text-[12px] mt-2">
              <button type="button" className="text-[#1f5e45] hover:underline" onClick={openNewGroupDialog}>
                New Group
              </button>
              <span>|</span>
              <button type="button" className="text-[#1f5e45] hover:underline" onClick={openEditGroupDialog}>
                Edit Group
              </button>
              <span>|</span>
              <button type="button" className="text-red-700 hover:underline" onClick={deleteSelectedGroup}>
                Delete Group
              </button>
            </div>

            <div className="flex items-center justify-end gap-2 mt-2">
              <Button size="sm" variant="outline" className="h-7 text-[11px] border-[#9ed9c1] bg-white" onClick={applySelectedGroup}>
                OK
              </Button>
              <Button size="sm" variant="outline" className="h-7 text-[11px] border-[#9ed9c1] bg-white" onClick={() => setGroupPickerOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={editUsernameOpen} onOpenChange={setEditUsernameOpen}>
        <DialogContent className="max-w-[430px] p-0 gap-0 overflow-hidden border-2 border-[#0e8f63]">
          <DialogHeader className="bg-gradient-to-b from-[#16b67a] to-[#0f8f62] text-white px-3 py-1 border-b border-[#0c7752]">
            <DialogTitle className="text-[13px] font-bold">Edit Username</DialogTitle>
          </DialogHeader>
          <div className="p-3 bg-white space-y-2">
            <div className="grid grid-cols-12 items-center gap-2">
              <div className="col-span-3 text-[12px] font-semibold">User ID</div>
              <Input className="col-span-9 h-7 text-[12px]" value={selectedUser?.id ?? ""} readOnly />
            </div>
            <div className="grid grid-cols-12 items-center gap-2">
              <div className="col-span-3 text-[12px] font-semibold">Username</div>
              <Input
                className="col-span-9 h-7 text-[12px]"
                value={usernameDraft}
                onChange={(e) => setUsernameDraft(e.target.value)}
              />
            </div>
            <div className="flex items-center justify-end gap-2 mt-3">
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-[11px] border-[#9ed9c1] bg-white"
                onClick={saveEditedUsername}
              >
                Save
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-[11px] border-[#9ed9c1] bg-white"
                onClick={() => setEditUsernameOpen(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={newGroupOpen} onOpenChange={setNewGroupOpen}>
        <DialogContent className="max-w-[620px] p-0 gap-0 overflow-hidden border-2 border-[#0e8f63]">
          <DialogHeader className="bg-gradient-to-b from-[#16b67a] to-[#0f8f62] text-white px-3 py-1 border-b border-[#0c7752]">
            <DialogTitle className="text-[13px] font-bold">New Group</DialogTitle>
          </DialogHeader>
          <div className="p-3 bg-white space-y-2">
            <div className="grid grid-cols-12 items-center gap-2">
              <div className="col-span-3 text-[12px] font-semibold">Group Name</div>
              <Input className="col-span-9 h-7 text-[12px]" value={groupForm.name} onChange={(e) => setGroupForm((s) => ({ ...s, name: e.target.value }))} />
            </div>
            <div className="grid grid-cols-12 items-center gap-2">
              <div className="col-span-3 text-[12px] font-semibold">Description</div>
              <Input className="col-span-9 h-7 text-[12px]" value={groupForm.description} onChange={(e) => setGroupForm((s) => ({ ...s, description: e.target.value }))} />
            </div>
            <div className="grid grid-cols-12 items-center gap-2">
              <div className="col-span-3 text-[12px] font-semibold leading-tight">Group Wallpaper</div>
              <div className="col-span-9 flex items-center gap-2">
                <Input className="h-7 text-[12px] flex-1" value={groupForm.wallpaper} onChange={(e) => setGroupForm((s) => ({ ...s, wallpaper: e.target.value }))} />
                <Button size="sm" variant="outline" className="h-7 text-[11px] border-[#9ed9c1] bg-white">Browse...</Button>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 mt-3">
              <Button size="sm" variant="outline" className="h-7 text-[11px] border-[#9ed9c1] bg-white" onClick={createGroup}>
                OK
              </Button>
              <Button size="sm" variant="outline" className="h-7 text-[11px] border-[#9ed9c1] bg-white" onClick={() => setNewGroupOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={editGroupOpen} onOpenChange={setEditGroupOpen}>
        <DialogContent className="max-w-[620px] p-0 gap-0 overflow-hidden border-2 border-[#0e8f63]">
          <DialogHeader className="bg-gradient-to-b from-[#16b67a] to-[#0f8f62] text-white px-3 py-1 border-b border-[#0c7752]">
            <DialogTitle className="text-[13px] font-bold">Edit Group</DialogTitle>
          </DialogHeader>
          <div className="p-3 bg-white space-y-2">
            <div className="grid grid-cols-12 items-center gap-2">
              <div className="col-span-3 text-[12px] font-semibold">Group Name</div>
              <Input className="col-span-9 h-7 text-[12px]" value={groupForm.name} onChange={(e) => setGroupForm((s) => ({ ...s, name: e.target.value }))} />
            </div>
            <div className="grid grid-cols-12 items-center gap-2">
              <div className="col-span-3 text-[12px] font-semibold">Description</div>
              <Input className="col-span-9 h-7 text-[12px]" value={groupForm.description} onChange={(e) => setGroupForm((s) => ({ ...s, description: e.target.value }))} />
            </div>
            <div className="grid grid-cols-12 items-center gap-2">
              <div className="col-span-3 text-[12px] font-semibold leading-tight">Group Wallpaper</div>
              <div className="col-span-9 flex items-center gap-2">
                <Input className="h-7 text-[12px] flex-1" value={groupForm.wallpaper} onChange={(e) => setGroupForm((s) => ({ ...s, wallpaper: e.target.value }))} />
                <Button size="sm" variant="outline" className="h-7 text-[11px] border-[#9ed9c1] bg-white">Browse...</Button>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 mt-3">
              <Button size="sm" variant="outline" className="h-7 text-[11px] border-[#9ed9c1] bg-white" onClick={saveEditedGroup}>
                OK
              </Button>
              <Button size="sm" variant="outline" className="h-7 text-[11px] border-[#9ed9c1] bg-white" onClick={() => setEditGroupOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

