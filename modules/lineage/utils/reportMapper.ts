import {
  RegulatoryReport,
  UploadedReportResponse,
} from "../types/report";


function extractReportName(
  pages: UploadedReportResponse["pages"]
): string {
  if (!pages?.length) {
    return "Regulatory Report";
  }

  const text =
    pages[0]?.text || "";

  const firstLine =
    text
      .split("\n")
      .map((line) => line.trim())
      .find(Boolean);

  return firstLine || "Regulatory Report";
}


function extractReportingEntity(
  pages: UploadedReportResponse["pages"]
): string {
  if (!pages?.length) {
    return "[LEGAL ENTITY]";
  }

  const text =
    pages[0]?.text || "";

  const match =
    text.match(
      /(?:^|\n)\s*(?:J\s*P\s*Morgan\s*Bank|[^\n]+Bank)\s*(?:\n|$)/i
    );

  if (match?.[0]) {
    return match[0].trim();
  }

  const lines =
    text
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

  if (lines.length >= 2) {
    return lines[1];
  }

  return "[LEGAL ENTITY]";
}


function extractReferenceDate(
  pages: UploadedReportResponse["pages"]
): string {
  if (!pages?.length) {
    return "";
  }

  const text =
    pages[0]?.text || "";

  const match =
    text.match(
      /Date\s*:\s*([^\n]+)/i
    );

  return (
    match?.[1]?.trim() || ""
  );
}


export function mapApiResponseToReport(
  file: File,
  response: UploadedReportResponse
): RegulatoryReport {

  return {
    id:
      `report-${Date.now()}-${Math.random()
        .toString(36)
        .substring(2, 9)}`,

    fileName:
      file.name,

    uploadedAt:
      new Date().toISOString(),

    regulatoryReturn:
      extractReportName(
        response.pages
      ),

    reportingEntity:
      extractReportingEntity(
        response.pages
      ),

    reportingReferenceDate:
      extractReferenceDate(
        response.pages
      ),

    submissionVersion:
      "v1",

    pages:
      response.pages || [],

    tables:
      response.tables || [],
  };
}