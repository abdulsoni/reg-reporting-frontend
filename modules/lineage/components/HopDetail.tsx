"use client";

import { ExternalLink } from "lucide-react";

import type { LineageHop } from "../types/lineage";

type HopDetailProps = {
  hop: LineageHop;
};

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
        {label}
      </p>

      <p className="mt-0.5 break-all font-mono text-[11px] text-slate-700">
        {value}
      </p>
    </div>
  );
}

export function HopDetail({ hop }: HopDetailProps) {
  const evidence = [
    hop.system && hop.table_name
      ? `${hop.system}.${hop.table_name}`
      : null,
    hop.attribute_name,
  ]
    .filter(Boolean)
    .join(".");

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
            Hop {hop.hop}
          </p>

          <h3 className="mt-0.5 text-sm font-bold text-ink">
            {hop.system}.{hop.attribute_name}
          </h3>
        </div>

        <span
          className={`shrink-0 rounded-full px-2 py-1 text-[9px] font-bold uppercase tracking-wider ${
            hop.status === "SOURCE_REACHED"
              ? "bg-emerald-100 text-emerald-700"
              : "bg-slate-100 text-slate-600"
          }`}
        >
          {hop.status.replace(/_/g, " ")}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Attribute" value={hop.attribute_name} />
        <Field label="Table" value={hop.table_name} />
        <Field label="System" value={hop.system} />
        <Field
          label="Transformation"
          value={hop.transformation ?? "— none —"}
        />
        <Field label="Sourced from" value={hop.source_from ?? "Final source"} />
        <Field label="Consumed by" value={hop.consumed_by ?? "—"} />
      </div>

      {/* Evidence */}
      <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
        <p className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider text-slate-400">
          <ExternalLink size={10} />
          Evidence
        </p>

        <p className="mt-1 break-all font-mono text-[10px] text-slate-600">
          {evidence}
        </p>

        <p className="mt-1 text-[10px] leading-4 text-slate-500">
          {hop.status === "SOURCE_REACHED"
            ? "No upstream reference found. This column is the system of record for the selected data point."
            : `Resolved from the metadata catalog of ${hop.system}.`}
        </p>
      </div>
    </div>
  );
}