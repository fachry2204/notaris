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
              {[
                { id: "075/B/2026", title: "Akta Pendirian PT", client: "Hendra Wijaya (PT Maju Terus)", date: "08 Mei 2026", status: "DONE" },
                { id: "078/B/2026", title: "Legalisir Sertifikat", client: "Budi Santoso", date: "05 Mei 2026", status: "DONE" },
                { id: "080/B/2026", title: "Akta Hibah Tanah", client: "Siti Aminah", date: "02 Mei 2026", status: "DONE" },
                { id: "082/B/2026", title: "Perjanjian Kerjasama", client: "CV Berkah Mandiri", date: "28 April 2026", status: "DONE" },
                { id: "085/B/2026", title: "Akta Kuasa Menjual", client: "Maya Sartika", date: "25 April 2026", status: "DONE" },
              ].map((item) => (
                <TableRow key={item.id} className="hover:bg-muted/5 transition-colors">
                  <TableCell className="font-mono text-xs font-bold text-pink-600">{item.id}</TableCell>
                  <TableCell className="font-bold text-foreground">{item.title}</TableCell>
                  <TableCell className="font-medium">{item.client}</TableCell>
                  <TableCell className="text-muted-foreground">{item.date}</TableCell>
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
        </CardContent>
      </Card>
    </div>
  );
}
