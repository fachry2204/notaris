import React from "react";
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
import { ShieldCheck, User, Clock, Monitor } from "lucide-react";

export default function AuditLogPage() {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-slate-900 flex items-center justify-center text-white">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Audit Log System</h1>
          <p className="text-slate-500">
            Riwayat lengkap aktivitas seluruh pengguna dalam sistem.
          </p>
        </div>
      </div>

      <Card className="border-slate-200 bg-white/50 backdrop-blur-sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/50">
                <TableHead className="w-[200px]">Waktu</TableHead>
                <TableHead>Pengguna</TableHead>
                <TableHead>Aktivitas</TableHead>
                <TableHead>Device / IP</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[
                { time: "11 Mei 2026, 23:45", user: "superadmin", activity: "Login ke sistem", device: "Chrome / 192.168.1.1", status: "SUCCESS" },
                { time: "11 Mei 2026, 23:10", user: "siska.wijaya", activity: "Update progress J-2026-002", device: "Safari / 192.168.1.4", status: "SUCCESS" },
              ].map((log, i) => (
                <TableRow key={i}>
                  <TableCell className="text-xs text-muted-foreground flex items-center gap-2">
                    <Clock className="h-3 w-3" />
                    {log.time}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-slate-400" />
                      <span className="font-semibold">{log.user}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{log.activity}</TableCell>
                  <TableCell className="text-xs text-muted-foreground flex items-center gap-2">
                    <Monitor className="h-3 w-3" />
                    {log.device}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200 text-[10px]">
                      {log.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
