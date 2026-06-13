"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getStaff, updateStaff } from "@/lib/actions/users";
import { toast } from "sonner";
import { Upload, X, ArrowLeft, UserCheck, ShieldCheck } from "lucide-react";
import Link from "next/link";

export default function EditStaffPage() {
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [ktpPreview, setKtpPreview] = useState<string | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [role, setRole] = useState("STAFFADMIN");
  const [staffData, setStaffData] = useState<any>(null);

  useEffect(() => {
    const fetchStaffData = async () => {
      const result = await getStaff();
      if (result.success) {
        const staff = result.data?.find((s: any) => s.id === params.id);
        if (staff) {
          setStaffData(staff);
          setRole(staff.role);
          if (staff.staffProfile?.ktpPath) {
            setKtpPreview(staff.staffProfile.ktpPath);
          }
          if (staff.staffProfile?.photoPath) {
            setPhotoPreview(staff.staffProfile.photoPath);
          }
        } else {
          toast.error("Pegawai tidak ditemukan");
          router.push("/dashboard/pegawai/data");
        }
      } else {
        toast.error(result.error);
      }
      setFetching(false);
    };

    if (params.id) {
      fetchStaffData();
    }
  }, [params.id]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      email: formData.get("email"),
      phone: formData.get("phone"),
      fullName: formData.get("fullName"),
      role: role,
      birthday: formData.get("birthday"),
      isActive: formData.get("isActive") !== "false",
      ktpPath: ktpPreview,
      photoPath: photoPreview,
    };

    const result = await updateStaff(params.id as string, data);

    if (result.success) {
      toast.success("Data pegawai berhasil diperbarui");
      router.push("/dashboard/pegawai/data");
    } else {
      toast.error(result.error);
    }
    setLoading(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: "ktp" | "photo") => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (type === "ktp") setKtpPreview(reader.result as string);
        else setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  if (fetching) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-pink-500 border-t-transparent shadow-lg"></div>
        <p className="font-bold text-muted-foreground animate-pulse">Memuat data pegawai...</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Link href="/dashboard/pegawai/data" className="hover:text-primary transition-colors flex items-center gap-1 text-sm font-medium">
              <ArrowLeft className="h-4 w-4" /> Kembali ke Data Pegawai
            </Link>
          </div>
          <h1 className="text-2xl font-black tracking-tight flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-pink-500 text-white flex items-center justify-center shadow-lg shadow-pink-500/20">
              <ShieldCheck className="h-5 w-5" />
            </div>
            Edit Profil Pegawai
          </h1>
          <p className="text-muted-foreground text-sm">
            Perbarui informasi identitas dan hak akses untuk <span className="text-foreground font-bold">{staffData?.fullName}</span>.
          </p>
        </div>
      </div>

      {/* Form Card */}
      <div className="bg-card rounded-[2.5rem] shadow-2xl border-none overflow-hidden">
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Full Name */}
            <div className="space-y-2">
              <Label htmlFor="fullName" className="font-bold text-xs uppercase tracking-widest text-muted-foreground ml-1">Nama Lengkap Pegawai</Label>
              <Input
                id="fullName"
                name="fullName"
                defaultValue={staffData?.fullName}
                placeholder="Contoh: Budi Santoso, S.H."
                required
                className="h-14 rounded-xl border-muted/30 bg-muted/5 font-bold text-lg px-6 focus-visible:ring-pink-500/20 focus-visible:border-pink-500/50 transition-all"
              />
            </div>

            {/* Birthday */}
            <div className="space-y-2">
              <Label htmlFor="birthday" className="font-bold text-xs uppercase tracking-widest text-muted-foreground ml-1">Tanggal Lahir Pegawai</Label>
              <Input
                id="birthday"
                name="birthday"
                type="date"
                defaultValue={staffData?.birthday ? new Date(staffData.birthday).toISOString().split('T')[0] : ""}
                required
                className="h-14 rounded-xl border-muted/30 bg-muted/5 font-bold text-lg px-6 focus-visible:ring-pink-500/20 focus-visible:border-pink-500/50 transition-all"
              />
            </div>

            {/* Username (Read-only for edit) */}
            <div className="space-y-2">
              <Label htmlFor="username" className="font-bold text-xs uppercase tracking-widest text-muted-foreground ml-1 opacity-50">Username Sistem</Label>
              <Input
                id="username"
                defaultValue={staffData?.username}
                disabled
                className="h-14 rounded-xl border-muted/20 bg-muted/5 font-bold text-lg px-6 opacity-50 grayscale"
              />
            </div>

            {/* Role Selection */}
            <div className="space-y-2">
              <Label htmlFor="role" className="font-bold text-xs uppercase tracking-widest text-muted-foreground ml-1">Hak Akses (Role)</Label>
              <Select value={role} onValueChange={(val) => setRole(val as string)}>
                <SelectTrigger className="h-14 rounded-xl border-muted/30 bg-muted/5 font-bold px-6 focus:ring-pink-500/20 focus:border-pink-500/50 transition-all">
                  <SelectValue placeholder="Pilih Role">
                    {role === "STAFFADMIN" ? "Staff Admin" : 
                     role === "ADMINISTRATOR" ? "Administrator" :
                     role === "PIMPINAN" ? "Pimpinan" :
                     role === "OB" ? "OB" : "Pilih Role"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="rounded-xl border-none shadow-2xl p-2">
                  <SelectItem value="ADMINISTRATOR" className="rounded-lg font-bold py-3">Administrator</SelectItem>
                  <SelectItem value="PIMPINAN" className="rounded-lg font-bold py-3">Pimpinan</SelectItem>
                  <SelectItem value="STAFFADMIN" className="rounded-lg font-bold py-3">Staff Admin</SelectItem>
                  <SelectItem value="OB" className="rounded-lg font-bold py-3">OB</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Email Address */}
            <div className="space-y-2">
              <Label htmlFor="email" className="font-bold text-xs uppercase tracking-widest text-muted-foreground ml-1">Alamat Email Aktif</Label>
              <Input
                id="email"
                name="email"
                type="email"
                defaultValue={staffData?.email}
                placeholder="budi@example.com"
                required
                className="h-14 rounded-xl border-muted/30 bg-muted/5 font-bold text-lg px-6 focus-visible:ring-pink-500/20 focus-visible:border-pink-500/50 transition-all"
              />
            </div>

            {/* Phone Number */}
            <div className="space-y-2">
              <Label htmlFor="phone" className="font-bold text-xs uppercase tracking-widest text-muted-foreground ml-1">Nomor Handphone (WhatsApp)</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                defaultValue={staffData?.phone}
                placeholder="628123456789"
                required
                className="h-14 rounded-xl border-muted/30 bg-muted/5 font-bold text-lg px-6 focus-visible:ring-pink-500/20 focus-visible:border-pink-500/50 transition-all"
              />
            </div>

            {/* Photo Upload Area */}
            <div className="space-y-2">
              <Label className="font-bold text-xs uppercase tracking-widest text-muted-foreground ml-1">Foto Pegawai</Label>
              <div className="relative group">
                {photoPreview ? (
                  <div className="relative h-14 w-full rounded-xl overflow-hidden border-2 border-pink-500/20 group-hover:border-pink-500/50 transition-all shadow-sm">
                    <div className="flex items-center gap-3 px-4 h-full bg-muted/5">
                      <div className="h-10 w-10 rounded-full overflow-hidden border flex-shrink-0">
                        <img src={photoPreview} alt="Photo Preview" className="h-full w-full object-cover" />
                      </div>
                      <span className="text-sm font-bold truncate flex-1">Foto terpilih</span>
                      <button
                        type="button"
                        onClick={() => setPhotoPreview(null)}
                        className="h-8 w-8 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-lg hover:bg-rose-600 transition-all"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <label className="flex items-center h-14 w-full rounded-xl border-2 border-dashed border-muted/50 bg-muted/5 cursor-pointer hover:bg-muted/10 hover:border-pink-500/50 transition-all group/label px-6">
                    <Upload className="h-5 w-5 text-pink-500 mr-3 flex-shrink-0" />
                    <span className="text-sm font-bold text-muted-foreground">Upload Foto Profil Baru</span>
                    <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, "photo")} />
                  </label>
                )}
              </div>
            </div>

            {/* KTP Upload Area */}
            <div className="space-y-2 md:col-span-2">
              <Label className="font-bold text-xs uppercase tracking-widest text-muted-foreground ml-1">Dokumen Identitas (KTP)</Label>
              <div className="relative group">
                {ktpPreview ? (
                  <div className="relative h-[240px] w-full max-w-[400px] rounded-2xl overflow-hidden border-2 border-pink-500/20 bg-muted/5 group-hover:border-pink-500/50 transition-all shadow-lg flex items-center justify-center">
                    <img src={ktpPreview} alt="KTP Preview" className="max-w-full max-h-full object-contain" />
                    <button
                      type="button"
                      onClick={() => setKtpPreview(null)}
                      className="absolute top-3 right-3 h-10 w-10 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-xl hover:bg-rose-600 transition-all z-10"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center h-[200px] w-full max-w-[400px] rounded-2xl border-2 border-dashed border-muted/50 bg-muted/5 cursor-pointer hover:bg-muted/10 hover:border-pink-500/50 transition-all group/label">
                    <Upload className="h-8 w-8 text-pink-500 mb-3" />
                    <span className="text-sm font-bold text-muted-foreground">Upload KTP</span>
                    <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, "ktp")} />
                  </label>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-4 pt-6 border-t mt-6">
            <Button 
              variant="ghost" 
              type="button" 
              onClick={() => router.back()} 
              className="h-12 px-8 rounded-xl font-bold text-muted-foreground hover:bg-muted/50 transition-all"
            >
              Batal
            </Button>
            <Button 
              type="submit" 
              disabled={loading} 
              className="h-12 px-12 rounded-xl bg-pink-500 hover:bg-pink-600 text-white shadow-xl shadow-pink-500/20 font-black transition-all active:scale-95 flex items-center gap-3"
            >
              {loading ? "Menyimpan..." : "Simpan Perubahan"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
