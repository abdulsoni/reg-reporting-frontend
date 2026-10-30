"use client";

import { ReportProvider } from "@/modules/lineage/context/ReportContext";

export default function LineageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ReportProvider>
      {children}
    </ReportProvider>
  );
}