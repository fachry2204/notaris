<script setup lang="ts">
import { reactive } from "vue";
import { Head, Link, router } from "@inertiajs/vue3";
import { FileText, Search } from "@lucide/vue";
import AppLayout from "@/Layouts/AppLayout.vue";

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
    witness: p.filters.witness || "",
});

const load = () =>
    router.get("/dashboard/akta", f, {
        preserveState: true,
        replace: true,
    });

const date = (value: any) =>
    new Date(value).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
    });

const number = (value: number) =>
    new Intl.NumberFormat("id-ID").format(Number(value || 0));
</script>

<template>
    <Head title="Daftar Akta" />
    <AppLayout>
        <main class="mx-auto max-w-7xl space-y-6 p-4">
            <div>
                <h1 class="text-2xl font-black">Daftar Akta</h1>
                <p class="text-sm text-slate-500">
                    Daftar seluruh akta berdasarkan client, PIC, dan saksi.
                </p>
            </div>

            <section
                class="relative overflow-hidden rounded-3xl border border-amber-200 bg-white p-6 shadow-sm"
                aria-label="Total jumlah akta"
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
            </section>

            <form
                class="grid gap-3 rounded-3xl border bg-white p-5 md:grid-cols-5"
                @submit.prevent="load"
            >
                <input
                    v-model="f.from"
                    type="date"
                    class="rounded-xl border-slate-200"
                />
                <input
                    v-model="f.to"
                    type="date"
                    class="rounded-xl border-slate-200"
                />
                <select
                    v-model="f.staff"
                    class="rounded-xl border-slate-200"
                >
                    <option value="">Semua Pegawai</option>
                    <option v-for="s in staff" :key="s.id" :value="s.id">
                        {{ s.fullName }}
                    </option>
                </select>
                <div class="relative">
                    <Search
                        class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                    />
                    <input
                        v-model="f.witness"
                        class="w-full rounded-xl border-slate-200 pl-9"
                        placeholder="Nama saksi"
                    />
                </div>
                <button class="rounded-xl bg-[var(--primary)] font-bold text-white">
                    Terapkan
                </button>
            </form>

            <section class="overflow-hidden rounded-3xl border bg-white">
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
        </main>
    </AppLayout>
</template>
