import type { LineageRow } from "../components/data-lineage/types";
import type {
  DataTraceHop,
  DataTraceReconciliation,
  DataTraceResponse,
  DataTraceValue,
} from "../types/dataTrace";

export function formatTraceValue(
  value: DataTraceValue | undefined
): string {
  if (value === null || value === undefined || value === "") {
    return "";
  }

  return String(value);
}

function numericValue(value: DataTraceValue | undefined): number | null {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);

    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

export function varianceOf(
  reported: DataTraceValue | undefined,
  calculated: DataTraceValue | undefined
): number | null {
  const a = numericValue(reported);
  const b = numericValue(calculated);

  if (a === null || b === null) {
    return null;
  }

  return Math.abs(a - b);
}

/** Reconciliation of one hop: stored output vs. the backend's recomputation. */
export function reconciliationForHop(
  hop: DataTraceHop,
  tolerance = 0.01
): DataTraceReconciliation {
  const calculated = hop.calculated ?? null;

  const verification = hop.verification ?? "";

  return {
    reported_value: hop.output,
    calculated_value: calculated,
    variance: varianceOf(hop.output, calculated),
    tolerance,
    result:
      verification === "NotApplicable"
        ? "Not applicable"
        : verification || "Incomplete",
  };
}

/**
 * Fill in the fields the backend may omit. Older responses expose the stored
 * value as `stored_value` instead of `calculated_value`.
 */
export function normalizeReconciliation(
  reconciliation: DataTraceReconciliation,
  fallbackCalculated?: DataTraceValue
): DataTraceReconciliation {
  const calculated =
    reconciliation.calculated_value ??
    reconciliation.stored_value ??
    fallbackCalculated ??
    null;

  return {
    ...reconciliation,
    calculated_value: calculated,
    variance:
      reconciliation.variance ??
      varianceOf(reconciliation.reported_value, calculated),
    tolerance: reconciliation.tolerance ?? 0.01,
    result: reconciliation.result || "Incomplete",
  };
}

function mapStatus(status: string): LineageRow["status"] {
  const normalized = status.trim().toLowerCase();

  if (normalized === "identified") {
    return "Verified";
  }

  if (normalized.includes("connection")) {
    return "Discovering";
  }

  return "Unresolved";
}

function mapHop(
  trace: DataTraceResponse,
  hop: DataTraceHop
): LineageRow {
  const isReportHop = hop.hop === "1";

  const inputs = hop.inputs.map(formatTraceValue);

  return {
    hop: hop.hop,

    system: hop.system.toUpperCase(),

    systemLabel: isReportHop
      ? "Reporting layer"
      : "Source system",

    table: hop.table,

    attribute: hop.attribute,

    recordKey: hop.record_key ?? "—",

    inputValue: inputs.filter(value => value != null && value !== "").join(" , ") || "NA",

    transformation: hop.transformation || "NA",

    // valuesUsed: inputs.length ? inputs.join("\n") : " ",

    outputValue: hop.output ? formatTraceValue(hop.output): 'NA',

    // consumedBy: isReportHop
    //   ? trace.header.report
    //   : `${trace.object}.${trace.attribute}`,

    consumedBy:hop.consumedBy,

    status: mapStatus(hop.status),

    connected: hop.status.trim().toLowerCase() === "identified",
    systemHop:hop.systemHop
  };
}

export function mapTraceHops(
  trace: DataTraceResponse
): LineageRow[] {
  return trace.hops.map((hop) => mapHop(trace, hop));
}
