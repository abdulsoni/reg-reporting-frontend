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
