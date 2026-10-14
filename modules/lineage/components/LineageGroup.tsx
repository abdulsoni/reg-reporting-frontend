"use client";

import type { Node, NodeProps } from "@xyflow/react";

export type LineageGroupData = {
  label: string;
  attributeCount: number;
};

export type LineageGroupNode = Node<LineageGroupData, "lineageGroup">;

export function LineageGroup({ data }: NodeProps<LineageGroupNode>) {
  return (
    <div className="h-full w-full overflow-visible rounded-xl border-2 border-slate-300 bg-slate-50 shadow-sm">
      <div className="flex h-12 items-center justify-between rounded-t-lg bg-slate-800 px-3 text-white">
        <span className="text-sm font-semibold">{data.label}</span>

        <span className="rounded-full bg-slate-600 px-2 py-1 text-xs">
          {data.attributeCount} columns
        </span>
      </div>

      <div className="h-[calc(100%-48px)] rounded-b-lg bg-slate-50" />
    </div>
  );
}
