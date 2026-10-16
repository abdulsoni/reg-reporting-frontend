import type { LineageData } from "../../types/lineage";
import { buildScenario } from "./base";

/**
 * Scenario A — only `normalized_data` is connected. Every upstream system it
 * depends on appears as a "Please connect" placeholder.
 */
export const scenarioA: LineageData = buildScenario({
  connectedSystemIds: ["normalized_data"],
  tableIds: [
    "normalized_data:raw_sensi",
    "normalized_data:adj_data",
    "normalized_data:ref_fx_data",
  ],
  dependencyIds: ["raw_sensi", "adj_audit", "ref_fx_data"],
});
