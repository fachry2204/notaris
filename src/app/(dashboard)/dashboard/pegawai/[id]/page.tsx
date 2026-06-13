"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  User, 
  Mail, 
  Shield, 
  Edit3, 
  Trash2, 
  ArrowLeft,
  KeyRound,
  CheckCircle2,
  XCircle,
  Calendar,
  Phone
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  getStaff, 
  deleteStaff, 
  resetStaffPassword, 
  updateStaffStatus 
} from "@/lib/actions/users";
import { toast } from "sonner";
import Link from "next/link";
import { cn } from "@/lib/utils";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function DetailPegawaiPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  
  const [staff, setStaff] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [resetId, setResetId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const fetchStaffDetail = async () => {
      setLoading(true);
      const result = await getStaff();
      if (result.success) {
        const found = result.data?.find((s: any) => s.id === id);
        if (found) {
          setStaff(found);
        } else {
          toast.error("Pegawai tidak ditemukan");
          router.push("/dashboard/pegawai/data");
        }
      } else {
        toast.error(result.error);
      }
      setLoading(false);
    };
    fetchStaffDetail();
  }, [id, router]);

  const handleDelete = async () => {
    if (!deleteId) return;
    setActionLoading(true);
    const result = await deleteStaff(deleteId);
    if (result.success) {
      toast.success("Pegawai berhasil dihapus");
      router.push("/dashboard/pegawai/data");
    } else {
      toast.error(result.error);
    }
    setActionLoading(false);
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

  const handleStatusChange = async (isActive: boolean) => {
    if (!staff) return;
    setActionLoading(true);
    const result = await updateStaffStatus(staff.id, isActive);
    if (result.success) {
      toast.success(`Status berhasil diubah menjadi ${isActive ? "Aktif" : "Non-Aktif"}`);
      setStaff({ ...staff, isActive });
    } else {
      toast.error(result.error);
    }
    setActionLoading(false);
  };

  const getRoleLabel = (role: string) => {
    const roles: any = {
      ADMINISTRATOR: "Administrator",
      PIMPINAN: "Pimpinan",
      STAFFADMIN: "Staff Admin",
      OB: "OB"
    };
    return roles[role] || role;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-pink-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!staff) return null;

  return (
    <div className="space-y-8 p-8 max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Navigation & Header */}
      <div className="flex items-center justify-between">
        <Button 
          variant="ghost" 
          onClick={() => router.back()}
          className="rounded-2xl gap-2 font-bold hover:bg-pink-50 text-pink-600 transition-all"
        >
          <ArrowLeft className="h-5 w-5" />
          Kembali
        </Button>
        <div className="flex gap-3">
          <Link 
            href={`/dashboard/pegawai/${staff.id}/edit`}
            className={cn(
              "h-12 rounded-2xl font-bold px-6 border-muted bg-white hover:bg-muted transition-all flex items-center shadow-sm border"
            )}
          >
            <Edit3 className="h-4 w-4 mr-2 text-pink-500" />
            Edit Profile
          </Link>
          <Button 
            variant="destructive" 
            className="h-12 rounded-2xl font-bold px-6 bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-500/20 transition-all active:scale-95"
            onClick={() => setDeleteId(staff.id)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Hapus
          </Button>
        </div>
      </div>

      <div className="bg-card rounded-[3rem] shadow-xl overflow-hidden border-none relative">
        <div className="h-32 bg-gradient-to-r from-pink-500/10 to-rose-500/10 absolute top-0 left-0 right-0" />
        
        <div className="p-12 relative pt-20">
          <div className="flex flex-col md:flex-row gap-12 items-start">
            {/* Profile Photo Area */}
            <div className="space-y-6 flex-shrink-0">
              <div className="h-48 w-48 rounded-[3rem] bg-white p-2 shadow-2xl relative">
                <div className="h-full w-full rounded-[2.5rem] bg-gradient-to-br from-pink-500 to-rose-500 overflow-hidden">
                  {staff.staffProfile?.photoPath ? (
                    <img src={staff.staffProfile.photoPath} alt={staff.fullName} className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-white">
                      <User className="h-24 w-24" />
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-muted/30 p-6 rounded-[2rem] space-y-4">
                <div className="space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-tighter opacity-50 block">Status Akun</span>
                  <Select 
                    value={staff.isActive ? "active" : "inactive"} 
                    onValueChange={(val) => handleStatusChange(val === "active")}
                    disabled={actionLoading}
                  >
                    <SelectTrigger className="h-12 rounded-2xl font-bold border-none bg-white shadow-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-none shadow-2xl">
                      <SelectItem value="active" className="font-bold text-emerald-600">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4" />
                          Aktif
                        </div>
                      </SelectItem>
                      <SelectItem value="inactive" className="font-bold text-rose-500">
                        <div className="flex items-center gap-2">
                          <XCircle className="h-4 w-4" />
                          Non-Aktif
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button 
                  variant="outline" 
                  onClick={() => setResetId(staff.id)}
                  disabled={actionLoading}
                  className="w-full h-12 rounded-2xl border-dashed border-2 border-pink-500/30 text-pink-600 font-bold hover:bg-pink-50 transition-all gap-2"
                >
                  <KeyRound className="h-4 w-4" />
                  Reset Password
                </Button>
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 space-y-10">
              <div className="space-y-2">
                <Badge className="bg-pink-500/10 text-pink-600 border-none font-black px-4 py-1.5 rounded-full uppercase tracking-widest text-xs mb-2">
                  {getRoleLabel(staff.role)}
                </Badge>
                <h1 className="text-5xl font-black text-foreground tracking-tight">{staff.fullName}</h1>
                <p className="text-xl text-muted-foreground font-medium">@{staff.username}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center gap-5 p-6 rounded-[2rem] bg-muted/20 hover:bg-muted/30 transition-all">
                  <div className="h-12 w-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-pink-500">
                    <Mail className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Email Address</p>
                    <p className="text-lg font-bold truncate">{staff.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-5 p-6 rounded-[2rem] bg-muted/20 hover:bg-muted/30 transition-all">
                  <div className="h-12 w-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-pink-500">
                    <Phone className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Phone Number</p>
                    <p className="text-lg font-bold">{staff.phone || "-"}</p>
                  </div>
                </div>

                <div className="flex items-center gap-5 p-6 rounded-[2rem] bg-muted/20 hover:bg-muted/30 transition-all">
                  <div className="h-12 w-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-pink-500">
                    <Calendar className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Tanggal Lahir</p>
                    <p className="text-lg font-bold">
                      {staff.birthday ? new Date(staff.birthday).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : "-"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Document Section */}
              {staff.staffProfile?.ktpPath && (
                <div className="space-y-4">
                  <h3 className="text-xl font-black tracking-tight text-foreground ml-2">Dokumen Identitas (KTP)</h3>
                  <div className="bg-muted/10 rounded-[3rem] p-10 border-2 border-dashed border-muted/50 group hover:bg-muted/20 transition-all">
                    <img 
                      src={staff.staffProfile.ktpPath} 
                      alt="KTP" 
                      className="max-w-full rounded-2xl shadow-2xl border-8 border-white object-contain mx-auto transition-transform group-hover:scale-[1.02] duration-500" 
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Dialogs */}
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
