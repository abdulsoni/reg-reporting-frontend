"use client";
import { Database, CheckCircle2, Clock3, CircleAlert } from "lucide-react";
import type { ReactNode } from "react";
import type { LineageRow } from "./types";

function Status({ value }: { value: LineageRow["status"] }) {
  const style = value === "Verified" ? "bg-emerald-50 text-emerald-700 border-emerald-100" : value === "Discovering" ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-rose-50 text-rose-700 border-rose-100";
  const Icon = value === "Verified" ? CheckCircle2 : value === "Discovering" ? Clock3 : CircleAlert;
  return <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-semibold ${style}`}><Icon size={13}/>{value}</span>;
}

export default function LineageDetailsTable({ rows, children }: { rows: LineageRow[]; children?: ReactNode }) {
  return <section className="overflow-hidden rounded-xl border border-blue-100 bg-white shadow-sm">
    <div className="flex items-center gap-3 px-3 py-2.5"><Database className="text-blue-600" size={22}/><h2 className="text-sm font-bold text-[#102d55]">System Lineage Details</h2></div>
    <div className="overflow-x-auto px-1.5"><table className="w-full min-w-[1180px] border-collapse text-left">
      <thead><tr className="bg-blue-50/80 text-[10px] font-semibold text-[#173b70]">{["Hop", "System", "Table", "Attribute", "Record / Join Key", "Input Value(s)", "Transformation", "Values Used", "Output Value", "Consumed By", "Status"].map(x => <th key={x} className="border border-blue-100 px-2 py-2.5">{x}</th>)}</tr></thead>
      <tbody>{rows.map(row => <tr key={row.hop} className="align-middle text-[11px] transition hover:bg-blue-50/50">
        <td className="border border-blue-100 px-2 py-3 font-bold text-slate-800">{row.hop}</td>
        <td className="border border-blue-100 px-2 py-2.5"><div className="flex min-w-[140px] items-center gap-2"><Database size={22} className={row.system === "AUDIT.DB" ? "text-orange-500" : row.system === "SENSI.DB" ? "text-violet-600" : "text-blue-500"}/><div><div className="font-semibold text-slate-900">{row.system}</div><div className="mt-0.5 text-[10px] text-slate-500">{row.systemLabel}</div></div></div></td>
        <td className="border border-blue-100 px-2 py-3 font-medium">{row.table}</td><td className="border border-blue-100 px-2 py-3">{row.attribute}</td><td className="border border-blue-100 px-2 py-3 font-mono text-[10px]">{row.recordKey}</td><td className="border border-blue-100 px-2 py-3 font-semibold tabular-nums">{row.inputValue}</td>
        <td className="border border-blue-100 px-2 py-3"><div className="min-w-[160px] whitespace-pre-wrap font-mono text-[10px] leading-4 text-slate-800">{row.transformation}</div></td><td className="border border-blue-100 px-2 py-3"><div className="min-w-[72px] whitespace-pre-wrap rounded-lg border border-blue-100 bg-blue-50 px-2 py-1 text-center font-semibold tabular-nums text-slate-800">{row.valuesUsed}</div></td><td className="border border-blue-100 px-2 py-3 font-bold tabular-nums">{row.outputValue}</td><td className="border border-blue-100 px-2 py-3 whitespace-pre-wrap">{row.consumedBy}</td><td className="border border-blue-100 px-2 py-3"><Status value={row.status}/></td>
      </tr>)}</tbody>
    </table></div>
    {children}
  </section>;
}
