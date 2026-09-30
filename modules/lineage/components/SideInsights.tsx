import { Clock3, FileSearch, Info, Layers3 } from "lucide-react";
import { StatusBadge } from "@/shared/components/StatusBadge";

export function SideInsights() {
  return (
    <aside className="space-y-4">
      <div className="panel p-4">
        <div className="flex items-center gap-2">
          <Layers3 size={16} className="text-blue" />
          <h3 className="text-sm font-bold text-ink">Pilot scope · 10 cells</h3>
        </div>
        <p className="mt-3 text-xs leading-5 text-slate-600">
          C 07.00 Corporates (original exposure, exposure value, RWEA), Institutions
          and Retail; C 01.00 CET1; C 02.00 total risk exposure; C 03.00 CET1 ratio.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <StatusBadge status="complete" count={7} />
          <StatusBadge status="partial" count={2} />
          <StatusBadge status="gap" count={1} />
        </div>
      </div>

      <div className="panel p-4">
        <div className="flex items-center gap-2">
          <Clock3 size={16} className="text-blue" />
          <h3 className="text-sm font-bold text-ink">Recent lineage queries</h3>
        </div>
        <div className="mt-3 space-y-1">
          {[
            "C 07.00 · Corporates · Exposure value",
            "C 03.00 · CET1 ratio",
            "C 01.00 · Common Equity Tier 1 capital",
          ].map((query) => (
            <button
              key={query}
              className="flex w-full items-start gap-2 rounded-lg px-2 py-2 text-left text-xs text-slate-600 hover:bg-slate-50"
            >
              <FileSearch size={14} className="mt-0.5 shrink-0 text-slate-400" />
              {query}
            </button>
          ))}
        </div>
      </div>

      <div className="panel bg-slate-50 p-4">
        <div className="flex items-start gap-2">
          <Info size={16} className="mt-0.5 text-slate-500" />
          <p className="text-[11px] leading-5 text-slate-600">
            Each cell carries a coverage badge: complete, partial, gap or not yet
            in scope. Status is shown with text as well as colour.
          </p>
        </div>
      </div>
    </aside>
  );
}