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
    <section className="panel p-4">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-600">
          <Calculator size={20} />
        </span>

        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-bold text-ink">
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

          <div className="mt-2 grid gap-3 rounded-lg border border-slate-200 bg-slate-50/60 p-2.5 sm:grid-cols-2 xl:grid-cols-5">
            {items.map((item) => (
              <div
                key={item.label}
                className="border-r border-slate-200 px-2 last:border-0"
              >
                <p className="text-[10px] text-slate-500">
                  {item.label}
                </p>

                <p className="mt-1 text-sm font-bold tabular-nums text-ink">
                  {item.value}
                </p>

                <p className="text-[10px] text-slate-400">
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
