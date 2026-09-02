<script setup lang="ts">
import { ref } from "vue";
import { Head, Link, router, useForm, usePage } from "@inertiajs/vue3";
import type { PageProps } from "@/types";
import {
    ArrowLeft,
    Ban,
    CalendarDays,
    Edit3,
    LockKeyhole,
    Mail,
    Phone,
    Printer,
    Receipt,
    Send,
    Trash2,
    UserRound,
} from "@lucide/vue";
import AppLayout from "@/Layouts/AppLayout.vue";

const props = defineProps<{
    quotation: any;
    items: any[];
    publication?: any;
    notificationChannels: {
        email: boolean;
        whatsapp: boolean;
    };
    convertedInvoice?: any | null;
}>();
const page = usePage<PageProps<{ flash?: { success?: string } }>>();
const money = (value: any) =>
    new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0,
    }).format(Number(value || 0));
const date = (value: any) =>
    value
        ? new Date(`${String(value).slice(0, 10)}T00:00:00`).toLocaleDateString(
              "id-ID",
              { day: "2-digit", month: "long", year: "numeric" },
          )
        : "-";
const remove = () =>
    confirm("Hapus quotation ini?") &&
    router.delete(`/dashboard/quotation/${props.quotation.id}`);
const publishForm = useForm({
    publish: "",
    publishWithoutNotification: false,
});
const showCancelDialog = ref(false);
const cancelForm = useForm({
    cancellationReason: "",
    cancelQuotation: "",
});
const openCancelDialog = () => {
    cancelForm.reset();
    cancelForm.clearErrors();
    showCancelDialog.value = true;
};
const cancelQuotation = () => {
    cancelForm.cancellationReason = cancelForm.cancellationReason.trim();
    if (!cancelForm.cancellationReason) {
        cancelForm.setError(
            "cancellationReason",
            "Alasan pembatalan wajib diisi.",
        );
        return;
    }

    cancelForm.post(`/dashboard/quotation/${props.quotation.id}/cancel`, {
        preserveScroll: true,
        onSuccess: () => {
            showCancelDialog.value = false;
        },
    });
};
const publish = () => {
    const notificationsDisabled =
        !props.notificationChannels.email &&
        !props.notificationChannels.whatsapp;
    const message = notificationsDisabled
        ? "PERINGATAN: Google SMTP dan Fonnte WhatsApp tidak aktif. Quotation akan diterbitkan tanpa mengirim Email atau WhatsApp ke client. Tetap lanjutkan?"
        : "Terbitkan quotation dan kirim melalui layanan Email/WhatsApp yang aktif ke client?";
    if (!confirm(message)) return;

    publishForm.publishWithoutNotification = notificationsDisabled;
    publishForm.post(`/dashboard/quotation/${props.quotation.id}/publish`, {
        preserveScroll: true,
    });
};
</script>

<template>
    <Head :title="quotation.quotationNumber" />
    <AppLayout>
        <main class="mx-auto max-w-6xl space-y-6 p-4">
            <header class="flex flex-col gap-3">
                <div class="flex min-w-0 items-start gap-3">
                    <Link
                        href="/dashboard/quotation"
                        class="grid h-9 w-9 shrink-0 place-items-center rounded-full hover:bg-pink-50"
                    >
                        <ArrowLeft class="h-4 w-4" />
                    </Link>
                    <div class="min-w-0">
                        <p class="font-mono text-xs font-black text-pink-600">
                            {{ quotation.quotationNumber }}
                        </p>
                        <h1
                            class="text-xl font-black leading-tight sm:text-2xl"
                        >
                            {{ quotation.subject }}
                        </h1>
                    </div>
                </div>
                <div class="flex flex-wrap items-center gap-1.5 sm:justify-end">
                    <button
                        v-if="!publication?.publishedAt && !convertedInvoice"
                        :disabled="publishForm.processing"
                        @click="publish"
                        class="inline-flex h-9 items-center gap-1.5 rounded-lg bg-emerald-500 px-3 text-xs font-bold text-white shadow-sm hover:bg-emerald-600 disabled:cursor-wait disabled:opacity-60"
                    >
                        <Send class="h-3.5 w-3.5" />
                        {{
                            publishForm.processing
                                ? "Menerbitkan..."
                                : publication?.emailSentAt ||
                                    publication?.whatsappSentAt
                                  ? "Lanjutkan Terbitkan"
                                  : "Terbitkan"
                        }}
                    </button>
                    <span
                        v-else-if="publication?.publishedAt"
                        class="inline-flex h-9 items-center gap-1.5 rounded-lg bg-emerald-50 px-3 text-xs font-bold text-emerald-700"
                    >
                        <Send class="h-3.5 w-3.5" /> Sudah Diterbitkan
                    </span>
                    <button
                        v-if="
                            publication?.publishedAt &&
                            quotation.status !== 'Dibatalkan' &&
                            !convertedInvoice
                        "
                        :disabled="cancelForm.processing"
                        @click="openCancelDialog"
                        class="inline-flex h-9 items-center gap-1.5 rounded-lg border border-rose-200 bg-white px-3 text-xs font-bold text-rose-600 hover:bg-rose-50 disabled:opacity-50"
                    >
                        <Ban class="h-3.5 w-3.5" />
                        {{
                            cancelForm.processing
                                ? "Membatalkan..."
                                : "Batal Quotation"
                        }}
                    </button>
                    <Link
                        v-if="
                            publication?.publishedAt &&
                            quotation.status !== 'Dibatalkan' &&
                            !convertedInvoice
                        "
                        :href="`/dashboard/invoice/new?quotation=${quotation.id}`"
                        class="inline-flex h-9 items-center gap-1.5 rounded-lg bg-blue-600 px-3 text-xs font-bold text-white hover:bg-blue-700"
                    >
                        <Receipt class="h-3.5 w-3.5" /> Kirim ke Invoice
                    </Link>
                    <Link
                        v-else-if="convertedInvoice"
                        :href="`/dashboard/invoice/${convertedInvoice.id}`"
                        class="inline-flex h-9 items-center gap-1.5 rounded-lg bg-blue-50 px-3 text-xs font-bold text-blue-700"
                    >
                        <Receipt class="h-3.5 w-3.5" /> Buka Invoice
                    </Link>
                    <a
                        v-if="quotation.status !== 'Dibatalkan'"
                        :href="`/print/quotation/${quotation.id}`"
                        target="_blank"
                        class="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold"
                    >
                        <Printer class="h-3.5 w-3.5" /> Cetak
                    </a>
                    <Link
                        v-if="
                            quotation.status !== 'Dibatalkan' &&
                            !convertedInvoice
                        "
                        :href="`/dashboard/quotation/${quotation.id}/edit`"
                        class="inline-flex h-9 items-center gap-1.5 rounded-lg bg-pink-500 px-3 text-xs font-bold text-white"
                    >
                        <Edit3 class="h-3.5 w-3.5" /> Edit
                        <span v-if="publication?.publishedAt">Quotation</span>
                    </Link>
                    <button
                        v-if="!convertedInvoice"
                        @click="remove"
                        aria-label="Hapus Quotation"
                        title="Hapus Quotation"
                        class="grid h-9 w-9 place-items-center rounded-lg bg-rose-50 text-rose-600"
                    >
                        <Trash2 class="h-3.5 w-3.5" />
                    </button>
                </div>
            </header>
            <div
                v-if="convertedInvoice"
                class="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-blue-800"
            >
                <div class="flex items-center gap-2 text-sm font-semibold">
                    <LockKeyhole class="h-4 w-4 shrink-0" />
                    <span>
                        Status Invoice Terbuat. Quotation terkunci dan tidak
                        dapat diedit atau dihapus selama Invoice masih ada.
                    </span>
                </div>
            </div>
            <div
                v-if="quotation.status === 'Dibatalkan'"
                class="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-rose-700"
            >
                <div class="flex items-center gap-2 text-sm font-semibold">
                    <LockKeyhole class="h-4 w-4 shrink-0" />
                    <span>
                        Quotation dibatalkan dan terkunci. Data tidak dapat
                        diedit; hanya dapat dihapus.
                    </span>
                </div>
                <div class="mt-3 border-t border-rose-200 pt-3">
                    <p
                        class="text-xs font-black uppercase tracking-wider text-rose-500"
                    >
                        Alasan Pembatalan
                    </p>
                    <p class="mt-1 whitespace-pre-line text-sm">
                        {{
                            quotation.cancellationReason ||
                            "Alasan tidak tercatat karena quotation dibatalkan sebelum fitur alasan diterapkan."
                        }}
                    </p>
                </div>
            </div>
            <div
                v-if="page.props.flash?.success"
                class="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700"
            >
                {{ page.props.flash.success }}
            </div>
            <div
                v-if="page.props.errors?.quotation"
                class="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700"
            >
                {{ page.props.errors.quotation }}
            </div>
            <div
                v-if="publishForm.errors.publish"
                class="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700"
            >
                {{ publishForm.errors.publish }}
            </div>
            <div
                v-if="cancelForm.errors.cancelQuotation"
                class="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700"
            >
                {{ cancelForm.errors.cancelQuotation }}
            </div>
            <div
                v-if="
                    !publication?.publishedAt &&
                    !convertedInvoice &&
                    !notificationChannels.email &&
                    !notificationChannels.whatsapp
                "
                class="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
            >
                <strong>Notifikasi tidak aktif.</strong>
                Quotation tetap dapat diterbitkan. Saat tombol Terbitkan diklik,
                sistem akan meminta konfirmasi untuk melanjutkan tanpa Email dan
                WhatsApp.
            </div>

            <section class="grid gap-5 md:grid-cols-3">
                <article
                    class="rounded-3xl border border-slate-200 bg-white p-6"
                >
                    <p
                        class="text-xs font-black uppercase tracking-widest text-slate-400"
                    >
                        Client
                    </p>
                    <h2 class="mt-3 text-lg font-black">
                        {{ quotation.clientName }}
                    </h2>
                    <p
                        class="mt-2 flex items-center gap-2 text-sm text-slate-500"
                    >
                        <Phone class="h-4 w-4" />
                        {{ quotation.clientPhone || "-" }}
                    </p>
                    <p
                        class="mt-2 flex items-center gap-2 text-sm text-slate-500"
                    >
                        <Mail class="h-4 w-4" />
                        {{ quotation.clientEmail || "-" }}
                    </p>
                </article>
                <article
                    class="rounded-3xl border border-slate-200 bg-white p-6"
                >
                    <p
                        class="text-xs font-black uppercase tracking-widest text-slate-400"
                    >
                        PIC Quotation
                    </p>
                    <h2 class="mt-3 flex items-center gap-2 text-lg font-black">
                        <UserRound class="h-5 w-5 text-pink-600" />
                        {{ quotation.picName }}
                    </h2>
                    <p class="mt-2 text-sm text-slate-500">
                        {{ quotation.picPhone || quotation.picEmail || "-" }}
                    </p>
                </article>
                <article
                    class="rounded-3xl border border-slate-200 bg-white p-6"
                >
                    <div class="flex items-start justify-between">
                        <div>
                            <p
                                class="text-xs font-black uppercase tracking-widest text-slate-400"
                            >
                                Masa Berlaku
                            </p>
                            <p class="mt-3 flex items-center gap-2 font-bold">
                                <CalendarDays class="h-5 w-5 text-pink-600" />
                                {{ date(quotation.quotationDate) }}
                            </p>
                            <p class="mt-1 text-sm text-slate-500">
                                s.d. {{ date(quotation.validUntil) }}
                            </p>
                        </div>
                        <span
                            class="rounded-full bg-pink-50 px-3 py-1 text-xs font-black text-pink-600"
                            >{{ quotation.status }}</span
                        >
                    </div>
                </article>
            </section>

            <section
                class="overflow-hidden rounded-3xl border border-slate-200 bg-white"
            >
                <div class="border-b border-slate-200 p-6">
                    <h2 class="text-lg font-black">Rincian Penawaran</h2>
                </div>
                <div class="overflow-x-auto">
                    <table class="w-full min-w-[760px] text-left text-sm">
                        <thead
                            class="bg-slate-50 text-xs uppercase tracking-wider text-slate-500"
                        >
                            <tr>
                                <th class="p-4 pl-6">No.</th>
                                <th>Deskripsi</th>
                                <th>Qty</th>
                                <th>Harga Satuan</th>
                                <th class="pr-6 text-right">Jumlah</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr
                                v-for="(item, index) in items"
                                :key="item.id"
                                class="border-t border-slate-100"
                            >
                                <td class="p-4 pl-6 text-slate-400">
                                    {{ index + 1 }}
                                </td>
                                <td class="font-bold">
                                    {{ item.description }}
                                </td>
                                <td>
                                    {{ Number(item.quantity) }} {{ item.unit }}
                                </td>
                                <td>{{ money(item.unitPrice) }}</td>
                                <td class="pr-6 text-right font-black">
                                    {{ money(item.total) }}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <div
                    class="grid items-start gap-8 border-t border-slate-200 p-6 lg:grid-cols-[minmax(0,1fr)_24rem]"
                >
                    <article v-if="quotation.terms">
                        <h2 class="font-black">Syarat dan Ketentuan</h2>
                        <p
                            class="mt-3 max-w-2xl whitespace-pre-line text-sm leading-6 text-slate-600"
                        >
                            {{ quotation.terms }}
                        </p>
                    </article>
                    <div v-else></div>
                    <dl class="w-full space-y-3 text-sm">
                        <div class="flex justify-between">
                            <dt class="text-slate-500">Subtotal</dt>
                            <dd class="font-bold">
                                {{ money(quotation.subtotal) }}
                            </dd>
                        </div>
                        <div class="flex justify-between">
                            <dt class="text-slate-500">Diskon</dt>
                            <dd class="font-bold">
                                - {{ money(quotation.discount) }}
                            </dd>
                        </div>
                        <div class="flex justify-between">
                            <dt class="text-slate-500">
                                Pajak ({{ Number(quotation.taxPercent) }}%)
                            </dt>
                            <dd class="font-bold">
                                {{ money(quotation.taxAmount) }}
                            </dd>
                        </div>
                        <div
                            class="flex justify-between border-t border-slate-200 pt-4 text-lg"
                        >
                            <dt class="font-black">Total</dt>
                            <dd class="font-black text-pink-600">
                                {{ money(quotation.grandTotal) }}
                            </dd>
                        </div>
                    </dl>
                </div>
            </section>

            <section v-if="quotation.notes" class="grid gap-5 md:grid-cols-2">
                <article
                    v-if="quotation.notes"
                    class="rounded-3xl border border-slate-200 bg-white p-6"
                >
                    <h2 class="font-black">Catatan</h2>
                    <p
                        class="mt-3 whitespace-pre-line text-sm leading-6 text-slate-600"
                    >
                        {{ quotation.notes }}
                    </p>
                </article>
            </section>

            <Teleport to="body">
                <div
                    v-if="showCancelDialog"
                    class="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 p-4"
                    @keydown.esc="showCancelDialog = false"
                >
                    <section
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="cancel-quotation-title"
                        class="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"
                    >
                        <div class="flex items-start gap-3">
                            <div
                                class="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-rose-50 text-rose-600"
                            >
                                <Ban class="h-5 w-5" />
                            </div>
                            <div>
                                <h2
                                    id="cancel-quotation-title"
                                    class="text-lg font-black text-slate-900"
                                >
                                    Batalkan Quotation
                                </h2>
                                <p class="mt-1 text-sm text-slate-500">
                                    Quotation akan dikunci dan tidak dapat
                                    dikirim ke Invoice.
                                </p>
                            </div>
                        </div>

                        <label
                            for="cancellation-reason"
                            class="mt-5 block text-sm font-bold text-slate-700"
                        >
                            Alasan Pembatalan
                            <span class="text-rose-500">*</span>
                        </label>
                        <textarea
                            id="cancellation-reason"
                            v-model="cancelForm.cancellationReason"
                            rows="5"
                            maxlength="2000"
                            autofocus
                            placeholder="Jelaskan alasan quotation dibatalkan..."
                            class="mt-2 w-full resize-y rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-rose-400 focus:ring-4 focus:ring-rose-50"
                        />
                        <p
                            v-if="cancelForm.errors.cancellationReason"
                            class="mt-2 text-sm font-semibold text-rose-600"
                        >
                            {{ cancelForm.errors.cancellationReason }}
                        </p>

                        <div class="mt-6 flex justify-end gap-2">
                            <button
                                type="button"
                                :disabled="cancelForm.processing"
                                class="h-9 rounded-lg border border-slate-200 px-4 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                                @click="showCancelDialog = false"
                            >
                                Kembali
                            </button>
                            <button
                                type="button"
                                :disabled="cancelForm.processing"
                                class="inline-flex h-9 items-center gap-1.5 rounded-lg bg-rose-600 px-4 text-xs font-bold text-white hover:bg-rose-700 disabled:cursor-wait disabled:opacity-60"
                                @click="cancelQuotation"
                            >
                                <Ban class="h-3.5 w-3.5" />
                                {{
                                    cancelForm.processing
                                        ? "Membatalkan..."
                                        : "Batalkan Quotation"
                                }}
                            </button>
                        </div>
                    </section>
                </div>
            </Teleport>
        </main>
    </AppLayout>
</template>
