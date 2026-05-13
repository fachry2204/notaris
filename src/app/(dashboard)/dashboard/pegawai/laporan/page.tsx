import { Button } from "@/components/ui/button";
import { ClipboardList, Calendar, Download, FileText, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function LaporanAbsensiPage() {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Laporan Absensi</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-muted-foreground">Pegawai</span>
            <span className="h-1 w-1 rounded-full bg-muted-foreground/40" />
            <span className="text-xs font-medium text-primary">Laporan Absensi</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="h-10 rounded-xl bg-card border-border/60 font-semibold gap-2">
            <Calendar className="h-4 w-4" />
            Pilih Periode
          </Button>
          <Button size="sm" className="h-10 rounded-xl font-semibold gap-2 shadow-lg shadow-primary/20">
            <Download className="h-4 w-4" />
            Cetak Laporan
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {[
          { title: "Total Kehadiran", value: "0", icon: Calendar, color: "text-blue-500" },
          { title: "Total Terlambat", value: "0", icon: ClipboardList, color: "text-orange-500" },
          { title: "Total Izin/Sakit", value: "0", icon: FileText, color: "text-green-500" },
        ].map((stat, i) => (
          <Card key={i} className="border-none bg-card/60 backdrop-blur-xl shadow-xl shadow-primary/5 rounded-3xl overflow-hidden group hover:bg-card transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <p className="text-3xl font-bold">{stat.value}</p>
                </div>
                <div className={`h-12 w-12 rounded-2xl bg-muted/50 flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-none bg-card/60 backdrop-blur-xl shadow-2xl shadow-primary/5 rounded-3xl overflow-hidden">
        <CardHeader className="border-b border-border/60 pb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Rekapitulasi Absensi
            </CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Cari laporan..." 
                  className="pl-9 h-10 rounded-xl bg-background/50 border-border/50 focus:ring-primary/20"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-8 text-center py-20">
          <div className="flex flex-col items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <ClipboardList className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold">Belum Ada Laporan Tersedia</h3>
            <p className="text-muted-foreground max-w-sm mx-auto">
              Laporan absensi bulanan akan muncul di sini setelah ada data absensi yang tercatat.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
