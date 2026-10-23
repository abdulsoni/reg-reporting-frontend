import {
  attributeFlowNodeId,
  type SystemGraphHighlight,
} from "../data/systemLineageAdapter";
import type { LineageData } from "../types/lineage";
import type { UpstreamTrace } from "./reverseLineage";

type ParsedAttributeNodeId = {
  tableId: string;
  attributeId: string;
};

function parseAttributeNodeId(nodeId: string): ParsedAttributeNodeId | null {
  const separator = nodeId.lastIndexOf(".");
  if (separator <= 0) return null;

  return {
    tableId: nodeId.slice(0, separator),
    attributeId: nodeId.slice(separator + 1),
  };
}

export function deriveTraceExpansion(
  trace: UpstreamTrace,
  data: LineageData
): { systemIds: string[]; tableIds: string[] } {
  const systemIds = new Set<string>(trace.pathSystemIds);
  const tableIds = new Set<string>();

  for (const nodeId of trace.attributeNodeIds) {
    const parsed = parseAttributeNodeId(nodeId);
    if (!parsed) continue;

    const table = data.tables.find((item) => item.id === parsed.tableId);
    if (!table) continue;

    systemIds.add(table.systemId);
    tableIds.add(table.id);
  }

  if (trace.target.tableId) {
    const targetTable = data.tables.find(
      (item) => item.id === trace.target.tableId
    );
    if (targetTable) {
      systemIds.add(targetTable.systemId);
      tableIds.add(targetTable.id);
    }
  }

  return {
    systemIds: Array.from(systemIds),
    tableIds: Array.from(tableIds),
  };
}

export function mapTraceToSystemGraphHighlight(
  trace: UpstreamTrace,
  data: LineageData
): SystemGraphHighlight {
  const attributeNodeIds = new Set<string>();
  const highlightedTableIds = new Set<string>();

  for (const nodeId of trace.attributeNodeIds) {
    const parsed = parseAttributeNodeId(nodeId);
    if (!parsed) continue;

    const table = data.tables.find((item) => item.id === parsed.tableId);
    if (!table) continue;

    attributeNodeIds.add(
      attributeFlowNodeId(table.systemId, table.id, parsed.attributeId)
    );
    highlightedTableIds.add(table.id);
  }

  let targetNodeId: string | null = null;

  if (trace.target.tableId && trace.target.attributeId) {
    const table = data.tables.find(
      (item) => item.id === trace.target.tableId
    );

    if (table) {
      targetNodeId = attributeFlowNodeId(
        table.systemId,
        table.id,
        trace.target.attributeId
      );
    }
  }

  return {
    attributeNodeIds,
    edgeIds: trace.edgeIds,
    pathSystemIds: trace.pathSystemIds,
    boundarySystemIds: trace.boundarySystemIds,
    highlightedTableIds,
    targetNodeId,
  };
}

export function traceUsesTable(
  trace: UpstreamTrace,
  tableId: string
): boolean {
  for (const nodeId of trace.attributeNodeIds) {
    if (nodeId.startsWith(`${tableId}.`)) return true;
  }

  return false;
}
