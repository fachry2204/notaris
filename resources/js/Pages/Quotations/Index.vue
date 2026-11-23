<script setup lang="ts">
import { Head, Link, router } from "@inertiajs/vue3";
import { ref } from "vue";
import {
    BadgeCheck,
    CircleDollarSign,
    Clock3,
    FileSignature,
    Plus,
    Search,
    User,
    Calendar,
    ChevronRight,
} from "@lucide/vue";
import AppLayout from "@/Layouts/AppLayout.vue";
import PageHeader from "@/Components/DesignSystem/PageHeader.vue";
import StatCard from "@/Components/DesignSystem/StatCard.vue";
import EmptyState from "@/Components/DesignSystem/EmptyState.vue";

const props = defineProps<{
    quotations: any;
    search: string;
    status: string;
    group?: string;
    stats: any;
}>();

const query = ref(props.search);
const selectedStatus = ref(props.status);
const selectedGroup = ref(props.group || "");

const filter = () =>
    router.get(
        "/dashboard/quotation",
        { search: query.value, status: selectedStatus.value, group: selectedGroup.value },
        { preserveState: true, replace: true }
    );

const money = (value: any) =>
    new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0,
    }).format(Number(value || 0));

const date = (value: any) =>
    value
        ? new Date(`${String(value).slice(0, 10)}T00:00:00`).toLocaleDateString(
              "id-ID",
              { day: "2-digit", month: "short", year: "numeric" }
          )
        : "-";

const statusCardStyle = (status: string) => {
    switch (status) {
        case "Disetujui":
        case "Invoice Terbuat":
            return "bg-emerald-50/90 border-emerald-200 text-emerald-950 shadow-sm";
        case "Diterbitkan":
        case "Dikirim":
            return "bg-sky-50/90 border-sky-200 text-sky-950 shadow-sm";
        case "Ditolak":
        case "Kedaluwarsa":
            return "bg-rose-50/90 border-rose-200 text-rose-950 shadow-sm";
        default:
            return "bg-amber-50/90 border-amber-200 text-amber-950 shadow-sm";
    }
};

const badgeStyle = (status: string) => {
    switch (status) {
        case "Disetujui":
        case "Invoice Terbuat":
            return "bg-emerald-100 text-emerald-800 border border-emerald-300";
        case "Diterbitkan":
        case "Dikirim":
            return "bg-sky-100 text-sky-800 border border-sky-300";
        case "Ditolak":
        case "Kedaluwarsa":
            return "bg-rose-100 text-rose-800 border border-rose-300";
        default:
            return "bg-amber-100 text-amber-800 border border-amber-300";
    }
};
</script>

<template>
    <Head title="Quotation" />
    <AppLayout>
        <main class="mx-auto max-w-7xl space-y-6 p-3 sm:p-5">
            <!-- Header section -->
            <PageHeader title="Quotation" section="Billing / Quotation" description="Kelola penawaran harga untuk client."><template #icon><FileSignature class="h-6 w-6" /></template><template #actions><Link href="/dashboard/quotation/new" class="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-5 text-sm font-bold text-white shadow-md transition hover:opacity-90"><Plus class="h-4 w-4" /> Buat Quotation</Link></template></PageHeader>

            <!-- Stats section -->
            <section class="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
                <StatCard
                    v-for="card in [
                        {
                            label: 'Total Quotation', group: '',
                            value: stats.total,
                            icon: FileSignature,
                        },
                        {
                            label: 'Menunggu', group: 'pending',
                            value: stats.pending,
                            icon: Clock3,
                        },
                        {
                            label: 'Disetujui', group: 'approved',
                            value: stats.approved,
                            icon: BadgeCheck,
                        },
                        {
                            label: 'Nilai Disetujui', group: 'approved',
                            value: money(stats.value),
                            icon: CircleDollarSign,
                        },
                    ]"
                    :key="card.label" :label="card.label" :value="card.value" :icon="card.icon" interactive :selected="selectedGroup === card.group && !selectedStatus" @activate="selectedStatus = ''; selectedGroup = card.group; filter()" />
            </section>

            <!-- Filters section -->
            <div class="flex flex-col gap-3 sm:flex-row">
                <form @submit.prevent="filter" class="relative flex-1">
                    <Search
                        class="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                    />
                    <input
                        v-model="query"
                        class="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm font-medium focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20"
                        placeholder="Cari nomor, client, penawaran, atau PIC..."
                    />
                </form>
                <select
                    v-model="selectedStatus"
                    @change="selectedGroup = ''; filter()"
                    class="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20"
                >
                    <option value="">Semua Status</option>
                    <option>Draft</option>
                    <option>Diterbitkan</option>
                    <option>Dikirim</option>
                    <option>Disetujui</option>
                    <option>Invoice Terbuat</option>
                    <option>Ditolak</option>
                    <option>Kedaluwarsa</option>
                </select>
            </div>

            <!-- MOBILE CARDVIEW -->
            <div class="space-y-3.5 md:hidden">
                <div v-if="!quotations.data.length" class="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
                    Belum ada quotation.
                </div>
                <div
                    v-for="quotation in quotations.data"
                    :key="quotation.id"
                    class="rounded-2xl border p-4 transition-all"
                    :class="statusCardStyle(quotation.status)"
                >
                    <div class="flex items-start justify-between gap-2 border-b border-black/5 pb-3">
                        <div>
                            <code class="text-xs font-black px-2 py-0.5 rounded bg-white/70 shadow-sm" :style="{ color: 'var(--primary)' }">
                                {{ quotation.quotationNumber }}
                            </code>
                            <span class="ml-2 text-[11px] font-semibold opacity-75">{{ date(quotation.quotationDate) }}</span>
                        </div>
                        <span class="rounded-full px-2.5 py-0.5 text-[11px] font-black uppercase" :class="badgeStyle(quotation.status)">
                            {{ quotation.status }}
                        </span>
                    </div>
                    <div class="mt-3">
                        <h3 class="font-bold text-sm leading-snug">
                            {{ quotation.clientName || quotation.legacyClientName || '-' }}
                        </h3>
                        <p class="mt-1 text-xs opacity-80 line-clamp-2">{{ quotation.subject }}</p>
                    </div>
                    <div class="mt-3 flex items-center justify-between border-t border-black/5 pt-3">
                        <div class="text-xs opacity-90">
                            <span class="block text-[10px] uppercase tracking-wider opacity-60">Total Value</span>
                            <span class="font-black text-sm">{{ money(quotation.grandTotal) }}</span>
                        </div>
                        <Link
                            :href="`/dashboard/quotation/${quotation.id}`"
                            class="inline-flex items-center gap-1 text-xs font-black text-slate-900 bg-white/80 hover:bg-white px-3 py-1.5 rounded-lg shadow-sm border border-black/10 transition-all"
                        >
                            <span>Detail</span>
                            <ChevronRight class="h-3 w-3" />
                        </Link>
                    </div>
                </div>
            </div>

            <!-- DESKTOP TABLE VIEW -->
            <section
                class="hidden md:block overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
            >
                <div class="overflow-x-auto">
                    <table class="w-full text-left text-sm">
                        <thead class="border-b border-slate-200 bg-slate-50/80 text-xs font-bold uppercase tracking-wider text-slate-500">
                            <tr>
                                <th class="p-4 pl-6">Nomor</th>
                                <th>Client / Penawaran</th>
                                <th>PIC Quotation</th>
                                <th>Tanggal</th>
                                <th>Total</th>
                                <th>Status</th>
                                <th class="pr-6 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-100">
                            <tr v-if="!quotations.data.length">
                                <td colspan="7"><EmptyState title="Belum ada quotation" description="Quotation yang tersedia akan tampil di sini." /></td>
                            </tr>
                            <tr
                                v-for="quotation in quotations.data"
                                :key="quotation.id"
                                class="hover:bg-slate-50/80 transition-colors"
                            >
                                <td
                                    class="p-4 pl-6 font-mono font-black text-xs"
                                    :style="{ color: 'var(--primary)' }"
                                >
                                    {{ quotation.quotationNumber }}
                                </td>
                                <td>
                                    <p class="font-bold text-slate-800">
                                        {{
                                            quotation.clientName ||
                                            quotation.legacyClientName ||
                                            "-"
                                        }}
                                    </p>
                                    <p
                                        class="max-w-[260px] truncate text-xs text-slate-500"
                                    >
                                        {{ quotation.subject }}
                                    </p>
                                </td>
                                <td class="font-semibold text-slate-700">
                                    {{ quotation.picName || "-" }}
                                </td>
                                <td class="text-xs text-slate-600">
                                    <p class="font-semibold text-slate-800">{{ date(quotation.quotationDate) }}</p>
                                </td>
                                <td class="font-black text-slate-900">
                                    {{ money(quotation.grandTotal) }}
                                </td>
                                <td>
                                    <span
                                        class="inline-block rounded-full px-3 py-1 text-xs font-black uppercase"
                                        :class="badgeStyle(quotation.status)"
                                        >{{ quotation.status }}</span
                                    >
                                </td>
                                <td class="pr-6 text-right">
                                    <Link
                                        :href="`/dashboard/quotation/${quotation.id}`"
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
            </section>
        </main>
    </AppLayout>
</template>
