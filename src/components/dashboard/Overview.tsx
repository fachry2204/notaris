"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
} from "recharts";
import {
  FileText,
  Users,
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingUp,
  DollarSign,
} from "lucide-react";

import { getUpcomingDeadlines, getMonthlyJobStats, getDashboardStats } from "@/lib/actions/jobs";
import { toast } from "sonner";

export function DashboardOverview() {
  const [deadlines, setDeadlines] = React.useState<any[]>([]);
  const [chartData, setChartData] = React.useState<any[]>([]);
  const [dashboardStats, setDashboardStats] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [deadlinesRes, chartRes, statsRes] = await Promise.all([
          getUpcomingDeadlines(),
          getMonthlyJobStats(),
          getDashboardStats()
        ]);

        if (deadlinesRes.success) setDeadlines(deadlinesRes.data || []);
        if (chartRes.success) setChartData(chartRes.data || []);
        if (statsRes.success) setDashboardStats(statsRes.data);
      } catch (error) {
        console.error("Error fetching overview data:", error);
        toast.error("Gagal memuat data dashboard");
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  const summaryStats = [
    {
      title: "Total Berkas Masuk",
      value: dashboardStats?.totalJobs.toLocaleString() || "0",
      description: "Seluruh kategori",
      icon: FileText,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      title: "Dalam Proses",
      value: dashboardStats?.processingJobs.toLocaleString() || "0",
      description: "Sedang dikerjakan",
      icon: Clock,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
    },
    {
      title: "Berkas Selesai",
      value: dashboardStats?.doneJobs.toLocaleString() || "0",
      description: "Arsip digital",
      icon: CheckCircle2,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
    },
    {
      title: "Pending",
      value: dashboardStats?.pendingJobs.toLocaleString() || "0",
      description: "Butuh verifikasi",
      icon: AlertCircle,
      color: "text-rose-500",
      bg: "bg-rose-500/10",
    },
  ];

  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4 border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Statistik Pekerjaan</CardTitle>
            <CardDescription>
              Perbandingan berkas masuk dan berkas selesai (6 bulan terakhir)
            </CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f47eab" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#f47eab" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                  <XAxis
                    dataKey="name"
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${value}`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(255,255,255,0.9)",
                      border: "none",
                      borderRadius: "12px",
                      boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="total"
                    name="Berkas Masuk"
                    stroke="#f47eab"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorTotal)"
                  />
                  <Area
                    type="monotone"
                    dataKey="completed"
                    name="Berkas Selesai"
                    stroke="#10b981"
                    strokeWidth={3}
                    fillOpacity={0}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3 border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
          <CardHeader>
            <CardTitle>Deadline Pekerjaan</CardTitle>
            <CardDescription>
              Pekerjaan yang mendekati batas waktu (7 hari ke depan)
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] overflow-y-auto custom-scrollbar pr-2">
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="h-12 w-full animate-pulse bg-muted/50 rounded-lg" />
                ))}
              </div>
            ) : deadlines.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center space-y-3">
                <CheckCircle2 className="h-10 w-10 text-emerald-500 opacity-20" />
                <p className="text-sm text-muted-foreground">Tidak ada deadline mendesak.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {deadlines.map((job) => {
                  const deadlineDate = new Date(job.deadline);
                  const daysLeft = Math.ceil((deadlineDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                  return (
                    <div key={job.id} className="flex items-center gap-4 group hover:bg-muted/30 p-2 rounded-xl transition-all">
                      <div className={`h-2.5 w-2.5 rounded-full ${
                        daysLeft <= 1 ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)] animate-pulse' : 
                        daysLeft <= 3 ? 'bg-amber-500' : 'bg-blue-500'
                      }`} />
                      <div className="flex-1 space-y-0.5">
                        <p className="text-sm font-bold leading-none line-clamp-1">{job.title}</p>
                        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                          {job.client?.name} • {daysLeft === 0 ? 'Hari ini' : daysLeft < 0 ? 'Terlambat' : `${daysLeft} hari lagi`}
                        </p>
                      </div>
                      <div className={cn(
                        "text-[9px] font-black px-2 py-1 rounded-lg uppercase tracking-widest",
                        job.priority === 'URGENT' ? 'bg-rose-500 text-white' : 
                        job.priority === 'HIGH' ? 'bg-amber-500/10 text-amber-600' : 'bg-blue-500/10 text-blue-600'
                      )}>
                        {job.priority}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
