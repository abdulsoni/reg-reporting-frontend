export type DataTraceValue = string | number | boolean | null;

export interface DataTraceRequest {
  datapoint_id: string;
  report_name: string;
  record_key?: string | null;
  persist?: boolean;
}

export interface DataTraceHeader {
  report: string;
  bank: string | null;
  date: string | null;
  datapoint: string;
  row: number | null;
  column: string;
  value: DataTraceValue;
  page: number | null;
  unit: string | null;
  section: string | null;
  row_key: string | null;
}

export interface DataTraceHop {
  hop: string;
  system: string;
  table: string;
  attribute: string;
  record_key: string | null;
  inputs: DataTraceValue[];
  input_attributes: string[];
  transformation: string;
  output: DataTraceValue;
  calculated?: DataTraceValue;
  verification?: string;
  status: string;
  reason: string | null;
}

export interface DataTraceNextSource {
  system: string | null;
  system_id?: string | null;
  last_table: string | null;
  last_attribute: string | null;
  join_key: string | null;
  join_value: DataTraceValue;
  connection_status: string;
  message: string | null;
}

export interface DataTraceReconciliation {
  reported_value: DataTraceValue;
  calculated_value: DataTraceValue;
  stored_value?: DataTraceValue;
  variance: number | null;
  tolerance: number;
  result: string;
}

export interface DataTraceResponse {
  report_name: string;
  datapoint_id: string;
  object: string;
  attribute: string;
  aggregation: string;
  record_key_attribute: string | null;
  unit: string | null;
  scale: number;
  record_key: string | null;
  status: string;
  header: DataTraceHeader;
  hops: DataTraceHop[];
  next_source: DataTraceNextSource | null;
  reconciliation: DataTraceReconciliation;
  truncated: boolean;
}
