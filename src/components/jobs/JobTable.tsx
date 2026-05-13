"use client";

import React from "react";
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
  ArrowRight,
  FileText
} from "lucide-react";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

const initialJobs = [
  {
    id: "086/B/2026",
    title: "Akta Jual Beli Tanah",
    client: "Budi Santoso",
    type: "PPAT",
    status: "PROCESS",
    priority: "HIGH",
    deadline: "2026-05-15",
    staff: "Siska Wijaya",
    progress: 45,
    tanggalMasuk: "2026-05-12"
  },
  {
    id: "087/B/2026",
    title: "Pendirian PT Berkah Jaya",
    client: "PT Maju Terus Jaya",
    type: "Badan Hukum",
    status: "VERIFICATION",
    priority: "URGENT",
    deadline: "2026-05-12",
    staff: "Andi Pratama",
    progress: 90,
    tanggalMasuk: "2026-05-10"
  },
  {
    id: "088/B/2026",
    title: "Perjanjian Sewa Menyewa",
    client: "Siti Aminah",
    type: "Non Badan Hukum",
    status: "REVISION",
    priority: "LOW",
    deadline: "2026-05-20",
    staff: "Siska Wijaya",
    progress: 20,
    tanggalMasuk: "2026-05-11"
  },
  {
    id: "089/B/2026",
    title: "Akta Hibah Waris",
    client: "Rizky Ramadhan",
    type: "PPAT",
    status: "PENDING",
    priority: "MEDIUM",
    deadline: "2026-05-25",
    staff: "Fachry",
    progress: 10,
    tanggalMasuk: "2026-05-12"
  },
  {
    id: "090/B/2026",
    title: "Perubahan Anggaran Dasar PT",
    client: "CV Berkah Mandiri",
    type: "Badan Hukum",
    status: "REVISION_PROCESS",
    priority: "HIGH",
    deadline: "2026-05-18",
    staff: "Andi Pratama",
    progress: 55,
    tanggalMasuk: "2026-05-08"
  },
  {
    id: "091/B/2026",
    title: "Akta Kuasa Menjual",
    client: "Dewi",
    type: "Non Badan Hukum",
    status: "DONE",
    priority: "MEDIUM",
    deadline: "2026-05-05",
    staff: "Siska Wijaya",
    progress: 100,
    tanggalMasuk: "2026-05-01"
  }
];

const statusConfig = {
  PENDING: { label: "Pending", color: "bg-slate-500/10 text-slate-500" },
  REVISION: { label: "Revisi", color: "bg-red-500/10 text-red-500" },
  REVISION_PROCESS: { label: "Proses Revisi", color: "bg-rose-500/10 text-rose-500" },
  PROCESS: { label: "Proses", color: "bg-amber-500/10 text-amber-500" },
  VERIFICATION: { label: "Verifikasi", color: "bg-blue-500/10 text-blue-500" },
  DONE: { label: "Selesai", color: "bg-emerald-500/10 text-emerald-500" },
};

export function JobTable() {
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
          {initialJobs.map((job) => (
            <TableRow key={job.id} className="hover:bg-muted/10 border-muted/10 group transition-colors">
              <TableCell className="py-5 px-6">
                <div className="flex flex-col gap-1">
                  <span className="font-mono font-bold text-pink-600 text-xs">{job.id}</span>
                  <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{new Date(job.tanggalMasuk).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-pink-500/5 flex items-center justify-center text-pink-500 group-hover:bg-pink-500 group-hover:text-white transition-all duration-300">
                    <User className="h-4 w-4" />
                  </div>
                  <span className="font-bold text-foreground">{job.client}</span>
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
                    new Date(job.deadline) < new Date() ? "text-rose-500 font-bold" : "text-foreground"
                  )}>
                    {new Date(job.deadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>
              </TableCell>
              <TableCell className="text-center">
                <Badge className={cn("rounded-full px-3 py-1 border-none font-bold text-[10px] uppercase tracking-wider", statusConfig[job.status as keyof typeof statusConfig].color)}>
                  {statusConfig[job.status as keyof typeof statusConfig].label}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex flex-col gap-1.5 w-32">
                  <div className="flex justify-between items-center text-[10px] font-bold uppercase">
                    <span className="text-muted-foreground">Done</span>
                    <span className="text-foreground">{job.progress}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-muted/30 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-pink-500 shadow-[0_0_8px_rgba(244,126,171,0.3)] transition-all duration-1000" 
                      style={{ width: `${job.progress}%` }}
                    />
                  </div>
                </div>
              </TableCell>
              <TableCell className="text-center px-6">
                <DropdownMenu>
                  <DropdownMenuTrigger>
                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-pink-50 text-muted-foreground hover:text-pink-600 transition-colors">
                      <MoreVertical className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="rounded-2xl border-none shadow-xl min-w-[160px] p-2">
                    <DropdownMenuItem className="rounded-xl px-3 py-2.5 gap-3 cursor-pointer">
                      <Eye className="h-4 w-4 text-blue-500" />
                      <span className="font-medium">Detail Berkas</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="rounded-xl px-3 py-2.5 gap-3 cursor-pointer">
                      <Edit3 className="h-4 w-4 text-amber-500" />
                      <span className="font-medium">Update Progress</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="rounded-xl px-3 py-2.5 gap-3 cursor-pointer">
                      <FileText className="h-4 w-4 text-emerald-500" />
                      <span className="font-medium">Tanda Terima</span>
                    </DropdownMenuItem>
                    <div className="h-px bg-muted/10 my-1" />
                    <DropdownMenuItem className="rounded-xl px-3 py-2.5 gap-3 cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive">
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
    </div>
  );
}
