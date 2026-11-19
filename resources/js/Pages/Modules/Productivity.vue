<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";
import { Head, Link } from "@inertiajs/vue3";
import {
    Activity,
    BriefcaseBusiness,
    CheckCircle2,
    ClockAlert,
    Trophy,
    UserCheck,
    Users,
    UserX,
    X,
} from "@lucide/vue";
import AppLayout from "@/Layouts/AppLayout.vue";

defineProps<{
    staff: any[];
    periodLabel: string;
}>();

const selectedStaff = ref<any | null>(null);
const openStatistics = (staff: any) => {
    selectedStaff.value = staff;
};
const closeStatistics = () => {
    selectedStaff.value = null;
};
const closeOnEscape = (event: KeyboardEvent) => {
    if (event.key === "Escape") closeStatistics();
};

onMounted(() => window.addEventListener("keydown", closeOnEscape));
onBeforeUnmount(() => window.removeEventListener("keydown", closeOnEscape));

const statistics = (staff: any) => [
    {
        label: "Berkas Selesai",
        value: staff.completed,
        icon: CheckCircle2,
        color: "bg-emerald-50 text-emerald-700",
    },
    {
        label: "Berkas Diproses",
        value: staff.processing,
        icon: Activity,
        color: "bg-blue-50 text-blue-700",
    },
    {
        label: "Total Berkas PIC",
        value: staff.totalJobs,
        icon: BriefcaseBusiness,
        color: "bg-violet-50 text-violet-700",
    },
    {
        label: "Total Tugas",
        value: staff.totalTasks,
        icon: UserCheck,
        color: "bg-slate-100 text-slate-700",
    },
    {
        label: "Sebagai Saksi",
        value: staff.witnessTasks,
        icon: Users,
        color: "bg-amber-50 text-amber-700",
    },
    {
        label: "Total Terlambat",
        value: staff.lateDays,
        icon: ClockAlert,
        color: "bg-orange-50 text-orange-700",
    },
    {
        label: "Total Tidak Masuk",
        value: staff.absentDays,
        icon: UserX,
        color: "bg-rose-50 text-rose-700",
    },
    {
        label: "Total Hari Hadir",
        value: staff.presentDays,
        icon: UserCheck,
        color: "bg-teal-50 text-teal-700",
    },
];
</script>

<template>
    <Head title="Produktivitas Karyawan" />
    <AppLayout>
        <main class="mx-auto max-w-6xl space-y-6 p-4">
            <div>
                <h1 class="text-2xl font-black">Produktivitas Karyawan</h1>
                <p class="text-sm text-slate-500">
                    Performa pegawai berdasarkan berkas, tugas, dan absensi.
                </p>
                <p class="mt-1 text-xs font-bold text-amber-700">
                    Statistik absensi periode {{ periodLabel }}
                </p>
            </div>

            <div class="grid gap-5 md:grid-cols-2">
                <article
                    v-for="(s, i) in staff"
                    :key="s.id"
                    role="button"
                    tabindex="0"
                    class="group cursor-pointer rounded-3xl border bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-amber-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                    @click="openStatistics(s)"
                    @keydown.enter="openStatistics(s)"
                    @keydown.space.prevent="openStatistics(s)"
                >
                    <div class="flex items-start gap-4">
                        <span
                            class="grid h-14 w-14 shrink-0 place-items-center rounded-2xl"
                            :class="
                                i === 0
                                    ? 'bg-amber-100 text-amber-600'
                                    : 'bg-slate-100 text-amber-700'
                            "
                        >
                            <Trophy v-if="i === 0" />
                            <span v-else class="text-xl font-black">
                                {{ i + 1 }}
                            </span>
                        </span>

                        <div class="min-w-0 flex-1">
                            <h2 class="truncate text-lg font-black text-slate-900">
                                {{ s.fullName || s.username }}
                            </h2>
                            <p class="text-xs font-bold uppercase text-slate-500">
                                {{ s.role }}
                            </p>

                            <div class="mt-5 grid grid-cols-2 gap-3">
                                <div class="rounded-2xl bg-emerald-50 p-4">
                                    <p class="text-[10px] font-black uppercase text-emerald-600">
                                        Selesai
                                    </p>
                                    <p class="text-2xl font-black text-emerald-700">
                                        {{ s.completed }}
                                    </p>
                                </div>
                                <div class="rounded-2xl bg-blue-50 p-4">
                                    <p class="text-[10px] font-black uppercase text-blue-600">
                                        Diproses
                                    </p>
                                    <p class="text-2xl font-black text-blue-700">
                                        {{ s.processing }}
                                    </p>
                                </div>
                            </div>

                            <div class="mt-3 grid grid-cols-3 gap-2">
                                <div class="rounded-xl bg-amber-50 p-3">
                                    <p class="text-[9px] font-black uppercase text-amber-700">
                                        Saksi
                                    </p>
                                    <p class="mt-1 text-lg font-black text-amber-800">
                                        {{ s.witnessTasks }}
                                    </p>
                                </div>
                                <div class="rounded-xl bg-orange-50 p-3">
                                    <p class="text-[9px] font-black uppercase text-orange-700">
                                        Terlambat
                                    </p>
                                    <p class="mt-1 text-lg font-black text-orange-800">
                                        {{ s.lateDays }}
                                    </p>
                                </div>
                                <div class="rounded-xl bg-rose-50 p-3">
                                    <p class="text-[9px] font-black uppercase text-rose-700">
                                        Tidak Masuk
                                    </p>
                                    <p class="mt-1 text-lg font-black text-rose-800">
                                        {{ s.absentDays }}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <Activity
                            class="h-5 w-5 shrink-0 text-amber-600 transition group-hover:scale-110"
                        />
                    </div>
                    <p class="mt-4 text-right text-[11px] font-bold text-slate-400">
                        Klik untuk melihat statistik lengkap
                    </p>
                </article>
            </div>
        </main>

        <Teleport to="body">
            <div
                v-if="selectedStaff"
                role="dialog"
                aria-modal="true"
                aria-label="Statistik pegawai"
                class="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm"
                @click.self="closeStatistics"
            >
                <section
                    class="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"
                >
                    <header
                        class="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5"
                    >
                        <div>
                            <p
                                class="text-[10px] font-black uppercase tracking-[0.2em] text-amber-700"
                            >
                                Statistik Pegawai
                            </p>
                            <h2 class="mt-1 text-2xl font-black text-slate-900">
                                {{ selectedStaff.fullName || selectedStaff.username }}
                            </h2>
                            <p class="mt-1 text-xs font-bold text-slate-500">
                                {{ selectedStaff.role }} · Absensi {{ periodLabel }}
                            </p>
                        </div>
                        <button
                            type="button"
                            aria-label="Tutup statistik"
                            class="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200"
                            @click="closeStatistics"
                        >
                            <X class="h-5 w-5" />
                        </button>
                    </header>

                    <div class="min-h-0 flex-1 overflow-y-auto p-6">
                        <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                            <article
                                v-for="item in statistics(selectedStaff)"
                                :key="item.label"
                                class="rounded-2xl p-4"
                                :class="item.color"
                            >
                                <div class="flex items-center justify-between gap-3">
                                    <p class="text-[10px] font-black uppercase tracking-wide">
                                        {{ item.label }}
                                    </p>
                                    <component :is="item.icon" class="h-4 w-4 opacity-70" />
                                </div>
                                <p class="mt-3 text-3xl font-black">
                                    {{ item.value }}
                                </p>
                            </article>
                        </div>

                        <div
                            class="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"
                        >
                            Total tidak masuk dihitung dari jumlah hari kerja Senin–Jumat
                            pada bulan berjalan dikurangi hari hadir, sejak tanggal pegawai
                            terdaftar.
                        </div>
                    </div>

                    <footer
                        class="flex flex-col-reverse gap-2 border-t border-slate-200 bg-slate-50 px-6 py-4 sm:flex-row sm:justify-end"
                    >
                        <button
                            type="button"
                            class="h-10 rounded-xl border border-slate-300 px-5 text-sm font-black text-slate-700 hover:bg-white"
                            @click="closeStatistics"
                        >
                            Tutup
                        </button>
                        <Link
                            :href="`/dashboard/pegawai/${selectedStaff.id}`"
                            class="inline-flex h-10 items-center justify-center rounded-xl bg-[var(--primary)] px-5 text-sm font-black text-white"
                        >
                            Lihat Data Pegawai
                        </Link>
                    </footer>
                </section>
            </div>
        </Teleport>
    </AppLayout>
</template>
