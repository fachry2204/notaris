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
    Plus,
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
    trackingShareUrl: string;
    founders: any[];
    attachments: any[];
    employeeTasks: any[];
    progress: any[];
    invoiceHistory: any[];
    uploadedReceipts: Array<{ id: number; fileName: string; documentDate: string; receiver: string; submitter: string; uploadedBy: string | null; url: string }>;
    signedDeed: { signed_date: string; deed_number: string | null; notes: string | null; photos: any[] } | null;
    availableInvoices: Array<{ id: string; invoiceNumber: string; clientName?: string | null; amount: number | string; status: string }>;
}>();
const progressForm = useForm({
    status: props.job.status,
    description: "",
    photos: [] as File[],
});
const notificationForm = useForm({ notification: "" });
const trackingCopied = ref(false);
const copyTrackingLink = async () => {
    try { await navigator.clipboard.writeText(props.trackingShareUrl); trackingCopied.value = true; window.setTimeout(() => { trackingCopied.value = false; }, 3000); }
    catch { window.prompt('Salin tautan cek berkas:', props.trackingShareUrl); }
};
const receiptDialog = ref(false);
const receiptMode = ref<'choose' | 'upload'>('choose');
const receiptForm = useForm({ file: null as File | null, document_date: '', receiver: '', submitter: '' });
const saveReceipt = () => receiptForm.post(`/dashboard/jobs/${props.jobType}/${props.job.id}/receipts`, {
    forceFormData: true, preserveScroll: true,
    onSuccess: () => { receiptDialog.value = false; receiptMode.value = 'choose'; receiptForm.reset(); },
});
const progressDialog = ref(false);
const deedDialog = ref(false);
const deedInput = ref<HTMLInputElement | null>(null);
const deedError = ref('');
const deedForm = useForm({ signed_date: '', deed_number: '', notes: '', photos: [] as File[] });
const openDeed = () => { deedForm.signed_date = props.signedDeed?.signed_date || ''; deedForm.deed_number = props.signedDeed?.deed_number || ''; deedForm.notes = props.signedDeed?.notes || ''; deedForm.photos = []; deedForm.clearErrors(); deedError.value = ''; deedDialog.value = true; };
const addDeedPhotos = (event: Event) => {
    const input = event.target as HTMLInputElement; const files = Array.from(input.files || []); input.value = ''; deedError.value = '';
    if ((props.signedDeed?.photos.length || 0) + deedForm.photos.length + files.length > 10) { deedError.value = 'Maksimal 10 foto per akta.'; return; }
    if (files.some(file => !['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024)) { deedError.value = 'Gunakan JPG, PNG, atau WebP maksimal 5 MB per foto.'; return; }
    deedForm.photos.push(...files);
};
const saveDeed = () => deedForm.post(`/dashboard/jobs/${props.jobType}/${props.job.id}/signed-deed`, { forceFormData: true, preserveScroll: true, onSuccess: () => { deedDialog.value = false; deedForm.reset(); } });
const progressFilter = ref('');
const filteredProgress = computed(() => props.progress.filter((item) => !progressFilter.value || item.statusAfter === progressFilter.value));
const progressPhotoInput = ref<HTMLInputElement | null>(null);
const progressPhotoError = ref('');
const addProgressPhotos = (event: Event) => {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files || []);
    input.value = '';
    progressPhotoError.value = '';
    if (progressForm.photos.length + files.length > 10) { progressPhotoError.value = 'Maksimal 10 foto.'; return; }
    if (files.some((file) => !['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024)) { progressPhotoError.value = 'Gunakan JPG, PNG, atau WebP maksimal 5 MB per foto.'; return; }
    progressForm.photos.push(...files);
};
const openProgressDialog = () => { progressForm.status = props.job.status; progressForm.reset('description', 'photos'); progressPhotoError.value = ''; progressForm.clearErrors(); progressDialog.value = true; };
const saveProgress = () => progressForm.transform((data) => ({ ...data, _method: 'put' })).post(`/dashboard/jobs/${props.jobType}/${props.job.id}/progress`, {
    forceFormData: true, preserveScroll: true,
    onSuccess: () => { progressForm.reset('description', 'photos'); progressDialog.value = false; },
});
const showInvoicePicker = ref(false);
const invoiceSearch = ref("");
const invoiceForm = useForm({ invoiceId: "" });
const filteredInvoices = computed(() => {
    const query = invoiceSearch.value.trim().toLocaleLowerCase();
    return props.availableInvoices.filter((invoice) =>
        `${invoice.invoiceNumber} ${invoice.clientName || ""}`.toLocaleLowerCase().includes(query),
    );
});
const attachInvoice = () => {
    invoiceForm.post(`/dashboard/jobs/${props.jobType}/${props.job.id}/invoice`, {
        preserveScroll: true,
        onSuccess: () => { showInvoicePicker.value = false; invoiceForm.reset(); },
    });
};
const page = usePage<any>();
const canManageFee = computed(() =>
    ["ADMINISTRATOR", "PIMPINAN"].includes(
        String(page.props.auth?.user?.role || "").toUpperCase(),
    ),
);
const physicalAttachments = computed(() =>
    props.attachments.filter((attachment) =>
        Number(attachment.isPhysicalDeposited) === 1,
    ),
);
const feeModalOpen = ref(false);
const feeForm = useForm({
    employeeTasks: [] as Array<{ id: string; fee: number }>,
});
const openFeeEditor = () => {
    feeForm.clearErrors();
    feeForm.employeeTasks = props.employeeTasks.map((task) => ({
        id: task.id,
        fee: Number(task.fee || 0),
    }));
    feeModalOpen.value = true;
};
const closeFeeEditor = () => {
    if (!feeForm.processing) feeModalOpen.value = false;
};
const formatFeeInput = (value: number) =>
    new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(
        Number(value || 0),
    );
const updateFeeInput = (index: number, event: Event) => {
    const rawValue = (event.target as HTMLInputElement).value.replace(/\D/g, "");
    feeForm.employeeTasks[index].fee = rawValue ? Number(rawValue) : 0;
};
const saveEmployeeFees = () => {
    feeForm.patch(`/dashboard/jobs/${props.jobType}/${props.job.id}/fees`, {
        preserveScroll: true,
        onSuccess: () => closeFeeEditor(),
    });
};
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
const previewReceipt = (receipt: { url: string; fileName: string }) => {
    const isPdf = receipt.fileName.toLowerCase().endsWith('.pdf');
    receiptDialog.value = false;
    openPreview({ fileName: receipt.fileName, filePath: receipt.url, fileType: isPdf ? 'application/pdf' : 'image/jpeg', description: 'Tanda terima dibuat manual dan diunggah.' });
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
const activityDate = (value: any) => {
    const match = String(value || '').match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/);
    return match ? `${match[3]}-${match[2]}-${match[1]} ${match[4]}:${match[5]}` : date(value);
};
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
                        aria-label="Kembali" title="Kembali"
                        class="job-action group relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50"
                    >
                        <ArrowLeft class="h-4 w-4" />
                        <span class="job-action-tooltip">Kembali</span>
                    </Link>
                    <button
                        :disabled="notificationForm.processing"
                        @click="sendNotification"
                        aria-label="Kirim notifikasi" title="Kirim notifikasi"
                        class="job-action group relative inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50"
                    >
                        <Send class="h-4 w-4" />
                        <span class="job-action-tooltip">{{ notificationForm.processing ? "Mengirim..." : "Kirim notifikasi" }}</span>
                    </button>
                    <button
                        type="button"
                        @click="receiptMode = 'choose'; receiptDialog = true"
                        aria-label="Tanda terima" title="Tanda terima"
                        class="job-action group relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50"
                    >
                        <Printer class="h-4 w-4" />
                        <span class="job-action-tooltip">Tanda terima</span>
                    </button>
                    <button type="button" @click="copyTrackingLink" :aria-label="trackingCopied ? 'Tautan disalin' : 'Salin tautan cek berkas'" title="Salin tautan cek berkas" class="job-action relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-teal-300 bg-teal-50 text-teal-700"><FileText class="h-4 w-4" /><span class="job-action-tooltip">{{ trackingCopied ? 'Tautan disalin' : 'Salin tautan cek berkas' }}</span></button>
                    <button type="button" @click="openProgressDialog" aria-label="Update status berkas" title="Update status berkas" class="job-action group relative inline-flex h-10 w-10 items-center justify-center rounded-xl bg-blue-700 text-white hover:bg-blue-800"><History class="h-4 w-4" /><span class="job-action-tooltip">Update status berkas</span></button>
                    <button type="button" @click="openDeed" :aria-label="signedDeed ? 'Edit tanda tangan akta' : 'Tanda tangan akta'" :title="signedDeed ? 'Edit tanda tangan akta' : 'Tanda tangan akta'" class="job-action relative inline-flex h-10 w-10 items-center justify-center rounded-xl bg-amber-600 text-white hover:bg-amber-700"><FileText class="h-4 w-4" /><span class="job-action-tooltip">{{ signedDeed ? 'Edit tanda tangan akta' : 'Tanda tangan akta' }}</span></button>
                    <Link
                        :href="`/dashboard/jobs/${jobType}/${job.id}/edit`"
                        aria-label="Edit berkas" title="Edit berkas"
                        class="job-action group relative inline-flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-md hover:opacity-90"
                        :style="{ backgroundColor: 'var(--primary)' }"
                    >
                        <Edit3 class="h-4 w-4" />
                        <span class="job-action-tooltip">Edit berkas</span>
                    </Link>
                    <button
                        @click="remove"
                        aria-label="Hapus berkas"
                        class="job-action group relative inline-flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 border border-rose-200 text-rose-600 shadow-sm transition-all hover:bg-rose-100"
                        title="Hapus Berkas"
                    >
                        <Trash2 class="h-4 w-4" />
                        <span class="job-action-tooltip">Hapus berkas</span>
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

            <section class="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm"><div class="flex flex-wrap items-center justify-between gap-2"><div><p class="font-bold">{{ signedDeed ? 'Akta sudah ditandatangani' : 'Akta belum ditandatangani' }}</p><p v-if="signedDeed" class="mt-1 text-slate-600">Tanggal: {{ signedDeed.signed_date }} · Nomor akta: {{ signedDeed.deed_number || 'Belum diisi' }}</p></div><button type="button" @click="openDeed" class="font-bold text-teal-700 underline">{{ signedDeed ? 'Lihat / edit' : 'Catat tanda tangan' }}</button></div></section>
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
                        <table class="w-full min-w-[900px] text-left text-sm">
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
                                    <th class="w-36 px-4 py-3 text-center">
                                        Fisik Dititipkan
                                    </th>
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
                                        <span
                                            class="inline-flex rounded-full px-3 py-1 text-xs font-black"
                                            :class="
                                                Number(file.isPhysicalDeposited) === 1
                                                    ? 'bg-emerald-50 text-emerald-700'
                                                    : 'bg-slate-100 text-slate-500'
                                            "
                                        >
                                            {{
                                                Number(file.isPhysicalDeposited) === 1
                                                    ? "Ya"
                                                    : "Tidak"
                                            }}
                                        </span>
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
                                        colspan="6"
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
                <div class="flex flex-wrap items-center justify-between gap-3">
                    <div class="flex items-center gap-2">
                        <ClipboardList class="h-5 w-5 text-violet-500" />
                        <h2 class="font-black">Tugas Karyawan</h2>
                    </div>
                    <button
                        v-if="canManageFee && employeeTasks.length"
                        type="button"
                        class="inline-flex h-9 items-center gap-2 rounded-xl bg-[var(--primary)] px-4 text-xs font-black text-white shadow-sm transition hover:opacity-90"
                        @click="openFeeEditor"
                    >
                        <Edit3 class="h-4 w-4" />
                        Edit Fee
                    </button>
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
                                    <th v-if="canManageFee" class="px-4 py-3">Fee Pegawai</th>
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
                                    <td v-if="canManageFee" class="px-4 py-3 font-semibold text-slate-700">
                                        {{ task.fee == null ? "—" : Number(task.fee) > 0 ? money(task.fee) : "Rp 0" }}
                                    </td>
                                </tr>
                                <tr v-if="!employeeTasks.length">
                                    <td
                                        :colspan="canManageFee ? 4 : 3"
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
                        <div class="flex flex-wrap items-center gap-2">
                            <span class="w-fit rounded-full bg-pink-50 px-3 py-1 text-xs font-black text-pink-600">
                                {{ invoiceHistory.length }} Invoice
                            </span>
                            <template v-if="!invoiceHistory.length">
                                <Link
                                    :href="`/dashboard/invoice/new?job=${encodeURIComponent(job.id)}&type=${encodeURIComponent(jobType)}`"
                                    class="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-pink-600 px-4 text-xs font-black text-white transition hover:bg-pink-700"
                                >
                                    <Plus class="h-4 w-4" /> Tambah Invoice
                                </Link>
                                <button type="button" @click="showInvoicePicker = !showInvoicePicker; invoiceForm.clearErrors()" :aria-expanded="showInvoicePicker" aria-controls="invoice-picker" class="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 transition hover:bg-slate-50">
                                    {{ showInvoicePicker ? 'Tutup Daftar Invoice' : 'Pilih Invoice yang Ada' }}
                                </button>
                            </template>
                        </div>
                    </div>

                    <form v-if="showInvoicePicker && !invoiceHistory.length" id="invoice-picker" @submit.prevent="attachInvoice" class="mt-5 space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <div><h3 class="text-sm font-black">Pilih invoice</h3><p class="mt-1 text-xs text-slate-500">Cari nomor invoice atau nama client. Invoice yang sudah terhubung tetap tersedia.</p></div>
                        <label class="block text-xs font-bold text-slate-600">Cari invoice<input v-model="invoiceSearch" type="search" placeholder="Nomor invoice atau nama client" class="mt-1 block h-11 w-full rounded-xl border-slate-200 bg-white text-sm" /></label>
                        <label class="block text-xs font-bold text-slate-600">Invoice<select v-model="invoiceForm.invoiceId" required class="mt-1 block h-11 w-full rounded-xl border-slate-200 bg-white text-sm"><option value="">Pilih invoice</option><option v-for="invoice in filteredInvoices" :key="invoice.id" :value="invoice.id">{{ invoice.invoiceNumber }} · {{ invoice.clientName || 'Client belum ditentukan' }} · {{ invoice.status }} · {{ money(invoice.amount) }}</option></select></label>
                        <p v-if="!filteredInvoices.length" class="text-xs text-slate-500">Tidak ada invoice yang sesuai.</p>
                        <p v-if="invoiceForm.errors.invoiceId" role="alert" class="text-xs font-bold text-red-600">{{ invoiceForm.errors.invoiceId }}</p>
                        <div class="flex flex-wrap gap-2"><button type="submit" :disabled="invoiceForm.processing || !invoiceForm.invoiceId" class="h-10 rounded-xl bg-pink-600 px-4 text-xs font-black text-white disabled:opacity-50">{{ invoiceForm.processing ? 'Menyimpan...' : 'Hubungkan Invoice' }}</button><button type="button" @click="showInvoicePicker = false; invoiceForm.clearErrors()" class="h-10 rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700">Batal</button></div>
                    </form>

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
                            v-for="(invoice, index) in invoiceHistory"
                            :key="invoice.id"
                            class="relative ml-3 border-l-2 border-slate-200 pl-6 last:border-transparent"
                        >
                            <span class="absolute -left-[7px] top-5 h-3 w-3 rounded-full border-2 border-white" :class="index === 0 ? 'bg-orange-500 ring-2 ring-orange-300' : 'bg-slate-300'" />
                            <div class="rounded-2xl border border-slate-100 p-4 md:p-5" :class="index === 0 ? 'bg-orange-50' : 'bg-white'">
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
                            </div>
                        </article>
                    </div>
                </article>
            </section>

            <section
                class="grid items-start gap-6"
                aria-label="Aktivitas dan pembaruan status berkas"
            >
                <article
                    class="rounded-2xl border border-slate-200 bg-white p-6"
                >
                    <div class="flex flex-wrap items-center justify-between gap-3">
                        <div class="flex items-center gap-2"><History class="h-5 w-5 text-amber-700" /><h2 class="font-black">Detail Riwayat Aktivitas</h2></div>
                        <select v-model="progressFilter" aria-label="Filter aktivitas berdasarkan status" class="rounded-xl border-slate-200 text-xs font-semibold"><option value="">Semua Aktivitas</option><option v-for="status in ['PENDING','PROSES','REVISI','REVISI_PROSES','VERIFIKASI','SELESAI','CANCELLED']" :key="status" :value="status">{{ status }}</option></select>
                    </div>
                    <div
                        class="mt-5 max-h-[620px] space-y-3 overflow-y-auto pr-2"
                    >
                        <div
                            v-for="(item, index) in filteredProgress"
                            :key="item.id"
                            class="relative ml-3 border-l-2 border-slate-200 pl-7 pb-2 last:border-transparent"
                        >
                            <span class="absolute -left-[7px] top-5 h-3 w-3 rounded-full border-2 border-white" :class="index === 0 ? 'bg-orange-500 ring-2 ring-orange-300' : 'bg-slate-300'" />
                            <div class="flex flex-wrap items-start gap-3 rounded-xl p-3" :class="index === 0 ? 'bg-orange-50' : 'border-b border-slate-100'">
                                <span class="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-orange-200 bg-white text-orange-600"><History class="h-5 w-5" /></span>
                                <div class="min-w-0 flex-1"><p class="whitespace-pre-line break-words text-sm font-bold text-slate-800">{{ item.description || 'Pembaruan berkas' }}</p>
                                <p class="mt-1 text-xs text-slate-500">{{ activityDate(item.createdAt) }}</p>
                                <div v-if="item.photos?.length" class="mt-3 flex flex-wrap gap-2"><button v-for="photo in item.photos" :key="photo.id" type="button" @click="openPreview(photo)" :aria-label="`Lihat ${photo.fileName}`" class="overflow-hidden rounded-lg border focus:ring-2 focus:ring-teal-600"><img :src="photo.filePath" :alt="photo.fileName" loading="lazy" class="h-20 w-20 object-cover" /></button></div></div>
                                <span class="rounded-full border border-amber-200 bg-amber-100 px-3 py-1 text-xs font-bold text-amber-900">
                                    <template v-if="item.statusBefore && item.statusBefore !== item.statusAfter && item.statusBefore !== 'BARU'">
                                        {{ item.statusBefore }} → {{ item.statusAfter }}
                                    </template>
                                    <template v-else>
                                        {{ item.statusAfter || 'UPDATE' }}
                                    </template>
                                </span>
                            </div>
                        </div>
                        <p
                            v-if="!filteredProgress.length"
                            class="py-6 text-center text-sm text-slate-400"
                        >
                            Belum ada riwayat progress.
                        </p>
                    </div>
                </article>

            </section>
            <section v-if="uploadedReceipts.length" class="rounded-3xl border border-slate-200 bg-white p-6">
                <h2 class="text-lg font-black">Tanda Terima yang Diunggah</h2>
                <div v-for="receipt in uploadedReceipts" :key="receipt.id" class="mt-3 rounded-xl bg-slate-50 p-4 text-sm">
                    <button type="button" @click="previewReceipt(receipt)" class="break-all text-left font-bold text-teal-700 underline">{{ receipt.fileName }} · Lihat</button>
                    <p class="mt-1 text-slate-600">Tanggal dokumen: {{ receipt.documentDate }} · Penerima: {{ receipt.receiver }} · Penyerah: {{ receipt.submitter }}</p>
                    <p v-if="receipt.uploadedBy" class="mt-1 text-xs text-slate-500">Diunggah oleh {{ receipt.uploadedBy }}</p>
                </div>
            </section>
        </main>
        <Teleport to="body">
            <div v-if="deedDialog" role="dialog" aria-modal="true" aria-label="Tanda tangan akta" class="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4" @click.self="!deedForm.processing && (deedDialog = false)">
                <form @submit.prevent="saveDeed" class="max-h-[90vh] w-full max-w-lg space-y-4 overflow-auto rounded-2xl bg-white p-6 shadow-xl">
                    <div class="flex items-center justify-between"><h2 class="text-lg font-black">{{ signedDeed ? 'Edit Tanda Tangan Akta' : 'Tanda Tangan Akta' }}</h2><button type="button" @click="deedDialog = false" aria-label="Tutup"><X class="h-5 w-5" /></button></div>
                    <label class="block text-sm font-bold">Tanggal ditandatangani<input v-model="deedForm.signed_date" required type="date" class="mt-1 w-full rounded-xl border-slate-200" /><span v-if="deedForm.errors.signed_date" class="text-xs text-red-600">{{ deedForm.errors.signed_date }}</span></label>
                    <label class="block text-sm font-bold">Nomor akta (opsional)<input v-model="deedForm.deed_number" maxlength="191" class="mt-1 w-full rounded-xl border-slate-200" /><span v-if="deedForm.errors.deed_number" class="text-xs text-red-600">{{ deedForm.errors.deed_number }}</span></label>
                    <label class="block text-sm font-bold">Keterangan (opsional)<textarea v-model="deedForm.notes" maxlength="5000" rows="3" class="mt-1 w-full rounded-xl border-slate-200"></textarea></label>
                    <div class="text-sm font-bold">Foto akta (opsional)
                        <div v-if="signedDeed?.photos.length" class="mt-2 flex flex-wrap gap-2"><button v-for="photo in signedDeed.photos" :key="photo.id" type="button" @click="deedDialog = false; openPreview(photo)" :aria-label="`Lihat ${photo.fileName}`" class="overflow-hidden rounded-lg border"><img :src="photo.filePath" :alt="photo.fileName" class="h-16 w-16 object-cover" /></button></div>
                        <input ref="deedInput" type="file" accept="image/jpeg,image/png,image/webp" multiple class="sr-only" tabindex="-1" @change="addDeedPhotos" />
                        <button type="button" @click="deedInput?.click()" class="mt-2 inline-flex items-center gap-2 rounded-xl border border-teal-600 px-3 py-2 text-teal-700"><Plus class="h-4 w-4" /> Tambah foto</button>
                        <p class="mt-1 text-xs font-normal text-slate-500">Maksimal 10 foto, JPG/PNG/WebP hingga 5 MB per foto.</p>
                        <div v-for="(file, i) in deedForm.photos" :key="i" class="mt-1 flex justify-between gap-2 rounded bg-slate-50 p-2 text-xs"><span class="break-all">{{ file.name }}</span><button type="button" @click="deedForm.photos.splice(i, 1)" :aria-label="`Hapus ${file.name}`"><Trash2 class="h-4 w-4 text-rose-600" /></button></div>
                        <p v-if="deedError || deedForm.errors.photos" class="mt-1 text-xs text-red-600">{{ deedError || deedForm.errors.photos }}</p>
                        <p v-for="(message, field) in deedForm.errors" :key="field" class="text-xs text-red-600">{{ String(field).startsWith('photos.') ? message : '' }}</p>
                    </div>
                    <button :disabled="deedForm.processing" class="w-full rounded-xl bg-teal-700 p-3 font-bold text-white disabled:opacity-50">{{ deedForm.processing ? 'Menyimpan...' : 'Simpan Tanda Tangan' }}</button>
                </form>
            </div>
        </Teleport>
        <Teleport to="body">
            <div v-if="progressDialog" role="dialog" aria-modal="true" aria-label="Update Status Berkas" class="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4" @click.self="!progressForm.processing && (progressDialog = false)">
                <form @submit.prevent="saveProgress" class="max-h-[90vh] w-full max-w-lg overflow-auto rounded-2xl bg-white p-6 shadow-xl">
                    <div class="flex items-center justify-between"><h2 class="text-lg font-black">Update Status Berkas</h2><button type="button" @click="progressDialog = false" :disabled="progressForm.processing" aria-label="Tutup"><X class="h-5 w-5" /></button></div>
                    <label class="mt-5 block text-sm font-bold">Status Berkas<select v-model="progressForm.status" required class="mt-2 w-full rounded-xl border-slate-200"><option v-for="option in [{value:'PENDING',label:'Menunggu Diproses'},{value:'PROSES',label:'Sedang Diproses'},{value:'REVISI',label:'Revisi'},{value:'REVISI_PROSES',label:'Revisi Diproses'},{value:'VERIFIKASI',label:'Verifikasi'},{value:'SELESAI',label:'Selesai'},{value:'CANCELLED',label:'Dibatalkan'}]" :key="option.value" :value="option.value">{{ option.label }}</option></select><span v-if="progressForm.errors.status" class="text-xs text-red-600">{{ progressForm.errors.status }}</span></label>
                    <label class="mt-4 block text-sm font-bold">Keterangan progres<textarea v-model="progressForm.description" required maxlength="1000" rows="4" placeholder="Jelaskan perkembangan berkas" class="mt-2 w-full rounded-xl border-slate-200"></textarea><span class="mt-1 block text-xs font-normal text-slate-500">Keterangan ini dapat dilihat pada halaman cek status berkas.</span><span v-if="progressForm.errors.description" class="text-xs text-red-600">{{ progressForm.errors.description }}</span></label>
                    <div class="mt-4 text-sm font-bold">Foto progres (opsional)
                        <input ref="progressPhotoInput" type="file" accept="image/jpeg,image/png,image/webp" multiple class="sr-only" tabindex="-1" @change="addProgressPhotos" />
                        <button type="button" :disabled="progressForm.photos.length >= 10" @click="progressPhotoInput?.click()" class="mt-2 inline-flex items-center gap-2 rounded-xl border border-teal-600 px-4 py-2 text-teal-700 disabled:opacity-50"><Plus class="h-4 w-4" /> Tambah foto</button>
                        <p class="mt-1 text-xs font-normal text-slate-500">Maksimal 10 foto JPG, PNG, atau WebP; masing-masing 5 MB. Foto hanya terlihat oleh pengguna yang login.</p>
                        <ul class="mt-2 space-y-1"><li v-for="(photo, index) in progressForm.photos" :key="index" class="flex items-center justify-between gap-2 rounded bg-slate-50 p-2 text-xs font-normal"><span class="break-all">{{ photo.name }}</span><button type="button" @click="progressForm.photos.splice(index, 1); progressPhotoError = ''" :aria-label="`Hapus ${photo.name}`" class="text-rose-600"><Trash2 class="h-4 w-4" /></button></li></ul>
                        <p v-if="progressPhotoError || progressForm.errors.photos" class="mt-1 text-xs text-red-600">{{ progressPhotoError || progressForm.errors.photos }}</p>
                        <p v-for="(message, field) in progressForm.errors" :key="field" class="text-xs text-red-600">{{ String(field).startsWith('photos.') ? message : '' }}</p>
                    </div>
                    <button :disabled="progressForm.processing" class="mt-5 w-full rounded-xl bg-emerald-700 p-3 font-bold text-white disabled:opacity-50">{{ progressForm.processing ? 'Menyimpan...' : 'Simpan Progres' }}</button>
                </form>
            </div>
        </Teleport>
        <Teleport to="body">
            <div v-if="receiptDialog" class="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4" role="dialog" aria-modal="true" aria-label="Tanda terima" @click.self="receiptDialog = false">
                <div class="max-h-[90vh] w-full max-w-lg overflow-auto rounded-2xl bg-white p-6 shadow-xl">
                    <div class="flex items-center justify-between"><h2 class="text-lg font-black">Tanda Terima</h2><button type="button" aria-label="Tutup" @click="receiptDialog = false"><X class="h-5 w-5" /></button></div>
                    <div v-if="receiptMode === 'choose'" class="mt-5 space-y-3">
                        <div v-if="uploadedReceipts.length" class="rounded-xl border border-teal-200 bg-teal-50 p-4 text-sm">
                            <p class="font-bold text-teal-800">Tanda terima sudah dibuat manual dan diunggah.</p>
                            <div v-for="receipt in uploadedReceipts" :key="receipt.id" class="mt-3 border-t border-teal-200 pt-3">
                                <p class="break-all font-semibold">{{ receipt.fileName }}</p>
                                <p class="mt-1 text-xs text-slate-600">Tanggal: {{ receipt.documentDate }} · Penerima: {{ receipt.receiver }} · Penyerah: {{ receipt.submitter }}</p>
                                <button type="button" @click="previewReceipt(receipt)" class="mt-2 font-bold text-teal-700 underline">Lihat tanda terima</button>
                            </div>
                        </div>
                        <a v-if="physicalAttachments.length" :href="`/print/tanda-terima/${jobType}/${job.id}`" target="_blank" rel="noopener noreferrer" class="block rounded-xl border p-4 font-bold text-teal-700">Print tanda terima</a>
                        <p v-else class="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">Print tersedia setelah ada berkas fisik yang dititipkan.</p>
                        <button type="button" @click="receiptMode = 'upload'" class="w-full rounded-xl border p-4 text-left font-bold text-teal-700">Upload tanda terima</button>
                    </div>
                    <form v-else @submit.prevent="saveReceipt" class="mt-5 space-y-4 text-sm">
                        <label class="block font-bold">Dokumen atau gambar <input type="file" required accept="application/pdf,image/jpeg,image/png,image/webp" @change="receiptForm.file = ($event.target as HTMLInputElement).files?.[0] || null" class="mt-2 block w-full text-sm" /><span class="mt-1 block text-xs font-normal text-slate-500">PDF, JPG, PNG, atau WebP, maksimal 10 MB.</span><span v-if="receiptForm.errors.file" class="text-rose-600">{{ receiptForm.errors.file }}</span></label>
                        <label class="block font-bold">Tanggal dokumen<input v-model="receiptForm.document_date" type="date" required class="mt-1 w-full rounded-xl border-slate-200" /><span v-if="receiptForm.errors.document_date" class="text-rose-600">{{ receiptForm.errors.document_date }}</span></label>
                        <label class="block font-bold">Yang menerima<input v-model="receiptForm.receiver" required maxlength="191" class="mt-1 w-full rounded-xl border-slate-200" /><span v-if="receiptForm.errors.receiver" class="text-rose-600">{{ receiptForm.errors.receiver }}</span></label>
                        <label class="block font-bold">Yang menyerahkan<input v-model="receiptForm.submitter" required maxlength="191" class="mt-1 w-full rounded-xl border-slate-200" /><span v-if="receiptForm.errors.submitter" class="text-rose-600">{{ receiptForm.errors.submitter }}</span></label>
                        <div class="flex gap-3"><button type="button" @click="receiptMode = 'choose'" class="rounded-xl border px-4 py-2 font-bold">Kembali</button><button :disabled="receiptForm.processing" class="rounded-xl bg-teal-700 px-4 py-2 font-bold text-white disabled:opacity-50">{{ receiptForm.processing ? 'Mengunggah...' : 'Simpan tanda terima' }}</button></div>
                    </form>
                </div>
            </div>
        </Teleport>

        <Teleport to="body">
            <div
                v-if="feeModalOpen"
                role="dialog"
                aria-modal="true"
                aria-label="Edit fee pegawai"
                class="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm"
                @click.self="closeFeeEditor"
            >
                <form
                    class="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
                    @submit.prevent="saveEmployeeFees"
                >
                    <header class="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
                        <div>
                            <h2 class="font-black text-slate-900">Edit Fee Pegawai</h2>
                            <p class="mt-1 text-sm text-slate-500">
                                Atur nominal fee untuk setiap tugas pada berkas ini.
                            </p>
                        </div>
                        <button
                            type="button"
                            aria-label="Tutup edit fee"
                            class="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200"
                            @click="closeFeeEditor"
                        >
                            <X class="h-4 w-4" />
                        </button>
                    </header>

                    <div class="min-h-0 flex-1 space-y-3 overflow-y-auto p-5">
                        <div
                            v-for="(task, index) in employeeTasks"
                            :key="task.id"
                            class="grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-[minmax(0,1fr)_220px] sm:items-center"
                        >
                            <div>
                                <p class="font-black text-slate-900">{{ task.employeeName || "Pegawai" }}</p>
                                <p class="mt-1 text-xs font-bold text-slate-500">
                                    {{ task.taskType }}<span v-if="task.customTask"> · {{ task.customTask }}</span>
                                </p>
                                <p v-if="task.isPaid" class="mt-1 text-[11px] font-bold text-emerald-600">
                                    Sudah terbayar — catatan pengeluaran akan ikut disesuaikan.
                                </p>
                            </div>
                            <label class="text-xs font-black text-slate-600">
                                Fee (Rp)
                                <input
                                    :value="formatFeeInput(feeForm.employeeTasks[index]?.fee || 0)"
                                    type="text"
                                    inputmode="numeric"
                                    class="mt-1.5 h-11 w-full rounded-xl border-slate-200 bg-white text-right text-sm font-black"
                                    @input="updateFeeInput(index, $event)"
                                    @focus="($event.target as HTMLInputElement).select()"
                                />
                            </label>
                        </div>
                        <p v-if="feeForm.errors.employeeTasks" class="text-sm font-bold text-rose-600">
                            {{ feeForm.errors.employeeTasks }}
                        </p>
                    </div>

                    <footer class="flex flex-col-reverse gap-2 border-t border-slate-200 bg-slate-50 px-5 py-4 sm:flex-row sm:justify-end">
                        <button
                            type="button"
                            class="h-10 rounded-xl border border-slate-300 px-5 text-sm font-black text-slate-700 hover:bg-white"
                            @click="closeFeeEditor"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            :disabled="feeForm.processing"
                            class="h-10 rounded-xl bg-[var(--primary)] px-5 text-sm font-black text-white shadow-sm disabled:opacity-50"
                        >
                            {{ feeForm.processing ? "Menyimpan..." : "Simpan Fee" }}
                        </button>
                    </footer>
                </form>
            </div>
        </Teleport>

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

<style scoped>
.job-action-tooltip {
    position: absolute;
    top: calc(100% + 6px);
    left: 50%;
    transform: translateX(-50%);
    z-index: 30;
    pointer-events: none;
    white-space: nowrap;
    border-radius: 0.4rem;
    background: #1e293b;
    color: white;
    padding: 0.35rem 0.5rem;
    font-size: 0.7rem;
    font-weight: 600;
    opacity: 0;
    visibility: hidden;
}
.job-action:hover .job-action-tooltip,
.job-action:focus .job-action-tooltip,
.job-action:focus-visible .job-action-tooltip {
    opacity: 1;
    visibility: visible;
}
</style>
