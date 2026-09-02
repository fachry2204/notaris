<script setup lang="ts">
import { Head } from "@inertiajs/vue3";

defineProps<{ quotation: any; items: any[] }>();
const money = (value: any) =>
    new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0,
    }).format(Number(value || 0));
const date = (value: any) =>
    String(value || "").replace(
        /^(\d{4})-(\d{2})-(\d{2}).*$/,
        (_, year, month, day) => `${day}-${month}-${year}`,
    ) || "-";
</script>

<template>
    <Head :title="quotation.quotationNumber" />
    <main class="mx-auto min-h-screen max-w-4xl bg-white p-10 text-slate-900">
        <header class="flex justify-between border-b-2 border-pink-500 pb-6">
            <div>
                <p
                    class="text-xs font-black uppercase tracking-[0.2em] text-pink-600"
                >
                    Notaris Digital
                </p>
                <h1 class="mt-2 text-3xl font-black">QUOTATION</h1>
                <p class="mt-1 text-sm text-slate-500">Penawaran Harga</p>
            </div>
            <div class="text-right">
                <p class="font-mono font-black text-pink-600">
                    {{ quotation.quotationNumber }}
                </p>
                <p class="mt-1 text-sm">{{ date(quotation.quotationDate) }}</p>
                <p class="text-xs text-slate-500">
                    Berlaku sampai {{ date(quotation.validUntil) }}
                </p>
            </div>
        </header>
        <section class="mt-8 grid grid-cols-2 gap-10">
            <div>
                <p
                    class="text-xs font-black uppercase tracking-wider text-slate-400"
                >
                    Kepada
                </p>
                <h2 class="mt-2 text-lg font-black">
                    {{ quotation.clientName }}
                </h2>
                <p class="mt-1 whitespace-pre-line text-sm text-slate-600">
                    {{ quotation.clientAddress }}
                </p>
            </div>
            <div class="text-right">
                <p
                    class="text-xs font-black uppercase tracking-wider text-slate-400"
                >
                    PIC Quotation
                </p>
                <h2 class="mt-2 font-black">{{ quotation.picName }}</h2>
                <p class="text-sm text-slate-600">
                    {{ quotation.picPhone || quotation.picEmail }}
                </p>
            </div>
        </section>
        <h2 class="mt-8 text-xl font-black">{{ quotation.subject }}</h2>
        <table class="mt-5 w-full text-left text-sm">
            <thead class="bg-slate-100 text-xs uppercase text-slate-500">
                <tr>
                    <th class="p-3">No.</th>
                    <th>Deskripsi</th>
                    <th>Qty</th>
                    <th>Harga</th>
                    <th class="pr-3 text-right">Jumlah</th>
                </tr>
            </thead>
            <tbody>
                <tr
                    v-for="(item, index) in items"
                    :key="item.id"
                    class="border-b"
                >
                    <td class="p-3">{{ index + 1 }}</td>
                    <td class="font-bold">{{ item.description }}</td>
                    <td>{{ Number(item.quantity) }} {{ item.unit }}</td>
                    <td>{{ money(item.unitPrice) }}</td>
                    <td class="pr-3 text-right font-bold">
                        {{ money(item.total) }}
                    </td>
                </tr>
            </tbody>
        </table>
        <div
            class="mt-6 grid grid-cols-[minmax(0,1fr)_20rem] items-start gap-8"
        >
            <section v-if="quotation.terms" class="text-sm">
                <h3 class="font-black">Syarat dan Ketentuan</h3>
                <p class="mt-2 whitespace-pre-line text-slate-600">
                    {{ quotation.terms }}
                </p>
            </section>
            <dl class="w-full space-y-2 text-sm">
                <div class="flex justify-between">
                    <dt>Subtotal</dt>
                    <dd class="font-bold">{{ money(quotation.subtotal) }}</dd>
                </div>
                <div class="flex justify-between">
                    <dt>Diskon</dt>
                    <dd class="font-bold">- {{ money(quotation.discount) }}</dd>
                </div>
                <div class="flex justify-between">
                    <dt>Pajak ({{ Number(quotation.taxPercent) }}%)</dt>
                    <dd class="font-bold">{{ money(quotation.taxAmount) }}</dd>
                </div>
                <div class="flex justify-between border-t-2 pt-3 text-lg">
                    <dt class="font-black">Total Penawaran</dt>
                    <dd class="font-black text-pink-600">
                        {{ money(quotation.grandTotal) }}
                    </dd>
                </div>
            </dl>
        </div>
        <section v-if="quotation.notes" class="mt-8 text-sm">
            <h3 class="font-black">Catatan</h3>
            <p class="mt-2 whitespace-pre-line text-slate-600">
                {{ quotation.notes }}
            </p>
        </section>
        <div class="mt-16 flex justify-end">
            <div class="w-60 text-center">
                <p>Hormat kami,</p>
                <div class="h-20"></div>
                <p class="border-t pt-2 font-black">{{ quotation.picName }}</p>
                <p class="text-xs text-slate-500">PIC Quotation</p>
            </div>
        </div>
        <button
            onclick="window.print()"
            class="fixed bottom-6 right-6 rounded-xl bg-pink-600 px-5 py-3 font-bold text-white print:hidden"
        >
            Cetak Quotation
        </button>
    </main>
</template>
