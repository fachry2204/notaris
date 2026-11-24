<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from "vue";
import { Head, Link } from "@inertiajs/vue3";
import {
    AlertTriangle,
    ArrowRight,
    CalendarDays,
    CheckCircle2,
    Clock,
    Clock3,
    Coins,
    Eye,
    FileCheck,
    FileCode,
    FilePlus2,
    FileSignature,
    FileText,
    Fingerprint,
    Folder,
    FolderOpen,
    HelpCircle,
    Hourglass,
    Mail,
    Receipt,
    RefreshCw,
    Sparkles,
    Star,
    TrendingUp,
    Users,
    ChevronDown,
    Check,
} from "@lucide/vue";
import AppLayout from "@/Layouts/AppLayout.vue";
import MobileDashboard from "@/Components/MobileDashboard.vue";

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
    categoryCounts: Record<string, number>;
    deadlines: DashboardJob[];
    overdueJobs: DashboardJob[];
    recentJobs: DashboardJob[];
    alerts: { overdueJobs: number; incompleteFees?: number };
    clientCount: number;
    staffCount: number;
    months: Array<{ key: string; label: string; incoming: number; completed: number }>;
    attendanceNotifications: { missing: string[]; wfh: string[]; wfc: string[]; dinas: string[] } | null;
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
    staffPhoto: string | null;
    todayAttendance: any | null;
    user: any;
    staffWork: {
        assigned: number;
        active: number;
        completed: number;
        overdue: number;
        upcoming: Array<{
            id: string;
            jobType: string;
            title: string;
            trackingCode: string;
            status: string;
            deadline: string | null;
        }>;
    } | null;
}>();

// Live clock WIB
const currentTime = ref("");
const currentDateLabel = ref("");
const updateClock = () => {
    const now = new Date();
    currentTime.value = `${now.toLocaleTimeString("id-ID", { timeZone: "Asia/Jakarta", hour: "2-digit", minute: "2-digit" })} WIB`;
    currentDateLabel.value = now.toLocaleDateString("id-ID", {
        timeZone: "Asia/Jakarta", weekday: "long", day: "numeric", month: "long", year: "numeric",
    });
};
let timer: any = null;
onMounted(() => {
    updateClock();
    timer = setInterval(updateClock, 30000);
});
onUnmounted(() => { if (timer) clearInterval(timer); });

// Format currency
const formatCurrency = (val: number | string | null | undefined) => {
    return new Intl.NumberFormat("id-ID", {
        style: "currency", currency: "IDR", maximumFractionDigits: 0,
    }).format(Number(val ?? 0));
};

// Format date string to Indonesian locale
const fmtDate = (d: string | null | undefined) => {
    if (!d) return "-";
    return new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
};

// Summary metrics — real data from props
const totalBerkas = computed(() => props.stats?.total ?? 0);
const pekerjaanAktif = computed(() => (props.stats?.pending ?? 0) + (props.stats?.processing ?? 0));
const dalamProses = computed(() => props.stats?.processing ?? 0);
const selesai = computed(() => props.stats?.completed ?? 0);
const deadlineTerlewat = computed(() => props.alerts?.overdueJobs ?? 0);
const piutangInvoice = computed(() =>
    props.invoiceSummary?.outstandingAmount
        ? formatCurrency(props.invoiceSummary.outstandingAmount)
        : (props.canViewFinance ? "Rp 0" : "-")
);

// Monthly chart — real data from props.months
const monthlyChartData = computed(() =>
    (props.months ?? []).map((m) => ({
        key: m.key,
        month: m.label,
        masuk: m.incoming,
        selesai: m.completed,
    }))
);

const hoveredMonth = ref<any>(null);
const chartMax = computed(() => Math.max(1, ...monthlyChartData.value.flatMap(m => [m.masuk, m.selesai])));

// Donut — computed from real stats
const donutStatus = computed(() => {
    const total = props.stats?.total ?? 1;
    const pending = props.stats?.pending ?? 0;
    const proses = props.stats?.processing ?? 0;
    const done = props.stats?.completed ?? 0;
    const lainnya = Math.max(0, total - pending - proses - done);
    const pct = (n: number) => total > 0 ? Math.round((n / total) * 100) + "%" : "0%";
    const segments = [
        { label: "Pending", count: pending, pct: pct(pending), color: "#F59E0B" },
        { label: "Dalam Proses", count: proses, pct: pct(proses), color: "#3B82F6" },
        { label: "Selesai", count: done, pct: pct(done), color: "#10B981" },
        { label: "Lainnya", count: lainnya, pct: pct(lainnya), color: "#94A3B8" },
    ];
    let offset = 0;
    return segments.map(segment => {
        const size = total > 0 ? segment.count / total * 100 : 0;
        const result = { ...segment, size, offset };
        offset += size;
        return result;
    });
});

// Recent Jobs table — real data from props.recentJobs
const tableTab = ref("Semua");
const statusMap: Record<string, { label: string; color: string }> = {
    PENDING: { label: "Pending", color: "yellow" },
    PROSES: { label: "Dalam Proses", color: "blue" },
    REVISI: { label: "Revisi", color: "purple" },
    REVISI_PROSES: { label: "Revisi Proses", color: "purple" },
    VERIFIKASI: { label: "Verifikasi", color: "blue" },
    SELESAI: { label: "Selesai", color: "green" },
    CANCELLED: { label: "Batal", color: "red" },
};
const mappedRecentJobs = computed(() =>
    (props.recentJobs ?? []).map((j) => {
        const s = statusMap[j.status] ?? { label: j.status, color: "gray" };
        return {
            id: j.trackingCode ?? j.id,
            client: j.clientName ?? "-",
            jenis: j.title,
            status: s.label,
            statusColor: s.color,
            tanggal: fmtDate(j.createdAt),
            deadline: fmtDate(j.deadline),
            url: `/dashboard/jobs/${j.jobType}/${j.id}`,
        };
    })
);
const filteredJobs = computed(() => {
    const rows = mappedRecentJobs.value;
    if (tableTab.value === "Semua") return rows;
    if (tableTab.value === "Pending") return rows.filter((r) => r.statusColor === "yellow");
    if (tableTab.value === "Proses") return rows.filter((r) => r.statusColor === "blue" || r.statusColor === "purple");
    if (tableTab.value === "Selesai") return rows.filter((r) => r.statusColor === "green");
    return rows;
});

// Follow the same role visibility used by the existing sidebar.
const quickActions = computed(() => {
    const canManageClients = ['ADMINISTRATOR', 'PIMPINAN', 'STAFFADMIN'].includes(props.user?.role);
    return [
        { label: 'Berkas Baru', href: '/dashboard/jobs/new', icon: FilePlus2, visible: true },
        { label: 'Buat Invoice', href: '/dashboard/invoice/new', icon: Receipt, visible: props.canViewFinance },
        { label: 'Input Absensi', href: '/dashboard/pegawai/absensi/absenku', icon: Fingerprint, visible: true },
        { label: 'Client Baru', href: '/dashboard/clients/new', icon: Users, visible: canManageClients },
        { label: 'Buat Quotation', href: '/dashboard/quotation/new', icon: FileSignature, visible: canManageClients },
        { label: 'Data Tugas', href: '/dashboard/tasks', icon: FileCheck, visible: true },
        { label: 'Daftar Akta', href: '/dashboard/akta', icon: FileText, visible: true },
        { label: 'Statistik', href: '/dashboard/stats', icon: TrendingUp, visible: props.canViewFinance },
    ].filter(action => action.visible);
});

// Deadlines are scheduled dates, not recorded activities.
const upcomingDeadlines = computed(() => (props.deadlines ?? []).slice(0, 4));
</script>

<template>
    <Head title="Dashboard Operasional" />
    <AppLayout :hide-mobile-header="staffLanding">
        <!-- Mobile view for staff landing if active -->
        <MobileDashboard
            v-if="staffLanding"
            :user="user"
            :photo="staffPhoto"
            :today-attendance="todayAttendance"
            :staff-work="staffWork"
        />

        <!-- Desktop Luxury Notary Dashboard Layout -->
        <div v-else class="space-y-4 max-w-[1600px] mx-auto select-none">
            <!-- 1. Hero Welcome Banner -->
            <section
                class="relative overflow-hidden rounded-2xl border border-[#E8DFC9] bg-gradient-to-r from-[#FFFDF9] via-[#FAF4E6] to-[#F1E4C3] p-5 sm:p-6 shadow-xs"
            >
                <!-- Law books and scales of justice graphic on the right -->
                <div class="pointer-events-none absolute inset-y-0 right-0 w-2/3 md:w-1/2 flex items-center justify-end overflow-hidden">
                    <img
                        src="/images/dashboard/law-scale-books.jpg"
                        alt="Neraca Hukum & Buku Hukum"
                        class="h-full w-full object-cover object-left opacity-90 mix-blend-multiply"
                        style="mask-image: linear-gradient(to right, transparent 0%, black 40%); -webkit-mask-image: linear-gradient(to right, transparent 0%, black 40%);"
                    />
                </div>

                <div class="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <!-- Left: Welcome text & Verified badge -->
                    <div>
                        <p class="text-xs sm:text-sm font-medium text-stone-600">Selamat Datang,</p>
                        <h1 class="mt-0.5 text-xl sm:text-2xl lg:text-3xl font-black text-stone-900 tracking-tight flex items-center gap-2">
                            <span>{{ user?.fullName || user?.username || 'Pengguna' }}</span>
                            <!-- Golden Verified Badge -->
                            <span
                                class="inline-flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-[#F5C344] to-[#C99A3D] text-white shadow-xs"
                                title="Terverifikasi"
                            >
                                <Check class="h-3.5 w-3.5 stroke-[3]" />
                            </span>
                        </h1>
                        <p class="mt-1 text-xs sm:text-sm font-medium text-stone-600">
                            Dashboard Operasional Kantor Notaris
                        </p>
                    </div>

                    <!-- Right: Date and Time Widget Card -->
                    <div
                        class="flex items-center gap-3.5 rounded-2xl border border-amber-200/90 bg-white/95 px-5 py-3 shadow-xs backdrop-blur-md shrink-0"
                    >
                        <div class="grid h-10 w-10 place-items-center rounded-xl bg-amber-50 text-amber-600">
                            <CalendarDays class="h-5 w-5" />
                        </div>
                        <div>
                            <p class="text-xs font-semibold text-stone-600">{{ currentDateLabel }}</p>
                            <p class="text-lg font-black text-stone-900 tracking-tight leading-tight">
                                {{ currentTime }}
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            <!-- 2. Six Metric Cards -->
            <section class="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3.5">
                <!-- Card 1: Total Berkas -->
                <Link
                    href="/dashboard/jobs"
                    class="group flex flex-col justify-between rounded-2xl border border-[#EAE3D2] bg-white p-4 shadow-xs transition hover:-translate-y-0.5 hover:shadow-md"
                >
                    <div class="flex items-start justify-between">
                        <span class="grid h-10 w-10 place-items-center rounded-xl bg-amber-100/70 text-amber-600">
                            <Folder class="h-5 w-5 fill-amber-500/20" />
                        </span>
                    </div>
                    <div class="mt-3">
                        <p class="text-[11px] font-semibold text-stone-500">Total Berkas</p>
                        <p class="mt-0.5 text-2xl font-black text-stone-900 tracking-tight">{{ totalBerkas }}</p>
                        <p class="mt-1 text-[11px] font-medium text-stone-500">Seluruh berkas terdaftar</p>
                    </div>
                </Link>

                <!-- Card 2: Pekerjaan Aktif -->
                <Link
                    href="/dashboard/jobs?status=AKTIF"
                    class="group flex flex-col justify-between rounded-2xl border border-[#EAE3D2] bg-white p-4 shadow-xs transition hover:-translate-y-0.5 hover:shadow-md"
                >
                    <div class="flex items-start justify-between">
                        <span class="grid h-10 w-10 place-items-center rounded-xl bg-amber-100/70 text-amber-600">
                            <Hourglass class="h-5 w-5" />
                        </span>
                    </div>
                    <div class="mt-3">
                        <p class="text-[11px] font-semibold text-stone-500">Pekerjaan Aktif</p>
                        <p class="mt-0.5 text-2xl font-black text-stone-900 tracking-tight">{{ pekerjaanAktif }}</p>
                        <p class="mt-1 text-[11px] font-medium text-stone-500">Menunggu dan sedang dikerjakan</p>
                    </div>
                </Link>

                <!-- Card 3: Dalam Proses -->
                <Link
                    href="/dashboard/jobs"
                    class="group flex flex-col justify-between rounded-2xl border border-[#EAE3D2] bg-white p-4 shadow-xs transition hover:-translate-y-0.5 hover:shadow-md"
                >
                    <div class="flex items-start justify-between">
                        <span class="grid h-10 w-10 place-items-center rounded-xl bg-amber-100/70 text-amber-600">
                            <RefreshCw class="h-5 w-5" />
                        </span>
                    </div>
                    <div class="mt-3">
                        <p class="text-[11px] font-semibold text-stone-500">Dalam Proses</p>
                        <p class="mt-0.5 text-2xl font-black text-stone-900 tracking-tight">{{ dalamProses }}</p>
                        <p class="mt-1 text-[11px] font-medium text-stone-500">Termasuk revisi dan verifikasi</p>
                    </div>
                </Link>

                <!-- Card 4: Selesai -->
                <Link
                    href="/dashboard/jobs?status=SELESAI"
                    class="group flex flex-col justify-between rounded-2xl border border-[#EAE3D2] bg-white p-4 shadow-xs transition hover:-translate-y-0.5 hover:shadow-md"
                >
                    <div class="flex items-start justify-between">
                        <span class="grid h-10 w-10 place-items-center rounded-xl bg-emerald-100/70 text-emerald-600">
                            <CheckCircle2 class="h-5 w-5" />
                        </span>
                    </div>
                    <div class="mt-3">
                        <p class="text-[11px] font-semibold text-stone-500">Selesai</p>
                        <p class="mt-0.5 text-2xl font-black text-stone-900 tracking-tight">{{ selesai }}</p>
                        <p class="mt-1 text-[11px] font-medium text-stone-500">Berkas telah selesai</p>
                    </div>
                </Link>

                <!-- Card 5: Deadline Terlewat -->
                <Link
                    href="/dashboard/jobs?status=TERLAMBAT"
                    class="group flex flex-col justify-between rounded-2xl border border-[#EAE3D2] bg-white p-4 shadow-xs transition hover:-translate-y-0.5 hover:shadow-md"
                >
                    <div class="flex items-start justify-between">
                        <span class="grid h-10 w-10 place-items-center rounded-xl bg-rose-100/70 text-rose-600">
                            <AlertTriangle class="h-5 w-5" />
                        </span>
                    </div>
                    <div class="mt-3">
                        <p class="text-[11px] font-semibold text-stone-500">Deadline Terlewat</p>
                        <p class="mt-0.5 text-2xl font-black text-stone-900 tracking-tight">{{ deadlineTerlewat }}</p>
                        <p class="mt-1 text-[11px] font-medium text-stone-500">Berkas aktif melewati deadline</p>
                    </div>
                </Link>

                <!-- Card 6: Piutang Invoice -->
                <Link
                    v-if="canViewFinance"
                    href="/dashboard/invoice"
                    class="group flex flex-col justify-between rounded-2xl border border-[#EAE3D2] bg-white p-4 shadow-xs transition hover:-translate-y-0.5 hover:shadow-md"
                >
                    <div class="flex items-start justify-between">
                        <span class="grid h-10 w-10 place-items-center rounded-xl bg-amber-100/70 text-amber-600">
                            <Coins class="h-5 w-5" />
                        </span>
                    </div>
                    <div class="mt-3">
                        <p class="text-[11px] font-semibold text-stone-500">Piutang Invoice</p>
                        <p class="mt-0.5 text-lg font-black text-stone-900 tracking-tight truncate">{{ piutangInvoice }}</p>
                        <p class="mt-1 text-[11px] font-medium text-stone-400">{{ invoiceSummary?.outstandingCount ?? 0 }} invoice belum lunas</p>
                    </div>
                </Link>
            </section>

            <!-- 3. Grafik dan distribusi pekerjaan -->
            <section class="grid grid-cols-1 lg:grid-cols-12 gap-4">
                <!-- LEFT COLUMN (col-span-12 xl:col-span-6) -->
                <div class="lg:col-span-12 xl:col-span-6 space-y-4">
                    <!-- Tren Pekerjaan Bulanan Card -->
                    <div class="rounded-2xl border border-[#EAE3D2] bg-white p-5 shadow-xs">
                        <div class="flex flex-wrap items-center justify-between gap-2 border-b border-stone-100 pb-3">
                            <div>
                                <h2 class="text-sm font-bold text-stone-900 flex items-center gap-2">
                                    <span class="h-2 w-2 rounded-full bg-amber-500"></span>
                                    Tren Pekerjaan Bulanan
                                </h2>
                                <p class="text-[11px] text-stone-500 mt-0.5">
                                    Berkas masuk dan berstatus selesai; bulan selesai berdasarkan pembaruan terakhir.
                                </p>
                            </div>
                            <span class="text-[11px] text-stone-500">Periode sesuai data yang ditampilkan</span>
                        </div>

                        <!-- Bar & Line Combo Chart -->
                        <div class="mt-4">
                            <!-- Y-axis and chart area -->
                            <div class="relative h-48 w-full flex items-end">
                                <div class="absolute inset-0 flex flex-col justify-between pointer-events-none text-[10px] text-stone-400">
                                    <div v-for="step in [5, 4, 3, 2, 1, 0]" :key="step" class="border-b border-stone-100 flex items-center justify-between">
                                        <span class="w-6">{{ Math.round(chartMax * step / 5) }}</span><div class="w-full h-px bg-stone-100"></div>
                                    </div>
                                </div>

                                <!-- Bars for 12 months -->
                                <div class="relative z-10 w-full h-full flex items-end pl-7 pr-3 gap-1.5 sm:gap-2">
                                    <div
                                        v-for="item in monthlyChartData"
                                        :key="item.key"
                                        class="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer"
                                        @mouseenter="hoveredMonth = item"
                                        @mouseleave="hoveredMonth = null"
                                    >
                                        <div class="w-full flex items-end justify-center gap-1 sm:gap-1.5 h-full">
                                            <!-- Yellow Bar: Berkas Masuk -->
                                            <div
                                                class="w-1/2 max-w-[12px] bg-[#F3BA2F] rounded-t-sm transition-all group-hover:brightness-110"
                                                :style="{ height: `${(item.masuk / chartMax) * 100}%` }"
                                                :title="`${item.month}: Masuk ${item.masuk}`"
                                            ></div>
                                            <!-- Dark Bar: Berkas Selesai -->
                                            <div
                                                class="w-1/2 max-w-[12px] bg-[#221F1B] rounded-t-sm transition-all group-hover:brightness-125"
                                                :style="{ height: `${(item.selesai / chartMax) * 100}%` }"
                                                :title="`${item.month}: Selesai ${item.selesai}`"
                                            ></div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- X-Axis Months -->
                            <div class="flex text-center text-[10px] font-semibold text-stone-500 pl-7 pr-3 mt-2">
                                <span v-for="item in monthlyChartData" :key="item.key" class="flex-1">
                                    {{ item.month }}
                                </span>
                            </div>

                            <!-- Legend -->
                            <div class="mt-4 flex items-center justify-center gap-6 text-[11px] font-semibold text-stone-600 border-t border-stone-100 pt-3">
                                <span class="flex items-center gap-1.5">
                                    <span class="h-2.5 w-2.5 rounded-xs bg-[#F3BA2F]"></span>
                                    Berkas Masuk
                                </span>
                                <span class="flex items-center gap-1.5">
                                    <span class="h-2.5 w-2.5 rounded-xs bg-[#221F1B]"></span>
                                    Berkas Selesai
                                </span>
                            </div>
                        </div>
                    </div>

                </div>

                <!-- Distribusi mengisi ruang yang sebelumnya digunakan kalender -->
                <div class="lg:col-span-12 xl:col-span-6">
                    <!-- Distribusi Status Pekerjaan Card -->
                    <div class="flex h-full flex-col rounded-2xl border border-[#EAE3D2] bg-white p-5 shadow-xs">
                        <h2 class="text-sm font-bold text-stone-900 flex items-center gap-2 mb-4">
                            <span class="h-2 w-2 rounded-full bg-amber-500"></span>
                            Distribusi Status Pekerjaan
                        </h2>

                        <div class="flex flex-1 flex-wrap items-center justify-evenly gap-6 py-5">
                            <!-- SVG Donut Chart -->
                            <div class="relative h-44 w-44 shrink-0 xl:h-52 xl:w-52">
                                <svg class="h-full w-full transform -rotate-90" viewBox="0 0 36 36">
                                    <!-- Background circle -->
                                    <path
                                        class="text-stone-100"
                                        stroke-width="5"
                                        stroke="currentColor"
                                        fill="none"
                                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                    />
                                    <path v-for="segment in donutStatus" :key="segment.label"
                                        :stroke="segment.color" stroke-width="5" :stroke-dasharray="`${segment.size} ${100 - segment.size}`"
                                        :stroke-dashoffset="-segment.offset" fill="none"
                                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                                </svg>
                                <!-- Center text -->
                                <div class="absolute inset-0 flex flex-col items-center justify-center text-center">
                                    <span class="text-3xl font-black text-stone-900 leading-none">{{ totalBerkas }}</span>
                                    <span class="text-[10px] font-semibold text-stone-400 mt-0.5">Berkas</span>
                                </div>
                            </div>

                            <!-- Legend List -->
                            <div class="w-full max-w-xs space-y-3 text-sm sm:w-auto sm:min-w-48 sm:flex-1">
                                <div
                                    v-for="st in donutStatus"
                                    :key="st.label"
                                    class="flex items-center justify-between gap-4 text-sm"
                                >
                                    <span class="flex items-center gap-1.5 text-stone-700">
                                        <span class="h-2 w-2 rounded-full shrink-0" :style="{ backgroundColor: st.color }"></span>
                                        <span class="truncate">{{ st.label }}</span>
                                    </span>
                                    <span class="font-bold text-stone-900 shrink-0">
                                        {{ st.count }} <span class="font-normal text-stone-400">({{ st.pct }})</span>
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>

            </section>

            <!-- 4. Bottom Row (Pekerjaan Terbaru ~52%, Aktivitas Hari Ini ~25%, Aksi Cepat ~23%) -->
            <section class="grid grid-cols-1 lg:grid-cols-12 gap-4">
                <!-- Pekerjaan Terbaru Card (col-span-12 xl:col-span-6) -->
                <div class="lg:col-span-12 xl:col-span-6 rounded-2xl border border-[#EAE3D2] bg-white p-5 shadow-xs">
                    <div class="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 pb-3">
                        <div class="flex items-center gap-2">
                            <FolderOpen class="h-4 w-4 text-amber-600" />
                            <h2 class="text-xs font-bold text-stone-900">Pekerjaan Terbaru</h2>
                        </div>
                        <div class="flex items-center gap-2">
                            <!-- Filter pills -->
                            <div class="flex items-center gap-1 bg-stone-100/70 p-1 rounded-xl">
                                <button
                                    v-for="tab in ['Semua', 'Pending', 'Proses', 'Selesai']"
                                    :key="tab"
                                    type="button"
                                    class="px-2.5 py-0.5 text-[11px] font-semibold rounded-lg transition"
                                    :class="
                                        tableTab === tab
                                            ? 'bg-[#F5BA31] text-stone-950 shadow-xs'
                                            : 'text-stone-600 hover:text-stone-900'
                                    "
                                    @click="tableTab = tab"
                                >
                                    {{ tab }}
                                </button>
                            </div>
                            <Link href="/dashboard/jobs" class="text-[11px] font-semibold text-amber-700 hover:text-amber-800 ml-1">
                                Lihat Semua →
                            </Link>
                        </div>
                    </div>

                    <!-- Jobs Table -->
                    <div class="overflow-x-auto mt-2">
                        <table class="w-full text-left text-xs">
                            <thead>
                                <tr class="border-b border-stone-100 text-[11px] font-bold text-stone-400">
                                    <th class="py-2.5 pr-2 font-bold">No. Berkas</th>
                                    <th class="py-2.5 px-2 font-bold">Client</th>
                                    <th class="py-2.5 px-2 font-bold">Jenis Pekerjaan</th>
                                    <th class="py-2.5 px-2 font-bold">Status</th>
                                    <th class="py-2.5 px-2 font-bold">Tanggal</th>
                                    <th class="py-2.5 px-2 font-bold">Deadline</th>
                                    <th class="py-2.5 pl-2 text-center font-bold">Aksi</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-stone-100">
                                <tr
                                    v-for="row in filteredJobs"
                                    :key="row.id"
                                    class="hover:bg-amber-50/30 transition-colors"
                                >
                                    <td class="py-2.5 pr-2 font-bold text-amber-700">{{ row.id }}</td>
                                    <td class="py-2.5 px-2 font-semibold text-stone-800">{{ row.client }}</td>
                                    <td class="py-2.5 px-2 text-stone-600">{{ row.jenis }}</td>
                                    <td class="py-2.5 px-2">
                                        <span
                                            v-if="row.status === 'Dalam Proses'"
                                            class="inline-flex rounded-full bg-[#E0F2FE] px-2.5 py-0.5 text-[10px] font-bold text-[#0284C7]"
                                        >
                                            Dalam Proses
                                        </span>
                                        <span
                                            v-else-if="row.status === 'Pending'"
                                            class="inline-flex rounded-full bg-[#FEF3C7] px-2.5 py-0.5 text-[10px] font-bold text-[#D97706]"
                                        >
                                            Pending
                                        </span>
                                        <span
                                            v-else-if="row.status === 'Selesai'"
                                            class="inline-flex rounded-full bg-[#DCFCE7] px-2.5 py-0.5 text-[10px] font-bold text-[#16A34A]"
                                        >
                                            Selesai
                                        </span>
                                        <span v-else class="inline-flex rounded-full bg-stone-100 px-2.5 py-0.5 text-[10px] font-bold text-stone-700">{{ row.status }}</span>
                                    </td>
                                    <td class="py-2.5 px-2 text-stone-500 whitespace-nowrap">{{ row.tanggal }}</td>
                                    <td class="py-2.5 px-2 text-stone-500 whitespace-nowrap">{{ row.deadline }}</td>
                                    <td class="py-2.5 pl-2 text-center">
                                        <Link
                                            :href="row.url"
                                            class="grid h-7 w-7 mx-auto place-items-center rounded-lg text-stone-500 hover:bg-stone-100 hover:text-stone-900 transition"
                                            title="Lihat Berkas"
                                        >
                                            <Eye class="h-3.5 w-3.5" />
                                        </Link>
                                    </td>
                                </tr>
                                <tr v-if="!filteredJobs.length"><td colspan="7" class="py-5 text-center text-stone-500">Tidak ada pekerjaan untuk ditampilkan.</td></tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- Aktivitas Hari Ini Card (col-span-12 md:col-span-6 xl:col-span-3) -->
                <div class="lg:col-span-6 xl:col-span-3 rounded-2xl border border-[#EAE3D2] bg-white p-5 shadow-xs">
                    <div class="flex items-center justify-between mb-4 pb-2 border-b border-stone-100">
                        <h2 class="text-xs font-bold text-stone-900 flex items-center gap-2">
                            <Clock class="h-4 w-4 text-amber-600" />
                            Deadline Mendatang
                        </h2>
                        <Link href="/dashboard/jobs" class="text-[11px] font-semibold text-amber-700 hover:text-amber-800">Lihat Berkas →</Link>
                    </div>

                    <p v-if="!upcomingDeadlines.length" class="text-xs text-stone-500">Tidak ada deadline dalam 7 hari ke depan.</p>
                    <div v-else class="relative pl-6 space-y-4">
                        <!-- Vertical connecting line -->
                        <div class="absolute left-2.5 top-2 bottom-2 w-0.5 bg-amber-200"></div>

                        <div
                            v-for="(act, idx) in upcomingDeadlines"
                            :key="idx"
                            class="relative flex items-start gap-2.5"
                        >
                            <!-- Golden dot -->
                            <span class="absolute -left-6 top-1.5 grid h-3 w-3 place-items-center rounded-full bg-[#F5BA31] ring-3 ring-white"></span>
                            <div>
                                <p class="text-[11px] font-bold text-amber-800">{{ fmtDate(act.deadline) }}</p>
                                <p class="text-xs font-medium text-stone-800 mt-0.5 leading-snug">{{ act.title }} ({{ act.trackingCode }})</p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Aksi Cepat Card (col-span-12 md:col-span-6 xl:col-span-3) -->
                <div class="lg:col-span-6 xl:col-span-3 rounded-2xl border border-[#EAE3D2] bg-white p-5 shadow-xs">
                    <div class="flex items-center gap-2 mb-4 pb-2 border-b border-stone-100">
                        <Sparkles class="h-4 w-4 text-amber-600" />
                        <h2 class="text-xs font-bold text-stone-900">Aksi Cepat</h2>
                    </div>

                    <div class="grid grid-cols-2 gap-2.5">
                        <Link
                            v-for="action in quickActions"
                            :key="action.href"
                            :href="action.href"
                            class="group flex flex-col items-center justify-center rounded-xl border border-[#EAE3D2] bg-[#FAF8F5]/80 p-3.5 text-center transition hover:-translate-y-0.5 hover:border-amber-400 hover:bg-white hover:shadow-xs"
                        >
                            <span class="grid h-10 w-10 place-items-center rounded-xl bg-amber-50 text-amber-600 transition group-hover:scale-105 group-hover:bg-amber-100">
                                <component :is="action.icon" class="h-5 w-5" />
                            </span>
                            <span class="mt-2 text-xs font-bold text-stone-800 group-hover:text-amber-800">{{ action.label }}</span>
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    </AppLayout>
</template>
