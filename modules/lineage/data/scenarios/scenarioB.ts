import type { LineageData } from "../../types/lineage";
import { buildScenario } from "./base";

/**
 * Scenario B — `normalized_data` and `adj_audit` are connected, so the
 * adjustment table and its column lineage resolve. The `raw_sensi` and
 * `ref_fx_data` dependencies remain placeholders.
 */
export const scenarioB: LineageData = buildScenario({
  connectedSystemIds: ["normalized_data", "adj_audit"],
  tableIds: [
    "normalized_data:raw_sensi",
    "normalized_data:adj_data",
    "normalized_data:ref_fx_data",
    "adj_audit:adj_audit",
  ],
  dependencyIds: ["raw_sensi", "ref_fx_data"],
});
