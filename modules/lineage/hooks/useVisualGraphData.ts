"use client";

import { useEffect, useState } from "react";
import { getVisualGraph } from "../api/lineageDataApi";
import type { LineageData } from "../types/lineage";

export type VisualGraphState = {
  data: LineageData | null;
  loading: boolean;
  error: string | null;
};

/**
 * Load the report graph for one datapoint from
 * `GET /data-lineage/visual-graph`.
 *
 * The result is stored together with the request key so a response that
 * belongs to a previous report/datapoint can never be shown as current.
 */
export function useVisualGraphData(
  reportName?: string | null,
  datapointId?: string | null,
  refresh = false
): VisualGraphState {
  const activeReportName = reportName?.trim() || null;
  const activeDatapointId = datapointId?.trim() || null;

  const requestKey =
    activeReportName && activeDatapointId
      ? `${activeReportName}::${activeDatapointId}::${refresh}`
      : null;

  const [result, setResult] = useState<{
    key: string;
    data: LineageData | null;
    error: string | null;
  } | null>(null);

  useEffect(() => {
    if (!requestKey || !activeReportName || !activeDatapointId) {
      return;
    }

    let active = true;

    getVisualGraph(activeReportName, activeDatapointId, refresh)
      .then((data) => {
        if (!active) return;
        setResult({ key: requestKey, data, error: null });
      })
      .catch((caught) => {
        if (!active) return;
        setResult({
          key: requestKey,
          data: null,
          error:
            caught instanceof Error
              ? caught.message
              : "Failed to load the lineage graph.",
        });
      });

    return () => {
      active = false;
    };
  }, [activeReportName, activeDatapointId, refresh, requestKey]);

  if (!requestKey) {
    return {
      data: null,
      loading: false,
      error: "Open this page from a datapoint to load its lineage graph.",
    };
  }

  const current = result?.key === requestKey ? result : null;

  return {
    data: current?.data ?? null,
    loading: !current,
    error: current?.error ?? null,
  };
}
