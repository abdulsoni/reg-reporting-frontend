import { MarkerType, type Edge, type Node } from "@xyflow/react";

export type SystemData = {
  label: string;
  description: string;
  target?: boolean;
};

export type SystemNode = Node<SystemData, "system">;

export const systemNodes: SystemNode[] = [
  {
    id: "raw_sensi",
    type: "system",
    position: { x: 40, y: 40 },
    data: { label: "raw_sensi.db", description: "Source sub-hop" },
  },
  {
    id: "adj_audit",
    type: "system",
    position: { x: 40, y: 220 },
    data: { label: "adj_audit.db", description: "Adjustment sub-hop" },
  },
  {
    id: "ref_fx_data",
    type: "system",
    position: { x: 40, y: 400 },
    data: { label: "ref_fx_data", description: "FX sub-hop" },
  },
  {
    id: "normalized_data",
    type: "system",
    position: { x: 430, y: 220 },
    data: {
      label: "normalized_data.db",
      description: "Open existing table-level lineage",
      target: true,
    },
  },
];

export const systemEdges: Edge[] = [
  {
    id: "raw-normalized",
    source: "raw_sensi",
    target: "normalized_data",
    type: "smoothstep",
    markerEnd: { type: MarkerType.ArrowClosed },
  },
  {
    id: "adjustment-normalized",
    source: "adj_audit",
    target: "normalized_data",
    type: "smoothstep",
    markerEnd: { type: MarkerType.ArrowClosed },
  },
  {
    id: "fx-normalized",
    source: "ref_fx_data",
    target: "normalized_data",
    type: "smoothstep",
    markerEnd: { type: MarkerType.ArrowClosed },
  },
];
