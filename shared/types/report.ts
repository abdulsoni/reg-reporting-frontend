export type ReportStatus = "complete" | "partial" | "gap" | "not-scope";

export type Template = {
  code: string;
  name: string;
  cells: string;
  coverage: number;
  detail: string;
  status: ReportStatus;
};
