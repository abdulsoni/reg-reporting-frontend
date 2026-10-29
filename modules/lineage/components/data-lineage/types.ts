export type LineageStatus = "Verified" | "Discovering" | "Unresolved";

export type LineageRecord = {
  hop: string;
  system: string;
  attribute: string;
  table: string;
  transformation: string;
  sourcedFrom: string;
  consumedBy: string;
  status: LineageStatus;
  connected: boolean;
};

export type SelectedDatapoint = {
  reportName: string;
  entity: string;
  reportingDate: string;
  attribute: string;
  row: string;
  column: string;
  value: string;
  unit: string;
  page: string;
  section: string;
  reportFile: string;
};
