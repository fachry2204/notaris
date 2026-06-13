"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { 
  Clock, 
  User, 
  FileText,
  MoreHorizontal,
  Trash2
} from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getJobStats } from "@/lib/actions/jobs";
import { deleteJob } from "@/lib/actions/jobs";

import { getJobs } from "@/lib/actions/jobs";
import { toast } from "sonner";

const statusConfig = {
  PENDING: { label: "Pending", color: "bg-amber-500/10 text-amber-500 border-amber-500/20" },
  PROSES: { label: "Proses", color: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
  REVISI: { label: "Revisi", color: "bg-rose-500/10 text-rose-500 border-rose-500/20" },
  REVISI_PROSES: { label: "Revisi Proses", color: "bg-orange-500/10 text-orange-500 border-orange-500/20" },
  VERIFIKASI: { label: "Menunggu verifikasi", color: "bg-purple-500/10 text-purple-500 border-purple-500/20" },
  SELESAI: { label: "Selesai", color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" },
  CANCELLED: { label: "Dibatalkan", color: "bg-slate-500/10 text-slate-500 border-slate-500/20" },
};

export function JobTable({ 
  dateRange, 
  statusFilter 
}: { 
  dateRange?: { from: Date | undefined; to: Date | undefined },
  statusFilter?: string | null
}) {
  const { data: session } = useSession();
  const router = useRouter();
  const [allJobs, setAllJobs] = useState<any[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    if (!dateRange || (!dateRange.from && !dateRange.to)) {
      setFilteredJobs(allJobs);
      return;
    }

    const filtered = allJobs.filter((job: any) => {
      // Date filter
      const jobDate = new Date(job.createdAt);
      const from = dateRange?.from ? new Date(dateRange.from) : new Date(0);
      const to = dateRange?.to ? new Date(dateRange.to) : new Date();
      to.setHours(23, 59, 59, 999);

      const matchesDate = jobDate >= from && jobDate <= to;
      
      // Status filter
      let matchesStatus = !statusFilter || job.status === statusFilter;
      
      // Special case for REVISI to include REVISI_PROSES
      if (statusFilter === "REVISI") {
        matchesStatus = job.status === "REVISI" || job.status === "REVISI_PROSES";
      }

      return matchesDate && matchesStatus;
    });

    setFilteredJobs(filtered);
  }, [dateRange, allJobs]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-pink-500 border-t-transparent"></div>
      </div>
    );
  }

  if (filteredJobs.length === 0) {
    return (
      <div className="text-center py-20 bg-card rounded-[2rem] border-2 border-dashed border-muted">
        <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
        <h3 className="text-xl font-bold">Belum ada berkas masuk</h3>
        <p className="text-muted-foreground">Silahkan tambah berkas baru untuk memulai.</p>
      </div>
    );
  }

  return (
    <div className="rounded-[2rem] border-none shadow-sm bg-card overflow-hidden">
      <Table>
        <TableHeader className="bg-muted/30">
          <TableRow className="hover:bg-transparent border-muted/20">
            <TableHead className="w-[150px] py-6 px-6 font-bold text-foreground">No. Berkas</TableHead>
            <TableHead className="font-bold text-foreground">Nama Client</TableHead>
            <TableHead className="font-bold text-foreground">Jenis Pekerjaan</TableHead>
            <TableHead className="font-bold text-foreground">Deadline</TableHead>
            <TableHead className="font-bold text-foreground text-center">Status Berkas</TableHead>
            <TableHead className="font-bold text-foreground text-center">Invoice</TableHead>
            <TableHead className="font-bold text-foreground">Progress</TableHead>
            <TableHead className="w-[80px] text-center"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredJobs.map((job: any) => (
            <TableRow key={job.id} className="hover:bg-muted/10 border-muted/10 group transition-colors">
              <TableCell className="py-5 px-6">
                <div className="flex flex-col gap-1">
                  <span className="font-mono font-bold text-pink-600 text-xs">{job.trackingCode}</span>
                  <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                    {new Date(job.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-pink-500/5 flex items-center justify-center text-pink-500 group-hover:bg-pink-500 group-hover:text-white transition-all duration-300">
                    <User className="h-4 w-4" />
                  </div>
                  <span className="font-bold text-foreground">{job.client?.name || "No Client"}</span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-semibold text-foreground">{job.title}</span>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{job.type}</span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className={cn(
                    job.deadline && new Date(job.deadline) < new Date() ? "text-rose-500 font-bold" : "text-foreground"
                  )}>
                    {job.deadline ? new Date(job.deadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : "-"}
                  </span>
                </div>
              </TableCell>
              <TableCell className="text-center">
                <Badge className={cn("rounded-full px-3 py-1 border-none font-bold text-[10px] uppercase tracking-wider", statusConfig[job.status as keyof typeof statusConfig]?.color || statusConfig.PENDING.color)}>
                  {statusConfig[job.status as keyof typeof statusConfig]?.label || job.status}
                </Badge>
              </TableCell>
              <TableCell className="text-center">
                <Badge className={cn(
                  "rounded-full px-3 py-1 border-none font-bold text-[10px] uppercase tracking-wider",
                  job.invoiceStatus === "PAYMENT" ? "bg-emerald-500/10 text-emerald-500" :
                  job.invoiceStatus === "DP" ? "bg-blue-500/10 text-blue-500" :
                  "bg-amber-500/10 text-amber-500"
                )}>
                  {job.invoiceStatus || "PENDING"}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1.5">
                  <span className="font-black text-foreground text-xs">{job.progress || 0}%</span>
                </div>
              </TableCell>
               <TableCell className="text-center px-6">
                <div className="flex items-center justify-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-9 rounded-xl border-pink-200 text-pink-600 hover:bg-pink-500 hover:text-white transition-all duration-300 font-bold px-6 shadow-sm"
                    onClick={() => router.push(`/dashboard/jobs/${job.id}`)}
                  >
                    Detail
                  </Button>
                  {(session?.user?.role === "ADMINISTRATOR" || session?.user?.role === "PIMPINAN") && (
                    <DropdownMenu>
                      <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-muted transition-all" />}>
                        <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="rounded-xl shadow-xl border-muted/20">
                        <DropdownMenuItem 
                          className="text-destructive font-bold gap-2 focus:text-destructive cursor-pointer"
                          onClick={async () => {
                            if (confirm("Apakah Anda yakin ingin menghapus berkas ini?")) {
                              const res = await deleteJob(job.id, job.category);
                              if (res.success) {
                                toast.success("Berkas berhasil dihapus");
                                fetchJobs();
                              } else {
                                toast.error(res.error);
                              }
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                          Hapus Berkas
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
