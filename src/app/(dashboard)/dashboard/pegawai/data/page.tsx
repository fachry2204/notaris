"use client";

import React, { useState, useEffect } from "react";
import { 
  Plus, 
  Search, 
  User, 
  Mail, 
  Shield, 
  MoreVertical, 
  Edit3, 
  Trash2, 
  Eye,
  KeyRound,
  RefreshCcw,
  CheckCircle2,
  XCircle
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  getStaff, 
  deleteStaff, 
  resetStaffPassword, 
  updateStaffStatus 
} from "@/lib/actions/users";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export default function DataPegawaiPage() {
  const router = useRouter();
  const [staffList, setStaffList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [resetId, setResetId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "inactive">("all");

  const fetchStaff = async () => {
    setLoading(true);
    const result = await getStaff();
    if (result.success) {
      setStaffList(result.data || []);
    } else {
      toast.error(result.error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleDelete = async () => {
    if (!deleteId) return;
    const result = await deleteStaff(deleteId);
    if (result.success) {
      toast.success("Pegawai berhasil dihapus");
      fetchStaff();
    } else {
      toast.error(result.error);
    }
    setDeleteId(null);
  };

  const handleResetPassword = async () => {
    if (!resetId) return;
    setActionLoading(true);
    const result = await resetStaffPassword(resetId);
    if (result.success) {
      toast.success("Password berhasil direset ke 1234");
    } else {
      toast.error(result.error);
    }
    setActionLoading(false);
    setResetId(null);
  };

  const counts = {
    total: staffList.length,
    active: staffList.filter(s => s.isActive).length,
    inactive: staffList.filter(s => !s.isActive).length
  };

  const filteredStaff = staffList.filter(s => {
    const matchesSearch = 
      s.fullName.toLowerCase().includes(search.toLowerCase()) ||
      s.username.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase());
    
    const matchesFilter = 
      filterStatus === "all" ? true :
      filterStatus === "active" ? s.isActive :
      !s.isActive;

    return matchesSearch && matchesFilter;
  });

  const getRoleLabel = (role: string) => {
    const roles: any = {
      ADMINISTRATOR: "Administrator",
      PIMPINAN: "Pimpinan",
      STAFFADMIN: "Staff Admin",
      OB: "OB"
    };
    return roles[role] || role;
  };

  return (
    <div className="space-y-6 p-4 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-0.5">
          <h1 className="text-2xl font-black tracking-tight text-foreground">Data Pegawai</h1>
          <p className="text-muted-foreground text-sm font-medium">Kelola informasi dan hak akses seluruh staff kantor.</p>
        </div>
        <Link 
          href="/dashboard/pegawai/new"
          className={cn(
            buttonVariants({ variant: "default" }),
            "bg-pink-500 hover:bg-pink-600 text-white rounded-xl px-4 h-9 text-xs shadow-md shadow-pink-500/20 font-bold gap-1.5 transition-all active:scale-95 inline-flex items-center justify-center"
          )}
        >
          <Plus className="h-3.5 w-3.5" />
          Tambah Pegawai
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button 
          onClick={() => setFilterStatus("all")}
          className={cn(
            "p-5 rounded-[2rem] text-left transition-all duration-300 relative overflow-hidden group",
            filterStatus === "all" 
              ? "bg-pink-500 text-white shadow-lg shadow-pink-500/20 ring-4 ring-pink-500/10" 
              : "bg-card hover:bg-muted/50 shadow-sm border-none"
          )}
        >
          <div className="relative z-10 space-y-0.5">
            <p className={cn("text-[10px] font-black uppercase tracking-widest", filterStatus === "all" ? "text-white/80" : "text-muted-foreground")}>Total Pegawai</p>
            <h3 className="text-3xl font-black">{counts.total}</h3>
          </div>
          <User className={cn("absolute -right-2 -bottom-2 h-16 w-16 opacity-10 transition-transform group-hover:scale-110", filterStatus === "all" ? "text-white" : "text-pink-500")} />
        </button>

        <button 
          onClick={() => setFilterStatus("active")}
          className={cn(
            "p-5 rounded-[2rem] text-left transition-all duration-300 relative overflow-hidden group",
            filterStatus === "active" 
              ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 ring-4 ring-emerald-500/10" 
              : "bg-card hover:bg-muted/50 shadow-sm border-none"
          )}
        >
          <div className="relative z-10 space-y-0.5">
            <p className={cn("text-[10px] font-black uppercase tracking-widest", filterStatus === "active" ? "text-white/80" : "text-muted-foreground")}>Pegawai Aktif</p>
            <h3 className="text-3xl font-black">{counts.active}</h3>
          </div>
          <CheckCircle2 className={cn("absolute -right-2 -bottom-2 h-16 w-16 opacity-10 transition-transform group-hover:scale-110", filterStatus === "active" ? "text-white" : "text-emerald-500")} />
        </button>

        <button 
          onClick={() => setFilterStatus("inactive")}
          className={cn(
            "p-5 rounded-[2rem] text-left transition-all duration-300 relative overflow-hidden group",
            filterStatus === "inactive" 
              ? "bg-rose-500 text-white shadow-lg shadow-rose-500/20 ring-4 ring-rose-500/10" 
              : "bg-card hover:bg-muted/50 shadow-sm border-none"
          )}
        >
          <div className="relative z-10 space-y-0.5">
            <p className={cn("text-[10px] font-black uppercase tracking-widest", filterStatus === "inactive" ? "text-white/80" : "text-muted-foreground")}>Pegawai Tidak Aktif</p>
            <h3 className="text-3xl font-black">{counts.inactive}</h3>
          </div>
          <XCircle className={cn("absolute -right-2 -bottom-2 h-16 w-16 opacity-10 transition-transform group-hover:scale-110", filterStatus === "inactive" ? "text-white" : "text-rose-500")} />
        </button>
      </div>

      <div className="relative group">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-pink-500 transition-colors" />
        <Input 
          placeholder="Cari nama, username, atau email..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-14 h-16 rounded-[2rem] border-none bg-card shadow-sm text-lg font-medium placeholder:text-muted-foreground/50 focus-visible:ring-2 focus-visible:ring-pink-500/20"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-pink-500 border-t-transparent"></div>
        </div>
      ) : filteredStaff.length === 0 ? (
        <div className="text-center py-20 bg-card rounded-[3rem] border-2 border-dashed border-muted/50">
          <User className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-20" />
          <h3 className="text-2xl font-bold">Pegawai tidak ditemukan</h3>
          <p className="text-muted-foreground font-medium">Silahkan tambah pegawai baru atau ubah kata kunci pencarian.</p>
        </div>
      ) : (
        <div className="bg-card rounded-[2.5rem] border-none shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-muted/50 bg-muted/5">
                  <th className="p-6 text-xs font-black uppercase tracking-widest text-muted-foreground">Pegawai</th>
                  <th className="p-6 text-xs font-black uppercase tracking-widest text-muted-foreground">Kontak & Akun</th>
                  <th className="p-6 text-xs font-black uppercase tracking-widest text-muted-foreground">Role</th>
                  <th className="p-6 text-xs font-black uppercase tracking-widest text-muted-foreground">Status</th>
                  <th className="p-6 text-xs font-black uppercase tracking-widest text-muted-foreground text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-muted/30">
                {filteredStaff.map((staff) => (
                  <tr key={staff.id} className="hover:bg-muted/5 transition-colors group">
                    <td className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-500 shadow-lg shadow-pink-500/20 overflow-hidden flex-shrink-0">
                          {staff.staffProfile?.photoPath ? (
                            <img src={staff.staffProfile.photoPath} alt={staff.fullName} className="h-full w-full object-cover" />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center text-white">
                              <User className="h-6 w-6" />
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-foreground text-lg leading-tight">{staff.fullName}</span>
                          <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">#{staff.id.slice(-6)}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-6">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                          <Mail className="h-3.5 w-3.5 text-pink-500" />
                          {staff.email}
                        </div>
                        <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
                          <Shield className="h-3.5 w-3.5" />
                          @{staff.username}
                        </div>
                      </div>
                    </td>
                    <td className="p-6">
                      <Badge className="bg-pink-500/10 text-pink-600 border-none font-black px-3 py-1 rounded-lg">
                        {getRoleLabel(staff.role)}
                      </Badge>
                    </td>
                    <td className="p-6">
                      <div className="flex items-center gap-2">
                        <div className={cn("h-2 w-2 rounded-full", staff.isActive ? "bg-emerald-500 animate-pulse" : "bg-slate-400")} />
                        <span className={cn("text-xs font-black tracking-tighter", staff.isActive ? "text-emerald-500" : "text-slate-500")}>
                          {staff.isActive ? "AKTIF" : "NON-AKTIF"}
                        </span>
                      </div>
                    </td>
                    <td className="p-6">
                      <div className="flex items-center justify-end">
                        <Link 
                          href={`/dashboard/pegawai/${staff.id}`}
                          className={cn(
                            buttonVariants({ variant: "outline" }),
                            "h-10 rounded-xl px-5 border-pink-500/30 text-pink-600 hover:bg-pink-50 hover:text-pink-700 font-bold transition-all shadow-sm flex items-center justify-center"
                          )}
                        >
                          Detail
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent className="rounded-[2.5rem] border-none shadow-2xl p-8">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-black text-rose-600">Hapus Data Pegawai?</AlertDialogTitle>
            <AlertDialogDescription className="text-lg font-medium">
              Tindakan ini tidak dapat dibatalkan. Akun user yang terhubung juga akan otomatis terhapus secara permanen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6">
            <AlertDialogCancel className="h-14 rounded-2xl font-bold px-8 border-none bg-muted hover:bg-muted/80 transition-all">Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="h-14 rounded-2xl font-bold px-8 bg-rose-500 hover:bg-rose-600 text-white shadow-xl shadow-rose-500/20 transition-all active:scale-95">Ya, Hapus Permanen</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reset Password Confirmation */}
      <AlertDialog open={!!resetId} onOpenChange={(open) => !open && setResetId(null)}>
        <AlertDialogContent className="rounded-[2.5rem] border-none shadow-2xl p-8">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-black text-pink-600">Reset Password Pegawai?</AlertDialogTitle>
            <AlertDialogDescription className="text-lg font-medium">
              Password akan dikembalikan ke pengaturan awal yaitu <span className="font-bold text-pink-600">1234</span>. Pastikan pegawai diberitahu setelah password direset.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6">
            <AlertDialogCancel className="h-14 rounded-2xl font-bold px-8 border-none bg-muted hover:bg-muted/80 transition-all">Batal</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleResetPassword} 
              className="h-14 rounded-2xl font-bold px-8 bg-pink-500 hover:bg-pink-600 text-white shadow-xl shadow-pink-500/20 transition-all active:scale-95"
            >
              Ya, Reset Password
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
