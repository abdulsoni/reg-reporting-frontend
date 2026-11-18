"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

import {
  ReactFlow,
  Background,
  Controls,
  Handle,
  Position,
  MarkerType,
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  getSmoothStepPath,
  useNodes,
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
import { layoutSideEdges, pointArrowAtTarget } from "../lib/edgeLayout";
import { mapTraceToSystemGraphHighlight } from "../lib/systemGraphHighlight";
import type {
  LineageAttribute,
  LineageData,
  LineageEdge,
  LineageEndpoint,
  LineageTable,
  LineageTraceRole,
} from "../types/lineage";
import type { DataTraceValue } from "../types/dataTrace";
import { formatTraceValue } from "../utils/dataTraceMapper";

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

const TRACE_ROLE_STYLES: Record<LineageTraceRole, string> = {
  source: "border-sky-200 bg-sky-50 text-sky-700",
  input: "border-blue-200 bg-blue-50 text-blue-700",
  intermediate: "border-violet-200 bg-violet-50 text-violet-700",
  output: "border-emerald-200 bg-emerald-50 text-emerald-700",
};

function AttributeNode({ data }: NodeProps<AttributeFlowNode>) {
  const frame = data.isTraceTarget
    ? "border-blue-600 bg-blue-50 ring-2 ring-blue-400/60"
    : data.highlighted
      ? "border-blue-400 bg-blue-50/70 ring-1 ring-blue-200"
      : data.selected
        ? "border-slate-900 bg-white ring-2 ring-slate-900/10"
        : "border-slate-300 bg-white hover:border-slate-400";

  const hasTraceValue = data.traced || data.value !== undefined;
  const valueStyle = data.traceRole
    ? TRACE_ROLE_STYLES[data.traceRole]
    : "border-slate-200 bg-slate-50 text-slate-700";
  const valueMeta = [data.hop ? `hop ${data.hop}` : null, data.recordKey]
    .filter(Boolean)
    .join(" · ");

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

      {hasTraceValue && (
        <div className="ml-2 flex shrink-0 flex-col items-end">
          <span
            className={`rounded border px-1.5 py-0.5 font-mono text-[10px] font-bold tabular-nums ${valueStyle}`}
          >
            {formatTraceValue(data.value)}
          </span>

          {valueMeta && (
            <span className="mt-0.5 max-w-[96px] truncate font-mono text-[8px] text-slate-400">
              {valueMeta}
            </span>
          )}
        </div>
      )}

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
    markerEnd,
    style,
    data,
    label,
  } = props;

  let path: string;
  let labelX = (sourceX + targetX) / 2;
  let labelY = (sourceY + targetY) / 2;

  const edgeData = data as
    | { rightSide?: boolean; sameTable?: boolean; laneOffset?: number }
    | undefined;

  if (edgeData?.rightSide || edgeData?.sameTable) {
    const laneX =
      Math.max(sourceX, targetX) + (edgeData.laneOffset ?? 36);
    path = `M ${sourceX},${sourceY} L ${laneX},${sourceY} L ${laneX},${targetY} L ${targetX},${targetY}`;

    labelX = laneX;
    labelY = (sourceY + targetY) / 2;
  } else {
    [path, labelX, labelY] = getSmoothStepPath({
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

  return (
    <>
      <BaseEdge
        id={id}
        path={path}
        markerStart={markerStart}
        markerEnd={markerEnd}
        style={style}
      />

      {label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              pointerEvents: "none",
            }}
            className="rounded-full border border-blue-200 bg-white/95 px-1.5 py-0.5 font-mono text-[9px] font-bold text-blue-700 shadow-sm"
          >
            {label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}

/**
 * Default edge for cross-system hops. It keeps the bezier look, but when the
 * straight source -> target line would run through another database it routes
 * around the blocking system nodes instead.
 */
function CrossSystemEdge(props: EdgeProps) {
  const {
    id,
    source,
    target,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    markerStart,
    markerEnd,
    style,
    label,
    labelStyle,
    labelShowBg,
    labelBgStyle,
    labelBgPadding,
    labelBgBorderRadius,
  } = props;

  const nodes = useNodes();

  let path: string;
  let labelX = (sourceX + targetX) / 2;
  let labelY = (sourceY + targetY) / 2;

  const blockers = useMemo(() => {
    const rootOf = (nodeId: string): string => {
      let node = nodes.find((item) => item.id === nodeId);

      while (node?.parentId) {
        node = nodes.find((item) => item.id === node!.parentId);
      }

      return node?.id ?? nodeId;
    };

    const own = new Set([rootOf(source), rootOf(target)]);

    return nodes
      .filter(
        (node) =>
          !node.parentId &&
          !own.has(node.id) &&
          (node.type === "system" || node.type === "dependency")
      )
      .map((node) => ({
        x: node.position.x,
        y: node.position.y,
        width:
          node.measured?.width ?? Number(node.style?.width ?? 0),
        height:
          node.measured?.height ?? Number(node.style?.height ?? 0),
      }))
      .filter((rect) => {
        // Does the straight source-to-target line pass through this node?
        for (let step = 1; step < 32; step++) {
          const t = step / 32;
          const x = sourceX + (targetX - sourceX) * t;
          const y = sourceY + (targetY - sourceY) * t;

          if (
            x > rect.x - 8 &&
            x < rect.x + rect.width + 8 &&
            y > rect.y - 8 &&
            y < rect.y + rect.height + 8
          ) {
            return true;
          }
        }

        return false;
      });
  }, [nodes, source, target, sourceX, sourceY, targetX, targetY]);

  if (blockers.length > 0) {
    // Leave the source, run above or below the blocking systems, then come
    // back into the target. The vertical runs use the gap beside the nodes.
    const top = Math.min(...blockers.map((rect) => rect.y)) - 24;
    const bottom =
      Math.max(...blockers.map((rect) => rect.y + rect.height)) + 24;
    const mid = (sourceY + targetY) / 2;
    const stagger =
      ([...id].reduce((sum, char) => sum + char.charCodeAt(0), 0) % 5) * 8;
    const detourY =
      Math.abs(top - mid) <= Math.abs(bottom - mid)
        ? top - stagger
        : bottom + stagger;
    const direction = targetX >= sourceX ? 1 : -1;
    const startX = sourceX + 18 * direction;
    const endX = targetX - 18 * direction;

    path = `M ${sourceX},${sourceY} L ${startX},${sourceY} L ${startX},${detourY} L ${endX},${detourY} L ${endX},${targetY} L ${targetX},${targetY}`;
    labelX = (sourceX + targetX) / 2;
    labelY = detourY;
  } else {
    [path, labelX, labelY] = getBezierPath({
      sourceX,
      sourceY,
      sourcePosition,
      targetX,
      targetY,
      targetPosition,
    });
  }

  return (
    <BaseEdge
      id={id}
      path={path}
      labelX={labelX}
      labelY={labelY}
      label={label}
      labelStyle={labelStyle}
      labelShowBg={labelShowBg}
      labelBgStyle={labelBgStyle}
      labelBgPadding={labelBgPadding}
      labelBgBorderRadius={labelBgBorderRadius}
      markerStart={markerStart}
      markerEnd={markerEnd}
      style={style}
    />
  );
}

const nodeTypes = {
  system: SystemNode,
  dependency: DependencyNode,
  table: TableNode,
  attribute: AttributeNode,
};

const edgeTypes = {
  lineage: ExpandedLineageEdge,
  default: CrossSystemEdge,
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

/** How many relationships to list per direction before collapsing the rest. */
const HOVER_CARD_LIMIT = 3;

type AttributeHoverCardProps = {
  data: LineageData;
  systemLabel: string;
  table: LineageTable;
  attribute: LineageAttribute;
  incoming: LineageEdge[];
  outgoing: LineageEdge[];
  /** endpointKey(endpoint) → value recorded for that column in the trace. */
  values: Map<string, string>;
  x: number;
  y: number;
};

/**
 * Read-only card shown while the pointer rests on an attribute node. It is
 * pointer-events-none and rendered in a portal so it never blocks the graph and
 * closes as soon as the pointer leaves the node.
 */
function AttributeHoverCard({
  data,
  systemLabel,
  table,
  attribute,
  incoming,
  outgoing,
  values,
  x,
  y,
}: AttributeHoverCardProps) {
  const attributeValue =
    values.get(
      endpointKey({
        systemId: table.systemId,
        tableId: table.id,
        attributeId: attribute.id,
      })
    ) ?? formatTraceValue(attribute.value);
  const transformationValue =
    attributeValue || formatTraceValue(incoming[0]?.trace?.output);
  const valueStyle = attribute.traceRole
    ? TRACE_ROLE_STYLES[attribute.traceRole]
    : "border-slate-200 bg-slate-50 text-slate-700";

  const renderRelationships = (
    edges: LineageEdge[],
    direction: "incoming" | "outgoing",
    emptyLabel: string
  ) => {
    if (edges.length === 0) {
      return (
        <div className="mt-0.5 text-[10px] text-slate-500">{emptyLabel}</div>
      );
    }

    const visible = edges.slice(0, HOVER_CARD_LIMIT);
    const hidden = edges.length - visible.length;

    return (
      <>
        <ul className="mt-0.5 space-y-1">
          {visible.map((edge) => {
            const endpoint =
              direction === "incoming" ? edge.source : edge.target;
            const tone =
              direction === "incoming"
                ? "border-sky-100 bg-sky-50/70 text-sky-800"
                : "border-emerald-100 bg-emerald-50/70 text-emerald-800";
            const resolution = resolveEndpoint(endpoint, data);
            const endpointAttribute =
              resolution.kind === "resolved" ? resolution.attribute : null;
            const endpointValue = values.get(endpointKey(endpoint)) ?? "";
            const endpointValueStyle = endpointAttribute?.traceRole
              ? TRACE_ROLE_STYLES[endpointAttribute.traceRole]
              : "border-slate-200 bg-white text-slate-700";

            return (
              <li
                key={edge.id}
                className={`rounded-md border px-2 py-1 ${tone}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 break-all font-mono text-[10px] font-semibold">
                    {formatQualified(endpoint, data, resolution)}
                  </div>

                  {endpointValue && (
                    <span
                      className={`shrink-0 rounded border px-1 py-0.5 font-mono text-[9px] font-bold tabular-nums ${endpointValueStyle}`}
                    >
                      {endpointValue}
                    </span>
                  )}
                </div>

                {edge.transformation && (
                  <div className="mt-0.5 break-words font-mono text-[9px] opacity-80">
                    {edge.transformation}
                  </div>
                )}
              </li>
            );
          })}
        </ul>

        {hidden > 0 && (
          <div className="mt-0.5 font-mono text-[9px] text-slate-400">
            +{hidden} more {direction === "incoming" ? "source" : "target"}
            {hidden === 1 ? "" : "s"}
          </div>
        )}
      </>
    );
  };

  return createPortal(
    <div
      role="tooltip"
      className="pointer-events-none fixed z-50 w-[360px] max-w-[calc(100vw-24px)] rounded-xl border border-slate-200 bg-white p-3 text-left shadow-2xl ring-1 ring-slate-900/5"
      style={{ left: x, top: y }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate font-mono text-[10px] font-bold uppercase tracking-wide text-slate-500">
            {systemLabel}
          </div>
          <div className="truncate font-mono text-xs font-bold text-slate-900">
            {table.name}.{attribute.name}
          </div>
        </div>

        <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 font-mono text-[10px] font-semibold text-slate-600">
          {attribute.dataType}
        </span>
      </div>

      <div className="mt-2">
        <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
          Transformation
        </div>
        <div className="mt-0.5 break-words rounded-md bg-slate-50 px-2 py-1.5 font-mono text-[10px] leading-snug text-slate-700">
          {attribute.transformation ||
            incoming[0]?.transformation ||
            "Direct source column — no transformation expression."}
        </div>

        {transformationValue && (
          <div className="mt-1 flex items-center justify-end gap-1.5">
            <span className="font-mono text-[9px] uppercase tracking-wide text-slate-400">
              value
            </span>
            <span className="rounded border border-slate-200 bg-white px-1.5 py-0.5 font-mono text-[10px] font-bold tabular-nums text-slate-700">
              {transformationValue}
            </span>
          </div>
        )}
      </div>

      <div className="mt-2">
        <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
          Input system
        </div>
        {renderRelationships(
          incoming,
          "incoming",
          "Source system — no upstream attribute."
        )}
      </div>

      <div className="mt-2">
        <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
          Output system
        </div>
        {renderRelationships(
          outgoing,
          "outgoing",
          "No downstream consumer."
        )}
      </div>

      {attributeValue && (
        <div className="mt-2 flex items-center justify-between gap-2 rounded-md border border-blue-100 bg-blue-50/60 p-2">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-blue-700/70">
            Value
          </span>
          <span
            className={`rounded border px-1.5 py-0.5 font-mono text-[11px] font-bold tabular-nums ${valueStyle}`}
          >
            {attributeValue}
          </span>
        </div>
      )}
    </div>,
    document.body
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
  traced?: boolean;
  hop?: string;
  output?: DataTraceValue;
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
  showPathDetails = true,
  showEdgeLabels = true,
}: {
  data: LineageData;
  expandedSystemIds: string[];
  expandedTableIds: string[];
  highlight?: UpstreamTrace | null;
  onToggleSystem: (systemId: string) => void;
  onToggleTable: (tableId: string) => void;
  onTraceAttribute?: (target: LineageEndpoint) => void;
  onClearHighlight?: () => void;
  showPathDetails?: boolean;
  /** Hide the "hop · value" text drawn on top of the edges. */
  showEdgeLabels?: boolean;
}) {
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [selectedAttribute, setSelectedAttribute] =
    useState<SelectedAttribute | null>(null);
  const [hoveredAttribute, setHoveredAttribute] =
    useState<SelectedAttribute | null>(null);
  const [hoverPoint, setHoverPoint] = useState<{ x: number; y: number } | null>(
    null
  );
  const [flow, setFlow] = useState<ReactFlowInstance | null>(null);

  const clearHover = useCallback(() => {
    setHoveredAttribute(null);
    setHoverPoint(null);
  }, []);

  const resetSelection = useCallback(() => {
    setSelectedEdgeId(null);
    setSelectedAttribute(null);
    clearHover();
  }, [clearHover]);

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

  /**
   * Values recorded for individual columns during the data trace. Hop outputs
   * cover the traced column itself; hop inputs cover every column it read, so
   * both sides of a relationship get a value even when the metadata attribute
   * does not carry one.
   */
  const endpointValues = useMemo(() => {
    const values = new Map<string, string>();

    const remember = (
      endpoint: LineageEndpoint,
      value: DataTraceValue | undefined
    ) => {
      const formatted = formatTraceValue(value);
      if (!formatted) return;

      const key = endpointKey(endpoint);
      if (!values.has(key)) values.set(key, formatted);
    };

    for (const hop of data.trace?.hops ?? []) {
      remember(
        {
          systemId: hop.systemId,
          tableId: hop.tableId,
          attributeId: hop.attributeId,
        },
        hop.output
      );

      for (const input of hop.inputs) {
        remember(
          {
            systemId: input.systemId,
            tableId: input.tableId,
            attributeId: input.attributeId,
          },
          input.value
        );
      }
    }

    for (const table of data.tables) {
      for (const attribute of table.attributes) {
        remember(
          {
            systemId: table.systemId,
            tableId: table.id,
            attributeId: attribute.id,
          },
          attribute.value
        );
      }
    }

    for (const edge of data.lineageEdges) {
      remember(edge.source, edge.trace?.output);
    }

    return values;
  }, [data]);

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

  const baseEdges = useMemo<Edge[]>(
    () =>
      layoutSideEdges(
        graph.nodes,
        graph.edges
          .map(pointArrowAtTarget)
          .map((edge) =>
            showEdgeLabels ? edge : { ...edge, label: undefined }
          )
      ),
    [graph.nodes, graph.edges, showEdgeLabels]
  );

  const edges = useMemo<Edge[]>(() => {
    if (!selectedEdgeId) return baseEdges;

    return baseEdges.map((edge) => {
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
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 14,
          height: 14,
          color: "#0f172a",
        },
        zIndex: 20,
      };
    });
  }, [baseEdges, selectedEdgeId]);

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

  const handleNodeMouseEnter = useCallback(
    (event: React.MouseEvent, node: Node) => {
      if (node.type !== "attribute") return;

      const nodeData = node.data as AttributeData;
      const cardWidth = 372;
      const cardHeight = 420;
      const margin = 12;

      setHoveredAttribute({
        systemId: nodeData.systemId,
        tableId: nodeData.tableId,
        attributeId: nodeData.attributeId,
      });
      setHoverPoint({
        x: Math.max(
          margin,
          Math.min(event.clientX + 18, window.innerWidth - cardWidth - margin)
        ),
        y: Math.max(
          margin,
          Math.min(
            event.clientY + 18,
            window.innerHeight - cardHeight - margin
          )
        ),
      });
    },
    []
  );

  const handleNodeMouseLeave = useCallback(
    (_: React.MouseEvent, node: Node) => {
      if (node.type !== "attribute") return;

      clearHover();
    },
    [clearHover]
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

  const describeAttribute = useCallback(
    (target: SelectedAttribute | null) => {
      if (!target) return null;

      const table = data.tables.find((item) => item.id === target.tableId);
      const attribute = table?.attributes.find(
        (item) => item.id === target.attributeId
      );

      if (!table || !attribute) return null;

      return { table, attribute };
    },
    [data.tables]
  );

  const lineageForAttribute = useCallback(
    (
      target: SelectedAttribute | null
    ): { incoming: LineageEdge[]; outgoing: LineageEdge[] } => {
      if (!target) return { incoming: [], outgoing: [] };

      const matches = (endpoint: LineageEndpoint) =>
        endpoint.systemId === target.systemId &&
        endpoint.tableId === target.tableId &&
        endpoint.attributeId === target.attributeId;

      return {
        incoming: data.lineageEdges.filter((edge) => matches(edge.target)),
        outgoing: data.lineageEdges.filter((edge) => matches(edge.source)),
      };
    },
    [data.lineageEdges]
  );

  const selectedAttributeDetails = useMemo(
    () => describeAttribute(selectedAttribute),
    [describeAttribute, selectedAttribute]
  );

  const attributeLineage = useMemo(
    () => lineageForAttribute(selectedAttribute),
    [lineageForAttribute, selectedAttribute]
  );

  const hoveredAttributeDetails = useMemo(
    () => describeAttribute(hoveredAttribute),
    [describeAttribute, hoveredAttribute]
  );

  const hoveredAttributeLineage = useMemo(
    () => lineageForAttribute(hoveredAttribute),
    [lineageForAttribute, hoveredAttribute]
  );

  /* Hide the card if the hovered node is no longer on the canvas (e.g. its
   * table was collapsed) without mutating state during render. */
  const hoveredNodeVisible = useMemo(() => {
    if (!hoveredAttribute) return false;

    return graph.nodes.some(
      (node) =>
        node.type === "attribute" &&
        (node.data as AttributeData).systemId === hoveredAttribute.systemId &&
        (node.data as AttributeData).tableId === hoveredAttribute.tableId &&
        (node.data as AttributeData).attributeId ===
          hoveredAttribute.attributeId
    );
  }, [graph.nodes, hoveredAttribute]);

  const traceTargetResolution = highlight
    ? resolveEndpoint(highlight.target, data)
    : null;
  const traceTargetHops = highlight
    ? (highlight.parents.get(endpointKey(highlight.target)) ?? [])
    : [];
  const dataTraceReconciliation =
    highlight &&
    data.trace &&
    data.trace.focus.systemId === highlight.target.systemId &&
    data.trace.focus.tableId === highlight.target.tableId &&
    data.trace.focus.attributeId === highlight.target.attributeId
      ? data.trace.reconciliation
      : null;

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

          {resolution.kind === "resolved" &&
            resolution.attribute &&
            (resolution.attribute.traced ||
              resolution.attribute.value !== undefined) && (
              <div className="mt-1 flex flex-wrap items-center gap-1.5">
                <span
                  className={`rounded border px-1.5 py-0.5 font-mono text-[10px] font-bold tabular-nums ${
                    resolution.attribute.traceRole
                      ? TRACE_ROLE_STYLES[resolution.attribute.traceRole]
                      : "border-slate-200 bg-slate-50 text-slate-700"
                  }`}
                >
                  {formatTraceValue(resolution.attribute.value)}
                </span>

                {resolution.attribute.hop && (
                  <span className="font-mono text-[9px] text-slate-400">
                    hop {resolution.attribute.hop}
                  </span>
                )}

                {resolution.attribute.recordKey && (
                  <span className="font-mono text-[9px] text-slate-400">
                    {resolution.attribute.recordKey}
                  </span>
                )}
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
          onNodeMouseEnter={handleNodeMouseEnter}
          onNodeMouseLeave={handleNodeMouseLeave}
          onMoveStart={clearHover}
          onEdgeClick={(_, edge) => {
            setSelectedEdgeId(edge.id);
            setSelectedAttribute(null);
          }}
          onPaneClick={() => {
            setSelectedEdgeId(null);
            setSelectedAttribute(null);
            clearHover();
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

        {hoveredAttribute &&
          hoveredNodeVisible &&
          hoveredAttributeDetails &&
          hoverPoint && (
            <AttributeHoverCard
              data={data}
              systemLabel={
                data.systems.find(
                  (item) => item.id === hoveredAttribute.systemId
                )?.label ?? hoveredAttribute.systemId
              }
              table={hoveredAttributeDetails.table}
              attribute={hoveredAttributeDetails.attribute}
              incoming={hoveredAttributeLineage.incoming}
              outgoing={hoveredAttributeLineage.outgoing}
              values={endpointValues}
              x={hoverPoint.x}
              y={hoverPoint.y}
            />
          )}
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

          {selectedEdgeDetails.edge.trace && (
            <div>
              <div className="text-xs text-slate-500">Traced values</div>
              <div className="mt-1 space-y-1 rounded-md border border-blue-100 bg-blue-50/60 p-2.5 text-[11px] text-slate-700">
                <div className="flex items-center justify-between gap-2">
                  <span>Hop</span>
                  <span className="font-mono font-semibold text-blue-700">
                    {selectedEdgeDetails.edge.trace.hop}
                  </span>
                </div>

                <div className="flex items-start justify-between gap-2">
                  <span>Inputs</span>
                  <span className="text-right font-mono">
                    {selectedEdgeDetails.edge.trace.inputs.length > 0
                      ? selectedEdgeDetails.edge.trace.inputs
                          .map(formatTraceValue)
                          .join(", ")
                      : "—"}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <span>Output</span>
                  <span className="font-mono font-semibold text-emerald-700">
                    {formatTraceValue(selectedEdgeDetails.edge.trace.output)}
                  </span>
                </div>

                {selectedEdgeDetails.edge.trace.aggregation && (
                  <div className="flex items-start justify-between gap-2">
                    <span>Aggregation</span>
                    <span className="text-right font-mono">
                      {selectedEdgeDetails.edge.trace.aggregation}
                    </span>
                  </div>
                )}
              </div>
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

          {(selectedAttributeDetails.attribute.traced ||
            selectedAttributeDetails.attribute.value !== undefined) && (
            <div>
              <div className="text-xs text-slate-500">Traced value</div>
              <div className="mt-1 space-y-1 rounded-md border border-blue-100 bg-blue-50/60 p-2.5 text-[11px] text-slate-700">
                <div className="flex items-center justify-between gap-2">
                  <span>Value</span>
                  <span className="font-mono text-sm font-bold text-blue-700">
                    {formatTraceValue(selectedAttributeDetails.attribute.value)}
                  </span>
                </div>

                {selectedAttributeDetails.attribute.recordKey && (
                  <div className="flex items-center justify-between gap-2">
                    <span>Record key</span>
                    <span className="font-mono">
                      {selectedAttributeDetails.attribute.recordKey}
                    </span>
                  </div>
                )}

                {selectedAttributeDetails.attribute.hop && (
                  <div className="flex items-center justify-between gap-2">
                    <span>Hop</span>
                    <span className="font-mono">
                      {selectedAttributeDetails.attribute.hop}
                    </span>
                  </div>
                )}

                {selectedAttributeDetails.attribute.traceRole && (
                  <div className="flex items-center justify-between gap-2">
                    <span>Role</span>
                    <span className="capitalize">
                      {selectedAttributeDetails.attribute.traceRole}
                    </span>
                  </div>
                )}

                {selectedAttributeDetails.attribute.traceStatus && (
                  <div className="flex items-center justify-between gap-2">
                    <span>Status</span>
                    <span>{selectedAttributeDetails.attribute.traceStatus}</span>
                  </div>
                )}
              </div>
            </div>
          )}

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
          ) : showPathDetails && highlight ? (
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

            {traceTargetResolution?.kind === "resolved" &&
              traceTargetResolution.attribute &&
              (traceTargetResolution.attribute.traced ||
                traceTargetResolution.attribute.value !== undefined) && (
                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                  <span
                    className={`rounded border px-1.5 py-0.5 font-mono text-[11px] font-bold tabular-nums ${
                      traceTargetResolution.attribute.traceRole
                        ? TRACE_ROLE_STYLES[
                            traceTargetResolution.attribute.traceRole
                          ]
                        : "border-slate-200 bg-slate-50 text-slate-700"
                    }`}
                  >
                    {formatTraceValue(traceTargetResolution.attribute.value)}
                  </span>

                  {traceTargetResolution.attribute.hop && (
                    <span className="font-mono text-[9px] text-slate-400">
                      hop {traceTargetResolution.attribute.hop}
                    </span>
                  )}

                  {traceTargetResolution.attribute.recordKey && (
                    <span className="font-mono text-[9px] text-slate-400">
                      {traceTargetResolution.attribute.recordKey}
                    </span>
                  )}
                </div>
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

          {dataTraceReconciliation && (
            <div>
              <div className="text-xs text-slate-500">Value reconciliation</div>
              <div className="mt-1 space-y-1 rounded-md border border-blue-100 bg-blue-50/60 p-2.5 text-[11px] text-slate-700">
                <div className="flex items-center justify-between gap-2">
                  <span>Reported value</span>
                  <span className="font-mono font-semibold text-blue-700">
                    {formatTraceValue(dataTraceReconciliation.reportedValue)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span>Calculated value</span>
                  <span className="font-mono font-semibold text-emerald-700">
                    {formatTraceValue(dataTraceReconciliation.calculatedValue)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span>Variance</span>
                  <span className="font-mono">
                    {formatTraceValue(dataTraceReconciliation.variance)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span>Result</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      dataTraceReconciliation.result === "Match"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {dataTraceReconciliation.result}
                  </span>
                </div>
              </div>
            </div>
          )}

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
