<script setup lang="ts">
import { computed } from "vue";
import { Head, usePage } from "@inertiajs/vue3";
import PrintFooter from "@/Components/PrintFooter.vue";

const props = defineProps<{ invoice: any; job: any; payments: any[]; verificationUrl: string }>();
const page = usePage();
const branding = computed(() => (page.props.branding || {}) as { officeName?: string; officeAddress?: string });
const money = (value: any) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(Number(value || 0));
const date = (value: any) => {
    const match = String(value || "").match(/^(\d{4})-(\d{2})-(\d{2})/);
    return match ? `${match[3]}-${match[2]}-${match[1]}` : "-";
};
const paid = computed(() => props.payments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0));
const complete = computed(() => paid.value >= Number(props.invoice.amount));
const settlementDate = computed(() => {
    let total = 0;
    const payment = props.payments.find((item) => {
        total += Number(item.amount || 0);
        return total >= Number(props.invoice.amount);
    });
    return payment?.date || null;
});
const rows = computed(() => {
    let running = 0;
    return props.payments.map((payment) => {
        running += Number(payment.amount || 0);
        return { ...payment, label: running >= Number(props.invoice.amount) ? "Pelunasan" : "Down Payment (DP)" };
    });
});
</script>

<template>
    <Head :title="`Kwitansi ${invoice.invoiceNumber}`" />
    <main class="mx-auto min-h-screen max-w-4xl bg-white p-6 text-slate-900 sm:p-10">
        <header class="flex flex-wrap justify-between gap-5 border-b-2 border-teal-700 pb-6">
            <div>
                <p class="text-lg font-black">{{ branding.officeName || "Kantor Notaris" }}</p>
                <p v-if="branding.officeAddress" class="mt-1 max-w-md whitespace-pre-line text-sm text-slate-600">{{ branding.officeAddress }}</p>
            </div>
            <div class="text-right">
                <h1 class="text-2xl font-black">KWITANSI</h1>
                <p class="mt-1 text-sm">Invoice {{ invoice.invoiceNumber }}</p>
                <p class="text-sm text-slate-500">Tanggal invoice: {{ date(invoice.date) }}</p>
            </div>
        </header>

        <section class="mt-8 grid gap-5 sm:grid-cols-2">
            <div><p class="text-sm text-slate-500">Diterima dari</p><p class="mt-1 font-bold">{{ job?.clientName || "-" }}</p><p v-if="job?.clientAddress" class="whitespace-pre-line text-sm">{{ job.clientAddress }}</p></div>
            <div><p class="text-sm text-slate-500">Untuk pembayaran</p><p class="mt-1 font-bold">{{ job?.title || "Invoice" }}</p><p class="text-sm">{{ invoice.invoiceNumber }}</p></div>
        </section>

        <section class="mt-8">
            <h2 class="text-lg font-black">Riwayat Pembayaran</h2>
            <table class="mt-3 w-full text-left text-sm">
                <thead class="bg-slate-100"><tr><th class="p-3">Tanggal</th><th class="p-3">Pembayaran</th><th class="p-3">Cara Pembayaran</th><th class="p-3">Keterangan</th><th class="p-3 text-right">Jumlah</th></tr></thead>
                <tbody><tr v-for="payment in rows" :key="payment.id" class="border-b"><td class="p-3">{{ date(payment.date) }}</td><td class="p-3 font-semibold">{{ payment.label }}</td><td class="p-3">{{ payment.paymentMethod || "Tidak tercatat" }}</td><td class="p-3">{{ payment.description || "-" }}</td><td class="p-3 text-right">{{ money(payment.amount) }}</td></tr></tbody>
            </table>
            <p v-if="!rows.length" class="py-4 text-sm text-slate-500">Belum ada pembayaran yang tercatat.</p>
        </section>

        <div class="ml-auto mt-6 max-w-sm space-y-2 rounded-xl border p-5 text-sm">
            <div class="flex justify-between gap-4"><span>Total tagihan</span><strong>{{ money(invoice.amount) }}</strong></div>
            <div class="flex justify-between gap-4"><span>Total pembayaran tercatat</span><strong>{{ money(paid) }}</strong></div>
            <div class="flex justify-between gap-4 border-t pt-2"><span>Sisa berdasarkan catatan</span><strong>{{ money(Math.max(0, Number(invoice.amount) - paid)) }}</strong></div>
        </div>
        <p v-if="!complete" class="mt-5 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">Status invoice tercatat lunas, tetapi riwayat pembayaran belum mencakup seluruh tagihan. Periksa data pembayaran.</p>
        <div v-else class="mt-5 inline-flex -rotate-3 flex-col items-center rounded-lg border-4 border-red-700 px-6 py-2 font-black uppercase text-red-700">
            <span class="text-3xl tracking-widest">Lunas</span>
            <span class="mt-1 text-sm tracking-wide">{{ date(settlementDate) }}</span>
        </div>
        <div class="mt-14 flex justify-end"><div class="w-56 text-center"><p>Hormat kami,</p><div class="h-20"></div><p class="border-t pt-2 font-bold">Salfa Novia Roza, S.H., M.Kn.</p></div></div>
        <PrintFooter :verification-url="verificationUrl" />
        <button type="button" onclick="window.print()" class="fixed bottom-6 right-6 rounded-xl bg-teal-700 px-5 py-3 font-bold text-white print:hidden">Cetak Kwitansi</button>
    </main>
</template>
