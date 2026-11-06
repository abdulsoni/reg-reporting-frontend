import { apiUrl } from "../lib/config";
// import type { LineageData } from "../types/lineage";

// /** Fetch the full lineage graph for the connected database. */
// export async function getLineageData(): Promise<LineageData> {
//   const response = await fetch(apiUrl("/api/lineage"), {
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


import { DEFAULT_SCENARIO_ID, type ScenarioId } from "../data/scenarios";
import { getLatestReportName } from "../services/reportStorage";
import type { LineageData } from "../types/lineage";

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
