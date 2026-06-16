"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Save, 
  FileText, 
  User, 
  Building2, 
  Receipt,
  Calculator,
  Printer
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { getInvoiceById, updateInvoice } from "@/lib/actions/invoice";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface InvoiceItem {
  id: number;
  description: string;
  amount: number;
}

interface Installment {
  id: number;
  description: string;
  amount: number;
  date: string;
}

export default function EditInvoicePage() {
  const { id } = useParams();
  const router = useRouter();
  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [invoiceDate, setInvoiceDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [discountType, setDiscountType] = useState<"nominal" | "percentage">("nominal");
  const [discountValue, setDiscountValue] = useState(0);
  const [taxPercentage, setTaxPercentage] = useState(0);
  const [dpAmount, setDpAmount] = useState(0);
  const [installments, setInstallments] = useState<Installment[]>([]);

  useEffect(() => {
    const fetchInvoice = async () => {
      const result = await getInvoiceById(id as string);
      if (result.success && result.data) {
        setInvoice(result.data);
        
        if (result.data.date) {
          setInvoiceDate(new Date(result.data.date).toISOString().split('T')[0]);
        }
        if (result.data.dueDate) {
          setDueDate(new Date(result.data.dueDate).toISOString().split('T')[0]);
        }

        try {
          if (result.data.description) {
            const parsed = JSON.parse(result.data.description);
            if (Array.isArray(parsed)) {
              setItems(parsed);
            } else {
              setItems(parsed.items || []);
              setDiscountType(parsed.discountType || "nominal");
              setDiscountValue(parsed.discountValue || 0);
              setTaxPercentage(parsed.taxPercentage || 0);
              setDpAmount(parsed.dpAmount || 0);
              setInstallments(parsed.installments || []);
            }
          }
        } catch (e) {
          setItems([{ id: Date.now(), description: result.data.description || "Biaya Jasa Notaris", amount: result.data.amount }]);
        }
      } else {
        toast.error("Invoice tidak ditemukan");
        router.back();
      }
      setLoading(false);
    };
    fetchInvoice();
  }, [id, router]);

  const addItem = () => {
    setItems([...items, { id: Date.now(), description: "", amount: 0 }]);
  };

  const removeItem = (id: number) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const updateItem = (id: number, field: keyof InvoiceItem, value: any) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  };

  const calculateDiscount = () => {
    const subtotal = calculateSubtotal();
    if (discountType === "percentage") {
      return subtotal * (Number(discountValue) || 0) / 100;
    }
    return Number(discountValue) || 0;
  };

  const calculateTax = () => {
    const afterDiscount = calculateSubtotal() - calculateDiscount();
    return afterDiscount * (Number(taxPercentage) || 0) / 100;
  };

  const calculateTotal = () => {
    return calculateSubtotal() - calculateDiscount() + calculateTax();
  };

  const calculateSisaTagihan = () => {
    const totalInstallments = installments.reduce((sum, inst) => sum + (Number(inst.amount) || 0), 0);
    return calculateTotal() - (Number(dpAmount) || 0) - totalInstallments;
  };

  const addInstallment = () => {
    setInstallments([...installments, { id: Date.now(), description: `Tahap ${installments.length + 1}`, amount: 0, date: new Date().toISOString().split('T')[0] }]);
  };

  const removeInstallment = (id: number) => {
    setInstallments(installments.filter(inst => inst.id !== id));
  };

  const updateInstallment = (id: number, field: keyof Installment, value: any) => {
    setInstallments(installments.map(inst => 
      inst.id === id ? { ...inst, [field]: value } : inst
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoice) return;

    setIsSubmitting(true);
    
    const total = calculateTotal();
    const invoiceDescription = JSON.stringify({
      items,
      discountType,
      discountValue,
      taxPercentage,
      dpAmount,
      installments
    });

    const result = await updateInvoice(invoice.id, {
      amount: total,
      description: invoiceDescription,
      date: new Date(invoiceDate),
      dueDate: new Date(dueDate),
      status: invoice.status, // keep existing status
    });

    if (result.success) {
      toast.success("Invoice berhasil diperbarui!");
      router.push(`/dashboard/invoice/${invoice.id}`);
    } else {
      toast.error(result.error || "Gagal memperbarui invoice");
    }
    
    setIsSubmitting(false);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-pink-500 border-t-transparent"></div>
        <p className="text-sm font-medium text-muted-foreground animate-pulse">Memuat data invoice...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            className="rounded-full hover:bg-pink-500/10 hover:text-pink-500 transition-colors"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Edit Invoice</h1>
            <p className="text-sm text-muted-foreground">Invoice: <span className="font-bold text-pink-600 uppercase">{invoice?.invoiceNumber}</span></p>
          </div>
        </div>
        <Button 
          variant="outline" 
          className="rounded-xl border-blue-200 text-blue-600 hover:bg-blue-50 gap-2 h-10 text-xs font-bold" 
          onClick={() => window.open('/print/invoice/' + invoice?.id, '_blank')}
        >
          <Printer className="h-4 w-4" />
          Pratinjau Cetak
        </Button>
      </div>
      <div className="space-y-6">
        <Card className="border-none shadow-sm rounded-[2rem] bg-card overflow-hidden">
          <CardHeader className="bg-pink-500 text-white p-6">
            <div className="flex items-center gap-3">
              <User className="h-5 w-5" />
              <CardTitle className="text-base">Informasi Client</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-pink-500/10 flex items-center justify-center text-pink-500">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm leading-tight">{invoice?.client?.company || invoice?.client?.name || "Client Umum"}</h4>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase mt-0.5">{invoice?.client?.type || "Client"}</p>
                </div>
              </div>
              <div className="space-y-3 pt-2 border-t border-muted/10">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Nama Kontak</span>
                  <span className="text-sm font-medium">{invoice?.client?.name || "-"}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Email</span>
                  <span className="text-sm font-medium">{invoice?.client?.email || "-"}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">No. HP / WA</span>
                  <span className="text-sm font-bold text-pink-600">{invoice?.client?.phone || "-"}</span>
                </div>
              </div>
            </CardContent>
          </Card>

        <div className="space-y-6">
          <Card className="border-none shadow-sm rounded-[2rem] bg-card overflow-hidden">
            <CardHeader className="border-b bg-muted/5 px-8 py-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-pink-500/10 flex items-center justify-center text-pink-500">
                  <Receipt className="h-5 w-5" />
                </div>
                <CardTitle className="text-lg">Detail Tagihan</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-8">
              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Tanggal Invoice</Label>
                    <Input 
                      type="date" 
                      value={invoiceDate}
                      onChange={(e) => setInvoiceDate(e.target.value)}
                      className="h-12 rounded-xl border-muted focus-visible:ring-pink-500 px-4" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Jatuh Tempo</Label>
                    <Input 
                      type="date" 
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="h-12 rounded-xl border-muted focus-visible:ring-pink-500 px-4" 
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Rincian Biaya</Label>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      onClick={addItem}
                      className="rounded-lg border-pink-200 text-pink-600 hover:bg-pink-50 gap-2 h-8 text-[10px] font-bold"
                    >
                      <Plus className="h-3 w-3" />
                      Tambah Baris
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {items.map((item, index) => (
                      <div key={item.id} className="flex items-end gap-3 animate-in fade-in slide-in-from-right-2 duration-300">
                        <div className="flex-grow space-y-1.5">
                          {index === 0 && <Label className="text-[10px] text-muted-foreground uppercase">Deskripsi</Label>}
                          <Input 
                            placeholder="Deskripsi biaya..."
                            value={item.description}
                            onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                            className="h-11 rounded-xl border-muted focus-visible:ring-pink-500 px-4"
                          />
                        </div>
                        <div className="w-40 space-y-1.5">
                          {index === 0 && <Label className="text-[10px] text-muted-foreground uppercase">Jumlah (Rp)</Label>}
                          <Input 
                            type="number"
                            placeholder="0"
                            value={item.amount}
                            onChange={(e) => updateItem(item.id, 'amount', e.target.value)}
                            className="h-11 rounded-xl border-muted focus-visible:ring-pink-500 px-4 font-bold text-right"
                          />
                        </div>
                        {items.length > 1 && (
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="icon"
                            onClick={() => removeItem(item.id)}
                            className="h-11 w-11 rounded-xl text-muted-foreground hover:text-rose-500 hover:bg-rose-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6 pt-4 border-t border-muted/20">
                  <div className="space-y-4">
                    <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Diskon & Pajak</Label>
                    <div className="flex gap-2">
                      <select 
                        value={discountType} 
                        onChange={(e) => setDiscountType(e.target.value as "nominal" | "percentage")}
                        className="h-11 rounded-xl border border-muted focus-visible:ring-pink-500 px-3 text-sm font-medium w-1/3 bg-transparent"
                      >
                        <option value="nominal">Rp</option>
                        <option value="percentage">%</option>
                      </select>
                      <Input 
                        type="number" 
                        placeholder="Diskon" 
                        value={discountValue} 
                        onChange={(e) => setDiscountValue(Number(e.target.value))}
                        className="h-11 rounded-xl border-muted focus-visible:ring-pink-500 px-4 w-2/3"
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <Label className="text-sm font-medium whitespace-nowrap">Pajak (%)</Label>
                      <Input 
                        type="number" 
                        placeholder="0" 
                        value={taxPercentage} 
                        onChange={(e) => setTaxPercentage(Number(e.target.value))}
                        className="h-11 rounded-xl border-muted focus-visible:ring-pink-500 px-4 w-full"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Pembayaran</Label>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        onClick={addInstallment}
                        className="rounded-lg border-blue-200 text-blue-600 hover:bg-blue-50 gap-2 h-8 text-[10px] font-bold"
                      >
                        <Plus className="h-3 w-3" />
                        Tambah Tahap
                      </Button>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <Label className="text-sm font-medium whitespace-nowrap w-24">DP (Rp)</Label>
                        <Input 
                          type="number" 
                          placeholder="0" 
                          value={dpAmount} 
                          onChange={(e) => setDpAmount(Number(e.target.value))}
                          className="h-11 rounded-xl border-muted focus-visible:ring-pink-500 px-4 w-full font-bold text-right text-emerald-600"
                        />
                      </div>
                      
                      {installments.map((inst, index) => (
                        <div key={inst.id} className="flex flex-col gap-2 p-3 bg-muted/20 rounded-xl border border-muted/50">
                          <div className="flex items-center justify-between">
                            <Input 
                              value={inst.description}
                              onChange={(e) => updateInstallment(inst.id, 'description', e.target.value)}
                              className="h-8 rounded-md text-xs font-medium w-3/5 border-none bg-transparent px-1 focus-visible:ring-1 focus-visible:ring-pink-500"
                            />
                            <Button type="button" variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-rose-500" onClick={() => removeInstallment(inst.id)}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                          <div className="flex items-center gap-2">
                            <Input 
                              type="date"
                              value={inst.date}
                              onChange={(e) => updateInstallment(inst.id, 'date', e.target.value)}
                              className="h-9 text-xs border-muted focus-visible:ring-pink-500"
                            />
                            <Input 
                              type="number"
                              value={inst.amount}
                              onChange={(e) => updateInstallment(inst.id, 'amount', e.target.value)}
                              className="h-9 text-right font-bold text-xs border-muted focus-visible:ring-pink-500"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-muted/20 space-y-3">
                  <div className="flex items-center justify-between px-2 text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium">Rp {calculateSubtotal().toLocaleString('id-ID')}</span>
                  </div>
                  {calculateDiscount() > 0 && (
                    <div className="flex items-center justify-between px-2 text-sm">
                      <span className="text-muted-foreground">Diskon</span>
                      <span className="font-medium text-rose-500">- Rp {calculateDiscount().toLocaleString('id-ID')}</span>
                    </div>
                  )}
                  {calculateTax() > 0 && (
                    <div className="flex items-center justify-between px-2 text-sm">
                      <span className="text-muted-foreground">Pajak ({taxPercentage}%)</span>
                      <span className="font-medium">Rp {calculateTax().toLocaleString('id-ID')}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between px-2 pt-3 border-t border-dashed border-muted">
                    <span className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Grand Total</span>
                    <span className="text-2xl font-black text-pink-600">Rp {calculateTotal().toLocaleString('id-ID')}</span>
                  </div>
                  {(dpAmount > 0 || installments.length > 0) && (
                    <div className="flex items-center justify-between px-2 pt-2 pb-1 text-sm bg-rose-50/50 rounded-lg p-2 mt-2">
                      <span className="font-bold text-rose-600 uppercase tracking-widest text-[10px]">Sisa Tagihan</span>
                      <span className="font-black text-rose-600">Rp {calculateSisaTagihan().toLocaleString('id-ID')}</span>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-3 pt-6">
                  <Button 
                    type="button" 
                    variant="ghost" 
                    className="h-12 px-6 rounded-xl font-bold"
                    onClick={() => router.back()}
                  >
                    Batal
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="h-12 px-10 rounded-xl bg-pink-500 hover:bg-pink-600 shadow-xl shadow-pink-500/20 gap-2 font-bold transition-all"
                  >
                    <Save className="h-5 w-5" />
                    {isSubmitting ? "Menyimpan..." : "Simpan Perubahan"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
