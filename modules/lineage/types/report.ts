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

export interface UploadedReportResponse {
  pages: ExtractedPage[];
  tables: ExtractedTable[];
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
}