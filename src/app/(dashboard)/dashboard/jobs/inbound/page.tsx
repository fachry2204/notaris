"use client";

import React, { useState } from "react";
import { JobTable } from "@/components/jobs/JobTable";
import { JobStatsCards } from "@/components/jobs/JobStatsCards";
import { Button } from "@/components/ui/button";
import { Plus, Filter, Calendar as CalendarIcon, ChevronDown, X } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { FilterCepat, FilterType } from "@/components/dashboard/FilterCepat";
import { format, startOfWeek, startOfMonth, startOfYear, endOfDay, isWithinInterval } from "date-fns";
import { id } from "date-fns/locale";

export default function InboundJobsPage() {
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  });
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  const handleFilterChange = (start: Date | null, end: Date | null, type: FilterType) => {
    setDateRange({ from: start || undefined, to: end || undefined });
    setActiveFilter(type);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-0.5">
          <h1 className="text-2xl font-bold tracking-tight">Berkas Masuk</h1>
          <p className="text-muted-foreground text-sm">
            Daftar seluruh berkas yang baru masuk dan butuh penanganan awal.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <FilterCepat 
            onFilterChange={handleFilterChange} 
            defaultFilter={activeFilter as FilterType || "Tahun Ini"} 
          />

          <Link href="/dashboard/jobs/new">
            <Button className="h-9 px-4 text-xs rounded-xl font-bold bg-pink-500 hover:bg-pink-600 shadow-md shadow-pink-500/20 text-white gap-1.5 transition-all active:scale-95">
              <Plus className="h-3.5 w-3.5" />
              Berkas Baru
            </Button>
          </Link>
        </div>
      </div>

      <JobStatsCards 
        selectedStatus={statusFilter} 
        onStatusClick={(status) => setStatusFilter(status === statusFilter ? null : status)} 
      />
      
      <JobTable 
        dateRange={dateRange} 
        statusFilter={statusFilter}
      />
    </div>
  );
}
