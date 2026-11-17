"use client";

import { useMemo, useState } from "react";
import {
  Background,
  Controls,
  Handle,
  MarkerType,
  Position,
  ReactFlow,
  type Edge,
  type Node,
  type NodeProps,
} from "@xyflow/react";
import {
  CheckCircle2,
  CircleAlert,
  Clock3,
  Database,
  FileText,
} from "lucide-react";

import type { LineageRow } from "./data-lineage/types";
import type {
  DataTraceReconciliation,
  DataTraceResponse,
} from "../types/dataTrace";
import { formatTraceValue } from "../utils/dataTraceMapper";

type Mode = "system" | "data";

type Palette = { border: string; bg: string; text: string };

/* Colors are assigned to each system hop in order of first appearance. */
const PALETTE: Palette[] = [
  { border: "#3b82f6", bg: "#eff6ff", text: "#1d4ed8" },
  { border: "#10b981", bg: "#ecfdf5", text: "#047857" },
  { border: "#f59e0b", bg: "#fffbeb", text: "#b45309" },
  { border: "#8b5cf6", bg: "#f5f3ff", text: "#6d28d9" },
  { border: "#ec4899", bg: "#fdf2f8", text: "#be185d" },
  { border: "#14b8a6", bg: "#f0fdfa", text: "#0f766e" },
];

const NODE_W = 250;
const GAP_X = 28;
const GAP_Y = 52;
const NODE_H: Record<Mode, number> = { system: 128, data: 188 };

const ROOT_ID = "root";

type HopData = { row: LineageRow; mode: Mode; color: Palette };
type RootData = {
  trace: DataTraceResponse;
  reconciliation?: DataTraceReconciliation | null;
  mode: Mode;
};

type HopFlowNode = Node<HopData, "hop">;
type RootFlowNode = Node<RootData, "root">;

const handleStyle = {
  width: 7,
  height: 7,
  background: "#fff",
  border: "2px solid #64748b",
} as const;

const oneLine = (value: string) => value.replace(/\s+/g, " ").trim() || "—";

const clamp2 = {
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
} as const;

function StatusPill({ value }: { value: LineageRow["status"] }) {
  const style =
    value === "Verified"
      ? "bg-emerald-50 text-emerald-700 border-emerald-100"
      : value === "Discovering"
        ? "bg-amber-50 text-amber-800 border-amber-200"
        : "bg-rose-50 text-rose-700 border-rose-100";
  const Icon =
    value === "Verified"
      ? CheckCircle2
      : value === "Discovering"
        ? Clock3
        : CircleAlert;

  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-1.5 py-0.5 text-[9px] font-semibold ${style}`}
    >
      <Icon size={10} />
      {value}
    </span>
  );
}

function ReconciliationBadge({ result }: { result: string }) {
  const style =
    result === "Match"
      ? "bg-emerald-100 text-emerald-700"
      : result === "Mismatch"
        ? "bg-rose-100 text-rose-700"
        : "bg-amber-100 text-amber-800";

  return (
    <span
      className={`shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-bold ${style}`}
    >
      {result}
    </span>
  );
}

function HopNode({ data }: NodeProps<HopFlowNode>) {
  const { row, mode, color } = data;

  return (
    <div
      className="flex h-full w-full flex-col overflow-hidden rounded-lg px-3 py-2 shadow-sm"
      style={{
        background: color.bg,
        border: `1.5px solid ${color.border}`,
      }}
    >
      <Handle
        type="target"
        position={Position.Top}
        style={handleStyle}
        isConnectable={false}
      />

      <div className="flex items-center gap-2">
        <span
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white"
          style={{ color: color.text }}
        >
          <Database size={13} />
        </span>

        <div className="min-w-0 flex-1">
          <div
            className="truncate font-mono text-[11px] font-bold uppercase leading-tight"
            style={{ color: color.text }}
            title={row.system}
          >
            {row.system}
          </div>
          <div className="truncate text-[9px] leading-tight text-slate-500">
            {row.systemLabel}
          </div>
        </div>

        <span
          className="shrink-0 rounded bg-white px-1.5 py-0.5 font-mono text-[9px] font-bold"
          style={{ color: color.text }}
        >
          Hop {row.systemHop}
        </span>
      </div>

      <div className="mt-1.5 space-y-0.5 text-[10px] leading-tight text-slate-600">
        <div className="truncate" title={row.table}>
          <span className="text-slate-400">Table: </span>
          {row.table}
        </div>
        <div className="truncate" title={row.attribute}>
          <span className="text-slate-400">Attribute: </span>
          <span className="font-semibold text-slate-800">{row.attribute}</span>
        </div>
      </div>

      {row.transformation && row.transformation !== "—" && (
        <div
          className="mt-1 font-mono text-[9px] leading-snug text-slate-500"
          style={clamp2}
          title={row.transformation}
        >
          = {oneLine(row.transformation)}
        </div>
      )}

      {mode === "data" && (
        <div className="mt-auto border-t border-white/80 pt-1.5">
          <div className="grid grid-cols-2 gap-2 text-[10px]">
            <div className="min-w-0">
              <div className="text-[8px] uppercase tracking-wide text-slate-400">
                Input
              </div>
              <div
                className="truncate font-mono font-semibold text-slate-800"
                title={row.inputValue}
              >
                {oneLine(row.inputValue)}
              </div>
            </div>

            <div className="min-w-0">
              <div className="text-[8px] uppercase tracking-wide text-slate-400">
                Output
              </div>
              <div
                className="truncate font-mono font-bold"
                style={{ color: color.text }}
                title={row.outputValue}
              >
                {oneLine(row.outputValue)}
              </div>
            </div>
          </div>

          <div className="mt-1 flex items-center justify-between gap-2">
            <span
              className="min-w-0 truncate font-mono text-[9px] text-slate-400"
              title={row.recordKey}
            >
              {oneLine(row.recordKey)}
            </span>
            <StatusPill value={row.status} />
          </div>
        </div>
      )}

      <Handle
        type="source"
        position={Position.Bottom}
        style={handleStyle}
        isConnectable={false}
      />
    </div>
  );
}

function RootNode({ data }: NodeProps<RootFlowNode>) {
  const { trace, reconciliation, mode } = data;
  const header = trace.header;
  const result = reconciliation?.result;

  return (
    <div
      className="flex h-full w-full flex-col overflow-hidden rounded-lg px-3 py-2 shadow-sm"
      style={{ background: "#fef2f2", border: "1.5px solid #fca5a5" }}
    >
      <div className="flex items-center gap-2">
        <span className="flex h-7 w-6 shrink-0 items-center justify-center rounded bg-red-500 text-white">
          <FileText size={14} />
        </span>

        <div className="min-w-0 flex-1">
          <div
            className="truncate text-[11px] font-bold leading-tight text-slate-800"
            title={header.report}
          >
            {header.report}
          </div>
          <div className="truncate text-[9px] leading-tight text-slate-500">
            {header.bank ?? "Regulatory report"}
          </div>
        </div>
      </div>

      <div className="mt-1.5 space-y-0.5 text-[10px] leading-tight text-slate-600">
        <div className="truncate">
          <span className="text-slate-400">Datapoint: </span>
          {header.datapoint}
        </div>
        <div className="truncate">
          <span className="text-slate-400">Column: </span>
          <span className="font-mono">{header.column}</span>
        </div>
      </div>

      {mode === "data" && (
        <div className="mt-auto flex items-center justify-between gap-2 border-t border-white/80 pt-1.5">
          <div className="min-w-0 text-[10px]">
            <span className="text-slate-400">
              Page {formatTraceValue(header.page)} · Row{" "}
              {formatTraceValue(header.row)} ·{" "}
            </span>
            <span className="font-mono font-bold text-slate-800">
              {formatTraceValue(header.value)}
              {header.unit ? ` ${header.unit}` : ""}
            </span>
          </div>

          {result && <ReconciliationBadge result={result} />}
        </div>
      )}

      <Handle
        type="source"
        position={Position.Bottom}
        style={handleStyle}
        isConnectable={false}
      />
    </div>
  );
}

const nodeTypes = { hop: HopNode, root: RootNode };

function buildLayout(
  rows: LineageRow[],
  trace: DataTraceResponse,
  reconciliation: DataTraceReconciliation | null | undefined,
  mode: Mode
) {
  const height = NODE_H[mode];
  const known = new Set(rows.map((row) => row.hop));

  /* Parent of hop "1.1.2" is "1.1" (or the nearest hop that exists). */
  const parentOf = new Map<string, string>();
  const children = new Map<string, LineageRow[]>();

  for (const row of rows) {
    let parent = ROOT_ID;
    let candidate = row.hop;

    while (candidate.includes(".")) {
      candidate = candidate.slice(0, candidate.lastIndexOf("."));
      if (known.has(candidate)) {
        parent = candidate;
        break;
      }
    }

    parentOf.set(row.hop, parent);
    const list = children.get(parent) ?? [];
    list.push(row);
    children.set(parent, list);
  }

  const slots = new Map<string, number>();
  const measure = (id: string): number => {
    const kids = children.get(id) ?? [];
    const width = kids.length
      ? kids.reduce((sum, kid) => sum + measure(kid.hop), 0)
      : 1;
    slots.set(id, width);
    return width;
  };
  measure(ROOT_ID);

  const positions = new Map<string, { x: number; y: number }>();
  let maxDepth = 0;

  const place = (id: string, start: number, depth: number) => {
    const width = slots.get(id) ?? 1;
    positions.set(id, {
      x: (start + width / 2 - 0.5) * (NODE_W + GAP_X),
      y: depth * (height + GAP_Y),
    });
    maxDepth = Math.max(maxDepth, depth);

    let cursor = start;
    for (const kid of children.get(id) ?? []) {
      place(kid.hop, cursor, depth + 1);
      cursor += slots.get(kid.hop) ?? 1;
    }
  };
  place(ROOT_ID, 0, 0);

  const colors = new Map<string, Palette>();
  const colorKey = (row: LineageRow) => {
    const value = row.systemHop?.trim() || row.hop;
    return value.match(/^[\d.]+/)?.[0] ?? value;
  };

  for (const row of rows) {
    const key = colorKey(row);
    if (!colors.has(key)) {
      colors.set(key, PALETTE[colors.size % PALETTE.length]);
    }
  }

  const nodes: Node[] = [
    {
      id: ROOT_ID,
      type: "root",
      position: positions.get(ROOT_ID) ?? { x: 0, y: 0 },
      style: { width: NODE_W, height },
      data: { trace, reconciliation, mode } satisfies RootData,
      draggable: false,
    },
    ...rows.map((row) => ({
      id: row.hop,
      type: "hop",
      position: positions.get(row.hop) ?? { x: 0, y: 0 },
      style: { width: NODE_W, height },
      data: {
        row,
        mode,
        color: colors.get(colorKey(row)) ?? PALETTE[0],
      } satisfies HopData,
      draggable: false,
    })),
  ];

  const edges: Edge[] = rows.map((row) => {
    const stroke = (colors.get(colorKey(row)) ?? PALETTE[0]).border;

    return {
      id: `e-${parentOf.get(row.hop)}-${row.hop}`,
      source: parentOf.get(row.hop) ?? ROOT_ID,
      target: row.hop,
      type: "default",
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 14,
        height: 14,
        color: stroke,
      },
      style: { stroke, strokeWidth: 1.8 },
    };
  });

  const contentHeight = (maxDepth + 1) * (height + GAP_Y);

  return { nodes, edges, contentHeight };
}

const toggleStyle = {
  fontSize: 11,
  lineHeight: 1,
  fontFamily: "inherit",
  fontWeight: 600,
} as const;

type Props = {
  rows: LineageRow[];
  trace: DataTraceResponse;
  reconciliation?: DataTraceReconciliation | null;
};

/**
 * "System Details" view: one graph where every node carries its own details.
 *  - System view: system, table, attribute and transformation.
 *  - Data view: the same plus input / output values, record key and status.
 */
export default function SystemDetailsView({
  rows,
  trace,
  reconciliation,
}: Props) {
  const [mode, setMode] = useState<Mode>("system");

  const layout = useMemo(
    () => buildLayout(rows, trace, reconciliation, mode),
    [rows, trace, reconciliation, mode]
  );

  const height = Math.max(520, Math.min(900, layout.contentHeight + 40));

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[11px] text-slate-500">
          {mode === "system"
            ? "Systems, tables, attributes and transformations along the lineage path."
            : "Systems with the traced input and output values, record keys and status."}
        </p>

        <div className="inline-flex overflow-hidden rounded-lg border border-slate-200 bg-white">
          {(
            [
              ["system", "System view"],
              ["data", "Data view"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setMode(id)}
              aria-pressed={mode === id}
              style={toggleStyle}
              className={`px-3 py-2 transition ${
                mode === id
                  ? "bg-navy text-white"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-lg bg-slate-50 px-3 py-12 text-center text-[11px] text-slate-500">
          No lineage hops to display.
        </div>
      ) : (
        <div
          className="overflow-hidden rounded-lg border border-slate-200 bg-[#fbfaf7]"
          style={{ height }}
        >
          <ReactFlow
            key={mode}
            nodes={layout.nodes}
            edges={layout.edges}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ padding: 0.1, maxZoom: 1 }}
            minZoom={0.2}
            maxZoom={1.5}
            nodesDraggable={false}
            nodesConnectable={false}
            elementsSelectable={false}
            proOptions={{ hideAttribution: true }}
            className="bg-[#fbfaf7]"
          >
            <Background color="#e5e2da" gap={22} size={1} />
            <Controls showInteractive={false} position="bottom-left" />
          </ReactFlow>
        </div>
      )}
    </div>
  );
}
