"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  FileText, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import { cn } from "@/lib/utils";

import { getDashboardStats } from "@/lib/actions/jobs";
import { toast } from "sonner";

export function StatusCards() {
  const [stats, setStats] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      const result = await getDashboardStats();
      if (result.success) {
        setStats(result.data);
      } else {
        toast.error(result.error);
      }
      setLoading(false);
    };
    fetchStats();
  }, []);

  const statuses = [
    {
      title: "Data Berkas",
      value: stats?.totalJobs.toLocaleString() || "0",
      trend: "+0%",
      trendUp: true,
      icon: FileText,
      color: "text-pink-500",
      bg: "bg-pink-500/10",
      description: "Total dokumen diterima"
    },
    {
      title: "Dalam Proses",
      value: stats?.processingJobs.toLocaleString() || "0",
      trend: "+0%",
      trendUp: true,
      icon: Clock,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
      description: "Sedang dikerjakan"
    },
    {
      title: "Berkas Selesai",
      value: stats?.doneJobs.toLocaleString() || "0",
      trend: "+0%",
      trendUp: true,
      icon: CheckCircle2,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
      description: "Sudah diselesaikan"
    },
    {
      title: "Tertunda",
      value: stats?.pendingJobs.toLocaleString() || "0",
      trend: "+0%",
      trendUp: false,
      icon: AlertCircle,
      color: "text-rose-500",
      bg: "bg-rose-500/10",
      description: "Membutuhkan perhatian"
    }
  ];

  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="h-40 animate-pulse bg-muted/50 rounded-2xl border-none" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {statuses.map((status, i) => (
        <Card key={i} className="border-none shadow-sm rounded-2xl bg-card overflow-hidden group hover:shadow-md transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 px-6 pt-6">
            <div className={cn("p-2.5 rounded-xl transition-colors duration-300", status.bg, status.color)}>
              <status.icon className="h-5 w-5" />
            </div>
            <div className={cn(
              "flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-lg",
              status.trendUp ? "bg-green-500/10 text-green-600" : "bg-rose-500/10 text-rose-600"
            )}>
              {status.trendUp ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
              {status.trend}
            </div>
          </CardHeader>
          <CardContent className="px-6 pb-6 pt-2">
            <div className="flex flex-col">
              <span className="text-3xl font-bold tracking-tight text-foreground">{status.value}</span>
              <span className="text-sm font-semibold text-foreground mt-1">{status.title}</span>
              <span className="text-xs text-muted-foreground mt-1">{status.description}</span>
            </div>
          </CardContent>
          <div className="h-1.5 w-full bg-muted/20">
            <div 
              className={cn("h-full transition-all duration-1000", status.color.replace('text-', 'bg-'))} 
              style={{ width: `${Math.min(100, (parseInt(status.value.replace(/,/g, '')) / (stats?.totalJobs || 1)) * 100)}%` }}
            />
          </div>
        </Card>
      ))}
    </div>
  );
}
