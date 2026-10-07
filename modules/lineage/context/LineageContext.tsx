"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

import { lineageApi } from "../services";
import { parseSourceReference } from "../utils/sourceReference";
import type { SourceReference } from "../utils/sourceReference";
import type { Datapoint } from "../types/report";
import type {
  LineageGraph,
  LineageHop,
  NextSource,
  SystemDescriptor,
  TraceStatus,
  TraceSummary,
} from "../types/lineage";

export type LineagePhase = "IDLE" | "RUNNING" | TraceStatus;

type BeginTraceInput = {
  reportId: string;
  datapoint: Datapoint;
  system: SystemDescriptor;
};

interface LineageContextValue {
  /* Inputs */
  selectedDatapoint: Datapoint | null;
  selectDatapoint: (datapoint: Datapoint | null) => void;

  /* Trace state */
  phase: LineagePhase;
  traceId: string | null;
  hops: LineageHop[];
  graph: LineageGraph | null;
  nextSource: NextSource | null;
  connectedSystems: string[];
  currentSystem: string | null;
  busy: boolean;
  error: string | null;

  /* Derived */
  isComplete: boolean;
  isLoop: boolean;
  needsConnection: boolean;

  /* Actions */
  beginTrace: (input: BeginTraceInput) => Promise<boolean>;
  connectNextSource: (system: SystemDescriptor) => Promise<boolean>;
  refreshTrace: () => Promise<void>;
  resetTrace: () => void;
  clearError: () => void;
}

const LineageContext = createContext<LineageContextValue | undefined>(
  undefined
);

function messageFor(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "Unexpected lineage error";
}

const NO_NEXT_SOURCE: NextSource = {
  system: null,
  table: null,
  attribute: null,
  connection_required: false,
};

/**
 * The API reports only which system blocks the trace, so the table and column it
 * resolves into are read back off the upstream reference the hops published.
 */
function deriveNextSource(summary: TraceSummary): NextSource {
  if (!summary.next_system) return NO_NEXT_SOURCE;

  const pending = summary.pending_systems;

  const upstream = summary.hops
    .map((hop) => parseSourceReference(hop.source_from))
    .find(
      (reference): reference is SourceReference =>
        reference !== null && pending.includes(reference.system)
    );

  return {
    system: summary.next_system,
    table: upstream?.table ?? null,
    attribute: upstream?.attribute ?? null,
    connection_required: true,
  };
}

export function LineageProvider({ children }: { children: React.ReactNode }) {
  const [selectedDatapoint, setSelectedDatapoint] = useState<Datapoint | null>(
    null
  );
  const [phase, setPhase] = useState<LineagePhase>("IDLE");
  const [traceId, setTraceId] = useState<string | null>(null);
  const [datapointId, setDatapointId] = useState<string | null>(null);
  const [reportId, setReportId] = useState<string | null>(null);
  const [hops, setHops] = useState<LineageHop[]>([]);
  const [graph, setGraph] = useState<LineageGraph | null>(null);
  const [nextSource, setNextSource] = useState<NextSource | null>(null);
  const [connectedSystems, setConnectedSystems] = useState<string[]>([]);
  const [currentSystem, setCurrentSystem] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pullArtifacts = useCallback(async (id: string) => {
    const [hopList, graphData] = await Promise.all([
      lineageApi.getTraceHops(id),
      lineageApi.getTraceGraph(id),
    ]);

    setHops(hopList);
    setGraph(graphData);
  }, []);

  const addConnected = useCallback((system: string) => {
    setConnectedSystems((previous) =>
      previous.includes(system) ? previous : [...previous, system]
    );
  }, []);

  const applySummary = useCallback(
    (summary: TraceSummary) => {
      setTraceId(summary.trace_id);
      setNextSource(deriveNextSource(summary));
      setPhase(summary.status);
      setCurrentSystem(summary.current_system);
    },
    []
  );

  const beginTrace = useCallback(
    async ({ reportId, datapoint, system }: BeginTraceInput) => {
      setBusy(true);
      setError(null);

      try {
        await lineageApi.connectSystem({
          system: system.name,
          db_type: system.db_type,
          database: system.database_file,
        });

        const summary = await lineageApi.startTrace({
          system: system.name,
          datapoint_id: datapoint.id,
          report_id: reportId,
        });

        setDatapointId(datapoint.id);
        setReportId(reportId);

        applySummary(summary);
        addConnected(system.name);

        await pullArtifacts(summary.trace_id);

        return true;
      } catch (caught) {
        setError(messageFor(caught));
        setPhase("FAILED");

        return false;
      } finally {
        setBusy(false);
      }
    },
    [addConnected, applySummary, pullArtifacts]
  );

  const connectNextSource = useCallback(
    async (system: SystemDescriptor) => {
      if (!traceId || !datapointId || !reportId) return false;

      setBusy(true);
      setError(null);

      try {
        await lineageApi.connectSystem({
          system: system.name,
          db_type: system.db_type,
          database: system.database_file,
        });

        /*
         * GET /lineage/trace only replays the hops already stored, so the walk
         * has to be re-entered with its trace_id to continue past the system the
         * connection just unblocked.
         */
        const summary = await lineageApi.startTrace({
          system: system.name,
          datapoint_id: datapointId,
          report_id: reportId,
          trace_id: traceId,
        });

        applySummary(summary);
        addConnected(system.name);

        await pullArtifacts(traceId);

        return true;
      } catch (caught) {
        setError(messageFor(caught));
        setPhase("FAILED");

        return false;
      } finally {
        setBusy(false);
      }
    },
    [addConnected, applySummary, datapointId, pullArtifacts, reportId, traceId]
  );

  const refreshTrace = useCallback(async () => {
    if (!traceId) return;

    const summary = await lineageApi.getTrace(traceId);

    applySummary(summary);

    await pullArtifacts(traceId);
  }, [applySummary, pullArtifacts, traceId]);

  const resetTrace = useCallback(() => {
    setPhase("IDLE");
    setTraceId(null);
    setDatapointId(null);
    setReportId(null);
    setHops([]);
    setGraph(null);
    setNextSource(null);
    setConnectedSystems([]);
    setCurrentSystem(null);
    setError(null);
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const value = useMemo<LineageContextValue>(() => {
    const isComplete =
      phase === "SOURCE_REACHED" || phase === "COMPLETED";

    return {
      selectedDatapoint,
      selectDatapoint: setSelectedDatapoint,
      phase,
      traceId,
      hops,
      graph,
      nextSource,
      connectedSystems,
      currentSystem,
      busy,
      error,
      isComplete,
      isLoop: phase === "LOOP_DETECTED",
      needsConnection:
        phase === "CONNECTION_REQUIRED" &&
        Boolean(nextSource?.system) &&
        !isComplete,
      beginTrace,
      connectNextSource,
      refreshTrace,
      resetTrace,
      clearError,
    };
  }, [
    beginTrace,
    busy,
    clearError,
    connectedSystems,
    connectNextSource,
    currentSystem,
    error,
    graph,
    hops,
    nextSource,
    phase,
    refreshTrace,
    resetTrace,
    selectedDatapoint,
    traceId,
  ]);

  return (
    <LineageContext.Provider value={value}>
      {children}
    </LineageContext.Provider>
  );
}

export function useLineage(): LineageContextValue {
  const context = useContext(LineageContext);

  if (!context) {
    throw new Error("useLineage must be used inside LineageProvider");
  }

  return context;
}