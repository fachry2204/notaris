<script setup lang="ts">
import { computed } from "vue";
import { Head } from "@inertiajs/vue3";

const props = defineProps<{
    job: any;
    jobType?: string;
    attachments?: any[];
    settings?: any;
}>();

const notarisName = computed(
    () => props.settings?.officeName || "SALFA NOVIA ROZA, S.H., M.Kn",
);
const notarisRole = computed(
    () => props.settings?.officeTitle || "Notaris, PPAT, NPAK, Notaris Pasar Modal Jakarta Selatan",
);
const notarisSk = computed(
    () =>
        props.settings?.officeSk ||
        "SK. MENTERI HUKUM DAN HAK ASASI MANUSIA RI NOMOR : AHU-00081.AH.02.02. TAHUN 2024 TANGGAL 30 Oktober 2024",
);
const officeAddress = computed(
    () =>
        props.settings?.officeAddress ||
        "Jl. KH. Ahmad Dahlan Kebayoran No. 10 , RT 001, RW 001, Kramat Pela, Kec. Kebayoran Baru, Kota Jakarta Selatan, Daerah Khusus Ibukota Jakarta 12130",
);
const officePhone = computed(
    () => props.settings?.officePhone || "0822-4114-5758",
);
const officeEmail = computed(
    () => props.settings?.officeEmail || "kantornotarissnr@gmail.com",
);

const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    const formatted = new Intl.DateTimeFormat("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Asia/Jakarta",
    }).format(d);
    return `${formatted} WIB`;
};

const categoryLabel = computed(() => {
    switch (props.jobType) {
        case "badan_hukum":
            return "Badan Hukum / Usaha";
        case "non_badan_hukum":
            return "Non Badan Hukum";
        case "ppat":
            return "PPAT";
        default:
            return "Umum";
    }
});

const printedAtDate = computed(() => {
    const formatted = new Intl.DateTimeFormat("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Asia/Jakarta",
    }).format(new Date());
    return `${formatted} WIB`;
});

const formatDateOnly = (dateStr: string) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "Asia/Jakarta",
    }).format(d);
};

const parseAttachment = (att: any) => {
    const rawDesc = att.description || "";
    if (rawDesc.includes(" — ")) {
        const parts = rawDesc.split(" — ");
        return {
            category: parts[0] || "-",
            note: parts.slice(1).join(" — ") || att.fileName || "-",
        };
    } else if (rawDesc.includes(" - ")) {
        const parts = rawDesc.split(" - ");
        return {
            category: parts[0] || "-",
            note: parts.slice(1).join(" - ") || att.fileName || "-",
        };
    }
    return {
        category: rawDesc || "-",
        note: att.fileName || "-",
    };
};
</script>

<template>
    <Head title="Tanda Terima Berkas" />
    <div class="min-h-screen bg-slate-100 p-4 sm:p-8 print:bg-white print:p-0">
        <main class="mx-auto max-w-4xl bg-white p-8 sm:p-12 shadow-sm rounded-xl print:shadow-none print:rounded-none">
            <!-- KOP SURAT NOTARIS -->
            <div class="border-b-4 border-double border-slate-900 pb-4 text-center space-y-0.5 font-serif text-slate-900 leading-tight">
                <h1 class="text-xl sm:text-2xl font-bold uppercase tracking-wide">
                    {{ notarisName }}
                </h1>
                <p class="text-sm font-bold pt-0.5">
                    {{ notarisRole }}
                </p>
                <p class="text-[11px] font-bold tracking-tight uppercase pt-0.5 max-w-2xl mx-auto">
                    SK. MENTERI HUKUM DAN HAK ASASI MANUSIA RI NOMOR : AHU-00081.AH.02.02.
                </p>
                <p class="text-[11px] font-bold tracking-tight uppercase max-w-2xl mx-auto">
                    TAHUN 2024 TANGGAL 30 Oktober 2024
                </p>
                <p class="text-xs pt-1">
                    Jl. KH. Ahmad Dahlan Kebayoran No. 10 , RT 001, RW 001, Kramat Pela, Kec. Kebayoran Baru
                </p>
                <p class="text-xs">
                   Kota Jakarta Selatan, Daerah Khusus Ibukota Jakarta 12130
                </p>
                <p class="text-xs font-medium pt-0.5">
                    Telp. {{ officePhone }} Email : {{ officeEmail }}
                </p>
                <p class="text-xs font-medium text-blue-800 underline">
                    
                </p>
            </div>

            <!-- JUDUL DOKUMEN -->
            <div class="mt-6 text-center">
                <h2 class="text-lg font-black uppercase tracking-wider text-slate-900 font-serif underline decoration-2 underline-offset-4">
                    TANDA TERIMA BERKAS DARI CLIENT
                </h2>
                <p class="mt-1 text-xs font-mono font-bold text-slate-600">
                    Nomor Berkas: <span class="text-slate-900 bg-slate-100 px-2 py-0.5 rounded">{{ job.trackingCode }}</span>
                </p>
            </div>

            <!-- STATEMENT PENYERAHAN -->
            <div class="mt-6 rounded-xl border border-slate-200 bg-slate-50/60 p-4 text-xs leading-relaxed space-y-2 text-slate-800">
                <p class="font-medium">
                    Telah diterima dokumen dan berkas persyaratan dari:
                </p>
                <div class="grid grid-cols-1 sm:grid-cols-[140px_1fr] gap-x-2 gap-y-1 pl-3 font-semibold">
                    <span class="text-slate-500">Nama Client</span>
                    <span class="text-slate-900 font-bold">: {{ job.clientName || '-' }}</span>

                    <span class="text-slate-500">Nomor Telepon</span>
                    <span>: {{ job.clientPhone || '-' }}</span>

                    <span class="text-slate-500">Alamat Client</span>
                    <span>: {{ job.clientAddress || '-' }}</span>
                </div>
                <div class="pt-2 border-t border-slate-200/80 font-medium">
                    Kepada Notaris <strong class="text-slate-900">{{ notarisName }}</strong> untuk pengurusan berkas:
                    <span class="font-bold text-slate-900 font-serif underline ml-1">
                        {{ job.pengurusanUntuk ? job.pengurusanUntuk + ' ' : '' }}{{ job.type || job.title }} ({{ job.companyName || job.title }})
                    </span>
                </div>
            </div>

            <!-- TABEL DOKUMEN / BERKAS YANG DIUPLOAD -->
            <div class="mt-6 space-y-2">
                <h3 class="text-xs font-black uppercase tracking-wider text-slate-700 border-b pb-1">
                    Daftar Dokumen / Lampiran Persyaratan yang Diserahkan
                </h3>
                <div class="overflow-hidden rounded-xl border border-slate-200">
                    <table class="w-full text-left text-xs">
                        <thead class="bg-slate-100/80 border-b border-slate-200">
                            <tr class="font-bold uppercase text-[10px] text-slate-600">
                                <th class="w-10 px-3 py-2 text-center">No.</th>
                                <th class="px-3 py-2">Keterangan Berkas</th>
                                <th class="px-3 py-2">Kategori Berkas</th>
                                <th class="px-3 py-2">Tanggal Upload</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-100">
                            <tr v-if="!attachments?.length">
                                <td colspan="4" class="px-3 py-6 text-center text-slate-400 font-medium">
                                    Belum ada dokumen lampiran yang diupload/diserahkan.
                                </td>
                            </tr>
                            <tr v-for="(att, idx) in attachments" :key="att.id" class="hover:bg-slate-50">
                                <td class="px-3 py-2 text-center font-bold text-slate-400">
                                    {{ idx + 1 }}
                                </td>
                                <td class="px-3 py-2 font-bold text-slate-800">
                                    {{ parseAttachment(att).note }}
                                </td>
                                <td class="px-3 py-2 text-slate-600 font-medium">
                                    {{ parseAttachment(att).category }}
                                </td>
                                <td class="px-3 py-2 text-slate-500 font-medium whitespace-nowrap">
                                    {{ formatDateOnly(att.createdAt) }}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- TANDA TANGAN -->
            <div class="mt-12 grid grid-cols-2 gap-12 text-center text-xs font-medium">
                <div>
                    <p class="font-bold text-slate-700">Penerima,</p>
                    <p class="text-[10px] text-slate-400">Petugas Kantor Notaris</p>
                    <div class="h-20"></div>
                    <p class="border-t border-slate-300 pt-1 font-bold text-slate-900">
                        {{ job.picName || 'Petugas Kantor' }}
                    </p>
                </div>
                <div>
                    <p class="font-bold text-slate-700">Penyerah,</p>
                    <p class="text-[10px] text-slate-400">Client / Pemohon</p>
                    <div class="h-20"></div>
                    <p class="border-t border-slate-300 pt-1 font-bold text-slate-900">
                        {{ job.clientName || 'Client' }}
                    </p>
                </div>
            </div>

            <!-- FOOTER SYSTEM INFORMASI NOTARIS -->
            <div class="mt-10 pt-3 border-t border-slate-300 flex flex-wrap items-center justify-between text-[10px] text-slate-500 font-serif gap-2">
                <span>Tanggal Cetak : {{ printedAtDate }}</span>
                <span>Di cetak melalui System Informasi Notaris {{ notarisName }}</span>
            </div>

            <!-- FLOATING PRINT BUTTON -->
            <button
                onclick="window.print()"
                class="fixed bottom-6 right-6 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 font-bold text-white shadow-xl transition hover:bg-slate-800 active:scale-95 print:hidden cursor-pointer"
            >
                <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/>
                </svg>
                <span>Cetak Tanda Terima</span>
            </button>
        </main>
    </div>
</template>

<style>
@media print {
    @page {
        size: A4 portrait;
        margin: 12mm 15mm;
    }
    body {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
        background-color: white !important;
    }
}
</style>
