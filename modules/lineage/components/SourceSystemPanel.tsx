"use client";

import { ChevronDown, Lock, CheckCircle2, AlertCircle } from "lucide-react";
import { useEffect, useState } from "react";

import { useReports } from "../context/ReportContext";
import { useLineage } from "../context/LineageContext";
import { lineageApi } from "../services";
import type { SystemDescriptor } from "../types/lineage";

type SourceSystemPanelProps = {
  onConnect?: () => void;

  /*
   * start  -> Step 1: begins a brand new trace (LineagePage).
   * connect -> Step 2: unblocks the trace parked on a connection required
   *            status, with the credentials filled in by hand (TraceProgress).
   */
  mode?: "start" | "connect";

  /* The surrounding card supplies its own heading. */
  hideTitle?: boolean;
};

/*
 * The request identifies a connection by its type and database, so the
 * picker offers connection kinds rather than registered system names and
 * no system name is sent to the API.
 */
const CONNECTION_TYPES = [
  { value: "", label: "Select connection" },
  { value: "sqlite", label: "Sqlite" },
  { value: "api", label: "Api" },
] as const;

export function SourceSystemPanel({
  onConnect,
  mode = "start",
  hideTitle = false,
}: SourceSystemPanelProps) {
  const { selectedReport } = useReports();

  const {
    selectedDatapoint,
    beginTrace,
    connectNextSource,
    resetTrace,
    traceId,
    nextSource,
    connectedSystems,
    busy,
    error,
    clearError,
  } = useLineage();

  const [systems, setSystems] = useState<SystemDescriptor[]>([]);
  const [connectionType, setConnectionType] = useState("");

  /* Manual credential entry; the backend resolves the system from it. */
  const [database, setDatabase] = useState("");

  /* Last pending system the selection was prealigned with. */
  const [syncedPending, setSyncedPending] = useState<string | null>(null);

  const isConnectMode = mode === "connect";

  /*
   * The registry is still loaded to prefill the connection details of the
   * system the trace is parked on, so it is a data load rather than derived
   * state and belongs in an effect keyed on the adapter.
   */
  useEffect(() => {
    let active = true;

    lineageApi
      .listSystems()
      .then((list) => {
        console.log('list',list)
        if (active) setSystems(list);
      })
      .catch(() => {
        // Without the registry there is nothing to offer as a starting system.
        if (active) clearError();
      });

    return () => {
      active = false;
    };
  }, [clearError]);

  console.log(systems);

  /*
   * The trace tells us which system it is blocked on, so that system's
   * connection type and database are prefilled as the starting values. Both
   * fields stay editable, and the choice is only re-synced when the pending
   * system actually changes (React's previous-state pattern rather than an
   * effect that would fight manual edits).
   */
  const pendingSystem =
    isConnectMode && nextSource?.system
      ? (systems.find((system) => system.name === nextSource.system) ?? null)
      : null;

  if (pendingSystem && pendingSystem.name !== syncedPending) {
    setSyncedPending(pendingSystem.name);

    if (CONNECTION_TYPES.some((type) => type.value === pendingSystem.db_type)) {
      setConnectionType(pendingSystem.db_type);
    }

    setDatabase(pendingSystem.database_file);
  }

  const canTrace =
    Boolean(selectedReport && selectedDatapoint && connectionType) &&
    database.trim() !== "";

  const alreadyConnected =
    database.trim() !== "" && connectedSystems.includes(database.trim());

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedReport || !selectedDatapoint) return;
    if (!connectionType || !database.trim()) return;

    clearError();

    const started = isConnectMode
      ? await connectNextSource({
          dbType: connectionType,
          database: database.trim(),
        })
      : await beginTrace({
          reportId: selectedReport.id,
          datapoint: selectedDatapoint,
          dbType: connectionType,
          database: database.trim(),
        });

    if (started) onConnect?.();
  };

  const handleRestart = () => {
    resetTrace();
    clearError();
  };

  return (
    <section
      className={
        hideTitle ? "flex flex-1 flex-col" : "panel flex flex-col p-5"
      }
    >
      {!hideTitle && (
        <>
          <h2 className="text-xs font-bold text-ink">
            <span className="mr-2 text-slate-400">3.</span>
            Report source system
          </h2>

          <p className="mt-2 text-[11px] leading-5 text-slate-500">
            The system from which the report was generated or obtained. Access
            is read-only.
          </p>
        </>
      )}

      {traceId && !isConnectMode ? (
        <div className="mt-4 flex flex-1 flex-col gap-3">
          <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2">
            <CheckCircle2 size={15} className="text-emerald-600" />

            <span className="text-[10px] font-semibold text-emerald-700">
              Trace in progress
            </span>
          </div>

          <p className="font-mono text-[10px] text-slate-500">{traceId}</p>

          <div className="mt-auto pt-2">
            <button
              type="button"
              onClick={handleRestart}
              className="btn-secondary w-full"
            >
              Start a new trace
            </button>
          </div>
        </div>
      ) : (
        <form
          className="mt-4 flex flex-1 flex-col gap-3"
          onSubmit={handleSubmit}
        >
          {/* Connection type */}
          <label>
            <span className="label">Connection</span>

            <div className="relative">
              <select
                className="field field-compact appearance-none pr-9"
                value={connectionType}
                onChange={(event) => setConnectionType(event.target.value)}
              >
                {CONNECTION_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>

              <ChevronDown
                size={15}
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
            </div>
          </label>

          {/* Database */}
          <label>
            <span className="label">Database</span>

            <input
              type="text"
              placeholder="Enter database name"
              className="field field-compact font-mono"
              value={database}
              onChange={(event) => setDatabase(event.target.value)}
            />
          </label>

          {/* Prerequisites */}
          {!selectedReport && (
            <p className="text-[10px] font-medium text-amber-700">
              Upload a report to continue.
            </p>
          )}

          {selectedReport && !selectedDatapoint && (
            <p className="text-[10px] font-medium text-amber-700">
              Select a data point from the report table.
            </p>
          )}

          {selectedReport && selectedDatapoint && !connectionType && (
            <p className="text-[10px] font-medium text-amber-700">
              Select a connection to continue.
            </p>
          )}

          {selectedReport &&
            selectedDatapoint &&
            connectionType &&
            !database.trim() && (
              <p className="text-[10px] font-medium text-amber-700">
                Enter the database name to continue.
              </p>
            )}

          {/* Success */}
          {alreadyConnected && (
            <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2">
              <CheckCircle2 size={15} className="text-emerald-600" />

              <span className="text-[10px] font-semibold text-emerald-700">
                {database.trim()} connected
              </span>
            </div>
          )}

          {/* Error */}
          {error && (
            <p className="flex items-start gap-1.5 text-[10px] font-medium text-red-600">
              <AlertCircle size={12} className="mt-px shrink-0" />
              {error}
            </p>
          )}

          {/* Submit */}
          <div className="mt-auto pt-2 text-[13px]">
            <button
              type="submit"
              disabled={busy || !canTrace}
              className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Lock size={14} />

              {busy
                ? "Connecting..."
                : isConnectMode
                  ? "Connect and continue trace"
                  : "Connect and initiate trace"}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
