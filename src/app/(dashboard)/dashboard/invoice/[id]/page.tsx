"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getInvoiceById, deleteInvoice } from "@/lib/actions/invoice";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Printer, Send, Receipt, Calendar, CheckCircle2, FileText, Banknote, Edit, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { toast } from "sonner";

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const invoiceId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [invoice, setInvoice] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const res = await getInvoiceById(invoiceId);
      if (res.success && res.data) {
        setInvoice(res.data);
      } else {
        toast.error(res.error || "Gagal memuat invoice.");
        router.push("/dashboard/invoice");
      }
      setLoading(false);
    };
    if (invoiceId) load();
  }, [invoiceId, router]);

  const handleDelete = async () => {
    if (window.confirm("Apakah Anda yakin ingin menghapus invoice ini? Tindakan ini tidak dapat dibatalkan dan akan mereset status tagihan berkas.")) {
      setIsDeleting(true);
      const res = await deleteInvoice(invoice.id);
      if (res.success) {
        toast.success("Invoice berhasil dihapus");
        router.push("/dashboard/invoice");
      } else {
        toast.error(res.error || "Gagal menghapus invoice");
        setIsDeleting(false);
      }
    }
  };

  const formatCurrency = (amount: number | string) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(Number(amount) || 0);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Lunas":
        return <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 px-3 py-1 text-sm">Lunas</Badge>;
      case "Belum Bayar":
        return <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20 px-3 py-1 text-sm">Belum Bayar</Badge>;
      case "DP Bayar":
        return <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/20 px-3 py-1 text-sm">DP Bayar</Badge>;
      case "Jatuh Tempo":
        return <Badge variant="destructive" className="bg-red-500/10 text-red-600 border-red-500/20 px-3 py-1 text-sm">Jatuh Tempo</Badge>;
      default:
        return <Badge variant="secondary" className="px-3 py-1 text-sm">{status}</Badge>;
    }
  };

  const getParsedInvoice = (desc: string | null | undefined) => {
    if (!desc) return { items: [{ description: "Pembayaran Masuk", amount: invoice?.amount || 0 }] };
    try {
      const parsed = JSON.parse(desc);
      if (Array.isArray(parsed)) {
        return { items: parsed };
      }
      return parsed;
    } catch (e) {
      return { items: [{ description: desc, amount: invoice?.amount || 0 }] };
    }
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

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-pink-500 border-t-transparent" />
      </div>
    );
  }

  if (!invoice) return null;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border shadow-sm">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="icon" 
            className="h-10 w-10 rounded-xl"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-black tracking-tight flex items-center gap-3">
              Detail Invoice
              {getStatusBadge(invoice.status)}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {invoice.invoiceNumber} • Dibuat pada {format(new Date(invoice.date), "dd MMM yyyy", { locale: id })}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button 
            variant="outline" 
            size="sm"
            className="h-8 rounded-lg px-3 border-amber-200 text-amber-600 hover:bg-amber-50 hover:text-amber-700 font-bold text-xs"
            onClick={() => router.push(`/dashboard/invoice/${invoice.id}/edit`)}
          >
            <Edit className="mr-1.5 h-3.5 w-3.5" />
            Edit
          </Button>
          <Button 
            variant="destructive" 
            size="sm"
            disabled={isDeleting}
            className="h-8 rounded-lg px-3 shadow-sm shadow-red-500/20 font-bold text-xs"
            onClick={handleDelete}
          >
            <Trash2 className="mr-1.5 h-3.5 w-3.5" />
            {isDeleting ? "Menghapus..." : "Hapus"}
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            className="h-8 rounded-lg px-3 border-pink-500/30 text-pink-600 hover:bg-pink-50 hover:text-pink-700 font-bold text-xs"
            onClick={() => {
              toast.success("Mempersiapkan dokumen untuk dicetak...");
              setTimeout(() => {
                window.open('/print/invoice/' + invoice.id, '_blank');
              }, 500);
            }}
          >
            <Printer className="mr-1.5 h-3.5 w-3.5" />
            Cetak PDF
          </Button>
          <Button 
            size="sm"
            className="h-8 rounded-lg px-3 bg-pink-500 hover:bg-pink-600 text-white shadow-md shadow-pink-500/20 font-bold text-xs"
            onClick={() => toast.success("Invoice berhasil dikirim ke email client.")}
          >
            <Send className="mr-1.5 h-3.5 w-3.5" />
            Kirim Email
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* KOLOM KIRI (INFO) */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="rounded-[2rem] border-none shadow-md overflow-hidden bg-white">
            <div className="h-3 w-full bg-gradient-to-r from-pink-500 to-rose-500" />
            <CardContent className="p-8">
              <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-10 pb-10 border-b border-dashed border-slate-200">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-xl bg-pink-500/10 flex items-center justify-center">
                      <Receipt className="h-6 w-6 text-pink-600" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Tagihan Kepada</p>
                      <h3 className="text-xl font-black mt-1">{invoice.client?.name || "Klien Umum"}</h3>
                    </div>
                  </div>
                </div>
                <div className="text-left md:text-right space-y-1">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Informasi Berkas</p>
                  <p className="font-semibold">{invoice.job?.title || "-"}</p>
                  <p className="text-sm text-muted-foreground">{invoice.job?.trackingCode || "Tidak ada kode"}</p>
                  {invoice.job?.id && (
                    <div className="pt-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="rounded-lg h-8 border-pink-500/30 text-pink-600 hover:bg-pink-50 hover:text-pink-700 w-full md:w-auto"
                        onClick={() => router.push(`/dashboard/jobs/${invoice.job.id}`)}
                      >
                        <FileText className="mr-2 h-3.5 w-3.5" />
                        Lihat Berkas
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-6">
                <h4 className="font-black text-lg">Rincian Tagihan</h4>
                <div className="rounded-2xl border border-slate-100 overflow-hidden">
                  <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Deskripsi</p>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total</p>
                  </div>
                  
                  {(() => {
                    const data = getParsedInvoice(invoice.description);
                    const subtotal = data.items ? data.items.reduce((sum: number, item: any) => sum + (Number(item.amount) || 0), 0) : invoice.amount;
                    const discount = data.discountType === "percentage" ? (subtotal * (Number(data.discountValue) || 0) / 100) : (Number(data.discountValue) || 0);
                    const afterDiscount = subtotal - discount;
                    const tax = afterDiscount * (Number(data.taxPercentage) || 0) / 100;
                    const totalInstallments = data.installments ? data.installments.reduce((sum: number, inst: any) => sum + (Number(inst.amount) || 0), 0) : 0;
                    const sisaTagihan = invoice.amount - (Number(data.dpAmount) || 0) - totalInstallments;

                    return (
                      <div className="bg-white">
                        {data.items && data.items.map((item: any, idx: number) => (
                          <div key={idx} className="px-6 py-4 flex justify-between items-center border-b border-slate-50/50">
                            <p className="font-medium text-slate-800">{item.description || "Item"}</p>
                            <p className="font-semibold text-slate-900">{formatCurrency(item.amount)}</p>
                          </div>
                        ))}
                        
                        {(discount > 0 || tax > 0) && (
                          <div className="px-6 py-4 bg-slate-50/50 border-y border-slate-100 space-y-2">
                            <div className="flex justify-between items-center text-sm">
                              <p className="text-slate-600">Subtotal</p>
                              <p className="font-medium text-slate-900">{formatCurrency(subtotal)}</p>
                            </div>
                            {discount > 0 && (
                              <div className="flex justify-between items-center text-sm">
                                <p className="text-slate-600">Diskon</p>
                                <p className="font-medium text-rose-500">- {formatCurrency(discount)}</p>
                              </div>
                            )}
                            {tax > 0 && (
                              <div className="flex justify-between items-center text-sm">
                                <p className="text-slate-600">Pajak ({data.taxPercentage}%)</p>
                                <p className="font-medium text-slate-900">{formatCurrency(tax)}</p>
                              </div>
                            )}
                          </div>
                        )}

                        <div className="bg-pink-50/50 px-6 py-5 border-t border-slate-100 flex justify-between items-center">
                          <p className="font-black text-pink-900">Total Tagihan</p>
                          <p className="font-black text-2xl text-pink-600">{formatCurrency(invoice.amount)}</p>
                        </div>

                        {(Number(data.dpAmount) > 0 || (data.installments && data.installments.length > 0)) && (
                          <div className="px-6 py-5 bg-white border-t border-slate-100">
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Riwayat Pembayaran Rencana</p>
                            <div className="space-y-3">
                              {Number(data.dpAmount) > 0 && (
                                <div className="flex justify-between items-center text-sm">
                                  <p className="font-medium text-slate-700">DP (Down Payment)</p>
                                  <p className="font-semibold text-emerald-600">{formatCurrency(data.dpAmount)}</p>
                                </div>
                              )}
                              {data.installments && data.installments.map((inst: any, idx: number) => (
                                <div key={idx} className="flex justify-between items-center text-sm">
                                  <div className="flex flex-col">
                                    <p className="font-medium text-slate-700">{inst.description}</p>
                                    <p className="text-xs text-muted-foreground">{inst.date ? format(new Date(inst.date), "dd MMM yyyy", { locale: id }) : ""}</p>
                                  </div>
                                  <p className="font-semibold text-emerald-600">{formatCurrency(inst.amount)}</p>
                                </div>
                              ))}
                              
                              <div className="flex justify-between items-center pt-3 mt-3 border-t border-dashed border-slate-200">
                                <p className="font-bold text-rose-600">Sisa Tagihan</p>
                                <p className="font-black text-rose-600">{formatCurrency(sisaTagihan)}</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* KOLOM KANAN (RIWAYAT & JATUH TEMPO) */}
        <div className="space-y-6">
          <Card className="rounded-[2rem] border-none shadow-md overflow-hidden bg-white">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-5">
              <CardTitle className="text-base font-black flex items-center gap-2">
                <Calendar className="h-5 w-5 text-pink-500" />
                Tanggal Penting
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-5">
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Tanggal Terbit</p>
                <p className="font-semibold text-slate-900">{format(new Date(invoice.date), "dd MMMM yyyy", { locale: id })}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Jatuh Tempo</p>
                <p className="font-semibold text-rose-600">{invoice.dueDate ? format(new Date(invoice.dueDate), "dd MMMM yyyy", { locale: id }) : "-"}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[2rem] border-none shadow-md overflow-hidden bg-white">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-5">
              <CardTitle className="text-base font-black flex items-center gap-2">
                <Banknote className="h-5 w-5 text-emerald-500" />
                Riwayat Pembayaran
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {invoice.payments && invoice.payments.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {invoice.payments.map((payment: any) => (
                    <div key={payment.id} className="p-5 flex items-start gap-4 hover:bg-slate-50 transition-colors">
                      <div className="mt-1">
                        <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="font-bold text-sm text-slate-900">{formatCurrency(payment.amount)}</p>
                        <p className="text-xs text-muted-foreground line-clamp-1">{getPaymentDescription(payment.description)}</p>
                        <p className="text-[11px] font-medium text-slate-400 mt-1">
                          {payment.date ? format(new Date(payment.date), "dd MMM yyyy, HH:mm", { locale: id }) : "-"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center">
                  <div className="h-12 w-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Banknote className="h-5 w-5 text-slate-400" />
                  </div>
                  <p className="text-sm font-medium text-slate-500">Belum ada riwayat pembayaran</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
