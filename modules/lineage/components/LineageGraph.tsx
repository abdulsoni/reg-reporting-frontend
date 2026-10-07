"use client";

import {
  Background,
  BaseEdge,
  Controls,
  EdgeLabelRenderer,
  Handle,
  MarkerType,
  MiniMap,
  Position,
  ReactFlow,
  getBezierPath,
  type Edge,
  type EdgeProps,
  type Node,
  type NodeProps,
} from "@xyflow/react";

import { useMemo, useState } from "react";

import type {
  GraphNodeData,
  LineageGraph,
} from "../types/lineage";

type FlowNode = Node<GraphNodeData, "lineage">;

type FlowEdge = Edge<
  {
    number: number;
  },
  "lineageEdge"
>;

/* ============================================================
 * LAYOUT
 * ============================================================
 *
 * The reference design is:
 *
 * SYSTEM OF RECORD | STAGING | WAREHOUSE | DATA MART |
 * CALC ENGINE | REPORTING LAYER
 *
 * We derive the lane from the system/table name.
 */

type Lane =
  | "source"
  | "staging"
  | "warehouse"
  | "data_mart"
  | "calc_engine"
  | "reporting";

const LANE_ORDER: Lane[] = [
  "source",
  "staging",
  "warehouse",
  "data_mart",
  "calc_engine",
  "reporting",
];

const LANE_LABELS: Record<Lane, string> = {
  source: "SYSTEM OF RECORD",
  staging: "STAGING",
  warehouse: "WAREHOUSE",
  data_mart: "DATA MART",
  calc_engine: "CALC ENGINE",
  reporting: "REPORTING LAYER",
};

const LANE_WIDTH = 250;
const NODE_WIDTH = 205;
const NODE_HEIGHT = 82;

const LANE_X: Record<Lane, number> = {
  source: 20,
  staging: 270,
  warehouse: 520,
  data_mart: 770,
  calc_engine: 1020,
  reporting: 1270,
};

function getLane(
  data: GraphNodeData,
): Lane {
  const system = data.system?.toLowerCase() ?? "";
  const table = data.table?.toLowerCase() ?? "";

  if (system === "reporting_db") {
    return "reporting";
  }

  if (
    system === "sa_engine" ||
    system.includes("calc") ||
    system.includes("engine")
  ) {
    return "calc_engine";
  }

  if (
    table.startsWith("mart_") ||
    system.includes("mart")
  ) {
    return "data_mart";
  }

  if (
    system === "dwh" &&
    table.startsWith("dw_")
  ) {
    return "warehouse";
  }

  if (
    system === "staging" ||
    system.startsWith("stg")
  ) {
    return "staging";
  }

  return "source";
}

/* ============================================================
 * HELPERS
 * ============================================================ */

function shortNodeName(
  data: GraphNodeData,
) {
  if (data.pending) {
    return "not yet traced";
  }

  return `${data.table}.${data.attribute}`;
}

function isFinalSource(
  data: GraphNodeData,
) {
  return (
    data.final_source ||
    data.status === "SOURCE_REACHED"
  );
}

/* ============================================================
 * LINEAGE NODE
 * ============================================================ */

function LineageNode({
  data,
  selected,
}: NodeProps<FlowNode>) {
  const source = isFinalSource(data);

  return (
    <div
      className={[
        "relative",
        "w-[205px]",
        "rounded-md",
        "border",
        "bg-white",
        "px-3",
        "py-2",
        "shadow-sm",
        "transition-all",
        "duration-150",

        selected
          ? "border-slate-900 shadow-md ring-2 ring-slate-900/10"
          : source
            ? "border-emerald-500"
            : data.pending
              ? "border-dashed border-slate-400"
              : "border-slate-300",
      ].join(" ")}
    >
      {/* Incoming relationship */}

      <Handle
        type="target"
        position={Position.Left}
        className="!h-[7px] !w-[7px] !border-2 !border-slate-500 !bg-white"
      />

      {/* System */}

      <div
        className={[
          "font-mono",
          "text-[10px]",
          "font-bold",
          "uppercase",
          source
            ? "text-emerald-700"
            : "text-slate-700",
        ].join(" ")}
      >
        {data.system}
      </div>

      {/* Table + attribute */}

      <div className="mt-1 truncate font-mono text-[10px] text-slate-800">
        {shortNodeName(data)}
      </div>

      {/* Transformation */}

      {data.transformation && (
        <div className="mt-1 truncate border-t border-slate-100 pt-1 font-mono text-[9px] italic text-slate-500">
          = {data.transformation}
        </div>
      )}

      {/* Final source */}

      {source && (
        <div className="mt-1 text-[8px] font-bold uppercase tracking-[0.12em] text-emerald-600">
          Proven source
        </div>
      )}

      {/* Pending */}

      {data.pending && (
        <div className="mt-1 text-[8px] font-bold uppercase tracking-[0.12em] text-slate-400">
          Connection required
        </div>
      )}

      {/* Outgoing relationship */}

      <Handle
        type="source"
        position={Position.Right}
        className="!h-[7px] !w-[7px] !border-2 !border-slate-500 !bg-white"
      />
    </div>
  );
}

/* ============================================================
 * CUSTOM LINEAGE EDGE
 * ============================================================
 *
 * Adds:
 *
 *       ③
 *       |
 *       └────────>
 *
 * exactly like the reference screenshot.
 */

function LineageEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  markerEnd,
}: EdgeProps<FlowEdge>) {
  const [edgePath, labelX, labelY] =
    getBezierPath({
      sourceX,
      sourceY,
      sourcePosition,
      targetX,
      targetY,
      targetPosition,
      curvature: 0.25,
    });

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          stroke: "#64748b",
          strokeWidth: 1.7,
        }}
      />

      <EdgeLabelRenderer>
        <div
          className="nodrag nopan pointer-events-none absolute flex h-[25px] w-[25px] items-center justify-center rounded-full border border-slate-500 bg-white font-mono text-[10px] font-bold text-slate-700 shadow-sm"
          style={{
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
          }}
        >
          {data?.number}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}

const nodeTypes = {
  lineage: LineageNode,
};

const edgeTypes = {
  lineageEdge: LineageEdge,
};

/* ============================================================
 * MAIN GRAPH
 * ============================================================ */

type LineageGraphViewProps = {
  graph: LineageGraph | null;
  onSelectNode?: (nodeId: string) => void;
  selectedNodeId?: string | null;
};

export function LineageGraphView({
  graph,
  onSelectNode,
  selectedNodeId,
}: LineageGraphViewProps) {
  const [internalSelected, setInternalSelected] =
    useState<string | null>(
      selectedNodeId ?? null,
    );

  const selectedId =
    selectedNodeId ?? internalSelected;

  const { nodes, edges, selectedData } =
    useMemo(() => {
      if (!graph) {
        return {
          nodes: [] as FlowNode[],
          edges: [] as FlowEdge[],
          selectedData: null,
        };
      }

      /*
       * --------------------------------------------------------
       * GROUP NODES INTO LANES
       * --------------------------------------------------------
       */

      const laneNodes: Record<
        Lane,
        typeof graph.nodes
      > = {
        source: [],
        staging: [],
        warehouse: [],
        data_mart: [],
        calc_engine: [],
        reporting: [],
      };

      for (const node of graph.nodes) {
        const lane = getLane(node.data);

        laneNodes[lane].push(node);
      }

      /*
       * --------------------------------------------------------
       * SORT NODES
       * --------------------------------------------------------
       *
       * We want a stable visual layout.
       */

      for (const lane of LANE_ORDER) {
        laneNodes[lane].sort(
          (a, b) =>
            a.position.y - b.position.y ||
            a.id.localeCompare(b.id),
        );
      }

      /*
       * --------------------------------------------------------
       * CREATE REACT FLOW NODES
       * --------------------------------------------------------
       */

      const flowNodes: FlowNode[] = [];

      for (const lane of LANE_ORDER) {
        const items = laneNodes[lane];

        const totalHeight =
          items.length * NODE_HEIGHT +
          Math.max(0, items.length - 1) * 35;

        const startY = Math.max(
          80,
          (650 - totalHeight) / 2,
        );

        items.forEach((node, index) => {
          flowNodes.push({
            id: node.id,
            type: "lineage",
            position: {
              x: LANE_X[lane],
              y:
                startY +
                index * (NODE_HEIGHT + 35),
            },
            data: node.data,
          });
        });
      }

      /*
       * --------------------------------------------------------
       * CREATE NUMBERED EDGES
       * --------------------------------------------------------
       */

      const flowEdges: FlowEdge[] =
        graph.edges.map(
          (edge, index) => ({
            id: edge.id,
            source: edge.source,
            target: edge.target,
            type: "lineageEdge",
            data: {
              number: index + 1,
            },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              width: 14,
              height: 14,
              color: "#64748b",
            },
          }),
        );

      const selectedNode =
        flowNodes.find(
          (node) => node.id === selectedId,
        );

      return {
        nodes: flowNodes,
        edges: flowEdges,
        selectedData:
          selectedNode?.data ?? null,
      };
    }, [
      graph,
      selectedId,
    ]);

  if (!graph || nodes.length === 0) {
    return (
      <div className="flex h-[650px] items-center justify-center rounded-lg bg-slate-50 text-[11px] text-slate-500">
        No lineage relationships to display.
      </div>
    );
  }

  const handleNodeClick = (
    nodeId: string,
  ) => {
    setInternalSelected(nodeId);
    onSelectNode?.(nodeId);
  };

  return (
    <div className="relative h-[650px] overflow-hidden rounded-lg border border-slate-200 bg-[#fbfaf7]">
      {/* ======================================================
       * LANE HEADERS
       * ====================================================== */}

      <div className="pointer-events-none absolute left-0 right-0 top-3 z-10 flex">
        {LANE_ORDER.map((lane) => (
          <div
            key={lane}
            className="w-[250px] text-center font-sans text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-600"
            style={{
              marginLeft:
                lane === "source"
                  ? 0
                  : 0,
            }}
          >
            {LANE_LABELS[lane]}
          </div>
        ))}
      </div>

      {/* ======================================================
       * REACT FLOW
       * ====================================================== */}

      <ReactFlow
        nodes={nodes.map((node) => ({
          ...node,
          selected: node.id === selectedId,
        }))}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        fitViewOptions={{
          padding: 0.12,
          minZoom: 0.55,
          maxZoom: 1.1,
        }}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable
        proOptions={{
          hideAttribution: true,
        }}
        onNodeClick={(_, node) =>
          handleNodeClick(node.id)
        }
        nodesFocusable
        className="bg-[#fbfaf7]"
      >
        <Background
          color="#e5e2da"
          gap={22}
          size={1}
        />

        <Controls
          showInteractive={false}
          position="bottom-left"
        />

        <MiniMap
          pannable
          zoomable
          position="bottom-right"
          className="!bg-white"
          maskColor="rgba(244, 242, 237, 0.7)"
          nodeColor={(node) => {
            const data =
              node.data as GraphNodeData;

            if (
              data.final_source ||
              data.status ===
                "SOURCE_REACHED"
            ) {
              return "#10b981";
            }

            if (data.pending) {
              return "#94a3b8";
            }

            return "#64748b";
          }}
        />
      </ReactFlow>

      {/* ======================================================
       * SELECTED NODE DETAIL PANEL
       * ====================================================== */}

      {selectedData && (
        <div className="absolute right-4 top-14 z-20 w-[310px] rounded-lg border border-slate-200 bg-white p-4 shadow-lg">
          <div className="flex items-start justify-between">
            <div>
              <div className="font-mono text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500">
                Selected hop
              </div>

              <div className="mt-1 font-mono text-sm font-semibold text-slate-900">
                {selectedData.table}
              </div>

              <div className="font-mono text-xs text-slate-600">
                {selectedData.attribute}
              </div>
            </div>

            {isFinalSource(
              selectedData,
            ) && (
              <span className="rounded-full bg-emerald-50 px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-emerald-700">
                Proven
              </span>
            )}
          </div>

          <div className="mt-4 space-y-3 border-t border-slate-100 pt-3">
            <DetailItem
              label="System"
              value={selectedData.system}
            />

            <DetailItem
              label="Attribute held in"
              value={`${selectedData.table}.${selectedData.attribute}`}
            />

            {selectedData.transformation && (
              <DetailItem
                label="Transformation"
                value={selectedData.transformation}
              />
            )}

            <DetailItem
              label="Status"
              value={
                selectedData.status ??
                "IDENTIFIED"
              }
            />
          </div>
        </div>
      )}

      {/* ======================================================
       * LEGEND
       * ====================================================== */}

      <div className="absolute bottom-5 left-5 z-20 flex items-center gap-5 rounded-md bg-white/90 px-3 py-2 text-[9px] text-slate-600 shadow-sm backdrop-blur">
        <div className="flex items-center gap-1.5">
          <span className="h-[2px] w-5 bg-slate-500" />
          Proven
        </div>

        <div className="flex items-center gap-1.5">
          <span className="h-0 w-5 border-t border-dashed border-slate-500" />
          Code-derived
        </div>

        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full border border-emerald-500 bg-white" />
          Final source
        </div>
      </div>

      {selectedId && (
        <p
          className="sr-only"
          aria-live="polite"
        >
          Selected {selectedId}
        </p>
      )}
    </div>
  );
}

/* ============================================================
 * DETAIL ITEM
 * ============================================================ */

function DetailItem({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  if (!value) {
    return null;
  }

  return (
    <div>
      <div className="text-[9px] font-semibold uppercase tracking-[0.1em] text-slate-400">
        {label}
      </div>

      <div className="mt-1 break-words font-mono text-[10px] leading-4 text-slate-700">
        {value}
      </div>
    </div>
  );
}