"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GitBranch } from "lucide-react";

import { RegulatoryReportPanel } from "../components/RegulatoryReportPanel";
import { DataPointPanel } from "../components/DataPointPanel";
import { SourceSystemPanel } from "../components/SourceSystemPanel";
import { ReportProvider } from "../context/ReportContext";

export function LineagePage() {
  const router = useRouter();

  const [mode, setMode] = useState<"reverse" | "forward">("reverse");

  return (
    <div className="min-h-screen bg-[#f4f2ed]">
      {/* Dark navy header */}
      <header className="bg-[#1a2332] text-white">
        <div className="mx-auto flex h-14 max-w-[1500px] items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10">
              <GitBranch size={16} />
            </div>

            <span className="text-sm font-bold tracking-tight">
              Lineage Tracer
            </span>

            <span className="rounded bg-white/15 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">
              POC
            </span>
          </div>

          {/* Step navigation */}
          <nav className="hidden items-center gap-1 md:flex">
            {/* Step 1 */}
            <button
              onClick={() => router.push("/lineage")}
              className="flex items-center gap-1.5 rounded-md bg-white/15 px-3 py-1.5 text-[11px] font-semibold text-white"
            >
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-white text-[9px] font-bold text-[#1a2332]">
                1
              </span>

              Initiate trace
            </button>

            {/* Step 2 */}
            <button
              onClick={() => router.push("/lineage/trace-progress")}
              className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[11px] font-semibold text-white/50 transition hover:text-white/80"
            >
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-white/20 text-[9px] font-bold">
                2
              </span>

              Trace progress
            </button>

            {/* Step 3 */}
            <button
              onClick={() => router.push("/lineage/evidence")}
              className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[11px] font-semibold text-white/50 transition hover:text-white/80"
            >
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-white/20 text-[9px] font-bold">
                3
              </span>

              Lineage and evidence
            </button>
          </nav>
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-[1500px] p-4 sm:p-6 lg:p-8">
        {/* Title + toggle */}
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-lg font-bold tracking-tight text-ink sm:text-xl">
              Reverse lineage: from a reported data point to its system of
              record
            </h1>

            <p className="mt-1 text-xs text-slate-500">
              Upload the regulatory report, select the data point and identify
              the system from which the report was obtained.
            </p>
          </div>

          {/* Reverse / Forward toggle */}
          <div className="flex shrink-0 rounded-lg border border-slate-300 bg-white p-1">
            <button
              onClick={() => setMode("reverse")}
              className={`rounded-md px-4 py-2 text-[11px] font-semibold transition ${mode === "reverse"
                  ? "bg-navy text-white shadow-sm"
                  : "text-slate-500 hover:text-ink"
                }`}
            >
              Reverse lineage
            </button>

            <button
              onClick={() => setMode("forward")}
              className={`rounded-md px-4 py-2 text-[11px] font-semibold transition ${mode === "forward"
                  ? "bg-navy text-white shadow-sm"
                  : "text-slate-500 hover:text-ink"
                }`}
            >
              Forward lineage
            </button>
          </div>
        </div>

        {/* 3-column panels */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_2fr_1fr]">
          <ReportProvider>
            <RegulatoryReportPanel />
            <DataPointPanel />
            <SourceSystemPanel
              onConnect={() => router.push("/lineage/trace-progress")}
            />
          </ReportProvider>
        </div>
      </main>
    </div>
  );
}