"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import {
  RegulatoryReport,
  ReportDatapoint,
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

  selectedDatapoint:
  | ReportDatapoint
  | null;

  setSelectedReportId: (
    reportId: string
  ) => void;

  setSelectedDatapoint: (
    datapoint: ReportDatapoint | null
  ) => void;

  addReport: (
    report: RegulatoryReport
  ) => void;

  refreshReports: () => void;
  dbType: string;
  database: string;
  setDbType: (value: string) => void;
  setDatabase: (value: string) => void;
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

  const [dbType, setDbType] = useState("");
  const [database, setDatabase] = useState("");


  const [
    selectedReportId,
    setSelectedReportIdState
  ] = useState<string | null>(
    null
  );

  const [
    selectedDatapoint,
    setSelectedDatapoint
  ] = useState<ReportDatapoint | null>(
    null
  );


  const setSelectedReportId = (
    reportId: string
  ) => {
    setSelectedReportIdState(reportId);
    setSelectedDatapoint(null);
  };


  useEffect(() => {

    const storedReports =
      getReports();

    setReports(
      storedReports
    );

    if (
      storedReports.length > 0
    ) {

      setSelectedReportIdState(
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
    // A new report invalidates the
    // datapoint selection of the old one.

    setSelectedReportIdState(
      report.id
    );

    setSelectedDatapoint(null);
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

        selectedDatapoint,

        setSelectedReportId,

        setSelectedDatapoint,

        addReport,

        refreshReports,
        dbType,
        database,
        setDbType,
        setDatabase,
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