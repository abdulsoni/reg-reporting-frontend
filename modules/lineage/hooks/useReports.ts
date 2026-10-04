"use client";

import { useCallback, useEffect, useState } from "react";
import { getReports } from "../api/reportApi";
import type { PaginatedResponse, Report, ReportFilters } from "../types/report";

export function useReports(initialFilters?: ReportFilters) {
  const [reports, setReports] = useState<Report[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ReportFilters>(initialFilters ?? {});

  const loadReports = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params: Parameters<typeof getReports>[0] = {
        page,
        pageSize,
      };

      if (filters.search) params.search = filters.search;
      if (filters.reportFamily) params.reportFamily = filters.reportFamily;
      if (filters.entity) params.entity = filters.entity;
      if (filters.status) params.status = filters.status;

      const response: PaginatedResponse<Report> = await getReports(params);

      setReports(response.items);
      setTotal(response.total);
      setTotalPages(response.total_pages);
    } catch (err) {
      setError("Unable to load reports");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, filters]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const updateFilters = useCallback((newFilters: ReportFilters) => {
    setFilters(newFilters);
    setPage(1);
  }, []);

  return {
    reports,
    total,
    page,
    pageSize,
    totalPages,
    loading,
    error,
    filters,
    setPage,
    updateFilters,
    reload: loadReports,
  };
}