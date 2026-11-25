<script setup lang="ts">
import { computed, ref } from 'vue';
import { Head, Link, useForm, usePage } from '@inertiajs/vue3';
import { ArrowLeft, Clock, Plus, Save, Trash2, Calculator } from '@lucide/vue';
import AppLayout from '@/Layouts/AppLayout.vue';
const page = usePage<any>();

const props = defineProps<{ settings: any }>();
const form = useForm({
    rules: props.settings.rules.map((r: any) => ({ from: r.from, to: r.to, amount: r.amount })),

});
const actual = ref('08:20');
const money = (n: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);
const simulation = computed(() => {
    const mins = (s: string) => { const [h, m] = s.split(':').map(Number); return h * 60 + m; };
    const late = Math.max(0, mins(actual.value) - mins(props.settings.start_time));
    const rule = late > props.settings.grace_minutes ? form.rules.find((r: any) => late >= Number(r.from) && (r.to == null || r.to === '' || late <= Number(r.to))) : null;
    return { late, amount: Number(rule?.amount ?? 0) };
});
const submit = () => form.put('/dashboard/payroll/settings');
</script>
<template>
<Head title="Pengaturan Payroll" />
<AppLayout>
<main class="payroll mx-auto max-w-[1600px] space-y-5 p-3 sm:p-5">
    <div class="flex flex-wrap items-center justify-between gap-4"><div><Link href="/dashboard/payroll" class="text-sm font-semibold text-amber-700">← Kembali ke Payroll</Link><h1 class="mt-2 text-2xl font-black">Pengaturan Payroll</h1><p class="muted mt-1 text-sm">Atur potongan keterlambatan dan data penggajian.</p></div><button class="save-action primary" :disabled="form.processing" @click="submit"><Save class="h-4 w-4" /> Simpan Pengaturan</button></div>
    <div v-if="page.props.flash?.success" class="notice">{{ page.props.flash.success }}</div>
    <div v-if="Object.keys(form.errors).length" class="error">{{ Object.values(form.errors).join(' ') }}</div>
    <div class="grid gap-5 xl:grid-cols-3">
        <section class="panel xl:col-span-2"><h2><Clock class="h-5 w-5 text-amber-600" /> Pengaturan Potongan Payroll</h2>
        <p class="muted mt-3 text-sm">Jam masuk {{ settings.start_time }}, jam pulang {{ settings.end_time || 'belum diatur' }}, toleransi {{ settings.grace_minutes }} menit. Jam kerja dikelola di Pengaturan Absensi.</p>
        <Link href="/dashboard/pegawai/absensi/settings" class="secondary mt-3">Pengaturan Absensi</Link>
        <div class="mt-6 flex items-center justify-between gap-3"><h3 class="font-bold">Aturan Potongan Keterlambatan</h3><button type="button" class="secondary" @click="form.rules.push({ from: 1, to: null, amount: 0 })"><Plus class="h-4 w-4" /> Tambah Aturan</button></div>
        <p class="muted mt-2 text-sm">Satu aturan sesuai total menit terlambat berlaku per hari. Rentang tidak boleh tumpang tindih; kosongkan batas akhir untuk tanpa batas.</p>
        <div v-if="!form.rules.length" class="empty mt-4">Belum ada aturan potongan.</div>
        <div v-for="(rule, index) in form.rules" :key="index" class="rule mt-3"><label>Dari menit<input v-model.number="rule.from" type="number" min="1" max="1440" /></label><label>Sampai menit<input v-model.number="rule.to" type="number" min="1" max="1440" placeholder="Tanpa batas" /></label><label>Potongan (Rp)<input v-model.number="rule.amount" type="number" min="0" /></label><button type="button" class="remove" :aria-label="`Hapus aturan ${index + 1}`" @click="form.rules.splice(index, 1)"><Trash2 class="h-4 w-4" /></button></div>
        </section>
        <section class="panel"><h2><Calculator class="h-5 w-5 text-amber-600" /> Simulasi Potongan</h2><p class="muted mt-2 text-sm">Contoh perhitungan berdasarkan aturan yang sedang diisi.</p><label class="mt-5 block">Jam absen contoh<input v-model="actual" type="time" /></label><div class="summary mt-5"><span>Keterlambatan</span><strong>{{ simulation.late }} menit</strong></div><div class="summary mt-2"><span>Potongan</span><strong>{{ money(simulation.amount) }}</strong></div></section>
    </div>
    <section class="panel"><h2>Data Gaji Karyawan</h2><p class="muted mt-2 text-sm">Kelola gaji, tunjangan, dan potongan BPJS pada halaman data gaji masing-masing pegawai.</p><Link href="/dashboard/payroll/salaries" class="secondary mt-4">Buka Data Gaji Karyawan</Link></section>
</main>
</AppLayout>
</template>
<style scoped>
.payroll{color:#261a11}.panel{background:#fff;border:1px solid #e8dfcf;border-radius:18px;padding:22px}.panel h2{display:flex;align-items:center;gap:9px;font-weight:800;font-size:1.05rem}.muted{color:#70685e}.payroll label{font-weight:600;font-size:.85rem}.payroll input{display:block;width:100%;margin-top:6px;border:1px solid #d8cdbd;border-radius:10px;background:#fff;color:#261a11;padding:10px}.primary,.secondary,.remove{display:inline-flex;align-items:center;justify-content:center;gap:7px;border-radius:10px;padding:10px 14px;font-weight:700;font-size:.85rem}.primary{background:#d4af37;color:#1b1505}.secondary{border:1px solid #c49b24;color:#7d5b05;background:#fff}.remove{border:1px solid #f0c7c7;color:#b42318}.primary:disabled{opacity:.6}.rule{display:grid;grid-template-columns:1fr 1fr 1fr auto;align-items:end;gap:10px}.summary{display:flex;justify-content:space-between;gap:12px;background:#faf2df;padding:13px;border-radius:10px}.empty,.notice,.error{padding:12px;border-radius:10px;background:#faf3e3}.error{background:#ffeded;color:#9b1c1c}table{width:100%;border-collapse:collapse;text-align:left}th,td{padding:10px;border-bottom:1px solid #eee5d6}th{background:#f7f1e7}td input{max-width:240px}@media(max-width:700px){.rule{grid-template-columns:1fr 1fr}}
</style>
