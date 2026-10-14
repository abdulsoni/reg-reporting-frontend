"use client";

import {
  ReactFlow,
  Background,
  Controls,
  Handle,
  Position,
  type Node,
  type NodeProps,
} from "@xyflow/react";
import { Database } from "lucide-react";

import {
  buildSystemGraph,
  type SystemData,
} from "../data/systemLineageAdapter";

function SystemNode({ data }: NodeProps<Node<SystemData, "system">>) {
  return (
    <div
      className={`min-w-[210px] rounded-xl border-2 bg-white shadow-sm ${
        data.target ? "border-blue-500 ring-2 ring-blue-100" : "border-line"
      }`}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!h-3 !w-3 !border-2 !border-white !bg-slate-400"
      />

      <div className="flex items-center gap-3 p-4">
        <div className="rounded-lg bg-slate-100 p-2">
          <Database size={18} className="text-slate-500" />
        </div>

        <div>
          <div className="text-sm font-semibold text-ink">{data.label}</div>

          <div className="mt-1 text-xs text-slate-500">
            {data.description}
          </div>

          {data.target && (
            <div className="mt-2 text-xs font-medium text-blue-600">
              Click to explore tables →
            </div>
          )}
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="!h-3 !w-3 !border-2 !border-white !bg-slate-400"
      />
    </div>
  );
}

const nodeTypes = { system: SystemNode };

export default function SystemLineageGraph({
  onSelectSystem,
}: {
  onSelectSystem: (systemId: string) => void;
}) {
  const { nodes, edges } = buildSystemGraph();

  return (
    <div className="h-[650px] w-full overflow-hidden rounded-xl border border-line bg-slate-50">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodeClick={(_, node) => {
          if (node.id === "normalized_data") {
            onSelectSystem(node.id);
          }
        }}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        nodesDraggable={false}
        proOptions={{ hideAttribution: true }}
      >
        <Background gap={20} color="#cbd5e1" />
        <Controls />
      </ReactFlow>
    </div>
  );
}
