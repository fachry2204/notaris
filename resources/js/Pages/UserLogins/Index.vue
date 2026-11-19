<script setup lang="ts">
import { computed, ref } from "vue";
import { Head, Link, router, usePage } from "@inertiajs/vue3";
import {
    CheckCircle2,
    KeyRound,
    Pencil,
    Plus,
    Power,
    Search,
    ShieldCheck,
    Trash2,
    UserCog,
    Users,
    XCircle,
} from "@lucide/vue";
import AppLayout from "@/Layouts/AppLayout.vue";

const props = defineProps<{
    accounts: any;
    filters: { search: string; status: string; role: string };
    stats: { total: number; active: number; inactive: number };
    currentAccount: { id: string; source: string };
}>();

const page = usePage<any>();
const search = ref(props.filters.search || "");
const status = ref(props.filters.status || "all");
const role = ref(props.filters.role || "all");
const roles = ["ADMINISTRATOR", "PIMPINAN", "STAFFADMIN", "OB"];

const applyFilters = () =>
    router.get(
        "/dashboard/system/users",
        { search: search.value, status: status.value, role: role.value },
        { preserveState: true, replace: true },
    );

const setStatus = (value: string) => {
    status.value = value;
    applyFilters();
};

const isCurrent = (account: any) =>
    account.id === props.currentAccount.id &&
    account.source === props.currentAccount.source;

const toggleStatus = (account: any) => {
    if (isCurrent(account)) return;
    const action = account.isActive ? "nonaktifkan" : "aktifkan";
    if (!confirm(`${action[0].toUpperCase()}${action.slice(1)} akun ${account.fullName}?`)) return;
    router.patch(
        `/dashboard/system/users/${account.source}/${account.id}/status`,
        {},
        { preserveScroll: true },
    );
};

const remove = (account: any) => {
    if (isCurrent(account)) return;
    if (!confirm(`Hapus user login ${account.fullName} secara permanen?`)) return;
    router.delete(`/dashboard/system/users/${account.source}/${account.id}`, {
        preserveScroll: true,
    });
};

const roleLabel = (value: string) =>
    ({
        ADMINISTRATOR: "Administrator",
        PIMPINAN: "Pimpinan",
        STAFFADMIN: "Staff Admin",
        OB: "OB",
    })[value] || value;

const visibleFrom = computed(() => props.accounts.from || 0);
</script>

<template>
    <Head title="User Login" />
    <AppLayout>
        <main class="mx-auto max-w-7xl space-y-5">
            <header class="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                <div>
                    <p class="text-xs font-black uppercase tracking-[0.18em] text-[var(--primary)]">
                        Manajemen Sistem
                    </p>
                    <h1 class="mt-1 text-2xl font-black text-slate-950">User Login</h1>
                    <p class="mt-1 text-sm text-slate-500">
                        Kelola seluruh akun, hak akses, dan status login sistem.
                    </p>
                </div>
                <Link
                    href="/dashboard/system/users/new"
                    class="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-5 text-sm font-black text-white shadow-md transition hover:-translate-y-0.5"
                >
                    <Plus class="h-4 w-4" /> Tambah User Login
                </Link>
            </header>

            <div
                v-if="page.props.flash?.success"
                class="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700"
            >
                {{ page.props.flash.success }}
            </div>
            <div
                v-if="page.props.errors?.account"
                class="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700"
            >
                {{ page.props.errors.account }}
            </div>

            <section class="grid gap-3 sm:grid-cols-3">
                <button
                    type="button"
                    class="relative overflow-hidden rounded-2xl border p-4 text-left transition"
                    :class="status === 'all' ? 'border-[var(--primary)] bg-[var(--primary)] text-white shadow-md' : 'border-slate-200 bg-white text-slate-800 hover:bg-slate-50'"
                    @click="setStatus('all')"
                >
                    <p class="text-[10px] font-black uppercase tracking-wider opacity-75">Total Akun</p>
                    <p class="mt-1 text-3xl font-black">{{ stats.total }}</p>
                    <Users class="absolute -bottom-3 -right-2 h-16 w-16 opacity-15" />
                </button>
                <button
                    type="button"
                    class="relative overflow-hidden rounded-2xl border p-4 text-left transition"
                    :class="status === 'active' ? 'border-emerald-600 bg-emerald-600 text-white shadow-md' : 'border-slate-200 bg-white text-slate-800 hover:bg-slate-50'"
                    @click="setStatus('active')"
                >
                    <p class="text-[10px] font-black uppercase tracking-wider opacity-75">Akun Aktif</p>
                    <p class="mt-1 text-3xl font-black">{{ stats.active }}</p>
                    <CheckCircle2 class="absolute -bottom-3 -right-2 h-16 w-16 opacity-15" />
                </button>
                <button
                    type="button"
                    class="relative overflow-hidden rounded-2xl border p-4 text-left transition"
                    :class="status === 'inactive' ? 'border-rose-600 bg-rose-600 text-white shadow-md' : 'border-slate-200 bg-white text-slate-800 hover:bg-slate-50'"
                    @click="setStatus('inactive')"
                >
                    <p class="text-[10px] font-black uppercase tracking-wider opacity-75">Akun Nonaktif</p>
                    <p class="mt-1 text-3xl font-black">{{ stats.inactive }}</p>
                    <XCircle class="absolute -bottom-3 -right-2 h-16 w-16 opacity-15" />
                </button>
            </section>

            <form class="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-[1fr_220px_auto]" @submit.prevent="applyFilters">
                <div class="relative">
                    <Search class="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                        v-model="search"
                        class="h-11 w-full rounded-xl border-slate-200 pl-11 text-sm font-semibold"
                        placeholder="Cari nama, username, atau email..."
                    />
                </div>
                <select v-model="role" class="h-11 rounded-xl border-slate-200 text-sm font-bold">
                    <option value="all">Semua Hak Akses</option>
                    <option v-for="item in roles" :key="item" :value="item">{{ roleLabel(item) }}</option>
                </select>
                <button class="h-11 rounded-xl bg-slate-900 px-6 text-sm font-black text-white">Terapkan</button>
            </form>

            <section class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div class="overflow-x-auto">
                    <table class="w-full min-w-[980px] text-left text-sm">
                        <thead class="border-b border-slate-200 bg-slate-50">
                            <tr class="text-[10px] font-black uppercase tracking-wider text-slate-500">
                                <th class="w-16 px-5 py-4 text-center">No.</th>
                                <th class="px-5 py-4">User</th>
                                <th class="px-5 py-4">Kontak</th>
                                <th class="px-5 py-4">Hak Akses</th>
                                <th class="px-5 py-4">Sumber Akun</th>
                                <th class="px-5 py-4 text-center">Status</th>
                                <th class="w-44 px-5 py-4 text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-100">
                            <tr v-for="(account, index) in accounts.data" :key="`${account.source}-${account.id}`" class="hover:bg-slate-50/70">
                                <td class="px-5 py-4 text-center font-bold text-slate-400">{{ visibleFrom + index }}</td>
                                <td class="px-5 py-4">
                                    <div class="flex items-center gap-3">
                                        <span class="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[var(--primary-light)] font-black text-[var(--primary)]">
                                            {{ account.fullName?.slice(0, 1).toUpperCase() }}
                                        </span>
                                        <div class="min-w-0">
                                            <div class="flex items-center gap-2">
                                                <p class="truncate font-black text-slate-900">{{ account.fullName }}</p>
                                                <span v-if="isCurrent(account)" class="rounded-full bg-sky-50 px-2 py-0.5 text-[9px] font-black text-sky-700">AKUN ANDA</span>
                                            </div>
                                            <p class="text-xs font-semibold text-slate-400">@{{ account.username }}</p>
                                        </div>
                                    </div>
                                </td>
                                <td class="px-5 py-4">
                                    <p class="text-xs font-semibold text-slate-700">{{ account.email }}</p>
                                    <p class="mt-1 text-xs text-slate-400">{{ account.phone || '-' }}</p>
                                </td>
                                <td class="px-5 py-4">
                                    <span class="inline-flex items-center gap-1.5 rounded-full bg-violet-50 px-3 py-1 text-[10px] font-black uppercase text-violet-700">
                                        <ShieldCheck class="h-3.5 w-3.5" /> {{ roleLabel(account.role) }}
                                    </span>
                                </td>
                                <td class="px-5 py-4">
                                    <span class="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-black uppercase text-slate-600">
                                        <KeyRound class="h-3.5 w-3.5" /> {{ account.source === 'admin' ? 'Admin Utama' : 'User Sistem' }}
                                    </span>
                                </td>
                                <td class="px-5 py-4 text-center">
                                    <button
                                        type="button"
                                        :disabled="isCurrent(account)"
                                        class="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-black transition disabled:cursor-not-allowed disabled:opacity-60"
                                        :class="account.isActive ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' : 'bg-rose-50 text-rose-700 hover:bg-rose-100'"
                                        :title="isCurrent(account) ? 'Akun yang sedang dipakai tidak dapat dinonaktifkan' : 'Klik untuk mengubah status'"
                                        @click="toggleStatus(account)"
                                    >
                                        <Power class="h-3.5 w-3.5" /> {{ account.isActive ? 'Aktif' : 'Nonaktif' }}
                                    </button>
                                </td>
                                <td class="px-5 py-4">
                                    <div class="flex items-center justify-center gap-2">
                                        <Link
                                            :href="`/dashboard/system/users/${account.source}/${account.id}/edit`"
                                            class="grid h-9 w-9 place-items-center rounded-lg border border-amber-200 bg-amber-50 text-amber-700 transition hover:bg-amber-100"
                                            title="Edit user login"
                                        >
                                            <Pencil class="h-4 w-4" />
                                        </Link>
                                        <button
                                            type="button"
                                            :disabled="isCurrent(account)"
                                            class="grid h-9 w-9 place-items-center rounded-lg border border-rose-200 bg-rose-50 text-rose-600 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-40"
                                            title="Hapus user login"
                                            @click="remove(account)"
                                        >
                                            <Trash2 class="h-4 w-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                            <tr v-if="!accounts.data.length">
                                <td colspan="7" class="px-5 py-14 text-center">
                                    <UserCog class="mx-auto h-10 w-10 text-slate-300" />
                                    <p class="mt-3 font-bold text-slate-500">User login tidak ditemukan.</p>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <div v-if="accounts.links?.length > 3" class="flex flex-wrap justify-center gap-1 border-t border-slate-100 px-4 py-4">
                    <Link
                        v-for="link in accounts.links"
                        :key="link.label"
                        :href="link.url || '#'"
                        class="rounded-lg border px-3 py-1.5 text-xs font-bold"
                        :class="link.active ? 'border-[var(--primary)] bg-[var(--primary)] text-white' : link.url ? 'border-slate-200 text-slate-600 hover:bg-slate-50' : 'pointer-events-none border-slate-100 text-slate-300'"
                        preserve-scroll
                        v-html="link.label"
                    />
                </div>
            </section>
        </main>
    </AppLayout>
</template>
