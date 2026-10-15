"use client";

import { useEffect, useState } from "react";

import { getLineageData } from "../api/lineageDataApi";
import { lineageData } from "../data/lineageData";
import type { LineageData } from "../types/lineage";

/**
 * Loads the lineage graph from the API, falling back to the bundled static
 * snapshot if the request fails so the explorer always has something to render.
 */
export function useLineageData() {
  const [data, setData] = useState<LineageData>(lineageData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    getLineageData()
      .then((remote) => {
        if (!active) return;
        setData(remote);
        setError(null);
      })
      .catch((caught) => {
        if (!active) return;
        setError(
          caught instanceof Error ? caught.message : "Failed to load lineage data"
        );
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return { data, loading, error };
}
