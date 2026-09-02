<script setup lang="ts">
import { computed, ref } from "vue";
import { Head, router, useForm } from "@inertiajs/vue3";
import {
    Plus,
    Trash2,
    TrendingDown,
    TrendingUp,
    Wallet,
    X,
    Filter,
    Calendar,
    ArrowUpRight,
    ArrowDownLeft,
    Receipt,
} from "@lucide/vue";
import AppLayout from "@/Layouts/AppLayout.vue";

const props = defineProps<{
    income: number;
    expense: number;
    balance: number;
    months: any[];
    journal: any;
    from: string;
    to: string;
    entryTypeFilter?: string;
}>();

const dateFilter = useForm({
    from: props.from,
    to: props.to,
    entryType: props.entryTypeFilter || "ALL",
});

const applyDateFilter = () => {
    router.get("/dashboard/finance", dateFilter.data(), {
        preserveState: true,
        replace: true,
    });
};

const filterType = (type: string) => {
    dateFilter.entryType = type;
    applyDateFilter();
};

// Modals State
const showIncomeModal = ref(false);
const showExpenseModal = ref(false);

// Form Income (Uang Masuk)
const incomeForm = useForm({
    category: "Pemasukan Manual",
    amount: 0,
    date: new Date().toISOString().slice(0, 10),
    description: "",
});

// Form Expense (Uang Keluar)
const expenseForm = useForm({
    category: "Operasional",
    amount: 0,
    expenseDate: new Date().toISOString().slice(0, 10),
    description: "",
});

// Thousand Formatting Helpers
const formatNumber = (value: number | string) =>
    new Intl.NumberFormat("id-ID", {
        maximumFractionDigits: 0,
    }).format(Number(value || 0));

const updateIncomeAmount = (event: Event) => {
    const raw = (event.target as HTMLInputElement).value.replace(/\D/g, "");
    incomeForm.amount = raw ? Number(raw) : 0;
};

const updateExpenseAmount = (event: Event) => {
    const raw = (event.target as HTMLInputElement).value.replace(/\D/g, "");
    expenseForm.amount = raw ? Number(raw) : 0;
};

const selectAmount = (event: FocusEvent) => {
    (event.target as HTMLInputElement).select();
};

const money = (value: any) =>
    new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0,
    }).format(Number(value || 0));

const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
    }).format(d);
};

const maxValue = Math.max(
    1,
    ...props.months.flatMap((x) => [Number(x.income), Number(x.expense)]),
);

const submitIncome = () => {
    incomeForm.post("/dashboard/finance/income", {
        onSuccess: () => {
            showIncomeModal.value = false;
            incomeForm.reset("amount", "description");
        },
    });
};

const submitExpense = () => {
    expenseForm.post("/dashboard/finance/expenses", {
        onSuccess: () => {
            showExpenseModal.value = false;
            expenseForm.reset("amount", "description");
        },
    });
};

const removeTransaction = (type: string, id: string) => {
    const label = type === "INCOME" ? "Uang Masuk" : "Uang Keluar";
    if (confirm(`Apakah Anda yakin ingin menghapus catatan ${label} ini?`)) {
        router.delete(`/dashboard/finance/${type.toLowerCase()}/${id}`);
    }
};

const getRowNumber = (index: number | string) => {
    const page = Number(props.journal?.current_page || 1);
    const perPage = Number(props.journal?.per_page || 20);
    return (page - 1) * perPage + Number(index) + 1;
};
</script>

<template>
    <Head title="Jurnal Keuangan" />
    <AppLayout>
        <main class="mx-auto max-w-7xl space-y-6 p-3 sm:p-5">
            <!-- Header -->
            <div class="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                <div>
                    <h1 class="text-2xl font-black text-slate-900">Monitoring Jurnal Keuangan</h1>
                    <p class="mt-1 text-xs sm:text-sm text-slate-500 font-medium">
                        Kelola jurnal Uang Masuk, Uang Keluar, dan saldo kas kantor Notaris.
                    </p>
                </div>

                <!-- Top Header Action Buttons -->
                <div class="flex flex-wrap items-center gap-2.5">
                    <button
                        type="button"
                        @click="showIncomeModal = true"
                        class="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-700 active:scale-95 cursor-pointer"
                    >
                        <TrendingUp class="h-4 w-4" />
                        <span>+ Tambah Uang Masuk</span>
                    </button>

                    <button
                        type="button"
                        @click="showExpenseModal = true"
                        class="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-rose-700 active:scale-95 cursor-pointer"
                    >
                        <TrendingDown class="h-4 w-4" />
                        <span>- Tambah Uang Keluar</span>
                    </button>
                </div>
            </div>

            <!-- Date Filter Panel -->
            <div class="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div class="flex items-center gap-2 text-xs font-bold text-slate-700">
                    <Calendar class="h-4 w-4 text-[var(--primary)]" />
                    <span>Periode Laporan:</span>
                </div>
                <form @submit.prevent="applyDateFilter" class="flex flex-wrap items-center gap-2">
                    <input
                        v-model="dateFilter.from"
                        type="date"
                        class="h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-semibold"
                    />
                    <span class="text-xs font-bold text-slate-400">s/d</span>
                    <input
                        v-model="dateFilter.to"
                        type="date"
                        class="h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-semibold"
                    />
                    <button
                        type="submit"
                        class="h-10 rounded-xl bg-[var(--primary)] px-4 text-xs font-bold text-white shadow-sm transition hover:opacity-90 active:scale-95"
                    >
                        Terapkan Tanggal
                    </button>
                </form>
            </div>

            <!-- Stat Summary Cards -->
            <section class="grid gap-4 md:grid-cols-3">
                <article class="flex items-center gap-4 rounded-2xl border border-emerald-200 bg-emerald-50/50 p-5 shadow-sm">
                    <span class="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-emerald-100 text-emerald-700">
                        <TrendingUp class="h-6 w-6" />
                    </span>
                    <div>
                        <p class="text-xs font-bold uppercase tracking-wider text-emerald-700">Uang Masuk (Pemasukan)</p>
                        <p class="mt-1 text-2xl font-black text-emerald-700">
                            {{ money(income) }}
                        </p>
                    </div>
                </article>

                <article class="flex items-center gap-4 rounded-2xl border border-rose-200 bg-rose-50/50 p-5 shadow-sm">
                    <span class="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-rose-100 text-rose-700">
                        <TrendingDown class="h-6 w-6" />
                    </span>
                    <div>
                        <p class="text-xs font-bold uppercase tracking-wider text-rose-700">Uang Keluar (Pengeluaran)</p>
                        <p class="mt-1 text-2xl font-black text-rose-700">
                            {{ money(expense) }}
                        </p>
                    </div>
                </article>

                <article class="flex items-center gap-4 rounded-2xl border border-sky-200 bg-sky-50/50 p-5 shadow-sm">
                    <span class="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-sky-100 text-sky-700">
                        <Wallet class="h-6 w-6" />
                    </span>
                    <div>
                        <p class="text-xs font-bold uppercase tracking-wider text-sky-700">Saldo Kas (Netto)</p>
                        <p class="mt-1 text-2xl font-black" :class="balance >= 0 ? 'text-sky-700' : 'text-rose-600'">
                            {{ money(balance) }}
                        </p>
                    </div>
                </article>
            </section>

            <!-- Arus Kas Chart Section -->
            <section class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div class="flex items-center justify-between">
                    <div>
                        <h2 class="font-black text-slate-800 text-base">Grafik Arus Kas 6 Bulan Terakhir</h2>
                        <p class="text-xs text-slate-500 font-medium">
                            Hijau menandakan Uang Masuk, Merah menandakan Uang Keluar.
                        </p>
                    </div>
                </div>
                <div class="mt-6 flex h-44 items-end gap-3 border-b border-slate-200 pb-2">
                    <div
                        v-for="month in months"
                        :key="month.key"
                        class="flex h-full flex-1 items-end justify-center gap-1.5"
                    >
                        <div
                            class="w-5 rounded-t-md bg-emerald-500 transition-all hover:bg-emerald-600"
                            :style="{
                                height: `${Math.max(4, (Number(month.income) / maxValue) * 90)}%`,
                            }"
                            :title="`Uang Masuk: ${money(month.income)}`"
                        />
                        <div
                            class="w-5 rounded-t-md bg-rose-500 transition-all hover:bg-rose-600"
                            :style="{
                                height: `${Math.max(4, (Number(month.expense) / maxValue) * 90)}%`,
                            }"
                            :title="`Uang Keluar: ${money(month.expense)}`"
                        />
                    </div>
                </div>
                <div class="mt-2 grid grid-cols-6 text-center text-xs font-bold text-slate-500">
                    <span v-for="month in months" :key="month.key">{{ month.label }}</span>
                </div>
            </section>

            <!-- Jurnal Transaksi (Uang Masuk & Uang Keluar) -->
            <section class="space-y-4">
                <div class="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                    <div class="flex items-center gap-2">
                        <Receipt class="h-5 w-5 text-[var(--primary)]" />
                        <h2 class="text-lg font-black text-slate-800">Jurnal Transaksi Kas</h2>
                    </div>

                    <!-- Type Tabs -->
                    <div class="inline-flex rounded-xl bg-slate-100 p-1">
                        <button
                            type="button"
                            @click="filterType('ALL')"
                            class="rounded-lg px-3 py-1.5 text-xs font-bold transition"
                            :class="dateFilter.entryType === 'ALL' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'"
                        >
                            Semua Transaksi
                        </button>
                        <button
                            type="button"
                            @click="filterType('INCOME')"
                            class="rounded-lg px-3 py-1.5 text-xs font-bold transition"
                            :class="dateFilter.entryType === 'INCOME' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-500 hover:text-emerald-700'"
                        >
                            Uang Masuk
                        </button>
                        <button
                            type="button"
                            @click="filterType('EXPENSE')"
                            class="rounded-lg px-3 py-1.5 text-xs font-bold transition"
                            :class="dateFilter.entryType === 'EXPENSE' ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-500 hover:text-rose-700'"
                        >
                            Uang Keluar
                        </button>
                    </div>
                </div>

                <!-- Table Card -->
                <div class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div class="overflow-x-auto">
                        <table class="w-full text-left text-sm">
                            <thead class="bg-slate-50/80 border-b border-slate-200">
                                <tr class="text-[11px] font-black uppercase tracking-wider text-slate-500">
                                    <th class="w-12 px-5 py-3.5 text-center">No.</th>
                                    <th class="px-5 py-3.5">Tanggal</th>
                                    <th class="px-5 py-3.5">Jenis Transaksi</th>
                                    <th class="px-5 py-3.5">Kategori / Sumber</th>
                                    <th class="px-5 py-3.5">Keterangan</th>
                                    <th class="px-5 py-3.5 text-right">Nominal</th>
                                    <th class="px-5 py-3.5 text-center">Aksi</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-slate-100">
                                <tr v-if="!journal.data.length">
                                    <td colspan="7" class="py-14 text-center text-slate-400">
                                        <Receipt class="mx-auto h-10 w-10 opacity-30" />
                                        <p class="mt-2 text-sm font-bold text-slate-600">Belum ada transaksi kas pada periode ini.</p>
                                    </td>
                                </tr>
                                <tr v-for="(item, index) in journal.data" :key="item.id" class="transition hover:bg-slate-50/70">
                                    <td class="px-5 py-3.5 text-center text-xs font-bold text-slate-400">
                                        {{ getRowNumber(index) }}
                                    </td>
                                    <td class="px-5 py-3.5 text-xs font-medium text-slate-600 whitespace-nowrap">
                                        {{ formatDate(item.entryDate) }}
                                    </td>
                                    <td class="px-5 py-3.5">
                                        <span
                                            class="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold border"
                                            :class="item.entryType === 'INCOME' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'"
                                        >
                                            <ArrowUpRight v-if="item.entryType === 'INCOME'" class="h-3 w-3" />
                                            <ArrowDownLeft v-else class="h-3 w-3" />
                                            <span>{{ item.entryType === 'INCOME' ? 'Uang Masuk' : 'Uang Keluar' }}</span>
                                        </span>
                                    </td>
                                    <td class="px-5 py-3.5 font-bold text-slate-900 text-sm">
                                        {{ item.category || '-' }}
                                    </td>
                                    <td class="px-5 py-3.5 text-xs text-slate-600 max-w-xs truncate" :title="item.description">
                                        {{ item.description || '-' }}
                                    </td>
                                    <td
                                        class="px-5 py-3.5 text-right font-black text-sm"
                                        :class="item.entryType === 'INCOME' ? 'text-emerald-600' : 'text-rose-600'"
                                    >
                                        {{ item.entryType === 'INCOME' ? '+ ' : '- ' }}{{ money(item.amount) }}
                                    </td>
                                    <td class="px-5 py-3.5 text-center">
                                        <button
                                            type="button"
                                            @click="removeTransaction(item.entryType, item.id)"
                                            title="Hapus Catatan Transaksi"
                                            class="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-rose-600 transition hover:bg-rose-100 cursor-pointer"
                                        >
                                            <Trash2 class="h-4 w-4" />
                                        </button>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <!-- Pagination -->
                    <div v-if="journal.links && journal.links.length > 3" class="flex items-center justify-between border-t border-slate-200 bg-slate-50/50 px-5 py-3">
                        <p class="text-xs font-medium text-slate-500">
                            Menampilkan <span class="font-bold text-slate-800">{{ journal.from }}</span> - <span class="font-bold text-slate-800">{{ journal.to }}</span> dari <span class="font-bold text-slate-800">{{ journal.total }}</span> transaksi
                        </p>
                        <div class="flex gap-1">
                            <Component
                                :is="link.url ? 'a' : 'span'"
                                v-for="(link, i) in journal.links"
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
            </section>
        </main>

        <!-- MODAL TAMBAH UANG MASUK -->
        <Teleport to="body">
            <div
                v-if="showIncomeModal"
                class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4"
            >
                <div class="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl space-y-4">
                    <div class="flex items-center justify-between border-b border-slate-100 pb-3">
                        <div class="flex items-center gap-2">
                            <div class="grid h-9 w-9 place-items-center rounded-xl bg-emerald-100 text-emerald-700">
                                <TrendingUp class="h-5 w-5" />
                            </div>
                            <h3 class="text-lg font-black text-slate-900">Catat Uang Masuk</h3>
                        </div>
                        <button
                            type="button"
                            @click="showIncomeModal = false"
                            class="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                        >
                            <X class="h-5 w-5" />
                        </button>
                    </div>

                    <form @submit.prevent="submitIncome" class="space-y-4">
                        <div>
                            <label class="block text-xs font-bold text-slate-600">Kategori / Sumber Pemasukan</label>
                            <select
                                v-model="incomeForm.category"
                                class="mt-1 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium focus:border-emerald-500 focus:ring-emerald-500"
                            >
                                <option value="Pemasukan Manual">Pemasukan Manual</option>
                                <option value="Pembayaran Client">Pembayaran Client</option>
                                <option value="Konsultasi / Jasa">Konsultasi / Jasa</option>
                                <option value="Pengembalian Dana">Pengembalian Dana</option>
                                <option value="Lainnya">Lainnya</option>
                            </select>
                        </div>

                        <div>
                            <label class="block text-xs font-bold text-slate-600">Nominal Uang Masuk (Rp)</label>
                            <input
                                :value="formatNumber(incomeForm.amount)"
                                type="text"
                                required
                                placeholder="0"
                                class="mt-1 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-base font-black text-emerald-700 focus:border-emerald-500"
                                @input="updateIncomeAmount"
                                @focus="selectAmount"
                            />
                        </div>

                        <div>
                            <label class="block text-xs font-bold text-slate-600">Tanggal Transaksi</label>
                            <input
                                v-model="incomeForm.date"
                                type="date"
                                required
                                class="mt-1 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium focus:border-emerald-500"
                            />
                        </div>

                        <div>
                            <label class="block text-xs font-bold text-slate-600">Keterangan / Rincian</label>
                            <textarea
                                v-model="incomeForm.description"
                                rows="3"
                                placeholder="Tuliskan catatan detail Uang Masuk..."
                                class="mt-1 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm font-medium focus:border-emerald-500"
                            />
                        </div>

                        <div class="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                            <button
                                type="button"
                                @click="showIncomeModal = false"
                                class="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50"
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                :disabled="incomeForm.processing"
                                class="rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50"
                            >
                                {{ incomeForm.processing ? 'Menyimpan...' : 'Simpan Uang Masuk' }}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </Teleport>

        <!-- MODAL TAMBAH UANG KELUAR -->
        <Teleport to="body">
            <div
                v-if="showExpenseModal"
                class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4"
            >
                <div class="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl space-y-4">
                    <div class="flex items-center justify-between border-b border-slate-100 pb-3">
                        <div class="flex items-center gap-2">
                            <div class="grid h-9 w-9 place-items-center rounded-xl bg-rose-100 text-rose-700">
                                <TrendingDown class="h-5 w-5" />
                            </div>
                            <h3 class="text-lg font-black text-slate-900">Catat Uang Keluar</h3>
                        </div>
                        <button
                            type="button"
                            @click="showExpenseModal = false"
                            class="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                        >
                            <X class="h-5 w-5" />
                        </button>
                    </div>

                    <form @submit.prevent="submitExpense" class="space-y-4">
                        <div>
                            <label class="block text-xs font-bold text-slate-600">Kategori Pengeluaran</label>
                            <select
                                v-model="expenseForm.category"
                                class="mt-1 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium focus:border-rose-500 focus:ring-rose-500"
                            >
                                <option value="Operasional">Operasional Kantor</option>
                                <option value="Fee Pegawai">Fee Pegawai</option>
                                <option value="Gaji & Bonus">Gaji & Bonus</option>
                                <option value="ATK & Perlengkapan">ATK & Perlengkapan</option>
                                <option value="Sewa / Listrik / Internet">Sewa / Listrik / Internet</option>
                                <option value="Lainnya">Lainnya</option>
                            </select>
                        </div>

                        <div>
                            <label class="block text-xs font-bold text-slate-600">Nominal Uang Keluar (Rp)</label>
                            <input
                                :value="formatNumber(expenseForm.amount)"
                                type="text"
                                required
                                placeholder="0"
                                class="mt-1 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-base font-black text-rose-700 focus:border-rose-500"
                                @input="updateExpenseAmount"
                                @focus="selectAmount"
                            />
                        </div>

                        <div>
                            <label class="block text-xs font-bold text-slate-600">Tanggal Transaksi</label>
                            <input
                                v-model="expenseForm.expenseDate"
                                type="date"
                                required
                                class="mt-1 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium focus:border-rose-500"
                            />
                        </div>

                        <div>
                            <label class="block text-xs font-bold text-slate-600">Keterangan / Rincian</label>
                            <textarea
                                v-model="expenseForm.description"
                                rows="3"
                                placeholder="Tuliskan catatan detail Uang Keluar..."
                                class="mt-1 w-full rounded-xl border border-slate-200 bg-white p-3 text-sm font-medium focus:border-rose-500"
                            />
                        </div>

                        <div class="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                            <button
                                type="button"
                                @click="showExpenseModal = false"
                                class="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50"
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                :disabled="expenseForm.processing"
                                class="rounded-xl bg-rose-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-rose-700 disabled:opacity-50"
                            >
                                {{ expenseForm.processing ? 'Menyimpan...' : 'Simpan Uang Keluar' }}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </Teleport>
    </AppLayout>
</template>
