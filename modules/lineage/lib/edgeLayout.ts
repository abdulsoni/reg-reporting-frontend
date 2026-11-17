import type { Edge, Node } from "@xyflow/react";

/*
 * Distance of the first lane from the right edge of the attribute nodes, and
 * the spacing between lanes. Raise LANE_STEP if edges still feel tight.
 */
const LANE_BASE = 36;
const LANE_STEP = 14;
/** Vertical clearance required before two edges may share a lane. */
const LANE_GAP = 10;
const DEFAULT_ROW_HEIGHT = 44;

type SideEdgeData = {
  sameTable?: boolean;
  rightSide?: boolean;
  laneOffset?: number;
  edges?: Array<{ source?: { systemId?: string } }>;
};

function absoluteCenterY(
  node: Node | undefined,
  byId: Map<string, Node>
): number {
  if (!node) return 0;

  let y = 0;
  let current: Node | undefined = node;

  // Child positions are relative to their parent, so walk up the chain.
  while (current) {
    y += current.position.y;
    current = current.parentId ? byId.get(current.parentId) : undefined;
  }

  const styleHeight = node.style?.height;
  const height =
    typeof styleHeight === "number" ? styleHeight : DEFAULT_ROW_HEIGHT;

  return y + height / 2;
}

/**
 * Edges that loop out on the right side of a node (same table, or table to
 * table inside one database) all used the same vertical lane, so they drew on
 * top of each other. This gives each of them its own lane: edges whose
 * vertical spans do not overlap share a lane, overlapping ones get the next
 * lane out.
 */
export function layoutSideEdges(nodes: Node[], edges: Edge[]): Edge[] {
  const byId = new Map(
    nodes.map((node) => [node.id, node] as const)
  );

  type Item = { edge: Edge; group: string; top: number; bottom: number };
  const items: Item[] = [];

  for (const edge of edges) {
    const data = edge.data as SideEdgeData | undefined;
    if (!data?.sameTable && !data?.rightSide) continue;

    const sourceNode = byId.get(edge.source);
    const targetNode = byId.get(edge.target);

    const ys = [
      absoluteCenterY(sourceNode, byId),
      absoluteCenterY(targetNode, byId),
    ];

    const group =
      data.edges?.[0]?.source?.systemId ??
      (sourceNode?.data as { systemId?: string } | undefined)?.systemId ??
      "all";

    items.push({
      edge,
      group,
      top: Math.min(...ys),
      bottom: Math.max(...ys),
    });
  }

  const laneByEdge = new Map<string, number>();
  const groups = new Map<string, Item[]>();

  for (const item of items) {
    const list = groups.get(item.group) ?? [];
    list.push(item);
    groups.set(item.group, list);
  }

  for (const list of groups.values()) {
    list.sort((a, b) => a.top - b.top || a.bottom - b.bottom);

    // laneEnds[i] = bottom of the last edge placed in lane i.
    const laneEnds: number[] = [];

    for (const item of list) {
      let lane = laneEnds.findIndex((end) => end + LANE_GAP < item.top);

      if (lane === -1) {
        lane = laneEnds.length;
        laneEnds.push(item.bottom);
      } else {
        laneEnds[lane] = item.bottom;
      }

      laneByEdge.set(item.edge.id, lane);
    }
  }

  return edges.map((edge) => {
    const lane = laneByEdge.get(edge.id);
    if (lane === undefined) return edge;

    return {
      ...edge,
      data: {
        ...(edge.data as object),
        laneOffset: LANE_BASE + lane * LANE_STEP,
      },
    };
  });
}

/**
 * The adapter puts the arrowhead on the source end (`markerStart`). Move it to
 * the target end so arrows follow the direction of the edge.
 */
export function pointArrowAtTarget(edge: Edge): Edge {
  const { markerStart, ...rest } = edge;
  return markerStart ? { ...rest, markerEnd: markerStart } : edge;
}
