<script setup lang="ts">
import { Head, Link, router, useForm, usePage } from "@inertiajs/vue3";
import { ref } from "vue";
import {
    ArrowLeft,
    Edit3,
    FilePlus2,
    FileText,
    Mail,
    Phone,
    Printer,
    Plus,
    Receipt,
    Send,
    Trash2,
    UserPlus,
    X,
} from "@lucide/vue";
import AppLayout from "@/Layouts/AppLayout.vue";
import DocumentEditHistory from "@/Components/DocumentEditHistory.vue";

const props = defineProps<{
    invoice: any;
    items: any[];
    payments: any[];
    job: any;
    jobType: string;
    masterClient?: any | null;
    editHistory: any[];
}>();
const form = useForm({
    amount: 0,
    date: new Date().toISOString().slice(0, 10),
    description: "",
    paymentMethod: "",
    proofs: [] as File[],
});
const proofInput = ref<HTMLInputElement | null>(null);
const previewProof = ref<{ url: string; name: string } | null>(null);
const proofError = ref("");
const selectProofs = (event: Event) => {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files || []);
    input.value = "";
    proofError.value = "";
    if (form.proofs.length + files.length > 10) {
        proofError.value = "Maksimal 10 gambar. Hapus gambar atau pilih lebih sedikit.";
        return;
    }
    if (files.some((file) => !["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 5 * 1024 * 1024)) {
        proofError.value = "Pilih gambar JPG, PNG, atau WebP dengan ukuran maksimal 5 MB per gambar.";
        return;
    }
    form.proofs.push(...files);
};
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
const recordedAt = (value: any) => {
    const match = String(value || "").match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?/);
    return match ? `${match[3]}-${match[2]}-${match[1]} ${match[4]}:${match[5]}:${match[6] || "00"}` : "Waktu tidak tersedia";
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
                <div class="flex flex-wrap gap-2">
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
                    ><a
                        v-if="invoice.status === 'Lunas'"
                        :href="`/dashboard/invoice/${invoice.id}/kwitansi`"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="flex h-10 items-center gap-2 rounded-xl bg-teal-700 px-4 text-sm font-bold text-white hover:bg-teal-800"
                        ><Receipt class="h-4 w-4" />Print Kwitansi</a
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
            <div class="flex flex-col gap-6">
                <section
                    class="order-2 rounded-3xl border border-slate-200 bg-white p-6"
                >
                    <div class="flex flex-wrap items-start justify-between gap-4">
                        <div><h2 class="flex items-center gap-2 font-black"><Receipt class="h-5 w-5 text-orange-600" /> Riwayat Pembayaran</h2><p class="mt-1 text-xs text-slate-500">Daftar seluruh transaksi pembayaran untuk invoice ini.</p></div>
                        <div class="flex flex-wrap gap-2 text-xs"><div class="rounded-xl border border-orange-200 bg-orange-50 px-3 py-2"><span class="block text-slate-500">Total Tagihan</span><strong class="text-orange-800">{{ money(invoice.amount) }}</strong></div><div class="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2"><span class="block text-slate-500">Total Dibayar</span><strong class="text-emerald-700">{{ money(paid()) }}</strong></div><div class="rounded-xl border border-blue-200 bg-blue-50 px-3 py-2"><span class="block text-slate-500">Status</span><strong class="text-blue-700">{{ invoice.status }}</strong></div></div>
                    </div>
                    <p
                        v-if="!payments.length"
                        class="py-10 text-center text-sm text-slate-400"
                    >
                        Belum ada pembayaran.
                    </p>
                    <div
                        v-for="(item, index) in payments"
                        :key="item.id"
                        class="relative ml-2 border-l-2 border-slate-200 pb-2 pl-6 last:border-transparent"
                    >
                        <span class="absolute -left-[7px] top-5 h-3 w-3 rounded-full border-2 border-white bg-emerald-600" />
                        <div class="mt-2 flex flex-wrap items-start justify-between gap-3 rounded-xl p-4" :class="index === 0 ? 'bg-emerald-50' : 'border-b border-slate-100'"><div class="flex min-w-0 gap-3"><span class="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-emerald-200 bg-white text-emerald-700"><Receipt class="h-5 w-5" /></span><div>
                            <p class="font-bold">{{ item.description || 'Pembayaran invoice' }}</p>
                            <p class="text-xs text-slate-500">
                                {{ paymentDate(item.date) }}
                                · {{ item.paymentMethod || "Cara pembayaran tidak tercatat" }}
                            </p>
                            <p class="mt-1 text-xs text-slate-500">Dicatat: {{ recordedAt(item.createdAt) }}</p>
                            <div v-if="item.proofs?.length" class="mt-3 flex flex-wrap gap-2">
                                <button v-for="proof in item.proofs" :key="proof.id" type="button" @click="previewProof = proof" :aria-label="`Lihat ${proof.name}`" class="overflow-hidden rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-teal-600">
                                    <img :src="proof.url" :alt="proof.name" loading="lazy" class="h-20 w-20 object-cover" />
                                </button>
                            </div>
                        </div></div>
                        <div class="flex items-center gap-3"><b class="text-emerald-700">{{ money(item.amount) }}</b><span class="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">Tercatat</span></div></div>
                    </div>
                </section>
                <form
                    v-if="invoice.status !== 'Lunas'"
                    @submit.prevent="
                        form.post(`/dashboard/invoice/${invoice.id}/payment`, {
                            forceFormData: true,
                            onSuccess: () => {
                                form.reset('amount', 'description', 'paymentMethod', 'proofs');
                                proofError = '';
                                if (proofInput) proofInput.value = '';
                            },
                        })
                    "
                    class="order-1 rounded-3xl border border-slate-200 bg-white p-6"
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
                    /><label class="mt-3 block text-sm font-bold">Cara Pembayaran
                        <select v-model="form.paymentMethod" required class="mt-1 w-full rounded-xl border-slate-200">
                            <option value="">Pilih cara pembayaran</option>
                            <option value="Transfer">Transfer</option>
                            <option value="Cash">Cash</option>
                        </select>
                        <span v-if="form.errors.paymentMethod" class="text-xs text-red-600">{{ form.errors.paymentMethod }}</span>
                    </label><input
                        v-model="form.date"
                        type="date"
                        required
                        class="mt-3 w-full rounded-xl border-slate-200"
                    /><input
                        v-model="form.description"
                        placeholder="Keterangan"
                        class="mt-3 w-full rounded-xl border-slate-200"
                    /><div class="mt-3 block text-sm font-bold">Bukti Pembayaran (opsional)
                        <input ref="proofInput" type="file" accept="image/jpeg,image/png,image/webp" multiple @change="selectProofs" class="sr-only" tabindex="-1" />
                        <button type="button" @click="proofInput?.click()" :disabled="form.proofs.length >= 10" class="mt-2 inline-flex items-center gap-2 rounded-xl border border-teal-600 px-4 py-2 font-bold text-teal-700 hover:bg-teal-50 disabled:cursor-not-allowed disabled:opacity-50">
                            <Plus class="h-4 w-4" /> Tambah gambar
                        </button>
                        <span class="mt-1 block text-xs font-normal text-slate-500">Maksimal 10 gambar JPG, PNG, atau WebP, masing-masing 5 MB.</span>
                        <span v-if="form.proofs.length" class="mt-1 block text-xs font-normal">{{ form.proofs.length }} gambar dipilih</span>
                        <ul v-if="form.proofs.length" class="mt-2 space-y-2">
                            <li v-for="(file, index) in form.proofs" :key="index" class="flex items-center justify-between gap-3 rounded-lg bg-slate-50 p-2 text-xs font-normal">
                                <span class="min-w-0 break-all">{{ file.name }}</span>
                                <button type="button" @click="form.proofs.splice(index, 1); proofError = ''" :aria-label="`Hapus ${file.name}`" class="shrink-0 rounded p-1 text-rose-600 hover:bg-rose-50"><Trash2 class="h-4 w-4" /></button>
                            </li>
                        </ul>
                        <span v-if="proofError" class="mt-1 block text-xs text-red-600">{{ proofError }}</span>
                        <span v-if="form.errors.proofs" class="text-xs text-red-600">{{ form.errors.proofs }}</span>
                        <span v-for="(message, field) in form.errors" :key="field" class="block text-xs text-red-600">{{ String(field).startsWith('proofs.') ? message : '' }}</span>
                    </div><button
                        :disabled="form.processing"
                        class="mt-4 rounded-xl bg-pink-500 px-5 py-3 font-bold text-white"
                    >
                        Simpan Pembayaran
                    </button>
                </form>
                <section
                    v-else
                    class="order-1 grid place-items-center rounded-3xl border border-emerald-200 bg-emerald-50 p-8 text-center"
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
            <DocumentEditHistory title="Riwayat Perubahan Invoice" :entries="editHistory" />
        </main>
        <Teleport to="body">
            <div v-if="previewProof" role="dialog" aria-modal="true" aria-label="Pratinjau bukti pembayaran" class="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4" @click.self="previewProof = null" @keydown.esc="previewProof = null">
                <div class="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
                    <div class="flex items-center justify-between gap-4 border-b p-4">
                        <p class="min-w-0 break-all text-sm font-bold">{{ previewProof.name }}</p>
                        <button type="button" @click="previewProof = null" aria-label="Tutup pratinjau" class="rounded-lg p-2 hover:bg-slate-100"><X class="h-5 w-5" /></button>
                    </div>
                    <div class="min-h-0 overflow-auto bg-slate-100 p-4"><img :src="previewProof.url" :alt="previewProof.name" class="mx-auto max-h-[70vh] max-w-full object-contain" /></div>
                </div>
            </div>
        </Teleport>
    </AppLayout>
</template>
