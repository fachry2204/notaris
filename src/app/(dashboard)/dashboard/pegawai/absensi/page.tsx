 "use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { buttonVariants } from "@/components/ui/button";
import { UserCheck, Calendar, Loader2, Clock3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { getMyAttendanceToday } from "@/lib/actions/attendance";
import { toast } from "sonner";

export default function AbsensiPage() {
  const [todayAttendance, setTodayAttendance] = useState<any>(null);
  const [loadingAttendance, setLoadingAttendance] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  const todayLabel = new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  useEffect(() => {
    const media = window.matchMedia("(max-width: 768px)");
    const apply = () => setIsMobile(media.matches);
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    const loadAttendance = async () => {
      setLoadingAttendance(true);
      const result = await getMyAttendanceToday();

      if (result.success) {
        setTodayAttendance(result.data?.attendance || null);
      } else {
        toast.error(result.error);
      }

      setLoadingAttendance(false);
    };

    loadAttendance();
  }, []);

  const attendanceActionLabel = loadingAttendance
    ? "Memuat Status..."
    : todayAttendance?.checkIn && !todayAttendance?.checkOut
      ? "Absen Pulang"
      : "Absen Masuk";

  const attendanceStatusTitle = loadingAttendance
    ? "Memuat data absensi..."
    : todayAttendance?.checkIn
      ? "Absensi Hari Ini Sudah Tercatat"
      : "Belum Ada Data Absensi";

  const attendanceStatusDescription = loadingAttendance
    ? "Sistem sedang mengambil data absensi hari ini."
    : todayAttendance?.checkIn && !todayAttendance?.checkOut
      ? `Anda sudah absen masuk pada ${new Date(todayAttendance.checkIn).toLocaleTimeString("id-ID")}. Silakan lanjutkan absen pulang saat jam kerja selesai.`
      : todayAttendance?.checkIn && todayAttendance?.checkOut
        ? `Absensi masuk tercatat pukul ${new Date(todayAttendance.checkIn).toLocaleTimeString("id-ID")} dan absen pulang pukul ${new Date(todayAttendance.checkOut).toLocaleTimeString("id-ID")}.`
        : "Silakan lakukan absensi kehadiran hari ini untuk mencatat waktu masuk kerja Anda.";

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {!isMobile && (
        <Card className="border border-amber-500/30 bg-amber-500/10 rounded-2xl">
          <CardContent className="p-5">
            <p className="text-sm font-bold text-amber-700">Mohon Buka Di Mobile / Aplikasi</p>
            <p className="mt-1 text-xs text-amber-700/80">
              Menu absensi membutuhkan akses kamera dan lokasi GPS. Silakan buka melalui perangkat mobile untuk melakukan absensi.
            </p>
          </CardContent>
        </Card>
      )}

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
          <div className={cn(buttonVariants({ variant: "outline", size: "sm" }), "h-10 rounded-xl bg-card border-border/60 font-semibold gap-2")}>
            <Calendar className="h-4 w-4" />
            {todayLabel}
          </div>
          {isMobile ? (
            <Link href="/dashboard/pegawai/absensi/absenku" className={cn(buttonVariants({ size: "sm" }), "h-10 rounded-xl font-semibold gap-2 shadow-lg shadow-primary/20")}>
              {loadingAttendance ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserCheck className="h-4 w-4" />}
              {attendanceActionLabel}
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => toast.info("Mohon buka menu absensi melalui perangkat mobile.")}
              className={cn(buttonVariants({ size: "sm" }), "h-10 rounded-xl font-semibold gap-2 shadow-lg shadow-primary/20 opacity-60")}
            >
              <UserCheck className="h-4 w-4" />
              {attendanceActionLabel}
            </button>
          )}
        </div>
      </div>

      <Card className="border-none bg-card/60 backdrop-blur-xl shadow-2xl shadow-primary/5 rounded-3xl overflow-hidden">
        <CardHeader className="border-b border-border/60 pb-6">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            {loadingAttendance ? <Loader2 className="h-5 w-5 text-primary animate-spin" /> : <UserCheck className="h-5 w-5 text-primary" />}
            Status Kehadiran Hari Ini
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-8 text-center py-20">
          <div className="flex flex-col items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              {loadingAttendance ? <Clock3 className="h-8 w-8 text-primary" /> : <UserCheck className="h-8 w-8 text-primary" />}
            </div>
            <h3 className="text-xl font-semibold">{attendanceStatusTitle}</h3>
            <p className="text-muted-foreground max-w-sm mx-auto">
              {attendanceStatusDescription}
            </p>
            {isMobile ? (
              <Link href="/dashboard/pegawai/absensi/absenku" className={cn(buttonVariants(), "mt-4 rounded-xl px-8 h-11 font-bold")}>
                {attendanceActionLabel}
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => toast.info("Mohon buka menu absensi melalui perangkat mobile.")}
                className={cn(buttonVariants(), "mt-4 rounded-xl px-8 h-11 font-bold opacity-60")}
              >
                {attendanceActionLabel}
              </button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
