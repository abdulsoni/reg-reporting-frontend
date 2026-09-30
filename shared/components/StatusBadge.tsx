import { cn } from "@/shared/utils/cn";
import type { ReportStatus } from "@/shared/types/report";

export function StatusBadge({
  status,
  count,
}: {
  status: ReportStatus;
  count?: number;
}) {
  const styles: Record<ReportStatus, string> = {
    complete: "bg-emerald-50 text-emerald-700 border-emerald-100",
    partial: "bg-amber-50 text-amber-700 border-amber-100",
    gap: "bg-rose-50 text-rose-700 border-rose-100",
    "not-scope": "bg-slate-100 text-slate-500 border-slate-200",
  };

  const labels: Record<ReportStatus, string> = {
    complete: "Complete",
    partial: "Partial",
    gap: "Gap",
    "not-scope": "Not in scope",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-semibold",
        styles[status]
      )}
    >
      {labels[status]}
      {typeof count === "number" ? ` · ${count}` : ""}
    </span>
  );
}