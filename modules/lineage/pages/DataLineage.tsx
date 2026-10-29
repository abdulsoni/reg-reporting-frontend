"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { LineageRow } from "../components/data-lineage/types";
import DataLineageHeader from "../components/data-lineage/DataLineageHeader";
import SelectedDatapointCard from "../components/data-lineage/SelectedDatapointCard";
import LineageDetailsTable from "../components/data-lineage/LineageDetailsTable";
import NextSourceIdentification from "../components/data-lineage/NextSourceIdentification";
import ValueReconciliation from "../components/data-lineage/ValueReconciliation";
import { ArrowLeft } from "lucide-react";

// Demo data matches the screenshot's layout. Replace with your API response before production use.
const initialRows: LineageRow[] = [
  {
    hop: "1",
    system: "NORMALIZED_DATA.DB",
    systemLabel: "Reporting Layer",
    table: "normalized_metrics",
    attribute: "on_balance",
    recordKey: "—",
    inputValue: "580.00 + 20.00",
    transformation: "SUM(exposure_amount) +\nadjustment_amount",
    valuesUsed: "580.00\n+ 20.00",
    outputValue: "600.00 EUR m",
    consumedBy: "PDF Report\n(COREP C90)",
    status: "Verified",
    connected: true,
  },
  {
    hop: "2a",
    system: "FX_DATA.DB",
    systemLabel: "FX Rates",
    table: "fx_rates",
    attribute: "fx_rate",
    recordKey: "TRD-00981",
    inputValue: "0.9123",
    transformation: "COALESCE(fx_rate, 1)",
    valuesUsed: "0.9123",
    outputValue: "0.9123",
    consumedBy: "normalized_metrics",
    status: "Verified",
    connected: true,
  },
  {
    hop: "2b",
    system: "AUDIT.DB",
    systemLabel: "Adjustments",
    table: "adjustments",
    attribute: "adjustment_amount",
    recordKey: "TRD-00981",
    inputValue: "20.00",
    transformation: "SUM(adjustment_amount)",
    valuesUsed: "20.00",
    outputValue: "20.00",
    consumedBy: "normalized_metrics",
    status: "Verified",
    connected: true,
  },
  {
    hop: "2c",
    system: "SENSI.DB",
    systemLabel: "Exposure",
    table: "trade_details",
    attribute: "exposure_amount",
    recordKey: "TRD-00981",
    inputValue: "580.00",
    transformation: "SUM(exposure_amount)",
    valuesUsed: "580.00",
    outputValue: "580.00",
    consumedBy: "normalized_metrics",
    status: "Discovering",
    connected: false,
  },
];

export default function DataLineagePage() {
  const router = useRouter();
  const [rows] = useState(initialRows);
  const [notice, setNotice] = useState("");
  const disconnected = rows.find((r) => !r.connected);
  const exportCsv = () => {
    const headers = [
      "Hop",
      "System",
      "Table",
      "Attribute",
      "Record / Join Key",
      "Input Value(s)",
      "Transformation",
      "Values Used",
      "Output Value",
      "Consumed By",
      "Status",
    ];
    const values = rows.map((r) => [
      r.hop,
      r.system,
      r.table,
      r.attribute,
      r.recordKey,
      r.inputValue,
      r.transformation,
      r.valuesUsed,
      r.outputValue,
      r.consumedBy,
      r.status,
    ]);
    const csv = [headers, ...values]
      .map((row) =>
        row.map((v) => `"${String(v).replaceAll('"', '""')}"`).join(","),
      )
      .join("\r\n");
    const link = document.createElement("a");
    link.href = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8;" }),
    );
    link.download = "data-lineage.csv";
    link.click();
    URL.revokeObjectURL(link.href);
  };
  return (
    <main className="min-h-screen bg-[#f4f8fd] text-slate-800">
      <DataLineageHeader />
      <div className="mx-auto max-w-[1900px] space-y-3 px-4 py-4 sm:px-6 lg:px-7">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            aria-label="Back"
            className="rounded-lg p-1.5 text-[#123866] hover:bg-blue-100"
          >
            <ArrowLeft size={19} />
          </button>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-[#102d55]">
              Data Lineage Details
            </h1>
            <p className="mt-0.5 text-xs text-slate-500">
              Trace a specific value to its source records
            </p>
          </div>
        </div>
        <SelectedDatapointCard onExport={exportCsv} />
        <LineageDetailsTable rows={rows}>
          {disconnected && (
            <NextSourceIdentification
              row={disconnected}
              onIdentify={(system) =>
                setNotice(
                  `Source identification requested for ${system}. Connect this button to your datasource discovery API.`,
                )
              }
            />
          )}
        </LineageDetailsTable>
        {notice && (
          <div
            role="status"
            className="flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800"
          >
            {notice}
            <button
              onClick={() => setNotice("")}
              className="font-semibold underline"
            >
              Dismiss
            </button>
          </div>
        )}
        <ValueReconciliation />
      </div>
    </main>
  );
}
