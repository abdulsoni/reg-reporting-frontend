"use client";

import LineageGroupGraph from "../components/LineageGroupGraph";

export function LineageExplorer() {
  return (
    <div className="min-h-screen bg-[#f4f2ed]">
      <main className="mx-auto max-w-[1500px] p-4 sm:p-6 lg:p-8">
        <div className="mb-6">
          <h1 className="text-lg font-bold tracking-tight text-ink sm:text-xl">
            Data lineage explorer
          </h1>

          <p className="mt-1 text-xs text-slate-500">
            Explore table groups, column dependencies, and transformations.
            Click an arrow to see its transformation details.
          </p>
        </div>

        <section className="panel p-5">
          <LineageGroupGraph />
        </section>
      </main>
    </div>
  );
}
