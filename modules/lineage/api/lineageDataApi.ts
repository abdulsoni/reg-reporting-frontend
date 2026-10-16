import { DEFAULT_SCENARIO_ID, type ScenarioId } from "../data/scenarios";
import type { LineageData } from "../types/lineage";

/**
 * Fetch the full lineage graph from the single graph endpoint. The request is
 * same-origin (served by the local route handler) rather than an external API.
 */
export async function getLineageData(
  scenarioId: ScenarioId = DEFAULT_SCENARIO_ID
): Promise<LineageData> {
  const response = await fetch(
    `/api/lineage/graph?scenario=${encodeURIComponent(scenarioId)}`,
    { cache: "no-store" }
  );

  if (!response.ok) {
    throw new Error("Failed to load lineage data");
  }

  return response.json();
}
