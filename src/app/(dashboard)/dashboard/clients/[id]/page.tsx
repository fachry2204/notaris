import React from "react";
import Link from "next/link";
import { formatClientId } from "@/lib/utils/client";
import { getClientById } from "@/lib/actions/clients";
import { getInvoicesByClientId } from "@/lib/actions/invoice";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  ArrowLeft, 
  Building2, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar,
  FileText,
  User,
  ExternalLink,
  MessageSquare,
  Edit,
  CreditCard
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { notFound } from "next/navigation";

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await getClientById(id);

  if (!result.success || !result.data) {
    return notFound();
  }

  const client = result.data;
  const invoicesResult = await getInvoicesByClientId(id);
  const invoices = invoicesResult.success ? invoicesResult.data || [] : [];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
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

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      {/* Header Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/clients">
            <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl border-border/50 hover:bg-pink-500 hover:text-white transition-all shadow-sm">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">
              Data Client <span className="text-pink-500">/</span> {formatClientId((client as any).indexNo)}
            </div>
            <h1 className="text-2xl font-black tracking-tight text-foreground">{client.name}</h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link href={`/dashboard/clients/${client.id}/edit`}>
            <Button className="gap-2 h-10 px-4 rounded-xl bg-pink-500 hover:bg-pink-600 shadow-lg shadow-pink-500/20 transition-all font-bold">
              <Edit className="h-4 w-4" />
              Edit Profile
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">

        {/* Main Content Column */}
        <div className="space-y-6">
          {/* Unified Profile & Information Section */}
          <Card className="border border-muted-foreground/20 shadow-sm rounded-xl bg-card overflow-hidden">
            <CardContent className="p-0">
              <div className="grid grid-cols-1 lg:grid-cols-5 divide-y lg:divide-y-0 lg:divide-x divide-muted/10">
                {/* Identity & Contact Info (2/5 width on large screens) */}
                <div className="lg:col-span-2 p-6 space-y-6">
                  <div className="flex items-center justify-between border-b border-muted/10 pb-4 mb-4">
                    <div className="flex flex-col">
                      <div className="text-[10px] font-black text-pink-500 uppercase tracking-[0.2em] mb-1">ID: {formatClientId((client as any).indexNo)}</div>
                      <h2 className="text-2xl font-black text-foreground leading-none mb-3">{client.name}</h2>
                      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2 bg-muted/50 px-3 py-1 rounded-full border border-muted/10 w-fit">
                        <Calendar className="h-3 w-3 text-pink-500" />
                        Sejak {new Date(client.createdAt).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3">
                    {/* Phone */}
                    <div className="flex items-center gap-3 p-2.5 rounded-xl bg-muted/30 border border-muted/20 transition-all hover:bg-muted/50">
                      <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                        <Phone className="h-3.5 w-3.5" />
                      </div>
                      <div className="flex-1 flex items-center justify-between overflow-hidden">
                        <div className="flex flex-col overflow-hidden">
                          <span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">Handphone</span>
                          <span className="text-xs font-bold truncate">{client.phone || "-"}</span>
                        </div>
                        {client.phone && (
                          <a 
                            href={`https://wa.me/${client.phone.replace(/\D/g, '')}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="h-6 w-6 rounded-lg bg-emerald-500 flex items-center justify-center text-white hover:scale-110 shadow-lg shadow-emerald-500/20 transition-all ml-2"
                          >
                            <MessageSquare className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Email */}
                    <div className="flex items-center gap-3 p-2.5 rounded-xl bg-muted/30 border border-muted/20 transition-all hover:bg-muted/50">
                      <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600">
                        <Mail className="h-3.5 w-3.5" />
                      </div>
                      <div className="flex flex-col overflow-hidden">
                        <span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">Email</span>
                        <span className="text-xs font-bold truncate">{client.email || "-"}</span>
                      </div>
                    </div>

                    {/* Birthday */}
                    <div className="flex items-center gap-3 p-2.5 rounded-xl bg-muted/30 border border-muted/20 transition-all hover:bg-muted/50">
                      <div className="h-8 w-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-600">
                        <Calendar className="h-3.5 w-3.5" />
                      </div>
                      <div className="flex flex-col overflow-hidden">
                        <span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">Tgl Lahir</span>
                        <span className="text-xs font-bold">
                          {client.birthday ? new Date(client.birthday).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : "-"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Domisili & Wilayah (3/5 width on large screens) */}
                <div className="lg:col-span-3 p-4 lg:p-6">
                  <div className="h-full rounded-2xl border border-muted/20 bg-muted/5 p-5 space-y-5 shadow-sm">
                    <div className="flex items-center gap-2 text-[10px] font-black text-muted-foreground uppercase border-b border-muted/10 pb-3">
                      <MapPin className="h-3.5 w-3.5 text-pink-500" />
                      Domisili & Wilayah
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] font-black text-muted-foreground uppercase tracking-wider">Alamat Lengkap</label>
                        <p className="text-xs font-bold text-foreground leading-relaxed italic line-clamp-2">
                          {client.address || "Alamat tidak tersedia."}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                        <div className="flex flex-col gap-0.5">
                          <label className="text-[9px] font-black text-muted-foreground uppercase tracking-wider">Provinsi</label>
                          <p className="text-[11px] font-bold truncate">{client.province || "-"}</p>
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <label className="text-[9px] font-black text-muted-foreground uppercase tracking-wider">Kota</label>
                          <p className="text-[11px] font-bold truncate">{client.city || "-"}</p>
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <label className="text-[9px] font-black text-muted-foreground uppercase tracking-wider">Kecamatan</label>
                          <p className="text-[11px] font-bold truncate">{client.district || "-"}</p>
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <label className="text-[9px] font-black text-muted-foreground uppercase tracking-wider">Kelurahan</label>
                          <p className="text-[11px] font-bold truncate">{client.village || "-"}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Placeholder for Job History */}
            <Card className="border border-muted-foreground/20 shadow-sm rounded-xl bg-card overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 text-[10px] font-black text-muted-foreground uppercase border-b border-muted/10 pb-2 mb-4">
                  <Building2 className="h-3.5 w-3.5 text-pink-500" />
                  Riwayat Pekerjaan
                </div>
                <div className="flex flex-col items-center justify-center py-10 text-center space-y-3">
                  <div className="h-12 w-12 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground">
                    <FileText className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">Modul Riwayat Segera Hadir</p>
                    <p className="text-xs text-muted-foreground">Sistem sedang memproses data transaksi.</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Placeholder for Invoice History */}
            <Card className="border border-muted-foreground/20 shadow-sm rounded-xl bg-card overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 text-[10px] font-black text-muted-foreground uppercase border-b border-muted/10 pb-2 mb-4">
                  <CreditCard className="h-3.5 w-3.5 text-pink-500" />
                  Riwayat Invoice
                </div>
                {invoices.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center space-y-3">
                    <div className="h-12 w-12 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground">
                      <CreditCard className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground">Riwayat Invoice Kosong</p>
                      <p className="text-xs text-muted-foreground">Belum ada invoice yang diterbitkan.</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {invoices.slice(0, 5).map((inv: any) => (
                      <div key={inv.id} className="rounded-xl border border-muted/20 bg-muted/10 p-4 hover:bg-muted/20 transition-colors">
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1 min-w-0">
                            <div className="text-xs font-black text-foreground truncate">{inv.invoiceNumber}</div>
                            <div className="text-[10px] text-muted-foreground truncate">{inv.job?.title || "-"}</div>
                            <div className="text-[10px] text-muted-foreground italic">
                              {inv.date ? new Date(inv.date).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : "-"}
                              {inv.dueDate ? ` • Jatuh tempo: ${new Date(inv.dueDate).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}` : ""}
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            {getStatusBadge(inv.status)}
                            <div className="text-sm font-black text-foreground">{formatCurrency(Number(inv.amount) || 0)}</div>
                          </div>
                        </div>
                      </div>
                    ))}

                    <div className="pt-2">
                      <Link href="/dashboard/invoice">
                        <Button variant="outline" className="w-full h-10 rounded-xl border-muted-foreground/20 font-bold">
                          Lihat Semua Invoice
                        </Button>
                      </Link>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
