<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { Head, Link, useForm } from "@inertiajs/vue3";
import {
    ArrowLeft,
    ArrowRight,
    Building2,
    Save,
    User,
    UserPlus,
    X,
} from "@lucide/vue";
import AppLayout from "@/Layouts/AppLayout.vue";
const props = defineProps<{
    client: any | null;
    prefill?: any | null;
    sourceInvoiceId?: string | null;
}>();
const initial = props.client || props.prefill;
const step = ref(props.client ? "form" : "selection");
const form = useForm({
    type: initial?.type || "individual",
    name: initial?.name || "",
    birthday: initial?.birthday?.slice(0, 10) || "",
    gender: initial?.gender || "",
    citizenship: initial?.citizenship || "WNI",
    picName: initial?.picName || "",
    npwp: initial?.npwp || "",
    address: initial?.address || "",
    country: initial?.country || "ID",
    province: initial?.province || "",
    city: initial?.city || "",
    district: initial?.district || "",
    village: initial?.village || "",
    phone: initial?.phone || "",
    email: initial?.email || "",
    sourceInvoiceId: props.sourceInvoiceId || null,
});
const choose = (type: string) => {
    form.type = type;
    step.value = "form";
};
const save = () =>
    props.client
        ? form.put(`/dashboard/clients/${props.client.id}`)
        : form.post("/dashboard/clients");
const field =
    "h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold outline-none focus:ring-2 focus:ring-pink-500";
type Region = { id: string; name: string };
const regions = reactive<{
    provinces: Region[];
    cities: Region[];
    districts: Region[];
    villages: Region[];
}>({ provinces: [], cities: [], districts: [], villages: [] });
const selected = reactive({
    province: "",
    city: "",
    district: "",
    village: "",
});
const loading = ref("");
const regionError = ref(false);
const cascading = ref(!props.client && form.country === "ID");
const fetchRegions = async (url: string) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);
    try {
        const response = await fetch(url, { signal: controller.signal });
        if (!response.ok) throw new Error("Wilayah gagal dimuat");
        regionError.value = false;
        return (await response.json()) as Region[];
    } catch {
        regionError.value = true;
        return [];
    } finally {
        clearTimeout(timer);
    }
};
const loadProvinces = async () => {
    loading.value = "province";
    regions.provinces = await fetchRegions(
        "https://www.emsifa.com/api-wilayah-indonesia/api/provinces.json",
    );
    if (!regions.provinces.length) cascading.value = false;
    loading.value = "";
};
const changeProvince = async () => {
    form.province =
        regions.provinces.find((x) => x.id === selected.province)?.name || "";
    form.city = form.district = form.village = "";
    selected.city = selected.district = selected.village = "";
    regions.cities = [];
    regions.districts = [];
    regions.villages = [];
    if (!selected.province) return;
    loading.value = "city";
    regions.cities = await fetchRegions(
        `https://www.emsifa.com/api-wilayah-indonesia/api/regencies/${selected.province}.json`,
    );
    loading.value = "";
};
const changeCity = async () => {
    form.city = regions.cities.find((x) => x.id === selected.city)?.name || "";
    form.district = form.village = "";
    selected.district = selected.village = "";
    regions.districts = [];
    regions.villages = [];
    if (!selected.city) return;
    loading.value = "district";
    regions.districts = await fetchRegions(
        `https://www.emsifa.com/api-wilayah-indonesia/api/districts/${selected.city}.json`,
    );
    loading.value = "";
};
const changeDistrict = async () => {
    form.district =
        regions.districts.find((x) => x.id === selected.district)?.name || "";
    form.village = "";
    selected.village = "";
    regions.villages = [];
    if (!selected.district) return;
    loading.value = "village";
    regions.villages = await fetchRegions(
        `https://www.emsifa.com/api-wilayah-indonesia/api/villages/${selected.district}.json`,
    );
    loading.value = "";
};
const changeVillage = () => {
    form.village =
        regions.villages.find((x) => x.id === selected.village)?.name || "";
};
const useCascading = () => {
    cascading.value = true;
    form.country = "ID";
    loadProvinces();
};
onMounted(() => {
    if (cascading.value) loadProvinces();
});
</script>
<template>
    <Head :title="client ? 'Edit Client' : 'Tambah Client'" /><AppLayout>
        <main
            v-if="step === 'selection'"
            class="mx-auto max-w-2xl space-y-6 p-4 pt-10 text-center"
        >
            <div
                class="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-pink-500/10"
            >
                <UserPlus class="h-7 w-7 text-pink-500" />
            </div>
            <div>
                <h1 class="text-2xl font-black">Tambah Client Baru</h1>
                <p class="mt-2 text-xs font-medium text-slate-500">
                    Silakan pilih kategori client yang ingin Anda daftarkan.
                </p>
            </div>
            <div class="grid gap-4 md:grid-cols-2">
                <button
                    @click="choose('individual')"
                    class="group flex flex-col items-center rounded-3xl border-2 border-slate-100 bg-white p-6 hover:border-pink-500/50"
                >
                    <span
                        class="grid h-16 w-16 place-items-center rounded-2xl bg-pink-500/10 text-pink-500"
                        ><User class="h-8 w-8"
                    /></span>
                    <h3 class="mt-4 text-lg font-black">Perorangan</h3>
                    <p class="my-3 text-[10px] text-slate-500">
                        Data client individu atau perseorangan.
                    </p>
                    <span
                        class="mt-auto flex items-center gap-2 rounded-xl bg-pink-500/10 px-6 py-3 text-[10px] font-black uppercase text-pink-500"
                        >Pilih Perorangan<ArrowRight class="h-4 w-4"
                    /></span>
                </button>
                <button
                    @click="choose('corporate')"
                    class="group flex flex-col items-center rounded-3xl border-2 border-slate-100 bg-white p-6 hover:border-blue-500/50"
                >
                    <span
                        class="grid h-16 w-16 place-items-center rounded-2xl bg-blue-500/10 text-blue-500"
                        ><Building2 class="h-8 w-8"
                    /></span>
                    <h3 class="mt-4 text-lg font-black">Badan Hukum</h3>
                    <p class="my-3 text-[10px] text-slate-500">
                        Perusahaan, yayasan, koperasi, atau instansi.
                    </p>
                    <span
                        class="mt-auto flex items-center gap-2 rounded-xl bg-blue-500/10 px-6 py-3 text-[10px] font-black uppercase text-blue-500"
                        >Pilih Badan Hukum<ArrowRight class="h-4 w-4"
                    /></span>
                </button>
            </div>
            <Link
                :href="
                    sourceInvoiceId
                        ? `/dashboard/invoice/${sourceInvoiceId}`
                        : '/dashboard/clients'
                "
                class="inline-flex items-center gap-2 text-[10px] font-bold uppercase text-slate-500"
                ><ArrowLeft class="h-3 w-3" />{{
                    sourceInvoiceId
                        ? "Kembali ke Invoice"
                        : "Kembali ke Daftar Client"
                }}</Link
            >
        </main>
        <main v-else class="mx-auto max-w-4xl space-y-6 p-4 pb-20">
            <div class="flex items-center gap-4">
                <button
                    v-if="!client"
                    @click="step = 'selection'"
                    class="grid h-12 w-12 place-items-center rounded-full hover:bg-pink-500/10"
                >
                    <ArrowLeft /></button
                ><Link
                    v-else
                    :href="`/dashboard/clients/${client.id}`"
                    class="grid h-12 w-12 place-items-center rounded-full hover:bg-pink-500/10"
                    ><ArrowLeft
                /></Link>
                <div>
                    <h1 class="text-2xl font-black">
                        {{ client ? "Edit Data" : "Tambah Client" }}
                        {{
                            form.type === "individual"
                                ? "Perorangan"
                                : "Badan Hukum"
                        }}
                    </h1>
                    <p class="text-sm font-medium text-slate-500">
                        Lengkapi formulir di bawah sesuai dokumen identitas
                        asli.
                    </p>
                </div>
            </div>
            <section
                class="overflow-hidden rounded-[2.5rem] bg-white shadow-2xl"
            >
                <header
                    class="flex items-center gap-4 border-b bg-pink-500/5 px-8 py-6"
                >
                    <span
                        class="grid h-12 w-12 place-items-center rounded-2xl text-white"
                        :class="
                            form.type === 'individual'
                                ? 'bg-pink-500'
                                : 'bg-blue-500'
                        "
                        ><component
                            :is="form.type === 'individual' ? User : Building2"
                            class="h-7 w-7"
                    /></span>
                    <div>
                        <h2 class="text-xl font-bold">
                            Formulir Data
                            {{
                                form.type === "individual"
                                    ? "Perorangan"
                                    : "Badan Hukum"
                            }}
                        </h2>
                        <p class="text-sm text-slate-500">
                            Pastikan seluruh informasi telah benar.
                        </p>
                    </div>
                </header>
                <form @submit.prevent="save" class="space-y-8 p-8">
                    <div v-if="client">
                        <label class="label">Kategori Client</label
                        ><select v-model="form.type" :class="field">
                            <option value="individual">
                                PERORANGAN (INDIVIDU)
                            </option>
                            <option value="corporate">
                                BADAN HUKUM (PERUSAHAAN)
                            </option>
                        </select>
                    </div>
                    <div class="grid gap-x-8 gap-y-6 md:grid-cols-2">
                        <label class="md:col-span-2"
                            ><span class="label">{{
                                form.type === "individual"
                                    ? "Nama Lengkap"
                                    : "Nama Badan Hukum / Usaha"
                            }}</span
                            ><input
                                v-model="form.name"
                                required
                                :class="field" /></label
                        ><label
                            ><span class="label">Tanggal Lahir</span
                            ><input
                                v-model="form.birthday"
                                type="date"
                                :class="field" /></label
                        ><label v-if="form.type === 'individual'"
                            ><span class="label">Jenis Kelamin</span
                            ><select v-model="form.gender" :class="field">
                                <option value="">Pilih jenis kelamin</option>
                                <option>Laki-laki</option>
                                <option>Perempuan</option>
                            </select></label
                        ><label v-if="form.type === 'individual'"
                            ><span class="label">Kewarganegaraan</span
                            ><select v-model="form.citizenship" :class="field">
                                <option>WNI</option>
                                <option>WNA</option>
                            </select></label
                        ><label v-else
                            ><span class="label">Nama PIC</span
                            ><input
                                v-model="form.picName"
                                :class="field" /></label
                        ><label v-if="form.type === 'corporate'"
                            ><span class="label">NPWP</span
                            ><input v-model="form.npwp" :class="field"
                        /></label>
                        <label class="md:col-span-2"
                            ><span class="label">Alamat</span
                            ><input
                                v-model="form.address"
                                :class="field" /></label
                        ><label
                            ><span class="label">Negara</span
                            ><select
                                v-model="form.country"
                                @change="
                                    form.country === 'ID'
                                        ? useCascading()
                                        : (cascading = false)
                                "
                                :class="field"
                            >
                                <option value="ID">Indonesia</option>
                                <option value="OTHER">Negara Lain</option>
                            </select></label
                        >
                        <div
                            v-if="client && !cascading && form.country === 'ID'"
                            class="flex items-end"
                        >
                            <button
                                type="button"
                                @click="useCascading"
                                class="h-12 rounded-xl bg-blue-50 px-4 font-bold text-blue-600"
                            >
                                Pilih Ulang Wilayah Indonesia
                            </button>
                        </div>
                        <template v-if="form.country === 'ID' && cascading"
                            ><label
                                ><span class="label">Provinsi</span
                                ><select
                                    v-model="selected.province"
                                    @change="changeProvince"
                                    :class="field"
                                >
                                    <option value="">
                                        {{
                                            loading === "province"
                                                ? "Memuat..."
                                                : "Pilih Provinsi"
                                        }}
                                    </option>
                                    <option
                                        v-for="x in regions.provinces"
                                        :value="x.id"
                                    >
                                        {{ x.name }}
                                    </option>
                                </select></label
                            ><label
                                ><span class="label">Kota / Kabupaten</span
                                ><select
                                    v-model="selected.city"
                                    @change="changeCity"
                                    :disabled="!selected.province"
                                    :class="field"
                                >
                                    <option value="">
                                        {{
                                            loading === "city"
                                                ? "Memuat..."
                                                : "Pilih Kota / Kabupaten"
                                        }}
                                    </option>
                                    <option
                                        v-for="x in regions.cities"
                                        :value="x.id"
                                    >
                                        {{ x.name }}
                                    </option>
                                </select></label
                            ><label
                                ><span class="label">Kecamatan</span
                                ><select
                                    v-model="selected.district"
                                    @change="changeDistrict"
                                    :disabled="!selected.city"
                                    :class="field"
                                >
                                    <option value="">
                                        {{
                                            loading === "district"
                                                ? "Memuat..."
                                                : "Pilih Kecamatan"
                                        }}
                                    </option>
                                    <option
                                        v-for="x in regions.districts"
                                        :value="x.id"
                                    >
                                        {{ x.name }}
                                    </option>
                                </select></label
                            ><label
                                ><span class="label">Kelurahan</span
                                ><select
                                    v-model="selected.village"
                                    @change="changeVillage"
                                    :disabled="!selected.district"
                                    :class="field"
                                >
                                    <option value="">
                                        {{
                                            loading === "village"
                                                ? "Memuat..."
                                                : "Pilih Kelurahan"
                                        }}
                                    </option>
                                    <option
                                        v-for="x in regions.villages"
                                        :value="x.id"
                                    >
                                        {{ x.name }}
                                    </option>
                                </select></label
                            ></template
                        ><template v-else
                            ><label
                                ><span class="label">Provinsi</span
                                ><input
                                    v-model="form.province"
                                    :class="field" /></label
                            ><label
                                ><span class="label">Kota / Kabupaten</span
                                ><input
                                    v-model="form.city"
                                    :class="field" /></label
                            ><label
                                ><span class="label">Kecamatan</span
                                ><input
                                    v-model="form.district"
                                    :class="field" /></label
                            ><label
                                ><span class="label">Kelurahan</span
                                ><input
                                    v-model="form.village"
                                    :class="field" /></label
                        ></template>
                        <p
                            v-if="regionError"
                            class="md:col-span-2 rounded-xl bg-amber-50 p-3 text-sm font-bold text-amber-700"
                        >
                            Data wilayah sedang tidak dapat dimuat. Silakan isi
                            wilayah secara manual; halaman tidak akan menunggu
                            lebih dari 6 detik.
                        </p>
                        <label
                            ><span class="label">No Handphone</span
                            ><input
                                v-model="form.phone"
                                :class="field" /></label
                        ><label
                            ><span class="label">Email</span
                            ><input
                                v-model="form.email"
                                type="email"
                                :class="field"
                        /></label>
                    </div>
                    <div class="flex justify-end gap-4 border-t pt-8">
                        <Link
                            :href="
                                client
                                    ? `/dashboard/clients/${client.id}`
                                    : sourceInvoiceId
                                      ? `/dashboard/invoice/${sourceInvoiceId}`
                                      : '/dashboard/clients'
                            "
                            class="flex h-14 items-center gap-2 rounded-2xl px-8 font-bold text-slate-500"
                            ><X />Batal</Link
                        ><button
                            :disabled="form.processing"
                            class="flex h-14 items-center gap-2 rounded-2xl bg-pink-500 px-12 text-lg font-black text-white shadow-xl shadow-pink-500/20"
                        >
                            <Save />{{
                                form.processing
                                    ? "Menyimpan..."
                                    : client
                                      ? "Simpan Perubahan"
                                      : "Simpan Client"
                            }}
                        </button>
                    </div>
                </form>
            </section>
        </main>
    </AppLayout>
</template>
<style scoped>
.label {
    display: block;
    margin: 0 0 0.5rem 0.25rem;
    font-size: 0.7rem;
    font-weight: 900;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: #64748b;
}
</style>
