type FiltersProps = {
  onUpload: () => void;
};

export function ReportFilters({ onUpload }: FiltersProps) {
  return (
    <section className="panel p-4 sm:p-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <SelectField label="Report family" value="CORE (EBA DPM)" />
        <SelectField label="Reporting entity" value="LEGAL ENTITY" />
        <SelectField label="Consolidation basis" value="Solo" />
        <SelectField label="Reference date" value="30-Jun-2026" />
        <SelectField label="Submission version" value="v1 · submitted 11-Aug-2026" />
      </div>

      <div className="mt-4 flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-xs text-slate-500">
          Reporting context is used to resolve template, datapoint and lineage versions.
        </div>
        <button onClick={onUpload} className="btn-secondary shrink-0">
          Upload another report
        </button>
      </div>
    </section>
  );
}

function SelectField({ label, value }: { label: string; value: string }) {
  return (
    <label>
      <span className="label">{label}</span>
      <select className="field" defaultValue={value}>
        <option>{value}</option>
        <option>All available</option>
      </select>
    </label>
  );
}