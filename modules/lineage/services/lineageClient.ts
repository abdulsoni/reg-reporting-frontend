import type {
  ConnectRequest,
  ConnectResponse,
  DatapointRef,
  ExploreResponse,
  LineageGraph,
  LineageHop,
  StartTraceRequest,
  SystemDescriptor,
  TraceSummary,
} from "../types/lineage";

export type ExploreQuery = {
  system: string;
  table: string;
  attribute: string;
  datapoint?: DatapointRef | null;
};

export interface LineageApi {
  listSystems(): Promise<SystemDescriptor[]>;

  connectSystem(request: ConnectRequest): Promise<ConnectResponse>;

  explore(query: ExploreQuery): Promise<ExploreResponse>;

  startTrace(request: StartTraceRequest): Promise<TraceSummary>;

  getTrace(traceId: string): Promise<TraceSummary>;

  getTraceHops(traceId: string): Promise<LineageHop[]>;

  getTraceGraph(traceId: string): Promise<LineageGraph>;
}