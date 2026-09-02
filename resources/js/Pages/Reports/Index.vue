<script setup lang="ts">
import { Head, router } from '@inertiajs/vue3';
import AppLayout from '@/Layouts/AppLayout.vue';
import { reactive } from 'vue';
import { Download, Filter, FileText, TrendingUp, TrendingDown, Users } from '@lucide/vue';

const p = defineProps<{
    from: string;
    to: string;
    status: Record<string, number>;
    clients: number;
    income: number;
    expenses: number;
}>();

const f = reactive({ from: p.from, to: p.to });

const money = (x: any) =>
    new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
    }).format(Number(x || 0));

const statusBadge = (s: string) => {
    switch (s) {
        case "SELESAI":
            return "bg-emerald-50 text-emerald-800 border-emerald-200";
        case "PROSES":
        case "VERIFIKASI":
            return "bg-sky-50 text-sky-800 border-sky-200";
        case "REVISI":
            return "bg-purple-50 text-purple-800 border-purple-200";
        case "CANCELLED":
            return "bg-rose-50 text-rose-800 border-rose-200";
        default:
            return "bg-amber-50 text-amber-800 border-amber-200";
    }
};
</script>

<template>
    <Head title="Laporan" />
    <AppLayout>
        <main class="mx-auto max-w-7xl space-y-6 p-3 sm:p-5">
            <!-- Header section -->
            <div class="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                    <h1 class="text-xl sm:text-2xl font-black text-slate-900">Laporan & Analisis</h1>
                    <p class="mt-1 text-xs sm:text-sm font-medium text-slate-500">Ringkasan performa operasional dan keuangan kantor.</p>
                </div>

                <form @submit.prevent="router.get('/dashboard/reports', f)" class="flex flex-wrap items-center gap-2">
                    <input
                        v-model="f.from"
                        type="date"
                        class="h-11 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 shadow-sm focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20"
                    />
                    <span class="text-xs font-bold text-slate-400">s/d</span>
                    <input
                        v-model="f.to"
                        type="date"
                        class="h-11 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 shadow-sm focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20"
                    />
                    <button
                        type="submit"
                        class="inline-flex h-11 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50 transition-all"
                    >
                        <Filter class="h-3.5 w-3.5" />
                        <span>Filter</span>
                    </button>
                    <a
                        :href="`/dashboard/reports/export?from=${f.from}&to=${f.to}`"
                        class="inline-flex h-11 items-center gap-1.5 rounded-xl px-4 text-xs font-bold text-white shadow-md transition-all hover:opacity-90 active:scale-95"
                        :style="{ backgroundColor: 'var(--primary)' }"
                    >
                        <Download class="h-3.5 w-3.5" />
                        <span>Ekspor CSV</span>
                    </a>
                </form>
            </div>

            <!-- Stats Overview Cards -->
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <article class="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <p class="text-xs font-bold uppercase tracking-wider text-slate-500">Client Baru</p>
                    <p class="mt-2 text-3xl font-black text-slate-900">{{ clients }}</p>
                    <Users class="absolute -bottom-2 -right-2 h-14 w-14 text-slate-400/15" />
                </article>

                <article class="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <p class="text-xs font-bold uppercase tracking-wider text-slate-500">Total Pemasukan</p>
                    <p class="mt-2 text-2xl sm:text-3xl font-black text-emerald-600">{{ money(income) }}</p>
                    <TrendingUp class="absolute -bottom-2 -right-2 h-14 w-14 text-emerald-500/15" />
                </article>

                <article class="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <p class="text-xs font-bold uppercase tracking-wider text-slate-500">Total Pengeluaran</p>
                    <p class="mt-2 text-2xl sm:text-3xl font-black text-rose-600">{{ money(expenses) }}</p>
                    <TrendingDown class="absolute -bottom-2 -right-2 h-14 w-14 text-rose-500/15" />
                </article>
            </div>

            <!-- Berkas Status Breakdown -->
            <section class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div class="flex items-center gap-2">
                    <FileText class="h-5 w-5" :style="{ color: 'var(--primary)' }" />
                    <h2 class="text-base sm:text-lg font-black text-slate-900">Breakdown Status Berkas</h2>
                </div>
                <div class="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                    <div
                        v-for="(n, s) in status"
                        :key="s"
                        class="rounded-xl border p-4 transition-all"
                        :class="statusBadge(String(s))"
                    >
                        <p class="text-xs font-bold uppercase tracking-wider opacity-80">{{ s }}</p>
                        <p class="mt-1 text-2xl font-black">{{ n }}</p>
                    </div>
                </div>
            </section>
        </main>
    </AppLayout>
</template>
