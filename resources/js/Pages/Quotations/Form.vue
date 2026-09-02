<script setup lang="ts">
import { computed } from "vue";
import { Head, Link, useForm } from "@inertiajs/vue3";
import {
    ArrowLeft,
    FileSignature,
    Plus,
    Save,
    Trash2,
    UserCheck,
    UserPlus,
    UserRound,
} from "@lucide/vue";
import AppLayout from "@/Layouts/AppLayout.vue";

const props = defineProps<{
    quotation: any | null;
    items: any[];
    clients: any[];
    staff: any[];
}>();
const today = new Date();
const validDate = new Date(today);
validDate.setDate(validDate.getDate() + 14);
const dateValue = (date: Date) => date.toISOString().slice(0, 10);
const form = useForm({
    clientMode: props.quotation?.clientId ? "existing" : "new",
    clientId: props.quotation?.clientId || "",
    clientName: props.quotation?.clientName || "",
    clientPhone: props.quotation?.clientPhone || "",
    clientEmail: props.quotation?.clientEmail || "",
    clientAddress: props.quotation?.clientAddress || "",
    picUserId: props.quotation?.picUserId || "",
    subject: props.quotation?.subject || "",
    quotationDate:
        props.quotation?.quotationDate?.slice(0, 10) || dateValue(today),
    validUntil:
        props.quotation?.validUntil?.slice(0, 10) || dateValue(validDate),
    status: props.quotation?.status || "Draft",
    discount: Number(props.quotation?.discount || 0),
    taxPercent: Number(props.quotation?.taxPercent || 0),
    notes: props.quotation?.notes || "",
    terms:
        props.quotation?.terms ||
        "Harga berlaku sampai tanggal yang tercantum. Pembayaran dilakukan sesuai kesepakatan.",
    items: props.items.length
        ? props.items.map((item) => ({
              description: item.description,
              quantity: Number(item.quantity),
              unit: item.unit,
              unitPrice: Number(item.unitPrice),
          }))
        : [{ description: "", quantity: 1, unit: "item", unitPrice: 0 }],
});
const selectedExistingClient = computed(() =>
    props.clients.find((client) => client.id === form.clientId),
);
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
const subtotal = computed(() =>
    form.items.reduce(
        (sum, item) =>
            sum + Number(item.quantity || 0) * Number(item.unitPrice || 0),
        0,
    ),
);
const discount = computed(() =>
    Math.min(Number(form.discount || 0), subtotal.value),
);
const tax = computed(
    () =>
        Math.max(0, subtotal.value - discount.value) *
        (Number(form.taxPercent || 0) / 100),
);
const grandTotal = computed(
    () => Math.max(0, subtotal.value - discount.value) + tax.value,
);
const money = (value: any) =>
    new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0,
    }).format(Number(value || 0));
const formatNumber = (value: number | string) =>
    new Intl.NumberFormat("id-ID", {
        maximumFractionDigits: 0,
    }).format(Number(value || 0));
const updateUnitPrice = (item: { unitPrice: number }, event: Event) => {
    const value = (event.target as HTMLInputElement).value.replace(/\D/g, "");
    item.unitPrice = value ? Number(value) : 0;
};
const selectAmount = (event: FocusEvent) => {
    (event.target as HTMLInputElement).select();
};
const save = () =>
    props.quotation
        ? form.put(`/dashboard/quotation/${props.quotation.id}`)
        : form.post("/dashboard/quotation");
</script>

<template>
    <Head :title="quotation ? 'Edit Quotation' : 'Buat Quotation'" />
    <AppLayout>
        <main class="mx-auto max-w-6xl space-y-6 p-4">
            <header class="flex items-center gap-4">
                <Link
                    :href="
                        quotation
                            ? `/dashboard/quotation/${quotation.id}`
                            : '/dashboard/quotation'
                    "
                    class="grid h-11 w-11 shrink-0 place-items-center rounded-full hover:bg-pink-50"
                >
                    <ArrowLeft class="h-5 w-5" />
                </Link>
                <div>
                    <h1 class="text-2xl font-black">
                        {{
                            quotation ? "Edit Quotation" : "Buat Quotation Baru"
                        }}
                    </h1>
                    <p class="text-sm text-slate-500">
                        Lengkapi client, PIC, dan rincian item penawaran.
                    </p>
                </div>
            </header>

            <form @submit.prevent="save" class="space-y-6">
                <section
                    class="rounded-3xl border border-slate-200 bg-white p-6 md:p-8"
                >
                    <div class="mb-6 flex items-center gap-3">
                        <FileSignature class="h-5 w-5 text-pink-600" />
                        <h2 class="text-lg font-black">Informasi Quotation</h2>
                    </div>
                    <div class="grid gap-5 md:grid-cols-2">
                        <div class="md:col-span-2">
                            <span class="label">Jenis Client</span>
                            <div class="grid gap-3 sm:grid-cols-2">
                                <label
                                    class="client-mode"
                                    :class="
                                        form.clientMode === 'existing'
                                            ? 'client-mode-active'
                                            : ''
                                    "
                                >
                                    <input
                                        v-model="form.clientMode"
                                        type="radio"
                                        value="existing"
                                        class="sr-only"
                                    />
                                    <UserCheck class="h-5 w-5" />
                                    <span>
                                        <b class="block">Client Lama</b>
                                        <small>Pilih dari Data Client</small>
                                    </span>
                                </label>
                                <label
                                    class="client-mode"
                                    :class="
                                        form.clientMode === 'new'
                                            ? 'client-mode-active'
                                            : ''
                                    "
                                >
                                    <input
                                        v-model="form.clientMode"
                                        type="radio"
                                        value="new"
                                        class="sr-only"
                                    />
                                    <UserPlus class="h-5 w-5" />
                                    <span>
                                        <b class="block">Client Baru</b>
                                        <small>Isi data secara manual</small>
                                    </span>
                                </label>
                            </div>
                        </div>

                        <label v-if="form.clientMode === 'existing'">
                            <span class="label">Pilih Client Lama</span>
                            <select
                                v-model="form.clientId"
                                required
                                class="field"
                            >
                                <option value="">Pilih dari Data Client</option>
                                <option
                                    v-for="client in clients"
                                    :key="client.id"
                                    :value="client.id"
                                >
                                    {{ client.name }}
                                </option>
                            </select>
                            <span v-if="form.errors.clientId" class="error">{{
                                form.errors.clientId
                            }}</span>
                        </label>
                        <div
                            v-if="
                                form.clientMode === 'existing' &&
                                selectedExistingClient
                            "
                            class="rounded-2xl border border-pink-100 bg-pink-50/60 p-4 text-sm"
                        >
                            <p class="font-black text-slate-800">
                                {{ selectedExistingClient.name }}
                            </p>
                            <p class="mt-1 text-slate-500">
                                {{
                                    selectedExistingClient.phone ||
                                    "Nomor HP belum tersedia"
                                }}
                            </p>
                            <p class="text-slate-500">
                                {{
                                    selectedExistingClient.email ||
                                    "Email belum tersedia"
                                }}
                            </p>
                        </div>

                        <template v-if="form.clientMode === 'new'">
                            <label>
                                <span class="label">Nama Client Baru</span>
                                <input
                                    v-model="form.clientName"
                                    required
                                    class="field"
                                    placeholder="Masukkan nama client"
                                />
                                <span
                                    v-if="form.errors.clientName"
                                    class="error"
                                    >{{ form.errors.clientName }}</span
                                >
                            </label>
                            <label>
                                <span class="label"
                                    >Nomor Handphone Client</span
                                >
                                <input
                                    v-model="form.clientPhone"
                                    class="field"
                                    placeholder="Contoh: 081234567890"
                                />
                            </label>
                            <label>
                                <span class="label">Email Client</span>
                                <input
                                    v-model="form.clientEmail"
                                    type="email"
                                    class="field"
                                    placeholder="nama@email.com"
                                />
                                <span
                                    v-if="form.errors.clientEmail"
                                    class="error"
                                    >{{ form.errors.clientEmail }}</span
                                >
                            </label>
                            <label class="md:col-span-2">
                                <span class="label">Alamat Client</span>
                                <textarea
                                    v-model="form.clientAddress"
                                    rows="2"
                                    class="field h-auto py-3"
                                    placeholder="Masukkan alamat client"
                                ></textarea>
                            </label>
                        </template>
                        <label class="md:col-span-2">
                            <span class="label">Judul Penawaran</span>
                            <input
                                v-model="form.subject"
                                required
                                class="field"
                                placeholder="Contoh: Penawaran Jasa Pendirian PT"
                            />
                        </label>
                        <label>
                            <span class="label">Tanggal Quotation</span>
                            <input
                                v-model="form.quotationDate"
                                type="date"
                                required
                                class="field"
                            />
                        </label>
                        <label>
                            <span class="label">Berlaku Sampai</span>
                            <input
                                v-model="form.validUntil"
                                type="date"
                                :min="form.quotationDate"
                                class="field"
                            />
                        </label>
                        <label>
                            <span class="label">PIC Quotation</span>
                            <span class="relative block">
                                <UserRound
                                    :stroke-width="2.4"
                                    class="pointer-events-none absolute left-4 top-1/2 z-10 h-5 w-5 -translate-y-1/2 text-pink-500"
                                />
                                <select
                                    v-model="form.picUserId"
                                    required
                                    class="field field-with-icon"
                                >
                                    <option value="">
                                        Pilih PIC quotation
                                    </option>
                                    <option
                                        v-for="person in staff"
                                        :key="person.id"
                                        :value="person.id"
                                    >
                                        {{ person.fullName }} —
                                        {{ person.role }}
                                    </option>
                                </select>
                            </span>
                            <span v-if="form.errors.picUserId" class="error">{{
                                form.errors.picUserId
                            }}</span>
                        </label>
                        <label>
                            <span class="label">Status</span>
                            <select
                                v-model="form.status"
                                required
                                class="field"
                            >
                                <option>Draft</option>
                                <option>Dikirim</option>
                                <option>Disetujui</option>
                                <option>Ditolak</option>
                                <option>Kedaluwarsa</option>
                            </select>
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
                            <h2 class="text-lg font-black">Item Quotation</h2>
                            <p class="text-sm text-slate-500">
                                Tambahkan seluruh layanan atau biaya yang
                                ditawarkan.
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
                                <span class="label">Deskripsi Item</span>
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

                <div class="grid gap-6 lg:grid-cols-[1fr_380px]">
                    <section
                        class="space-y-5 rounded-3xl border border-slate-200 bg-white p-6"
                    >
                        <label>
                            <span class="label">Catatan Penawaran</span>
                            <textarea
                                v-model="form.notes"
                                rows="3"
                                class="field h-auto py-3"
                                placeholder="Catatan tambahan untuk client"
                            ></textarea>
                        </label>
                        <label>
                            <span class="label">Syarat dan Ketentuan</span>
                            <textarea
                                v-model="form.terms"
                                rows="4"
                                class="field h-auto py-3"
                            ></textarea>
                        </label>
                    </section>
                    <section
                        class="rounded-3xl border border-slate-200 bg-white p-6"
                    >
                        <h2 class="font-black">Ringkasan Harga</h2>
                        <div class="mt-5 space-y-4">
                            <div class="flex justify-between text-sm">
                                <span class="text-slate-500">Subtotal</span>
                                <b>{{ money(subtotal) }}</b>
                            </div>
                            <label
                                class="grid grid-cols-[1fr_150px] items-center gap-3"
                            >
                                <span class="text-sm text-slate-500"
                                    >Diskon</span
                                >
                                <input
                                    v-model.number="form.discount"
                                    type="number"
                                    min="0"
                                    :max="subtotal"
                                    class="h-10 rounded-xl border-slate-200 text-right text-sm font-bold"
                                />
                            </label>
                            <label
                                class="grid grid-cols-[1fr_100px] items-center gap-3"
                            >
                                <span class="text-sm text-slate-500"
                                    >Pajak (%)</span
                                >
                                <input
                                    v-model.number="form.taxPercent"
                                    type="number"
                                    min="0"
                                    max="100"
                                    step="0.01"
                                    class="h-10 rounded-xl border-slate-200 text-right text-sm font-bold"
                                />
                            </label>
                            <div class="flex justify-between text-sm">
                                <span class="text-slate-500">Nilai Pajak</span>
                                <b>{{ money(tax) }}</b>
                            </div>
                            <div
                                class="flex items-center justify-between border-t border-slate-200 pt-5"
                            >
                                <span class="font-black">Total Penawaran</span>
                                <b class="text-xl text-pink-600">{{
                                    money(grandTotal)
                                }}</b>
                            </div>
                        </div>
                    </section>
                </div>

                <div class="flex justify-end">
                    <button
                        :disabled="form.processing"
                        class="inline-flex h-12 items-center gap-2 rounded-xl bg-pink-500 px-7 font-black text-white shadow-lg shadow-pink-500/20 disabled:opacity-50"
                    >
                        <Save class="h-5 w-5" />
                        {{
                            form.processing
                                ? "Menyimpan..."
                                : quotation
                                  ? "Simpan Perubahan"
                                  : "Simpan Quotation"
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
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #64748b;
}
.field {
    height: 3rem;
    width: 100%;
    border: 1px solid #e2e8f0;
    border-radius: 0.75rem;
    background: white;
    padding-left: 1rem;
    padding-right: 1rem;
    font-size: 0.875rem;
    font-weight: 700;
}
.field-with-icon {
    padding-left: 2.75rem;
}
.client-mode {
    display: flex;
    min-height: 4.25rem;
    cursor: pointer;
    align-items: center;
    gap: 0.75rem;
    border: 1px solid #e2e8f0;
    border-radius: 1rem;
    background: white;
    padding: 0.875rem 1rem;
    color: #64748b;
    transition: 150ms ease;
}
.client-mode small {
    display: block;
    margin-top: 0.125rem;
    font-size: 0.75rem;
    font-weight: 600;
}
.client-mode-active {
    border-color: #f472b6;
    background: #fdf2f8;
    color: #db2777;
    box-shadow: 0 0 0 3px rgb(244 114 182 / 12%);
}
.error {
    display: block;
    margin-top: 0.375rem;
    font-size: 0.75rem;
    font-weight: 700;
    color: #e11d48;
}
</style>
