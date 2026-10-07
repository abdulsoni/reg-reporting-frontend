import type { Datapoint } from "../types/report";

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