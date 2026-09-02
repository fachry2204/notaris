<script setup lang="ts">
import { Head, Link } from "@inertiajs/vue3";
import AppLayout from "@/Layouts/AppLayout.vue";

const props = defineProps<{
    selectedClientId?: string;
    sourceInvoiceId?: string;
}>();
const items = [
    {
        type: "badan_hukum",
        title: "Badan Hukum / Usaha",
        desc: "PT, PMA, CV, Koperasi, Yayasan, Perkumpulan, Firma",
    },
    {
        type: "non_badan_hukum",
        title: "Non Badan Hukum",
        desc: "Perjanjian, waris, kuasa, wasiat, fidusia, legalisasi",
    },
    {
        type: "ppat",
        title: "PPAT",
        desc: "Jual beli, hibah, APHT, roya, balik nama dan pertanahan",
    },
];
const formUrl = (type: string) => {
    const params = new URLSearchParams({ type });
    if (props.selectedClientId) params.set("client", props.selectedClientId);
    if (props.sourceInvoiceId) params.set("invoice", props.sourceInvoiceId);

    return `/dashboard/jobs/new?${params.toString()}`;
};
</script>

<template>
    <Head title="Pilih Jenis Berkas" />
    <AppLayout>
        <div class="mx-auto max-w-5xl">
            <p class="text-sm font-bold text-pink-600">Registrasi berkas</p>
            <h1 class="text-3xl font-black">Pilih Jenis Pekerjaan</h1>
            <p class="mt-2 text-slate-500">
                Pilih kategori agar formulir mengikuti alur administrasi yang
                sesuai.
            </p>
            <div
                v-if="selectedClientId"
                class="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700"
            >
                Client dari Invoice akan otomatis dipilih pada formulir berkas.
            </div>
            <div class="mt-8 grid gap-5 md:grid-cols-3">
                <Link
                    v-for="item in items"
                    :key="item.type"
                    :href="formUrl(item.type)"
                    class="group rounded-3xl border bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:border-pink-300 hover:shadow-xl"
                >
                    <div
                        class="grid h-12 w-12 place-items-center rounded-2xl bg-pink-50 text-xl font-black text-pink-600"
                    >
                        +
                    </div>
                    <h2 class="mt-6 text-xl font-black">{{ item.title }}</h2>
                    <p class="mt-2 text-sm leading-6 text-slate-500">
                        {{ item.desc }}
                    </p>
                    <p class="mt-6 font-bold text-pink-600">Buka formulir →</p>
                </Link>
            </div>
        </div>
    </AppLayout>
</template>
