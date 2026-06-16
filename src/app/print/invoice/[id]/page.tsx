"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getInvoiceById } from "@/lib/actions/invoice";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { QRCodeSVG } from "qrcode.react";

export default function PrintInvoicePage() {
  const params = useParams();
  const invoiceId = params.id as string;
  const [invoice, setInvoice] = useState<any>(null);
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [originUrl, setOriginUrl] = useState("");

  useEffect(() => {
    const load = async () => {
      setOriginUrl(window.location.origin);
      setLoading(true);
      const [res, settingsRes] = await Promise.all([
        getInvoiceById(invoiceId),
        fetch("/api/settings").then(r => r.json()).catch(() => ({}))
      ]);

      if (settingsRes?.success) {
        setSettings(settingsRes.data);
      }

      if (res.success && res.data) {
        setInvoice(res.data);
        // Otomatis trigger print setelah data load (beri jeda sedikit untuk render)
        setTimeout(() => {
          window.print();
        }, 500);
      }
      setLoading(false);
    };
    if (invoiceId) load();
  }, [invoiceId]);

  const formatCurrency = (amount: number | string) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(Number(amount) || 0);
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

  if (loading) {
    return <div className="p-10 font-sans text-sm">Mempersiapkan dokumen cetak...</div>;
  }

  if (!invoice) {
    return <div className="p-10 font-sans text-sm text-red-600">Invoice tidak ditemukan.</div>;
  }

  return (
    <div id="print-root" className="bg-white min-h-screen font-sans text-slate-800">
      {/* Container utama dibuat selebar kertas A4 kurang lebih */}
      <div className="max-w-4xl mx-auto p-10 print:p-0">
        
        {/* HEADER */}
        <div className="flex justify-between items-start border-b-2 border-slate-800 pb-6 mb-8">
          <div className="flex items-center gap-4">
            {settings?.branding?.logoUrl && (
              <img src={settings.branding.logoUrl} alt="Logo" className="h-16 w-auto object-contain" />
            )}
            <div>
              <h1 className="text-xl font-black tracking-tighter text-slate-900 uppercase">INVOICE</h1>
              <p className="text-xs font-bold text-slate-500 mt-0.5">{invoice.invoiceNumber}</p>
            </div>
          </div>
          <div className="text-right space-y-0.5">
            <h2 className="text-base font-black text-slate-900">{settings?.general?.officeName || "KANTOR NOTARIS & PPAT"}</h2>
            <p className="text-[10px] text-slate-600 whitespace-pre-line">{settings?.general?.officeAddress || "Sistem Informasi Manajemen Notaris"}</p>
          </div>
        </div>

        {/* INFO INVOICE & KLIEN */}
        <div className="flex justify-between items-start mb-12">
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Tagihan Kepada:</p>
            <h3 className="text-sm font-black text-slate-900">{invoice.client?.name || "Klien Umum"}</h3>
            <p className="text-sm text-slate-600 max-w-xs mt-2">
              <strong>Pekerjaan:</strong><br/>
              {invoice.job?.title || "-"}<br/>
              <span className="text-xs">No. Berkas: {invoice.job?.trackingCode || "-"}</span>
            </p>
          </div>

          <div className="space-y-4 text-right">
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Tanggal Invoice</p>
              <p className="text-xs font-semibold">{format(new Date(invoice.date), "dd MMMM yyyy", { locale: id })}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Jatuh Tempo</p>
              <p className="text-xs font-semibold text-red-600">{invoice.dueDate ? format(new Date(invoice.dueDate), "dd MMMM yyyy", { locale: id }) : "-"}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Status Pembayaran</p>
              <p className="text-xs font-black uppercase">{invoice.status}</p>
            </div>
          </div>
        </div>

        {/* TABEL RINCIAN */}
        {(() => {
          const data = getParsedInvoice(invoice.description);
          const subtotal = data.items ? data.items.reduce((sum: number, item: any) => sum + (Number(item.amount) || 0), 0) : invoice.amount;
          const discount = data.discountType === "percentage" ? (subtotal * (Number(data.discountValue) || 0) / 100) : (Number(data.discountValue) || 0);
          const afterDiscount = subtotal - discount;
          const tax = afterDiscount * (Number(data.taxPercentage) || 0) / 100;
          const totalInstallments = data.installments ? data.installments.reduce((sum: number, inst: any) => sum + (Number(inst.amount) || 0), 0) : 0;
          const sisaTagihan = invoice.amount - (Number(data.dpAmount) || 0) - totalInstallments;

          return (
            <table className="w-full mb-8 border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-800">
                  <th className="py-3 text-left text-xs font-black text-slate-900 uppercase tracking-widest">Deskripsi Layanan</th>
                  <th className="py-3 text-right text-xs font-black text-slate-900 uppercase tracking-widest w-48">Total Biaya</th>
                </tr>
              </thead>
              <tbody>
                {data.items && data.items.map((item: any, idx: number) => (
                  <tr key={idx} className="border-b border-slate-200">
                    <td className="py-5">
                      <p className="font-bold text-slate-900">{item.description || "Item"}</p>
                    </td>
                    <td className="py-5 text-right font-bold text-slate-900">
                      {formatCurrency(item.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                {(discount > 0 || tax > 0) && (
                  <>
                    <tr>
                      <td className="py-3 text-right font-bold text-slate-600 text-sm">
                        Subtotal
                      </td>
                      <td className="py-3 text-right font-bold text-slate-900 text-sm">
                        {formatCurrency(subtotal)}
                      </td>
                    </tr>
                    {discount > 0 && (
                      <tr>
                        <td className="py-2 text-right font-bold text-slate-600 text-sm">
                          Diskon
                        </td>
                        <td className="py-2 text-right font-bold text-red-600 text-sm">
                          - {formatCurrency(discount)}
                        </td>
                      </tr>
                    )}
                    {tax > 0 && (
                      <tr>
                        <td className="py-2 text-right font-bold text-slate-600 text-sm border-b border-slate-200 pb-4">
                          Pajak ({data.taxPercentage}%)
                        </td>
                        <td className="py-2 text-right font-bold text-slate-900 text-sm border-b border-slate-200 pb-4">
                          {formatCurrency(tax)}
                        </td>
                      </tr>
                    )}
                  </>
                )}
                <tr>
                  <td className="py-5 text-right font-black text-slate-900 uppercase tracking-widest">
                    Total Tagihan
                  </td>
                  <td className="py-5 text-right font-black text-base text-slate-900">
                    {formatCurrency(invoice.amount)}
                  </td>
                </tr>

                {(Number(data.dpAmount) > 0 || (data.installments && data.installments.length > 0)) && (
                  <>
                    <tr>
                      <td colSpan={2} className="py-4">
                        <div className="border border-slate-200 rounded-xl p-5 bg-slate-50/50 mt-4">
                          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Riwayat Pembayaran Rencana</p>
                          <div className="space-y-2">
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
                                  <p className="text-[10px] text-slate-500">{inst.date ? format(new Date(inst.date), "dd MMM yyyy", { locale: id }) : ""}</p>
                                </div>
                                <p className="font-semibold text-emerald-600">{formatCurrency(inst.amount)}</p>
                              </div>
                            ))}
                            <div className="flex justify-between items-center pt-2 mt-2 border-t border-slate-200">
                              <p className="font-bold text-red-600">Sisa Tagihan</p>
                              <p className="font-black text-red-600">{formatCurrency(sisaTagihan)}</p>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  </>
                )}
              </tfoot>
            </table>
          );
        })()}

        {/* KETERANGAN TAMBAHAN / TANDA TANGAN */}
        <div className="flex justify-between items-end mt-8">
          <div className="max-w-md">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Instruksi Pembayaran:</p>
            <p className="text-xs text-slate-600 leading-relaxed">
              Silakan lakukan pembayaran ke rekening berikut: <br/><br/>
              <strong>Bank:</strong> {settings?.finance?.bankName || "Bank Central Asia (BCA)"} <br/>
              <strong>No. Rekening:</strong> {settings?.finance?.accountNumber || "1234567890"} <br/>
              <strong>Atas Nama:</strong> {settings?.finance?.accountName || "Kantor Notaris Fachry"} <br/><br/>
              Jika sudah melakukan pembayaran, harap konfirmasi ke nomor admin: <strong className="whitespace-nowrap">{settings?.general?.officePhone || "+62 21 12345678"}</strong>.
            </p>
          </div>

          {invoice.job?.trackingCode && originUrl && (
            <div className="flex flex-col items-center justify-center opacity-80 mb-6">
              <QRCodeSVG 
                value={`${originUrl}/cek-berkas?nomor=${invoice.job.trackingCode}`} 
                size={70}
              />
              <p className="text-[7px] font-bold mt-1.5 text-slate-500 uppercase tracking-wider">Scan Cek Berkas</p>
            </div>
          )}
          
          <div className="text-center w-48">
            <p className="text-xs text-slate-600 mb-16">Hormat Kami,</p>
            <div className="border-b border-slate-800 w-full mb-2"></div>
            <p className="text-xs font-bold text-slate-900 uppercase">Bagian Keuangan</p>
          </div>
        </div>

        {/* FOOTER KERTAS */}
        <div className="mt-20 pt-6 border-t border-slate-200 text-center">
          <p className="text-[10px] text-slate-400">
            Invoice ini sah dan digenerate otomatis oleh {settings?.branding?.appName || "Aplikasi Notaris"} dan {settings?.general?.officeName || "Kantor Notaris"}.
          </p>
        </div>

      </div>

      {/* CSS untuk memastikannya bagus saat diprint */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * {
            visibility: hidden;
          }
          #print-root, #print-root * {
            visibility: visible;
          }
          #print-root {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          @page {
            size: A4;
            margin: 1.5cm;
          }
        }
      `}} />
    </div>
  );
}
