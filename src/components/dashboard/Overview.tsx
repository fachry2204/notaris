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

const data = [
  { name: "Jan", total: 45, completed: 32 },
  { name: "Feb", total: 52, completed: 38 },
  { name: "Mar", total: 48, completed: 40 },
  { name: "Apr", total: 61, completed: 45 },
  { name: "May", total: 55, completed: 42 },
  { name: "Jun", total: 67, completed: 50 },
];

const stats = [
  {
    title: "Total Berkas Masuk",
    value: "1,284",
    description: "+12% dari bulan lalu",
    icon: FileText,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
  },
  {
    title: "Berkas Dalam Proses",
    value: "145",
    description: "24 mendesak",
    icon: Clock,
    color: "text-amber-500",
    bg: "bg-amber-500/10",
  },
  {
    title: "Berkas Selesai",
    value: "1,052",
    description: "Rata-rata 3.2 hari",
    icon: CheckCircle2,
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
  },
  {
    title: "Total Pendapatan",
    value: "Rp 450M",
    description: "+8% target tercapai",
    icon: DollarSign,
    color: "text-purple-500",
    bg: "bg-purple-500/10",
  },
];

import { getUpcomingDeadlines } from "@/lib/actions/jobs";
import { toast } from "sonner";

export function DashboardOverview() {
  const [deadlines, setDeadlines] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchDeadlines = async () => {
      setLoading(true);
      const result = await getUpcomingDeadlines();
      if (result.success) {
        setDeadlines(result.data || []);
      } else {
        toast.error(result.error);
      }
      setLoading(false);
    };
    fetchDeadlines();
  }, []);

  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* ... (AreaChart Card remains same for now as it needs monthly aggregate data) */}
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
                <AreaChart data={data}>
                  <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
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
                      backgroundColor: "rgba(0,0,0,0.8)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "8px",
                      color: "#fff",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="total"
                    stroke="var(--color-primary)"
                    fillOpacity={1}
                    fill="url(#colorTotal)"
                  />
                  <Area
                    type="monotone"
                    dataKey="completed"
                    stroke="#10b981"
                    fillOpacity={0}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3 border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Deadline Pekerjaan</CardTitle>
            <CardDescription>
              Pekerjaan yang mendekati batas waktu (7 hari ke depan)
            </CardDescription>
          </CardHeader>
          <CardContent>
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
                  const daysLeft = Math.ceil((new Date(job.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                  return (
                    <div key={job.id} className="flex items-center gap-4">
                      <div className={`h-2 w-2 rounded-full ${
                        daysLeft <= 1 ? 'bg-red-500' : 
                        daysLeft <= 3 ? 'bg-amber-500' : 'bg-blue-500'
                      }`} />
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium leading-none line-clamp-1">{job.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {job.client?.name} • {daysLeft} hari lagi
                        </p>
                      </div>
                      <div className={cn(
                        "text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider",
                        job.priority === 'URGENT' ? 'bg-red-500/10 text-red-500' : 
                        job.priority === 'HIGH' ? 'bg-amber-500/10 text-amber-500' : 'bg-blue-500/10 text-blue-500'
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
