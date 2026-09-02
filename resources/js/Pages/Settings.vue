<script setup lang="ts">
import { ref } from "vue";
import { Head, Link, useForm } from "@inertiajs/vue3";
import {
    Building2,
    CheckCircle2,
    CreditCard,
    Hash,
    Image,
    KeyRound,
    Mail,
    MessageSquare,
    Save,
    Shield,
    Upload,
    Users,
} from "@lucide/vue";
import AppLayout from "@/Layouts/AppLayout.vue";
const p = defineProps<{ settings: any; admins: any[] }>();
const defaults = [
    {
        id: "ADMINISTRATOR",
        name: "Administrator",
        color: "pink",
        permissions: {
            dashboard: true,
            client: true,
            berkas: true,
            finance: true,
            invoice: true,
            settings: true,
        },
    },
    {
        id: "PIMPINAN",
        name: "Pimpinan",
        color: "blue",
        permissions: {
            dashboard: true,
            client: true,
            berkas: true,
            finance: true,
            invoice: true,
            settings: false,
        },
    },
    {
        id: "STAFFADMIN",
        name: "Staff Admin",
        color: "emerald",
        permissions: {
            dashboard: true,
            client: true,
            berkas: true,
            finance: false,
            invoice: false,
            settings: false,
        },
    },
    {
        id: "OB",
        name: "OB",
        color: "amber",
        permissions: {
            dashboard: true,
            client: false,
            berkas: true,
            finance: false,
            invoice: false,
            settings: false,
        },
    },
];
const f = useForm({
    general: {
        appName: p.settings.general?.appName || "NOTARIS DIGITAL",
        officeName: p.settings.general?.officeName || "",
        officeAddress: p.settings.general?.officeAddress || "",
        officeEmail: p.settings.general?.officeEmail || "",
        officePhone: p.settings.general?.officePhone || "",
    },
    branding: {
        logoUrl: p.settings.branding?.logoUrl || "",
        faviconUrl: p.settings.branding?.faviconUrl || "",
        primaryColor: p.settings.branding?.primaryColor || "#F47EAB",
    },
    finance: {
        bankName: p.settings.finance?.bankName || "",
        accountNumber: p.settings.finance?.accountNumber || "",
        accountName: p.settings.finance?.accountName || "",
    },
    documentNumbers: {
        quotation: p.settings.documentNumbers?.quotation || "QUO",
        invoice: p.settings.documentNumbers?.invoice || "INV",
        badan_hukum: p.settings.documentNumbers?.badan_hukum || "BHM",
        non_badan_hukum: p.settings.documentNumbers?.non_badan_hukum || "NBH",
        ppat: p.settings.documentNumbers?.ppat || "PPAT",
    },
    email: {
        enabled: Boolean(p.settings.email?.enabled),
        host: p.settings.email?.host || "smtp.gmail.com",
        port: Number(p.settings.email?.port || 465),
        encryption: p.settings.email?.encryption || "ssl",
        username: p.settings.email?.username || "",
        appPassword: p.settings.email?.appPassword || "",
        fromAddress: p.settings.email?.fromAddress || "",
        fromName: p.settings.email?.fromName || "Notaris Digital",
    },
    roles: p.settings.roles?.length ? p.settings.roles : defaults,
    whatsapp: {
        enabled: Boolean(p.settings.whatsapp?.enabled),
        provider: p.settings.whatsapp?.provider || "fonnte",
        endpointUrl:
            p.settings.whatsapp?.endpointUrl || "https://api.fonnte.com/send",
        apiToken: p.settings.whatsapp?.apiToken || "",
    },
});
const tab = ref("system");
const uploading = ref("");
const upload = async (type: "logo" | "favicon", e: Event) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    uploading.value = type;
    const fd = new FormData();
    fd.append("type", type);
    fd.append("file", file);
    const token = (
        document.querySelector("meta[name=csrf-token]") as HTMLMetaElement
    )?.content;
    const res = await fetch("/dashboard/settings/upload", {
        method: "POST",
        headers: { "X-CSRF-TOKEN": token, Accept: "application/json" },
        body: fd,
    });
    const data = await res.json();
    if (res.ok)
        f.branding[type === "logo" ? "logoUrl" : "faviconUrl"] = data.url;
    uploading.value = "";
};
const permissions = [
    "dashboard",
    "client",
    "berkas",
    "finance",
    "invoice",
    "settings",
];
type DocumentNumberKey =
    "quotation" | "invoice" | "badan_hukum" | "non_badan_hukum" | "ppat";
const documentNumberFields: { key: DocumentNumberKey; label: string }[] = [
    { key: "quotation", label: "Huruf Depan Quotation" },
    { key: "invoice", label: "Huruf Depan Invoice" },
    { key: "badan_hukum", label: "Huruf Depan Berkas Badan Hukum" },
    {
        key: "non_badan_hukum",
        label: "Huruf Depan Berkas Non Badan Hukum",
    },
    { key: "ppat", label: "Huruf Depan Berkas PPAT" },
];
const save = () =>
    f.put("/dashboard/settings", {
        preserveScroll: true,
    });
</script>
<template>
    <Head title="Pengaturan" /><AppLayout
        ><main class="mx-auto max-w-7xl space-y-6 p-4">
            <div>
                <h1 class="text-2xl font-black">Pengaturan Sistem</h1>
                <p class="text-sm text-slate-500">
                    Konfigurasi kantor, rekening, role, administrator, dan
                    WhatsApp.
                </p>
            </div>
            <nav class="flex flex-wrap gap-2 rounded-2xl border bg-white p-2">
                <button
                    v-for="x in [
                        { id: 'system', l: 'Sistem', i: Building2 },
                        { id: 'numbers', l: 'Nomor Dokumen', i: Hash },
                        { id: 'email', l: 'Email SMTP', i: Mail },
                        { id: 'admins', l: 'Administrator', i: Users },
                        { id: 'roles', l: 'Role & Akses', i: Shield },
                        { id: 'whatsapp', l: 'WhatsApp', i: MessageSquare },
                    ]"
                    @click="tab = x.id"
                    class="flex h-10 items-center gap-2 rounded-xl px-4 text-sm font-bold"
                    :class="
                        tab === x.id
                            ? 'bg-pink-500 text-white'
                            : 'text-slate-500 hover:bg-pink-50'
                    "
                >
                    <component :is="x.i" class="h-4 w-4" />{{ x.l }}
                </button>
            </nav>
            <form @submit.prevent="save">
                <div
                    v-if="f.recentlySuccessful"
                    class="mb-6 flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700"
                >
                    <CheckCircle2 class="h-5 w-5" />
                    Pengaturan berhasil disimpan dan sudah aktif.
                </div>
                <div v-if="tab === 'system'" class="grid gap-6 lg:grid-cols-2">
                    <section class="space-y-4 rounded-3xl border bg-white p-6">
                        <h2 class="flex items-center gap-2 font-black">
                            <Building2 class="h-5 w-5 text-pink-500" />Informasi
                            Kantor
                        </h2>
                        <input
                            v-model="f.general.appName"
                            placeholder="Nama aplikasi"
                            class="field"
                        /><input
                            v-model="f.general.officeName"
                            placeholder="Nama kantor"
                            class="field"
                        /><textarea
                            v-model="f.general.officeAddress"
                            placeholder="Alamat"
                            class="field h-24 py-3"
                        ></textarea
                        ><input
                            v-model="f.general.officeEmail"
                            type="email"
                            placeholder="Email"
                            class="field"
                        /><input
                            v-model="f.general.officePhone"
                            placeholder="Telepon"
                            class="field"
                        />
                    </section>
                    <section class="space-y-4 rounded-3xl border bg-white p-6">
                        <h2 class="flex items-center gap-2 font-black">
                            <CreditCard class="h-5 w-5 text-pink-500" />Rekening
                            Bank
                        </h2>
                        <input
                            v-model="f.finance.bankName"
                            placeholder="Nama bank"
                            class="field"
                        /><input
                            v-model="f.finance.accountNumber"
                            placeholder="Nomor rekening"
                            class="field"
                        /><input
                            v-model="f.finance.accountName"
                            placeholder="Nama pemilik"
                            class="field"
                        />
                    </section>
                    <section
                        class="space-y-4 rounded-3xl border bg-white p-6 lg:col-span-2"
                    >
                        <h2 class="flex items-center gap-2 font-black">
                            <Image class="h-5 w-5 text-pink-500" />Logo &
                            Favicon
                        </h2>
                        <div class="grid gap-4 md:grid-cols-2">
                            <label
                                class="rounded-2xl border-2 border-dashed p-6 text-center"
                                ><img
                                    v-if="f.branding.logoUrl"
                                    :src="f.branding.logoUrl"
                                    class="mx-auto mb-3 max-h-14" /><Upload
                                    v-else
                                    class="mx-auto mb-3 text-pink-500" /><span
                                    class="font-bold"
                                    >{{
                                        uploading === "logo"
                                            ? "Mengupload..."
                                            : "Upload Logo"
                                    }}</span
                                ><input
                                    type="file"
                                    accept="image/*"
                                    @change="upload('logo', $event)"
                                    class="mt-3 block w-full text-xs" /></label
                            ><label
                                class="rounded-2xl border-2 border-dashed p-6 text-center"
                                ><img
                                    v-if="f.branding.faviconUrl"
                                    :src="f.branding.faviconUrl"
                                    class="mx-auto mb-3 h-10 w-10" /><Upload
                                    v-else
                                    class="mx-auto mb-3 text-pink-500" /><span
                                    class="font-bold"
                                    >{{
                                        uploading === "favicon"
                                            ? "Mengupload..."
                                            : "Upload Favicon"
                                    }}</span
                                ><input
                                    type="file"
                                    accept="image/*"
                                    @change="upload('favicon', $event)"
                                    class="mt-3 block w-full text-xs"
                            /></label>
                        </div>

                        <div class="mt-6 border-t pt-6">
                            <h3 class="font-black text-slate-800">Warna Utama Tema (Primary Color)</h3>
                            <p class="mt-1 text-xs text-slate-500">Pilih warna utama aplikasi. Warna tombol, badge aktif, dan aksen navigasi akan menyesuaikan secara otomatis.</p>
                            <div class="mt-4 flex flex-wrap items-center gap-3">
                                <button
                                    v-for="color in [
                                        { name: 'Soft Pink', hex: '#F47EAB' },
                                        { name: 'Royal Indigo', hex: '#4F46E5' },
                                        { name: 'Ocean Sky', hex: '#0284C7' },
                                        { name: 'Emerald Teal', hex: '#0D9488' },
                                        { name: 'Deep Violet', hex: '#7C3AED' },
                                        { name: 'Warm Amber', hex: '#F59E0B' },
                                        { name: 'Crimson Rose', hex: '#E11D48' },
                                        { name: 'Slate Dark', hex: '#334155' },
                                    ]"
                                    :key="color.hex"
                                    type="button"
                                    @click="f.branding.primaryColor = color.hex"
                                    class="group relative flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold transition-all"
                                    :class="f.branding.primaryColor === color.hex ? 'border-slate-800 bg-slate-900 text-white shadow-md' : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'"
                                >
                                    <span class="h-4 w-4 rounded-full border border-black/10 shadow-inner" :style="{ backgroundColor: color.hex }"></span>
                                    <span>{{ color.name }}</span>
                                </button>
                                <div class="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold">
                                    <span>Kustom HEX:</span>
                                    <input type="color" v-model="f.branding.primaryColor" class="h-6 w-8 cursor-pointer rounded border-0 bg-transparent p-0" />
                                    <span class="font-mono text-slate-500">{{ f.branding.primaryColor }}</span>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
                <section
                    v-else-if="tab === 'numbers'"
                    class="rounded-3xl border bg-white p-6"
                >
                    <div class="mb-6 flex items-start gap-3">
                        <span
                            class="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-pink-50 text-pink-500"
                        >
                            <Hash class="h-5 w-5" />
                        </span>
                        <div>
                            <h2 class="font-black">Format Nomor Dokumen</h2>
                            <p class="mt-1 text-sm text-slate-500">
                                Prefix berlaku untuk dokumen baru. Format nomor:
                                PREFIX/ddmmyyyy/nomor urut.
                            </p>
                        </div>
                    </div>
                    <div class="grid gap-5 md:grid-cols-2">
                        <label
                            v-for="item in documentNumberFields"
                            :key="item.key"
                            class="block rounded-2xl border border-slate-200 p-4"
                        >
                            <span
                                class="text-xs font-black uppercase tracking-wider text-slate-600"
                            >
                                {{ item.label }}
                            </span>
                            <input
                                v-model="f.documentNumbers[item.key]"
                                maxlength="10"
                                pattern="[A-Za-z]+"
                                required
                                class="field mt-3 uppercase"
                                @input="
                                    f.documentNumbers[item.key] =
                                        f.documentNumbers[
                                            item.key
                                        ].toUpperCase()
                                "
                            />
                            <p class="mt-2 text-xs text-slate-500">
                                Contoh:
                                <span class="font-mono font-bold text-pink-600">
                                    {{
                                        f.documentNumbers[item.key] || "PREFIX"
                                    }}/24072026/0001
                                </span>
                            </p>
                            <p
                                v-if="f.errors[`documentNumbers.${item.key}`]"
                                class="mt-2 text-xs font-bold text-red-500"
                            >
                                {{ f.errors[`documentNumbers.${item.key}`] }}
                            </p>
                        </label>
                    </div>
                    <div
                        class="mt-6 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600"
                    >
                        Nomor yang sudah pernah dibuat tetap dipertahankan dan
                        tidak akan berubah ketika prefix diperbarui.
                    </div>
                </section>
                <section
                    v-else-if="tab === 'email'"
                    class="grid gap-6 lg:grid-cols-2"
                >
                    <div class="space-y-4 rounded-3xl border bg-white p-6">
                        <div class="flex items-start justify-between gap-4">
                            <div>
                                <h2 class="flex items-center gap-2 font-black">
                                    <Mail class="h-5 w-5 text-pink-500" />
                                    Google SMTP
                                </h2>
                                <p class="mt-1 text-sm text-slate-500">
                                    Koneksi Email global untuk Quotation,
                                    Invoice, dan Berkas.
                                </p>
                            </div>
                            <button
                                type="button"
                                role="switch"
                                :aria-checked="f.email.enabled"
                                @click="f.email.enabled = !f.email.enabled"
                                class="inline-flex items-center gap-3 rounded-full border px-3 py-2 text-sm font-black transition"
                                :class="
                                    f.email.enabled
                                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                        : 'border-slate-200 bg-slate-50 text-slate-500'
                                "
                            >
                                <span
                                    class="relative h-6 w-11 rounded-full transition"
                                    :class="
                                        f.email.enabled
                                            ? 'bg-emerald-500'
                                            : 'bg-slate-300'
                                    "
                                >
                                    <span
                                        class="absolute top-1 h-4 w-4 rounded-full bg-white shadow transition"
                                        :class="
                                            f.email.enabled
                                                ? 'left-6'
                                                : 'left-1'
                                        "
                                    />
                                </span>
                                {{ f.email.enabled ? "Aktif" : "Tidak aktif" }}
                            </button>
                        </div>
                        <p
                            v-if="f.email.enabled"
                            class="rounded-xl bg-amber-50 px-4 py-3 text-xs font-bold text-amber-700"
                        >
                            Lengkapi konfigurasi, lalu klik Simpan Pengaturan.
                        </p>
                        <div
                            class="grid gap-4 sm:grid-cols-2"
                            :class="{ 'opacity-50': !f.email.enabled }"
                        >
                            <label>
                                <span class="input-label">SMTP Host</span>
                                <input
                                    v-model="f.email.host"
                                    :disabled="!f.email.enabled"
                                    class="field"
                                />
                            </label>
                            <label>
                                <span class="input-label">Port</span>
                                <input
                                    v-model.number="f.email.port"
                                    type="number"
                                    :disabled="!f.email.enabled"
                                    class="field"
                                />
                            </label>
                            <label>
                                <span class="input-label">Enkripsi</span>
                                <select
                                    v-model="f.email.encryption"
                                    :disabled="!f.email.enabled"
                                    class="field"
                                >
                                    <option value="ssl">SSL (Port 465)</option>
                                    <option value="tls">
                                        STARTTLS (Port 587)
                                    </option>
                                </select>
                            </label>
                            <label>
                                <span class="input-label">Email Google</span>
                                <input
                                    v-model="f.email.username"
                                    type="email"
                                    :disabled="!f.email.enabled"
                                    placeholder="nama@gmail.com"
                                    class="field"
                                />
                            </label>
                        </div>
                        <label class="block">
                            <span class="input-label">Google App Password</span>
                            <input
                                v-model="f.email.appPassword"
                                type="password"
                                :disabled="!f.email.enabled"
                                autocomplete="new-password"
                                placeholder="16 digit App Password"
                                class="field"
                            />
                            <span class="mt-1 block text-xs text-slate-500">
                                Gunakan App Password Google, bukan password akun
                                Gmail.
                            </span>
                        </label>
                        <div
                            class="grid gap-4 sm:grid-cols-2"
                            :class="{ 'opacity-50': !f.email.enabled }"
                        >
                            <label>
                                <span class="input-label">Email Pengirim</span>
                                <input
                                    v-model="f.email.fromAddress"
                                    type="email"
                                    :disabled="!f.email.enabled"
                                    class="field"
                                />
                            </label>
                            <label>
                                <span class="input-label">Nama Pengirim</span>
                                <input
                                    v-model="f.email.fromName"
                                    :disabled="!f.email.enabled"
                                    class="field"
                                />
                            </label>
                        </div>
                    </div>
                    <div class="space-y-5 rounded-3xl border bg-white p-6">
                        <div>
                            <h2 class="font-black">Template Email Otomatis</h2>
                            <p class="mt-1 text-sm text-slate-500">
                                Isi Email dibuat otomatis oleh sistem agar
                                konsisten dan informatif.
                            </p>
                        </div>
                        <div
                            v-for="item in [
                                {
                                    title: 'Quotation',
                                    text: 'Nomor quotation, rincian penawaran, total, masa berlaku, dan tautan dokumen.',
                                },
                                {
                                    title: 'Invoice',
                                    text: 'Nomor invoice, berkas terkait, total tagihan, jatuh tempo, status, dan tautan invoice.',
                                },
                                {
                                    title: 'Berkas',
                                    text: 'Nomor berkas, perihal, status terbaru, PIC, dan tautan pelacakan.',
                                },
                            ]"
                            :key="item.title"
                            class="flex gap-3 rounded-2xl bg-slate-50 p-4"
                        >
                            <CheckCircle2
                                class="mt-0.5 h-5 w-5 shrink-0 text-emerald-500"
                            />
                            <div>
                                <h3 class="text-sm font-black">
                                    {{ item.title }}
                                </h3>
                                <p
                                    class="mt-1 text-xs leading-5 text-slate-500"
                                >
                                    {{ item.text }}
                                </p>
                            </div>
                        </div>
                    </div>
                </section>
                <section
                    v-else-if="tab === 'admins'"
                    class="overflow-hidden rounded-3xl border bg-white"
                >
                    <header
                        class="flex items-center justify-between border-b p-6"
                    >
                        <h2 class="font-black">Daftar Administrator</h2>
                        <Link
                            href="/dashboard/pegawai/new"
                            class="rounded-xl bg-pink-500 px-4 py-2 text-sm font-bold text-white"
                            >Tambah Akun</Link
                        >
                    </header>
                    <table class="w-full text-left text-sm">
                        <thead class="bg-slate-50">
                            <tr>
                                <th class="p-4 pl-6">Nama</th>
                                <th>Username / Kontak</th>
                                <th>Role</th>
                                <th>Status</th>
                                <th class="pr-6 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="a in admins" class="border-t">
                                <td class="p-4 pl-6 font-black">
                                    {{ a.fullName }}
                                </td>
                                <td>
                                    <p>@{{ a.username }}</p>
                                    <p class="text-xs text-slate-500">
                                        {{ a.email }}
                                    </p>
                                </td>
                                <td>{{ a.role }}</td>
                                <td>
                                    {{ a.isActive ? "Aktif" : "Tidak Aktif" }}
                                </td>
                                <td class="pr-6 text-right">
                                    <Link
                                        :href="`/dashboard/pegawai/${a.id}/edit`"
                                        class="font-bold text-pink-600"
                                        >Edit</Link
                                    >
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </section>
                <section
                    v-else-if="tab === 'roles'"
                    class="overflow-hidden rounded-3xl border bg-white"
                >
                    <header class="border-b p-6">
                        <h2 class="font-black">Manajemen Role & Hak Akses</h2>
                    </header>
                    <div class="overflow-x-auto">
                        <table class="w-full text-left text-sm">
                            <thead class="bg-slate-50">
                                <tr>
                                    <th class="p-4 pl-6">Role</th>
                                    <th
                                        v-for="key in permissions"
                                        class="text-center capitalize"
                                    >
                                        {{ key }}
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="r in f.roles" class="border-t">
                                    <td class="p-4 pl-6 font-black">
                                        {{ r.name }}
                                    </td>
                                    <td
                                        v-for="key in permissions"
                                        class="text-center"
                                    >
                                        <input
                                            v-model="r.permissions[key]"
                                            type="checkbox"
                                            class="rounded text-pink-500"
                                        />
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>
                <div
                    v-else-if="tab === 'whatsapp'"
                    class="grid gap-6 lg:grid-cols-2"
                >
                    <section class="space-y-4 rounded-3xl border bg-white p-6">
                        <div class="flex items-start justify-between gap-4">
                            <div>
                                <h2 class="flex items-center gap-2 font-black">
                                    <KeyRound
                                        class="h-5 w-5 text-pink-500"
                                    />Fonnte WhatsApp API
                                </h2>
                                <p class="mt-1 text-sm text-slate-500">
                                    Gateway WhatsApp global untuk Quotation,
                                    Invoice, dan Berkas.
                                </p>
                            </div>
                            <button
                                type="button"
                                role="switch"
                                :aria-checked="f.whatsapp.enabled"
                                @click="
                                    f.whatsapp.enabled = !f.whatsapp.enabled
                                "
                                class="inline-flex items-center gap-3 rounded-full border px-3 py-2 text-sm font-black transition"
                                :class="
                                    f.whatsapp.enabled
                                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                        : 'border-slate-200 bg-slate-50 text-slate-500'
                                "
                            >
                                <span
                                    class="relative h-6 w-11 rounded-full transition"
                                    :class="
                                        f.whatsapp.enabled
                                            ? 'bg-emerald-500'
                                            : 'bg-slate-300'
                                    "
                                >
                                    <span
                                        class="absolute top-1 h-4 w-4 rounded-full bg-white shadow transition"
                                        :class="
                                            f.whatsapp.enabled
                                                ? 'left-6'
                                                : 'left-1'
                                        "
                                    />
                                </span>
                                {{
                                    f.whatsapp.enabled ? "Aktif" : "Tidak aktif"
                                }}
                            </button>
                        </div>
                        <p
                            v-if="f.whatsapp.enabled"
                            class="rounded-xl bg-amber-50 px-4 py-3 text-xs font-bold text-amber-700"
                        >
                            Lengkapi token Fonnte, lalu klik Simpan Pengaturan.
                        </p>
                        <select
                            v-model="f.whatsapp.provider"
                            :disabled="!f.whatsapp.enabled"
                            class="field"
                            :class="{ 'opacity-50': !f.whatsapp.enabled }"
                        >
                            <option value="fonnte">Fonnte</option></select
                        ><input
                            v-model="f.whatsapp.endpointUrl"
                            :disabled="!f.whatsapp.enabled"
                            placeholder="Endpoint URL"
                            class="field"
                            :class="{ 'opacity-50': !f.whatsapp.enabled }"
                        /><input
                            v-model="f.whatsapp.apiToken"
                            type="password"
                            :disabled="!f.whatsapp.enabled"
                            placeholder="API Token"
                            class="field"
                            :class="{ 'opacity-50': !f.whatsapp.enabled }"
                        />
                    </section>
                    <section class="space-y-5 rounded-3xl border bg-white p-6">
                        <div>
                            <h2 class="font-black">Pesan WhatsApp Otomatis</h2>
                            <p class="mt-1 text-sm text-slate-500">
                                Fonnte digunakan sebagai gateway untuk seluruh
                                notifikasi dokumen.
                            </p>
                        </div>
                        <div
                            v-for="item in [
                                {
                                    title: 'Quotation diterbitkan',
                                    text: 'Client menerima nomor, judul, total, masa berlaku, dan tautan quotation.',
                                },
                                {
                                    title: 'Invoice dikirim',
                                    text: 'Client menerima total tagihan, jatuh tempo, status, dan tautan invoice.',
                                },
                                {
                                    title: 'Pembaruan berkas',
                                    text: 'Client menerima nomor berkas, perihal, status terbaru, dan tautan pelacakan.',
                                },
                            ]"
                            :key="item.title"
                            class="flex gap-3 rounded-2xl bg-slate-50 p-4"
                        >
                            <MessageSquare
                                class="mt-0.5 h-5 w-5 shrink-0 text-emerald-500"
                            />
                            <div>
                                <h3 class="text-sm font-black">
                                    {{ item.title }}
                                </h3>
                                <p
                                    class="mt-1 text-xs leading-5 text-slate-500"
                                >
                                    {{ item.text }}
                                </p>
                            </div>
                        </div>
                    </section>
                </div>
                <button
                    v-if="tab !== 'admins'"
                    type="submit"
                    :disabled="f.processing"
                    class="mt-6 inline-flex h-12 items-center gap-2 rounded-xl bg-pink-500 px-7 font-black text-white"
                >
                    <Save class="h-5 w-5" />{{
                        f.processing ? "Menyimpan..." : "Simpan Pengaturan"
                    }}
                </button>
            </form>
        </main></AppLayout
    >
</template>
<style scoped>
.field {
    height: 3rem;
    width: 100%;
    border-radius: 0.75rem;
    border: 1px solid #e2e8f0;
    background: #fff;
    padding: 0 1rem;
    font-weight: 600;
}
.input-label {
    margin-bottom: 0.5rem;
    display: block;
    font-size: 0.75rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #64748b;
}
</style>
