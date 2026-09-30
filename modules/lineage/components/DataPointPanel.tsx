import { ChevronDown } from "lucide-react";

const columns = ["0010", "0040", "0200", "0220"];

const rows = [
  { row: "0010", item: "Total exposures", values: ["1,265.4", "1,243.8", "1,240.5", "1,118.9"], selected: 2 },
  { row: "0040", item: "On-balance sheet", values: ["1,061.9", "1,042.0", "1,041.4", "962.0"], selected: -1 },
  { row: "0050", item: "Off-balance sheet", values: ["203.5", "201.8", "199.1", "156.9"], selected: -1 },
];

export function DataPointPanel() {
  return (
    <section className="panel flex flex-col p-5">
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-xs font-bold text-ink">
          <span className="mr-2 text-slate-400">2.</span>
          Data point
        </h2>
        <div className="relative">
          <select className="field field-compact h-9 w-auto appearance-none pr-8 font-semibold">
            <option>C 07.00 · Credit risk SA · Corporates</option>
            <option>C 01.00 · CET1 capital</option>
            <option>C 02.00 · Total risk exposure</option>
            <option>C 03.00 · CET1 ratio</option>
          </select>
          <ChevronDown
            size={14}
            className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400"
          />
        </div>
      </div>

      {/* Data table */}
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[420px] border-collapse text-[11px]">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="px-2 py-2 text-left text-[9px] font-bold uppercase tracking-wider text-slate-500">
                Row
              </th>
              <th className="px-2 py-2 text-left text-[9px] font-bold uppercase tracking-wider text-slate-500">
                Item
              </th>
              {columns.map((col) => (
                <th
                  key={col}
                  className="px-2 py-2 text-right text-[9px] font-bold uppercase tracking-wider text-slate-500"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.row} className="border-b border-slate-100 last:border-0">
                <td className="px-2 py-2.5 font-mono text-[10px] font-semibold text-slate-600">
                  {r.row}
                </td>
                <td className="px-2 py-2.5 font-medium text-ink">{r.item}</td>
                {r.values.map((val, i) => (
                  <td
                    key={i}
                    className={`px-2 py-2.5 text-right font-mono text-[10px] ${
                      i === r.selected
                        ? "bg-blue/10 font-bold text-blue ring-1 ring-inset ring-blue/30"
                        : "text-slate-700"
                    }`}
                  >
                    {val}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Selected cell detail */}
      <div className="mt-4 rounded-lg bg-slate-50 px-3 py-2.5">
        <p className="text-[11px] font-bold text-ink">
          Corporates · Total exposures · Exposure value
        </p>
        <p className="mt-0.5 font-mono text-[10px] text-slate-500">
          C 07.00 · r0010 · c0200 · 1,240.5 EUR m
        </p>
      </div>
    </section>
  );
}