"use client";

import { AlertCircle } from "lucide-react";

export function TraceError({ error }: { error: string | null }) {
  if (!error) return null;

  return (
    <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5">
      <AlertCircle size={14} className="mt-px shrink-0 text-red-600" />

      <p className="text-[11px] font-medium text-red-700">{error}</p>
    </div>
  );
}
