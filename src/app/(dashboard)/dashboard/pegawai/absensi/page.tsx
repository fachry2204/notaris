import { Button } from "@/components/ui/button";
import { UserCheck, Calendar, Download, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AbsensiPage() {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Absensi Pegawai</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-muted-foreground">Pegawai</span>
            <span className="h-1 w-1 rounded-full bg-muted-foreground/40" />
            <span className="text-xs font-medium text-primary">Absensi</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="h-10 rounded-xl bg-card border-border/60 font-semibold gap-2">
            <Calendar className="h-4 w-4" />
            May 13, 2026
          </Button>
          <Button size="sm" className="h-10 rounded-xl font-semibold gap-2 shadow-lg shadow-primary/20">
            <UserCheck className="h-4 w-4" />
            Absen Sekarang
          </Button>
        </div>
      </div>

      <Card className="border-none bg-card/60 backdrop-blur-xl shadow-2xl shadow-primary/5 rounded-3xl overflow-hidden">
        <CardHeader className="border-b border-border/60 pb-6">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-primary" />
            Status Kehadiran Hari Ini
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-8 text-center py-20">
          <div className="flex flex-col items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <UserCheck className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold">Belum Ada Data Absensi</h3>
            <p className="text-muted-foreground max-w-sm mx-auto">
              Silakan lakukan absensi kehadiran hari ini untuk mencatat waktu masuk kerja Anda.
            </p>
            <Button className="mt-4 rounded-xl px-8 h-11 font-bold">
              Klik Untuk Absen
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
