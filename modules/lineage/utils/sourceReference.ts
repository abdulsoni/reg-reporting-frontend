/** A parsed `system.table.attribute` reference published by a lineage row. */
export type SourceReference = {
  system: string;
  table: string;
  attribute: string;
};

/**
 * Split a `system.table.attribute` reference into its parts. Returns null for
 * anything that is not exactly three dot-separated parts, so a malformed row is
 * reported rather than followed.
 */
export function parseSourceReference(
  source: string | null | undefined
): SourceReference | null {
  const parts = (source ?? "").split(".").map((part) => part.trim());

  if (parts.length !== 3 || parts.some((part) => !part)) {
    return null;
  }

  return { system: parts[0], table: parts[1], attribute: parts[2] };
}

/**
 * A lineage row may name several upstream columns, comma separated. Each has to
 * be followed, so they are returned as a list.
 */
export function parseSourceReferences(
  source: string | null | undefined
): SourceReference[] {
  return (source ?? "")
    .split(",")
    .map((part) => parseSourceReference(part))
    .filter((reference): reference is SourceReference => reference !== null);
}