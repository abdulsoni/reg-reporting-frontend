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

interface StoredReport {
  id?: string;
  fileName?: string;
  uploadedAt?: string;
  regulatoryReturn?: string;
  pages?: { page?: number; text?: string }[];
  [key: string]: unknown;
}

const REPORTS_STORAGE_KEY = "regulatory_reports";

function clean(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

/** The name the backend stores: first line of the PDF, minus a trailing dot. */
function reportNameOf(report: StoredReport): string | null {
  const direct =
    clean(report.regulatoryReturn) ??
    clean(report.reportName) ??
    clean(report.report_name) ??
    clean(report.name) ??
    clean(report.title);

  if (direct) return direct.replace(/\.$/, "").trim();

  const firstLine = clean(report.pages?.[0]?.text?.split("\n")[0]);
  if (firstLine) return firstLine.replace(/\.$/, "").trim();

  const file = clean(report.fileName);
  return file ? file.replace(/\.pdf$/i, "") : null;
}

function getFirstReportNameFromStorage(reportId?: string): string | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = localStorage.getItem(REPORTS_STORAGE_KEY);
    if (!raw) return null;

    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return null;

    const reports = parsed.filter(
      (item): item is StoredReport => !!item && typeof item === "object"
    );

    // An explicit id wins.
    if (reportId) {
      const match = reports.find((r) => r.id === reportId);
      if (match) return reportNameOf(match);
    }

    // Otherwise use the most recently uploaded report.
    const latestFirst = [...reports].sort(
      (a, b) =>
        (Date.parse(b.uploadedAt ?? "") || 0) -
        (Date.parse(a.uploadedAt ?? "") || 0)
    );

    for (const report of latestFirst) {
      const name = reportNameOf(report);
      if (name) return name;
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
  const response = await fetch(apiUrl(`/api/lineage/metadata?report_name=${reportName}`), {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to load lineage data");
  }
  
  return response.json();
}
