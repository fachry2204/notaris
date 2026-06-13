"use client";

import React, { useState, useEffect } from "react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, User, Clock, Monitor, Activity } from "lucide-react";
import { getAuditLogs } from "@/lib/actions/logs";
import { toast } from "sonner";

export default function AuditLogPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      const result = await getAuditLogs();
      if (result.success) {
        setLogs(result.data || []);
      } else {
        toast.error(result.error);
      }
      setLoading(false);
    };
    fetchLogs();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-900 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-slate-900 flex items-center justify-center text-white">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Audit Log System</h1>
          <p className="text-slate-500">
            Riwayat lengkap aktivitas seluruh pengguna dalam sistem.
          </p>
        </div>
      </div>

      <Card className="border-slate-200 bg-white/50 backdrop-blur-sm overflow-hidden">
        <CardContent className="p-0">
          {logs.length === 0 ? (
            <div className="text-center py-20">
              <Activity className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">Belum ada riwayat aktivitas.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/50">
                  <TableHead className="w-[200px]">Waktu</TableHead>
                  <TableHead>Pengguna</TableHead>
                  <TableHead>Aktivitas</TableHead>
                  <TableHead>Detail</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-[11px] text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Clock className="h-3.5 w-3.5" />
                        {new Date(log.createdAt).toLocaleString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-slate-400" />
                        <span className="font-semibold text-sm">
                          {log.user?.fullName || log.user?.username || "User tidak diketahui"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px] uppercase font-bold bg-slate-50">
                        {log.activity}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground italic">
                      {log.details || "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge className="bg-emerald-500 text-white border-none text-[9px] h-5">
                        SUCCESS
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
