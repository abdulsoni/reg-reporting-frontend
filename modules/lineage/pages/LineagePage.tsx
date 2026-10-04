"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { RegulatoryReportPanel } from "../components/RegulatoryReportPanel";
import { DataPointPanel } from "../components/DataPointPanel";
import { SourceSystemPanel } from "../components/SourceSystemPanel";
import { LineageHeader } from "../components/LineageHeader";
import { ReportProvider } from "../context/ReportContext";

export function LineagePage() {
  const router = useRouter();

  const [mode, setMode] = useState<"reverse" | "forward">("reverse");

  return (
    <div className="min-h-screen bg-[#f4f2ed]">
      <LineageHeader activeStep={1} />

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