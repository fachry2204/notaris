"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, FileText, CheckCircle2, Clock, Receipt, Banknote, Calendar } from "lucide-react";
import { getPublicJobStatus } from "@/lib/actions/public";
import { format } from "date-fns";
import { id } from "date-fns/locale";

const statusConfig = {
  PENDING: { label: "Pending", color: "bg-amber-500/10 text-amber-500 border-amber-500/20" },
  PROSES: { label: "Proses", color: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
  REVISI: { label: "Revisi", color: "bg-rose-500/10 text-rose-500 border-rose-500/20" },
  REVISI_PROSES: { label: "Revisi Proses", color: "bg-orange-500/10 text-orange-500 border-orange-500/20" },
  VERIFIKASI: { label: "Menunggu verifikasi", color: "bg-purple-500/10 text-purple-500 border-purple-500/20" },
  SELESAI: { label: "Selesai", color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" },
  CANCELLED: { label: "Dibatalkan", color: "bg-slate-500/10 text-slate-500 border-slate-500/20" },
};

function CekBerkasContent() {
  const searchParams = useSearchParams();
  const initialNomor = searchParams.get("nomor");

  const [trackingCode, setTrackingCode] = useState(initialNomor || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<any>(null);

  const fetchStatus = async (code: string) => {
    if (!code.trim()) {
      setError("Silakan masukkan Nomor Berkas.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    const res = await getPublicJobStatus(code.trim());
    if (res.success && res.data) {
      setResult(res.data);
    } else {
      setError(res.error || "Berkas tidak ditemukan.");
    }
    setLoading(false);
  };

  useEffect(() => {
    if (initialNomor) {
      fetchStatus(initialNomor);
    }
  }, [initialNomor]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    fetchStatus(trackingCode);
  };

  const formatCurrency = (amount: number | string) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(Number(amount) || 0);
  };

  const getPaymentDescription = (desc: string | null | undefined) => {
    if (!desc) return "Pembayaran Masuk";
    try {
      const parsed = JSON.parse(desc);
      if (parsed && typeof parsed === "object") {
        return "Pembayaran Tagihan / Invoice";
      }
    } catch (e) {
      return desc;
    }
    return desc;
  };

  return (
    <div 
      className={`min-h-screen relative flex flex-col items-center px-4 sm:px-6 lg:px-8 bg-muted/20 transition-all duration-700 ${(!result && !error) ? 'justify-center py-0' : 'py-12'}`}
      style={{ backgroundImage: 'url("/uploads/bg.jpg")', backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed' }}
    >
      <div className={`w-full max-w-3xl space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700 relative z-10 transition-all ${(!result && !error) ? '-mt-20' : ''}`}>
        <div className="text-center space-y-2">
          <div className="mx-auto h-16 w-16 bg-pink-500/10 rounded-2xl flex items-center justify-center mb-6">
            <Search className="h-8 w-8 text-pink-500" />
          </div>
          <h1 className="text-3xl font-black tracking-tight text-foreground">Cek Status Berkas</h1>
          <p className="text-muted-foreground font-medium">Masukkan Nomor Berkas Anda untuk melacak progress dan tagihan.</p>
        </div>

        <Card className="border-none shadow-2xl shadow-pink-500/5 rounded-3xl overflow-hidden bg-card/60 backdrop-blur-xl">
          <CardContent className="p-2 sm:p-2">
            <form onSubmit={handleSearch} className="relative flex flex-col sm:block">
              <div className="relative flex items-center w-full">
                <Search className="absolute left-4 sm:left-5 h-5 w-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Contoh: BHM-2026-0001"
                  className="pl-12 sm:pl-14 pr-4 sm:pr-36 h-14 sm:h-14 text-base sm:text-lg font-bold bg-transparent border-none focus-visible:ring-0 placeholder:text-muted-foreground/50 rounded-2xl w-full"
                  value={trackingCode}
                  onChange={(e) => setTrackingCode(e.target.value.toUpperCase())}
                />
              </div>
              <Button 
                type="submit" 
                disabled={loading}
                className="mt-2 sm:mt-0 sm:absolute sm:right-2 sm:top-2 h-12 sm:h-10 w-full sm:w-auto px-5 sm:px-8 rounded-xl font-bold text-xs sm:text-sm bg-pink-500 hover:bg-pink-600 text-white shadow-md shadow-pink-500/20 transition-all active:scale-95"
              >
                {loading ? "Mencari..." : "Lacak Berkas"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {error && (
          <div className="p-6 bg-rose-500/10 border-2 border-rose-500/20 rounded-3xl text-center">
            <p className="text-rose-600 font-bold">{error}</p>
          </div>
        )}

        {result && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Job Details Card */}
            <Card className="border-none shadow-xl shadow-primary/5 rounded-[2rem] overflow-hidden">
              <CardHeader className="bg-muted/30 border-b border-border/50 pb-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <CardDescription className="font-bold text-xs uppercase tracking-widest text-pink-500 mb-1">Informasi Berkas</CardDescription>
                    <CardTitle className="text-2xl font-black">{result.job.trackingCode}</CardTitle>
                  </div>
                  <Badge className={`px-4 py-1.5 text-xs font-black uppercase tracking-widest rounded-xl ${statusConfig[result.job.status as keyof typeof statusConfig]?.color || statusConfig.PENDING.color}`}>
                    {statusConfig[result.job.status as keyof typeof statusConfig]?.label || result.job.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-6 sm:p-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Jenis Pekerjaan</p>
                    <p className="text-base font-bold text-foreground flex items-start gap-2">
                      <FileText className="h-5 w-5 text-pink-500 shrink-0 mt-0.5" />
                      {result.job.title}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Client / Perusahaan</p>
                    <p className="text-base font-bold text-foreground">{result.job.clientName || result.job.companyName || "-"}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Status Invoice / Tagihan</p>
                    <Badge className={`px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-lg ${
                      result.job.invoiceStatus === "PAYMENT" ? "bg-emerald-500/10 text-emerald-600" :
                      result.job.invoiceStatus === "DP" ? "bg-blue-500/10 text-blue-600" :
                      "bg-amber-500/10 text-amber-600"
                    }`}>
                      {result.job.invoiceStatus || "PENDING"}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Tanggal Registrasi</p>
                    <p className="text-sm font-semibold flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      {result.job.createdAt ? format(new Date(result.job.createdAt), "dd MMMM yyyy", { locale: id }) : "-"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Invoices List */}
            {result.invoices && result.invoices.length > 0 && (
              <Card className="border-none shadow-xl shadow-primary/5 rounded-[2rem] overflow-hidden">
                <CardHeader className="bg-muted/30 border-b border-border/50">
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <Receipt className="h-5 w-5 text-blue-500" />
                    Daftar Penagihan
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-border/50">
                    {result.invoices.map((inv: any, idx: number) => (
                      <div key={idx} className="p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            <span className="font-black text-sm">{inv.invoiceNumber}</span>
                            <Badge variant={inv.status === "Lunas" ? "default" : "outline"} className={
                              inv.status === "Lunas" ? "bg-emerald-500 hover:bg-emerald-600" : 
                              inv.status === "Belum Bayar" ? "text-amber-600 border-amber-200 bg-amber-50" : ""
                            }>
                              {inv.status}
                            </Badge>
                          </div>
                          <p className="text-xs font-semibold text-muted-foreground mt-1">
                            {inv.date ? format(new Date(inv.date), "dd MMM yyyy", { locale: id }) : "-"} 
                            {inv.dueDate && ` • Jatuh Tempo: ${format(new Date(inv.dueDate), "dd MMM yyyy", { locale: id })}`}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Total Tagihan</p>
                          <p className="text-xl font-black text-foreground">{formatCurrency(inv.amount)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Payment History */}
            {result.payments && result.payments.length > 0 && (
              <Card className="border-none shadow-xl shadow-primary/5 rounded-[2rem] overflow-hidden">
                <CardHeader className="bg-muted/30 border-b border-border/50">
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <Banknote className="h-5 w-5 text-emerald-500" />
                    Riwayat Pembayaran
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-border/50">
                    {result.payments.filter((p: any) => p.type === "INCOME").map((payment: any, idx: number) => (
                      <div key={idx} className="p-4 sm:p-6 flex items-center justify-between gap-4 hover:bg-muted/10 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                          </div>
                          <div>
                            <p className="font-bold text-sm line-clamp-2">{getPaymentDescription(payment.description)}</p>
                            <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 mt-0.5">
                              <Clock className="h-3 w-3" />
                              {payment.date ? format(new Date(payment.date), "dd MMMM yyyy, HH:mm", { locale: id }) : "-"}
                            </p>
                          </div>
                        </div>
                        <span className="font-black text-emerald-600">+{formatCurrency(payment.amount)}</span>
                      </div>
                    ))}
                    {result.payments.filter((p: any) => p.type === "INCOME").length === 0 && (
                      <div className="p-8 text-center text-muted-foreground text-sm font-semibold">
                        Belum ada riwayat pembayaran untuk berkas ini.
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {(!result.payments || result.payments.length === 0) && (!result.invoices || result.invoices.length === 0) && (
              <div className="text-center p-8 bg-card rounded-3xl border border-dashed border-border text-muted-foreground font-semibold text-sm">
                Belum ada data tagihan atau pembayaran untuk berkas ini.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function CekBerkasPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-muted/20 flex items-center justify-center">Memuat...</div>}>
      <CekBerkasContent />
    </Suspense>
  );
}
