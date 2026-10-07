"use client";

import { LineageProvider } from "@/modules/lineage/context/LineageContext";
import { ReportProvider } from "@/modules/lineage/context/ReportContext";

/**
 * Providers live at the layout level so the selected report, datapoint and
 * in-flight trace survive navigation between the three lineage steps. Placing
 * them inside a page would reset state on every step change.
 */
export default function LineageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ReportProvider>
      <LineageProvider>{children}</LineageProvider>
    </ReportProvider>
  );
}