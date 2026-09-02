<script setup lang="ts">
import { computed, ref } from "vue";
import { Head, Link, router, useForm } from "@inertiajs/vue3";
import {
    Clock3,
    Edit3,
    Eye,
    Search,
    TimerOff,
    Trash2,
    UserCheck,
    Users,
} from "@lucide/vue";
import AppLayout from "@/Layouts/AppLayout.vue";

const p = defineProps<{
    records: any;
    today: any;
    hasStaff: boolean;
    isManager: boolean;
    stats: any;
}>();

const q = ref("");
const detail = ref<any>(null);
const editing = ref<any>(null);
const editForm = useForm({ checkIn: "", checkOut: "" });

const beginEdit = (x: any) => {
    editing.value = x;
    editForm.checkIn = x.checkIn
        ? String(x.checkIn).replace(" ", "T").slice(0, 16)
        : "";
    editForm.checkOut = x.checkOut
        ? String(x.checkOut).replace(" ", "T").slice(0, 16)
        : "";
};

const saveEdit = () =>
    editForm.put(`/dashboard/pegawai/absensi/${editing.value.id}`, {
        onSuccess: () => (editing.value = null),
    });

const rows = computed(() =>
    p.records.data.filter(
        (x: any) =>
            !q.value ||
            x.staffName?.toLowerCase().includes(q.value.toLowerCase())
    )
);

const date = (x: any) =>
    x
        ? new Date(x).toLocaleDateString("id-ID", {
              day: "numeric",
              month: "short",
              year: "numeric",
          })
        : "-";

const time = (x: any) =>
    x
        ? new Date(x).toLocaleTimeString("id-ID", {
              hour: "2-digit",
              minute: "2-digit",
          })
        : "-";

const hours = (a: any, b: any) =>
    a && b
        ? `${Math.floor((+new Date(b) - +new Date(a)) / 3600000)}j ${Math.floor(((+new Date(b) - +new Date(a)) % 3600000) / 60000)}m`
        : "-";

const remove = (id: string) =>
    confirm("Hapus data absensi ini?") &&
    router.delete(`/dashboard/pegawai/absensi/${id}`);

const cardStatusStyle = (x: any) => {
    if (!x.checkOut) return "bg-sky-50/90 border-sky-200 text-sky-950 shadow-sm";
    if (x.status?.toLowerCase().includes("terlambat")) return "bg-amber-50/90 border-amber-200 text-amber-950 shadow-sm";
    return "bg-emerald-50/90 border-emerald-200 text-emerald-950 shadow-sm";
};
</script>

<template>
    <Head title="Rekap Absensi" />
    <AppLayout>
        <main class="mx-auto max-w-7xl space-y-6 p-3 sm:p-5">
            <!-- Header section -->
            <div class="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                    <h1 class="text-xl sm:text-2xl font-black text-slate-900">Rekap Absensi</h1>
                    <p class="mt-1 text-xs sm:text-sm font-medium text-slate-500">
                        Pantau kehadiran dan jam kerja seluruh pegawai.
                    </p>
                </div>
                <Link
                    v-if="hasStaff"
                    href="/dashboard/pegawai/absensi/absenku"
                    class="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-5 text-sm font-bold text-white shadow-md transition-all hover:opacity-90 active:scale-95"
                >
                    <UserCheck class="h-4 w-4" />
                    <span>
                        {{
                            today?.checkIn && !today?.checkOut
                                ? "Absen Pulang"
                                : "Absen Masuk"
                        }}
                    </span>
                </Link>
            </div>

            <!-- Manager Stats cards -->
            <div
                v-if="isManager"
                class="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4"
            >
                <div
                    v-for="x in [
                        {
                            l: 'Total Pegawai',
                            v: stats.totalStaff,
                            i: Users,
                        },
                        {
                            l: 'Hadir Hari Ini',
                            v: stats.present,
                            i: UserCheck,
                        },
                        {
                            l: 'Datang Terlambat',
                            v: stats.late,
                            i: Clock3,
                        },
                        {
                            l: 'Belum Check-out',
                            v: stats.notCheckedOut,
                            i: TimerOff,
                        },
                    ]"
                    :key="x.l"
                    class="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                    <p class="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        {{ x.l }}
                    </p>
                    <p class="mt-1 text-2xl font-black text-slate-800">{{ x.v }}</p>
                    <component
                        :is="x.i"
                        class="absolute -bottom-2 -right-2 h-12 w-12 text-slate-400/15"
                    />
                </div>
            </div>

            <!-- Search bar -->
            <div class="relative">
                <Search
                    class="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                />
                <input
                    v-model="q"
                    class="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm font-medium focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20"
                    placeholder="Cari nama pegawai..."
                />
            </div>

            <!-- MOBILE CARDVIEW -->
            <div class="space-y-3.5 md:hidden">
                <div v-if="!rows.length" class="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
                    Data absensi tidak ditemukan.
                </div>
                <div
                    v-for="x in rows"
                    :key="x.id"
                    class="rounded-2xl border p-4 transition-all"
                    :class="cardStatusStyle(x)"
                >
                    <div class="flex items-start justify-between gap-2 border-b border-black/5 pb-3">
                        <div>
                            <h3 class="font-bold text-sm leading-snug">{{ x.staffName || "-" }}</h3>
                            <span class="text-[11px] font-semibold opacity-75">{{ date(x.date) }}</span>
                        </div>
                        <span class="rounded-full bg-white/80 px-2.5 py-0.5 text-[10px] font-black uppercase shadow-sm">
                            {{ x.status || 'Hadir' }}
                        </span>
                    </div>
                    <div class="mt-3 grid grid-cols-3 gap-2 text-xs border-t border-black/5 pt-3">
                        <div>
                            <span class="block text-[10px] uppercase opacity-60">Check In</span>
                            <span class="font-black text-emerald-700">{{ time(x.checkIn) }}</span>
                        </div>
                        <div>
                            <span class="block text-[10px] uppercase opacity-60">Check Out</span>
                            <span class="font-black text-blue-700">{{ time(x.checkOut) }}</span>
                        </div>
                        <div>
                            <span class="block text-[10px] uppercase opacity-60">Durasi</span>
                            <span class="font-bold">{{ hours(x.checkIn, x.checkOut) }}</span>
                        </div>
                    </div>
                    <div class="mt-3 flex items-center justify-end gap-2 border-t border-black/5 pt-3">
                        <button
                            @click="detail = x"
                            class="inline-flex items-center gap-1 rounded-lg bg-white/80 hover:bg-white px-3 py-1 text-xs font-bold shadow-sm border border-black/10"
                        >
                            <Eye class="h-3.5 w-3.5" />
                            <span>Detail</span>
                        </button>
                        <button
                            v-if="isManager"
                            @click="beginEdit(x)"
                            class="inline-flex items-center gap-1 rounded-lg bg-white/80 hover:bg-white px-3 py-1 text-xs font-bold text-amber-700 shadow-sm border border-black/10"
                        >
                            <Edit3 class="h-3.5 w-3.5" />
                            <span>Edit</span>
                        </button>
                        <button
                            v-if="isManager"
                            @click="remove(x.id)"
                            class="grid h-7 w-7 place-items-center rounded-lg bg-rose-100 text-rose-700 shadow-sm"
                        >
                            <Trash2 class="h-3.5 w-3.5" />
                        </button>
                    </div>
                </div>
            </div>

            <!-- DESKTOP TABLE VIEW -->
            <section
                class="hidden md:block overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
            >
                <header
                    class="flex items-center gap-2 border-b border-slate-200 bg-slate-50/50 p-4"
                >
                    <Clock3 class="h-5 w-5" :style="{ color: 'var(--primary)' }" />
                    <h2 class="font-black text-slate-800">Riwayat Kehadiran</h2>
                </header>
                <div class="overflow-x-auto">
                    <table class="w-full text-left text-sm">
                        <thead class="border-b border-slate-200 bg-slate-50/80 text-xs font-bold uppercase tracking-wider text-slate-500">
                            <tr>
                                <th class="p-4 pl-6">Pegawai</th>
                                <th>Tanggal</th>
                                <th>Masuk</th>
                                <th>Pulang</th>
                                <th>Jam Kerja</th>
                                <th>Status</th>
                                <th class="pr-6 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-100">
                            <tr v-if="!rows.length">
                                <td
                                    colspan="7"
                                    class="py-16 text-center text-slate-500"
                                >
                                    Data absensi tidak ditemukan.
                                </td>
                            </tr>
                            <tr
                                v-for="x in rows"
                                :key="x.id"
                                class="hover:bg-slate-50/80 transition-colors"
                            >
                                <td class="p-4 pl-6 font-bold text-slate-800">
                                    {{ x.staffName || "-" }}
                                </td>
                                <td class="text-xs text-slate-600 font-medium">{{ date(x.date) }}</td>
                                <td>
                                    <span
                                        class="rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 border border-emerald-200"
                                        >{{ time(x.checkIn) }}</span
                                    >
                                </td>
                                <td>
                                    <span
                                        class="rounded-lg bg-sky-50 px-2.5 py-1 text-xs font-bold text-sky-700 border border-sky-200"
                                        >{{ time(x.checkOut) }}</span
                                    >
                                </td>
                                <td class="font-bold text-slate-700 text-xs">
                                    {{ hours(x.checkIn, x.checkOut) }}
                                </td>
                                <td>
                                    <span
                                        class="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700 border border-slate-200"
                                        >{{ x.status || 'Hadir' }}</span
                                    >
                                </td>
                                <td class="pr-6">
                                    <div class="flex justify-end gap-2">
                                        <button
                                            @click="detail = x"
                                            class="grid h-8 w-8 place-items-center rounded-lg bg-sky-50 text-sky-600 border border-sky-200 hover:bg-sky-100"
                                            title="Detail"
                                        >
                                            <Eye class="h-4 w-4" />
                                        </button>
                                        <button
                                            v-if="isManager"
                                            @click="beginEdit(x)"
                                            class="grid h-8 w-8 place-items-center rounded-lg bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100"
                                            title="Edit"
                                        >
                                            <Edit3 class="h-4 w-4" />
                                        </button>
                                        <button
                                            v-if="isManager"
                                            @click="remove(x.id)"
                                            class="grid h-8 w-8 place-items-center rounded-lg bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100"
                                            title="Hapus"
                                        >
                                            <Trash2 class="h-4 w-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </section>

            <!-- Detail Modal -->
            <div
                v-if="detail"
                class="fixed inset-0 z-50 grid place-items-center bg-slate-950/60 p-4 backdrop-blur-xs"
                @click.self="detail = null"
            >
                <section
                    class="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl"
                >
                    <header
                        class="p-6 text-white"
                        :style="{ background: 'linear-gradient(135deg, var(--primary) 0%, color-mix(in srgb, var(--primary) 80%, black) 100%)' }"
                    >
                        <h2 class="text-xl font-black">Detail Absensi</h2>
                        <p class="text-xs text-white/80">
                            Informasi lengkap catatan kehadiran.
                        </p>
                    </header>
                    <div class="space-y-5 p-6">
                        <div>
                            <p class="text-lg font-black text-slate-900">
                                {{ detail.staffName }}
                            </p>
                            <p class="text-xs font-semibold text-slate-500">
                                {{ date(detail.date) }}
                            </p>
                        </div>
                        <div class="grid grid-cols-3 gap-3 rounded-2xl bg-slate-50 p-4 border border-slate-100">
                            <div>
                                <p class="text-[10px] font-black uppercase text-slate-400">Check In</p>
                                <p class="font-bold text-emerald-600 text-sm mt-1">
                                    {{ time(detail.checkIn) }}
                                </p>
                            </div>
                            <div>
                                <p class="text-[10px] font-black uppercase text-slate-400">Check Out</p>
                                <p class="font-bold text-sky-600 text-sm mt-1">
                                    {{ time(detail.checkOut) }}
                                </p>
                            </div>
                            <div>
                                <p class="text-[10px] font-black uppercase text-slate-400">Jam Kerja</p>
                                <p class="font-bold text-slate-800 text-sm mt-1">
                                    {{ hours(detail.checkIn, detail.checkOut) }}
                                </p>
                            </div>
                        </div>
                        <button
                            @click="detail = null"
                            class="h-11 w-full rounded-xl bg-slate-100 font-bold text-slate-700 hover:bg-slate-200 transition-colors"
                        >
                            Tutup
                        </button>
                    </div>
                </section>
            </div>

            <!-- Edit Modal -->
            <div
                v-if="editing"
                class="fixed inset-0 z-50 grid place-items-center bg-slate-950/60 p-4 backdrop-blur-xs"
                @click.self="editing = null"
            >
                <form
                    @submit.prevent="saveEdit"
                    class="w-full max-w-md space-y-5 rounded-3xl bg-white p-6 shadow-2xl"
                >
                    <div>
                        <h2 class="text-xl font-black text-slate-900">Edit Data Absensi</h2>
                        <p class="text-xs font-semibold text-slate-500">
                            {{ editing.staffName }}
                        </p>
                    </div>
                    <label class="block text-xs font-bold uppercase tracking-wider text-slate-600">
                        Check In
                        <input
                            v-model="editForm.checkIn"
                            type="datetime-local"
                            class="mt-1.5 w-full rounded-xl border-slate-200 text-sm focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20"
                        />
                    </label>
                    <label class="block text-xs font-bold uppercase tracking-wider text-slate-600">
                        Check Out
                        <input
                            v-model="editForm.checkOut"
                            type="datetime-local"
                            class="mt-1.5 w-full rounded-xl border-slate-200 text-sm focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20"
                        />
                    </label>
                    <div class="flex justify-end gap-2 pt-2">
                        <button
                            type="button"
                            @click="editing = null"
                            class="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
                        >
                            Batal
                        </button>
                        <button
                            class="rounded-xl bg-amber-500 px-5 py-2 text-xs font-bold text-white shadow-md hover:bg-amber-600"
                        >
                            Simpan Perubahan
                        </button>
                    </div>
                </form>
            </div>
        </main>
    </AppLayout>
</template>
