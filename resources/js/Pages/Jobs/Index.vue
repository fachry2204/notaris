<script setup lang="ts">
import { Head, Link, router } from "@inertiajs/vue3";
import { ref } from "vue";
import {
    BriefcaseBusiness,
    CheckCircle2,
    Clock3,
    FilePlus2,
    Search,
    Settings2,
    Calendar,
    User,
    Tag,
    ChevronRight,
} from "@lucide/vue";
import AppLayout from "@/Layouts/AppLayout.vue";

const p = defineProps<{
    jobs: any;
    search: string;
    status: string;
    stats: any;
    pageTitle: string;
    pageDescription: string;
    lockedStatus: boolean;
}>();

const q = ref(p.search);
const st = ref(p.status);

const filter = (status?: string) => {
    if (status !== undefined) st.value = status;
    router.get(
        "/dashboard/jobs",
        { search: q.value, status: st.value },
        { preserveState: true, replace: true }
    );
};

const date = (x: any) =>
    x
        ? new Date(x).toLocaleDateString("id-ID", {
              day: "2-digit",
              month: "short",
              year: "numeric",
          })
        : "-";

const statusCardStyle = (s: string) => {
    switch (s) {
        case "SELESAI":
            return "bg-emerald-50/90 border-emerald-200 text-emerald-950 shadow-sm";
        case "PROSES":
        case "VERIFIKASI":
            return "bg-sky-50/90 border-sky-200 text-sky-950 shadow-sm";
        case "REVISI":
            return "bg-purple-50/90 border-purple-200 text-purple-950 shadow-sm";
        case "CANCELLED":
            return "bg-rose-50/90 border-rose-200 text-rose-950 shadow-sm";
        default:
            return "bg-amber-50/90 border-amber-200 text-amber-950 shadow-sm";
    }
};

const badgeStyle = (s: string) => {
    switch (s) {
        case "SELESAI":
            return "bg-emerald-100 text-emerald-800 border border-emerald-300";
        case "PROSES":
        case "VERIFIKASI":
            return "bg-sky-100 text-sky-800 border border-sky-300";
        case "REVISI":
            return "bg-purple-100 text-purple-800 border border-purple-300";
        case "CANCELLED":
            return "bg-rose-100 text-rose-800 border border-rose-300";
        default:
            return "bg-amber-100 text-amber-800 border border-amber-300";
    }
};
</script>

<template>
    <Head :title="pageTitle" />
    <AppLayout>
        <main class="mx-auto max-w-7xl space-y-6 p-3 sm:p-5">
            <!-- Header section -->
            <div class="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                    <h1 class="text-xl sm:text-2xl font-black text-slate-900">{{ pageTitle }}</h1>
                    <p class="mt-1 text-xs sm:text-sm font-medium text-slate-500">{{ pageDescription }}</p>
                </div>
                <Link
                    href="/dashboard/jobs/new"
                    class="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-5 text-sm font-bold text-white shadow-md transition-all hover:opacity-90 active:scale-95"
                >
                    <FilePlus2 class="h-4 w-4" />
                    <span>Berkas Baru</span>
                </Link>
            </div>

            <!-- Stats filters -->
            <div class="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
                <button
                    v-for="x in [
                        { s: '', l: 'Total Berkas', v: stats.all, i: BriefcaseBusiness, color: 'bg-pink-50/80 border-pink-200/90 text-pink-950 hover:bg-pink-100/70' },
                        { s: 'PENDING', l: 'Menunggu', v: stats.PENDING, i: Clock3, color: 'bg-amber-50/80 border-amber-200/90 text-amber-950 hover:bg-amber-100/70' },
                        { s: 'PROSES', l: 'Dalam Proses', v: stats.PROSES, i: Settings2, color: 'bg-sky-50/80 border-sky-200/90 text-sky-950 hover:bg-sky-100/70' },
                        { s: 'SELESAI', l: 'Selesai', v: stats.SELESAI, i: CheckCircle2, color: 'bg-emerald-50/80 border-emerald-200/90 text-emerald-950 hover:bg-emerald-100/70' },
                    ]"
                    :key="x.s"
                    @click="filter(x.s)"
                    class="relative overflow-hidden rounded-2xl border p-4 text-left shadow-sm transition-all"
                    :class="[
                        x.color,
                        st === x.s ? 'ring-2 ring-[var(--primary)] border-transparent shadow-md font-bold' : ''
                    ]"
                >
                    <p class="text-[11px] font-black uppercase tracking-wider opacity-75">{{ x.l }}</p>
                    <p class="mt-1 text-2xl font-black">{{ x.v }}</p>
                    <component :is="x.i" class="absolute -bottom-2 -right-2 h-12 w-12 opacity-20" />
                </button>
            </div>

            <!-- Search & Filter Controls -->
            <div class="flex flex-col sm:flex-row gap-3">
                <form @submit.prevent="filter()" class="relative flex-1">
                    <Search class="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                        v-model="q"
                        class="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm font-medium focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20"
                        placeholder="Cari kode, pekerjaan, atau client..."
                    />
                </form>
                <select
                    v-if="!lockedStatus"
                    v-model="st"
                    @change="filter()"
                    class="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20"
                >
                    <option value="">Semua Status</option>
                    <option v-for="s in ['PENDING', 'PROSES', 'REVISI', 'VERIFIKASI', 'SELESAI', 'CANCELLED']" :key="s">
                        {{ s }}
                    </option>
                </select>
            </div>

            <!-- MOBILE CARDVIEW (Visible on screens smaller than md) -->
            <div class="space-y-3.5 md:hidden">
                <div v-if="!jobs.data.length" class="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
                    Tidak ada data berkas.
                </div>
                <div
                    v-for="j in jobs.data"
                    :key="j.id"
                    class="rounded-2xl border p-4 transition-all"
                    :class="statusCardStyle(j.status)"
                >
                    <div class="flex items-start justify-between gap-2 border-b border-black/5 pb-3">
                        <div>
                            <code class="text-xs font-black px-2 py-0.5 rounded bg-white/70 shadow-sm" :style="{ color: 'var(--primary)' }">
                                {{ j.trackingCode }}
                            </code>
                            <span class="ml-2 text-[11px] font-semibold opacity-75">{{ date(j.createdAt) }}</span>
                        </div>
                        <span class="rounded-full px-2.5 py-0.5 text-[11px] font-black uppercase" :class="badgeStyle(j.status)">
                            {{ j.status }}
                        </span>
                    </div>
                    <div class="mt-3">
                        <h3 class="font-bold text-sm leading-snug line-clamp-2">{{ j.title }}</h3>
                    </div>
                    <div class="mt-3 grid grid-cols-2 gap-2 text-xs opacity-90 border-t border-black/5 pt-3">
                        <div class="flex items-center gap-1.5 truncate">
                            <User class="h-3.5 w-3.5 shrink-0 opacity-60" />
                            <span class="truncate font-semibold">{{ j.clientName || '-' }}</span>
                        </div>
                        <div class="flex items-center gap-1.5 justify-end">
                            <Tag class="h-3.5 w-3.5 shrink-0 opacity-60" />
                            <span class="font-semibold px-2 py-0.5 rounded bg-white/50 text-[10px]">{{ j.category }}</span>
                        </div>
                    </div>
                    <div class="mt-3 flex items-center justify-between pt-2 border-t border-black/5">
                        <div class="flex items-center gap-1 text-[11px] font-medium opacity-80">
                            <Calendar class="h-3.5 w-3.5" />
                            <span>Deadline: {{ date(j.deadline) }}</span>
                        </div>
                        <Link
                            :href="`/dashboard/jobs/${j.jobType}/${j.id}`"
                            class="inline-flex items-center gap-1 text-xs font-black text-slate-900 bg-white/80 hover:bg-white px-3 py-1.5 rounded-lg shadow-sm border border-black/10 transition-all"
                        >
                            <span>Detail</span>
                            <ChevronRight class="h-3 w-3" />
                        </Link>
                    </div>
                </div>
            </div>

            <!-- DESKTOP TABLE VIEW (Visible on md screens and larger) -->
            <div class="hidden md:block overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div class="overflow-x-auto">
                    <table class="w-full text-left text-sm">
                        <thead>
                            <tr class="border-b bg-slate-50/80 text-xs font-bold uppercase tracking-wider text-slate-500">
                                <th class="p-4 pl-6">Kode / Tanggal</th>
                                <th>Pekerjaan</th>
                                <th>Client</th>
                                <th>Kategori</th>
                                <th>Deadline</th>
                                <th>Status</th>
                                <th class="pr-6 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-100">
                            <tr v-if="!jobs.data.length">
                                <td colspan="7" class="py-16 text-center text-slate-500">Tidak ada data berkas.</td>
                            </tr>
                            <tr
                                v-for="j in jobs.data"
                                :key="j.id"
                                class="hover:bg-slate-50/80 transition-colors"
                            >
                                <td class="p-4 pl-6">
                                    <code class="font-black text-xs px-2 py-0.5 rounded bg-slate-100" :style="{ color: 'var(--primary)' }">
                                        {{ j.trackingCode }}
                                    </code>
                                    <p class="mt-1 text-[11px] text-slate-500">{{ date(j.createdAt) }}</p>
                                </td>
                                <td class="max-w-[280px] font-bold text-slate-800">
                                    <span class="line-clamp-2">{{ j.title }}</span>
                                </td>
                                <td class="font-medium text-slate-700">{{ j.clientName || '-' }}</td>
                                <td>
                                    <span class="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                                        {{ j.category }}
                                    </span>
                                </td>
                                <td class="font-medium text-slate-600">{{ date(j.deadline) }}</td>
                                <td>
                                    <span class="inline-block rounded-full px-3 py-1 text-xs font-black" :class="badgeStyle(j.status)">
                                        {{ j.status }}
                                    </span>
                                </td>
                                <td class="pr-6 text-right">
                                    <Link
                                        :href="`/dashboard/jobs/${j.jobType}/${j.id}`"
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
