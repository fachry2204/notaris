<script setup lang="ts">
import { computed, ref } from "vue";
import { Head, Link, useForm } from "@inertiajs/vue3";
import {
    ArrowLeft,
    FileCheck2,
    Plus,
    Receipt,
    Save,
    Trash2,
    User,
} from "@lucide/vue";
import AppLayout from "@/Layouts/AppLayout.vue";

const props = defineProps<{
    invoice: any | null;
    jobId: string;
    jobType: string;
    job: any | null;
    jobs: any[];
    sourceQuotation?: any | null;
    quotationItems?: any[];
    invoiceItems?: any[];
}>();

const sourceItems = props.invoice
    ? props.invoiceItems || []
    : props.quotationItems || [];

const selected = ref(
    props.jobType && props.jobId ? `${props.jobType}|${props.jobId}` : "",
);
const form = useForm({
    quotationId:
        props.invoice?.quotationId || props.sourceQuotation?.id || null,
    jobId: props.jobId || "",
    jobType: props.jobType || "",
    dpAmount: 0,
    status: props.invoice?.status || "Belum Bayar",
    description:
        props.invoice?.description || props.sourceQuotation?.terms || "",
    date:
        props.invoice?.date?.slice(0, 10) ||
        new Date().toISOString().slice(0, 10),
    dueDate:
        props.invoice?.dueDate?.slice(0, 10) ||
        props.sourceQuotation?.validUntil?.slice(0, 10) ||
        "",
    items: sourceItems.length
        ? sourceItems.map((item) => ({
              description: item.description,
              quantity: Number(item.quantity),
              unit: item.unit,
              unitPrice: Number(item.unitPrice),
          }))
        : [{ description: "", quantity: 1, unit: "item", unitPrice: 0 }],
});
const addItem = () =>
    form.items.push({
        description: "",
        quantity: 1,
        unit: "item",
        unitPrice: 0,
    });
const removeItem = (index: number) => {
    if (form.items.length > 1) form.items.splice(index, 1);
};
const total = computed(() =>
    form.items.reduce(
        (sum, item) =>
            sum + Number(item.quantity || 0) * Number(item.unitPrice || 0),
        0,
    ),
);
const remainingPayment = computed(() =>
    Math.max(0, total.value - Number(form.dpAmount || 0)),
);
const dpAmountDisplay = computed({
    get: () =>
        new Intl.NumberFormat("id-ID", {
            maximumFractionDigits: 0,
        }).format(Number(form.dpAmount || 0)),
    set: (value: string) => {
        const digits = value.replace(/\D/g, "");
        form.dpAmount = digits ? Number(digits) : 0;
    },
});
const selectAmount = (event: FocusEvent) => {
    (event.target as HTMLInputElement).select();
};
const formatNumber = (value: number | string) =>
    new Intl.NumberFormat("id-ID", {
        maximumFractionDigits: 0,
    }).format(Number(value || 0));
const updateUnitPrice = (item: { unitPrice: number }, event: Event) => {
    const value = (event.target as HTMLInputElement).value.replace(/\D/g, "");
    item.unitPrice = value ? Number(value) : 0;
};
const selectedJob = computed(
    () =>
        props.job ||
        props.jobs.find(
            (item) => `${item.jobType}|${item.id}` === selected.value,
        ),
);
const sourceClient = computed(() => props.sourceQuotation || selectedJob.value);
const choose = () => {
    const [type, id] = selected.value.split("|");
    form.jobType = type || "";
    form.jobId = id || "";
};
const save = () =>
    props.invoice
        ? form.put(`/dashboard/invoice/${props.invoice.id}`)
        : form.post("/dashboard/invoice");
const money = (value: any) =>
    new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0,
    }).format(Number(value || 0));
const backUrl = computed(() => {
    if (props.invoice) return `/dashboard/invoice/${props.invoice.id}`;
    if (props.sourceQuotation)
        return `/dashboard/quotation/${props.sourceQuotation.id}`;
    if (props.job) return `/dashboard/jobs/${props.jobType}/${props.jobId}`;
    return "/dashboard/invoice";
});
</script>

<template>
    <Head :title="invoice ? 'Edit Invoice' : 'Buat Invoice Baru'" />
    <AppLayout>
        <main class="mx-auto max-w-6xl space-y-6 p-4">
            <div class="flex items-center gap-4">
                <Link
                    :href="backUrl"
                    class="grid h-11 w-11 place-items-center rounded-full hover:bg-pink-50"
                >
                    <ArrowLeft />
                </Link>
                <div>
                    <h1 class="text-2xl font-black">
                        {{ invoice ? "Edit Invoice" : "Buat Invoice Baru" }}
                    </h1>
                    <p class="text-sm text-slate-500">
                        {{
                            sourceQuotation
                                ? "Data Invoice telah diisi dari Quotation. Periksa sebelum menyimpan."
                                : "Lengkapi detail tagihan dan jatuh tempo pembayaran."
                        }}
                    </p>
                </div>
            </div>

            <section
                v-if="sourceQuotation"
                class="rounded-3xl border border-emerald-200 bg-emerald-50 p-6"
            >
                <div class="flex items-start gap-3">
                    <FileCheck2 class="mt-0.5 h-6 w-6 text-emerald-600" />
                    <div>
                        <p
                            class="text-xs font-black uppercase tracking-wider text-emerald-600"
                        >
                            Sumber Quotation
                        </p>
                        <h2 class="mt-1 font-mono font-black">
                            {{
                                sourceQuotation.quotationNumber ||
                                sourceQuotation.trackingCode
                            }}
                        </h2>
                        <p class="mt-1 font-bold">
                            {{
                                sourceQuotation.subject || sourceQuotation.title
                            }}
                        </p>
                    </div>
                </div>
            </section>

            <section
                v-if="!invoice && !job && !sourceQuotation"
                class="rounded-3xl border bg-white p-6"
            >
                <label>
                    <span class="label">Pilih Berkas</span>
                    <select
                        v-model="selected"
                        @change="choose"
                        required
                        class="field"
                    >
                        <option value="">
                            Pilih berkas yang belum memiliki invoice
                        </option>
                        <option
                            v-for="item in jobs"
                            :key="`${item.jobType}|${item.id}`"
                            :value="`${item.jobType}|${item.id}`"
                        >
                            {{ item.trackingCode }} — {{ item.clientName }} —
                            {{ item.title }}
                        </option>
                    </select>
                </label>
                <p v-if="!jobs.length" class="mt-4 text-sm text-amber-600">
                    Semua berkas sudah memiliki invoice atau belum ada berkas.
                </p>
            </section>

            <section
                v-if="sourceClient"
                class="rounded-3xl border bg-white p-6"
            >
                <h2 class="mb-4 font-black">Informasi Client</h2>
                <div class="grid gap-4 md:grid-cols-2">
                    <div class="flex gap-3">
                        <User class="h-5 w-5 text-pink-500" />
                        <div>
                            <p class="label mb-0">Client</p>
                            <p class="font-bold">
                                {{ sourceClient.clientName || "-" }}
                            </p>
                        </div>
                    </div>
                    <div class="flex gap-3">
                        <Receipt class="h-5 w-5 text-pink-500" />
                        <div>
                            <p class="label mb-0">
                                {{ sourceQuotation ? "Quotation" : "Berkas" }}
                            </p>
                            <p class="font-bold">
                                {{
                                    sourceQuotation
                                        ? sourceQuotation.quotationNumber ||
                                          sourceQuotation.trackingCode
                                        : `${sourceClient.trackingCode} · ${sourceClient.title}`
                                }}
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            <form @submit.prevent="save" class="space-y-6">
                <section class="space-y-6 rounded-3xl border bg-white p-8">
                    <div>
                        <h2 class="text-lg font-black">Detail Tagihan</h2>
                        <p class="text-sm text-slate-500">
                            Tanggal, jatuh tempo, dan status pembayaran Invoice.
                        </p>
                    </div>
                    <div class="grid gap-5 md:grid-cols-2">
                        <label v-if="invoice">
                            <span class="label">Status Invoice</span>
                            <select v-model="form.status" class="field">
                                <option>Belum Bayar</option>
                                <option>DP Bayar</option>
                                <option>Lunas</option>
                            </select>
                        </label>
                        <label>
                            <span class="label">Tanggal Invoice</span>
                            <input
                                v-model="form.date"
                                type="date"
                                required
                                class="field"
                            />
                        </label>
                        <label>
                            <span class="label">Jatuh Tempo</span>
                            <input
                                v-model="form.dueDate"
                                type="date"
                                class="field"
                            />
                        </label>
                    </div>
                </section>

                <section
                    class="rounded-3xl border border-slate-200 bg-white p-6 md:p-8"
                >
                    <div
                        class="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center"
                    >
                        <div>
                            <h2 class="text-lg font-black">Item Invoice</h2>
                            <p class="text-sm text-slate-500">
                                Tambahkan semua item dan keterangan tagihan.
                            </p>
                        </div>
                        <button
                            type="button"
                            @click="addItem"
                            class="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-pink-50 px-4 text-sm font-black text-pink-600"
                        >
                            <Plus class="h-4 w-4" /> Tambah Item
                        </button>
                    </div>
                    <div class="space-y-3">
                        <article
                            v-for="(item, index) in form.items"
                            :key="index"
                            class="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50/60 p-4 lg:grid-cols-[minmax(200px,1fr)_80px_100px_150px_120px_44px] lg:items-end"
                        >
                            <label>
                                <span class="label">Keterangan Item</span>
                                <input
                                    v-model="item.description"
                                    required
                                    class="field"
                                    placeholder="Nama jasa atau biaya"
                                />
                            </label>
                            <label>
                                <span class="label">Qty</span>
                                <input
                                    v-model.number="item.quantity"
                                    type="number"
                                    min="0.01"
                                    step="0.01"
                                    required
                                    class="field"
                                />
                            </label>
                            <label>
                                <span class="label">Satuan</span>
                                <input
                                    v-model="item.unit"
                                    required
                                    class="field"
                                    placeholder="item"
                                />
                            </label>
                            <label>
                                <span class="label">Harga Satuan</span>
                                <input
                                    :value="formatNumber(item.unitPrice)"
                                    type="text"
                                    inputmode="numeric"
                                    autocomplete="off"
                                    @input="updateUnitPrice(item, $event)"
                                    @focus="selectAmount"
                                    required
                                    class="field"
                                />
                            </label>
                            <div>
                                <span class="label">Jumlah</span>
                                <div class="flex h-12 items-center font-black">
                                    {{
                                        money(
                                            Number(item.quantity || 0) *
                                                Number(item.unitPrice || 0),
                                        )
                                    }}
                                </div>
                            </div>
                            <button
                                type="button"
                                title="Hapus item"
                                :disabled="form.items.length === 1"
                                @click="removeItem(index)"
                                class="grid h-11 w-full place-items-center rounded-xl bg-rose-50 text-rose-600 disabled:cursor-not-allowed disabled:opacity-30 lg:w-11"
                            >
                                <Trash2 class="h-4 w-4" />
                            </button>
                        </article>
                    </div>
                    <p v-if="form.errors.items" class="error mt-3">
                        {{ form.errors.items }}
                    </p>
                </section>

                <div class="grid gap-6 lg:grid-cols-[1fr_360px]">
                    <section
                        class="rounded-3xl border border-slate-200 bg-white p-6"
                    >
                        <label>
                            <span class="label">Syarat dan Ketentuan</span>
                            <textarea
                                v-model="form.description"
                                rows="4"
                                class="field h-auto py-3"
                                placeholder="Syarat pembayaran dan ketentuan Invoice"
                            />
                        </label>
                    </section>
                    <section
                        class="rounded-3xl border border-slate-200 bg-white p-6"
                    >
                        <p class="text-sm text-slate-500">Total Invoice</p>
                        <p class="mt-2 text-2xl font-black text-pink-600">
                            {{ money(total) }}
                        </p>
                        <template v-if="!invoice">
                            <label
                                class="mt-5 block border-t border-slate-200 pt-5"
                            >
                                <span class="label">Pembayaran DP</span>
                                <input
                                    v-model="dpAmountDisplay"
                                    type="text"
                                    inputmode="numeric"
                                    autocomplete="off"
                                    @focus="selectAmount"
                                    class="field"
                                />
                            </label>
                            <p v-if="form.errors.dpAmount" class="error mt-2">
                                {{ form.errors.dpAmount }}
                            </p>
                            <div class="mt-5 border-t border-slate-200 pt-5">
                                <p class="text-sm text-slate-500">
                                    Sisa Pembayaran
                                </p>
                                <p class="mt-2 text-xl font-black">
                                    {{ money(remainingPayment) }}
                                </p>
                            </div>
                        </template>
                    </section>
                </div>
                <p
                    v-if="form.errors.quotationId"
                    class="rounded-xl bg-rose-50 p-3 text-sm font-bold text-rose-700"
                >
                    {{ form.errors.quotationId }}
                </p>
                <div class="flex justify-end border-t pt-6">
                    <button
                        :disabled="
                            form.processing ||
                            (!invoice && !form.jobId && !form.quotationId)
                        "
                        class="inline-flex h-12 items-center gap-2 rounded-xl bg-pink-500 px-7 font-black text-white disabled:opacity-40"
                    >
                        <Save class="h-5 w-5" />
                        {{
                            form.processing
                                ? "Menyimpan..."
                                : invoice
                                  ? "Simpan Perubahan"
                                  : "Simpan Invoice"
                        }}
                    </button>
                </div>
            </form>
        </main>
    </AppLayout>
</template>

<style scoped>
.label {
    display: block;
    margin-bottom: 0.5rem;
    font-size: 0.7rem;
    font-weight: 900;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: #64748b;
}
.field {
    height: 3rem;
    width: 100%;
    border-radius: 0.75rem;
    border: 1px solid #e2e8f0;
    background: #fff;
    padding: 0 1rem;
    font-weight: 700;
}
.error {
    color: #e11d48;
    font-size: 0.75rem;
    font-weight: 700;
}
</style>
