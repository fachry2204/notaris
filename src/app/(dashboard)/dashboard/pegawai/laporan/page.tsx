"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ClipboardList, Calendar, Download, FileText, Search, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { FilterCepat } from "@/components/dashboard/FilterCepat";
import { getAbsensiDashboardData } from "@/lib/actions/attendance";
import { toast } from "sonner";

export default function LaporanAbsensiPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const loadData = async (start?: Date, end?: Date) => {
    setLoading(true);
    const result = await getAbsensiDashboardData(start, end);
    if (result.success && (result.role === "ADMINISTRATOR" || result.role === "PIMPINAN")) {
      setData((result.data as any[]) || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleFilterChange = (start: Date | null, end: Date | null, type: string) => {
    toast.info(`Filter ${type} diterapkan`);
    loadData(start || undefined, end || undefined);
  };

  const getLateMinutes = (dateStr: any) => {
    if (!dateStr) return 0;
    const d = new Date(dateStr);
    const totalMins = d.getHours() * 60 + d.getMinutes();
    const targetMins = 9 * 60;
    return totalMins > targetMins ? totalMins - targetMins : 0;
  };

  const totalKehadiran = data.length;
  const totalTerlambat = data.filter(d => getLateMinutes(d.checkIn) > 0).length;
  const totalIzinSakit = data.filter(d => d.status === "Izin" || d.status === "Sakit").length;
  const totalAlpa = data.filter(d => d.status === "Alpha" || d.status === "Tidak Masuk").length;

  // Group by staff for rekapitulasi
  const rekapitulasi = data.reduce((acc: any, curr: any) => {
    const name = curr.staffName || "Unknown";
    if (!acc[name]) {
      acc[name] = {
        name,
        role: curr.staffRole,
        hadir: 0,
        terlambat: 0,
        izin: 0,
        alpa: 0
      };
    }
    if (curr.status === "Hadir") acc[name].hadir += 1;
    if (getLateMinutes(curr.checkIn) > 0) acc[name].terlambat += 1;
    if (curr.status === "Izin" || curr.status === "Sakit") acc[name].izin += 1;
    if (curr.status === "Alpha" || curr.status === "Tidak Masuk") acc[name].alpa += 1;
    
    return acc;
  }, {});

  const rekapList = Object.values(rekapitulasi).filter((r: any) => r.name.toLowerCase().includes(searchQuery.toLowerCase()));
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
          <FilterCepat onFilterChange={handleFilterChange} defaultFilter="Bulan Ini" />
          <Button size="sm" className="h-10 rounded-xl font-semibold gap-2 shadow-lg shadow-primary/20">
            <Download className="h-4 w-4" />
            Cetak Laporan
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        {[
          { title: "Total Kehadiran", value: totalKehadiran.toString(), icon: Calendar, color: "text-blue-500" },
          { title: "Total Terlambat", value: totalTerlambat.toString(), icon: ClipboardList, color: "text-orange-500" },
          { title: "Total Izin/Sakit", value: totalIzinSakit.toString(), icon: FileText, color: "text-green-500" },
          { title: "Tidak Masuk", value: totalAlpa.toString(), icon: FileText, color: "text-rose-500" },
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
                  placeholder="Cari pegawai..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-10 rounded-xl bg-background/50 border-border/50 focus:ring-primary/20"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
              <p className="font-medium text-muted-foreground">Memuat Laporan...</p>
            </div>
          ) : rekapList.length === 0 ? (
            <div className="pt-8 text-center py-20">
              <div className="flex flex-col items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <ClipboardList className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">Belum Ada Laporan Tersedia</h3>
                <p className="text-muted-foreground max-w-sm mx-auto">
                  Laporan absensi akan muncul di sini setelah ada data absensi yang tercatat pada rentang waktu terpilih.
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs uppercase bg-muted/50 text-muted-foreground">
                  <tr>
                    <th className="px-6 py-4 font-bold tracking-wider">Nama Pegawai</th>
                    <th className="px-6 py-4 font-bold tracking-wider text-center">Total Kehadiran</th>
                    <th className="px-6 py-4 font-bold tracking-wider text-center">Total Terlambat</th>
                    <th className="px-6 py-4 font-bold tracking-wider text-center">Izin / Sakit</th>
                    <th className="px-6 py-4 font-bold tracking-wider text-center">Tidak Masuk</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {rekapList.map((item: any, idx: number) => (
                    <tr key={idx} className="hover:bg-muted/10 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="font-bold text-foreground">{item.name}</span>
                          <span className="text-xs font-medium text-muted-foreground uppercase">{item.role}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center font-bold text-blue-600">
                        {item.hadir} Hari
                      </td>
                      <td className="px-6 py-4 text-center font-bold text-orange-600">
                        {item.terlambat} Kali
                      </td>
                      <td className="px-6 py-4 text-center font-bold text-green-600">
                        {item.izin} Hari
                      </td>
                      <td className="px-6 py-4 text-center font-bold text-rose-600">
                        {item.alpa} Hari
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
