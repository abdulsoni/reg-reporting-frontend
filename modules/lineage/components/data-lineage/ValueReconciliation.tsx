import {
  Calculator,
  CheckCircle2,
  CircleAlert,
} from "lucide-react";
import type { DataTraceReconciliation } from "../../types/dataTrace";
import { formatTraceValue } from "../../utils/dataTraceMapper";

type Props = {
  reconciliation: DataTraceReconciliation;
  unit?: string | null;
  context?: string;
};

export default function ValueReconciliation({
  reconciliation,
  unit,
  context,
}: Props) {
  const result = reconciliation.result || "Incomplete";

  const isMatch = result === "Match";

  const isMismatch = result === "Mismatch";

  const resultStyle = isMatch
    ? "bg-emerald-100 text-emerald-700"
    : isMismatch
      ? "bg-rose-100 text-rose-700"
      : "bg-amber-100 text-amber-800";

  const ResultIcon = isMatch
    ? CheckCircle2
    : CircleAlert;

  const items: Array<{
    label: string;
    value: string;
    unit: string;
  }> = [
    {
      label: "Reported value",
      value: formatTraceValue(
        reconciliation.reported_value
      ),
      unit: unit ?? "",
    },
    {
      label: "Calculated value",
      value: formatTraceValue(
        reconciliation.calculated_value
      ),
      unit: unit ?? "",
    },
    {
      label: "Variance",
      value: formatTraceValue(
        reconciliation.variance
      ),
      unit: "",
    },
    {
      label: "Tolerance",
      value: formatTraceValue(
        reconciliation.tolerance
      ),
      unit: "",
    },
  ];

  return (
    <section className="rounded-xl border border-blue-100 bg-white p-3 shadow-sm">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-blue-200 bg-blue-50 text-blue-700">
          <Calculator size={21} />
        </span>

        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-bold text-[#102d55]">
            Value Reconciliation
          </h2>

          <p className="mt-1 text-[11px] text-slate-500">
            Reconcile the value from contributing sources with the
            calculated value
          </p>

          {context && (
            <p className="mt-0.5 font-mono text-[10px] text-slate-400">
              {context}
            </p>
          )}

          <div className="mt-2 grid gap-3 rounded-lg border border-blue-100 bg-blue-50/40 p-2.5 sm:grid-cols-2 xl:grid-cols-5">
            {items.map((item) => (
              <div
                key={item.label}
                className="border-r border-blue-100 px-2 last:border-0"
              >
                <p className="text-[10px] text-[#173b70]">
                  {item.label}
                </p>

                <p className="mt-1 text-sm font-bold tabular-nums text-[#102d55]">
                  {item.value}
                </p>

                <p className="text-[10px] text-slate-500">
                  {item.unit}
                </p>
              </div>
            ))}

            <div className="flex items-center justify-center gap-2">
              <ResultIcon
                size={24}
                className={
                  isMatch
                    ? "text-emerald-500"
                    : isMismatch
                      ? "text-rose-500"
                      : "text-amber-500"
                }
              />

              <span
                className={`rounded-full px-3 py-1.5 text-sm font-bold ${resultStyle}`}
              >
                {result}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
