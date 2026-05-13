import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trophy } from "lucide-react";

export default function ProductivityPage() {
  const staff = [
    { name: "Siska Wijaya", role: "Legal Staff", completed: 45, processing: 12, performance: 92 },
    { name: "Andi Pratama", role: "Junior Staff", completed: 38, processing: 8, performance: 88 },
    { name: "Bambang Heru", role: "Admin Staff", completed: 32, processing: 5, performance: 85 },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Produktivitas Karyawan</h1>
        <p className="text-slate-500">
          Monitoring kinerja dan efisiensi kerja seluruh staff.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {staff.map((s, i) => (
          <Card key={i} className="border-slate-200 bg-white/50 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center gap-4">
              <Avatar className="h-14 w-14 border-2 border-primary/20 shadow-sm">
                <AvatarImage src={`https://avatar.vercel.sh/${s.name}.png`} />
                <AvatarFallback>{s.name.substring(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <CardTitle className="text-lg">{s.name}</CardTitle>
                <CardDescription>{s.role}</CardDescription>
              </div>
              <div className="ml-auto">
                {i === 0 && <Trophy className="h-6 w-6 text-amber-500" />}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-100">
                  <p className="text-[10px] uppercase tracking-wider text-emerald-600 font-bold">Selesai</p>
                  <p className="text-xl font-black text-emerald-700">{s.completed}</p>
                </div>
                <div className="p-3 rounded-lg bg-blue-50 border border-blue-100">
                  <p className="text-[10px] uppercase tracking-wider text-blue-600 font-bold">Proses</p>
                  <p className="text-xl font-black text-blue-700">{s.processing}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
