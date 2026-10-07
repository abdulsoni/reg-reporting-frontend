import { apiUrl } from "../lib/config";
import type {
  ConnectRequest,
  ConnectResponse,
  ExploreResponse,
  LineageGraph,
  LineageHop,
  StartTraceRequest,
  SystemDescriptor,
  TraceSummary,
} from "../types/lineage";
import type { ExploreQuery, LineageApi } from "./lineageClient";

class LineageApiError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message);
    this.name = "LineageApiError";
  }
}

async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(apiUrl(path), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  if (!response.ok) {
    let detail = response.statusText;

    try {
      const body = await response.json();
      if (body?.detail) detail = body.detail;
    } catch {
      // Non-JSON error body; keep the status text.
    }

    throw new LineageApiError(detail, response.status);
  }

  if (response.status === 204) return undefined as T;

  return (await response.json()) as T;
}

/**
 * The API publishes the system registry under /seed/systems, and names the
 * database field `database_name`. Only seeded systems are worth offering, since
 * an unseeded one has no metadata to trace.
 */
type SeedSystemInfo = {
  name: string;
  db_type: string;
  database_name: string;
  seeded: boolean;
  database_file:string;
};

export const httpLineageApi: LineageApi = {
  listSystems(): Promise<SystemDescriptor[]> {
    return apiRequest<SeedSystemInfo[]>("/seed/systems").then((list) =>
      list
        .filter((system) => system.seeded)
        .map((system) => ({
          name: system.name,
          db_type: system.db_type,
          database: system.database_name,
          database_file:system.database_file
        }))
    );
  },

  connectSystem(request: ConnectRequest): Promise<ConnectResponse> {
    return apiRequest<ConnectResponse>("/lineage/connect", {
      method: "POST",
      body: JSON.stringify(request),
    });
  },

  explore(query: ExploreQuery): Promise<ExploreResponse> {
    const params = new URLSearchParams({
      system: query.system,
      table: query.table,
      attribute: query.attribute,
    });

    if (query.datapoint) {
      params.set("report_code", query.datapoint.report_code ?? "");
      params.set("row_code", query.datapoint.row_code);
      params.set("column_code", query.datapoint.column_code);
    }

    return apiRequest<ExploreResponse>(`/lineage/explore?${params.toString()}`);
  },

  startTrace(request: StartTraceRequest): Promise<TraceSummary> {
    return apiRequest<TraceSummary>("/lineage/trace", {
      method: "POST",
      body: JSON.stringify(request),
    });
  },

  getTrace(traceId: string): Promise<TraceSummary> {
    return apiRequest<TraceSummary>(`/lineage/trace/${traceId}`);
  },

  getTraceHops(traceId: string): Promise<LineageHop[]> {
    return apiRequest<LineageHop[]>(`/lineage/trace/${traceId}/hops`);
  },

  getTraceGraph(traceId: string): Promise<LineageGraph> {
    return apiRequest<LineageGraph>(`/lineage/trace/${traceId}/graph`);
  },
};