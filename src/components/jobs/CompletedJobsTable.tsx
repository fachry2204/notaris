"use client";

import React, { useState, useEffect } from "react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileCheck, Archive } from "lucide-react";
import { getCompletedJobs } from "@/lib/actions/jobs";
import { toast } from "sonner";

export function CompletedJobsTable() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchJobs = async () => {
      setLoading(true);
      const result = await getCompletedJobs();
      if (result.success) {
        setJobs(result.data || []);
      } else {
        toast.error(result.error);
      }
      setLoading(false);
    };
    fetchJobs();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div>
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="text-center py-20">
        <Archive className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
        <p className="text-muted-foreground">Belum ada berkas yang diselesaikan.</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>No. Berkas</TableHead>
          <TableHead>Nama Pekerjaan</TableHead>
          <TableHead>Client</TableHead>
          <TableHead>Tgl Selesai</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Aksi</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {jobs.map((job) => (
          <TableRow key={job.id} className="hover:bg-muted/5 transition-colors">
            <TableCell className="font-mono text-xs font-bold text-pink-600">{job.trackingCode}</TableCell>
            <TableCell className="font-bold text-foreground">{job.title}</TableCell>
            <TableCell className="font-medium">{job.client?.name}</TableCell>
            <TableCell className="text-muted-foreground">
              {new Date(job.updatedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
            </TableCell>
            <TableCell>
              <Badge className="bg-emerald-500/10 text-emerald-600 border-none font-bold text-[10px] uppercase tracking-wider">
                SELESAI
              </Badge>
            </TableCell>
            <TableCell className="text-right">
              <Button variant="ghost" size="sm" className="gap-2 rounded-xl hover:bg-pink-50 hover:text-pink-600 font-bold transition-all">
                <FileCheck className="h-4 w-4" />
                Arsip
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
