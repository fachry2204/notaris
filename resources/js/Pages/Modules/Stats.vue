<script setup lang="ts">
import { computed } from "vue";
import { Head, Link } from "@inertiajs/vue3";
import {
    AlertTriangle,
    ArrowRight,
    BarChart3,
    CalendarClock,
    CheckCircle2,
    CircleGauge,
    Clock3,
    FileBarChart,
    Files,
    Target,
    TrendingDown,
    TrendingUp,
    Users,
} from "@lucide/vue";
import AppLayout from "@/Layouts/AppLayout.vue";
import JobDateFilter from "@/Components/JobDateFilter.vue";

type JobRow = {
    id: string;
    trackingCode: string;
    title: string;
    deadline?: string | null;
    status: string;
    priority: string;
    clientName?: string | null;
    category: string;
    jobType: string;
    updatedAt?: string | null;
};

const props = defineProps<{
    filters: { start_date: string | null; end_date: string | null };
    stats: any;
    summary: {
        active: number;
        completionRate: number;
        overdue: number;
        dueSoon: number;
        thisMonth: number;
        monthlyGrowth: number;
        averageCompletionDays: number;
        clients: number;
    };
    months: Array<{
        key: string;
        name: string;
        year: string;
        total: number;
        completed: number;
    }>;
    categories: Array<{
        key: string;
        label: string;
        total: number;
        completed: number;
        active: number;
    }>;
    priorities: Array<{ key: string; total: number }>;
    statusDistribution: Array<{
        key: string;
        label: string;
        total: number;
        color: string;
    }>;
    deadlines: JobRow[];
    overdueJobs: JobRow[];
    recentCompleted: JobRow[];
}>();

const maxMonth = computed(() =>
    Math.max(
        1,
        ...props.months.flatMap((month) => [
            Number(month.total),
            Number(month.completed),
        ]),
    ),
);

const totalDistribution = computed(() =>
    props.statusDistribution.reduce((total, item) => total + Number(item.total), 0),
);

const donutBackground = computed(() => {
    if (!totalDistribution.value) return "#e2e8f0";
    let cursor = 0;
    const segments = props.statusDistribution.map((item) => {
        const start = cursor;
        cursor += (Number(item.total) / totalDistribution.value) * 100;
        return `${item.color} ${start}% ${cursor}%`;
    });
    return `conic-gradient(${segments.join(", ")})`;
});

const topCards = computed(() => [
    {
        label: "Total Pekerjaan",
        value: props.stats.total,
        note: `${props.summary.thisMonth} berkas masuk bulan ini`,
        icon: Files,
        tone: "bg-amber-50 text-amber-700",
        href: "/dashboard/jobs",
    },
    {
        label: "Pekerjaan Aktif",
        value: props.summary.active,
        note: `${props.stats.PENDING} pending · ${props.stats.processing} diproses`,
        icon: CircleGauge,
        tone: "bg-sky-50 text-sky-700",
        href: "/dashboard/jobs?status=PROSES",
    },
    {
        label: "Tingkat Penyelesaian",
        value: `${props.summary.completionRate}%`,
        note: `${props.stats.SELESAI} pekerjaan telah selesai`,
        icon: Target,
        tone: "bg-emerald-50 text-emerald-700",
        href: "/dashboard/jobs?status=SELESAI",
    },
    {
        label: "Deadline Terlewat",
        value: props.summary.overdue,
        note: props.summary.overdue ? "Perlu segera ditindaklanjuti" : "Tidak ada pekerjaan terlambat",
        icon: AlertTriangle,
        tone: "bg-red-50 text-red-700",
        href: "/dashboard/jobs",
    },
]);

const priorityMeta: Record<string, { label: string; color: string; bar: string }> = {
    LOW: { label: "Rendah", color: "text-slate-600", bar: "bg-slate-400" },
    MEDIUM: { label: "Sedang", color: "text-sky-700", bar: "bg-sky-500" },
    HIGH: { label: "Tinggi", color: "text-orange-700", bar: "bg-orange-500" },
    URGENT: { label: "Mendesak", color: "text-red-700", bar: "bg-red-500" },
};

const maxPriority = computed(() =>
    Math.max(1, ...props.priorities.map((item) => Number(item.total))),
);

const formatDate = (value?: string | null) => {
    if (!value) return "-";
    return new Date(`${String(value).slice(0, 10)}T00:00:00`).toLocaleDateString(
        "id-ID",
        { day: "2-digit", month: "short", year: "numeric" },
    );
};

const daysUntil = (value?: string | null) => {
    if (!value) return { text: "Tanpa deadline", overdue: false };
    const deadline = new Date(`${String(value).slice(0, 10)}T00:00:00`);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const days = Math.round((deadline.getTime() - today.getTime()) / 86_400_000);
    if (days < 0) return { text: `${Math.abs(days)} hari terlambat`, overdue: true };
    if (days === 0) return { text: "Hari ini", overdue: false };
    return { text: `${days} hari lagi`, overdue: false };
};

const categoryRate = (category: any) =>
    category.total ? Math.round((Number(category.completed) / Number(category.total)) * 100) : 0;

const jobUrl = (job: JobRow) => `/dashboard/jobs/${job.jobType}/${job.id}`;
</script>

<template>
    <Head title="Statistik Pekerjaan" />
    <AppLayout>
        <main class="mx-auto max-w-7xl space-y-5">
            <header class="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
                <div>
                    <p class="text-xs font-black uppercase tracking-[0.18em] text-[var(--primary)]">Analitik Operasional</p>
                    <h1 class="mt-1 text-2xl font-black text-slate-950 sm:text-3xl">Statistik Pekerjaan</h1>
                    <p class="mt-1 text-sm text-slate-500">Pantau kinerja, progres, dan risiko pekerjaan kantor dalam satu tampilan.</p>
                </div>
                <div class="flex flex-wrap gap-2">
                    <JobDateFilter :filters="filters" />
                    <Link href="/dashboard/reports" class="inline-flex h-10 items-center gap-2 rounded-xl bg-[var(--primary)] px-4 text-xs font-black text-white shadow-md">
                        <FileBarChart class="h-4 w-4" /> Buka Laporan
                    </Link>
                </div>
            </header>

            <section class="grid grid-cols-2 gap-3 xl:grid-cols-4">
                <Link
                    v-for="card in topCards"
                    :key="card.label"
                    :href="card.href"
                    class="group rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:p-5"
                >
                    <div class="flex items-start justify-between gap-3">
                        <div>
                            <p class="text-[10px] font-black uppercase tracking-wider text-slate-500">{{ card.label }}</p>
                            <p class="mt-2 text-3xl font-black text-slate-950">{{ card.value }}</p>
                        </div>
                        <span class="grid h-10 w-10 place-items-center rounded-xl" :class="card.tone">
                            <component :is="card.icon" class="h-5 w-5" />
                        </span>
                    </div>
                    <p class="mt-3 hidden text-xs text-slate-400 sm:block">{{ card.note }}</p>
                </Link>
            </section>

            <section class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <article class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-[10px] font-black uppercase tracking-wider text-slate-500">Pertumbuhan Bulanan</p>
                            <p class="mt-1 text-2xl font-black" :class="summary.monthlyGrowth >= 0 ? 'text-emerald-700' : 'text-red-700'">
                                {{ summary.monthlyGrowth > 0 ? '+' : '' }}{{ summary.monthlyGrowth }}%
                            </p>
                        </div>
                        <TrendingUp v-if="summary.monthlyGrowth >= 0" class="h-7 w-7 text-emerald-500" />
                        <TrendingDown v-else class="h-7 w-7 text-red-500" />
                    </div>
                </article>
                <article class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-[10px] font-black uppercase tracking-wider text-slate-500">Rata-rata Penyelesaian</p>
                            <p class="mt-1 text-2xl font-black text-slate-900">{{ summary.averageCompletionDays }} <span class="text-sm text-slate-400">hari</span></p>
                        </div>
                        <Clock3 class="h-7 w-7 text-violet-500" />
                    </div>
                </article>
                <article class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-[10px] font-black uppercase tracking-wider text-slate-500">Deadline 7 Hari</p>
                            <p class="mt-1 text-2xl font-black text-amber-700">{{ summary.dueSoon }}</p>
                        </div>
                        <CalendarClock class="h-7 w-7 text-amber-500" />
                    </div>
                </article>
                <article class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-[10px] font-black uppercase tracking-wider text-slate-500">Total Client</p>
                            <p class="mt-1 text-2xl font-black text-slate-900">{{ summary.clients }}</p>
                        </div>
                        <Users class="h-7 w-7 text-sky-500" />
                    </div>
                </article>
            </section>

            <section class="grid gap-5 xl:grid-cols-3">
                <article class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-2">
                    <div class="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                        <div>
                            <h2 class="text-lg font-black text-slate-950">Tren Pekerjaan Bulanan</h2>
                            <p class="text-xs text-slate-500">Perbandingan pekerjaan masuk dan selesai.</p>
                        </div>
                        <div class="flex items-center gap-4 text-[10px] font-black text-slate-500">
                            <span class="flex items-center gap-1.5"><i class="h-2.5 w-2.5 rounded-sm bg-amber-500" />Masuk</span>
                            <span class="flex items-center gap-1.5"><i class="h-2.5 w-2.5 rounded-sm bg-emerald-500" />Selesai</span>
                        </div>
                    </div>
                    <div class="mt-7 flex h-60 items-end gap-3 border-b border-slate-200 px-1 sm:gap-6">
                        <div v-for="month in months" :key="month.key" class="group flex h-full flex-1 items-end justify-center gap-1.5">
                            <div class="relative w-2/5 rounded-t-lg bg-amber-500 transition group-hover:bg-amber-600" :style="{ height: `${Math.max(4, (Number(month.total) / maxMonth) * 88)}%` }">
                                <span class="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-black text-slate-600">{{ month.total }}</span>
                            </div>
                            <div class="relative w-2/5 rounded-t-lg bg-emerald-500 transition group-hover:bg-emerald-600" :style="{ height: `${Math.max(4, (Number(month.completed) / maxMonth) * 88)}%` }">
                                <span class="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-black text-slate-600">{{ month.completed }}</span>
                            </div>
                        </div>
                    </div>
                    <div class="mt-3 grid grid-cols-6 text-center">
                        <div v-for="month in months" :key="month.key">
                            <p class="text-xs font-black text-slate-600">{{ month.name }}</p>
                            <p class="text-[9px] text-slate-400">{{ month.year }}</p>
                        </div>
                    </div>
                </article>

                <article class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div>
                        <h2 class="text-lg font-black text-slate-950">Distribusi Status</h2>
                        <p class="text-xs text-slate-500">Komposisi seluruh pekerjaan.</p>
                    </div>
                    <div class="mt-6 flex justify-center">
                        <div class="relative h-44 w-44 rounded-full" :style="{ background: donutBackground }">
                            <div class="absolute inset-7 grid place-items-center rounded-full bg-white text-center shadow-inner">
                                <div>
                                    <p class="text-3xl font-black text-slate-950">{{ stats.total }}</p>
                                    <p class="text-[10px] font-black uppercase tracking-wider text-slate-400">Pekerjaan</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="mt-6 grid grid-cols-2 gap-2">
                        <div v-for="item in statusDistribution" :key="item.key" class="rounded-xl bg-slate-50 p-3">
                            <div class="flex items-center gap-2">
                                <i class="h-2.5 w-2.5 rounded-full" :style="{ backgroundColor: item.color }" />
                                <p class="text-[10px] font-bold text-slate-500">{{ item.label }}</p>
                            </div>
                            <p class="mt-1 text-lg font-black text-slate-900">{{ item.total }}</p>
                        </div>
                    </div>
                </article>
            </section>

            <section class="grid gap-5 xl:grid-cols-2">
                <article class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div class="flex items-center justify-between">
                        <div>
                            <h2 class="text-lg font-black text-slate-950">Kinerja per Kategori</h2>
                            <p class="text-xs text-slate-500">Penyelesaian berdasarkan jenis layanan.</p>
                        </div>
                        <BarChart3 class="h-5 w-5 text-[var(--primary)]" />
                    </div>
                    <div class="mt-5 space-y-5">
                        <div v-for="category in categories" :key="category.key">
                            <div class="flex items-end justify-between gap-3">
                                <div>
                                    <p class="text-sm font-black text-slate-800">{{ category.label }}</p>
                                    <p class="mt-0.5 text-[10px] text-slate-400">{{ category.completed }} selesai · {{ category.active }} aktif</p>
                                </div>
                                <div class="text-right">
                                    <p class="text-lg font-black text-slate-900">{{ categoryRate(category) }}%</p>
                                    <p class="text-[9px] uppercase text-slate-400">dari {{ category.total }} berkas</p>
                                </div>
                            </div>
                            <div class="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-100">
                                <div class="h-full rounded-full bg-emerald-500 transition-all" :style="{ width: `${categoryRate(category)}%` }" />
                            </div>
                        </div>
                    </div>
                </article>

                <article class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div class="flex items-center justify-between">
                        <div>
                            <h2 class="text-lg font-black text-slate-950">Distribusi Prioritas</h2>
                            <p class="text-xs text-slate-500">Jumlah pekerjaan berdasarkan tingkat prioritas.</p>
                        </div>
                        <Target class="h-5 w-5 text-violet-500" />
                    </div>
                    <div class="mt-5 space-y-5">
                        <div v-for="item in priorities" :key="item.key">
                            <div class="flex items-center justify-between">
                                <p class="text-xs font-black" :class="priorityMeta[item.key]?.color">{{ priorityMeta[item.key]?.label || item.key }}</p>
                                <p class="text-sm font-black text-slate-900">{{ item.total }}</p>
                            </div>
                            <div class="mt-2 h-3 overflow-hidden rounded-full bg-slate-100">
                                <div class="h-full rounded-full transition-all" :class="priorityMeta[item.key]?.bar" :style="{ width: `${Math.max(item.total ? 6 : 0, (Number(item.total) / maxPriority) * 100)}%` }" />
                            </div>
                        </div>
                    </div>
                </article>
            </section>

            <section class="grid gap-5 xl:grid-cols-2">
                <article class="rounded-2xl border border-red-200 bg-white p-5 shadow-sm">
                    <div class="flex items-start justify-between gap-3">
                        <div>
                            <h2 class="text-lg font-black text-slate-950">Perlu Perhatian</h2>
                            <p class="text-xs text-slate-500">Pekerjaan terlambat dan mendekati deadline.</p>
                        </div>
                        <AlertTriangle class="h-5 w-5 text-red-500" />
                    </div>
                    <div class="mt-4 divide-y divide-slate-100">
                        <Link v-for="job in overdueJobs" :key="`late-${job.jobType}-${job.id}`" :href="jobUrl(job)" class="flex items-center justify-between gap-3 py-3 hover:bg-red-50/60 sm:px-2">
                            <div class="min-w-0">
                                <div class="flex items-center gap-2"><span class="rounded-md bg-red-100 px-2 py-0.5 text-[9px] font-black text-red-700">TERLAMBAT</span><code class="truncate text-[9px] font-bold text-slate-400">{{ job.trackingCode }}</code></div>
                                <p class="mt-1 truncate text-sm font-black text-slate-800">{{ job.title }}</p>
                                <p class="truncate text-xs text-slate-400">{{ job.clientName || 'Tanpa client' }}</p>
                            </div>
                            <div class="shrink-0 text-right"><p class="text-xs font-black text-red-700">{{ daysUntil(job.deadline).text }}</p><p class="mt-1 text-[9px] text-slate-400">{{ formatDate(job.deadline) }}</p></div>
                        </Link>
                        <Link v-for="job in deadlines" :key="`due-${job.jobType}-${job.id}`" :href="jobUrl(job)" class="flex items-center justify-between gap-3 py-3 hover:bg-amber-50/60 sm:px-2">
                            <div class="min-w-0">
                                <div class="flex items-center gap-2"><span class="rounded-md bg-amber-100 px-2 py-0.5 text-[9px] font-black text-amber-700">MENDEKATI</span><code class="truncate text-[9px] font-bold text-slate-400">{{ job.trackingCode }}</code></div>
                                <p class="mt-1 truncate text-sm font-black text-slate-800">{{ job.title }}</p>
                                <p class="truncate text-xs text-slate-400">{{ job.clientName || 'Tanpa client' }}</p>
                            </div>
                            <div class="shrink-0 text-right"><p class="text-xs font-black text-amber-700">{{ daysUntil(job.deadline).text }}</p><p class="mt-1 text-[9px] text-slate-400">{{ formatDate(job.deadline) }}</p></div>
                        </Link>
                        <div v-if="!overdueJobs.length && !deadlines.length" class="py-10 text-center">
                            <CheckCircle2 class="mx-auto h-9 w-9 text-emerald-400" />
                            <p class="mt-2 text-sm font-bold text-slate-500">Tidak ada deadline mendesak.</p>
                        </div>
                    </div>
                </article>

                <article class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div class="flex items-start justify-between gap-3">
                        <div>
                            <h2 class="text-lg font-black text-slate-950">Pekerjaan Selesai Terbaru</h2>
                            <p class="text-xs text-slate-500">Berkas yang baru saja diselesaikan.</p>
                        </div>
                        <CheckCircle2 class="h-5 w-5 text-emerald-500" />
                    </div>
                    <div class="mt-4 divide-y divide-slate-100">
                        <Link v-for="job in recentCompleted" :key="`${job.jobType}-${job.id}`" :href="jobUrl(job)" class="flex items-center justify-between gap-3 py-3 hover:bg-emerald-50/50 sm:px-2">
                            <div class="min-w-0">
                                <div class="flex items-center gap-2"><span class="rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-black text-emerald-700">SELESAI</span><code class="truncate text-[9px] font-bold text-slate-400">{{ job.trackingCode }}</code></div>
                                <p class="mt-1 truncate text-sm font-black text-slate-800">{{ job.title }}</p>
                                <p class="truncate text-xs text-slate-400">{{ job.clientName || 'Tanpa client' }} · {{ job.category }}</p>
                            </div>
                            <p class="shrink-0 text-[10px] font-bold text-slate-400">{{ formatDate(job.updatedAt) }}</p>
                        </Link>
                        <p v-if="!recentCompleted.length" class="py-10 text-center text-sm font-bold text-slate-400">Belum ada pekerjaan selesai.</p>
                    </div>
                    <Link href="/dashboard/jobs/completed" class="mt-4 flex items-center justify-center gap-2 rounded-xl border border-slate-200 py-2.5 text-xs font-black text-slate-700 hover:bg-slate-50">
                        Lihat Semua Berkas Selesai <ArrowRight class="h-4 w-4" />
                    </Link>
                </article>
            </section>
        </main>
    </AppLayout>
</template>
