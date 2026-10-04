"use client";

import { useMemo, useState } from "react";
import {
  ArrowDownRight,
  ArrowRight,
  CheckCircle2,
  Download,
  GitBranch,
  RefreshCw,
} from "lucide-react";

type HopStatus = "proven" | "code-derived";

type Hop = {
  id: number;
  from: string;
  to: string;
  attribute: string;
  sourcedFrom: string[];
  transformation: string;
  consumedBy: string;
  status: HopStatus;
  evidence: {
    code: string;
    version: string;
    log: string;
    reconciliation: string;
  };
};

const hops: Hop[] = [
  {
    id: 1,
    from: "los.facility",
    to: "stg_facilities",
    attribute: "facility_id",
    sourcedFrom: ["facility_id", "facility_name", "status"],
    transformation: "Direct source-to-stage load.",
    consumedBy: "dw_exposure (hop 3)",
    status: "proven",
    evidence: {
      code: "sql/load_stg_facilities.sql:14–38",
      version: "commit 7c1e0b4 · deployed 12-Jun-2026",
      log: "query log 01-Jul 00:02:11 · INSERT INTO stg_facilities",
      reconciliation: "1,288 rows agrees to stored value",
    },
  },
  {
    id: 2,
    from: "col.collateral",
    to: "stg_collateral",
    attribute: "collateral_id",
    sourcedFrom: ["collateral_id", "type", "value"],
    transformation: "Direct source-to-stage load.",
    consumedBy: "dw_collateral_alloc (hop 5)",
    status: "proven",
    evidence: {
      code: "sql/load_stg_collateral.sql:10–29",
      version: "commit 7c1e0b4 · deployed 12-Jun-2026",
      log: "query log 01-Jul 00:02:12 · INSERT INTO stg_collateral",
      reconciliation: "12,642 rows reconciled to source",
    },
  },
  {
    id: 3,
    from: "stg_facilities",
    to: "dw_exposure",
    attribute: "drawn_eur, undrawn_eur",
    sourcedFrom: [
      "drawn_balance",
      "undrawn_limit",
      "currency",
      "intragroup_flag",
    ],
    transformation:
      "Convert to EUR at the 30-Jun-2026 rate; 251 intragroup facilities excluded.",
    consumedBy: "mart_sa_exposure (hop 6)",
    status: "proven",
    evidence: {
      code: "sql/sp_load_exposure.sql:88–131",
      version: "commit 7c1e0b4 · deployed 12-Jun-2026",
      log: "query log 01-Jul 00:02:14 · INSERT INTO dw_exposure",
      reconciliation: "Recalculated 1,288.4 agrees to stored value",
    },
  },
  {
    id: 4,
    from: "ref_fx_rates",
    to: "dw_exposure",
    attribute: "fx_rate",
    sourcedFrom: ["currency", "spot_rate", "rate_date"],
    transformation: "Join on currency and valuation date.",
    consumedBy: "dw_exposure (hop 3)",
    status: "proven",
    evidence: {
      code: "sql/sp_load_exposure.sql:54–71",
      version: "commit 7c1e0b4 · deployed 12-Jun-2026",
      log: "FX snapshot 30-Jun-2026",
      reconciliation: "All active currencies matched",
    },
  },
  {
    id: 5,
    from: "stg_collateral",
    to: "dw_collateral_alloc",
    attribute: "allocated_value_eur",
    sourcedFrom: ["market_value", "facility_id", "allocation_pct"],
    transformation:
      "Allocate collateral by facility using approved allocation percentages.",
    consumedBy: "calc_sa_exposure (hop 7)",
    status: "code-derived",
    evidence: {
      code: "sql/sp_load_collateral_alloc.sql:31–78",
      version: "commit 7c1e0b4 · deployed 12-Jun-2026",
      log: "allocation batch 01-Jul 00:03:01",
      reconciliation: "Logic identified; output not independently reconciled",
    },
  },
  {
    id: 6,
    from: "dw_exposure",
    to: "mart_sa_exposure",
    attribute: "sa_exposure_eur",
    sourcedFrom: ["drawn_eur", "undrawn_eur", "facility_id"],
    transformation: "Aggregate exposure by facility and reporting segment.",
    consumedBy: "calc_sa_exposure (hop 8)",
    status: "proven",
    evidence: {
      code: "sql/sp_mart_sa_exposure.sql:22–69",
      version: "commit 7c1e0b4 · deployed 12-Jun-2026",
      log: "mart refresh 01-Jul 00:04:02",
      reconciliation: "1,037 facility rows reconciled",
    },
  },
  {
    id: 7,
    from: "dw_collateral_alloc",
    to: "calc_sa_exposure",
    attribute: "eligible_collateral_eur",
    sourcedFrom: ["allocated_value_eur", "eligibility_flag"],
    transformation:
      "Apply collateral eligibility rules in the SA calculation engine.",
    consumedBy: "reporting_db (hop 9)",
    status: "code-derived",
    evidence: {
      code: "engine/sa_exposure.py:144–221",
      version: "commit 7c1e0b4 · deployed 12-Jun-2026",
      log: "SA calculation batch 01-Jul 00:04:06",
      reconciliation: "Engine input matched warehouse extract",
    },
  },
  {
    id: 8,
    from: "mart_sa_exposure",
    to: "calc_sa_exposure",
    attribute: "sa_exposure_eur",
    sourcedFrom: ["sa_exposure_eur", "risk_weight"],
    transformation:
      "Apply standardized approach risk weights and calculation rules.",
    consumedBy: "reporting_db (hop 9)",
    status: "proven",
    evidence: {
      code: "engine/sa_exposure.py:80–143",
      version: "commit 7c1e0b4 · deployed 12-Jun-2026",
      log: "SA calculation batch 01-Jul 00:04:06",
      reconciliation: "1,288.4 agrees to stored value",
    },
  },
  {
    id: 9,
    from: "calc_sa_exposure",
    to: "C 07.00 10010 C0200",
    attribute: "reported_exposure_eur",
    sourcedFrom: ["sa_exposure_eur", "reporting_adjustment"],
    transformation:
      "Map calculated exposure into the regulatory reporting taxonomy.",
    consumedBy: "C 07.00 reporting",
    status: "proven",
    evidence: {
      code: "sql/sp_load_reporting.sql:19–67",
      version: "commit 7c1e0b4 · deployed 12-Jun-2026",
      log: "query log 01-Jul 00:04:09 · INSERT INTO reporting_db",
      reconciliation: "Reported total reconciled to calculation engine",
    },
  },
];

const columns = [
  "SYSTEM OF RECORD",
  "STAGING",
  "WAREHOUSE",
  "DATA MART",
  "CALC ENGINE",
  "REPORTING LAYER",
];

type Node = {
  id: string;
  column: number;
  top: number;
  label: string;
  selected?: boolean;
};

const nodes: Node[] = [
  { id: "los", column: 0, top: 105, label: "los.facility" },
  { id: "stg-fac", column: 1, top: 105, label: "stg_facilities" },
  { id: "fx", column: 0, top: 255, label: "ref_fx_rates" },
  { id: "exposure", column: 2, top: 140, label: "dw_exposure" },
  { id: "collateral", column: 0, top: 410, label: "col.collateral" },
  { id: "stg-coll", column: 1, top: 410, label: "stg_collateral" },
  { id: "alloc", column: 2, top: 410, label: "dw_collateral_alloc" },
  { id: "mart", column: 3, top: 140, label: "mart_sa_exposure" },
  { id: "calc", column: 4, top: 270, label: "calc_sa_exposure" },
  { id: "report", column: 5, top: 270, label: "C 07.00 10010 C0200" },
];

const nodeMap = Object.fromEntries(nodes.map((node) => [node.id, node]));

function nodePoint(id: string) {
  const node = nodeMap[id];
  const columnX = [9, 25, 40, 55, 70, 84][node.column];
  return { x: columnX, y: node.top + 32 };
}

type Connector = {
  hop: number;
  from: string;
  to: string;
  codeDerived?: boolean;
};

const connectors: Connector[] = [
  { hop: 1, from: "los", to: "stg-fac" },
  { hop: 2, from: "collateral", to: "stg-coll" },
  { hop: 3, from: "stg-fac", to: "exposure" },
  { hop: 4, from: "fx", to: "exposure" },
  { hop: 5, from: "stg-coll", to: "alloc", codeDerived: true },
  { hop: 6, from: "exposure", to: "mart" },
  { hop: 7, from: "alloc", to: "calc", codeDerived: true },
  { hop: 8, from: "mart", to: "calc" },
  { hop: 9, from: "calc", to: "report" },
];

function ConnectorPath({
  connector,
  active,
  onSelect,
}: {
  connector: Connector;
  active: boolean;
  onSelect: (hop: number) => void;
}) {
  const a = nodePoint(connector.from);
  const b = nodePoint(connector.to);

  const curve =
    connector.from === "fx"
      ? `M ${a.x} ${a.y} C ${a.x + 7} ${a.y}, ${b.x - 10} ${b.y + 55}, ${b.x} ${b.y}`
      : connector.from === "alloc"
        ? `M ${a.x} ${a.y} C ${a.x + 14} ${a.y}, ${b.x - 12} ${b.y + 70}, ${b.x} ${b.y}`
        : `M ${a.x} ${a.y} C ${a.x + 5} ${a.y}, ${b.x - 5} ${b.y}, ${b.x} ${b.y}`;

  const markerX = (a.x + b.x) / 2;
  const markerY = (a.y + b.y) / 2;

  return (
    <>
      <path
        d={curve}
        fill="none"
        stroke={connector.codeDerived ? "#a7aaa8" : "#26312d"}
        strokeWidth={active ? 2.3 : 1.6}
        strokeDasharray={connector.codeDerived ? "5 5" : undefined}
        vectorEffect="non-scaling-stroke"
      />
      <button
        type="button"
        onClick={() => onSelect(connector.hop)}
        className={[
          "absolute z-20 flex h-7 w-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border text-[10px] font-bold shadow-sm transition",
          active
            ? "border-[#315c4b] bg-[#315c4b] text-white"
            : connector.codeDerived
              ? "border-[#a97828] bg-white text-[#815b20]"
              : "border-[#26312d] bg-white text-[#26312d]",
        ].join(" ")}
        style={{ left: `${markerX}%`, top: `${markerY}px` }}
        aria-label={`View hop ${connector.hop}`}
      >
        {connector.hop}
      </button>
    </>
  );
}

function LineageNode({
  node,
  active,
}: {
  node: Node;
  active: boolean;
}) {
  const columnX = [2.5, 18, 33, 48, 63, 77][node.column];

  return (
    <div
      className={[
        "absolute z-10 w-[138px] rounded-lg border px-3 py-3 shadow-[0_1px_1px_rgba(20,30,27,.03)]",
        active
          ? "border-[#17201d] bg-[#17201d] text-white"
          : "border-[#cfd5d2] bg-white text-[#2b3431]",
      ].join(" ")}
      style={{ left: `${columnX}%`, top: node.top }}
    >
      <div
        className={[
          "mb-1 text-[10px]",
          active ? "text-white/60" : "text-[#69716e]",
        ].join(" ")}
      >
        {node.id === "calc"
          ? "SA engine"
          : node.id === "report"
            ? "reporting_db"
            : node.id === "fx"
              ? "FX rates feed"
              : node.id.includes("stg")
                ? "staging"
                : node.id === "mart"
                  ? "data mart"
                  : node.id === "exposure" || node.id === "alloc"
                    ? "warehouse"
                    : node.id === "collateral"
                      ? "collateral_db"
                      : "loans_db"}
      </div>
      <div className="font-mono text-[11px] leading-4">{node.label}</div>
    </div>
  );
}

export function LineageEvidence() {
  const [selectedHop, setSelectedHop] = useState(3);
  const [direction, setDirection] = useState<"Reverse" | "Forward">("Reverse");
  const [tab, setTab] = useState<"lineage" | "evidence">("lineage");

  const selected = useMemo(
    () => hops.find((hop) => hop.id === selectedHop) ?? hops[2],
    [selectedHop],
  );

  return (
    <div className="min-h-screen bg-[#f4f2ed] text-[#202925]">
      {/* Header — deliberately mirrors TraceProgressPanel */}
      <header className="bg-[#1a2332] text-white">
        <div className="mx-auto flex h-14 max-w-[1500px] items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10">
              <GitBranch size={16} />
            </div>
            <span className="text-sm font-bold tracking-tight">Lineage Tracer</span>
            <span className="rounded bg-white/15 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">
              POC
            </span>
          </div>

          <nav className="hidden items-center gap-1 md:flex">
            {[
              { n: 1, label: "Initiate trace", active: false },
              { n: 2, label: "Trace progress", active: false },
              { n: 3, label: "Lineage and evidence", active: true },
            ].map((step) => (
              <button
                key={step.n}
                type="button"
                className={[
                  "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[11px] font-semibold",
                  step.active
                    ? "bg-white/15 text-white"
                    : "text-white/50 hover:text-white/80",
                ].join(" ")}
              >
                <span
                  className={[
                    "flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold",
                    step.active ? "bg-white text-[#1a2332]" : "bg-white/20",
                  ].join(" ")}
                >
                  {step.n}
                </span>
                {step.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-[1500px] p-4 sm:p-6 lg:p-8">
        {/* Page title */}
        <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
              EUR 1,240.5m traced to 3 systems of record
            </h1>

            <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] text-slate-500">
              <button
                type="button"
                onClick={() =>
                  setDirection((value) =>
                    value === "Reverse" ? "Forward" : "Reverse",
                  )
                }
                className="font-medium text-slate-700 hover:underline"
              >
                {direction}
              </button>
              <span>·</span>
              <span>C 07.00</span>
              <span>·</span>
              <span>Corporates</span>
              <span>·</span>
              <span>r0010 c0200</span>
              <span>·</span>
              <span>30-Jun-2026</span>
              <span>·</span>
              <span>9 hops</span>
              <span>·</span>
              <span>7 proven</span>
              <span>·</span>
              <span>2 code-derived</span>
              <span>·</span>
              <span>0 unresolved</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              className="text-[11px] font-medium text-slate-600 hover:text-slate-900"
            >
              New trace
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-md bg-[#1a2332] px-3.5 py-2.5 text-[10px] font-bold text-white shadow-sm hover:bg-[#111925]"
            >
              <Download size={13} />
              Export evidence pack
            </button>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,.03)]">
          <div className="grid min-h-[610px] grid-cols-1 xl:grid-cols-[minmax(760px,1fr)_380px]">
            {/* LEFT: lineage graph */}
            <section className="min-w-0 border-b border-slate-200 xl:border-b-0 xl:border-r">
              <div className="overflow-x-auto">
                <div className="relative h-[610px] min-w-[980px] bg-white">
                  
                  <div className="absolute inset-x-0 top-0 z-10 grid grid-cols-6 border-b border-slate-100 bg-slate-50/70">
                    {columns.map((column) => (
                      <div
                        key={column}
                        className="px-4 py-4 text-[9px] font-bold tracking-wider text-slate-500"
                      >
                        {column}
                      </div>
                    ))}
                  </div>

                
                  {/* <svg
                    className="absolute inset-0 z-[1] h-full w-full"
                    viewBox="0 0 100 610"
                    preserveAspectRatio="none"
                    aria-hidden="true"
                  >
                    <defs>
                      <marker
                        id="lineage-arrow"
                        markerWidth="7"
                        markerHeight="7"
                        refX="6"
                        refY="3.5"
                        orient="auto"
                      >
                        <path d="M0,0 L7,3.5 L0,7 z" fill="#26312d" />
                      </marker>
                    </defs>

                    {connectors.map((connector) => {
                      const a = nodePoint(connector.from);
                      const b = nodePoint(connector.to);

                      const curve =
                        connector.from === "fx"
                          ? `M ${a.x} ${a.y} C ${a.x + 7} ${a.y}, ${b.x - 10} ${b.y + 55}, ${b.x} ${b.y}`
                          : connector.from === "alloc"
                            ? `M ${a.x} ${a.y} C ${a.x + 14} ${a.y}, ${b.x - 12} ${b.y + 70}, ${b.x} ${b.y}`
                            : `M ${a.x} ${a.y} C ${a.x + 5} ${a.y}, ${b.x - 5} ${b.y}, ${b.x} ${b.y}`;

                      return (
                        <path
                          key={connector.hop}
                          d={curve}
                          fill="none"
                          stroke={
                            selectedHop === connector.hop
                              ? "#315c4b"
                              : connector.codeDerived
                                ? "#a7aaa8"
                                : "#26312d"
                          }
                          strokeWidth={selectedHop === connector.hop ? 2.3 : 1.5}
                          strokeDasharray={
                            connector.codeDerived ? "5 5" : undefined
                          }
                          markerEnd="url(#lineage-arrow)"
                          vectorEffect="non-scaling-stroke"
                        />
                      );
                    })}
                  </svg>

                  {nodes.map((node) => (
                    <LineageNode
                      key={node.id}
                      node={node}
                      active={
                        (selectedHop === 3 &&
                          (node.id === "stg-fac" || node.id === "exposure")) ||
                        (selectedHop === 9 && node.id === "report")
                      }
                    />
                  ))}

                  {connectors.map((connector) => (
                    <ConnectorPath
                      key={`hop-${connector.hop}`}
                      connector={connector}
                      active={selectedHop === connector.hop}
                      onSelect={setSelectedHop}
                    />
                  ))} */}

                
                  <div className="absolute bottom-7 left-7 z-10 flex flex-wrap items-center gap-x-7 gap-y-2 text-[10px] text-slate-500">
                    <span className="flex items-center gap-2">
                      <i className="h-[2px] w-7 bg-[#26312d]" />
                      Proven: logic identified and reconciled to data
                    </span>
                    <span className="flex items-center gap-2">
                      <i className="w-7 border-t border-dashed border-[#a7aaa8]" />
                      Code-derived: logic identified, not reconciled
                    </span>
                  </div>

                  <div className="absolute bottom-7 right-7 z-10 text-[10px] text-slate-400">
                    Select a hop number to view its detail.
                  </div>
                </div>
              </div>
            </section>

            {/* RIGHT: evidence/detail */}
            <aside className="bg-[#fbfcfb] p-5 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="text-[9px] font-bold uppercase tracking-wider text-slate-500">
                  HOP {selected.id}
                </div>

                <span
                  className={[
                    "rounded px-2 py-1 text-[9px] font-bold",
                    selected.status === "proven"
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-amber-50 text-amber-800",
                  ].join(" ")}
                >
                  {selected.status === "proven" ? "Proven" : "Code-derived"}
                </span>
              </div>

              <div className="mt-5 flex items-center gap-2 text-[11px] font-mono font-semibold text-[#27312e]">
                <span>{selected.from}</span>
                <ArrowRight size={13} className="text-slate-400" />
                <span>{selected.to}</span>
              </div>

              <Detail title="ATTRIBUTE HELD">
                <div className="font-mono text-[11px] text-slate-700">
                  {selected.attribute}
                </div>
              </Detail>

              <Detail title="SOURCED FROM">
                <div className="space-y-1">
                  {selected.sourcedFrom.map((value) => (
                    <div
                      key={value}
                      className="font-mono text-[11px] leading-4 text-slate-700"
                    >
                      {value}
                    </div>
                  ))}
                </div>
              </Detail>

              <Detail title="TRANSFORMATION">
                <p className="text-[11px] leading-5 text-slate-600">
                  {selected.transformation}
                </p>
              </Detail>

              <Detail title="CONSUMED BY">
                <div className="font-mono text-[11px] text-slate-700">
                  {selected.consumedBy}
                </div>
              </Detail>

              <Detail title="EVIDENCE">
                <div className="space-y-3">
                  <EvidenceRow label="Code" value={selected.evidence.code} />
                  <EvidenceRow
                    label="Version"
                    value={selected.evidence.version}
                  />
                  <EvidenceRow label="Log" value={selected.evidence.log} />
                  <EvidenceRow
                    label="Reconciliation"
                    value={selected.evidence.reconciliation}
                  />
                </div>
              </Detail>

              <div className="mt-6 flex border-b border-slate-200">
                <button
                  type="button"
                  onClick={() => setTab("lineage")}
                  className={[
                    "mr-5 pb-2 text-[10px] font-bold",
                    tab === "lineage"
                      ? "border-b-2 border-[#315c4b] text-[#26312d]"
                      : "text-slate-400",
                  ].join(" ")}
                >
                  Lineage
                </button>
                <button
                  type="button"
                  onClick={() => setTab("evidence")}
                  className={[
                    "pb-2 text-[10px] font-bold",
                    tab === "evidence"
                      ? "border-b-2 border-[#315c4b] text-[#26312d]"
                      : "text-slate-400",
                  ].join(" ")}
                >
                  Evidence
                </button>
              </div>

              {tab === "lineage" ? (
                <div className="mt-4 rounded-md border border-slate-200 bg-white p-3">
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2
                      size={14}
                      className="mt-0.5 shrink-0 text-emerald-600"
                    />
                    <div>
                      <div className="text-[10px] font-bold text-slate-700">
                        Trace path confirmed
                      </div>
                      <div className="mt-1 text-[10px] leading-4 text-slate-500">
                        Hop {selected.id} is connected to the selected lineage
                        and can be inspected from the evidence panel.
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-4 rounded-md border border-slate-200 bg-white p-3">
                  <div className="flex items-start gap-2.5">
                    <RefreshCw
                      size={14}
                      className="mt-0.5 shrink-0 text-slate-500"
                    />
                    <div>
                      <div className="text-[10px] font-bold text-slate-700">
                        Evidence package
                      </div>
                      <div className="mt-1 text-[10px] leading-4 text-slate-500">
                        Code, version, execution log and reconciliation details
                        for this hop are shown above.
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <button
                type="button"
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-[10px] font-bold text-slate-600 hover:bg-slate-50"
              >
                <ArrowDownRight size={13} />
                Open hop evidence
              </button>
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
}

function Detail({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-5">
      <div className="mb-2 text-[9px] font-bold tracking-wider text-slate-500">
        {title}
      </div>
      {children}
    </section>
  );
}

function EvidenceRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <div className="text-[9px] font-semibold text-slate-500">{label}</div>
      <div className="mt-0.5 text-[10px] leading-4 text-slate-600">{value}</div>
    </div>
  );
}

export default LineageEvidence;