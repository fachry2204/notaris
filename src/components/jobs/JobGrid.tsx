"use client";

import React, { useState } from "react";
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
  QrCode, 
  MoreVertical,
  AlertCircle,
  CheckCircle2,
  Calendar
} from "lucide-react";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

const initialJobs = [
  {
    id: "J-2026-001",
    title: "Akta Jual Beli Tanah",
    client: "Budi Santoso",
    type: "PPAT",
    status: "PROCESS",
    priority: "HIGH",
    deadline: "2026-05-15",
    staff: "Siska Wijaya",
    progress: 45,
  },
  {
    id: "J-2026-002",
    title: "Pendirian PT Berkah Jaya",
    client: "PT Maju Terus Jaya",
    type: "Badan Hukum",
    status: "VERIFICATION",
    priority: "URGENT",
    deadline: "2026-05-12",
    staff: "Andi Pratama",
    progress: 90,
  },
  {
    id: "J-2026-003",
    title: "Perjanjian Sewa Menyewa",
    client: "Siti Aminah",
    type: "Non Badan Hukum",
    status: "REVISION",
    priority: "LOW",
    deadline: "2026-05-20",
    staff: "Siska Wijaya",
    progress: 20,
  },
  {
    id: "J-2026-004",
    title: "Rapat Umum Pemegang Saham",
    client: "CV Berkah Mandiri",
    type: "Badan Hukum",
    status: "DONE",
    priority: "HIGH",
    deadline: "2026-05-01",
    staff: "Fachry",
    progress: 100,
  },
  {
    id: "J-2026-005",
    title: "Akta Pengakuan Hutang",
    client: "Rizky Ramadhan",
    type: "Non Badan Hukum",
    status: "REVISION_PROCESS",
    priority: "MEDIUM",
    deadline: "2026-05-28",
    staff: "Andi Pratama",
    progress: 60,
  },
  {
    id: "J-2026-006",
    title: "Akta Hibah Bangunan",
    client: "Hendra Wijaya",
    type: "PPAT",
    status: "PENDING",
    priority: "URGENT",
    deadline: "2026-05-22",
    staff: "Fachry",
    progress: 15,
  },
];

const statusConfig = {
  PENDING: { label: "Pending", color: "bg-slate-500/10 text-slate-500 border-slate-500/20" },
  REVISION: { label: "Revisi", color: "bg-red-500/10 text-red-500 border-red-500/20" },
  REVISION_PROCESS: { label: "Proses Revisi", color: "bg-rose-500/10 text-rose-500 border-rose-500/20" },
  PROCESS: { label: "Proses", color: "bg-amber-500/10 text-amber-500 border-amber-500/20" },
  VERIFICATION: { label: "Verifikasi", color: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
  DONE: { label: "Selesai", color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" },
};

const priorityConfig = {
  LOW: { label: "Rendah", color: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400" },
  MEDIUM: { label: "Menengah", color: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" },
  HIGH: { label: "Tinggi", color: "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400" },
  URGENT: { label: "Mendesak", color: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400" },
};

export function JobGrid() {
  return (
    <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
      {initialJobs.map((job) => (
        <Card key={job.id} className="group relative border-none shadow-sm rounded-[2rem] bg-card hover:shadow-xl hover:shadow-pink-500/5 transition-all duration-500 overflow-hidden">
          <CardHeader className="pb-4 px-8 pt-8">
            <div className="flex items-start justify-between">
              <Badge className={cn("rounded-full px-4 py-1 border-none font-bold text-[10px] uppercase tracking-wider", statusConfig[job.status as keyof typeof statusConfig].color)}>
                {statusConfig[job.status as keyof typeof statusConfig].label}
              </Badge>
              <DropdownMenu>
                <DropdownMenuTrigger>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-pink-50 text-muted-foreground hover:text-pink-600 transition-colors">
                    <MoreVertical className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="rounded-2xl border-none shadow-xl">
                  <DropdownMenuItem className="rounded-xl px-4 py-2.5">Detail Berkas</DropdownMenuItem>
                  <DropdownMenuItem className="rounded-xl px-4 py-2.5">Update Progress</DropdownMenuItem>
                  <DropdownMenuItem className="rounded-xl px-4 py-2.5">Cetak Tanda Terima</DropdownMenuItem>
                  <DropdownMenuItem className="rounded-xl px-4 py-2.5 text-destructive">Hapus</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <CardTitle className="text-xl font-extrabold mt-6 text-foreground tracking-tight group-hover:text-pink-600 transition-colors">{job.title}</CardTitle>
            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-3 font-medium">
              <code className="bg-muted/50 px-2 py-1 rounded-lg text-[10px] font-bold text-foreground">
                {job.id}
              </code>
              <span className="h-1 w-1 rounded-full bg-muted-foreground/30" />
              <span className="flex items-center gap-1.5">
                <User className="h-3.5 w-3.5" />
                {job.client}
              </span>
            </div>
          </CardHeader>
          <CardContent className="pb-6 px-8 pt-4 space-y-8">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground font-medium flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Deadline
              </span>
              <span className={cn("font-bold", new Date(job.deadline) < new Date() ? 'text-rose-500' : 'text-foreground')}>
                {new Date(job.deadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider">
                <span className="text-muted-foreground">Progress Pekerjaan</span>
                <span className="text-foreground">{job.progress}%</span>
              </div>
              <div className="h-2 w-full bg-muted/30 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-pink-500 shadow-[0_0_10px_rgba(244,126,171,0.5)] transition-all duration-1000 ease-in-out" 
                  style={{ width: `${job.progress}%` }}
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="pt-6 border-t border-muted/5 bg-muted/5 px-8 py-5 flex items-center justify-between mt-2">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-pink-500/10 flex items-center justify-center">
                <User className="h-4 w-4 text-pink-500" />
              </div>
              <span className="text-[11px] text-muted-foreground font-bold uppercase tracking-widest">
                {job.staff}
              </span>
            </div>
            <Button size="sm" variant="ghost" className="h-9 px-4 rounded-xl text-xs font-bold gap-2 text-foreground hover:bg-pink-50 hover:text-pink-600 transition-all group-hover:gap-3">
              Detail
              <ArrowRight className="h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
