import { GitBranch } from "lucide-react";

const STEPS = ["Upload PDF", "Select Datapoint", "Data Lineage"] as const;

export default function DataLineageHeader() {
  const activeIndex = STEPS.length - 1;

  return (
    <header className="bg-[#1a2332] text-white">
      <div className="mx-auto flex h-14 max-w-[1500px] items-center justify-between px-4 sm:px-6 lg:px-8">
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

        <nav className="hidden items-center gap-1 md:flex">
          {STEPS.map((step, index) => {
            const active = index === activeIndex;

            return (
              <div
                key={step}
                aria-current={active ? "step" : undefined}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[11px] font-semibold transition ${
                  active
                    ? "bg-white/15 text-white"
                    : "text-white/50"
                }`}
              >
                <span
                  className={`flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold ${
                    active ? "bg-white text-[#1a2332]" : "bg-white/20"
                  }`}
                >
                  {index + 1}
                </span>

                {step}
              </div>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
