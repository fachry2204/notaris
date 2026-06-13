"use client";
import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { getJobStats, getMonthlyJobStats, getUpcomingDeadlines } from "@/lib/actions/jobs";
import { toast } from "sonner";
import { BarChart3, Clock, TrendingUp, AlertCircle } from "lucide-react";

export default function StatsPage() {
  const [stats, setStats] = useState<any>(null);
  const [monthly, setMonthly] = useState<any[]>([]);
  const [deadlines, setDeadlines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const [statsResult, monthlyResult, deadlinesResult] = await Promise.all([
        getJobStats(),
        getMonthlyJobStats(),
        getUpcomingDeadlines()
      ]);

      if (statsResult.success) setStats(statsResult.data || null);
      else toast.error(statsResult.error);

      if (monthlyResult.success) setMonthly(Array.isArray(monthlyResult.data) ? monthlyResult.data : []);
      else toast.error(monthlyResult.error);

      if (deadlinesResult.success) setDeadlines(Array.isArray(deadlinesResult.data) ? deadlinesResult.data : []);
      else toast.error(deadlinesResult.error);

      setLoading(false);
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-pink-500 border-t-transparent"></div>
        <p className="text-sm font-bold text-muted-foreground animate-pulse">Memuat statistik...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Statistik Pekerjaan</h1>
        <p className="text-slate-500">Ringkasan data pekerjaan dan performa notaris.</p>
      </div>

      {/* Job Stats Cards */}
      {stats && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-slate-200 bg-white/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Total Pekerjaan</CardTitle>
              <BarChart3 className="h-4 w-4 text-slate-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">{stats.total}</div>
            </CardContent>
          </Card>
          <Card className="border-slate-200 bg-white/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Pending</CardTitle>
              <Clock className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-amber-600">{stats.pending}</div>
            </CardContent>
          </Card>
          <Card className="border-slate-200 bg-white/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Proses</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{stats.proses}</div>
            </CardContent>
          </Card>
          <Card className="border-slate-200 bg-white/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Selesai</CardTitle>
              <BarChart3 className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-emerald-600">{stats.selesai}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Monthly Stats */}
      {monthly?.length > 0 && (
        <Card className="border-slate-200 bg-white/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Statistik Bulanan</CardTitle>
            <CardDescription>Perbandingan pekerjaan 6 bulan terakhir</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {monthly.map((m) => (
                <div key={`${m.month}-${m.year}`} className="flex items-center gap-4">
                  <div className="w-20 text-sm font-medium text-slate-600">{m.name}</div>
                  <div className="flex-1 h-8 bg-slate-100 rounded-lg overflow-hidden flex">
                    <div 
                      className="bg-blue-500 h-full transition-all duration-500"
                      style={{ width: `${(m.total / (Math.max(...monthly.map(x => x.total)) || 1)) * 100}%` }}
                      title={`Total: ${m.total}`}
                    />
                    <div 
                      className="bg-emerald-500 h-full transition-all duration-500"
                      style={{ width: `${(m.completed / (Math.max(...monthly.map(x => x.total)) || 1)) * 100}%` }}
                      title={`Selesai: ${m.completed}`}
                    />
                  </div>
                  <div className="text-sm font-bold text-slate-700 w-24 text-right">
                    {m.total} ({m.completed})
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upcoming Deadlines */}
      {deadlines?.length > 0 && (
        <Card className="border-slate-200 bg-white/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Deadline Mendatang</CardTitle>
            <CardDescription>Pekerjaan dengan deadline dalam 7 hari ke depan</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {deadlines.map((job) => (
                <div key={job.id} className="flex items-center gap-4 p-3 rounded-lg bg-amber-50 border border-amber-100">
                  <AlertCircle className="h-5 w-5 text-amber-500" />
                  <div className="flex-1">
                    <div className="font-medium text-slate-900">{job.title}</div>
                    <div className="text-sm text-slate-500">{job.trackingCode}</div>
                  </div>
                  <div className="text-sm font-bold text-amber-600">
                    {new Date(job.deadline).toLocaleDateString('id-ID')}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
