import { ChevronDown, Lock } from "lucide-react";

type SourceSystemPanelProps = {
  onConnect: () => void;
};

export function SourceSystemPanel({ onConnect }: SourceSystemPanelProps) {
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

      <form className="mt-4 flex flex-1 flex-col gap-3" onSubmit={(e) => { e.preventDefault(); onConnect(); }}>
        {/* System type */}
        <label>
          <span className="label">System type</span>
          <div className="relative">
            <select className="field field-compact appearance-none pr-9">
              <option>PostgreSQL</option>
              <option>Oracle</option>
              <option>SQL Server</option>
              <option>MySQL</option>
              <option>Snowflake</option>
              <option>BigQuery</option>
            </select>
            <ChevronDown
              size={15}
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
          </div>
        </label>

        {/* Host */}
        <label>
          <span className="label">Host</span>
          <input
            type="text"
            className="field field-compact"
            defaultValue="reporting-db.sandbox:5432"
          />
        </label>

        {/* Database */}
        <label>
          <span className="label">Database</span>
          <input
            type="text"
            className="field field-compact"
            defaultValue="reporting_db"
          />
        </label>

        {/* Read-only user + Password */}
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

        {/* Submit */}
        <div className="mt-auto pt-2">
          <button type="submit" className="btn-primary w-full">
            <Lock size={14} />
            Connect and initiate trace
          </button>
        </div>
      </form>
    </section>
  );
}