import { LineageEvidence } from "@/modules/lineage/pages/LineageEvidence";

type EvidenceSearchParams = {
  report_name?: string | string[];
  datapoint_id?: string | string[];
};

function firstValue(
  value: string | string[] | undefined
): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<EvidenceSearchParams>;
}) {
  const params = await searchParams;

  return (
    <LineageEvidence
      reportName={firstValue(params.report_name)}
      datapointId={firstValue(params.datapoint_id)}
    />
  );
}
