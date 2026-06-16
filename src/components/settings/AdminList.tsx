"use client";

import React, { useEffect, useState } from "react";
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { UserPlus, Pencil, Trash2, Key, UserCog, ShieldCheck } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { getAdmins, createAdmin, updateAdmin, deleteAdmin, resetAdminPassword, updateAdminStatus } from "@/lib/actions/admins";

export default function AdminList() {
  const [admins, setAdmins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    id: "",
    username: "",
    email: "",
    phone: "",
    fullName: "",
    role: "ADMINISTRATOR",
    password: "",
  });

  const loadAdmins = async () => {
    setLoading(true);
    const result = await getAdmins();
    if (result.success) {
      setAdmins(result.data || []);
    } else {
      toast.error(result.error);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadAdmins();
  }, []);

  const handleOpenDialog = (admin?: any) => {
    if (admin) {
      setFormData({
        id: admin.id,
        username: admin.username,
        email: admin.email || "",
        phone: admin.phone || "",
        fullName: admin.fullName,
        role: admin.role,
        password: "",
      });
    } else {
      setFormData({
        id: "",
        username: "",
        email: "",
        phone: "",
        fullName: "",
        role: "ADMINISTRATOR",
        password: "",
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    let result;
    if (formData.id) {
      result = await updateAdmin(formData.id, formData);
    } else {
      result = await createAdmin(formData);
    }

    if (result.success) {
      toast.success(formData.id ? "Akun diperbarui!" : "Akun dibuat!");
      setIsDialogOpen(false);
      loadAdmins();
    } else {
      toast.error(result.error);
    }
    setIsSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Apakah Anda yakin ingin menghapus akun ini?")) {
      const result = await deleteAdmin(id);
      if (result.success) {
        toast.success("Akun dihapus!");
        loadAdmins();
      } else {
        toast.error(result.error);
      }
    }
  };

  const handleResetPassword = async (id: string) => {
    if (confirm("Reset password ke '123456'?")) {
      const result = await resetAdminPassword(id);
      if (result.success) {
        toast.success("Password direset ke 123456");
      } else {
        toast.error(result.error);
      }
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    const result = await updateAdminStatus(id, !currentStatus);
    if (result.success) {
      toast.success("Status akun diperbarui");
      loadAdmins();
    } else {
      toast.error(result.error);
    }
  };

  return (
    <Card className="border-none shadow-sm rounded-[2.5rem] bg-card overflow-hidden">
      <CardHeader className="border-b bg-muted/5 px-8 py-6 flex flex-row items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-pink-500/10 flex items-center justify-center text-pink-500">
            <UserCog className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-xl">Akun Admin & Pimpinan</CardTitle>
            <CardDescription>Kelola akun khusus untuk akses Administrator dan Pimpinan.</CardDescription>
          </div>
        </div>
        <Button onClick={() => handleOpenDialog()} className="h-11 px-6 rounded-xl font-bold bg-pink-500 hover:bg-pink-600 shadow-xl shadow-pink-500/20 gap-2 text-white">
          <UserPlus className="h-4 w-4" />
          Tambah Akun
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-muted/50 bg-muted/5">
                <th className="p-6 text-xs font-black uppercase tracking-widest text-muted-foreground">Nama Lengkap</th>
                <th className="p-6 text-xs font-black uppercase tracking-widest text-muted-foreground">Username / Kontak</th>
                <th className="p-6 text-xs font-black uppercase tracking-widest text-muted-foreground">Role</th>
                <th className="p-6 text-xs font-black uppercase tracking-widest text-muted-foreground">Status</th>
                <th className="p-6 text-xs font-black uppercase tracking-widest text-muted-foreground text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-muted/30">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted-foreground">Loading...</td>
                </tr>
              ) : admins.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted-foreground font-medium">Belum ada data akun admin/pimpinan.</td>
                </tr>
              ) : (
                admins.map((admin) => (
                  <tr key={admin.id} className="hover:bg-muted/5 transition-colors">
                    <td className="p-6 font-bold">{admin.fullName}</td>
                    <td className="p-6">
                      <div className="flex flex-col">
                        <span className="font-bold">@{admin.username}</span>
                        <span className="text-xs text-muted-foreground">{admin.email}</span>
                      </div>
                    </td>
                    <td className="p-6">
                      <span className="px-3 py-1 bg-pink-500/10 text-pink-600 text-[10px] font-black uppercase tracking-wider rounded-lg">
                        {admin.role}
                      </span>
                    </td>
                    <td className="p-6">
                      <div className="flex items-center gap-2">
                        <Switch checked={admin.isActive} onCheckedChange={() => handleToggleStatus(admin.id, admin.isActive)} className="data-[state=checked]:bg-emerald-500" />
                        <span className="text-xs font-bold uppercase">{admin.isActive ? 'Aktif' : 'Nonaktif'}</span>
                      </div>
                    </td>
                    <td className="p-6">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleResetPassword(admin.id)} title="Reset Password" className="text-amber-500 hover:bg-amber-50"><Key className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(admin)} className="text-blue-500 hover:bg-blue-50"><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(admin.id)} className="text-rose-500 hover:bg-rose-50"><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardContent>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-[2.5rem] p-8">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black">{formData.id ? "Edit Akun" : "Tambah Akun"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6 pt-4">
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Nama Lengkap</Label>
              <Input value={formData.fullName} onChange={(e) => setFormData({ ...formData, fullName: e.target.value })} required className="h-12 rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Username</Label>
              <Input value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} required className="h-12 rounded-xl" />
            </div>
            {!formData.id && (
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Password (Default)</Label>
                <Input value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} placeholder="123456" className="h-12 rounded-xl" />
              </div>
            )}
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Email</Label>
              <Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required className="h-12 rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">No HP</Label>
              <Input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="h-12 rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Role</Label>
              <select value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })} className="flex h-12 w-full rounded-xl border border-muted bg-background px-4 font-medium text-sm">
                <option value="ADMINISTRATOR">ADMINISTRATOR</option>
                <option value="PIMPINAN">PIMPINAN</option>
              </select>
            </div>
            <div className="flex justify-end gap-4 pt-4 border-t border-muted/20">
              <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)} className="h-12 px-6 font-bold">Batal</Button>
              <Button type="submit" disabled={isSubmitting} className="h-12 px-8 rounded-xl font-bold bg-pink-500 hover:bg-pink-600 text-white shadow-xl shadow-pink-500/20">
                {isSubmitting ? "Menyimpan..." : "Simpan"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
