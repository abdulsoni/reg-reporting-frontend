import Link from "next/link";
import {
  FileText,
  ArrowLeft,
  ChartNoAxesCombined,
  Download,
} from "lucide-react";
import type { DataTraceResponse } from "../../types/dataTrace";
import { formatTraceValue } from "../../utils/dataTraceMapper";

type Props = {
  trace: DataTraceResponse;
  reportFile?: string;
  onExport: () => void;
};

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
    <section className="panel p-4">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
        <div className="flex min-w-[220px] items-center gap-3 xl:border-r xl:border-slate-200 xl:pr-3">
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
              <p className="mt-0.5 truncate font-mono text-[10px] text-slate-400">
                {reportFile}
              </p>
            )}
          </div>
        </div>

        <div className="xl:min-w-[105px] xl:border-r xl:border-slate-200 xl:pr-3">
          <p className="text-[10px] text-slate-500">Reporting date</p>

          <p className="mt-1 text-xs font-semibold text-ink">
            {header.date ?? "—"}
          </p>
        </div>

        <div className="min-w-0 flex-1">
          <p className="mb-1.5 text-xs font-bold text-ink">
            {header.datapoint}
          </p>

          <div className="grid grid-cols-2 gap-x-3 gap-y-2 sm:grid-cols-4 xl:grid-cols-8">
            {details.map(([label, value]) => (
              <div
                key={label}
                className="min-w-0 border-l border-slate-200 pl-2"
              >
                <p className="text-[10px] text-slate-500">{label}</p>

                <p
                  className="mt-1 truncate text-[11px] font-semibold text-ink"
                  title={value}
                >
                  {value}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 xl:shrink-0">
          <Link
            href="/lineage"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-[10px] font-semibold text-ink hover:bg-slate-50"
          >
            <ArrowLeft size={13} />
            Back to select datapoint
          </Link>

          <Link
            href={`/lineage/evidence?${new URLSearchParams({
              report_name: trace.report_name,
              datapoint_id: trace.datapoint_id,
            }).toString()}`}
            className="inline-flex items-center gap-1.5 rounded-lg bg-navy px-2.5 py-2 text-[10px] font-semibold text-white hover:bg-[#173c5f]"
          >
            <ChartNoAxesCombined size={13} />
            View lineage graph
          </Link>

          <button
            type="button"
            onClick={onExport}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-[10px] font-semibold text-ink hover:bg-slate-50"
          >
            <Download size={13} />
            Export lineage
          </button>
        </div>
      </div>
    </section>
  );
}
