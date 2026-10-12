"use client";

import { ChevronDown, Pencil, RotateCcw } from "lucide-react";
import { useState } from "react";

import { useReports } from "../context/ReportContext";
import { useLineage } from "../context/LineageContext";
import {
  findDatapointForRow,
  parseNumericValue,
  resolveTableLayout,
} from "../utils/datapoints";
import type { Datapoint } from "../types/report";

/* Only used when a report stored figures but no extracted table grid. */
const DATAPOINT_COLUMNS = ["Row", "Column", "Metric", "Reported value"] as const;

export function DataPointPanel() {
  const { reports, selectedReportId, selectedReport, setSelectedReportId } =
    useReports();

  const { selectedDatapoint, selectDatapoint } = useLineage();

  const [draft, setDraft] = useState<Datapoint | null>(null);
  const [editing, setEditing] = useState(false);

  /*
   * One row per reported figure, as extracted and stored by the API. The
   * coordinates are the report's own row/column codes, not cell indexes, so a
   * selection identifies the same figure the lineage tracer resolves.
   */
  const datapoints = selectedReport?.datapoints ?? [];

  /*
   * The table shown is the selected report's own extracted grid, so its column
   * labels come from the report data rather than a fixed set. Reports stored
   * before tables were captured fall back to the derived datapoint list below.
   */
  const layouts = (selectedReport?.tables ?? []).map(resolveTableLayout);

  const isSelected = (id: string) => selectedDatapoint?.id === id;

  const handleSelect = (datapoint: Datapoint) => {
    selectDatapoint(datapoint);
    setDraft(null);
    setEditing(false);
  };

  const handleEdit = () => {
    if (!selectedDatapoint) return;

    setDraft(selectedDatapoint);
    setEditing(true);
  };

  const handleSave = () => {
    if (!draft) return;

    selectDatapoint({
      ...draft,
      numericValue: parseNumericValue(draft.value),
    });

    setEditing(false);
  };

  const handleCancel = () => {
    setDraft(null);
    setEditing(false);
  };

  return (
    <section className="panel flex flex-col p-5">
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-xs font-bold text-ink">
          <span className="mr-2 text-slate-400">2.</span>
          Data point
        </h2>

        {/* Report selector */}
        <div className="relative">
          <select
            value={selectedReportId ?? ""}
            onChange={(event) => {
              setSelectedReportId(event.target.value);
              selectDatapoint(null);
              handleCancel();
            }}
            disabled={reports.length === 0}
            className="field field-compact h-9 w-auto min-w-[260px] appearance-none pr-8 font-semibold"
          >
            {reports.length === 0 ? (
              <option value="">No reports uploaded</option>
            ) : (
              reports.map((report) => (
                <option key={report.id} value={report.id}>
                  {report.regulatoryReturn} · {report.fileName}
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
      {layouts.length > 0 ? (
        <div className="mt-4 space-y-3 overflow-x-auto">
          {layouts.map((layout, tableIndex) => (
            <table
              key={tableIndex}
              className="w-full min-w-[420px] border-collapse text-[11px]"
            >
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  {layout.headers.map((header, index) => (
                    <th
                      key={`${header}-${index}`}
                      className={`px-2 py-2 text-[9px] font-bold uppercase tracking-wider text-slate-500 ${
                        index === layout.headers.length - 1
                          ? "text-right"
                          : "text-left"
                      }`}
                    >
                      {header || "—"}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {layout.bodyRows.map((row, rowIndex) => {
                  const datapoint = findDatapointForRow(
                    row,
                    layout.headers,
                    datapoints
                  );

                  const active = datapoint ? isSelected(datapoint.id) : false;

                  return (
                    <tr
                      key={rowIndex}
                      onClick={
                        datapoint ? () => handleSelect(datapoint) : undefined
                      }
                      aria-selected={active}
                      className={`border-b border-slate-100 last:border-0 ${
                        active ? "bg-navy" : "hover:bg-slate-50"
                      } ${datapoint ? "cursor-pointer" : ""}`}
                    >
                      {row.map((cell, cellIndex) => (
                        <td
                          key={cellIndex}
                          className={`px-2 py-2.5 font-mono text-[10px] ${
                            cellIndex === row.length - 1
                              ? "text-right"
                              : "text-left"
                          } ${active ? "font-bold text-white" : "text-slate-700"}`}
                        >
                          {cell || "—"}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ))}
        </div>
      ) : datapoints.length > 0 ? (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[420px] border-collapse text-[11px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                {DATAPOINT_COLUMNS.map((column, index) => (
                  <th
                    key={column}
                    className={`px-2 py-2 text-[9px] font-bold uppercase tracking-wider text-slate-500 ${
                      index === DATAPOINT_COLUMNS.length - 1
                        ? "text-right"
                        : "text-left"
                    }`}
                  >
                    {column}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {datapoints.map((datapoint) => {
                const active = isSelected(datapoint.id);

                return (
                  <tr
                    key={datapoint.id}
                    className={`border-b border-slate-100 last:border-0 ${
                      active ? "bg-navy" : "hover:bg-slate-50"
                    }`}
                  >
                    <td
                      className={`px-2 py-2.5 text-left font-mono text-[10px] font-semibold ${
                        active ? "text-white" : "text-slate-600"
                      }`}
                    >
                      {datapoint.rowCode || "—"}
                    </td>

                    <td
                      className={`px-2 py-2.5 text-left font-mono text-[10px] ${
                        active ? "text-white" : "text-slate-600"
                      }`}
                    >
                      {datapoint.columnCode || "—"}
                    </td>

                    <td
                      className={`px-2 py-2.5 text-left font-mono text-[10px] ${
                        active ? "text-white" : "text-slate-700"
                      }`}
                    >
                      {datapoint.attribute || "—"}
                    </td>

                    <td className="p-0">
                      <button
                        type="button"
                        onClick={() => handleSelect(datapoint)}
                        aria-pressed={active}
                        className={`w-full px-2 py-2.5 text-right font-mono text-[10px] transition ${
                          active
                            ? "font-bold text-white"
                            : "text-slate-700 hover:bg-slate-100"
                        }`}
                      >
                        {datapoint.value || "—"}

                        {datapoint.unit && (
                          <span
                            className={`ml-1 text-[9px] ${
                              active ? "text-slate-200" : "text-slate-400"
                            }`}
                          >
                            {datapoint.unit}
                          </span>
                        )}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="mt-4 rounded-lg bg-slate-50 px-3 py-8 text-center text-[11px] text-slate-500">
          No data points were extracted from this report.
        </div>
      )}

      {/* Selection summary / editable correction */}
      {/* {selectedDatapoint && !editing && (
        <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[11px] font-bold text-ink">
                {selectedDatapoint.rowCode}
                <span className="text-slate-400"> / </span>
                {selectedDatapoint.columnCode}
                <span className="text-slate-400"> · </span>
                {selectedDatapoint.attribute}
              </p>

              <p className="mt-0.5 font-mono text-[10px] text-slate-500">
                {selectedDatapoint.value}
                {selectedDatapoint.numericValue !== null && (
                  <span className="ml-2 text-slate-400">
                    parsed:{" "}
                    {selectedDatapoint.numericValue.toLocaleString("en-GB")}
                  </span>
                )}
              </p>
            </div>

            <button
              type="button"
              onClick={handleEdit}
              className="flex shrink-0 items-center gap-1 rounded-md border border-slate-300 bg-white px-2 py-1 text-[10px] font-semibold text-slate-600 hover:bg-slate-100"
            >
              <Pencil size={11} />
              Correct
            </button>
          </div>
        </div>
      )} */}

      {editing && draft && (
        <div className="mt-4 rounded-lg border border-amber-300 bg-amber-50 px-3 py-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-amber-800">
            Correct parsed data point
          </p>

          <div className="mt-2 grid grid-cols-2 gap-2">
            <label>
              <span className="label">Row code</span>
              <input
                type="text"
                className="field field-compact"
                value={draft.rowCode}
                onChange={(event) =>
                  setDraft({ ...draft, rowCode: event.target.value })
                }
              />
            </label>

            <label>
              <span className="label">Column code</span>
              <input
                type="text"
                className="field field-compact"
                value={draft.columnCode}
                onChange={(event) =>
                  setDraft({ ...draft, columnCode: event.target.value })
                }
              />
            </label>

            <label className="col-span-2">
              <span className="label">Attribute</span>
              <input
                type="text"
                className="field field-compact"
                value={draft.attribute}
                onChange={(event) =>
                  setDraft({ ...draft, attribute: event.target.value })
                }
              />
            </label>

            <label className="col-span-2">
              <span className="label">Value</span>
              <input
                type="text"
                className="field field-compact font-mono"
                value={draft.value}
                onChange={(event) =>
                  setDraft({ ...draft, value: event.target.value })
                }
              />
            </label>
          </div>

          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={handleSave}
              className="btn-primary flex-1 py-1.5 text-[11px]"
            >
              Save
            </button>

            <button
              type="button"
              onClick={handleCancel}
              className="flex items-center justify-center gap-1 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-600 hover:bg-slate-100"
            >
              <RotateCcw size={11} />
              Cancel
            </button>
          </div>
        </div>
      )}

      {!selectedDatapoint && datapoints.length > 0 && (
        <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-[10px] font-medium text-amber-700">
          Select a figure from the table above to continue.
        </p>
      )}

      {/* Selected report detail */}
      {selectedReport && (
        <div className="mt-4 rounded-lg bg-slate-50 px-3 py-2.5">
          <p className="text-[11px] font-bold text-ink">
            {selectedReport.regulatoryReturn}
          </p>

          <p className="mt-0.5 font-mono text-[10px] text-slate-500">
            {selectedReport.fileName} ·{" "}
            {selectedReport.reportingReferenceDate}
          </p>
        </div>
      )}
    </section>
  );
}