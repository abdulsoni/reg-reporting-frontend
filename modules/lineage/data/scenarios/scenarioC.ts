import type { LineageData } from "../../types/lineage";
import { buildScenario } from "./base";

/**
 * Scenario C — all four systems are connected. The complete cross-system table
 * and attribute lineage can be visualized with no placeholders.
 */
export const scenarioC: LineageData = buildScenario({
  connectedSystemIds: ["normalized_data", "adj_audit", "ref_fx_data", "raw_sensi"],
  tableIds: [
    "normalized_data:raw_sensi",
    "normalized_data:adj_data",
    "normalized_data:ref_fx_data",
    "adj_audit:adj_audit",
    "ref_fx_data:ref_fx_data",
    "raw_sensi:raw_sensi",
  ],
  dependencyIds: [],
});
