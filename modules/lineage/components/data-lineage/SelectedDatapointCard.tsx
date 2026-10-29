import { FileText, ArrowLeft, ChartNoAxesCombined, Download } from "lucide-react";
import type { SelectedDatapoint } from "./types";

type Props = {
  datapoint: SelectedDatapoint;
  onBack: () => void;
  onViewGraph: () => void;
  onExport: () => void;
};

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 border-l border-blue-100 pl-3">
      <div className="mb-1 text-[11px] font-medium text-slate-500">{label}</div>
      <div className="truncate text-xs font-semibold text-slate-800" title={value}>{value}</div>
    </div>
  );
}

export default function SelectedDatapointCard({ datapoint, onBack, onViewGraph, onExport }: Props) {
  return (
    <section className="rounded-xl border border-blue-100 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center">
        <div className="flex min-w-[245px] items-center gap-3 xl:w-[270px]">
          <div className="flex h-10 w-9 shrink-0 items-center justify-center rounded-md bg-red-50 text-red-600">
            <FileText size={22} />
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-bold text-slate-900">{datapoint.reportName}</div>
            <div className="mt-1 text-xs text-slate-500">{datapoint.entity}</div>
            <div className="mt-1 truncate text-[11px] text-slate-400">{datapoint.reportFile}</div>
          </div>
        </div>

        <div className="xl:w-[130px]">
          <div className="mb-1 text-[11px] text-slate-500">Reporting date</div>
          <div className="text-xs font-semibold text-slate-800">{datapoint.reportingDate}</div>
        </div>

        <div className="grid flex-1 grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4 xl:grid-cols-7">
          <Detail label="Attribute" value={datapoint.attribute} />
          <Detail label="Row" value={datapoint.row} />
          <Detail label="Column" value={datapoint.column} />
          <Detail label="Value" value={datapoint.value} />
          <Detail label="Unit" value={datapoint.unit} />
          <Detail label="Page" value={datapoint.page} />
          <Detail label="Section" value={datapoint.section} />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-3">
        <button onClick={onBack} className="inline-flex items-center gap-2 rounded-lg border border-blue-200 px-3 py-2 text-xs font-semibold text-blue-700 transition hover:bg-blue-50">
          <ArrowLeft size={14} /> Back to select datapoint
        </button>
        <button onClick={onViewGraph} className="inline-flex items-center gap-2 rounded-lg border border-blue-200 px-3 py-2 text-xs font-semibold text-blue-700 transition hover:bg-blue-50">
          <ChartNoAxesCombined size={14} /> View lineage graph
        </button>
        <button onClick={onExport} className="inline-flex items-center gap-2 rounded-lg border border-blue-200 px-3 py-2 text-xs font-semibold text-blue-700 transition hover:bg-blue-50">
          <Download size={14} /> Export lineage
        </button>
      </div>
    </section>
  );
}
