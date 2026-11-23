<script setup lang="ts">
import { Head, Link } from "@inertiajs/vue3";
import AppLayout from "@/Layouts/AppLayout.vue";
import { ref } from "vue";
import { X } from "@lucide/vue";

defineProps<{ title: string; columns: string[]; rows: any }>();
const selected = ref<any>(null);
const activities: Record<string, string> = {
    CREATE_JOB: 'Berkas dibuat', UPDATE_JOB: 'Berkas diperbarui', DELETE_JOB: 'Berkas dihapus',
    UPDATE_JOB_PROGRESS: 'Progres berkas diperbarui', UPDATE_EMPLOYEE_FEES: 'Fee pegawai diperbarui',
    ATTACH_INVOICE: 'Invoice dihubungkan', DELETE_ATTACHMENT: 'Lampiran dihapus',
};
const activityLabel = (value: string) => activities[value] || value?.replaceAll('_', ' ') || 'Aktivitas tidak diketahui';
const label = (column: string) =>
    ({ userName: "Pengguna", activity: "Aktivitas", details: "Keterangan", device: "Perangkat", ipAddress: "Alamat IP", createdAt: "Waktu" })[
        column
    ] || column;
const format = (value: any, column: string) =>
    column === "amount"
        ? new Intl.NumberFormat("id-ID", {
              style: "currency",
              currency: "IDR",
          }).format(Number(value || 0))
        : column === 'activity' ? activityLabel(value) : (value || (column === 'userName' ? 'Tidak diketahui' : '-'));
</script>

<template>
    <Head :title="title" />
    <AppLayout>
        <p class="text-sm font-bold text-pink-600">Manajemen sistem</p>
        <h1 class="text-3xl font-black">{{ title }}</h1>
        <section
            class="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white"
        >
            <div class="overflow-x-auto">
                <table class="w-full text-left text-sm">
                    <thead class="bg-slate-50">
                        <tr>
                            <th
                                v-for="column in columns"
                                :key="column"
                                class="whitespace-nowrap p-4 capitalize"
                            >
                                {{ label(column) }}
                            </th>
                            <th class="whitespace-nowrap p-4">Aksi</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y">
                        <tr
                            v-for="row in rows.data"
                            :key="row.id"
                            class="hover:bg-slate-50"
                        >
                            <td
                                v-for="column in columns"
                                :key="column"
                                class="max-w-sm p-4"
                            >
                                <span class="line-clamp-2 whitespace-pre-line break-words">{{
                                    format(row[column], column)
                                }}</span>
                            </td>
                            <td class="p-4"><button type="button" @click="selected = row" class="whitespace-nowrap rounded-lg border border-amber-500 px-3 py-2 text-xs font-bold text-amber-500" :aria-label="`Lihat detail ${activityLabel(row.activity)}`">Lihat detail</button></td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <p v-if="!rows.data.length" class="p-10 text-center text-slate-400">
                Belum ada data.
            </p>
        </section>
        <nav
            v-if="rows.links?.length > 3"
            class="mt-5 flex flex-wrap justify-center gap-2"
        >
            <Link
                v-for="item in rows.links"
                :key="item.label"
                :href="item.url || '#'"
                preserve-scroll
                class="rounded-lg border bg-white px-3 py-2 text-sm"
                :class="
                    item.active
                        ? 'border-pink-500 bg-pink-50 font-black text-pink-600'
                        : item.url
                          ? ''
                          : 'pointer-events-none opacity-40'
                "
                v-html="item.label"
            />
        </nav>
        <Teleport to="body">
            <div v-if="selected" class="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4" @click.self="selected = null" @keydown.esc="selected = null">
                <section role="dialog" aria-modal="true" aria-labelledby="audit-detail-title" class="max-h-[85vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-amber-700 bg-[#191919] p-6 text-white shadow-xl">
                    <div class="flex items-start justify-between gap-4"><div><h2 id="audit-detail-title" class="text-xl font-bold">Detail Aktivitas</h2><p class="mt-1 text-sm text-amber-300">{{ activityLabel(selected.activity) }}</p></div><button type="button" aria-label="Tutup detail aktivitas" @click="selected = null" class="rounded-lg p-2 text-white"><X class="h-5 w-5" /></button></div>
                    <dl class="mt-5 space-y-4 text-sm">
                        <div v-for="column in columns" :key="column"><dt class="font-semibold text-[#c7b88f]">{{ label(column) }}</dt><dd class="mt-1 whitespace-pre-wrap break-words text-white">{{ format(selected[column], column) }}</dd></div>
                        <div><dt class="font-semibold text-[#c7b88f]">Kode aktivitas</dt><dd class="mt-1 break-all">{{ selected.activity || '-' }}</dd></div>
                        <div><dt class="font-semibold text-[#c7b88f]">ID catatan</dt><dd class="mt-1 break-all">{{ selected.id }}</dd></div>
                    </dl>
                </section>
            </div>
        </Teleport>
    </AppLayout>
</template>
