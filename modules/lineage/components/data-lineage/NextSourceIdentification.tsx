"use client";

import { Search } from "lucide-react";
import type { DataTraceNextSource } from "../../types/dataTrace";
import { formatTraceValue } from "../../utils/dataTraceMapper";

type Props = {
  nextSource: DataTraceNextSource;
  onIdentify: (system: string) => void;
};

/*
 * Inline so a global `button { font-size }` rule can't make the button
 * render larger than the rest of the component.
 */
const buttonStyle = {
  fontSize: 11,
  lineHeight: 1,
  fontFamily: "inherit",
} as const;

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
    <div className="w-full min-w-0 border-t border-slate-200 bg-slate-50/70 px-4 py-4">
      {/* Row 1: title + message on the left, action on the right. */}
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
        <div className="flex min-w-0 flex-1 basis-[260px] items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-soft">
            <Search size={18} />
          </span>

          <div className="min-w-0">
            <h3 className="text-xs font-bold text-ink">
              Next source identification
            </h3>

            <p className="mt-1 break-words text-[10px] leading-4 text-slate-600">
              {nextSource.message ??
                `${system} is not fully connected. Connect it to complete the data lineage.`}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onIdentify(system)}
          style={buttonStyle}
          className="ml-auto inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-navy px-4 py-2.5 font-semibold text-white shadow-soft hover:bg-[#173c5f]"
        >
          <Search size={14} />
          Connect source
        </button>
      </div>

      {/* Row 2: details. 2 columns on small screens, 4 from md up. */}
      <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-4 rounded-lg border border-slate-200 bg-white/60 p-3 md:grid-cols-4">
        <div className="min-w-0">
          <p className="text-[10px] text-slate-500">Source system</p>

          <p className="mt-1 break-words text-[11px] font-semibold text-ink [overflow-wrap:anywhere]">
            {system}
          </p>
        </div>

        <div className="min-w-0">
          <p className="text-[10px] text-slate-500">
            Last known table / attribute
          </p>

          <p className="mt-1 break-words text-[11px] font-semibold text-ink [overflow-wrap:anywhere]">
            {nextSource.last_table ?? "—"} /{" "}
            {nextSource.last_attribute ?? "—"}
          </p>
        </div>

        <div className="min-w-0">
          <p className="text-[10px] text-slate-500">Join key</p>

          <p className="mt-1 break-words font-mono text-[11px] font-semibold text-ink [overflow-wrap:anywhere]">
            {nextSource.join_key ?? "—"}
            {" = "}
            {formatTraceValue(nextSource.join_value)}
          </p>
        </div>

        <div className="min-w-0">
          <p className="text-[10px] text-slate-500">
            Connection status
          </p>

          <span className="mt-1 inline-block rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-[10px] capitalize text-amber-700">
            {connectionLabel(nextSource.connection_status)}
          </span>
        </div>
      </div>
    </div>
  );
}