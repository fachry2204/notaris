"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getJobStats } from "@/lib/actions/jobs";
import { cn } from "@/lib/utils";
import { 
  FileText, 
  Clock, 
  RefreshCcw, 
  CheckCircle2, 
  AlertCircle,
  Search,
  ShieldCheck,
  PauseCircle
} from "lucide-react";

interface JobStatsCardsProps {
  selectedStatus?: string | null;
  onStatusClick?: (status: string | null) => void;
}

export function JobStatsCards({ selectedStatus, onStatusClick }: JobStatsCardsProps) {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      const result = await getJobStats();
      if (result.success) {
        setStats(result.data);
      }
      setLoading(false);
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i} className="border-none shadow-sm animate-pulse bg-muted/20 h-24 rounded-2xl"></Card>
        ))}
      </div>
    );
  }

  if (!stats) return null;

  const cardData = [
    {
      label: "Total Berkas",
      status: null,
      value: stats.total,
      icon: FileText,
      color: "text-slate-600",
      bg: "bg-slate-500/[0.03]",
      activeBorder: "border-slate-500",
      border: "border-l-slate-500"
    },
    {
      label: "Pending",
      status: "PENDING",
      value: stats.pending,
      icon: PauseCircle,
      color: "text-amber-600",
      bg: "bg-amber-500/[0.03]",
      activeBorder: "border-amber-500",
      border: "border-l-amber-500"
    },
    {
      label: "Proses",
      status: "PROSES",
      value: stats.proses,
      icon: Clock,
      color: "text-blue-600",
      bg: "bg-blue-500/[0.03]",
      activeBorder: "border-blue-500",
      border: "border-l-blue-500"
    },
    {
      label: "Revisi",
      status: "REVISI",
      value: stats.revisi,
      icon: RefreshCcw,
      color: "text-red-600",
      bg: "bg-red-500/[0.03]",
      activeBorder: "border-red-500",
      border: "border-l-red-500"
    },
    {
      label: "Verifikasi",
      status: "VERIFIKASI",
      value: stats.verifikasi,
      icon: ShieldCheck,
      color: "text-purple-600",
      bg: "bg-purple-500/[0.03]",
      activeBorder: "border-purple-500",
      border: "border-l-purple-500"
    },
    {
      label: "Selesai",
      status: "SELESAI",
      value: stats.selesai,
      icon: CheckCircle2,
      color: "text-emerald-600",
      bg: "bg-emerald-500/[0.03]",
      activeBorder: "border-emerald-500",
      border: "border-l-emerald-500"
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
      {cardData.map((card) => {
        const isActive = selectedStatus === card.status;
        return (
          <Card 
            key={card.label} 
            className={cn(
              "border-none shadow-sm cursor-pointer overflow-hidden group hover:scale-[1.02] transition-all duration-300 rounded-2xl",
              card.bg,
              isActive ? `border-2 ${card.activeBorder} ring-4 ring-offset-0 ${card.bg.replace('[0.03]', '[0.1]')}` : `border-l-4 ${card.border}`
            )}
            onClick={() => onStatusClick?.(card.status)}
          >
            <CardHeader className="p-4 flex flex-row items-center justify-between space-y-0">
              <div className="min-w-0">
                <CardDescription className={cn(
                  "font-black text-[9px] uppercase tracking-tighter truncate",
                  card.color,
                  !isActive && "opacity-70"
                )}>
                  {card.label}
                </CardDescription>
                <CardTitle className={cn("text-xl font-black mt-0.5", card.color)}>
                  {card.value}
                </CardTitle>
              </div>
              <div className={cn(
                "h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 ml-1 transition-colors",
                card.bg.replace('0.03', '0.1'),
                isActive && "scale-110"
              )}>
                <card.icon className={cn("h-4 w-4", card.color)} />
              </div>
            </CardHeader>
          </Card>
        );
      })}
    </div>
  );
}
