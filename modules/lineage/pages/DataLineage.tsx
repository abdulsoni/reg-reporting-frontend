"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { LineageRecord, SelectedDatapoint } from "../components/data-lineage/types";
import SelectedDatapointCard from "../components/data-lineage/SelectedDatapointCard";
import LineageDetailsTable from "../components/data-lineage/LineageDetailsTable";
import NextSourceIdentification from "../components/data-lineage/NextSourceIdentification";
import ValueReconciliation from "../components/data-lineage/ValueReconciliation";
import DataLineageHeader from "../components/data-lineage/DataLineageHeader";

const initialDatapoint: SelectedDatapoint = {
  reportName: "COREP C90 Regulatory Report",
  entity: "J P Morgan Bank",
  reportingDate: "30 Jun 2026",
  attribute: "on_balance",
  row: "0040",
  column: "0200",
  value: "600.00",
  unit: "EUR m",
  page: "4",
  section: "Capital adequacy",
  reportFile: "COREP_C90_Report_Test.pdf",
};

const initialRecords: LineageRecord[] = [
  {
    hop: "1",
    system: "NORMALIZED_DATA.DB",
    attribute: "on_balance",
    table: "normalized_metrics",
    transformation: "SUM(exposure_amount) + adjustment_amount",
    sourcedFrom: "FX_DATA.DB, AUDIT.DB, SENSI.DB",
    consumedBy: "PDF Report",
    status: "Verified",
    connected: true,
  },
  {
    hop: "2a",
    system: "FX_DATA.DB",
    attribute: "fx_rate",
    table: "fx_rates",
    transformation: "COALESCE(fx_rate, 1)",
    sourcedFrom: "FX rates source / trade_id = TRD-00981",
    consumedBy: "NORMALIZED_DATA.DB",
    status: "Verified",
    connected: true,
  },
  {
    hop: "2b",
    system: "AUDIT.DB",
    attribute: "adjustment_amount",
    table: "adjustments",
    transformation: "SUM(adjustment_amount)",
    sourcedFrom: "trade_id = TRD-00981",
    consumedBy: "NORMALIZED_DATA.DB",
    status: "Verified",
    connected: true,
  },
  {
    hop: "2c",
    system: "SENSI.DB",
    attribute: "exposure_amount",
    table: "trade_details",
    transformation: "SUM(exposure_amount)",
    sourcedFrom: "trade_id = TRD-00981",
    consumedBy: "NORMALIZED_DATA.DB",
    status: "Discovering",
    connected: false,
  },
];

export default function DataLineagePage() {
  const router = useRouter();
  const [records, setRecords] = useState<LineageRecord[]>(initialRecords);
  const [selectedHop, setSelectedHop] = useState<string | null>("2c");
  const [notice, setNotice] = useState<string | null>(null);

  const selectedRecord = useMemo(
    () => records.find((record) => record.hop === selectedHop),
    [records, selectedHop]
  );
  const nextSource = records.find((record) => !record.connected);

  const handleIdentifySource = (system: string) => {
    // Demo interaction: replace with your source-identification modal/API call.
    setNotice(`Source identification started for ${system}. Connect this action to your datasource discovery API.`);
  };

  const handleExport = () => {
    const headers = ["Hop", "System", "Attribute", "Table", "Transformation", "Sourced from", "Consumed by", "Status"];
    const rows = records.map((r) => [r.hop, r.system, r.attribute, r.table, r.transformation, r.sourcedFrom, r.consumedBy, r.status]);
    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(","))
      .join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "data-lineage.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main className="min-h-screen bg-[#f4f8fd] text-slate-800">
      <DataLineageHeader
        onUploadPdf={() => router.push("/reports/upload")}
        onSelectDatasource={() => router.push("/datasources")}
      />

      <div className="mx-auto max-w-[1800px] space-y-4 px-4 py-5 sm:px-6 lg:px-7">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="rounded-lg p-2 text-blue-800 transition hover:bg-blue-100"
            aria-label="Go back"
          >
            <span className="text-xl leading-none">←</span>
          </button>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-[#123866] sm:text-2xl">Data Lineage Details</h1>
            <p className="mt-1 text-sm text-slate-500">Trace a specific value to its source records.</p>
          </div>
        </div>

        <SelectedDatapointCard
          datapoint={initialDatapoint}
          onBack={() => router.push("/data-lineage/select-datapoint")}
          onViewGraph={() => router.push("/lineage-graph")}
          onExport={handleExport}
        />

        {notice && (
          <div role="status" className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
            <span>{notice}</span>
            <button onClick={() => setNotice(null)} className="font-semibold underline">Dismiss</button>
          </div>
        )}

        <LineageDetailsTable
          records={records}
          selectedHop={selectedHop}
          onSelectHop={setSelectedHop}
        />

        {selectedRecord && (
          <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-xs text-slate-600 shadow-sm">
            <span className="font-semibold text-slate-800">Selected hop {selectedRecord.hop}:</span>{" "}
            {selectedRecord.system} · {selectedRecord.table}.{selectedRecord.attribute} · Transformation:{" "}
            <span className="font-mono">{selectedRecord.transformation}</span>
          </div>
        )}

        <NextSourceIdentification
          record={nextSource}
          onIdentify={handleIdentifySource}
        />

        <ValueReconciliation
          sourceContributions={[
            { label: "Exposure contribution (SENSI)", value: 580 },
            { label: "Audit adjustments", value: 20 },
          ]}
          calculatedValue={600}
          reportedValue={Number(initialDatapoint.value)}
          unit={initialDatapoint.unit}
        />
      </div>
    </main>
  );
}
