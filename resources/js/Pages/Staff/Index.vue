<script setup lang="ts">
import { computed, ref } from 'vue';
import { Head, Link, router } from '@inertiajs/vue3';
import { CheckCircle2, Eye, Mail, Plus, Search, Shield, Trash2, User, XCircle, ChevronRight } from '@lucide/vue';
import AppLayout from '@/Layouts/AppLayout.vue';

const p = defineProps<{ staff: any; search: string; stats: any }>();
const q = ref(p.search);
const filter = ref<'all' | 'active' | 'inactive'>('all');

const list = computed(() =>
    p.staff.data.filter(
        (x: any) =>
            filter.value === 'all' || (filter.value === 'active' ? x.isActive : !x.isActive)
    )
);

const find = () =>
    router.get(
        '/dashboard/pegawai/data',
        { search: q.value },
        { preserveState: true, replace: true }
    );

const remove = (id: string) =>
    confirm('Hapus pegawai ini secara permanen?') &&
    router.delete(`/dashboard/pegawai/data/${id}`);

const roleName = (x: string) =>
    ({ ADMINISTRATOR: 'Administrator', PIMPINAN: 'Pimpinan', STAFFADMIN: 'Staff Admin', OB: 'OB' }[x] || x);
</script>

<template>
    <Head title="Data Pegawai" />
    <AppLayout>
        <main class="mx-auto max-w-7xl space-y-6 p-3 sm:p-5">
            <!-- Header section -->
            <div class="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                    <h1 class="text-xl sm:text-2xl font-black text-slate-900">Data Pegawai</h1>
                    <p class="mt-1 text-xs sm:text-sm font-medium text-slate-500">Kelola informasi dan hak akses seluruh staff kantor.</p>
                </div>
                <Link
                    href="/dashboard/pegawai/new"
                    class="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-5 text-sm font-bold text-white shadow-md transition-all hover:opacity-90 active:scale-95"
                >
                    <Plus class="h-4 w-4" />
                    <span>Tambah Pegawai</span>
                </Link>
            </div>

            <!-- Stats filters -->
            <div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <button
                    v-for="x in [
                        { id: 'all', l: 'Total Pegawai', v: stats.total, i: User, c: 'bg-[var(--primary)] text-white' },
                        { id: 'active', l: 'Pegawai Aktif', v: stats.active, i: CheckCircle2, c: 'bg-emerald-600 text-white' },
                        { id: 'inactive', l: 'Pegawai Non-Aktif', v: stats.inactive, i: XCircle, c: 'bg-rose-600 text-white' },
                    ]"
                    :key="x.id"
                    @click="filter = x.id as any"
                    class="group relative overflow-hidden rounded-2xl p-4 text-left transition-all border border-slate-200"
                    :class="filter === x.id ? `${x.c} shadow-md` : 'bg-white hover:bg-slate-50 text-slate-800'"
                >
                    <p class="text-[11px] font-bold uppercase tracking-wider opacity-80">{{ x.l }}</p>
                    <h3 class="mt-1 text-2xl font-black">{{ x.v }}</h3>
                    <component :is="x.i" class="absolute -bottom-2 -right-2 h-14 w-14 opacity-15" />
                </button>
            </div>

            <!-- Search input -->
            <form @submit.prevent="find" class="relative">
                <Search class="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                    v-model="q"
                    class="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm font-medium focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20"
                    placeholder="Cari nama, username, atau email pegawai..."
                />
            </form>

            <!-- Empty state -->
            <div v-if="!list.length" class="rounded-2xl border border-slate-200 bg-white p-12 text-center text-slate-400">
                <User class="mx-auto h-12 w-12 opacity-30" />
                <h3 class="mt-3 text-base font-bold text-slate-700">Pegawai tidak ditemukan</h3>
                <p class="mt-1 text-xs text-slate-500">Coba ubah kata kunci pencarian atau filter status.</p>
            </div>

            <!-- Staff Table View -->
            <div v-else class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div class="overflow-x-auto">
                    <table class="w-full text-left text-sm">
                        <thead class="bg-slate-50/80 border-b border-slate-200">
                            <tr class="text-[11px] font-black uppercase tracking-wider text-slate-500">
                                <th class="px-5 py-3.5">Pegawai</th>
                                <th class="px-5 py-3.5">Email</th>
                                <th class="px-5 py-3.5">Jabatan / Role</th>
                                <th class="px-5 py-3.5 text-center">Status</th>
                                <th class="px-5 py-3.5 text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-100">
                            <tr v-for="x in list" :key="x.id" class="transition-colors hover:bg-slate-50/70" :class="x.isActive ? '' : 'bg-slate-50/40'">
                                <td class="px-5 py-3.5">
                                    <div class="flex items-center gap-3">
                                        <div class="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-xl bg-[var(--primary)]/10 font-black text-sm text-[var(--primary)]">
                                            <img v-if="x.photoPath" :src="x.photoPath" class="h-full w-full object-cover" />
                                            <span v-else>{{ x.fullName?.charAt(0) }}</span>
                                        </div>
                                        <div>
                                            <p class="font-bold text-slate-900 text-sm">{{ x.fullName }}</p>
                                            <p class="text-xs font-semibold text-slate-400">@{{ x.username }}</p>
                                        </div>
                                    </div>
                                </td>
                                <td class="px-5 py-3.5 text-slate-600 font-medium text-xs">
                                    <div class="flex items-center gap-1.5">
                                        <Mail class="h-3.5 w-3.5 text-slate-400" />
                                        <span>{{ x.email || '-' }}</span>
                                    </div>
                                </td>
                                <td class="px-5 py-3.5">
                                    <div class="inline-flex items-center gap-1.5">
                                        <Shield class="h-3.5 w-3.5 text-[var(--primary)]" />
                                        <span class="rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider bg-[var(--primary)]/10 text-[var(--primary)]">
                                            {{ roleName(x.role) }}
                                        </span>
                                    </div>
                                </td>
                                <td class="px-5 py-3.5 text-center">
                                    <span
                                        class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold"
                                        :class="x.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'"
                                    >
                                        <span class="h-1.5 w-1.5 rounded-full" :class="x.isActive ? 'bg-emerald-500' : 'bg-rose-500'" />
                                        {{ x.isActive ? 'Aktif' : 'Non-Aktif' }}
                                    </span>
                                </td>
                                <td class="px-5 py-3.5 text-center">
                                    <div class="flex items-center justify-center gap-1.5">
                                        <Link
                                            :href="`/dashboard/pegawai/${x.id}`"
                                            class="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 transition hover:bg-slate-100"
                                        >
                                            <Eye class="h-3.5 w-3.5 text-slate-500" />
                                            <span>Detail</span>
                                        </Link>
                                        <button
                                            @click="remove(x.id)"
                                            class="grid h-8 w-8 place-items-center rounded-lg text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                                            title="Hapus Pegawai"
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
        </main>
    </AppLayout>
</template>
