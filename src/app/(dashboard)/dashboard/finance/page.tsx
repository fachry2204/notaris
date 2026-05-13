"use client";

import React, { useState } from "react";
import { FinanceOverview } from "@/components/finance/FinanceOverview";
import { Button } from "@/components/ui/button";
import { Plus, Download, ArrowLeft, TrendingUp, TrendingDown, Wallet, Receipt } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function FinancePage() {
  const [view, setView] = useState<"overview" | "selection">("overview");

  if (view === "selection") {
    return (
      <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700 py-10">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Tambah Transaksi Keuangan</h1>
          <p className="text-sm text-muted-foreground">Pilih jenis transaksi yang ingin Anda catat hari ini.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Uang Masuk */}
          <div 
            className="group relative flex flex-col items-center justify-center p-8 rounded-[2rem] border-2 border-muted bg-card hover:border-emerald-500 hover:shadow-2xl hover:shadow-emerald-500/10 transition-all duration-500 cursor-pointer overflow-hidden"
            onClick={() => alert("Form Uang Masuk akan segera hadir!")}
          >
            <div className="h-16 w-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-500">
              <TrendingUp className="h-8 w-8 text-emerald-500" />
            </div>
            <h2 className="text-lg font-bold mb-2 text-center">Uang Masuk</h2>
            <p className="text-center text-[10px] text-muted-foreground leading-relaxed">
              Catat pendapatan dari client, pelunasan berkas, atau modal tambahan.
            </p>
            <div className="absolute top-3 right-3 opacity-10 group-hover:opacity-100 transition-opacity">
              <Receipt className="h-5 w-5 text-emerald-500" />
            </div>
          </div>

          {/* Uang Keluar */}
          <div 
            className="group relative flex flex-col items-center justify-center p-8 rounded-[2rem] border-2 border-muted bg-card hover:border-rose-500 hover:shadow-2xl hover:shadow-rose-500/10 transition-all duration-500 cursor-pointer overflow-hidden"
            onClick={() => alert("Form Uang Keluar akan segera hadir!")}
          >
            <div className="h-16 w-16 rounded-2xl bg-rose-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-500">
              <TrendingDown className="h-8 w-8 text-rose-500" />
            </div>
            <h2 className="text-lg font-bold mb-2 text-center">Uang Keluar</h2>
            <p className="text-center text-[10px] text-muted-foreground leading-relaxed">
              Catat biaya operasional, gaji pegawai, ATK, atau pengeluaran kantor lainnya.
            </p>
            <div className="absolute top-3 right-3 opacity-10 group-hover:opacity-100 transition-opacity">
              <Wallet className="h-5 w-5 text-rose-500" />
            </div>
          </div>
        </div>

        <div className="flex justify-center pt-4">
          <Button 
            variant="ghost" 
            size="sm"
            className="gap-2 text-muted-foreground hover:text-foreground rounded-xl h-10 px-6 text-xs"
            onClick={() => setView("overview")}
          >
            <ArrowLeft className="h-3 w-3" />
            Kembali ke Monitoring
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Monitoring Keuangan</h1>
          <p className="text-muted-foreground">
            Rekap pendapatan, pengeluaran, dan status tagihan client.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="rounded-2xl h-12 px-6 border-pink-200 text-pink-600 hover:bg-pink-50">
            <Download className="mr-2 h-4 w-4" />
            Export PDF
          </Button>
          <Button 
            className="rounded-2xl h-12 px-8 bg-pink-500 hover:bg-pink-600 shadow-lg shadow-pink-500/20 gap-2 font-bold"
            onClick={() => setView("selection")}
          >
            <Plus className="h-5 w-5" />
            Tambah Keuangan
          </Button>
        </div>
      </div>

      <FinanceOverview />
    </div>
  );
}
