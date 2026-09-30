import { ArrowRight } from "lucide-react";
import { StatusBadge } from "@/shared/components/StatusBadge";
import { templates } from "../data/templates";
import type { Template } from "@/shared/types/report";

export function TemplateTable() {
  return (
    <div className="panel overflow-hidden">
      <div className="hidden grid-cols-[105px_minmax(220px,1fr)_110px_230px_90px] gap-4 border-b border-slate-200 bg-slate-50 px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 md:grid">
        <div>Template</div>
        <div>Name</div>
        <div>Pilot cells</div>
        <div>Lineage coverage</div>
        <div />
      </div>

      <div className="divide-y divide-slate-100">
        {templates.map((item) => (
          <TemplateRow key={item.code} item={item} />
        ))}
      </div>
    </div>
  );
}

function TemplateRow({ item }: { item: Template }) {
  return (
    <div className="grid gap-3 px-4 py-4 transition hover:bg-slate-50 md:grid-cols-[105px_minmax(220px,1fr)_110px_230px_90px] md:items-center md:gap-4 md:px-5">
      <div className="font-mono text-xs font-semibold text-slate-600">{item.code}</div>

      <div>
        <div className="text-sm font-semibold text-ink">{item.name}</div>
        <div className="mt-2 md:hidden">
          <StatusBadge status={item.status} />
        </div>
      </div>

      <div className="text-xs text-slate-500">
        <span className="mr-2 md:hidden">Pilot cells:</span>
        {item.cells}
      </div>

      <div>
        <div className="flex items-center gap-3">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200">
            <div
              className={`h-full rounded-full ${
                item.status === "not-scope"
                  ? "bg-slate-300"
                  : item.status === "partial"
                    ? "bg-amber-500"
                    : "bg-navy"
              }`}
              style={{ width: `${item.coverage}%` }}
            />
          </div>
          <span className="hidden min-w-[115px] text-[11px] text-slate-500 sm:block">
            {item.detail}
          </span>
        </div>
        <div className="mt-2 sm:hidden">
          <span className="text-[11px] text-slate-500">{item.detail}</span>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          className="btn-primary h-9 w-full md:w-auto"
          onClick={() => alert(`Opening ${item.code}`)}
        >
          Open
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
}