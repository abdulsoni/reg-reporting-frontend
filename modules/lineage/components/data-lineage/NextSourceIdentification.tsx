"use client";

import { Search } from "lucide-react";
import type { DataTraceNextSource } from "../../types/dataTrace";
import { formatTraceValue } from "../../utils/dataTraceMapper";

type Props = {
  nextSource: DataTraceNextSource;
  onIdentify: (system: string) => void;
};

function connectionLabel(value: string): string {
  if (value === "not_connected") {
    return "Not connected";
  }

  return value.replaceAll("_", " ");
}

export default function NextSourceIdentification({
  nextSource,
  onIdentify,
}: Props) {
  const system =
    nextSource.system ??
    nextSource.system_id ??
    "Unknown source";

  return (
    <div className="border-t border-slate-200 bg-slate-50/70 px-4 py-4">
      <div className="grid gap-3 lg:grid-cols-[minmax(280px,1.7fr)_0.75fr_1.25fr_1fr_0.8fr_auto] lg:items-center">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-soft">
            <Search size={18} />
          </span>

          <div>
            <h3 className="text-xs font-bold text-ink">
              Next source identification
            </h3>

            <p className="mt-1 text-[10px] leading-4 text-slate-600">
              {nextSource.message ??
                `${system} is not fully connected. Connect it to complete the data lineage.`}
            </p>
          </div>
        </div>

        <div className="border-l border-slate-200 pl-3">
          <p className="text-[10px] text-slate-500">Source system</p>

          <p className="mt-1 text-[11px] font-semibold text-ink">{system}</p>
        </div>

        <div className="border-l border-slate-200 pl-3">
          <p className="text-[10px] text-slate-500">
            Last known table / attribute
          </p>

          <p className="mt-1 text-[11px] font-semibold text-ink">
            {nextSource.last_table ?? "—"} /{" "}
            {nextSource.last_attribute ?? "—"}
          </p>
        </div>

        <div className="border-l border-slate-200 pl-3">
          <p className="text-[10px] text-slate-500">Join key</p>

          <p className="mt-1 font-mono text-[11px] font-semibold text-ink">
            {nextSource.join_key ?? "—"}
            {" = "}
            {formatTraceValue(nextSource.join_value)}
          </p>
        </div>

        <div className="border-l border-slate-200 pl-3">
          <p className="text-[10px] text-slate-500">
            Connection status
          </p>

          <span className="mt-1 inline-block rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-[10px] capitalize text-amber-700">
            {connectionLabel(nextSource.connection_status)}
          </span>
        </div>

        <button
          type="button"
          onClick={() => onIdentify(system)}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-navy px-3 py-2.5 text-[11px] font-semibold text-white shadow-soft hover:bg-[#173c5f]"
        >
          <Search size={14} />
          Connect source
        </button>
      </div>
    </div>
  );
}
