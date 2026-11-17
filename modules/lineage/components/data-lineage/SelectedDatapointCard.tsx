import Link from "next/link";
import {
  FileText,
  GitBranch,
  ChartNoAxesCombined,
  Table2,
} from "lucide-react";
import type { DataTraceResponse } from "../../types/dataTrace";
import { formatTraceValue } from "../../utils/dataTraceMapper";

/*
 * Inline so a global `button`/`a` font-size rule can't make the actions
 * render larger than the rest of the card.
 */
const actionStyle = {
  fontSize: 11,
  lineHeight: 1,
  fontFamily: "inherit",
  /*
   * `app/globals.css` sets `button { font: inherit }` outside any cascade
   * layer, which beats Tailwind's `font-semibold` on buttons. Inline weight
   * keeps buttons as bold as the links next to them.
   */
  fontWeight: 600,
} as const;

type Props = {
  trace: DataTraceResponse;
  reportFile?: string;
  showGraph?: boolean;
  showSystemDetails?: boolean;
  onShowGraph?: () => void;
  onShowTable?: () => void;
  onShowSystemDetails?: () => void;
};

const actionBase =
  "inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 text-[11px] font-semibold leading-none transition";

const actionActive = `${actionBase} bg-navy text-white hover:bg-[#173c5f]`;

const actionIdle = `${actionBase} border border-slate-300 bg-white text-ink hover:bg-slate-50`;

export default function SelectedDatapointCard({
  trace,
  reportFile,
  showGraph = false,
  showSystemDetails = false,
  onShowGraph,
  onShowTable,
  onShowSystemDetails,
}: Props) {
  const header = trace.header;

  const dataActive = !showGraph && !showSystemDetails;

  const params = new URLSearchParams({
    report_name: trace.report_name,
    datapoint_id: trace.datapoint_id,
  });

  const dataLineageHref = `/lineage/data-lineage?${params.toString()}`;

  const details: Array<[string, string]> = [
    ["Attribute", trace.attribute],
    // ["Row key", header.row_key ?? "—"],
    // ["Row", formatTraceValue(header.row)],
    // ["Column", header.column],
    ["Value", formatTraceValue(header.value)],
    // ["Unit", header.unit ?? "—"],
    // ["Page", formatTraceValue(header.page)],
    // ["Section", header.section ?? "—"],
  ];

  return (
    <section className="panel p-4 lg:p-5">
      {/* Row 1: report identity + view actions. Wraps instead of squeezing. */}
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
          {/* Same page, so the active state follows the panel content. */}
          <Link
            href={dataLineageHref}
            aria-current={dataActive ? "page" : undefined}
            className={dataActive ? actionActive : actionIdle}
            style={actionStyle}
            onClick={() => {
              if (showGraph || showSystemDetails) onShowTable?.();
            }}
          >
            <GitBranch size={13} />
            View Data Lineage
          </Link>

          <button
            type="button"
            onClick={onShowGraph}
            aria-pressed={showGraph}
            className={showGraph ? actionActive : actionIdle}
            style={actionStyle}
          >
            <ChartNoAxesCombined size={13} />
            View Lineage Graph
          </button>

          <button
            type="button"
            onClick={onShowSystemDetails}
            aria-pressed={showSystemDetails}
            className={showSystemDetails ? actionActive : actionIdle}
            style={actionStyle}
          >
            <Table2 size={13} />
            View System Details
          </button>
        </div>
      </div>

      {/* Row 2: datapoint details. */}
      <div className="mt-4">
        <p className="mb-2 text-xs font-bold text-ink">{header.datapoint}</p>

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