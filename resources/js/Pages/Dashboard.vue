<script setup lang="ts">
import { computed } from "vue";
import { Head, Link } from "@inertiajs/vue3";
import {
    AlertTriangle,
    ArrowRight,
    Banknote,
    CalendarClock,
    CalendarDays,
    CheckCircle2,
    CircleDollarSign,
    Clock3,
    FilePlus2,
    Files,
    LayoutDashboard,
    ReceiptText,
    UserCheck,
    Users,
    WalletCards,
} from "@lucide/vue";
import AppLayout from "@/Layouts/AppLayout.vue";
import JobDateFilter from "@/Components/JobDateFilter.vue";

type DashboardJob = {
    id: string;
    trackingCode: string;
    title: string;
    status: string;
    deadline?: string | null;
    createdAt?: string | null;
    clientName?: string | null;
    category: string;
    jobType: string;
};

const props = defineProps<{
    filters: { start_date: string | null; end_date: string | null };
    stats: Record<string, number>;
    deadlines: DashboardJob[];
    overdueJobs: DashboardJob[];
    recentJobs: DashboardJob[];
    alerts: { overdueJobs: number; incompleteFees: number };
    clientCount: number;
    staffCount: number;
    months: Array<{ key: string; label: string; incoming: number; completed: number }>;
    attendanceToday: {
        present: number;
        late: number;
        notCheckedOut: number;
        totalStaff: number;
    };
    canViewFinance: boolean;
    invoiceSummary: {
        outstandingCount: number;
        outstandingAmount: number;
        overdueCount: number;
        paidThisMonth: number;
    } | null;
    recentPayments: Array<{
        id: string;
        amount: number;
        date: string;
        description?: string | null;
        invoiceId?: string | null;
        invoiceNumber?: string | null;
    }>;
    staffLanding: boolean;
    todayAttendance: any | null;
    user: any;
}>();

const maxMonth = computed(() =>
    Math.max(
        1,
        ...props.months.flatMap((month) => [
            Number(month.incoming),
            Number(month.completed),
        ]),
    ),
);

const statCards = computed(() => [
    {
        label: "Total Berkas",
        value: props.stats.total ?? 0,
        note: "Seluruh berkas terdaftar",
        icon: Files,
        tone: "text-amber-700 bg-amber-50",
        href: "/dashboard/jobs",
    },
    {
        label: "Menunggu",
        value: props.stats.pending ?? 0,
        note: "Belum mulai diproses",
        icon: Clock3,
        tone: "text-orange-700 bg-orange-50",
        href: "/dashboard/jobs?status=PENDING",
    },
    {
        label: "Dalam Proses",
        value: props.stats.processing ?? 0,
        note: "Sedang ditangani",
        icon: CalendarClock,
        tone: "text-sky-700 bg-sky-50",
        href: "/dashboard/jobs?status=PROSES",
    },
    {
        label: "Selesai",
        value: props.stats.completed ?? 0,
        note: "Berkas telah selesai",
        icon: CheckCircle2,
        tone: "text-emerald-700 bg-emerald-50",
        href: "/dashboard/jobs?status=SELESAI",
    },
]);

const parseDate = (value?: string | null) => {
    if (!value) return null;
    return new Date(`${String(value).slice(0, 10)}T00:00:00`);
};

const formatDate = (value?: string | null, short = false) => {
    const date = parseDate(value);
    if (!date || Number.isNaN(date.getTime())) return "-";
    return date.toLocaleDateString("id-ID", {
        day: "2-digit",
        month: short ? "short" : "long",
        year: "numeric",
    });
};

const formatCurrency = (value: number | string | null | undefined) =>
    new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0,
    }).format(Number(value ?? 0));

const deadlineDistance = (value?: string | null) => {
    const deadline = parseDate(value);
    if (!deadline) return { label: "Tanpa deadline", overdue: false };
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const days = Math.round((deadline.getTime() - today.getTime()) / 86_400_000);
    if (days < 0) return { label: `${Math.abs(days)} hari terlambat`, overdue: true };
    if (days === 0) return { label: "Jatuh tempo hari ini", overdue: false };
    return { label: `${days} hari lagi`, overdue: false };
};

const jobUrl = (job: DashboardJob) =>
    `/dashboard/jobs/${job.jobType}/${job.id}`;

const statusClass = (status?: string) => {
    const normalized = String(status ?? "").toUpperCase();
    if (normalized === "SELESAI") return "border-emerald-200 bg-emerald-50 text-emerald-700";
    if (["PROSES", "REVISI", "REVISI_PROSES", "VERIFIKASI"].includes(normalized))
        return "border-sky-200 bg-sky-50 text-sky-700";
    return "border-amber-200 bg-amber-50 text-amber-700";
};

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
            <section
                class="rounded-3xl p-6 text-white shadow-lg"
                :style="{
                    background:
                        'linear-gradient(135deg, var(--primary) 0%, color-mix(in srgb, var(--primary) 72%, black) 100%)',
                }"
            >
                <p class="text-sm font-semibold opacity-90">Selamat datang kembali,</p>
                <h1 class="mt-1 text-2xl font-black tracking-tight sm:text-3xl">
                    {{ user.fullName }}
                </h1>
                <span
                    class="mt-2 inline-block rounded-full bg-white/20 px-3 py-1 text-[10px] font-bold uppercase tracking-widest"
                >
                    {{ user.role }}
                </span>

                <div
                    class="mt-6 grid gap-3 rounded-2xl border border-white/20 bg-white/15 p-4 backdrop-blur-sm sm:grid-cols-3 sm:p-5"
                >
                    <div>
                        <p class="text-[10px] font-bold uppercase tracking-wider opacity-80">Jadwal Kerja</p>
                        <p class="mt-1 text-xl font-black">09:00 - 18:00</p>
                    </div>
                    <div>
                        <p class="text-[10px] font-bold uppercase tracking-wider opacity-80">Masuk</p>
                        <p class="mt-1 text-xl font-black">{{ time(todayAttendance?.checkIn) }}</p>
                    </div>
                    <div>
                        <p class="text-[10px] font-bold uppercase tracking-wider opacity-80">Pulang</p>
                        <p class="mt-1 text-xl font-black">{{ time(todayAttendance?.checkOut) }}</p>
                    </div>
                </div>

                <Link
                    href="/dashboard/pegawai/absensi/absenku"
                    class="mt-5 flex h-12 items-center justify-center gap-2 rounded-2xl bg-white font-black shadow-md transition hover:-translate-y-0.5"
                    :style="{ color: 'var(--primary)' }"
                >
                    <UserCheck class="h-5 w-5" />
                    {{
                        todayAttendance?.checkIn
                            ? todayAttendance?.checkOut
                                ? "Absensi Selesai"
                                : "Absen Pulang"
                            : "Absen Masuk"
                    }}
                </Link>
            </section>

            <section class="grid gap-4 sm:grid-cols-2">
                <Link
                    href="/dashboard?view=overview"
                    class="group rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-[var(--primary)] hover:shadow-md"
                >
                    <LayoutDashboard class="h-9 w-9" :style="{ color: 'var(--primary)' }" />
                    <h2 class="mt-4 text-lg font-black text-slate-900">Ringkasan Kantor</h2>
                    <p class="mt-1 text-sm text-slate-500">Pantau pekerjaan, deadline, dan aktivitas terbaru.</p>
                    <span class="mt-4 inline-flex items-center gap-2 text-xs font-bold" :style="{ color: 'var(--primary)' }">
                        Buka Dashboard <ArrowRight class="h-4 w-4" />
                    </span>
                </Link>
                <Link
                    href="/dashboard/pegawai/absensi"
                    class="group rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-emerald-500 hover:shadow-md"
                >
                    <Clock3 class="h-9 w-9 text-emerald-500" />
                    <h2 class="mt-4 text-lg font-black text-slate-900">Riwayat Absensi</h2>
                    <p class="mt-1 text-sm text-slate-500">Lihat check-in, check-out, dan riwayat kehadiran.</p>
                    <span class="mt-4 inline-flex items-center gap-2 text-xs font-bold text-emerald-600">
                        Buka Absensi <ArrowRight class="h-4 w-4" />
                    </span>
                </Link>
            </section>
        </main>

        <main v-else class="space-y-5 p-2 sm:p-4">
            <header class="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
                <div>
                    <p class="text-xs font-bold uppercase tracking-[0.18em]" :style="{ color: 'var(--primary)' }">
                        Ringkasan Operasional
                    </p>
                    <h1 class="mt-1 text-2xl font-black text-slate-950 sm:text-3xl">Dashboard Overview</h1>
                    <p class="mt-1 text-sm text-slate-500">
                        Pantau operasional kantor dan hal yang membutuhkan perhatian.
                    </p>
                </div>
                <div class="flex flex-wrap items-center gap-2">
                    <JobDateFilter :filters="filters" />
                    <Link
                        href="/dashboard/jobs/new"
                        class="flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold text-white shadow-md transition hover:-translate-y-0.5"
                        :style="{ backgroundColor: 'var(--primary)' }"
                    >
                        <FilePlus2 class="h-4 w-4" /> Berkas Baru
                    </Link>
                </div>
            </header>

            <section class="grid grid-cols-2 gap-3 xl:grid-cols-4">
                <Link
                    v-for="card in statCards"
                    :key="card.label"
                    :href="card.href"
                    class="group rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:p-5"
                >
                    <div class="flex items-start justify-between gap-3">
                        <div>
                            <p class="text-[11px] font-bold uppercase tracking-wider text-slate-500">{{ card.label }}</p>
                            <p class="mt-2 text-3xl font-black text-slate-950">{{ card.value }}</p>
                        </div>
                        <span class="grid h-10 w-10 place-items-center rounded-xl" :class="card.tone">
                            <component :is="card.icon" class="h-5 w-5" />
                        </span>
                    </div>
                    <p class="mt-3 hidden text-xs text-slate-400 sm:block">{{ card.note }}</p>
                </Link>
            </section>

            <section class="grid gap-3 md:grid-cols-2" :class="canViewFinance ? 'xl:grid-cols-4' : 'xl:grid-cols-3'">
                <Link href="/dashboard/jobs" class="rounded-2xl border border-red-200 bg-red-50 p-4 transition hover:shadow-md">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-[11px] font-bold uppercase tracking-wider text-red-600">Deadline Terlewat</p>
                            <p class="mt-1 text-2xl font-black text-red-800">{{ alerts.overdueJobs }}</p>
                        </div>
                        <AlertTriangle class="h-7 w-7 text-red-500" />
                    </div>
                    <p class="mt-2 text-xs text-red-700">Berkas aktif melewati batas waktu</p>
                </Link>
                <Link href="/dashboard/jobs" class="rounded-2xl border border-rose-200 bg-rose-50 p-4 transition hover:shadow-md">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-[11px] font-bold uppercase tracking-wider text-rose-600">Fee Belum Lengkap</p>
                            <p class="mt-1 text-2xl font-black text-rose-800">{{ alerts.incompleteFees }}</p>
                        </div>
                        <CircleDollarSign class="h-7 w-7 text-rose-500" />
                    </div>
                    <p class="mt-2 text-xs text-rose-700">Berkas perlu pemeriksaan fee tugas</p>
                </Link>
                <Link href="/dashboard/pegawai/absensi" class="rounded-2xl border border-amber-200 bg-amber-50 p-4 transition hover:shadow-md">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-[11px] font-bold uppercase tracking-wider text-amber-700">Hadir Hari Ini</p>
                            <p class="mt-1 text-2xl font-black text-amber-900">
                                {{ attendanceToday.present }}<span class="text-sm font-semibold text-amber-600">/{{ attendanceToday.totalStaff }}</span>
                            </p>
                        </div>
                        <UserCheck class="h-7 w-7 text-amber-600" />
                    </div>
                    <p class="mt-2 text-xs text-amber-700">{{ attendanceToday.late }} terlambat · {{ attendanceToday.notCheckedOut }} belum pulang</p>
                </Link>
                <Link
                    v-if="canViewFinance && invoiceSummary"
                    href="/dashboard/invoice"
                    class="rounded-2xl border border-violet-200 bg-violet-50 p-4 transition hover:shadow-md"
                >
                    <div class="flex items-center justify-between gap-3">
                        <div class="min-w-0">
                            <p class="text-[11px] font-bold uppercase tracking-wider text-violet-600">Piutang Invoice</p>
                            <p class="mt-1 truncate text-xl font-black text-violet-900">{{ formatCurrency(invoiceSummary.outstandingAmount) }}</p>
                        </div>
                        <WalletCards class="h-7 w-7 shrink-0 text-violet-500" />
                    </div>
                    <p class="mt-2 text-xs text-violet-700">{{ invoiceSummary.outstandingCount }} invoice · {{ invoiceSummary.overdueCount }} lewat tempo</p>
                </Link>
            </section>

            <section class="grid gap-5 xl:grid-cols-3">
                <article class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-2">
                    <div class="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                        <div>
                            <h2 class="text-lg font-black text-slate-950">Perkembangan Berkas</h2>
                            <p class="text-xs text-slate-500">Perbandingan berkas masuk dan selesai sesuai periode grafik.</p>
                        </div>
                        <div class="flex items-center gap-4 text-[11px] font-bold text-slate-500">
                            <span class="flex items-center gap-1.5"><i class="h-2.5 w-2.5 rounded-sm bg-amber-500" />Masuk</span>
                            <span class="flex items-center gap-1.5"><i class="h-2.5 w-2.5 rounded-sm bg-emerald-500" />Selesai</span>
                        </div>
                    </div>
                    <div class="mt-6 flex h-52 items-end gap-2 border-b border-slate-200 sm:gap-5">
                        <div v-for="month in months" :key="month.key" class="group flex h-full flex-1 items-end justify-center gap-1.5">
                            <div class="relative w-2/5 rounded-t-lg bg-amber-500 transition-all group-hover:bg-amber-600" :style="{ height: `${Math.max(5, (Number(month.incoming) / maxMonth) * 88)}%` }">
                                <span class="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-bold text-slate-600">{{ month.incoming }}</span>
                            </div>
                            <div class="relative w-2/5 rounded-t-lg bg-emerald-500 transition-all group-hover:bg-emerald-600" :style="{ height: `${Math.max(5, (Number(month.completed) / maxMonth) * 88)}%` }">
                                <span class="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-bold text-slate-600">{{ month.completed }}</span>
                            </div>
                        </div>
                    </div>
                    <div class="mt-3 grid grid-cols-6 text-center text-[11px] font-bold text-slate-500">
                        <span v-for="month in months" :key="month.key">{{ month.label }}</span>
                    </div>
                </article>

                <article class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div class="flex items-center justify-between">
                        <div>
                            <h2 class="text-lg font-black text-slate-950">Kehadiran Hari Ini</h2>
                            <p class="text-xs text-slate-500">Status absensi pegawai.</p>
                        </div>
                        <UserCheck class="h-5 w-5 text-emerald-600" />
                    </div>
                    <div class="mt-5 grid grid-cols-2 gap-3">
                        <div class="rounded-xl bg-emerald-50 p-4">
                            <p class="text-[10px] font-bold uppercase text-emerald-700">Hadir</p>
                            <p class="mt-1 text-2xl font-black text-emerald-900">{{ attendanceToday.present }}</p>
                        </div>
                        <div class="rounded-xl bg-amber-50 p-4">
                            <p class="text-[10px] font-bold uppercase text-amber-700">Terlambat</p>
                            <p class="mt-1 text-2xl font-black text-amber-900">{{ attendanceToday.late }}</p>
                        </div>
                        <div class="rounded-xl bg-sky-50 p-4">
                            <p class="text-[10px] font-bold uppercase text-sky-700">Belum Pulang</p>
                            <p class="mt-1 text-2xl font-black text-sky-900">{{ attendanceToday.notCheckedOut }}</p>
                        </div>
                        <div class="rounded-xl bg-slate-100 p-4">
                            <p class="text-[10px] font-bold uppercase text-slate-600">Total Pegawai</p>
                            <p class="mt-1 text-2xl font-black text-slate-900">{{ attendanceToday.totalStaff }}</p>
                        </div>
                    </div>
                    <Link href="/dashboard/pegawai/absensi" class="mt-4 flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3 text-xs font-bold text-slate-700 transition hover:bg-slate-50">
                        Lihat detail absensi <ArrowRight class="h-4 w-4" />
                    </Link>
                </article>
            </section>

            <section class="grid gap-5 xl:grid-cols-2">
                <article class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div class="flex items-start justify-between gap-3">
                        <div>
                            <h2 class="text-lg font-black text-slate-950">Perlu Perhatian</h2>
                            <p class="text-xs text-slate-500">Deadline terlambat dan mendekati jatuh tempo.</p>
                        </div>
                        <AlertTriangle class="h-5 w-5 text-red-500" />
                    </div>
                    <div class="mt-4 divide-y divide-slate-100">
                        <Link v-for="job in overdueJobs" :key="`overdue-${job.jobType}-${job.id}`" :href="jobUrl(job)" class="flex items-center justify-between gap-3 py-3 transition hover:bg-red-50/50 sm:px-2">
                            <div class="min-w-0">
                                <div class="flex items-center gap-2">
                                    <span class="rounded-md bg-red-100 px-2 py-0.5 text-[10px] font-black text-red-700">TERLAMBAT</span>
                                    <code class="truncate text-[10px] font-bold text-slate-400">{{ job.trackingCode }}</code>
                                </div>
                                <p class="mt-1 truncate text-sm font-bold text-slate-800">{{ job.title }}</p>
                                <p class="truncate text-xs text-slate-500">{{ job.clientName || "Tanpa client" }}</p>
                            </div>
                            <div class="shrink-0 text-right">
                                <p class="text-xs font-bold text-red-700">{{ deadlineDistance(job.deadline).label }}</p>
                                <p class="mt-1 text-[10px] text-slate-400">{{ formatDate(job.deadline, true) }}</p>
                            </div>
                        </Link>
                        <Link v-for="job in deadlines" :key="`upcoming-${job.jobType}-${job.id}`" :href="jobUrl(job)" class="flex items-center justify-between gap-3 py-3 transition hover:bg-amber-50/50 sm:px-2">
                            <div class="min-w-0">
                                <div class="flex items-center gap-2">
                                    <span class="rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-black text-amber-700">SEGERA</span>
                                    <code class="truncate text-[10px] font-bold text-slate-400">{{ job.trackingCode }}</code>
                                </div>
                                <p class="mt-1 truncate text-sm font-bold text-slate-800">{{ job.title }}</p>
                                <p class="truncate text-xs text-slate-500">{{ job.clientName || "Tanpa client" }}</p>
                            </div>
                            <div class="shrink-0 text-right">
                                <p class="text-xs font-bold text-amber-700">{{ deadlineDistance(job.deadline).label }}</p>
                                <p class="mt-1 text-[10px] text-slate-400">{{ formatDate(job.deadline, true) }}</p>
                            </div>
                        </Link>
                        <p v-if="!overdueJobs.length && !deadlines.length" class="py-10 text-center text-sm text-slate-400">Tidak ada deadline mendesak.</p>
                    </div>
                    <Link href="/dashboard/jobs" class="mt-3 flex items-center justify-center gap-2 rounded-xl border border-slate-200 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50">
                        Lihat seluruh berkas <ArrowRight class="h-4 w-4" />
                    </Link>
                </article>

                <article class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div class="flex items-start justify-between gap-3">
                        <div>
                            <h2 class="text-lg font-black text-slate-950">Berkas Terbaru</h2>
                            <p class="text-xs text-slate-500">Aktivitas pendaftaran berkas terbaru.</p>
                        </div>
                        <Files class="h-5 w-5" :style="{ color: 'var(--primary)' }" />
                    </div>
                    <div class="mt-4 divide-y divide-slate-100">
                        <Link v-for="job in recentJobs" :key="`${job.jobType}-${job.id}`" :href="jobUrl(job)" class="flex items-center justify-between gap-3 py-3 transition hover:bg-slate-50 sm:px-2">
                            <div class="min-w-0">
                                <div class="flex items-center gap-2">
                                    <code class="truncate text-[10px] font-bold" :style="{ color: 'var(--primary)' }">{{ job.trackingCode }}</code>
                                    <span class="rounded-full border px-2 py-0.5 text-[9px] font-black" :class="statusClass(job.status)">{{ job.status }}</span>
                                </div>
                                <p class="mt-1 truncate text-sm font-bold text-slate-800">{{ job.title }}</p>
                                <p class="truncate text-xs text-slate-500">{{ job.clientName || "Tanpa client" }} · {{ job.category }}</p>
                            </div>
                            <div class="shrink-0 text-right text-[10px] text-slate-400">{{ formatDate(job.createdAt, true) }}</div>
                        </Link>
                        <p v-if="!recentJobs.length" class="py-10 text-center text-sm text-slate-400">Belum ada berkas.</p>
                    </div>
                    <Link href="/dashboard/jobs" class="mt-3 flex items-center justify-center gap-2 rounded-xl border border-slate-200 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50">
                        Buka Data Berkas <ArrowRight class="h-4 w-4" />
                    </Link>
                </article>
            </section>

            <section v-if="canViewFinance && invoiceSummary" class="grid gap-5 xl:grid-cols-3">
                <article class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-2">
                    <div class="flex items-start justify-between">
                        <div>
                            <h2 class="text-lg font-black text-slate-950">Ringkasan Keuangan</h2>
                            <p class="text-xs text-slate-500">Informasi tagihan dan penerimaan invoice.</p>
                        </div>
                        <Banknote class="h-5 w-5 text-emerald-600" />
                    </div>
                    <div class="mt-5 grid gap-3 sm:grid-cols-3">
                        <div class="rounded-xl bg-violet-50 p-4">
                            <p class="text-[10px] font-bold uppercase text-violet-600">Sisa Piutang</p>
                            <p class="mt-2 text-xl font-black text-violet-900">{{ formatCurrency(invoiceSummary.outstandingAmount) }}</p>
                            <p class="mt-1 text-xs text-violet-600">{{ invoiceSummary.outstandingCount }} invoice</p>
                        </div>
                        <div class="rounded-xl bg-red-50 p-4">
                            <p class="text-[10px] font-bold uppercase text-red-600">Lewat Jatuh Tempo</p>
                            <p class="mt-2 text-xl font-black text-red-900">{{ invoiceSummary.overdueCount }}</p>
                            <p class="mt-1 text-xs text-red-600">invoice perlu ditagih</p>
                        </div>
                        <div class="rounded-xl bg-emerald-50 p-4">
                            <p class="text-[10px] font-bold uppercase text-emerald-600">Masuk Bulan Ini</p>
                            <p class="mt-2 text-xl font-black text-emerald-900">{{ formatCurrency(invoiceSummary.paidThisMonth) }}</p>
                            <p class="mt-1 text-xs text-emerald-600">pembayaran tercatat</p>
                        </div>
                    </div>
                    <div class="mt-4 flex flex-wrap gap-2">
                        <Link href="/dashboard/invoice" class="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold text-white" :style="{ backgroundColor: 'var(--primary)' }">
                            <ReceiptText class="h-4 w-4" /> Kelola Invoice
                        </Link>
                        <Link href="/dashboard/finance" class="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50">
                            <WalletCards class="h-4 w-4" /> Buka Keuangan
                        </Link>
                    </div>
                </article>

                <article class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div class="flex items-center justify-between">
                        <div>
                            <h2 class="text-lg font-black text-slate-950">Pembayaran Terbaru</h2>
                            <p class="text-xs text-slate-500">Penerimaan terakhir tercatat.</p>
                        </div>
                        <CircleDollarSign class="h-5 w-5 text-emerald-600" />
                    </div>
                    <div class="mt-4 divide-y divide-slate-100">
                        <Link v-for="payment in recentPayments" :key="payment.id" :href="payment.invoiceId ? `/dashboard/invoice/${payment.invoiceId}` : '/dashboard/finance'" class="flex items-center justify-between gap-3 py-3 hover:bg-slate-50 sm:px-2">
                            <div class="min-w-0">
                                <p class="truncate text-xs font-bold text-slate-800">{{ payment.invoiceNumber || payment.description || "Pembayaran" }}</p>
                                <p class="mt-1 text-[10px] text-slate-400">{{ formatDate(payment.date, true) }}</p>
                            </div>
                            <p class="shrink-0 text-xs font-black text-emerald-600">{{ formatCurrency(payment.amount) }}</p>
                        </Link>
                        <p v-if="!recentPayments.length" class="py-10 text-center text-sm text-slate-400">Belum ada pembayaran.</p>
                    </div>
                </article>
            </section>

            <section class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Link href="/dashboard/clients" class="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                    <span class="grid h-10 w-10 place-items-center rounded-xl bg-amber-50 text-amber-700"><Users class="h-5 w-5" /></span>
                    <div><p class="text-xs text-slate-500">Client Aktif</p><p class="text-xl font-black text-slate-900">{{ clientCount }}</p></div>
                </Link>
                <Link href="/dashboard/pegawai/data" class="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                    <span class="grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-emerald-700"><UserCheck class="h-5 w-5" /></span>
                    <div><p class="text-xs text-slate-500">Akun Pegawai</p><p class="text-xl font-black text-slate-900">{{ staffCount }}</p></div>
                </Link>
                <Link href="/dashboard/quotation/new" class="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                    <span class="grid h-10 w-10 place-items-center rounded-xl bg-sky-50 text-sky-700"><ReceiptText class="h-5 w-5" /></span>
                    <div><p class="text-xs text-slate-500">Tindakan Cepat</p><p class="text-sm font-black text-slate-900">Buat Quotation</p></div>
                </Link>
                <Link href="/dashboard/invoice/new" class="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                    <span class="grid h-10 w-10 place-items-center rounded-xl bg-violet-50 text-violet-700"><CircleDollarSign class="h-5 w-5" /></span>
                    <div><p class="text-xs text-slate-500">Tindakan Cepat</p><p class="text-sm font-black text-slate-900">Buat Invoice</p></div>
                </Link>
            </section>
        </main>
    </AppLayout>
</template>
