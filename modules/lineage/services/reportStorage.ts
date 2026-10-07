import { RegulatoryReport } from "../types/report";

const STORAGE_KEY = "regulatory_reports";

const EMPTY: RegulatoryReport[] = [];

const listeners = new Set<() => void>();

/*
 * Cached because useSyncExternalStore compares snapshots by identity: re-parsing
 * localStorage on every call would register as a change on every render.
 */
let snapshot: RegulatoryReport[] = EMPTY;
let snapshotValid = false;

export function getReports(): RegulatoryReport[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);

    if (!stored) {
      return [];
    }

    const reports = JSON.parse(stored);

    if (!Array.isArray(reports)) {
      return [];
    }

    return reports;
  } catch (error) {
    console.error("Failed to read reports from localStorage:", error);

    return [];
  }
}

function notifyReportsChanged(): void {
  snapshotValid = false;

  for (const listener of listeners) listener();
}

/** Re-read localStorage and re-render every reader. */
export function reloadReports(): void {
  notifyReportsChanged();
}

export function subscribeToReports(listener: () => void): () => void {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

export function getReportsSnapshot(): RegulatoryReport[] {
  if (!snapshotValid) {
    snapshot = getReports();
    snapshotValid = true;
  }

  return snapshot;
}

/** The server has no localStorage, so its first render must be the empty list. */
export function getEmptyReportsSnapshot(): RegulatoryReport[] {
  return EMPTY;
}

export function saveReport(report: RegulatoryReport): RegulatoryReport[] {
  const existingReports = getReports();

  const updatedReports = [
    report,
    ...existingReports.filter((item) => item.id !== report.id),
  ];

  localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedReports));

  notifyReportsChanged();

  return updatedReports;
}

export function getReportById(
  reportId: string
): RegulatoryReport | null {
  const reports = getReports();

  return reports.find((report) => report.id === reportId) ?? null;
}

export function deleteReport(reportId: string): RegulatoryReport[] {
  const reports = getReports();

  const updatedReports = reports.filter((report) => report.id !== reportId);

  localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedReports));

  notifyReportsChanged();

  return updatedReports;
}

export function clearReports(): void {
  localStorage.removeItem(STORAGE_KEY);

  notifyReportsChanged();
}