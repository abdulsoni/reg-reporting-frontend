"use client";

import { CheckCircle2, Clock, Loader2, AlertTriangle } from "lucide-react";
import Link from "next/link";

import { useLineage } from "../context/LineageContext";
import { NextSourceCard, TraceError } from "./NextSourceCard";
import type { HopStatus, LineageHop } from "../types/lineage";

const COLUMNS = [
  "Hop",
  "System",
  "Attribute",
  "Table",
  "Transformation",
  "Sourced from",
  "Consumed by",
  "Status",
] as const;

const COLUMN_COUNT = COLUMNS.length;

function StatusCell({ status }: { status: HopStatus }) {
  if (status === "SOURCE_REACHED") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-700">
        <CheckCircle2 size={10} />
        Source reached
      </span>
    );
  }

  if (status === "AMBIGUOUS_METADATA") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-700">
        <Clock size={10} />
        Ambiguous source
      </span>
    );
  }

  if (status === "METADATA_NOT_FOUND") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-700">
        <Clock size={10} />
        No metadata
      </span>
    );
  }

  if (status === "LOOP_DETECTED") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-red-700">
        <AlertTriangle size={10} />
        Loop
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-slate-600">
      Identified
    </span>
  );
}

function HopRow({ hop }: { hop: LineageHop }) {
  return (
    <tr className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60">
      <td className="px-3 py-2.5 font-mono text-[10px] font-bold text-slate-400">
        {hop.hop}
      </td>

      <td className="px-3 py-2.5 font-mono text-[10px] font-bold text-ink">
        {hop.system}
      </td>

      <td className="px-3 py-2.5 font-mono text-[10px] text-slate-700">
        {hop.attribute_name}
      </td>

      <td className="px-3 py-2.5 font-mono text-[10px] text-slate-700">
        {hop.table_name}
      </td>

      <td className="px-3 py-2.5 font-mono text-[10px] italic text-slate-500">
        {hop.transformation ?? "—"}
      </td>

      <td className="px-3 py-2.5 font-mono text-[10px] text-slate-700">
        {hop.source_from ?? "—"}
      </td>

      <td className="px-3 py-2.5 font-mono text-[10px] text-slate-500">
        {hop.consumed_by ?? "—"}
      </td>

      <td className="px-3 py-2.5">
        <StatusCell status={hop.status} />
      </td>
    </tr>
  );
}

export function TraceProgressPanel() {
  const {
    traceId,
    hops,
    phase,
    nextSource,
    connectedSystems,
    needsConnection,
    isComplete,
    isLoop,
    busy,
    error,
    connectNextSource,
    resetTrace,
  } = useLineage();

  if (!traceId) {
    return (
      <section className="panel p-8 text-center">
        <h2 className="text-sm font-bold text-ink">No trace in progress</h2>

        <p className="mx-auto mt-2 max-w-md text-[11px] leading-5 text-slate-500">
          Select a report, choose a data point and connect the source system to
          begin reverse lineage tracing.
        </p>

        <Link
          href="/lineage"
          className="btn-primary mt-4 inline-flex"
        >
          Go to data point selection
        </Link>
      </section>
    );
  }

  const proven = hops.filter((hop) => hop.status === "IDENTIFIED").length;
  const sourceReached = hops.filter(
    (hop) => hop.status === "SOURCE_REACHED"
  ).length;

  return (
    <div className="flex flex-col gap-4">
      {/* Stats */}
      <section className="panel p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-sm font-bold text-ink">
              Reverse lineage trace
            </h2>

            <p className="mt-1 font-mono text-[10px] text-slate-500">
              {traceId}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Hops" value={String(hops.length)} />
            <Stat label="Proven" value={String(proven)} />
            <Stat label="Systems" value={String(connectedSystems.length)} />
            <Stat label="Sources found" value={String(sourceReached)} />
          </div>
        </div>

        {/* Status banner */}
        <div className="mt-4 flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2">
          {busy ? (
            <Loader2 size={13} className="animate-spin text-slate-500" />
          ) : (
            <CheckCircle2
              size={13}
              className={
                isComplete
                  ? "text-emerald-600"
                  : isLoop
                    ? "text-red-600"
                    : "text-slate-500"
              }
            />
          )}

          <span className="text-[11px] font-semibold text-slate-700">
            {statusLabel(phase, busy, needsConnection)}
          </span>
        </div>
      </section>

      <TraceError error={error} />

      {/* Connect gate */}
      {needsConnection && (
        <NextSourceCard
          nextSource={nextSource}
          connectedSystems={connectedSystems}
          busy={busy}
          onConnect={connectNextSource}
        />
      )}

      {/* Hop table */}
      <section className="panel overflow-hidden p-0">
        <div className="border-b border-slate-200 px-5 py-3.5">
          <h3 className="text-xs font-bold text-ink">Discovered hops</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] border-collapse text-[11px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                {COLUMNS.map((column) => (
                  <th
                    key={column}
                    className="px-3 py-2.5 text-left text-[9px] font-bold uppercase tracking-wider text-slate-500"
                  >
                    {column}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {hops.length === 0 ? (
                <tr>
                  <td
                    colSpan={COLUMN_COUNT}
                    className="px-3 py-10 text-center text-[11px] text-slate-500"
                  >
                    {busy ? "Exploring metadata…" : "No hops discovered yet."}
                  </td>
                </tr>
              ) : (
                hops.map((hop) => (
                  <HopRow
                    key={`${hop.system}-${hop.table_name}-${hop.attribute_name}`}
                    hop={hop}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Footer actions */}
      <div className="flex items-center justify-between gap-3">
        {isComplete ? (
          <Link
            href="/lineage/evidence"
            className="btn-primary inline-flex"
          >
            View lineage graph
          </Link>
        ) : (
          <span className="text-[10px] text-slate-400">
            Connect each source system to keep tracing.
          </span>
        )}

        <button
          type="button"
          onClick={resetTrace}
          className="btn-secondary"
        >
          Reset trace
        </button>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-slate-50 px-3 py-2">
      <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
        {label}
      </p>

      <p className="mt-0.5 text-sm font-bold text-ink">{value}</p>
    </div>
  );
}

function statusLabel(
  phase: string,
  busy: boolean,
  needsConnection: boolean
): string {
  if (busy) return "Working…";

  if (phase === "SOURCE_REACHED" || phase === "COMPLETED") {
    return "Trace complete — system of record reached.";
  }

  if (phase === "LOOP_DETECTED") {
    return "Loop detected — the chain revisited a known column.";
  }

  if (phase === "METADATA_NOT_FOUND") {
    return "Metadata not found for the next hop.";
  }

  if (phase === "FAILED") return "Trace failed.";

  if (needsConnection) {
    return "Awaiting connection to the next source system.";
  }

  return "Tracing reverse lineage…";
}