"use client";

import { useMemo, useState } from "react";

import {

  ReactFlow,

  Background,

  Controls,

  MiniMap,

  Handle,

  Position,

  MarkerType,

  BaseEdge,

  getSmoothStepPath,

  type EdgeProps,

  type Node,

  type Edge,

  type NodeProps,

} from "@xyflow/react";

import type {
  LineageAttribute,
  LineageData,
  LineageEdge,
} from "../types/lineage";

import { LineageGroup, type LineageGroupNode } from "./LineageGroup";

type Attribute = LineageAttribute;

type AttributeNodeData = {

  label: string;

  dataType: string;

  table: string;

  transformation: string;

  selected?: boolean;

  onSelect?: (id: string) => void;

};

type AttributeNode = Node<AttributeNodeData, "attribute">;

function AttributeField({ id, data }: NodeProps<AttributeNode>) {

  return (

    <div

      onClick={(event) => {

        event.stopPropagation();

        data.onSelect?.(id);

      }}

      className={`flex h-full w-full cursor-pointer items-center rounded-md border bg-white px-3 shadow-sm transition-colors ${data.selected

          ? "border-blue-600 bg-blue-50 ring-2 ring-blue-300"

          : "border-slate-200 hover:border-blue-400"

        }`}

    >

      <Handle

        id={`${id.split(".").pop()}-in`}

        type="target"

        position={Position.Left}

        className="!h-2.5 !w-2.5 !border-2 !border-white !bg-blue-500"

      />

      <div className="min-w-0 flex-1">

        <div className="truncate text-xs font-semibold text-slate-800">

          {data.label}

        </div>

        <div className="truncate text-[10px] text-slate-500">

          {data.dataType}

        </div>

      </div>

      <Handle

        id={`${id.split(".").pop()}-out`}

        type="source"

        position={Position.Right}

        className="!h-2.5 !w-2.5 !border-2 !border-white !bg-emerald-500"

      />

      <Handle
        id={`${id.split(".").pop()}-right-target`}
        type="target"
        position={Position.Right}
        className="!h-2.5 !w-2.5 !border-2 !border-white !bg-blue-500"
      />

    </div>

  );

}

function LineageEdgePath(props: EdgeProps) {
  const {
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    markerEnd,
    style,
    data,
  } = props;

  let path: string;

  if ((data as { sameTable?: boolean } | undefined)?.sameTable) {
    // Route same-table edges outside the right side of the attribute nodes.
    const laneX = Math.max(sourceX, targetX) + 36;
    path = `M ${sourceX},${sourceY} L ${laneX},${sourceY} L ${laneX},${targetY} L ${targetX},${targetY}`;
  } else {
    [path] = getSmoothStepPath({
      sourceX,
      sourceY,
      sourcePosition,
      targetX,
      targetY,
      targetPosition,
      borderRadius: 10,
      offset: 24,
    });
  }

  return <BaseEdge id={id} path={path} markerEnd={markerEnd} style={style} />;
}

const edgeTypes = {
  lineage: LineageEdgePath,
};

const nodeTypes = {

  lineageGroup: LineageGroup,

  attribute: AttributeField,

};

type DetailPanelProps = {

  title: string;

  onClose: () => void;

  children: React.ReactNode;

};

function DetailPanel({ title, onClose, children }: DetailPanelProps) {

  return (

    <div className="absolute bottom-4 right-4 z-10 w-[min(360px,calc(100%-32px))] rounded-xl border border-line bg-white p-4 shadow-xl">

      <div className="mb-3 flex items-center justify-between">

        <h3 className="font-semibold text-ink">{title}</h3>

        <button

          type="button"

          onClick={onClose}

          className="rounded px-2 py-1 text-slate-500 hover:bg-slate-100"

          aria-label="Close details"

        >

          ✕

        </button>

      </div>

      <div className="space-y-3 text-sm">{children}</div>

    </div>

  );

}

export default function LineageGroupGraph({

  data,

  systemId,

}: {

  data: LineageData;

  systemId: string;

}) {

  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);

  const [selectedAttributeId, setSelectedAttributeId] = useState<string | null>(

    null

  );

  const systemTables = useMemo(

    () => data.tables.filter((table) => table.systemId === systemId),

    [data, systemId]

  );

  const systemEdges = useMemo(() => {

    const tableIds = new Set(systemTables.map((table) => table.id));

    return data.edges.filter(

      (edge) =>

        tableIds.has(edge.sourceTable) && tableIds.has(edge.targetTable)

    );

  }, [data, systemTables]);

  function clearSelection() {

    setSelectedEdgeId(null);

    setSelectedAttributeId(null);

  }

  const nodes = useMemo(() => {

    const tablePositions: Record<string, { x: number; y: number }> = {

      raw_sensi: { x: 420, y: 30 },

      adj_data: { x: 0, y: 250 },

      ref_fx_data: { x: 0, y: 0 },

      "raw_sensi:raw_sensi": { x: 240, y: 40 },

      "adj_audit:adj_audit": { x: 240, y: 40 },

      "ref_fx_data:ref_fx_data": { x: 240, y: 40 },

    };

    const groupNodes: LineageGroupNode[] = systemTables.map((table) => ({

      id: table.id,

      type: "lineageGroup",

      position: tablePositions[table.id],

      style: {

        width: 300,

        height: 72 + table.attributes.length * 64,

      },

      data: {

        label: table.name,

        attributeCount: table.attributes.length,

      },

      draggable: true,

      selectable: false,

    }));

    const attributeNodes: AttributeNode[] = systemTables.flatMap((table) =>

      table.attributes.map((attribute: Attribute, index: number) => {

        const nodeId = `${table.id}.${attribute.id}`;

        return {

          id: nodeId,

          type: "attribute" as const,

          parentId: table.id,

          extent: "parent" as const,

          position: {

            x: 16,

            y: 58 + index * 64,

          },

          style: {

            width: 268,

            height: 44,

          },

          data: {

            label: attribute.name,

            dataType: attribute.dataType,

            table: table.name,

            transformation: attribute.transformation,

            selected: selectedAttributeId === nodeId,

            onSelect: (id: string) => {

              setSelectedAttributeId(id);

              setSelectedEdgeId(null);

            },

          },

          draggable: false,

        };

      })

    );

    return [...groupNodes, ...attributeNodes];

  }, [selectedAttributeId, systemTables]);

  const edges = useMemo<Edge[]>(() => {

    return systemEdges.map((item) => {

      const selected = item.id === selectedEdgeId;

      const sourceId = `${item.sourceTable}.${item.source}`;

      const targetId = `${item.targetTable}.${item.target}`;

      const isSameTable = item.sourceTable === item.targetTable;

      return {

        id: item.id,

        source: sourceId,

        sourceHandle: `${item.source}-out`,

        target: targetId,

        targetHandle: isSameTable
          ? `${item.target}-right-target`
          : `${item.target}-in`,

        type: isSameTable ? "lineage" : undefined,

        data: { ...item, sameTable: isSameTable },

        // Highlight the selected edge.

        animated: selected,

        markerEnd: {

          type: MarkerType.ArrowClosed,

          color: selected ? "#2563eb" : "#94a3b8",

        },

        style: {

          stroke: selected ? "#2563eb" : "#94a3b8",

          strokeWidth: selected ? 4 : 1.5,

          opacity: selectedEdgeId && !selected ? 0.25 : 1,

        },

        zIndex: selected ? 10 : 1,

      };

    });

  }, [selectedEdgeId, systemEdges]);

  const selectedEdge = useMemo(

    () => systemEdges.find((item) => item.id === selectedEdgeId) ?? null,

    [selectedEdgeId, systemEdges]

  );

  const selectedAttribute = useMemo(() => {

    if (!selectedAttributeId) return null;

    const [tableId, attributeId] = selectedAttributeId.split(".");

    const table = systemTables.find((item) => item.id === tableId);

    const attribute = table?.attributes.find((item) => item.id === attributeId);

    if (!table || !attribute) return null;

    return { ...attribute, table: table.name };

  }, [selectedAttributeId, systemTables]);

  const attributeLineage = useMemo<{

    incoming: LineageEdge[];

    outgoing: LineageEdge[];

  }>(() => {

    if (!selectedAttributeId) return { incoming: [], outgoing: [] };

    return {

      incoming: systemEdges.filter(

        (edge) => `${edge.targetTable}.${edge.target}` === selectedAttributeId

      ),

      outgoing: systemEdges.filter(

        (edge) => `${edge.sourceTable}.${edge.source}` === selectedAttributeId

      ),

    };

  }, [selectedAttributeId, systemEdges]);

  return (

    <div className="relative h-[780px] w-full overflow-hidden rounded-xl border border-line bg-slate-100">

      <ReactFlow

        nodes={nodes}

        edges={edges}

        nodeTypes={nodeTypes}

        edgeTypes={edgeTypes}

        onEdgeClick={(_, edge) => {

          setSelectedEdgeId(edge.id);

          setSelectedAttributeId(null);

        }}

        onPaneClick={clearSelection}

        fitView

        fitViewOptions={{ padding: 0.15 }}

        minZoom={0.25}

        maxZoom={1.5}

        proOptions={{ hideAttribution: true }}

      >

        <Background gap={20} color="#cbd5e1" />

        <Controls />

        {/* <MiniMap pannable zoomable /> */}

      </ReactFlow>

      {selectedEdge ? (

        <DetailPanel

          title="Transformation details"

          onClose={() => setSelectedEdgeId(null)}

        >

          <div>

            <div className="text-xs text-slate-500">Source</div>

            <div className="font-medium">

              {selectedEdge.sourceTable}.{selectedEdge.source}

            </div>

          </div>

          <div>

            <div className="text-xs text-slate-500">Target</div>

            <div className="font-medium">

              {selectedEdge.targetTable}.{selectedEdge.target}

            </div>

          </div>

          <div>

            <div className="text-xs text-slate-500">Transformation</div>

            <pre className="mt-1 whitespace-pre-wrap break-words rounded-md bg-slate-100 p-3 text-xs">

              {selectedEdge.transformation}

            </pre>

          </div>

          <div className="text-slate-600">{selectedEdge.description}</div>

        </DetailPanel>

      ) : selectedAttribute ? (

        <DetailPanel title="Column details" onClose={clearSelection}>

          <div className="flex items-center justify-between gap-3">

            <div className="font-mono font-medium text-ink">

              {selectedAttribute.table}.{selectedAttribute.name}

            </div>

            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">

              {selectedAttribute.dataType}

            </span>

          </div>

          <div>

            <div className="text-xs text-slate-500">Transformation</div>

            <pre className="mt-1 whitespace-pre-wrap break-words rounded-md bg-slate-100 p-3 text-xs">

              {selectedAttribute.transformation}

            </pre>

          </div>

          <div>

            <div className="text-xs text-slate-500">

              Incoming sources ({attributeLineage.incoming.length})

            </div>

            {attributeLineage.incoming.length > 0 ? (

              <ul className="mt-1 space-y-1.5">

                {attributeLineage.incoming.map((edge) => (

                  <li

                    key={edge.id}

                    className="rounded-md border border-slate-200 p-2"

                  >

                    <div className="font-mono text-xs font-semibold text-slate-800">

                      {edge.sourceTable}.{edge.source}

                    </div>

                    <div className="mt-0.5 text-[11px] text-slate-500">

                      {edge.description}

                    </div>

                  </li>

                ))}

              </ul>

            ) : (

              <p className="mt-1 text-[11px] text-slate-500">

                No incoming sources.

              </p>

            )}

          </div>

          <div>

            <div className="text-xs text-slate-500">

              Outgoing targets ({attributeLineage.outgoing.length})

            </div>

            {attributeLineage.outgoing.length > 0 ? (

              <ul className="mt-1 space-y-1.5">

                {attributeLineage.outgoing.map((edge) => (

                  <li

                    key={edge.id}

                    className="rounded-md border border-slate-200 p-2"

                  >

                    <div className="font-mono text-xs font-semibold text-slate-800">

                      {edge.targetTable}.{edge.target}

                    </div>

                    <div className="mt-0.5 text-[11px] text-slate-500">

                      {edge.description}

                    </div>

                  </li>

                ))}

              </ul>

            ) : (

              <p className="mt-1 text-[11px] text-slate-500">

                No outgoing targets.

              </p>

            )}

          </div>

        </DetailPanel>

      ) : null}

    </div>

  );

}
