export type LineageStatus = "Verified" | "Discovering" | "Unresolved";

export type LineageRow = {
  hop: string;
  system: string;
  systemLabel: string;
  table: string;
  attribute: string;
  recordKey: string;
  inputValue: string;
  transformation: string;
  valuesUsed: string;
  outputValue: string;
  consumedBy: string;
  status: LineageStatus;
  connected: boolean;
};
