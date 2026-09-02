<script setup lang="ts">
import { Head, useForm, Link, router, usePage } from "@inertiajs/vue3";
import AppLayout from "@/Layouts/AppLayout.vue";
import { computed, ref, watch } from "vue";
import {
    ClipboardList,
    FilePlus2,
    Plus,
    Trash2,
    UploadCloud,
    Eye,
    X,
    FileText,
} from "@lucide/vue";

const page = usePage();
const currentUser = computed(() => (page.props.auth as any)?.user);
const canManageFee = computed(() => {
    const role = currentUser.value?.role;
    return role === "ADMINISTRATOR" || role === "PIMPINAN";
});
const p = defineProps<{
    job: any | null;
    clients: any[];
    staff: any[];
    flowType?: string;
    founders?: any[];
    attachments?: any[];
    employeeTasks?: any[];
    selectedClientId?: string;
    selectedStaffId?: string;
    sourceInvoiceId?: string;
}>();
const flow = p.job?.jobType || p.flowType || "badan_hukum";
const types: Record<string, string[]> = {
    badan_hukum: [
        "PT / PMA",
        "CV",
        "Koperasi",
        "Yayasan",
        "Perkumpulan",
        "Persekutuan Perdata",
        "Persekutuan Firma",
    ],
    non_badan_hukum: [
        "Akta Sewa Menyewa",
        "Akta Perjanjian Kawin",
        "Akta Pembagian Hak Waris",
        "Akta Surat Keterangan Waris",
        "Akta Kuasa",
        "Akta Pernyataan",
        "Akta Wasiat",
        "Akta PPJB",
        "Perjanjian Kerjasama",
        "Akta Fidusia",
        "SKMHT",
        "Akta Kredit",
        "Akta Perdamaian",
        "Akta Cessie",
        "Akta Subrogasi",
        "Waarmerking",
        "Legalisasi",
        "Legalisir",
        "Dan Lain-Lain",
    ],
    ppat: [
        "Akta Jual Beli",
        "Hibah",
        "Inbreng",
        "APHT",
        "APHB",
        "ROYA",
        "Balik Nama Waris",
        "Pemecahan Sertifikat",
        "Akta Tukar Menukar",
        "Balik nama Lelang",
        "Pengukuran Tanah",
        "Cek Sertifikat / SKPT",
        "Perpanjangan Sertifikat",
        "Konversi Tanah",
        "Permohonan Hak Baru",
        "Dan Lain-Lain",
    ],
};
const affairs: Record<string, string[]> = {
    badan_hukum: ["Pendirian", "Perubahan", "Pembubaran"],
    non_badan_hukum: ["Pembuatan Baru", "Perubahan", "Legalisasi Saja"],
    ppat: ["Sertifikat Hak Milik", "HGB", "Hak Pakai", "Tanah Girik"],
};
const label = computed(() =>
    flow === "badan_hukum"
        ? "Badan Hukum / Usaha"
        : flow === "non_badan_hukum"
          ? "Non Badan Hukum"
          : "PPAT",
);
const initialPicStaffId = p.job?.staffId || p.selectedStaffId || "";
const initialEmployeeTasks = p.employeeTasks?.length
    ? p.employeeTasks.map((task) => ({
          userId: task.userId,
          taskType: task.taskType,
          customTask: task.customTask || "",
          fee: task.fee ? Number(task.fee) : 0,
      }))
    : [];
if (
    initialPicStaffId &&
    !initialEmployeeTasks.some((task) => task.taskType === "PIC")
) {
    initialEmployeeTasks.unshift({
        userId: initialPicStaffId,
        taskType: "PIC",
        customTask: "",
        fee: 0,
    });
}
if (!initialEmployeeTasks.length) {
    initialEmployeeTasks.push({
        userId: "",
        taskType: "",
        customTask: "",
        fee: 0,
    });
}
const f = useForm({
    jobType: flow,
    sourceInvoiceId: p.job?.sourceInvoiceId || p.sourceInvoiceId || null,
    clientId: p.job?.clientId || p.selectedClientId || "",
    staffId: initialPicStaffId,
    jenisPekerjaan: p.job?.type || "",
    pengurusanUntuk: p.job?.pengurusanUntuk || "",
    jenisLainnya: "",
    title: p.job?.title || "",
    type: p.job?.type || "",
    companyName: p.job?.companyName || "",
    status: p.job?.status || "PENDING",
    priority: p.job?.priority || "MEDIUM",
    tanggalMasuk:
        p.job?.createdAt?.slice?.(0, 10) ||
        new Date().toISOString().slice(0, 10),
    deadlineDays: flow === "non_badan_hukum" ? "7" : "14",
    deadline: p.job?.deadline?.slice?.(0, 10) || "",
    notes: p.job?.notes || "",
    description: "",
    founders: p.founders?.length
        ? p.founders.map((x) => ({
              name: x.name,
              position: x.position || "",
              phone: x.phone || "",
              email: x.email || "",
          }))
        : [{ name: "", position: "", phone: "", email: "" }],
    attachments: [] as File[],
    attachmentDescriptions: [] as string[],
    employeeTasks: initialEmployeeTasks,
});
type AttachmentRow = {
    id: number;
    category: string;
    note: string;
    file: File | null;
};
const attachmentCategories = [
    "KTP",
    "Kartu Keluarga",
    "NPWP",
    "Akta / Dokumen Legal",
    "Sertifikat",
    "Surat Kuasa",
    "Bukti Pembayaran",
    "Dokumen Pendukung",
    "Lainnya",
];
const attachmentRows = ref<AttachmentRow[]>([]);
const attachmentError = ref("");
let attachmentSequence = 0;
const addAttachment = () => {
    attachmentRows.value.push({
        id: ++attachmentSequence,
        category: "",
        note: "",
        file: null,
    });
    attachmentError.value = "";
};
const selectAttachmentFile = (row: AttachmentRow, event: Event) => {
    row.file = (event.target as HTMLInputElement).files?.[0] || null;
    attachmentError.value = "";
};
const removeAttachment = (id: number) => {
    attachmentRows.value = attachmentRows.value.filter((row) => row.id !== id);
};
const savedAttachmentParts = (value: any) => {
    const [category = "", ...noteParts] = String(value || "").split(" — ");

    return {
        category: category.trim() || "-",
        note: noteParts.join(" — ").trim() || "-",
    };
};
const addEmployeeTask = () => {
    f.employeeTasks.push({
        userId: "",
        taskType: "",
        customTask: "",
        fee: 0,
    });
};
const removeEmployeeTask = (index: number) => {
    f.employeeTasks.splice(index, 1);
};
const formatNumber = (value: number | string) =>
    new Intl.NumberFormat("id-ID", {
        maximumFractionDigits: 0,
    }).format(Number(value || 0));

const updateFee = (task: { fee: number }, event: Event) => {
    const rawValue = (event.target as HTMLInputElement).value.replace(/\D/g, "");
    task.fee = rawValue ? Number(rawValue) : 0;
};

const selectAmount = (event: FocusEvent) => {
    (event.target as HTMLInputElement).select();
};
watch(
    () =>
        f.employeeTasks.map((task) => ({
            userId: task.userId,
            taskType: task.taskType,
        })),
    () => {
        f.staffId =
            f.employeeTasks.find((task) => task.taskType === "PIC")?.userId ||
            "";
    },
    { deep: true, immediate: true },
);
watch(
    () => [f.jenisPekerjaan, f.pengurusanUntuk, f.jenisLainnya, f.deadlineDays],
    () => {
        if (p.job) return;
        f.type = f.jenisPekerjaan;
        const base =
            f.jenisPekerjaan === "Dan Lain-Lain"
                ? f.jenisLainnya
                : f.jenisPekerjaan;
        f.title = base + (f.pengurusanUntuk ? " - " + f.pengurusanUntuk : "");
        const d = new Date();
        d.setDate(d.getDate() + (Number(f.deadlineDays) || 7));
        f.deadline = d.toISOString().slice(0, 10);
    },
    { immediate: true },
);
const submit = () => {
    if (attachmentRows.value.some((row) => !row.file)) {
        attachmentError.value =
            "File Dokumen Belum Di Upload. Pilih file pada setiap baris lampiran atau hapus baris yang tidak digunakan.";
        return;
    }
    if (
        attachmentRows.value.some(
            (row) => row.category === "Lainnya" && !row.note.trim(),
        )
    ) {
        attachmentError.value =
            'Keterangan wajib diisi untuk jenis berkas "Lainnya".';
        return;
    }
    attachmentError.value = "";
    const completedRows = attachmentRows.value.filter((row) => row.file);
    f.attachments = completedRows.map((row) => row.file as File);
    f.attachmentDescriptions = completedRows.map((row) =>
        row.note.trim() ? `${row.category} — ${row.note.trim()}` : row.category,
    );

    if (p.job) {
        f.transform((data) => ({ ...data, _method: "put" })).post(
            `/dashboard/jobs/${flow}/${p.job.id}`,
            { forceFormData: true },
        );
        return;
    }
    f.post("/dashboard/jobs", { forceFormData: true });
};

const previewFile = ref<any>(null);
const openPreview = (file: any) => {
    previewFile.value = file;
};
const closePreview = () => {
    previewFile.value = null;
};
const previewKind = computed(() => {
    if (!previewFile.value) return "other";
    const path = String(previewFile.value.filePath || "").toLowerCase();
    const type = String(previewFile.value.fileType || "").toLowerCase();
    if (
        path.match(/\.(jpg|jpeg|png|webp|gif|svg)$/) ||
        type.includes("image")
    ) {
        return "image";
    }
    if (path.endsWith(".pdf") || type.includes("pdf")) {
        return "pdf";
    }
    return "other";
});

const deleteSavedAttachment = (id: string) => {
    if (confirm("Apakah Anda yakin ingin menghapus lampiran ini?")) {
        router.delete(`/dashboard/attachments/${id}`, { preserveScroll: true });
    }
};
</script>
<template>
    <Head :title="job ? 'Edit Berkas' : `Registrasi ${label}`" /><AppLayout
        ><div class="mx-auto max-w-5xl">
            <Link
                v-if="!job"
                href="/dashboard/jobs/new"
                class="text-sm font-bold text-pink-600"
                >← Ganti kategori</Link
            >
            <p
                class="mt-4 text-xs font-black uppercase tracking-[.2em] text-pink-600"
            >
                {{ label }}
            </p>
            <h1 class="mt-1 text-3xl font-black">
                {{ job ? "Edit Berkas" : `Registrasi ${label}` }}
            </h1>
            <form
                @submit.prevent="submit"
                class="mt-6 space-y-8 rounded-3xl border bg-white p-6 md:p-9"
            >
                <section>
                    <h2 class="text-lg font-black">Informasi Registrasi</h2>
                    <div class="mt-5 grid gap-5 md:grid-cols-2">
                        <label class="text-sm font-bold"
                            >Tanggal Berkas Masuk<input
                                v-model="f.tanggalMasuk"
                                type="date"
                                class="mt-2 w-full rounded-xl border-slate-200"
                                required /></label
                        ><label class="text-sm font-bold"
                            >Client<select
                                v-model="f.clientId"
                                class="mt-2 w-full rounded-xl border-slate-200"
                                required
                            >
                                <option value="">Pilih client</option>
                                <option v-for="c in clients" :value="c.id">
                                    {{ c.name }}
                                    {{ c.phone ? `— ${c.phone}` : "" }}
                                </option>
                            </select></label>
                    </div>
                </section>
                <section class="border-t pt-7">
                    <h2 class="text-lg font-black">Detail Pekerjaan</h2>
                    <div class="mt-5 grid gap-5 md:grid-cols-2">
                        <label class="text-sm font-bold"
                            >Jenis Pekerjaan<select
                                v-model="f.jenisPekerjaan"
                                class="mt-2 w-full rounded-xl border-slate-200"
                                required
                            >
                                <option value="">Pilih jenis</option>
                                <option v-for="x in types[flow]">
                                    {{ x }}
                                </option>
                            </select></label
                        ><label class="text-sm font-bold"
                            >{{
                                flow === "ppat"
                                    ? "Pengurusan Untuk (Opsional)"
                                    : "Pengurusan Untuk"
                            }}<select
                                v-model="f.pengurusanUntuk"
                                class="mt-2 w-full rounded-xl border-slate-200"
                                :required="!job && flow !== 'ppat'"
                            >
                                <option value="">Pilih pengurusan</option>
                                <option v-for="x in affairs[flow]">
                                    {{ x }}
                                </option>
                            </select></label
                        ><label
                            v-if="f.jenisPekerjaan === 'Dan Lain-Lain'"
                            class="text-sm font-bold md:col-span-2"
                            >Jenis Pekerjaan Lainnya<input
                                v-model="f.jenisLainnya"
                                class="mt-2 w-full rounded-xl border-slate-200"
                                required /></label
                        ><label
                            v-if="flow !== 'ppat'"
                            class="text-sm font-bold md:col-span-2"
                            >{{
                                flow === "badan_hukum"
                                    ? "Nama Badan Hukum"
                                    : "Nama / Judul Pengurusan"
                            }}<input
                                v-model="f.companyName"
                                :placeholder="
                                    flow === 'badan_hukum'
                                        ? 'Contoh: PT. Maju Bersama'
                                        : 'Contoh: Perjanjian Sewa Ruko'
                                "
                                class="mt-2 w-full rounded-xl border-slate-200"
                                required /></label
                        ><label class="text-sm font-bold"
                            >Prioritas<select
                                v-model="f.priority"
                                class="mt-2 w-full rounded-xl border-slate-200"
                            >
                                <option value="LOW">LOW — Santai</option>
                                <option value="MEDIUM">MEDIUM — Normal</option>
                                <option value="HIGH">HIGH — Penting</option>
                                <option value="URGENT">
                                    URGENT — Sangat Mendesak
                                </option>
                            </select></label
                        ><label class="text-sm font-bold"
                            >Target Penyelesaian<input
                                v-model="f.deadlineDays"
                                type="number"
                                min="1"
                                class="mt-2 w-full rounded-xl border-slate-200"
                            /><span class="mt-1 block text-xs text-slate-400"
                                >hari dari sekarang · {{ f.deadline }}</span
                            ></label
                        >
                    </div>
                </section>
                <section v-if="flow !== 'ppat'" class="border-t pt-7">
                    <div class="flex justify-between">
                        <h2 class="text-lg font-black">
                            {{
                                flow === "badan_hukum"
                                    ? "Data Pendiri"
                                    : "Data Pihak Terkait"
                            }}
                        </h2>
                        <button
                            type="button"
                            @click="
                                f.founders.push({
                                    name: '',
                                    position: '',
                                    phone: '',
                                    email: '',
                                })
                            "
                            class="text-sm font-bold text-pink-600"
                        >
                            + Tambah
                        </button>
                    </div>
                    <div
                        v-for="x in f.founders"
                        class="mt-4 grid gap-3 rounded-2xl bg-slate-50 p-4 md:grid-cols-2 xl:grid-cols-4"
                    >
                        <input
                            v-model="x.name"
                            placeholder="Nama lengkap"
                            class="rounded-xl border-slate-200"
                            required
                        /><input
                            v-model="x.position"
                            placeholder="Jabatan"
                            class="rounded-xl border-slate-200"
                        /><input
                            v-model="x.phone"
                            placeholder="No. HP"
                            class="rounded-xl border-slate-200"
                        /><input
                            v-model="x.email"
                            type="email"
                            placeholder="Email"
                            class="rounded-xl border-slate-200"
                        />
                    </div>
                </section>
                <section class="border-t pt-7">
                    <div
                        class="flex flex-col justify-between gap-3 sm:flex-row sm:items-center"
                    >
                        <div class="flex items-center gap-3">
                            <span
                                class="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-violet-50"
                            >
                                <ClipboardList
                                    class="h-5 w-5 text-violet-600"
                                />
                            </span>
                            <div>
                                <h2 class="text-lg font-black">
                                    Data Tugas Karyawan
                                </h2>
                                <p class="mt-1 text-xs text-slate-400">
                                    Pilih nama pegawai dan tugasnya pada berkas
                                    ini.
                                </p>
                            </div>
                        </div>
                        <button
                            type="button"
                            class="inline-flex w-fit items-center gap-2 rounded-xl border border-violet-200 px-4 py-2 text-sm font-black text-violet-600 transition hover:bg-violet-50"
                            @click="addEmployeeTask"
                        >
                            <Plus class="h-4 w-4" />
                            Tambah Tugas
                        </button>
                    </div>

                    <p
                        v-if="p.selectedStaffId"
                        class="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-700"
                    >
                        PIC otomatis diambil dari Invoice sebelumnya dan
                        dimasukkan ke daftar tugas karyawan.
                    </p>
                    <div class="mt-4 space-y-3">
                        <article
                            v-for="(task, index) in f.employeeTasks"
                            :key="index"
                            class="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50/60 p-4"
                            :class="canManageFee ? 'md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto] md:items-end' : 'md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] md:items-end'"
                        >
                            <label class="text-xs font-black text-slate-600">
                                Nama Pegawai
                                <select
                                    v-model="task.userId"
                                    required
                                    class="mt-2 h-11 w-full rounded-xl border-slate-200 bg-white text-sm"
                                >
                                    <option value="">Pilih pegawai</option>
                                    <option
                                        v-for="employee in staff"
                                        :key="employee.id"
                                        :value="employee.id"
                                    >
                                        {{ employee.fullName }}
                                    </option>
                                </select>
                            </label>
                            <label class="text-xs font-black text-slate-600">
                                Tugas Pegawai
                                <select
                                    v-model="task.taskType"
                                    required
                                    class="mt-2 h-11 w-full rounded-xl border-slate-200 bg-white text-sm"
                                >
                                    <option value="">Pilih tugas</option>
                                    <option
                                        v-for="taskType in [
                                            'PIC',
                                            'Saksi',
                                            'NPWP',
                                            'NIB',
                                            'PBB',
                                            'Lainnya',
                                        ]"
                                        :key="taskType"
                                        :value="taskType"
                                    >
                                        {{ taskType }}
                                    </option>
                                </select>
                            </label>
                            <label
                                v-if="canManageFee"
                                class="text-xs font-black text-slate-600"
                            >
                                Fee Pegawai (Rp)
                                <input
                                    :value="formatNumber(task.fee)"
                                    type="text"
                                    placeholder="0"
                                    class="mt-2 h-11 w-full rounded-xl border-slate-200 bg-white text-sm font-semibold"
                                    @input="updateFee(task, $event)"
                                    @focus="selectAmount"
                                />
                            </label>
                            <button
                                type="button"
                                title="Hapus tugas pegawai"
                                class="grid h-11 w-full place-items-center rounded-xl bg-rose-50 text-rose-600 transition hover:bg-rose-100 md:w-11"
                                @click="removeEmployeeTask(index)"
                            >
                                <Trash2 class="h-4 w-4" />
                            </button>
                            <label
                                v-if="task.taskType === 'Lainnya'"
                                class="text-xs font-black text-slate-600"
                                :class="canManageFee ? 'md:col-span-3' : 'md:col-span-2'"
                            >
                                Keterangan Tugas Lainnya
                                <input
                                    v-model="task.customTask"
                                    required
                                    maxlength="255"
                                    placeholder="Tuliskan tugas pegawai"
                                    class="mt-2 h-11 w-full rounded-xl border-slate-200 bg-white text-sm"
                                />
                            </label>
                        </article>
                    </div>
                </section>
                <section class="border-t pt-7">
                    <h2 class="text-lg font-black">Catatan dan Dokumen</h2>
                    <textarea
                        v-model="f.notes"
                        placeholder="Catatan internal…"
                        class="mt-4 w-full rounded-xl border-slate-200"
                    ></textarea>
                    <div class="mt-6">
                        <div v-if="job" class="mb-6">
                            <div
                                class="flex flex-col justify-between gap-2 sm:flex-row sm:items-end"
                            >
                                <div>
                                    <h3 class="text-sm font-black">
                                        Lampiran Tersimpan
                                    </h3>
                                    <p class="mt-1 text-xs text-slate-400">
                                        File berikut sudah tersimpan dan tidak
                                        perlu diunggah ulang.
                                    </p>
                                </div>
                                <span
                                    class="w-fit rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-600"
                                >
                                    {{ p.attachments?.length || 0 }} File
                                </span>
                            </div>
                            <div
                                v-if="p.attachments?.length"
                                class="mt-4 overflow-hidden rounded-2xl border border-slate-200"
                            >
                                <div class="overflow-x-auto">
                                    <table
                                        class="w-full min-w-[720px] text-left text-sm"
                                    >
                                        <thead class="bg-slate-50">
                                            <tr
                                                class="text-[10px] font-black uppercase tracking-wider text-slate-500"
                                            >
                                                <th
                                                    class="w-16 px-4 py-3 text-center"
                                                >
                                                    No.
                                                </th>
                                                <th class="px-4 py-3">
                                                    Nama File
                                                </th>
                                                <th class="px-4 py-3">
                                                    Jenis Berkas
                                                </th>
                                                <th class="px-4 py-3">
                                                    Keterangan Berkas
                                                </th>
                                                <th
                                                    class="w-32 px-4 py-3 text-center"
                                                >
                                                    Aksi
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr
                                                v-for="(
                                                    attachment, index
                                                ) in p.attachments"
                                                :key="attachment.id"
                                                class="border-t border-slate-100"
                                            >
                                                <td
                                                    class="px-4 py-3 text-center font-bold text-slate-400"
                                                >
                                                    {{ index + 1 }}
                                                </td>
                                                <td
                                                    class="px-4 py-3 font-black"
                                                >
                                                    {{
                                                        attachment.fileName ||
                                                        "-"
                                                    }}
                                                </td>
                                                <td class="px-4 py-3">
                                                    <span
                                                        class="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-600"
                                                    >
                                                        {{
                                                            savedAttachmentParts(
                                                                attachment.description,
                                                            ).category
                                                        }}
                                                    </span>
                                                </td>
                                                <td
                                                    class="px-4 py-3 text-slate-600"
                                                >
                                                    {{
                                                        savedAttachmentParts(
                                                            attachment.description,
                                                        ).note
                                                    }}
                                                </td>
                                                <td
                                                    class="px-4 py-3 text-center"
                                                >
                                                    <div class="flex items-center justify-center gap-1.5">
                                                        <button
                                                            type="button"
                                                            title="Lihat berkas"
                                                            class="inline-flex items-center justify-center h-8 w-8 rounded-lg border border-blue-200 bg-blue-50 text-blue-600 transition hover:bg-blue-100"
                                                            @click="openPreview(attachment)"
                                                        >
                                                            <Eye class="h-4 w-4" />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            title="Hapus berkas"
                                                            class="inline-flex items-center justify-center h-8 w-8 rounded-lg border border-rose-200 bg-rose-50 text-rose-600 transition hover:bg-rose-100"
                                                            @click="deleteSavedAttachment(attachment.id)"
                                                        >
                                                            <Trash2 class="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            <div
                                v-else
                                class="mt-4 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/60 px-6 py-8 text-center text-sm font-bold text-slate-400"
                            >
                                Belum ada lampiran tersimpan.
                            </div>
                        </div>

                        <div
                            class="flex flex-col justify-between gap-3 sm:flex-row sm:items-center"
                            :class="{
                                'border-t border-slate-200 pt-6': job,
                            }"
                        >
                            <div>
                                <h3 class="text-sm font-black">
                                    {{
                                        job
                                            ? "Tambah Lampiran Baru"
                                            : "Lampiran Berkas"
                                    }}
                                </h3>
                                <p class="mt-1 text-xs text-slate-400">
                                    Bisa menambahkan beberapa dokumen, maksimal
                                    10 MB per file.
                                </p>
                            </div>
                            <button
                                type="button"
                                @click="addAttachment"
                                class="inline-flex w-fit items-center gap-2 rounded-xl border border-pink-200 px-4 py-2 text-sm font-black text-pink-600 transition hover:bg-pink-50"
                            >
                                <FilePlus2 class="h-4 w-4" />
                                Tambah Lampiran
                            </button>
                        </div>
                        <div v-if="attachmentRows.length" class="mt-4 space-y-3">
                            <article
                                v-for="row in attachmentRows"
                                :key="row.id"
                                class="grid gap-4 rounded-2xl border border-slate-200 bg-slate-50/60 p-4 md:grid-cols-[180px_1fr_auto] md:items-start"
                            >
                                <div>
                                    <label
                                        :for="`attachment-category-${row.id}`"
                                        class="text-xs font-black text-slate-600"
                                        >Jenis Berkas</label
                                    >
                                    <select
                                        :id="`attachment-category-${row.id}`"
                                        v-model="row.category"
                                        required
                                        class="mt-2 h-11 w-full rounded-xl border-slate-200 bg-white text-sm font-bold"
                                    >
                                        <option value="">
                                            Pilih jenis berkas
                                        </option>
                                        <option
                                            v-for="category in attachmentCategories"
                                            :key="category"
                                        >
                                            {{ category }}
                                        </option>
                                    </select>
                                </div>
                                <div>
                                    <label
                                        class="text-xs font-black text-slate-600"
                                        >Keterangan Berkas</label
                                    >
                                    <div
                                        class="mt-2 flex flex-col gap-2 sm:flex-row"
                                    >
                                        <input
                                            v-model="row.note"
                                            placeholder="Contoh: KTP Direktur Utama"
                                            :required="
                                                row.category === 'Lainnya'
                                            "
                                            class="h-11 min-w-0 flex-1 rounded-xl border-slate-200 bg-white text-sm"
                                        />
                                        <label
                                            :for="`attachment-${row.id}`"
                                            class="flex h-11 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl border border-pink-200 bg-white px-4 text-sm font-black text-pink-600 hover:bg-pink-50"
                                        >
                                            <UploadCloud class="h-4 w-4" />
                                            {{
                                                row.file
                                                    ? "Ganti File"
                                                    : "Pilih File"
                                            }}
                                        </label>
                                        <input
                                            :id="`attachment-${row.id}`"
                                            type="file"
                                            class="hidden"
                                            @change="
                                                selectAttachmentFile(
                                                    row,
                                                    $event,
                                                )
                                            "
                                        />
                                    </div>
                                    <p
                                        class="mt-2 truncate text-xs"
                                        :class="
                                            row.file
                                                ? 'font-bold text-emerald-600'
                                                : 'text-slate-400'
                                        "
                                    >
                                        {{
                                            row.file?.name ||
                                            "File Dokumen Belum Di Upload"
                                        }}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    @click="removeAttachment(row.id)"
                                    class="grid h-11 w-full place-items-center rounded-xl bg-rose-50 text-rose-600 md:mt-[29px] md:w-11"
                                    title="Hapus lampiran"
                                >
                                    <Trash2 class="h-4 w-4" />
                                </button>
                            </article>
                        </div>
                        <p
                            v-if="attachmentError"
                            class="mt-3 rounded-xl bg-rose-50 p-3 text-sm font-bold text-rose-600"
                        >
                            {{ attachmentError }}
                        </p>
                    </div>

                    <label v-if="job" class="mt-5 block text-sm font-bold"
                        >Keterangan Perubahan<input
                            v-model="f.description"
                            class="mt-2 w-full rounded-xl border-slate-200"
                    /></label>
                </section>
                <p
                    v-if="Object.keys(f.errors).length"
                    class="rounded-xl bg-red-50 p-4 text-sm font-bold text-red-600"
                >
                    Ada isian yang belum benar. Periksa field wajib.
                </p>
                <div class="flex flex-col gap-3 sm:flex-row">
                    <button
                        :disabled="f.processing"
                        class="flex-1 rounded-xl bg-pink-600 px-6 py-4 font-black text-white disabled:opacity-50"
                    >
                        {{
                            f.processing
                                ? "Menyimpan…"
                                : job
                                  ? "Simpan Perubahan"
                                  : `Registrasikan ${label}`
                        }}
                    </button>
                    <Link
                        v-if="job"
                        :href="route('jobs.show', [flow, job.id])"
                        class="flex items-center justify-center rounded-xl border border-slate-300 bg-white px-6 py-4 font-black text-slate-700 transition hover:bg-slate-50"
                    >
                        Batal Edit
                    </Link>
                </div>
            </form>
        </div></AppLayout
    >
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
                            Jenis file ini tidak dapat ditampilkan langsung di browser. Silakan unduh untuk membukanya.
                        </p>
                    </div>
                </div>

                <footer
                    class="flex justify-end gap-3 border-t border-slate-200 px-5 py-4"
                >
                    <a
                        :href="previewFile.filePath"
                        download
                        class="inline-flex items-center gap-2 rounded-xl bg-[var(--primary)] px-4 py-2 text-sm font-bold text-white shadow-sm hover:opacity-90"
                    >
                        Unduh File
                    </a>
                    <button
                        type="button"
                        class="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100"
                        @click="closePreview"
                    >
                        Tutup
                    </button>
                </footer>
            </section>
        </div>
    </Teleport>
</template>
