"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowLeft, Camera, Clock3, Loader2, MapPin, ShieldCheck, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { getMyAttendanceToday, submitMyAttendance } from "@/lib/actions/attendance";

type AttendanceNote = {
  locationLabel?: string;
  latitude?: number | null;
  longitude?: number | null;
  systemName?: string;
  photoPath?: string | null;
  submittedAt?: string;
};

export default function AbsenkuPage() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [systemName, setSystemName] = useState("NOTARIS DIGITAL");
  const [locationLabel, setLocationLabel] = useState("Mengambil lokasi...");
  const [coords, setCoords] = useState<{ latitude: number | null; longitude: number | null }>({
    latitude: null,
    longitude: null,
  });
  const [cameraReady, setCameraReady] = useState(false);
  const [loadingCamera, setLoadingCamera] = useState(true);
  const [loadingAttendance, setLoadingAttendance] = useState(true);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [capturedAt, setCapturedAt] = useState<Date | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [todayAttendance, setTodayAttendance] = useState<any>(null);
  const [userInfo, setUserInfo] = useState<{ fullName?: string; role?: string }>({});

  useEffect(() => {
    const media = window.matchMedia("(max-width: 768px)");
    const apply = () => setIsMobile(media.matches);
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const loadSystemName = async () => {
      try {
        const res = await fetch("/api/settings", { cache: "no-store" });
        const result = await res.json();
        if (res.ok && result.success) {
          setSystemName(result.data?.general?.appName || "NOTARIS DIGITAL");
        }
      } catch (error) {
        console.error("Failed to load system name:", error);
      }
    };

    loadSystemName();
  }, []);

  useEffect(() => {
    const loadAttendance = async () => {
      setLoadingAttendance(true);
      const result = await getMyAttendanceToday();
      if (result.success) {
        setTodayAttendance(result.data?.attendance || null);
        setUserInfo(result.data?.user || {});
      } else {
        toast.error(result.error);
      }
      setLoadingAttendance(false);
    };

    loadAttendance();
  }, []);

  useEffect(() => {
    const startCamera = async () => {
      if (!isMobile) {
        setLoadingCamera(false);
        setCameraReady(false);
        return;
      }
      setLoadingCamera(true);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "user",
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        setCameraReady(true);
      } catch (error) {
        console.error("Camera access denied:", error);
        toast.error("Izin kamera diperlukan untuk melakukan absensi selfie.");
      } finally {
        setLoadingCamera(false);
      }
    };

    startCamera();

    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, [isMobile]);

  useEffect(() => {
    const loadLocation = async () => {
      if (!isMobile) {
        setLocationLabel("Mohon buka menu absensi melalui perangkat mobile.");
        return;
      }
      if (!navigator.geolocation) {
        setLocationLabel("GPS tidak didukung di browser ini.");
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const latitude = position.coords.latitude;
          const longitude = position.coords.longitude;
          setCoords({ latitude, longitude });
          const fallbackLabel = `Lat ${latitude.toFixed(6)}, Lng ${longitude.toFixed(6)}`;

          try {
            const res = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`
            );
            const data = await res.json();
            setLocationLabel(data.display_name || fallbackLabel);
          } catch {
            setLocationLabel(fallbackLabel);
          }
        },
        () => {
          setLocationLabel("Lokasi GPS tidak diizinkan.");
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    };

    loadLocation();
  }, [isMobile]);

  const attendanceNote = useMemo<AttendanceNote | null>(() => {
    if (!todayAttendance?.notes) return null;
    try {
      return JSON.parse(todayAttendance.notes);
    } catch {
      return null;
    }
  }, [todayAttendance]);

  const captureSelfie = () => {
    const video = videoRef.current;
    if (!video) {
      toast.error("Kamera belum siap.");
      return;
    }

    const captureTime = new Date();
    const canvas = document.createElement("canvas");
    const width = video.videoWidth || 1280;
    const height = video.videoHeight || 720;
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      toast.error("Gagal memproses foto selfie.");
      return;
    }

    ctx.drawImage(video, 0, 0, width, height);

    const overlayHeight = 120;
    ctx.fillStyle = "rgba(15, 23, 42, 0.72)";
    ctx.fillRect(0, height - overlayHeight, width, overlayHeight);

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 28px Arial";
    ctx.fillText(systemName, 28, height - 78);

    ctx.font = "22px Arial";
    ctx.fillText(
      `Tanggal : ${captureTime.toLocaleDateString("id-ID")}  |  Waktu : ${captureTime.toLocaleTimeString("id-ID")}`,
      28,
      height - 44
    );

    const locationText = `Lokasi Absen : ${locationLabel}`;
    ctx.fillText(locationText.length > 95 ? `${locationText.slice(0, 95)}...` : locationText, 28, height - 12);

    setCapturedImage(canvas.toDataURL("image/png"));
    setCapturedAt(captureTime);
    toast.success("Selfie berhasil diambil.");
  };

  const handleSubmitAttendance = async () => {
    if (!capturedImage) {
      toast.error("Silakan ambil foto selfie terlebih dahulu.");
      return;
    }

    setSubmitting(true);
    const result = await submitMyAttendance({
      capturedImage,
      locationLabel,
      latitude: coords.latitude,
      longitude: coords.longitude,
      systemName,
    });

    if (result.success) {
      setTodayAttendance(result.data || null);
      toast.success(todayAttendance?.checkIn ? "Absensi pulang berhasil disimpan." : "Absensi masuk berhasil disimpan.");
    } else {
      toast.error(result.error);
    }

    setSubmitting(false);
  };

  const attendanceButtonLabel = todayAttendance?.checkIn && !todayAttendance?.checkOut ? "Simpan Absensi Pulang" : "Simpan Absensi Masuk";

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {!isMobile && (
        <Card className="border border-amber-500/30 bg-amber-500/10 rounded-2xl">
          <CardContent className="p-5">
            <p className="text-sm font-bold text-amber-700">Mohon Buka Di Mobile / Aplikasi</p>
            <p className="mt-1 text-xs text-amber-700/80">
              Halaman ini membutuhkan kamera dan lokasi GPS. Silakan buka melalui perangkat mobile untuk melakukan absensi.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <Link href="/dashboard/pegawai/absensi" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Kembali ke Absensi Pegawai
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Absenku</h1>
            <p className="text-sm text-muted-foreground">
              Selfie absensi dengan timestamp otomatis, lokasi GPS, dan waktu realtime.
            </p>
          </div>
        </div>
        <div className="rounded-2xl border border-border/60 bg-card px-5 py-3 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Waktu Sekarang</p>
          <p className="mt-1 text-lg font-black text-foreground">{currentTime.toLocaleTimeString("id-ID")}</p>
          <p className="text-sm text-muted-foreground">{currentTime.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="overflow-hidden rounded-[2rem] border-none bg-card/70 shadow-xl">
          <CardHeader className="border-b border-border/60 bg-muted/10">
            <CardTitle className="flex items-center gap-2 text-lg font-bold">
              <Camera className="h-5 w-5 text-primary" />
              Kamera Selfie Absensi
            </CardTitle>
            <CardDescription>
              Gunakan kamera depan untuk mengambil foto absensi. Timestamp akan otomatis dicetak ke foto.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5 p-6">
            {isMobile ? (
              <div className="overflow-hidden rounded-[1.5rem] border border-border/60 bg-slate-950">
                {capturedImage ? (
                  <img src={capturedImage} alt="Hasil selfie absensi" className="h-[420px] w-full object-cover" />
                ) : (
                  <video ref={videoRef} muted playsInline className="h-[420px] w-full object-cover scale-x-[-1]" />
                )}
              </div>
            ) : (
              <div className="flex h-[420px] items-center justify-center rounded-[1.5rem] border border-dashed border-border/60 bg-muted/10 text-center">
                <div className="max-w-sm px-6">
                  <p className="text-base font-bold text-foreground">Kamera tidak tersedia di tampilan desktop</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Silakan buka halaman ini melalui perangkat mobile untuk mengambil selfie absensi.
                  </p>
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              <Button type="button" onClick={captureSelfie} disabled={!isMobile || !cameraReady || loadingCamera} className="h-11 rounded-xl px-6 font-bold gap-2">
                {loadingCamera ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                Ambil Selfie
              </Button>
              {capturedImage && (
                <Button type="button" variant="outline" onClick={() => setCapturedImage(null)} className="h-11 rounded-xl px-6 font-bold">
                  Ulangi Foto
                </Button>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-border/60 bg-muted/10 p-4">
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Nama Sistem</p>
                <p className="mt-2 text-base font-black text-foreground">{systemName}</p>
              </div>
              <div className="rounded-2xl border border-border/60 bg-muted/10 p-4">
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Lokasi Absen</p>
                <p className="mt-2 text-sm font-medium text-foreground leading-relaxed">{locationLabel}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="rounded-[2rem] border-none bg-card/70 shadow-xl">
            <CardHeader className="border-b border-border/60 bg-muted/10">
              <CardTitle className="flex items-center gap-2 text-lg font-bold">
                <UserCheck className="h-5 w-5 text-primary" />
                Data Absen Otomatis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-6">
              <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Nama Pegawai</p>
                <p className="mt-2 text-base font-black text-foreground">{userInfo.fullName || "-"}</p>
              </div>
              <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Tanggal</p>
                <p className="mt-2 text-base font-black text-foreground">{currentTime.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</p>
              </div>
              <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Waktu</p>
                <p className="mt-2 text-base font-black text-foreground">{currentTime.toLocaleTimeString("id-ID")}</p>
              </div>
              <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Tag Lokasi GPS</p>
                <div className="mt-2 flex items-start gap-2">
                  <MapPin className="mt-0.5 h-4 w-4 text-primary" />
                  <p className="text-sm font-medium text-foreground leading-relaxed">{locationLabel}</p>
                </div>
              </div>
              <Button
                type="button"
                onClick={handleSubmitAttendance}
                disabled={!isMobile || submitting || !capturedImage}
                className="h-12 w-full rounded-2xl font-bold text-base gap-2"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                {attendanceButtonLabel}
              </Button>
            </CardContent>
          </Card>

          <Card className="rounded-[2rem] border-none bg-card/70 shadow-xl">
            <CardHeader className="border-b border-border/60 bg-muted/10">
              <CardTitle className="flex items-center gap-2 text-lg font-bold">
                <Clock3 className="h-5 w-5 text-primary" />
                Status Hari Ini
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-6">
              {loadingAttendance ? (
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Memuat data absensi hari ini...
                </div>
              ) : todayAttendance ? (
                <>
                  <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Check In</p>
                    <p className="mt-2 text-base font-black text-foreground">
                      {todayAttendance.checkIn ? new Date(todayAttendance.checkIn).toLocaleTimeString("id-ID") : "-"}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Check Out</p>
                    <p className="mt-2 text-base font-black text-foreground">
                      {todayAttendance.checkOut ? new Date(todayAttendance.checkOut).toLocaleTimeString("id-ID") : "Belum absen pulang"}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Lokasi Terakhir</p>
                    <p className="mt-2 text-sm font-medium text-foreground leading-relaxed">{attendanceNote?.locationLabel || "-"}</p>
                  </div>
                  {attendanceNote?.photoPath && (
                    <div className="overflow-hidden rounded-2xl border border-border/60">
                      <img src={attendanceNote.photoPath} alt="Foto absensi terakhir" className="h-48 w-full object-cover" />
                    </div>
                  )}
                </>
              ) : (
                <div className="rounded-2xl border border-dashed border-border/60 bg-background/40 p-6 text-center">
                  <p className="text-base font-bold text-foreground">Belum ada data absensi hari ini</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Ambil selfie lalu simpan absensi masuk untuk membuat catatan kehadiran hari ini.
                  </p>
                </div>
              )}

              {capturedAt && (
                <p className="text-xs text-muted-foreground italic">
                  Foto terakhir diambil pada {capturedAt.toLocaleDateString("id-ID")} pukul {capturedAt.toLocaleTimeString("id-ID")}.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
