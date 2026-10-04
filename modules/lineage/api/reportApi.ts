const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

export async function getReports(params?: {
  page?: number;
  pageSize?: number;
  search?: string;
  reportFamily?: string;
  entity?: string;
  status?: string;
}) {
  const query = new URLSearchParams();
  query.set("page", String(params?.page ?? 1));
  query.set("page_size", String(params?.pageSize ?? 20));

  if (params?.search) query.set("search", params.search);
  if (params?.reportFamily) query.set("report_family", params.reportFamily);
  if (params?.entity) query.set("entity", params.entity);
  if (params?.status) query.set("status", params.status);

  const response = await fetch(
    `${API_URL}/api/v1/reports?${query.toString()}`,
    { cache: "no-store" }
  );

  if (!response.ok) {
    throw new Error("Failed to load reports");
  }

  return response.json();
}

export async function getReportById(id: string) {
  const response = await fetch(
    `${API_URL}/api/v1/reports/${id}`,
    { cache: "no-store" }
  );

  if (!response.ok) {
    throw new Error("Failed to load report");
  }

  return response.json();
}

export async function uploadReport(file: File) {
  console.log('abc')
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_URL}/documents/upload-pdf`, {
    method: "POST",
    body: formData,
  });
  console.log('response',response)
  if (response.status !== 200) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || "Upload failed");
  }

  return response.json();
}

export async function connectDatabase(params: {
  db_type: string;
  // host: string;
  // port: number;
  database: string;
  // username: string;
  // password: string;
  report_name:string | undefined;
}) {
  const response = await fetch(`${API_URL}/lineage/connect`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || "Failed to connect to database");
  }

  // API returns 200 on success
  return response.json().catch(() => null);
}