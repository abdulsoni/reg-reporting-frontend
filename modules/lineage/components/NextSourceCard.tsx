"use client";

import { AlertCircle, Lock, Plug } from "lucide-react";
import { useEffect, useState } from "react";

import { lineageApi } from "../services";
import type { NextSource, SystemDescriptor } from "../types/lineage";

type NextSourceCardProps = {
  nextSource: NextSource | null;
  connectedSystems: string[];
  busy: boolean;
  onConnect: (system: SystemDescriptor) => void;
};

export function NextSourceCard({
  nextSource,
  connectedSystems,
  busy,
  onConnect,
}: NextSourceCardProps) {
  const [systems, setSystems] = useState<SystemDescriptor[]>([]);

  useEffect(() => {
    let active = true;

    lineageApi.listSystems().then(
      (list) => {
        if (active) setSystems(list);
      },
      () => {
        // A failed listing only costs the connect button its label.
      }
    );

    return () => {
      active = false;
    };
  }, []);

  if (!nextSource?.system) return null;

  const descriptor =
    systems.find((system) => system.name === nextSource.system) ?? null;

  const alreadyConnected = connectedSystems.includes(nextSource.system);

  return (
    <section className="rounded-xl border border-amber-300 bg-amber-50 p-4">
      <div className="flex items-start gap-3">
        <Plug size={16} className="mt-0.5 shrink-0 text-amber-600" />

        <div className="min-w-0 flex-1">
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-amber-900">
            Connection required
          </h3>

          <p className="mt-1 text-[11px] leading-5 text-amber-800">
            The next hop resolves into{" "}
            <span className="font-mono font-bold">
              {nextSource.system}
            </span>
            {nextSource.table && (
              <>
                {" "}
                as{" "}
                <span className="font-mono">
                  {nextSource.table}.{nextSource.attribute}
                </span>
              </>
            )}
            . This is a different system, so read-only access must be granted
            before the trace can continue.
          </p>

          {alreadyConnected ? (
            <p className="mt-2 flex items-center gap-1.5 text-[10px] font-semibold text-emerald-700">
              <Lock size={11} />
              Already connected — continuing trace.
            </p>
          ) : (
            <button
              type="button"
              disabled={busy || !descriptor}
              onClick={() => descriptor && onConnect(descriptor)}
              className="btn-primary mt-3 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Lock size={13} />

              {busy
                ? "Connecting..."
                : `Connect to ${nextSource.system}`}
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

export function TraceError({ error }: { error: string | null }) {
  if (!error) return null;

  return (
    <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5">
      <AlertCircle size={14} className="mt-px shrink-0 text-red-600" />

      <p className="text-[11px] font-medium text-red-700">{error}</p>
    </div>
  );
}