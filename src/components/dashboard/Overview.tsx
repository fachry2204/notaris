"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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

export function DashboardOverview() {
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
              Pekerjaan yang mendekati batas waktu
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { title: "Akta Jual Beli - Budi", days: 1, priority: "URGENT" },
                { title: "Perjanjian Sewa - Siska", days: 2, priority: "HIGH" },
                { title: "Pendirian PT - Maju Jaya", days: 3, priority: "MEDIUM" },
                { title: "Balik Nama Sertifikat", days: 5, priority: "MEDIUM" },
              ].map((job, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className={`h-2 w-2 rounded-full ${
                    job.priority === 'URGENT' ? 'bg-red-500' : 
                    job.priority === 'HIGH' ? 'bg-amber-500' : 'bg-blue-500'
                  }`} />
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none">{job.title}</p>
                    <p className="text-xs text-muted-foreground">
                      Batas waktu: {job.days} hari lagi
                    </p>
                  </div>
                  <div className="text-xs font-semibold px-2 py-1 rounded bg-secondary/50">
                    {job.priority}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
