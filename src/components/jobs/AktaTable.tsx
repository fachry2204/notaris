"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { 
  Clock, 
  User, 
  FileText,
  Search,
  Filter
} from "lucide-react";
import { getJobs } from "@/lib/actions/jobs";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";

export function AktaTable() {
  const router = useRouter();
  const [allJobs, setAllJobs] = useState<any[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  });
  const [selectedStaff, setSelectedStaff] = useState<string>("ALL");
  const [searchSaksi, setSearchSaksi] = useState<string>("");

  const fetchJobs = async () => {
    setLoading(true);
    const result = await getJobs();
    if (result.success) {
      setAllJobs(result.data || []);
      setFilteredJobs(result.data || []);
    } else {
      toast.error(result.error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const uniqueStaff = useMemo(() => {
    const staffSet = new Set<string>();
    allJobs.forEach(job => {
      if (job.staff?.fullName) {
        staffSet.add(job.staff.fullName);
      }
    });
    return Array.from(staffSet).sort();
  }, [allJobs]);

  useEffect(() => {
    let filtered = allJobs;

    // Filter by Date Range
    if (dateRange.from || dateRange.to) {
      filtered = filtered.filter((job: any) => {
        const jobDate = new Date(job.createdAt);
        const from = dateRange.from ? new Date(dateRange.from) : new Date(0);
        const to = dateRange.to ? new Date(dateRange.to) : new Date();
        to.setHours(23, 59, 59, 999);
        return jobDate >= from && jobDate <= to;
      });
    }

    // Filter by Staff
    if (selectedStaff && selectedStaff !== "ALL") {
      filtered = filtered.filter((job: any) => job.staff?.fullName === selectedStaff);
    }

    // Filter by Saksi
    if (searchSaksi) {
      const lowerSaksi = searchSaksi.toLowerCase();
      filtered = filtered.filter((job: any) => 
        job.saksi && job.saksi.toLowerCase().includes(lowerSaksi)
      );
    }

    setFilteredJobs(filtered);
  }, [dateRange, selectedStaff, searchSaksi, allJobs]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-pink-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters Section */}
      <div className="flex flex-col md:flex-row gap-4 items-end bg-card p-4 rounded-[2rem] shadow-sm border border-muted/20">
        
        {/* Date Range Filter */}
        <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-muted-foreground ml-1">Dari Tanggal</label>
            <Input
              type="date"
              className="rounded-xl w-full md:w-[150px]"
              value={dateRange.from ? format(dateRange.from, "yyyy-MM-dd") : ""}
              onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value ? new Date(e.target.value) : undefined }))}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-muted-foreground ml-1">Sampai Tanggal</label>
            <Input
              type="date"
              className="rounded-xl w-full md:w-[150px]"
              value={dateRange.to ? format(dateRange.to, "yyyy-MM-dd") : ""}
              onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value ? new Date(e.target.value) : undefined }))}
            />
          </div>
        </div>

        {/* Staff Filter */}
        <div className="flex flex-col gap-1.5 w-full md:w-[200px]">
          <label className="text-xs font-semibold text-muted-foreground ml-1">Filter Pegawai</label>
          <select 
            value={selectedStaff} 
            onChange={(e) => setSelectedStaff(e.target.value)}
            className="flex h-10 w-full items-center justify-between rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-hidden focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="ALL">Semua Pegawai</option>
            {uniqueStaff.map(staff => (
              <option key={staff} value={staff}>{staff}</option>
            ))}
          </select>
        </div>

        {/* Saksi Search */}
        <div className="flex flex-col gap-1.5 w-full md:w-[250px]">
          <label className="text-xs font-semibold text-muted-foreground ml-1">Cari Saksi</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Ketik nama saksi..." 
              value={searchSaksi}
              onChange={(e) => setSearchSaksi(e.target.value)}
              className="pl-9 rounded-xl h-10"
            />
          </div>
        </div>

      </div>

      {/* Table Section */}
      <div className="rounded-[2rem] border border-muted/20 shadow-sm bg-card overflow-hidden">
        {filteredJobs.length === 0 ? (
           <div className="text-center py-20">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
            <h3 className="text-xl font-bold">Data Tidak Ditemukan</h3>
            <p className="text-muted-foreground text-sm">Coba sesuaikan filter pencarian Anda.</p>
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="hover:bg-transparent border-muted/20">
                <TableHead className="w-[80px] py-4 px-6 font-bold text-foreground">No.</TableHead>
                <TableHead className="font-bold text-foreground">Tanggal Berkas</TableHead>
                <TableHead className="font-bold text-foreground">Nama Client</TableHead>
                <TableHead className="font-bold text-foreground">Jenis Pekerjaan</TableHead>
                <TableHead className="font-bold text-foreground">Nama PIC Pegawai</TableHead>
                <TableHead className="font-bold text-foreground">Nama Saksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredJobs.map((job: any, index: number) => (
                <TableRow key={job.id} className="hover:bg-muted/10 border-muted/10 transition-colors">
                  <TableCell className="py-4 px-6 font-medium">
                    {index + 1}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-0.5">
                      <span className="font-medium">
                        {format(new Date(job.createdAt), 'dd MMMM yyyy', { locale: idLocale })}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(job.createdAt), 'HH:mm', { locale: idLocale })}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                        <User className="h-3.5 w-3.5" />
                      </div>
                      <span className="font-bold text-foreground">{job.client?.name || "-"}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-0.5">
                      <span className="font-medium text-foreground">{job.title}</span>
                      <span className="text-xs text-muted-foreground">{job.category}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium text-foreground">
                      {job.staff?.fullName || "-"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-muted-foreground">
                      {job.saksi || "-"}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
