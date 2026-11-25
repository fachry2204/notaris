<script setup lang="ts">
import { computed, onBeforeUnmount, reactive, ref } from "vue";
import { Head, Link, router, usePage } from "@inertiajs/vue3";
import { ArrowRight, BriefcaseBusiness, CheckCircle2, ClockAlert, Users } from "@lucide/vue";
import AppLayout from "@/Layouts/AppLayout.vue";
import "@/../css/productivity.css";
import PageHeader from "@/Components/DesignSystem/PageHeader.vue";
const page = usePage<any>();
const canExportAll = computed(() => ["ADMINISTRATOR", "PIMPINAN"].includes(page.props.auth?.user?.role));
const props = defineProps<{ staff: any[]; periodLabel: string; filters: { start_date: string | null; end_date: string | null; sort: string } }>();
const filter = reactive({ start_date: props.filters.start_date || "", end_date: props.filters.end_date || "", sort: props.filters.sort });
const error = ref("");
const submit = () => {
    error.value = "";
    if ((filter.start_date && !filter.end_date) || (!filter.start_date && filter.end_date) || (filter.start_date && filter.start_date > filter.end_date)) { error.value = "Pilih tanggal mulai dan akhir yang valid."; return; }
    if (filter.start_date && filter.end_date) {
        const [sy, sm] = filter.start_date.split("-").map(Number);
        const [ey, em] = filter.end_date.split("-").map(Number);
        if ((ey - sy) * 12 + em - sm > 23) { error.value = "Rentang tanggal maksimal 24 bulan."; return; }
    }
    router.get(window.location.pathname, { ...filter }, { preserveState: false, preserveScroll: true });
};
const reset = () => router.get(window.location.pathname, {}, { preserveState: false, preserveScroll: true });
const detailUrl = (id: string) => {
    const params = new URLSearchParams();
    if (props.filters.start_date && props.filters.end_date) {
        params.set("start_date", props.filters.start_date);
        params.set("end_date", props.filters.end_date);
    }
    const query = params.toString();
    return `/dashboard/productivity/${encodeURIComponent(id)}${query ? `?${query}` : ""}`;
};
const selectedDivision = ref("");
const divisions = computed(() => [...new Set(props.staff.map(s => String(s.division || "").trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b, "id")));
const batchEmployees = computed(() => selectedDivision.value ? props.staff.filter(s => s.division === selectedDivision.value) : props.staff);
const batchRunning = ref(false);
const batchProgress = ref(0);
const batchMessage = ref("");
const batchError = ref("");
let batchAbort: AbortController | null = null;
onBeforeUnmount(() => batchAbort?.abort());
const cancelBatch = () => batchAbort?.abort();
const exportAll = async () => {
    if (batchRunning.value || !canExportAll.value || !batchEmployees.value.length) return;
    batchRunning.value = true; batchProgress.value = 0; batchError.value = ""; batchMessage.value = "Menyiapkan laporan...";
    const controller = new AbortController(); batchAbort = controller;
    try {
        const [{ createEmployeeKpiPdf }, { zipSync }] = await Promise.all([import("@/Utils/downloadEmployeeKpiPdf"), import("fflate")]);
        const files: Record<string, Uint8Array> = {};
        for (let i = 0; i < batchEmployees.value.length; i++) {
            if (controller.signal.aborted) throw new DOMException("Dibatalkan", "AbortError");
            const employee = batchEmployees.value[i];
            batchMessage.value = `Menyusun laporan ${i + 1} dari ${batchEmployees.value.length}: ${employee.fullName || employee.username}`;
            const params = new URLSearchParams({ report: "1", sort: "desc" });
            if (props.filters.start_date && props.filters.end_date) { params.set("start_date", props.filters.start_date); params.set("end_date", props.filters.end_date); }
            const response = await fetch(`/dashboard/productivity/${encodeURIComponent(employee.id)}?${params}`, { credentials: "same-origin", headers: { Accept: "application/json" }, signal: controller.signal });
            if (!response.ok) throw new Error(`Laporan ${employee.fullName || employee.username} tidak dapat diambil.`);
            const report = await createEmployeeKpiPdf(await response.json(), page.props.branding);
            if (controller.signal.aborted) throw new DOMException("Dibatalkan", "AbortError");
            files[`${String(i + 1).padStart(3, "0")}_${report.filename}`] = new Uint8Array(await report.blob.arrayBuffer());
            batchProgress.value = i + 1;
            await new Promise(resolve => setTimeout(resolve, 0));
        }
        batchMessage.value = "Mengemas file ZIP...";
        await new Promise(resolve => setTimeout(resolve, 0));
        if (controller.signal.aborted) throw new DOMException("Dibatalkan", "AbortError");
        const archive = zipSync(files, { level: 0 });
        const url = URL.createObjectURL(new Blob([archive as BlobPart], { type: "application/zip" }));
        const link = document.createElement("a"); link.href = url;
        link.download = `Laporan_KPI_${selectedDivision.value ? selectedDivision.value.replace(/[^a-zA-Z0-9_-]+/g, "_") : "Pegawai"}_${props.filters.start_date || "semua"}_${props.filters.end_date || "periode"}.zip`;
        document.body.appendChild(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 30000);
        batchMessage.value = `Selesai: ${batchProgress.value} laporan disiapkan.`;
    } catch (error) {
        if (controller.signal.aborted) batchMessage.value = "Pembuatan laporan dibatalkan.";
        else { batchError.value = error instanceof Error ? error.message : "Laporan tidak dapat dibuat."; batchMessage.value = ""; }
    } finally { batchRunning.value = false; batchAbort = null; }
};
const totals = computed(() => ({ jobs: props.staff.reduce((n, s) => n + s.totalJobs, 0), completed: props.staff.reduce((n, s) => n + s.completed, 0), overdue: props.staff.reduce((n, s) => n + s.overdue, 0) }));
const search = ref("");
const currentPage = ref(1);
const filteredStaff = computed(() => props.staff.filter(s => `${s.fullName || ""} ${s.username || ""}`.toLocaleLowerCase("id-ID").includes(search.value.trim().toLocaleLowerCase("id-ID"))));
const pageSize = 10;
const pageCount = computed(() => Math.max(1, Math.ceil(filteredStaff.value.length / pageSize)));
const visibleStaff = computed(() => filteredStaff.value.slice((currentPage.value - 1) * pageSize, currentPage.value * pageSize));
const initials = (s: any) => String(s.fullName || s.username || "?").split(/\s+/).slice(0, 2).map((x: string) => x[0]).join("").toUpperCase();
const rate = (s: any) => s.completed + s.processing ? Math.round(s.completed / (s.completed + s.processing) * 100) + "%" : "—";
</script>
<template>
<Head title="Produktivitas Karyawan" /><AppLayout><main class="kpi-page mx-auto max-w-[1600px] space-y-5 p-3 sm:p-5">
<header><p class="kpi-muted text-sm">Dashboard / Pegawai / Produktivitas</p><h1 class="mt-2 text-2xl font-black">Produktivitas Karyawan</h1><p class="kpi-muted mt-1 text-sm">Pantau berkas PIC, penugasan, dan absensi pegawai.</p></header>
<section v-if="canExportAll" class="kpi-card"><div class="flex flex-wrap items-center justify-between gap-3"><div><h2 class="kpi-title">Laporan KPI seluruh pegawai</h2><p class="kpi-muted mt-1 text-sm">Unduh {{ batchEmployees.length }} laporan individual dalam satu file ZIP, sesuai periode yang diterapkan.</p></div><div class="flex flex-wrap gap-2"><label>Divisi<select v-model="selectedDivision" :disabled="batchRunning" class="mt-1"><option value="">Semua divisi</option><option v-for="division in divisions" :key="division" :value="division">{{ division }}</option></select></label><button type="button" class="kpi-button" :disabled="batchRunning || !batchEmployees.length" @click="exportAll">{{ batchRunning ? 'Menyiapkan laporan...' : 'Download semua PDF' }}</button><button v-if="batchRunning" type="button" class="kpi-button-secondary" @click="cancelBatch">Batalkan</button></div></div><div v-if="batchRunning" class="mt-3"><progress class="w-full" :value="batchProgress" :max="batchEmployees.length" :aria-label="`Progres ${batchProgress} dari ${batchEmployees.length}`"></progress></div><p v-if="batchMessage" role="status" class="kpi-muted mt-2 text-sm">{{ batchMessage }}</p><p v-if="batchError" role="alert" class="mt-2 text-sm text-red-700">{{ batchError }}</p></section>
<section class="kpi-card"><h2 class="kpi-title">Filter periode dan urutan</h2><p class="kpi-muted mt-1 text-sm">Maksimal 24 bulan; pilih tanggal yang sama untuk satu hari.</p><form class="mt-4 flex flex-wrap items-end gap-3" @submit.prevent="submit"><label>Dari<input v-model="filter.start_date" type="date" class="mt-1" /></label><label>Sampai<input v-model="filter.end_date" type="date" class="mt-1" /></label><label>Urutkan pegawai<select v-model="filter.sort" class="mt-1"><option value="name">Nama A–Z</option><option value="newest">Tanggal akun terbaru</option><option value="oldest">Tanggal akun terlama</option></select></label><button class="kpi-button">Terapkan</button><button type="button" class="kpi-button-secondary" @click="reset">Reset</button></form><p v-if="error" role="alert" class="mt-2 text-sm text-red-700">{{ error }}</p><p class="kpi-note mt-4">{{ filters.start_date ? `Periode ${periodLabel}. ` : `Berkas dan tugas sepanjang waktu; absensi ${periodLabel}. ` }}Berkas dan tugas berdasarkan tanggal dibuat; status dan deadline adalah kondisi saat ini. Absensi berdasarkan tanggal hadir dan dibatasi sampai hari ini.</p></section>
<section class="grid grid-cols-2 gap-3 xl:grid-cols-4"><article v-for="item in [{label:'Pegawai',value:staff.length,icon:Users},{label:'Berkas PIC',value:totals.jobs,icon:BriefcaseBusiness},{label:'Berkas Selesai',value:totals.completed,icon:CheckCircle2},{label:'Lewat Deadline',value:totals.overdue,icon:ClockAlert}]" :key="item.label" class="kpi-card flex items-center gap-4"><span class="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-amber-50 text-amber-700"><component :is="item.icon" class="h-5 w-5" /></span><div><p class="kpi-muted text-sm font-semibold">{{ item.label }}</p><p class="kpi-stat mt-1">{{ item.value }}</p></div></article></section>
<section class="kpi-card"><div class="flex flex-wrap items-center justify-between gap-3"><div><h2 class="kpi-title">Statistik per Pegawai</h2><p class="kpi-muted mt-1 text-sm">Pilih pegawai untuk melihat detail KPI.</p></div><label><span class="sr-only">Cari pegawai</span><input v-model="search" type="search" placeholder="Cari pegawai" @input="currentPage = 1" /></label></div>
<div class="mt-4 overflow-x-auto"><table class="kpi-table"><thead><tr><th>Pegawai</th><th>Berkas PIC</th><th>Selesai</th><th>Aktif</th><th>Tugas</th><th>Penyelesaian</th><th>Kehadiran</th><th>Deadline</th><th>Aksi</th></tr></thead><tbody><tr v-for="s in visibleStaff" :key="s.id"><td><div class="flex items-center gap-3"><span class="kpi-avatar">{{ initials(s) }}</span><div><strong>{{ s.fullName || s.username }}</strong><p class="kpi-muted mt-1 text-xs">{{ s.role }}</p></div></div></td><td>{{ s.totalJobs }}</td><td>{{ s.completed }}</td><td>{{ s.processing }}</td><td>{{ s.totalTasks }}</td><td><strong>{{ rate(s) }}</strong><div v-if="rate(s) !== '—'" class="kpi-progress mt-2 w-24"><span :style="{width:rate(s)}"></span></div></td><td>{{ s.workingDays === null ? 'Profil absensi belum tersedia' : `${s.presentDays} hari hadir · ${s.lateDays} terlambat` }}</td><td><span class="kpi-chip" :class="{'kpi-chip-alert':s.overdue > 0}">{{ s.overdue }} lewat</span></td><td><Link :href="detailUrl(s.id)" class="kpi-button-secondary">Detail KPI</Link></td></tr><tr v-if="!visibleStaff.length"><td colspan="9" class="kpi-muted text-center">Tidak ada pegawai yang cocok.</td></tr></tbody></table></div>
<div class="kpi-note mt-4">Penyelesaian = selesai ÷ (selesai + aktif). Berkas yang dibatalkan tidak dihitung dalam persentase.</div><div class="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm"><span class="kpi-muted">{{ filteredStaff.length }} pegawai · Halaman {{ currentPage }} dari {{ pageCount }}</span><div class="flex gap-2"><button class="kpi-button-secondary disabled:opacity-40" :disabled="currentPage <= 1" @click="currentPage--">Sebelumnya</button><button class="kpi-button-secondary disabled:opacity-40" :disabled="currentPage >= pageCount" @click="currentPage++">Berikutnya</button></div></div></section>
</main></AppLayout>
</template>
