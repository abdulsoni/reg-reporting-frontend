"use client";

import { CheckCircle2, Clock, Loader2, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import { useLineage } from "../context/LineageContext";
import { useConnectedLineage } from "../hooks/useConnectedLineage";
import { TraceError } from "./NextSourceCard";
import { SourceSystemPanel } from "./SourceSystemPanel";
import type {
  ConnectedLineageRow,
  HopStatus,
  LineageHop,
} from "../types/lineage";

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

function normalizeHopStatus(status: string): HopStatus {
  const normalized = status.trim().toUpperCase().replace(/[\s-]+/g, "_");

  if (
    normalized === "SOURCE_REACHED" ||
    normalized === "LOOP_DETECTED" ||
    normalized === "METADATA_NOT_FOUND" ||
    normalized === "AMBIGUOUS_METADATA"
  ) {
    return normalized;
  }

  return "IDENTIFIED";
}

function connectedRowToHop(
  row: ConnectedLineageRow,
  index: number
): LineageHop {
  return {
    hop: index + 1,
    system: row.system,
    attribute_name: row.attribute_name,
    table_name: row.table_name,
    transformation: row.transformation,
    source_from: row.sourced_from,
    consumed_by: row.consumed_by,
    status: normalizeHopStatus(row.status),
  };
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
    connectedSystems,
    needsConnection,
    isComplete,
    isLoop,
    busy,
    error,
    resetTrace,
  } = useLineage();

  const {
    data: connectedLineage,
    loading: connectedLoading,
    error: connectedError,
  } = useConnectedLineage();

  const connectedSnapshot =
    connectedLineage?.allSystemsConnected ? connectedLineage : null;

  /*
   * One table per connected system, using the per-system rows from
   * `connectedSystems`. This is available even while some systems are still
   * missing, so partial lineage is shown before the trace is complete.
   */
  const connectedSections = useMemo(() => {
    const details = connectedLineage?.connectedSystems ?? [];

    if (details.length > 0) {
      return details.map((detail, sectionIndex) => ({
        key: `${detail.system}-${sectionIndex}`,
        title: detail.system,
        subtitle: detail.database,
        hops: (detail.rows ?? []).map(connectedRowToHop),
      }));
    }

    /* Older responses only expose the flattened rows. */
    if (connectedLineage?.allSystemsConnected) {
      return [
        {
          key: "connected",
          title: "Connected lineage",
          subtitle: undefined,
          hops: (connectedLineage.rows ?? []).map(connectedRowToHop),
        },
      ];
    }

    return null;
  }, [connectedLineage]);

  const connectedActive = connectedSections !== null;

  const connectedHops = useMemo(
    () => (connectedSections ?? []).flatMap((section) => section.hops),
    [connectedSections]
  );

  /*
   * Every connection appends its newly discovered hops as a separate
   * lineage section:
   *
   * [
   *   hops discovered before the first connection,
   *   hops discovered after connecting crm.db,
   *   hops discovered after connecting sales.db
   * ]
   */
  const [sections, setSections] = useState<LineageHop[][]>([]);

  /*
   * How many hops have already been assigned to a section, so only the
   * growth of the context's hop list ever becomes a new section.
   */
  const [assigned, setAssigned] = useState(0);

  /*
   * Reference to the latest section.
   *
   * Used to automatically scroll to the newly
   * fetched lineage section.
   */
  const bottomRef = useRef<HTMLDivElement | null>(null);

  /*
   * Track how many sections were displayed on the previous render so we
   * only scroll when a new table section is appended.
   */
  const previousSectionCountRef = useRef(0);

  /*
   * Slice the hop list into sections. The context replaces the whole list
   * on every refresh, so whatever arrived since the last assignment becomes
   * the next section. Derived while rendering (React's previous-state
   * pattern) rather than in an effect, and a reset empties the list to
   * start over.
   */
  if (hops.length !== assigned) {
    if (hops.length === 0) {
      setAssigned(0);
      setSections([]);
    } else if (hops.length > assigned) {
      const added = hops.slice(assigned);

      setAssigned(hops.length);
      setSections((previous) => [...previous, added]);
    } else {
      /* The trace shrank below what the sections already cover. */
      setAssigned(hops.length);
      setSections([hops]);
    }
  }

  /*
   * Use the connected snapshot when every system is connected, or while no
   * trace is active yet. Once a trace is running, the trace sections are the
   * live source of truth and must be used so newly connected sections appear.
   */
  const useConnectedDisplay =
    connectedSnapshot !== null || (connectedActive && !traceId);

  const traceSectionCount = sections.length > 0 ? sections.length : 1;

  const displayedSectionCount = useConnectedDisplay
    ? (connectedSections?.length ?? 0)
    : traceSectionCount;

  /*
   * Scroll to the latest section when a new table section is appended.
   *
   * Skip the initial render.
   */
  useEffect(() => {
    if (
      previousSectionCountRef.current > 0 &&
      displayedSectionCount > previousSectionCountRef.current
    ) {
      bottomRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }

    previousSectionCountRef.current = displayedSectionCount;
  }, [displayedSectionCount]);

  if (!traceId && !connectedActive) {
    if (connectedLoading) {
      return (
        <section className="panel flex items-center justify-center gap-2 p-8 text-[11px] text-slate-500">
          <Loader2 size={15} className="animate-spin" />
          Checking connection status…
        </section>
      );
    }

    if (connectedError) {
      return (
        <section className="panel p-8 text-center">
          <h2 className="text-sm font-bold text-ink">
            Connection check failed
          </h2>

          <p className="mx-auto mt-2 max-w-md text-[11px] leading-5 text-slate-500">
            {connectedError}
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

  const displayHops = useConnectedDisplay ? connectedHops : hops;
  const proven = displayHops.filter(
    (hop) => hop.status === "IDENTIFIED"
  ).length;
  const sourceReached = displayHops.filter(
    (hop) => hop.status === "SOURCE_REACHED"
  ).length;
  const isFullyConnected = isComplete || connectedSnapshot !== null;
  const systemCount = connectedLineage
    ? (connectedLineage.systemsConnected ?? connectedSections?.length ?? 0)
    : connectedSystems.length;
  const sourcesFound = connectedLineage
    ? (connectedLineage.systemsOfRecordReached ?? sourceReached)
    : sourceReached;

  /*
   * Before the first hop arrives there is still nothing to section, so a
   * single empty placeholder keeps the table + connect card layout visible.
   */
  const renderedSections = sections.length > 0 ? sections : [[]];

  /*
   * Connected sections are shown while a full snapshot exists or before a
   * trace starts. Once the trace is running, render the trace sections so a
   * newly connected source appends a new table + next-source panel.
   */
  const sectionCards =
    useConnectedDisplay && connectedSections
      ? connectedSections
      : renderedSections.map((sectionHops, sectionIndex) => ({
          key: `section-${sectionIndex}`,
          title:
            sectionIndex === 0
              ? "Discovered hops"
              : `Lineage section ${sectionIndex + 1}`,
          subtitle: undefined,
          hops: sectionHops,
        }));

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
              {traceId ??
                (connectedSnapshot
                  ? "All source systems connected"
                  : connectedActive
                    ? `${systemCount} ${
                        systemCount === 1 ? "system" : "systems"
                      } connected`
                    : null)}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Hops" value={String(displayHops.length)} />
            <Stat label="Proven" value={String(proven)} />
            <Stat label="Systems" value={String(systemCount)} />
            <Stat label="Sources found" value={String(sourcesFound)} />
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
                isFullyConnected
                  ? "text-emerald-600"
                  : isLoop
                    ? "text-red-600"
                    : "text-slate-500"
              }
            />
          )}

          <span className="text-[11px] font-semibold text-slate-700">
            {connectedSnapshot
              ? "All systems connected — displaying the complete lineage."
              : connectedActive
                ? `${systemCount} ${
                    systemCount === 1 ? "system" : "systems"
                  } connected — connect the remaining systems to complete the lineage.`
                : statusLabel(phase, busy, needsConnection)}
          </span>
        </div>
      </section>

      <TraceError error={error} />

      {/* Lineage sections */}
      {connectedSnapshot && connectedSections ? (
        <div
          ref={bottomRef}
          className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_340px]"
        >
          <div className="space-y-5">
            {connectedSections.map((section) => (
              <LineageTable
                key={section.key}
                title={section.title}
                subtitle={section.subtitle}
                hops={section.hops}
                busy={busy}
              />
            ))}
          </div>

          <div className="panel flex flex-col p-5">
            <h2 className="pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              All systems connected
            </h2>

            <p className="text-[11px] leading-5 text-slate-500">
              The complete lineage snapshot is available for every source
              system.
            </p>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <Stat
                label="Connected"
                value={String(connectedSnapshot.systemsConnected ?? 0)}
              />
              <Stat
                label="Sources reached"
                value={String(
                  connectedSnapshot.systemsOfRecordReached ?? 0
                )}
              />
              <Stat
                label="Branches outstanding"
                value={String(connectedSnapshot.branchOutstanding ?? 0)}
              />
              <Stat
                label="Missing"
                value={String(
                  connectedSnapshot.missingSystems?.length ?? 0
                )}
              />
            </div>

            <ul className="mt-4 space-y-1.5">
              {(connectedSnapshot.systems ?? []).map((system) => (
                <li
                  key={system.system}
                  className="flex items-center justify-between gap-3 rounded-md border border-slate-200 px-2.5 py-1.5 font-mono text-[10px]"
                >
                  <span className="min-w-0 truncate text-slate-700">
                    {system.system}
                  </span>

                  <span className="shrink-0 text-slate-400">
                    {system.rowCount} {system.rowCount === 1 ? "row" : "rows"}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          {sectionCards.map((section, sectionIndex) => {
            const isLastSection =
              sectionIndex === sectionCards.length - 1;

            return (
              <div
                key={section.key}
                ref={isLastSection ? bottomRef : undefined}
                className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_340px]"
              >
                <LineageTable
                  title={section.title}
                  subtitle={section.subtitle}
                  hops={section.hops}
                  busy={busy}
                />

                {/* Next source */}
                <div className="panel flex flex-col p-5">
                  <h2 className="pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Next source identification
                  </h2>

                  <SourceSystemPanel mode="connect" hideTitle />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Loading new hop */}
      {busy && !isFullyConnected && (
        <div className="flex items-center justify-center gap-2 py-6 text-[11px] text-slate-500">
          <Loader2 size={15} className="animate-spin" />
          Continuing reverse lineage...
        </div>
      )}

      {/* Footer actions */}
      <div className="flex items-center justify-between gap-3">
        {isFullyConnected ? (
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

function LineageTable({
  title,
  subtitle,
  hops,
  busy,
}: {
  title: string;
  subtitle?: string;
  hops: LineageHop[];
  busy: boolean;
}) {
  return (
    <section className="panel overflow-hidden p-0">
      <div className="border-b border-slate-200 px-5 py-3.5">
        <h3 className="flex items-baseline gap-2 text-xs font-bold text-ink">
          {title}

          {subtitle && (
            <span className="font-mono text-[10px] font-normal text-slate-400">
              {subtitle}
            </span>
          )}
        </h3>
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
              hops.map((hop) => <HopRow key={hop.hop} hop={hop} />)
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="border-t border-slate-100 px-4 py-3 sm:px-5">
        <p className="text-[10px] text-slate-500">
          {hops.length
            ? `${hops.length} lineage ${
                hops.length === 1 ? "record" : "records"
              } identified.`
            : "No lineage records identified."}
        </p>
      </div>
    </section>
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
