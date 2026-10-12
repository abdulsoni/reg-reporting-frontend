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

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

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
  onSelectNode?: (nodeId: string | null) => void;
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

  const containerRef = useRef<HTMLDivElement>(null);

  /*
   * Clearing selection has to reset both the internal fallback and the
   * controlled value the parent owns, otherwise the `??` above re-selects the
   * previously clicked node.
   */
  const handleDeselect = useCallback(() => {
    setInternalSelected(null);
    onSelectNode?.(null);
  }, [onSelectNode]);

  /*
   * A click anywhere outside the graph container dismisses the floating detail
   * panel. Clicks inside are left to React Flow (nodes) and the pane handler.
   */
  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      const container = containerRef.current;

      if (
        container &&
        event.target instanceof HTMLElement &&
        !container.contains(event.target)
      ) {
        handleDeselect();
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [handleDeselect]);

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
       * CREATE REACT FLOW NODES
       * --------------------------------------------------------
       *
       * The backend lays the graph out left to right: source
       * columns on the left, the report datapoint on the right,
       * with the nodes of each column spread vertically. We use
       * those positions directly so React Flow does not stack
       * every node into a single column.
       */

      const flowNodes: FlowNode[] = graph.nodes.map(
        (node) => ({
          id: node.id,
          type: "lineage",
          position: node.position,
          data: node.data,
        }),
      );

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
    <div
      ref={containerRef}
      className="relative h-[650px] overflow-hidden rounded-lg border border-slate-200 bg-[#fbfaf7]"
    >
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
        onPaneClick={handleDeselect}
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

        {/* <MiniMap
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
        /> */}
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

      {/* <div className="absolute bottom-5 left-5 z-20 flex items-center gap-5 rounded-md bg-white/90 px-3 py-2 text-[9px] text-slate-600 shadow-sm backdrop-blur">
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
      </div> */}

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