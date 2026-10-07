"use client";

import { TraceProgressPanel } from "../components/TraceProgressPanel";
import { LineageHeader } from "../components/LineageHeader";

export function TraceProgressPage() {
  return (
    <div className="min-h-screen bg-[#f4f2ed]">
      <LineageHeader activeStep={2} />

      <main className="mx-auto max-w-[1500px] p-4 sm:p-6 lg:p-8">
        <TraceProgressPanel />
      </main>
    </div>
  );
}