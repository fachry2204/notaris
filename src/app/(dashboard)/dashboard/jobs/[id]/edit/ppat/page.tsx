"use client";

import React, { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Save, Landmark, User2, Clock, Calendar, Search, Plus, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getJobById, updateJob } from "@/lib/actions/jobs";
import { getClients } from "@/lib/actions/clients";
import { getStaff } from "@/lib/actions/users";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default function EditPpatPage() {
  const { id } = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [allClients, setAllClients] = useState<any[]>([]);
  const [allStaff, setAllStaff] = useState<any[]>([]);
  const jobCategory = "PPAT";

  const [formData, setFormData] = useState({
    noBerkas: "",
    tanggalMasuk: "",
    clientName: "",
    clientId: "",
    jenisPekerjaan: "",
    pengurusanUntuk: "",
    picPegawai: "",
    namaSaksi: "",
    deadlineDays: "14",
    notes: "",
    status: "",
    priority: "MEDIUM",
  });

  const [clientSearch, setClientSearch] = useState("");
  const [isClientDropdownOpen, setIsClientDropdownOpen] = useState(false);
  const [picSearch, setPicSearch] = useState("");
  const [isPicDropdownOpen, setIsPicDropdownOpen] = useState(false);
  const [saksiSearch, setSaksiSearch] = useState("");
  const [isSaksiDropdownOpen, setIsSaksiDropdownOpen] = useState(false);
  const saksiOptions = ["Rahma", "Doni", "Maya", "Rizky", "Siti", "Ahmad"];

  const clientRef = useRef<HTMLDivElement>(null);
  const picRef = useRef<HTMLDivElement>(null);
  const saksiRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (clientRef.current && !clientRef.current.contains(event.target as Node)) setIsClientDropdownOpen(false);
      if (picRef.current && !picRef.current.contains(event.target as Node)) setIsPicDropdownOpen(false);
      if (saksiRef.current && !saksiRef.current.contains(event.target as Node)) setIsSaksiDropdownOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  interface DocRow { id: string | number; file: File | null; description: string; existing?: boolean; fileName?: string; }
  const [documents, setDocuments] = useState<DocRow[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const [jobRes, clientsRes, staffRes] = await Promise.all([getJobById(id as string), getClients(), getStaff()]);

      if (jobRes.success) {
        const job = jobRes.data;
        const titleParts = job.title.split(' - ');
        setFormData({
          noBerkas: job.trackingCode,
          tanggalMasuk: job.createdAt ? new Date(job.createdAt).toISOString().split('T')[0] : "",
          clientName: job.client?.name || "",
          clientId: job.clientId,
          jenisPekerjaan: titleParts[0] || "",
          pengurusanUntuk: titleParts[1] || "",
          picPegawai: job.staffId || "",
          namaSaksi: job.saksi || "",
          deadlineDays: job.deadline && job.createdAt ? Math.ceil((new Date(job.deadline).getTime() - new Date(job.createdAt).getTime()) / (1000 * 60 * 60 * 24)).toString() : "14",
          notes: job.notes || "",
          status: job.status,
          priority: job.priority || "MEDIUM",
        });

        setClientSearch(job.client?.name || "");
        setPicSearch(job.staff?.fullName || "");
        setSaksiSearch(job.saksi || "");
        if (job.attachments) setDocuments(job.attachments.map((att: any) => ({ id: att.id, file: null, description: att.description || att.fileName, existing: true, fileName: att.fileName })));
      }
      if (clientsRes.success) setAllClients(clientsRes.data || []);
      if (staffRes.success) setAllStaff(staffRes.data || []);
      setLoading(false);
    };
    fetchData();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const jobData = {
      title: `${formData.jenisPekerjaan}${formData.pengurusanUntuk ? ' - ' + formData.pengurusanUntuk : ''}`,
      type: jobCategory,
      clientId: formData.clientId,
      staffId: formData.picPegawai || null,
      status: formData.status,
      priority: formData.priority,
      deadline: new Date(Date.now() + (parseInt(formData.deadlineDays) || 14) * 24 * 60 * 60 * 1000).toISOString(),
      saksi: saksiSearch,
      notes: formData.notes,
      category: jobCategory,
      attachments: documents.filter(doc => doc.file || doc.existing).map(doc => ({
        fileName: doc.file ? doc.file.name : doc.fileName,
        description: doc.description || (doc.file ? doc.file.name : doc.fileName),
        filePath: doc.file ? `/uploads/${doc.file.name}` : `/uploads/${doc.fileName}`,
        fileType: doc.file ? doc.file.type : "unknown"
      }))
    };
    const result = await updateJob(id as string, jobData);
    if (result.success) { toast.success("Berkas PPAT diperbarui!"); router.push(`/dashboard/jobs/${id}`); }
    else toast.error(result.error);
    setIsSubmitting(false);
  };

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><div className="animate-spin h-8 w-8 border-4 border-pink-500 border-t-transparent rounded-full"></div></div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="rounded-full" onClick={() => router.back()}><ArrowLeft className="h-5 w-5" /></Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Edit Berkas PPAT</h1>
            <p className="text-sm text-muted-foreground uppercase tracking-widest font-bold text-pink-500">{formData.noBerkas}</p>
          </div>
        </div>
      </div>

      <Card className="border-none shadow-sm rounded-[2.5rem] bg-card overflow-hidden">
        <CardHeader className="border-b bg-muted/5 px-10 py-8">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-pink-500/10 flex items-center justify-center text-pink-500"><Landmark className="h-7 w-7" /></div>
            <div><CardTitle className="text-xl">Formulir Edit PPAT</CardTitle><CardDescription>Update detail informasi pengurusan akta pertanahan.</CardDescription></div>
          </div>
        </CardHeader>
        <CardContent className="p-10">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid gap-x-10 gap-y-8 md:grid-cols-2">
              <div className="space-y-2"><Label className="text-sm font-bold text-muted-foreground">Nomor Berkas</Label><Input value={formData.noBerkas} readOnly className="h-11 rounded-xl border-muted bg-muted/30 font-mono font-bold text-pink-600 px-4" /></div>
              <div className="space-y-2"><Label className="text-sm font-bold text-muted-foreground">Tanggal Masuk</Label><Input type="date" value={formData.tanggalMasuk} readOnly className="h-11 rounded-xl border-muted bg-muted/30 px-4" /></div>
              
              <div className="space-y-2 relative" ref={picRef}>
                <Label className="text-sm font-bold text-muted-foreground">Nama PIC Pegawai</Label>
                <Input value={picSearch} onChange={(e) => { setPicSearch(e.target.value); setIsPicDropdownOpen(true); }} onFocus={() => setIsPicDropdownOpen(true)} className="h-11 rounded-xl border-muted px-4 font-medium" />
                {isPicDropdownOpen && (
                  <div className="absolute z-50 w-full mt-2 bg-card border border-muted shadow-2xl rounded-xl p-2 max-h-[250px] overflow-y-auto">
                    {allStaff.filter(s => s.isActive && s.role !== 'ADMINISTRATOR' && s.fullName.toLowerCase().includes(picSearch.toLowerCase())).map(staff => (
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
                <Input value={saksiSearch} onChange={(e) => { setSaksiSearch(e.target.value); setIsSaksiDropdownOpen(true); }} onFocus={() => setIsSaksiDropdownOpen(true)} className="h-11 rounded-xl border-muted px-4 font-medium" />
                {isSaksiDropdownOpen && (
                  <div className="absolute z-50 w-full mt-2 bg-card border border-muted shadow-2xl rounded-xl p-2">
                    {saksiOptions.filter(s => s.toLowerCase().includes(saksiSearch.toLowerCase())).map((s, i) => (
                      <div key={i} onClick={() => { setSaksiSearch(s); setIsSaksiDropdownOpen(false); }} className="p-3 rounded-xl hover:bg-pink-50 cursor-pointer font-bold text-sm">{s}</div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2 md:col-span-2 relative" ref={clientRef}>
                <Label className="text-sm font-bold text-muted-foreground">Nama Client</Label>
                <Input value={clientSearch} onChange={(e) => { setClientSearch(e.target.value); setIsClientDropdownOpen(true); }} onFocus={() => setIsClientDropdownOpen(true)} className="h-11 rounded-xl border-muted px-4 font-medium" />
                {isClientDropdownOpen && clientSearch.length >= 2 && (
                  <div className="absolute z-50 w-full mt-2 bg-card border border-muted shadow-2xl rounded-xl p-2 max-h-[300px] overflow-y-auto">
                    {allClients.filter(c => c.name.toLowerCase().includes(clientSearch.toLowerCase())).map(client => (
                      <div key={client.id} onClick={() => { setFormData(prev => ({ ...prev, clientId: client.id, clientName: client.name })); setClientSearch(client.name); setIsClientDropdownOpen(false); }} className="flex items-center justify-between p-4 rounded-xl hover:bg-pink-50 cursor-pointer group">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-pink-500/10 flex items-center justify-center text-pink-500 group-hover:bg-pink-500 group-hover:text-white transition-colors"><User2 className="h-5 w-5" /></div>
                          <div className="flex flex-col"><span className="font-bold">{client.company ? `${client.company} (${client.name})` : client.name}</span><span className="text-[10px] text-muted-foreground uppercase">{client.phone}</span></div>
                        </div>
                        <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 text-pink-600 font-bold text-[10px]">Pilih</Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-bold text-muted-foreground">Jenis Pekerjaan PPAT</Label>
                <select className="flex h-11 w-full rounded-xl border border-muted bg-background px-4 font-medium" value={formData.jenisPekerjaan} onChange={(e) => setFormData(prev => ({ ...prev, jenisPekerjaan: e.target.value }))}>
                  <option value="Akta Jual Beli">Akta Jual Beli</option>
                  <option value="Hibah">Hibah</option>
                  <option value="APHT">APHT</option>
                  <option value="APHB">APHB</option>
                  <option value="Balik Nama Waris">Balik Nama Waris</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-bold text-muted-foreground">Pengurusan Untuk</Label>
                <select className="flex h-11 w-full rounded-xl border border-muted bg-background px-4 font-medium" value={formData.pengurusanUntuk} onChange={(e) => setFormData(prev => ({ ...prev, pengurusanUntuk: e.target.value }))}>
                  <option value="SHM">Sertifikat Hak Milik (SHM)</option>
                  <option value="HGB">HGB</option>
                  <option value="Hak Pakai">Hak Pakai</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-bold text-muted-foreground">Deadline (Hari)</Label>
                <div className="relative"><Input type="number" value={formData.deadlineDays} onChange={(e) => setFormData(prev => ({ ...prev, deadlineDays: e.target.value }))} className="h-11 rounded-xl border-muted px-4" /><Clock className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" /></div>
              </div>

              <div className="md:col-span-2 space-y-4 pt-4">
                <div className="flex items-center justify-between border-b border-muted/20 pb-2"><div className="flex items-center gap-2 text-pink-500"><Landmark className="h-5 w-5" /><Label className="text-base font-bold">Dokumen Pendukung</Label></div><Button type="button" variant="outline" size="sm" onClick={() => setDocuments([...documents, { id: Date.now(), file: null, description: "" }])} className="rounded-xl text-pink-600 font-bold"><Plus className="h-4 w-4 mr-2" />Tambah Dokumen</Button></div>
                <div className="space-y-4">
                  {documents.map((doc, i) => (
                    <div key={doc.id} className="grid md:grid-cols-12 gap-4 items-end animate-in fade-in slide-in-from-left-2">
                      <div className="md:col-span-5 space-y-2"><Label className="text-xs font-bold text-muted-foreground uppercase">File</Label><div className="relative group"><input type="file" onChange={(e) => setDocuments(documents.map(x => x.id === doc.id ? { ...x, file: e.target.files?.[0] || null, existing: false } : x))} className="hidden" id={`file-${doc.id}`} /><label htmlFor={`file-${doc.id}`} className={cn("flex items-center h-11 w-full rounded-xl border-2 border-dashed px-4 gap-3 cursor-pointer", doc.file || doc.existing ? "border-emerald-500 text-emerald-700" : "border-muted text-muted-foreground")}><Upload className="h-4 w-4" /><span className="text-sm truncate">{doc.existing ? doc.fileName : (doc.file ? doc.file.name : "Pilih File")}</span></label></div></div>
                      <div className="md:col-span-6 space-y-2"><Label className="text-xs font-bold text-muted-foreground uppercase">Keterangan</Label><Input value={doc.description} onChange={(e) => setDocuments(documents.map(x => x.id === doc.id ? { ...x, description: e.target.value } : x))} className="h-11 rounded-xl" /></div>
                      <div className="md:col-span-1"><Button type="button" variant="ghost" size="icon" onClick={() => setDocuments(documents.filter(x => x.id !== doc.id))} className="h-11 w-full text-muted-foreground hover:text-rose-500"><Trash2 className="h-5 w-5" /></Button></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-4 pt-10 border-t border-muted/5">
              <Button variant="ghost" type="button" className="h-11 px-10 font-bold" onClick={() => router.back()}>Batal</Button>
              <Button type="submit" disabled={isSubmitting} className="h-11 px-12 rounded-xl font-bold bg-pink-500 hover:bg-pink-600 shadow-xl shadow-pink-500/20">{isSubmitting ? "Menyimpan..." : "Simpan Perubahan"}</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
