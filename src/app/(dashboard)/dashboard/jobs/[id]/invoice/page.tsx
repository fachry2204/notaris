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
import { getJobById } from "@/lib/actions/jobs";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface InvoiceItem {
  id: number;
  description: string;
  amount: number;
}

export default function CreateInvoicePage() {
  const { id } = useParams();
  const router = useRouter();
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  const [items, setItems] = useState<InvoiceItem[]>([
    { id: Date.now(), description: "Biaya Jasa Notaris", amount: 0 }
  ]);

  useEffect(() => {
    const fetchJob = async () => {
      const result = await getJobById(id as string);
      if (result.success) {
        setJob(result.data);
      } else {
        toast.error("Berkas tidak ditemukan");
        router.back();
      }
      setLoading(false);
    };
    fetchJob();
  }, [id]);

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

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      toast.success("Invoice berhasil dibuat!");
      setIsSubmitting(false);
      router.push(`/dashboard/jobs/${id}`);
    }, 1500);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-pink-500 border-t-transparent"></div>
        <p className="text-sm font-medium text-muted-foreground animate-pulse">Memuat data berkas...</p>
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
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Buat Invoice Baru</h1>
            <p className="text-sm text-muted-foreground">Penagihan untuk berkas: <span className="font-bold text-pink-600 uppercase">{job?.trackingCode}</span></p>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
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

                <div className="pt-6 border-t border-muted/20">
                  <div className="flex items-center justify-between px-2">
                    <span className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Total Tagihan</span>
                    <span className="text-2xl font-black text-pink-600">Rp {calculateTotal().toLocaleString('id-ID')}</span>
                  </div>
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
                    {isSubmitting ? "Menyimpan..." : "Simpan & Cetak"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
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
                  <h4 className="font-bold text-sm leading-tight">{job?.client?.company || job?.client?.name}</h4>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase mt-0.5">{job?.client?.type || "Client"}</p>
                </div>
              </div>
              <div className="space-y-3 pt-2 border-t border-muted/10">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Nama Kontak</span>
                  <span className="text-sm font-medium">{job?.client?.name}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Email</span>
                  <span className="text-sm font-medium">{job?.client?.email || "-"}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">No. HP / WA</span>
                  <span className="text-sm font-bold text-pink-600">{job?.client?.phone || "-"}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm rounded-[2rem] bg-muted/20 overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600">
                  <Calculator className="h-4 w-4" />
                </div>
                <h4 className="font-bold text-sm">Informasi Pembayaran</h4>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed italic">
                Invoice ini akan dicatat sebagai piutang (Uang Masuk) dalam modul keuangan. Anda dapat mencetak PDF invoice setelah menekan tombol simpan.
              </p>
              <Button variant="outline" className="w-full mt-6 rounded-xl border-blue-200 text-blue-600 hover:bg-blue-50 gap-2 h-11 text-xs font-bold">
                <Printer className="h-4 w-4" />
                Pratinjau Cetak
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
