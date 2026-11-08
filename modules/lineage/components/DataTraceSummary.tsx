"use client";

import {
  Database,
  GitBranch,
  Network,
  ShieldCheck,
} from "lucide-react";

import ValueReconciliation from "./data-lineage/ValueReconciliation";
import type { DataTraceReconciliation } from "../types/dataTrace";
import type { LineageData } from "../types/lineage";
import { formatTraceValue } from "../utils/dataTraceMapper";

type DataTraceSummaryProps = {
  data: LineageData;
};

/**
 * Compact summary of the data-level trace bundled with the lineage response.
 * Shows the reported datapoint and the systems reached before the graph.
 */
export default function DataTraceSummary({ data }: DataTraceSummaryProps) {
  const trace = data.trace;
  if (!trace) return null;

  const metadata = data.metadata;

  const reconciliation: DataTraceReconciliation = {
    reported_value: trace.reconciliation.reportedValue,
    calculated_value: trace.reconciliation.calculatedValue,
    variance: trace.reconciliation.variance,
    tolerance: trace.reconciliation.tolerance,
    result: trace.reconciliation.result,
  };

  const stats = [
    {
      label: "Source object",
      value: metadata.sourceObject ?? trace.header.report,
      icon: Database,
    },
    {
      label: "Systems connected",
      value: metadata.systemsConnected ?? data.systems.length,
      icon: Network,
    },
    {
      label: "Systems of record",
      value: metadata.systemsOfRecordReached ?? 0,
      icon: GitBranch,
    },
    {
      label: "Trace status",
      value: trace.status,
      icon: ShieldCheck,
    },
  ];

  return (
    <section className="space-y-3">
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
              Data trace
            </p>

            <h3 className="mt-0.5 text-sm font-bold text-ink">
              {trace.header.report}
            </h3>

            <p className="mt-0.5 text-[11px] text-slate-500">
              {trace.header.datapoint} · {trace.header.column}
              {trace.header.date ? ` · ${trace.header.date}` : ""}
            </p>

            <p className="mt-0.5 break-all font-mono text-[10px] text-slate-400">
              {trace.datapointId}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {stats.map((stat) => {
              const Icon = stat.icon;

              return (
                <div
                  key={stat.label}
                  className="flex min-w-[112px] items-center gap-2 rounded-lg border border-slate-200 bg-slate-50/70 px-2.5 py-2"
                >
                  <span className="rounded-md bg-white p-1.5 text-slate-500 shadow-sm">
                    <Icon size={13} />
                  </span>

                  <div className="min-w-0">
                    <p className="text-[9px] font-semibold uppercase tracking-wide text-slate-400">
                      {stat.label}
                    </p>
                    <p className="truncate font-mono text-[11px] font-bold text-slate-700">
                      {stat.value}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-slate-600">
          <span className="rounded-md bg-emerald-50 px-2 py-1 font-mono text-emerald-700">
            Reported value{" "}
            <strong className="font-bold">
              {formatTraceValue(trace.header.value)}
            </strong>
          </span>

          {trace.header.rowKey && (
            <span className="rounded-md bg-slate-100 px-2 py-1 font-mono">
              Row <strong>{trace.header.rowKey}</strong>
            </span>
          )}

          {metadata.traceId && (
            <span className="min-w-0 truncate rounded-md bg-slate-100 px-2 py-1 font-mono text-[10px] text-slate-500">
              {metadata.traceId}
            </span>
          )}
        </div>
      </div>

      <ValueReconciliation
        reconciliation={reconciliation}
        unit={trace.header.unit}
      />
    </section>
  );
}
