"use client";

import { TraceProgressPanel } from "../components/TraceProgressPanel";
import { LineageHeader } from "../components/LineageHeader";

export function TraceProgressPage() {
  return (
    <div className="min-h-screen bg-[#f4f2ed]">
      <LineageHeader activeStep={2} />
      <TraceProgressPanel />
    </div>
  );
}
