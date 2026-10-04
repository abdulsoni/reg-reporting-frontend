"use client";

import { ChevronDown, Lock, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { useDatabaseConnection } from "../hooks/useDatabaseConnection";
import { useReports } from "../context/ReportContext";

type SourceSystemPanelProps = {
  onConnect: () => void;
};

export function SourceSystemPanel({
  onConnect,
}: SourceSystemPanelProps) {
  const [dbType, setDbType] = useState("sqlite");
  // const [host, setHost] = useState("reporting-db.sandbox");
  // const [port, setPort] = useState("1433");
  const [database, setDatabase] = useState("lineage.db");
  // const [username, setUsername] = useState("lineage_ro");
  // const [password, setPassword] = useState("trace_readonly_pw");

  const {
    connect,
    connecting,
    connected,
    error,
  } = useDatabaseConnection();

  const { selectedReport } = useReports();

  const handleConnect = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    try {
      await connect({
        db_type: dbType,
        database,
        report_name:selectedReport?.regulatoryReturn
      });

      console.log("Database connected successfully");

      onConnect();
    } catch (err) {
      console.error("Database connection failed:", err);
    }
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

      <form
        className="mt-4 flex flex-1 flex-col gap-3"
        onSubmit={handleConnect}
      >
        {/* System type */}
        <label>
          <span className="label">System Name</span>

          <div className="relative">
            <select
              className="field field-compact appearance-none pr-9"
              value={dbType}
              onChange={(e) => setDbType(e.target.value)}
            >
              <option value="SQL Server">SQLite</option>
            </select>

            <ChevronDown
              size={15}
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
          </div>
        </label>

        {/* Host */}
        {/* <label>
          <span className="label">Host</span>

          <input
            type="text"
            className="field field-compact"
            value={host}
            onChange={(e) => setHost(e.target.value)}
          />
        </label> */}

        {/* Port */}
        {/* <label>
          <span className="label">Port</span>

          <input
            type="number"
            className="field field-compact"
            value={port}
            onChange={(e) => setPort(e.target.value)}
          />
        </label> */}

        {/* Database */}
        <label>
          <span className="label">Database</span>

          <input
            type="text"
            className="field field-compact"
            value={database}
            onChange={(e) => setDatabase(e.target.value)}
          />
        </label>

        {/* User + Password */}
        {/* <div className="grid grid-cols-2 gap-3">
          <label>
            <span className="label">Read-only user</span>

            <input
              type="text"
              className="field field-compact"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </label>

          <label>
            <span className="label">Password</span>

            <input
              type="password"
              className="field field-compact"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
        </div> */}

        {/* Success */}
        {connected && (
          <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2">
            <CheckCircle2
              size={15}
              className="text-emerald-600"
            />

            <span className="text-[10px] font-semibold text-emerald-700">
              Database connected successfully
            </span>
          </div>
        )}

        {/* Error */}
        {error && (
          <p className="text-[10px] font-medium text-red-600">
            {error}
          </p>
        )}

        {/* Submit */}
        <div className="mt-auto pt-2 text-[13px]">
          <button
            type="submit"
            disabled={connecting}
            className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Lock size={14} />

            {connecting
              ? "Connecting..."
              : connected
                ? "Connected"
                : "Connect and initiate trace"}
          </button>
        </div>
      </form>
    </section>
  );
}