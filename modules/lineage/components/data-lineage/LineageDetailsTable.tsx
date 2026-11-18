"use client";
import {
  Database,
  CheckCircle2,
  Clock3,
  CircleAlert,
  Download,
  Loader2,
} from "lucide-react";
import type { KeyboardEvent, ReactNode } from "react";
import type { LineageRow } from "./types";

function Status({ value }: { value: LineageRow["status"] }) {
  const style =
    value === "Verified"
      ? "bg-emerald-50 text-emerald-700 border-emerald-100"
      : value === "Discovering"
        ? "bg-amber-50 text-amber-800 border-amber-200"
        : "bg-rose-50 text-rose-700 border-rose-100";
  const Icon =
    value === "Verified"
      ? CheckCircle2
      : value === "Discovering"
        ? Clock3
        : CircleAlert;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-semibold ${style}`}
    >
      <Icon size={13} />
      {value}
    </span>
  );
}

/*
 * Inline so a global `button { font-size }` rule can't make the export
 * button render larger than the rest of the header.
 */
const exportStyle = {
  fontSize: 11,
  lineHeight: 1,
  fontFamily: "inherit",
} as const;

type Props = {
  rows: LineageRow[];
  children?: ReactNode;
  selectedHop?: string | null;
  onRowSelect?: (hop: string) => void;
  /** Panel heading shown next to the Export button. */
  title?: string;
  /** When provided, rendered in place of the details table. */
  graphContent?: ReactNode | null;
  onExport?: () => void;
  /** True while the export request is in flight. */
  exporting?: boolean;
  /** Inline message shown when the export fails. */
  exportError?: string | null;
  /** Replaces the default Export button in the header. */
  headerAction?: ReactNode;
};

export default function LineageDetailsTable({
  rows,
  children,
  selectedHop,
  onRowSelect,
  title = "Data Lineage",
  graphContent,
  onExport,
  exporting = false,
  exportError = null,
  headerAction,
}: Props) {
  const handleKeyDown = (
    event: KeyboardEvent<HTMLTableRowElement>,
    hop: string,
  ) => {
    if (!onRowSelect) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onRowSelect(hop);
    }
  };

  return (
    <section className="panel overflow-hidden">
      <div className="flex items-center gap-3 border-b border-slate-200 px-4 py-3">
        <Database className="text-slate-400" size={20} />
        <h2 className="text-xs font-bold text-ink">{title}</h2>
        {headerAction ?? (
          <button
            type="button"
            onClick={onExport}
            disabled={exporting}
            aria-busy={exporting || undefined}
            style={exportStyle}
            className="ml-auto inline-flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border border-slate-300 bg-white px-3 py-2 font-semibold text-ink transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {exporting ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <Download size={13} />
            )}
            {exporting ? "Exporting…" : "Export details"}
          </button>
        )}
      </div>
      {exportError ? (
        <div
          role="alert"
          className="border-b border-rose-100 bg-rose-50 px-4 py-2 text-[11px] font-medium text-rose-700"
        >
          {exportError}
        </div>
      ) : null}
      {graphContent ? (
        <div className="p-4">{graphContent}</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1180px] border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[9px] font-bold uppercase tracking-wider text-slate-500">
                {[
                  "Hop",
                  "System",
                  "Table",
                  "Attribute",
                  // "Record / Join Key",
                  "Input Value(s)",
                  "Transformation",
                  // "Values Used",
                  "Output Value",
                  "Consumed By",
                  "Status",
                ].map((x) => (
                  <th key={x} className="px-3 py-2.5">
                    {x}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const isSelected = selectedHop === row.hop;
                return (
                  <tr
                    key={row.hop}
                    onClick={
                      onRowSelect ? () => onRowSelect(row.hop) : undefined
                    }
                    onKeyDown={
                      onRowSelect
                        ? (event) => handleKeyDown(event, row.hop)
                        : undefined
                    }
                    tabIndex={onRowSelect ? 0 : undefined}
                    role={onRowSelect ? "button" : undefined}
                    aria-selected={onRowSelect ? isSelected : undefined}
                    className={`border-b border-slate-100 align-middle text-[11px] transition last:border-0 ${onRowSelect ? "cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-slate-400" : ""} ${isSelected ? "bg-slate-100 ring-1 ring-inset ring-slate-300" : "hover:bg-slate-50"}`}
                  >
                    <td className="px-3 py-2.5 font-bold text-ink">
                      {row.systemHop}
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex min-w-[140px] items-center gap-2">
                        <Database
                          size={20}
                          className={
                            row.system === "AUDIT.DB"
                              ? "text-orange-500"
                              : row.system === "SENSI.DB"
                                ? "text-violet-600"
                                : "text-slate-400"
                          }
                        />
                        <div>
                          <div className="font-semibold text-ink">
                            {row.system}
                          </div>
                          <div className="mt-0.5 text-[10px] text-slate-500">
                            {row.systemLabel}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 font-medium text-slate-700">
                      {row.table}
                    </td>
                    <td className="px-3 py-2.5 text-slate-700">
                      {row.attribute}
                    </td>
                    {/* <td className="px-3 py-2.5 font-mono text-[10px] text-slate-600">
                      {row.recordKey}
                    </td> */}
                    <td className="px-3 py-2.5 font-semibold tabular-nums text-ink">
                      {row.inputValue}
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="min-w-[160px] whitespace-pre-wrap font-mono text-[10px] leading-4 text-slate-600">
                        {row.transformation}
                      </div>
                    </td>
                    {/* <td className="px-3 py-2.5">
                      <div className="min-w-[72px] whitespace-pre-wrap rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-center font-semibold tabular-nums text-slate-700">
                        {row.valuesUsed}
                      </div>
                    </td> */}
                    <td className="px-3 py-2.5 font-bold tabular-nums text-ink">
                      {row.outputValue}
                    </td>
                    <td className="px-3 py-2.5 whitespace-pre-wrap text-slate-600">
                      {row.consumedBy ? `${row.consumedBy?.system} -> ${row.consumedBy?.table} -> ${row.consumedBy?.attribute}` : 'NA'}
                    </td>
                    <td className="px-3 py-2.5">
                      <Status value={row.status} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {children}
    </section>
  );
}
