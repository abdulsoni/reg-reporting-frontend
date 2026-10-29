"use client";
import { useState } from "react";
import { Search } from "lucide-react";
import type { LineageRow } from "./types";

export default function NextSourceIdentification({ row, onIdentify }: { row?: LineageRow; onIdentify: (system: string) => void }) {
  const [busy, setBusy] = useState(false);
  if (!row) return null;
  return <div className="mx-2 mb-2 border-t border-blue-100 bg-blue-50/70 px-3 py-3"><div className="grid gap-3 lg:grid-cols-[minmax(280px,1.7fr)_0.75fr_1.25fr_1fr_0.8fr_auto] lg:items-center">
    <div className="flex items-center gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600"><Search size={20}/></span><div><h3 className="text-xs font-bold text-[#123866]">Next source identification</h3><p className="mt-1 text-[10px] leading-4 text-slate-600">{row.system} is not fully connected. Please identify the source to complete the lineage.</p></div></div>
    <div className="border-l border-blue-200 pl-3"><p className="text-[10px] text-slate-500">Source system</p><p className="mt-1 text-[11px] font-semibold">{row.system}</p></div>
    <div className="border-l border-blue-200 pl-3"><p className="text-[10px] text-slate-500">Last known table / attribute</p><p className="mt-1 text-[11px] font-semibold">{row.table} / {row.attribute}</p></div>
    <div className="border-l border-blue-200 pl-3"><p className="text-[10px] text-slate-500">Join key</p><p className="mt-1 text-[11px] font-mono font-semibold">trade_id = TRD-00981</p></div>
    <div className="border-l border-blue-200 pl-3"><p className="text-[10px] text-slate-500">Connection status</p><span className="mt-1 inline-block rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-[10px] text-amber-700">Discovering</span></div>
    <button disabled={busy} onClick={() => { setBusy(true); onIdentify(row.system); }} className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-3 py-2.5 text-[11px] font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-70"><Search size={14}/>{busy ? "Requested" : "Identify source"}</button>
  </div></div>;
}
