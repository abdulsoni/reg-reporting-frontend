"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, RefreshCw } from "lucide-react";

import DataLineageHeader from "../components/data-lineage/DataLineageHeader";
import LineageDetailsTable from "../components/data-lineage/LineageDetailsTable";
import NextSourceIdentification from "../components/data-lineage/NextSourceIdentification";
import SelectedDatapointCard from "../components/data-lineage/SelectedDatapointCard";
import ValueReconciliation from "../components/data-lineage/ValueReconciliation";
import EmbeddedGraphPanel from "../components/EmbeddedGraphPanel";
import { NextSourceConnectPanel } from "../components/NextSourceConnectPanel";
import { useReports } from "../context/ReportContext";
import { getDataTrace } from "../services/lineageApi";
import type { DataTraceResponse } from "../types/dataTrace";
import {
  formatTraceValue,
  mapTraceHops,
  normalizeReconciliation,
  reconciliationForHop,
} from "../utils/dataTraceMapper";

type DataLineagePageProps = {
  reportName?: string;
  datapointId?: string;
};

export default function DataLineagePage({
  reportName,
  datapointId,
}: DataLineagePageProps) {
  const router = useRouter();

  const {
    reports,
    selectedReport,
    selectedDatapoint,
  } = useReports();

  /*
   * A datapoint selected on the report page can fill in the
   * query parameters when the route was opened directly. It is
   * only used when it belongs to the report in the URL.
   */
  const contextDatapoint =
    selectedDatapoint &&
    (!reportName ||
      selectedDatapoint.report_name === reportName)
      ? selectedDatapoint
      : null;

  const effectiveReportName =
    reportName ??
    contextDatapoint?.report_name ??
    selectedReport?.regulatoryReturn;

  const effectiveDatapointId =
    datapointId ?? contextDatapoint?.datapoint_id;

  const [reloadKey, setReloadKey] = useState(0);
  const [showNextSourceConnect, setShowNextSourceConnect] =
    useState(false);
  const [selectedHopId, setSelectedHopId] = useState<string | null>(
    null
  );
  const [showGraph, setShowGraph] = useState(false);

  const requestKey =
    effectiveReportName && effectiveDatapointId
      ? `${effectiveReportName}::${effectiveDatapointId}::${reloadKey}`
      : null;

  /*
   * The result is stored together with the request it belongs to, so
   * `loading` can be derived during render. That keeps the effect free
   * of synchronous state updates.
   */
  const [result, setResult] = useState<{
    requestKey: string | null;
    trace: DataTraceResponse | null;
    error: string | null;
  }>({
    requestKey: null,
    trace: null,
    error: null,
  });

  useEffect(() => {
    const reportNameForRequest = effectiveReportName;
    const datapointIdForRequest = effectiveDatapointId;

    if (!reportNameForRequest || !datapointIdForRequest) {
      return;
    }

    let active = true;

    async function load(
      reportNameForRequest: string,
      datapointIdForRequest: string
    ) {
      try {
        const response = await getDataTrace({
          report_name: reportNameForRequest,
          datapoint_id: datapointIdForRequest,
          persist: true,
        });

        if (active) {
          setResult({
            requestKey,
            trace: response,
            error: null,
          });
          setSelectedHopId(null);
        }
      } catch (cause) {
        if (active) {
          setResult({
            requestKey,
            trace: null,
            error:
              cause instanceof Error
                ? cause.message
                : "Failed to trace data lineage.",
          });
        }
      }
    }

    void load(reportNameForRequest, datapointIdForRequest);

    return () => {
      active = false;
    };
  }, [
    effectiveReportName,
    effectiveDatapointId,
    requestKey,
  ]);

  const isCurrentRequest =
    requestKey !== null && result.requestKey === requestKey;

  const trace = isCurrentRequest ? result.trace : null;

  const error = isCurrentRequest ? result.error : null;

  const loading = requestKey !== null && !isCurrentRequest;

  const rows = useMemo(
    () => (trace ? mapTraceHops(trace) : []),
    [trace]
  );

  const selectedHop =
    selectedHopId && trace
      ? trace.hops.find((hop) => hop.hop === selectedHopId) ?? null
      : null;

  const overallReconciliation = trace
    ? normalizeReconciliation(
        trace.reconciliation,
        trace.hops[0]?.output
      )
    : null;

  const displayedReconciliation =
    selectedHop && overallReconciliation
      ? reconciliationForHop(
          selectedHop,
          overallReconciliation.tolerance
        )
      : overallReconciliation;

  const reconciliationContext = selectedHop
    ? `Hop ${selectedHop.hop} · ${selectedHop.system}.${selectedHop.table}.${selectedHop.attribute}`
    : undefined;

  const reportFile =
    reports.find(
      (report) =>
        report.regulatoryReturn ===
        (trace?.report_name ?? effectiveReportName)
    )?.fileName ??
    selectedReport?.fileName;

  const exportCsv = () => {
    if (!trace) return;

    const headers = [
      "Hop",
      "System",
      "Table",
      "Attribute",
      "Record / Join Key",
      "Input Value(s)",
      "Input Attributes",
      "Transformation",
      "Output Value",
      "Status",
      "Reason",
    ];

    const values = trace.hops.map((hop) => [
      hop.hop,
      hop.system,
      hop.table,
      hop.attribute,
      hop.record_key ?? "",
      hop.inputs.map(formatTraceValue).join(" + "),
      hop.input_attributes.join(", "),
      hop.transformation,
      formatTraceValue(hop.output),
      hop.status,
      hop.reason ?? "",
    ]);

    const csv = [headers, ...values]
      .map((row) =>
        row
          .map(
            (value) =>
              `"${String(value).replaceAll('"', '""')}"`
          )
          .join(",")
      )
      .join("\r\n");

    const link = document.createElement("a");

    link.href = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8;" })
    );

    link.download = `${trace.datapoint_id}.csv`;

    link.click();

    URL.revokeObjectURL(link.href);
  };

  /*
   * SourceSystemPanel calls this only after a successful connection, so it is
   * safe to close the panel and re-run the trace to reveal the next source.
   */
  const handleConnectNextSource = async () => {
    setShowNextSourceConnect(false);
    setReloadKey((value) => value + 1);
  };

  return (
    <div className="min-h-screen bg-[#f4f2ed] text-ink">
      <DataLineageHeader />

      <main className="mx-auto max-w-[1500px] space-y-3 p-4 sm:p-6 lg:p-8">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push("/lineage")}
            aria-label="Back"
            className="rounded-lg border border-slate-300 bg-white p-2 text-ink shadow-soft hover:bg-slate-50"
          >
            <ArrowLeft size={19} />
          </button>

          <div>
            <h1 className="text-lg font-bold tracking-tight text-ink sm:text-xl">
              Data Lineage Details
            </h1>

            <p className="mt-1 text-xs text-slate-500">
              Trace a specific value to its source records
              {effectiveDatapointId ? (
                <span className="ml-1 font-mono text-[10px] text-slate-400">
                  · {effectiveDatapointId}
                </span>
              ) : null}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="panel flex items-center justify-center py-16">
            <div className="flex items-center gap-2 text-[11px] text-slate-500">
              <Loader2 size={15} className="animate-spin" />
              Tracing data lineage...
            </div>
          </div>
        ) : error ? (
          <div className="panel px-5 py-10 text-center">
            <h2 className="text-sm font-bold text-ink">
              Unable to trace data lineage
            </h2>

            <p className="mx-auto mt-2 max-w-xl text-[11px] leading-5 text-slate-600">
              {error}
            </p>

            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setReloadKey((value) => value + 1)}
                className="btn-primary"
              >
                <RefreshCw size={13} />
                Retry
              </button>

              <Link href="/lineage" className="btn-secondary">
                <ArrowLeft size={13} />
                Select a datapoint
              </Link>
            </div>
          </div>
        ) : !trace ? (
          <div className="panel px-5 py-10 text-center">
            <h2 className="text-sm font-bold text-ink">
              No datapoint selected
            </h2>

            <p className="mx-auto mt-2 max-w-xl text-[11px] leading-5 text-slate-500">
              Upload a report, select a datapoint cell and connect a
              source system to trace the value back to its records.
            </p>

            <Link
              href="/lineage"
              className="btn-primary mt-4 inline-flex"
            >
              <ArrowLeft size={13} />
              Back to select datapoint
            </Link>
          </div>
        ) : (
          <>
            <SelectedDatapointCard
              trace={trace}
              reportFile={reportFile}
              showGraph={showGraph}
              onShowGraph={() => setShowGraph(true)}
              onShowTable={() => setShowGraph(false)}
            />

            {trace.truncated && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-[11px] text-amber-800">
                This trace was truncated by the backend. Some
                upstream records may not be shown.
              </div>
            )}

            <LineageDetailsTable
              title={showGraph ? "Lineage Graph" : "Data Lineage"}
              rows={rows}
              selectedHop={selectedHopId}
              onRowSelect={setSelectedHopId}
              onExport={exportCsv}
              graphContent={
                showGraph ? (
                  <EmbeddedGraphPanel
                    reportName={trace.report_name}
                    datapointId={trace.datapoint_id}
                  />
                ) : null
              }
            >
              {trace.next_source && (
                <NextSourceIdentification
                  nextSource={trace.next_source}
                  onIdentify={() => setShowNextSourceConnect(true)}
                />
              )}
            </LineageDetailsTable>

            {showNextSourceConnect && (
              <NextSourceConnectPanel
                onConnect={handleConnectNextSource}
              />
            )}

            {displayedReconciliation && (
              <ValueReconciliation
                reconciliation={displayedReconciliation}
                unit={trace.unit ?? trace.header.unit}
                context={reconciliationContext}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}
