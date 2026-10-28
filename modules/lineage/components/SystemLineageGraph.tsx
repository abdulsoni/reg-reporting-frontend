"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  ReactFlow,
  Background,
  Controls,
  Handle,
  Position,
  MarkerType,
  BaseEdge,
  getSmoothStepPath,
  type Edge,
  type EdgeProps,
  type Node,
  type NodeProps,
  type ReactFlowInstance,
} from "@xyflow/react";
import {
  ChevronDown,
  ChevronRight,
  Database,
  PlugZap,
  Table2,
} from "lucide-react";

import {
  buildSystemGraph,
  resolveEndpoint,
  type AttributeData,
  type AttributeFlowNode,
  type DependencyFlowNode,
  type SystemFlowNode,
  type TableFlowNode,
} from "../data/systemLineageAdapter";
import {
  endpointKey,
  type UpstreamTrace,
} from "../lib/reverseLineage";
import { mapTraceToSystemGraphHighlight } from "../lib/systemGraphHighlight";
import type {
  LineageData,
  LineageEdge,
  LineageEndpoint,
} from "../types/lineage";

function SystemNode({ data }: NodeProps<SystemFlowNode>) {
  const frame = data.target ? "border-emerald-500" : "border-slate-300";

  return (
    <div
      className={`flex h-full w-full flex-col rounded-lg border bg-white/30 shadow-sm ${frame} ${
        data.onPath ? "ring-2 ring-blue-300/60" : ""
      }`}
    >
      <Handle
        type="target"
        position={Position.Left}
        style={{ top: 32 }}
        className="!h-[7px] !w-[7px] !border-2 !border-slate-500 !bg-white"
      />

      <button
        type="button"
        disabled={!data.canExplore}
        aria-expanded={data.canExplore ? data.expanded : undefined}
        onClick={(event) => {
          event.stopPropagation();
          data.onToggle?.();
        }}
        className={`h-16 w-full rounded-t-lg bg-white/90 text-left transition ${
          data.canExplore ? "cursor-pointer hover:bg-white" : "cursor-default"
        }`}
      >
        <div className="flex h-full items-center gap-3 px-3">
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

            <div className="mt-0.5 truncate font-mono text-[10px] text-slate-600">
              {data.description}
            </div>

            {data.canExplore ? (
              <span className="mt-1 inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-[0.12em] text-emerald-600">
                {data.expanded ? (
                  <ChevronDown size={11} />
                ) : (
                  <ChevronRight size={11} />
                )}
                {data.expanded
                  ? `${data.tableCount} tables`
                  : "Explore tables"}
              </span>
            ) : (
              data.metadataStatus !== "available" && (
                <div className="mt-1 text-[9px] font-bold uppercase tracking-[0.12em] text-amber-600">
                  Metadata {data.metadataStatus.replace(/_/g, " ")}
                </div>
              )
            )}
          </div>
        </div>
      </button>

      {data.expanded && <div className="flex-1 rounded-b-lg" />}

      <Handle
        type="source"
        position={Position.Right}
        style={{ top: 32 }}
        className="!h-[7px] !w-[7px] !border-2 !border-slate-500 !bg-white"
      />
    </div>
  );
}

function TableNode({ data }: NodeProps<TableFlowNode>) {
  return (
    <div
      className={`flex h-full w-full flex-col rounded-lg border border-slate-300 bg-transparent shadow-sm ${
        data.onPath ? "ring-2 ring-blue-300/60" : ""
      }`}
    >
      <Handle
        type="target"
        position={Position.Left}
        style={{ top: 22 }}
        className="!h-[7px] !w-[7px] !border-2 !border-slate-500 !bg-white"
      />

      <button
        type="button"
        aria-expanded={data.expanded}
        onClick={(event) => {
          event.stopPropagation();
          data.onToggle?.();
        }}
        className={`flex h-11 w-full items-center gap-2 border-b px-3 text-left transition ${
          data.expanded
            ? "rounded-t-lg border-slate-200 bg-slate-50 hover:bg-slate-100"
            : "rounded-lg border-transparent bg-white hover:bg-slate-50"
        }`}
      >
        <Table2 size={15} className="shrink-0 text-slate-500" />

        <span className="min-w-0 flex-1 truncate font-mono text-[10px] font-bold uppercase text-slate-800">
          {data.label}
        </span>

        <span className="shrink-0 rounded-full bg-slate-200 px-1.5 py-0.5 font-mono text-[9px] text-slate-600">
          {data.attributeCount} columns
        </span>

        {data.expanded ? (
          <ChevronDown size={13} className="shrink-0 text-slate-500" />
        ) : (
          <ChevronRight size={13} className="shrink-0 text-slate-500" />
        )}
      </button>

      <div className="flex-1 rounded-b-lg" />

      <Handle
        type="source"
        position={Position.Right}
        style={{ top: 22 }}
        className="!h-[7px] !w-[7px] !border-2 !border-slate-500 !bg-white"
      />

      <Handle
        id="table-right-in"
        type="target"
        position={Position.Right}
        style={{ top: 22 }}
        className="!h-[7px] !w-[7px] !border-2 !border-slate-500 !bg-white"
      />
    </div>
  );
}

function AttributeNode({ data }: NodeProps<AttributeFlowNode>) {
  const frame = data.isTraceTarget
    ? "border-blue-600 bg-blue-50 ring-2 ring-blue-400/60"
    : data.highlighted
      ? "border-blue-400 bg-blue-50/70 ring-1 ring-blue-200"
      : data.selected
        ? "border-slate-900 bg-white ring-2 ring-slate-900/10"
        : "border-slate-300 bg-white hover:border-slate-400";

  return (
    <div
      className={`flex h-full w-full cursor-pointer items-center rounded-md border px-3 shadow-sm transition-colors ${frame}`}
    >
      <Handle
        id="attr-in"
        type="target"
        position={Position.Left}
        className="!h-[7px] !w-[7px] !border-2 !border-slate-500 !bg-white"
      />

      <div className="min-w-0 flex-1">
        <div className="truncate font-mono text-[10px] font-bold text-slate-800">
          {data.label}
        </div>

        <div className="truncate font-mono text-[9px] text-slate-500">
          {data.dataType}
        </div>
      </div>

      {data.status !== "confirmed" && (
        <span className="ml-2 shrink-0 rounded-full bg-amber-100 px-1.5 py-0.5 text-[8px] font-semibold uppercase text-amber-700">
          {data.status.replace(/_/g, " ")}
        </span>
      )}

      <Handle
        id="attr-out"
        type="source"
        position={Position.Right}
        className="!h-[7px] !w-[7px] !border-2 !border-slate-500 !bg-white"
      />

      <Handle
        id="attr-right-in"
        type="target"
        position={Position.Right}
        className="!h-[7px] !w-[7px] !border-2 !border-slate-500 !bg-white"
      />
    </div>
  );
}

function DependencyNode({ data }: NodeProps<DependencyFlowNode>) {
  const frame = data.highlighted
    ? "border-blue-500 bg-blue-50/80 ring-2 ring-blue-300/70"
    : "border-dashed border-amber-400 bg-amber-50/70";

  return (
    <div
      className={`flex h-full w-full items-center gap-3 rounded-md border px-3 shadow-sm ${frame}`}
    >
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
  );
}

function ExpandedLineageEdge(props: EdgeProps) {
  const {
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    markerStart,
    style,
    data,
  } = props;

  let path: string;

  const edgeData = data as
    | { rightSide?: boolean; sameTable?: boolean }
    | undefined;

  if (edgeData?.rightSide || edgeData?.sameTable) {
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

  return <BaseEdge id={id} path={path} markerStart={markerStart} style={style} />;
}

const nodeTypes = {
  system: SystemNode,
  dependency: DependencyNode,
  table: TableNode,
  attribute: AttributeNode,
};

const edgeTypes = {
  lineage: ExpandedLineageEdge,
};

type DetailPanelProps = {
  title: string;
  onClose: () => void;
  children: ReactNode;
};

function DetailPanel({ title, onClose, children }: DetailPanelProps) {
  return (
    <div className="absolute bottom-4 right-4 z-10 max-h-[calc(100%-48px)] w-[min(420px,calc(100%-32px))] overflow-y-auto rounded-xl border border-line bg-white p-4 shadow-xl">
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

function SideDetailPanel({ title, onClose, children }: DetailPanelProps) {
  return (
    <aside className="flex h-full w-[420px] shrink-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
        <h3 className="font-semibold text-ink">{title}</h3>
        <button type="button" onClick={onClose} className="rounded px-2 py-1 text-slate-500 hover:bg-slate-100" aria-label="Close details">x</button>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-3">
        <div className="space-y-3 text-sm">{children}</div>
      </div>
    </aside>
  );
}


function formatEndpoint(
  endpoint: LineageEndpoint,
  data: LineageData,
  resolution: ReturnType<typeof resolveEndpoint>
): string {
  if (resolution.kind === "resolved") {
    return endpoint.attributeId
      ? `${resolution.table.name}.${endpoint.attributeId}`
      : resolution.table.name;
  }

  if (resolution.kind === "dependency") {
    return `${resolution.dependency.systemName} (not connected)`;
  }

  if (resolution.kind === "metadata_unavailable") {
    return `${resolution.system.label} (metadata ${resolution.system.metadataStatus})`;
  }

  return endpoint.systemId;
}

function formatQualified(
  endpoint: LineageEndpoint,
  data: LineageData,
  resolution: ReturnType<typeof resolveEndpoint>
): string {
  const system = data.systems.find((item) => item.id === endpoint.systemId);
  const owner = system?.label ?? endpoint.systemId;

  if (resolution.kind === "resolved") {
    return endpoint.attributeId
      ? `${owner}.${resolution.table.name}.${endpoint.attributeId}`
      : `${owner}.${resolution.table.name}`;
  }

  if (resolution.kind === "dependency") {
    return `${resolution.dependency.systemName}${
      endpoint.attributeId ? `.${endpoint.attributeId}` : ""
    }`;
  }

  if (resolution.kind === "metadata_unavailable") {
    return `${resolution.system.label}${
      endpoint.attributeId ? `.${endpoint.attributeId}` : ""
    }`;
  }

  return `${owner}${endpoint.attributeId ? `.${endpoint.attributeId}` : ""}`;
}

type SelectedAttribute = {
  systemId: string;
  tableId: string;
  attributeId: string;
};

type FlowEdgeData = {
  edges?: LineageEdge[];
  sameTable?: boolean;
  rightSide?: boolean;
  summary?: boolean;
};

export default function SystemLineageGraph({
  data,
  expandedSystemIds,
  expandedTableIds,
  highlight,
  onToggleSystem,
  onToggleTable,
  onTraceAttribute,
  onClearHighlight,
}: {
  data: LineageData;
  expandedSystemIds: string[];
  expandedTableIds: string[];
  highlight?: UpstreamTrace | null;
  onToggleSystem: (systemId: string) => void;
  onToggleTable: (tableId: string) => void;
  onTraceAttribute?: (target: LineageEndpoint) => void;
  onClearHighlight?: () => void;
}) {
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [selectedAttribute, setSelectedAttribute] =
    useState<SelectedAttribute | null>(null);
  const [flow, setFlow] = useState<ReactFlowInstance | null>(null);

  const resetSelection = useCallback(() => {
    setSelectedEdgeId(null);
    setSelectedAttribute(null);
  }, []);

  const handleToggleSystem = useCallback(
    (systemId: string) => {
      resetSelection();
      onToggleSystem(systemId);
    },
    [onToggleSystem, resetSelection]
  );

  const handleToggleTable = useCallback(
    (tableId: string) => {
      resetSelection();
      onToggleTable(tableId);
    },
    [onToggleTable, resetSelection]
  );

  const mappedHighlight = useMemo(
    () => (highlight ? mapTraceToSystemGraphHighlight(highlight, data) : null),
    [data, highlight]
  );

  const graph = useMemo(
    () =>
      buildSystemGraph(data, {
        expandedSystemIds,
        expandedTableIds,
        highlight: mappedHighlight,
        handlers: {
          onToggleSystem: handleToggleSystem,
          onToggleTable: handleToggleTable,
        },
      }),
    [
      data,
      expandedSystemIds,
      expandedTableIds,
      mappedHighlight,
      handleToggleSystem,
      handleToggleTable,
    ]
  );

  useEffect(() => {
    if (!flow) return;

    const timer = window.setTimeout(() => {
      flow.fitView({ padding: 0.12, maxZoom: 1, duration: 250 });
    }, 40);

    return () => window.clearTimeout(timer);
  }, [flow, data, expandedSystemIds, expandedTableIds, highlight]);

  const nodes = useMemo(() => {
    if (!selectedAttribute) return graph.nodes;

    return graph.nodes.map((node) => {
      if (node.type !== "attribute") return node;

      const data = node.data as AttributeData;
      const selected =
        data.systemId === selectedAttribute.systemId &&
        data.tableId === selectedAttribute.tableId &&
        data.attributeId === selectedAttribute.attributeId;

      return selected
        ? { ...node, data: { ...data, selected: true } }
        : node;
    });
  }, [graph.nodes, selectedAttribute]);

  const edges = useMemo<Edge[]>(() => {
    if (!selectedEdgeId) return graph.edges;

    return graph.edges.map((edge) => {
      if (edge.id !== selectedEdgeId) return edge;

      return {
        ...edge,
        animated: true,
        style: {
          ...edge.style,
          stroke: "#0f172a",
          strokeWidth: 3,
          opacity: 1,
        },
        markerStart: {
          type: MarkerType.ArrowClosed,
          width: 14,
          height: 14,
          color: "#0f172a",
        },
        zIndex: 20,
      };
    });
  }, [graph.edges, selectedEdgeId]);

  const handleNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      if (node.type !== "attribute") return;

      const nodeData = node.data as AttributeData;
      setSelectedEdgeId(null);

      if (onTraceAttribute) {
        setSelectedAttribute(null);
        onTraceAttribute({
          systemId: nodeData.systemId,
          tableId: nodeData.tableId,
          attributeId: nodeData.attributeId,
        });
        return;
      }

      setSelectedAttribute({
        systemId: nodeData.systemId,
        tableId: nodeData.tableId,
        attributeId: nodeData.attributeId,
      });
    },
    [onTraceAttribute]
  );

  const selectedEdgeDetails = useMemo(() => {
    if (!selectedEdgeId) return null;

    const flowEdge = graph.edges.find((edge) => edge.id === selectedEdgeId);
    const payload = flowEdge?.data as FlowEdgeData | undefined;
    const edge =
      payload?.edges?.[0] ??
      data.lineageEdges.find((item) => item.id === selectedEdgeId) ??
      null;

    if (!edge) return null;

    return { edge, count: payload?.edges?.length ?? 1 };
  }, [data.lineageEdges, graph.edges, selectedEdgeId]);

  const selectedAttributeDetails = useMemo(() => {
    if (!selectedAttribute) return null;

    const table = data.tables.find(
      (item) => item.id === selectedAttribute.tableId
    );
    const attribute = table?.attributes.find(
      (item) => item.id === selectedAttribute.attributeId
    );

    if (!table || !attribute) return null;

    return { table, attribute };
  }, [data.tables, selectedAttribute]);

  const attributeLineage = useMemo<{
    incoming: LineageEdge[];
    outgoing: LineageEdge[];
  }>(() => {
    if (!selectedAttribute) return { incoming: [], outgoing: [] };

    const matches = (endpoint: LineageEndpoint) =>
      endpoint.systemId === selectedAttribute.systemId &&
      endpoint.tableId === selectedAttribute.tableId &&
      endpoint.attributeId === selectedAttribute.attributeId;

    return {
      incoming: data.lineageEdges.filter((edge) => matches(edge.target)),
      outgoing: data.lineageEdges.filter((edge) => matches(edge.source)),
    };
  }, [data.lineageEdges, selectedAttribute]);

  const traceTargetResolution = highlight
    ? resolveEndpoint(highlight.target, data)
    : null;
  const traceTargetHops = highlight
    ? (highlight.parents.get(endpointKey(highlight.target)) ?? [])
    : [];

  function renderTracePath(
    endpoint: LineageEndpoint,
    producingEdge: LineageEdge | null,
    depth: number,
    seen: ReadonlySet<string>,
    nodeKey: string
  ): ReactNode {
    if (!highlight) return null;

    const resolution = resolveEndpoint(endpoint, data);
    const idKey = endpointKey(endpoint);
    const isLoop = seen.has(idKey);

    const nextSeen = new Set(seen);
    nextSeen.add(idKey);

    const hops = isLoop ? [] : (highlight.parents.get(idKey) ?? []);
    const boundary = isLoop
      ? undefined
      : highlight.boundaries.find(
          (item) => endpointKey(item.endpoint) === idKey
        );
    const isTarget = depth === 0;

    return (
      <li key={nodeKey}>
        <div
          className={`rounded-md border p-2 ${
            boundary
              ? "border-amber-300 bg-amber-50/70"
              : isTarget
                ? "border-blue-500 bg-blue-50/70"
                : "border-slate-200 bg-white"
          }`}
        >
          <div className="flex items-start justify-between gap-2">
            <span className="min-w-0 break-all font-mono text-[11px] font-semibold text-slate-800">
              {formatQualified(endpoint, data, resolution)}
            </span>

            {producingEdge && (
              <span className="shrink-0 rounded-full bg-slate-100 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-slate-500">
                {producingEdge.status.replace(/_/g, " ")}
              </span>
            )}
          </div>

          {producingEdge && (
            <div className="mt-0.5 break-all font-mono text-[10px] text-slate-500">
              {producingEdge.transformation}
            </div>
          )}

          {isTarget &&
            resolution.kind === "resolved" &&
            resolution.attribute?.transformation && (
              <div className="mt-0.5 break-all font-mono text-[10px] text-slate-500">
                {resolution.attribute.transformation}
              </div>
            )}

          {boundary && (
            <div className="mt-0.5 text-[10px] leading-snug text-amber-700">
              {boundary.message}
            </div>
          )}

          {isLoop && (
            <div className="mt-0.5 text-[10px] text-slate-400">
              Loop detected — path stops here.
            </div>
          )}
        </div>

        {hops.length > 0 && (
          <ul className="ml-3 mt-1 space-y-1 border-l-2 border-blue-100 pl-2">
            {hops.map((hop, index) =>
              renderTracePath(
                hop.source,
                hop.edge,
                depth + 1,
                nextSeen,
                `${idKey}-${index}`
              )
            )}
          </ul>
        )}
      </li>
    );
  }

  const containerHeight = Math.max(
    650,
    Math.min(1200, graph.contentHeight + 48)
  );

  const hasDetails = Boolean(selectedEdgeDetails || selectedAttributeDetails || highlight);

  return (
    <div
      className="flex w-full gap-3 overflow-hidden rounded-lg"
      style={{ height: containerHeight }}
    >
      <div className="relative flex-1 overflow-hidden rounded-lg border border-slate-200 bg-[#fbfaf7]">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          onInit={setFlow}
          onNodeClick={handleNodeClick}
          onEdgeClick={(_, edge) => {
            setSelectedEdgeId(edge.id);
            setSelectedAttribute(null);
          }}
          onPaneClick={() => {
            setSelectedEdgeId(null);
            setSelectedAttribute(null);
            if (highlight) onClearHighlight?.();
          }}
          fitView
          fitViewOptions={{ padding: 0.12, minZoom: 0.2, maxZoom: 1.1 }}
          minZoom={0.2}
          maxZoom={1.5}
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

      {hasDetails ? (
        <>
          {selectedEdgeDetails ? (
            <SideDetailPanel
              title="Transformation details"
              onClose={() => setSelectedEdgeId(null)}
            >
          {selectedEdgeDetails.count > 1 && (
            <p className="rounded-md bg-slate-50 px-2 py-1.5 text-[11px] text-slate-500">
              {selectedEdgeDetails.count} column relationships are collapsed
              into this connection.
            </p>
          )}

          <div>
            <div className="text-xs text-slate-500">Source</div>
            <div className="font-medium">
              {formatEndpoint(
                selectedEdgeDetails.edge.source,
                data,
                resolveEndpoint(selectedEdgeDetails.edge.source, data)
              )}
            </div>
          </div>

          <div>
            <div className="text-xs text-slate-500">Target</div>
            <div className="font-medium">
              {formatEndpoint(
                selectedEdgeDetails.edge.target,
                data,
                resolveEndpoint(selectedEdgeDetails.edge.target, data)
              )}
            </div>
          </div>

          <div>
            <div className="text-xs text-slate-500">Status</div>
            <div className="font-medium capitalize">
              {selectedEdgeDetails.edge.status.replace(/_/g, " ")}
            </div>
          </div>

          <div>
            <div className="text-xs text-slate-500">Transformation</div>
            <pre className="mt-1 whitespace-pre-wrap break-words rounded-md bg-slate-100 p-3 text-xs">
              {selectedEdgeDetails.edge.transformation}
            </pre>
          </div>

          {selectedEdgeDetails.edge.description && (
            <div className="text-slate-600">
              {selectedEdgeDetails.edge.description}
            </div>
          )}

          {selectedEdgeDetails.edge.joinConditions &&
            selectedEdgeDetails.edge.joinConditions.length > 0 && (
              <div>
                <div className="text-xs text-slate-500">Join conditions</div>
                <ul className="mt-1 space-y-1">
                  {selectedEdgeDetails.edge.joinConditions.map(
                    (condition, index) => (
                      <li
                        key={`${condition.sourceTableId}-${index}`}
                        className="rounded-md bg-slate-100 px-2 py-1 font-mono text-[11px] text-slate-700"
                      >
                        {condition.sourceTableId}.{condition.sourceAttributeId}{" "}
                        {condition.operator} {condition.targetTableId}.
                        {condition.targetAttributeId}
                      </li>
                    )
                  )}
                </ul>
              </div>
            )}
            </SideDetailPanel>
          ) : selectedAttributeDetails ? (
            <SideDetailPanel
              title="Column details"
              onClose={() => setSelectedAttribute(null)}
            >
          <div className="flex items-center justify-between gap-3">
            <div className="font-mono font-medium text-ink">
              {selectedAttributeDetails.table.name}.
              {selectedAttributeDetails.attribute.name}
            </div>

            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
              {selectedAttributeDetails.attribute.dataType}
            </span>
          </div>

          <div>
            <div className="text-xs text-slate-500">Transformation</div>
            <pre className="mt-1 whitespace-pre-wrap break-words rounded-md bg-slate-100 p-3 text-xs">
              {selectedAttributeDetails.attribute.transformation ||
                "Direct source column — no transformation expression."}
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
                      {formatEndpoint(
                        edge.source,
                        data,
                        resolveEndpoint(edge.source, data)
                      )}
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
                      {formatEndpoint(
                        edge.target,
                        data,
                        resolveEndpoint(edge.target, data)
                      )}
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
            </SideDetailPanel>
          ) : highlight ? (
            <SideDetailPanel
              title="Lineage path"
              onClose={() => onClearHighlight?.()}
            >
          {highlight.incomplete && (
            <div className="rounded-md border border-amber-300 bg-amber-50 p-2.5 text-[11px] leading-snug text-amber-800">
              <span className="font-semibold">Path incomplete.</span> Upstream
              metadata is unavailable for{" "}
              {highlight.boundaries.length === 1
                ? "1 source system"
                : `${highlight.boundaries.length} source systems`}
              :
              <ul className="mt-1 list-disc space-y-0.5 pl-4">
                {highlight.boundaries.map((boundary) => (
                  <li key={endpointKey(boundary.endpoint)}>
                    <span className="font-semibold">{boundary.label}</span> —{" "}
                    {boundary.kind === "dependency"
                      ? "not connected"
                      : boundary.kind === "metadata_unavailable"
                        ? "metadata unavailable"
                        : "no metadata"}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <div className="text-xs text-slate-500">Target column</div>

            <div className="flex items-center justify-between gap-3">
              <span className="min-w-0 break-all font-mono text-xs font-bold text-blue-700">
                {traceTargetResolution
                  ? formatQualified(highlight.target, data, traceTargetResolution)
                  : highlight.target.systemId}
              </span>

              {traceTargetResolution?.kind === "resolved" &&
                traceTargetResolution.attribute && (
                  <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                    {traceTargetResolution.attribute.dataType}
                  </span>
                )}
            </div>

            {traceTargetResolution?.kind === "resolved" &&
              traceTargetResolution.attribute?.transformation && (
                <pre className="mt-1 whitespace-pre-wrap break-words rounded-md bg-slate-100 p-3 text-xs">
                  {traceTargetResolution.attribute.transformation}
                </pre>
              )}
          </div>

          <div>
            <div className="text-xs text-slate-500">
              Immediate sources ({traceTargetHops.length})
            </div>

            {traceTargetHops.length > 0 ? (
              <ul className="mt-1 space-y-1.5">
                {traceTargetHops.map((hop, index) => (
                  <li
                    key={`${endpointKey(hop.source)}-${index}`}
                    className="rounded-md border border-slate-200 p-2"
                  >
                    <div className="break-all font-mono text-xs font-semibold text-slate-800">
                      {formatQualified(
                        hop.source,
                        data,
                        resolveEndpoint(hop.source, data)
                      )}
                    </div>

                    <div className="mt-0.5 text-[11px] text-slate-500">
                      {hop.edge.description}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-1 text-[11px] text-slate-500">
                Source column — no upstream lineage.
              </p>
            )}
          </div>

          <div>
            <div className="text-xs text-slate-500">
              Complete upstream path
            </div>

            <ul className="mt-1">
              {renderTracePath(highlight.target, null, 0, new Set(), "root")}
            </ul>
          </div>

          <p className="text-[10px] text-slate-400">
            Highlighting {highlight.attributeNodeIds.size}{" "}
            {highlight.attributeNodeIds.size === 1 ? "column" : "columns"} and{" "}
            {highlight.edgeIds.size}{" "}
            {highlight.edgeIds.size === 1 ? "edge" : "edges"}.
          </p>
            </SideDetailPanel>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
