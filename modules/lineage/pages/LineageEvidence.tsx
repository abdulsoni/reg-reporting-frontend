"use client";

import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  Database,
  GitBranch,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { useLineage } from "../context/LineageContext";
import { useReports } from "../context/ReportContext";
import { LineageHeader } from "../components/LineageHeader";
import { LineageGraphView } from "../components/LineageGraph";
import { HopDetail } from "../components/HopDetail";
import { NodeDetail } from "../components/NodeDetail";
import { TraceError } from "../components/NextSourceCard";

export function LineageEvidence() {
  const { selectedReport } = useReports();

  const { traceId, hops, graph, connectedSystems, phase, error } =
    useLineage();

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const selectedHop = useMemo(() => {
    if (!hops.length) return null;

    /* Nothing selected: default to the most recent hop. */
    if (!selectedNodeId) return hops[hops.length - 1];

    /*
     * A node that maps to a hop shows the richer hop evidence; a graph-only
     * node (branch or pending) falls through to `selectedNode` below.
     */
    return (
      hops.find(
        (hop) =>
          `${hop.system}:${hop.table_name}:${hop.attribute_name}` ===
          selectedNodeId
      ) ?? null
    );
  }, [hops, selectedNodeId]);

  const selectedNode = useMemo(
    () => graph?.nodes.find((node) => node.id === selectedNodeId) ?? null,
    [graph, selectedNodeId]
  );

  const proven = hops.filter((hop) => hop.status === "IDENTIFIED").length;
  const sourceReached = hops.filter(
    (hop) => hop.status === "SOURCE_REACHED"
  ).length;

  return (
    <div className="min-h-screen bg-[#f4f2ed]">
      <LineageHeader activeStep={3} />

      <main className="mx-auto max-w-[1500px] p-4 sm:p-6 lg:p-8">
        {!traceId ? (
          <section className="panel p-8 text-center">
            <GitBranch
              size={28}
              className="mx-auto text-slate-300"
            />

            <h2 className="mt-3 text-sm font-bold text-ink">
              No lineage trace available
            </h2>

            <p className="mx-auto mt-2 max-w-md text-[11px] leading-5 text-slate-500">
              Complete a reverse lineage trace to see the system-of-record path
              and the evidence behind each hop.
            </p>

            <Link href="/lineage" className="btn-primary mt-4 inline-flex">
              Start a trace
            </Link>
          </section>
        ) : (
          <div className="flex flex-col gap-5">
            {/* Summary */}
            <section className="panel p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <h1 className="text-lg font-bold tracking-tight text-ink sm:text-xl">
                    Lineage evidence
                  </h1>

                  <p className="mt-1 text-[11px] text-slate-500">
                    {selectedReport?.regulatoryReturn
                      ? `${selectedReport.regulatoryReturn} · `
                      : ""}
                    <span className="font-mono">{traceId}</span>
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <Stat label="Hops" value={String(hops.length)} />
                  <Stat label="Proven" value={String(proven)} />
                  <Stat label="Systems" value={String(connectedSystems.length)} />
                  <Stat label="Sources" value={String(sourceReached)} />
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                {connectedSystems.map((system) => {
                  const Icon =
                    phase === "LOOP_DETECTED"
                      ? AlertTriangle
                      : sourceReached > 0
                        ? CheckCircle2
                        : Clock;

                  return (
                    <span
                      key={system}
                      className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1 font-mono text-[10px] font-semibold text-slate-600"
                    >
                      <Icon size={10} />
                      {system}
                    </span>
                  );
                })}
              </div>
            </section>

            <TraceError error={error} />

            {/* Graph + detail */}
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-[2fr_1fr]">
              <section className="panel p-5">
                <h2 className="text-xs font-bold text-ink">Lineage graph</h2>

                <p className="mt-1 mb-4 text-[10px] text-slate-500">
                  Arrows point from a consuming column to the column that
                  sourced it. Click a node for its evidence.
                </p>

                <LineageGraphView
                  graph={graph}
                  selectedNodeId={selectedNodeId}
                  onSelectNode={setSelectedNodeId}
                />
              </section>

              <aside className="panel p-5">
                <h2 className="mb-4 text-xs font-bold text-ink">
                  Hop evidence
                </h2>

                {selectedHop ? (
                  <HopDetail hop={selectedHop} />
                ) : selectedNode ? (
                  <NodeDetail data={selectedNode.data} />
                ) : (
                  <p className="text-[11px] text-slate-500">
                    Select a node in the graph.
                  </p>
                )}
              </aside>
            </div>

            {/* Full hop list */}
            <section className="panel overflow-hidden p-0">
              <div className="flex items-center gap-2 border-b border-slate-200 px-5 py-3.5">
                <Database size={13} className="text-slate-400" />

                <h3 className="text-xs font-bold text-ink">
                  All discovered hops
                </h3>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] border-collapse text-[11px]">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      {[
                        "Hop",
                        "System",
                        "Attribute",
                        "Table",
                        "Transformation",
                        "Sourced from",
                        "Consumed by",
                        "Status",
                      ].map((column) => (
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
                          colSpan={8}
                          className="px-3 py-10 text-center text-[11px] text-slate-500"
                        >
                          No hops discovered.
                        </td>
                      </tr>
                    ) : (
                      hops.map((hop) => (
                        <tr
                          key={`${hop.system}-${hop.table_name}-${hop.attribute_name}`}
                          onClick={() =>
                            setSelectedNodeId(
                              `${hop.system}:${hop.table_name}:${hop.attribute_name}`
                            )
                          }
                          className={`cursor-pointer border-b border-slate-100 last:border-0 ${
                            selectedHop === hop
                              ? "bg-slate-50"
                              : "hover:bg-slate-50/60"
                          }`}
                        >
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

                          <td className="px-3 py-2.5 font-mono text-[9px] font-bold text-slate-600">
                            {hop.status.replace(/_/g, " ")}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}
      </main>
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