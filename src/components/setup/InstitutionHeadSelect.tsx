"use client";

import { useEffect, useState } from "react";
import { InstitutionHead } from "@/types/institution";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2, Plus, Pencil, Trash2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

export function InstitutionHeadSelect({ value, onChange, error }: Props) {
  const [heads, setHeads] = useState<InstitutionHead[]>([]);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [newHeadName, setNewHeadName] = useState("");
  const [editHeadName, setEditHeadName] = useState("");

  const selectedHead = heads.find((item) => item.id.toString() === value);

  const fetchHeads = async () => {
    try {
      setFetchError(null);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/institution-heads`);
      if (!response.ok) throw new Error("Failed to fetch institution heads");
      const data: InstitutionHead[] = await response.json();
      setHeads(data);
    } catch (err) {
      console.error(err);
      setFetchError("Could not load institution heads");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHeads();
  }, []);

  const createHead = async () => {
    const fullName = newHeadName.trim();
    if (!fullName) {
      setActionError("Full name is required");
      return;
    }

    setWorking(true);
    setActionError(null);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/institution-heads`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ full_name: fullName }),
      });

      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result?.error || "Failed to add institution head");

      await fetchHeads();
      onChange(result.id.toString());
      setNewHeadName("");
      setAddOpen(false);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to add institution head");
    } finally {
      setWorking(false);
    }
  };

  const updateHead = async () => {
    if (!selectedHead) return;
    const fullName = editHeadName.trim();
    if (!fullName) {
      setActionError("Full name is required");
      return;
    }
    if (fullName === selectedHead.full_name) {
      setEditOpen(false);
      return;
    }

    setWorking(true);
    setActionError(null);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/institution-heads/${selectedHead.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ full_name: fullName }),
      });

      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result?.error || "Failed to update institution head");

      await fetchHeads();
      setEditOpen(false);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to update institution head");
    } finally {
      setWorking(false);
    }
  };

  const deleteHead = async () => {
    if (!selectedHead) return;

    setWorking(true);
    setActionError(null);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/institution-heads/${selectedHead.id}`, {
        method: "DELETE",
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result?.error || "Failed to delete institution head");

      onChange("");
      await fetchHeads();
      setDeleteOpen(false);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to delete institution head");
    } finally {
      setWorking(false);
    }
  };

  return (
    <div className="space-y-1.5 w-full">
      <div className="flex items-center gap-1.5">
        <Select
          value={value || "none"}
          onValueChange={(next) => onChange(next === "none" ? "" : next)}
          disabled={loading || working}
        >
          <SelectTrigger className={cn("h-9 rounded-xl border-border/60 bg-background shadow-sm", error && "border-destructive ring-destructive/20")}>
            <SelectValue placeholder={loading ? "Loading..." : "Select Person"} />
          </SelectTrigger>
          <SelectContent className="rounded-xl border-border/60 shadow-xl">
            <SelectItem value="none" className="text-xs">-- None --</SelectItem>
            {heads.map((item) => (
              <SelectItem key={item.id} value={item.id.toString()} className="text-xs">
                {item.full_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center gap-1 bg-muted/20 p-1 rounded-xl border border-border/40">
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-8 w-8 rounded-lg hover:bg-emerald-500/10 hover:text-emerald-600 transition-colors"
            onClick={() => {
              setActionError(null);
              setNewHeadName("");
              setAddOpen(true);
            }}
            disabled={working}
            title="Add Person"
          >
            <Plus className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-8 w-8 rounded-lg hover:bg-emerald-500/10 hover:text-emerald-600 transition-colors"
            onClick={() => {
              if (!selectedHead) return;
              setActionError(null);
              setEditHeadName(selectedHead.full_name);
              setEditOpen(true);
            }}
            disabled={!selectedHead || working}
            title="Edit Selection"
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-8 w-8 rounded-lg hover:bg-destructive/10 hover:text-destructive transition-colors"
            onClick={() => {
              setActionError(null);
              setDeleteOpen(true);
            }}
            disabled={!selectedHead || working}
            title="Delete Selection"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {(loading || working) && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-3 w-3 animate-spin" />
          Synchronizing head options...
        </div>
      )}

      {fetchError && (
        <div className="flex items-center gap-2 text-xs text-amber-500">
          <AlertCircle className="h-3 w-3" />
          {fetchError}
        </div>
      )}

      {actionError && (
        <div className="flex items-center gap-2 text-xs text-destructive">
          <AlertCircle className="h-3 w-3" />
          {actionError}
        </div>
      )}

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Institution Head</DialogTitle>
            <DialogDescription>Create a new selectable head option.</DialogDescription>
          </DialogHeader>
          <Input
            value={newHeadName}
            onChange={(e) => setNewHeadName(e.target.value)}
            placeholder="Full name"
            disabled={working}
          />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setAddOpen(false)} disabled={working}>
              Cancel
            </Button>
            <Button type="button" onClick={createHead} disabled={working}>
              {working ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Institution Head</DialogTitle>
            <DialogDescription>Update the selected head name.</DialogDescription>
          </DialogHeader>
          <Input
            value={editHeadName}
            onChange={(e) => setEditHeadName(e.target.value)}
            placeholder="Full name"
            disabled={working}
          />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setEditOpen(false)} disabled={working}>
              Cancel
            </Button>
            <Button type="button" onClick={updateHead} disabled={working}>
              {working ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Institution Head?</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedHead
                ? `This will remove "${selectedHead.full_name}" from the dropdown options.`
                : "This will remove the selected option."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={working}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={deleteHead} disabled={working}>
              {working ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
