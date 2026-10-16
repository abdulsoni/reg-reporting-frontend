import type { NextRequest } from "next/server";

import {
  DEFAULT_SCENARIO_ID,
  getScenario,
} from "@/modules/lineage/data/scenarios";

export const dynamic = "force-dynamic";

/**
 * Single graph endpoint. Returns one self-contained response with the systems
 * that are currently connected, their available tables and attributes, the
 * lineage edges that reference them, and the identity of any external systems
 * their lineage depends on.
 *
 * The active scenario can be selected with `?scenario=A|B|C` (defaults to A).
 */
export async function GET(request: NextRequest) {
  const scenarioId =
    request.nextUrl.searchParams.get("scenario") ?? DEFAULT_SCENARIO_ID;

  return Response.json(getScenario(scenarioId));
}
