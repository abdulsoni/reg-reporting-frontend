import type {
  ConnectRequest,
  ConnectResponse,
  ExploreResponse,
  HopStatus,
  LineageGraph,
  LineageHop,
  NextSource,
  StartTraceRequest,
  SystemDescriptor,
  TraceStatus,
  TraceSummary,
} from "../../types/lineage";
import type { ExploreQuery, LineageApi } from "../lineageClient";
import {
  BRANCH_CHAIN,
  PRIMARY_CHAIN,
  SYSTEMS,
  buildGraph,
  buildNextSource,
  findMeta,
  hopStatusFor,
  parseSourceReference,
  parseSourceReferences,
} from "./fixtures";

type Meta = {
  system: string;
  table: string;
  attribute: string;
  transformation: string | null;
  consumed_by: string | null;
  source_from: string | null;
};

/** An upstream column that cannot be followed until its system is connected. */
type PendingTarget = {
  system: string;
  table: string;
  attribute: string;
};

type TraceState = {
  traceId: string;
  reportId: string | null;
  datapointId: string | null;
  originSystem: string;
  hops: LineageHop[];
  connected: Set<string>;
  visited: Set<string>;
  pending: PendingTarget[];
  finalSources: string[];
  unresolved: number;
  loops: number;
};

const traces = new Map<string, TraceState>();

/*
 * The trace request names its own system, but the mock still remembers the last
 * connection so an ad-hoc trace with no system has something to anchor to.
 */
let lastConnected: string | null = null;

const LATENCY_MS = 400;

const NO_NEXT_SOURCE: NextSource = {
  system: null,
  table: null,
  attribute: null,
  connection_required: false,
};

function delay(ms: number = LATENCY_MS): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function metaToHop(meta: Meta, index: number, status: HopStatus): LineageHop {
  return {
    hop: index,
    system: meta.system,
    table_name: meta.table,
    attribute_name: meta.attribute,
    transformation: meta.transformation,
    source_from: meta.source_from,
    consumed_by: meta.consumed_by,
    status,
  };
}

/**
 * Follow one column's metadata and push a hop, mirroring the backend's per-column
 * walk: same-system and already-connected systems recurse immediately, anything
 * else is parked until the user connects it, and a column with no upstream
 * reference is the system of record.
 */
function consume(
  trace: TraceState,
  system: string,
  table: string,
  attribute: string
): void {
  const key = `${system}.${table}.${attribute}`;

  if (trace.visited.has(key)) {
    trace.loops += 1;
    trace.hops.push({
      hop: trace.hops.length + 1,
      system,
      table_name: table,
      attribute_name: attribute,
      transformation: null,
      source_from: null,
      consumed_by: null,
      status: "LOOP_DETECTED",
    });

    return;
  }

  trace.visited.add(key);

  const meta = findMeta(system, table, attribute);

  if (!meta) {
    trace.unresolved += 1;
    trace.hops.push({
      hop: trace.hops.length + 1,
      system,
      table_name: table,
      attribute_name: attribute,
      transformation: null,
      source_from: null,
      consumed_by: null,
      status: "METADATA_NOT_FOUND",
    });

    return;
  }

  trace.hops.push(
    metaToHop(meta, trace.hops.length + 1, hopStatusFor(meta))
  );

  const targets = parseSourceReferences(meta.source_from);

  if (targets.length === 0) {
    trace.finalSources.push(key);

    return;
  }

  for (const target of targets) {
    if (trace.connected.has(target.system)) {
      consume(trace, target.system, target.table, target.attribute);
    } else if (
      !trace.pending.some(
        (pending) =>
          pending.system === target.system &&
          pending.table === target.table &&
          pending.attribute === target.attribute
      )
    ) {
      trace.pending.push(target);
    }
  }
}

/** Drain every parked target whose system has since been connected. */
function resume(trace: TraceState): void {
  let guard = 0;

  while (guard++ < 200) {
    const index = trace.pending.findIndex((target) =>
      trace.connected.has(target.system)
    );

    if (index < 0) return;

    const [target] = trace.pending.splice(index, 1);

    consume(trace, target.system, target.table, target.attribute);
  }
}

/** Same precedence the backend applies when deciding a trace's status. */
function statusFor(trace: TraceState): TraceStatus {
  if (trace.finalSources.length > 0) {
    return trace.pending.length > 0 ? "CONNECTION_REQUIRED" : "COMPLETED";
  }

  if (trace.pending.length > 0) return "CONNECTION_REQUIRED";
  if (trace.unresolved > 0) return "METADATA_NOT_FOUND";
  if (trace.loops > 0) return "LOOP_DETECTED";

  return "PENDING";
}

function summary(trace: TraceState): TraceSummary {
  return {
    trace_id: trace.traceId,
    report_id: trace.reportId,
    datapoint_id: trace.datapointId,
    status: statusFor(trace),
    hops: trace.hops,
    next_system: trace.pending[0]?.system ?? null,
    pending_systems: [...new Set(trace.pending.map((t) => t.system))],
    final_sources: [...trace.finalSources],
    current_system: trace.originSystem,
  };
}

function newTrace(
  traceId: string,
  system: string,
  reportId: string | null,
  datapointId: string | null
): TraceState {
  return {
    traceId,
    reportId,
    datapointId,
    originSystem: system,
    hops: [],
    connected: new Set([system]),
    visited: new Set(),
    pending: [],
    finalSources: [],
    unresolved: 0,
    loops: 0,
  };
}

export const mockLineageApi: LineageApi = {
  async listSystems(): Promise<SystemDescriptor[]> {
    await delay(150);
    return SYSTEMS;
  },

  async connectSystem(
    request: ConnectRequest
  ): Promise<ConnectResponse> {
    await delay();

    /*
     * Without a system in the request the connection is identified by its
     * database: a registered system matches on its file, anything else is
     * treated under the name its database implies.
     */
    const descriptor =
      SYSTEMS.find(
        (system) =>
          system.database_file === request.database ||
          system.database === request.database
      ) ?? null;

    const systemName =
      descriptor?.name ?? request.database.replace(/\.[^.]+$/, "");

    for (const trace of traces.values()) {
      const wasBlocked = trace.pending.some(
        (target) => target.system === systemName
      );

      if (trace.connected.has(systemName) || !wasBlocked) continue;

      trace.connected.add(systemName);
      resume(trace);
    }

    lastConnected = systemName;

    return {
      status: "success",
      system: systemName,
      db_type: request.db_type,
      database: request.database,
      message: `Connected to ${systemName} (${request.database}) read-only.`,
    };
  },

  async explore(query: ExploreQuery): Promise<ExploreResponse> {
    await delay();

    const trace = newTrace(`adhoc-${query.system}`, query.system, null, null);

    consume(trace, query.system, query.table, query.attribute);

    const meta = findMeta(query.system, query.table, query.attribute);
    const status = statusFor(trace);

    return {
      status: status === "PENDING" ? "CONNECTION_REQUIRED" : status,
      hop: trace.hops[0],
      next_source: meta ? buildNextSource(meta) : NO_NEXT_SOURCE,
    };
  },

  async startTrace(request: StartTraceRequest): Promise<TraceSummary> {
    await delay();

    const existing = request.trace_id
      ? traces.get(request.trace_id)
      : undefined;

    if (existing) {
      // Resuming means the caller has already connected the blocking system,
      // so the walk picks up from the parked upstream column.
      resume(existing);

      return summary(existing);
    }

    /*
     * The trace names the system it runs against, so that connection anchors
     * the walk the way the backend would; only ad-hoc calls fall back to the
     * most recent connection.
     */
    const origin = request.system ?? lastConnected ?? "reporting_db";
    const traceId = `trace-${request.report_id ?? request.datapoint_id}`;
    const trace = newTrace(
      traceId,
      origin,
      request.report_id ?? null,
      request.datapoint_id ?? null
    );

    traces.set(traceId, trace);

    /*
     * The mock has no catalog of stored datapoints, so a trace always starts at
     * the report anchor. The HTTP adapter passes the real datapoint_id through
     * and the backend resolves the anchor itself.
     */
    const anchor = PRIMARY_CHAIN[0];

    consume(trace, origin, anchor.table, anchor.attribute);

    return summary(trace);
  },

  async getTrace(traceId: string): Promise<TraceSummary> {
    await delay(150);

    const trace = traces.get(traceId);

    if (!trace) throw new Error(`Unknown trace: ${traceId}`);

    return summary(trace);
  },

  async getTraceHops(traceId: string): Promise<LineageHop[]> {
    await delay(150);

    const trace = traces.get(traceId);

    if (!trace) throw new Error(`Unknown trace: ${traceId}`);

    return trace.hops;
  },

  async getTraceGraph(traceId: string): Promise<LineageGraph> {
    await delay(200);

    const trace = traces.get(traceId);

    if (!trace) throw new Error(`Unknown trace: ${traceId}`);

    const full = buildGraph();

    // Show systems the user has actually connected, plus the immediate next
    // source so a pending connection is visible on the graph.
    const included = new Set(trace.connected);

    for (const target of trace.pending) included.add(target.system);

    for (const hop of trace.hops) {
      const parsed = parseSourceReference(hop.source_from);

      if (parsed) included.add(parsed.system);
    }

    // The collateral branch hangs off sa_engine, so reveal it once that
    // system's branch column has been reached.
    if (trace.connected.has("sa_engine")) {
      for (const meta of BRANCH_CHAIN) included.add(meta.system);
    }

    const nodes = full.nodes.filter((node) => included.has(node.data.system));

    const ids = new Set(nodes.map((node) => node.id));
    const edges = full.edges.filter(
      (edge) => ids.has(edge.source) && ids.has(edge.target)
    );

    return { nodes, edges };
  },
};