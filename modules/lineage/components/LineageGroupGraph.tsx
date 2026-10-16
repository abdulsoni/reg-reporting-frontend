"use client";

import { useMemo, useState } from "react";

import {
  ReactFlow,
  Background,
  Controls,
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
import { AlertTriangle, ExternalLink, PlugZap } from "lucide-react";

import type {
  LineageAttribute,
  LineageData,
  LineageEdge,
  LineageEndpoint,
} from "../types/lineage";

import {
  buildTableGraph,
  computeDagreLayout,
  externalSystemNodeId,
  resolveEndpoint,
  tableEndpointAttributeNodeId,
  tableEndpointNodeId,
  type TableGraphExternalKind,
} from "../data/systemLineageAdapter";

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
      className={`flex h-full w-full cursor-pointer items-center rounded-md border bg-white px-3 shadow-sm transition-colors ${
        data.selected
          ? "border-slate-900 ring-2 ring-slate-900/10"
          : "border-slate-300 hover:border-slate-400"
      }`}
    >
      <Handle
        id={`${id.split(".").pop()}-in`}
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

      <Handle
        id={`${id.split(".").pop()}-out`}
        type="source"
        position={Position.Right}
        className="!h-[7px] !w-[7px] !border-2 !border-slate-500 !bg-white"
      />

      <Handle
        id={`${id.split(".").pop()}-right-target`}
        type="target"
        position={Position.Right}
        className="!h-[7px] !w-[7px] !border-2 !border-slate-500 !bg-white"
      />
    </div>
  );
}

type PlaceholderNodeData = {
  label: string;
  message: string;
  kind: TableGraphExternalKind;
  onSelect?: () => void;
};

type PlaceholderNode = Node<PlaceholderNodeData, "placeholder">;

const PLACEHOLDER_STYLES: Record<
  TableGraphExternalKind,
  { frame: string; iconBox: string; icon: typeof PlugZap; label: string; text: string }
> = {
  connected: {
    frame: "border-sky-300 bg-sky-50/70",
    iconBox: "bg-sky-100",
    icon: ExternalLink,
    label: "text-sky-800",
    text: "text-sky-700",
  },
  dependency: {
    frame: "border-amber-400 border-dashed bg-amber-50/70",
    iconBox: "bg-amber-100",
    icon: PlugZap,
    label: "text-amber-800",
    text: "text-amber-700",
  },
  metadata: {
    frame: "border-slate-400 border-dashed bg-slate-100",
    iconBox: "bg-slate-200",
    icon: AlertTriangle,
    label: "text-slate-700",
    text: "text-slate-600",
  },
};

function PlaceholderField({ data }: NodeProps<PlaceholderNode>) {
  const style = PLACEHOLDER_STYLES[data.kind];
  const Icon = style.icon;
  const interactive = Boolean(data.onSelect);

  return (
    <div
      onClick={
        interactive
          ? (event) => {
              event.stopPropagation();
              data.onSelect?.();
            }
          : undefined
      }
      className={`flex h-full w-full items-center gap-3 rounded-md border px-3 shadow-sm transition ${
        style.frame
      } ${interactive ? "cursor-pointer hover:shadow-md hover:ring-2 hover:ring-sky-200" : ""}`}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!h-[7px] !w-[7px] !border-2 !border-slate-500 !bg-white"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!h-[7px] !w-[7px] !border-2 !border-slate-500 !bg-white"
      />

      <div className={`rounded-md p-2 ${style.iconBox}`}>
        <Icon size={18} className={style.label} />
      </div>

      <div className="min-w-0 flex-1">
        <div
          className={`truncate font-mono text-[10px] font-bold uppercase ${style.label}`}
        >
          {data.label}
        </div>
        <div className={`mt-1 text-[10px] leading-snug ${style.text}`}>
          {data.message}
        </div>
      </div>
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
  placeholder: PlaceholderField,
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

function formatEndpoint(
  endpoint: LineageEndpoint,
  data: LineageData,
  resolution: ReturnType<typeof resolveEndpoint>,
  open: ReadonlySet<string>
): string {
  if (resolution.kind === "resolved") {
    const owner =
      open.has(endpoint.systemId)
        ? resolution.table.name
        : data.systems.find((system) => system.id === endpoint.systemId)?.label ??
          endpoint.systemId;

    return endpoint.attributeId ? `${owner}.${endpoint.attributeId}` : owner;
  }

  if (resolution.kind === "dependency") {
    return `${resolution.dependency.systemName} (not connected)`;
  }

  if (resolution.kind === "metadata_unavailable") {
    return `${resolution.system.label} (metadata ${resolution.system.metadataStatus})`;
  }

  return endpoint.systemId;
}

export default function LineageGroupGraph({
  data,
  openSystemIds,
  onExpandSystem,
}: {
  data: LineageData;
  openSystemIds: string[];
  onExpandSystem?: (systemId: string) => void;
}) {
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [selectedAttributeId, setSelectedAttributeId] = useState<string | null>(
    null
  );

  const open = useMemo(() => new Set(openSystemIds), [openSystemIds]);
  const graph = useMemo(
    () => buildTableGraph(data, openSystemIds),
    [data, openSystemIds]
  );

  function clearSelection() {
    setSelectedEdgeId(null);
    setSelectedAttributeId(null);
  }

  const layoutPositions = useMemo(() => {
    const sizedNodes = [
      ...graph.tables.map((table) => ({
        id: table.id,
        width: 300,
        height: 72 + table.attributes.length * 64,
      })),
      ...graph.externals.map((external) => ({
        id: externalSystemNodeId(external.systemId),
        width: 240,
        height: 96,
      })),
    ];

    const seen = new Set<string>();
    const layoutEdges: Array<{ source: string; target: string }> = [];

    for (const edge of graph.edges) {
      const sourceId = tableEndpointNodeId(
        edge.source,
        resolveEndpoint(edge.source, data),
        open
      );
      const targetId = tableEndpointNodeId(
        edge.target,
        resolveEndpoint(edge.target, data),
        open
      );

      if (!sourceId || !targetId || sourceId === targetId) continue;

      const key = `${sourceId}->${targetId}`;
      if (seen.has(key)) continue;
      seen.add(key);
      layoutEdges.push({ source: sourceId, target: targetId });
    }

    return computeDagreLayout(sizedNodes, layoutEdges, {
      rankdir: "LR",
      nodesep: 70,
      ranksep: 140,
    });
  }, [data, graph, open]);

  const nodes = useMemo(() => {
    const groupNodes: LineageGroupNode[] = graph.tables.map((table) => ({
      id: table.id,
      type: "lineageGroup",
      position: layoutPositions[table.id] ?? { x: 0, y: 0 },
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

    const attributeNodes: AttributeNode[] = graph.tables.flatMap((table) =>
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

    const placeholderNodes: PlaceholderNode[] = graph.externals.map(
      (external) => ({
        id: externalSystemNodeId(external.systemId),
        type: "placeholder" as const,
        position: layoutPositions[externalSystemNodeId(external.systemId)] ?? {
          x: 0,
          y: 0,
        },
        style: { width: 240, height: 96 },
        data: {
          label: external.label,
          message: external.message,
          kind: external.kind,
          onSelect:
            external.kind === "connected" && onExpandSystem
              ? () => onExpandSystem(external.systemId)
              : undefined,
        },
        selectable: false,
      })
    );

    return [...groupNodes, ...attributeNodes, ...placeholderNodes];
  }, [graph, layoutPositions, selectedAttributeId, onExpandSystem]);

  const edges = useMemo<Edge[]>(() => {
    const result: Edge[] = [];

    for (const item of graph.edges) {
      const sourceResolution = resolveEndpoint(item.source, data);
      const targetResolution = resolveEndpoint(item.target, data);

      const sourceAttrId = tableEndpointAttributeNodeId(
        item.source,
        sourceResolution,
        open
      );
      const targetAttrId = tableEndpointAttributeNodeId(
        item.target,
        targetResolution,
        open
      );

      const sourceId =
        sourceAttrId ??
        tableEndpointNodeId(item.source, sourceResolution, open);
      const targetId =
        targetAttrId ??
        tableEndpointNodeId(item.target, targetResolution, open);

      if (!sourceId || !targetId) continue;

      const selected = item.id === selectedEdgeId;
      const isSameTable = item.source.tableId === item.target.tableId;

      result.push({
        id: item.id,
        source: sourceId,
        sourceHandle: sourceAttrId ? `${item.source.attributeId}-out` : undefined,
        target: targetId,
        targetHandle: targetAttrId
          ? isSameTable
            ? `${item.target.attributeId}-right-target`
            : `${item.target.attributeId}-in`
          : undefined,
        type: isSameTable ? "lineage" : undefined,
        data: { ...item, sameTable: isSameTable },
        animated: selected,
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 14,
          height: 14,
          color: selected ? "#0f172a" : "#64748b",
        },
        style: {
          stroke: selected ? "#0f172a" : "#64748b",
          strokeWidth: selected ? 3 : 1.7,
          opacity: selectedEdgeId && !selected ? 0.25 : 1,
        },
        zIndex: selected ? 10 : 1,
      });
    }

    return result;
  }, [data, graph, open, selectedEdgeId]);

  const selectedEdge = useMemo(
    () => graph.edges.find((item) => item.id === selectedEdgeId) ?? null,
    [graph, selectedEdgeId]
  );

  const selectedAttribute = useMemo(() => {
    if (!selectedAttributeId) return null;

    const separator = selectedAttributeId.lastIndexOf(".");
    const tableId = selectedAttributeId.slice(0, separator);
    const attributeId = selectedAttributeId.slice(separator + 1);

    const table = graph.tables.find((item) => item.id === tableId);
    const attribute = table?.attributes.find((item) => item.id === attributeId);

    if (!table || !attribute) return null;

    return { ...attribute, table: table.name };
  }, [graph, selectedAttributeId]);

  const attributeLineage = useMemo<{
    incoming: LineageEdge[];
    outgoing: LineageEdge[];
  }>(() => {
    if (!selectedAttributeId) return { incoming: [], outgoing: [] };

    const nodeIdFor = (endpoint: LineageEndpoint) =>
      tableEndpointAttributeNodeId(
        endpoint,
        resolveEndpoint(endpoint, data),
        open
      );

    return {
      incoming: graph.edges.filter(
        (edge) => nodeIdFor(edge.target) === selectedAttributeId
      ),
      outgoing: graph.edges.filter(
        (edge) => nodeIdFor(edge.source) === selectedAttributeId
      ),
    };
  }, [data, graph, open, selectedAttributeId]);

  return (
    <div className="relative h-[780px] w-full overflow-hidden rounded-lg border border-slate-200 bg-[#fbfaf7]">
      <ReactFlow
        key={openSystemIds.join("|")}
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
        fitViewOptions={{ padding: 0.12 }}
        minZoom={0.25}
        maxZoom={1.5}
        nodesConnectable={false}
        proOptions={{ hideAttribution: true }}
        className="bg-[#fbfaf7]"
      >
        <Background color="#e5e2da" gap={22} size={1} />

        <Controls showInteractive={false} position="bottom-left" />
      </ReactFlow>

      {selectedEdge ? (
        <DetailPanel
          title="Transformation details"
          onClose={() => setSelectedEdgeId(null)}
        >
          <div>
            <div className="text-xs text-slate-500">Source</div>
            <div className="font-medium">
              {formatEndpoint(
                selectedEdge.source,
                data,
                resolveEndpoint(selectedEdge.source, data),
                open
              )}
            </div>
          </div>

          <div>
            <div className="text-xs text-slate-500">Target</div>
            <div className="font-medium">
              {formatEndpoint(
                selectedEdge.target,
                data,
                resolveEndpoint(selectedEdge.target, data),
                open
              )}
            </div>
          </div>

          <div>
            <div className="text-xs text-slate-500">Status</div>
            <div className="font-medium capitalize">
              {selectedEdge.status.replace(/_/g, " ")}
            </div>
          </div>

          <div>
            <div className="text-xs text-slate-500">Transformation</div>
            <pre className="mt-1 whitespace-pre-wrap break-words rounded-md bg-slate-100 p-3 text-xs">
              {selectedEdge.transformation}
            </pre>
          </div>

          {selectedEdge.description && (
            <div className="text-slate-600">{selectedEdge.description}</div>
          )}

          {selectedEdge.joinConditions && selectedEdge.joinConditions.length > 0 && (
            <div>
              <div className="text-xs text-slate-500">Join conditions</div>
              <ul className="mt-1 space-y-1">
                {selectedEdge.joinConditions.map((condition, index) => (
                  <li
                    key={`${condition.sourceTableId}-${index}`}
                    className="rounded-md bg-slate-100 px-2 py-1 font-mono text-[11px] text-slate-700"
                  >
                    {condition.sourceTableId}.{condition.sourceAttributeId}{" "}
                    {condition.operator} {condition.targetTableId}.
                    {condition.targetAttributeId}
                  </li>
                ))}
              </ul>
            </div>
          )}
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
                      {formatEndpoint(
                        edge.source,
                        data,
                        resolveEndpoint(edge.source, data),
                        open
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
                        resolveEndpoint(edge.target, data),
                        open
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
        </DetailPanel>
      ) : null}
    </div>
  );
}
