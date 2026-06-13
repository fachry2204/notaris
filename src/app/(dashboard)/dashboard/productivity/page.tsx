"use client";
import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trophy, Activity } from "lucide-react";
import { getStaffProductivity } from "@/lib/actions/jobs";
import { toast } from "sonner";

export default function ProductivityPage() {
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProductivity = async () => {
      setLoading(true);
      const result = await getStaffProductivity();
      if (result.success) {
        setStaff(result.data || []);
      } else {
        toast.error(result.error);
      }
      setLoading(false);
    };
    fetchProductivity();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-pink-500 border-t-transparent"></div>
        <p className="text-sm font-bold text-muted-foreground animate-pulse">Menghitung produktivitas...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Produktivitas Karyawan</h1>
        <p className="text-slate-500">
          Monitoring kinerja dan efisiensi kerja seluruh staff secara realtime.
        </p>
      </div>

      {staff.length === 0 ? (
        <Card className="border-dashed border-2 border-slate-200 bg-white/50 backdrop-blur-sm p-20 text-center">
          <Activity className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500 font-bold">Belum ada data produktivitas tersedia.</p>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {staff.map((s, i) => (
            <Card key={s.id} className="border-slate-200 bg-white/50 backdrop-blur-sm group hover:shadow-xl hover:shadow-pink-500/5 transition-all duration-300 rounded-[2rem] overflow-hidden">
              <CardHeader className="flex flex-row items-center gap-4 pb-2">
                <Avatar className="h-14 w-14 border-2 border-pink-100 shadow-sm group-hover:scale-110 transition-transform duration-500">
                  <AvatarImage src={`https://avatar.vercel.sh/${s.username}.png`} />
                  <AvatarFallback className="bg-pink-500 text-white font-bold">{s.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <CardTitle className="text-lg font-black text-slate-900 leading-none mb-1">{s.name}</CardTitle>
                  <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-pink-500">{s.role}</CardDescription>
                </div>
                <div className="ml-auto">
                  {i === 0 && s.completed > 0 && <Trophy className="h-6 w-6 text-amber-500 animate-bounce" />}
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100 group-hover:bg-emerald-500 group-hover:text-white transition-all duration-500">
                    <p className="text-[10px] uppercase tracking-wider text-emerald-600 font-black mb-1 group-hover:text-emerald-100">Selesai</p>
                    <p className="text-3xl font-black">{s.completed}</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-blue-50 border border-blue-100 group-hover:bg-blue-500 group-hover:text-white transition-all duration-500">
                    <p className="text-[10px] uppercase tracking-wider text-blue-600 font-black mb-1 group-hover:text-blue-100">Proses</p>
                    <p className="text-3xl font-black">{s.processing}</p>
                  </div>
                </div>
                
                {/* Visual indicator for engagement */}
                <div className="mt-6 pt-4 border-t border-slate-100">
                  <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                    <span>Total Pekerjaan</span>
                    <span>{s.completed + s.processing} Berkas</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-emerald-400 to-blue-500 rounded-full transition-all duration-1000 ease-out"
                      style={{ width: `${(s.completed / (s.completed + s.processing || 1)) * 100}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
