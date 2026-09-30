import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lineage Explorer | Regulatory Reporting",
  description: "Regulatory reporting data lineage explorer"
};

export default function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}