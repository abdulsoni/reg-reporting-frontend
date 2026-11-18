"use client";

import { useEffect, useRef, useState } from "react";
import { useStore } from "@xyflow/react";
import {
  ChevronDown,
  Download,
  FileImage,
  FileText,
  Loader2,
} from "lucide-react";

import { useLineageGraphExport } from "../../services/lineageGraphExport";

type Props = {
  /** Used for the exported file names, e.g. the datapoint id. */
  fileName?: string;
};

/*
 * Inline so a global `button { font-size }` rule can't change its size.
 */
const buttonStyle = {
  fontSize: 11,
  lineHeight: 1,
  fontFamily: "inherit",
  fontWeight: 600,
} as const;

const itemClass =
  "flex w-full items-center gap-2 px-3 py-2 text-left text-[11px] font-medium text-ink hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50";

/**
 * Export dropdown for the graph views. Render it inside a <ReactFlowProvider>
 * so the header button and the mounted graph share one React Flow store.
 */
export default function LineageGraphExportMenu({ fileName }: Props) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const { exportPng, exportPdf } = useLineageGraphExport();

  /*
   * Nodes stay in the store after their graph unmounts, so also require the
   * captured DOM node to still be attached to the page.
   */
  const graphReady = useStore(
    (state) => state.nodesInitialized && Boolean(state.domNode?.isConnected)
  );

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const run = async (task: () => Promise<void>) => {
    setBusy(true);
    setError(null);

    try {
      await task();
      setOpen(false);
    } catch (cause) {
      console.error("Graph export failed:", cause);
      setError(
        cause instanceof Error ? cause.message : "Unable to export the graph."
      );
    } finally {
      setBusy(false);
    }
  };

  const toggle = () => {
    setError(null);
    setOpen((current) => !current);
  };

  const graphDisabled = busy || !graphReady;

  return (
    <div ref={containerRef} className="relative ml-auto">
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-haspopup="menu"
        style={buttonStyle}
        className="inline-flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border border-slate-300 bg-white px-3 py-2 text-ink transition hover:bg-slate-50"
      >
        {busy ? (
          <Loader2 size={13} className="animate-spin" />
        ) : (
          <Download size={13} />
        )}
        Export details
        <ChevronDown size={12} />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-30 mt-1 w-56 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl"
        >
          <button
            type="button"
            role="menuitem"
            disabled={graphDisabled}
            onClick={() => run(() => exportPng(fileName))}
            className={itemClass}
            style={{ fontFamily: "inherit" }}
          >
            <FileImage size={14} className="text-slate-500" />
            Export graph as PNG
          </button>

          <button
            type="button"
            role="menuitem"
            disabled={graphDisabled}
            onClick={() => run(() => exportPdf(fileName))}
            className={itemClass}
            style={{ fontFamily: "inherit" }}
          >
            <FileText size={14} className="text-slate-500" />
            Export graph as PDF
          </button>

          {!graphReady && (
            <p className="border-t border-slate-100 bg-slate-50 px-3 py-2 text-[10px] text-slate-500">
              The graph is still loading. PNG and PDF become available once it
              is on screen.
            </p>
          )}

          {error && (
            <p className="border-t border-rose-100 bg-rose-50 px-3 py-2 text-[10px] text-rose-700">
              {error}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
