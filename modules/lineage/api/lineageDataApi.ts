import { apiUrl } from "../lib/config";
import type { LineageData } from "../types/lineage";

/** Fetch the full lineage graph for the connected database. */
export async function getLineageData(): Promise<LineageData> {
  const response = await fetch(apiUrl("/api/lineage"), {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to load lineage data");
  }

  return response.json();
}
