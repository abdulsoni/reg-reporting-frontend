export const SYSTEMS = [
  "reporting_db",
  "sa_engine",
  "dwh",
  "staging",
  "loans_db",
  "collateral_db",
] as const;

export type SystemName = (typeof SYSTEMS)[number];

export const TRACE_STATUSES = [
  "PENDING",
  "CONNECTION_REQUIRED",
  "SOURCE_REACHED",
  "COMPLETED",
  "FAILED",
  "LOOP_DETECTED",
  "METADATA_NOT_FOUND",
] as const;

export type TraceStatus = (typeof TRACE_STATUSES)[number];

export const HOP_STATUSES = [
  "IDENTIFIED",
  "SOURCE_REACHED",
  "LOOP_DETECTED",
  "METADATA_NOT_FOUND",
  "AMBIGUOUS_METADATA",
] as const;

export type HopStatus = (typeof HOP_STATUSES)[number];

export type LineageHop = {
  hop: number;
  system: string;
  attribute_name: string;
  table_name: string;
  transformation: string | null;
  source_from: string | null;
  consumed_by: string | null;
  status: HopStatus;
};

export type NextSource = {
  system: string | null;
  table: string | null;
  attribute: string | null;
  connection_required: boolean;
};

export type ExploreResponse = {
  status: TraceStatus;
  hop: LineageHop;
  next_source: NextSource;
};

/*
 * POST /lineage/connect identifies the connection by its type and database
 * only — the backend resolves the registered system itself, so no system
 * name is sent.
 */
export type ConnectRequest = {
  db_type: string;
  database: string;
};

export type ConnectResponse = {
  status: "success";
  system: string;
  db_type: string;
  database: string;
  message: string;
};

/** One system included in the all-connected lineage snapshot. */
export type ConnectedLineageSystem = {
  system: string;
  sourceObject: string;
  rowCount: number;
  resolved: boolean;
};

/** One discovered column in the all-connected lineage snapshot. */
export type ConnectedLineageRow = {
  system: string;
  attribute_name: string;
  table_name: string;
  transformation: string;
  sourced_from: string;
  consumed_by: string;
  status: string;
};

/**
 * GET /lineage/connected — either the complete lineage snapshot once every
 * source system has been connected, or a 409 body reporting which systems are
 * still missing.
 */
export type ConnectedLineageResponse = {
  allSystemsConnected: boolean;
  detail?: string;
  missingSystems?: string[];
  lineageGraphUrl?: string;
  systemsConnected?: number;
  systemsOfRecordReached?: number;
  branchOutstanding?: number;
  systems?: ConnectedLineageSystem[];
  rows?: ConnectedLineageRow[];
};

export type DatapointRef = {
  report_code: string | null;
  row_code: string;
  column_code: string;
  attribute: string;
  value: string;
};

/**
 * POST /lineage/trace starts from a stored datapoint id. Pass `trace_id` to
 * resume a trace that was parked waiting on a system connection. The system the
 * trace runs against is the one the backend resolved for the last
 * /lineage/connect call, so its identity travels with every trace request.
 */
export type StartTraceRequest = {
  datapoint_id: string;
  system: string;
  db_type: string;
  database: string;
  report_id?: string | null;
  trace_id?: string | null;
};

/** Mirrors the backend's TraceResult. */
export type TraceSummary = {
  trace_id: string;
  report_id: string | null;
  datapoint_id: string | null;
  status: TraceStatus;
  hops: LineageHop[];
  next_system: string | null;
  pending_systems: string[];
  final_sources: string[];
  current_system: string | null;
};

export type GraphNodeData = {
  system: string;
  /** Absent on upstream nodes the walk has not reached yet. */
  table?: string;
  attribute?: string;
  transformation: string | null;
  status?: HopStatus;
  final_source?: boolean;
  depth?: number;
  pending?: boolean;
};

export type LineageGraph = {
  nodes: Array<{
    id: string;
    type: string;
    position: { x: number; y: number };
    data: GraphNodeData;
  }>;
  edges: Array<{
    id: string;
    source: string;
    target: string;
    label: string;
    animated: boolean;
  }>;
};

export type SystemDescriptor = {
  name: string;
  db_type: string;
  database: string;
  database_file: string;
};

export const CONNECTION_STATUSES = [
  "connected",
  "not_connected",
  "connection_error",
] as const;

export type ConnectionStatus = (typeof CONNECTION_STATUSES)[number];

export const METADATA_STATUSES = [
  "available",
  "unavailable",
  "partial",
  "not_scanned",
] as const;

export type MetadataStatus = (typeof METADATA_STATUSES)[number];

export const LINEAGE_EDGE_STATUSES = [
  "confirmed",
  "inferred",
  "ambiguous",
  "external_dependency",
  "metadata_missing",
] as const;

export type LineageEdgeStatus = (typeof LINEAGE_EDGE_STATUSES)[number];

/** A column discovered while tracing a system's tables. */
export type LineageAttribute = {
  id: string;
  name: string;
  dataType: string;
  transformation: string;
  status: string;
  sourceSystemId?: string;
};

export type LineageTable = {
  id: string;
  name: string;
  systemId: string;
  schema?: string;
  attributes: LineageAttribute[];
};

export type LineageSystem = {
  id: string;
  label: string;
  description: string;
  connectionStatus: ConnectionStatus;
  metadataStatus: MetadataStatus;
  target?: boolean;
};

/**
 * A fully qualified reference to a table or attribute. Keeping system, table
 * and attribute ids together means identically named attributes in different
 * tables can never be confused.
 */
export type LineageEndpoint = {
  systemId: string;
  tableId: string | null;
  attributeId: string | null;
  attributeName?: string;
};

export type LineageJoinCondition = {
  sourceTableId: string;
  sourceAttributeId: string;
  targetTableId: string;
  targetAttributeId: string;
  operator: string;
};

export type LineageEdge = {
  id: string;
  kind: "attribute" | "table";
  source: LineageEndpoint;
  target: LineageEndpoint;
  transformation: string;
  description?: string;
  status: LineageEdgeStatus;
  joinConditions?: LineageJoinCondition[];
};

/**
 * A system referenced by lineage that is not itself included in the graph
 * response, either because it is not connected or its metadata is unavailable.
 * The frontend renders these as "Please connect" placeholders.
 */
export type LineageDependency = {
  systemId: string;
  systemName: string;
  connectionStatus: ConnectionStatus;
  metadataStatus: MetadataStatus;
  message: string;
};

/** The full lineage graph returned by GET /api/lineage/graph. */
export type LineageData = {
  version: string;
  metadata: {
    rootSystemId: string;
    generatedAt: string;
    layout: string;
  };
  systems: LineageSystem[];
  tables: LineageTable[];
  lineageEdges: LineageEdge[];
  dependencies: LineageDependency[];
};
