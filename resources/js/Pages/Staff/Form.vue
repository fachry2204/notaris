<script setup lang="ts">
import { Head, Link, useForm } from "@inertiajs/vue3";
import { ArrowLeft, Camera, Save, ShieldCheck, UserPlus, X } from "@lucide/vue";
import AppLayout from "@/Layouts/AppLayout.vue";
const p = defineProps<{ staff: any | null }>();
const f = useForm({
    fullName: p.staff?.fullName || "",
    username: p.staff?.username || "",
    email: p.staff?.email || "",
    phone: p.staff?.phone || "",
    password: "",
    role: p.staff?.role || "STAFFADMIN",
    birthday: p.staff?.birthday?.slice(0, 10) || "",
    isActive: Boolean(p.staff?.isActive ?? true),
    photo: null as File | null,
    ktp: null as File | null,
});
const file = (k: "photo" | "ktp", e: Event) =>
    (f[k] = (e.target as HTMLInputElement).files?.[0] || null);
const save = () =>
    p.staff
        ? f
              .transform((data) => ({ ...data, _method: "put" }))
              .post(`/dashboard/pegawai/data/${p.staff.id}`, {
                  forceFormData: true,
              })
        : f.post("/dashboard/pegawai/data", { forceFormData: true });
const input =
    "h-12 w-full rounded-xl border border-slate-200 bg-white px-4 font-bold outline-none focus:ring-2 focus:ring-pink-500";
</script>
<template>
    <Head :title="staff ? 'Edit Pegawai' : 'Tambah Pegawai'" /><AppLayout
        ><main class="mx-auto max-w-4xl space-y-6 p-4 pb-20">
            <div class="flex items-center gap-4">
                <Link
                    :href="
                        staff
                            ? `/dashboard/pegawai/${staff.id}`
                            : '/dashboard/pegawai/data'
                    "
                    class="grid h-12 w-12 place-items-center rounded-full hover:bg-pink-500/10"
                    ><ArrowLeft
                /></Link>
                <div>
                    <h1 class="text-2xl font-black">
                        {{
                            staff ? "Edit Data Pegawai" : "Tambah Pegawai Baru"
                        }}
                    </h1>
                    <p class="text-sm font-medium text-slate-500">
                        Lengkapi identitas, akun, dan hak akses pegawai.
                    </p>
                </div>
            </div>
            <section
                class="overflow-hidden rounded-[2.5rem] bg-white shadow-2xl dark:bg-slate-900"
            >
                <header
                    class="flex items-center gap-4 border-b bg-pink-500/5 px-8 py-6 dark:border-slate-800"
                >
                    <span
                        class="grid h-12 w-12 place-items-center rounded-2xl bg-pink-500 text-white"
                        ><UserPlus
                    /></span>
                    <div>
                        <h2 class="text-xl font-bold">Informasi Pegawai</h2>
                        <p class="text-sm text-slate-500">
                            Data ini digunakan untuk login dan operasional
                            kantor.
                        </p>
                    </div>
                </header>
                <form @submit.prevent="save" class="space-y-8 p-8">
                    <div class="grid gap-6 md:grid-cols-2">
                        <label
                            ><span class="label">Nama Lengkap</span
                            ><input
                                v-model="f.fullName"
                                required
                                :class="input" /></label
                        ><label
                            ><span class="label">Username</span
                            ><input
                                v-model="f.username"
                                :disabled="!!staff"
                                required
                                :class="input" /></label
                        ><label
                            ><span class="label">Email</span
                            ><input
                                v-model="f.email"
                                type="email"
                                required
                                :class="input" /></label
                        ><label
                            ><span class="label">Nomor Handphone</span
                            ><input v-model="f.phone" :class="input" /></label
                        ><label
                            ><span class="label"
                                >Password
                                {{
                                    staff ? "(kosongkan jika tetap)" : ""
                                }}</span
                            ><input
                                v-model="f.password"
                                type="password"
                                :required="!staff"
                                :placeholder="
                                    staff
                                        ? 'Tidak diubah'
                                        : 'Minimal 4 karakter'
                                "
                                :class="input" /></label
                        ><label
                            ><span class="label">Hak Akses</span
                            ><select v-model="f.role" :class="input">
                                <option
                                    v-for="x in [
                                        'ADMINISTRATOR',
                                        'PIMPINAN',
                                        'STAFFADMIN',
                                        'OB',
                                    ]"
                                >
                                    {{ x }}
                                </option>
                            </select></label
                        ><label
                            ><span class="label">Tanggal Lahir</span
                            ><input
                                v-model="f.birthday"
                                type="date"
                                :class="input" /></label
                        ><label v-if="staff"
                            ><span class="label">Status Akun</span
                            ><select v-model="f.isActive" :class="input">
                                <option :value="true">Aktif</option>
                                <option :value="false">Tidak Aktif</option>
                            </select></label
                        ><label class="rounded-2xl border-2 border-dashed p-5"
                            ><span class="flex items-center gap-2 font-bold"
                                ><Camera class="h-4 w-4 text-pink-500" />Foto
                                Pegawai</span
                            ><input
                                type="file"
                                accept="image/*"
                                @change="file('photo', $event)"
                                class="mt-3 text-xs" /></label
                        ><label class="rounded-2xl border-2 border-dashed p-5"
                            ><span class="flex items-center gap-2 font-bold"
                                ><ShieldCheck
                                    class="h-4 w-4 text-blue-500"
                                />Scan KTP</span
                            ><input
                                type="file"
                                @change="file('ktp', $event)"
                                class="mt-3 text-xs"
                        /></label>
                    </div>
                    <div
                        class="flex justify-end gap-3 border-t pt-8 dark:border-slate-800"
                    >
                        <Link
                            :href="
                                staff
                                    ? `/dashboard/pegawai/${staff.id}`
                                    : '/dashboard/pegawai/data'
                            "
                            class="flex h-13 items-center gap-2 rounded-2xl px-7 font-bold text-slate-500"
                            ><X />Batal</Link
                        ><button
                            :disabled="f.processing"
                            class="flex h-13 items-center gap-2 rounded-2xl bg-pink-500 px-10 font-black text-white shadow-xl shadow-pink-500/20"
                        >
                            <Save />{{
                                f.processing ? "Menyimpan..." : "Simpan Data"
                            }}
                        </button>
                    </div>
                </form>
            </section>
        </main></AppLayout
    >
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
