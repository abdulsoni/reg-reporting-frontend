"use client";

import { useState } from "react";
import { Clock3, Search, CheckCircle2, Database } from "lucide-react";
import type { LineageRecord } from "./types";

type Props = {
  record: LineageRecord | undefined;
  onIdentify: (system: string) => void;
};

export default function NextSourceIdentification({ record, onIdentify }: Props) {
  const [identifying, setIdentifying] = useState(false);

  if (!record || record.connected) {
    return (
      <section className="flex flex-col gap-3 rounded-xl border border-emerald-100 bg-emerald-50/50 p-4 md:flex-row md:items-center">
        <CheckCircle2 className="shrink-0 text-emerald-600" size={24} />
        <div>
          <h3 className="text-sm font-bold text-emerald-800">Source identification</h3>
          <p className="mt-1 text-xs text-emerald-700">All currently listed systems are connected. Review the lineage evidence and verify any unresolved transformations.</p>
        </div>
      </section>
    );
  }

  const handleIdentify = () => {
    setIdentifying(true);
    onIdentify(record.system);
  };

  return (
    <section className="rounded-xl border border-blue-100 bg-blue-50/50 p-4">
      <div className="grid gap-4 lg:grid-cols-[minmax(240px,1.6fr)_1fr_1.2fr_1fr_auto] lg:items-center">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700"><Clock3 size={19} /></div>
          <div>
            <h3 className="text-sm font-bold text-blue-800">Next source identification</h3>
            <p className="mt-1 text-xs leading-5 text-slate-600">{record.system} is not currently connected. Identify its source to continue the reverse trace.</p>
          </div>
        </div>
        <div className="border-l border-blue-100 pl-3">
          <div className="text-[11px] text-slate-500">Source system</div>
          <div className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-slate-800"><Database size={13} />{record.system}</div>
        </div>
        <div className="border-l border-blue-100 pl-3">
          <div className="text-[11px] text-slate-500">Last known table / attribute</div>
          <div className="mt-1 text-xs font-semibold text-slate-800">{record.table} / {record.attribute}</div>
        </div>
        <div className="border-l border-blue-100 pl-3">
          <div className="text-[11px] text-slate-500">Connection status</div>
          <span className="mt-1 inline-flex rounded-full bg-amber-100 px-2 py-1 text-[10px] font-semibold text-amber-800">Discovering</span>
        </div>
        <button
          onClick={handleIdentify}
          disabled={identifying}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-wait disabled:opacity-70"
        >
          <Search size={15} /> {identifying ? "Opening..." : "Identify source"}
        </button>
      </div>
    </section>
  );
}
