"use client";

import { Database, FilePlus2, GitBranch, ChevronDown, UserRound } from "lucide-react";

type Props = {
  onUploadPdf?: () => void;
  onSelectDatasource?: () => void;
};

export default function DataLineageHeader({ onUploadPdf, onSelectDatasource }: Props) {
  return (
    <header className="flex min-h-[58px] items-center justify-between gap-4 bg-[#123866] px-5 text-white shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10">
          <GitBranch size={21} />
        </div>
        <span className="text-base font-semibold tracking-tight">Lineage Tracer</span>
        <span className="rounded-md bg-blue-500/40 px-2 py-1 text-xs font-semibold">IPDC</span>
      </div>

      <nav className="flex items-center gap-5 text-sm">
        <button onClick={onUploadPdf} className="hidden items-center gap-2 text-blue-100 transition hover:text-white sm:flex">
          <FilePlus2 size={17} />
          Upload PDF
          <span className="text-lg leading-none text-sky-300">+</span>
        </button>
        <button onClick={onSelectDatasource} className="hidden items-center gap-2 text-blue-100 transition hover:text-white md:flex">
          <Database size={17} />
          Select Datasource
          <span className="text-lg leading-none text-sky-300">+</span>
        </button>
        <button className="flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2 hover:bg-white/15" aria-label="User menu">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-xs font-bold text-[#123866]">AT</span>
          <span className="hidden sm:inline">Abdul Tipu Sultan</span>
          <ChevronDown size={15} />
        </button>
      </nav>
    </header>
  );
}
