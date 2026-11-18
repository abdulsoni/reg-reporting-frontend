"use client";

import { useReactFlow, useStore } from "@xyflow/react";

/** Empty space kept around the graph in the exported image, in flow pixels. */
const PADDING = 80;

/** Browsers refuse canvases much larger than this on one side. */
const MAX_CANVAS_SIDE = 16000;

/** Below this the text is unreadable, so fail instead of shrinking further. */
const MIN_PIXEL_RATIO = 0.25;

/** PDF pages max out at 14400pt (5080mm); stay safely under it. */
const MAX_PDF_SIDE_MM = 5000;

const BACKGROUND = "#ffffff";
const DEFAULT_BASE_NAME = "ATLAS-Data-Lineage";

type Captured = {
  dataUrl: string;
  width: number;
  height: number;
};

function sanitizeFileName(name: string): string {
  const cleaned = name
    .trim()
    .replace(/[\\/:*?"<>|]+/g, "-")
    .replace(/\s+/g, " ")
    .slice(0, 120);

  return cleaned || "lineage-graph";
}

function download(href: string, fileName: string) {
  const link = document.createElement("a");
  link.href = href;
  link.download = fileName;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();
}

/**
 * Exports the complete React Flow graph (not just the visible part) as a PNG
 * or PDF.
 *
 * Must be used inside a <ReactFlowProvider>, and only while a <ReactFlow> is
 * mounted. `html-to-image` and `jspdf` are imported lazily so they never reach
 * the initial page bundle or the server.
 */
export function useLineageGraphExport(baseName = DEFAULT_BASE_NAME) {
  const { getNodes, getNodesBounds } = useReactFlow();
  const domNode = useStore((state) => state.domNode);
  const nodesInitialized = useStore((state) => state.nodesInitialized);

  const capture = async (): Promise<Captured> => {
    if (!domNode?.isConnected) {
      throw new Error("The lineage graph is not on screen.");
    }

    if (!nodesInitialized) {
      throw new Error(
        "The lineage graph is still loading. Try again in a moment."
      );
    }

    const nodes = getNodes();

    if (nodes.length === 0) {
      throw new Error("No lineage graph available to export.");
    }

    const viewportElement =
      domNode.querySelector<HTMLElement>(".react-flow__viewport");

    if (!viewportElement) {
      throw new Error("The lineage graph is not on screen.");
    }

    /*
     * Bounds of every node, including nested ones (attributes inside tables
     * inside systems), regardless of the current zoom or pan.
     */
    const bounds = getNodesBounds(nodes);

    if (bounds.width <= 0 || bounds.height <= 0) {
      throw new Error("The lineage graph has no visible nodes to export.");
    }

    const width = Math.ceil(bounds.width + PADDING * 2);
    const height = Math.ceil(bounds.height + PADDING * 2);

    const pixelRatio = Math.max(
      MIN_PIXEL_RATIO,
      Math.min(2, MAX_CANVAS_SIDE / Math.max(width, height))
    );

    if (
      width * pixelRatio > MAX_CANVAS_SIDE ||
      height * pixelRatio > MAX_CANVAS_SIDE
    ) {
      throw new Error(
        "The lineage graph is too large to export. Collapse some systems and try again."
      );
    }

    // Make sure custom fonts are loaded before the snapshot.
    await document.fonts.ready;

    const { toPng } = await import("html-to-image");

    const dataUrl = await toPng(viewportElement, {
      width,
      height,
      pixelRatio,
      backgroundColor: BACKGROUND,
      cacheBust: true,
      style: {
        width: `${width}px`,
        height: `${height}px`,
        // Zoom 1, shifted so the top-left node sits at the padding.
        transform: `translate(${PADDING - bounds.x}px, ${
          PADDING - bounds.y
        }px) scale(1)`,
        transformOrigin: "top left",
      },
    });

    return { dataUrl, width, height };
  };

  const exportPng = async (name = baseName) => {
    const { dataUrl } = await capture();
    download(dataUrl, `${sanitizeFileName(name)}.png`);
  };

  const exportPdf = async (name = baseName) => {
    const { dataUrl, width, height } = await capture();
    const { jsPDF } = await import("jspdf");

    // One custom-size page keeps the whole graph on a single sheet.
    const unscaledWidth = 297;
    const unscaledHeight = (height / width) * unscaledWidth;
    const scale = Math.min(
      1,
      MAX_PDF_SIDE_MM / Math.max(unscaledWidth, unscaledHeight)
    );
    const pageWidth = unscaledWidth * scale;
    const pageHeight = unscaledHeight * scale;

    const pdf = new jsPDF({
      orientation: pageWidth >= pageHeight ? "landscape" : "portrait",
      unit: "mm",
      format: [pageWidth, pageHeight],
      compress: true,
    });

    pdf.addImage(dataUrl, "PNG", 0, 0, pageWidth, pageHeight);
    pdf.save(`${sanitizeFileName(name)}.pdf`);
  };

  return { exportPng, exportPdf };
}
