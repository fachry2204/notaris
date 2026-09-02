<script setup lang="ts">
import { Head, Link, router, useForm, usePage } from "@inertiajs/vue3";
import {
    ArrowLeft,
    Building2,
    ClipboardList,
    Download,
    Edit3,
    Eye,
    FileText,
    History,
    Mail,
    MapPin,
    MessageCircle,
    Paperclip,
    Phone,
    Printer,
    Receipt,
    Send,
    Trash2,
    User,
    Users,
    X,
} from "@lucide/vue";
import AppLayout from "@/Layouts/AppLayout.vue";
import { computed, onBeforeUnmount, onMounted, ref } from "vue";

const props = defineProps<{
    job: any;
    jobType: string;
    founders: any[];
    attachments: any[];
    employeeTasks: any[];
    progress: any[];
    invoiceHistory: any[];
}>();
const progressForm = useForm({
    status: props.job.status,
    description: "",
});
const notificationForm = useForm({ notification: "" });
const page = usePage<any>();
const previewFile = ref<any | null>(null);
const previewKind = computed<"image" | "pdf" | "unsupported">(() => {
    const file = previewFile.value;
    if (!file) return "unsupported";

    const type = String(file.fileType || "").toLowerCase();
    const path = String(file.filePath || "").toLowerCase();
    if (
        type.startsWith("image/") ||
        /\.(jpe?g|png|gif|webp|bmp|svg)$/.test(path)
    ) {
        return "image";
    }
    if (type === "application/pdf" || path.endsWith(".pdf")) return "pdf";

    return "unsupported";
});
const openPreview = (file: any) => {
    previewFile.value = file;
};
const closePreview = () => {
    previewFile.value = null;
};
const closePreviewOnEscape = (event: KeyboardEvent) => {
    if (event.key === "Escape") closePreview();
};
onMounted(() => window.addEventListener("keydown", closePreviewOnEscape));
onBeforeUnmount(() =>
    window.removeEventListener("keydown", closePreviewOnEscape),
);
const sendNotification = () => {
    if (
        !confirm(
            "Kirim informasi berkas melalui Email dan/atau WhatsApp yang aktif?",
        )
    )
        return;
    notificationForm.post(
        `/dashboard/jobs/${props.jobType}/${props.job.id}/notify`,
        { preserveScroll: true },
    );
};
const remove = () =>
    confirm("Hapus berkas dan seluruh datanya?") &&
    router.delete(`/dashboard/jobs/${props.jobType}/${props.job.id}`);
const date = (value: any) =>
    value
        ? new Date(value).toLocaleDateString("id-ID", {
              day: "numeric",
              month: "long",
              year: "numeric",
          })
        : "-";
const shortDate = (value: any) => {
    if (!value) return "-";
    const parsed = new Date(value);

    return [
        String(parsed.getDate()).padStart(2, "0"),
        String(parsed.getMonth() + 1).padStart(2, "0"),
        parsed.getFullYear(),
    ].join("-");
};
const money = (value: any) =>
    new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0,
    }).format(Number(value) || 0);
const attachmentDescriptionParts = (value: any) => {
    const [category = "", ...noteParts] = String(value || "").split(" — ");

    return {
        category: category.trim() || "-",
        note: noteParts.join(" — ").trim() || "-",
    };
};
const phoneLink = (value: string) =>
    `https://wa.me/${String(value || "")
        .replace(/\D/g, "")
        .replace(/^0/, "62")}`;
const address =
    [
        props.job.clientAddress,
        props.job.clientVillage,
        props.job.clientDistrict,
        props.job.clientCity,
        props.job.clientProvince,
    ]
        .filter(Boolean)
        .join(", ") || "-";
</script>

<template>
    <Head :title="job.trackingCode" />
    <AppLayout>
        <main class="mx-auto max-w-5xl space-y-6">
            <div
                class="flex flex-col justify-between gap-4 lg:flex-row lg:items-start"
            >
                <div>
                    <p class="font-mono text-sm font-black" :style="{ color: 'var(--primary)' }">
                        {{ job.trackingCode }}
                    </p>
                    <h1 class="mt-1 text-2xl sm:text-3xl font-black text-slate-900">{{ job.title }}</h1>
                    <p class="mt-1 text-sm font-medium text-slate-500">
                        {{ job.clientName }} ·
                        {{ job.staffName || "Belum ada PIC" }}
                    </p>
                </div>
                <div class="flex flex-wrap items-center gap-2">
                    <Link
                        href="/dashboard/jobs/inbound"
                        class="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 shadow-sm transition-all hover:bg-slate-50"
                    >
                        <ArrowLeft class="h-4 w-4" />
                        <span>Kembali</span>
                    </Link>
                    <button
                        :disabled="notificationForm.processing"
                        @click="sendNotification"
                        class="inline-flex h-10 items-center gap-2 rounded-xl bg-emerald-600 px-4 text-xs font-bold text-white shadow-sm transition-all hover:bg-emerald-700 disabled:opacity-50"
                    >
                        <Send class="h-4 w-4" />
                        <span>{{
                            notificationForm.processing
                                ? "Mengirim..."
                                : "Kirim Notifikasi"
                        }}</span>
                    </button>
                    <a
                        :href="`/print/tanda-terima/${jobType}/${job.id}`"
                        target="_blank"
                        class="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 shadow-sm transition-all hover:bg-slate-50"
                    >
                        <Printer class="h-4 w-4" />
                        <span>Tanda Terima</span>
                    </a>
                    <Link
                        :href="`/dashboard/jobs/${jobType}/${job.id}/edit`"
                        class="inline-flex h-10 items-center gap-2 rounded-xl px-4 text-xs font-bold text-white shadow-md transition-all hover:opacity-90 active:scale-95"
                        :style="{ backgroundColor: 'var(--primary)' }"
                    >
                        <Edit3 class="h-4 w-4" />
                        <span>Edit</span>
                    </Link>
                    <button
                        @click="remove"
                        class="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 border border-rose-200 text-rose-600 shadow-sm transition-all hover:bg-rose-100"
                        title="Hapus Berkas"
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

            <section class="grid gap-6 lg:grid-cols-3">
                <article
                    class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                >
                    <div class="flex items-center gap-2 border-b pb-4">
                        <User class="h-5 w-5" :style="{ color: 'var(--primary)' }" />
                        <h2 class="font-black text-slate-900">Informasi Client</h2>
                    </div>
                    <dl class="mt-5 space-y-4 text-sm">
                        <div>
                            <dt
                                class="text-[11px] font-bold uppercase tracking-wider text-slate-400"
                            >
                                Nama
                            </dt>
                            <dd class="mt-1 font-black text-slate-900">
                                {{ job.clientName }}
                            </dd>
                        </div>
                        <div class="flex items-center gap-2 text-slate-700 font-medium">
                            <Phone class="h-4 w-4 shrink-0" :style="{ color: 'var(--primary)' }" />
                            <span>{{ job.clientPhone || "-" }}</span>
                            <a
                                v-if="job.clientPhone"
                                :href="phoneLink(job.clientPhone)"
                                target="_blank"
                                class="ml-1 inline-flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200 hover:bg-emerald-600 hover:text-white transition-colors shadow-xs"
                                title="Chat via WhatsApp"
                            >
                                <MessageCircle class="h-3.5 w-3.5" />
                            </a>
                        </div>
                        <div class="flex items-center gap-2 text-slate-700 font-medium">
                            <Mail class="h-4 w-4 shrink-0" :style="{ color: 'var(--primary)' }" />
                            <span>{{ job.clientEmail || "-" }}</span>
                        </div>
                        <div class="flex items-start gap-2 text-slate-700 font-medium">
                            <MapPin
                                class="h-4 w-4 shrink-0 mt-0.5"
                                :style="{ color: 'var(--primary)' }"
                            />
                            <span>{{ address }}</span>
                        </div>
                    </dl>
                </article>
                <article
                    class="rounded-2xl border border-slate-200 bg-white p-6 lg:col-span-2"
                >
                    <div class="flex items-center gap-2 border-b pb-4">
                        <FileText class="h-5 w-5 text-pink-500" />
                        <h2 class="font-black">Detail Pekerjaan</h2>
                    </div>
                    <div class="mt-5 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        <div
                            v-for="item in [
                                { label: 'Status', value: job.status },
                                {
                                    label: 'Kategori',
                                    value: jobType.replaceAll('_', ' '),
                                },
                                { label: 'Jenis Pengurusan', value: job.type },
                                {
                                    label: 'Nama Badan Hukum',
                                    value: job.companyName || '-',
                                },
                                { label: 'Prioritas', value: job.priority },
                                {
                                    label: 'Deadline',
                                    value: date(job.deadline),
                                },
                                {
                                    label: 'Tanggal Berkas Masuk',
                                    value: date(job.createdAt),
                                },
                                {
                                    label: 'Pengurusan Untuk',
                                    value: job.pengurusanUntuk || '-',
                                },
                            ]"
                        >
                            <p
                                class="text-[10px] font-black uppercase tracking-widest text-slate-400"
                            >
                                {{ item.label }}
                            </p>
                            <p class="mt-1 font-bold">{{ item.value }}</p>
                        </div>
                    </div>
                </article>
            </section>

            <section
                v-if="founders.length"
                class="rounded-2xl border border-slate-200 bg-white p-6"
            >
                <div class="flex items-center gap-2">
                    <Users class="h-5 w-5 text-amber-500" />
                    <h2 class="font-black">Pendiri / Rekan</h2>
                </div>
                <div
                    class="mt-4 overflow-hidden rounded-xl border border-slate-200"
                >
                    <div class="overflow-x-auto">
                        <table class="w-full min-w-[760px] text-left text-sm">
                            <thead class="bg-slate-50">
                                <tr
                                    class="text-[10px] font-black uppercase tracking-wider text-slate-500"
                                >
                                    <th class="w-16 px-4 py-3 text-center">
                                        No.
                                    </th>
                                    <th class="px-4 py-3">Nama</th>
                                    <th class="px-4 py-3">Jabatan</th>
                                    <th class="px-4 py-3">Nomor HP</th>
                                    <th class="px-4 py-3">Email</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr
                                    v-for="(founder, index) in founders"
                                    :key="founder.id"
                                    class="border-t border-slate-100"
                                >
                                    <td
                                        class="px-4 py-3 text-center font-bold text-slate-400"
                                    >
                                        {{ index + 1 }}
                                    </td>
                                    <td class="px-4 py-3 font-black">
                                        {{ founder.name || "-" }}
                                    </td>
                                    <td class="px-4 py-3">
                                        <span
                                            v-if="founder.position"
                                            class="rounded-full bg-pink-50 px-3 py-1 text-xs font-bold text-pink-600"
                                        >
                                            {{ founder.position }}
                                        </span>
                                        <span v-else>-</span>
                                    </td>
                                    <td class="px-4 py-3 text-slate-600">
                                        {{ founder.phone || "-" }}
                                    </td>
                                    <td class="px-4 py-3 text-slate-600">
                                        {{ founder.email || "-" }}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>

            <section
                class="rounded-2xl border border-slate-200 bg-white p-6"
                aria-label="Lampiran berkas"
            >
                <div class="flex items-center gap-2">
                    <Paperclip class="h-5 w-5 text-blue-500" />
                    <h2 class="font-black">
                        Lampiran ({{ attachments.length }})
                    </h2>
                </div>
                <div
                    class="mt-4 overflow-hidden rounded-xl border border-slate-200"
                >
                    <div class="overflow-x-auto">
                        <table class="w-full min-w-[720px] text-left text-sm">
                            <thead class="bg-slate-50">
                                <tr
                                    class="text-[10px] font-black uppercase tracking-wider text-slate-500"
                                >
                                    <th class="w-16 px-4 py-3 text-center">
                                        No.
                                    </th>
                                    <th class="px-4 py-3">Nama File</th>
                                    <th class="px-4 py-3">Jenis Berkas</th>
                                    <th class="px-4 py-3">Keterangan Berkas</th>
                                    <th class="w-28 px-4 py-3 text-center">
                                        Aksi
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr
                                    v-for="(file, index) in attachments"
                                    :key="file.id"
                                    class="border-t border-slate-100"
                                >
                                    <td
                                        class="px-4 py-3 text-center font-bold text-slate-400"
                                    >
                                        {{ index + 1 }}
                                    </td>
                                    <td class="px-4 py-3 font-black">
                                        {{ file.fileName || "-" }}
                                    </td>
                                    <td class="px-4 py-3">
                                        <span
                                            class="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-600"
                                        >
                                            {{
                                                attachmentDescriptionParts(
                                                    file.description,
                                                ).category
                                            }}
                                        </span>
                                    </td>
                                    <td class="px-4 py-3 text-slate-600">
                                        {{
                                            attachmentDescriptionParts(
                                                file.description,
                                            ).note
                                        }}
                                    </td>
                                    <td class="px-4 py-3 text-center">
                                        <button
                                            type="button"
                                            class="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 px-3 py-1.5 text-xs font-black text-blue-600 transition hover:bg-blue-50"
                                            @click="openPreview(file)"
                                        >
                                            <Eye class="h-3.5 w-3.5" />
                                            Lihat
                                        </button>
                                    </td>
                                </tr>
                                <tr v-if="!attachments.length">
                                    <td
                                        colspan="5"
                                        class="px-4 py-8 text-center text-sm text-slate-400"
                                    >
                                        Tidak ada lampiran.
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>

            <section
                class="rounded-2xl border border-slate-200 bg-white p-6"
                aria-label="Tugas karyawan dan catatan berkas"
            >
                <div class="flex items-center gap-2">
                    <ClipboardList class="h-5 w-5 text-violet-500" />
                    <h2 class="font-black">Tugas Karyawan</h2>
                </div>
                <div
                    class="mt-4 overflow-hidden rounded-xl border border-slate-200"
                >
                    <div class="overflow-x-auto">
                        <table class="w-full min-w-[720px] text-left text-sm">
                            <thead class="bg-slate-50">
                                <tr
                                    class="text-[10px] font-black uppercase tracking-wider text-slate-500"
                                >
                                    <th class="w-16 px-4 py-3 text-center">
                                        No.
                                    </th>
                                    <th class="px-4 py-3">Nama Pegawai</th>
                                    <th class="px-4 py-3">Tugas Pegawai</th>
                                    <th class="px-4 py-3">Fee Pegawai</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr
                                    v-for="(task, index) in employeeTasks"
                                    :key="task.id"
                                    class="border-t border-slate-100"
                                >
                                    <td
                                        class="px-4 py-3 text-center font-bold text-slate-400"
                                    >
                                        {{ index + 1 }}
                                    </td>
                                    <td class="px-4 py-3">
                                        <p class="font-black">
                                            {{ task.employeeName || "-" }}
                                        </p>
                                        <p
                                            v-if="task.employeeRole"
                                            class="mt-0.5 text-xs text-slate-400"
                                        >
                                            {{ task.employeeRole }}
                                        </p>
                                    </td>
                                    <td class="px-4 py-3">
                                        <span
                                            class="inline-flex rounded-full bg-violet-50 px-3 py-1 text-xs font-black text-violet-600 border border-violet-200/60"
                                        >
                                            {{ task.taskType || "-" }}
                                        </span>
                                        <p
                                            v-if="task.customTask"
                                            class="mt-1 text-xs font-bold text-slate-800"
                                        >
                                            {{ task.customTask }}
                                        </p>
                                    </td>
                                    <td class="px-4 py-3 font-semibold text-slate-700">
                                        {{ Number(task.fee || 0) > 0 ? money(task.fee) : "Rp 0" }}
                                    </td>
                                </tr>
                                <tr v-if="!employeeTasks.length">
                                    <td
                                        colspan="4"
                                        class="px-4 py-8 text-center text-sm font-bold text-slate-400"
                                    >
                                        Belum ada tugas karyawan.
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <div class="mt-6 border-t border-slate-200 pt-5">
                    <p
                        class="text-[10px] font-black uppercase tracking-widest text-slate-400"
                    >
                        Catatan
                    </p>
                    <p class="mt-2 rounded-xl bg-slate-50 p-4 text-sm">
                        {{ job.notes || "-" }}
                    </p>
                </div>
            </section>

            <section class="grid gap-6 lg:grid-cols-2">
                <article
                    class="rounded-2xl border border-slate-200 bg-white p-6 lg:col-span-2"
                >
                    <div
                        class="flex flex-col justify-between gap-3 sm:flex-row sm:items-center"
                    >
                        <div class="flex items-center gap-2">
                            <Receipt class="h-5 w-5 text-pink-500" />
                            <div>
                                <h2 class="font-black">
                                    Histori Invoice & Pembayaran
                                </h2>
                                <p class="text-xs text-slate-500">
                                    Invoice yang pernah diterbitkan untuk berkas
                                    ini.
                                </p>
                            </div>
                        </div>
                        <span
                            class="w-fit rounded-full bg-pink-50 px-3 py-1 text-xs font-black text-pink-600"
                        >
                            {{ invoiceHistory.length }} Invoice
                        </span>
                    </div>

                    <div
                        v-if="!invoiceHistory.length"
                        class="mt-5 rounded-2xl border-2 border-dashed border-slate-200 px-6 py-10 text-center"
                    >
                        <Receipt class="mx-auto h-9 w-9 text-slate-300" />
                        <p class="mt-3 text-sm font-bold text-slate-500">
                            Belum ada invoice yang terhubung dengan berkas ini.
                        </p>
                    </div>
                    <div v-else class="mt-5 space-y-4">
                        <article
                            v-for="invoice in invoiceHistory"
                            :key="invoice.id"
                            class="rounded-2xl border border-slate-200 p-4 md:p-5"
                        >
                            <div
                                class="flex flex-col justify-between gap-3 sm:flex-row sm:items-start"
                            >
                                <div>
                                    <Link
                                        :href="`/dashboard/invoice/${invoice.id}`"
                                        class="font-mono font-black text-pink-600 hover:underline"
                                    >
                                        {{ invoice.invoiceNumber }}
                                    </Link>
                                    <p class="mt-1 text-xs text-slate-500">
                                        Tanggal {{ shortDate(invoice.date) }} ·
                                        Jatuh tempo
                                        {{ shortDate(invoice.dueDate) }}
                                    </p>
                                </div>
                                <span
                                    class="w-fit rounded-full px-3 py-1 text-xs font-black"
                                    :class="
                                        invoice.status === 'Lunas'
                                            ? 'bg-emerald-50 text-emerald-600'
                                            : invoice.status === 'DP Bayar'
                                              ? 'bg-blue-50 text-blue-600'
                                              : 'bg-amber-50 text-amber-600'
                                    "
                                >
                                    {{ invoice.status }}
                                </span>
                            </div>

                            <div
                                class="mt-4 grid gap-3 rounded-xl bg-slate-50 p-4 sm:grid-cols-3"
                            >
                                <div>
                                    <p
                                        class="text-[10px] font-black uppercase tracking-wider text-slate-400"
                                    >
                                        Total Invoice
                                    </p>
                                    <p class="mt-1 font-black">
                                        {{ money(invoice.amount) }}
                                    </p>
                                </div>
                                <div>
                                    <p
                                        class="text-[10px] font-black uppercase tracking-wider text-slate-400"
                                    >
                                        Sudah Dibayar
                                    </p>
                                    <p class="mt-1 font-black text-emerald-600">
                                        {{ money(invoice.paidAmount) }}
                                    </p>
                                </div>
                                <div>
                                    <p
                                        class="text-[10px] font-black uppercase tracking-wider text-slate-400"
                                    >
                                        Sisa Tagihan
                                    </p>
                                    <p class="mt-1 font-black text-rose-600">
                                        {{ money(invoice.remainingAmount) }}
                                    </p>
                                </div>
                            </div>

                            <div class="mt-4">
                                <p
                                    class="text-xs font-black uppercase tracking-wider text-slate-500"
                                >
                                    Riwayat Pembayaran
                                </p>
                                <div
                                    v-if="invoice.payments.length"
                                    class="mt-2 divide-y divide-slate-100 rounded-xl border border-slate-100"
                                >
                                    <div
                                        v-for="payment in invoice.payments"
                                        :key="payment.id"
                                        class="flex flex-col justify-between gap-1 px-3 py-2.5 text-sm sm:flex-row sm:items-center"
                                    >
                                        <div>
                                            <p class="font-bold">
                                                {{
                                                    payment.description ||
                                                    "Pembayaran Invoice"
                                                }}
                                            </p>
                                            <p class="text-xs text-slate-400">
                                                {{ shortDate(payment.date) }}
                                            </p>
                                        </div>
                                        <p class="font-black text-emerald-600">
                                            {{ money(payment.amount) }}
                                        </p>
                                    </div>
                                </div>
                                <p v-else class="mt-2 text-sm text-slate-400">
                                    Belum ada pembayaran.
                                </p>
                            </div>

                            <div class="mt-4 flex justify-end">
                                <Link
                                    :href="`/dashboard/invoice/${invoice.id}`"
                                    class="rounded-xl border border-pink-200 px-4 py-2 text-xs font-black text-pink-600 hover:bg-pink-50"
                                >
                                    Lihat Detail Invoice
                                </Link>
                            </div>
                        </article>
                    </div>
                </article>
            </section>

            <section
                class="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.65fr)]"
                aria-label="Aktivitas dan pembaruan status berkas"
            >
                <article
                    class="rounded-2xl border border-slate-200 bg-white p-6"
                >
                    <div class="flex items-center gap-2">
                        <History class="h-5 w-5 text-pink-500" />
                        <h2 class="font-black">Aktivitas Berkas</h2>
                    </div>
                    <div
                        class="mt-5 max-h-[620px] space-y-3 overflow-y-auto pr-2"
                    >
                        <div
                            v-for="item in progress"
                            :key="item.id"
                            class="rounded-xl bg-slate-50 p-4 border border-slate-100 shadow-2xs"
                        >
                            <div class="flex items-center justify-between gap-2">
                                <span class="text-xs font-black uppercase tracking-wider text-[var(--primary)] bg-[color-mix(in_srgb,var(--primary)_10%,white)] px-2.5 py-0.5 rounded-full border border-[var(--primary)]/20">
                                    <template v-if="item.statusBefore && item.statusBefore !== item.statusAfter && item.statusBefore !== 'BARU'">
                                        {{ item.statusBefore }} → {{ item.statusAfter }}
                                    </template>
                                    <template v-else>
                                        {{ item.statusAfter || 'UPDATE' }}
                                    </template>
                                </span>
                                <span class="text-[11px] font-semibold text-slate-400">
                                    {{ date(item.createdAt) }}
                                </span>
                            </div>
                            <p class="mt-2 text-sm font-semibold text-slate-700">
                                {{ item.description }}
                            </p>
                        </div>
                        <p
                            v-if="!progress.length"
                            class="py-6 text-center text-sm text-slate-400"
                        >
                            Belum ada riwayat progress.
                        </p>
                    </div>
                </article>

                <form
                    @submit.prevent="
                        progressForm.put(
                            `/dashboard/jobs/${jobType}/${job.id}/progress`,
                            {
                                onSuccess: () =>
                                    progressForm.reset('description'),
                            },
                        )
                    "
                    class="rounded-2xl border border-slate-200 bg-white p-6 lg:sticky lg:top-24"
                >
                    <div class="flex items-center gap-2">
                        <History class="h-5 w-5 text-emerald-500" />
                        <h2 class="font-black">Update Status Berkas</h2>
                    </div>
                    <label class="mt-4 block text-xs font-bold text-slate-500"
                        >Status Berkas</label
                    ><select
                        v-model="progressForm.status"
                        class="mt-2 w-full rounded-xl border-slate-200"
                    >
                        <option
                            v-for="status in [
                                'PENDING',
                                'PROSES',
                                'REVISI',
                                'REVISI_PROSES',
                                'VERIFIKASI',
                                'SELESAI',
                                'CANCELLED',
                            ]"
                        >
                            {{ status }}
                        </option></select
                    ><textarea
                        v-model="progressForm.description"
                        rows="2"
                        placeholder="Keterangan progress"
                        class="mt-4 w-full rounded-xl border-slate-200"
                    /><button
                        :disabled="progressForm.processing"
                        class="mt-4 w-full rounded-xl bg-emerald-600 p-3 font-bold text-white"
                    >
                        Simpan Progress
                    </button>
                </form>
            </section>
        </main>

        <Teleport to="body">
            <div
                v-if="previewFile"
                role="dialog"
                aria-modal="true"
                aria-label="Preview lampiran"
                class="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm"
                @click.self="closePreview"
            >
                <section
                    class="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
                >
                    <header
                        class="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4"
                    >
                        <div class="min-w-0">
                            <h2 class="truncate font-black text-slate-900">
                                {{ previewFile.fileName }}
                            </h2>
                            <p
                                v-if="previewFile.description"
                                class="mt-1 truncate text-sm text-slate-500"
                            >
                                {{ previewFile.description }}
                            </p>
                        </div>
                        <button
                            type="button"
                            aria-label="Tutup preview"
                            class="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-600 transition hover:bg-slate-200"
                            @click="closePreview"
                        >
                            <X class="h-5 w-5" />
                        </button>
                    </header>

                    <div
                        class="min-h-0 flex-1 overflow-auto bg-slate-100 p-4 md:p-6"
                    >
                        <img
                            v-if="previewKind === 'image'"
                            :src="previewFile.filePath"
                            :alt="previewFile.fileName"
                            class="mx-auto max-h-[68vh] max-w-full rounded-xl bg-white object-contain shadow"
                        />
                        <iframe
                            v-else-if="previewKind === 'pdf'"
                            :src="previewFile.filePath"
                            :title="previewFile.fileName"
                            class="h-[68vh] w-full rounded-xl border-0 bg-white"
                        />
                        <div
                            v-else
                            class="mx-auto flex min-h-72 max-w-xl flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-white p-8 text-center"
                        >
                            <FileText class="h-12 w-12 text-slate-300" />
                            <h3 class="mt-4 font-black text-slate-800">
                                Preview tidak tersedia
                            </h3>
                            <p class="mt-2 text-sm text-slate-500">
                                Jenis file ini tidak dapat ditampilkan langsung
                                di browser. Silakan unduh untuk membukanya.
                            </p>
                        </div>
                    </div>

                    <footer
                        class="flex justify-end gap-3 border-t border-slate-200 px-5 py-4"
                    >
                        <button
                            type="button"
                            class="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-black text-slate-700 hover:bg-slate-50"
                            @click="closePreview"
                        >
                            Tutup
                        </button>
                        <a
                            :href="previewFile.filePath"
                            :download="previewFile.fileName"
                            class="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-black text-white hover:bg-blue-700"
                        >
                            <Download class="h-4 w-4" />
                            Unduh File
                        </a>
                    </footer>
                </section>
            </div>
        </Teleport>
    </AppLayout>
</template>
