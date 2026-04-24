"use client";

import { useEffect, useState } from "react";
import { InstitutionClassification } from "@/types/institution";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
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
import { Loader2, AlertCircle, Plus, Pencil, Trash2 } from "lucide-react";

interface Props {
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

export function InstitutionClassificationSelect({ value, onChange, error }: Props) {
  const [classifications, setClassifications] = useState<InstitutionClassification[]>([]);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [newClassificationName, setNewClassificationName] = useState("");
  const [editClassificationName, setEditClassificationName] = useState("");
  const selectedClassification = classifications.find((item) => item.id.toString() === value);

  const fetchClassifications = async () => {
    try {
      setFetchError(null);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/institution-classifications`);
      if (!response.ok) throw new Error("Failed to fetch classifications");
      const data = await response.json();
      setClassifications(data);
    } catch (err) {
      setFetchError("Could not load classifications");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClassifications();
  }, []);

  const createClassification = async () => {
    const name = newClassificationName.trim();
    if (!name) {
      setActionError("Name is required");
      return;
    }

    setWorking(true);
    setActionError(null);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/institution-classifications`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result?.error || "Failed to add classification");

      await fetchClassifications();
      onChange(result.id.toString());
      setNewClassificationName("");
      setAddOpen(false);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to add classification");
    } finally {
      setWorking(false);
    }
  };

  const updateClassification = async () => {
    if (!selectedClassification) return;
    const name = editClassificationName.trim();
    if (!name) {
      setActionError("Name is required");
      return;
    }
    if (name === selectedClassification.name) {
      setEditOpen(false);
      return;
    }

    setWorking(true);
    setActionError(null);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/institution-classifications/${selectedClassification.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, description: selectedClassification.description || "" }),
        }
      );

      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result?.error || "Failed to update classification");
      await fetchClassifications();
      setEditOpen(false);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to update classification");
    } finally {
      setWorking(false);
    }
  };

  const deleteClassification = async () => {
    if (!selectedClassification) return;

    setWorking(true);
    setActionError(null);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/institution-classifications/${selectedClassification.id}`,
        { method: "DELETE" }
      );
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result?.error || "Failed to delete classification");

      onChange("");
      await fetchClassifications();
      setDeleteOpen(false);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to delete classification");
    } finally {
      setWorking(false);
    }
  };

  return (
    <div className="space-y-1.5 w-full">
      <div className="flex items-center gap-1.5">
        <Select value={value} onValueChange={onChange} disabled={loading || working}>
          <SelectTrigger className={cn(
            "h-9 bg-background/50 border-border/60 hover:border-emerald-500/50 transition-all rounded-xl shadow-sm",
            error && "border-destructive/50 ring-destructive/10"
          )}>
            <SelectValue placeholder={loading ? "Loading..." : "Select Classification"} />
          </SelectTrigger>
          <SelectContent className="rounded-xl border-border/60 shadow-xl">
            {classifications.map((item) => (
              <SelectItem key={item.id} value={item.id.toString()} className="text-xs">
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
              setNewClassificationName("");
              setAddOpen(true);
            }}
            disabled={working}
            title="Add Classification"
          >
            <Plus className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-8 w-8 rounded-lg hover:bg-emerald-500/10 hover:text-emerald-600 transition-colors"
            onClick={() => {
              if (!selectedClassification) return;
              setActionError(null);
              setEditClassificationName(selectedClassification.name);
              setEditOpen(true);
            }}
            disabled={!selectedClassification || working}
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
            disabled={!selectedClassification || working}
            title="Delete Selection"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
      {(loading || working) && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground animate-pulse">
          <Loader2 className="h-3 w-3 animate-spin" />
          Synchronizing with lookup data...
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
      {error && <p className="text-xs font-medium text-destructive">{error}</p>}

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Classification</DialogTitle>
            <DialogDescription>Create a new classification option.</DialogDescription>
          </DialogHeader>
          <Input
            value={newClassificationName}
            onChange={(e) => setNewClassificationName(e.target.value)}
            placeholder="Classification name"
            disabled={working}
          />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setAddOpen(false)} disabled={working}>
              Cancel
            </Button>
            <Button type="button" onClick={createClassification} disabled={working}>
              {working ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Classification</DialogTitle>
            <DialogDescription>Update the selected classification name.</DialogDescription>
          </DialogHeader>
          <Input
            value={editClassificationName}
            onChange={(e) => setEditClassificationName(e.target.value)}
            placeholder="Classification name"
            disabled={working}
          />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setEditOpen(false)} disabled={working}>
              Cancel
            </Button>
            <Button type="button" onClick={updateClassification} disabled={working}>
              {working ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Classification?</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedClassification
                ? `This will remove "${selectedClassification.name}" from available options.`
                : "This will remove the selected option."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={working}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={deleteClassification} disabled={working}>
              {working ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
