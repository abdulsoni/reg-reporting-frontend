import type {
  LineageData,
  LineageEdge,
  LineageEndpoint,
} from "../types/lineage";

import { resolveEndpoint } from "../data/systemLineageAdapter";

/**
 * Stable, fully qualified key for an endpoint. Identically named columns in
 * different tables can never collide because system, table and attribute ids
 * travel together.
 */
export function endpointKey(endpoint: LineageEndpoint): string {
  return `${endpoint.systemId}|${endpoint.tableId ?? ""}|${endpoint.attributeId ?? ""}`;
}

/** React Flow attribute node id for an endpoint, when it is representable. */
export function attributeNodeId(endpoint: LineageEndpoint): string | null {
  if (!endpoint.tableId || !endpoint.attributeId) return null;
  return `${endpoint.tableId}.${endpoint.attributeId}`;
}

export type AttributeSearchEntry = {
  key: string;
  systemId: string;
  systemLabel: string;
  tableId: string;
  tableName: string;
  attributeId: string;
  attributeName: string;
  dataType: string;
};

/** Every attribute reachable in the current scenario, with its qualified path. */
export function buildAttributeSearchIndex(
  data: LineageData
): AttributeSearchEntry[] {
  const labels = new Map(
    data.systems.map((system) => [system.id, system.label])
  );

  const index: AttributeSearchEntry[] = [];

  for (const table of data.tables) {
    const systemLabel = labels.get(table.systemId) ?? table.systemId;

    for (const attribute of table.attributes) {
      index.push({
        key: endpointKey({
          systemId: table.systemId,
          tableId: table.id,
          attributeId: attribute.id,
        }),
        systemId: table.systemId,
        systemLabel,
        tableId: table.id,
        tableName: table.name,
        attributeId: attribute.id,
        attributeName: attribute.name,
        dataType: attribute.dataType,
      });
    }
  }

  return index;
}

/** Case-insensitive substring search across system, table and column names. */
export function searchAttributes(
  index: AttributeSearchEntry[],
  query: string,
  limit = 40
): AttributeSearchEntry[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return [];

  const results: AttributeSearchEntry[] = [];

  for (const entry of index) {
    const haystack = `${entry.attributeName} ${entry.tableName} ${entry.systemLabel} ${entry.systemId} ${entry.systemLabel}.${entry.tableName}.${entry.attributeName}`.toLowerCase();

    if (haystack.includes(needle)) results.push(entry);
    if (results.length >= limit) break;
  }

  return results;
}

/** Where an upstream walk stopped because metadata is not available. */
export type TraceBoundary = {
  endpoint: LineageEndpoint;
  kind: "dependency" | "metadata_unavailable" | "unresolved";
  label: string;
  message: string;
};

export type UpstreamHop = {
  edge: LineageEdge;
  source: LineageEndpoint;
};

export type UpstreamTrace = {
  target: LineageEndpoint;
  targetNodeId: string | null;
  /** Resolved attribute node ids on the path (React Flow `${tableId}.${attributeId}`). */
  attributeNodeIds: Set<string>;
  /** Lineage edge ids on the path. */
  edgeIds: Set<string>;
  /** Systems that own a path node and are rendered as external placeholders. */
  boundarySystemIds: Set<string>;
  /** Systems that own at least one resolved path attribute (candidates to open). */
  pathSystemIds: Set<string>;
  boundaries: TraceBoundary[];
  /** key(endpoint) → upstream hops feeding it, for rendering the path tree. */
  parents: Map<string, UpstreamHop[]>;
  incomplete: boolean;
};

/**
 * Walk lineage edges backward from `target` to every source column that feeds
 * it. Traversal uses fully qualified endpoint keys and the full edge list, so
 * the path reflects the actual metadata rather than what is currently on
 * screen. Systems whose metadata is missing end the walk and are reported as
 * boundaries so the UI can mark the path incomplete.
 */
export function collectUpstreamTrace(
  data: LineageData,
  target: LineageEndpoint
): UpstreamTrace {
  const reverse = new Map<string, Array<{ edge: LineageEdge; source: LineageEndpoint }>>();

  for (const edge of data.lineageEdges) {
    const key = endpointKey(edge.target);
    const bucket = reverse.get(key);
    if (bucket) bucket.push({ edge, source: edge.source });
    else reverse.set(key, [{ edge, source: edge.source }]);
  }

  const attributeNodeIds = new Set<string>();
  const edgeIds = new Set<string>();
  const boundarySystemIds = new Set<string>();
  const pathSystemIds = new Set<string>();
  const boundaries: TraceBoundary[] = [];
  const boundaryKeys = new Set<string>();
  const parents = new Map<string, UpstreamHop[]>();
  const visited = new Set<string>([endpointKey(target)]);

  const targetNodeId = attributeNodeId(target);
  if (targetNodeId) attributeNodeIds.add(targetNodeId);

  const targetResolution = resolveEndpoint(target, data);
  if (targetResolution.kind === "resolved") {
    pathSystemIds.add(target.systemId);
  }

  const queue: LineageEndpoint[] = [target];

  while (queue.length > 0) {
    const current = queue.shift()!;
    const hops = reverse.get(endpointKey(current)) ?? [];

    if (hops.length > 0) {
      parents.set(endpointKey(current), hops);
    }

    for (const hop of hops) {
      edgeIds.add(hop.edge.id);

      const resolution = resolveEndpoint(hop.source, data);

      if (resolution.kind === "resolved") {
        pathSystemIds.add(hop.source.systemId);
        const nodeId = attributeNodeId(hop.source);
        if (nodeId) attributeNodeIds.add(nodeId);
      } else {
        boundarySystemIds.add(hop.source.systemId);

        if (!boundaryKeys.has(endpointKey(hop.source))) {
          boundaryKeys.add(endpointKey(hop.source));

          if (resolution.kind === "dependency") {
            boundaries.push({
              endpoint: hop.source,
              kind: "dependency",
              label: resolution.dependency.systemName,
              message: resolution.dependency.message,
            });
          } else if (resolution.kind === "metadata_unavailable") {
            boundaries.push({
              endpoint: hop.source,
              kind: "metadata_unavailable",
              label: resolution.system.label,
              message: `Metadata ${resolution.system.metadataStatus.replace(
                /_/g,
                " "
              )} — the path cannot be traced further.`,
            });
          } else {
            boundaries.push({
              endpoint: hop.source,
              kind: "unresolved",
              label: hop.source.systemId,
              message: "No metadata is available for this source.",
            });
          }
        }

        // A boundary has no further discoverable lineage; stop here.
        continue;
      }

      const key = endpointKey(hop.source);
      if (visited.has(key)) continue;
      visited.add(key);
      queue.push(hop.source);
    }
  }

  return {
    target,
    targetNodeId,
    attributeNodeIds,
    edgeIds,
    boundarySystemIds,
    pathSystemIds,
    boundaries,
    parents,
    incomplete: boundaries.length > 0,
  };
}
