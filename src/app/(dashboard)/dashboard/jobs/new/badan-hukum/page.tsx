"use client";

import React, { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, FilePlus2, Save, X, Building2, User2, Clock, Calendar, Search, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { getClients } from "@/lib/actions/clients";
import { getStaff } from "@/lib/actions/users";
import { createJob, getNextTrackingCode } from "@/lib/actions/jobs";
import { toast } from "sonner";
import { JobStatus, JobPriority } from "../../../../../../generated/client";

export default function NewBadanHukumPage() {
  const router = useRouter();
  const jobCategory = "Badan Hukum/Usaha";
  
  // Form states
  const [formData, setFormData] = React.useState({
    noBerkas: "",
    tanggalMasuk: new Date().toISOString().split('T')[0],
    clientName: "",
    jenisPekerjaan: "",
    pengurusanUntuk: "",
    jenisPekerjaanLainnya: "",
    namaSaksi: "",
    deadlineDays: "14",
    picPegawai: "",
    namaBadanHukum: "",
    notes: "",
    priority: JobPriority.MEDIUM as JobPriority,
  });

  // Smart Search States
  const [clientSearch, setClientSearch] = React.useState("");
  const [isClientDropdownOpen, setIsClientDropdownOpen] = React.useState(false);
  const [allClients, setAllClients] = React.useState<any[]>([]);
  const [allStaff, setAllStaff] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // PIC Smart Search States
  const [picSearch, setPicSearch] = React.useState("");
  const [isPicDropdownOpen, setIsPicDropdownOpen] = React.useState(false);
  
  const [saksiSearch, setSaksiSearch] = React.useState("");
  const [isSaksiDropdownOpen, setIsSaksiDropdownOpen] = React.useState(false);

  // Refs for click outside
  const clientRef = useRef<HTMLDivElement>(null);
  const picRef = useRef<HTMLDivElement>(null);
  const saksiRef = useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (clientRef.current && !clientRef.current.contains(event.target as Node)) setIsClientDropdownOpen(false);
      if (picRef.current && !picRef.current.contains(event.target as Node)) setIsPicDropdownOpen(false);
      if (saksiRef.current && !saksiRef.current.contains(event.target as Node)) setIsSaksiDropdownOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  React.useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const [clientsRes, staffRes] = await Promise.all([getClients(), getStaff()]);
      if (clientsRes.success) setAllClients(clientsRes.data || []);
      if (staffRes.success) setAllStaff(staffRes.data || []);
      setLoading(false);
    };
    fetchData();
  }, []);

  React.useEffect(() => {
    const fetchNextCode = async () => {
      const result = await getNextTrackingCode(jobCategory);
      if (result.success) {
        setFormData(prev => ({ ...prev, noBerkas: result.data as string }));
      } else {
        toast.error("Gagal mengambil nomor berkas: " + result.error);
      }
    };
    fetchNextCode();
  }, []);
  
  const filteredClients = allClients.filter(client => 
    client.name.toLowerCase().includes(clientSearch.toLowerCase()) ||
    (client.phone && client.phone.includes(clientSearch))
  );

  const filteredStaff = allStaff.filter(s => s.isActive && s.role !== 'ADMINISTRATOR' && s.fullName.toLowerCase().includes(picSearch.toLowerCase()));
  const filteredSaksi = allStaff.filter(s => s.isActive && s.role !== 'ADMINISTRATOR' && s.fullName.toLowerCase().includes(saksiSearch.toLowerCase()));

  // Multi Upload States
  interface DocRow { id: number; file: File | null; description: string; }
  const [documents, setDocuments] = React.useState<DocRow[]>([{ id: Date.now(), file: null, description: "" }]);
  const addDocumentRow = () => setDocuments([...documents, { id: Date.now(), file: null, description: "" }]);
  const removeDocumentRow = (id: number) => { if (documents.length > 1) setDocuments(documents.filter(doc => doc.id !== id)); };
  const updateDocumentRow = (id: number, field: keyof DocRow, value: any) => {
    setDocuments(documents.map(doc => doc.id === id ? { ...doc, [field]: value } : doc));
  };

  // Multi Pendiri States
  interface PendiriRow { id: number; nama: string; hp: string; email: string; }
  const [pendiri, setPendiri] = React.useState<PendiriRow[]>([{ id: Date.now(), nama: "", hp: "", email: "" }]);
  const addPendiriRow = () => setPendiri([...pendiri, { id: Date.now() + Math.random(), nama: "", hp: "", email: "" }]);
  const removePendiriRow = (id: number) => { if (pendiri.length > 1) setPendiri(pendiri.filter(p => p.id !== id)); };
  const updatePendiriRow = (id: number, field: keyof PendiriRow, value: string) => {
    setPendiri(pendiri.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.clientName) { toast.error("Silahkan pilih client terlebih dahulu"); return; }
    setIsSubmitting(true);
    const selectedClient = allClients.find(c => c.name === formData.clientName);
    // Upload files first
    const uploadedAttachments = await Promise.all(
      documents.filter(doc => doc.file).map(async (doc) => {
        try {
          const uploadFormData = new FormData();
          uploadFormData.append("file", doc.file as File);
          const res = await fetch("/api/upload", { method: "POST", body: uploadFormData });
          const uploadData = await res.json();
          return {
            fileName: doc.description || doc.file?.name || "Untitled",
            description: doc.description || doc.file?.name || "Untitled",
            filePath: uploadData.url || `/uploads/${doc.file?.name}`,
            fileType: doc.file?.type || "unknown"
          };
        } catch (err) {
          console.error("Upload error:", err);
          return {
            fileName: doc.file?.name || "Untitled",
            description: doc.description || doc.file?.name || "Untitled",
            filePath: `/uploads/${doc.file?.name}`,
            fileType: doc.file?.type || "unknown"
          };
        }
      })
    );

    const jobData = {
      title: formData.jenisPekerjaan === "Dan Lain-Lain" ? formData.jenisPekerjaanLainnya : `${formData.jenisPekerjaan} - ${formData.pengurusanUntuk}`,
      category: jobCategory,
      type: formData.jenisPekerjaan,
      companyName: formData.namaBadanHukum,
      clientId: selectedClient?.id,
      staffId: formData.picPegawai || null,
      status: JobStatus.PENDING,
      priority: formData.priority,
      deadline: new Date(Date.now() + (parseInt(formData.deadlineDays) || 14) * 24 * 60 * 60 * 1000).toISOString(),
      saksi: formData.namaSaksi,
      notes: formData.notes,
      founders: pendiri.filter(p => p.nama).map(p => ({ name: p.nama, phone: p.hp, email: p.email })),
      attachments: uploadedAttachments
    };
    const result = await createJob(jobData);
    if (result.success) { toast.success("Berkas Badan Hukum berhasil diregistrasi!"); router.push("/dashboard/jobs/inbound"); }
    else toast.error(result.error);
    setIsSubmitting(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/jobs/new">
            <Button variant="ghost" size="icon" className="rounded-full hover:bg-pink-500/10 hover:text-pink-500 transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Registrasi Badan Hukum</h1>
            <p className="text-sm text-muted-foreground uppercase tracking-widest font-bold text-pink-500">PT / CV / Koperasi / Yayasan</p>
          </div>
        </div>
      </div>

      <Card className="border-none shadow-sm rounded-[2.5rem] bg-card overflow-hidden">
        <CardHeader className="border-b bg-muted/5 px-10 py-8">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-pink-500/10 flex items-center justify-center">
              <Building2 className="h-7 w-7 text-pink-500" />
            </div>
            <div>
              <CardTitle className="text-xl">Formulir Badan Hukum</CardTitle>
              <CardDescription>Masukkan detail pendirian atau perubahan badan hukum.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-10">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid gap-x-10 gap-y-8 md:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-sm font-bold text-muted-foreground">Nomor Berkas</Label>
                <div className="relative">
                  <Input value={formData.noBerkas} readOnly className="h-11 rounded-xl border-muted bg-muted/30 font-mono font-bold text-pink-600 px-4" />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold bg-pink-500 text-white px-2 py-1 rounded-md uppercase">Otomatis</div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-bold text-muted-foreground">Tanggal Berkas Masuk</Label>
                <div className="relative">
                  <Input type="date" value={formData.tanggalMasuk} onChange={(e) => setFormData(prev => ({ ...prev, tanggalMasuk: e.target.value }))} className="h-11 rounded-xl border-muted px-4" required />
                  <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
                </div>
              </div>

              <div className="space-y-2 relative" ref={picRef}>
                <Label className="text-sm font-bold text-muted-foreground">Nama PIC Pegawai</Label>
                <Input placeholder="Cari pegawai..." value={picSearch} onChange={(e) => { setPicSearch(e.target.value); setIsPicDropdownOpen(true); }} onFocus={() => setIsPicDropdownOpen(true)} className="h-11 rounded-xl border-muted px-4 font-medium" required />
                {isPicDropdownOpen && (
                  <div className="absolute z-50 w-full mt-2 bg-card border border-muted shadow-2xl rounded-xl p-2 max-h-[250px] overflow-y-auto">
                    {filteredStaff.map(staff => (
                      <div key={staff.id} onClick={() => { setFormData(prev => ({ ...prev, picPegawai: staff.id })); setPicSearch(staff.fullName); setIsPicDropdownOpen(false); }} className="flex items-center gap-3 p-3 rounded-xl hover:bg-pink-50 cursor-pointer">
                        <div className="h-9 w-9 rounded-full bg-pink-500/10 flex items-center justify-center text-pink-500"><User2 className="h-5 w-5" /></div>
                        <div><p className="font-bold text-sm">{staff.fullName}</p><p className="text-[10px] text-muted-foreground uppercase">{staff.role}</p></div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2 relative" ref={saksiRef}>
                <Label className="text-sm font-bold text-muted-foreground">Nama Saksi</Label>
                <Input placeholder="Cari saksi..." value={saksiSearch} onChange={(e) => { setSaksiSearch(e.target.value); setIsSaksiDropdownOpen(true); }} onFocus={() => setIsSaksiDropdownOpen(true)} className="h-11 rounded-xl border-muted px-4 font-medium" required />
                {isSaksiDropdownOpen && (
                  <div className="absolute z-50 w-full mt-2 bg-card border border-muted shadow-2xl rounded-xl p-2 max-h-[250px] overflow-y-auto">
                    {filteredSaksi.map((s, i) => (
                      <div key={i} onClick={() => { setFormData(prev => ({ ...prev, namaSaksi: s.fullName })); setSaksiSearch(s.fullName); setIsSaksiDropdownOpen(false); }} className="flex items-center gap-3 p-3 rounded-xl hover:bg-pink-50 cursor-pointer group">
                        <div className="h-9 w-9 rounded-full bg-pink-500/10 flex items-center justify-center text-pink-500 group-hover:bg-pink-500 group-hover:text-white transition-colors"><User2 className="h-5 w-5" /></div>
                        <div><p className="font-bold text-sm">{s.fullName}</p><p className="text-[10px] text-muted-foreground uppercase">{s.role || "Staff"}</p></div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2 md:col-span-2 relative" ref={clientRef}>
                <Label className="text-sm font-bold text-muted-foreground">Nama Client</Label>
                <Input placeholder="Cari client..." value={clientSearch} onChange={(e) => { setClientSearch(e.target.value); setIsClientDropdownOpen(true); }} onFocus={() => setIsClientDropdownOpen(true)} className="h-11 rounded-xl border-muted px-4 font-medium" required />
                {isClientDropdownOpen && (
                  <div className="absolute z-50 w-full mt-2 bg-card border border-muted shadow-2xl rounded-xl p-2 max-h-[300px] overflow-y-auto">
                    {filteredClients.map(client => (
                      <div key={client.id} onClick={() => { setFormData(prev => ({ ...prev, clientName: client.name })); setClientSearch(client.name); setIsClientDropdownOpen(false); }} className="flex items-center justify-between p-3 rounded-xl hover:bg-pink-50 cursor-pointer group transition-all">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-pink-500/10 flex items-center justify-center text-pink-500 group-hover:bg-pink-500 group-hover:text-white transition-colors"><User2 className="h-5 w-5" /></div>
                          <div className="flex flex-col">
                            <span className="font-bold text-sm">{client.company ? `${client.company} (${client.name})` : client.name}</span>
                            <span className="text-[10px] text-muted-foreground uppercase">{client.phone || "No Phone"}</span>
                          </div>
                        </div>
                        <div className="text-[10px] font-bold bg-pink-100 text-pink-600 px-2 py-1 rounded-md uppercase opacity-0 group-hover:opacity-100 transition-opacity">Pilih</div>
                      </div>
                    ))}
                    {filteredClients.length === 0 && (
                      <div className="p-4 text-center text-muted-foreground text-sm">Tidak ada client ditemukan</div>
                    )}
                  </div>
                )}
              </div>

              <div className="md:col-span-2 space-y-6 pt-4">
                <div className="flex items-center justify-between border-b border-muted/20 pb-2">
                  <div className="flex items-center gap-2"><User2 className="h-5 w-5 text-pink-500" /><Label className="text-base font-bold">Informasi Pendiri</Label></div>
                  <Button type="button" variant="outline" size="sm" onClick={addPendiriRow} className="rounded-xl border-pink-200 text-pink-600 font-bold gap-2"><Plus className="h-4 w-4" />Tambah Pendiri</Button>
                </div>
                <div className="space-y-4">
                  {pendiri.map((p, i) => (
                    <div key={p.id} className="p-6 rounded-3xl border border-muted bg-muted/5 relative">
                      <div className="absolute -top-3 left-6 px-3 py-0.5 bg-pink-500 text-white text-[10px] font-bold rounded-full uppercase">Pendiri #{i + 1}</div>
                      {pendiri.length > 1 && <Button type="button" variant="ghost" size="icon" onClick={() => removePendiriRow(p.id)} className="absolute top-4 right-4 text-muted-foreground hover:text-rose-500"><Trash2 className="h-4 w-4" /></Button>}
                      <div className="grid md:grid-cols-3 gap-6 pt-2">
                        <div className="space-y-2"><Label className="text-xs font-bold text-muted-foreground uppercase">Nama Pendiri</Label><Input placeholder="Nama lengkap..." value={p.nama} onChange={(e) => updatePendiriRow(p.id, 'nama', e.target.value)} className="h-11 rounded-xl" required /></div>
                        <div className="space-y-2"><Label className="text-xs font-bold text-muted-foreground uppercase">No HP</Label><Input placeholder="628..." value={p.hp} onChange={(e) => updatePendiriRow(p.id, 'hp', e.target.value)} className="h-11 rounded-xl" required /></div>
                        <div className="space-y-2"><Label className="text-xs font-bold text-muted-foreground uppercase">Email</Label><Input type="email" placeholder="email@..." value={p.email} onChange={(e) => updatePendiriRow(p.id, 'email', e.target.value)} className="h-11 rounded-xl" /></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-bold text-muted-foreground">Jenis Badan Hukum</Label>
                <select className="flex h-11 w-full rounded-xl border border-muted bg-background px-4 font-medium" required value={formData.jenisPekerjaan} onChange={(e) => setFormData(prev => ({ ...prev, jenisPekerjaan: e.target.value }))}>
                  <option value="">Pilih Jenis</option>
                  <option value="PT / PMA">PT / PMA</option>
                  <option value="CV">CV</option>
                  <option value="Koperasi">Koperasi</option>
                  <option value="Yayasan">Yayasan</option>
                  <option value="Perkumpulan">Perkumpulan</option>
                  <option value="Persekutuan Perdata">Persekutuan Perdata</option>
                  <option value="Persekutuan Firma">Persekutuan Firma</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-bold text-muted-foreground">Nama Badan Hukum (PT/CV/Yayasan)</Label>
                <Input placeholder="Contoh: PT. Maju Bersama Sejahtera" value={formData.namaBadanHukum} onChange={(e) => setFormData(prev => ({ ...prev, namaBadanHukum: e.target.value }))} className="h-11 rounded-xl border-muted px-4 font-bold" required />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-bold text-muted-foreground">Pengurusan Untuk</Label>
                <select className="flex h-11 w-full rounded-xl border border-muted bg-background px-4 font-medium" required value={formData.pengurusanUntuk} onChange={(e) => setFormData(prev => ({ ...prev, pengurusanUntuk: e.target.value }))}>
                  <option value="">Pilih Pengurusan</option>
                  <option value="Pendirian">Pendirian</option>
                  <option value="Perubahan">Perubahan</option>
                  <option value="Pembubaran">Pembubaran</option>
                </select>
              </div>

               <div className="space-y-2">
                <Label className="text-sm font-bold text-muted-foreground">Prioritas Berkas</Label>
                <div className="relative">
                  <select 
                    className="flex h-11 w-full rounded-xl border border-muted bg-background px-4 font-medium appearance-none focus:ring-2 focus:ring-pink-500/20 outline-none transition-all" 
                    required 
                    value={formData.priority} 
                    onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as any }))}
                  >
                    <option value={JobPriority.LOW}>LOW - Santai</option>
                    <option value={JobPriority.MEDIUM}>MEDIUM - Normal</option>
                    <option value={JobPriority.HIGH}>HIGH - Penting</option>
                    <option value={JobPriority.URGENT}>URGENT - Sangat Mendesak</option>
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                    <div className={cn(
                      "h-2 w-2 rounded-full",
                      formData.priority === JobPriority.URGENT ? "bg-rose-500 animate-pulse" :
                      formData.priority === JobPriority.HIGH ? "bg-orange-500" :
                      formData.priority === JobPriority.MEDIUM ? "bg-blue-500" : "bg-slate-400"
                    )} />
                  </div>
                </div>
              </div>


              <div className="space-y-2">
                <Label className="text-sm font-bold text-muted-foreground">Deadline (Hari)</Label>
                <div className="relative">
                  <Input type="number" value={formData.deadlineDays} onChange={(e) => setFormData(prev => ({ ...prev, deadlineDays: e.target.value }))} className="h-11 rounded-xl border-muted px-4" required />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2"><span className="text-xs font-bold text-muted-foreground uppercase">Hari</span><Clock className="h-5 w-5 text-muted-foreground" /></div>
                </div>
              </div>

              <div className="md:col-span-2 space-y-2">
                <Label className="text-sm font-bold text-muted-foreground">Catatan Tambahan</Label>
                <textarea rows={4} placeholder="Masukkan catatan internal..." value={formData.notes} onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))} className="flex w-full rounded-xl border border-muted bg-background px-4 py-4 text-sm font-medium min-h-[100px]" />
              </div>

              <div className="md:col-span-2 space-y-4 pt-4">
                <div className="flex items-center justify-between border-b border-muted/20 pb-2">
                  <div className="flex items-center gap-2"><FilePlus2 className="h-5 w-5 text-pink-500" /><Label className="text-base font-bold">Dokumen Pendukung</Label></div>
                  <Button type="button" variant="outline" size="sm" onClick={addDocumentRow} className="rounded-xl border-pink-200 text-pink-600 font-bold gap-2"><Plus className="h-4 w-4" />Tambah Dokumen</Button>
                </div>
                <div className="space-y-4">
                  {documents.map((doc, i) => (
                    <div key={doc.id} className="grid md:grid-cols-12 gap-4 items-end animate-in fade-in slide-in-from-left-2">
                      <div className="md:col-span-5 space-y-2">
                        <Label className="text-xs font-bold text-muted-foreground uppercase">File Dokumen</Label>
                        <div className="relative group">
                          <input type="file" onChange={(e) => updateDocumentRow(doc.id, 'file', e.target.files?.[0] || null)} className="hidden" id={`file-${doc.id}`} />
                          <label htmlFor={`file-${doc.id}`} className={cn("flex items-center h-11 w-full rounded-xl border-2 border-dashed px-4 gap-3 cursor-pointer transition-all", doc.file ? "border-emerald-500 bg-emerald-500/5 text-emerald-700" : "border-muted group-hover:border-pink-500 bg-muted/10 text-muted-foreground")}>
                            <FilePlus2 className="h-5 w-5" />
                            <span className="text-sm font-medium truncate">{doc.file ? doc.file.name : "Pilih File..."}</span>
                          </label>
                        </div>
                      </div>
                      <div className="md:col-span-6 space-y-2">
                        <Label className="text-xs font-bold text-muted-foreground uppercase">Keterangan Dokumen</Label>
                        <Input placeholder="Contoh: Fotokopi KTP, dll" value={doc.description} onChange={(e) => updateDocumentRow(doc.id, 'description', e.target.value)} className="h-11 rounded-xl" />
                      </div>
                      <div className="md:col-span-1">
                        <Button type="button" variant="ghost" size="icon" disabled={documents.length === 1} onClick={() => removeDocumentRow(doc.id)} className="h-11 w-14 rounded-xl text-muted-foreground hover:text-rose-500 hover:bg-rose-50"><Trash2 className="h-5 w-5" /></Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex flex-col md:flex-row items-center justify-end gap-4 pt-10 border-t border-muted/5">
              <Link href="/dashboard/jobs/new" className="w-full md:w-auto">
                <Button variant="ghost" type="button" className="w-full md:w-auto h-11 px-10 rounded-xl font-bold">Batal</Button>
              </Link>
              <Button type="submit" disabled={isSubmitting} className="w-full md:w-auto h-11 px-12 rounded-xl gap-2 font-bold bg-pink-500 hover:bg-pink-600 shadow-xl shadow-pink-500/20 transition-all">
                <Save className="h-5 w-5" />
                {isSubmitting ? "Sedang Mendaftarkan..." : "Registrasi Berkas"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
