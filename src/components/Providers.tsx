"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider, useTheme } from "@/lib/theme";
import { Sidebar } from "@/components/Sidebar";
import { Toaster as SileoToaster } from "sileo";

function AppShell({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme();
  const invertedSileoTheme = theme === "light" ? "dark" : "light";
  const toastFill = theme === "light" ? "#0b0b0b" : "#f4f4f5";
  const toastTextClass = theme === "light" ? "!text-white" : "!text-zinc-900";
  const toastSubTextClass = theme === "light" ? "!text-zinc-300" : "!text-zinc-600";

  return (
    <TooltipProvider>
      <div className="flex h-screen overflow-hidden bg-background">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <main className="flex-1 overflow-y-auto">{children}</main>
        </div>
      </div>
      <SileoToaster
        position="top-center"
        theme={invertedSileoTheme}
        options={{
          fill: toastFill,
          styles: {
            title: toastTextClass,
            description: toastSubTextClass,
          },
        }}
      />
    </TooltipProvider>
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <AppShell>{children}</AppShell>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
