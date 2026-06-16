"use client";

import React, { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { getJobById } from "@/lib/actions/jobs";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { QRCodeSVG } from "qrcode.react";

export default function PrintTandaTerimaPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const jobId = params.id as string;
  const type = searchParams.get('type') || 'penyerahan'; // penyerahan | pengambilan
  
  const [job, setJob] = useState<any>(null);
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [originUrl, setOriginUrl] = useState("");

  useEffect(() => {
    const load = async () => {
      setOriginUrl(window.location.origin);
      setLoading(true);
      const [res, settingsRes] = await Promise.all([
        getJobById(jobId),
        fetch("/api/settings").then(r => r.json()).catch(() => ({}))
      ]);

      if (settingsRes?.success) {
        setSettings(settingsRes.data);
      }

      if (res.success && res.data) {
        setJob(res.data);
        // Otomatis trigger print setelah data load (beri jeda sedikit untuk render)
        setTimeout(() => {
          window.print();
        }, 500);
      }
      setLoading(false);
    };
    if (jobId) load();
  }, [jobId]);

  if (loading || !job) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Memuat dokumen...</p>
      </div>
    );
  }

  const title = type === 'pengambilan' ? 'TANDA TERIMA PENGAMBILAN BERKAS' : 'TANDA TERIMA PENYERAHAN BERKAS';
  const desc = type === 'pengambilan' 
    ? 'Telah diserahkan kembali kepada klien, berkas dengan rincian sebagai berikut:'
    : 'Telah diterima dari klien, dokumen/berkas dengan rincian sebagai berikut untuk diproses:';

  return (
    <div id="print-root" className="bg-white min-h-screen font-sans text-slate-800">
      {/* Container utama dibuat selebar kertas A4 kurang lebih */}
      <div className="max-w-4xl mx-auto p-10 print:p-0">
        
        {/* HEADER */}
        <div className="flex justify-between items-start border-b-2 border-slate-800 pb-6 mb-8">
          <div className="flex items-center gap-4">
            {settings?.branding?.logoUrl && (
              <img src={settings?.branding?.logoUrl} alt="Logo" className="h-16 w-auto object-contain" />
            )}
            <div>
              <h1 className="text-xl font-black tracking-tighter text-slate-900 uppercase">TANDA TERIMA</h1>
              <p className="text-xs font-bold text-slate-500 mt-0.5">{job.trackingCode}</p>
            </div>
          </div>
          <div className="text-right space-y-0.5">
            <h2 className="text-base font-black text-slate-900">{settings?.general?.officeName || "KANTOR NOTARIS & PPAT"}</h2>
            <p className="text-[10px] text-slate-600 whitespace-pre-line">{settings?.general?.officeAddress || "Sistem Informasi Manajemen Notaris"}</p>
            <p className="text-[10px] text-slate-600">{settings?.general?.officePhone || ""}</p>
          </div>
        </div>

        {/* JUDUL */}
        <div className="text-center mb-10">
          <h2 className="text-xl font-black text-slate-900 underline underline-offset-4">{title}</h2>
          <p className="text-xs text-slate-500 mt-2">
            Tanggal: {format(new Date(), "dd MMMM yyyy", { locale: id })}
          </p>
        </div>

        {/* ISI */}
        <div className="space-y-6 text-sm mb-12">
          <p className="text-slate-700">{desc}</p>
          
          <table className="w-full text-left border-collapse">
            <tbody>
              <tr className="border-b border-slate-100">
                <th className="py-3 w-1/3 text-slate-500 font-medium">Nama Klien / Perusahaan</th>
                <td className="py-3 font-bold text-slate-900">
                  {job.client?.company ? `${job.client.company} (${job.client.name})` : job.client?.name || "-"}
                </td>
              </tr>
              <tr className="border-b border-slate-100">
                <th className="py-3 w-1/3 text-slate-500 font-medium">No. Telepon / WA</th>
                <td className="py-3 font-bold text-slate-900">{job.client?.phone || "-"}</td>
              </tr>
              <tr className="border-b border-slate-100">
                <th className="py-3 w-1/3 text-slate-500 font-medium">Judul Pekerjaan</th>
                <td className="py-3 font-bold text-slate-900">{job.title}</td>
              </tr>
              <tr className="border-b border-slate-100">
                <th className="py-3 w-1/3 text-slate-500 font-medium">Nomor Registrasi / Berkas</th>
                <td className="py-3 font-bold text-slate-900">{job.trackingCode}</td>
              </tr>
              <tr className="border-b border-slate-100">
                <th className="py-3 w-1/3 text-slate-500 font-medium align-top">Jenis Pekerjaan</th>
                <td className="py-3 font-bold text-slate-900 leading-relaxed">
                  <div>Pengurusan Untuk : {job.category || "-"}</div>
                  <div>Nama Badan Hukum : {job.client?.company || job.client?.name || "-"}</div>
                </td>
              </tr>
            </tbody>
          </table>

          <div className="mt-8">
            <h4 className="font-bold text-slate-800 mb-2">Keterangan / Catatan:</h4>
            <div className="border border-slate-300 rounded-lg p-4 min-h-[100px]">
              {/* Tempat kosong untuk diisi tulisan tangan jika perlu */}
            </div>
          </div>
        </div>

        {/* TANDA TANGAN */}
        <div className="flex justify-between items-end mt-16 pt-8">
          <div className="text-center w-48">
            <p className="text-xs text-slate-600 mb-20">{type === 'pengambilan' ? 'Yang Menerima,' : 'Yang Menyerahkan,'}</p>
            <div className="border-b border-slate-800 w-full mb-2"></div>
            <p className="text-xs font-bold text-slate-900 uppercase">
              {job.client?.name || "Klien"}
            </p>
          </div>
          
          {originUrl && job.trackingCode && (
            <div className="flex flex-col items-center justify-center opacity-80">
              <QRCodeSVG 
                value={`${originUrl}/cek-berkas?nomor=${job.trackingCode}`} 
                size={80}
              />
              <p className="text-[8px] font-bold mt-2 text-slate-500 uppercase tracking-wider">Scan Cek Berkas</p>
            </div>
          )}

          <div className="text-center w-48">
            <p className="text-xs text-slate-600 mb-20">{type === 'pengambilan' ? 'Yang Menyerahkan,' : 'Yang Menerima,'}</p>
            <div className="border-b border-slate-800 w-full mb-2"></div>
            <p className="text-xs font-bold text-slate-900 uppercase">
              Bagian Administrasi
            </p>
          </div>
        </div>

        {/* FOOTER KERTAS */}
        <div className="mt-20 pt-6 border-t border-slate-200 text-center">
          <p className="text-[10px] text-slate-400">
            Tanda terima ini sah dan dicetak otomatis oleh {settings?.branding?.appName || "Aplikasi Notaris"} dari {settings?.general?.officeName || "Kantor Notaris"}.
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
