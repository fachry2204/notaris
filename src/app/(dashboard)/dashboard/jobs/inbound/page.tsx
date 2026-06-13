"use client";

import React, { useState } from "react";
import { JobTable } from "@/components/jobs/JobTable";
import { JobStatsCards } from "@/components/jobs/JobStatsCards";
import { Button } from "@/components/ui/button";
import { Plus, Filter, Calendar as CalendarIcon, ChevronDown, X } from "lucide-react";
import Link from "next/link";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format, startOfWeek, startOfMonth, startOfYear, endOfDay, isWithinInterval } from "date-fns";
import { id } from "date-fns/locale";

export default function InboundJobsPage() {
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  });
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  const setQuickFilter = (type: string) => {
    const now = new Date();
    let from: Date;
    let to = endOfDay(now);

    if (type === "week") {
      from = startOfWeek(now, { weekStartsOn: 1 });
      setActiveFilter("Minggu Ini");
    } else if (type === "month") {
      from = startOfMonth(now);
      setActiveFilter("Bulan Ini");
    } else if (type === "year") {
      from = startOfYear(now);
      setActiveFilter("Tahun Ini");
    } else {
      return;
    }

    setDateRange({ from, to });
  };

  const clearFilter = () => {
    setDateRange({ from: undefined, to: undefined });
    setActiveFilter(null);
    setStatusFilter(null);
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
          <Popover>
            <PopoverTrigger className={cn(
              "h-11 px-5 rounded-xl font-bold border border-muted gap-2 transition-all flex items-center justify-center bg-background hover:bg-muted active:translate-y-px outline-none",
              activeFilter && "border-pink-500 bg-pink-50/50 text-pink-600"
            )}>
              <Filter className="h-4 w-4" />
              {activeFilter || "Filter Tanggal"}
              <ChevronDown className="h-4 w-4 opacity-50" />
            </PopoverTrigger>
            <PopoverContent className="w-80 p-4 rounded-2xl shadow-2xl border-none" align="end">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm">Filter Cepat</h4>
                  {activeFilter && (
                    <Button variant="ghost" size="sm" onClick={clearFilter} className="h-7 text-[10px] font-bold text-rose-500 hover:text-rose-600 hover:bg-rose-50 uppercase tracking-wider">
                      Reset
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-1 gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setQuickFilter("week")}
                    className={cn("justify-start h-10 rounded-xl font-semibold transition-all", activeFilter === "Minggu Ini" && "bg-pink-500 text-white border-none")}
                  >
                    Minggu Ini
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setQuickFilter("month")}
                    className={cn("justify-start h-10 rounded-xl font-semibold transition-all", activeFilter === "Bulan Ini" && "bg-pink-500 text-white border-none")}
                  >
                    Bulan Ini
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setQuickFilter("year")}
                    className={cn("justify-start h-10 rounded-xl font-semibold transition-all", activeFilter === "Tahun Ini" && "bg-pink-500 text-white border-none")}
                  >
                    Tahun Ini
                  </Button>
                </div>

                <div className="pt-2 border-t border-muted/50 space-y-3">
                  <h4 className="font-bold text-sm">Custom Range</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase ml-1">Dari</p>
                      <input 
                        type="date" 
                        className="w-full h-9 rounded-lg border border-muted bg-muted/20 px-2 text-xs font-bold"
                        value={dateRange.from ? format(dateRange.from, 'yyyy-MM-dd') : ''}
                        onChange={(e) => {
                          const date = e.target.value ? new Date(e.target.value) : undefined;
                          setDateRange(prev => ({ ...prev, from: date }));
                          setActiveFilter("Custom Range");
                        }}
                      />
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase ml-1">Sampai</p>
                      <input 
                        type="date" 
                        className="w-full h-9 rounded-lg border border-muted bg-muted/20 px-2 text-xs font-bold"
                        value={dateRange.to ? format(dateRange.to, 'yyyy-MM-dd') : ''}
                        onChange={(e) => {
                          const date = e.target.value ? new Date(e.target.value) : undefined;
                          setDateRange(prev => ({ ...prev, to: date }));
                          setActiveFilter("Custom Range");
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          <Link href="/dashboard/jobs/new">
            <Button className="h-11 px-6 rounded-xl font-bold bg-pink-500 hover:bg-pink-600 shadow-lg shadow-pink-500/20 text-white gap-2 transition-all active:scale-95">
              <Plus className="h-5 w-5" />
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
