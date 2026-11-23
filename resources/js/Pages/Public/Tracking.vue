<script setup lang="ts">
import { computed } from "vue";
import { Head, Link, useForm, usePage } from "@inertiajs/vue3";
import {
    AlertCircle,
    ArrowRight,
    BriefcaseBusiness,
    CalendarDays,
    CheckCircle2,
    Clock3,
    FileCheck2,
    FileSearch,
    LockKeyhole,
    Mail,
    Phone,
    Search,
    ShieldCheck,
} from "@lucide/vue";

const props = defineProps<{
    results: Array<{ job: any; progress: any[] }>;
    searched: boolean;
    query: string;
    error?: string | null;
}>();

const page = usePage<any>();
const branding = computed(() => page.props.branding || {});
const content = computed(() => branding.value.frontend || {});
const appName = computed(() => branding.value.appName || "Notaris Digital");
const officeName = computed(() => branding.value.officeName || "Kantor Notaris");
const logoUrl = computed(() => branding.value.logoUrl || "");
const form = useForm({ query: props.query || "" });

const search = () =>
    form.post("/cekberkas", {
        preserveScroll: true,
    });

const statusMeta: Record<string, { label: string; className: string }> = {
    PENDING: { label: "Menunggu Diproses", className: "border-amber-200 bg-amber-50 text-amber-700" },
    PROSES: { label: "Sedang Diproses", className: "border-sky-200 bg-sky-50 text-sky-700" },
    REVISI: { label: "Perlu Revisi", className: "border-orange-200 bg-orange-50 text-orange-700" },
    REVISI_PROSES: { label: "Revisi Diproses", className: "border-violet-200 bg-violet-50 text-violet-700" },
    VERIFIKASI: { label: "Dalam Verifikasi", className: "border-indigo-200 bg-indigo-50 text-indigo-700" },
    SELESAI: { label: "Selesai", className: "border-emerald-200 bg-emerald-50 text-emerald-700" },
    CANCELLED: { label: "Dibatalkan", className: "border-rose-200 bg-rose-50 text-rose-700" },
};

const status = (value: string) =>
    statusMeta[value] || {
        label: value || "Belum Diketahui",
        className: "border-slate-200 bg-slate-50 text-slate-600",
    };

const formatDate = (value?: string | null, includeTime = false) => {
    if (!value) return "-";
    const date = new Date(value);
    return date.toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "long",
        year: "numeric",
        ...(includeTime ? { hour: "2-digit", minute: "2-digit" } : {}),
    });
};

const deadlineLabel = (value?: string | null) => {
    if (!value) return { text: "Belum ditentukan", overdue: false };
    const deadline = new Date(`${String(value).slice(0, 10)}T00:00:00`);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const days = Math.round((deadline.getTime() - today.getTime()) / 86_400_000);
    if (days < 0) return { text: `${Math.abs(days)} hari terlewat`, overdue: true };
    if (days === 0) return { text: "Jatuh tempo hari ini", overdue: false };
    return { text: `${days} hari lagi`, overdue: false };
};
</script>

<template>
    <Head title="Cek Status Berkas" />
    <div class="min-h-screen bg-[#f5f0e6] text-slate-900">
        <header class="border-b border-[#d8c9aa] bg-[#0f0e0b] text-[#f7efdf]">
            <div class="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
                <div class="flex min-w-0 items-center gap-3">
                    <img v-if="logoUrl" :src="logoUrl" :alt="appName" class="h-11 w-11 rounded-xl border border-[#4f432e] bg-white object-contain" />
                    <span v-else class="grid h-11 w-11 place-items-center rounded-xl bg-[#c99a3d] text-[#17120a]"><FileCheck2 class="h-6 w-6" /></span>
                    <div class="min-w-0">
                        <p class="truncate font-serif text-base font-black sm:text-lg">{{ appName }}</p>
                        <p class="truncate text-[9px] font-bold uppercase tracking-[0.16em] text-[#9f927e]">{{ officeName }}</p>
                    </div>
                </div>
                <Link href="/login" class="inline-flex h-9 items-center gap-2 rounded-xl border border-[#4f432e] px-3 text-xs font-bold text-[#d8c9aa] transition hover:border-[#c99a3d] hover:text-[#c99a3d]">
                    <LockKeyhole class="h-3.5 w-3.5" /> Login Petugas
                </Link>
            </div>
        </header>

        <main>
            <section class="relative overflow-hidden bg-[#0f0e0b] px-5 pb-28 pt-14 text-[#f7efdf] sm:px-8 sm:pb-32 sm:pt-20">
                <div class="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-[#c99a3d]/10 blur-3xl" />
                <div class="pointer-events-none absolute -bottom-32 -left-24 h-80 w-80 rounded-full bg-[#c99a3d]/5 blur-3xl" />
                <div class="relative mx-auto max-w-4xl text-center">
                    <span class="inline-flex items-center gap-2 rounded-full border border-[#5a4725] bg-[#18150f] px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-[#d7aa4d]">
                        <ShieldCheck class="h-3.5 w-3.5" /> Pelacakan Berkas Client
                    </span>
                    <h1 class="mt-5 font-serif text-3xl font-black leading-tight sm:text-5xl">
                        {{ content.trackingTitle || "Cek Status Berkas Anda" }}
                    </h1>
                    <p class="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-[#a79d8d] sm:text-base">
                        {{ content.trackingSubtitle || "Masukkan nomor berkas, nomor HP, atau email yang terdaftar untuk melihat progres pengurusan berkas Anda." }}
                    </p>

                    <form class="mx-auto mt-8 max-w-3xl rounded-2xl border border-[#5a4725] bg-[#18150f] p-2 shadow-2xl sm:flex" @submit.prevent="search">
                        <div class="relative min-w-0 flex-1">
                            <FileSearch class="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#8d7d63]" />
                            <input
                                v-model="form.query"
                                required
                                autocomplete="off"
                                class="h-14 w-full rounded-xl border-0 bg-transparent pl-12 pr-4 text-sm font-semibold text-[#fff8e9] outline-none placeholder:text-[#716653] focus:ring-0"
                                placeholder="Nomor berkas / nomor HP / email"
                            />
                        </div>
                        <button :disabled="form.processing" class="mt-2 inline-flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-[#c99a3d] px-7 text-sm font-black text-[#17120a] shadow-lg transition hover:bg-[#deb45c] disabled:opacity-60 sm:mt-0 sm:w-auto">
                            <Search class="h-4 w-4" /> {{ form.processing ? "Mencari..." : "Cek Berkas" }}
                        </button>
                    </form>
                    <p v-if="form.errors.query" class="mt-3 text-sm font-bold text-red-300">{{ form.errors.query }}</p>
                    <div class="mt-5 flex flex-wrap justify-center gap-x-6 gap-y-2 text-[11px] text-[#8f826d]">
                        <span class="flex items-center gap-1.5"><FileCheck2 class="h-3.5 w-3.5" /> Contoh: BHM/24072026/0004</span>
                        <span class="flex items-center gap-1.5"><Phone class="h-3.5 w-3.5" /> 0812xxxxxxxx</span>
                        <span class="flex items-center gap-1.5"><Mail class="h-3.5 w-3.5" /> client@email.com</span>
                    </div>
                </div>
            </section>

            <section class="relative z-10 mx-auto -mt-16 max-w-5xl px-5 pb-16 sm:px-8">
                <div v-if="error" class="rounded-2xl border border-red-200 bg-white p-6 text-center shadow-xl">
                    <span class="mx-auto grid h-12 w-12 place-items-center rounded-full bg-red-50 text-red-600"><AlertCircle class="h-6 w-6" /></span>
                    <h2 class="mt-3 text-lg font-black text-slate-900">Berkas Tidak Ditemukan</h2>
                    <p class="mx-auto mt-1 max-w-xl text-sm text-slate-500">{{ error }}</p>
                </div>

                <div v-else-if="searched && results.length" class="space-y-5">
                    <div class="flex flex-col justify-between gap-2 rounded-2xl border border-[#d8c9aa] bg-[#fffdf8] px-5 py-4 shadow-lg sm:flex-row sm:items-center">
                        <div>
                            <p class="text-xs font-black uppercase tracking-wider text-[#9a6b16]">Hasil Pencarian</p>
                            <p class="mt-1 text-sm text-slate-500">Ditemukan {{ results.length }} berkas yang terhubung dengan data Anda.</p>
                        </div>
                        <span class="w-fit rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">Data ditemukan</span>
                    </div>

                    <article v-for="result in results" :key="result.job.id" class="overflow-hidden rounded-3xl border border-[#d8c9aa] bg-[#fffdf8] shadow-xl">
                        <div class="border-b border-[#e6dbc5] bg-[#f7f1e5] p-5 sm:p-7">
                            <div class="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                                <div class="min-w-0">
                                    <code class="rounded-lg bg-[#ede2cd] px-2.5 py-1 text-xs font-black text-[#9a6b16]">{{ result.job.trackingCode }}</code>
                                    <h2 class="mt-3 text-xl font-black text-slate-950 sm:text-2xl">{{ result.job.title }}</h2>
                                    <p class="mt-1 text-sm text-slate-500">{{ result.job.category }} · Client {{ result.job.clientName }}</p>
                                </div>
                                <span class="inline-flex w-fit items-center gap-2 rounded-full border px-4 py-2 text-xs font-black" :class="status(result.job.status).className">
                                    <Clock3 v-if="result.job.status !== 'SELESAI'" class="h-4 w-4" />
                                    <CheckCircle2 v-else class="h-4 w-4" />
                                    {{ status(result.job.status).label }}
                                </span>
                            </div>
                        </div>

                        <div class="grid gap-5 p-5 sm:p-7 lg:grid-cols-3">
                            <section class="space-y-3 lg:col-span-1">
                                <div class="rounded-2xl border border-slate-200 bg-white p-4">
                                    <div class="flex items-center gap-2 text-slate-400"><BriefcaseBusiness class="h-4 w-4" /><p class="text-[10px] font-black uppercase tracking-wider">Jenis Pengurusan</p></div>
                                    <p class="mt-2 text-sm font-black text-slate-800">{{ result.job.pengurusanUntuk ? `${result.job.type} — ${result.job.pengurusanUntuk}` : result.job.type || '-' }}</p>
                                </div>
                                <div class="rounded-2xl border border-slate-200 bg-white p-4">
                                    <div class="flex items-center gap-2 text-slate-400"><CalendarDays class="h-4 w-4" /><p class="text-[10px] font-black uppercase tracking-wider">Tanggal Berkas Masuk</p></div>
                                    <p class="mt-2 text-sm font-black text-slate-800">{{ formatDate(result.job.createdAt) }}</p>
                                </div>
                                <div class="rounded-2xl border p-4" :class="deadlineLabel(result.job.deadline).overdue ? 'border-red-200 bg-red-50' : 'border-slate-200 bg-white'">
                                    <div class="flex items-center gap-2" :class="deadlineLabel(result.job.deadline).overdue ? 'text-red-500' : 'text-slate-400'"><CalendarDays class="h-4 w-4" /><p class="text-[10px] font-black uppercase tracking-wider">Estimasi Deadline</p></div>
                                    <p class="mt-2 text-sm font-black" :class="deadlineLabel(result.job.deadline).overdue ? 'text-red-700' : 'text-slate-800'">{{ formatDate(result.job.deadline) }}</p>
                                    <p class="mt-1 text-xs font-bold" :class="deadlineLabel(result.job.deadline).overdue ? 'text-red-600' : 'text-[#9a6b16]'">{{ deadlineLabel(result.job.deadline).text }}</p>
                                </div>
                            </section>

                            <section class="rounded-2xl border border-slate-200 bg-white p-5 lg:col-span-2">
                                <div class="flex items-center justify-between gap-3">
                                    <div>
                                        <h3 class="font-black text-slate-900">Riwayat Progres Berkas</h3>
                                        <p class="mt-0.5 text-xs text-slate-400">Pembaruan status yang tercatat di sistem.</p>
                                    </div>
                                    <FileCheck2 class="h-5 w-5 text-[#c99a3d]" />
                                </div>
                                <div class="mt-5 space-y-0">
                                    <div v-for="(progress, index) in result.progress" :key="`${progress.createdAt}-${index}`" class="relative flex gap-4 pb-6 last:pb-0">
                                        <div class="relative z-10 grid h-9 w-9 shrink-0 place-items-center rounded-full border-4 border-white shadow-sm" :class="index === result.progress.length - 1 ? 'bg-[#c99a3d] text-white' : 'bg-slate-200 text-slate-500'">
                                            <CheckCircle2 class="h-4 w-4" />
                                        </div>
                                        <div v-if="index < result.progress.length - 1" class="absolute bottom-0 left-[17px] top-8 w-px bg-slate-200" />
                                        <div class="min-w-0 pt-1">
                                            <p class="text-sm font-black text-slate-800">{{ status(progress.statusAfter).label }}</p>
                                            <p class="mt-1 text-[11px] text-slate-400">{{ formatDate(progress.createdAt, true) }}</p>
                                            <p v-if="progress.description" class="mt-2 whitespace-pre-line break-words text-sm text-slate-600">{{ progress.description }}</p>
                                        </div>
                                    </div>
                                </div>
                            </section>
                        </div>
                    </article>
                </div>

                <div v-else-if="!searched" class="grid gap-4 rounded-3xl border border-[#d8c9aa] bg-[#fffdf8] p-6 shadow-xl sm:grid-cols-3 sm:p-8">
                    <div class="text-center">
                        <span class="mx-auto grid h-11 w-11 place-items-center rounded-xl bg-amber-50 text-amber-700"><Search class="h-5 w-5" /></span>
                        <h3 class="mt-3 text-sm font-black">Masukkan Data</h3>
                        <p class="mt-1 text-xs leading-relaxed text-slate-500">Gunakan nomor berkas, nomor HP, atau email terdaftar.</p>
                    </div>
                    <div class="text-center">
                        <span class="mx-auto grid h-11 w-11 place-items-center rounded-xl bg-sky-50 text-sky-700"><FileSearch class="h-5 w-5" /></span>
                        <h3 class="mt-3 text-sm font-black">Temukan Berkas</h3>
                        <p class="mt-1 text-xs leading-relaxed text-slate-500">Sistem akan mencari seluruh berkas yang sesuai.</p>
                    </div>
                    <div class="text-center">
                        <span class="mx-auto grid h-11 w-11 place-items-center rounded-xl bg-emerald-50 text-emerald-700"><ArrowRight class="h-5 w-5" /></span>
                        <h3 class="mt-3 text-sm font-black">Pantau Progres</h3>
                        <p class="mt-1 text-xs leading-relaxed text-slate-500">Lihat status dan riwayat progres terbaru tanpa login.</p>
                    </div>
                </div>

                <div class="mt-6 flex items-start gap-3 rounded-2xl border border-[#d8c9aa] bg-[#efe5d2] p-4 text-xs leading-relaxed text-[#705d3e]">
                    <ShieldCheck class="mt-0.5 h-5 w-5 shrink-0" />
                    <p><strong>Privasi terjaga.</strong> Halaman ini hanya menampilkan informasi progres berkas. Nama client disamarkan dan catatan internal kantor tidak ditampilkan.</p>
                </div>
            </section>
        </main>
    </div>
</template>
