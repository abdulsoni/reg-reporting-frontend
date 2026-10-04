import { ReverseLineageResponse } from "../types/trace";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export interface ReverseLineageRequest {
  report_name: string;
  db_type: string;
  database: string;
}

export async function getReverseLineage(
  payload: ReverseLineageRequest
): Promise<ReverseLineageResponse> {
  const response = await fetch(
    `${API_BASE_URL}/reverse-lineage-tracking`,
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