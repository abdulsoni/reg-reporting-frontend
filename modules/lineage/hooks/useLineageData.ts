"use client";

import { useEffect, useState } from "react";
import { getLineageData } from "../api/lineageDataApi";
import { useReports } from "../context/ReportContext";
import type { LineageData } from "../types/lineage";
import { DEFAULT_SCENARIO_ID, getScenario, ScenarioId } from "../data/scenarios";

export type LineageDataState = {
  data: LineageData;
  loading: boolean;
  error: string | null;
};

/**
 * Loads the single lineage response. The response is bundled with the app, so
 * it is available synchronously and needs no request lifecycle.
 */
export function useLineageData(scenarioId: ScenarioId = DEFAULT_SCENARIO_ID) {
  const { selectedReport } = useReports();
  const reportName = selectedReport?.regulatoryReturn ?? null;

  const [remote, setRemote] = useState<{
    id: ScenarioId;
    data: LineageData;
  } | null>(null);
  const [error, setError] = useState<{
    id: ScenarioId;
    message: string;
  } | null>(null);

  useEffect(() => {
    let active = true;

    getLineageData(scenarioId, reportName)
      .then((data) => {
        if (!active) return;
        setRemote({ id: scenarioId, data });
        setError(null);
      })
      .catch((caught) => {
        if (!active) return;
        setError({
          id: scenarioId,
          message:
            caught instanceof Error
              ? caught.message
              : "Failed to load lineage data",
        });
      });

    return () => {
      active = false;
    };
  }, [scenarioId, reportName]);

  // Prefer the freshly fetched response for this scenario; otherwise fall back
  // to the local scenario until the request resolves.
  const data =
    remote && remote.id === scenarioId ? remote.data : getScenario(scenarioId);
  const loading =
    (remote?.id ?? null) !== scenarioId && (error?.id ?? null) !== scenarioId;
  const errorMessage = error && error.id === scenarioId ? error.message : null;
  
  // const data = {
  //     database: "normalized_data.db",
  //     systems: [
  //       { id: "normalized_data.db", label: "normalized_data.db", "description": "Normalized reporting output database.",
  //          "connectionStatus": "connected",
  //          "metadataStatus": "available",target: true },
  //     ],
  //     tables: [
  //       {
  //         id: "adj_norm_sensi_data",
  //         name: "adj_norm_sensi_data",
  //         systemId: "normalized_data.db",
  //         attributes: [
  //           {
  //             id: "normalized_id",
  //             name: "normalized_id",
  //             dataType: "TEXT",
  //             transformation: "normalized_id",
  //             status: "Identified",
  //             sourceSystemId: "normalized_data.db",
  //           },
  //           {
  //             id: "sensitivity_id",
  //             name: "sensitivity_id",
  //             dataType: "TEXT",
  //             transformation: "sensitivity_id",
  //             status: "Identified",
  //             sourceSystemId: "normalized_data.db",
  //           },
  //           {
  //             id: "trade_id",
  //             name: "trade_id",
  //             dataType: "TEXT",
  //             transformation: "trade_id",
  //             status: "Identified",
  //             sourceSystemId: "normalized_data.db",
  //           },
  //           {
  //             id: "risk_class",
  //             name: "risk_class",
  //             dataType: "TEXT",
  //             transformation: "risk_class",
  //             status: "Identified",
  //             sourceSystemId: "normalized_data.db",
  //           },
  //           {
  //             id: "sensitivity_type",
  //             name: "sensitivity_type",
  //             dataType: "TEXT",
  //             transformation: "sensitivity_type",
  //             status: "Identified",
  //             sourceSystemId: "normalized_data.db",
  //           },
  //           {
  //             id: "bucket_id",
  //             name: "bucket_id",
  //             dataType: "TEXT",
  //             transformation: "bucket_id",
  //             status: "Identified",
  //             sourceSystemId: "normalized_data.db",
  //           },
  //           {
  //             id: "risk_factor_id",
  //             name: "risk_factor_id",
  //             dataType: "TEXT",
  //             transformation: "risk_factor_id",
  //             status: "Identified",
  //             sourceSystemId: "normalized_data.db",
  //           },
  //           {
  //             id: "original_local",
  //             name: "original_local",
  //             dataType: "TEXT",
  //             transformation: "original_local",
  //             status: "Identified",
  //             sourceSystemId: "normalized_data.db",
  //           },
  //           {
  //             id: "approved_adjustment_local",
  //             name: "approved_adjustment_local",
  //             dataType: "TEXT",
  //             transformation:
  //               "original_local + approved_adjustment_local AS approved_adjustment_local",
  //             status: "Identified",
  //             sourceSystemId: "normalized_data.db",
  //           },
  //           {
  //             id: "adjustment_local",
  //             name: "adjustment_local",
  //             dataType: "TEXT",
  //             transformation: "adjustment_local",
  //             status: "Identified",
  //             sourceSystemId: "normalized_data.db",
  //           },
  //           {
  //             id: "fx_rate",
  //             name: "fx_rate",
  //             dataType: "TEXT",
  //             transformation: "fx_rate",
  //             status: "Identified",
  //             sourceSystemId: "normalized_data.db",
  //           },
  //           {
  //             id: "fx_rate_id",
  //             name: "fx_rate_id",
  //             dataType: "TEXT",
  //             transformation: "fx_rate_id",
  //             status: "Identified",
  //             sourceSystemId: "normalized_data.db",
  //           },
  //           {
  //             id: "normalized_usd",
  //             name: "normalized_usd",
  //             dataType: "TEXT",
  //             transformation:
  //               "approved_adjustment_local * fx_rate AS normalized_usd",
  //             status: "Identified",
  //             sourceSystemId: "normalized_data.db",
  //           },
  //         ],
  //       },
  //     ],
  //     lineageEdges: [
  //       {
  //         id: "e-adj_norm_sensi_data-original_local-approved_adjustment_local",
  //         source: "original_local",
  //         target: "approved_adjustment_local",
  //         sourceTable: "adj_norm_sensi_data",
  //         targetTable: "adj_norm_sensi_data",
  //         sourceSystemId: "normalized_data.db",
  //         targetSystemId: "normalized_data.db",
  //         transformation:
  //           "original_local + approved_adjustment_local AS approved_adjustment_local",
  //         description:
  //           "original_local contributes to approved_adjustment_local",
  //       },
  //       {
  //         id: "e-adj_norm_sensi_data-approved_adjustment_local-normalized_usd",
  //         source: "approved_adjustment_local",
  //         target: "normalized_usd",
  //         sourceTable: "adj_norm_sensi_data",
  //         targetTable: "adj_norm_sensi_data",
  //         sourceSystemId: "normalized_data.db",
  //         targetSystemId: "normalized_data.db",
  //         transformation:
  //           "approved_adjustment_local * fx_rate AS normalized_usd",
  //         description:
  //           "approved_adjustment_local contributes to normalized_usd",
  //       },
  //       {
  //         id: "e-adj_norm_sensi_data-fx_rate-normalized_usd",
  //         source: "fx_rate",
  //         target: "normalized_usd",
  //         sourceTable: "adj_norm_sensi_data",
  //         targetTable: "adj_norm_sensi_data",
  //         sourceSystemId: "normalized_data.db",
  //         targetSystemId: "normalized_data.db",
  //         transformation:
  //           "approved_adjustment_local * fx_rate AS normalized_usd",
  //         description: "fx_rate contributes to normalized_usd",
  //       },
  //     ],
  //     dependencies:[]
  //   };
  return { data, loading, error: errorMessage };
}
// export function useLineageData(): LineageDataState {
//   return {
//     data: getLineageData(),
//     loading: false,
//     error: null,
//   };
// }
