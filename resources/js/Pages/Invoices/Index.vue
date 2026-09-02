<script setup lang="ts">
import { Head, Link, router } from "@inertiajs/vue3";
import { ref } from "vue";
import {
    CircleDollarSign,
    Clock,
    Download,
    Plus,
    Receipt,
    Search,
    WalletCards,
    ChevronRight,
} from "@lucide/vue";
import AppLayout from "@/Layouts/AppLayout.vue";

const p = defineProps<{
    invoices: any;
    search: string;
    status: string;
    stats: any;
}>();

const q = ref(p.search);
const st = ref(p.status);

const filter = () =>
    router.get(
        "/dashboard/invoice",
        { search: q.value, status: st.value },
        { preserveState: true, replace: true }
    );

const money = (x: any) =>
    new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0,
    }).format(Number(x || 0));

const date = (x: any) =>
    x
        ? new Date(x).toLocaleDateString("id-ID", {
              day: "2-digit",
              month: "short",
              year: "numeric",
          })
        : "-";

const statusCardStyle = (status: string) => {
    switch (status) {
        case "Lunas":
            return "bg-emerald-50/90 border-emerald-200 text-emerald-950 shadow-sm";
        case "DP Bayar":
            return "bg-sky-50/90 border-sky-200 text-sky-950 shadow-sm";
        default:
            return "bg-amber-50/90 border-amber-200 text-amber-950 shadow-sm";
    }
};

const badgeStyle = (status: string) => {
    switch (status) {
        case "Lunas":
            return "bg-emerald-100 text-emerald-800 border border-emerald-300";
        case "DP Bayar":
            return "bg-sky-100 text-sky-800 border border-sky-300";
        default:
            return "bg-amber-100 text-amber-800 border border-amber-300";
    }
};
</script>

<template>
    <Head title="Invoice" />
    <AppLayout>
        <main class="mx-auto max-w-7xl space-y-6 p-3 sm:p-5">
            <!-- Header section -->
            <div class="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div class="flex items-center gap-3">
                    <span class="grid h-11 w-11 place-items-center rounded-2xl bg-[var(--primary)]/10 text-[var(--primary)] shrink-0">
                        <Receipt class="h-6 w-6" />
                    </span>
                    <div>
                        <h1 class="text-xl sm:text-2xl font-black text-slate-900">Invoice</h1>
                        <p class="text-xs sm:text-sm font-medium text-slate-500">Kelola tagihan dan pembayaran client.</p>
                    </div>
                </div>
                <div class="flex flex-wrap items-center gap-2">
                    <a
                        href="/dashboard/reports/export"
                        class="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-sm"
                    >
                        <Download class="h-4 w-4" />
                        <span>Export CSV</span>
                    </a>
                    <Link
                        href="/dashboard/invoice/new"
                        class="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-5 text-sm font-bold text-white shadow-md transition-all hover:opacity-90 active:scale-95"
                    >
                        <Plus class="h-4 w-4" />
                        <span>Buat Invoice</span>
                    </Link>
                </div>
            </div>

            <!-- Stats section -->
            <div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div
                    v-for="x in [
                        { l: 'Sudah Lunas', v: stats.paid, i: CircleDollarSign },
                        { l: 'Pembayaran DP', v: stats.dp, i: WalletCards },
                        { l: 'Belum Dibayar', v: stats.unpaid, i: Clock },
                    ]"
                    :key="x.l"
                    class="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                    <p class="text-[11px] font-bold uppercase tracking-wider text-slate-500">{{ x.l }}</p>
                    <p class="mt-1 text-xl sm:text-2xl font-black text-slate-800">{{ money(x.v) }}</p>
                    <component :is="x.i" class="absolute -bottom-2 -right-2 h-14 w-14 text-slate-400/15" />
                </div>
            </div>

            <!-- Search & Filter section -->
            <div class="flex flex-col sm:flex-row gap-3">
                <form @submit.prevent="filter" class="relative flex-1">
                    <Search class="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                        v-model="q"
                        class="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm font-medium focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20"
                        placeholder="Cari invoice atau client..."
                    />
                </form>
                <select
                    v-model="st"
                    @change="filter"
                    class="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20"
                >
                    <option value="">Semua Status</option>
                    <option>Belum Bayar</option>
                    <option>DP Bayar</option>
                    <option>Lunas</option>
                </select>
            </div>

            <!-- MOBILE CARDVIEW -->
            <div class="space-y-3.5 md:hidden">
                <div v-if="!invoices.data.length" class="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
                    Belum ada invoice.
                </div>
                <div
                    v-for="x in invoices.data"
                    :key="x.id"
                    class="rounded-2xl border p-4 transition-all"
                    :class="statusCardStyle(x.status)"
                >
                    <div class="flex items-start justify-between gap-2 border-b border-black/5 pb-3">
                        <div>
                            <code class="text-xs font-black px-2 py-0.5 rounded bg-white/70 shadow-sm" :style="{ color: 'var(--primary)' }">
                                {{ x.invoiceNumber }}
                            </code>
                            <span class="ml-2 text-[11px] font-semibold opacity-75">{{ date(x.date) }}</span>
                        </div>
                        <span class="rounded-full px-2.5 py-0.5 text-[11px] font-black uppercase" :class="badgeStyle(x.status)">
                            {{ x.status }}
                        </span>
                    </div>
                    <div class="mt-3">
                        <h3 class="font-bold text-sm leading-snug">{{ x.clientName || '-' }}</h3>
                        <p class="mt-1 text-xs opacity-80 line-clamp-2">{{ x.jobTitle || '-' }}</p>
                    </div>
                    <div class="mt-3 flex items-center justify-between border-t border-black/5 pt-3">
                        <div>
                            <span class="block text-[10px] uppercase tracking-wider opacity-60">Total Invoice</span>
                            <span class="font-black text-sm">{{ money(x.amount) }}</span>
                        </div>
                        <Link
                            :href="`/dashboard/invoice/${x.id}`"
                            class="inline-flex items-center gap-1 text-xs font-black text-slate-900 bg-white/80 hover:bg-white px-3 py-1.5 rounded-lg shadow-sm border border-black/10 transition-all"
                        >
                            <span>Detail</span>
                            <ChevronRight class="h-3 w-3" />
                        </Link>
                    </div>
                </div>
            </div>

            <!-- DESKTOP TABLE VIEW -->
            <div class="hidden md:block overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div class="overflow-x-auto">
                    <table class="w-full text-left text-sm">
                        <thead class="border-b border-slate-200 bg-slate-50/80 text-xs font-bold uppercase tracking-wider text-slate-500">
                            <tr>
                                <th class="p-4 pl-6">Nomor Invoice</th>
                                <th>Client / Berkas</th>
                                <th>Tanggal</th>
                                <th>Jatuh Tempo</th>
                                <th>Total</th>
                                <th>Status</th>
                                <th class="pr-6 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-100">
                            <tr v-if="!invoices.data.length">
                                <td colspan="7" class="py-16 text-center text-slate-500">Belum ada invoice.</td>
                            </tr>
                            <tr
                                v-for="x in invoices.data"
                                :key="x.id"
                                class="hover:bg-slate-50/80 transition-colors"
                            >
                                <td class="p-4 pl-6 font-mono font-black text-xs" :style="{ color: 'var(--primary)' }">
                                    {{ x.invoiceNumber }}
                                </td>
                                <td>
                                    <p class="font-bold text-slate-800">{{ x.clientName || '-' }}</p>
                                    <p class="max-w-[240px] truncate text-xs text-slate-500">{{ x.jobTitle || '-' }}</p>
                                </td>
                                <td class="font-medium text-slate-700 text-xs">{{ date(x.date) }}</td>
                                <td class="font-medium text-slate-700 text-xs">{{ date(x.dueDate) }}</td>
                                <td class="font-black text-slate-900">{{ money(x.amount) }}</td>
                                <td>
                                    <span class="inline-block rounded-full px-3 py-1 text-xs font-black uppercase" :class="badgeStyle(x.status)">
                                        {{ x.status }}
                                    </span>
                                </td>
                                <td class="pr-6 text-right">
                                    <Link
                                        :href="`/dashboard/invoice/${x.id}`"
                                        class="inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-bold transition-all hover:bg-slate-50"
                                        :style="{ borderColor: 'color-mix(in srgb, var(--primary) 30%, transparent)', color: 'var(--primary)' }"
                                    >
                                        <span>Detail</span>
                                        <ChevronRight class="h-3 w-3" />
                                    </Link>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </main>
    </AppLayout>
</template>
