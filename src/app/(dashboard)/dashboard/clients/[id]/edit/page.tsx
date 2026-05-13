"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { getClientById, updateClient } from "@/lib/actions/clients";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Save, X, User } from "lucide-react";
import Link from "next/link";

export default function EditClientPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    npwp: "",
    birthday: "",
  });

  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchClient = async () => {
      setLoading(true);
      const result = await getClientById(id);
      if (result.success && result.data) {
        setFormData({
          name: result.data.name || "",
          email: result.data.email || "",
          phone: result.data.phone || "",
          address: result.data.address || "",
          npwp: result.data.npwp || "",
          birthday: result.data.birthday ? new Date(result.data.birthday).toISOString().split('T')[0] : "",
        });
      } else {
        toast.error(result.error || "Gagal mengambil data client");
        router.push("/dashboard/clients");
      }
      setLoading(false);
    };
    fetchClient();
  }, [id, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const result = await updateClient(id, formData);
    if (result.success) {
      toast.success("Data client berhasil diperbarui");
      router.push("/dashboard/clients");
    } else {
      toast.error(result.error || "Gagal memperbarui data client");
    }
    setIsSubmitting(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-pink-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/clients">
          <Button variant="ghost" size="icon" className="rounded-full hover:bg-pink-500/10 hover:text-pink-500 transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Edit Data Client</h1>
          <p className="text-sm text-muted-foreground">Perbarui informasi identitas client di bawah ini.</p>
        </div>
      </div>

      <Card className="border-none shadow-sm rounded-2xl bg-card overflow-hidden">
        <CardHeader className="border-b bg-muted/5 px-8 py-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-pink-500/10 flex items-center justify-center">
              <User className="h-6 w-6 text-pink-500" />
            </div>
            <div>
              <CardTitle>Identitas Client</CardTitle>
              <CardDescription>ID Client: {id}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid gap-x-8 gap-y-6 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="name">Nama Lengkap / Nama Perusahaan</Label>
                <Input id="name" placeholder="Masukkan nama" className="h-12 rounded-xl" required value={formData.name} onChange={handleInputChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="contoh@mail.com" className="h-12 rounded-xl" value={formData.email} onChange={handleInputChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">No Handphone</Label>
                <Input id="phone" placeholder="0812xxxx" className="h-12 rounded-xl" value={formData.phone} onChange={handleInputChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="npwp">NPWP</Label>
                <Input id="npwp" placeholder="00.000.000.0-000.000" className="h-12 rounded-xl" value={formData.npwp} onChange={handleInputChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="birthday">Tanggal Lahir</Label>
                <Input id="birthday" type="date" className="h-12 rounded-xl" value={formData.birthday} onChange={handleInputChange} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="address">Alamat Lengkap</Label>
                <Input id="address" placeholder="Jalan, No, RT/RW, Kota" className="h-12 rounded-xl" value={formData.address} onChange={handleInputChange} />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-8 border-t">
              <Link href="/dashboard/clients">
                <Button variant="ghost" type="button" className="h-12 px-8 rounded-xl gap-2 font-bold hover:bg-pink-50 hover:text-pink-600 transition-all">
                  <X className="h-5 w-5" />
                  Batal
                </Button>
              </Link>
              <Button type="submit" disabled={isSubmitting} className="h-12 px-10 rounded-xl gap-2 font-bold shadow-lg shadow-pink-500/20 bg-pink-500 hover:bg-pink-600 transition-all">
                <Save className="h-5 w-5" />
                {isSubmitting ? "Menyimpan..." : "Simpan Perubahan"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
