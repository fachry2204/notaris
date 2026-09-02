<script setup lang="ts">
import { Head } from "@inertiajs/vue3";

const props = defineProps<{
    invoice: any;
    job: any;
    terms: string;
    items: any[];
    payments: any[];
    finance: {
        bankName?: string;
        accountNumber?: string;
        accountName?: string;
    };
}>();
const money = (value: any) =>
    new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0,
    }).format(Number(value || 0));
const date = (value: any) => {
    const match = String(value || "").match(/^(\d{4})-(\d{2})-(\d{2})/);

    return match ? `${match[3]}-${match[2]}-${match[1]}` : "-";
};
const paid = props.payments.reduce(
    (total, payment) =>
        total + (payment.type === "INCOME" ? Number(payment.amount) : 0),
    0,
);
</script>

<template>
    <Head :title="invoice.invoiceNumber" />
    <main class="mx-auto max-w-4xl bg-white p-10 text-slate-900">
        <div class="flex justify-between border-b pb-6">
            <div>
                <p
                    class="text-xs font-black uppercase tracking-[.2em] text-pink-600"
                >
                    Notaris Digital
                </p>
                <h1 class="mt-2 text-3xl font-black">INVOICE</h1>
            </div>
            <div class="text-right">
                <p class="font-mono font-bold">{{ invoice.invoiceNumber }}</p>
                <p class="text-sm text-slate-500">
                    {{ date(invoice.date) }}
                </p>
            </div>
        </div>
        <div class="mt-8 grid grid-cols-2 gap-8">
            <div>
                <p class="text-xs text-slate-500">Ditagihkan kepada</p>
                <p class="mt-1 font-black">{{ job?.clientName || "-" }}</p>
                <p class="text-sm">{{ job?.clientAddress }}</p>
            </div>
            <div class="text-right">
                <p class="text-xs text-slate-500">Berkas</p>
                <p class="mt-1 font-bold">{{ job?.trackingCode }}</p>
                <p>{{ job?.title }}</p>
            </div>
        </div>
        <table class="mt-10 w-full text-left text-sm">
            <thead class="bg-slate-100 text-xs uppercase text-slate-500">
                <tr>
                    <th class="px-3 py-3">No.</th>
                    <th class="px-3 py-3">Keterangan</th>
                    <th class="px-3 py-3">Qty</th>
                    <th class="px-3 py-3">Harga</th>
                    <th class="px-3 py-3 text-right">Jumlah</th>
                </tr>
            </thead>
            <tbody>
                <tr
                    v-for="(item, index) in items"
                    :key="item.id"
                    class="border-b"
                >
                    <td class="px-3 py-3">{{ index + 1 }}</td>
                    <td class="px-3 py-3 font-bold">
                        {{ item.description }}
                    </td>
                    <td class="px-3 py-3">
                        {{ Number(item.quantity) }} {{ item.unit }}
                    </td>
                    <td class="px-3 py-3">{{ money(item.unitPrice) }}</td>
                    <td class="px-3 py-3 text-right font-bold">
                        {{ money(item.total) }}
                    </td>
                </tr>
            </tbody>
        </table>
        <div
            class="mt-6 grid grid-cols-[minmax(0,1fr)_20rem] items-start gap-8"
        >
            <section class="text-sm">
                <h3 class="font-black">Syarat dan Ketentuan</h3>
                <p v-if="terms" class="mt-2 whitespace-pre-line text-slate-600">
                    {{ terms }}
                </p>
                <div
                    v-if="
                        finance.bankName ||
                        finance.accountNumber ||
                        finance.accountName
                    "
                    class="mt-4"
                >
                    <h4 class="font-black">Rekening Pembayaran</h4>
                    <dl class="mt-2 grid grid-cols-[7rem_1fr] gap-x-3 gap-y-1">
                        <dt class="text-slate-500">Bank</dt>
                        <dd class="font-bold">{{ finance.bankName || "-" }}</dd>
                        <dt class="text-slate-500">Nomor Rekening</dt>
                        <dd class="font-bold">
                            {{ finance.accountNumber || "-" }}
                        </dd>
                        <dt class="text-slate-500">Atas Nama</dt>
                        <dd class="font-bold">
                            {{ finance.accountName || "-" }}
                        </dd>
                    </dl>
                </div>
            </section>
            <dl class="w-full space-y-3 rounded-xl border p-6">
                <div class="flex justify-between">
                    <dt>Total tagihan</dt>
                    <dd class="text-xl font-bold">
                        {{ money(invoice.amount) }}
                    </dd>
                </div>
                <div class="flex justify-between">
                    <dt>Telah dibayar</dt>
                    <dd class="font-bold">{{ money(paid) }}</dd>
                </div>
                <div class="flex justify-between border-t pt-3">
                    <dt>Sisa</dt>
                    <dd class="font-bold">
                        {{ money(Number(invoice.amount) - paid) }}
                    </dd>
                </div>
            </dl>
        </div>
        <div class="mt-16 flex justify-end">
            <div class="w-56 text-center">
                <p>Hormat kami,</p>
                <div class="h-20"></div>
                <p class="border-t pt-2 font-bold">Kantor Notaris</p>
            </div>
        </div>
        <button
            onclick="window.print()"
            class="fixed right-6 bottom-6 rounded-xl bg-pink-600 px-5 py-3 font-bold text-white print:hidden"
        >
            Cetak
        </button>
    </main>
</template>
