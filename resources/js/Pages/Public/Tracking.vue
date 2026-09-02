<script setup lang="ts">
import { Head, useForm } from "@inertiajs/vue3";
defineProps<{ result: any; error?: string }>();
const f = useForm({ trackingCode: "" });
const money = (x: any) =>
    new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
    }).format(Number(x));
</script>
<template>
    <Head title="Cek Berkas" />
    <main class="min-h-screen bg-slate-950 p-6 text-white">
        <div class="mx-auto max-w-3xl py-16">
            <p
                class="text-sm font-black uppercase tracking-[.25em] text-pink-400"
            >
                Notaris Digital
            </p>
            <h1 class="mt-3 text-4xl font-black">Lacak berkas Anda</h1>
            <p class="mt-2 text-slate-400">
                Masukkan nomor berkas untuk melihat status dan pembayaran.
            </p>
            <form @submit.prevent="f.post('/tracking')" class="mt-8 flex gap-2">
                <input
                    v-model="f.trackingCode"
                    placeholder="Contoh: BHM/24072026/0001"
                    class="min-w-0 flex-1 rounded-xl border-0 text-slate-900"
                /><button class="rounded-xl bg-pink-600 px-6 font-black">
                    Cari
                </button>
            </form>
            <p v-if="error" class="mt-4 text-red-300">{{ error }}</p>
            <section
                v-if="result"
                class="mt-8 rounded-3xl bg-white p-8 text-slate-900"
            >
                <p class="font-mono text-sm font-bold text-pink-600">
                    {{ result.job.trackingCode }}
                </p>
                <h2 class="mt-2 text-2xl font-black">{{ result.job.title }}</h2>
                <p class="mt-1 text-slate-500">{{ result.job.clientName }}</p>
                <div class="mt-6 grid gap-4 sm:grid-cols-2">
                    <div class="rounded-xl bg-slate-50 p-4">
                        <p class="text-xs text-slate-500">Status berkas</p>
                        <p class="mt-1 font-black">{{ result.job.status }}</p>
                    </div>
                    <div class="rounded-xl bg-slate-50 p-4">
                        <p class="text-xs text-slate-500">Status invoice</p>
                        <p class="mt-1 font-black">
                            {{ result.job.invoiceStatus }}
                        </p>
                    </div>
                </div>
                <h3 class="mt-6 font-black">Invoice</h3>
                <div
                    v-for="x in result.invoices"
                    class="mt-2 flex justify-between border-b py-3"
                >
                    <span>{{ x.invoiceNumber }}</span
                    ><b>{{ money(x.amount) }}</b>
                </div>
            </section>
        </div>
    </main>
</template>
