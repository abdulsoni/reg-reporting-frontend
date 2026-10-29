import { GitBranch, Check } from "lucide-react";

export default function DataLineageHeader() {
  const steps = ["Upload PDF", "Select Datapoint", "Data Lineage"];
  return (
    <header className="flex min-h-[52px] items-center justify-between gap-4 bg-[#102d55] px-5 text-white shadow-sm sm:px-7">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/30"><GitBranch size={21} /></span>
        <span className="text-base font-bold">Lineage Tracer</span>
        <span className="rounded-md bg-blue-500/40 px-2.5 py-1 text-[11px] font-bold">POC</span>
      </div>
      <div className="flex items-center gap-1 sm:gap-2">
        {steps.map((step, i) => <div key={step} className={`flex items-center gap-1.5 rounded-lg px-1.5 py-1.5 text-[11px] font-semibold sm:gap-2 sm:px-2.5 ${i === 2 ? "bg-white/15 text-white" : "text-blue-100"}`}>
          <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${i === 2 ? "bg-white text-[#102d55]" : "bg-blue-400/30"}`}>{i + 1}</span>
          <span className="hidden sm:inline">{step}</span>
          {i < 2 && <Check size={14} className="text-emerald-300" />}
        </div>)}
      </div>
    </header>
  );
}
