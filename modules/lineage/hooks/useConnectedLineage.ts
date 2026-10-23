"use client";

import { useEffect, useState } from "react";

import { apiUrl } from "../lib/config";
import type { ConnectedLineageResponse } from "../types/lineage";

type ConnectedLineagePayload = ConnectedLineageResponse & {
  detail?: string;
};

/**
 * Loads the backend's complete lineage snapshot for the trace page. The
 * backend answers 409 with `allSystemsConnected: false` while sources are
 * still missing, so the body is parsed before the HTTP status is evaluated.
 */
export function useConnectedLineage() {
  const [data, setData] = useState<ConnectedLineageResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();

    async function load() {
      try {
        const response = await fetch(apiUrl("/lineage/connected"), {
          signal: controller.signal,
          headers: { Accept: "*/*" },
          cache: "no-store",
        });

        const payload = (await response
          .json()
          .catch(() => null)) as ConnectedLineagePayload | null;

        if (payload && typeof payload.allSystemsConnected === "boolean") {
          if (active) {
            setData(payload);
            setError(null);
          }

          return;
        }

        if (!response.ok) {
          throw new Error(
            payload?.detail ??
              `Failed to check connection status (${response.status})`
          );
        }

        throw new Error("Invalid /lineage/connected response");
      } catch (cause) {
        if (active) {
          setData(null);
          setError(
            cause instanceof Error
              ? cause.message
              : "Failed to check connection status"
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();

    return () => {
      active = false;
      controller.abort();
    };
  }, []);

  return { data, loading, error };
}
