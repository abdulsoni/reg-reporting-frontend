"use client";

import type { GraphNodeData } from "../types/lineage";

type NodeDetailProps = {
  data: GraphNodeData;
};

function isFinalSource(data: GraphNodeData) {
  return data.final_source || data.status === "SOURCE_REACHED";
}

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

export function NodeDetail({ data }: NodeDetailProps) {
  const heldIn =
    data.table && data.attribute
      ? `${data.table}.${data.attribute}`
      : data.table ?? data.attribute ?? null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
            Selected node
          </p>

          <h3 className="mt-0.5 break-all text-sm font-bold text-ink">
            {data.table ?? data.system}
          </h3>

          {data.attribute && (
            <p className="font-mono text-xs text-slate-600">
              {data.attribute}
            </p>
          )}
        </div>

        {isFinalSource(data) && (
          <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-emerald-700">
            Proven
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="System" value={data.system} />

        {heldIn && <Field label="Attribute held in" value={heldIn} />}

        <Field
          label="Transformation"
          value={data.transformation ?? "— none —"}
        />

        <Field
          label="Status"
          value={data.pending ? "PENDING" : data.status ?? "IDENTIFIED"}
        />
      </div>
    </div>
  );
}
