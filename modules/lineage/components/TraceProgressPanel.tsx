"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Clock,
  Loader2,
} from "lucide-react";




import { SourceSystemPanel } from "./SourceSystemPanel";
import { useReports } from "../context/ReportContext";
import { ReverseLineageResponse } from "../types/trace";
import { getReverseLineage, ReverseLineageRequest } from "../services/lineageApi";

type ConnectedLineageSystem = {
  system: string;
  sourceObject: string;
  rowCount: number;
  resolved: boolean;
};

type ConnectedLineageRow = {
  system: string;
  attribute_name: string;
  table_name: string;
  transformation: string | null;
  sourced_from: string | null;
  consumed_by: string | null;
  status: string;
};

type ConnectedLineageNextSource = {
  system: string | null;
  object_name: string | null;
  connection_required: boolean;
};

type ConnectedLineageSystemDetail = {
  system: string;
  database: string;
  connectionStatus: string;
  metadataStatus: string;
  resolved: boolean;
  report_name: string;
  source_object: string;
  systems_connected: number;
  systems_of_record_reached: number;
  branch_outstanding: number;
  rows: ConnectedLineageRow[];
  next_source?: ConnectedLineageNextSource;
};

type ConnectedLineageResponse = {
  allSystemsConnected: boolean;
  detail?: string;
  missingSystems?: string[];
  lineageGraphUrl?: string;
  systemsConnected?: number;
  systemsOfRecordReached?: number;
  branchOutstanding?: number;
  systems?: ConnectedLineageSystem[];
  connectedSystems?: ConnectedLineageSystemDetail[];
  rows?: ConnectedLineageRow[];
};

type DisplaySection = {
  key: string;
  source_object: string;
  label?: string;
  subtitle?: string;
  rows: ConnectedLineageRow[];
};

type DisplayRowInput = {
  system: string;
  attribute_name: string;
  table_name: string;
  transformation?: string | null;
  sourced_from?: string | null;
  consumed_by?: string | null;
  status: string;
};

function toDisplayRow(row: DisplayRowInput): ConnectedLineageRow {
  return {
    system: row.system,
    attribute_name: row.attribute_name,
    table_name: row.table_name,
    transformation: row.transformation ?? null,
    sourced_from: row.sourced_from ?? null,
    consumed_by: row.consumed_by ?? null,
    status: row.status,
  };
}

function connectedLineageUrl(): string {
  const base = (
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://127.0.0.1:8000"
  ).replace(/\/$/, "");

  return `${base}/lineage/connected`;
}

export function TraceProgressPanel() {
  const router = useRouter();

  const [activeAction, setActiveAction] = useState("Connect");
  const {
    dbType,
    database,
    setDbType,
    setDatabase,
  } = useReports();

  /*
   * Latest API response.
   *
   * Used for the page header and latest trace metadata.
   */
  const [traceData, setTraceData] =
    useState<ReverseLineageResponse | null>(null);

  /*
   * Store every API response as a separate
   * lineage section.
   *
   * Example:
   *
   * [
   *   response from reporting.db,
   *   response from crm.db,
   *   response from sales.db
   * ]
   */
  const [traceSections, setTraceSections] = useState<
    ReverseLineageResponse[]
  >([]);

  const [connectedData, setConnectedData] =
    useState<ConnectedLineageResponse | null>(null);

  const [checkingConnected, setCheckingConnected] = useState(true);

  const [connectedError, setConnectedError] =
    useState<string | null>(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  /*
   * Count unique systems from all lineage sections.
   */
  const [systemConnected, setSystemConnected] = useState(0);

  /*
   * Reference to the latest section.
   *
   * Used to automatically scroll to the newly
   * fetched lineage section.
   */
  const bottomRef =
    useRef<HTMLDivElement | null>(null);

  /*
   * Track how many sections were rendered on the
   * previous render so we only scroll when a new
   * section is appended.
   */
  const previousSectionCountRef = useRef(0);

  /*
   * Load lineage data.
   *
   * The default values come from the current
   * dbType and database state.
   *
   * For a newly connected source, we pass the
   * newly selected values explicitly because
   * React state updates are asynchronous.
   *
   * append = false
   * -> Initial load. Creates the first section.
   *
   * append = true
   * -> New source connection. Creates a completely
   *    new section below the existing sections.
   */
  const loadLineage = async (
    append = false,
    selectedDbType = dbType,
    selectedDatabase = database
  ) => {
    try {
      setLoading(true);
      setError(null);

      let object_name = "vw_sales_fact";

      if (selectedDatabase === "crm.db") {
        object_name = "vw_customers";
      } else if (
        selectedDatabase === "sales.db"
      ) {
        object_name = "vw_orders";
      } else if (
        selectedDatabase === "sales_test.db"
      ) {
        object_name = "vw_orders";
      } else if (
        selectedDatabase === "crm_test.db"
      ) {
        object_name = "vw_customers";
      } else if (
        database === "normalized_data.db"
      ) {
        object_name = "vw_adj_norm_sensi";
      } else if (
        database === "adj_audit.db"
      ) {
        object_name = "vw_adjusted_sensi";
      } else if (
        database === "raw_sensi.db"
      ) {
        object_name = "vw_raw_sensi";
      }

      const payload: ReverseLineageRequest = {
        //report_name: "COREP C90 Report",
        report_name: "raw_sensitive_data",
        db_type: selectedDbType,
        database: selectedDatabase,
        //object_name: object_name,
      };

      console.log(
        "Calling reverse lineage with:",
        payload
      );

      const response =
        await getReverseLineage(payload);

      console.log("response **", response);

      /*
       * Keep the latest API response.
       *
       * This is used by the header/stats.
       */
      setTraceData(response);

      /*
       * Add the complete API response as a new section.
       *
       * We do NOT merge rows anymore.
       */
      setTraceSections((prevSections) => {
        if (append) {
          return [
            ...prevSections,
            response,
          ];
        }

        return [response];
      });

    } catch (err) {
      console.error(
        "Failed to load reverse lineage:",
        err
      );

      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(
          "Failed to load reverse lineage."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  /*
   * Refresh the connected-lineage snapshot after a
   * new source has been connected.
   *
   * The endpoint can return either:
   *
   * - a complete snapshot when all systems are connected
   * - a partial snapshot with connectedSystems while
   *   some systems are still missing
   */
  const refreshConnectedStatus = async () => {
    try {
      const response = await fetch(
        connectedLineageUrl(),
        {
          headers: { Accept: "*/*" },
          cache: "no-store",
        }
      );

      const payload = (await response
        .json()
        .catch(() => null)) as
        | ConnectedLineageResponse
        | null;

      if (
        payload &&
        typeof payload.allSystemsConnected === "boolean"
      ) {
        setConnectedData(payload);
        setConnectedError(null);
        setCheckingConnected(false);
      }
    } catch (caught) {
      console.log(
        "Failed to refresh connected lineage:",
        caught
      );
    }
  };

  /*
   * Check whether every source system is already connected.
   *
   * The endpoint can return a valid 409 body while some
   * systems are still missing, so parse the body before
   * evaluating the HTTP status.
   *
   * If all systems are connected, use the connected
   * lineage response instead of calling reverse lineage.
   *
   * If some systems are missing, keep the partial
   * connected response and start the reverse-lineage
   * flow.
   */
  useEffect(() => {
    let active = true;
    const controller = new AbortController();

    const bootstrap = async () => {
      try {
        const response = await fetch(
          connectedLineageUrl(),
          {
            signal: controller.signal,
            headers: { Accept: "*/*" },
            cache: "no-store",
          }
        );

        const payload = (await response
          .json()
          .catch(() => null)) as
          | ConnectedLineageResponse
          | null;

        if (!active) return;

        if (
          payload &&
          typeof payload.allSystemsConnected === "boolean"
        ) {
          setConnectedData(payload);
          setConnectedError(null);
          setCheckingConnected(false);

          if (payload.allSystemsConnected === true) {
            setLoading(false);
            return;
          }

          await loadLineage(
            false,
            dbType,
            database
          );

          return;
        }

        if (!response.ok) {
          throw new Error(
            payload?.detail ??
              `Failed to check connection status (${response.status})`
          );
        }

        throw new Error(
          "Invalid /lineage/connected response"
        );
      } catch (caught) {
        console.log("caught", caught);
        if (!active) return;

        setConnectedData(null);
        setConnectedError(null);
        setCheckingConnected(false);

        await loadLineage(
          false,
          dbType,
          database
        );

        return;
      }
    };

    void bootstrap();

    return () => {
      active = false;
      controller.abort();
    };
  }, []);

  /*
   * Count unique systems whenever a new
   * lineage section is added.
   */
  useEffect(() => {
    const allRows =
      traceSections.flatMap(
        (section) => section.rows ?? []
      );

    const uniqueSystems = new Set(
      allRows.map(
        (row) => row.system
      )
    );

    setSystemConnected(
      uniqueSystems.size
    );
  }, [traceSections]);

  /*
   * Called after SourceSystemPanel successfully
   * connects to the database.
   *
   * Update the database state first.
   *
   * Then call loadLineage() using the SAME newly
   * selected values explicitly.
   *
   * This avoids the React asynchronous state
   * update problem.
   */
  const handleConnectNextSource = async (
    newDbType: string,
    newDatabase: string
  ) => {
    /*
     * Store latest database type.
     */
    setDbType(newDbType);

    /*
     * Store latest database.
     */
    setDatabase(newDatabase);

    /*
     * Immediately use the newly selected values
     * for the API call.
     *
     * Do not rely on dbType/database state here,
     * because setState is asynchronous.
     */
    await loadLineage(
      true,
      newDbType,
      newDatabase
    );

    await refreshConnectedStatus();
  };

  const connectedSnapshot =
    connectedData?.allSystemsConnected
      ? connectedData
      : null;

  /*
   * Build one display section per connected system.
   *
   * `connectedSystems` is available even while some
   * systems are still missing, so partial lineage can
   * be shown before the trace is complete.
   */
  const connectedSections: DisplaySection[] | null =
    (() => {
      if (!connectedData) return null;

      const details =
        connectedData.connectedSystems ?? [];

      if (details.length > 0) {
        return details.map(
          (detail, index) => ({
            key: `connected-${detail.system}-${index}`,
            source_object: detail.system,
            label: detail.system,
            subtitle: detail.database,
            rows: (detail.rows ?? []).map(
              toDisplayRow
            ),
          })
        );
      }

      /*
       * Older responses only expose the flattened rows.
       */
      if (connectedData.allSystemsConnected) {
        return [
          {
            key: "connected-lineage",
            source_object: "connected-lineage",
            label: "Connected lineage",
            rows: (connectedData.rows ?? []).map(
              toDisplayRow
            ),
          },
        ];
      }

      return null;
    })();

  const traceDisplaySections: DisplaySection[] =
    traceSections.map(
      (section, index) => ({
        key: `trace-${section.source_object ?? "section"}-${index}`,
        source_object:
          section.source_object ??
          "discovered-lineage",
        rows: (section.rows ?? []).map(
          toDisplayRow
        ),
      })
    );

  const renderedSections =
    connectedSections ?? traceDisplaySections;

  const connectedActive =
    connectedSections !== null;

  const renderedSectionCount =
    renderedSections.length;

  /*
   * Scroll to the latest section when a new table
   * section is appended.
   *
   * Skip the initial render.
   */
  useEffect(() => {
    if (
      previousSectionCountRef.current > 0 &&
      renderedSectionCount >
        previousSectionCountRef.current
    ) {
      bottomRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }

    previousSectionCountRef.current =
      renderedSectionCount;
  }, [renderedSectionCount]);

  const connectedSystemList: ConnectedLineageSystem[] =
    connectedSnapshot
      ? connectedSnapshot.systems &&
        connectedSnapshot.systems.length > 0
        ? connectedSnapshot.systems
        : (connectedSnapshot.connectedSystems ?? []).map(
            (detail) => ({
              system: detail.system,
              sourceObject: detail.source_object,
              rowCount: (detail.rows ?? []).length,
              resolved: detail.resolved,
            })
          )
      : [];

  const displayedSystemsConnected =
    connectedData
      ? (connectedData.systemsConnected ??
        connectedData.systems?.length ??
        connectedData.connectedSystems?.length ??
        systemConnected)
      : systemConnected;

  const initialLoading =
    connectedError === null &&
    (checkingConnected || loading) &&
    traceSections.length === 0 &&
    !connectedSections;

  /*
   * Show the graph action only when the complete
   * connected snapshot is available, or when the
   * existing trace section is complete and no further
   * source connection is required.
   */
  const latestSection =
    renderedSections[renderedSections.length - 1];

  const latestSectionRows =
    latestSection?.rows ?? [];

  const awaitingNextConnection =
    latestSectionRows.some(
      (row) =>
        row.status.toLowerCase() ===
        "connection required"
    );

  const showGraphLink =
    Boolean(connectedSnapshot) ||
    (!connectedActive &&
      !loading &&
      !error &&
      !connectedError &&
      latestSectionRows.length > 0 &&
      !awaitingNextConnection);

  const renderSectionTable = (
    section: DisplaySection
  ) => (
    <div
      key={section.key}
      className="panel overflow-hidden"
    >
      {section.label && (
        <div className="flex items-baseline gap-2 border-b border-slate-200 px-4 py-3">
          <h2 className="text-xs font-bold text-ink">
            {section.label}
          </h2>

          {section.subtitle && (
            <span className="font-mono text-[10px] font-normal text-slate-400">
              {section.subtitle}
            </span>
          )}
        </div>
      )}

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
            {section.rows.length ? (
              section.rows.map(
                (row, index) => (
                  <tr
                    key={`${row.system}-${row.attribute_name}-${index}`}
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
                      {row.attribute_name}
                    </td>

                    <td className="px-3 py-2.5 font-mono text-[10px] text-slate-600">
                      {row.table_name}
                    </td>

                    <td className="px-3 py-2.5 font-mono text-[10px] text-slate-600">
                      {row.transformation}
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
                          <CheckCircle2
                            size={10}
                          />

                          Identified
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
                          <Clock
                            size={10}
                          />

                          {row.status}
                        </span>
                      )}
                    </td>
                  </tr>
                )
              )
            ) : (
              <tr>
                <td
                  colSpan={8}
                  className="px-4 py-12 text-center text-[11px] text-slate-500"
                >
                  No lineage information
                  found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="border-t border-slate-100 px-4 py-3 sm:px-5">
        <p className="text-[10px] text-slate-500">
          {section.rows.length
            ? `${section.rows.length} lineage ${
                section.rows.length === 1
                  ? "record"
                  : "records"
              } identified.`
            : "No lineage records identified."}
        </p>
      </div>
    </div>
  );

  const renderAllConnectedPanel = () => {
    if (!connectedSnapshot) return null;

    return (
      <div className="panel flex flex-col p-5">
        <h2 className="pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
          All systems connected
        </h2>

        <p className="text-[11px] leading-5 text-slate-500">
          The complete lineage snapshot is available
          for every source system.
        </p>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="rounded-md bg-slate-50 px-2.5 py-2">
            <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
              Connected
            </p>

            <p className="mt-0.5 text-sm font-bold text-ink">
              {connectedSnapshot.systemsConnected ??
                0}
            </p>
          </div>

          <div className="rounded-md bg-slate-50 px-2.5 py-2">
            <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
              Sources reached
            </p>

            <p className="mt-0.5 text-sm font-bold text-ink">
              {connectedSnapshot.systemsOfRecordReached ??
                0}
            </p>
          </div>

          <div className="rounded-md bg-slate-50 px-2.5 py-2">
            <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
              Branches outstanding
            </p>

            <p className="mt-0.5 text-sm font-bold text-ink">
              {connectedSnapshot.branchOutstanding ??
                0}
            </p>
          </div>

          <div className="rounded-md bg-slate-50 px-2.5 py-2">
            <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
              Missing
            </p>

            <p className="mt-0.5 text-sm font-bold text-ink">
              {connectedSnapshot.missingSystems
                ?.length ?? 0}
            </p>
          </div>
        </div>

        <ul className="mt-4 space-y-1.5">
          {connectedSystemList.map((system) => (
            <li
              key={system.system}
              className="flex items-center justify-between gap-3 rounded-md border border-slate-200 px-2.5 py-1.5 font-mono text-[10px]"
            >
              <span className="min-w-0 truncate text-slate-700">
                {system.system}
              </span>

              <span className="shrink-0 text-slate-400">
                {system.rowCount}{" "}
                {system.rowCount === 1
                  ? "row"
                  : "rows"}
              </span>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  const renderNextSourcePanel = () => (
    <div className="panel flex flex-col p-5">
      <h2 className="pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
        Next source identification
      </h2>

      <SourceSystemPanel
        onConnect={handleConnectNextSource}
        hideTitle={true}
      />
    </div>
  );

  console.log(
    "tracedata",
    traceData
  );

  console.log(
    "current dbType",
    dbType
  );

  console.log(
    "current database",
    database
  );

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
            {traceData?.report_name ??
              (connectedError
                ? "Connection check failed"
                : connectedData
                  ? "Connected lineage"
                  : "Loading report...")}{" "}
            ·{" "}
            {traceData?.source_object ??
              (connectedError
                ? "GET /lineage/connected"
                : connectedSnapshot
                  ? "All source systems"
                  : connectedActive
                    ? "Connected systems"
                    : connectedData
                      ? "Connected lineage"
                      : "Loading source...")}
          </p>
        </div>

        {/* Stats */}
        <div className="flex items-start gap-6">
          {/* Systems connected */}
          <div className="text-center">
            <div className="text-lg font-bold text-ink">
              {initialLoading ? (
                <Loader2
                  size={18}
                  className="animate-spin"
                />
              ) : connectedError ? (
                "-"
              ) : (
                displayedSystemsConnected
              )}
            </div>

            <div className="text-[10px] text-slate-500">
              systems connected
            </div>
          </div>

          {/* Systems of record */}
          {/* <div className="text-center">
            <div className="text-lg font-bold text-ink">
              {loading &&
              traceSections.length === 0
                ? "-"
                : traceData?.systems_of_record_reached ??
                  0}
            </div>

            <div className="text-[10px] text-slate-500">
              systems of record reached
            </div>
          </div> */}

          {/* Branch outstanding */}
          {/* <div className="text-center">
            <div className="text-lg font-bold text-ink">
              {loading &&
              traceSections.length === 0
                ? "-"
                : traceData?.branch_outstanding ??
                  0}
            </div>

            <div className="text-[10px] text-slate-500">
              branch outstanding
            </div>
          </div> */}
        </div>
      </div>

      {/* Reverse-lineage error */}
      {error && (
        <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[11px] text-red-700">
          {error}
        </div>
      )}

      {connectedError ? (
        <div className="panel p-8 text-center">
          <h2 className="text-sm font-bold text-ink">
            Connection check failed
          </h2>

          <p className="mx-auto mt-2 max-w-md text-[11px] leading-5 text-red-700">
            {connectedError}
          </p>

          <p className="mx-auto mt-2 max-w-md text-[11px] leading-5 text-slate-500">
            Reverse lineage was not started. Verify that
            GET /lineage/connected is reachable and that
            NEXT_PUBLIC_API_BASE_URL or NEXT_PUBLIC_API_URL
            points to the API.
          </p>
        </div>
      ) : initialLoading ? (
        <div className="panel flex items-center justify-center py-16">
          <div className="flex items-center gap-2 text-[11px] text-slate-500">
            <Loader2
              size={15}
              className="animate-spin"
            />

            {checkingConnected
              ? "Checking connection status..."
              : "Discovering reverse lineage..."}
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          {connectedSnapshot &&
          connectedSections ? (
            <div
              ref={bottomRef}
              className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_340px]"
            >
              <div className="space-y-5">
                {connectedSections.map(
                  (section) =>
                    renderSectionTable(section)
                )}
              </div>

              {renderAllConnectedPanel()}
            </div>
          ) : (
            renderedSections.map(
              (section, sectionIndex) => {
                const isLastSection =
                  sectionIndex ===
                  renderedSections.length - 1;

                return (
                  <div
                    key={section.key}
                    ref={
                      isLastSection
                        ? bottomRef
                        : undefined
                    }
                    className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_340px]"
                  >
                    {renderSectionTable(section)}

                    {renderNextSourcePanel()}
                  </div>
                );
              }
            )
          )}

          {/* Loading new hop */}
          {loading &&
            traceSections.length > 0 && (
              <div className="flex items-center justify-center gap-2 py-6 text-[11px] text-slate-500">
                <Loader2
                  size={15}
                  className="animate-spin"
                />

                Discovering next reverse lineage hop...
              </div>
            )}
        </div>
      )}

      {/* Footer actions */}
      {showGraphLink && (
        <div className="mt-5 flex items-center justify-end">
          <button
            type="button"
            onClick={() =>
              router.push("/lineage/evidence")
            }
            className="btn-primary inline-flex"
          >
            View lineage graph
          </button>
        </div>
      )}
    </main>
  );
}