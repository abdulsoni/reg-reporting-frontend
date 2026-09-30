"use client";

import { useState } from "react";
import { CheckCircle2, AlertCircle, Clock } from "lucide-react";

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

const actions = ["Connect", "Locate attribute", "Identify source", "Identify consumers"];

export function TraceProgressPanel() {
  const [activeAction, setActiveAction] = useState("Connect");

  return (
    <div className="min-h-screen bg-[#f4f2ed]">
      {/* Dark navy header */}
      <header className="bg-[#1a2332] text-white">
        <div className="mx-auto flex h-14 max-w-[1500px] items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
            </div>
            <span className="text-sm font-bold tracking-tight">
              Lineage Tracer
            </span>
            <span className="rounded bg-white/15 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">
              POC
            </span>
          </div>

          <nav className="hidden items-center gap-1 md:flex">
            {[
              { n: 1, label: "Initiate trace", active: false },
              { n: 2, label: "Trace progress", active: true },
              { n: 3, label: "Lineage and evidence", active: false },
            ].map((step) => (
              <button
                key={step.n}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[11px] font-semibold transition ${
                  step.active
                    ? "bg-white/15 text-white"
                    : "text-white/50 hover:text-white/80"
                }`}
              >
                <span
                  className={`flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold ${
                    step.active ? "bg-white text-[#1a2332]" : "bg-white/20"
                  }`}
                >
                  {step.n}
                </span>
                {step.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-[1500px] p-4 sm:p-6 lg:p-8">
        {/* Title + stats */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-lg font-bold tracking-tight text-ink sm:text-xl">
              Reverse lineage in progress
            </h1>
            <p className="mt-1 text-xs text-slate-500">
              Reverse · C 07.00 · Corporates · r0010 c0200 · 1,240.5 EUR m · 30-Jun-2026
            </p>
          </div>

          {/* Stats */}
          <div className="flex items-start gap-6">
            <div className="text-center">
              <div className="text-lg font-bold text-ink">5</div>
              <div className="text-[10px] text-slate-500">systems connected</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-ink">2 of 3</div>
              <div className="text-[10px] text-slate-500">systems of record reached</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-ink">1</div>
              <div className="text-[10px] text-slate-500">branch outstanding</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
          {/* Systems table */}
          <div className="panel overflow-hidden">
            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] border-collapse text-[11px]">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="px-3 py-2.5 text-left text-[9px] font-bold uppercase tracking-wider text-slate-500">#</th>
                    <th className="px-3 py-2.5 text-left text-[9px] font-bold uppercase tracking-wider text-slate-500">System</th>
                    <th className="px-3 py-2.5 text-left text-[9px] font-bold uppercase tracking-wider text-slate-500">Attribute held in</th>
                    <th className="px-3 py-2.5 text-left text-[9px] font-bold uppercase tracking-wider text-slate-500">Sourced from</th>
                    <th className="px-3 py-2.5 text-left text-[9px] font-bold uppercase tracking-wider text-slate-500">Consumed by</th>
                    <th className="px-3 py-2.5 text-left text-[9px] font-bold uppercase tracking-wider text-slate-500">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {systems.map((row) => (
                    <tr
                      key={row.n}
                      className={`border-b border-slate-100 last:border-0 ${
                        row.status === "connection_required" ? "bg-amber-50" : ""
                      }`}
                    >
                      <td className="px-3 py-2.5 text-slate-500">{row.n}</td>
                      <td className="px-3 py-2.5 font-mono text-[10px] font-semibold text-ink">
                        {row.system}
                      </td>
                      <td className="px-3 py-2.5 font-mono text-[10px] text-slate-600">
                        {row.heldIn}
                      </td>
                      <td className="px-3 py-2.5 font-mono text-[10px] text-slate-600">
                        {row.sourcedFrom}
                      </td>
                      <td className="px-3 py-2.5 font-mono text-[10px] text-slate-600">
                        {row.consumedBy}
                      </td>
                      <td className="px-3 py-2.5">
                        {row.status === "identified" ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                            <CheckCircle2 size={10} />
                            Identified
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
                            <Clock size={10} />
                            Connection required
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Footer note */}
            <div className="border-t border-slate-100 px-4 py-3 sm:px-5">
              <p className="text-[10px] text-slate-500">
                One row per system connected, in the order traced. Row 1 is the report source system identified by the user.
              </p>
            </div>
          </div>

          {/* Next source identification */}
          <div className="panel flex flex-col p-5">
            <h2 className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Next source identification
            </h2>

            {/* Action buttons */}
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

            {/* Description */}
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
    </div>
  );
}