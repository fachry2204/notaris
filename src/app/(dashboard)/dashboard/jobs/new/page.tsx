"use client";

import React from "react";
import { Building2, User2, Landmark, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NewJobSelectionPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700 py-10">
      <div className="text-center space-y-1">
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Registrasi Berkas Baru</h1>
        <p className="text-sm text-muted-foreground">Pilih kategori berkas yang ingin Anda daftarkan.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Badan Hukum */}
        <Link href="/dashboard/jobs/new/badan-hukum" className="block">
          <div className="group h-full relative flex flex-col items-center justify-center p-6 rounded-[2rem] border-2 border-muted bg-card hover:border-pink-500 hover:shadow-2xl hover:shadow-pink-500/10 transition-all duration-500 cursor-pointer overflow-hidden text-center">
            <div className="h-16 w-16 rounded-xl bg-pink-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-500">
              <Building2 className="h-8 w-8 text-pink-500" />
            </div>
            <h2 className="text-base font-bold mb-2">Badan Hukum / Usaha</h2>
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              Pengurusan berkas untuk PT, CV, Yayasan, atau Koperasi.
            </p>
          </div>
        </Link>

        {/* Non Badan Hukum */}
        <Link href="/dashboard/jobs/new/non-badan-hukum" className="block">
          <div className="group h-full relative flex flex-col items-center justify-center p-6 rounded-[2rem] border-2 border-muted bg-card hover:border-pink-500 hover:shadow-2xl hover:shadow-pink-500/10 transition-all duration-500 cursor-pointer overflow-hidden text-center">
            <div className="h-16 w-16 rounded-xl bg-pink-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-500">
              <User2 className="h-8 w-8 text-pink-500" />
            </div>
            <h2 className="text-base font-bold mb-2">Non Badan Hukum</h2>
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              Pengurusan berkas perorangan, kuasa, atau perjanjian individu.
            </p>
          </div>
        </Link>

        {/* PPAT */}
        <Link href="/dashboard/jobs/new/ppat" className="block">
          <div className="group h-full relative flex flex-col items-center justify-center p-6 rounded-[2rem] border-2 border-muted bg-card hover:border-pink-500 hover:shadow-2xl hover:shadow-pink-500/10 transition-all duration-500 cursor-pointer overflow-hidden text-center">
            <div className="h-16 w-16 rounded-xl bg-pink-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-500">
              <Landmark className="h-8 w-8 text-pink-500" />
            </div>
            <h2 className="text-base font-bold mb-2">PPAT</h2>
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              Pengurusan Akta Jual Beli, Hibah, APHB, dan Hak Tanggungan.
            </p>
          </div>
        </Link>
      </div>

      <div className="flex justify-center pt-4">
        <Link href="/dashboard/jobs/inbound">
          <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground text-xs font-bold">
            <ArrowLeft className="h-3 w-3" />
            Kembali ke Daftar Berkas
          </Button>
        </Link>
      </div>
    </div>
  );
}
