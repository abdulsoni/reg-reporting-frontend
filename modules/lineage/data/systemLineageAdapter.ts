import { MarkerType, type Edge, type Node } from "@xyflow/react";

import type { LineageData } from "../types/lineage";

export type SystemData = {
  label: string;
  description: string;
  target?: boolean;
  canExplore?: boolean;
};

export type SystemNode = Node<SystemData, "system">;

export function buildSystemGraph(data: LineageData) {
  const positions: Record<string, { x: number; y: number }> = {
    raw_sensi: { x: 40, y: 40 },
    adj_audit: { x: 40, y: 220 },
    ref_fx_data: { x: 40, y: 400 },
    normalized_data: { x: 430, y: 220 },
  };

  const nodes: SystemNode[] = data.systems.map((system, index) => ({
    id: system.id,
    type: "system",
    position: positions[system.id] ?? { x: 0, y: 40 + index * 180 },
    data: {
      label: system.label,
      description: system.description,
      target: system.target ?? false,
      canExplore: data.tables.some((table) => table.systemId === system.id),
    },
  }));

  // Deduplicate system connections even if several column edges
  // connect the same pair of systems.
  const connections = new Map<string, Edge>();

  for (const item of data.edges) {
    const source: string | undefined = item.sourceSystemId;
    const target: string | undefined = item.targetSystemId;

    if (!source || !target || source === target) continue;

    const id = `${source}->${target}`;

    if (!connections.has(id)) {
      connections.set(id, {
        id,
        source,
        target,
        //type: "smoothstep",
        markerEnd: { type: MarkerType.ArrowClosed },
      });
    }
  }

  return {
    nodes,
    edges: Array.from(connections.values()),
  };
}
