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
  selected?: boolean;
  connectionStatus: ConnectionStatus;
  metadataStatus: MetadataStatus;
};

export type SystemNode = Node<SystemData, "system">;

export type DependencyData = {
  label: string;
  systemName: string;
  message: string;
};

export type DependencyNode = Node<DependencyData, "dependency">;

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

export function buildSystemGraph(
  data: LineageData,
  highlightedSystemIds: string[] = []
) {
  const highlighted = new Set(highlightedSystemIds);
  const nodes: Array<SystemNode | DependencyNode> = [];
  const layoutEdges: Array<{ source: string; target: string }> = [];
  const connections = new Map<string, Edge>();

  const nodeIdForSystem = (systemId: string): string | null => {
    if (data.systems.some((system) => system.id === systemId)) return systemId;
    if (data.dependencies.some((item) => item.systemId === systemId)) {
      return dependencyNodeId(systemId);
    }
    return null;
  };

  for (const system of data.systems) {
    nodes.push({
      id: system.id,
      type: "system",
      position: { x: 0, y: 0 },
      data: {
        label: system.label,
        description: system.description,
        target: system.target ?? false,
        canExplore: data.tables.some((table) => table.systemId === system.id),
        selected: highlighted.has(system.id),
        connectionStatus: system.connectionStatus,
        metadataStatus: system.metadataStatus,
      },
    });
  }

  for (const dependency of data.dependencies) {
    nodes.push({
      id: dependencyNodeId(dependency.systemId),
      type: "dependency",
      position: { x: 0, y: 0 },
      data: {
        label: dependency.systemName,
        systemName: dependency.systemName,
        message: dependency.message,
      },
    });
  }

  // Deduplicate system connections even if several column edges connect the
  // same pair of systems.
  for (const item of data.lineageEdges) {
    const source = nodeIdForSystem(item.source.systemId);
    const target = nodeIdForSystem(item.target.systemId);

    if (!source || !target || source === target) continue;

    const id = `${source}->${target}`;
    if (!connections.has(id)) {
      connections.set(id, {
        id,
        source,
        target,
        markerEnd: { type: MarkerType.ArrowClosed },
      });
    }
  }

  const edges = Array.from(connections.values());
  for (const edge of edges) {
    layoutEdges.push({ source: edge.source, target: edge.target });
  }

  const positions = computeDagreLayout(
    nodes.map((node) => ({
      id: node.id,
      width: node.type === "dependency" ? 240 : 220,
      height: node.type === "dependency" ? 96 : 78,
    })),
    layoutEdges
  );

  for (const node of nodes) {
    node.position = positions[node.id] ?? { x: 0, y: 0 };
  }

  return { nodes, edges };
}
