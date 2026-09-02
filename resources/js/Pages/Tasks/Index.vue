<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { Head, Link, router, usePage } from "@inertiajs/vue3";
import AppLayout from "@/Layouts/AppLayout.vue";
import {
    Search,
    Filter,
    RotateCcw,
    Eye,
    ClipboardList,
    DollarSign,
    CheckCircle2,
    Clock,
    AlertTriangle,
    ReceiptText,
    X,
} from "@lucide/vue";

const page = usePage();
const p = defineProps<{
    tasks: any;
    staff: any[];
    filters: {
        search: string;
        userId: string;
        taskType: string;
        paymentStatus: string;
        startDate: string;
        endDate: string;
    };
    stats: {
        totalTasks: number;
        totalFee: number;
        paidFee: number;
        unpaidFee: number;
    };
}>();

const currentUser = computed(() => (page.props.auth as any)?.user);
const canManagePayment = computed(() => {
    const role = currentUser.value?.role;
    return role === "ADMINISTRATOR" || role === "PIMPINAN";
});

const form = ref({
    search: p.filters.search || "",
    userId: p.filters.userId || "",
    taskType: p.filters.taskType || "",
    paymentStatus: p.filters.paymentStatus || "",
    startDate: p.filters.startDate || "",
    endDate: p.filters.endDate || "",
});

const applyFilters = () => {
    router.get("/dashboard/tasks", form.value, {
        preserveState: true,
        replace: true,
    });
};

const resetFilters = () => {
    form.value = {
        search: "",
        userId: "",
        taskType: "",
        paymentStatus: "",
        startDate: "",
        endDate: "",
    };
    applyFilters();
};

const hasActiveFilters = computed(() => {
    return !!(
        form.value.search ||
        form.value.userId ||
        form.value.taskType ||
        form.value.paymentStatus ||
        form.value.startDate ||
        form.value.endDate
    );
});

const selectedTask = ref<any | null>(null);
const paymentPreview = ref<any | null>(null);
const previewLoading = ref(false);
const previewError = ref("");
const paymentProcessing = ref(false);

const paymentPercentage = computed(() => {
    const total = Number(paymentPreview.value?.billing?.totalInvoiceAmount || 0);
    const paid = Number(paymentPreview.value?.billing?.totalPaidAmount || 0);
    if (total <= 0) return 0;
    return Math.min(100, Math.round((paid / total) * 100));
});

const closePaymentModal = () => {
    if (paymentProcessing.value) return;
    selectedTask.value = null;
    paymentPreview.value = null;
    previewError.value = "";
};

const openPaymentModal = async (task: any) => {
    if (!canManagePayment.value || previewLoading.value) return;
    selectedTask.value = task;
    paymentPreview.value = null;
    previewError.value = "";
    previewLoading.value = true;

    try {
        const response = await fetch(`/dashboard/tasks/${task.id}/payment-preview`, {
            headers: { Accept: "application/json" },
            credentials: "same-origin",
        });
        if (!response.ok) throw new Error("Data pembayaran tidak dapat diperiksa.");
        paymentPreview.value = await response.json();
    } catch (error) {
        previewError.value = error instanceof Error
            ? error.message
            : "Data pembayaran tidak dapat diperiksa.";
    } finally {
        previewLoading.value = false;
    }
};

const confirmPaymentChange = () => {
    const taskId = paymentPreview.value?.task?.id || selectedTask.value?.id;
    if (!taskId || paymentProcessing.value) return;
    paymentProcessing.value = true;
    router.patch(`/dashboard/tasks/${taskId}/payment`, { confirmed: true }, {
        preserveScroll: true,
        onSuccess: () => {
            paymentProcessing.value = false;
            closePaymentModal();
        },
        onFinish: () => {
            paymentProcessing.value = false;
        },
    });
};

const handleEscape = (event: KeyboardEvent) => {
    if (event.key === "Escape" && selectedTask.value) closePaymentModal();
};

onMounted(() => window.addEventListener("keydown", handleEscape));
onBeforeUnmount(() => window.removeEventListener("keydown", handleEscape));

const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0,
    }).format(val || 0);
};

const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    }).format(d);
};

const taskTypeColor = (type: string) => {
    switch (type) {
        case "PIC":
            return "bg-purple-50 text-purple-700 border-purple-200";
        case "Saksi":
            return "bg-blue-50 text-blue-700 border-blue-200";
        case "NPWP":
            return "bg-amber-50 text-amber-700 border-amber-200";
        case "NIB":
            return "bg-emerald-50 text-emerald-700 border-emerald-200";
        case "PBB":
            return "bg-indigo-50 text-indigo-700 border-indigo-200";
        default:
            return "bg-slate-100 text-slate-700 border-slate-200";
    }
};

const getRowNumber = (index: number | string) => {
    const page = Number(p.tasks?.current_page || 1);
    const perPage = Number(p.tasks?.per_page || 20);
    return (page - 1) * perPage + Number(index) + 1;
};
</script>

<template>
    <Head title="Data Tugas Karyawan" />
    <AppLayout>
        <main class="mx-auto max-w-7xl space-y-6 p-3 sm:p-5">
            <!-- Header -->
            <div class="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                    <h1 class="text-xl sm:text-2xl font-black text-slate-900">
                        Data Tugas Karyawan
                    </h1>
                    <p class="mt-1 text-xs sm:text-sm font-medium text-slate-500">
                        Pantau penugasan karyawan, rincian fee terbayar & belum terbayar, dan filter riwayat penugasan.
                    </p>
                </div>
            </div>

            <!-- Stats Overview Cards -->
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex items-center justify-between">
                    <div>
                        <p class="text-xs font-bold uppercase tracking-wider text-slate-400">Total Tugas</p>
                        <h3 class="mt-1 text-2xl font-black text-slate-900">{{ stats.totalTasks }}</h3>
                        <p class="mt-0.5 text-[11px] text-slate-500">Penugasan tercatat</p>
                    </div>
                    <div class="grid h-12 w-12 place-items-center rounded-2xl bg-blue-50 text-blue-600">
                        <ClipboardList class="h-6 w-6" />
                    </div>
                </div>

                <div v-if="canManagePayment" class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex items-center justify-between">
                    <div>
                        <p class="text-xs font-bold uppercase tracking-wider text-slate-400">Total Fee Pegawai</p>
                        <h3 class="mt-1 text-2xl font-black text-slate-900">{{ formatCurrency(stats.totalFee) }}</h3>
                        <p class="mt-0.5 text-[11px] text-slate-500">Akumulasi seluruh fee</p>
                    </div>
                    <div class="grid h-12 w-12 place-items-center rounded-2xl bg-slate-100 text-slate-700">
                        <DollarSign class="h-6 w-6" />
                    </div>
                </div>

                <div v-if="canManagePayment" class="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-5 shadow-sm flex items-center justify-between">
                    <div>
                        <p class="text-xs font-bold uppercase tracking-wider text-emerald-700">Fee Terbayar</p>
                        <h3 class="mt-1 text-2xl font-black text-emerald-600">{{ formatCurrency(stats.paidFee) }}</h3>
                        <p class="mt-0.5 text-[11px] text-emerald-600 font-semibold">Sudah diselesaikan</p>
                    </div>
                    <div class="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-100 text-emerald-700">
                        <CheckCircle2 class="h-6 w-6" />
                    </div>
                </div>

                <div v-if="canManagePayment" class="rounded-2xl border border-rose-200 bg-rose-50/40 p-5 shadow-sm flex items-center justify-between">
                    <div>
                        <p class="text-xs font-bold uppercase tracking-wider text-rose-700">Fee Belum Terbayar</p>
                        <h3 class="mt-1 text-2xl font-black text-rose-600">{{ formatCurrency(stats.unpaidFee) }}</h3>
                        <p class="mt-0.5 text-[11px] text-rose-600 font-semibold">Belum dibayarkan</p>
                    </div>
                    <div class="grid h-12 w-12 place-items-center rounded-2xl bg-rose-100 text-rose-700">
                        <Clock class="h-6 w-6" />
                    </div>
                </div>
            </div>

            <!-- Filter Panel -->
            <div class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-4">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2">
                        <Filter class="h-4 w-4 text-[var(--primary)]" />
                        <h2 class="text-sm font-black text-slate-800">Filter & Pencarian Tugas</h2>
                    </div>
                    <button
                        v-if="hasActiveFilters"
                        type="button"
                        @click="resetFilters"
                        class="inline-flex items-center gap-1.5 text-xs font-bold text-rose-600 hover:text-rose-700 transition"
                    >
                        <RotateCcw class="h-3.5 w-3.5" />
                        Reset Filter
                    </button>
                </div>

                <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
                    <!-- Search input -->
                    <div class="relative lg:col-span-2">
                        <Search class="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                            v-model="form.search"
                            type="text"
                            placeholder="Cari berkas, kode tracking, client..."
                            class="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 text-sm font-medium focus:bg-white focus:border-[var(--primary)]"
                            @keyup.enter="applyFilters"
                        />
                    </div>

                    <!-- Staff Filter -->
                    <div>
                        <select
                            v-model="form.userId"
                            class="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 text-sm font-medium focus:bg-white focus:border-[var(--primary)]"
                            @change="applyFilters"
                        >
                            <option value="">Semua Pegawai</option>
                            <option v-for="user in staff" :key="user.id" :value="user.id">
                                {{ user.fullName }}
                            </option>
                        </select>
                    </div>

                    <!-- Task Type Filter -->
                    <div>
                        <select
                            v-model="form.taskType"
                            class="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 text-sm font-medium focus:bg-white focus:border-[var(--primary)]"
                            @change="applyFilters"
                        >
                            <option value="">Semua Jenis Tugas</option>
                            <option v-for="tt in ['PIC', 'Saksi', 'NPWP', 'NIB', 'PBB', 'Lainnya']" :key="tt" :value="tt">
                                {{ tt }}
                            </option>
                        </select>
                    </div>

                    <!-- Payment Status Filter -->
                    <div>
                        <select
                            v-model="form.paymentStatus"
                            class="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 text-sm font-medium focus:bg-white focus:border-[var(--primary)]"
                            @change="applyFilters"
                        >
                            <option value="">Semua Status Bayar</option>
                            <option value="paid">Terbayar</option>
                            <option value="unpaid">Belum Terbayar</option>
                        </select>
                    </div>

                    <!-- Filter Action Button -->
                    <div>
                        <button
                            type="button"
                            @click="applyFilters"
                            class="h-11 w-full rounded-xl bg-[var(--primary)] px-4 font-bold text-white shadow-sm transition hover:opacity-90 active:scale-95"
                        >
                            Terapkan Filter
                        </button>
                    </div>
                </div>

                <!-- Date Range Filters -->
                <div class="grid gap-3 pt-2 border-t border-slate-100 sm:grid-cols-2 lg:grid-cols-3">
                    <label class="text-xs font-bold text-slate-600">
                        Dari Tanggal:
                        <input
                            v-model="form.startDate"
                            type="date"
                            class="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 text-xs font-medium focus:bg-white"
                            @change="applyFilters"
                        />
                    </label>

                    <label class="text-xs font-bold text-slate-600">
                        Sampai Tanggal:
                        <input
                            v-model="form.endDate"
                            type="date"
                            class="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 text-xs font-medium focus:bg-white"
                            @change="applyFilters"
                        />
                    </label>
                </div>
            </div>

            <!-- Empty State -->
            <div v-if="!tasks.data.length" class="rounded-2xl border border-slate-200 bg-white p-12 text-center text-slate-400">
                <ClipboardList class="mx-auto h-12 w-12 opacity-30" />
                <h3 class="mt-3 text-base font-bold text-slate-700">Data Tugas Tidak Ditemukan</h3>
                <p class="mt-1 text-xs text-slate-500">Tidak ada penugasan karyawan yang cocok dengan kriteria filter.</p>
            </div>

            <!-- Tasks Table -->
            <div v-else class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div class="overflow-x-auto">
                    <table class="w-full text-left text-sm">
                        <thead class="bg-slate-50/80 border-b border-slate-200">
                            <tr class="text-[11px] font-black uppercase tracking-wider text-slate-500">
                                <th class="w-12 px-5 py-3.5 text-center">No.</th>
                                <th class="px-5 py-3.5">Pegawai</th>
                                <th class="px-5 py-3.5">Tugas</th>
                                <th class="px-5 py-3.5">Berkas & Client</th>
                                <th v-if="canManagePayment" class="px-5 py-3.5 text-right">Fee Pegawai</th>
                                <th v-if="canManagePayment" class="px-5 py-3.5 text-center">Status Fee</th>
                                <th class="px-5 py-3.5">Tanggal</th>
                                <th class="px-5 py-3.5 text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-100">
                            <tr v-for="(task, index) in tasks.data" :key="task.id" class="transition hover:bg-slate-50/70">
                                <td class="px-5 py-3.5 text-center font-bold text-slate-400 text-xs">
                                    {{ getRowNumber(index) }}
                                </td>

                                <!-- Pegawai Column -->
                                <td class="px-5 py-3.5">
                                    <div class="flex items-center gap-3">
                                        <div class="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-xl bg-[var(--primary)]/10 font-black text-sm text-[var(--primary)]">
                                            <img v-if="task.employeePhoto" :src="task.employeePhoto" class="h-full w-full object-cover" />
                                            <span v-else>{{ task.employeeName?.charAt(0) || 'P' }}</span>
                                        </div>
                                        <div>
                                            <p class="font-bold text-slate-900 text-sm">{{ task.employeeName || 'Pegawai' }}</p>
                                            <p class="text-xs font-semibold text-slate-400">@{{ task.employeeUsername || '-' }}</p>
                                        </div>
                                    </div>
                                </td>

                                <!-- Task Type Badge Column -->
                                <td class="px-5 py-3.5">
                                    <div class="space-y-1">
                                        <span
                                            class="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-bold"
                                            :class="taskTypeColor(task.taskType)"
                                        >
                                            {{ task.taskType }}
                                        </span>
                                        <p v-if="task.customTask" class="text-xs font-medium text-slate-600 italic">
                                            "{{ task.customTask }}"
                                        </p>
                                    </div>
                                </td>

                                <!-- Berkas & Client Column -->
                                <td class="px-5 py-3.5">
                                    <div class="space-y-1 max-w-xs">
                                        <div class="flex items-center gap-2">
                                            <span class="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-mono font-bold text-slate-700">
                                                {{ task.trackingCode || '-' }}
                                            </span>
                                            <span class="text-[10px] font-bold text-slate-400">
                                                {{ task.jobCategory }}
                                            </span>
                                        </div>
                                        <p class="font-bold text-slate-900 text-xs truncate" :title="task.jobTitle">
                                            {{ task.jobTitle || 'Berkas Tanpa Judul' }}
                                        </p>
                                        <p class="text-xs text-slate-500 truncate" :title="task.clientName">
                                            Client: <span class="font-semibold text-slate-700">{{ task.clientName || '-' }}</span>
                                        </p>
                                    </div>
                                </td>

                                <!-- Fee Column -->
                                <td v-if="canManagePayment" class="px-5 py-3.5 text-right font-black text-slate-900 text-sm">
                                    {{ formatCurrency(task.fee) }}
                                </td>

                                <!-- Status Fee Payment Column -->
                                <td v-if="canManagePayment" class="px-5 py-3.5 text-center">
                                    <button
                                        type="button"
                                        @click="openPaymentModal(task)"
                                        :title="task.isPaid ? 'Klik untuk ubah jadi Belum Terbayar' : 'Klik untuk ubah jadi Terbayar'"
                                        class="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold transition active:scale-95 cursor-pointer"
                                        :class="task.isPaid ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'"
                                    >
                                        <CheckCircle2 v-if="task.isPaid" class="h-3.5 w-3.5" />
                                        <Clock v-else class="h-3.5 w-3.5" />
                                        <span>{{ task.isPaid ? 'Terbayar' : 'Belum Terbayar' }}</span>
                                    </button>
                                </td>

                                <!-- Tanggal Column -->
                                <td class="px-5 py-3.5 text-xs font-medium text-slate-600 whitespace-nowrap">
                                    {{ formatDate(task.createdAt) }}
                                </td>

                                <!-- Aksi Column -->
                                <td class="px-5 py-3.5 text-center whitespace-nowrap">
                                    <div class="flex items-center justify-center gap-2">
                                        <!-- Icon Lihat Detail Berkas -->
                                        <Link
                                            v-if="task.jobId && task.jobType"
                                            :href="`/dashboard/jobs/${task.jobType}/${task.jobId}`"
                                            title="Lihat Detail Berkas"
                                            class="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-blue-200 bg-blue-50 text-blue-600 transition hover:bg-blue-100 hover:scale-105 active:scale-95"
                                        >
                                            <Eye class="h-4 w-4" />
                                        </Link>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <!-- Pagination -->
                <div v-if="tasks.links && tasks.links.length > 3" class="flex items-center justify-between border-t border-slate-200 bg-slate-50/50 px-5 py-3">
                    <p class="text-xs font-medium text-slate-500">
                        Menampilkan <span class="font-bold text-slate-800">{{ tasks.from }}</span> - <span class="font-bold text-slate-800">{{ tasks.to }}</span> dari <span class="font-bold text-slate-800">{{ tasks.total }}</span> tugas
                    </p>
                    <div class="flex gap-1">
                        <Component
                            :is="link.url ? Link : 'span'"
                            v-for="(link, i) in tasks.links"
                            :key="i"
                            :href="link.url || '#'"
                            v-html="link.label"
                            class="inline-flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-xs font-bold transition"
                            :class="[
                                link.active ? 'bg-[var(--primary)] text-white shadow-sm' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200',
                                !link.url ? 'opacity-40 cursor-not-allowed' : ''
                            ]"
                        />
                    </div>
                </div>
            </div>
        </main>

        <Teleport to="body">
            <Transition
                enter-active-class="transition duration-200 ease-out"
                enter-from-class="opacity-0"
                enter-to-class="opacity-100"
                leave-active-class="transition duration-150 ease-in"
                leave-from-class="opacity-100"
                leave-to-class="opacity-0"
            >
                <div
                    v-if="selectedTask"
                    class="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="payment-modal-title"
                    @mousedown.self="closePaymentModal"
                >
                    <div class="w-full max-w-2xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
                        <div class="flex items-start justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
                            <div class="flex gap-3">
                                <div
                                    class="grid h-11 w-11 shrink-0 place-items-center rounded-2xl"
                                    :class="selectedTask.isPaid ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'"
                                >
                                    <AlertTriangle class="h-5 w-5" />
                                </div>
                                <div>
                                    <h2 id="payment-modal-title" class="text-lg font-black text-slate-900">
                                        {{ selectedTask.isPaid ? 'Batalkan Status Fee?' : 'Konfirmasi Pembayaran Fee' }}
                                    </h2>
                                    <p class="mt-0.5 text-xs font-medium text-slate-500">
                                        Periksa pembayaran client sebelum melanjutkan.
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                class="grid h-9 w-9 place-items-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-40"
                                :disabled="paymentProcessing"
                                aria-label="Tutup modal"
                                @click="closePaymentModal"
                            >
                                <X class="h-5 w-5" />
                            </button>
                        </div>

                        <div class="max-h-[70vh] overflow-y-auto px-5 py-5 sm:px-6">
                            <div v-if="previewLoading" class="space-y-3" aria-live="polite">
                                <div class="h-20 animate-pulse rounded-2xl bg-slate-100"></div>
                                <div class="h-36 animate-pulse rounded-2xl bg-slate-100"></div>
                                <p class="text-center text-sm font-semibold text-slate-500">Memeriksa invoice dan pembayaran terbaru...</p>
                            </div>

                            <div v-else-if="previewError" class="rounded-2xl border border-rose-200 bg-rose-50 p-4">
                                <p class="font-bold text-rose-700">Pemeriksaan pembayaran gagal</p>
                                <p class="mt-1 text-sm text-rose-600">{{ previewError }}</p>
                                <button
                                    type="button"
                                    class="mt-3 rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white"
                                    @click="openPaymentModal(selectedTask)"
                                >
                                    Coba Lagi
                                </button>
                            </div>

                            <div v-else-if="paymentPreview" class="space-y-4">
                                <div class="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-2">
                                    <div>
                                        <p class="text-[10px] font-black uppercase tracking-wider text-slate-400">Tugas Pegawai</p>
                                        <p class="mt-1 font-bold text-slate-900">
                                            {{ paymentPreview.task.employeeName }} · {{ paymentPreview.task.taskType }}
                                        </p>
                                        <p v-if="paymentPreview.task.customTask" class="text-xs text-slate-500">
                                            {{ paymentPreview.task.customTask }}
                                        </p>
                                    </div>
                                    <div class="sm:text-right">
                                        <p class="text-[10px] font-black uppercase tracking-wider text-slate-400">Fee Pegawai</p>
                                        <p class="mt-1 text-lg font-black text-slate-900">{{ formatCurrency(paymentPreview.task.fee) }}</p>
                                    </div>
                                    <div class="sm:col-span-2 border-t border-slate-200 pt-3">
                                        <p class="font-bold text-slate-800">{{ paymentPreview.task.trackingCode }} · {{ paymentPreview.task.jobTitle }}</p>
                                        <p class="text-xs text-slate-500">Client: {{ paymentPreview.task.clientName || '-' }}</p>
                                    </div>
                                </div>

                                <div v-if="paymentPreview.billing.hasInvoice" class="overflow-hidden rounded-2xl border border-slate-200">
                                    <div class="flex items-center gap-2 border-b border-slate-200 bg-white px-4 py-3">
                                        <ReceiptText class="h-4 w-4 text-[var(--primary)]" />
                                        <h3 class="text-sm font-black text-slate-800">Status Pembayaran Berkas</h3>
                                    </div>
                                    <div class="grid grid-cols-3 gap-2 bg-slate-50 px-4 py-3 text-center">
                                        <div>
                                            <p class="text-[10px] font-bold uppercase text-slate-400">Total Invoice</p>
                                            <p class="mt-1 text-sm font-black text-slate-900">{{ formatCurrency(paymentPreview.billing.totalInvoiceAmount) }}</p>
                                        </div>
                                        <div>
                                            <p class="text-[10px] font-bold uppercase text-slate-400">Sudah Dibayar</p>
                                            <p class="mt-1 text-sm font-black text-emerald-600">{{ formatCurrency(paymentPreview.billing.totalPaidAmount) }}</p>
                                        </div>
                                        <div>
                                            <p class="text-[10px] font-bold uppercase text-slate-400">Kekurangan</p>
                                            <p class="mt-1 text-sm font-black" :class="paymentPreview.billing.totalRemainingAmount > 0 ? 'text-rose-600' : 'text-emerald-600'">
                                                {{ formatCurrency(paymentPreview.billing.totalRemainingAmount) }}
                                            </p>
                                        </div>
                                    </div>
                                    <div class="h-2 bg-slate-100">
                                        <div class="h-full bg-emerald-500 transition-all duration-500" :style="{ width: `${paymentPercentage}%` }"></div>
                                    </div>
                                    <div v-if="paymentPreview.billing.invoices.length > 1" class="max-h-36 divide-y divide-slate-100 overflow-y-auto bg-white">
                                        <div v-for="invoice in paymentPreview.billing.invoices" :key="invoice.id" class="flex items-center justify-between gap-3 px-4 py-2.5 text-xs">
                                            <div>
                                                <p class="font-bold text-slate-800">{{ invoice.invoiceNumber }}</p>
                                                <p class="text-slate-400">{{ invoice.status }}</p>
                                            </div>
                                            <div class="text-right">
                                                <p class="font-bold text-slate-700">Dibayar {{ formatCurrency(invoice.paidAmount) }}</p>
                                                <p class="text-rose-600">Sisa {{ formatCurrency(invoice.remainingAmount) }}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div v-else class="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-800">
                                    <p class="font-black">Berkas belum memiliki invoice</p>
                                    <p class="mt-1 text-sm">Belum ada pembayaran client yang dapat dijadikan acuan.</p>
                                </div>

                                <div
                                    class="rounded-2xl border p-4"
                                    :class="selectedTask.isPaid
                                        ? 'border-amber-200 bg-amber-50 text-amber-800'
                                        : paymentPreview.billing.totalRemainingAmount > 0 || !paymentPreview.billing.hasInvoice
                                            ? 'border-rose-200 bg-rose-50 text-rose-800'
                                            : 'border-emerald-200 bg-emerald-50 text-emerald-800'"
                                >
                                    <p class="font-black">
                                        <template v-if="selectedTask.isPaid">Perhatian: status fee akan dibatalkan</template>
                                        <template v-else-if="!paymentPreview.billing.hasInvoice">Lanjutkan tanpa invoice?</template>
                                        <template v-else-if="paymentPreview.billing.totalRemainingAmount > 0">Invoice client belum lunas</template>
                                        <template v-else>Pembayaran client sudah lunas</template>
                                    </p>
                                    <p class="mt-1 text-sm leading-relaxed">
                                        <template v-if="selectedTask.isPaid">Catatan pengeluaran fee pegawai akan dihapus dan status kembali menjadi Belum Terbayar.</template>
                                        <template v-else-if="!paymentPreview.billing.hasInvoice">Anda tetap dapat menandai fee sebagai Terbayar, tetapi belum ada data invoice atau pembayaran client.</template>
                                        <template v-else-if="paymentPreview.billing.totalRemainingAmount > 0">Masih ada kekurangan pembayaran {{ formatCurrency(paymentPreview.billing.totalRemainingAmount) }}. Pastikan pembayaran fee tetap ingin dilanjutkan.</template>
                                        <template v-else>Fee dapat dibayarkan dan otomatis dicatat sebagai pengeluaran.</template>
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div class="flex flex-col-reverse gap-2 border-t border-slate-100 bg-slate-50 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
                            <button
                                type="button"
                                class="h-10 rounded-xl border border-slate-300 bg-white px-5 text-sm font-bold text-slate-700 transition hover:bg-slate-100 disabled:opacity-40"
                                :disabled="paymentProcessing"
                                @click="closePaymentModal"
                            >
                                Kembali
                            </button>
                            <button
                                v-if="paymentPreview && !previewError"
                                type="button"
                                class="h-10 rounded-xl px-5 text-sm font-bold text-white shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                                :class="selectedTask.isPaid ? 'bg-amber-600' : 'bg-emerald-600'"
                                :disabled="previewLoading || paymentProcessing"
                                @click="confirmPaymentChange"
                            >
                                {{ paymentProcessing
                                    ? 'Memproses...'
                                    : selectedTask.isPaid
                                        ? 'Ya, Batalkan Status Fee'
                                        : 'Ya, Lanjutkan Pembayaran Fee' }}
                            </button>
                        </div>
                    </div>
                </div>
            </Transition>
        </Teleport>
    </AppLayout>
</template>
