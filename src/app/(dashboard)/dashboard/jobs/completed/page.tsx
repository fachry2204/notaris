"use client";

import { JobStatsCards } from "@/components/jobs/JobStatsCards";
import { JobTable } from "@/components/jobs/JobTable";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Search, Filter, ChevronDown } from "lucide-react";
import { useState } from "react";
import { FilterCepat, FilterType } from "@/components/dashboard/FilterCepat";

export default function CompletedJobsPage() {
  const [statusFilter, setStatusFilter] = useState<string | null>("SELESAI");
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  });
  const [activeFilter, setActiveFilter] = useState<string | null>("Tahun Ini");

  const handleFilterChange = (start: Date | null, end: Date | null, type: FilterType) => {
    setDateRange({ from: start || undefined, to: end || undefined });
    setActiveFilter(type);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Berkas Selesai</h1>
          <p className="text-slate-500 text-sm">
            Arsip digital seluruh pekerjaan yang telah diselesaikan.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <FilterCepat 
            onFilterChange={handleFilterChange} 
            defaultFilter={activeFilter as FilterType || "Tahun Ini"} 
          />
          <Button variant="outline" className="h-9 px-4 text-xs rounded-xl font-bold border-muted gap-1.5">
            <Download className="h-3.5 w-3.5" />
            Export Excel
          </Button>
        </div>
      </div>

      <JobStatsCards 
        selectedStatus={statusFilter}
        onStatusClick={(status) => setStatusFilter(status)}
      />

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">
            {statusFilter ? `Daftar Berkas ${statusFilter}` : "Semua Daftar Berkas"}
          </h2>
        </div>
        <JobTable statusFilter={statusFilter} dateRange={dateRange} />
      </div>
    </div>
  );
}
