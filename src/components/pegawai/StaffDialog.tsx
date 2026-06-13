"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { createStaff, updateStaff } from "@/lib/actions/users";
import { toast } from "sonner";
import { Upload, X } from "lucide-react";

interface StaffDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staff?: any;
}

export function StaffDialog({ open, onOpenChange, staff }: StaffDialogProps) {
  const [loading, setLoading] = useState(false);
  const [ktpPreview, setKtpPreview] = useState<string | null>(null);
  const [role, setRole] = useState("STAFFADMIN");

  useEffect(() => {
    if (staff) {
      setRole(staff.role || "STAFFADMIN");
      if (staff.staffProfile?.ktpPath) {
        setKtpPreview(staff.staffProfile.ktpPath);
      } else {
        setKtpPreview(null);
      }
    } else {
      setRole("STAFFADMIN");
      setKtpPreview(null);
    }
  }, [staff, open]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      username: formData.get("username"),
      email: formData.get("email"),
      fullName: formData.get("fullName"),
      role: role, // Use state instead of formData
      isActive: formData.get("isActive") !== "false",
      ktpPath: ktpPreview,
    };

    let result;
    if (staff) {
      result = await updateStaff(staff.id, data);
    } else {
      result = await createStaff(data);
    }

    if (result.success) {
      toast.success(staff ? "Pegawai berhasil diperbarui" : "Pegawai berhasil ditambahkan");
      onOpenChange(false);
    } else {
      toast.error(result.error);
    }
    setLoading(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setKtpPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl rounded-[3rem] border-none shadow-2xl p-0 overflow-hidden bg-card">
        <DialogHeader className="p-8 pb-0">
          <DialogTitle className="text-3xl font-black tracking-tight">
            {staff ? "Edit Data Pegawai" : "Tambah Pegawai Baru"}
          </DialogTitle>
          <DialogDescription className="text-base font-medium">
            Lengkapi informasi identitas dan hak akses pegawai di bawah ini.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-8 pt-4 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="fullName" className="font-bold text-xs uppercase tracking-widest text-muted-foreground ml-1">Nama Lengkap Pegawai</Label>
              <Input
                id="fullName"
                name="fullName"
                defaultValue={staff?.fullName}
                placeholder="Contoh: Budi Santoso, S.H."
                required
                className="h-14 rounded-2xl border-muted/30 bg-muted/10 font-bold text-lg px-6 focus-visible:ring-pink-500/20"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="username" className="font-bold text-xs uppercase tracking-widest text-muted-foreground ml-1">Username Sistem</Label>
              <Input
                id="username"
                name="username"
                defaultValue={staff?.username}
                placeholder="budi_s"
                required
                disabled={!!staff}
                className="h-14 rounded-2xl border-muted/30 bg-muted/10 font-bold px-6 focus-visible:ring-pink-500/20"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role" className="font-bold text-xs uppercase tracking-widest text-muted-foreground ml-1">Hak Akses (Role)</Label>
              <Select value={role} onValueChange={(val) => setRole(val as string)}>
                <SelectTrigger className="h-14 rounded-2xl border-muted/30 bg-muted/10 font-bold px-6 focus:ring-pink-500/20">
                  <SelectValue placeholder="Pilih Role" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-none shadow-2xl p-2">
                  <SelectItem value="ADMINISTRATOR" className="rounded-xl font-bold py-3">Administrator</SelectItem>
                  <SelectItem value="PIMPINAN" className="rounded-xl font-bold py-3">Pimpinan</SelectItem>
                  <SelectItem value="STAFFADMIN" className="rounded-xl font-bold py-3">Staff Admin</SelectItem>
                  <SelectItem value="OB" className="rounded-xl font-bold py-3">OB</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="email" className="font-bold text-xs uppercase tracking-widest text-muted-foreground ml-1">Alamat Email Aktif</Label>
              <Input
                id="email"
                name="email"
                type="email"
                defaultValue={staff?.email}
                placeholder="budi@example.com"
                required
                className="h-14 rounded-2xl border-muted/30 bg-muted/10 font-bold px-6 focus-visible:ring-pink-500/20"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label className="font-bold text-xs uppercase tracking-widest text-muted-foreground ml-1">Dokumen Identitas (KTP)</Label>
              <div className="relative group">
                {ktpPreview ? (
                  <div className="relative h-64 w-full rounded-[2rem] overflow-hidden border-2 border-pink-500/20 group-hover:border-pink-500/50 transition-all shadow-inner">
                    <img src={ktpPreview} alt="KTP Preview" className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setKtpPreview(null)}
                      className="absolute top-4 right-4 h-12 w-12 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-2xl hover:bg-rose-600 transition-all hover:scale-110 active:scale-90"
                    >
                      <X className="h-6 w-6" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center h-48 w-full rounded-[2rem] border-2 border-dashed border-muted/50 bg-muted/5 cursor-pointer hover:bg-muted/10 hover:border-pink-500/50 transition-all group/label">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <div className="h-16 w-16 rounded-2xl bg-pink-50 text-pink-500 flex items-center justify-center mb-4 group-hover/label:scale-110 transition-transform shadow-sm">
                        <Upload className="h-8 w-8" />
                      </div>
                      <p className="text-lg font-bold text-foreground">Klik untuk upload foto KTP</p>
                      <p className="text-sm text-muted-foreground mt-1">Format PNG, JPG atau JPEG (Maks. 2MB)</p>
                    </div>
                    <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                  </label>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-4 pt-6 border-t mt-4">
            <Button 
              variant="ghost" 
              type="button" 
              onClick={() => onOpenChange(false)} 
              className="h-14 px-8 rounded-2xl font-bold text-muted-foreground hover:bg-muted/50 transition-all"
            >
              Batal
            </Button>
            <Button 
              type="submit" 
              disabled={loading} 
              className="h-14 px-12 rounded-2xl bg-pink-500 hover:bg-pink-600 text-white shadow-xl shadow-pink-500/20 font-black text-lg transition-all active:scale-95"
            >
              {loading ? "Memproses..." : (staff ? "Simpan Perubahan" : "Simpan Data Pegawai")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
