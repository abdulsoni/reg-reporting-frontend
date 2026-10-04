export interface TraceRow {
  system: string;
  attribute_held_in: string;
  sourced_from: string;
  consumed_by: string;
  status: "Identified" | "Connection required" | string;
}

export interface NextSource {
  system: string | null;
  object_name: string | null;
  connection_required: boolean;
}

export interface ReverseLineageResponse {
  report_name: string;
  source_object: string;
  systems_connected: number;
  systems_of_record_reached: number;
  branch_outstanding: number;
  rows: TraceRow[];
  next_source: NextSource;
}