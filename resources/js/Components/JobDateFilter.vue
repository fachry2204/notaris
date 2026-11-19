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
    <div>
        <form @submit.prevent="submit" class="flex flex-wrap items-end gap-2">
            <label class="text-xs font-bold text-slate-600">Dari
                <input v-model="dates.start_date" type="date" required class="mt-1 block rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs" />
            </label>
            <label class="text-xs font-bold text-slate-600">Sampai
                <input v-model="dates.end_date" type="date" required class="mt-1 block rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs" />
            </label>
            <button type="submit" class="rounded-xl bg-[var(--primary)] px-4 py-2.5 text-xs font-bold text-white">Terapkan</button>
            <button v-if="filters.start_date" type="button" @click="reset" class="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-600">Reset</button>
        </form>
        <p v-if="error" role="alert" class="mt-1 text-xs text-red-600">{{ error }}</p>
        <p class="mt-1 text-xs text-slate-500">Filter berdasarkan tanggal berkas dibuat (maks. 24 bulan).</p>
    </div>
</template>
