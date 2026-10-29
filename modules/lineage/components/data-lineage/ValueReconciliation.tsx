import { Calculator, CheckCircle2, CircleAlert } from "lucide-react";

type Props = {
  sourceContributions: { label: string; value: number }[];
  calculatedValue: number;
  reportedValue: number;
  unit: string;
  tolerance?: number;
};

export default function ValueReconciliation({
  sourceContributions,
  calculatedValue,
  reportedValue,
  unit,
  tolerance = 0.01,
}: Props) {
  const variance = calculatedValue - reportedValue;
  const matches = Math.abs(variance) <= tolerance;

  return (
    <section className="rounded-xl border border-blue-100 bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700"><Calculator size={19} /></div>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-bold text-slate-900">Value reconciliation</h2>
          <p className="mt-1 text-xs text-slate-500">Reconcile the source contributions with the selected PDF value.</p>

          <div className="mt-4 grid gap-3 rounded-lg border border-blue-100 bg-blue-50/30 p-4 sm:grid-cols-2 xl:grid-cols-[1fr_auto_1fr_auto_1fr_1fr_1fr] xl:items-center">
            {sourceContributions.map((source, index) => (
              <div key={source.label} className="min-w-0">
                <div className="text-[11px] text-slate-500">{source.label}</div>
                <div className="mt-1 text-lg font-semibold tabular-nums text-slate-900">{source.value.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
                <div className="text-[10px] text-slate-400">{unit}</div>
                {index < sourceContributions.length - 1 && <div className="mt-2 text-xs text-slate-400 xl:hidden">Source contribution</div>}
              </div>
            ))}
            <div className="hidden text-xl font-light text-blue-500 xl:block">=</div>
            <div>
              <div className="text-[11px] text-slate-500">Calculated value</div>
              <div className="mt-1 text-lg font-semibold tabular-nums text-slate-900">{calculatedValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
              <div className="text-[10px] text-slate-400">{unit}</div>
            </div>
            <div>
              <div className="text-[11px] text-slate-500">Variance</div>
              <div className={`mt-1 text-lg font-semibold tabular-nums ${matches ? "text-emerald-700" : "text-rose-700"}`}>{variance.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
              <div className="text-[10px] text-slate-400">{unit}</div>
            </div>
            <div>
              <div className="text-[11px] text-slate-500">Result</div>
              <span className={`mt-1 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${matches ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
                {matches ? <CheckCircle2 size={14} /> : <CircleAlert size={14} />}
                {matches ? "Match" : "Variance found"}
              </span>
              <div className="mt-1 text-[10px] text-slate-400">PDF value: {reportedValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
            </div>
          </div>
          <p className="mt-2 text-[11px] text-slate-400">Demo values only. Connect this panel to actual source records and calculation results before treating the result as verified.</p>
        </div>
      </div>
    </section>
  );
}
