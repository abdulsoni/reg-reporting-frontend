import type { Datapoint, ExtractedTable } from "../types/report";

/**
 * Parse a regulatory figure for display and comparison. Regulatory tables carry
 * currency symbols, thousands separators, parentheses for negatives and stray
 * dashes, all of which must be stripped before the value is usable.
 */
export function parseNumericValue(raw: string): number | null {
  const cleaned = raw
    .replace(/[\s\u00a0]/g, "")
    .replace(/[^0-9.,()-]/g, "");

  if (!cleaned) return null;

  const isNegative =
    cleaned.startsWith("-") ||
    (cleaned.startsWith("(") && cleaned.endsWith(")"));

  const unsigned = cleaned.replace(/[()-]/g, "");

  // A lone "-" or "()" denotes nil / not applicable, not zero.
  if (!unsigned) return null;

  // Determine which separator is decimal by taking the rightmost occurrence.
  const lastComma = unsigned.lastIndexOf(",");
  const lastDot = unsigned.lastIndexOf(".");

  let normalized: string;

  if (lastComma > -1 && lastDot > -1) {
    normalized =
      lastComma > lastDot
        ? unsigned.replace(/\./g, "").replace(",", ".")
        : unsigned.replace(/,/g, "");
  } else if (lastComma > -1) {
    // A lone comma is decimal only when it splits off 1-2 trailing digits.
    const tail = unsigned.length - lastComma - 1;

    normalized = tail > 0 && tail <= 2
      ? unsigned.replace(",", ".")
      : unsigned.replace(/,/g, "");
  } else {
    normalized = unsigned;
  }

  const parsed = Number(normalized);

  if (!Number.isFinite(parsed)) return null;

  return isNegative ? -parsed : parsed;
}

export function isSameDatapoint(
  a: Datapoint | null,
  b: Datapoint | null
): boolean {
  if (!a || !b) return false;

  return a.id === b.id;
}

export interface TableLayout {
  headers: string[];
  bodyRows: string[][];
}

/*
 * An extracted table only carries a cell grid. When the API did not label the
 * columns, the first row doubles as the header, so the body starts one row down.
 */
export function resolveTableLayout(table: ExtractedTable): TableLayout {
  const rows = table.rows ?? [];

  const hasLabels = Array.isArray(table.headers) && table.headers.length > 0;

  const headers = hasLabels ? (table.headers as string[]) : (rows[0] ?? []);

  const bodyRows = (hasLabels ? rows : rows.slice(1)).filter((row) =>
    row.some((cell) => cell.trim() !== "")
  );

  return { headers, bodyRows };
}

/** Lowercase and collapse anything that is not alphanumeric to underscores. */
function normalizeToken(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

/*
 * The displayed grid is the raw extracted table, but selection still has to
 * resolve to a stored datapoint. Match a row's cells and the column labels
 * against each datapoint's coordinates and keep the strongest candidate.
 */
export function findDatapointForRow(
  row: string[],
  headers: string[],
  datapoints: Datapoint[]
): Datapoint | null {
  const cells = row.map((cell) => cell.trim()).filter(Boolean);
  const headerTokens = new Set(headers.map(normalizeToken));

  let best: Datapoint | null = null;
  let bestScore = 0;

  for (const datapoint of datapoints) {
    let score = 0;

    if (datapoint.rowCode) {
      if (!cells.includes(datapoint.rowCode)) continue;

      score += 3;
    }

    if (datapoint.columnCode) {
      const normalized = normalizeToken(datapoint.columnCode);

      if (cells.includes(datapoint.columnCode) || headerTokens.has(normalized)) {
        score += 2;
      }
    }

    if (datapoint.attribute) {
      const normalized = normalizeToken(datapoint.attribute);

      if (cells.includes(datapoint.attribute) || headerTokens.has(normalized)) {
        score += 2;
      }
    }

    if (score > bestScore) {
      best = datapoint;
      bestScore = score;
    }
  }

  return best;
}