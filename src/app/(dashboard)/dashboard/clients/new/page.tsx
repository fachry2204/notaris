"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, UserPlus, Save, X, User, Building2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import axios from "axios";

interface Region {
  id: string;
  name: string;
}

interface Country {
  cca2: string;
  name: {
    common: string;
  };
}

export default function NewClientPage() {
  const router = useRouter();
  const [step, setStep] = React.useState<"selection" | "form">("selection");
  const [clientType, setClientType] = React.useState<string>("individual");
  
  // Geographic States
  const [countries, setCountries] = React.useState<Country[]>([]);
  const [selectedCountry, setSelectedCountry] = React.useState<string>("ID");
  const [provinces, setProvinces] = React.useState<Region[]>([]);
  const [cities, setCities] = React.useState<Region[]>([]);
  const [districts, setDistricts] = React.useState<Region[]>([]);
  const [villages, setVillages] = React.useState<Region[]>([]);

  const [loading, setLoading] = React.useState({
    countries: false,
    provinces: false,
    cities: false,
    districts: false,
    villages: false
  });

  const [selectedIds, setSelectedIds] = React.useState({
    province: "",
    city: "",
    district: "",
    village: ""
  });

  // Fetch Countries on Mount
  React.useEffect(() => {
    const fetchCountries = async () => {
      try {
        setLoading(prev => ({ ...prev, countries: true }));
        const res = await axios.get("https://restcountries.com/v3.1/all?fields=name,cca2");
        const sorted = res.data.sort((a: Country, b: Country) => a.name.common.localeCompare(b.name.common));
        setCountries(sorted);
      } catch (err) {
        console.error("Error fetching countries:", err);
      } finally {
        setLoading(prev => ({ ...prev, countries: false }));
      }
    };
    fetchCountries();
  }, []);

  // Fetch Provinces if Indonesia is selected
  React.useEffect(() => {
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
    } else {
      setProvinces([]);
      setCities([]);
      setDistricts([]);
      setVillages([]);
    }
  }, [selectedCountry]);

  // Fetch Cities when Province changes
  const handleProvinceChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setSelectedIds(prev => ({ ...prev, province: id, city: "", district: "", village: "" }));
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

  // Fetch Districts when City changes
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

  // Fetch Villages when District changes
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert("Fitur simpan sedang dalam pengembangan");
    router.push("/dashboard/clients");
  };

  if (step === "selection") {
    return (
      <div className="max-w-4xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700 py-12">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground">Tambah Client Baru</h1>
          <p className="text-lg text-muted-foreground">Pilih jenis identitas client yang ingin Anda daftarkan.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div 
            onClick={() => { setClientType("individual"); setStep("form"); }}
            className="group relative flex flex-col items-center justify-center p-12 rounded-[2rem] border-2 border-muted bg-card hover:border-pink-500 hover:shadow-2xl hover:shadow-pink-500/10 transition-all duration-500 cursor-pointer overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="h-10 w-10 rounded-full bg-pink-500 flex items-center justify-center shadow-lg shadow-pink-500/40">
                <ArrowLeft className="h-5 w-5 text-white rotate-180" />
              </div>
            </div>
            <div className="h-24 w-24 rounded-3xl bg-pink-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
              <User className="h-12 w-12 text-pink-500" />
            </div>
            <h2 className="text-2xl font-bold mb-3">Perorangan</h2>
            <p className="text-center text-muted-foreground leading-relaxed">
              Daftarkan client sebagai individu pribadi dengan identitas KTP/Paspor.
            </p>
          </div>

          <div 
            onClick={() => { setClientType("corporate"); setStep("form"); }}
            className="group relative flex flex-col items-center justify-center p-12 rounded-[2rem] border-2 border-muted bg-card hover:border-pink-500 hover:shadow-2xl hover:shadow-pink-500/10 transition-all duration-500 cursor-pointer overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="h-10 w-10 rounded-full bg-pink-500 flex items-center justify-center shadow-lg shadow-pink-500/40">
                <ArrowLeft className="h-5 w-5 text-white rotate-180" />
              </div>
            </div>
            <div className="h-24 w-24 rounded-3xl bg-pink-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
              <Building2 className="h-12 w-12 text-pink-500" />
            </div>
            <h2 className="text-2xl font-bold mb-3">Badan Hukum</h2>
            <p className="text-center text-muted-foreground leading-relaxed">
              Daftarkan perusahaan, PT, CV, atau badan usaha lainnya dengan data PIC.
            </p>
          </div>
        </div>

        <div className="flex justify-center pt-8">
          <Link href="/dashboard/clients">
            <Button variant="ghost" className="gap-2 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
              Kembali ke Daftar Client
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex items-center justify-between">
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
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Formulir Data Client</h1>
            <p className="text-sm text-muted-foreground">Tipe: <span className="font-bold text-pink-600">{clientType === "individual" ? "Perorangan" : "Badan Hukum"}</span></p>
          </div>
        </div>
      </div>



      <Card className="border-none shadow-sm rounded-2xl bg-card overflow-hidden">
        <CardHeader className="border-b bg-muted/5 px-8 py-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-pink-500/10 flex items-center justify-center">
              {clientType === "individual" ? <User className="h-6 w-6 text-pink-500" /> : <Building2 className="h-6 w-6 text-pink-500" />}
            </div>
            <div>
              <CardTitle>{clientType === "individual" ? "Data Perorangan" : "Data Badan Hukum / Usaha"}</CardTitle>
              <CardDescription>Lengkapi informasi identitas di bawah ini.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid gap-x-8 gap-y-6 md:grid-cols-2">
              {clientType === "individual" ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="name">Nama Lengkap</Label>
                    <Input id="name" placeholder="Masukkan nama lengkap" className="h-12 rounded-xl border-muted-foreground/20 focus-visible:ring-pink-500" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="birthday">Tanggal Lahir</Label>
                    <Input id="birthday" type="date" className="h-12 rounded-xl border-muted-foreground/20" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gender">Jenis Kelamin</Label>
                    <select id="gender" className="flex h-12 w-full rounded-xl border border-muted-foreground/20 bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-pink-500 transition-all cursor-pointer">
                      <option value="">Pilih jenis kelamin</option>
                      <option value="Laki-laki">Laki-laki</option>
                      <option value="Perempuan">Perempuan</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="citizenship">Status Kewarganegaraan</Label>
                    <select id="citizenship" className="flex h-12 w-full rounded-xl border border-muted-foreground/20 bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-pink-500 transition-all cursor-pointer">
                      <option value="WNI">Warga Negara Indonesia (WNI)</option>
                      <option value="WNA">Warga Negara Asing (WNA)</option>
                    </select>
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="companyName">Nama Badan Hukum / Usaha</Label>
                    <Input id="companyName" placeholder="Contoh: PT Maju Jaya Sejahtera" className="h-12 rounded-xl border-muted-foreground/20 focus-visible:ring-pink-500" required />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="picName">Nama PIC (Person In Charge)</Label>
                    <Input id="picName" placeholder="Masukkan nama penanggung jawab" className="h-12 rounded-xl border-muted-foreground/20" required />
                  </div>
                </>
              )}

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="address">{clientType === "individual" ? "Alamat" : "Alamat Usaha"}</Label>
                <Input id="address" placeholder="Jalan, No Rumah / Gedung, RT/RW" className="h-12 rounded-xl border-muted-foreground/20" required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="country">Negara</Label>
                <select 
                  id="country" 
                  value={selectedCountry}
                  onChange={(e) => setSelectedCountry(e.target.value)}
                  className="flex h-12 w-full rounded-xl border border-muted-foreground/20 bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-pink-500 transition-all cursor-pointer"
                >
                  {loading.countries ? (
                    <option>Memuat daftar negara...</option>
                  ) : (
                    countries.map(c => (
                      <option key={c.cca2} value={c.cca2}>{c.name.common}</option>
                    ))
                  )}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="province">Provinsi</Label>
                {selectedCountry === "ID" ? (
                  <select 
                    id="province" 
                    onChange={handleProvinceChange}
                    className="flex h-12 w-full rounded-xl border border-muted-foreground/20 bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-pink-500 transition-all cursor-pointer"
                    required
                  >
                    <option value="">{loading.provinces ? "Memuat..." : "Pilih Provinsi"}</option>
                    {provinces.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                ) : (
                  <Input id="province" placeholder="Masukkan provinsi" className="h-12 rounded-xl border-muted-foreground/20" required />
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">Kota / Kabupaten</Label>
                {selectedCountry === "ID" ? (
                  <select 
                    id="city" 
                    onChange={handleCityChange}
                    className="flex h-12 w-full rounded-xl border border-muted-foreground/20 bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-pink-500 transition-all cursor-pointer"
                    disabled={!selectedIds.province}
                    required
                  >
                    <option value="">{loading.cities ? "Memuat..." : "Pilih Kota"}</option>
                    {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                ) : (
                  <Input id="city" placeholder="Masukkan kota" className="h-12 rounded-xl border-muted-foreground/20" required />
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="district">Kecamatan</Label>
                {selectedCountry === "ID" ? (
                  <select 
                    id="district" 
                    onChange={handleDistrictChange}
                    className="flex h-12 w-full rounded-xl border border-muted-foreground/20 bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-pink-500 transition-all cursor-pointer"
                    disabled={!selectedIds.city}
                    required
                  >
                    <option value="">{loading.districts ? "Memuat..." : "Pilih Kecamatan"}</option>
                    {districts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                ) : (
                  <Input id="district" placeholder="Masukkan kecamatan" className="h-12 rounded-xl border-muted-foreground/20" required />
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="subdistrict">Kelurahan</Label>
                {selectedCountry === "ID" ? (
                  <select 
                    id="subdistrict" 
                    className="flex h-12 w-full rounded-xl border border-muted-foreground/20 bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-pink-500 transition-all cursor-pointer"
                    disabled={!selectedIds.district}
                    required
                  >
                    <option value="">{loading.villages ? "Memuat..." : "Pilih Kelurahan"}</option>
                    {villages.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                  </select>
                ) : (
                  <Input id="subdistrict" placeholder="Masukkan kelurahan" className="h-12 rounded-xl border-muted-foreground/20" required />
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">No Handphone</Label>
                <Input id="phone" placeholder="0812xxxx" className="h-12 rounded-xl border-muted-foreground/20" required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="contoh@mail.com" className="h-12 rounded-xl border-muted-foreground/20" required />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-8 border-t">
              <Button 
                variant="ghost" 
                type="button" 
                className="h-12 px-8 rounded-xl gap-2 font-bold hover:bg-pink-50 hover:text-pink-600 transition-all"
                onClick={() => setStep("selection")}
              >
                <X className="h-5 w-5" />
                Ganti Tipe
              </Button>
              <Button type="submit" className="h-12 px-10 rounded-xl gap-2 font-bold shadow-lg shadow-pink-500/20 bg-pink-500 hover:bg-pink-600 transition-all">
                <Save className="h-5 w-5" />
                Simpan Client
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
