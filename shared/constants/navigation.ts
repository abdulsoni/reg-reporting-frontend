export const NAV_ITEMS = [
  { label: "Overview", icon: "LayoutDashboard" },
  { label: "Lineage Explorer", icon: "GitBranch", active: true },
  { label: "Reports", icon: "FileBarChart" },
  { label: "Data sources", icon: "Database" },
  { label: "Controls", icon: "ShieldCheck" },
] as const;

export const TOP_NAV_TABS = [
  { label: "Reverse lineage", active: true },
  { label: "Forward impact", active: false },
  { label: "Coverage", active: false },
] as const;