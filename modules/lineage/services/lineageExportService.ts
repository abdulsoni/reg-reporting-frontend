/**
 * Excel export of a traced datapoint.
 *
 * The backend endpoint needs both the report name and the datapoint id; it
 * streams an `.xlsx` file containing every hop of the stored trace. There is
 * no backend `report_id` in this app, so the caller passes the identifiers it
 * already has from the trace response.
 */
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export type LineageExcelExportRequest = {
  reportName: string;
  datapointId: string;
};

function sanitizeFileName(name: string): string {
  const cleaned = name
    .trim()
    .replace(/[\\/:*?"<>|]+/g, "-")
    .replace(/\s+/g, " ")
    .slice(0, 120);

  return cleaned || "datapoint";
}

export async function exportLineageExcel({
  reportName,
  datapointId,
}: LineageExcelExportRequest): Promise<string> {
  const query = new URLSearchParams({
    report_name: reportName,
    datapoint_id: datapointId,
  });

  const response = await fetch(
    `${API_BASE_URL}/api/lineage/export/excel?${query.toString()}`,
    {
      method: "GET",
      credentials: "include",
      cache: "no-store",
    }
  ).catch(() => {
    throw new Error(
      "Unable to reach the lineage service. Check your connection and try again."
    );
  });

  if (!response.ok) {
    let message = `Unable to export lineage (${response.status})`;

    try {
      const error = await response.json();

      message = error?.detail || error?.message || message;
    } catch {
      // The backend may answer with plain text instead of JSON.
    }

    throw new Error(message);
  }

  const blob = await response.blob();
  const fileName = `data_lineage_${sanitizeFileName(datapointId)}.xlsx`;
  const downloadUrl = window.URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = downloadUrl;
  link.download = fileName;
  link.rel = "noopener";

  document.body.appendChild(link);
  link.click();
  link.remove();

  /*
   * Revoking straight away can cancel the download in some browsers, so give
   * the click a tick to start first.
   */
  window.setTimeout(() => window.URL.revokeObjectURL(downloadUrl), 0);

  return fileName;
}
