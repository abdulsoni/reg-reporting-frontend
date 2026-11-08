"use client";

import { ChevronDown } from "lucide-react";

import { useReports } from "../context/ReportContext";
import type { ReportDatapoint } from "../types/report";

/*
 * The backend stores column names in normalised form
 * ("Normalized USD" becomes "normalized_usd"). The same
 * form is used in the datapoint id, so the table header
 * has to be normalised before it can be matched.
 */
function normalizeHeader(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export function DataPointPanel() {
  const {
    reports,

    selectedReportId,

    selectedReport,

    setSelectedReportId,

    selectedDatapoint,

    setSelectedDatapoint,
  } = useReports();

  /*
   * The API can potentially return multiple tables.
   * For the first version, display the first extracted table.
   */
  const table = selectedReport?.tables?.[0];

  const headers = table?.rows?.[0] ?? [];

  const dataRows = table?.rows?.slice(1) ?? [];

  const datapoints = selectedReport?.datapoints ?? [];

  /*
   * The backend picks the row key column itself. When it is
   * available on the stored datapoints, use the same column;
   * otherwise fall back to the first column.
   */
  const rowKeyColumn = normalizeHeader(
    datapoints[0]?.row_key_column ?? ""
  );

  const detectedRowKeyIndex = rowKeyColumn
    ? headers.findIndex(
        (header) =>
          normalizeHeader(String(header)) === rowKeyColumn
      )
    : -1;

  const rowKeyIndex =
    detectedRowKeyIndex >= 0 ? detectedRowKeyIndex : 0;

  /*
   * Resolve the datapoint represented by one table cell. Using
   * the stored datapoints keeps the selection aligned with the
   * backend even when the displayed table has a different order.
   */
  const resolveDatapoint = (
    row: string[],
    rowIndex: number,
    columnIndex: number
  ): ReportDatapoint | null => {
    const header = String(headers[columnIndex] ?? "");

    const column = normalizeHeader(header);

    if (!column || columnIndex === rowKeyIndex) {
      return null;
    }

    const rowKey = String(row[rowKeyIndex] ?? "").trim();

    const stored =
      datapoints.find(
        (datapoint) =>
          datapoint.row === rowIndex + 1 &&
          datapoint.column === column
      ) ??
      datapoints.find(
        (datapoint) =>
          datapoint.row_key === rowKey &&
          datapoint.column === column
      );

    if (stored) {
      return stored;
    }

    if (!rowKey || !selectedReport) {
      return null;
    }

    /*
     * Older reports were saved before datapoints were kept in
     * localStorage. Build the identifier from the row key and
     * the normalised column.
     */
    return {
      datapoint_id: `${rowKey}.${column}`,
      row_key: rowKey,
      row_key_column: normalizeHeader(
        String(headers[rowKeyIndex] ?? "")
      ),
      row: rowIndex + 1,
      column,
      label: header,
      value: row[columnIndex] ?? null,
      page: table?.page ?? null,
      section: null,
      unit: null,
      report_name: selectedReport.regulatoryReturn,
    };
  };

  /*
   * Select a datapoint cell. Clicking the selected cell again
   * clears the selection.
   */
  const handleCellSelect = (datapoint: ReportDatapoint) => {
    if (
      selectedDatapoint?.datapoint_id ===
      datapoint.datapoint_id
    ) {
      setSelectedDatapoint(null);
      return;
    }

    setSelectedDatapoint(datapoint);
  };

  return (
    <section className="panel flex max-h-96 max-w-xl flex-col p-5">
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-xs font-bold text-ink">
          <span className="mr-2 text-slate-400">2.</span>
          Data point
        </h2>

        {/* Report selector */}
        <div className="relative">
          <select
            value={selectedReportId ?? ""}
            onChange={(event) =>
              setSelectedReportId(event.target.value)
            }
            disabled={reports.length === 0}
            className="field field-compact h-9 w-auto min-w-[260px] appearance-none pr-8 font-semibold"
          >
            {reports.length === 0 ? (
              <option value="">No reports uploaded</option>
            ) : (
              reports.map((report) => (
                <option key={report.id} value={report.id}>
                  {report.regulatoryReturn}
                  {" · "}
                  {report.fileName}
                </option>
              ))
            )}
          </select>

          <ChevronDown
            size={14}
            className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400"
          />
        </div>
      </div>

      {/* Data table */}
      {table && headers.length > 0 ? (
        <>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[420px] border-collapse text-[11px]">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  {headers.map((header, index) => (
                    <th
                      key={`${header}-${index}`}
                      className={`px-2 py-2 text-[9px] font-bold uppercase tracking-wider text-slate-500 ${
                        index === 0 ? "text-left" : "text-right"
                      }`}
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {dataRows.map((row, rowIndex) => (
                  <tr
                    key={rowIndex}
                    className="border-b border-slate-100 last:border-0"
                  >
                    {headers.map((header, columnIndex) => {
                      const value = row[columnIndex] ?? "";

                      const datapoint = resolveDatapoint(
                        row,
                        rowIndex,
                        columnIndex
                      );

                      const isSelected =
                        Boolean(datapoint) &&
                        selectedDatapoint?.datapoint_id ===
                          datapoint?.datapoint_id;

                      return (
                        <td
                          key={columnIndex}
                          onClick={() => {
                            if (datapoint) {
                              handleCellSelect(datapoint);
                            }
                          }}
                          title={
                            datapoint
                              ? `Trace ${datapoint.datapoint_id}`
                              : undefined
                          }
                          className={`px-2 py-2.5 font-mono text-[10px] ${
                            columnIndex === 0
                              ? "text-left font-semibold"
                              : "text-right"
                          } ${
                            datapoint
                              ? "cursor-pointer hover:bg-blue-50"
                              : ""
                          } ${
                            isSelected
                              ? "bg-blue-100 text-blue-700"
                              : "text-slate-700"
                          }`}
                        >
                          {value}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-3 rounded-lg border border-blue-100 bg-blue-50/60 px-3 py-2">
            {selectedDatapoint ? (
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-blue-900">
                    Selected datapoint
                  </p>

                  <p className="mt-0.5 truncate font-mono text-[10px] text-blue-700">
                    {selectedDatapoint.datapoint_id}
                  </p>

                  <p className="mt-0.5 text-[10px] text-slate-500">
                    {selectedDatapoint.label}
                    {" · "}
                    {String(selectedDatapoint.value ?? "—")}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedDatapoint(null)}
                  className="shrink-0 text-[10px] font-semibold text-blue-700 underline"
                >
                  Clear
                </button>
              </div>
            ) : (
              <p className="text-[10px] text-slate-500">
                Select a datapoint cell to trace its data lineage after
                connecting a source system.
              </p>
            )}
          </div>
        </>
      ) : (
        <div className="mt-4 rounded-lg bg-slate-50 px-3 py-8 text-center text-[11px] text-slate-500">
          No extracted table data available for this report.
        </div>
      )}

      {/* Selected report detail */}
      {selectedReport && (
        <div className="mt-4 rounded-lg bg-slate-50 px-3 py-2.5">
          <p className="text-[11px] font-bold text-ink">
            {selectedReport.regulatoryReturn}
          </p>

          <p className="mt-0.5 font-mono text-[10px] text-slate-500">
            {selectedReport.fileName}
            {" · "}
            {selectedReport.reportingReferenceDate}
          </p>
        </div>
      )}
    </section>
  );
}
