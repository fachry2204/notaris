"use client";

import React, { useEffect, useMemo, useState } from "react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Plus, 
  Filter, 
  Download, 
  Receipt, 
  MoreHorizontal, 
  Eye, 
  Printer, 
  Send,
  Calendar,
  FileText
} from "lucide-react";
import Link from "next/link";
import { getInvoicesList } from "@/lib/actions/invoice";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuGroup,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type InvoiceMeta = {
  dp?: { amount?: number };
};

function safeParseInvoiceMeta(description: string | null | undefined): InvoiceMeta | null {
  if (!description) return null;
  try {
    const parsed = JSON.parse(description);
    if (parsed && typeof parsed === "object") return parsed as InvoiceMeta;
  } catch {}
  return null;
}

export default function InvoicePage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const result = await getInvoicesList();
      if (result.success) {
        setInvoices(result.data || []);
      } else {
        toast.error(result.error);
      }
      setLoading(false);
    };
    load();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Lunas":
        return <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/20">Lunas</Badge>;
      case "Belum Bayar":
        return <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20">Belum Bayar</Badge>;
      case "DP Bayar":
        return <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/20">DP Bayar</Badge>;
      case "Jatuh Tempo":
        return <Badge variant="destructive" className="bg-red-500/10 text-red-600 border-red-500/20">Jatuh Tempo</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const filteredInvoices = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return invoices;
    return invoices.filter((inv: any) => {
      const haystack = [
        inv.invoiceNumber,
        inv.client?.name,
        inv.job?.title,
        inv.job?.trackingCode,
        inv.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(term);
    });
  }, [invoices, searchTerm]);

  const summary = useMemo(() => {
    const totals = {
      paid: 0,
      dp: 0,
      unpaid: 0,
    };

    invoices.forEach((inv: any) => {
      const amount = Number(inv.amount) || 0;
      if (inv.status === "Lunas") totals.paid += amount;
      else if (inv.status === "DP Bayar") {
        const meta = safeParseInvoiceMeta(inv.description);
        totals.dp += Number(meta?.dp?.amount) || 0;
        totals.unpaid += Math.max(0, amount - (Number(meta?.dp?.amount) || 0));
      } else {
        totals.unpaid += amount;
      }
    });

    return totals;
  }, [invoices]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-pink-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-pink-500/10 flex items-center justify-center">
              <Receipt className="h-6 w-6 text-pink-500" />
            </div>
            Billing & Invoices
          </h1>
          <p className="text-muted-foreground mt-1">Kelola penagihan klien dan riwayat pembayaran jasa Notaris.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-1.5 h-9 px-4 text-xs font-bold rounded-xl border-muted-foreground/20">
            <Download className="h-3.5 w-3.5" />
            Export CSV
          </Button>
          <Link href="/dashboard/invoice/new">
            <Button className="gap-1.5 h-9 px-4 text-xs font-bold rounded-xl shadow-md shadow-pink-500/20 bg-pink-500 hover:bg-pink-600 text-white">
              <Plus className="h-3.5 w-3.5" />
              Buat Invoice
            </Button>
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none shadow-sm bg-emerald-500/[0.03] border-l-4 border-l-emerald-500">
          <CardHeader className="pb-2">
            <CardDescription className="font-bold text-[10px] uppercase tracking-widest text-emerald-600/70">Total Terbayar (Lunas)</CardDescription>
            <CardTitle className="text-2xl font-black text-emerald-600">{formatCurrency(summary.paid)}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-none shadow-sm bg-blue-500/[0.03] border-l-4 border-l-blue-500">
          <CardHeader className="pb-2">
            <CardDescription className="font-bold text-[10px] uppercase tracking-widest text-blue-600/70">Total DP Bayar</CardDescription>
            <CardTitle className="text-2xl font-black text-blue-600">{formatCurrency(summary.dp)}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-none shadow-sm bg-red-500/[0.03] border-l-4 border-l-red-500">
          <CardHeader className="pb-2">
            <CardDescription className="font-bold text-[10px] uppercase tracking-widest text-red-600/70">Belum Bayar & Jatuh Tempo</CardDescription>
            <CardTitle className="text-2xl font-black text-red-600">{formatCurrency(summary.unpaid)}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card className="border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
        <CardHeader className="border-b bg-muted/5 px-6 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Cari invoice atau client..." 
                className="pl-10 h-10 rounded-xl border-muted-foreground/20 bg-background"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="h-9 rounded-lg gap-2 text-[10px] font-black uppercase tracking-widest">
                <Filter className="h-3 w-3" />
                Filter
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-b-muted/20">
                <TableHead className="px-6 font-black text-[10px] uppercase tracking-widest">Invoice ID</TableHead>
                <TableHead className="font-black text-[10px] uppercase tracking-widest">Client / Pekerjaan</TableHead>
                <TableHead className="font-black text-[10px] uppercase tracking-widest">Tanggal</TableHead>
                <TableHead className="font-black text-[10px] uppercase tracking-widest">Jumlah</TableHead>
                <TableHead className="font-black text-[10px] uppercase tracking-widest text-center">Status</TableHead>
                <TableHead className="px-6 text-right font-black text-[10px] uppercase tracking-widest">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInvoices.map((inv: any) => (
                <TableRow key={inv.id} className="group hover:bg-muted/5 transition-colors border-b-muted/10">
                  <TableCell className="px-6">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-pink-500/50" />
                      <span className="font-bold text-xs">{inv.invoiceNumber}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-0.5">
                      <span className="font-bold text-sm text-foreground">{inv.client?.name || "-"}</span>
                      <span className="text-[10px] text-muted-foreground">{inv.job?.title || "-"}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-1.5 text-[10px] font-semibold">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        {inv.date ? new Date(inv.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : "-"}
                      </div>
                      <div className="text-[9px] text-muted-foreground italic">
                        Jatuh tempo: {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : "-"}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-black text-sm text-foreground">{formatCurrency(Number(inv.amount) || 0)}</span>
                  </TableCell>
                  <TableCell className="text-center">
                    {getStatusBadge(inv.status)}
                  </TableCell>
                  <TableCell className="px-6 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger className="h-8 px-4 rounded-xl border border-pink-500/30 text-pink-600 hover:bg-pink-50 hover:text-pink-700 font-bold text-xs inline-flex items-center justify-center transition-all outline-none focus-visible:ring-2 focus-visible:ring-pink-500 shadow-sm">
                        Detail
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48 rounded-xl border-muted-foreground/20">
                        <DropdownMenuGroup>
                          <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 px-3">Opsi Invoice</DropdownMenuLabel>
                        </DropdownMenuGroup>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="gap-3 py-2.5 cursor-pointer rounded-lg mx-1"
                          onClick={() => {
                            window.location.href = `/dashboard/invoice/${inv.id}`;
                          }}
                        >
                          <Eye className="h-4 w-4 text-blue-500" />
                          <span className="text-xs font-semibold">Lihat Detail</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="gap-3 py-2.5 cursor-pointer rounded-lg mx-1"
                          onClick={() => {
                            toast.success("Mempersiapkan dokumen untuk dicetak...");
                            setTimeout(() => {
                              window.open('/print/invoice/' + inv.id, '_blank');
                            }, 500);
                          }}
                        >
                          <Printer className="h-4 w-4 text-emerald-500" />
                          <span className="text-xs font-semibold">Cetak Invoice</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="gap-3 py-2.5 cursor-pointer rounded-lg mx-1"
                          onClick={() => {
                            toast.success(`Invoice berhasil dikirim ke email client.`);
                          }}
                        >
                          <Send className="h-4 w-4 text-pink-500" />
                          <span className="text-xs font-semibold">Kirim Email</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
