<script setup lang="ts">
import { Head } from "@inertiajs/vue3";
defineProps<{ document: { type: string; number: string; date: string; status: string } }>();
const date = (value: string) => {
    const match = String(value || "").match(/^(\d{4})-(\d{2})-(\d{2})/);
    return match ? `${match[3]}-${match[2]}-${match[1]}` : "-";
};
</script>

<template>
    <Head title="Verifikasi Dokumen" />
    <main class="min-h-screen bg-[#f6f2ea] px-5 py-12 text-slate-900">
        <section class="mx-auto max-w-lg rounded-3xl border border-stone-200 bg-white p-8 shadow-sm">
            <p class="text-xs font-bold uppercase tracking-widest text-teal-700">Verifikasi dokumen</p>
            <h1 class="mt-3 text-2xl font-black">Dokumen terdaftar</h1>
            <p class="mt-3 text-sm text-slate-600">Kode verifikasi ini terhubung dengan data dokumen di sistem. Cocokkan informasi berikut dengan dokumen yang Anda terima.</p>
            <dl class="mt-7 space-y-4 text-sm">
                <div><dt class="text-slate-500">Jenis dokumen</dt><dd class="font-bold">{{ document.type }}</dd></div>
                <div><dt class="text-slate-500">Nomor</dt><dd class="break-all font-bold">{{ document.number }}</dd></div>
                <div><dt class="text-slate-500">Tanggal dokumen</dt><dd class="font-bold">{{ date(document.date) }}</dd></div>
                <div><dt class="text-slate-500">Status saat ini</dt><dd class="font-bold">{{ document.status || "-" }}</dd></div>
            </dl>
            <p class="mt-7 border-t pt-4 text-xs text-slate-500">QR memverifikasi tautan dan data yang terdaftar, tetapi tidak membuktikan bahwa isi salinan dokumen tidak diubah.</p>
        </section>
    </main>
</template>
