"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Clock,
  GitBranch,
  Loader2,
} from "lucide-react";


import {
  getReverseLineage,
  ReverseLineageRequest,
} from "../services/lineageApi";

import { ReverseLineageResponse } from "../types/trace";

const actions = [
  "Connect",
  "Locate attribute",
  "Identify source",
  "Identify consumers",
];

const systems = [
  { n: 1, system: "reporting_db", heldIn: "rpt.c0700_facts.value", sourcedFrom: "calc_sa_exposure.exposure_value", consumedBy: "XBRL writer + COREP v1", status: "identified" },
  { n: 2, system: "sa_engine", heldIn: "calc_sa_exposure.exposure_value", sourcedFrom: "mart_sa_exposure.off_bal_eur, dw_collateral_alloc.allocated_value_eur", consumedBy: "rpt.c0700_facts", status: "identified" },
  { n: 3, system: "dwh", heldIn: "mart_sa_exposure.off_bal_eur", sourcedFrom: "dw_exposure.undrawn_eur", consumedBy: "calc_sa_exposure", status: "identified" },
  { n: 4, system: "dwh", heldIn: "dw_collateral_alloc.allocated_value_eur", sourcedFrom: "stg_collateral.market_value", consumedBy: "calc_sa_exposure", status: "identified" },
  { n: 5, system: "dwh", heldIn: "dw_exposure.drawn_eur, undrawn_eur", sourcedFrom: "stg_facilities.drawn_balance, ref_fx_rates.rate", consumedBy: "mart_sa_exposure", status: "identified" },
  { n: 6, system: "staging", heldIn: "stg_collateral.market_value", sourcedFrom: "col.collateral.market_value", consumedBy: "dw_collateral_alloc", status: "identified" },
  { n: 7, system: "collateral_db", heldIn: "col.collateral.market_value", sourcedFrom: "System of record", consumedBy: "stg_collateral", status: "identified" },
  { n: 8, system: "staging", heldIn: "ref_fx_rates.rate", sourcedFrom: "System of record (ECB feed)", consumedBy: "dw_exposure", status: "identified" },
  { n: 9, system: "staging", heldIn: "stg_facilities.drawn_balance", sourcedFrom: "los.facility.drawn_balance", consumedBy: "dw_exposure", status: "identified" },
  { n: 10, system: "loans_db", heldIn: "–", sourcedFrom: "–", consumedBy: "–", status: "connection_required" },
];

export function TraceProgressPanel() {
  const router = useRouter();

  const [activeAction, setActiveAction] = useState("Connect");

  const [traceData, setTraceData] =
    useState<ReverseLineageResponse | null>(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadLineage() {
      try {
        setLoading(true);
        setError(null);

        const payload: ReverseLineageRequest = {
          report_name: "COREP C90 Report",
          db_type: "sqlite",
          database: "lineage.db",
        };

        const response = await getReverseLineage(payload);

        setTraceData(response);
      } catch (err) {
        console.error("Failed to load reverse lineage:", err);

        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Failed to load reverse lineage.");
        }
      } finally {
        setLoading(false);
      }
    }

    loadLineage();
  }, []);

  const handleConnectNextSource = () => {
    if (!traceData?.next_source?.connection_required) {
      router.push("/lineage/evidence");
      return;
    }

    // Later we will open the database connection flow here.
    router.push("/lineage");
  };

  return (

      <main className="mx-auto max-w-[1500px] p-4 sm:p-6 lg:p-8">

        {/* Title */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">

          <div>

            <h1 className="text-lg font-bold tracking-tight text-ink sm:text-xl">
              Reverse lineage in progress
            </h1>

            <p className="mt-1 text-xs text-slate-500">
              Reverse ·{" "}
              {traceData?.report_name ?? "Loading report..."} ·{" "}
              {traceData?.source_object ?? "Loading source..."}
            </p>

          </div>

          {/* Stats */}
          <div className="flex items-start gap-6">

            <div className="text-center">

              <div className="text-lg font-bold text-ink">
                {loading ? (
                  <Loader2
                    size={18}
                    className="animate-spin"
                  />
                ) : (
                  traceData?.systems_connected ?? 0
                )}
              </div>

              <div className="text-[10px] text-slate-500">
                systems connected
              </div>

            </div>

            <div className="text-center">

              <div className="text-lg font-bold text-ink">
                {loading
                  ? "-"
                  : traceData?.systems_of_record_reached ?? 0}
              </div>

              <div className="text-[10px] text-slate-500">
                systems of record reached
              </div>

            </div>

            <div className="text-center">

              <div className="text-lg font-bold text-ink">
                {loading
                  ? "-"
                  : traceData?.branch_outstanding ?? 0}
              </div>

              <div className="text-[10px] text-slate-500">
                branch outstanding
              </div>

            </div>

          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[11px] text-red-700">
            {error}
          </div>
        )}

        {/* Content */}
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">

          {/* Systems table */}
          <div className="panel overflow-hidden">

            <div className="overflow-x-auto">

              <table className="w-full min-w-[700px] border-collapse text-[11px]">

                <thead>

                  <tr className="border-b border-slate-200 bg-slate-50">

                    <th className="px-3 py-2.5 text-left text-[9px] font-bold uppercase tracking-wider text-slate-500">
                      #
                    </th>

                    <th className="px-3 py-2.5 text-left text-[9px] font-bold uppercase tracking-wider text-slate-500">
                      System
                    </th>

                    <th className="px-3 py-2.5 text-left text-[9px] font-bold uppercase tracking-wider text-slate-500">
                      Attribute Name
                    </th>
                     <th className="px-3 py-2.5 text-left text-[9px] font-bold uppercase tracking-wider text-slate-500">
                      Table Name
                    </th>
                     <th className="px-3 py-2.5 text-left text-[9px] font-bold uppercase tracking-wider text-slate-500">
                      Transformation
                    </th>
                    <th className="px-3 py-2.5 text-left text-[9px] font-bold uppercase tracking-wider text-slate-500">
                      Sourced from
                    </th>

                    <th className="px-3 py-2.5 text-left text-[9px] font-bold uppercase tracking-wider text-slate-500">
                      Consumed by
                    </th>

                    <th className="px-3 py-2.5 text-left text-[9px] font-bold uppercase tracking-wider text-slate-500">
                      Status
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {loading ? (

                    <tr>
                      <td
                        colSpan={6}
                        className="px-4 py-12 text-center"
                      >
                        <div className="flex items-center justify-center gap-2 text-[11px] text-slate-500">

                          <Loader2
                            size={15}
                            className="animate-spin"
                          />

                          Discovering reverse lineage...
                        </div>
                      </td>
                    </tr>

                  ) : traceData?.rows?.length ? (

                    traceData.rows.map((row, index) => (

                      <tr
                        key={`${row.system}-${row.attribute_held_in}-${index}`}
                        className={`border-b border-slate-100 last:border-0 ${
                          row.status.toLowerCase() ===
                          "connection required"
                            ? "bg-amber-50"
                            : ""
                        }`}
                      >

                        <td className="px-3 py-2.5 text-slate-500">
                          {index + 1}
                        </td>

                        <td className="px-3 py-2.5 font-mono text-[10px] font-semibold text-ink">
                          {row.system}
                        </td>

                        <td className="px-3 py-2.5 font-mono text-[10px] text-slate-600">
                          {row.attribute_held_in}
                        </td>

                        <td className="px-3 py-2.5 font-mono text-[10px] text-slate-600">
                          {row.sourced_from}
                        </td>

                        <td className="px-3 py-2.5 font-mono text-[10px] text-slate-600">
                          {row.consumed_by}
                        </td>

                        <td className="px-3 py-2.5">

                          {row.status.toLowerCase() ===
                          "identified" ? (

                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">

                              <CheckCircle2 size={10} />

                              Identified

                            </span>

                          ) : (

                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800">

                              <Clock size={10} />

                              {row.status}

                            </span>

                          )}

                        </td>

                      </tr>

                    ))

                  ) : (

                    <tr>

                      <td
                        colSpan={6}
                        className="px-4 py-12 text-center text-[11px] text-slate-500"
                      >
                        No lineage information found.
                      </td>

                    </tr>

                  )}

                </tbody>

              </table>

            </div>

            {/* Footer */}
            <div className="border-t border-slate-100 px-4 py-3 sm:px-5">

              <p className="text-[10px] text-slate-500">

                {traceData?.rows?.length
                  ? `${traceData.rows.length} lineage ${
                      traceData.rows.length === 1
                        ? "record"
                        : "records"
                    } identified.`
                  : "No lineage records identified."}

              </p>

            </div>

          </div>

          {/* Next source */}
          <div className="panel flex flex-col p-5">

            <h2 className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Next source identification
            </h2>

            {/* Actions */}
            <div className="mt-3 flex flex-wrap gap-1.5">

              {actions.map((action) => (

                <button
                  key={action}
                  onClick={() => setActiveAction(action)}
                  className={`rounded-md px-2.5 py-1.5 text-[10px] font-semibold transition ${
                    activeAction === action
                      ? "bg-navy text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {action}
                </button>

              ))}

            </div>

      
            
              
            <p className="mt-4 text-[11px] leading-5 text-slate-600">
              stg_facilities.drawn_balance is sourced from{" "}
              <span className="font-mono font-semibold text-ink">los.facility</span> on{" "}
              <span className="font-mono font-semibold text-ink">loans_db</span>. Read-only
              connection details are required to continue.
            </p>

            {/* Connection form */}
            <form className="mt-4 flex flex-1 flex-col gap-3" onSubmit={(e) => e.preventDefault()}>
              <label>
                <span className="label">Host</span>
                <input
                  type="text"
                  className="field field-compact"
                  defaultValue="loans-db.sandbox:5432"
                />
              </label>

              <label>
                <span className="label">Database</span>
                <input
                  type="text"
                  className="field field-compact"
                  defaultValue="los"
                />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label>
                  <span className="label">Read-only user</span>
                  <input
                    type="text"
                    className="field field-compact"
                    defaultValue="lineage_ro"
                  />
                </label>
                <label>
                  <span className="label">Password</span>
                  <input
                    type="password"
                    className="field field-compact"
                    defaultValue="trace_readonly_pw"
                  />
                </label>
              </div>

              <div className="mt-auto pt-2">
                <button type="submit" className="btn-primary w-full">
                  Connect read-only
                </button>
              </div>
            </form>

          </div>

        </div>

      </main>
  );
}