<script setup lang="ts">
import { Head, Link } from "@inertiajs/vue3";
import {
    ArrowRight,
    CalendarDays,
    CheckCircle2,
    Clock3,
    FilePlus2,
    Files,
    LayoutDashboard,
    UserCheck,
    Users,
} from "@lucide/vue";
import AppLayout from "@/Layouts/AppLayout.vue";

const props = defineProps<{
    stats: Record<string, number>;
    deadlines: any[];
    clientCount: number;
    staffCount: number;
    months: any[];
    staffLanding: boolean;
    todayAttendance: any | null;
    user: any;
}>();

const labels: Record<string, string> = {
    total: "Total Berkas",
    processing: "Dalam Proses",
    completed: "Selesai",
    pending: "Pending",
};

const maxMonth = Math.max(1, ...props.months.map((x) => Number(x.incoming)));

const time = (value: string | null) =>
    value
        ? new Date(value).toLocaleTimeString("id-ID", {
              hour: "2-digit",
              minute: "2-digit",
          })
        : "-";
</script>

<template>
    <Head title="Dashboard" />
    <AppLayout>
        <main v-if="staffLanding" class="mx-auto max-w-5xl space-y-6 p-2 sm:p-4">
            <!-- Staff Landing Hero Card -->
            <section
                class="rounded-3xl p-6 text-white shadow-lg transition-all"
                :style="{ background: 'linear-gradient(135deg, var(--primary) 0%, color-mix(in srgb, var(--primary) 80%, black) 100%)' }"
            >
                <p class="text-xs sm:text-sm font-semibold opacity-90">Selamat datang kembali,</p>
                <h1 class="mt-1 text-2xl sm:text-3xl font-black tracking-tight">{{ user.fullName }}</h1>
                <span
                    class="mt-2 inline-block rounded-full bg-white/20 px-3 py-0.5 text-[10px] font-bold uppercase tracking-widest backdrop-blur-md"
                >
                    {{ user.role }}
                </span>

                <div
                    class="mt-6 grid gap-3 rounded-2xl bg-white/15 p-4 sm:p-5 backdrop-blur-sm sm:grid-cols-3 border border-white/20"
                >
                    <div>
                        <p class="text-[10px] font-bold uppercase tracking-wider opacity-80">Jadwal Kerja</p>
                        <p class="mt-1 text-lg sm:text-xl font-black">09:00 - 18:00</p>
                    </div>
                    <div>
                        <p class="text-[10px] font-bold uppercase tracking-wider opacity-80">Masuk</p>
                        <p class="mt-1 text-lg sm:text-xl font-black">
                            {{ time(todayAttendance?.checkIn) }}
                        </p>
                    </div>
                    <div>
                        <p class="text-[10px] font-bold uppercase tracking-wider opacity-80">Pulang</p>
                        <p class="mt-1 text-lg sm:text-xl font-black">
                            {{ time(todayAttendance?.checkOut) }}
                        </p>
                    </div>
                </div>

                <Link
                    href="/dashboard/pegawai/absensi/absenku"
                    class="mt-5 flex h-12 items-center justify-center gap-2 rounded-2xl bg-white font-black shadow-md transition-transform hover:scale-[1.01] active:scale-95 text-slate-900"
                    :style="{ color: 'var(--primary)' }"
                >
                    <UserCheck class="h-5 w-5" />
                    <span>
                        {{
                            todayAttendance?.checkIn
                                ? todayAttendance?.checkOut
                                    ? "Absensi Selesai"
                                    : "Absen Pulang"
                                : "Absen Masuk"
                        }}
                    </span>
                </Link>
            </section>

            <!-- Navigation Shortcuts -->
            <section class="grid gap-4 sm:grid-cols-2">
                <Link
                    href="/dashboard?view=overview"
                    class="group rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:border-[var(--primary)] hover:shadow-md"
                >
                    <LayoutDashboard class="h-9 w-9" :style="{ color: 'var(--primary)' }" />
                    <h2 class="mt-4 text-lg font-black text-slate-900">Dashboard</h2>
                    <p class="mt-1 text-xs sm:text-sm text-slate-500">
                        Buka ringkasan aktivitas dan pekerjaan kantor.
                    </p>
                    <span
                        class="mt-4 inline-flex items-center gap-2 text-xs font-bold transition-transform group-hover:translate-x-1"
                        :style="{ color: 'var(--primary)' }"
                    >
                        <span>Buka Dashboard</span>
                        <ArrowRight class="h-4 w-4" />
                    </span>
                </Link>

                <Link
                    href="/dashboard/pegawai/absensi"
                    class="group rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:border-emerald-500 hover:shadow-md"
                >
                    <Clock3 class="h-9 w-9 text-emerald-500" />
                    <h2 class="mt-4 text-lg font-black text-slate-900">Riwayat Absensi</h2>
                    <p class="mt-1 text-xs sm:text-sm text-slate-500">
                        Lihat check-in, check-out, dan riwayat kehadiran.
                    </p>
                    <span
                        class="mt-4 inline-flex items-center gap-2 text-xs font-bold text-emerald-600 transition-transform group-hover:translate-x-1"
                    >
                        <span>Buka Absensi</span>
                        <ArrowRight class="h-4 w-4" />
                    </span>
                </Link>
            </section>
        </main>

        <!-- Admin Overview Landing -->
        <main v-else class="space-y-6 p-2 sm:p-4">
            <div
                class="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"
            >
                <div>
                    <p class="text-xs font-bold uppercase tracking-wider" :style="{ color: 'var(--primary)' }">
                        Ringkasan Hari Ini
                    </p>
                    <h1 class="text-xl sm:text-2xl font-black text-slate-900">Dashboard Overview</h1>
                </div>
                <div class="flex flex-wrap items-center gap-2">
                    <span
                        class="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-sm"
                    >
                        <CalendarDays class="h-4 w-4 text-slate-400" />
                        <span>
                            {{
                                new Date().toLocaleDateString("id-ID", {
                                    day: "numeric",
                                    month: "long",
                                    year: "numeric",
                                })
                            }}
                        </span>
                    </span>
                    <Link
                        href="/dashboard/jobs/new"
                        class="flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-xs font-bold text-white shadow-md transition-all hover:opacity-90 active:scale-95"
                        :style="{ backgroundColor: 'var(--primary)' }"
                    >
                        <FilePlus2 class="h-4 w-4" />
                        <span>Berkas Baru</span>
                    </Link>
                </div>
            </div>

            <!-- Stats Grid -->
            <section class="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
                <article
                    v-for="(value, key) in stats"
                    :key="key"
                    class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                    <p class="text-xs font-bold uppercase tracking-wider text-slate-500">
                        {{ labels[key] }}
                    </p>
                    <p class="mt-2 text-2xl sm:text-3xl font-black text-slate-900">{{ value }}</p>
                </article>
            </section>

            <!-- Chart & Active Data Section -->
            <section class="grid gap-6 xl:grid-cols-3">
                <article
                    class="rounded-2xl border border-slate-200 bg-white p-5 xl:col-span-2 shadow-sm"
                >
                    <div class="flex items-center justify-between">
                        <div>
                            <h2 class="text-base sm:text-lg font-black text-slate-900">
                                Perkembangan Berkas
                            </h2>
                            <p class="text-xs text-slate-500">
                                Berkas masuk dan selesai 6 bulan terakhir.
                            </p>
                        </div>
                        <Files class="h-5 w-5" :style="{ color: 'var(--primary)' }" />
                    </div>
                    <div
                        class="mt-6 flex h-48 items-end gap-2 sm:gap-4 border-b border-slate-200 px-2"
                    >
                        <div
                            v-for="month in months"
                            :key="month.key"
                            class="flex h-full flex-1 items-end justify-center gap-1"
                        >
                            <div
                                class="w-2/5 rounded-t-md transition-all"
                                :style="{
                                    height: `${Math.max(6, (Number(month.incoming) / maxMonth) * 85)}%`,
                                    backgroundColor: 'var(--primary)',
                                }"
                                :title="`Masuk: ${month.incoming}`"
                            />
                            <div
                                class="w-2/5 rounded-t-md bg-emerald-500 transition-all"
                                :style="{
                                    height: `${Math.max(6, (Number(month.completed) / maxMonth) * 85)}%`,
                                }"
                                :title="`Selesai: ${month.completed}`"
                            />
                        </div>
                    </div>
                    <div
                        class="mt-3 grid grid-cols-6 text-center text-[11px] font-bold text-slate-500"
                    >
                        <span v-for="month in months" :key="month.key">{{
                            month.label
                        }}</span>
                    </div>
                </article>

                <article
                    class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-5"
                >
                    <h2 class="text-base sm:text-lg font-black text-slate-900">Data Aktif</h2>
                    <div class="flex items-center gap-4 rounded-xl border border-slate-100 bg-slate-50/50 p-4">
                        <div class="grid h-10 w-10 place-items-center rounded-xl bg-[var(--primary)]/10" :style="{ color: 'var(--primary)' }">
                            <Users class="h-5 w-5" />
                        </div>
                        <div>
                            <p class="text-xs font-semibold text-slate-500">Total Client</p>
                            <p class="text-2xl font-black text-slate-900">{{ clientCount }}</p>
                        </div>
                    </div>

                    <div class="flex items-center gap-4 rounded-xl border border-slate-100 bg-slate-50/50 p-4">
                        <div class="grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-emerald-600">
                            <UserCheck class="h-5 w-5" />
                        </div>
                        <div>
                            <p class="text-xs font-semibold text-slate-500">Total Pegawai</p>
                            <p class="text-2xl font-black text-slate-900">{{ staffCount }}</p>
                        </div>
                    </div>
                </article>
            </section>

            <!-- Urgent Deadlines Section -->
            <section class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div class="flex items-center gap-2">
                    <CheckCircle2 class="h-5 w-5 text-amber-500" />
                    <h2 class="text-base sm:text-lg font-black text-slate-900">Deadline 7 Hari Ke Depan</h2>
                </div>
                <div class="mt-4 divide-y divide-slate-100">
                    <Link
                        v-for="job in deadlines"
                        :key="job.id"
                        :href="`/dashboard/jobs/${job.id}`"
                        class="flex items-center justify-between py-3 transition-colors hover:bg-slate-50/60 px-2 rounded-lg"
                    >
                        <div>
                            <p class="font-bold text-sm text-slate-800">{{ job.title }}</p>
                            <code class="text-[11px] font-semibold text-slate-500">{{ job.trackingCode }}</code>
                        </div>
                        <span
                            class="rounded-lg bg-amber-50 border border-amber-200 px-3 py-1 text-xs font-bold text-amber-800"
                        >
                            {{ job.deadline }}
                        </span>
                    </Link>
                    <p
                        v-if="!deadlines.length"
                        class="py-8 text-center text-sm text-slate-400"
                    >
                        Tidak ada deadline mendesak.
                    </p>
                </div>
            </section>
        </main>
    </AppLayout>
</template>
