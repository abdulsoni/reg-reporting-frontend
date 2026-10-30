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
import type { LineageData } from "../types/lineage";

function getFirstReportNameFromStorage(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const storageKeys = ["regulatory_reports"];

    for (const key of storageKeys) {
      const raw = localStorage.getItem(key);
      if (!raw) continue;

      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const firstReport = parsed[0];
        const reportName =
          firstReport?.name ||
          firstReport?.reportName ||
          firstReport?.title ||
          firstReport?.report_name;

        if (typeof reportName === "string" && reportName.trim()) {
          return reportName.trim();
        }
      }
    }
  } catch (error) {
    console.error("Failed to read report name from localStorage:", error);
  }

  return null;
}

/**
 * Fetch the full lineage graph from the single graph endpoint. The request is
 * same-origin (served by the local route handler) rather than an external API.
 */
export async function getLineageData(
  scenarioId: ScenarioId = DEFAULT_SCENARIO_ID
): Promise<LineageData> {
  // const response = await fetch(
  //   `/api/lineage/graph?scenario=${encodeURIComponent(scenarioId)}`,
  //   { cache: "no-store" }
  // );
  const reportName = getFirstReportNameFromStorage();
  console.log('reportName',reportName)
  const response = await fetch(apiUrl("/api/lineage/metadata?report_name=COREP C90 Report"), {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to load lineage data");
  }
  
  return response.json();
}
