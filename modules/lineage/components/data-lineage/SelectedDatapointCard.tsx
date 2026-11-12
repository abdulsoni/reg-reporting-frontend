import Link from "next/link";
import {
  FileText,
  ArrowLeft,
  ChartNoAxesCombined,
  Download,
} from "lucide-react";
import type { DataTraceResponse } from "../../types/dataTrace";
import { formatTraceValue } from "../../utils/dataTraceMapper";

/*
 * Inline so a global `button { font-size }` rule can't make the Export
 * button render larger than the two links.
 */
const actionStyle = {
  fontSize: 11,
  lineHeight: 1,
  fontFamily: "inherit",
} as const;

type Props = {
  trace: DataTraceResponse;
  reportFile?: string;
  onExport: () => void;
};

const actionBase =
  "inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 text-[11px] font-semibold leading-none transition";

export default function SelectedDatapointCard({
  trace,
  reportFile,
  onExport,
}: Props) {
  const header = trace.header;

  const details: Array<[string, string]> = [
    ["Attribute", trace.attribute],
    ["Row key", header.row_key ?? "—"],
    ["Row", formatTraceValue(header.row)],
    ["Column", header.column],
    ["Value", formatTraceValue(header.value)],
    ["Unit", header.unit ?? "—"],
    ["Page", formatTraceValue(header.page)],
    ["Section", header.section ?? "—"],
  ];

  return (
    <section className="panel p-4 lg:p-5">
      {/* Row 1: report identity + actions. Wraps instead of squeezing. */}
      <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-4">
        <div className="flex min-w-0 flex-wrap items-center gap-x-6 gap-y-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-9 shrink-0 items-center justify-center rounded-md bg-red-500 text-white">
            <FileText size={22} />
          </div>

          <div className="min-w-0">
            <h2 className="truncate text-xs font-bold text-ink">
              {header.report}
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              {header.bank ?? "—"}
            </p>

            {reportFile && (
              <p
                className="mt-0.5 max-w-[240px] truncate font-mono text-[10px] text-slate-400"
                title={reportFile}
              >
                {reportFile}
              </p>
            )}
          </div>
        </div>

        <div className="border-slate-200 sm:border-l sm:pl-6">
          <p className="text-[10px] text-slate-500">Reporting date</p>

          <p className="mt-1 whitespace-nowrap text-xs font-semibold text-ink">
            {header.date ?? "—"}
          </p>
        </div>
        </div>

        <div className="ml-auto flex flex-wrap justify-end gap-2">
          <Link
            href="/lineage"
            className={`${actionBase} border border-slate-300 bg-white text-ink hover:bg-slate-50`}
            style={actionStyle}
          >
            <ArrowLeft size={13} />
            Back to select datapoint
          </Link>

          <Link
            href={`/lineage/evidence?${new URLSearchParams({
              report_name: trace.report_name,
              datapoint_id: trace.datapoint_id,
            }).toString()}`}
            className={`${actionBase} bg-navy text-white hover:bg-[#173c5f]`}
            style={actionStyle}
          >
            <ChartNoAxesCombined size={13} />
            View lineage graph
          </Link>

          <button
            type="button"
            onClick={onExport}
            className={`${actionBase} border border-slate-300 bg-white text-ink hover:bg-slate-50`}
            style={actionStyle}
          >
            <Download size={13} />
            Export lineage
          </button>
        </div>
      </div>

      {/* Row 2: datapoint details. Auto-fit columns so values never get cut off. */}
      <div className="mt-4">
        <p className="mb-2 text-xs font-bold text-ink">
          {header.datapoint}
        </p>

        {/* 8 items divide evenly into 2 / 4 / 8 columns, so no orphan rows. */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-4 rounded-lg border border-slate-200 bg-slate-50/60 p-3 sm:grid-cols-4 2xl:grid-cols-8">
          {details.map(([label, value]) => (
            <div key={label} className="min-w-0">
              <p className="text-[10px] text-slate-500">{label}</p>

              <p
                className="mt-1 break-words text-[11px] font-semibold text-ink [overflow-wrap:anywhere]"
                title={value}
              >
                {value}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}