"use client";

import type { Node, NodeProps } from "@xyflow/react";

export type LineageGroupData = {
  label: string;
  attributeCount: number;
};

export type LineageGroupNode = Node<LineageGroupData, "lineageGroup">;

export function LineageGroup({ data }: NodeProps<LineageGroupNode>) {
  return (
    <div className="h-full w-full overflow-visible rounded-lg border border-slate-300 bg-white shadow-sm">
      <div className="flex h-12 items-center justify-between rounded-t-lg bg-slate-800 px-3 text-white">
        <span className="font-mono text-[11px] font-bold uppercase">
          {data.label}
        </span>

        <span className="rounded-full bg-slate-600 px-2 py-1 font-mono text-[10px]">
          {data.attributeCount} columns
        </span>
      </div>

      <div className="h-[calc(100%-48px)] rounded-b-lg bg-white" />
    </div>
  );
}
