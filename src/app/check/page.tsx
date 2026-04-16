"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Loader2, Database, Server, Laptop, RefreshCw, ChevronRight } from "lucide-react";
import Link from "next/link";

type Status = "checking" | "success" | "error" | "idle";

interface ConnectionState {
  frontend: Status;
  backend: Status;
  database: Status;
  details?: {
    api?: string;
    db?: string;
    count?: number;
  };
}

export default function ConnectionCheckPage() {
  const [state, setState] = useState<ConnectionState>({
    frontend: "success",
    backend: "idle",
    database: "idle",
  });
  const [loading, setLoading] = useState(false);

  const runCheck = async () => {
    setLoading(true);
    setState(prev => ({ ...prev, backend: "checking", database: "checking" }));

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
      const response = await fetch(`${apiUrl}/api/health/full`);
      
      if (!response.ok) throw new Error("Backend unreachable");
      
      const data = await response.json();
      
      setState({
        frontend: "success",
        backend: data.services.api.status === "running" ? "success" : "error",
        database: data.services.database.status === "connected" ? "success" : "error",
        details: {
          api: data.services.api.status,
          db: data.services.database.details,
          count: data.services.database.count
        }
      });
    } catch (err) {
      console.error("Check failed:", err);
      setState({
        frontend: "success",
        backend: "error",
        database: "error",
        details: {
          api: "Disconnected",
          db: err instanceof Error ? err.message : "Connection failed"
        }
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runCheck();
  }, []);

  const StatusIcon = ({ status }: { status: Status }) => {
    if (status === "checking") return <Loader2 className="h-5 w-5 animate-spin text-blue-500" />;
    if (status === "success") return <CheckCircle2 className="h-5 w-5 text-emerald-500" />;
    if (status === "error") return <XCircle className="h-5 w-5 text-destructive" />;
    return <div className="h-5 w-5 rounded-full border-2 border-muted" />;
  };

  const StatusBadge = ({ status }: { status: Status }) => {
    if (status === "checking") return <Badge variant="secondary" className="animate-pulse">Checking...</Badge>;
    if (status === "success") return <Badge variant="default" className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-emerald-500/20">Connected</Badge>;
    if (status === "error") return <Badge variant="destructive">Error</Badge>;
    return <Badge variant="outline" className="text-muted-foreground">Idle</Badge>;
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            System Connectivity
          </h1>
          <p className="text-muted-foreground text-lg">
            Verifying full-stack synchronization and database health.
          </p>
        </div>

        <div className="grid gap-6">
          {/* Frontend Card */}
          <Card className="overflow-hidden border-2 transition-all hover:border-emerald-500/20 group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-primary/10 text-primary">
                    <Laptop className="h-6 w-6" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Frontend Application</CardTitle>
                    <CardDescription>Next.js Client Status</CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={state.frontend} />
                  <StatusIcon status={state.frontend} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Backend Card */}
          <Card className={`overflow-hidden border-2 transition-all group ${state.backend === "error" ? "border-destructive/20" : "hover:border-emerald-500/20"}`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-blue-500/10 text-blue-500">
                    <Server className="h-6 w-6" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">API Server</CardTitle>
                    <CardDescription>Express Backend at :3001</CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={state.backend} />
                  <StatusIcon status={state.backend} />
                </div>
              </div>
              {state.details?.api && state.backend === "error" && (
                <div className="mt-4 p-3 rounded-lg bg-destructive/5 text-destructive text-xs font-mono">
                  Error: {state.details.api}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Database Card */}
          <Card className={`overflow-hidden border-2 transition-all group ${state.database === "error" ? "border-destructive/20" : "hover:border-emerald-500/20"}`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-500">
                    <Database className="h-6 w-6" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">PostgreSQL Database</CardTitle>
                    <CardDescription>school_db Connection</CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={state.database} />
                  <StatusIcon status={state.database} />
                </div>
              </div>
              {state.details?.db && (
                <div className={`mt-4 p-3 rounded-lg text-xs font-mono ${state.database === "error" ? "bg-destructive/5 text-destructive" : "bg-emerald-500/5 text-emerald-500"}`}>
                  <div className="flex justify-between items-center">
                    <span>{state.database === "error" ? "Error: " : "Status: "} {state.details.db}</span>
                    {state.database === "success" && typeof state.details.count === 'number' && (
                      <Badge variant="outline" className="ml-2 font-sans border-emerald-500/30 text-emerald-600 bg-emerald-500/5">
                        {state.details.count} Records Found
                      </Badge>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Button 
            size="lg" 
            variant="outline" 
            onClick={runCheck} 
            disabled={loading}
            className="w-full sm:w-auto gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Run Diagnostics
          </Button>
          <Button 
            size="lg" 
            asChild
            className="w-full sm:w-auto gap-2 bg-gradient-to-r from-primary to-primary/80"
          >
            <Link href="/">
              Go to Dashboard
              <ChevronRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        <p className="text-center text-xs text-muted-foreground italic">
          If connection fails, check your .env configuration and ensure local services are running.
        </p>
      </div>
    </div>
  );
}
