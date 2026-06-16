"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { StatusCards } from "@/components/dashboard/StatusCards";
import { DashboardOverview } from "@/components/dashboard/Overview";
import { Button } from "@/components/ui/button";
import { Calendar, Download, Plus, ArrowRight, LayoutDashboard, Clock, UserCheck, ClipboardList, PlaneTakeoff, UserX, Home, Receipt } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { getMyAttendanceToday } from "@/lib/actions/attendance";
import { toast } from "sonner";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const [isMobile, setIsMobile] = useState(false);
  const [todayAttendance, setTodayAttendance] = useState<any>(null);
  const [loadingAttendance, setLoadingAttendance] = useState(true);

  const userRole = session?.user?.role;
  const isStaffLandingRole = userRole === "STAFFADMIN" || userRole === "OB";
  const showOverview = searchParams.get("view") === "overview";

  useEffect(() => {
    const media = window.matchMedia("(max-width: 768px)");
    const apply = () => setIsMobile(media.matches);
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    if (!isStaffLandingRole) return;
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
  }, [isStaffLandingRole]);

  const staffGreeting = useMemo(() => {
    const fullName = session?.user?.fullName || session?.user?.name || "Pegawai";
    const now = new Date();
    const hour = now.getHours();
    if (hour >= 4 && hour < 11) return { title: "Selamat Pagi", name: fullName };
    if (hour >= 11 && hour < 15) return { title: "Selamat Siang", name: fullName };
    if (hour >= 15 && hour < 19) return { title: "Selamat Sore", name: fullName };
    return { title: "Selamat Malam", name: fullName };
  }, [session?.user?.fullName, session?.user?.name]);

  const attendanceActionLabel = loadingAttendance
    ? "Memuat..."
    : todayAttendance?.checkIn && !todayAttendance?.checkOut
      ? "Absen Pulang"
      : todayAttendance?.checkIn && todayAttendance?.checkOut
        ? "Sudah Absen"
        : "Absen Masuk";

  if (status === "loading") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-pink-500 border-t-transparent" />
      </div>
    );
  }

  if (isStaffLandingRole && !showOverview) {
    if (isMobile) {
      return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-b from-pink-600 via-pink-600 to-pink-500 p-6 text-white shadow-2xl shadow-pink-500/20">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm/5 text-white/80">{staffGreeting.title},</p>
                <h1 className="mt-1 text-2xl font-black">{staffGreeting.name}</h1>
                <p className="mt-1 text-xs font-bold uppercase tracking-widest text-white/70">
                  {userRole === "OB" ? "OB / Kurir" : "Staff Admin"}
                </p>
              </div>
              <div className="h-12 w-12 overflow-hidden rounded-2xl bg-white/20 ring-1 ring-white/30">
                {session?.user?.image ? (
                  <img src={session.user.image} alt="Avatar" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-sm font-black">
                    {(staffGreeting.name || "P").slice(0, 1).toUpperCase()}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 rounded-2xl bg-white/15 p-4 ring-1 ring-white/20">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-white/70">Jadwal Kerja</p>
                  <p className="mt-1 text-lg font-black">09:00 - 18:00</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-black uppercase tracking-widest text-white/70">Hari Ini</p>
                  <p className="mt-1 text-sm font-bold">
                    {new Date().toLocaleDateString("id-ID", { weekday: "short", day: "2-digit", month: "short", year: "numeric" })}
                  </p>
                </div>
              </div>

              <Link href="/dashboard/pegawai/absensi/absenku" className="mt-4 block">
                <Button
                  type="button"
                  className="h-12 w-full rounded-2xl bg-white text-pink-600 hover:bg-white/90 font-black"
                  disabled={!loadingAttendance && !!todayAttendance?.checkIn && !!todayAttendance?.checkOut}
                >
                  <UserCheck className="mr-2 h-4 w-4" />
                  {attendanceActionLabel}
                </Button>
              </Link>
            </div>
          </div>

          <div className="-mt-6 px-2">
            <div className="grid grid-cols-4 gap-3 rounded-[2rem] bg-card p-4 shadow-xl shadow-primary/10 ring-1 ring-border/60">
              <Link href="/dashboard/pegawai/absensi" className="flex flex-col items-center gap-2 rounded-2xl px-2 py-3 hover:bg-muted/40 transition-colors">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-pink-500/10 text-pink-600">
                  <ClipboardList className="h-5 w-5" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground text-center">Absensi</span>
              </Link>
              <button
                type="button"
                onClick={() => toast.info("Fitur koreksi absensi akan segera hadir.")}
                className="flex flex-col items-center gap-2 rounded-2xl px-2 py-3 hover:bg-muted/40 transition-colors"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-600">
                  <UserX className="h-5 w-5" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground text-center">Koreksi</span>
              </button>
              <button
                type="button"
                onClick={() => toast.info("Fitur dinas akan segera hadir.")}
                className="flex flex-col items-center gap-2 rounded-2xl px-2 py-3 hover:bg-muted/40 transition-colors"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600">
                  <PlaneTakeoff className="h-5 w-5" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground text-center">Dinas</span>
              </button>
              <button
                type="button"
                onClick={() => toast.info("Fitur izin/cuti akan segera hadir.")}
                className="flex flex-col items-center gap-2 rounded-2xl px-2 py-3 hover:bg-muted/40 transition-colors"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600">
                  <Clock className="h-5 w-5" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground text-center">Izin</span>
              </button>
            </div>
          </div>

          <div className="mt-6 space-y-4 pb-20">
            <div className="flex items-center justify-between px-2">
              <h2 className="text-base font-black text-foreground">Absensi</h2>
              <Link 
                href="/dashboard/pegawai/absensi" 
                className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-blue-700 active:scale-95"
              >
                Lihat Semua
              </Link>
            </div>

            <div className="rounded-[2rem] bg-card p-5 shadow-sm ring-1 ring-border/60">
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-2xl bg-muted/30 p-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Start Day</p>
                  <p className="mt-2 text-xl font-black text-foreground">
                    {todayAttendance?.checkIn ? new Date(todayAttendance.checkIn).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) : "-"}
                  </p>
                </div>
                <div className="rounded-2xl bg-muted/30 p-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">End Day</p>
                  <p className="mt-2 text-xl font-black text-foreground">
                    {todayAttendance?.checkOut ? new Date(todayAttendance.checkOut).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) : "-"}
                  </p>
                </div>
              </div>
              <p className="mt-4 text-xs text-muted-foreground">
                {new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
              </p>
            </div>


          </div>
        </div>
      );
    }

    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="max-w-3xl">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Selamat Datang</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Pilih halaman yang ingin Anda buka setelah login.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Link
            href="/dashboard?view=overview"
            className="group overflow-hidden rounded-[2rem] border border-border/60 bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
          >
            <div className="relative h-64 overflow-hidden bg-muted/20">
              <img
                src="/uploads/dashboard.png"
                alt="Dashboard"
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/10 to-transparent" />
              <div className="absolute left-6 top-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/90 text-pink-500 shadow-lg">
                <LayoutDashboard className="h-6 w-6" />
              </div>
            </div>
            <div className="space-y-3 p-6">
              <div>
                <h2 className="text-xl font-black text-foreground">Dashboard</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Buka ringkasan aktivitas dan monitor pekerjaan harian kantor.
                </p>
              </div>
              <div className="inline-flex items-center gap-2 text-sm font-bold text-pink-600">
                Masuk ke Dashboard
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </div>
            </div>
          </Link>

          <Link
            href="/dashboard/pegawai/absensi"
            className="group overflow-hidden rounded-[2rem] border border-border/60 bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
          >
            <div className="relative h-64 overflow-hidden bg-muted/20">
              <img
                src="/uploads/selfie.png"
                alt="Absensi"
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/10 to-transparent" />
              <div className="absolute left-6 top-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/90 text-emerald-500 shadow-lg">
                <Clock className="h-6 w-6" />
              </div>
            </div>
            <div className="space-y-3 p-6">
              <div>
                <h2 className="text-xl font-black text-foreground">Absensi</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Masuk ke halaman absensi untuk check-in, check-out, dan melihat riwayat kehadiran.
                </p>
              </div>
              <div className="inline-flex items-center gap-2 text-sm font-bold text-emerald-600">
                Buka Absensi
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </div>
            </div>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Dashboard Overview</h1>
          <div className="mt-1 flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Home</span>
            <span className="h-1 w-1 rounded-full bg-muted-foreground/40" />
            <span className="text-xs font-medium text-primary">Dashboard</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="h-10 rounded-xl bg-card border-border/60 font-semibold gap-2">
            <Calendar className="h-4 w-4" />
            {new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
          </Button>
          <Button variant="outline" size="sm" className="h-10 rounded-xl bg-card border-border/60 font-semibold gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button size="sm" className="h-10 rounded-xl font-semibold gap-2 shadow-lg shadow-primary/20">
            <Plus className="h-4 w-4" />
            New Document
          </Button>
        </div>
      </div>

      <StatusCards />

      <div className="space-y-8">
        <DashboardOverview />
      </div>
    </div>
  );
}
