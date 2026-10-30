
"use client";

import { LineageGraphNode } from "@/shared/types/lineage-graph";
import {
  Handle,
  Position,
  type NodeProps,
} from "@xyflow/react";
import type { Node } from "@xyflow/react";


export type LineageFlowNodeData = LineageGraphNode["data"];

export type LineageFlowNodeType = Node<
  LineageFlowNodeData,
  "lineage"
>;

export function LineageFlowNode({
  data,
  selected,
}: NodeProps<LineageFlowNodeType>) {
  return (
    <div
      className={[
        "w-[230px] rounded-lg border bg-white shadow-sm",
        selected
          ? "border-[#315c4b] ring-2 ring-[#315c4b]/15"
          : "border-slate-200",
      ].join(" ")}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!h-2.5 !w-2.5 !border-2 !border-white !bg-[#315c4b]"
      />

      <div className="border-b border-slate-100 px-3 py-2">
        <div className="truncate text-[10px] text-slate-500">
          {data.system}
        </div>
        <div className="mt-0.5 truncate text-xs font-semibold text-slate-800">
          {data.table}
        </div>
      </div>

      <div className="px-3 py-3">
        <div className="break-words font-mono text-xs font-semibold text-slate-900">
          {data.attribute}
        </div>

        {data.transformation && (
          <div
            className="mt-2 break-words text-[10px] leading-4 text-slate-500"
            title={data.transformation}
          >
            {data.transformation}
          </div>
        )}
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="!h-2.5 !w-2.5 !border-2 !border-white !bg-[#315c4b]"
      />
    </div>
  );
}
