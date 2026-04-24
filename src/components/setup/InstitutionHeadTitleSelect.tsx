"use client";

import { useEffect, useState } from "react";
import { InstitutionHeadTitle } from "@/types/institution";
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
import { Loader2, Plus, AlertCircle, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

export function InstitutionHeadTitleSelect({ value, onChange, error }: Props) {
  const [titles, setTitles] = useState<InstitutionHeadTitle[]>([]);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [newTitleName, setNewTitleName] = useState("");
  const [editTitleName, setEditTitleName] = useState("");
  const selectedTitle = titles.find((item) => item.name === value);

  const fetchTitles = async () => {
    try {
      setFetchError(null);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/institution-head-titles`);
      if (!response.ok) throw new Error("Failed to fetch head titles");
      const data: InstitutionHeadTitle[] = await response.json();
      setTitles(data);
    } catch (err) {
      console.error(err);
      setFetchError("Could not load title options");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTitles();
  }, []);

  const createTitle = async () => {
    const name = newTitleName.trim();
    if (!name) {
      setActionError("Title is required");
      return;
    }

    setWorking(true);
    setActionError(null);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/institution-head-titles`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result?.error || "Failed to add title");

      await fetchTitles();
      onChange(result.name);
      setNewTitleName("");
      setAddOpen(false);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to add title");
    } finally {
      setWorking(false);
    }
  };

  const updateTitle = async () => {
    if (!selectedTitle) return;
    const name = editTitleName.trim();
    if (!name) {
      setActionError("Title is required");
      return;
    }
    if (name === selectedTitle.name) {
      setEditOpen(false);
      return;
    }

    setWorking(true);
    setActionError(null);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/institution-head-titles/${selectedTitle.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result?.error || "Failed to update title");

      await fetchTitles();
      onChange(result.name);
      setEditOpen(false);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to update title");
    } finally {
      setWorking(false);
    }
  };

  const deleteTitle = async () => {
    if (!selectedTitle) return;

    setWorking(true);
    setActionError(null);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/institution-head-titles/${selectedTitle.id}`, {
        method: "DELETE",
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result?.error || "Failed to delete title");

      onChange("");
      await fetchTitles();
      setDeleteOpen(false);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to delete title");
    } finally {
      setWorking(false);
    }
  };

  return (
    <div className="space-y-1.5 w-full">
      <div className="flex items-center gap-1.5">
        <Select value={value || "none"} onValueChange={(next) => onChange(next === "none" ? "" : next)} disabled={loading || working}>
          <SelectTrigger className={cn(
            "h-9 bg-background/50 border-border/60 hover:border-emerald-500/50 transition-all rounded-xl shadow-sm",
            error && "border-destructive/50 ring-destructive/10"
          )}>
            <SelectValue placeholder={loading ? "Loading..." : "Select Title"} />
          </SelectTrigger>
          <SelectContent className="rounded-xl border-border/60 shadow-xl">
            <SelectItem value="none" className="text-xs">-- None --</SelectItem>
            {titles.map((item) => (
              <SelectItem key={item.id} value={item.name} className="text-xs">
                {item.name}
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
              setNewTitleName("");
              setAddOpen(true);
            }}
            disabled={working}
            title="Add Title"
          >
            <Plus className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-8 w-8 rounded-lg hover:bg-emerald-500/10 hover:text-emerald-600 transition-colors"
            onClick={() => {
              if (!selectedTitle) return;
              setActionError(null);
              setEditTitleName(selectedTitle.name);
              setEditOpen(true);
            }}
            disabled={!selectedTitle || working}
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
            disabled={!selectedTitle || working}
            title="Delete Selection"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {(loading || working) && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-3 w-3 animate-spin" />
          Synchronizing title options...
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
            <DialogTitle>Add Official Title</DialogTitle>
            <DialogDescription>Create a new title option for institution heads.</DialogDescription>
          </DialogHeader>
          <Input
            value={newTitleName}
            onChange={(e) => setNewTitleName(e.target.value)}
            placeholder="e.g. President"
            disabled={working}
          />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setAddOpen(false)} disabled={working}>
              Cancel
            </Button>
            <Button type="button" onClick={createTitle} disabled={working}>
              {working ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Official Title</DialogTitle>
            <DialogDescription>Update the selected title option.</DialogDescription>
          </DialogHeader>
          <Input
            value={editTitleName}
            onChange={(e) => setEditTitleName(e.target.value)}
            placeholder="e.g. President"
            disabled={working}
          />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setEditOpen(false)} disabled={working}>
              Cancel
            </Button>
            <Button type="button" onClick={updateTitle} disabled={working}>
              {working ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Official Title?</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedTitle
                ? `This will remove "${selectedTitle.name}" from title options.`
                : "This will remove the selected option."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={working}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={deleteTitle} disabled={working}>
              {working ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
