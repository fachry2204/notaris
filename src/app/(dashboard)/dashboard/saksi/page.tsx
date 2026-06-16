"use client";

import React, { useEffect, useState } from "react";
import { getJobs } from "@/lib/actions/jobs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, FileText, Loader2, Search, Banknote } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { FilterCepat, FilterType } from "@/components/dashboard/FilterCepat";

const statusConfig = {
  PENDING: { label: "Pending", color: "bg-amber-500/10 text-amber-500 border-amber-500/20" },
  PROSES: { label: "Proses", color: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
  REVISI: { label: "Revisi", color: "bg-rose-500/10 text-rose-500 border-rose-500/20" },
  REVISI_PROSES: { label: "Revisi Proses", color: "bg-orange-500/10 text-orange-500 border-orange-500/20" },
  VERIFIKASI: { label: "Menunggu verifikasi", color: "bg-purple-500/10 text-purple-500 border-purple-500/20" },
  SELESAI: { label: "Selesai", color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" },
  CANCELLED: { label: "Dibatalkan", color: "bg-slate-500/10 text-slate-500 border-slate-500/20" },
};

export default function DataSaksiPage() {
  const [saksiData, setSaksiData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const [allJobs, setAllJobs] = useState<any[]>([]);
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  });

  useEffect(() => {
    async function fetchAllJobs() {
      setLoading(true);
      const res = await getJobs();
      if (res.success && res.data) {
        setAllJobs(res.data);
      }
      setLoading(false);
    }
    fetchAllJobs();
  }, []);

  useEffect(() => {
    let jobsToProcess = allJobs;
    
    if (dateRange.from || dateRange.to) {
      jobsToProcess = jobsToProcess.filter((job: any) => {
        const jobDate = new Date(job.createdAt);
        const from = dateRange.from ? new Date(dateRange.from) : new Date(0);
        const to = dateRange.to ? new Date(dateRange.to) : new Date();
        to.setHours(23, 59, 59, 999);
        return jobDate >= from && jobDate <= to;
      });
    }

    // Group jobs by saksi
    const saksiMap: Record<string, any[]> = {};
    
    jobsToProcess.forEach((job: any) => {
      if (job.saksi) {
        // Split by comma in case there are multiple saksi
        const saksiList = job.saksi.split(",").map((s: string) => s.trim()).filter((s: string) => s.length > 0);
        
        saksiList.forEach((sName: string) => {
          if (!saksiMap[sName]) saksiMap[sName] = [];
          saksiMap[sName].push(job);
        });
      }
    });

    // Convert map to array
    const formattedData = Object.keys(saksiMap).map(name => ({
      name,
      jobs: saksiMap[name]
    }));
    
    // Sort by number of jobs handled (descending)
    formattedData.sort((a, b) => b.jobs.length - a.jobs.length);
    
    setSaksiData(formattedData);
  }, [allJobs, dateRange]);

  const handleFilterChange = (start: Date | null, end: Date | null, type: FilterType) => {
    setDateRange({ from: start || undefined, to: end || undefined });
  };

  const filteredData = saksiData.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Data Saksi</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-muted-foreground">Operasional</span>
            <span className="h-1 w-1 rounded-full bg-muted-foreground/40" />
            <span className="text-xs font-medium text-primary">Data Saksi</span>
          </div>
        </div>
        <FilterCepat onFilterChange={handleFilterChange} defaultFilter="Bulan Ini" />
      </div>

      <Card className="border-none bg-card/60 backdrop-blur-xl shadow-2xl shadow-primary/5 rounded-3xl overflow-hidden">
        <CardHeader className="border-b border-border/60 pb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Daftar Saksi & Berkas
              </CardTitle>
              <CardDescription className="mt-1">
                Data saksi yang pernah ditambahkan ke dalam berkas pekerjaan.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Cari nama saksi..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-10 rounded-xl bg-background/50 border-border/50 focus:ring-primary/20"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
              <p className="font-medium text-muted-foreground">Memuat Data Saksi...</p>
            </div>
          ) : filteredData.length === 0 ? (
            <div className="pt-8 text-center py-20">
              <div className="flex flex-col items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">Belum Ada Data Saksi</h3>
                <p className="text-muted-foreground max-w-sm mx-auto">
                  Saksi yang ditambahkan pada berkas akan muncul secara otomatis di sini.
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow className="hover:bg-transparent border-muted/20">
                    <TableHead className="w-[200px] py-4 px-6 font-bold text-foreground">Nama Saksi</TableHead>
                    <TableHead className="font-bold text-foreground">Berkas Yang Ditangani</TableHead>
                    <TableHead className="w-[150px] font-bold text-foreground text-center">Status Berkas</TableHead>
                    <TableHead className="w-[150px] font-bold text-foreground text-center">Status Invoice</TableHead>
                    <TableHead className="w-[120px] font-bold text-foreground text-center">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.map((saksi, idx) => (
                    <React.Fragment key={idx}>
                      {saksi.jobs.map((job: any, jIdx: number) => (
                        <TableRow key={`${idx}-${jIdx}`} className="hover:bg-muted/10 border-border/60 transition-colors">
                          {jIdx === 0 && (
                            <TableCell rowSpan={saksi.jobs.length} className="py-4 px-6 border-r border-border/50 align-top bg-muted/5">
                              <div className="flex flex-col gap-3">
                                <div className="flex items-center gap-3">
                                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold shrink-0 shadow-sm">
                                    {saksi.name.charAt(0).toUpperCase()}
                                  </div>
                                  <span className="font-bold text-foreground">{saksi.name}</span>
                                </div>
                                <Badge variant="outline" className="w-fit font-bold bg-background shadow-sm border-border/50 text-foreground px-2.5 py-0.5 text-[10px]">
                                  {saksi.jobs.length} Berkas
                                </Badge>
                              </div>
                            </TableCell>
                          )}
                          <TableCell className="py-4 px-4">
                            <div className="flex items-start gap-3">
                              <div className="mt-0.5 h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                <FileText className="h-4 w-4" />
                              </div>
                              <div className="flex flex-col">
                                <span className="font-bold text-sm text-foreground">{job.trackingCode}</span>
                                <span className="font-medium text-xs text-muted-foreground line-clamp-1" title={job.title}>
                                  {job.title}
                                </span>
                                {(job.client?.name || job.companyName) && (
                                  <span className="mt-1 font-semibold text-[10px] text-primary/80 bg-primary/10 w-fit px-2 py-0.5 rounded-md">
                                    Client: {job.client?.name || job.companyName}
                                  </span>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge className={cn("rounded-md px-2 py-1 font-bold text-[10px] uppercase tracking-wider shadow-none", statusConfig[job.status as keyof typeof statusConfig]?.color || statusConfig.PENDING.color)}>
                              {statusConfig[job.status as keyof typeof statusConfig]?.label || job.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge className={cn(
                              "rounded-md px-2 py-1 font-bold text-[10px] uppercase tracking-wider shadow-none",
                              job.invoiceStatus === "PAYMENT" ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" :
                              job.invoiceStatus === "DP" ? "bg-blue-500/10 text-blue-500 border-blue-500/20" :
                              "bg-amber-500/10 text-amber-500 border-amber-500/20"
                            )}>
                              {job.invoiceStatus || "PENDING"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center px-4">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => toast.success(`Honor saksi untuk berkas ${job.trackingCode} telah ditandai lunas.`)}
                              className="h-8 text-[11px] font-bold rounded-lg border-emerald-200 text-emerald-600 hover:bg-emerald-500 hover:text-white transition-all shadow-sm w-full"
                            >
                              <Banknote className="h-3.5 w-3.5 mr-1.5" />
                              Bayar
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </React.Fragment>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
