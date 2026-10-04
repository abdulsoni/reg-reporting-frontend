"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import {
  RegulatoryReport,
} from "../types/report";

import {
  getReports,
  saveReport,
} from "../services/reportStorage";


interface ReportContextValue {
  reports: RegulatoryReport[];

  selectedReportId: string | null;

  selectedReport:
    | RegulatoryReport
    | null;

  setSelectedReportId: (
    reportId: string
  ) => void;

  addReport: (
    report: RegulatoryReport
  ) => void;

  refreshReports: () => void;
}


const ReportContext =
  createContext<
    ReportContextValue | undefined
  >(undefined);


export function ReportProvider({
  children,
}: {
  children: React.ReactNode;
}) {

  const [
    reports,
    setReports
  ] = useState<
    RegulatoryReport[]
  >([]);


  const [
    selectedReportId,
    setSelectedReportId
  ] = useState<string | null>(
    null
  );


  useEffect(() => {

    const storedReports =
      getReports();

    setReports(
      storedReports
    );

    if (
      storedReports.length > 0
    ) {

      setSelectedReportId(
        storedReports[0].id
      );

    }

  }, []);


  const addReport = (
    report: RegulatoryReport
  ) => {

    const updatedReports =
      saveReport(report);

    setReports(
      updatedReports
    );

    // Automatically select
    // the newly uploaded report.

    setSelectedReportId(
      report.id
    );
  };


  const refreshReports = () => {

    const storedReports =
      getReports();

    setReports(
      storedReports
    );
  };


  const selectedReport =
    reports.find(
      (report) =>
        report.id ===
        selectedReportId
    ) ?? null;


  return (
    <ReportContext.Provider
      value={{
        reports,

        selectedReportId,

        selectedReport,

        setSelectedReportId,

        addReport,

        refreshReports,
      }}
    >
      {children}
    </ReportContext.Provider>
  );
}


export function useReports() {

  const context =
    useContext(
      ReportContext
    );

  if (!context) {
    throw new Error(
      "useReports must be used inside ReportProvider"
    );
  }

  return context;
}