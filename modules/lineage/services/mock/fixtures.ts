import {
  parseSourceReference,
  parseSourceReferences,
} from "../../utils/sourceReference";

export { parseSourceReference, parseSourceReferences };
import type {
  HopStatus,
  LineageGraph,
  NextSource,
  SystemDescriptor,
} from "../../types/lineage";

type HopMeta = {
  system: string;
  table: string;
  attribute: string;
  transformation: string | null;
  consumed_by: string | null;
  /** null marks the final source. */
  source_from: string | null;
};

export const SYSTEMS: SystemDescriptor[] = [
  {
    name: "reporting_db",
    db_type: "sqlite",
    database: "reporting_db.sqlite",
    database_file: "reporting_db.sqlite",
  },
  {
    name: "sa_engine",
    db_type: "sqlite",
    database: "sa_engine.sqlite",
    database_file: "sa_engine.sqlite",
  },
  {
    name: "dwh",
    db_type: "sqlite",
    database: "dwh.sqlite",
    database_file: "dwh.sqlite",
  },
  {
    name: "staging",
    db_type: "sqlite",
    database: "staging.sqlite",
    database_file: "staging.sqlite",
  },
  {
    name: "loans_db",
    db_type: "sqlite",
    database: "loans_db.sqlite",
    database_file: "loans_db.sqlite",
  },
  {
    name: "collateral_db",
    db_type: "sqlite",
    database: "collateral_db.sqlite",
    database_file: "collateral_db.sqlite",
  },
];

/**
 * The primary reverse-lineage chain, walked hop by hop. Order matters: each
 * entry's `source_from` is the next entry's system.table.attribute.
 */
export const PRIMARY_CHAIN: HopMeta[] = [
  {
    system: "reporting_db",
    table: "c0700_facts",
    attribute: "value",
    transformation: null,
    consumed_by: "XBRL writer / COREP v1",
    source_from: "sa_engine.calc_sa_exposure.exposure_value",
  },
  {
    system: "sa_engine",
    table: "calc_sa_exposure",
    attribute: "exposure_value",
    transformation: "off_bal_eur + collateral_value",
    consumed_by: "reporting_db.c0700_facts.value",
    source_from: "dwh.mart_sa_exposure.off_bal_eur",
  },
  {
    system: "dwh",
    table: "mart_sa_exposure",
    attribute: "off_bal_eur",
    transformation: "undrawn_eur + drawn_eur",
    consumed_by: "sa_engine.calc_sa_exposure.exposure_value",
    source_from: "dwh.dw_exposure.undrawn_eur",
  },
  {
    system: "dwh",
    table: "dw_exposure",
    attribute: "undrawn_eur",
    transformation: null,
    consumed_by: "dwh.mart_sa_exposure.off_bal_eur",
    source_from: "staging.stg_facilities.drawn_balance",
  },
  {
    system: "staging",
    table: "stg_facilities",
    attribute: "drawn_balance",
    transformation: null,
    consumed_by: "dwh.dw_exposure.undrawn_eur",
    source_from: "loans_db.facility.drawn_balance",
  },
  {
    system: "loans_db",
    table: "facility",
    attribute: "drawn_balance",
    transformation: null,
    consumed_by: "staging.stg_facilities.drawn_balance",
    source_from: null,
  },
];

/**
 * The collateral branch, reachable from sa_engine.calc_sa_exposure. Reachable
 * but not walked by the linear trace, so it only shows up in the graph.
 */
export const BRANCH_CHAIN: HopMeta[] = [
  {
    system: "dwh",
    table: "dw_collateral_alloc",
    attribute: "allocated_value_eur",
    transformation: "market_value * haircut",
    consumed_by: "sa_engine.calc_sa_exposure.exposure_value",
    source_from: "staging.stg_collateral.market_value",
  },
  {
    system: "staging",
    table: "stg_collateral",
    attribute: "market_value",
    transformation: null,
    consumed_by: "dwh.dw_collateral_alloc.allocated_value_eur",
    source_from: "collateral_db.collateral.market_value",
  },
  {
    system: "collateral_db",
    table: "collateral",
    attribute: "market_value",
    transformation: null,
    consumed_by: "staging.stg_collateral.market_value",
    source_from: null,
  },
];

export const ALL_META: HopMeta[] = [...PRIMARY_CHAIN, ...BRANCH_CHAIN];

export const REPORT_NAME = "COREP C07 Report";
export const SOURCE_OBJECT = "reporting_db.c0700_facts.value";

export function findMeta(
  system: string,
  table: string,
  attribute: string
): HopMeta | undefined {
  return ALL_META.find(
    (entry) =>
      entry.system === system &&
      entry.table === table &&
      entry.attribute === attribute
  );
}

/** Spec section 37: "sa_engine.calc_sa_exposure.exposure_value" -> 3 parts. */
export function buildNextSource(meta: HopMeta): NextSource {
  const parsed = parseSourceReference(meta.source_from);

  if (!parsed) {
    return {
      system: null,
      table: null,
      attribute: null,
      connection_required: false,
    };
  }

  return {
    system: parsed.system,
    table: parsed.table,
    attribute: parsed.attribute,
    // Spec section 38: a source inside the same system needs no new connection.
    connection_required: parsed.system !== meta.system,
  };
}

/** A hop is identified while it still has an upstream column to follow. */
export function hopStatusFor(meta: HopMeta): HopStatus {
  return meta.source_from ? "IDENTIFIED" : "SOURCE_REACHED";
}

function nodeId(meta: HopMeta): string {
  return `${meta.system}:${meta.table}:${meta.attribute}`;
}

/** Vertical spacing between graph rows, mirroring the backend layout. */
const NODE_SPACING = 150;

/**
 * Build the full node/edge set: every metadata entry becomes a node, and every
 * `source_from` becomes an edge pointing at its source. Nodes are placed in
 * columns by system so React Flow has a position to lay out from.
 */
export function buildGraph(): LineageGraph {
  const depthOf = (meta: HopMeta): number => {
    const parsed = parseSourceReference(meta.source_from);

    if (!parsed) return 0;

    const upstream = ALL_META.find(
      (entry) =>
        entry.system === parsed.system &&
        entry.table === parsed.table &&
        entry.attribute === parsed.attribute
    );

    return upstream ? depthOf(upstream) + 1 : 1;
  };

  const nodes = ALL_META.map((meta) => ({
    id: nodeId(meta),
    type: "lineage",
    position: { x: 0, y: -depthOf(meta) * NODE_SPACING },
    data: {
      system: meta.system,
      table: meta.table,
      attribute: meta.attribute,
      transformation: meta.transformation,
      status: (meta.source_from ? "IDENTIFIED" : "SOURCE_REACHED") as
        | "IDENTIFIED"
        | "SOURCE_REACHED",
      final_source: !meta.source_from,
      depth: depthOf(meta),
    },
  }));

  const edges = ALL_META.flatMap((meta) => {
    const parsed = parseSourceReference(meta.source_from);

    if (!parsed) return [];

    const target = `${parsed.system}:${parsed.table}:${parsed.attribute}`;

    return [
      {
        id: `${nodeId(meta)}->${target}`,
        source: nodeId(meta),
        target,
        label: "source_from",
        animated: false,
      },
    ];
  });

  return { nodes, edges };
}