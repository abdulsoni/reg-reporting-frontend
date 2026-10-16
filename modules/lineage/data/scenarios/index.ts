import type { LineageData } from "../../types/lineage";
import { scenarioA } from "./scenarioA";
import { scenarioB } from "./scenarioB";
import { scenarioC } from "./scenarioC";

export const SCENARIOS = {
  A: scenarioA,
  B: scenarioB,
  C: scenarioC,
} as const;

export type ScenarioId = keyof typeof SCENARIOS;

export const SCENARIO_IDS = Object.keys(SCENARIOS) as ScenarioId[];

export const DEFAULT_SCENARIO_ID: ScenarioId = "A";

export function isScenarioId(value: string | null | undefined): value is ScenarioId {
  return value != null && Object.prototype.hasOwnProperty.call(SCENARIOS, value);
}

/** Resolve a scenario by id, falling back to the default when unknown. */
export function getScenario(id: string | null | undefined): LineageData {
  return isScenarioId(id) ? SCENARIOS[id] : SCENARIOS[DEFAULT_SCENARIO_ID];
}
