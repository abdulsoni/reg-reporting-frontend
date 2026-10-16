import type {
  LineageData,
  LineageDependency,
  LineageEdge,
  LineageSystem,
  LineageTable,
} from "../../types/lineage";

export type LineageSystemId =
  | "raw_sensi"
  | "adj_audit"
  | "ref_fx_data"
  | "normalized_data";

export const SCENARIO_VERSION = "1.0";
export const SCENARIO_GENERATED_AT = "2026-10-16T09:00:00Z";
export const ROOT_SYSTEM_ID: LineageSystemId = "normalized_data";

/**
 * Every system this graph dataset knows about, as it looks when it is fully
 * connected and its metadata has been scanned. Scenarios include only the
 * subset that is actually connected for that scenario.
 */
export const systemCatalog: Record<LineageSystemId, LineageSystem> = {
  raw_sensi: {
    id: "raw_sensi",
    label: "raw_sensi.db",
    description: "Upstream sensitivity source database.",
    connectionStatus: "connected",
    metadataStatus: "available",
  },
  adj_audit: {
    id: "adj_audit",
    label: "adj_audit.db",
    description: "Adjustment audit and approval database.",
    connectionStatus: "connected",
    metadataStatus: "available",
  },
  ref_fx_data: {
    id: "ref_fx_data",
    label: "ref_fx_data.db",
    description: "FX reference rate database.",
    connectionStatus: "connected",
    metadataStatus: "available",
  },
  normalized_data: {
    id: "normalized_data",
    label: "normalized_data.db",
    description: "Normalized reporting output database.",
    connectionStatus: "connected",
    metadataStatus: "available",
    target: true,
  },
};

/**
 * Tables keyed by fully qualified id (`systemId:tableName`). Table and
 * attribute ids are stable so edges can reference them across scenarios even
 * when the owning system is not connected.
 */
export const tableCatalog: Record<string, LineageTable> = {
  "raw_sensi:raw_sensi": {
    id: "raw_sensi:raw_sensi",
    name: "raw_sensi",
    systemId: "raw_sensi",
    attributes: [
      { id: "trade_id", name: "trade_id", dataType: "string", transformation: "", status: "confirmed" },
      { id: "product_type", name: "product_type", dataType: "string", transformation: "", status: "confirmed" },
      { id: "sensitivity_id", name: "sensitivity_id", dataType: "string", transformation: "", status: "confirmed" },
      { id: "instrument_id", name: "instrument_id", dataType: "string", transformation: "", status: "confirmed" },
      { id: "risk_factor_id", name: "risk_factor_id", dataType: "string", transformation: "", status: "confirmed" },
      { id: "risk_class", name: "risk_class", dataType: "string", transformation: "", status: "confirmed" },
      { id: "sensitivity_type", name: "sensitivity_type", dataType: "string", transformation: "", status: "confirmed" },
      { id: "tenor", name: "tenor", dataType: "string", transformation: "", status: "confirmed" },
      { id: "bucket_id", name: "bucket_id", dataType: "string", transformation: "", status: "confirmed" },
      { id: "sensitivity_local", name: "sensitivity_local", dataType: "number", transformation: "", status: "confirmed" },
      { id: "currency", name: "currency", dataType: "string", transformation: "", status: "confirmed" },
    ],
  },

  "adj_audit:adj_audit": {
    id: "adj_audit:adj_audit",
    name: "adj_audit",
    systemId: "adj_audit",
    attributes: [
      { id: "adjustment_id", name: "adjustment_id", dataType: "string", transformation: "", status: "confirmed" },
      { id: "sensitivity_id", name: "sensitivity_id", dataType: "string", transformation: "", status: "confirmed" },
      { id: "trade_id", name: "trade_id", dataType: "string", transformation: "", status: "confirmed" },
      { id: "adjustment_type", name: "adjustment_type", dataType: "string", transformation: "", status: "confirmed" },
      { id: "adjustment_amount_local", name: "adjustment_amount_local", dataType: "number", transformation: "", status: "confirmed" },
      { id: "reason_code", name: "reason_code", dataType: "string", transformation: "", status: "confirmed" },
      { id: "maker_id", name: "maker_id", dataType: "string", transformation: "", status: "confirmed" },
      { id: "checker_id", name: "checker_id", dataType: "string", transformation: "", status: "confirmed" },
      { id: "approval_status", name: "approval_status", dataType: "string", transformation: "", status: "confirmed" },
    ],
  },

  "ref_fx_data:ref_fx_data": {
    id: "ref_fx_data:ref_fx_data",
    name: "ref_fx_data",
    systemId: "ref_fx_data",
    attributes: [
      { id: "fx_rate", name: "fx_rate", dataType: "number", transformation: "", status: "confirmed" },
      { id: "fx_rate_id", name: "fx_rate_id", dataType: "string", transformation: "", status: "confirmed" },
      { id: "currency", name: "currency", dataType: "string", transformation: "", status: "confirmed" },
    ],
  },

  "normalized_data:raw_sensi": {
    id: "normalized_data:raw_sensi",
    name: "raw_sensi",
    systemId: "normalized_data",
    attributes: [
      { id: "trade_id", name: "trade_id", dataType: "string", transformation: "r.trade_id", status: "confirmed" },
      { id: "original_local", name: "original_local", dataType: "number", transformation: "r.sensitivity_local", status: "confirmed" },
      {
        id: "adjusted_local",
        name: "adjusted_local",
        dataType: "number",
        transformation: "r.original_local + COALESCE(a.approved_adjustment_local, 0)",
        status: "confirmed",
      },
      {
        id: "normalized_usd",
        name: "normalized_usd",
        dataType: "number",
        transformation: "adjusted_local * f.fx_rate",
        status: "confirmed",
      },
    ],
  },

  "normalized_data:adj_data": {
    id: "normalized_data:adj_data",
    name: "adj_data",
    systemId: "normalized_data",
    attributes: [
      { id: "adjustment_id", name: "adjustment_id", dataType: "number", transformation: "", status: "confirmed" },
      { id: "adjustment_type", name: "adjustment_type", dataType: "string", transformation: "", status: "confirmed" },
      {
        id: "approved_adjustment_local",
        name: "approved_adjustment_local",
        dataType: "number",
        transformation: "CASE WHEN a.approval_status = 'APPROVED' THEN a.adjustment_amount_local ELSE 0 END",
        sourceSystemId: "adj_audit",
        status: "confirmed",
      },
      { id: "approval_status", name: "approval_status", dataType: "string", transformation: "", status: "confirmed" },
    ],
  },

  "normalized_data:ref_fx_data": {
    id: "normalized_data:ref_fx_data",
    name: "ref_fx_data",
    systemId: "normalized_data",
    attributes: [
      {
        id: "fx_rate",
        name: "fx_rate",
        dataType: "number",
        transformation: "f.fx_rate",
        sourceSystemId: "ref_fx_data",
        status: "confirmed",
      },
      { id: "fx_rate_id", name: "fx_rate_id", dataType: "string", transformation: "", status: "confirmed" },
    ],
  },
};

/**
 * All lineage relationships known to the dataset, including cross-system edges
 * whose source system may not be connected in a given scenario. Endpoints are
 * fully qualified so the frontend can resolve or placeholder them locally.
 */
export const edgeCatalog: LineageEdge[] = [
  {
    id: "e-source-original",
    kind: "attribute",
    source: { systemId: "raw_sensi", tableId: "raw_sensi:raw_sensi", attributeId: "sensitivity_local" },
    target: { systemId: "normalized_data", tableId: "normalized_data:raw_sensi", attributeId: "original_local" },
    transformation: "r.sensitivity_local",
    description: "Source sensitivity amount becomes the normalized original amount.",
    status: "confirmed",
  },
  {
    id: "e-source-trade",
    kind: "attribute",
    source: { systemId: "raw_sensi", tableId: "raw_sensi:raw_sensi", attributeId: "trade_id" },
    target: { systemId: "normalized_data", tableId: "normalized_data:raw_sensi", attributeId: "trade_id" },
    transformation: "r.trade_id",
    description: "Source trade identifier is carried into normalized output.",
    status: "confirmed",
  },
  {
    id: "e-audit-adjustment",
    kind: "attribute",
    source: { systemId: "adj_audit", tableId: "adj_audit:adj_audit", attributeId: "adjustment_amount_local" },
    target: { systemId: "normalized_data", tableId: "normalized_data:adj_data", attributeId: "approved_adjustment_local" },
    transformation: "CASE WHEN a.approval_status = 'APPROVED' THEN a.adjustment_amount_local ELSE 0 END",
    description: "Only approved adjustment amounts contribute to normalized adjustment.",
    status: "confirmed",
    joinConditions: [
      {
        sourceTableId: "adj_audit:adj_audit",
        sourceAttributeId: "trade_id",
        targetTableId: "raw_sensi:raw_sensi",
        targetAttributeId: "trade_id",
        operator: "=",
      },
      {
        sourceTableId: "adj_audit:adj_audit",
        sourceAttributeId: "sensitivity_id",
        targetTableId: "raw_sensi:raw_sensi",
        targetAttributeId: "sensitivity_id",
        operator: "=",
      },
    ],
  },
  {
    id: "e-fx-source",
    kind: "attribute",
    source: { systemId: "ref_fx_data", tableId: "ref_fx_data:ref_fx_data", attributeId: "fx_rate" },
    target: { systemId: "normalized_data", tableId: "normalized_data:ref_fx_data", attributeId: "fx_rate" },
    transformation: "f.fx_rate",
    description: "FX rate is brought into normalized data.",
    status: "confirmed",
    joinConditions: [
      {
        sourceTableId: "ref_fx_data:ref_fx_data",
        sourceAttributeId: "currency",
        targetTableId: "raw_sensi:raw_sensi",
        targetAttributeId: "currency",
        operator: "=",
      },
    ],
  },
  {
    id: "e-fx-normalized",
    kind: "attribute",
    source: { systemId: "ref_fx_data", tableId: "ref_fx_data:ref_fx_data", attributeId: "fx_rate" },
    target: { systemId: "normalized_data", tableId: "normalized_data:raw_sensi", attributeId: "normalized_usd" },
    transformation: "f.fx_rate",
    description: "FX rate is used to calculate normalized USD.",
    status: "confirmed",
  },
  {
    id: "e-original-adjusted",
    kind: "attribute",
    source: { systemId: "normalized_data", tableId: "normalized_data:raw_sensi", attributeId: "original_local" },
    target: { systemId: "normalized_data", tableId: "normalized_data:raw_sensi", attributeId: "adjusted_local" },
    transformation: "r.original_local + COALESCE(a.approved_adjustment_local, 0)",
    description: "Original local amount contributes to adjusted amount.",
    status: "confirmed",
  },
  {
    id: "e-adjustment-adjusted",
    kind: "attribute",
    source: { systemId: "normalized_data", tableId: "normalized_data:adj_data", attributeId: "approved_adjustment_local" },
    target: { systemId: "normalized_data", tableId: "normalized_data:raw_sensi", attributeId: "adjusted_local" },
    transformation: "COALESCE(a.approved_adjustment_local, 0)",
    description: "Approved adjustment is added to the original amount.",
    status: "confirmed",
  },
  {
    id: "e-adjusted-usd",
    kind: "attribute",
    source: { systemId: "normalized_data", tableId: "normalized_data:raw_sensi", attributeId: "adjusted_local" },
    target: { systemId: "normalized_data", tableId: "normalized_data:raw_sensi", attributeId: "normalized_usd" },
    transformation: "adjusted_local * f.fx_rate",
    description: "Adjusted local amount is converted to USD.",
    status: "confirmed",
  },
];

const dependencyCatalog: Record<LineageSystemId, LineageDependency> = {
  raw_sensi: {
    systemId: "raw_sensi",
    systemName: "raw_sensi.db",
    connectionStatus: "not_connected",
    metadataStatus: "unavailable",
    message: "Please connect raw_sensi.db to explore its tables and attributes.",
  },
  adj_audit: {
    systemId: "adj_audit",
    systemName: "adj_audit.db",
    connectionStatus: "not_connected",
    metadataStatus: "unavailable",
    message: "Please connect adj_audit.db to explore its tables and attributes.",
  },
  ref_fx_data: {
    systemId: "ref_fx_data",
    systemName: "ref_fx_data.db",
    connectionStatus: "not_connected",
    metadataStatus: "unavailable",
    message: "Please connect ref_fx_data.db to explore its tables and attributes.",
  },
  normalized_data: {
    systemId: "normalized_data",
    systemName: "normalized_data.db",
    connectionStatus: "not_connected",
    metadataStatus: "unavailable",
    message: "Please connect normalized_data.db to explore its tables and attributes.",
  },
};

export type ScenarioDefinition = {
  connectedSystemIds: LineageSystemId[];
  tableIds: string[];
  dependencyIds: LineageSystemId[];
};

/**
 * Assemble a complete single-response graph for one scenario. Only connected
 * systems and their tables are included; unconnected systems keep their
 * identity in `dependencies` and remain referenced by lineage edges.
 */
export function buildScenario(definition: ScenarioDefinition): LineageData {
  return {
    version: SCENARIO_VERSION,
    metadata: {
      rootSystemId: ROOT_SYSTEM_ID,
      generatedAt: SCENARIO_GENERATED_AT,
      layout: "dagre",
    },
    systems: definition.connectedSystemIds.map((id) => systemCatalog[id]),
    tables: definition.tableIds.map((id) => tableCatalog[id]),
    lineageEdges: edgeCatalog,
    dependencies: definition.dependencyIds.map((id) => dependencyCatalog[id]),
  };
}
