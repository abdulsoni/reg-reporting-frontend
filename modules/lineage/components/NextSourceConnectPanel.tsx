"use client";

import { SourceSystemPanel } from "./SourceSystemPanel";

type NextSourceConnectPanelProps = {
  onConnect: (dbType: string, database: string) => void | Promise<void>;
};

/**
 * Shared "Next source identification" panel. Used by the trace progress page
 * and the data lineage details page so both connect flows look identical.
 */
export function NextSourceConnectPanel({
  onConnect,
}: NextSourceConnectPanelProps) {
  return (
    <div className="panel flex flex-col p-5">
      <h2 className="pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
        Next source identification
      </h2>

      <SourceSystemPanel onConnect={onConnect} hideTitle={true} />
    </div>
  );
}
