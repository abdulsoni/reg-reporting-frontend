"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";

import { RegulatoryReport } from "../types/report";

import {
  getEmptyReportsSnapshot,
  getReportsSnapshot,
  reloadReports,
  saveReport,
  subscribeToReports,
} from "../services/reportStorage";

interface ReportContextValue {
  reports: RegulatoryReport[];

  selectedReportId: string | null;

  selectedReport: RegulatoryReport | null;

  setSelectedReportId: (reportId: string | null) => void;

  addReport: (report: RegulatoryReport) => void;

  refreshReports: () => void;
}

const ReportContext = createContext<ReportContextValue | undefined>(
  undefined
);

export function ReportProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  /*
   * localStorage is the store of record, so it is subscribed to directly rather
   * than copied into state. That keeps the server render (empty) and the hydrated
   * client render consistent without an effect that re-renders on mount.
   */
  const reports = useSyncExternalStore(
    subscribeToReports,
    getReportsSnapshot,
    getEmptyReportsSnapshot
  );

  const [requestedReportId, setRequestedReportId] = useState<string | null>(
    null
  );

  /*
   * A stored report can disappear while the tab is open, so the selection falls
   * back to the newest report rather than dangling on a missing id.
   */
  const selectedReportId =
    requestedReportId && reports.some((report) => report.id === requestedReportId)
      ? requestedReportId
      : (reports[0]?.id ?? null);

  const addReport = useCallback((report: RegulatoryReport) => {
    saveReport(report);

    // Automatically select the newly uploaded report.
    setRequestedReportId(report.id);
  }, []);

  const refreshReports = useCallback(() => {
    reloadReports();
  }, []);

  const selectedReport =
    reports.find((report) => report.id === selectedReportId) ?? null;

  const value = useMemo(
    () => ({
      reports,
      selectedReportId,
      selectedReport,
      setSelectedReportId: setRequestedReportId,
      addReport,
      refreshReports,
    }),
    [reports, selectedReportId, selectedReport, addReport, refreshReports]
  );

  return (
    <ReportContext.Provider value={value}>
      {children}
    </ReportContext.Provider>
  );
}

export function useReports() {
  const context = useContext(ReportContext);

  if (!context) {
    throw new Error("useReports must be used inside ReportProvider");
  }

  return context;
}