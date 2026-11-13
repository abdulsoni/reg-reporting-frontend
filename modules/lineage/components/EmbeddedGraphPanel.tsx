"use client";

import { Loader2 } from "lucide-react";

import { SystemLineageView } from "./SystemTableLineage";
import { useVisualGraphData } from "../hooks/useVisualGraphData";

type Props = {
  reportName: string;
  datapointId: string;
};

/**
 * Body of the "Lineage Graph" panel on the data lineage page.
 *
 * It only mounts while the graph view is open, so the visual-graph request is
 * made with real ids (never null) and only when the user asks for the graph.
 * It always renders something, so the details table never shows through.
 */
export default function EmbeddedGraphPanel({
  reportName,
  datapointId,
}: Props) {
  const { data, loading, error } = useVisualGraphData(
    reportName,
    datapointId
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="flex items-center gap-2 text-[11px] text-slate-500">
          <Loader2 size={15} className="animate-spin" />
          Loading lineage graph...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-4 text-[11px] text-rose-700">
        <p className="font-semibold">Could not load the lineage graph.</p>
        <p className="mt-1">{error}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="py-12 text-center text-[11px] text-slate-500">
        No lineage graph is available for this datapoint.
      </div>
    );
  }

  return (
    <SystemLineageView
      data={data}
      embedded
      showTraceSummary={false}
      showPathDetails={false}
    />
  );
}
