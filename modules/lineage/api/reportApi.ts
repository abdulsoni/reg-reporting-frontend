import { apiUrl } from "../lib/config";
import type {
  ReportDatapoint,
  ReportSummary,
  UploadedReportResponse,
} from "../types/report";

export async function uploadReport(
  file: File
): Promise<UploadedReportResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(apiUrl("/documents/upload-pdf"), {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || "Upload failed");
  }

  return response.json();
}

/** Read back the figures stored for a report. */
export async function getReportDatapoints(
  reportId: string
): Promise<ReportDatapoint[]> {
  const response = await fetch(apiUrl(`/reports/${reportId}/datapoints`), {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to load report data points");
  }

  return response.json();
}

/** Read back a stored report's metadata. */
export async function getReportSummary(
  reportId: string
): Promise<ReportSummary> {
  const response = await fetch(apiUrl(`/reports/${reportId}`), {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to load report");
  }

  return response.json();
}

export async function connectDatabase(params: {
  db_type: string;
  // host: string;
  // port: number;
  database: string;
  // username: string;
  // password: string;
  report_name: string | undefined;
}) {
  const response = await fetch(apiUrl("/lineage/connect"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || "Failed to connect to database");
  }

  // API returns 200 on success
  return response.json().catch(() => null);
}