import {
  Datapoint,
  RegulatoryReport,
  ReportDatapoint,
  UploadedReportResponse,
} from "../types/report";
import { parseNumericValue } from "./datapoints";

function firstPageText(response: UploadedReportResponse): string {
  return response.document?.pages?.[0]?.text ?? "";
}

/**
 * The report title is the first non-empty line of the cover page. The API only
 * returns a code, so the title has to come from the text.
 */
function extractReportName(response: UploadedReportResponse): string {
  const firstLine = firstPageText(response)
    .split("\n")
    .map((line) => line.trim())
    .find(Boolean);

  return firstLine || response.report?.report_type || "Regulatory Report";
}

/**
 * The reporting entity sits under the title on the cover page. Falls back to
 * whatever the API extracted, then to the second line of the page.
 */
function extractReportingEntity(
  response: UploadedReportResponse
): string {
  const match = firstPageText(response).match(
    /(?:^|\n)\s*(?:J\s*P\s*Morgan\s*Bank|[^\n]+Bank)\s*(?:\n|$)/i
  );

  if (match?.[0]) {
    return match[0].trim();
  }

  if (response.report?.reporting_entity) {
    return response.report.reporting_entity;
  }

  const secondLine = firstPageText(response)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)[1];

  return secondLine || "[LEGAL ENTITY]";
}

/**
 * The reference date is the only date on the cover page. The API normalises it
 * to ISO when the report labels it "Reporting date:", so prefer its value and
 * fall back to reading the page.
 */
function extractReferenceDate(response: UploadedReportResponse): string {
  const match = firstPageText(response).match(/Date\s*:\s*([^\n]+)/i);

  if (match?.[1]) {
    return match[1].trim();
  }

  return response.report?.reporting_date ?? "";
}

/**
 * The API only reports a submission version when the return labels one, which
 * real regulatory PDFs rarely do. Rather than invent a version, say so.
 */
function extractSubmissionVersion(
  response: UploadedReportResponse
): string {
  return response.report?.submission_version || "Not stated";
}

/**
 * Map one stored datapoint onto the shape the UI selects and edits. The API's
 * value is already a float; the raw string is kept so a correction stays
 * editable in the same way a parsed cell was.
 */
export function mapApiDatapoint(datapoint: ReportDatapoint): Datapoint {
  const value = datapoint.value === null ? "" : String(datapoint.value);

  return {
    id: datapoint.id,
    reportCode: datapoint.report_code,
    rowCode: datapoint.row_code ?? "",
    columnCode: datapoint.column_code ?? "",
    attribute: datapoint.attribute_name ?? "",
    value,
    numericValue: datapoint.value ?? parseNumericValue(value),
    unit: datapoint.unit,
  };
}

export function mapApiResponseToReport(
  file: File,
  response: UploadedReportResponse
): RegulatoryReport {
  return {
    /*
     * The backend id is what POST /lineage/trace resolves the datapoint
     * against, so it has to survive the round trip through localStorage.
     */
    id: response.report_id,

    fileName: response.report?.file_name || file.name,

    uploadedAt: response.report?.created_at || new Date().toISOString(),

    regulatoryReturn: extractReportName(response),

    reportingEntity: extractReportingEntity(response),

    reportingReferenceDate: extractReferenceDate(response),

    submissionVersion: extractSubmissionVersion(response),

    pages: response.document?.pages ?? [],

    tables: response.document?.tables ?? [],

    datapoints: (response.datapoints ?? []).map(mapApiDatapoint),
  };
}