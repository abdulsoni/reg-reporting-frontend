import { ReverseLineageResponse } from "../types/trace";
import type {
  DataTraceRequest,
  DataTraceResponse,
} from "../types/dataTrace";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export interface ReverseLineageRequest {
  report_name: string;
  db_type: string;
  database: string;
 // object_name:string;
}

export async function getReverseLineage(
  payload: ReverseLineageRequest
): Promise<ReverseLineageResponse> {
  const response = await fetch(
    `${API_BASE_URL}/reverse-lineage-tracking/v2`,
    {
      method: "POST",
      headers: {
        Accept: "*/*",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    }
  );

  if (!response.ok) {
    let message = `Failed to retrieve lineage (${response.status})`;

    try {
      const error = await response.json();

      message =
        error?.detail ||
        error?.message ||
        message;
    } catch {
      // Ignore JSON parsing failure
    }

    throw new Error(message);
  }

  return response.json();
}

/**
 * Trace one report datapoint through its source records.
 *
 * The datapoint id is `<row_key>.<column>` from the uploaded PDF, for
 * example `NORM-SENS-00002.normalized_usd`. The backend can persist the
 * trace so it is available from the trace read/list endpoints.
 */
export async function getDataTrace(
  payload: DataTraceRequest
): Promise<DataTraceResponse> {
  const response = await fetch(
    `${API_BASE_URL}/data-lineage/trace`,
    {
      method: "POST",
      headers: {
        Accept: "*/*",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    }
  );

  if (!response.ok) {
    let message = `Failed to trace data lineage (${response.status})`;

    try {
      const error = await response.json();

      message =
        error?.detail ||
        error?.message ||
        message;
    } catch {
      // Ignore JSON parsing failure
    }

    throw new Error(message);
  }

  return response.json();
}