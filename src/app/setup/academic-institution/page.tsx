"use client";

import { useEffect, useState } from "react";
import { AcademicInstitution, AcademicInstitutionPayload } from "@/types/institution";
import { AcademicInstitutionForm } from "@/components/setup/AcademicInstitutionForm";
import { Loader2, Info } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "@/hooks/use-toast";

export default function AcademicInstitutionPage() {
  const [institution, setInstitution] = useState<AcademicInstitution | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/academic-institutions`);
      if (!response.ok) throw new Error("Failed to fetch data");
      const data: AcademicInstitution[] = await response.json();
      // For setup, we typically only manage one institution record
      if (data.length > 0) {
        setInstitution(data[0]);
      }
    } catch (err) {
      console.error("Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (payload: AcademicInstitutionPayload) => {
    setSubmitting(true);
    try {
      const url = institution 
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/academic-institutions/${institution.id}`
        : `${process.env.NEXT_PUBLIC_API_URL}/api/academic-institutions`;
      
      const method = institution ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Failed to save institutional data");
      
      const savedData = await response.json();
      setInstitution(savedData);
      toast({
        title: "Saved",
        description: "Institutional configuration updated successfully!",
      });
    } catch (err) {
      toast({
        title: "Save failed",
        description: err instanceof Error ? err.message : "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-2 bg-background animate-pulse">
        <Loader2 className="h-12 w-12 animate-spin text-primary/40 mb-4" />
        <p className="text-muted-foreground font-medium uppercase tracking-[0.2em] text-xs">Initializing Secure Connection...</p>
      </div>
    );
  }

  return (
    <div className="h-full bg-background relative overflow-x-hidden">

      <div className="w-full px-2 pt-2 pb-4">
        {!institution && (
          <Alert className="mb-8 rounded-2xl border-2 bg-emerald-500/5 border-emerald-500/20 text-emerald-700">
            <Info className="h-4 w-4" />
            <AlertTitle className="font-bold">System Setup Required</AlertTitle>
            <AlertDescription className="font-medium">
              No institution record found. Please complete the registration form to initialize the school management environment.
            </AlertDescription>
          </Alert>
        )}

        <AcademicInstitutionForm 
          initialData={institution} 
          onSubmit={handleSubmit} 
          loading={submitting} 
        />
      </div>
    </div>
  );
}
