<script setup lang="ts">
import { Head, Link, router, useForm, usePage } from "@inertiajs/vue3";
import {
    ArrowLeft,
    Edit3,
    FilePlus2,
    FileText,
    Mail,
    Phone,
    Printer,
    Receipt,
    Send,
    Trash2,
    UserPlus,
} from "@lucide/vue";
import AppLayout from "@/Layouts/AppLayout.vue";

const props = defineProps<{
    invoice: any;
    items: any[];
    payments: any[];
    job: any;
    jobType: string;
    masterClient?: any | null;
}>();
const form = useForm({
    amount: 0,
    date: new Date().toISOString().slice(0, 10),
    description: "",
});
const notificationForm = useForm({ notification: "" });
const page = usePage<any>();
const sendNotification = () => {
    if (!confirm("Kirim invoice melalui Email dan/atau WhatsApp yang aktif?"))
        return;
    notificationForm.post(`/dashboard/invoice/${props.invoice.id}/notify`, {
        preserveScroll: true,
    });
};
const money = (value: any) =>
    new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
    }).format(Number(value || 0));
const paymentDate = (value: any) => {
    const match = String(value || "").match(/^(\d{4})-(\d{2})-(\d{2})/);

    return match ? `${match[3]}-${match[2]}-${match[1]}` : "-";
};
const paid = () =>
    props.payments
        .filter((x) => x.type === "INCOME")
        .reduce((sum, x) => sum + Number(x.amount), 0);
const remaining = () => Math.max(0, Number(props.invoice.amount) - paid());
const remove = () =>
    confirm("Hapus invoice ini dan reset status tagihan berkas?") &&
    router.delete(`/dashboard/invoice/${props.invoice.id}`);
</script>

<template>
    <Head :title="invoice.invoiceNumber" />
    <AppLayout>
        <main class="mx-auto max-w-5xl space-y-6 p-4">
            <div
                class="flex flex-col justify-between gap-4 md:flex-row md:items-center"
            >
                <div class="flex items-center gap-4">
                    <Link
                        href="/dashboard/invoice"
                        class="grid h-11 w-11 place-items-center rounded-full hover:bg-pink-50"
                        ><ArrowLeft
                    /></Link>
                    <div>
                        <p class="font-mono text-sm font-bold text-pink-600">
                            {{ invoice.invoiceNumber }}
                        </p>
                        <h1 class="text-3xl font-black">
                            {{ money(invoice.amount) }}
                        </h1>
                        <p class="text-sm text-slate-500">
                            Terbayar {{ money(paid()) }} · {{ invoice.status }}
                        </p>
                    </div>
                </div>
                <div class="flex gap-2">
                    <button
                        :disabled="notificationForm.processing"
                        @click="sendNotification"
                        class="flex h-10 items-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-bold text-white disabled:opacity-50"
                    >
                        <Send class="h-4 w-4" />{{
                            notificationForm.processing
                                ? "Mengirim..."
                                : "Kirim"
                        }}
                    </button>
                    <a
                        :href="`/print/invoice/${invoice.id}`"
                        target="_blank"
                        class="flex h-10 items-center gap-2 rounded-xl border bg-white px-4 font-bold"
                        ><Printer class="h-4 w-4" />Cetak</a
                    ><Link
                        :href="`/dashboard/invoice/${invoice.id}/edit`"
                        class="flex h-10 items-center gap-2 rounded-xl bg-pink-500 px-4 text-sm font-bold text-white"
                        ><Edit3 class="h-4 w-4" />Edit</Link
                    ><button
                        @click="remove"
                        class="grid h-10 w-10 place-items-center rounded-xl bg-rose-50 text-rose-600"
                    >
                        <Trash2 class="h-4 w-4" />
                    </button>
                </div>
            </div>
            <div
                v-if="page.props.flash?.success"
                class="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700"
            >
                {{ page.props.flash.success }}
            </div>
            <div
                v-if="notificationForm.errors.notification"
                class="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700"
            >
                {{ notificationForm.errors.notification }}
            </div>
            <section class="grid gap-6 md:grid-cols-2">
                <article
                    class="rounded-3xl border border-slate-200 bg-white p-6"
                >
                    <div class="flex items-center gap-2">
                        <Receipt class="text-pink-500" />
                        <h2 class="font-black">Tagihan Kepada</h2>
                    </div>
                    <h3 class="mt-5 text-xl font-black">
                        {{ job?.clientName || "Klien Umum" }}
                    </h3>
                    <p
                        class="mt-2 flex items-center gap-2 text-sm text-slate-500"
                    >
                        <Phone class="h-4 w-4" />{{ job?.clientPhone || "-" }}
                    </p>
                    <p
                        class="mt-2 flex items-center gap-2 text-sm text-slate-500"
                    >
                        <Mail class="h-4 w-4" />{{ job?.clientEmail || "-" }}
                    </p>
                    <div
                        v-if="jobType === 'quotation'"
                        class="mt-5 border-t border-slate-100 pt-5"
                    >
                        <Link
                            v-if="!masterClient"
                            :href="`/dashboard/clients/new?invoice=${invoice.id}`"
                            class="inline-flex h-10 items-center gap-2 rounded-xl bg-pink-500 px-4 text-sm font-bold text-white"
                        >
                            <UserPlus class="h-4 w-4" />
                            Upload Data Client
                        </Link>
                        <Link
                            v-else
                            :href="`/dashboard/jobs/new?client=${masterClient.id}&invoice=${invoice.id}`"
                            class="inline-flex h-10 items-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-bold text-white"
                        >
                            <FilePlus2 class="h-4 w-4" />
                            Tambahkan Berkas
                        </Link>
                        <p class="mt-2 text-xs text-slate-500">
                            {{
                                masterClient
                                    ? "Client sudah tersimpan. Lanjutkan registrasi berkas baru."
                                    : "Simpan data client Quotation sebelum membuat berkas."
                            }}
                        </p>
                    </div>
                </article>
                <article
                    class="rounded-3xl border border-slate-200 bg-white p-6"
                >
                    <div class="flex items-center gap-2">
                        <FileText class="text-blue-500" />
                        <h2 class="font-black">
                            {{
                                jobType === "quotation"
                                    ? "Sumber Quotation"
                                    : "Informasi Berkas"
                            }}
                        </h2>
                    </div>
                    <p class="mt-5 font-mono font-black text-pink-600">
                        {{ job?.trackingCode || "-" }}
                    </p>
                    <p class="mt-1 font-bold">{{ job?.title || "-" }}</p>
                    <Link
                        v-if="job"
                        :href="
                            jobType === 'quotation'
                                ? `/dashboard/quotation/${job.id}`
                                : `/dashboard/jobs/${jobType}/${job.id}`
                        "
                        class="mt-4 inline-block rounded-xl bg-blue-50 px-4 py-2 text-sm font-bold text-blue-600"
                        >{{
                            jobType === "quotation"
                                ? "Buka Quotation"
                                : "Buka Berkas"
                        }}</Link
                    >
                </article>
            </section>
            <section
                class="overflow-hidden rounded-3xl border border-slate-200 bg-white"
            >
                <div class="border-b border-slate-200 p-6">
                    <h2 class="font-black">Rincian Item Invoice</h2>
                </div>
                <div class="overflow-x-auto">
                    <table class="w-full min-w-[760px] text-left">
                        <thead
                            class="bg-slate-50 text-xs uppercase text-slate-500"
                        >
                            <tr>
                                <th class="px-6 py-4">No.</th>
                                <th class="px-6 py-4">Keterangan</th>
                                <th class="px-6 py-4">Qty</th>
                                <th class="px-6 py-4">Harga Satuan</th>
                                <th class="px-6 py-4 text-right">Jumlah</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr
                                v-for="(item, index) in items"
                                :key="item.id"
                                class="border-t border-slate-100"
                            >
                                <td class="px-6 py-4 text-slate-400">
                                    {{ index + 1 }}
                                </td>
                                <td class="px-6 py-4 font-bold">
                                    {{ item.description }}
                                </td>
                                <td class="px-6 py-4">
                                    {{ Number(item.quantity) }} {{ item.unit }}
                                </td>
                                <td class="px-6 py-4">
                                    {{ money(item.unitPrice) }}
                                </td>
                                <td class="px-6 py-4 text-right font-black">
                                    {{ money(item.total) }}
                                </td>
                            </tr>
                        </tbody>
                        <tfoot>
                            <tr class="border-t border-slate-200">
                                <td
                                    colspan="4"
                                    class="px-6 py-5 text-right font-black"
                                >
                                    Total Invoice
                                </td>
                                <td
                                    class="px-6 py-5 text-right text-lg font-black text-pink-600"
                                >
                                    {{ money(invoice.amount) }}
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </section>
            <div class="grid gap-6 lg:grid-cols-2">
                <section
                    class="rounded-3xl border border-slate-200 bg-white p-6"
                >
                    <h2 class="font-black">Riwayat Pembayaran</h2>
                    <p
                        v-if="!payments.length"
                        class="py-10 text-center text-sm text-slate-400"
                    >
                        Belum ada pembayaran.
                    </p>
                    <div
                        v-for="item in payments"
                        :key="item.id"
                        class="mt-3 flex justify-between rounded-xl bg-slate-50 p-4"
                    >
                        <div>
                            <p class="font-bold">{{ item.description }}</p>
                            <p class="text-xs text-slate-500">
                                {{ paymentDate(item.date) }}
                            </p>
                        </div>
                        <b class="text-emerald-600">{{ money(item.amount) }}</b>
                    </div>
                </section>
                <form
                    v-if="invoice.status !== 'Lunas'"
                    @submit.prevent="
                        form.post(`/dashboard/invoice/${invoice.id}/payment`, {
                            onSuccess: () =>
                                form.reset('amount', 'description'),
                        })
                    "
                    class="rounded-3xl border border-slate-200 bg-white p-6"
                >
                    <h2 class="font-black">Catat Pembayaran</h2>
                    <p class="mt-1 text-sm text-slate-500">
                        Sisa tagihan: <b>{{ money(remaining()) }}</b>
                    </p>
                    <input
                        v-model.number="form.amount"
                        type="number"
                        min="1"
                        :max="remaining()"
                        required
                        placeholder="Nominal"
                        class="mt-4 w-full rounded-xl border-slate-200"
                    /><input
                        v-model="form.date"
                        type="date"
                        required
                        class="mt-3 w-full rounded-xl border-slate-200"
                    /><input
                        v-model="form.description"
                        placeholder="Keterangan"
                        class="mt-3 w-full rounded-xl border-slate-200"
                    /><button
                        :disabled="form.processing"
                        class="mt-4 rounded-xl bg-pink-500 px-5 py-3 font-bold text-white"
                    >
                        Simpan Pembayaran
                    </button>
                </form>
                <section
                    v-else
                    class="grid place-items-center rounded-3xl border border-emerald-200 bg-emerald-50 p-8 text-center"
                >
                    <div>
                        <p class="text-2xl font-black text-emerald-700">
                            Invoice Lunas
                        </p>
                        <p class="mt-2 text-sm text-emerald-600">
                            Seluruh pembayaran telah diterima.
                        </p>
                    </div>
                </section>
            </div>
        </main>
    </AppLayout>
</template>
