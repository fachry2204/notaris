<script setup lang="ts">
import { Head, Link } from "@inertiajs/vue3";
import AppLayout from "@/Layouts/AppLayout.vue";

defineProps<{ title: string; columns: string[]; rows: any }>();
const label = (column: string) =>
    ({ userName: "Pengguna", ipAddress: "Alamat IP", createdAt: "Waktu" })[
        column
    ] || column;
const format = (value: any, column: string) =>
    column === "amount"
        ? new Intl.NumberFormat("id-ID", {
              style: "currency",
              currency: "IDR",
          }).format(Number(value || 0))
        : (value ?? "-");
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
                                <span class="line-clamp-2">{{
                                    format(row[column], column)
                                }}</span>
                            </td>
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
    </AppLayout>
</template>
