"use client";

import React, { useState, useEffect } from "react";
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
  MoreVertical, 
  Eye, 
  Edit3, 
  Trash2, 
  Clock, 
  User, 
  FileText
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

export function JobTable() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchJobs = async () => {
    setLoading(true);
    const result = await getJobs();
    if (result.success) {
      // For "Inbound", we might want to filter by NEW status, but user screenshot shows various statuses.
      // So we'll show all jobs for now as per the hardcoded version.
      setJobs(result.data || []);
    } else {
      toast.error(result.error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleDelete = async () => {
    if (!deleteId) return;
    const result = await deleteJob(deleteId);
    if (result.success) {
      toast.success("Pekerjaan berhasil dihapus");
      fetchJobs();
    } else {
      toast.error(result.error);
    }
    setDeleteId(null);
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
            <TableHead className="font-bold text-foreground text-center">Status</TableHead>
            <TableHead className="font-bold text-foreground">Progress</TableHead>
            <TableHead className="w-[80px] text-center"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {jobs.map((job) => (
            <TableRow key={job.id} className="hover:bg-muted/10 border-muted/10 group transition-colors">
              <TableCell className="py-5 px-6">
                <div className="flex flex-col gap-1">
                  <span className="font-mono font-bold text-pink-600 text-xs">{job.trackingCode}</span>
                  <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                    {new Date(job.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
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
              <TableCell>
                <div className="flex flex-col gap-1.5 w-32">
                  <div className="flex justify-between items-center text-[10px] font-bold uppercase">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="text-foreground">{job.progress || 0}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-muted/30 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-pink-500 shadow-[0_0_8px_rgba(244,126,171,0.3)] transition-all duration-1000" 
                      style={{ width: `${job.progress || 0}%` }}
                    />
                  </div>
                </div>
              </TableCell>
              <TableCell className="text-center px-6">
                <DropdownMenu>
                  <DropdownMenuTrigger className="h-9 w-9 rounded-xl hover:bg-pink-50 text-muted-foreground hover:text-pink-600 transition-colors inline-flex items-center justify-center">
                    <MoreVertical className="h-5 w-5" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="rounded-2xl border-none shadow-xl min-w-[160px] p-2">
                    <DropdownMenuItem onClick={() => {}} className="rounded-xl px-3 py-2.5 gap-3 cursor-pointer">
                      <Eye className="h-4 w-4 text-blue-500" />
                      <span className="font-medium">Detail Berkas</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => {}} className="rounded-xl px-3 py-2.5 gap-3 cursor-pointer">
                      <Edit3 className="h-4 w-4 text-amber-500" />
                      <span className="font-medium">Update Progress</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => {}} className="rounded-xl px-3 py-2.5 gap-3 cursor-pointer">
                      <FileText className="h-4 w-4 text-emerald-500" />
                      <span className="font-medium">Tanda Terima</span>
                    </DropdownMenuItem>
                    <div className="h-px bg-muted/10 my-1" />
                    <DropdownMenuItem onClick={() => setDeleteId(job.id)} className="rounded-xl px-3 py-2.5 gap-3 cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive">
                      <Trash2 className="h-4 w-4" />
                      <span className="font-medium">Hapus</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
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
