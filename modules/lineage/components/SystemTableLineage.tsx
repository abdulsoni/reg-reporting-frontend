"use client";

import { useState } from "react";
import { ArrowLeft } from "lucide-react";

import LineageGroupGraph from "./LineageGroupGraph";
import SystemLineageGraph from "./SystemLineageGraph";
import { useLineageData } from "../hooks/useLineageData";

export default function SystemTableLineage() {
  const [selectedSystem, setSelectedSystem] = useState<string | null>(null);

  const { data, loading, error } = useLineageData();

  const selectedSystemData =
    data.systems.find((system) => system.id === selectedSystem) ?? null;

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center rounded-xl border border-line bg-white text-sm text-slate-500">
        Loading lineage…
      </div>
    );
  }

  if (selectedSystemData) {
    return (
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => setSelectedSystem(null)}
          className="inline-flex items-center gap-2 rounded-lg border border-line bg-white px-3 py-2 text-sm font-medium text-ink transition hover:bg-slate-50"
        >
          <ArrowLeft size={16} />
          Back to system lineage
        </button>

        <div>
          <h2 className="text-lg font-bold tracking-tight text-ink sm:text-xl">
            {selectedSystemData.label}
          </h2>

          <p className="mt-1 text-xs text-slate-500">
            Table-level and column-level lineage. Click an arrow or a column
            for its transformation details.
          </p>
        </div>

        <section className="panel p-5">
          <LineageGroupGraph data={data} systemId={selectedSystemData.id} />
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold tracking-tight text-ink sm:text-xl">
          System-level lineage
        </h2>

        <p className="mt-1 text-xs text-slate-500">
          Select a system to explore its table lineage.
        </p>
      </div>

      {error && (
        <p className="text-xs text-amber-600">
          Could not reach the lineage API. Showing the bundled snapshot.
        </p>
      )}

      <section className="panel p-5">
        <SystemLineageGraph data={data} onSelectSystem={setSelectedSystem} />
      </section>
    </div>
  );
}
