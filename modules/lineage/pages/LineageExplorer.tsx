"use client";

import { useState } from "react";
import { ArrowLeft } from "lucide-react";

import LineageGroupGraph from "../components/LineageGroupGraph";
import SystemLineageGraph from "../components/SystemLineageGraph";

export function LineageExplorer() {
  const [selectedSystem, setSelectedSystem] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-[#f4f2ed]">
      <main className="mx-auto max-w-[1500px] p-4 sm:p-6 lg:p-8">
        {selectedSystem === "normalized_data" ? (
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
                normalized_data.db
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Table-level and column-level lineage. Click an arrow or a column
                for its transformation details.
              </p>
            </div>

            <section className="panel p-5">
              <LineageGroupGraph />
            </section>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-bold tracking-tight text-ink sm:text-xl">
                System-level lineage
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Select normalized_data.db to explore its table lineage.
              </p>
            </div>

            <section className="panel p-5">
              <SystemLineageGraph onSelectSystem={setSelectedSystem} />
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
