"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Sparkles, Brain, Loader2, CheckCircle2, AlertTriangle, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";

export function AIAssistant() {
  const [analyzing, setAnalyzing] = useState(false);
  const [report, setReport] = useState<any>(null);

  const startAnalysis = () => {
    setAnalyzing(true);
    setReport(null);
    setTimeout(() => {
      setReport({
        summary: "Berdasarkan data 30 hari terakhir, produktivitas kantor meningkat 15%. Namun, terdapat bottleneck pada proses 'Balik Nama Sertifikat' yang rata-rata memakan waktu 12 hari (di atas target 7 hari).",
        recommendations: [
          "Prioritaskan 5 berkas mendesak yang mendekati deadline minggu ini.",
          "Alokasikan staff tambahan untuk departemen Pertanahan.",
          "Kirim pengingat otomatis untuk 12 client yang belum melunasi tagihan."
        ],
        healthScore: 82
      });
      setAnalyzing(false);
    }, 2500);
  };

  return (
    <Card className="border-primary/20 bg-primary/5 backdrop-blur-sm overflow-hidden relative">
      <div className="absolute top-0 right-0 p-4 opacity-10">
        <Brain className="h-24 w-24" />
      </div>
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </div>
          <CardTitle>AI Analytics Assistant</CardTitle>
        </div>
        <CardDescription>Analisa otomatis performa kantor dan rekomendasi tindakan.</CardDescription>
      </CardHeader>
      <CardContent>
        {!report && !analyzing && (
          <div className="flex flex-col items-center py-8 text-center">
            <Brain className="h-12 w-12 text-primary/40 mb-4" />
            <p className="text-sm text-muted-foreground mb-6 max-w-xs">
              Klik tombol di bawah untuk memulai analisa cerdas terhadap seluruh data pekerjaan dan keuangan.
            </p>
            <Button onClick={startAnalysis} className="gap-2">
              <Sparkles className="h-4 w-4" />
              Mulai Analisa AI
            </Button>
          </div>
        )}

        {analyzing && (
          <div className="flex flex-col items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-sm font-medium animate-pulse">Sedang menganalisa ribuan data...</p>
          </div>
        )}

        {report && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="p-4 rounded-lg bg-background/50 border border-border/50">
              <h4 className="text-sm font-bold flex items-center gap-2 mb-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                Ringkasan AI
              </h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {report.summary}
              </p>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Rekomendasi Tindakan</h4>
              {report.recommendations.map((rec: string, i: number) => (
                <div key={i} className="flex gap-3 items-start p-3 rounded-lg bg-primary/10 border border-primary/20 text-sm">
                  <div className="h-5 w-5 rounded-full bg-primary flex-shrink-0 flex items-center justify-center text-[10px] font-bold text-primary-foreground">
                    {i + 1}
                  </div>
                  {rec}
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                <span className="text-sm font-medium">Health Score Kantor</span>
              </div>
              <div className="text-2xl font-black text-amber-600">{report.healthScore}%</div>
            </div>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}
