<script setup lang="ts">
import { computed, reactive, ref } from "vue";
import { Head, Link, router, usePage } from "@inertiajs/vue3";
import { ArrowLeft, FileDown, BriefcaseBusiness, CheckCircle2, ClockAlert, ListChecks, Users, CalendarDays } from "@lucide/vue";
import AppLayout from "@/Layouts/AppLayout.vue";
import "@/../css/productivity.css";
const page = usePage<any>();
const canViewStaff = computed(() => ["ADMINISTRATOR", "PIMPINAN"].includes(page.props.auth?.user?.role));
const props = defineProps<{ employee: any; periodLabel: string; filters: { start_date: string | null; end_date: string | null; sort: string }; jobs: any[]; tasks: any[]; attendance: any[] }>();
const e = props.employee;
const filter = reactive({ start_date: props.filters.start_date || "", end_date: props.filters.end_date || "", sort: props.filters.sort });
const error = ref("");
const photoUnavailable = ref(false);
const exporting = ref(false);
const exportError = ref("");
const downloadPdf = async () => {
    exporting.value = true;
    exportError.value = "";
    try {
        const { downloadEmployeeKpiPdf } = await import("@/Utils/downloadEmployeeKpiPdf");
        downloadEmployeeKpiPdf({ employee: props.employee, periodLabel: props.periodLabel, filters: props.filters, jobs: props.jobs, tasks: props.tasks, attendance: props.attendance });
    } catch {
        exportError.value = "PDF tidak dapat dibuat. Silakan coba kembali.";
    } finally {
        exporting.value = false;
    }
};
const applyFilter = () => {
    error.value = "";
    if ((filter.start_date && !filter.end_date) || (!filter.start_date && filter.end_date) || (filter.start_date && filter.end_date && filter.start_date > filter.end_date)) {
        error.value = "Pilih tanggal mulai dan akhir yang valid.";
        return;
    }
    if (filter.start_date && filter.end_date) {
        const [sy, sm] = filter.start_date.split("-").map(Number);
        const [ey, em] = filter.end_date.split("-").map(Number);
        if ((ey - sy) * 12 + em - sm > 23) { error.value = "Rentang tanggal maksimal 24 bulan."; return; }
    }
    router.get(window.location.pathname, { ...filter }, { preserveState: false, preserveScroll: true });
};
const resetFilter = () => router.get(window.location.pathname, {}, { preserveState: false, preserveScroll: true });
const completionRate = computed(() => e.completed + e.processing ? Math.round(e.completed / (e.completed + e.processing) * 100) + "%" : "—");
const punctualRate = computed(() => e.workingDays !== null && e.presentDays ? Math.round(Math.max(0, e.presentDays - e.lateDays) / e.presentDays * 100) + "%" : "—");
const cards = computed(() => [
    { label: "Berkas PIC", value: e.totalJobs, note: "Seluruh status", icon: BriefcaseBusiness, color: "blue" },
    { label: "Berkas selesai", value: e.completed, note: "Status saat ini selesai", icon: CheckCircle2, color: "green" },
    { label: "Berkas aktif", value: e.processing, note: `${e.overdue} melewati deadline`, icon: ClockAlert, color: "amber" },
    { label: "Tingkat penyelesaian", value: completionRate.value, note: "Selesai / (selesai + aktif)", icon: ListChecks, color: "violet" },
    { label: "Total tugas", value: e.totalTasks, note: `${e.picTasks} PIC · ${e.witnessTasks} saksi`, icon: Users, color: "slate" },
    { label: "Hadir", value: e.workingDays === null ? "—" : e.presentDays, note: `Hari dengan check-in · ${props.periodLabel}`, icon: CalendarDays, color: "teal" },
    { label: "Terlambat", value: e.workingDays === null ? "—" : e.lateDays, note: "Hari check-in setelah 08.00", icon: ClockAlert, color: "orange" },
    { label: "Tepat waktu", value: punctualRate.value, note: "Hari hadir tidak terlambat / hadir", icon: CheckCircle2, color: "mint" },
]);
const date = (v?: string | null) => v ? new Date(String(v).slice(0, 10) + "T00:00:00").toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : "—";
const time = (v?: string | null) => v ? String(v).includes(" ") ? String(v).split(" ")[1].slice(0, 5) : String(v).slice(0, 5) : "—";
</script>
<template>
<Head :title="`KPI ${employee.fullName || employee.username}`" /><AppLayout><main class="kpi-page mx-auto max-w-[1600px] space-y-5 p-3 sm:p-5">
<div><p class="kpi-muted text-sm">Dashboard / Pegawai / Produktivitas / Detail KPI</p><Link href="/dashboard/productivity" class="kpi-back mt-3 inline-flex items-center gap-2"><ArrowLeft class="h-4 w-4" /> Kembali ke Produktivitas</Link></div>
<header class="kpi-card flex flex-wrap items-center justify-between gap-4"><div class="flex items-center gap-3"><span class="kpi-avatar overflow-hidden"><img v-if="employee.photoPath && !photoUnavailable" :src="employee.photoPath" :alt="`Foto ${employee.fullName || employee.username}`" class="h-full w-full object-cover" @error="photoUnavailable = true" /><template v-else>{{ String(employee.fullName || employee.username || '?').split(/\s+/).slice(0,2).map((x: string) => x[0]).join('').toUpperCase() }}</template></span><div><h1 class="text-2xl font-black">{{ employee.fullName || employee.username }}</h1><p class="kpi-muted mt-1 text-sm">{{ employee.role }} · {{ employee.username }}</p></div></div><div class="flex flex-wrap gap-2"><button type="button" class="kpi-button" :disabled="exporting" @click="downloadPdf"><FileDown class="h-4 w-4" /> {{ exporting ? 'Menyiapkan PDF...' : 'Download PDF' }}</button><Link v-if="canViewStaff" :href="`/dashboard/pegawai/${encodeURIComponent(employee.id)}`" class="kpi-button-secondary">Data Pegawai</Link></div></header>
<p v-if="exportError" role="alert" class="rounded-xl bg-red-50 p-3 text-sm text-red-800">{{ exportError }}</p>
<section class="kpi-card"><h2 class="kpi-title">Periode dan urutan</h2><p class="kpi-muted mt-1 text-sm">Untuk satu hari, pilih tanggal yang sama pada kedua kolom. Maksimal 24 bulan.</p><form @submit.prevent="applyFilter" class="mt-4 flex flex-wrap items-end gap-3"><label>Dari<input v-model="filter.start_date" type="date" class="mt-1" /></label><label>Sampai<input v-model="filter.end_date" type="date" class="mt-1" /></label><label>Urutan tanggal<select v-model="filter.sort" class="mt-1"><option value="desc">Terbaru dulu</option><option value="asc">Terlama dulu</option></select></label><button class="kpi-button">Terapkan</button><button type="button" class="kpi-button-secondary" @click="resetFilter">Reset</button></form><p v-if="error" role="alert" class="mt-2 text-sm text-red-700">{{ error }}</p><p class="kpi-note mt-4">{{ filters.start_date ? `Periode ${periodLabel}. Berkas dan tugas berdasarkan tanggal dibuat; status dan deadline adalah kondisi saat ini.` : `Berkas dan tugas sepanjang waktu; absensi ${periodLabel}.` }} Absensi dibatasi sampai hari ini.</p></section>
<section class="grid grid-cols-2 gap-3 xl:grid-cols-4"><article v-for="card in cards" :key="card.label" class="kpi-card kpi-metric flex items-start gap-3" :class="`kpi-metric--${card.color}`"><span class="kpi-metric-icon grid h-10 w-10 shrink-0 place-items-center rounded-xl"><component :is="card.icon" class="h-5 w-5" /></span><div><p class="kpi-muted text-sm font-semibold">{{ card.label }}</p><p class="kpi-stat mt-1">{{ card.value }}</p><p class="kpi-muted mt-2 text-xs">{{ card.note }}</p></div></article></section>
<section class="grid gap-4 xl:grid-cols-2"><article class="kpi-card"><h2 class="kpi-title">Komposisi Pekerjaan PIC</h2><p class="kpi-muted mt-1 text-sm">Status saat ini; dibatalkan tidak dihitung dalam tingkat penyelesaian.</p><div class="mt-4 grid grid-cols-3 gap-2"><div v-for="item in [{label:'Selesai',value:e.completed},{label:'Aktif',value:e.processing},{label:'Dibatalkan',value:e.cancelled}]" :key="item.label" class="kpi-note"><p class="text-xl font-black">{{ item.value }}</p><p>{{ item.label }}</p></div></div><div v-if="e.completed + e.processing" class="kpi-progress mt-4" aria-hidden="true"><span :style="{width:completionRate}"></span></div></article><article class="kpi-card"><h2 class="kpi-title">Kehadiran {{ periodLabel }}</h2><p class="kpi-muted mt-1 text-sm">Perkiraan Senin–Jumat sejak profil pegawai dibuat dan sampai hari ini.</p><div v-if="e.workingDays !== null" class="mt-4 grid grid-cols-3 gap-2"><div v-for="item in [{label:'Hari kerja',value:e.workingDays},{label:'Hadir',value:e.presentDays},{label:'Belum ada absensi',value:e.absentDays}]" :key="item.label" class="kpi-note"><p class="text-xl font-black">{{ item.value }}</p><p>{{ item.label }}</p></div></div><p v-else class="kpi-muted mt-4 text-sm">Profil absensi belum tersedia.</p><p class="kpi-note mt-4">Belum ada absensi bukan konfirmasi mangkir; libur, cuti, jadwal khusus, dan tanggal masuk kerja belum diperhitungkan.</p></article></section>
<section class="kpi-card"><h2 class="kpi-title">Berkas PIC</h2><p class="kpi-muted mt-1 text-sm">Maksimal 10 berkas berdasarkan tanggal dibuat.</p><div class="mt-4 overflow-x-auto"><table class="kpi-table"><thead><tr><th>Nomor Berkas</th><th>Pekerjaan</th><th>Kategori</th><th>Deadline</th><th>Status</th><th>Aksi</th></tr></thead><tbody><tr v-for="job in jobs" :key="job.jobType + job.id"><td>{{ job.trackingCode || '—' }}</td><td class="font-bold">{{ job.title }}</td><td>{{ job.category }}</td><td>{{ date(job.deadline) }}</td><td><span class="kpi-chip">{{ job.status }}</span></td><td><Link :href="`/dashboard/jobs/${job.jobType}/${job.id}`" class="kpi-back">Detail ↗</Link></td></tr><tr v-if="!jobs.length"><td colspan="6" class="kpi-muted">Belum ada berkas sebagai PIC.</td></tr></tbody></table></div></section>
<div class="grid gap-4 xl:grid-cols-2"><section class="kpi-card"><h2 class="kpi-title">Daftar Tugas</h2><p class="kpi-muted mt-1 text-sm">Maksimal 10 penugasan sesuai urutan tanggal.</p><div v-if="tasks.length" class="mt-3 divide-y divide-stone-100"><div v-for="task in tasks" :key="task.id" class="py-3"><p class="font-bold">{{ task.customTask || task.taskType }}</p><p class="kpi-muted mt-1 text-sm">{{ task.jobTitle || 'Berkas tidak tersedia' }} · {{ date(task.createdAt) }}</p></div></div><p v-else class="kpi-muted mt-4 text-sm">Belum ada tugas.</p></section><section class="kpi-card"><h2 class="kpi-title">Riwayat Absensi</h2><p class="kpi-muted mt-1 text-sm">Catatan untuk {{ periodLabel }}.</p><div v-if="attendance.length" class="mt-3 max-h-80 overflow-auto divide-y divide-stone-100"><div v-for="(record,i) in attendance" :key="i" class="flex flex-wrap justify-between gap-3 py-3 text-sm"><strong>{{ date(record.date) }}</strong><span class="kpi-muted">Masuk {{ time(record.checkIn) }} · Pulang {{ time(record.checkOut) }}</span></div></div><p v-else class="kpi-muted mt-4 text-sm">Belum ada catatan absensi periode ini.</p></section></div>
</main></AppLayout>
</template>

<style scoped>
.kpi-metric { border-color: var(--metric-border); background: var(--metric-bg); }
.kpi-metric-icon { color: var(--metric-ink); background: var(--metric-icon); }
.kpi-metric--blue { --metric-bg:#eef5ff; --metric-border:#c3d9f5; --metric-ink:#1b5494; --metric-icon:#d9eafd; }
.kpi-metric--green { --metric-bg:#edf9f0; --metric-border:#bee3c7; --metric-ink:#187441; --metric-icon:#d7f2df; }
.kpi-metric--amber { --metric-bg:#fff7e6; --metric-border:#efd29b; --metric-ink:#875a05; --metric-icon:#ffebbd; }
.kpi-metric--violet { --metric-bg:#f5f0ff; --metric-border:#dfcef6; --metric-ink:#684097; --metric-icon:#e9defb; }
.kpi-metric--slate { --metric-bg:#f0f4f8; --metric-border:#cedce9; --metric-ink:#425a73; --metric-icon:#dfe8f1; }
.kpi-metric--teal { --metric-bg:#eaf9f6; --metric-border:#b7e1da; --metric-ink:#12665b; --metric-icon:#d2f1ea; }
.kpi-metric--orange { --metric-bg:#fff1eb; --metric-border:#f2ccb9; --metric-ink:#a34818; --metric-icon:#ffe2d1; }
.kpi-metric--mint { --metric-bg:#f1f9ea; --metric-border:#cde4bd; --metric-ink:#466e22; --metric-icon:#e3f2d6; }
</style>
