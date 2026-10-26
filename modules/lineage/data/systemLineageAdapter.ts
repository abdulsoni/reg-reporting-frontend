import { MarkerType, type Edge, type Node } from "@xyflow/react";
import Dagre from "@dagrejs/dagre";

import type {
  ConnectionStatus,
  LineageAttribute,
  LineageData,
  LineageDependency,
  LineageEdge,
  LineageEndpoint,
  LineageSystem,
  LineageTable,
  MetadataStatus,
} from "../types/lineage";

export type SystemData = {
  label: string;
  description: string;
  target?: boolean;
  canExplore?: boolean;
  connectionStatus: ConnectionStatus;
  metadataStatus: MetadataStatus;
  expanded?: boolean;
  tableCount?: number;
  onPath?: boolean;
  dimmed?: boolean;
  onToggle?: () => void;
};

export type SystemFlowNode = Node<SystemData, "system">;

export type DependencyData = {
  label: string;
  systemName: string;
  message: string;
  highlighted?: boolean;
  dimmed?: boolean;
};

export type DependencyFlowNode = Node<DependencyData, "dependency">;

export type TableData = {
  label: string;
  systemId: string;
  tableId: string;
  attributeCount: number;
  expanded: boolean;
  onPath?: boolean;
  dimmed?: boolean;
  onToggle?: () => void;
};

export type TableFlowNode = Node<TableData, "table">;

export type AttributeData = {
  label: string;
  dataType: string;
  transformation: string;
  status: string;
  systemId: string;
  tableId: string;
  attributeId: string;
  selected?: boolean;
  highlighted?: boolean;
  isTraceTarget?: boolean;
  dimmed?: boolean;
};

export type AttributeFlowNode = Node<AttributeData, "attribute">;

export type SystemGraphHighlight = {
  attributeNodeIds: Set<string>;
  edgeIds: Set<string>;
  pathSystemIds: Set<string>;
  boundarySystemIds: Set<string>;
  highlightedTableIds: Set<string>;
  targetNodeId: string | null;
};

export const DEPENDENCY_NODE_PREFIX = "dep:";
export const METADATA_NODE_PREFIX = "meta:";
export const EXTERNAL_SYSTEM_NODE_PREFIX = "sys:";

/** Stable React Flow node id for a system that is not in the response. */
export function dependencyNodeId(systemId: string): string {
  return `${DEPENDENCY_NODE_PREFIX}${systemId}`;
}

export function metadataNodeId(systemId: string): string {
  return `${METADATA_NODE_PREFIX}${systemId}`;
}

/** Stable React Flow node id for an external system placeholder in table view. */
export function externalSystemNodeId(systemId: string): string {
  return `${EXTERNAL_SYSTEM_NODE_PREFIX}${systemId}`;
}

/** Stable React Flow node id for a table nested inside an expanded system. */
export function tableFlowNodeId(systemId: string, tableId: string): string {
  return `table:${systemId}:${tableId}`;
}

/** Stable React Flow node id for an attribute nested inside an expanded table. */
export function attributeFlowNodeId(
  systemId: string,
  tableId: string,
  attributeId: string
): string {
  return `attribute:${systemId}:${tableId}:${attributeId}`;
}

/**
 * Resolve an endpoint to a real table/attribute, a dependency placeholder, or a
 * metadata-unavailable indicator — purely from the single response.
 */
export type EndpointResolution =
  | { kind: "resolved"; table: LineageTable; attribute: LineageAttribute | null }
  | { kind: "dependency"; dependency: LineageDependency }
  | { kind: "metadata_unavailable"; system: LineageSystem }
  | { kind: "unresolved" };

export function resolveEndpoint(
  endpoint: LineageEndpoint,
  data: LineageData
): EndpointResolution {
  const system = data.systems.find((item) => item.id === endpoint.systemId);

  if (!system) {
    const dependency = data.dependencies.find(
      (item) => item.systemId === endpoint.systemId
    );
    return dependency ? { kind: "dependency", dependency } : { kind: "unresolved" };
  }

  const table =
    endpoint.tableId != null
      ? data.tables.find((item) => item.id === endpoint.tableId)
      : undefined;

  if (!table) {
    return { kind: "metadata_unavailable", system };
  }

  const attribute = endpoint.attributeId
    ? table.attributes.find((item) => item.id === endpoint.attributeId) ?? null
    : null;

  return { kind: "resolved", table, attribute };
}

/** Every edge whose source or target lives in the given system. */
export function relevantEdgesForSystem(
  data: LineageData,
  systemId: string
): LineageEdge[] {
  return data.lineageEdges.filter(
    (edge) =>
      edge.source.systemId === systemId || edge.target.systemId === systemId
  );
}

export type TableGraphExternalKind = "connected" | "dependency" | "metadata";

/** A placeholder shown for an external system referenced by the selected one. */
export type TableGraphExternal = {
  systemId: string;
  label: string;
  kind: TableGraphExternalKind;
  message: string;
};

export type LineageGraphTables = {
  /** Tables for every currently open system (their own only). */
  tables: LineageTable[];
  /** Systems referenced by relevant edges but not open, rendered as placeholders. */
  externals: TableGraphExternal[];
  /** Relevant edges whose endpoints can all be represented. */
  edges: LineageEdge[];
};

function classifyExternal(
  systemId: string,
  data: LineageData
): TableGraphExternal | null {
  const system = data.systems.find((item) => item.id === systemId);

  if (system && system.metadataStatus === "available") {
    return {
      systemId,
      label: system.label,
      kind: "connected",
      message: "Click to view tables",
    };
  }

  if (system) {
    return {
      systemId,
      label: system.label,
      kind: "metadata",
      message: `Metadata ${system.metadataStatus.replace(/_/g, " ")}`,
    };
  }

  const dependency = data.dependencies.find((item) => item.systemId === systemId);

  if (dependency) {
    return {
      systemId,
      label: dependency.systemName,
      kind: "dependency",
      message: dependency.message,
    };
  }

  return null;
}

/**
 * Decide which tables, placeholder systems and edges belong in the table-level
 * view. Tables for every open system are included; any system an edge points at
 * that is not yet open becomes a placeholder. Opening that placeholder adds its
 * tables rather than replacing the current ones.
 */
export function buildTableGraph(
  data: LineageData,
  openSystemIds: string[]
): LineageGraphTables {
  const open = new Set(openSystemIds);
  const tables = data.tables.filter((table) => open.has(table.systemId));
  const externals = new Map<string, TableGraphExternal>();

  const relevantEdges = data.lineageEdges.filter(
    (edge) => open.has(edge.source.systemId) || open.has(edge.target.systemId)
  );

  for (const edge of relevantEdges) {
    for (const endpoint of [edge.source, edge.target]) {
      if (open.has(endpoint.systemId)) continue;

      const external = classifyExternal(endpoint.systemId, data);
      if (external) externals.set(endpoint.systemId, external);
    }
  }

  const edges = relevantEdges.filter((edge) =>
    [edge.source, edge.target].every((endpoint) => {
      const resolution = resolveEndpoint(endpoint, data);

      if (open.has(endpoint.systemId)) {
        return resolution.kind === "resolved";
      }

      return resolution.kind !== "unresolved";
    })
  );

  return {
    tables,
    externals: Array.from(externals.values()),
    edges,
  };
}

/** Table-level node id for a table-view endpoint (open table or placeholder). */
export function tableEndpointNodeId(
  endpoint: LineageEndpoint,
  resolution: EndpointResolution,
  open: ReadonlySet<string>
): string | null {
  if (resolution.kind === "unresolved") return null;

  if (open.has(endpoint.systemId)) {
    return resolution.kind === "resolved" ? endpoint.tableId : null;
  }

  return externalSystemNodeId(endpoint.systemId);
}

/** Attribute-level node id, only for endpoints belonging to an open system. */
export function tableEndpointAttributeNodeId(
  endpoint: LineageEndpoint,
  resolution: EndpointResolution,
  open: ReadonlySet<string>
): string | null {
  if (!open.has(endpoint.systemId)) return null;
  if (resolution.kind !== "resolved") return null;
  if (!endpoint.tableId || !endpoint.attributeId) return null;
  return `${endpoint.tableId}.${endpoint.attributeId}`;
}

type DagreLayoutOptions = {
  rankdir?: "LR" | "TB";
  nodesep?: number;
  ranksep?: number;
};

type SizedNode = { id: string; width: number; height: number };

/**
 * Compute node positions with Dagre. The backend never supplies coordinates;
 * the frontend layout engine owns positioning.
 */
export function computeDagreLayout(
  nodes: SizedNode[],
  edges: Array<{ source: string; target: string }>,
  options: DagreLayoutOptions = {}
): Record<string, { x: number; y: number }> {
  const graph = new Dagre.graphlib.Graph();
  graph.setGraph({
    rankdir: options.rankdir ?? "LR",
    nodesep: options.nodesep ?? 60,
    ranksep: options.ranksep ?? 110,
    marginx: 24,
    marginy: 24,
  });
  graph.setDefaultEdgeLabel(() => ({}));

  const nodeIds = new Set(nodes.map((node) => node.id));

  for (const node of nodes) {
    graph.setNode(node.id, { width: node.width, height: node.height });
  }

  for (const edge of edges) {
    if (edge.source === edge.target) continue;
    if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) continue;
    graph.setEdge(edge.source, edge.target);
  }

  Dagre.layout(graph);

  const positions: Record<string, { x: number; y: number }> = {};

  for (const node of nodes) {
    const laidOut = graph.node(node.id);
    positions[node.id] = {
      x: (laidOut?.x ?? 0) - node.width / 2,
      y: (laidOut?.y ?? 0) - node.height / 2,
    };
  }

  return positions;
}

export type SystemGraphHandlers = {
  onToggleSystem?: (systemId: string) => void;
  onToggleTable?: (tableId: string) => void;
};

export type SystemGraphOptions = {
  expandedSystemIds?: readonly string[];
  expandedTableIds?: readonly string[];
  highlight?: SystemGraphHighlight | null;
  handlers?: SystemGraphHandlers;
};

const SYSTEM_COLLAPSED_WIDTH = 220;
const SYSTEM_COLLAPSED_HEIGHT = 78;
const SYSTEM_WIDTH = 332;
const SYSTEM_HEADER = 64;
const SYSTEM_PADDING = 14;
const TABLE_WIDTH = 304;
const TABLE_HEADER = 44;
const TABLE_PADDING = 12;
const ATTR_WIDTH = 280;
const ATTR_HEIGHT = 44;
const ATTR_GAP = 8;
const TABLE_GAP = 12;
const DEPENDENCY_WIDTH = 240;
const DEPENDENCY_HEIGHT = 96;

type TableLayout = {
  table: LineageTable;
  height: number;
  expanded: boolean;
};

type SystemLayout = {
  system: LineageSystem;
  tables: TableLayout[];
  canExplore: boolean;
  expanded: boolean;
  width: number;
  height: number;
};

type EndpointNode = {
  nodeId: string;
  level: "attribute" | "table" | "system" | "dependency";
  systemId: string;
  tableId: string | null;
};

type EdgeGroup = {
  source: EndpointNode;
  target: EndpointNode;
  sourceHandle?: string;
  targetHandle?: string;
  edges: LineageEdge[];
  sameTable: boolean;
  rightSide: boolean;
};

function tableHeight(attributeCount: number, expanded: boolean): number {
  if (!expanded) return TABLE_HEADER + TABLE_PADDING;

  const attributesHeight =
    attributeCount * ATTR_HEIGHT +
    Math.max(0, attributeCount - 1) * ATTR_GAP;

  return TABLE_HEADER + TABLE_PADDING * 2 + attributesHeight;
}

function systemHeight(tables: TableLayout[], expanded: boolean): number {
  if (!expanded || tables.length === 0) return SYSTEM_COLLAPSED_HEIGHT;

  const tablesHeight =
    tables.reduce((total, table) => total + table.height, 0) +
    Math.max(0, tables.length - 1) * TABLE_GAP;

  return SYSTEM_HEADER + SYSTEM_PADDING * 2 + tablesHeight;
}

export function buildSystemGraph(
  data: LineageData,
  options: SystemGraphOptions = {}
) {
  const expandedSystems = new Set(options.expandedSystemIds ?? []);
  const expandedTables = new Set(options.expandedTableIds ?? []);
  const highlight = options.highlight ?? null;
  const traceActive = Boolean(highlight);
  const handlers = options.handlers;

  const tablesBySystem = new Map<string, LineageTable[]>();

  for (const table of data.tables) {
    const bucket = tablesBySystem.get(table.systemId);
    if (bucket) bucket.push(table);
    else tablesBySystem.set(table.systemId, [table]);
  }

  const systemLayouts: SystemLayout[] = data.systems.map((system) => {
    const tables = tablesBySystem.get(system.id) ?? [];
    const canExplore = tables.length > 0;
    const expanded = canExplore && expandedSystems.has(system.id);

    const tableLayouts: TableLayout[] = tables.map((table) => {
      const expandedTable = expanded && expandedTables.has(table.id);

      return {
        table,
        expanded: expandedTable,
        height: tableHeight(table.attributes.length, expandedTable),
      };
    });

    return {
      system,
      tables: tableLayouts,
      canExplore,
      expanded,
      width: expanded ? SYSTEM_WIDTH : SYSTEM_COLLAPSED_WIDTH,
      height: systemHeight(tableLayouts, expanded),
    };
  });

  const nodes: Array<SystemFlowNode | DependencyFlowNode> = [];
  const sizedTopLevel: SizedNode[] = [];

  for (const layout of systemLayouts) {
    const onPath = highlight
      ? highlight.pathSystemIds.has(layout.system.id) ||
        highlight.boundarySystemIds.has(layout.system.id)
      : false;
    const dimmed = traceActive && !onPath;
    const toggleSystem = handlers?.onToggleSystem;

    nodes.push({
      id: layout.system.id,
      type: "system",
      position: { x: 0, y: 0 },
      style: {
        width: layout.width,
        height: layout.height,
        opacity: dimmed ? 0.35 : 1,
      },
      data: {
        label: layout.system.label,
        description: layout.system.description,
        target: layout.system.target ?? false,
        canExplore: layout.canExplore,
        connectionStatus: layout.system.connectionStatus,
        metadataStatus: layout.system.metadataStatus,
        expanded: layout.expanded,
        tableCount: layout.tables.length,
        onPath,
        dimmed,
        onToggle:
          layout.canExplore && toggleSystem
            ? () => toggleSystem(layout.system.id)
            : undefined,
      },
      draggable: false,
      selectable: false,
    });

    sizedTopLevel.push({
      id: layout.system.id,
      width: layout.width,
      height: layout.height,
    });
  }

  for (const dependency of data.dependencies) {
    const highlighted = highlight?.boundarySystemIds.has(dependency.systemId) ?? false;
    const dimmed = traceActive && !highlighted;

    nodes.push({
      id: dependencyNodeId(dependency.systemId),
      type: "dependency",
      position: { x: 0, y: 0 },
      style: {
        width: DEPENDENCY_WIDTH,
        height: DEPENDENCY_HEIGHT,
        opacity: dimmed ? 0.35 : 1,
      },
      data: {
        label: dependency.systemName,
        systemName: dependency.systemName,
        message: dependency.message,
        highlighted,
        dimmed,
      },
      draggable: false,
      selectable: false,
    });

    sizedTopLevel.push({
      id: dependencyNodeId(dependency.systemId),
      width: DEPENDENCY_WIDTH,
      height: DEPENDENCY_HEIGHT,
    });
  }

  const topLevelNodeId = (systemId: string): string | null => {
    if (data.systems.some((system) => system.id === systemId)) return systemId;
    if (data.dependencies.some((item) => item.systemId === systemId)) {
      return dependencyNodeId(systemId);
    }
    return null;
  };

  const layoutEdges: Array<{ source: string; target: string }> = [];
  const seenLayoutEdges = new Set<string>();

  for (const edge of data.lineageEdges) {
    const source = topLevelNodeId(edge.source.systemId);
    const target = topLevelNodeId(edge.target.systemId);

    if (!source || !target || source === target) continue;

    const key = `${source}->${target}`;
    if (seenLayoutEdges.has(key)) continue;
    seenLayoutEdges.add(key);
    layoutEdges.push({ source, target });
  }

  const positions = computeDagreLayout(sizedTopLevel, layoutEdges, {
    rankdir: "LR",
    nodesep: 70,
    ranksep: 150,
  });

  for (const node of nodes) {
    node.position = positions[node.id] ?? { x: 0, y: 0 };
  }

  const tableNodes: TableFlowNode[] = [];
  const attributeNodes: AttributeFlowNode[] = [];
  const toggleTable = handlers?.onToggleTable;

  for (const layout of systemLayouts) {
    if (!layout.expanded) continue;

    let tableY = SYSTEM_HEADER + SYSTEM_PADDING;

    for (const tableLayout of layout.tables) {
      const { table, expanded, height } = tableLayout;
      const flowNodeId = tableFlowNodeId(layout.system.id, table.id);
      const onPath = highlight?.highlightedTableIds.has(table.id) ?? false;
      const dimmed = traceActive && !onPath;

      tableNodes.push({
        id: flowNodeId,
        type: "table",
        parentId: layout.system.id,
        extent: "parent",
        position: { x: SYSTEM_PADDING, y: tableY },
        style: {
          width: TABLE_WIDTH,
          height,
          opacity: dimmed ? 0.35 : 1,
        },
        data: {
          label: table.name,
          systemId: layout.system.id,
          tableId: table.id,
          attributeCount: table.attributes.length,
          expanded,
          onPath,
          dimmed,
          onToggle: toggleTable ? () => toggleTable(table.id) : undefined,
        },
        draggable: false,
        selectable: false,
      });

      if (expanded) {
        table.attributes.forEach((attribute, index) => {
          const nodeId = attributeFlowNodeId(
            layout.system.id,
            table.id,
            attribute.id
          );
          const attributeOnPath = highlight?.attributeNodeIds.has(nodeId) ?? false;
          const attributeDimmed = traceActive && !attributeOnPath;

          attributeNodes.push({
            id: nodeId,
            type: "attribute",
            parentId: flowNodeId,
            extent: "parent",
            position: {
              x: TABLE_PADDING,
              y: TABLE_HEADER + TABLE_PADDING + index * (ATTR_HEIGHT + ATTR_GAP),
            },
            style: {
              width: ATTR_WIDTH,
              height: ATTR_HEIGHT,
              opacity: attributeDimmed ? 0.35 : 1,
            },
            data: {
              label: attribute.name,
              dataType: attribute.dataType,
              transformation: attribute.transformation,
              status: attribute.status,
              systemId: layout.system.id,
              tableId: table.id,
              attributeId: attribute.id,
              highlighted: attributeOnPath,
              isTraceTarget: highlight?.targetNodeId === nodeId,
              dimmed: attributeDimmed,
            },
            draggable: false,
          });
        });
      }

      tableY += height + TABLE_GAP;
    }
  }

  const layoutBySystem = new Map(
    systemLayouts.map((layout) => [layout.system.id, layout])
  );
  const tableById = new Map(data.tables.map((table) => [table.id, table]));

  const endpointNode = (endpoint: LineageEndpoint): EndpointNode | null => {
    const resolution = resolveEndpoint(endpoint, data);

    if (resolution.kind === "unresolved") return null;

    if (resolution.kind === "dependency") {
      return {
        nodeId: dependencyNodeId(endpoint.systemId),
        level: "dependency",
        systemId: endpoint.systemId,
        tableId: null,
      };
    }

    if (resolution.kind === "metadata_unavailable") {
      return {
        nodeId: endpoint.systemId,
        level: "system",
        systemId: endpoint.systemId,
        tableId: null,
      };
    }

    const layout = layoutBySystem.get(endpoint.systemId);
    if (!layout) return null;

    if (!layout.expanded) {
      return {
        nodeId: endpoint.systemId,
        level: "system",
        systemId: endpoint.systemId,
        tableId: null,
      };
    }

    const table = endpoint.tableId ? tableById.get(endpoint.tableId) : undefined;

    if (!table || table.systemId !== endpoint.systemId) {
      return {
        nodeId: endpoint.systemId,
        level: "system",
        systemId: endpoint.systemId,
        tableId: null,
      };
    }

    const flowTableId = tableFlowNodeId(endpoint.systemId, table.id);
    const tableLayout = layout.tables.find((item) => item.table.id === table.id);

    if (!tableLayout?.expanded || !endpoint.attributeId) {
      return {
        nodeId: flowTableId,
        level: "table",
        systemId: endpoint.systemId,
        tableId: table.id,
      };
    }

    const attribute = table.attributes.find(
      (item) => item.id === endpoint.attributeId
    );

    if (!attribute) {
      return {
        nodeId: flowTableId,
        level: "table",
        systemId: endpoint.systemId,
        tableId: table.id,
      };
    }

    return {
      nodeId: attributeFlowNodeId(
        endpoint.systemId,
        table.id,
        attribute.id
      ),
      level: "attribute",
      systemId: endpoint.systemId,
      tableId: table.id,
    };
  };

  const groups = new Map<string, EdgeGroup>();

  for (const item of data.lineageEdges) {
    const source = endpointNode(item.source);
    const target = endpointNode(item.target);

    if (!source || !target || source.nodeId === target.nodeId) continue;

    const sameTable =
      source.level === "attribute" &&
      target.level === "attribute" &&
      source.tableId != null &&
      source.tableId === target.tableId;
    const rightSide =
      source.systemId === target.systemId &&
      (source.level === "attribute" || source.level === "table") &&
      (target.level === "attribute" || target.level === "table");
    const sourceHandle = source.level === "attribute" ? "attr-out" : undefined;
    const targetHandle =
      target.level === "attribute"
        ? rightSide
          ? "attr-right-in"
          : "attr-in"
        : target.level === "table" && rightSide
          ? "table-right-in"
          : undefined;
    const key = `${source.nodeId}|${sourceHandle ?? ""}|${target.nodeId}|${
      targetHandle ?? ""
    }`;

    const existing = groups.get(key);
    if (existing) existing.edges.push(item);
    else {
      groups.set(key, {
        source,
        target,
        sourceHandle,
        targetHandle,
        edges: [item],
        sameTable,
        rightSide,
      });
    }
  }

  const edges: Edge[] = [];

  for (const [key, group] of groups) {
    const onPath = group.edges.some(
      (edge) => highlight?.edgeIds.has(edge.id) ?? false
    );
    const dimmed = traceActive && !onPath;
    const stroke = onPath ? "#2563eb" : "#64748b";

    edges.push({
      id: group.edges.length === 1 ? group.edges[0].id : `summary:${key}`,
      source: group.source.nodeId,
      sourceHandle: group.sourceHandle,
      target: group.target.nodeId,
      targetHandle: group.targetHandle,
      type: group.rightSide ? "lineage" : undefined,
      data: {
        edges: group.edges,
        sameTable: group.sameTable,
        rightSide: group.rightSide,
        summary: group.edges.length > 1,
      },
      markerStart: {
        type: MarkerType.ArrowClosed,
        width: 14,
        height: 14,
        color: stroke,
      },
      style: {
        stroke,
        strokeWidth: onPath ? 3 : 1.7,
        opacity: dimmed ? 0.15 : 1,
      },
      zIndex: onPath ? 10 : 1,
    });
  }

  const contentHeight = sizedTopLevel.reduce((max, sized) => {
    const position = positions[sized.id] ?? { y: 0 };
    return Math.max(max, position.y + sized.height);
  }, 0);

  return {
    nodes: [...nodes, ...tableNodes, ...attributeNodes],
    edges,
    contentHeight,
  };
}
