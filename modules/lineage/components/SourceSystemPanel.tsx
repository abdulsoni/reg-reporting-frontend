"use client";

import { ChevronDown, Lock, CheckCircle2, AlertCircle } from "lucide-react";
import { useEffect, useState } from "react";

import { useReports } from "../context/ReportContext";
import { useLineage } from "../context/LineageContext";
import { lineageApi } from "../services";
import type { SystemDescriptor } from "../types/lineage";

type SourceSystemPanelProps = {
  onConnect: () => void;
};

export function SourceSystemPanel({ onConnect }: SourceSystemPanelProps) {
  const { selectedReport } = useReports();

  const {
    selectedDatapoint,
    beginTrace,
    resetTrace,
    traceId,
    connectedSystems,
    busy,
    error,
    clearError,
  } = useLineage();

  const [systems, setSystems] = useState<SystemDescriptor[]>([]);
  const [systemName, setSystemName] = useState("reporting_db");

  /*
   * Populating the picker is a data load, not derived state, so it is done in
   * an effect keyed on the selected adapter rather than in an effect that
   * mirrors props into state.
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

  const selectedSystem =
    systems.find((system) => system.name === systemName) ?? null;
  
  console.log(systems);

  const canTrace = Boolean(selectedReport && selectedDatapoint && selectedSystem);
  const alreadyConnected = connectedSystems.includes(systemName);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedReport || !selectedDatapoint || !selectedSystem) return;

    clearError();

    const started = await beginTrace({
      reportId: selectedReport.id,
      datapoint: selectedDatapoint,
      system: selectedSystem,
    });

    if (started) onConnect();
  };

  const handleRestart = () => {
    resetTrace();
    clearError();
  };

  return (
    <section className="panel flex flex-col p-5">
      <h2 className="text-xs font-bold text-ink">
        <span className="mr-2 text-slate-400">3.</span>
        Report source system
      </h2>

      <p className="mt-2 text-[11px] leading-5 text-slate-500">
        The system from which the report was generated or obtained. Access is
        read-only.
      </p>

      {traceId ? (
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
          {/* System */}
          <label>
            <span className="label">System Name</span>

            <div className="relative">
              <select
                className="field field-compact appearance-none pr-9"
                value={systemName}
                onChange={(event) => setSystemName(event.target.value)}
              >
                {systems.map((system) => (
                  <option key={system.name} value={system.name}>
                    {system.name}
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
              readOnly
              className="field field-compact font-mono"
              value={selectedSystem?.database_file ?? ""}
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

          {/* Success */}
          {alreadyConnected && (
            <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2">
              <CheckCircle2 size={15} className="text-emerald-600" />

              <span className="text-[10px] font-semibold text-emerald-700">
                {systemName} connected
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
                : "Connect and initiate trace"}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}