<script setup lang="ts">
import { computed, reactive, ref } from "vue";
import { Head, Link, router } from "@inertiajs/vue3";
import { ArrowRight, BriefcaseBusiness, CheckCircle2, ClockAlert, Users } from "@lucide/vue";
import AppLayout from "@/Layouts/AppLayout.vue";
import PageHeader from "@/Components/DesignSystem/PageHeader.vue";
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
const totals = computed(() => ({ jobs: props.staff.reduce((n, s) => n + s.totalJobs, 0), completed: props.staff.reduce((n, s) => n + s.completed, 0), overdue: props.staff.reduce((n, s) => n + s.overdue, 0) }));
const rate = (s: any) => s.completed + s.processing ? Math.round(s.completed / (s.completed + s.processing) * 100) + "%" : "—";
</script>
<template>
    <Head title="Produktivitas Karyawan" /><AppLayout><main class="mx-auto max-w-7xl space-y-6 p-4">
        <PageHeader hide-mobile-icon title="Produktivitas Karyawan" section="Pegawai / Produktivitas" :description="filters.start_date ? `Ringkasan periode ${periodLabel}.` : `Berkas PIC dan tugas sepanjang waktu · absensi ${periodLabel}.`" />
        <section class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 class="font-black">Filter periode dan urutan</h2><p class="mt-1 text-xs text-slate-500">Untuk satu hari, pilih tanggal yang sama pada kedua kolom. Maksimal 24 bulan.</p>
            <form @submit.prevent="submit" class="mt-4 flex flex-wrap items-end gap-3">
                <label class="text-xs font-bold text-slate-600">Dari<input v-model="filter.start_date" type="date" class="mt-1 block rounded-xl border-slate-200 text-sm" /></label>
                <label class="text-xs font-bold text-slate-600">Sampai<input v-model="filter.end_date" type="date" class="mt-1 block rounded-xl border-slate-200 text-sm" /></label>
                <label class="text-xs font-bold text-slate-600">Urutkan pegawai<select v-model="filter.sort" class="mt-1 block rounded-xl border-slate-200 text-sm"><option value="name">Nama A–Z</option><option value="newest">Tanggal akun terbaru</option><option value="oldest">Tanggal akun terlama</option></select></label>
                <button type="submit" class="rounded-xl bg-[var(--primary)] px-4 py-2.5 text-sm font-bold text-white">Terapkan</button><button type="button" @click="reset" class="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600">Reset</button>
            </form><p v-if="error" role="alert" class="mt-2 text-xs text-red-600">{{ error }}</p>
            <p class="mt-3 text-xs text-slate-500">Berkas dan tugas difilter berdasarkan tanggal dibuat; status dan deadline adalah kondisi saat ini. Absensi dihitung menurut tanggal hadir dan dibatasi sampai hari ini.</p>
        </section>
        <section class="grid grid-cols-2 gap-3 lg:grid-cols-4"><article v-for="item in [{label:'Pegawai',value:staff.length,icon:Users},{label:'Berkas PIC',value:totals.jobs,icon:BriefcaseBusiness},{label:'Berkas selesai',value:totals.completed,icon:CheckCircle2},{label:'Lewat deadline',value:totals.overdue,icon:ClockAlert}]" :key="item.label" class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div class="flex justify-between gap-2 text-slate-500"><span class="text-xs font-bold uppercase">{{ item.label }}</span><component :is="item.icon" class="h-5 w-5 text-[var(--primary)]" /></div><p class="mt-3 text-3xl font-black text-slate-900">{{ item.value }}</p></article></section>
        <div><h2 class="text-lg font-black">Statistik per pegawai</h2><p class="text-xs text-slate-500">Pilih pegawai untuk melihat rincian dan cara perhitungan.</p></div>
        <div v-if="staff.length" class="grid gap-4 md:grid-cols-2"><Link v-for="s in staff" :key="s.id" :href="detailUrl(s.id)" class="group rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-[var(--primary)] hover:shadow-md"><div class="flex items-center justify-between gap-3"><div><h3 class="text-lg font-black text-slate-900">{{ s.fullName || s.username }}</h3><p class="text-xs font-bold text-slate-500">{{ s.role }}</p></div><ArrowRight class="h-5 w-5 text-[var(--primary)]" /></div><div class="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4"><div v-for="item in [{label:'Selesai',value:s.completed},{label:'Aktif',value:s.processing},{label:'Tugas',value:s.totalTasks},{label:'Penyelesaian',value:rate(s)}]" :key="item.label" class="rounded-xl bg-slate-50 p-3"><p class="text-[10px] font-bold uppercase text-slate-500">{{ item.label }}</p><p class="mt-1 text-xl font-black text-slate-900">{{ item.value }}</p></div></div><p class="mt-4 text-xs text-slate-500">{{ s.overdue }} lewat deadline · {{ s.workingDays === null ? '—' : s.presentDays }} hari hadir · {{ s.workingDays === null ? '—' : s.lateDays }} hari terlambat<span v-if="s.workingDays === null"> · profil absensi belum tersedia</span></p><p class="mt-3 text-right text-xs font-bold text-[var(--primary)]">Lihat detail KPI</p></Link></div><p v-else class="rounded-2xl bg-white p-6 text-sm text-slate-500">Belum ada data pegawai.</p>
    </main></AppLayout>
</template>
