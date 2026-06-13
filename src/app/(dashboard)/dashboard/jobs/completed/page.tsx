"use client";

import { JobStatsCards } from "@/components/jobs/JobStatsCards";
import { JobTable } from "@/components/jobs/JobTable";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Search, Filter, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";

export default function CompletedJobsPage() {
  const [statusFilter, setStatusFilter] = useState<string | null>("SELESAI");

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
          <Button variant="outline" className="h-11 rounded-xl font-bold border-muted gap-2">
            <Download className="h-4 w-4" />
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
        <JobTable statusFilter={statusFilter} />
      </div>
    </div>
  );
}
