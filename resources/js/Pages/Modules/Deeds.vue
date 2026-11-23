<script setup lang="ts">
import { reactive } from "vue";
import { Head, Link, router } from "@inertiajs/vue3";
import { FileText, ChevronRight } from "@lucide/vue";
import AppLayout from "@/Layouts/AppLayout.vue";
import PageHeader from "@/Components/DesignSystem/PageHeader.vue";

const p = defineProps<{
    jobs: any;
    staff: any[];
    filters: any;
    totalAkta: number;
}>();

const f = reactive({
    from: p.filters.from || "",
    to: p.filters.to || "",
    staff: p.filters.staff || "",
});

const load = () =>
    router.get("/dashboard/akta", f, {
        preserveState: true,
        replace: true,
    });

const resetFilters = () => { f.from = ""; f.to = ""; f.staff = ""; load(); };
const date = (value: any) =>
    value ? new Date(value).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
    }) : "—";

const number = (value: number) =>
    new Intl.NumberFormat("id-ID").format(Number(value || 0));
</script>

<template>
    <Head title="Daftar Akta" />
    <AppLayout>
        <main class="mx-auto max-w-7xl space-y-6 p-4">
            <PageHeader hide-mobile-icon title="Daftar Akta" section="Operasional / Akta" description="Daftar akta yang telah ditandatangani berdasarkan client dan PIC."><template #icon><FileText class="h-6 w-6" /></template></PageHeader>

            <button type="button" @click="resetFilters"
                class="relative w-full overflow-hidden rounded-3xl border border-amber-200 bg-white p-6 text-left shadow-sm"
                aria-label="Tampilkan seluruh akta dan hapus filter"
            >
                <div
                    class="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-amber-100/60"
                />
                <div class="relative flex items-center justify-between gap-4">
                    <div>
                        <p
                            class="text-xs font-black uppercase tracking-[0.18em] text-amber-700"
                        >
                            Total Jumlah Akta
                        </p>
                        <p class="mt-2 text-4xl font-black text-slate-900">
                            {{ number(totalAkta) }}
                        </p>
                        <p class="mt-1 text-sm font-medium text-slate-500">
                            Jumlah akta sesuai filter yang diterapkan
                        </p>
                    </div>
                    <div
                        class="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-amber-100 text-amber-700"
                    >
                        <FileText class="h-7 w-7" />
                    </div>
                </div>
            </button>

            <form
                class="grid gap-3 rounded-3xl border bg-white p-5 md:grid-cols-4"
                @submit.prevent="load"
            >
                <input
                    v-model="f.from"
                    type="date"
                    class="min-w-0 w-full rounded-xl border-slate-200"
                />
                <input
                    v-model="f.to"
                    type="date"
                    class="min-w-0 w-full rounded-xl border-slate-200"
                />
                <select
                    v-model="f.staff"
                    class="min-w-0 w-full rounded-xl border-slate-200"
                >
                    <option value="">Semua Pegawai</option>
                    <option v-for="s in staff" :key="s.id" :value="s.id">
                        {{ s.fullName }}
                    </option>
                </select>
                <button class="min-h-11 rounded-xl bg-[var(--primary)] font-bold text-white">
                    Terapkan
                </button>
            </form>

            <section class="space-y-3 md:hidden" aria-label="Daftar akta">
                <p v-if="!jobs.data.length" class="rounded-2xl border bg-white p-8 text-center text-sm text-slate-500">Data akta tidak ditemukan.</p>
                <Link v-for="j in jobs.data" :key="`${j.jobType}-${j.id}`" :href="`/dashboard/jobs/${j.jobType}/${j.id}`" class="block rounded-2xl border border-[#e9dfcd] bg-white p-4 shadow-sm">
                    <div class="flex items-start justify-between gap-3"><div class="min-w-0"><p class="text-xs font-bold text-teal-700">{{ j.trackingCode || 'Nomor berkas tidak tersedia' }}</p><h2 class="mt-2 break-words text-base font-black text-slate-900">{{ j.title }}</h2><p class="mt-1 text-xs text-slate-500">{{ j.category }}</p></div><ChevronRight class="h-5 w-5 shrink-0 text-slate-400" /></div>
                    <dl class="mt-4 grid grid-cols-2 gap-3 border-t border-slate-100 pt-3 text-xs"><div><dt class="text-slate-500">Nomor akta</dt><dd class="mt-1 break-words font-bold">{{ j.deed_number || '—' }}</dd></div><div><dt class="text-slate-500">Tanggal akta</dt><dd class="mt-1 font-bold">{{ date(j.signed_date) }}</dd></div><div><dt class="text-slate-500">Client</dt><dd class="mt-1 break-words font-bold">{{ j.clientName || '—' }}</dd></div><div><dt class="text-slate-500">PIC</dt><dd class="mt-1 break-words font-bold">{{ j.staffName || '—' }}</dd></div></dl>
                </Link>
            </section>

            <section class="hidden overflow-hidden rounded-3xl border bg-white md:block">
                <div class="overflow-x-auto">
                    <table class="w-full text-left text-sm">
                        <thead class="bg-slate-50">
                            <tr>
                                <th class="p-4 pl-6">No.</th>
                                <th>Tanggal Berkas</th>
                                <th>Nomor / Tanggal Akta</th>
                                <th>Nama Client</th>
                                <th>Jenis Pekerjaan</th>
                                <th>PIC Pegawai</th>
                                <th>Nama Saksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-if="!jobs.data.length">
                                <td
                                    colspan="7"
                                    class="py-16 text-center text-slate-400"
                                >
                                    <FileText
                                        class="mx-auto mb-3 h-10 w-10 opacity-30"
                                    />
                                    Data tidak ditemukan.
                                </td>
                            </tr>
                            <tr
                                v-for="(j, i) in jobs.data"
                                :key="j.id"
                                class="border-t hover:bg-slate-50"
                            >
                                <td class="p-4 pl-6">
                                    {{ (jobs.from || 1) + i }}
                                </td>
                                <td>{{ date(j.createdAt) }}</td>
                                <td>{{ j.deed_number || '—' }}<p class="text-xs text-slate-500">{{ date(j.signed_date) }}</p></td>
                                <td class="font-bold">
                                    {{ j.clientName || "-" }}
                                </td>
                                <td>
                                    <Link
                                        :href="`/dashboard/jobs/${j.jobType}/${j.id}`"
                                        class="font-bold hover:text-[var(--primary)]"
                                    >
                                        {{ j.title }}
                                    </Link>
                                    <p class="text-xs text-slate-500">
                                        {{ j.category }}
                                    </p>
                                </td>
                                <td>{{ j.staffName || "-" }}</td>
                                <td>{{ j.saksi || "-" }}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </section>
            <nav v-if="jobs.links?.length > 3" aria-label="Halaman data akta" class="flex flex-wrap justify-center gap-2"><template v-for="(link, index) in jobs.links" :key="index"><Link v-if="link.url" :href="link.url" :class="link.active ? 'bg-teal-700 text-white' : 'bg-white text-slate-700'" class="rounded-lg border px-3 py-2 text-sm" v-html="link.label" /><span v-else class="rounded-lg border bg-slate-50 px-3 py-2 text-sm text-slate-400" v-html="link.label" /></template></nav>
        </main>
    </AppLayout>
</template>
