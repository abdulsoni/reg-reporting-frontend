export interface Report {
  id: string;
  report_name: string;
  report_family: string;
  reporting_entity: string;
  reporting_period: string;
  submission_version: number;
  currency?: string;
  status?: string;
  processing_status: string;
  original_filename: string;
  uploaded_at: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface ReportFilters {
  search?: string;
  reportFamily?: string;
  entity?: string;
  status?: string;
}

export interface UploadProgress {
  step: "uploading" | "processing" | "completed" | "error";
  message: string;
  progress: number;
}

export interface ExtractedTable {
  page: number;
  rows: string[][];
  /** Optional column labels the API extracted; when absent rows[0] is the header. */
  headers?: string[] | null;
  /** Optional structured rows the API extracted alongside the raw grid. */
  records?: unknown;
}

export interface ExtractedPage {
  page: number;
  text: string;
}

/** The report metadata the API persisted alongside the parsed document. */
export interface ReportSummary {
  id: string;
  file_name: string;
  report_type: string | null;
  reporting_entity: string | null;
  reporting_date: string | null;
  submission_version: string | null;
  page_count: number;
  table_count: number;
  datapoint_count: number;
  created_at: string;
}

/** One reported figure as the API extracted and stored it. */
export interface ReportDatapoint {
  id: string;
  report_id: string;
  report_code: string | null;
  report_title: string | null;
  row_code: string | null;
  column_code: string | null;
  attribute_name: string | null;
  value: number | null;
  unit: string | null;
  currency: string | null;
}

/** The shape POST /documents/upload-pdf actually returns. */
export interface UploadedReportResponse {
  report_id: string;
  report: ReportSummary;
  document: {
    file_name: string;
    page_count: number;
    table_count: number;
    pages: ExtractedPage[];
    tables: ExtractedTable[];
  };
  datapoints: ReportDatapoint[];
}

/**
 * A selectable datapoint in the UI. Carries the API's `dp-...` id, which is
 * what POST /lineage/trace identifies the figure by.
 */
export interface Datapoint {
  id: string;
  reportCode: string | null;
  rowCode: string;
  columnCode: string;
  attribute: string;
  value: string;
  numericValue: number | null;
  unit: string | null;
}

export interface RegulatoryReport {
  /** The backend report id, used by every lineage call. */
  id: string;

  fileName: string;

  uploadedAt: string;

  regulatoryReturn: string;

  reportingEntity: string;

  reportingReferenceDate: string;

  submissionVersion: string;

  pages: ExtractedPage[];

  tables: ExtractedTable[];

  datapoints: Datapoint[];
}