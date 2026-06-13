"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Search, MapPin, Package, CheckCircle2, Clock, ShieldCheck, ArrowRight, QrCode } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const mockTrackingData = {
  code: "J-2026-002",
  title: "Pendirian PT Berkah Jaya",
  status: "DIPROSES",
  progress: 65,
  currentStep: 2,
  steps: [
    { title: "Registrasi Berkas", time: "10 Mei 2026, 09:15", status: "completed", desc: "Berkas diterima dan diregistrasi oleh Admin." },
    { title: "Verifikasi Dokumen", time: "10 Mei 2026, 14:30", status: "completed", desc: "Dokumen telah lengkap dan divalidasi oleh Staff." },
    { title: "Proses Pembuatan Akta", time: "11 Mei 2026, 10:00", status: "active", desc: "Draft akta sedang disusun oleh Staff Hukum." },
    { title: "Penandatanganan", time: "-", status: "pending", desc: "Menunggu jadwal tanda tangan client." },
    { title: "Selesai", time: "-", status: "pending", desc: "Arsip digital dan dokumen fisik siap diambil." },
  ]
};

export default function TrackingPage() {
  const [trackingCode, setTrackingCode] = useState("");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setResult(mockTrackingData);
      setLoading(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col p-4 md:p-8 relative overflow-hidden">
       {/* Abstract Background Decoration */}
       <div className="absolute top-0 left-0 w-full h-full opacity-40 pointer-events-none">
        <div className="absolute -top-[10%] -left-[5%] w-[50%] h-[50%] rounded-full bg-blue-100 blur-[100px]" />
        <div className="absolute -bottom-[10%] -right-[5%] w-[50%] h-[50%] rounded-full bg-amber-50 blur-[100px]" />
      </div>

      <div className="max-w-4xl mx-auto w-full z-10">
        {/* Header */}
        <div className="flex flex-col items-center mb-12 text-center">
          <div className="h-14 w-14 rounded-2xl bg-primary flex items-center justify-center mb-4 shadow-lg shadow-primary/20">
            <QrCode className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight mb-2">Tracking Berkas Digital</h1>
          <p className="text-slate-500">Masukkan kode tracking Anda untuk melihat progress pekerjaan secara realtime.</p>
        </div>

        {/* Search Bar */}
        <Card className="border-slate-200 bg-white/80 backdrop-blur-xl mb-8 shadow-xl shadow-slate-200/50">
          <CardContent className="p-4">
            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <Input 
                  placeholder="Contoh: J-2026-002" 
                  className="bg-white border-slate-200 text-slate-900 pl-10 h-12 text-lg focus:ring-primary"
                  value={trackingCode}
                  onChange={(e) => setTrackingCode(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" disabled={loading} className="h-12 px-8 bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-lg shadow-primary/20">
                {loading ? "Mencari..." : "Lacak"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Results */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <Card className="border-slate-200 bg-white/80 backdrop-blur-xl shadow-xl shadow-slate-200/50">
                <CardHeader>
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <CardTitle className="text-xl text-slate-900">{result.title}</CardTitle>
                      <CardDescription className="text-slate-500">Kode Tracking: <span className="text-primary font-mono font-bold">{result.code}</span></CardDescription>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-100 border border-emerald-200 text-emerald-700 font-bold">
                      <CheckCircle2 className="h-4 w-4" />
                      {result.status}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="relative mt-8">
                    {/* Timeline Line */}
                    <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-200 ml-[2px]" />
                    
                    <div className="space-y-8 relative">
                      {result.steps.map((step: any, idx: number) => (
                        <div key={idx} className="flex gap-6">
                          <div className={`relative z-10 h-6 w-6 rounded-full flex items-center justify-center shadow-sm ${
                            step.status === 'completed' ? 'bg-emerald-500' : 
                            step.status === 'active' ? 'bg-primary ring-4 ring-primary/20' : 'bg-slate-100 border border-slate-200'
                          }`}>
                            {step.status === 'completed' ? (
                              <CheckCircle2 className="h-4 w-4 text-white" />
                            ) : (
                              <div className={`h-2 w-2 rounded-full ${step.status === 'active' ? 'bg-white' : 'bg-slate-300'}`} />
                            )}
                          </div>
                          <div className="flex-1 pb-4">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-1 mb-1">
                              <h3 className={`font-bold ${step.status === 'active' ? 'text-slate-900' : 'text-slate-500'}`}>
                                {step.title}
                              </h3>
                              <span className="text-xs text-slate-400 flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {step.time}
                              </span>
                            </div>
                            <p className="text-sm text-slate-500">{step.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="border-slate-200 bg-white/80 backdrop-blur-xl shadow-lg shadow-slate-200/50">
                  <CardContent className="p-6 flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                      <Clock className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Estimasi Selesai</p>
                      <p className="text-lg font-bold text-slate-900">15 Mei 2026</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-slate-200 bg-white/80 backdrop-blur-xl shadow-lg shadow-slate-200/50">
                  <CardContent className="p-6 flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                      <ShieldCheck className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Verified by</p>
                      <p className="text-lg font-bold text-slate-900">Notaris Digital System</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
