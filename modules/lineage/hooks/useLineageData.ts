"use client";

import { useEffect, useState } from "react";

import { getLineageData } from "../api/lineageDataApi";
import {
  DEFAULT_SCENARIO_ID,
  getScenario,
  type ScenarioId,
} from "../data/scenarios";
import type { LineageData } from "../types/lineage";

/**
 * Loads the single lineage graph response. While the request is in flight (or
 * if it fails) the matching bundled local scenario is shown, so the explorer
 * always has something to render. Re-fetches when the selected scenario changes.
 */
export function useLineageData(scenarioId: ScenarioId = DEFAULT_SCENARIO_ID) {
  const [remote, setRemote] = useState<{ id: ScenarioId; data: LineageData } | null>(
    null
  );
  const [error, setError] = useState<{ id: ScenarioId; message: string } | null>(
    null
  );

  useEffect(() => {
    let active = true;

    getLineageData(scenarioId)
      .then((data) => {
        if (!active) return;
        setRemote({ id: scenarioId, data });
        setError(null);
      })
      .catch((caught) => {
        if (!active) return;
        setError({
          id: scenarioId,
          message:
            caught instanceof Error
              ? caught.message
              : "Failed to load lineage data",
        });
      });

    return () => {
      active = false;
    };
  }, [scenarioId]);

  // Prefer the freshly fetched response for this scenario; otherwise fall back
  // to the local scenario until the request resolves.
  const data =
    remote && remote.id === scenarioId ? remote.data : getScenario(scenarioId);
  const loading =
    (remote?.id ?? null) !== scenarioId && (error?.id ?? null) !== scenarioId;
  const errorMessage = error && error.id === scenarioId ? error.message : null;

  return { data, loading, error: errorMessage };
}
