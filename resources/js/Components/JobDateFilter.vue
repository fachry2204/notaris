<script setup lang="ts">
import { reactive, ref } from "vue";
import { router } from "@inertiajs/vue3";

const props = defineProps<{ filters: { start_date: string | null; end_date: string | null } }>();
const dates = reactive({ start_date: props.filters.start_date || "", end_date: props.filters.end_date || "" });
const error = ref("");
const submit = () => {
    error.value = "";
    if (!dates.start_date || !dates.end_date || dates.start_date > dates.end_date) {
        error.value = "Pilih tanggal mulai dan akhir yang valid.";
        return;
    }
    const [sy, sm] = dates.start_date.split("-").map(Number);
    const [ey, em] = dates.end_date.split("-").map(Number);
    if ((ey - sy) * 12 + em - sm > 23) {
        error.value = "Rentang tanggal maksimal 24 bulan.";
        return;
    }
    const params = new URLSearchParams(window.location.search);
    params.set("start_date", dates.start_date);
    params.set("end_date", dates.end_date);
    router.get(window.location.pathname, Object.fromEntries(params), { preserveState: false, preserveScroll: true });
};
const reset = () => {
    const params = new URLSearchParams(window.location.search);
    params.delete("start_date");
    params.delete("end_date");
    router.get(window.location.pathname, Object.fromEntries(params), { preserveState: false, preserveScroll: true });
};
</script>

<template>
    <div class="min-w-0">
        <form @submit.prevent="submit" class="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
            <label class="min-w-0 text-xs font-bold text-slate-600 sm:w-44">Dari
                <input v-model="dates.start_date" type="date" required class="mt-1.5 block h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900" />
            </label>
            <label class="min-w-0 text-xs font-bold text-slate-600 sm:w-44">Sampai
                <input v-model="dates.end_date" type="date" required class="mt-1.5 block h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900" />
            </label>
            <div class="flex gap-2">
                <button type="submit" class="h-11 flex-1 rounded-xl bg-[var(--primary)] px-5 text-xs font-bold text-white sm:flex-none">Terapkan</button>
                <button v-if="filters.start_date" type="button" @click="reset" class="h-11 flex-1 rounded-xl border border-slate-200 bg-white px-5 text-xs font-bold text-slate-600 sm:flex-none">Reset</button>
            </div>
        </form>
        <p v-if="error" role="alert" class="mt-2 text-xs text-red-600">{{ error }}</p>
        <p class="mt-2 text-xs text-slate-500">Berdasarkan tanggal berkas dibuat, maksimal 24 bulan.</p>
    </div>
</template>
