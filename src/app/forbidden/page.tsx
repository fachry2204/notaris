"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Home, LockKeyhole, ShieldAlert } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { Suspense } from "react";

function ForbiddenContent() {
  const searchParams = useSearchParams();
  const from = searchParams.get("from") || "/dashboard";
  const section = searchParams.get("section") || "halaman ini";

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-100 px-4 py-10">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -left-20 top-10 h-72 w-72 rounded-full bg-pink-200/30 blur-3xl" />
        <div className="absolute -right-16 bottom-8 h-80 w-80 rounded-full bg-violet-200/25 blur-3xl" />
      </div>

      <Card className="relative z-10 w-full max-w-2xl overflow-hidden rounded-[2rem] border border-pink-100 bg-white shadow-2xl shadow-slate-300/40">
        <div className="h-2 w-full bg-gradient-to-r from-pink-500 via-fuchsia-500 to-violet-500" />
        <CardHeader className="px-8 pb-4 pt-8 text-center">
          <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-[1.75rem] bg-pink-500/10 text-pink-500 shadow-lg shadow-pink-500/10">
            <ShieldAlert className="h-10 w-10" />
          </div>
          <div className="mx-auto mb-3 inline-flex items-center gap-2 rounded-full border border-pink-200 bg-pink-50 px-4 py-1.5 text-sm font-bold text-pink-600">
            <LockKeyhole className="h-4 w-4" />
            403 / Akses Ditolak
          </div>
          <CardTitle className="text-3xl font-black tracking-tight text-slate-900">
            Anda Tidak Memiliki Izin
          </CardTitle>
          <CardDescription className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-500">
            Role akun Anda tidak memiliki permission untuk membuka {section}. Hubungi administrator jika Anda merasa akses ini seharusnya tersedia.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6 px-8 pb-8">
          <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50/80 p-5">
            <p className="text-xs font-black uppercase tracking-widest text-slate-500">Halaman Yang Ditolak</p>
            <p className="mt-2 break-all text-sm font-semibold text-slate-900">{from}</p>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <Link
              href="/dashboard"
              className={cn(
                buttonVariants(),
                "h-12 rounded-2xl text-base font-bold shadow-lg shadow-pink-500/20"
              )}
            >
              <Home className="h-4 w-4" />
              Kembali ke Dashboard
            </Link>
            <Link
              href={from}
              className={cn(
                buttonVariants({ variant: "outline" }),
                "h-12 rounded-2xl border-slate-200 text-base font-bold"
              )}
            >
              <ArrowLeft className="h-4 w-4" />
              Coba Lagi
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ForbiddenPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="h-10 w-10 animate-spin rounded-full border-4 border-pink-500 border-t-transparent" /></div>}>
      <ForbiddenContent />
    </Suspense>
  );
}
