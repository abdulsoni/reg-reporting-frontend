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
import { Database, PlugZap } from "lucide-react";

import {
  buildSystemGraph,
  type DependencyData,
  type SystemData,
} from "../data/systemLineageAdapter";
import type { LineageData } from "../types/lineage";

function SystemNode({ data }: NodeProps<Node<SystemData, "system">>) {
  return (
    <div
      className={`w-[220px] rounded-md border bg-white shadow-sm transition-shadow ${
        data.target ? "border-emerald-500" : "border-slate-300"
      } ${data.selected ? "ring-2 ring-slate-900/40" : ""}`}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!h-[7px] !w-[7px] !border-2 !border-slate-500 !bg-white"
      />

      <div className="flex items-center gap-3 px-3 py-2">
        <div className="rounded-md bg-slate-100 p-2">
          <Database size={18} className="text-slate-500" />
        </div>

        <div className="min-w-0 flex-1">
          <div
            className={`truncate font-mono text-[10px] font-bold uppercase ${
              data.target ? "text-emerald-700" : "text-slate-700"
            }`}
          >
            {data.label}
          </div>

          <div className="mt-1 truncate font-mono text-[10px] text-slate-600">
            {data.description}
          </div>

          {data.canExplore && (
            <div className="mt-1 text-[9px] font-bold uppercase tracking-[0.12em] text-emerald-600">
              Click to explore tables →
            </div>
          )}

          {data.metadataStatus !== "available" && (
            <div className="mt-1 text-[9px] font-bold uppercase tracking-[0.12em] text-amber-600">
              Metadata {data.metadataStatus.replace("_", " ")}
            </div>
          )}
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="!h-[7px] !w-[7px] !border-2 !border-slate-500 !bg-white"
      />
    </div>
  );
}

function DependencyNode({ data }: NodeProps<Node<DependencyData, "dependency">>) {
  return (
    <div className="w-[240px] rounded-md border border-dashed border-amber-400 bg-amber-50/70 shadow-sm">
      <Handle
        type="target"
        position={Position.Left}
        className="!h-[7px] !w-[7px] !border-2 !border-amber-500 !bg-white"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!h-[7px] !w-[7px] !border-2 !border-amber-500 !bg-white"
      />

      <div className="flex items-center gap-3 px-3 py-2">
        <div className="rounded-md bg-amber-100 p-2">
          <PlugZap size={18} className="text-amber-600" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="truncate font-mono text-[10px] font-bold uppercase text-amber-800">
            {data.systemName}
          </div>
          <div className="mt-1 text-[10px] leading-snug text-amber-700">
            Please connect
          </div>
        </div>
      </div>
    </div>
  );
}

const nodeTypes = { system: SystemNode, dependency: DependencyNode };

export default function SystemLineageGraph({
  data,
  selectedSystemId,
  onSelectSystem,
}: {
  data: LineageData;
  selectedSystemId?: string | null;
  onSelectSystem: (systemId: string) => void;
}) {
  const { nodes, edges } = buildSystemGraph(data, selectedSystemId);

  return (
    <div className="relative h-[650px] w-full overflow-hidden rounded-lg border border-slate-200 bg-[#fbfaf7]">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodeClick={(_, node) => {
          if (node.type !== "system") return;
          onSelectSystem(node.id);
        }}
        fitView
        fitViewOptions={{ padding: 0.12, minZoom: 0.55, maxZoom: 1.1 }}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable
        proOptions={{ hideAttribution: true }}
        className="bg-[#fbfaf7]"
      >
        <Background color="#e5e2da" gap={22} size={1} />
        <Controls showInteractive={false} position="bottom-left" />
      </ReactFlow>
    </div>
  );
}
