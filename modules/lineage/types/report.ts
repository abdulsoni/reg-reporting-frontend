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
}

export interface ExtractedPage {
  page: number;
  text: string;
}

/**
 * One cell extracted from the report table. The identifier is
 * `<row_key>.<column>`, which is the value POST /data-lineage/trace expects.
 */
export interface ReportDatapoint {
  datapoint_id: string;
  row_key: string;
  row_key_column: string;
  row: number;
  column: string;
  label: string;
  value: string | number | null;
  page: number | null;
  section: string | null;
  unit: string | null;
  report_name: string;
}

export interface UploadedReportResponse {
  pages: ExtractedPage[];
  tables: ExtractedTable[];
  report?: {
    reportName?: string;
    bankName?: string | null;
    reportDate?: string | null;
    datapoints?: ReportDatapoint[];
  };
  datapointCount?: number;
  datapointError?: string | null;
}

export interface RegulatoryReport {
  id: string;

  fileName: string;

  uploadedAt: string;

  regulatoryReturn: string;

  reportingEntity: string;

  reportingReferenceDate: string;

  submissionVersion: string;

  pages: ExtractedPage[];

  tables: ExtractedTable[];

  /** Cells extracted from the uploaded PDF, when the backend provides them. */
  datapoints?: ReportDatapoint[];
}