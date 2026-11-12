"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowDownRight,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Download,
  RefreshCw,
} from "lucide-react";
import { LineageHeader } from "../components/LineageHeader";
import SystemTableLineage, {
  SystemLineageView,
} from "../components/SystemTableLineage";
import { useVisualGraphData } from "../hooks/useVisualGraphData";

type LineageEvidenceProps = {
  reportName?: string;
  datapointId?: string;
};

export function LineageEvidence({
  reportName,
  datapointId,
}: LineageEvidenceProps) {
  const { data, loading, error } = useVisualGraphData(
    reportName,
    datapointId
  );

  const backHref =
    reportName?.trim() && datapointId?.trim()
      ? `/lineage/data-lineage?${new URLSearchParams({
          report_name: reportName.trim(),
          datapoint_id: datapointId.trim(),
        }).toString()}`
      : null;

  const hasDatapoint = backHref !== null;

  const [view, setView] = useState<"system" | "datapoint">(
    hasDatapoint ? "datapoint" : "system"
  );

  return (
    <div className="min-h-screen bg-[#f4f2ed] text-[#202925]">
      <LineageHeader activeStep={3} />

      <main className="mx-auto max-w-[1500px] p-4 sm:p-6 lg:p-8">

        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
            Graph view
          </span>

          <div className="inline-flex overflow-hidden rounded-lg border border-slate-200 bg-white">
            <button
              type="button"
              onClick={() => setView("system")}
              className={`px-3 py-1.5 text-xs font-semibold transition ${
                view === "system"
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              System lineage
            </button>

            <button
              type="button"
              onClick={() => setView("datapoint")}
              disabled={!hasDatapoint}
              title={
                hasDatapoint
                  ? "Show the selected datapoint trace graph"
                  : "Open this page from a datapoint to load its trace graph"
              }
              className={`px-3 py-1.5 text-xs font-semibold transition ${
                view === "datapoint"
                  ? "bg-slate-900 text-white"
                  : hasDatapoint
                    ? "text-slate-600 hover:bg-slate-50"
                    : "cursor-not-allowed text-slate-300"
              }`}
            >
              Datapoint trace
            </button>
          </div>

          {!hasDatapoint && (
            <span className="text-xs text-slate-500">
              Open a datapoint to load its trace graph.
            </span>
          )}

          {view === "datapoint" && backHref && (
            <Link
              href={backHref}
              className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              <ArrowLeft size={13} />
              Back to datapoint lineage
            </Link>
          )}
        </div>

        <div className="overflow-hidden">
          <div className="grid grid-cols-1 gap-5">
            {view === "system" && <SystemTableLineage />}

            {view === "datapoint" && (
              <>
                {loading && (
                  <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-6 text-sm text-slate-500">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600" />
                    Loading lineage graph…
                  </div>
                )}

                {!loading && error && (
                  <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-4 text-sm text-rose-700">
                    <p className="font-semibold">
                      Could not load the lineage graph.
                    </p>
                    <p className="mt-1 text-xs">{error}</p>
                  </div>
                )}

                {!loading && !error && data && (
                  <SystemLineageView data={data} />
                )}
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}


export default LineageEvidence;