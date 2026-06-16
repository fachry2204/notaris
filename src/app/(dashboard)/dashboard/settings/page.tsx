"use client";

import AdminList from "@/components/settings/AdminList";

import React, { useEffect, useState } from "react";
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent, 
  CardFooter 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Settings2, 
  ShieldCheck, 
  MessageSquare, 
  Save, 
  Smartphone, 
  Globe, 
  Building,
  Key,
  ShieldAlert,
  Zap,
  Info,
  Image,
  Upload,
  Loader2,
  UserCog,
  CreditCard
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type PermissionKey = "dashboard" | "client" | "berkas" | "finance" | "invoice" | "settings";

type RolePermissionMap = Record<PermissionKey, boolean>;

type AppRole = {
  id: string;
  key: string;
  name: string;
  color: string;
  systemRole: boolean;
  permissions: RolePermissionMap;
};

const permissionColumns: { key: PermissionKey; label: string }[] = [
  { key: "dashboard", label: "Dashboard" },
  { key: "client", label: "Client" },
  { key: "berkas", label: "Berkas" },
  { key: "finance", label: "Finance" },
  { key: "invoice", label: "Invoice" },
  { key: "settings", label: "Settings" },
];

const roleColorOptions = [
  { label: "Pink", value: "bg-pink-500" },
  { label: "Blue", value: "bg-blue-500" },
  { label: "Emerald", value: "bg-emerald-500" },
  { label: "Amber", value: "bg-amber-500" },
  { label: "Slate", value: "bg-slate-500" },
  { label: "Violet", value: "bg-violet-500" },
];

const emptyPermissions: RolePermissionMap = {
  dashboard: false,
  client: false,
  berkas: false,
  finance: false,
  invoice: false,
  settings: false,
};

function normalizeRolePermissions(role: AppRole): AppRole {
  return {
    ...role,
    permissions: {
      ...emptyPermissions,
      ...(role.permissions || {}),
    },
  };
}

const defaultRoles: AppRole[] = [
  {
    id: "ADMINISTRATOR",
    key: "ADMINISTRATOR",
    name: "Administrator",
    color: "bg-pink-500",
    systemRole: true,
    permissions: { dashboard: true, client: true, berkas: true, finance: true, invoice: true, settings: true },
  },
  {
    id: "PIMPINAN",
    key: "PIMPINAN",
    name: "Pimpinan",
    color: "bg-blue-500",
    systemRole: true,
    permissions: { dashboard: true, client: true, berkas: true, finance: true, invoice: true, settings: false },
  },
  {
    id: "STAFFADMIN",
    key: "STAFFADMIN",
    name: "Staff Admin",
    color: "bg-emerald-500",
    systemRole: true,
    permissions: { dashboard: true, client: true, berkas: true, finance: false, invoice: false, settings: false },
  },
  {
    id: "OB",
    key: "OB",
    name: "OB / Kurir",
    color: "bg-slate-500",
    systemRole: true,
    permissions: { dashboard: true, client: false, berkas: true, finance: false, invoice: false, settings: false },
  },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("system");
  const [loading, setLoading] = useState(false);
  const [appName, setAppName] = useState("NOTARIS DIGITAL");
  const [officeName, setOfficeName] = useState("Kantor Notaris & PPAT Fachry, S.H., M.Kn.");
  const [officeAddress, setOfficeAddress] = useState("Jl. Jenderal Sudirman No. 123, Jakarta Selatan");
  const [officeEmail, setOfficeEmail] = useState("info@notarisfachry.com");
  const [officePhone, setOfficePhone] = useState("+62 21 12345678");
  const [logoUrl, setLogoUrl] = useState("");
  const [faviconUrl, setFaviconUrl] = useState("");
  const [bankName, setBankName] = useState("Bank Central Asia (BCA)");
  const [accountNumber, setAccountNumber] = useState("1234567890");
  const [accountName, setAccountName] = useState("Kantor Notaris Fachry");
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingFavicon, setUploadingFavicon] = useState(false);
  const [roles, setRoles] = useState<AppRole[]>(defaultRoles);
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [customRoleName, setCustomRoleName] = useState("");
  const [customRoleColor, setCustomRoleColor] = useState(roleColorOptions[0].value);
  const [waProvider, setWaProvider] = useState("fonnte");
  const [waEndpointUrl, setWaEndpointUrl] = useState("https://api.fonnte.com/send");
  const [waApiToken, setWaApiToken] = useState("");
  const [newJobMessage, setNewJobMessage] = useState("");
  const [statusUpdateMessage, setStatusUpdateMessage] = useState("");
  const [newInvoiceMessage, setNewInvoiceMessage] = useState("");

  const buildSettingsPayload = (nextRoles = roles) => ({
    general: {
      appName,
      officeName,
      officeAddress,
      officeEmail,
      officePhone,
    },
    branding: {
      logoUrl,
      faviconUrl,
    },
    finance: {
      bankName,
      accountNumber,
      accountName,
    },
    roles: nextRoles,
    whatsapp: {
      provider: waProvider,
      endpointUrl: waEndpointUrl,
      apiToken: waApiToken,
      messages: {
        newJob: newJobMessage,
        statusUpdate: statusUpdateMessage,
        newInvoice: newInvoiceMessage,
      },
    },
  });

  const persistSettings = async (nextRoles = roles, showSuccessToast = true) => {
    const res = await fetch("/api/settings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(buildSettingsPayload(nextRoles)),
    });

    const result = await res.json();
    if (!res.ok || !result.success) {
      throw new Error(result.error || "Gagal menyimpan pengaturan.");
    }

    if (Array.isArray(result.data?.roles) && result.data.roles.length > 0) {
      setRoles(result.data.roles.map(normalizeRolePermissions));
    }

    if (showSuccessToast) {
      toast.success("Pengaturan berhasil disimpan!");
    }

    return result.data;
  };

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const res = await fetch("/api/settings", { cache: "no-store" });
        const result = await res.json();

        if (!res.ok || !result.success) {
          throw new Error(result.error || "Gagal memuat pengaturan.");
        }

        const settings = result.data;
        setAppName(settings.general?.appName || "NOTARIS DIGITAL");
        setOfficeName(settings.general?.officeName || "Kantor Notaris & PPAT Fachry, S.H., M.Kn.");
        setOfficeAddress(settings.general?.officeAddress || "Jl. Jenderal Sudirman No. 123, Jakarta Selatan");
        setOfficeEmail(settings.general?.officeEmail || "info@notarisfachry.com");
        setOfficePhone(settings.general?.officePhone || "+62 21 12345678");
        setLogoUrl(settings.branding?.logoUrl || "");
        setFaviconUrl(settings.branding?.faviconUrl || "");
        setRoles(
          Array.isArray(settings.roles) && settings.roles.length > 0
            ? settings.roles.map(normalizeRolePermissions)
            : defaultRoles
        );
        setBankName(settings.finance?.bankName || "Bank Central Asia (BCA)");
        setAccountNumber(settings.finance?.accountNumber || "1234567890");
        setAccountName(settings.finance?.accountName || "Kantor Notaris Fachry");
        setWaProvider(settings.whatsapp?.provider || "fonnte");
        setWaEndpointUrl(settings.whatsapp?.endpointUrl || "https://api.fonnte.com/send");
        setWaApiToken(settings.whatsapp?.apiToken || "");
        setNewJobMessage(settings.whatsapp?.messages?.newJob || "");
        setStatusUpdateMessage(settings.whatsapp?.messages?.statusUpdate || "");
        setNewInvoiceMessage(settings.whatsapp?.messages?.newInvoice || "");
      } catch (error: any) {
        toast.error(error.message || "Gagal memuat pengaturan.");
      }
    };

    loadSettings();
  }, []);

  const handlePermissionToggle = (roleId: string, permissionKey: PermissionKey, checked: boolean) => {
    setRoles((current) => {
      const nextRoles = current.map((role) =>
        role.id === roleId
          ? {
              ...role,
              permissions: {
                ...role.permissions,
                [permissionKey]: checked,
              },
            }
          : role
      );

      void persistSettings(nextRoles, false).catch((error: any) => {
        toast.error(error.message || "Gagal menyimpan perubahan role akses.");
      });

      return nextRoles;
    });
  };

  const handleAddCustomRole = () => {
    const trimmedName = customRoleName.trim();
    if (!trimmedName) {
      toast.error("Nama role kustom wajib diisi.");
      return;
    }

    const generatedKey = trimmedName
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");

    if (!generatedKey) {
      toast.error("Nama role tidak valid.");
      return;
    }

    if (roles.some((role) => role.key === generatedKey || role.name.toLowerCase() === trimmedName.toLowerCase())) {
      toast.error("Role dengan nama tersebut sudah ada.");
      return;
    }

    setRoles((current) => [
      ...current,
      {
        id: generatedKey,
        key: generatedKey,
        name: trimmedName,
        color: customRoleColor,
        systemRole: false,
        permissions: {
          ...emptyPermissions,
        },
      },
    ]);

    setCustomRoleName("");
    setCustomRoleColor(roleColorOptions[0].value);
    setIsRoleDialogOpen(false);
    toast.success("Role kustom ditambahkan. Klik simpan untuk menyimpan permanen.");
  };

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "logo" | "favicon"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isLogo = type === "logo";
    const maxSize = isLogo ? 2 * 1024 * 1024 : 500 * 1024;
    const allowedTypes = isLogo
      ? ["image/png", "image/jpeg", "image/svg+xml"]
      : ["image/png", "image/x-icon", "image/vnd.microsoft.icon"];

    if (!allowedTypes.includes(file.type)) {
      toast.error(
        isLogo
          ? "Logo harus berupa PNG, JPG, atau SVG."
          : "Favicon harus berupa PNG atau ICO."
      );
      e.target.value = "";
      return;
    }

    if (file.size > maxSize) {
      toast.error(
        isLogo
          ? "Ukuran logo maksimal 2MB."
          : "Ukuran favicon maksimal 500KB."
      );
      e.target.value = "";
      return;
    }

    if (isLogo) setUploadingLogo(true);
    else setUploadingFavicon(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const result = await res.json();

      if (!res.ok || !result.success) {
        throw new Error(result.error || "Upload gagal.");
      }

      if (isLogo) {
        setLogoUrl(result.url);
        toast.success("Logo berhasil diupload.");
      } else {
        setFaviconUrl(result.url);
        toast.success("Favicon berhasil diupload.");
      }
    } catch (error: any) {
      toast.error(error.message || "Terjadi kesalahan saat upload file.");
    } finally {
      if (isLogo) setUploadingLogo(false);
      else setUploadingFavicon(false);
      e.target.value = "";
    }
  };

  const handleSave = async () => {
    setLoading(true);

    try {
      await persistSettings(roles, true);
    } catch (error: any) {
      toast.error(error.message || "Terjadi kesalahan saat menyimpan pengaturan.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 p-4 max-w-6xl mx-auto pb-20">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-3">
            <div className="h-12 w-12 rounded-[1.25rem] bg-pink-500 text-white flex items-center justify-center shadow-lg shadow-pink-500/20">
              <Settings2 className="h-6 w-6" />
            </div>
            Pengaturan Sistem
          </h1>
          <p className="text-muted-foreground font-medium ml-1">
            Konfigurasi parameter aplikasi, hak akses, dan integrasi WhatsApp Gateway.
          </p>
        </div>
        <Button 
          onClick={handleSave} 
          disabled={loading}
          className="h-9 px-4 text-xs rounded-xl bg-pink-500 hover:bg-pink-600 text-white shadow-md shadow-pink-500/20 font-bold gap-1.5 transition-all active:scale-95"
        >
          <Save className="h-3.5 w-3.5" />
          {loading ? "Menyimpan..." : "Simpan Semua Perubahan"}
        </Button>
      </div>

      <Tabs defaultValue="system" onValueChange={setActiveTab} className="space-y-10">
        <TabsList className="bg-transparent h-auto p-0 border-none w-full justify-start gap-4 flex flex-wrap">
          <TabsTrigger 
            value="system" 
            className="h-10 px-5 rounded-xl font-bold text-xs border-2 border-muted bg-white text-muted-foreground data-[state=active]:bg-pink-500 data-[state=active]:text-white data-[state=active]:border-pink-500 data-[state=active]:shadow-md data-[state=active]:shadow-pink-500/20 transition-all gap-2 hover:border-pink-200 hover:text-pink-600 data-[state=active]:hover:text-white"
          >
            <div className="h-6 w-6 rounded-lg bg-pink-500/10 flex items-center justify-center text-inherit group-data-[state=active]:bg-white/20">
              <Settings2 className="h-3.5 w-3.5" />
            </div>
            System Settings
          </TabsTrigger>
          <TabsTrigger 
            value="roles" 
            className="h-10 px-5 rounded-xl font-bold text-xs border-2 border-muted bg-white text-muted-foreground data-[state=active]:bg-pink-500 data-[state=active]:text-white data-[state=active]:border-pink-500 data-[state=active]:shadow-md data-[state=active]:shadow-pink-500/20 transition-all gap-2 hover:border-pink-200 hover:text-pink-600 data-[state=active]:hover:text-white"
          >
            <div className="h-6 w-6 rounded-lg bg-pink-500/10 flex items-center justify-center text-inherit group-data-[state=active]:bg-white/20">
              <ShieldCheck className="h-3.5 w-3.5" />
            </div>
            Role & Akses
          </TabsTrigger>
          <TabsTrigger 
            value="admins" 
            className="h-10 px-5 rounded-xl font-bold text-xs border-2 border-muted bg-white text-muted-foreground data-[state=active]:bg-pink-500 data-[state=active]:text-white data-[state=active]:border-pink-500 data-[state=active]:shadow-md data-[state=active]:shadow-pink-500/20 transition-all gap-2 hover:border-pink-200 hover:text-pink-600 data-[state=active]:hover:text-white"
          >
            <div className="h-6 w-6 rounded-lg bg-pink-500/10 flex items-center justify-center text-inherit group-data-[state=active]:bg-white/20">
              <UserCog className="h-3.5 w-3.5" />
            </div>
            Akun Admin & Pimpinan
          </TabsTrigger>
          <TabsTrigger 
            value="wa" 
            className="h-10 px-5 rounded-xl font-bold text-xs border-2 border-muted bg-white text-muted-foreground data-[state=active]:bg-pink-500 data-[state=active]:text-white data-[state=active]:border-pink-500 data-[state=active]:shadow-md data-[state=active]:shadow-pink-500/20 transition-all gap-2 hover:border-pink-200 hover:text-pink-600 data-[state=active]:hover:text-white"
          >
            <div className="h-6 w-6 rounded-lg bg-pink-500/10 flex items-center justify-center text-inherit group-data-[state=active]:bg-white/20">
              <MessageSquare className="h-3.5 w-3.5" />
            </div>
            WhatsApp Gateway
          </TabsTrigger>
        </TabsList>

        {/* --- SYSTEM TAB --- */}
        <TabsContent value="system" className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-500">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-3 space-y-6">
              <Card className="border-none shadow-sm rounded-[2.5rem] bg-card overflow-hidden">
                <CardHeader className="border-b bg-muted/5 px-8 py-6">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-xl bg-pink-500/10 flex items-center justify-center text-pink-500">
                      <Building className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">Informasi Kantor</CardTitle>
                      <CardDescription>Detail identitas kantor notaris Anda.</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-8 space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Nama Aplikasi</Label>
                      <Input value={appName} onChange={(e) => setAppName(e.target.value)} className="h-12 rounded-xl" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Nama Kantor</Label>
                      <Input value={officeName} onChange={(e) => setOfficeName(e.target.value)} className="h-12 rounded-xl" />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Alamat Kantor</Label>
                      <Textarea 
                        value={officeAddress} 
                        onChange={(e) => setOfficeAddress(e.target.value)} 
                        rows={3} 
                        className="rounded-xl border-muted-foreground/20 focus-visible:ring-pink-500" 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Email Kantor</Label>
                      <Input value={officeEmail} onChange={(e) => setOfficeEmail(e.target.value)} className="h-12 rounded-xl" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Nomor Telepon</Label>
                      <Input value={officePhone} onChange={(e) => setOfficePhone(e.target.value)} className="h-12 rounded-xl" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm rounded-[2.5rem] bg-card overflow-hidden">
                <CardHeader className="border-b bg-muted/5 px-8 py-6">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-xl bg-pink-500/10 flex items-center justify-center text-pink-500">
                      <Globe className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">Pengaturan Regional</CardTitle>
                      <CardDescription>Zona waktu dan format mata uang.</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-8 space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Zona Waktu</Label>
                      <select className="flex h-12 w-full rounded-xl border border-muted bg-background px-4 font-medium text-sm">
                        <option value="Asia/Jakarta">Asia/Jakarta (WIB)</option>
                        <option value="Asia/Makassar">Asia/Makassar (WITA)</option>
                        <option value="Asia/Jayapura">Asia/Jayapura (WIT)</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Mata Uang</Label>
                      <Input defaultValue="IDR (Rp)" readOnly className="h-12 rounded-xl bg-muted/30" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm rounded-[2.5rem] bg-card overflow-hidden">
                <CardHeader className="border-b bg-muted/5 px-8 py-6">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-xl bg-pink-500/10 flex items-center justify-center text-pink-500">
                      <Image className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">Logo & Favicon</CardTitle>
                      <CardDescription>Upload logo kantor dan favicon aplikasi.</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-8 space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Logo Kantor</Label>
                      <input
                        id="office-logo-upload"
                        type="file"
                        accept=".png,.jpg,.jpeg,.svg,image/png,image/jpeg,image/svg+xml"
                        className="hidden"
                        onChange={(e) => handleFileUpload(e, "logo")}
                      />
                      <label
                        htmlFor="office-logo-upload"
                        className="block border-2 border-dashed border-muted rounded-2xl p-6 text-center hover:bg-muted/5 transition-colors cursor-pointer"
                      >
                        {logoUrl ? (
                          <div className="space-y-4">
                            <div className="h-20 rounded-xl border border-muted/40 bg-white flex items-center justify-center overflow-hidden px-4">
                              <img src={logoUrl} alt="Preview logo kantor" className="max-h-12 w-auto object-contain" />
                            </div>
                            <p className="text-sm font-medium text-foreground">Klik untuk ganti logo</p>
                          </div>
                        ) : (
                          <>
                            <div className="h-16 w-16 rounded-xl bg-pink-500/10 flex items-center justify-center mx-auto mb-3">
                              {uploadingLogo ? (
                                <Loader2 className="h-8 w-8 text-pink-500 animate-spin" />
                              ) : (
                                <Upload className="h-8 w-8 text-pink-500" />
                              )}
                            </div>
                            <p className="text-sm font-medium text-foreground">
                              {uploadingLogo ? "Mengupload logo..." : "Klik untuk upload logo"}
                            </p>
                          </>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">Format: PNG, JPG, SVG (Max 2MB)</p>
                        <p className="text-xs text-muted-foreground">Rekomendasi: 200x50px</p>
                      </label>
                    </div>
                    <div className="space-y-4">
                      <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Favicon</Label>
                      <input
                        id="office-favicon-upload"
                        type="file"
                        accept=".ico,.png,image/x-icon,image/vnd.microsoft.icon,image/png"
                        className="hidden"
                        onChange={(e) => handleFileUpload(e, "favicon")}
                      />
                      <label
                        htmlFor="office-favicon-upload"
                        className="block border-2 border-dashed border-muted rounded-2xl p-6 text-center hover:bg-muted/5 transition-colors cursor-pointer"
                      >
                        {faviconUrl ? (
                          <div className="space-y-4">
                            <div className="h-20 rounded-xl border border-muted/40 bg-white flex items-center justify-center overflow-hidden">
                              <img src={faviconUrl} alt="Preview favicon" className="h-10 w-10 object-contain" />
                            </div>
                            <p className="text-sm font-medium text-foreground">Klik untuk ganti favicon</p>
                          </div>
                        ) : (
                          <>
                            <div className="h-16 w-16 rounded-xl bg-pink-500/10 flex items-center justify-center mx-auto mb-3">
                              {uploadingFavicon ? (
                                <Loader2 className="h-8 w-8 text-pink-500 animate-spin" />
                              ) : (
                                <Image className="h-8 w-8 text-pink-500" />
                              )}
                            </div>
                            <p className="text-sm font-medium text-foreground">
                              {uploadingFavicon ? "Mengupload favicon..." : "Klik untuk upload favicon"}
                            </p>
                          </>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">Format: ICO, PNG (Max 500KB)</p>
                        <p className="text-xs text-muted-foreground">Rekomendasi: 32x32px</p>
                      </label>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm rounded-[2.5rem] bg-card overflow-hidden">
                <CardHeader className="border-b bg-muted/5 px-8 py-6">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-xl bg-pink-500/10 flex items-center justify-center text-pink-500">
                      <CreditCard className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">Informasi Rekening Bank</CardTitle>
                      <CardDescription>Digunakan untuk ditampilkan pada halaman invoice.</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-8 space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Nama Bank</Label>
                      <Input
                        value={bankName}
                        onChange={(e) => setBankName(e.target.value)}
                        placeholder="Contoh: Bank Central Asia (BCA)"
                        className="h-12 rounded-xl border-muted-foreground/20 focus-visible:ring-pink-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Nomor Rekening</Label>
                      <Input
                        value={accountNumber}
                        onChange={(e) => setAccountNumber(e.target.value)}
                        placeholder="Contoh: 1234567890"
                        className="h-12 rounded-xl border-muted-foreground/20 focus-visible:ring-pink-500"
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Rekening Atas Nama</Label>
                      <Input
                        value={accountName}
                        onChange={(e) => setAccountName(e.target.value)}
                        placeholder="Contoh: Kantor Notaris Fachry"
                        className="h-12 rounded-xl border-muted-foreground/20 focus-visible:ring-pink-500"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* --- ROLE AKSES TAB --- */}
        <TabsContent value="roles" className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
          <Card className="border-none shadow-sm rounded-[2.5rem] bg-card overflow-hidden">
            <CardHeader className="border-b bg-muted/5 px-8 py-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-pink-500/10 flex items-center justify-center text-pink-500">
                    <ShieldAlert className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Manajemen Role & Hak Akses</CardTitle>
                    <CardDescription>Tentukan apa yang bisa dilakukan oleh setiap role pegawai.</CardDescription>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-xl font-bold border-pink-200 text-pink-600 gap-2"
                  onClick={() => setIsRoleDialogOpen(true)}
                >
                  <Key className="h-4 w-4" />
                  Tambah Role Kustom
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-muted/50 bg-muted/5">
                      <th className="p-6 text-xs font-black uppercase tracking-widest text-muted-foreground">Role Nama</th>
                      {permissionColumns.map((column) => (
                        <th
                          key={column.key}
                          className="p-6 text-xs font-black uppercase tracking-widest text-muted-foreground text-center"
                        >
                          {column.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-muted/30">
                    {roles.map((role) => (
                      <tr key={role.id} className="hover:bg-muted/5 transition-colors">
                        <td className="p-6">
                          <div className="flex items-center gap-3">
                            <div className={cn("h-2 w-2 rounded-full", role.color)} />
                            <div className="flex flex-col gap-1">
                              <span className="font-bold text-foreground">{role.name}</span>
                              <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
                                {role.systemRole ? role.key : `Custom • ${role.key}`}
                              </span>
                            </div>
                          </div>
                        </td>
                        {permissionColumns.map((column) => (
                          <td key={column.key} className="p-6 text-center">
                            <div className="flex justify-center">
                              <Switch
                                checked={role.permissions[column.key]}
                                onCheckedChange={(checked) => handlePermissionToggle(role.id, column.key, checked)}
                                className="scale-75 data-[state=checked]:bg-pink-500"
                              />
                            </div>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
            <CardFooter className="bg-muted/5 p-6 border-t">
              <div className="flex items-center gap-2 text-xs text-muted-foreground italic">
                <Info className="h-3.5 w-3.5" />
                Role bawaan dan role kustom dapat diatur di sini, lalu disimpan lewat tombol simpan di bagian atas.
              </div>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* --- AKUN ADMIN TAB --- */}
        <TabsContent value="admins" className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
          <AdminList />
        </TabsContent>

        {/* --- WA GATEWAY TAB --- */}
        <TabsContent value="wa" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-6">
              <Card className="border-none shadow-sm rounded-[2.5rem] bg-card overflow-hidden">
                <CardHeader className="border-b bg-muted/5 px-8 py-6">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-xl bg-pink-500/10 flex items-center justify-center text-pink-500">
                      <Zap className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">Konfigurasi API WhatsApp</CardTitle>
                      <CardDescription>Integrasikan sistem dengan provider WhatsApp Gateway (Fonnte/Wavigen/dll).</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-8 space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Provider Service</Label>
                      <select
                        value={waProvider}
                        onChange={(e) => setWaProvider(e.target.value)}
                        className="flex h-12 w-full rounded-xl border border-muted bg-background px-4 font-medium"
                      >
                        <option value="fonnte">Fonnte (Recommended)</option>
                        <option value="wavigen">Wavigen</option>
                        <option value="wablas">Wablas</option>
                        <option value="custom">Custom API</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">API Endpoint URL</Label>
                      <Input
                        value={waEndpointUrl}
                        onChange={(e) => setWaEndpointUrl(e.target.value)}
                        className="h-12 rounded-xl font-mono text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">API Token / Secret Key</Label>
                      <div className="relative">
                        <Input
                          type="password"
                          value={waApiToken}
                          onChange={(e) => setWaApiToken(e.target.value)}
                          placeholder="Masukkan token WhatsApp Gateway"
                          className="h-12 rounded-xl font-mono text-sm pr-12"
                        />
                        <Button variant="ghost" size="icon" className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-lg">
                          <Globe className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 flex flex-col gap-4">
                    <div className="p-4 rounded-2xl bg-pink-50 border border-pink-100 flex items-start gap-3">
                      <Info className="h-5 w-5 text-pink-500 mt-0.5" />
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-pink-700">Integrasi Otomatis</p>
                        <p className="text-xs text-pink-600/80 leading-relaxed">
                          Sistem akan otomatis mengirimkan notifikasi progres berkas ke nomor WhatsApp client jika integrasi ini aktif.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="border-t bg-muted/5 px-8 py-6">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-12 rounded-xl px-8 font-bold border-pink-500/20 text-pink-600 hover:bg-pink-50 transition-all gap-2"
                    onClick={() => toast.success("Tes koneksi gateway tersimulasikan.")}
                  >
                    <Zap className="h-4 w-4" />
                    Test Koneksi Gateway
                  </Button>
                </CardFooter>
              </Card>

              <Card className="border-none shadow-sm rounded-[2.5rem] bg-card overflow-hidden">
                <CardHeader className="border-b bg-muted/5 px-8 py-6">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-xl bg-pink-500/10 flex items-center justify-center text-pink-500">
                      <MessageSquare className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">Setting Pesan Broadcast</CardTitle>
                      <CardDescription>
                        Atur kata-kata pesan otomatis yang dikirim saat berkas atau invoice dibuat maupun saat status diperbarui.
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-8 space-y-6">
                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">
                      Pesan Berkas Baru
                    </Label>
                    <Textarea
                      value={newJobMessage}
                      onChange={(e) => setNewJobMessage(e.target.value)}
                      className="min-h-28 rounded-2xl bg-background/70"
                      placeholder="Halo {clientName}, berkas baru Anda..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">
                      Pesan Update Status
                    </Label>
                    <Textarea
                      value={statusUpdateMessage}
                      onChange={(e) => setStatusUpdateMessage(e.target.value)}
                      className="min-h-28 rounded-2xl bg-background/70"
                      placeholder="Halo {clientName}, status berkas {jobTitle} telah berubah menjadi {status}..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">
                      Pesan Invoice Baru
                    </Label>
                    <Textarea
                      value={newInvoiceMessage}
                      onChange={(e) => setNewInvoiceMessage(e.target.value)}
                      className="min-h-28 rounded-2xl bg-background/70"
                      placeholder="Halo {clientName}, invoice baru untuk {jobTitle} telah dibuat..."
                    />
                  </div>
                </CardContent>
                <CardFooter className="border-t bg-muted/5 px-8 py-6">
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p>Placeholder yang bisa dipakai: <span className="font-semibold">{`{clientName}`}</span>, <span className="font-semibold">{`{jobTitle}`}</span>, <span className="font-semibold">{`{status}`}</span>, <span className="font-semibold">{`{amount}`}</span></p>
                    <p>Pesan ini digunakan untuk broadcast/update otomatis dari sistem.</p>
                  </div>
                </CardFooter>
              </Card>
            </div>

            <div className="space-y-6">
              <Card className="border-none shadow-sm rounded-[2.5rem] bg-card overflow-hidden">
                <CardHeader>
                  <CardTitle className="text-lg">Status Koneksi</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center py-8 space-y-4">
                  <div className="h-24 w-24 rounded-full bg-emerald-500/10 flex items-center justify-center relative">
                    <div className="absolute h-full w-full rounded-full bg-emerald-500/20 animate-ping" />
                    <Smartphone className="h-10 w-10 text-emerald-500 relative z-10" />
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-black text-emerald-600 uppercase tracking-tighter">Connected</p>
                    <p className="text-xs text-muted-foreground font-medium">Gateway Active & Ready</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm rounded-[2.5rem] bg-card overflow-hidden">
                <CardHeader>
                  <CardTitle className="text-lg">Ringkasan Template</CardTitle>
                  <CardDescription>Template aktif yang akan dipakai sistem.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="rounded-2xl border border-muted/40 p-4 bg-muted/10">
                    <p className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-2">Berkas Baru</p>
                    <p className="text-sm text-foreground line-clamp-4">{newJobMessage || "-"}</p>
                  </div>
                  <div className="rounded-2xl border border-muted/40 p-4 bg-muted/10">
                    <p className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-2">Update Status</p>
                    <p className="text-sm text-foreground line-clamp-4">{statusUpdateMessage || "-"}</p>
                  </div>
                  <div className="rounded-2xl border border-muted/40 p-4 bg-muted/10">
                    <p className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-2">Invoice Baru</p>
                    <p className="text-sm text-foreground line-clamp-4">{newInvoiceMessage || "-"}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
        <DialogContent className="max-w-lg rounded-[2rem] p-0 overflow-hidden">
          <DialogHeader className="px-8 pt-8">
            <DialogTitle>Tambah Role Kustom</DialogTitle>
            <DialogDescription>
              Buat role baru dan atur hak aksesnya dari tabel Role & Akses setelah role ditambahkan.
            </DialogDescription>
          </DialogHeader>
          <div className="px-8 pb-8 space-y-6">
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">
                Nama Role
              </Label>
              <Input
                value={customRoleName}
                onChange={(e) => setCustomRoleName(e.target.value)}
                placeholder="Contoh: Marketing"
                className="h-12 rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">
                Warna Role
              </Label>
              <div className="grid grid-cols-3 gap-3">
                {roleColorOptions.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => setCustomRoleColor(color.value)}
                    className={cn(
                      "flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-bold transition-colors",
                      customRoleColor === color.value
                        ? "border-pink-500 bg-pink-50 text-pink-600"
                        : "border-muted bg-background hover:bg-muted/20"
                    )}
                  >
                    <span className={cn("h-3 w-3 rounded-full", color.value)} />
                    {color.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter className="px-8">
            <Button type="button" variant="outline" className="rounded-xl" onClick={() => setIsRoleDialogOpen(false)}>
              Batal
            </Button>
            <Button type="button" className="rounded-xl bg-pink-500 hover:bg-pink-600" onClick={handleAddCustomRole}>
              Tambah Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
