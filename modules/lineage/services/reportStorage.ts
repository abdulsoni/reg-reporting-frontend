import {
  RegulatoryReport,
} from "../types/report";

const STORAGE_KEY = "regulatory_reports";

interface StoredReport {
  id?: string;
  fileName?: string;
  uploadedAt?: string;
  regulatoryReturn?: string;
  reportName?: string;
  report_name?: string;
  name?: string;
  title?: string;
  pages?: { page?: number; text?: string }[];
}

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

/**
 * Resolve the `report_name` the backend expects. An explicit id wins,
 * otherwise the most recently uploaded report is used.
 */
export function getLatestReportName(reportId?: string): string | null {
  if (typeof window === "undefined") return null;

  const reports = getReports() as StoredReport[];

  if (reports.length === 0) return null;

  // An explicit id wins.
  if (reportId) {
    const match = reports.find((report) => report.id === reportId);
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

  return null;
}


export function getReports(): RegulatoryReport[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const stored =
      localStorage.getItem(STORAGE_KEY);

    if (!stored) {
      return [];
    }

    const reports =
      JSON.parse(stored);

    if (!Array.isArray(reports)) {
      return [];
    }

    return reports;
  } catch (error) {
    console.error(
      "Failed to read reports from localStorage:",
      error
    );

    return [];
  }
}


export function saveReport(
  report: RegulatoryReport
): RegulatoryReport[] {
  const existingReports =
    getReports();

  const updatedReports = [
    report,
    ...existingReports.filter(
      (item) =>
        item.id !== report.id
    ),
  ];

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(updatedReports)
  );

  return updatedReports;
}


export function getReportById(
  reportId: string
): RegulatoryReport | null {
  const reports =
    getReports();

  return (
    reports.find(
      (report) =>
        report.id === reportId
    ) ?? null
  );
}


export function deleteReport(
  reportId: string
): RegulatoryReport[] {
  const reports =
    getReports();

  const updatedReports =
    reports.filter(
      (report) =>
        report.id !== reportId
    );

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(updatedReports)
  );

  return updatedReports;
}


export function clearReports(): void {
  localStorage.removeItem(
    STORAGE_KEY
  );
}