import React from "react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, FileCheck, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

import { CompletedJobsTable } from "@/components/jobs/CompletedJobsTable";

export default function CompletedJobsPage() {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Berkas Selesai</h1>
          <p className="text-slate-500">
            Arsip digital seluruh pekerjaan yang telah diselesaikan.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input placeholder="Cari arsip..." className="pl-9 w-[250px]" />
          </div>
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export Excel
          </Button>
        </div>
      </div>

      <Card className="border-slate-200 bg-white/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>Daftar Riwayat Berkas</CardTitle>
          <CardDescription>Menampilkan berkas yang telah selesai diproses dalam 1 tahun terakhir.</CardDescription>
        </CardHeader>
        <CardContent>
          <CompletedJobsTable />
        </CardContent>
      </Card>
    </div>
  );
}
