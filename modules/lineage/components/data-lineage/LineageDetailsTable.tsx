import { Database, CheckCircle2, Clock3, CircleAlert } from "lucide-react";
import type { LineageRecord } from "./types";

type Props = {
  records: LineageRecord[];
  selectedHop: string | null;
  onSelectHop: (hop: string) => void;
};

function StatusBadge({ status }: { status: LineageRecord["status"] }) {
  const styles = {
    Verified: "border-emerald-100 bg-emerald-50 text-emerald-700",
    Discovering: "border-amber-100 bg-amber-50 text-amber-700",
    Unresolved: "border-rose-100 bg-rose-50 text-rose-700",
  };
  const Icon = status === "Verified" ? CheckCircle2 : status === "Discovering" ? Clock3 : CircleAlert;
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-[11px] font-semibold ${styles[status]}`}>
      <Icon size={13} /> {status}
    </span>
  );
}

export default function LineageDetailsTable({ records, selectedHop, onSelectHop }: Props) {
  return (
    <section className="overflow-hidden rounded-xl border border-blue-100 bg-white shadow-sm">
      <div className="border-b border-blue-100 px-4 py-3">
        <h2 className="text-sm font-bold text-slate-900">Data Lineage Details</h2>
        <p className="mt-1 text-xs text-slate-500">Reverse trace from the selected PDF datapoint to its contributing source records.</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[1180px] border-collapse text-left">
          <thead>
            <tr className="bg-blue-50/70 text-[11px] uppercase tracking-wide text-slate-600">
              {["Hop", "System", "Attribute", "Table", "Transformation", "Sourced from", "Consumed by", "Status"].map((heading) => (
                <th key={heading} className="border-b border-r border-blue-100 px-3 py-3 font-semibold last:border-r-0">{heading}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {records.map((record) => {
              const active = selectedHop === record.hop;
              return (
                <tr
                  key={record.hop}
                  onClick={() => onSelectHop(record.hop)}
                  className={`cursor-pointer text-xs transition hover:bg-blue-50/50 ${active ? "bg-blue-50" : "bg-white"}`}
                >
                  <td className="border-b border-r border-blue-100 px-3 py-4 font-semibold text-slate-800">{record.hop}</td>
                  <td className="border-b border-r border-blue-100 px-3 py-4">
                    <div className="flex items-start gap-2">
                      <Database size={18} className="mt-0.5 shrink-0 text-blue-600" />
                      <div>
                        <div className="font-semibold text-slate-800">{record.system}</div>
                        <span className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${record.connected ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                          {record.connected ? "Connected" : "Not connected"}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="border-b border-r border-blue-100 px-3 py-4 font-medium text-slate-700">{record.attribute}</td>
                  <td className="border-b border-r border-blue-100 px-3 py-4 text-slate-700">{record.table}</td>
                  <td className="max-w-[270px] border-b border-r border-blue-100 px-3 py-4 font-mono text-[11px] leading-5 text-slate-700">{record.transformation}</td>
                  <td className="max-w-[210px] border-b border-r border-blue-100 px-3 py-4 text-slate-600">{record.sourcedFrom}</td>
                  <td className="max-w-[170px] border-b border-r border-blue-100 px-3 py-4 text-slate-600">{record.consumedBy}</td>
                  <td className="border-b border-blue-100 px-3 py-4"><StatusBadge status={record.status} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-50 px-4 py-3 text-xs text-slate-500">
        <span>{records.length} lineage records identified</span>
        <span>Select a row to inspect its source details below.</span>
      </div>
    </section>
  );
}
