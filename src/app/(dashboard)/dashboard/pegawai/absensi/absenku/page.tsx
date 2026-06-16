"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowLeft, Camera, Clock3, Loader2, MapPin, ShieldCheck, UserCheck, X, SwitchCamera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { getMyAttendanceToday, submitMyAttendance } from "@/lib/actions/attendance";
import { cn } from "@/lib/utils";

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
  
  const [showFullscreenCamera, setShowFullscreenCamera] = useState(false);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [cameraReady, setCameraReady] = useState(false);
  const [loadingCamera, setLoadingCamera] = useState(false);
  
  const [loadingAttendance, setLoadingAttendance] = useState(true);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [capturedAt, setCapturedAt] = useState<Date | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [todayAttendance, setTodayAttendance] = useState<any>(null);
  const [userInfo, setUserInfo] = useState<{ fullName?: string; role?: string }>({});

  const [mounted, setMounted] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showCheckedOutModal, setShowCheckedOutModal] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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
        
        // Show modal if already checked out
        if (result.data?.attendance?.checkOut) {
          setShowCheckedOutModal(true);
        }
      } else {
        toast.error(result.error);
      }
      setLoadingAttendance(false);
    };

    loadAttendance();
  }, []);

  useEffect(() => {
    if (!showFullscreenCamera || !isMobile) return;

    const startCamera = async () => {
      setLoadingCamera(true);
      setCameraReady(false);
      
      // Stop existing tracks explicitly before switching
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }

      try {
        let stream: MediaStream;
        try {
          // Try with exact constraint first for reliable switching
          stream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: facingMode === "environment" ? { exact: "environment" } : "user",
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
            audio: false,
          });
        } catch (err) {
          // Fallback if exact constraint fails
          stream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: facingMode,
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
            audio: false,
          });
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        setCameraReady(true);
      } catch (error) {
        console.error("Camera access denied:", error);
        toast.error("Gagal mengakses atau menukar kamera.");
        setShowFullscreenCamera(false);
      } finally {
        setLoadingCamera(false);
      }
    };

    startCamera();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, [isMobile, showFullscreenCamera, facingMode]);

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

  const attendanceNote = useMemo<any | null>(() => {
    if (!todayAttendance?.notes) return null;
    try {
      return JSON.parse(todayAttendance.notes);
    } catch {
      return null;
    }
  }, [todayAttendance]);

  const checkInNote = attendanceNote?.checkIn || (attendanceNote?.photoPath ? attendanceNote : null);
  const checkOutNote = attendanceNote?.checkOut || null;

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

    // Handle flip for front camera
    if (facingMode === "user") {
      ctx.translate(width, 0);
      ctx.scale(-1, 1);
    }
    
    ctx.drawImage(video, 0, 0, width, height);

    // Reset transform for drawing text
    if (facingMode === "user") {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    }

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
    setShowFullscreenCamera(false); // Close camera view
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
    <>
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
            <p className="mt-1 text-lg font-black text-foreground" suppressHydrationWarning>{mounted ? currentTime.toLocaleTimeString("id-ID") : "--:--:--"}</p>
            <p className="text-sm text-muted-foreground" suppressHydrationWarning>{mounted ? currentTime.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" }) : "Memuat..."}</p>
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
                Gunakan kamera untuk mengambil foto absensi. Timestamp akan otomatis dicetak ke foto.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5 p-6">
              {isMobile ? (
                <div className="overflow-hidden rounded-[1.5rem] border border-border/60 bg-slate-950/5 p-4 text-center">
                  {todayAttendance?.checkOut ? (
                    <div className="py-12 space-y-5">
                      <div className="h-24 w-24 mx-auto rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 shadow-inner">
                        <ShieldCheck className="h-10 w-10" />
                      </div>
                      <div>
                        <p className="text-base font-bold text-foreground">Absensi Selesai</p>
                        <p className="text-sm text-muted-foreground mt-1 max-w-[250px] mx-auto">Anda sudah melakukan absen pulang hari ini. Selamat beristirahat!</p>
                      </div>
                      <Button 
                        type="button" 
                        onClick={() => setShowCheckedOutModal(true)} 
                        className="h-14 w-full max-w-sm mx-auto rounded-2xl font-bold text-base gap-2 bg-emerald-500 hover:bg-emerald-600 text-white shadow-xl shadow-emerald-500/20"
                      >
                        Lihat Peringatan
                      </Button>
                    </div>
                  ) : capturedImage ? (
                    <div className="space-y-4">
                      <img src={capturedImage} alt="Hasil selfie absensi" className="h-[420px] w-full object-cover rounded-xl shadow-lg" />
                      <Button type="button" variant="outline" onClick={() => setShowFullscreenCamera(true)} className="h-11 w-full rounded-xl font-bold border-pink-200 text-pink-600 hover:bg-pink-50">
                        Ulangi Foto
                      </Button>
                    </div>
                  ) : (
                    <div className="py-12 space-y-5">
                      <div className="h-24 w-24 mx-auto rounded-full bg-pink-500/10 flex items-center justify-center text-pink-500 shadow-inner">
                        <Camera className="h-10 w-10" />
                      </div>
                      <div>
                        <p className="text-base font-bold text-foreground">Siap untuk Absen?</p>
                        <p className="text-sm text-muted-foreground mt-1 max-w-[250px] mx-auto">Anda belum mengambil foto selfie absensi hari ini.</p>
                      </div>
                      <Button 
                        type="button" 
                        onClick={() => setShowFullscreenCamera(true)} 
                        className="h-14 w-full max-w-sm mx-auto rounded-2xl font-bold text-base gap-2 bg-pink-500 hover:bg-pink-600 text-white shadow-xl shadow-pink-500/20"
                      >
                        <Camera className="h-5 w-5" />
                        Buka Kamera
                      </Button>
                    </div>
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

              <Button
                type="button"
                onClick={handleSubmitAttendance}
                disabled={!isMobile || submitting || !capturedImage}
                className="h-14 w-full rounded-2xl font-black text-lg gap-2 mt-4 shadow-xl shadow-primary/20"
              >
                {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <ShieldCheck className="h-5 w-5" />}
                {attendanceButtonLabel}
              </Button>
            </CardContent>
          </Card>

          <div className="space-y-6">


            <Card className="rounded-[2rem] border-none bg-card/70 shadow-xl">
              <CardHeader className="border-b border-border/60 bg-muted/10">
                <CardTitle className="flex items-center gap-2 text-lg font-bold">
                  <Clock3 className="h-5 w-5 text-primary" />
                  Status Hari Ini
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 p-6">
                {loadingAttendance ? (
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Memuat data absensi hari ini...
                  </div>
                ) : todayAttendance ? (
                  <div className="space-y-6">
                    {/* Check In Section */}
                    <div className="space-y-3">
                      <div className="rounded-2xl border border-border/60 bg-emerald-500/5 p-4">
                        <p className="text-xs font-bold uppercase tracking-widest text-emerald-600">Absen Masuk</p>
                        <p className="mt-2 text-xl font-black text-foreground">
                          {todayAttendance.checkIn ? new Date(todayAttendance.checkIn).toLocaleTimeString("id-ID") : "-"}
                        </p>
                        {checkInNote?.locationLabel && (
                          <div className="mt-3 flex items-start gap-2">
                            <MapPin className="mt-0.5 h-4 w-4 text-emerald-500" />
                            <p className="text-xs font-medium text-muted-foreground leading-relaxed">
                              {checkInNote.locationLabel}
                            </p>
                          </div>
                        )}
                      </div>
                      {checkInNote?.photoPath && (
                        <div 
                          className="overflow-hidden rounded-2xl border border-border/60 cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => setSelectedImage(checkInNote.photoPath)}
                        >
                          <img src={checkInNote.photoPath} alt="Foto Absen Masuk" className="h-32 w-full object-cover" />
                        </div>
                      )}
                    </div>

                    {/* Check Out Section */}
                    <div className="space-y-3 pt-2 border-t border-dashed border-border/60">
                      <div className="rounded-2xl border border-border/60 bg-amber-500/5 p-4">
                        <p className="text-xs font-bold uppercase tracking-widest text-amber-600">Absen Pulang</p>
                        <p className="mt-2 text-xl font-black text-foreground">
                          {todayAttendance.checkOut ? new Date(todayAttendance.checkOut).toLocaleTimeString("id-ID") : "Belum Absen"}
                        </p>
                        {checkOutNote?.locationLabel && (
                          <div className="mt-3 flex items-start gap-2">
                            <MapPin className="mt-0.5 h-4 w-4 text-amber-500" />
                            <p className="text-xs font-medium text-muted-foreground leading-relaxed">
                              {checkOutNote.locationLabel}
                            </p>
                          </div>
                        )}
                      </div>
                      {checkOutNote?.photoPath && (
                        <div 
                          className="overflow-hidden rounded-2xl border border-border/60 cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => setSelectedImage(checkOutNote.photoPath)}
                        >
                          <img src={checkOutNote.photoPath} alt="Foto Absen Pulang" className="h-32 w-full object-cover" />
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-border/60 bg-background/40 p-6 text-center">
                    <p className="text-base font-bold text-foreground">Belum ada data absensi hari ini</p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Ambil selfie lalu simpan absensi masuk untuk membuat catatan kehadiran hari ini.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Fullscreen Camera Overlay */}
      {showFullscreenCamera && isMobile && mounted && createPortal(
        <div className="fixed inset-0 z-[9999] h-[100dvh] w-screen bg-black flex flex-col overflow-hidden overscroll-none touch-none animate-in slide-in-from-bottom-full duration-300">
          <div className="relative flex-1 bg-black overflow-hidden flex items-center justify-center">
            {loadingCamera && (
              <div className="absolute inset-0 flex items-center justify-center z-10">
                <Loader2 className="h-10 w-10 text-white animate-spin" />
              </div>
            )}
            
            <video 
              ref={videoRef} 
              muted 
              playsInline 
              className={cn(
                "w-full h-full object-cover", 
                facingMode === "user" ? "scale-x-[-1]" : ""
              )} 
            />
            
            {/* Watermark Overlay Preview */}
            <div className="absolute bottom-6 left-4 right-4 bg-black/50 backdrop-blur-md p-4 rounded-2xl text-white border border-white/10 shadow-2xl">
              <p className="font-bold text-lg text-white/90">{systemName}</p>
              <p className="text-sm mt-1 opacity-90 font-medium" suppressHydrationWarning>Tanggal : {mounted ? currentTime.toLocaleDateString("id-ID") : "-"} | Waktu : {mounted ? currentTime.toLocaleTimeString("id-ID") : "-"}</p>
              <div className="flex items-start gap-2 mt-2 pt-2 border-t border-white/10 opacity-80">
                <MapPin className="h-4 w-4 shrink-0 mt-0.5 text-pink-400" />
                <p className="text-xs line-clamp-2 leading-relaxed">{locationLabel}</p>
              </div>
            </div>
          </div>
          
          {/* Controls Bar */}
          <div className="h-36 bg-black flex items-center justify-around px-6 pb-safe border-t border-white/10">
            <button 
              type="button"
              onClick={() => setShowFullscreenCamera(false)}
              className="h-12 w-12 rounded-full bg-rose-500/20 text-rose-500 flex items-center justify-center hover:bg-rose-500/40 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>

            <button
              type="button"
              onClick={captureSelfie}
              disabled={!cameraReady || loadingCamera}
              className="h-[80px] w-[80px] rounded-full border-[4px] border-white p-1 flex items-center justify-center disabled:opacity-50"
            >
              <div className="h-full w-full rounded-full bg-white transition-transform active:scale-90" />
            </button>

            <button
              type="button"
              onClick={() => setFacingMode(prev => prev === "user" ? "environment" : "user")}
              className="h-12 w-12 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors"
            >
              <SwitchCamera className="h-5 w-5" />
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* Image Preview Overlay */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-[300] bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-2xl w-full">
            <Button
              variant="outline"
              size="icon"
              className="absolute -top-12 right-0 rounded-full bg-white/10 text-white border-white/20 hover:bg-white/20"
              onClick={() => setSelectedImage(null)}
            >
              <X className="h-5 w-5" />
            </Button>
            <img src={selectedImage} alt="Preview Foto Absensi" className="w-full h-auto max-h-[85vh] object-contain rounded-2xl" />
          </div>
        </div>
      )}

      {/* Checked Out Modal Overlay */}
      {showCheckedOutModal && createPortal(
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-card w-full max-w-sm rounded-[2rem] p-6 shadow-2xl animate-in zoom-in-95 duration-300 text-center border border-border/50">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500 mb-5 ring-8 ring-emerald-500/5">
              <ShieldCheck className="h-10 w-10" />
            </div>
            <h2 className="text-2xl font-black text-foreground mb-2">Terima Kasih!</h2>
            <p className="text-sm text-muted-foreground mb-8 leading-relaxed px-2">
              Anda sudah melakukan absensi pulang hari ini. Anda tidak bisa absen kembali. Selamat beristirahat dan sampai jumpa besok!
            </p>
            <div className="space-y-3">
              <Button
                type="button"
                onClick={() => {
                  setShowCheckedOutModal(false);
                  window.location.href = "/dashboard";
                }}
                className="w-full h-12 rounded-2xl font-bold bg-pink-500 hover:bg-pink-600 text-white shadow-lg shadow-pink-500/20"
              >
                Kembali ke Beranda
              </Button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
