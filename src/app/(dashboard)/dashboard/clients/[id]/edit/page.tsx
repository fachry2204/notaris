"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { getClientById, updateClient } from "@/lib/actions/clients";
import { formatClientId } from "@/lib/utils/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Save, X, User, Building2 } from "lucide-react";
import Link from "next/link";
import axios from "axios";

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

export default function EditClientPage() {
  const router = useRouter();
  const { id } = useParams() as { id: string };
  
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [clientType, setClientType] = useState<"individual" | "corporate">("individual");
  
  const [countries, setCountries] = useState<any[]>(FALLBACK_COUNTRIES);
  const [provinces, setProvinces] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [villages, setVillages] = useState<any[]>([]);
  
  const [selectedCountry, setSelectedCountry] = useState("ID");
  const [selectedIds, setSelectedIds] = useState({
    province: "",
    city: "",
    district: "",
    village: ""
  });

  const [originalData, setOriginalData] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    companyName: "",
    picName: "",
    email: "",
    phone: "",
    address: "",
    birthday: "",
    gender: "",
    citizenship: "WNI",
  });

  const [loadingRegions, setLoadingRegions] = useState({
    countries: false,
    provinces: false,
    cities: false,
    districts: false,
    villages: false
  });

  // Fetch initial client data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await getClientById(id);
        if (res.success && res.data) {
          const client = res.data;
          setOriginalData(client);
          setClientType(client.type === "corporate" ? "corporate" : "individual");
          setFormData({
            name: client.name || "",
            companyName: client.type === "corporate" ? client.name : "",
            picName: client.picName || "",
            email: client.email || "",
            phone: client.phone || "",
            address: client.address || "",
            birthday: client.birthday ? new Date(client.birthday).toISOString().split('T')[0] : "",
            gender: client.gender || "",
            citizenship: client.citizenship || "WNI",
          });
          
          // Handle country code vs name
          let countryVal = client.country || "ID";
          // If it's a name like "Indonesia", try to map it back to "ID"
          if (countryVal === "Indonesia") countryVal = "ID";
          setSelectedCountry(countryVal);
        } else {
          toast.error("Gagal mengambil data client");
          router.push("/dashboard/clients");
        }
      } catch (err) {
        console.error("Error fetching client data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, router]);

  // Fetch Countries
  useEffect(() => {
    const fetchCountries = async () => {
      try {
        setLoadingRegions(prev => ({ ...prev, countries: true }));
        const res = await axios.get("https://restcountries.com/v3.1/all?fields=name,cca2");
        const mapped = res.data.map((c: any) => ({
          code: c.cca2,
          name: c.name.common
        })).sort((a: any, b: any) => a.name.localeCompare(b.name));
        
        // Ensure Indonesia is first or exists
        if (!mapped.find((c: any) => c.code === "ID")) {
          mapped.unshift({ code: "ID", name: "Indonesia" });
        }
        setCountries(mapped);
      } catch (err) {
        console.error("Error fetching countries, using fallback:", err);
        setCountries(FALLBACK_COUNTRIES);
      } finally {
        setLoadingRegions(prev => ({ ...prev, countries: false }));
      }
    };
    fetchCountries();
  }, []);

  // Sync Regions (Map names to IDs)
  const syncRegions = useCallback(async (client: any) => {
    if (!client.province || (client.country !== "ID" && client.country !== "Indonesia" && client.country !== "")) return;
    
    try {
      setLoadingRegions(prev => ({ ...prev, provinces: true }));
      const provRes = await axios.get("https://www.emsifa.com/api-wilayah-indonesia/api/provinces.json");
      const fetchedProvinces = provRes.data;
      setProvinces(fetchedProvinces);

      const province = fetchedProvinces.find((p: any) => p.name.toUpperCase() === client.province.toUpperCase());
      if (province) {
        const newIds = { province: province.id, city: "", district: "", village: "" };
        
        // Cities
        setLoadingRegions(prev => ({ ...prev, cities: true }));
        const cityRes = await axios.get(`https://www.emsifa.com/api-wilayah-indonesia/api/regencies/${province.id}.json`);
        const fetchedCities = cityRes.data;
        setCities(fetchedCities);

        const city = fetchedCities.find((c: any) => c.name.toUpperCase() === client.city.toUpperCase());
        if (city) {
          newIds.city = city.id;

          // Districts
          setLoadingRegions(prev => ({ ...prev, districts: true }));
          const distRes = await axios.get(`https://www.emsifa.com/api-wilayah-indonesia/api/districts/${city.id}.json`);
          const fetchedDistricts = distRes.data;
          setDistricts(fetchedDistricts);

          const district = fetchedDistricts.find((d: any) => d.name.toUpperCase() === client.district.toUpperCase());
          if (district) {
            newIds.district = district.id;

            // Villages
            setLoadingRegions(prev => ({ ...prev, villages: true }));
            const villRes = await axios.get(`https://www.emsifa.com/api-wilayah-indonesia/api/villages/${district.id}.json`);
            const fetchedVillages = villRes.data;
            setVillages(fetchedVillages);

            const village = fetchedVillages.find((v: any) => v.name.toUpperCase() === (client.village || "").toUpperCase());
            if (village) {
              newIds.village = village.id;
            }
          }
        }
        setSelectedIds(newIds);
      }
    } catch (err) {
      console.error("Error syncing regions:", err);
    } finally {
      setLoadingRegions({ 
        countries: false, 
        provinces: false, 
        cities: false, 
        districts: false, 
        villages: false 
      });
    }
  }, []);

  useEffect(() => {
    if (originalData) {
      syncRegions(originalData);
    }
  }, [originalData, syncRegions]);

  const handleProvinceChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setSelectedIds(prev => ({ ...prev, province: id, city: "", district: "", village: "" }));
    setCities([]);
    setDistricts([]);
    setVillages([]);
    if (!id) return;
    try {
      setLoadingRegions(prev => ({ ...prev, cities: true }));
      const res = await axios.get(`https://www.emsifa.com/api-wilayah-indonesia/api/regencies/${id}.json`);
      setCities(res.data);
    } catch (err) {
      console.error("Error fetching cities:", err);
    } finally {
      setLoadingRegions(prev => ({ ...prev, cities: false }));
    }
  };

  const handleCityChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setSelectedIds(prev => ({ ...prev, city: id, district: "", village: "" }));
    setDistricts([]);
    setVillages([]);
    if (!id) return;
    try {
      setLoadingRegions(prev => ({ ...prev, districts: true }));
      const res = await axios.get(`https://www.emsifa.com/api-wilayah-indonesia/api/districts/${id}.json`);
      setDistricts(res.data);
    } catch (err) {
      console.error("Error fetching districts:", err);
    } finally {
      setLoadingRegions(prev => ({ ...prev, districts: false }));
    }
  };

  const handleDistrictChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setSelectedIds(prev => ({ ...prev, district: id, village: "" }));
    setVillages([]);
    if (!id) return;
    try {
      setLoadingRegions(prev => ({ ...prev, villages: true }));
      const res = await axios.get(`https://www.emsifa.com/api-wilayah-indonesia/api/villages/${id}.json`);
      setVillages(res.data);
    } catch (err) {
      console.error("Error fetching villages:", err);
    } finally {
      setLoadingRegions(prev => ({ ...prev, villages: false }));
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
    
    const getName = (list: any[], id: string, fallback: string) => {
      if (!id) return fallback;
      const item = list.find(i => i.id === id);
      return item ? item.name : fallback;
    };

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
      province: selectedCountry === "ID" 
        ? getName(provinces, selectedIds.province, originalData?.province)
        : ((document.getElementById("province_manual") as HTMLInputElement)?.value || originalData?.province),
      city: selectedCountry === "ID" 
        ? getName(cities, selectedIds.city, originalData?.city)
        : ((document.getElementById("city_manual") as HTMLInputElement)?.value || originalData?.city),
      district: selectedCountry === "ID" 
        ? getName(districts, selectedIds.district, originalData?.district)
        : originalData?.district,
      village: selectedCountry === "ID" 
        ? getName(villages, selectedIds.village, originalData?.village)
        : originalData?.village,
    };

    const result = await updateClient(id, clientData);
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
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-pink-500 border-t-transparent shadow-xl"></div>
      </div>
    );
  }

  const isIndividual = clientType === "individual";

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/dashboard/clients/${id}`}>
            <Button variant="ghost" size="icon" className="rounded-full hover:bg-pink-500/10 hover:text-pink-500 transition-colors h-12 w-12">
              <ArrowLeft className="h-6 w-6" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-foreground">
              Edit Data {isIndividual ? "Perorangan" : "Badan Hukum"}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-muted-foreground font-medium">ID Client:</span>
              <span className="text-xs bg-pink-500/10 text-pink-500 px-2 py-0.5 rounded-lg border border-pink-500/20 font-black tracking-wider">
                {formatClientId(originalData?.indexNo)}
              </span>
            </div>
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
              <CardTitle className="text-xl font-bold">Profil {isIndividual ? "Pribadi" : "Instansi / Usaha"}</CardTitle>
              <CardDescription className="font-medium">Sesuaikan informasi identitas client di bawah ini.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="bg-muted/5 border border-muted-foreground/10 rounded-2xl p-6 mb-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">Kategori Client</Label>
                  <select 
                    value={clientType}
                    onChange={(e) => setClientType(e.target.value as any)}
                    className={`flex h-12 w-full rounded-xl border border-muted-foreground/20 bg-background px-4 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 transition-all cursor-pointer font-bold ${isIndividual ? "focus:ring-pink-500 text-pink-600 shadow-sm" : "focus:ring-blue-500 text-blue-600 shadow-sm"}`}
                  >
                    <option value="individual">PERORANGAN (INDIVIDU)</option>
                    <option value="corporate">BADAN HUKUM (PERUSAHAAN)</option>
                  </select>
                </div>
              </div>
            </div>

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
                  {loadingRegions.countries && countries.length === FALLBACK_COUNTRIES.length ? (
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
                    <option value="">{loadingRegions.provinces ? "Memuat..." : "Pilih Provinsi (Data: " + (originalData?.province || "Kosong") + ")"}</option>
                    {provinces.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                ) : (
                  <Input 
                    id="province_manual" 
                    placeholder="Masukkan provinsi" 
                    defaultValue={originalData?.province}
                    className="h-12 rounded-xl border-muted-foreground/20 font-bold" 
                  />
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
                    <option value="">{loadingRegions.cities ? "Memuat..." : "Pilih Kota (Data: " + (originalData?.city || "Kosong") + ")"}</option>
                    {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                ) : (
                  <Input 
                    id="city_manual" 
                    placeholder="Masukkan kota" 
                    defaultValue={originalData?.city}
                    className="h-12 rounded-xl border-muted-foreground/20 font-bold" 
                  />
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
                      <option value="">{loadingRegions.districts ? "Memuat..." : "Pilih Kecamatan (Data: " + (originalData?.district || "Kosong") + ")"}</option>
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
                      <option value="">{loadingRegions.villages ? "Memuat..." : "Pilih Kelurahan (Data: " + (originalData?.village || "Kosong") + ")"}</option>
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
              <Link href={`/dashboard/clients/${id}`}>
                <Button variant="ghost" type="button" className="h-14 px-8 rounded-2xl font-bold text-muted-foreground hover:bg-muted/50 transition-all">
                  <X className="h-5 w-5" />
                  Batal
                </Button>
              </Link>
              <Button type="submit" disabled={isSubmitting} className={`h-14 px-12 rounded-2xl gap-2 font-black text-lg shadow-2xl transition-all active:scale-95 ${isIndividual ? "shadow-pink-500/30 bg-pink-500 hover:bg-pink-600 text-white" : "shadow-blue-500/30 bg-blue-500 hover:bg-blue-600 text-white"}`}>
                <Save className="h-6 w-6" />
                {isSubmitting ? "Menyimpan..." : "Simpan Perubahan"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
