import Link from "next/link";
import { FileText, ArrowLeft, ChartNoAxesCombined, Download } from "lucide-react";

const details = [
  ["Attribute", "on_balance"], ["Row", "0040"], ["Column", "0200"], ["Value", "600.00"],
  ["Unit", "EUR m"], ["Page", "4"], ["Section", "Capital adequacy"],
];

export default function SelectedDatapointCard({ onExport }: { onExport: () => void }) {
  return <section className="rounded-xl border border-blue-100 bg-white p-4 shadow-sm">
    <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
      <div className="flex min-w-[220px] items-center gap-3 xl:border-r xl:border-blue-100 xl:pr-3">
        <div className="flex h-10 w-9 shrink-0 items-center justify-center rounded-md bg-red-500 text-white"><FileText size={22} /></div>
        <div><h2 className="text-xs font-bold text-slate-900">COREP C90 Regulatory Report</h2><p className="mt-1 text-xs text-slate-600">J P Morgan Bank</p></div>
      </div>
      <div className="xl:min-w-[105px] xl:border-r xl:border-blue-100 xl:pr-3"><p className="text-[10px] text-slate-500">Reporting date</p><p className="mt-1 text-xs font-semibold text-slate-800">30 Jun 2026</p></div>
      <div className="min-w-0 flex-1"><p className="mb-1.5 text-xs font-bold text-slate-800">Selected datapoint</p><div className="grid grid-cols-2 gap-x-3 gap-y-2 sm:grid-cols-4 xl:grid-cols-7">{details.map(([label, value]) => <div key={label} className="min-w-0 border-l border-blue-100 pl-2"><p className="text-[10px] text-slate-500">{label}</p><p className="mt-1 truncate text-[11px] font-semibold text-slate-900" title={value}>{value}</p></div>)}</div></div>
      <div className="flex flex-wrap gap-2 xl:shrink-0">
        <Link href="/lineage" className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 px-2.5 py-2 text-[10px] font-semibold text-blue-700 hover:bg-blue-50"><ArrowLeft size={13}/>Back to select datapoint</Link>
        <Link href="/lineage/explorer" className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 px-2.5 py-2 text-[10px] font-semibold text-blue-700 hover:bg-blue-50"><ChartNoAxesCombined size={13}/>View lineage graph</Link>
        <button onClick={onExport} className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 px-2.5 py-2 text-[10px] font-semibold text-blue-700 hover:bg-blue-50"><Download size={13}/>Export lineage</button>
      </div>
    </div>
  </section>;
}
