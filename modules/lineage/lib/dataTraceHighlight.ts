import type {
  LineageData,
  LineageEndpoint,
} from "../types/lineage";
import {
  attributeNodeId,
  buildAttributeSearchEntry,
  endpointKey,
  type AttributeSearchEntry,
  type UpstreamHop,
  type UpstreamTrace,
} from "./reverseLineage";

function tracedEndpoints(data: LineageData): LineageEndpoint[] {
  const endpoints: LineageEndpoint[] = [];

  for (const table of data.tables) {
    for (const attribute of table.attributes) {
      if (!attribute.traced) continue;

      endpoints.push({
        systemId: table.systemId,
        tableId: table.id,
        attributeId: attribute.id,
      });
    }
  }

  return endpoints;
}

/**
 * Convert the data-level trace bundled with the response into the same
 * `UpstreamTrace` shape the explorer already renders. The traced edge ids drive
 * the highlight, while the traced attributes give the node-level values.
 */
export function buildDataTraceUpstreamTrace(
  data: LineageData
): UpstreamTrace | null {
  const trace = data.trace;
  if (!trace) return null;

  const target: LineageEndpoint = {
    systemId: trace.focus.systemId,
    tableId: trace.focus.tableId,
    attributeId: trace.focus.attributeId,
  };

  const tracedEdgeIds = new Set(trace.tracedEdgeIds);
  const tracedEdges =
    tracedEdgeIds.size > 0
      ? data.lineageEdges.filter((edge) => tracedEdgeIds.has(edge.id))
      : data.lineageEdges.filter((edge) => edge.traced);

  const attributeNodeIds = new Set<string>();
  const pathSystemIds = new Set<string>();
  const parents = new Map<string, UpstreamHop[]>();

  const addEndpoint = (endpoint: LineageEndpoint) => {
    const nodeId = attributeNodeId(endpoint);
    if (nodeId) attributeNodeIds.add(nodeId);
    pathSystemIds.add(endpoint.systemId);
  };

  addEndpoint(target);
  for (const endpoint of tracedEndpoints(data)) addEndpoint(endpoint);

  for (const edge of tracedEdges) {
    addEndpoint(edge.source);
    addEndpoint(edge.target);

    const key = endpointKey(edge.target);
    const bucket = parents.get(key);
    if (bucket) bucket.push({ edge, source: edge.source });
    else parents.set(key, [{ edge, source: edge.source }]);
  }

  for (const hop of trace.hops) {
    addEndpoint({
      systemId: hop.systemId,
      tableId: hop.tableId,
      attributeId: hop.attributeId,
    });
  }

  return {
    target,
    targetNodeId: attributeNodeId(target),
    attributeNodeIds,
    edgeIds: new Set(tracedEdges.map((edge) => edge.id)),
    boundarySystemIds: new Set(),
    pathSystemIds,
    boundaries: [],
    parents,
    incomplete: false,
  };
}

/** Search entry for the reported datapoint that anchors the data trace. */
export function buildDataTraceEntry(
  data: LineageData
): AttributeSearchEntry | null {
  const trace = data.trace;
  if (!trace) return null;

  return buildAttributeSearchEntry(data, {
    systemId: trace.focus.systemId,
    tableId: trace.focus.tableId,
    attributeId: trace.focus.attributeId,
  });
}

/** Systems and tables that must be open so the traced values are visible. */
export function deriveDataTraceExpansion(data: LineageData): {
  systemIds: string[];
  tableIds: string[];
} {
  const trace = data.trace;
  if (!trace) return { systemIds: [], tableIds: [] };

  const systemIds = new Set<string>();
  const tableIds = new Set<string>();

  if (trace.focus.tableId) {
    const table = data.tables.find(
      (item) =>
        item.id === trace.focus.tableId &&
        item.systemId === trace.focus.systemId
    );

    if (table) {
      systemIds.add(table.systemId);
      tableIds.add(table.id);
    }
  }

  for (const table of data.tables) {
    if (!table.attributes.some((attribute) => attribute.traced)) continue;
    systemIds.add(table.systemId);
    tableIds.add(table.id);
  }

  return {
    systemIds: Array.from(systemIds),
    tableIds: Array.from(tableIds),
  };
}
