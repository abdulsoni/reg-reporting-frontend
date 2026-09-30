import type { Template } from "@/shared/types/report";

export const templates: Template[] = [
  { code: "C 01.00", name: "Own funds", cells: "1 of 1", coverage: 100, detail: "1 cell", status: "complete" },
  { code: "C 02.00", name: "Own funds requirements", cells: "1 of 1", coverage: 100, detail: "1 cell", status: "complete" },
  { code: "C 03.00", name: "Capital ratios", cells: "1 of 1", coverage: 100, detail: "via C 01/C 02", status: "complete" },
  { code: "C 07.00", name: "Credit risk — Standardised Approach", cells: "7 of 7", coverage: 68, detail: "4 complete · 2 partial · 1 gap", status: "partial" },
  { code: "C 08.01", name: "Credit risk — IRB", cells: "0", coverage: 0, detail: "After Day 60", status: "not-scope" },
  { code: "C 34.01", name: "Counterparty credit risk", cells: "0", coverage: 0, detail: "After Day 60", status: "not-scope" },
  { code: "C 16.00", name: "Operational risk", cells: "0", coverage: 0, detail: "After Day 60", status: "not-scope" },
  { code: "C 26.00", name: "Large exposures limits", cells: "0", coverage: 0, detail: "After Day 60", status: "not-scope" },
  { code: "C 47.00", name: "Leverage ratio calculation", cells: "0", coverage: 0, detail: "After Day 60", status: "not-scope" },
];