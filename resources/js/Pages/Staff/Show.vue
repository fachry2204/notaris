<script setup lang="ts">
import { Head, Link, router } from "@inertiajs/vue3";
import {
    ArrowLeft,
    CalendarDays,
    Edit3,
    KeyRound,
    Mail,
    Phone,
    Power,
    Shield,
    Trash2,
    UserCheck,
} from "@lucide/vue";
import AppLayout from "@/Layouts/AppLayout.vue";
const p = defineProps<{ staff: any; attendance: any[] }>();
const dt = (x: any) =>
    x
        ? new Date(x).toLocaleDateString("id-ID", {
              day: "numeric",
              month: "long",
              year: "numeric",
          })
        : "-";
const tm = (x: any) =>
    x
        ? new Date(x).toLocaleTimeString("id-ID", {
              hour: "2-digit",
              minute: "2-digit",
          })
        : "-";
const del = () =>
    confirm("Hapus pegawai ini?") &&
    router.delete(`/dashboard/pegawai/data/${p.staff.id}`);
const toggle = () =>
    confirm(
        `${p.staff.isActive ? "Nonaktifkan" : "Aktifkan"} akun pegawai ini?`,
    ) && router.patch(`/dashboard/pegawai/data/${p.staff.id}/status`);
const reset = () =>
    confirm("Reset password pegawai menjadi 1234?") &&
    router.post(`/dashboard/pegawai/data/${p.staff.id}/reset-password`);
</script>
<template>
    <Head :title="staff.fullName" /><AppLayout
        ><main class="mx-auto max-w-5xl space-y-6 p-4">
            <div
                class="flex flex-col justify-between gap-4 md:flex-row md:items-center"
            >
                <div class="flex items-center gap-4">
                    <Link
                        href="/dashboard/pegawai/data"
                        class="grid h-11 w-11 place-items-center rounded-full hover:bg-pink-500/10"
                        ><ArrowLeft
                    /></Link>
                    <div>
                        <h1 class="text-2xl font-black">Detail Pegawai</h1>
                        <p class="text-sm text-slate-500">
                            Profil, hak akses, dan riwayat kehadiran.
                        </p>
                    </div>
                </div>
                <div class="flex flex-wrap gap-2">
                    <button
                        @click="reset"
                        class="flex h-10 items-center gap-2 rounded-xl bg-amber-50 px-3 text-xs font-bold text-amber-700"
                    >
                        <KeyRound class="h-4 w-4" />Reset Password</button
                    ><button
                        @click="toggle"
                        class="flex h-10 items-center gap-2 rounded-xl bg-slate-100 px-3 text-xs font-bold"
                    >
                        <Power class="h-4 w-4" />{{
                            staff.isActive ? "Nonaktifkan" : "Aktifkan"
                        }}</button
                    ><Link
                        :href="`/dashboard/pegawai/${staff.id}/edit`"
                        class="flex h-10 items-center gap-2 rounded-xl bg-pink-500 px-4 text-sm font-bold text-white"
                        ><Edit3 class="h-4 w-4" />Edit</Link
                    ><button
                        @click="del"
                        class="grid h-10 w-10 place-items-center rounded-xl bg-rose-500/10 text-rose-500"
                    >
                        <Trash2 class="h-4 w-4" />
                    </button>
                </div>
            </div>
            <section class="grid gap-6 md:grid-cols-3">
                <article
                    class="rounded-[2rem] border border-slate-200 bg-white p-7 text-center shadow-sm"
                >
                    <div
                        class="mx-auto grid h-28 w-28 place-items-center overflow-hidden rounded-[2rem] bg-pink-500/10 text-4xl font-black text-pink-500"
                    >
                        <img
                            v-if="staff.photoPath"
                            :src="staff.photoPath"
                            class="h-full w-full object-cover"
                        /><span v-else>{{ staff.fullName?.charAt(0) }}</span>
                    </div>
                    <h2 class="mt-4 text-xl font-black">
                        {{ staff.fullName }}
                    </h2>
                    <p class="text-sm text-slate-500">@{{ staff.username }}</p>
                    <span
                        class="mt-4 inline-flex rounded-full px-3 py-1 text-[10px] font-black"
                        :class="
                            staff.isActive
                                ? 'bg-emerald-500/10 text-emerald-600'
                                : 'bg-rose-500/10 text-rose-600'
                        "
                        >{{ staff.isActive ? "AKTIF" : "TIDAK AKTIF" }}</span
                    >
                </article>
                <article
                    class="rounded-[2rem] border border-slate-200 bg-white p-7 shadow-sm md:col-span-2"
                >
                    <h2 class="mb-6 font-black">Informasi Akun</h2>
                    <div class="grid gap-6 md:grid-cols-2">
                        <div
                            v-for="x in [
                                { i: Mail, l: 'Email', v: staff.email },
                                {
                                    i: Phone,
                                    l: 'Handphone',
                                    v: staff.phone || '-',
                                },
                                { i: Shield, l: 'Hak Akses', v: staff.role },
                                {
                                    i: CalendarDays,
                                    l: 'Tanggal Lahir',
                                    v: dt(staff.birthday),
                                },
                            ]"
                            class="flex gap-3"
                        >
                            <component
                                :is="x.i"
                                class="h-5 w-5 text-pink-500"
                            />
                            <div>
                                <p
                                    class="text-[10px] font-black uppercase tracking-widest text-slate-400"
                                >
                                    {{ x.l }}
                                </p>
                                <p class="mt-1 font-bold">{{ x.v }}</p>
                            </div>
                        </div>
                    </div>
                </article>
            </section>
            <section
                class="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm"
            >
                <header class="flex items-center gap-2 border-b p-6">
                    <UserCheck class="h-5 w-5 text-pink-500" />
                    <h2 class="font-black">Riwayat Kehadiran Terakhir</h2>
                </header>
                <table class="w-full text-left text-sm">
                    <thead class="bg-slate-50">
                        <tr class="border-b">
                            <th class="p-4 pl-7">Tanggal</th>
                            <th>Masuk</th>
                            <th>Pulang</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-if="!attendance.length">
                            <td
                                colspan="4"
                                class="py-12 text-center text-slate-500"
                            >
                                Belum ada data absensi.
                            </td>
                        </tr>
                        <tr
                            v-for="x in attendance"
                            class="border-b last:border-0 hover:bg-slate-50"
                        >
                            <td class="p-4 pl-7 font-bold">{{ dt(x.date) }}</td>
                            <td class="text-emerald-600">
                                {{ tm(x.checkIn) }}
                            </td>
                            <td class="text-blue-600">{{ tm(x.checkOut) }}</td>
                            <td>
                                <span
                                    class="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-black"
                                    >{{ x.status }}</span
                                >
                            </td>
                        </tr>
                    </tbody>
                </table>
            </section>
        </main></AppLayout
    >
</template>
