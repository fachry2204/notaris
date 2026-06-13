"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/actions/clients";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  ArrowLeft, 
  Save, 
  X, 
  User, 
  Building2, 
  ArrowRight,
  UserPlus,
  Check
} from "lucide-react";
import Link from "next/link";
import axios from "axios";

interface Region {
  id: string;
  name: string;
}

// Common countries fallback
const FALLBACK_COUNTRIES = [
  { code: "ID", name: "Indonesia" },
  { code: "MY", name: "Malaysia" },
  { code: "SG", name: "Singapore" },
  { code: "AU", name: "Australia" },
  { code: "US", name: "United States" },
  { code: "GB", name: "United Kingdom" },
  { code: "JP", name: "Japan" },
  { code: "CN", name: "China" },
];

type Step = "selection" | "form";

export default function NewClientPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("selection");
  const [clientType, setClientType] = useState<string>("individual");
  
  const [formData, setFormData] = useState({
    name: "",
    birthday: "",
    address: "",
    phone: "",
    email: "",
    companyName: "",
    picName: "",
    gender: "",
    citizenship: "WNI",
  });

  // Geographic States
  const [countries, setCountries] = useState<any[]>(FALLBACK_COUNTRIES);
  const [selectedCountry, setSelectedCountry] = useState<string>("ID");
  const [provinces, setProvinces] = useState<Region[]>([]);
  const [cities, setCities] = useState<Region[]>([]);
  const [districts, setDistricts] = useState<Region[]>([]);
  const [villages, setVillages] = useState<Region[]>([]);

  const [loading, setLoading] = useState({
    countries: false,
    provinces: false,
    cities: false,
    districts: false,
    villages: false
  });

  const [selectedIds, setSelectedIds] = useState({
    province: "",
    city: "",
    district: "",
    village: ""
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch Countries with fallback
  useEffect(() => {
    const fetchCountries = async () => {
      try {
        setLoading(prev => ({ ...prev, countries: true }));
        const res = await axios.get("https://restcountries.com/v3.1/all?fields=name,cca2");
        const mapped = res.data.map((c: any) => ({
          code: c.cca2,
          name: c.name.common
        })).sort((a: any, b: any) => a.name.localeCompare(b.name));
        
        if (!mapped.find((c: any) => c.code === "ID")) {
          mapped.unshift({ code: "ID", name: "Indonesia" });
        }
        setCountries(mapped);
      } catch (err) {
        console.error("Error fetching countries:", err);
        setCountries(FALLBACK_COUNTRIES);
      } finally {
        setLoading(prev => ({ ...prev, countries: false }));
      }
    };
    fetchCountries();
  }, []);

  // Fetch Provinces if Indonesia is selected
  useEffect(() => {
    if (selectedCountry === "ID") {
      const fetchProvinces = async () => {
        try {
          setLoading(prev => ({ ...prev, provinces: true }));
          const res = await axios.get("https://www.emsifa.com/api-wilayah-indonesia/api/provinces.json");
          setProvinces(res.data);
        } catch (err) {
          console.error("Error fetching provinces:", err);
        } finally {
          setLoading(prev => ({ ...prev, provinces: false }));
        }
      };
      fetchProvinces();
    }
  }, [selectedCountry]);

  const handleProvinceChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setSelectedIds({ province: id, city: "", district: "", village: "" });
    setCities([]);
    setDistricts([]);
    setVillages([]);
    if (!id) return;
    try {
      setLoading(prev => ({ ...prev, cities: true }));
      const res = await axios.get(`https://www.emsifa.com/api-wilayah-indonesia/api/regencies/${id}.json`);
      setCities(res.data);
    } catch (err) {
      console.error("Error fetching cities:", err);
    } finally {
      setLoading(prev => ({ ...prev, cities: false }));
    }
  };

  const handleCityChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setSelectedIds(prev => ({ ...prev, city: id, district: "", village: "" }));
    setDistricts([]);
    setVillages([]);
    if (!id) return;
    try {
      setLoading(prev => ({ ...prev, districts: true }));
      const res = await axios.get(`https://www.emsifa.com/api-wilayah-indonesia/api/districts/${id}.json`);
      setDistricts(res.data);
    } catch (err) {
      console.error("Error fetching districts:", err);
    } finally {
      setLoading(prev => ({ ...prev, districts: false }));
    }
  };

  const handleDistrictChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setSelectedIds(prev => ({ ...prev, district: id, village: "" }));
    setVillages([]);
    if (!id) return;
    try {
      setLoading(prev => ({ ...prev, villages: true }));
      const res = await axios.get(`https://www.emsifa.com/api-wilayah-indonesia/api/villages/${id}.json`);
      setVillages(res.data);
    } catch (err) {
      console.error("Error fetching villages:", err);
    } finally {
      setLoading(prev => ({ ...prev, villages: false }));
    }
  };

  const handleVillageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedIds(prev => ({ ...prev, village: e.target.value }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const getName = (list: any[], id: string) => list.find(i => i.id === id)?.name || null;

    const clientData = {
      name: clientType === "individual" ? formData.name : formData.companyName,
      email: formData.email,
      phone: formData.phone,
      address: formData.address,
      birthday: formData.birthday || null,
      type: clientType,
      gender: formData.gender || null,
      citizenship: formData.citizenship,
      picName: formData.picName || null,
      country: selectedCountry,
      province: selectedCountry === "ID" ? getName(provinces, selectedIds.province) : (document.getElementById("province_manual") as HTMLInputElement)?.value,
      city: selectedCountry === "ID" ? getName(cities, selectedIds.city) : (document.getElementById("city_manual") as HTMLInputElement)?.value,
      district: selectedCountry === "ID" ? getName(districts, selectedIds.district) : null,
      village: selectedCountry === "ID" ? getName(villages, selectedIds.village) : null,
    };

    const result = await createClient(clientData);
    if (result.success) {
      toast.success("Client berhasil ditambahkan");
      router.push("/dashboard/clients");
    } else {
      toast.error(result.error);
    }
    setIsSubmitting(false);
  };

  if (step === "selection") {
    return (
      <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700 pt-10">
        <div className="text-center space-y-2">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-pink-500/10 mb-2 shadow-inner">
            <UserPlus className="h-7 w-7 text-pink-500" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-foreground">Tambah Client Baru</h1>
          <p className="text-muted-foreground text-xs max-w-xs mx-auto font-medium leading-relaxed">Silakan pilih kategori client yang ingin Anda daftarkan.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-4 px-4">
          <button 
            onClick={() => { setClientType("individual"); setStep("form"); }}
            className="group relative flex flex-col items-center p-6 rounded-3xl border-2 border-muted/20 bg-card hover:border-pink-500/50 hover:bg-pink-500/[0.02] hover:shadow-xl hover:shadow-pink-500/5 transition-all duration-500 text-center"
          >
            <div className="h-16 w-16 rounded-2xl bg-pink-500/10 flex items-center justify-center text-pink-500 mb-4 group-hover:scale-110 transition-transform duration-500 group-hover:rotate-6">
              <User className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-black mb-1.5">Perorangan</h3>
            <p className="text-[10px] text-muted-foreground leading-normal mb-6 font-medium px-2">Data client untuk individu, warga negara pribadi, atau perseorangan.</p>
            <div className="mt-auto flex items-center gap-2 font-black text-[10px] text-pink-500 uppercase tracking-widest bg-pink-500/10 py-3 px-6 rounded-xl group-hover:bg-pink-500 group-hover:text-white transition-all duration-300 shadow-lg shadow-pink-500/5">
              Pilih Perorangan
              <ArrowRight className="h-4 w-4" />
            </div>
          </button>

          <button 
            onClick={() => { setClientType("corporate"); setStep("form"); }}
            className="group relative flex flex-col items-center p-6 rounded-3xl border-2 border-muted/20 bg-card hover:border-blue-500/50 hover:bg-blue-500/[0.02] hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-500 text-center"
          >
            <div className="h-16 w-16 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 mb-4 group-hover:scale-110 transition-transform duration-500 group-hover:-rotate-6">
              <Building2 className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-black mb-1.5">Badan Hukum</h3>
            <p className="text-[10px] text-muted-foreground leading-normal mb-6 font-medium px-2">Data client untuk perusahaan, yayasan, koperasi, atau instansi lainnya.</p>
            <div className="mt-auto flex items-center gap-2 font-black text-[10px] text-blue-500 uppercase tracking-widest bg-blue-500/10 py-3 px-6 rounded-xl group-hover:bg-blue-500 group-hover:text-white transition-all duration-300 shadow-lg shadow-blue-500/5">
              Pilih Badan Hukum
              <ArrowRight className="h-4 w-4" />
            </div>
          </button>
        </div>
        
        <div className="text-center pt-4">
          <Link href="/dashboard/clients">
            <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground font-bold text-[10px] uppercase tracking-widest">
              <ArrowLeft className="h-3 w-3" />
              Kembali ke Daftar Client
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const isIndividual = clientType === "individual";

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-right-4 duration-500 pb-20 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            className="rounded-full hover:bg-pink-500/10 hover:text-pink-500 transition-colors h-12 w-12"
            onClick={() => setStep("selection")}
          >
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-foreground">
              Tambah Client {isIndividual ? "Perorangan" : "Badan Hukum"}
            </h1>
            <p className="text-sm text-muted-foreground font-medium">Lengkapi formulir di bawah untuk mendaftarkan client baru.</p>
          </div>
        </div>
      </div>

      <Card className="border-none shadow-2xl rounded-[2.5rem] bg-card overflow-hidden">
        <CardHeader className={`border-b px-8 py-6 ${isIndividual ? "bg-pink-500/5" : "bg-blue-500/5"}`}>
          <div className="flex items-center gap-4">
            <div className={`h-12 w-12 rounded-2xl flex items-center justify-center shadow-lg ${isIndividual ? "bg-pink-500 text-white shadow-pink-500/20" : "bg-blue-500 text-white shadow-blue-500/20"}`}>
              {isIndividual ? <User className="h-7 w-7" /> : <Building2 className="h-7 w-7" />}
            </div>
            <div>
              <CardTitle className="text-xl font-bold">Formulir Data {isIndividual ? "Perorangan" : "Badan Hukum"}</CardTitle>
              <CardDescription className="font-medium">Pastikan seluruh informasi sesuai dengan dokumen identitas asli.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid gap-x-8 gap-y-6 md:grid-cols-2">
              {isIndividual ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="name" className="font-bold text-xs uppercase tracking-widest text-muted-foreground ml-1">Nama Lengkap</Label>
                    <Input id="name" placeholder="Masukkan nama lengkap" className="h-12 rounded-xl border-muted-foreground/20 focus-visible:ring-pink-500 font-bold" required value={formData.name} onChange={handleInputChange} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="birthday" className="font-bold text-xs uppercase tracking-widest text-muted-foreground ml-1">Tanggal Lahir</Label>
                    <Input id="birthday" type="date" className="h-12 rounded-xl border-muted-foreground/20 font-bold" required value={formData.birthday} onChange={handleInputChange} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gender" className="font-bold text-xs uppercase tracking-widest text-muted-foreground ml-1">Jenis Kelamin</Label>
                    <select 
                      id="gender" 
                      value={formData.gender}
                      onChange={handleInputChange}
                      className="flex h-12 w-full rounded-xl border border-muted-foreground/20 bg-background px-4 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-pink-500 transition-all cursor-pointer font-bold shadow-sm"
                    >
                      <option value="">Pilih jenis kelamin</option>
                      <option value="Laki-laki">Laki-laki</option>
                      <option value="Perempuan">Perempuan</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="citizenship" className="font-bold text-xs uppercase tracking-widest text-muted-foreground ml-1">Status Kewarganegaraan</Label>
                    <select 
                      id="citizenship" 
                      value={formData.citizenship}
                      onChange={handleInputChange}
                      className="flex h-12 w-full rounded-xl border border-muted-foreground/20 bg-background px-4 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-pink-500 transition-all cursor-pointer font-bold shadow-sm"
                    >
                      <option value="WNI">Warga Negara Indonesia (WNI)</option>
                      <option value="WNA">Warga Negara Asing (WNA)</option>
                    </select>
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="companyName" className="font-bold text-xs uppercase tracking-widest text-muted-foreground ml-1">Nama Badan Hukum / Usaha</Label>
                    <Input id="companyName" placeholder="Contoh: PT Maju Jaya Sejahtera" className="h-12 rounded-xl border-muted-foreground/20 focus-visible:ring-blue-500 font-bold text-lg" required value={formData.companyName} onChange={handleInputChange} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="birthday" className="font-bold text-xs uppercase tracking-widest text-muted-foreground ml-1">Tanggal Lahir Client</Label>
                    <Input id="birthday" type="date" className="h-12 rounded-xl border-muted-foreground/20 font-bold" required value={formData.birthday} onChange={handleInputChange} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="picName" className="font-bold text-xs uppercase tracking-widest text-muted-foreground ml-1">Nama PIC (Person In Charge)</Label>
                    <Input id="picName" placeholder="Masukkan nama penanggung jawab" className="h-12 rounded-xl border-muted-foreground/20 font-bold" required value={formData.picName} onChange={handleInputChange} />
                  </div>
                </>
              )}

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="address" className="font-bold text-xs uppercase tracking-widest text-muted-foreground ml-1">{isIndividual ? "Alamat" : "Alamat Usaha"}</Label>
                <Input id="address" placeholder="Jalan, No Rumah / Gedung, RT/RW" className="h-12 rounded-xl border-muted-foreground/20 font-bold" required value={formData.address} onChange={handleInputChange} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="country" className="font-bold text-xs uppercase tracking-widest text-muted-foreground ml-1">Negara</Label>
                <select 
                  id="country" 
                  value={selectedCountry}
                  onChange={(e) => setSelectedCountry(e.target.value)}
                  className={`flex h-12 w-full rounded-xl border border-muted-foreground/20 bg-background px-4 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 transition-all cursor-pointer font-bold shadow-sm ${isIndividual ? "focus:ring-pink-500" : "focus:ring-blue-500"}`}
                >
                  {loading.countries && countries.length === FALLBACK_COUNTRIES.length ? (
                    <option>Memuat daftar negara...</option>
                  ) : (
                    countries.map(c => (
                      <option key={c.code} value={c.code}>{c.name}</option>
                    ))
                  )}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="province" className="font-bold text-xs uppercase tracking-widest text-muted-foreground ml-1">Provinsi</Label>
                {selectedCountry === "ID" ? (
                  <select 
                    id="province" 
                    value={selectedIds.province}
                    onChange={handleProvinceChange}
                    className={`flex h-12 w-full rounded-xl border border-muted-foreground/20 bg-background px-4 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 transition-all cursor-pointer font-bold shadow-sm ${isIndividual ? "focus:ring-pink-500" : "focus:ring-blue-500"}`}
                  >
                    <option value="">{loading.provinces ? "Memuat..." : "Pilih Provinsi"}</option>
                    {provinces.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                ) : (
                  <Input id="province_manual" placeholder="Masukkan provinsi" className="h-12 rounded-xl border-muted-foreground/20 font-bold" />
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="city" className="font-bold text-xs uppercase tracking-widest text-muted-foreground ml-1">Kota / Kabupaten</Label>
                {selectedCountry === "ID" ? (
                  <select 
                    id="city" 
                    value={selectedIds.city}
                    onChange={handleCityChange}
                    className={`flex h-12 w-full rounded-xl border border-muted-foreground/20 bg-background px-4 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 transition-all cursor-pointer font-bold shadow-sm ${isIndividual ? "focus:ring-pink-500" : "focus:ring-blue-500"}`}
                    disabled={!selectedIds.province}
                  >
                    <option value="">{loading.cities ? "Memuat..." : "Pilih Kota"}</option>
                    {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                ) : (
                  <Input id="city_manual" placeholder="Masukkan kota" className="h-12 rounded-xl border-muted-foreground/20 font-bold" />
                )}
              </div>

              {selectedCountry === "ID" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="district" className="font-bold text-xs uppercase tracking-widest text-muted-foreground ml-1">Kecamatan</Label>
                    <select 
                      id="district" 
                      value={selectedIds.district}
                      onChange={handleDistrictChange}
                      className={`flex h-12 w-full rounded-xl border border-muted-foreground/20 bg-background px-4 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 transition-all cursor-pointer font-bold shadow-sm ${isIndividual ? "focus:ring-pink-500" : "focus:ring-blue-500"}`}
                      disabled={!selectedIds.city}
                    >
                      <option value="">{loading.districts ? "Memuat..." : "Pilih Kecamatan"}</option>
                      {districts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="village" className="font-bold text-xs uppercase tracking-widest text-muted-foreground ml-1">Kelurahan</Label>
                    <select 
                      id="village" 
                      value={selectedIds.village}
                      onChange={handleVillageChange}
                      className={`flex h-12 w-full rounded-xl border border-muted-foreground/20 bg-background px-4 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 transition-all cursor-pointer font-bold shadow-sm ${isIndividual ? "focus:ring-pink-500" : "focus:ring-blue-500"}`}
                      disabled={!selectedIds.district}
                    >
                      <option value="">{loading.villages ? "Memuat..." : "Pilih Kelurahan"}</option>
                      {villages.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                    </select>
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="phone" className="font-bold text-xs uppercase tracking-widest text-muted-foreground ml-1">No Handphone</Label>
                <Input id="phone" placeholder="62812xxxx" className="h-12 rounded-xl border-muted-foreground/20 font-bold" required value={formData.phone} onChange={handleInputChange} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="font-bold text-xs uppercase tracking-widest text-muted-foreground ml-1">Email</Label>
                <Input id="email" type="email" placeholder="contoh@mail.com" className="h-12 rounded-xl border-muted-foreground/20 font-bold" required value={formData.email} onChange={handleInputChange} />
              </div>
            </div>

            <div className="flex items-center justify-end gap-4 pt-8 border-t mt-4">
              <Button 
                variant="ghost" 
                type="button" 
                className="h-14 px-8 rounded-2xl font-bold text-muted-foreground hover:bg-muted/50 transition-all"
                onClick={() => setStep("selection")}
              >
                <X className="h-5 w-5" />
                Ganti Tipe
              </Button>
              <Button type="submit" disabled={isSubmitting} className={`h-14 px-12 rounded-2xl gap-3 font-black text-lg shadow-2xl transition-all active:scale-95 ${isIndividual ? "shadow-pink-500/30 bg-pink-500 hover:bg-pink-600 text-white" : "shadow-blue-500/30 bg-blue-500 hover:bg-blue-600 text-white"}`}>
                <Check className="h-6 w-6" />
                {isSubmitting ? "Menyimpan..." : "Simpan Client Baru"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
