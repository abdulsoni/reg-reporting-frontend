"use client";

import SystemTableLineage from "../components/SystemTableLineage";

export function LineageExplorer() {
  return (
    <div className="min-h-screen bg-[#f4f2ed]">
      <main className="mx-auto max-w-[1500px] p-4 sm:p-6 lg:p-8">
        <SystemTableLineage />
      </main>
    </div>
  );
}
