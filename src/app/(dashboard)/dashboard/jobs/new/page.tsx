"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { ArrowLeft, FilePlus2, Save, X, Building2, User2, Landmark, Clock, Calendar, Search, Plus, Trash2, Upload } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export default function NewJobPage() {
  const router = useRouter();
  const [step, setStep] = React.useState<"selection" | "form">("selection");
  const [jobCategory, setJobCategory] = React.useState<string>("");
  
  // Form states
  const [formData, setFormData] = React.useState({
    noBerkas: "",
    tanggalMasuk: new Date().toISOString().split('T')[0],
    clientName: "",
    jenisPekerjaan: "",
    pengurusanUntuk: "",
    jenisPekerjaanLainnya: "",
    picPegawai: "",
    namaSaksi: "",
    deadlineDays: "",
  });

  // Smart Search States
  const [clientSearch, setClientSearch] = React.useState("");
  const [isClientDropdownOpen, setIsClientDropdownOpen] = React.useState(false);
  
  const mockClients = [
    { name: "Budi Santoso", type: "Perorangan", phone: "08123456789", company: "" },
    { name: "Siti Aminah", type: "Perorangan", phone: "087788990011", company: "" },
    { name: "Joni", type: "Badan Hukum", phone: "0811223344", company: "PT Maju Terus" },
    { name: "Dewi", type: "Badan Hukum", phone: "0855667788", company: "CV Berkah Mandiri" },
    { name: "Ahmad Zaki", type: "Non Badan Hukum", phone: "0899001122", company: "" },
  ];

  const filteredClients = mockClients.filter(client => 
    client.name.toLowerCase().includes(clientSearch.toLowerCase()) ||
    client.phone.includes(clientSearch) ||
    (client.company && client.company.toLowerCase().includes(clientSearch.toLowerCase()))
  );

  // Multi Upload States
  interface DocRow {
    id: number;
    file: File | null;
    description: string;
  }
  const [documents, setDocuments] = React.useState<DocRow[]>([
    { id: Date.now(), file: null, description: "" }
  ]);

  const addDocumentRow = () => {
    setDocuments([...documents, { id: Date.now(), file: null, description: "" }]);
  };

  const removeDocumentRow = (id: number) => {
    if (documents.length > 1) {
      setDocuments(documents.filter(doc => doc.id !== id));
    }
  };

  const updateDocumentRow = (id: number, field: keyof DocRow, value: any) => {
    setDocuments(documents.map(doc => 
      doc.id === id ? { ...doc, [field]: value } : doc
    ));
  };

  // Multi Pendiri States
  interface PendiriRow {
    id: number;
    nama: string;
    hp: string;
    email: string;
  }
  
  const [pendiri, setPendiri] = React.useState<PendiriRow[]>([
    { id: Date.now(), nama: "", hp: "", email: "" }
  ]);

  const addPendiriRow = () => {
    setPendiri([...pendiri, { id: Date.now() + Math.random(), nama: "", hp: "", email: "" }]);
  };

  const removePendiriRow = (id: number) => {
    if (pendiri.length > 1) {
      setPendiri(pendiri.filter(p => p.id !== id));
    }
  };

  const updatePendiriRow = (id: number, field: keyof PendiriRow, value: string) => {
    setPendiri(pendiri.map(p => 
      p.id === id ? { ...p, [field]: value } : p
    ));
  };

  // Generate auto number on job category selection
  React.useEffect(() => {
    if (step === "form") {
      const year = new Date().getFullYear();
      const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      setFormData(prev => ({
        ...prev,
        noBerkas: `${randomNum}/B/${year}`
      }));
    }
  }, [step]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert("Berkas berhasil diregistrasi!");
    router.push("/dashboard/jobs/inbound");
  };

  if (step === "selection") {
    return (
      <div className="max-w-5xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700 py-12">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground">Registrasi Berkas Baru</h1>
          <p className="text-lg text-muted-foreground">Pilih kategori berkas yang ingin Anda daftarkan.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Badan Hukum */}
          <div 
            onClick={() => { setJobCategory("Badan Hukum/Usaha"); setStep("form"); }}
            className="group relative flex flex-col items-center justify-center p-10 rounded-[2.5rem] border-2 border-muted bg-card hover:border-pink-500 hover:shadow-2xl hover:shadow-pink-500/10 transition-all duration-500 cursor-pointer overflow-hidden"
          >
            <div className="h-24 w-24 rounded-3xl bg-pink-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
              <Building2 className="h-12 w-12 text-pink-500" />
            </div>
            <h2 className="text-xl font-bold mb-3 text-center">Badan Hukum / Usaha</h2>
            <p className="text-center text-sm text-muted-foreground leading-relaxed">
              Pengurusan berkas untuk PT, CV, Yayasan, atau Koperasi.
            </p>
          </div>

          {/* Non Badan Hukum */}
          <div 
            onClick={() => { setJobCategory("Non Badan Hukum"); setStep("form"); }}
            className="group relative flex flex-col items-center justify-center p-10 rounded-[2.5rem] border-2 border-muted bg-card hover:border-pink-500 hover:shadow-2xl hover:shadow-pink-500/10 transition-all duration-500 cursor-pointer overflow-hidden"
          >
            <div className="h-24 w-24 rounded-3xl bg-pink-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
              <User2 className="h-12 w-12 text-pink-500" />
            </div>
            <h2 className="text-xl font-bold mb-3 text-center">Non Badan Hukum</h2>
            <p className="text-center text-sm text-muted-foreground leading-relaxed">
              Pengurusan berkas perorangan, kuasa, atau perjanjian individu.
            </p>
          </div>

          {/* PPAT */}
          <div 
            onClick={() => { setJobCategory("PPAT"); setStep("form"); }}
            className="group relative flex flex-col items-center justify-center p-10 rounded-[2.5rem] border-2 border-muted bg-card hover:border-pink-500 hover:shadow-2xl hover:shadow-pink-500/10 transition-all duration-500 cursor-pointer overflow-hidden"
          >
            <div className="h-24 w-24 rounded-3xl bg-pink-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
              <Landmark className="h-12 w-12 text-pink-500" />
            </div>
            <h2 className="text-xl font-bold mb-3 text-center">PPAT</h2>
            <p className="text-center text-sm text-muted-foreground leading-relaxed">
              Pengurusan Akta Jual Beli, Hibah, APHB, dan Hak Tanggungan.
            </p>
          </div>
        </div>

        <div className="flex justify-center pt-8">
          <Link href="/dashboard/jobs/inbound">
            <Button variant="ghost" className="gap-2 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
              Kembali ke Daftar Berkas
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            className="rounded-full hover:bg-pink-500/10 hover:text-pink-500 transition-colors"
            onClick={() => setStep("selection")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Formulir Berkas Baru</h1>
            <p className="text-sm text-muted-foreground">Kategori: <span className="font-bold text-pink-600 uppercase tracking-wider">{jobCategory}</span></p>
          </div>
        </div>
      </div>

      <Card className="border-none shadow-sm rounded-[2.5rem] bg-card overflow-hidden">
        <CardHeader className="border-b bg-muted/5 px-10 py-8">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-pink-500/10 flex items-center justify-center">
              <FilePlus2 className="h-7 w-7 text-pink-500" />
            </div>
            <div>
              <CardTitle className="text-xl">Informasi Registrasi Berkas</CardTitle>
              <CardDescription>Masukkan detail berkas untuk memulai proses pengerjaan.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-10">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid gap-x-10 gap-y-8 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="noBerkas" className="text-sm font-bold text-muted-foreground">Nomor Berkas</Label>
                <div className="relative">
                  <Input 
                    id="noBerkas" 
                    value={formData.noBerkas}
                    readOnly
                    className="h-14 rounded-2xl border-muted bg-muted/30 font-mono font-bold text-pink-600 focus-visible:ring-pink-500 px-5" 
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold bg-pink-500 text-white px-2 py-1 rounded-md uppercase">Otomatis</div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tanggalMasuk" className="text-sm font-bold text-muted-foreground">Tanggal Berkas Masuk</Label>
                <div className="relative">
                  <Input 
                    id="tanggalMasuk" 
                    type="date"
                    value={formData.tanggalMasuk}
                    onChange={(e) => setFormData(prev => ({ ...prev, tanggalMasuk: e.target.value }))}
                    className="h-14 rounded-2xl border-muted focus-visible:ring-pink-500 px-5" 
                    required 
                  />
                  <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
                </div>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="picPegawai" className="text-sm font-bold text-muted-foreground">Nama PIC Pegawai</Label>
                <select 
                  id="picPegawai"
                  className="flex h-14 w-full rounded-2xl border border-muted bg-background px-5 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-pink-500 transition-all cursor-pointer appearance-none font-medium"
                  required
                  value={formData.picPegawai}
                  onChange={(e) => setFormData(prev => ({ ...prev, picPegawai: e.target.value }))}
                >
                  <option value="">Pilih PIC Pegawai</option>
                  <option value="Fachry">Fachry</option>
                  <option value="Andi">Andi</option>
                  <option value="Siska">Siska</option>
                  <option value="Budi">Budi</option>
                </select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="namaSaksi" className="text-sm font-bold text-muted-foreground">Nama Saksi</Label>
                <select 
                  id="namaSaksi"
                  className="flex h-14 w-full rounded-2xl border border-muted bg-background px-5 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-pink-500 transition-all cursor-pointer appearance-none font-medium"
                  required
                  value={formData.namaSaksi}
                  onChange={(e) => setFormData(prev => ({ ...prev, namaSaksi: e.target.value }))}
                >
                  <option value="">Pilih Nama Saksi</option>
                  <option value="Rahma">Rahma</option>
                  <option value="Doni">Doni</option>
                  <option value="Maya">Maya</option>
                  <option value="Rizky">Rizky</option>
                </select>
              </div>

              <div className="space-y-2 md:col-span-2 relative">
                <Label htmlFor="client" className="text-sm font-bold text-muted-foreground">Nama Client</Label>
                <div className="relative group">
                  <Input 
                    id="client"
                    placeholder="Cari nama client (Ketik minimal 2 karakter)..."
                    value={clientSearch}
                    onChange={(e) => {
                      setClientSearch(e.target.value);
                      setIsClientDropdownOpen(true);
                    }}
                    onFocus={() => setIsClientDropdownOpen(true)}
                    className="h-14 rounded-2xl border-muted focus-visible:ring-pink-500 px-5 pr-12 font-medium"
                    required
                  />
                  <Search className={cn(
                    "absolute right-5 top-1/2 -translate-y-1/2 h-5 w-5 transition-colors",
                    isClientDropdownOpen ? "text-pink-500" : "text-muted-foreground"
                  )} />
                </div>

                {isClientDropdownOpen && clientSearch.length >= 2 && (
                  <div className="absolute z-50 w-full mt-2 bg-card border border-muted shadow-2xl rounded-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    <div className="max-h-[300px] overflow-y-auto p-2">
                      {filteredClients.length > 0 ? (
                        filteredClients.map((client, index) => (
                          <div 
                            key={index}
                            onClick={() => {
                              setFormData(prev => ({ ...prev, clientName: client.name }));
                              setClientSearch(client.name);
                              setIsClientDropdownOpen(false);
                            }}
                            className="flex items-center justify-between p-4 rounded-xl hover:bg-pink-50 cursor-pointer transition-colors group"
                          >
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-full bg-pink-500/10 flex items-center justify-center group-hover:bg-pink-500 transition-colors">
                                <User2 className="h-5 w-5 text-pink-500 group-hover:text-white" />
                              </div>
                              <div className="flex flex-col">
                                <span className="font-bold text-foreground">
                                  {client.company ? `${client.company} (${client.name})` : client.name}
                                </span>
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] text-muted-foreground uppercase tracking-widest">{client.type}</span>
                                  <span className="text-[10px] text-pink-500 font-bold">{client.phone}</span>
                                </div>
                              </div>
                            </div>
                            <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 h-8 rounded-lg text-pink-600 font-bold text-[10px] uppercase">
                              Pilih
                            </Button>
                          </div>
                        ))
                      ) : (
                        <div className="p-8 text-center space-y-3">
                          <div className="h-12 w-12 rounded-full bg-muted/20 flex items-center justify-center mx-auto">
                            <Search className="h-6 w-6 text-muted-foreground/50" />
                          </div>
                          <p className="text-sm text-muted-foreground font-medium">Client tidak ditemukan</p>
                          <Link href="/dashboard/clients/new">
                            <Button variant="outline" size="sm" className="rounded-xl border-pink-200 text-pink-600 hover:bg-pink-50">
                              Tambah Client Baru
                            </Button>
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                <p className="text-[11px] text-muted-foreground mt-1 px-1 italic">*Jika client belum terdaftar, silahkan tambah di menu Data Client terlebih dahulu.</p>
              </div>

              {(jobCategory === "Badan Hukum/Usaha" || jobCategory === "Non Badan Hukum") && (
                <div className="md:col-span-2 space-y-6 pt-4">
                  <div className="flex items-center justify-between border-b border-muted/20 pb-2">
                    <div className="flex items-center gap-2">
                      <User2 className="h-5 w-5 text-pink-500" />
                      <Label className="text-base font-bold text-foreground">Informasi Pendiri</Label>
                    </div>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      onClick={addPendiriRow}
                      className="rounded-xl border-pink-200 text-pink-600 hover:bg-pink-50 gap-2 font-bold"
                    >
                      <Plus className="h-4 w-4" />
                      Tambah Pendiri
                    </Button>
                  </div>
                  
                  <div className="space-y-6">
                    {pendiri.map((p, index) => (
                      <div key={p.id} className="p-6 rounded-[2rem] border border-muted/50 bg-muted/5 relative animate-in fade-in slide-in-from-right-2 duration-300">
                        <div className="absolute -top-3 left-6 px-3 py-0.5 bg-pink-500 text-white text-[10px] font-bold rounded-full uppercase">
                          Pendiri #{index + 1}
                        </div>
                        
                        {pendiri.length > 1 && (
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="icon"
                            onClick={() => removePendiriRow(p.id)}
                            className="absolute top-4 right-4 h-8 w-8 text-muted-foreground hover:text-rose-500 hover:bg-rose-50 rounded-full"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}

                        <div className="grid md:grid-cols-3 gap-6 pt-2">
                          <div className="space-y-2">
                            <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Nama Pendiri</Label>
                            <Input 
                              placeholder="Nama lengkap..."
                              value={p.nama}
                              onChange={(e) => updatePendiriRow(p.id, 'nama', e.target.value)}
                              className="h-12 rounded-xl border-muted focus-visible:ring-pink-500 px-4"
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">No HP</Label>
                            <Input 
                              placeholder="0812..."
                              value={p.hp}
                              onChange={(e) => updatePendiriRow(p.id, 'hp', e.target.value)}
                              className="h-12 rounded-xl border-muted focus-visible:ring-pink-500 px-4"
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Email</Label>
                            <Input 
                              type="email"
                              placeholder="email@..."
                              value={p.email}
                              onChange={(e) => updatePendiriRow(p.id, 'email', e.target.value)}
                              className="h-12 rounded-xl border-muted focus-visible:ring-pink-500 px-4"
                              required
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="jenisPekerjaan" className="text-sm font-bold text-muted-foreground">Jenis Pekerjaan</Label>
                <select 
                  id="jenisPekerjaan"
                  className="flex h-14 w-full rounded-2xl border border-muted bg-background px-5 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-pink-500 transition-all cursor-pointer appearance-none font-medium"
                  required
                  value={formData.jenisPekerjaan}
                  onChange={(e) => setFormData(prev => ({ ...prev, jenisPekerjaan: e.target.value, pengurusanUntuk: "" }))}
                >
                  <option value="">Pilih Jenis Pekerjaan</option>
                  {jobCategory === "Badan Hukum/Usaha" ? (
                    <>
                      <option value="PT / PMA">PT / PMA</option>
                      <option value="CV">CV</option>
                      <option value="Koperasi">Koperasi</option>
                      <option value="Yayasan">Yayasan</option>
                      <option value="Perkumpulan">Perkumpulan</option>
                      <option value="Persekutuan Perdata">Persekutuan Perdata</option>
                      <option value="Persekutuan Firma">Persekutuan Firma</option>
                    </>
                  ) : jobCategory === "PPAT" ? (
                    <>
                      <option value="Akta Jual Beli">Akta Jual Beli</option>
                      <option value="Hibah">Hibah</option>
                      <option value="Inbreng">Inbreng</option>
                      <option value="APHT">APHT</option>
                      <option value="APHB">APHB</option>
                      <option value="ROYA">ROYA</option>
                      <option value="Balik Nama Waris">Balik Nama Waris</option>
                      <option value="Pemecahan Sertifikat">Pemecahan Sertifikat</option>
                      <option value="Akta Tukar Menukar">Akta Tukar Menukar</option>
                      <option value="Balik nama Lelang">Balik nama Lelang</option>
                      <option value="Pengukuran Tanah">Pengukuran Tanah</option>
                      <option value="Cek Sertifikat / SKPT">Cek Sertifikat / SKPT</option>
                      <option value="Perpanjangan Sertifikat">Perpanjangan Sertifikat</option>
                      <option value="Konversi Tanah">Konversi Tanah</option>
                      <option value="Permohonan Hak Baru">Permohonan Hak Baru</option>
                      <option value="Dan Lain-Lain">Dan Lain-Lain</option>
                    </>
                  ) : jobCategory === "Non Badan Hukum" ? (
                    <>
                      <option value="Akta Sewa Menyewa">Akta Sewa Menyewa</option>
                      <option value="Akta Perjanjian Kawin">Akta Perjanjian Kawin</option>
                      <option value="Akta Pembagian Hak Waris">Akta Pembagian Hak Waris</option>
                      <option value="Akta Surat Keterangan Waris">Akta Surat Keterangan Waris</option>
                      <option value="Akta Kuasa">Akta Kuasa</option>
                      <option value="Akta Pernyataan">Akta Pernyataan</option>
                      <option value="Akta Wasiat">Akta Wasiat</option>
                      <option value="Akta PPJB">Akta PPJB</option>
                      <option value="Perjanjian Kerjasama">Perjanjian Kerjasama</option>
                      <option value="Akta Fidusia">Akta Fidusia</option>
                      <option value="SKMHT">SKMHT</option>
                      <option value="Akta Kredit">Akta Kredit</option>
                      <option value="Akta Perdamaian">Akta Perdamaian</option>
                      <option value="Akta Cessie">Akta Cessie</option>
                      <option value="Akta Subrogasi">Akta Subrogasi</option>
                      <option value="Waarmerking">Waarmerking</option>
                      <option value="Legalisasi">Legalisasi</option>
                      <option value="Legalisir">Legalisir</option>
                      <option value="Dan Lain-Lain">Dan Lain-Lain</option>
                    </>
                  ) : (
                    <>
                      <option value="Legalisasi">Legalisasi</option>
                      <option value="Waarmerking">Waarmerking</option>
                      <option value="Pencocokan Fotokopi">Pencocokan Fotokopi</option>
                      <option value="Kuasa">Kuasa</option>
                    </>
                  )}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="deadline" className="text-sm font-bold text-muted-foreground">Deadline (Hari)</Label>
                <div className="relative">
                  <Input 
                    id="deadline" 
                    type="number" 
                    placeholder="Contoh: 14"
                    className="h-14 rounded-2xl border-muted focus-visible:ring-pink-500 px-5" 
                    required 
                    onChange={(e) => setFormData(prev => ({ ...prev, deadlineDays: e.target.value }))}
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    <span className="text-xs font-bold text-muted-foreground uppercase">Hari</span>
                    <Clock className="h-5 w-5 text-muted-foreground" />
                  </div>
                </div>
              </div>

              {formData.jenisPekerjaan === "Dan Lain-Lain" && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300 md:col-span-2">
                  <Label htmlFor="jenisPekerjaanLainnya" className="text-sm font-bold text-muted-foreground">Keterangan Jenis Pekerjaan</Label>
                  <Input 
                    id="jenisPekerjaanLainnya" 
                    placeholder="Masukkan detail jenis pekerjaan..."
                    value={formData.jenisPekerjaanLainnya}
                    onChange={(e) => setFormData(prev => ({ ...prev, jenisPekerjaanLainnya: e.target.value }))}
                    className="h-14 rounded-2xl border-muted focus-visible:ring-pink-500 px-5" 
                    required 
                  />
                </div>
              )}

              {jobCategory === "Badan Hukum/Usaha" && formData.jenisPekerjaan && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300 md:col-span-2">
                  <Label htmlFor="pengurusanUntuk" className="text-sm font-bold text-muted-foreground">Pengurusan Untuk</Label>
                  <select 
                    id="pengurusanUntuk"
                    className="flex h-14 w-full rounded-2xl border border-muted bg-background px-5 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-pink-500 transition-all cursor-pointer appearance-none font-medium"
                    required
                    value={formData.pengurusanUntuk}
                    onChange={(e) => setFormData(prev => ({ ...prev, pengurusanUntuk: e.target.value }))}
                  >
                    <option value="">Pilih Pengurusan Untuk</option>
                    <option value="Pendirian">Pendirian</option>
                    <option value="Perubahan">Perubahan</option>
                    <option value="Pembubaran">Pembubaran</option>
                    {formData.jenisPekerjaan === "PT / PMA" && (
                      <option value="Peningkatan PT Perorangan">Peningkatan PT Perorangan</option>
                    )}
                  </select>
                </div>
              )}

              {/* Multi Upload Dokumen */}
              <div className="md:col-span-2 space-y-4 pt-4">
                <div className="flex items-center justify-between border-b border-muted/20 pb-2">
                  <div className="flex items-center gap-2">
                    <FilePlus2 className="h-5 w-5 text-pink-500" />
                    <Label className="text-base font-bold text-foreground">Dokumen Pendukung</Label>
                  </div>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={addDocumentRow}
                    className="rounded-xl border-pink-200 text-pink-600 hover:bg-pink-50 gap-2 font-bold"
                  >
                    <Plus className="h-4 w-4" />
                    Tambah Dokumen
                  </Button>
                </div>

                <div className="space-y-4">
                  {documents.map((doc, index) => (
                    <div key={doc.id} className="grid md:grid-cols-12 gap-4 items-end animate-in fade-in slide-in-from-left-2 duration-300">
                      <div className="md:col-span-5 space-y-2">
                        <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">File Dokumen</Label>
                        <div className="relative group">
                          <input
                            type="file"
                            onChange={(e) => updateDocumentRow(doc.id, 'file', e.target.files?.[0] || null)}
                            className="hidden"
                            id={`file-${doc.id}`}
                          />
                          <label
                            htmlFor={`file-${doc.id}`}
                            className={cn(
                              "flex items-center h-14 w-full rounded-2xl border-2 border-dashed px-5 gap-3 cursor-pointer transition-all",
                              doc.file 
                                ? "border-emerald-500 bg-emerald-500/5 text-emerald-700" 
                                : "border-muted group-hover:border-pink-500 bg-muted/10 text-muted-foreground group-hover:text-pink-600"
                            )}
                          >
                            <FilePlus2 className={cn("h-5 w-5", doc.file ? "text-emerald-500" : "text-muted-foreground")} />
                            <span className="text-sm font-medium truncate">
                              {doc.file ? doc.file.name : "Pilih atau Seret File..."}
                            </span>
                          </label>
                        </div>
                      </div>
                      <div className="md:col-span-6 space-y-2">
                        <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Keterangan Dokumen</Label>
                        <Input 
                          placeholder="Contoh: Fotokopi KTP, Sertifikat Asli, dll"
                          value={doc.description}
                          onChange={(e) => updateDocumentRow(doc.id, 'description', e.target.value)}
                          className="h-14 rounded-2xl border-muted focus-visible:ring-pink-500 px-5"
                        />
                      </div>
                      <div className="md:col-span-1">
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="icon"
                          disabled={documents.length === 1}
                          onClick={() => removeDocumentRow(doc.id)}
                          className="h-14 w-14 rounded-2xl text-muted-foreground hover:text-rose-500 hover:bg-rose-50 transition-all"
                        >
                          <Trash2 className="h-5 w-5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-4 pt-10 border-t border-muted/5">
              <Button 
                variant="ghost" 
                type="button" 
                className="h-14 px-10 rounded-2xl gap-2 font-bold hover:bg-pink-50 hover:text-pink-600 transition-all text-muted-foreground"
                onClick={() => setStep("selection")}
              >
                <X className="h-5 w-5" />
                Batal
              </Button>
              <Button type="submit" className="h-14 px-12 rounded-2xl gap-2 font-bold shadow-xl shadow-pink-500/20 bg-pink-500 hover:bg-pink-600 transition-all scale-100 hover:scale-[1.02] active:scale-95">
                <Save className="h-5 w-5" />
                Registrasi Berkas
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
