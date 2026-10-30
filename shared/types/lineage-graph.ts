
export type LineageGraphNode = {
  id: string;
  type: "lineage";
  data: {
    system: string;
    table: string;
    attribute: string;
    label: string;
    transformation?: string;
    status?: string;
    final_source?: boolean;
  };
};

export type LineageGraphEdge = {
  id: string;
  source: string;
  target: string;
  type?: string;
  label?: string;
};

export type LineageWarning = {
  relation: string;
  from: string;
  reference: string;
  reason: string;
  message: string;
};

export type LineageGraphResponse = {
  report_name: string;
  source_object: string;
  systems_connected: number;
  systems_of_record_reached: number;
  branch_outstanding: number;
  view: string;
  nodes: LineageGraphNode[];
  edges: LineageGraphEdge[];
  warnings: LineageWarning[];
};
