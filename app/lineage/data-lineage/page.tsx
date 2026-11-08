import DataLineagePage from "@/modules/lineage/pages/DataLineage";

type DataLineageSearchParams = {
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
  searchParams: Promise<DataLineageSearchParams>;
}) {
  const params = await searchParams;

  return (
    <DataLineagePage
      reportName={firstValue(params.report_name)}
      datapointId={firstValue(params.datapoint_id)}
    />
  );
}
