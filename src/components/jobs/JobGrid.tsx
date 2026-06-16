"use client";

import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  FileText, 
  Clock, 
  User, 
  ArrowRight, 
  MoreVertical,
} from "lucide-react";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

import { getJobs, deleteJob } from "@/lib/actions/jobs";
import { toast } from "sonner";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const statusConfig = {
  NEW: { label: "Baru", color: "bg-slate-500/10 text-slate-500 border-slate-500/20" },
  PENDING: { label: "Pending", color: "bg-slate-500/10 text-slate-500 border-slate-500/20" },
  REVISION: { label: "Revisi", color: "bg-red-500/10 text-red-500 border-red-500/20" },
  REVISION_PROCESS: { label: "Proses Revisi", color: "bg-rose-500/10 text-rose-500 border-rose-500/20" },
  PROCESS: { label: "Proses", color: "bg-amber-500/10 text-amber-500 border-amber-500/20" },
  VERIFICATION: { label: "Verifikasi", color: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
  DONE: { label: "Selesai", color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" },
};

export function JobGrid() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteInfo, setDeleteInfo] = useState<{id: string, category: string} | null>(null);

  const fetchJobs = async () => {
    setLoading(true);
    const result = await getJobs();
    if (result.success) {
      setJobs(result.data || []);
    } else {
      toast.error(result.error || "Gagal mengambil data pekerjaan");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleDelete = async () => {
    if (!deleteInfo) return;
    const result = await deleteJob(deleteInfo.id, deleteInfo.category);
    if (result.success) {
      toast.success("Pekerjaan berhasil dihapus");
      fetchJobs();
    } else {
      toast.error(result.error || "Gagal menghapus pekerjaan");
    }
    setDeleteInfo(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-pink-500 border-t-transparent"></div>
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="text-center py-20 bg-card/50 backdrop-blur-sm rounded-[2rem] border-2 border-dashed border-muted">
        <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
        <h3 className="text-xl font-bold text-foreground">Belum ada pekerjaan</h3>
        <p className="text-muted-foreground">Silahkan tambah pekerjaan baru untuk memulai.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
      {jobs.map((job) => (
        <Card key={job.id} className="group relative border-none shadow-sm rounded-[2rem] bg-card hover:shadow-xl hover:shadow-pink-500/5 transition-all duration-500 overflow-hidden">
          <CardHeader className="pb-4 px-8 pt-8">
            <div className="flex items-start justify-between">
              <Badge className={cn("rounded-full px-4 py-1 border-none font-bold text-[10px] uppercase tracking-wider", statusConfig[job.status as keyof typeof statusConfig]?.color || statusConfig.PENDING.color)}>
                {statusConfig[job.status as keyof typeof statusConfig]?.label || job.status}
              </Badge>
              <DropdownMenu>
                <DropdownMenuTrigger className="h-8 w-8 rounded-full hover:bg-pink-50 text-muted-foreground hover:text-pink-600 transition-colors inline-flex items-center justify-center">
                  <MoreVertical className="h-5 w-5" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="rounded-2xl border-none shadow-xl">
                  <DropdownMenuItem onClick={() => {}} className="rounded-xl px-4 py-2.5">Detail Berkas</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => {}} className="rounded-xl px-4 py-2.5">Update Progress</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => {}} className="rounded-xl px-4 py-2.5">Cetak Tanda Terima</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setDeleteInfo({id: job.id, category: job.category})} className="rounded-xl px-4 py-2.5 text-destructive font-bold">Hapus</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <CardTitle className="text-xl font-extrabold mt-6 text-foreground tracking-tight group-hover:text-pink-600 transition-colors line-clamp-1">{job.title}</CardTitle>
            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-3 font-medium">
              <code className="bg-muted/50 px-2 py-1 rounded-lg text-[10px] font-bold text-foreground">
                {job.trackingCode}
              </code>
              <span className="h-1 w-1 rounded-full bg-muted-foreground/30" />
              <span className="flex items-center gap-1.5 truncate max-w-[120px]">
                <User className="h-3.5 w-3.5" />
                {job.client?.name || "No Client"}
              </span>
            </div>
          </CardHeader>
          <CardContent className="pb-6 px-8 pt-4 space-y-8">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground font-medium flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Deadline
              </span>
              <span className={cn("font-bold", job.deadline && new Date(job.deadline) < new Date() ? 'text-rose-500' : 'text-foreground')}>
                {job.deadline ? new Date(job.deadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : "-"}
              </span>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider">
                <span className="text-muted-foreground">Progress Pekerjaan</span>
                <span className="text-foreground">{job.progress || 0}%</span>
              </div>
              <div className="h-2 w-full bg-muted/30 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-pink-500 shadow-[0_0_10px_rgba(244,126,171,0.5)] transition-all duration-1000 ease-in-out" 
                  style={{ width: `${job.progress || 0}%` }}
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="pt-6 border-t border-muted/5 bg-muted/5 px-8 py-5 flex items-center justify-between mt-2">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-pink-500/10 flex items-center justify-center">
                <User className="h-4 w-4 text-pink-500" />
              </div>
              <span className="text-[11px] text-muted-foreground font-bold uppercase tracking-widest truncate max-w-[100px]">
                {job.staff?.fullName || "Unassigned"}
              </span>
            </div>
            <Button size="sm" variant="ghost" className="h-9 px-4 rounded-xl text-xs font-bold gap-2 text-foreground hover:bg-pink-50 hover:text-pink-600 transition-all group-hover:gap-3">
              Detail
              <ArrowRight className="h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      ))}

      <AlertDialog open={!!deleteInfo} onOpenChange={(open) => !open && setDeleteInfo(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Pekerjaan?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini akan menghapus data berkas pekerjaan secara permanen dari sistem.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
