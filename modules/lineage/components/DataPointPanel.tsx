"use client";

import {
  ChevronDown,
} from "lucide-react";
import { useReports } from "../context/ReportContext";


export function DataPointPanel() {

  const {
    reports,

    selectedReportId,

    selectedReport,

    setSelectedReportId,
  } = useReports();


  /*
   * The API can potentially return
   * multiple tables.
   *
   * For the first version, display
   * the first extracted table.
   */

  const table =
    selectedReport?.tables?.[0];


  const headers =
    table?.rows?.[0] ?? [];


  const dataRows =
    table?.rows?.slice(1) ?? [];


  return (

    <section className="panel flex flex-col p-5">

      <div className="flex items-start justify-between gap-3">

        <h2 className="text-xs font-bold text-ink">

          <span className="mr-2 text-slate-400">
            2.
          </span>

          Data point

        </h2>


        {/* Report selector */}

        <div className="relative">

          <select
            value={
              selectedReportId ?? ""
            }
            onChange={(event) =>
              setSelectedReportId(
                event.target.value
              )
            }
            disabled={
              reports.length === 0
            }
            className="field field-compact h-9 w-auto min-w-[260px] appearance-none pr-8 font-semibold"
          >

            {reports.length === 0 ? (

              <option value="">
                No reports uploaded
              </option>

            ) : (

              reports.map(
                (report) => (

                  <option
                    key={report.id}
                    value={report.id}
                  >

                    {report.regulatoryReturn}
                    {" · "}
                    {report.fileName}

                  </option>

                )
              )

            )}

          </select>


          <ChevronDown
            size={14}
            className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400"
          />

        </div>

      </div>


      {/* Data table */}

      {table &&
        headers.length > 0 ? (

        <div className="mt-4 overflow-x-auto">

          <table className="w-full min-w-[420px] border-collapse text-[11px]">

            <thead>

              <tr className="border-b border-slate-200 bg-slate-50">

                {headers.map(
                  (header, index) => (

                    <th
                      key={`${header}-${index}`}
                      className={`px-2 py-2 text-[9px] font-bold uppercase tracking-wider text-slate-500 ${index === 0
                          ? "text-left"
                          : "text-right"
                        }`}
                    >

                      {header}

                    </th>

                  )
                )}

              </tr>

            </thead>


            <tbody>

              {dataRows.map(
                (row, rowIndex) => (

                  <tr
                    key={rowIndex}
                    className="border-b border-slate-100 last:border-0"
                  >

                    {headers.map(
                      (_, columnIndex) => {

                        const value =
                          row[columnIndex] ??
                          "";

                        return (

                          <td
                            key={columnIndex}
                            className={`px-2 py-2.5 font-mono text-[10px] ${columnIndex === 0
                                ? "text-left font-semibold text-slate-600"
                                : "text-right text-slate-700"
                              }`}
                          >

                            {value}

                          </td>

                        );

                      }
                    )}

                  </tr>

                )
              )}

            </tbody>

          </table>

        </div>

      ) : (

        <div className="mt-4 rounded-lg bg-slate-50 px-3 py-8 text-center text-[11px] text-slate-500">

          No extracted table data
          available for this report.

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