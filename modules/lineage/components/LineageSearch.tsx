"use client";

import { useMemo, useRef, useState } from "react";
import { Search } from "lucide-react";

import type { LineageData } from "../types/lineage";

import {
  buildAttributeSearchIndex,
  searchAttributes,
  type AttributeSearchEntry,
} from "../lib/reverseLineage";

export default function LineageSearch({
  data,
  onSelect,
}: {
  data: LineageData;
  onSelect: (entry: AttributeSearchEntry) => void;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const index = useMemo(() => buildAttributeSearchIndex(data), [data]);
  const results = useMemo(
    () => searchAttributes(index, query),
    [index, query]
  );

  function choose(entry: AttributeSearchEntry) {
    onSelect(entry);
    setQuery(`${entry.systemLabel}.${entry.tableName}.${entry.attributeName}`);
    setOpen(false);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      setOpen(false);
      return;
    }

    if (!open && (event.key === "ArrowDown" || event.key === "Enter")) {
      if (results.length > 0) setOpen(true);
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((current) =>
        Math.min(current + 1, results.length - 1)
      );
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((current) => Math.max(current - 1, 0));
    } else if (event.key === "Enter") {
      const entry = results[activeIndex];
      if (entry) choose(entry);
    }
  }

  const showDropdown = open && query.trim().length > 0;

  return (
    <div ref={containerRef} className="relative w-full max-w-xl">
      <div className="relative">
        <Search
          size={15}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
        />

        <input
          type="text"
          value={query}
          placeholder="Search system, table, or column… e.g. normalized_usd"
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
            setActiveIndex(0);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => {
            // Let a result click land before the dropdown unmounts.
            window.setTimeout(() => setOpen(false), 120);
          }}
          onKeyDown={handleKeyDown}
          className="w-full rounded-lg border border-line bg-white py-2.5 pl-9 pr-3 text-sm text-ink placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
          aria-label="Search lineage attributes"
        />
      </div>

      {showDropdown && (
        <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-80 overflow-y-auto rounded-lg border border-line bg-white shadow-xl">
          {results.length === 0 ? (
            <p className="px-3 py-3 text-xs text-slate-500">
              No attributes match “{query.trim()}”.
            </p>
          ) : (
            <ul>
              {results.map((entry, index_) => (
                <li key={entry.key}>
                  <button
                    type="button"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => choose(entry)}
                    onMouseEnter={() => setActiveIndex(index_)}
                    className={`flex w-full items-center justify-between gap-3 px-3 py-2 text-left transition ${
                      activeIndex === index_
                        ? "bg-blue-50"
                        : "hover:bg-slate-50"
                    }`}
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-mono text-xs font-bold text-slate-800">
                        {entry.attributeName}
                      </span>
                      <span className="block truncate font-mono text-[10px] text-slate-500">
                        {entry.systemLabel} · {entry.tableName}
                      </span>
                    </span>

                    <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                      {entry.dataType}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
