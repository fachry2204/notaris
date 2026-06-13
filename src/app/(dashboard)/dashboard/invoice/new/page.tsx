"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createInvoice, getJobsForInvoice } from "@/lib/actions/invoice";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  ArrowLeft, 
  Save, 
  X, 
  Receipt, 
  Briefcase, 
  User, 
  Calendar,
  Search,
  Check,
  Plus,
  Trash2,
  Calculator
} from "lucide-react";
import Link from "next/link";

type DiscountType = "amount" | "percent";

type InvoiceLineItem = {
  id: string;
  item: string;
  detail: string;
  qty: number;
  unitPrice: string;
};

export default function NewInvoicePage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split("T")[0]);
  const [dueDate, setDueDate] = useState(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<InvoiceLineItem[]>([
    { id: `item-${Date.now()}`, item: "Biaya Jasa Notaris", detail: "", qty: 1, unitPrice: "" },
  ]);
  const [taxPercent, setTaxPercent] = useState("0");
  const [discountType, setDiscountType] = useState<DiscountType>("amount");
  const [discountValue, setDiscountValue] = useState("0");
  const [dpValue, setDpValue] = useState("0");

  useEffect(() => {
    const fetchJobs = async () => {
      const result = await getJobsForInvoice();
      if (result.success && result.data) {
        setJobs(result.data);
      } else {
        toast.error("Gagal mengambil data pekerjaan");
      }
      setLoading(false);
    };
    fetchJobs();
  }, []);

  const filteredJobs = jobs.filter(job => 
    job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.trackingCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toNumber = (value: string | number) => {
    const normalized = String(value ?? "").replace(/[^0-9.-]/g, "");
    const num = Number(normalized);
    return Number.isFinite(num) ? num : 0;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const addItem = () => {
    setItems((current) => [
      ...current,
      { id: `item-${Date.now()}`, item: "", detail: "", qty: 1, unitPrice: "" },
    ]);
  };

  const removeItem = (id: string) => {
    setItems((current) => (current.length > 1 ? current.filter((item) => item.id !== id) : current));
  };

  const updateItem = (id: string, patch: Partial<InvoiceLineItem>) => {
    setItems((current) => current.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  };

  const subtotal = items.reduce((sum, item) => {
    const qty = Number.isFinite(item.qty) ? item.qty : 0;
    const unitPrice = toNumber(item.unitPrice);
    return sum + Math.max(0, qty) * Math.max(0, unitPrice);
  }, 0);

  const taxAmount = subtotal * (Math.max(0, toNumber(taxPercent)) / 100);
  const discountAmountRaw =
    discountType === "percent"
      ? subtotal * (Math.max(0, toNumber(discountValue)) / 100)
      : Math.max(0, toNumber(discountValue));
  const totalBeforeDp = Math.max(0, subtotal + taxAmount - discountAmountRaw);
  const dpAmount = Math.max(0, toNumber(dpValue));
  const remainingAmount = Math.max(0, totalBeforeDp - dpAmount);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJob) {
      toast.error("Silakan pilih pekerjaan terlebih dahulu");
      return;
    }

    const trimmedItems = items
      .map((item) => ({
        ...item,
        item: item.item.trim(),
        detail: item.detail.trim(),
      }))
      .filter((item) => item.item.length > 0 || item.detail.length > 0);

    if (trimmedItems.length === 0) {
      toast.error("Minimal 1 item invoice harus diisi.");
      return;
    }

    setIsSubmitting(true);
    const payload = {
      v: 1,
      job: {
        id: selectedJob.id,
        type: selectedJob.type,
        title: selectedJob.title,
        trackingCode: selectedJob.trackingCode,
        clientName: selectedJob.client?.name || "",
      },
      invoiceDate,
      dueDate,
      items: trimmedItems.map((item) => ({
        item: item.item,
        detail: item.detail,
        qty: item.qty,
        unitPrice: toNumber(item.unitPrice),
        total: Math.max(0, item.qty) * Math.max(0, toNumber(item.unitPrice)),
      })),
      tax: {
        percent: Math.max(0, toNumber(taxPercent)),
        amount: taxAmount,
      },
      discount: {
        type: discountType,
        value: Math.max(0, toNumber(discountValue)),
        amount: discountAmountRaw,
      },
      dp: {
        amount: dpAmount,
      },
      totals: {
        subtotal,
        total: totalBeforeDp,
        remaining: remainingAmount,
      },
      notes: notes.trim(),
    };

    const result = await createInvoice({
      jobId: selectedJob.id,
      jobType: selectedJob.type,
      invoiceTotal: totalBeforeDp,
      dpAmount,
      description: JSON.stringify(payload),
      date: new Date(invoiceDate),
      dueDate: new Date(dueDate),
    });

    if (result.success) {
      toast.success("Invoice berhasil dibuat");
      router.push("/dashboard/invoice");
    } else {
      toast.error(result.error);
    }
    setIsSubmitting(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-pink-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/invoice">
            <Button variant="ghost" size="icon" className="rounded-full hover:bg-pink-500/10 hover:text-pink-500 transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Buat Invoice Baru</h1>
            <p className="text-sm text-muted-foreground">Pilih pekerjaan dan tentukan jumlah penagihan.</p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <Card className="border-none shadow-sm rounded-2xl bg-card overflow-hidden">
          <CardHeader className="border-b pb-4">
            <CardTitle className="text-lg">Pilih Pekerjaan</CardTitle>
            <CardDescription>Cari berdasarkan nama klien atau judul pekerjaan.</CardDescription>
            <div className="relative mt-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari..."
                className="pl-9 h-10 rounded-xl bg-muted/50 border-none focus-visible:ring-pink-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent className="p-0 max-h-[420px] overflow-y-auto custom-scrollbar">
            {filteredJobs.map((job) => (
              <button
                key={job.id}
                onClick={() => setSelectedJob(job)}
                className={`w-full text-left p-4 border-b last:border-0 transition-all hover:bg-pink-500/[0.02] relative group ${selectedJob?.id === job.id ? "bg-pink-500/[0.05]" : ""}`}
              >
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-widest text-pink-500">{job.category}</span>
                    <span className="text-[10px] font-bold text-muted-foreground">{job.trackingCode}</span>
                  </div>
                  <span className="font-bold text-sm text-foreground line-clamp-1">{job.title}</span>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <User className="h-3 w-3" />
                    <span className="truncate">{job.client.name}</span>
                  </div>
                </div>
                {selectedJob?.id === job.id && (
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full bg-pink-500 flex items-center justify-center text-white shadow-lg shadow-pink-500/20">
                    <Check className="h-3.5 w-3.5" />
                  </div>
                )}
              </button>
            ))}
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm rounded-2xl bg-card overflow-hidden">
          <CardHeader className="border-b bg-muted/5 px-8 py-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-pink-500/10 flex items-center justify-center">
                <Receipt className="h-6 w-6 text-pink-500" />
              </div>
              <div>
                <CardTitle>Detail Penagihan</CardTitle>
                <CardDescription>Item invoice, pajak, diskon, DP, dan total tagihan.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              {selectedJob ? (
                <div className="bg-pink-500/[0.03] border border-pink-500/10 rounded-2xl p-6 animate-in zoom-in-95 duration-300">
                  <div className="space-y-4">
                    <div>
                      <Label className="text-[10px] font-black uppercase tracking-widest text-pink-500/60 block mb-1">Pekerjaan Terpilih</Label>
                      <h3 className="text-xl font-black text-foreground">{selectedJob.title}</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block mb-1">Nama Klien</Label>
                        <div className="flex items-center gap-2 font-bold text-sm italic">
                          <User className="h-4 w-4 text-pink-500/50" />
                          {selectedJob.client.name}
                        </div>
                      </div>
                      <div>
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block mb-1">No. Tracking</Label>
                        <div className="flex items-center gap-2 font-bold text-sm">
                          <Briefcase className="h-4 w-4 text-pink-500/50" />
                          {selectedJob.trackingCode}
                        </div>
                      </div>
                      <div>
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block mb-1">Kategori</Label>
                        <div className="text-sm font-bold">{selectedJob.category}</div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-muted/5 border border-dashed border-muted-foreground/20 rounded-2xl p-10 text-center">
                  <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                    <Search className="h-6 w-6 text-muted-foreground/40" />
                  </div>
                  <p className="text-sm text-muted-foreground">Silakan pilih salah satu pekerjaan dari card di atas.</p>
                </div>
              )}

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="date">Tanggal Invoice</Label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="date"
                      type="date"
                      className="h-12 pl-11 rounded-xl border-muted-foreground/20"
                      required
                      value={invoiceDate}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInvoiceDate(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dueDate">Jatuh Tempo</Label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="dueDate"
                      type="date"
                      className="h-12 pl-11 rounded-xl border-muted-foreground/20"
                      required
                      value={dueDate}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDueDate(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Calculator className="h-4 w-4 text-pink-500" />
                    <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground">Item Invoice</h3>
                  </div>
                  <Button type="button" variant="outline" className="h-10 rounded-xl gap-2 text-xs font-bold" onClick={addItem}>
                    <Plus className="h-4 w-4" />
                    Tambah Item
                  </Button>
                </div>

                <div className="space-y-3">
                  {items.map((item, index) => (
                    <div key={item.id} className="rounded-2xl border border-muted-foreground/15 bg-background/60 p-4">
                      <div className="grid gap-4 md:grid-cols-[1.2fr_0.7fr_0.7fr_auto] items-start">
                        <div className="space-y-2">
                          <Label className="text-xs font-bold">Item / Deskripsi</Label>
                          <Input
                            value={item.item}
                            onChange={(e) => updateItem(item.id, { item: e.target.value })}
                            placeholder={`Item ${index + 1}`}
                            className="h-11 rounded-xl border-muted-foreground/20"
                          />
                          <Input
                            value={item.detail}
                            onChange={(e) => updateItem(item.id, { detail: e.target.value })}
                            placeholder="Detail tambahan (opsional)"
                            className="h-11 rounded-xl border-muted-foreground/20"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs font-bold">Qty</Label>
                          <Input
                            type="number"
                            min={1}
                            value={item.qty}
                            onChange={(e) => updateItem(item.id, { qty: Math.max(1, Number(e.target.value || 1)) })}
                            className="h-11 rounded-xl border-muted-foreground/20"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs font-bold">Harga (Rp)</Label>
                          <Input
                            type="number"
                            min={0}
                            value={item.unitPrice}
                            onChange={(e) => updateItem(item.id, { unitPrice: e.target.value })}
                            placeholder="0"
                            className="h-11 rounded-xl border-muted-foreground/20 font-bold"
                          />
                        </div>
                        <div className="flex flex-col items-end gap-2 pt-7">
                          <div className="text-xs text-muted-foreground">Total</div>
                          <div className="text-sm font-black text-foreground">
                            {formatCurrency(Math.max(0, item.qty) * Math.max(0, toNumber(item.unitPrice)))}
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            className="h-9 w-9 rounded-xl hover:bg-red-500/10 hover:text-red-600"
                            onClick={() => removeItem(item.id)}
                            disabled={items.length === 1}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="notes">Catatan / Detail Penagihan</Label>
                    <Textarea
                      id="notes"
                      placeholder="Catatan tambahan untuk invoice (opsional)"
                      className="min-h-[140px] rounded-xl border-muted-foreground/20 focus-visible:ring-pink-500"
                      value={notes}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNotes(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-5">
                  <div className="rounded-2xl border border-muted-foreground/15 bg-background/60 p-6 space-y-5">
                    <div className="flex items-center gap-2">
                      <Calculator className="h-4 w-4 text-pink-500" />
                      <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground">Ringkasan</h3>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="taxPercent">Pajak (%)</Label>
                        <Input
                          id="taxPercent"
                          type="number"
                          min={0}
                          value={taxPercent}
                          onChange={(e) => setTaxPercent(e.target.value)}
                          className="h-11 rounded-xl border-muted-foreground/20"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Diskon</Label>
                        <div className="grid grid-cols-[90px_1fr] gap-3">
                          <select
                            value={discountType}
                            onChange={(e) => setDiscountType(e.target.value as DiscountType)}
                            className="flex h-11 w-full rounded-xl border border-muted-foreground/20 bg-background px-3 text-sm font-bold"
                          >
                            <option value="amount">Rp</option>
                            <option value="percent">%</option>
                          </select>
                          <Input
                            type="number"
                            min={0}
                            value={discountValue}
                            onChange={(e) => setDiscountValue(e.target.value)}
                            className="h-11 rounded-xl border-muted-foreground/20"
                          />
                        </div>
                      </div>

                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="dp">DP (Rp)</Label>
                        <Input
                          id="dp"
                          type="number"
                          min={0}
                          value={dpValue}
                          onChange={(e) => setDpValue(e.target.value)}
                          className="h-11 rounded-xl border-muted-foreground/20"
                        />
                      </div>
                    </div>

                    <div className="space-y-2 border-t pt-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground font-semibold">Sub Total</span>
                        <span className="font-black text-foreground">{formatCurrency(subtotal)}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground font-semibold">Pajak</span>
                        <span className="font-bold text-foreground">{formatCurrency(taxAmount)}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground font-semibold">Diskon</span>
                        <span className="font-bold text-foreground">-{formatCurrency(discountAmountRaw)}</span>
                      </div>
                      <div className="flex items-center justify-between text-base pt-2">
                        <span className="font-black text-foreground">Total</span>
                        <span className="font-black text-foreground">{formatCurrency(totalBeforeDp)}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground font-semibold">DP</span>
                        <span className="font-bold text-foreground">-{formatCurrency(dpAmount)}</span>
                      </div>
                      <div className="flex items-center justify-between text-base">
                        <span className="font-black text-pink-600">Sisa Tagihan</span>
                        <span className="font-black text-pink-600">{formatCurrency(remainingAmount)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-6 border-t">
                <Link href="/dashboard/invoice">
                  <Button variant="ghost" type="button" className="h-12 px-8 rounded-xl gap-2 font-bold hover:bg-pink-50 hover:text-pink-600 transition-all">
                    <X className="h-5 w-5" />
                    Batal
                  </Button>
                </Link>
                <Button
                  type="submit"
                  disabled={isSubmitting || !selectedJob}
                  className="h-12 px-10 rounded-xl gap-2 font-bold shadow-lg shadow-pink-500/20 bg-pink-500 hover:bg-pink-600 transition-all"
                >
                  <Save className="h-5 w-5" />
                  {isSubmitting ? "Menyimpan..." : "Simpan Invoice"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
