"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { X } from "lucide-react";

import LineageGroupGraph from "./LineageGroupGraph";
import SystemLineageGraph from "./SystemLineageGraph";
import { useLineageData } from "../hooks/useLineageData";
import {
  DEFAULT_SCENARIO_ID,
  SCENARIO_IDS,
  type ScenarioId,
} from "../data/scenarios";

const SCENARIO_LABELS: Record<ScenarioId, string> = {
  A: "normalized_data only",
  B: "+ adj_audit",
  C: "all connected",
};

export default function SystemTableLineage() {
  const [scenarioId, setScenarioId] = useState<ScenarioId>(DEFAULT_SCENARIO_ID);
  const [openSystems, setOpenSystems] = useState<string[]>([]);
  const tableSectionRef = useRef<HTMLElement | null>(null);

  const { data, loading, error } = useLineageData(scenarioId);

  console.log('data',data)

  const systemLabel = useMemo(() => {
    const labels = new Map(data.systems.map((system) => [system.id, system.label]));
    return (systemId: string) => labels.get(systemId) ?? systemId;
  }, [data.systems]);

  const firstOpenSystem = openSystems[0] ?? null;

  // Scroll the table-level view into view on a fresh selection, but not when
  // merely adding or removing a system from the open set.
  useEffect(() => {
    if (!firstOpenSystem) return;
    tableSectionRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, [firstOpenSystem]);

  function selectScenario(id: ScenarioId) {
    setOpenSystems([]);
    setScenarioId(id);
  }

  function selectFromDiagram(systemId: string) {
    setOpenSystems([systemId]);
  }

  function expandSystem(systemId: string) {
    setOpenSystems((current) =>
      current.includes(systemId) ? current : [...current, systemId]
    );
  }

  function closeSystem(systemId: string) {
    setOpenSystems((current) => current.filter((id) => id !== systemId));
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
            Select a system to explore its table lineage below.
          </p>
        </div>

        {scenarioPicker}
      </div>

      {error && (
        <p className="text-xs text-amber-600">
          Could not reach the lineage API. Showing the bundled snapshot.
        </p>
      )}

      <section className="panel p-5">
        <SystemLineageGraph
          data={data}
          selectedSystemIds={openSystems}
          onSelectSystem={selectFromDiagram}
        />
      </section>

      {openSystems.length > 0 && (
        <section
          ref={tableSectionRef}
          className="panel scroll-mt-6 p-5"
          aria-label="Table-level lineage"
        >
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-lg font-bold tracking-tight text-ink sm:text-xl">
                Table lineage
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Showing the tables of every open system. Click a connected
                system placeholder to add its tables.
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                {openSystems.map((systemId) => (
                  <span
                    key={systemId}
                    className="inline-flex items-center gap-2 rounded-full border border-line bg-white py-1 pl-3 pr-1 text-xs font-medium text-ink"
                  >
                    {systemLabel(systemId)}
                    <button
                      type="button"
                      onClick={() => closeSystem(systemId)}
                      aria-label={`Close ${systemLabel(systemId)}`}
                      className="rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setOpenSystems([])}
              className="inline-flex items-center gap-2 rounded-lg border border-line bg-white px-3 py-2 text-sm font-medium text-ink transition hover:bg-slate-50"
            >
              <X size={16} />
              Clear selection
            </button>
          </div>

          <LineageGroupGraph
            data={data}
            openSystemIds={openSystems}
            onExpandSystem={expandSystem}
          />
        </section>
      )}
    </div>
  );
}
