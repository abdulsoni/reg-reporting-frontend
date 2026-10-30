import {
  RegulatoryReport,
} from "../types/report";

const STORAGE_KEY = "regulatory_reports";


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