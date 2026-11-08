import { DEFAULT_SCENARIO_ID, ScenarioId } from "../data/scenarios";
import { apiUrl } from "../lib/config";
import type { LineageData } from "../types/lineage";
import { getLatestReportName } from "../services/reportStorage";
import lineageResponse from "./data.json";

/**
 * The bundled lineage response. It carries both the metadata graph (systems,
 * tables, edges) and the data-trace values for the reported datapoint, so the
 * explorer can render the values alongside the system/table lineage.
 */
// const lineageData = lineageResponse as unknown as LineageData;

/** Return the full lineage graph from the bundled response. */
// export function getLineageData(): LineageData {
//   return lineageData;
// }

// export async function getLineageData(
//   scenarioId: ScenarioId = DEFAULT_SCENARIO_ID
// ): Promise<LineageData> {
//   // const response = await fetch(
//   //   `/api/lineage/graph?scenario=${encodeURIComponent(scenarioId)}`,
//   //   { cache: "no-store" }
//   // );

//   const response = await fetch(apiUrl("/lineage/metadata?report_name=COREP C90 Report"), {
//     cache: "no-store",
//   });

//   if (!response.ok) {
//     throw new Error("Failed to load lineage data");
//   }

//   return response.json();
// }

// export async function getLineageData(): Promise<LineageData> {
//   const response = await fetch(
//     apiUrl("/reverse-lineage-tracking"),
//     {
//       method: "POST",
//       headers: {
//         "Accept": "*/*",
//         "Content-Type": "application/json",
//       },
//       cache: "no-store",
//       body: JSON.stringify({
//         db_type: "sqlite",
//         database: "normalized_data.db",
//         report_name: "normalized_data",
//         object_name: "vw_adj_norm_sensi",
//       }),
//     }
//   );

//   if (!response.ok) {
//     throw new Error("Failed to load lineage data");
//   }

//   const data = await response.json();
//     // Force targetTable to raw_sensi for all edges
//   data.graph.edges = data.graph.edges.map((edge: any) => ({
//     ...edge,
//     targetTable: "raw_sensi",
//   }));
//   // Return only the graph section
//   return data.graph;
// }


// import { DEFAULT_SCENARIO_ID, type ScenarioId } from "../data/scenarios";
// import { getLatestReportName } from "../services/reportStorage";
// import type { LineageData } from "../types/lineage";

/**
 * Fetch the full lineage graph from the metadata endpoint, scoped to the
 * report the user currently has selected.
 */
export async function getLineageData(
  scenarioId: ScenarioId = DEFAULT_SCENARIO_ID,
  reportName?: string | null
): Promise<LineageData> {
  // const response = await fetch(
  //   `/api/lineage/graph?scenario=${encodeURIComponent(scenarioId)}`,
  //   { cache: "no-store" }
  // );
  const activeReportName = reportName?.trim() || getLatestReportName();

  const params = new URLSearchParams();
  if (activeReportName) params.set("report_name", activeReportName);
  const query = params.toString();

  const response = await fetch(
    apiUrl(`/api/lineage/metadata${query ? `?${query}` : ""}`),
    { cache: "no-store" }
  );

  if (!response.ok) {
    throw new Error("Failed to load lineage data");
  }

  return response.json();
}

/**
 * Fetch the report graph with one datapoint trace highlighted.
 *
 * The response has the same shape as the metadata graph (`version`, `metadata`,
 * `systems`, `tables`, `lineageEdges`, `dependencies`) plus a `trace` block, so
 * the existing graph components can render it without an adapter.
 */
export async function getVisualGraph(
  reportName: string,
  datapointId: string,
  refresh = false
): Promise<LineageData> {
  const params = new URLSearchParams({
    report_name: reportName,
    datapoint_id: datapointId,
    refresh: String(refresh),
  });

  const response = await fetch(
    apiUrl(`/data-lineage/visual-graph?${params.toString()}`),
    {
      cache: "no-store",
      headers: { Accept: "*/*" },
    }
  );

  if (!response.ok) {
    let detail: string | null = null;

    try {
      const body = (await response.json()) as { detail?: unknown };
      if (typeof body.detail === "string") detail = body.detail;
    } catch {
      // The response was not JSON; fall back to the status code.
    }

    throw new Error(
      detail ?? `Failed to load lineage graph (${response.status})`
    );
  }

  return response.json();
}
