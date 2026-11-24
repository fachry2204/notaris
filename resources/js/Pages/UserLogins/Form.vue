<script setup lang="ts">
import { computed, ref } from "vue";
import { Head, Link, useForm } from "@inertiajs/vue3";
import {
    ArrowLeft,
    Eye,
    EyeOff,
    KeyRound,
    Mail,
    Phone,
    Save,
    ShieldCheck,
    User,
    UserCog,
} from "@lucide/vue";
import AppLayout from "@/Layouts/AppLayout.vue";

const props = defineProps<{ account: any | null }>();
const showPassword = ref(false);
const roles = computed(() =>
    props.account?.source === "admin"
        ? ["ADMINISTRATOR", "PIMPINAN"]
        : ["ADMINISTRATOR", "PIMPINAN", "STAFFADMIN", "OB"],
);
const form = useForm({
    fullName: props.account?.fullName || "",
    username: props.account?.username || "",
    email: props.account?.email || "",
    phone: props.account?.phone || "",
    role: props.account?.role || "STAFFADMIN",
    isActive: Number(props.account?.isActive ?? 1) === 1,
    attendance_enabled: Boolean(props.account?.attendance_enabled ?? (props.account?.source !== "admin" && !props.account)),
    payroll_enabled: Boolean(props.account?.payroll_enabled ?? (props.account?.source !== "admin" && !props.account)),
    password: "",
});

const save = () => {
    if (props.account) {
        form.put(
            `/dashboard/system/users/${props.account.source}/${props.account.id}`,
        );
        return;
    }
    form.post("/dashboard/system/users");
};

const roleLabel = (value: string) =>
    ({
        ADMINISTRATOR: "Administrator — akses penuh",
        PIMPINAN: "Pimpinan — monitoring dan persetujuan",
        STAFFADMIN: "Staff Admin — operasional kantor",
        OB: "OB — akses operasional terbatas",
    })[value] || value;

const inputClass =
    "mt-2 h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-800 outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary-light)]";
</script>

<template>
    <Head :title="account ? 'Edit User Login' : 'Tambah User Login'" />
    <AppLayout>
        <main class="mx-auto max-w-4xl space-y-5">
            <header class="flex items-center gap-3">
                <Link
                    href="/dashboard/system/users"
                    class="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50"
                >
                    <ArrowLeft class="h-5 w-5" />
                </Link>
                <div>
                    <p class="text-xs font-black uppercase tracking-[0.18em] text-[var(--primary)]">Manajemen Sistem</p>
                    <h1 class="mt-1 text-2xl font-black text-slate-950">
                        {{ account ? "Edit User Login" : "Tambah User Login" }}
                    </h1>
                    <p class="mt-1 text-sm text-slate-500">
                        {{ account ? "Perbarui identitas dan hak akses akun." : "Buat akun baru untuk mengakses sistem." }}
                    </p>
                </div>
            </header>

            <section class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div class="flex items-center gap-4 border-b border-slate-200 bg-slate-50/70 p-5 sm:p-6">
                    <span class="grid h-12 w-12 place-items-center rounded-2xl bg-[var(--primary)] text-white shadow-md">
                        <UserCog class="h-6 w-6" />
                    </span>
                    <div>
                        <h2 class="font-black text-slate-900">Informasi Akun</h2>
                        <p class="mt-0.5 text-xs text-slate-500">Username dan email harus unik di seluruh akun login.</p>
                    </div>
                </div>

                <form class="space-y-6 p-5 sm:p-7" @submit.prevent="save">
                    <div v-if="account" class="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-xs font-semibold text-sky-700">
                        Sumber akun: <strong>{{ account.source === 'admin' ? 'Admin Utama' : 'User Sistem' }}</strong>.
                        Sumber akun tidak diubah agar riwayat login tetap aman.
                    </div>

                    <div class="grid gap-5 md:grid-cols-2">
                        <label class="block md:col-span-2">
                            <span class="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-600">
                                <User class="h-4 w-4 text-[var(--primary)]" /> Nama Lengkap
                            </span>
                            <input v-model="form.fullName" required :class="inputClass" placeholder="Nama lengkap pengguna" />
                            <span v-if="form.errors.fullName" class="mt-1 block text-xs font-bold text-rose-600">{{ form.errors.fullName }}</span>
                        </label>

                        <label class="block">
                            <span class="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-600">
                                <UserCog class="h-4 w-4 text-[var(--primary)]" /> Username
                            </span>
                            <input v-model="form.username" required autocomplete="off" :class="inputClass" placeholder="username" />
                            <span v-if="form.errors.username" class="mt-1 block text-xs font-bold text-rose-600">{{ form.errors.username }}</span>
                        </label>

                        <label class="block">
                            <span class="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-600">
                                <Mail class="h-4 w-4 text-[var(--primary)]" /> Email
                            </span>
                            <input v-model="form.email" required type="email" :class="inputClass" placeholder="nama@email.com" />
                            <span v-if="form.errors.email" class="mt-1 block text-xs font-bold text-rose-600">{{ form.errors.email }}</span>
                        </label>

                        <label class="block">
                            <span class="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-600">
                                <Phone class="h-4 w-4 text-[var(--primary)]" /> Nomor Handphone
                            </span>
                            <input v-model="form.phone" :class="inputClass" placeholder="08xxxxxxxxxx" />
                            <span v-if="form.errors.phone" class="mt-1 block text-xs font-bold text-rose-600">{{ form.errors.phone }}</span>
                        </label>

                        <label class="block">
                            <span class="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-600">
                                <ShieldCheck class="h-4 w-4 text-[var(--primary)]" /> Hak Akses
                            </span>
                            <select v-model="form.role" :class="inputClass">
                                <option v-for="item in roles" :key="item" :value="item">{{ roleLabel(item) }}</option>
                            </select>
                            <span v-if="form.errors.role" class="mt-1 block text-xs font-bold text-rose-600">{{ form.errors.role }}</span>
                        </label>

                        <label class="block">
                            <span class="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-600">
                                <KeyRound class="h-4 w-4 text-[var(--primary)]" /> Password {{ account ? '(opsional)' : '' }}
                            </span>
                            <div class="relative">
                                <input
                                    v-model="form.password"
                                    :required="!account"
                                    :type="showPassword ? 'text' : 'password'"
                                    :class="`${inputClass} pr-12`"
                                    :placeholder="account ? 'Kosongkan bila tidak diubah' : 'Minimal 4 karakter'"
                                    autocomplete="new-password"
                                />
                                <button type="button" class="absolute right-3 top-[22px] grid h-8 w-8 place-items-center text-slate-400" @click="showPassword = !showPassword">
                                    <EyeOff v-if="showPassword" class="h-4 w-4" />
                                    <Eye v-else class="h-4 w-4" />
                                </button>
                            </div>
                            <span v-if="form.errors.password" class="mt-1 block text-xs font-bold text-rose-600">{{ form.errors.password }}</span>
                        </label>

                        <label class="block">
                            <span class="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-600">
                                <ShieldCheck class="h-4 w-4 text-[var(--primary)]" /> Status Akun
                            </span>
                            <select v-model="form.isActive" :class="inputClass">
                                <option :value="true">Aktif — dapat login</option>
                                <option :value="false">Nonaktif — login ditolak</option>
                            </select>
                            <span v-if="form.errors.isActive" class="mt-1 block text-xs font-bold text-rose-600">{{ form.errors.isActive }}</span>
                        </label>
                    </div>

                    <section v-if="account?.source !== 'admin'" class="rounded-xl border border-amber-200 bg-amber-50/40 p-4">
                        <h3 class="font-bold text-slate-900">Keikutsertaan Pegawai</h3>
                        <p class="mt-1 text-sm text-slate-600">Pilihan berlaku untuk daftar dan perhitungan berikutnya; riwayat yang telah tersimpan tetap tersedia.</p>
                        <div class="mt-4 grid gap-4 md:grid-cols-2">
                            <label class="block text-sm font-semibold text-slate-700">Masuk daftar Absensi<select v-model="form.attendance_enabled" :class="inputClass"><option :value="true">Ya</option><option :value="false">Tidak</option></select></label>
                            <label class="block text-sm font-semibold text-slate-700">Masuk dalam Payroll<select v-model="form.payroll_enabled" :class="inputClass"><option :value="true">Ya</option><option :value="false">Tidak</option></select></label>
                        </div>
                    </section>
                    <p v-else class="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">Akun Admin Utama tidak terhubung ke profil pegawai. Absensi dan payroll menggunakan akun User Sistem.</p>

                    <div class="flex flex-col-reverse gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:justify-end">
                        <Link href="/dashboard/system/users" class="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 px-6 text-sm font-bold text-slate-600 hover:bg-slate-50">
                            Batal
                        </Link>
                        <button :disabled="form.processing" class="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-7 text-sm font-black text-white shadow-md disabled:opacity-50">
                            <Save class="h-4 w-4" /> {{ form.processing ? "Menyimpan..." : "Simpan User Login" }}
                        </button>
                    </div>
                </form>
            </section>
        </main>
    </AppLayout>
</template>
