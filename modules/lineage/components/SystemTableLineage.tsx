"use client";

import { useCallback, useState } from "react";

import LineageSearch from "./LineageSearch";
import SystemLineageGraph from "./SystemLineageGraph";
import { useLineageData } from "../hooks/useLineageData";
import {
  DEFAULT_SCENARIO_ID,
  SCENARIO_IDS,
  type ScenarioId,
} from "../data/scenarios";
import {
  buildAttributeSearchEntry,
  collectUpstreamTrace,
  type AttributeSearchEntry,
  type UpstreamTrace,
} from "../lib/reverseLineage";
import {
  deriveTraceExpansion,
  traceUsesTable,
} from "../lib/systemGraphHighlight";
import type { LineageEndpoint } from "../types/lineage";

const SCENARIO_LABELS: Record<ScenarioId, string> = {
  A: "normalized_data only",
  B: "+ adj_audit",
  C: "all connected",
};

export default function SystemTableLineage() {
  const [scenarioId, setScenarioId] = useState<ScenarioId>(DEFAULT_SCENARIO_ID);
  const [expandedSystems, setExpandedSystems] = useState<string[]>([]);
  const [expandedTables, setExpandedTables] = useState<string[]>([]);
  const [activeTrace, setActiveTrace] = useState<{
    entry: AttributeSearchEntry;
    trace: UpstreamTrace;
  } | null>(null);

  const { data, loading, error } = useLineageData(scenarioId);

  const toggleSystem = useCallback(
    (systemId: string) => {
      const wasExpanded = expandedSystems.includes(systemId);

      setExpandedSystems((current) =>
        wasExpanded
          ? current.filter((id) => id !== systemId)
          : [...current, systemId]
      );

      if (!wasExpanded) return;

      const tableIds = new Set(
        data.tables
          .filter((table) => table.systemId === systemId)
          .map((table) => table.id)
      );

      setExpandedTables((current) =>
        current.filter((tableId) => !tableIds.has(tableId))
      );

      if (activeTrace?.trace.pathSystemIds.has(systemId)) {
        setActiveTrace(null);
      }
    },
    [activeTrace, data.tables, expandedSystems]
  );

  const toggleTable = useCallback(
    (tableId: string) => {
      const wasExpanded = expandedTables.includes(tableId);

      setExpandedTables((current) =>
        wasExpanded
          ? current.filter((id) => id !== tableId)
          : [...current, tableId]
      );

      if (
        wasExpanded &&
        activeTrace &&
        traceUsesTable(activeTrace.trace, tableId)
      ) {
        setActiveTrace(null);
      }
    },
    [activeTrace, expandedTables]
  );

  const activateTrace = useCallback(
    (target: LineageEndpoint, entry: AttributeSearchEntry) => {
      const trace = collectUpstreamTrace(data, target);
      const expansion = deriveTraceExpansion(trace, data);

      setActiveTrace({ entry, trace });

      setExpandedSystems((current) => {
        const next = new Set(current);
        for (const systemId of expansion.systemIds) next.add(systemId);
        return Array.from(next);
      });

      setExpandedTables((current) => {
        const next = new Set(current);
        for (const tableId of expansion.tableIds) next.add(tableId);
        return Array.from(next);
      });
    },
    [data]
  );

  const handleSearchSelect = useCallback(
    (entry: AttributeSearchEntry) => {
      activateTrace(
        {
          systemId: entry.systemId,
          tableId: entry.tableId,
          attributeId: entry.attributeId,
        },
        entry
      );
    },
    [activateTrace]
  );

  const handleAttributeTrace = useCallback(
    (target: LineageEndpoint) => {
      const entry = buildAttributeSearchEntry(data, target);
      if (!entry) return;
      activateTrace(target, entry);
    },
    [activateTrace, data]
  );

  const clearSearchTrace = useCallback(() => {
    setActiveTrace(null);
  }, []);

  function selectScenario(id: ScenarioId) {
    setExpandedSystems([]);
    setExpandedTables([]);
    setActiveTrace(null);
    setScenarioId(id);
  }

  const scenarioPicker = (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
        Test scenario
      </span>

      <div className="inline-flex overflow-hidden rounded-lg border border-line bg-white">
        {SCENARIO_IDS.map((id) => (
          <button
            key={id}
            type="button"
            title={SCENARIO_LABELS[id]}
            onClick={() => selectScenario(id)}
            className={`px-3 py-1.5 text-xs font-semibold transition ${
              id === scenarioId
                ? "bg-slate-900 text-white"
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            {id}
          </button>
        ))}
      </div>

      <span className="text-xs text-slate-500">{SCENARIO_LABELS[scenarioId]}</span>

      {loading && <span className="text-xs text-slate-400">Refreshing…</span>}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-ink sm:text-xl">
            System-level lineage
          </h2>

          <p className="mt-1 text-xs text-slate-500">
            Click a database to expand its tables, then click a table to expand
            its columns.
          </p>
        </div>

        {scenarioPicker}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <LineageSearch data={data} onSelect={handleSearchSelect} />

        {activeTrace && (
          <button
            type="button"
            onClick={clearSearchTrace}
            className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 transition hover:bg-blue-100"
          >
            Tracing {activeTrace.entry.attributeName} — clear path
          </button>
        )}
      </div>

      {error && (
        <p className="text-xs text-amber-600">
          Could not reach the lineage API. Showing the bundled snapshot.
        </p>
      )}

      <section className="panel p-5">
        <SystemLineageGraph
          key={`${scenarioId}:${activeTrace?.entry.key ?? "none"}`}
          data={data}
          expandedSystemIds={expandedSystems}
          expandedTableIds={expandedTables}
          highlight={activeTrace?.trace ?? null}
          onToggleSystem={toggleSystem}
          onToggleTable={toggleTable}
          onTraceAttribute={handleAttributeTrace}
          onClearHighlight={clearSearchTrace}
        />
      </section>
    </div>
  );
}
