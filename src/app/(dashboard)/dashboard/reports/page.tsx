import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileBarChart, Download, Calendar } from "lucide-react";

export default function ReportsPage() {
  const reports = [
    { title: "Laporan Pekerjaan Bulanan", desc: "Statistik penyelesaian berkas per bulan.", type: "PDF" },
    { title: "Laporan Keuangan & Cashflow", desc: "Rekapitulasi pendapatan dan tagihan.", type: "Excel" },
    { title: "Laporan Produktivitas Staff", desc: "Detail performa kerja setiap anggota tim.", type: "PDF" },
    { title: "Rekap Titipan Pajak", desc: "Daftar titipan pajak dan status SPS.", type: "Excel" },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Laporan & Analytics</h1>
          <p className="text-slate-500">
            Generate laporan komprehensif untuk evaluasi operasional kantor.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Calendar className="mr-2 h-4 w-4" />
            Pilih Periode
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {reports.map((report, i) => (
          <Card key={i} className="group hover:border-primary/30 transition-all border-slate-200 bg-white/50 backdrop-blur-sm">
            <CardHeader>
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2 group-hover:bg-primary group-hover:text-white transition-all">
                <FileBarChart className="h-5 w-5" />
              </div>
              <CardTitle>{report.title}</CardTitle>
              <CardDescription>{report.desc}</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Format: {report.type}</span>
              <Button size="sm" variant="secondary" className="gap-2">
                <Download className="h-4 w-4" />
                Download
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
