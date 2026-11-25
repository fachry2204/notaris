<script setup lang="ts">
import { nextTick, onMounted, ref } from 'vue';
import { Eye, LoaderCircle, RefreshCw, Search, X } from '@lucide/vue';

type Message = { id: string; category: string; channel: string; recipient_name: string | null; recipient_position: string; phone: string | null; destination: string; status: string; created_at: string; subject?: string; body?: string; status_note?: string };
const rows = ref<Message[]>([]);
const filters = ref({ q: '', channel: '', status: '', position: '' });
const loading = ref(false);
const error = ref('');
const page = ref(1);
const total = ref(0);
const lastPage = ref(1);
const selected = ref<Message | null>(null);
const dialog = ref<HTMLDialogElement>();
const detailLoading = ref(false);
const detailError = ref('');
let requestId = 0;
const positions: Record<string, string> = { STAFFADMIN: 'Karyawan', OB: 'OB', ADMINISTRATOR: 'Admin', PIMPINAN: 'Pimpinan', CLIENT: 'Client', TEST: 'Penerima uji' };
const statuses: Record<string, string> = { SENDING: 'Sedang diproses', ACCEPTED: 'Diterima gateway', FAILED: 'Gagal' };
const categories: Record<string, string> = { quotation: 'Quotation', invoice: 'Invoice', job: 'Berkas', attendance: 'Absensi', test: 'Pesan uji' };
const date = (value: string) => new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value.replace(' ', 'T')));
const badge = (status: string) => status === 'ACCEPTED' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : status === 'FAILED' ? 'border-rose-200 bg-rose-50 text-rose-800' : 'border-amber-200 bg-amber-50 text-amber-900';
async function load(target = 1) {
    const current = ++requestId;
    loading.value = true;
    error.value = '';
    try {
        const response = await fetch('/dashboard/settings/messages?' + new URLSearchParams({ ...filters.value, page: String(target) }), { headers: { Accept: 'application/json' } });
        if (!response.ok) throw new Error();
        const result = await response.json();
        if (current !== requestId) return;
        rows.value = result.data;
        page.value = result.current_page;
        lastPage.value = result.last_page;
        total.value = result.total;
    } catch {
        if (current === requestId) error.value = 'Riwayat pesan belum dapat dimuat. Silakan coba lagi.';
    } finally { if (current === requestId) loading.value = false; }
}
async function detail(row: Message) {
    selected.value = row;
    detailLoading.value = true;
    detailError.value = '';
    await nextTick();
    dialog.value?.showModal();
    try {
        const response = await fetch('/dashboard/settings/messages/' + row.id, { headers: { Accept: 'application/json' } });
        if (!response.ok) throw new Error();
        const result = await response.json();
        if (selected.value?.id === row.id) selected.value = result;
    } catch { if (selected.value?.id === row.id) detailError.value = 'Detail pesan belum dapat dimuat. Tutup lalu coba lagi.'; }
    finally { if (selected.value?.id === row.id) detailLoading.value = false; }
}
onMounted(() => load());
</script>

<template>
    <section class="min-w-0 overflow-hidden rounded-3xl border border-[#e9decd] bg-white">
        <header class="border-b border-[#e9decd] p-5 md:p-6">
            <div class="flex flex-wrap items-start justify-between gap-4">
                <div><h2 class="text-xl font-black">Status Pesan</h2><p class="mt-2 max-w-3xl text-sm leading-6 text-stone-600">Riwayat pengiriman Email dan WhatsApp. Pesan dicatat mulai fitur ini diaktifkan; pesan lama tidak dapat ditampilkan kembali.</p></div>
                <button type="button" :disabled="loading" @click="load(page)" class="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#c8ad7f] px-4 text-sm font-bold text-[#806329] disabled:opacity-50"><RefreshCw class="h-4 w-4" :class="{'animate-spin':loading}"/>Muat ulang</button>
            </div>
            <p class="mt-4 rounded-xl bg-[#faf5ec] p-3 text-xs leading-5 text-stone-700">Diterima gateway berarti layanan pengiriman menerima pesan. Status sampai atau dibaca belum tersedia. Kanal atau kategori nonaktif tidak membuat catatan pengiriman.</p>
            <div class="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(200px,2fr)_1fr_1fr_1fr_auto]">
                <label class="block text-xs font-semibold text-stone-600">Cari penerima<span class="relative mt-2 block"><Search class="pointer-events-none absolute left-3 top-3.5 h-4 w-4"/><input v-model="filters.q" maxlength="200" placeholder="Nama, nomor HP, atau email" class="h-11 w-full rounded-xl border border-[#e9decd] bg-white pr-3 text-sm" style="padding-left:2.25rem" @keydown.enter.prevent="load()"/></span></label>
                <label class="text-xs font-semibold text-stone-600">Posisi<select v-model="filters.position" class="mt-2 h-11 w-full rounded-xl border border-[#e9decd] bg-white px-3 text-sm"><option value="">Semua posisi</option><option v-for="(label,key) in positions" :key="key" :value="key">{{label}}</option></select></label>
                <label class="text-xs font-semibold text-stone-600">Tujuan<select v-model="filters.channel" class="mt-2 h-11 w-full rounded-xl border border-[#e9decd] bg-white px-3 text-sm"><option value="">Email & WhatsApp</option><option value="email">Email</option><option value="whatsapp">WhatsApp</option></select></label>
                <label class="text-xs font-semibold text-stone-600">Status pesan<select v-model="filters.status" class="mt-2 h-11 w-full rounded-xl border border-[#e9decd] bg-white px-3 text-sm"><option value="">Semua status</option><option v-for="(label,key) in statuses" :key="key" :value="key">{{label}}</option></select></label>
                <button type="button" :disabled="loading" @click="load()" class="min-h-11 self-end rounded-xl bg-[#806329] px-5 text-sm font-bold text-white disabled:opacity-50">Terapkan</button>
            </div>
        </header>
        <p v-if="error" role="alert" class="p-6 text-sm text-rose-800">{{error}}</p>
        <div v-else-if="loading" role="status" class="flex items-center justify-center gap-3 p-12 text-stone-600"><LoaderCircle class="h-5 w-5 animate-spin"/>Memuat riwayat pesan…</div>
        <div v-else-if="!rows.length" class="p-12 text-center"><h3 class="font-bold">Belum ada pesan</h3><p class="mt-2 text-sm text-stone-600">Belum ada riwayat pengiriman yang sesuai dengan filter ini.</p></div>
        <div v-else class="overflow-x-auto">
            <table class="w-full min-w-[1050px] text-left text-sm">
                <thead class="bg-[#f1e8d8] text-xs uppercase tracking-wide text-stone-600"><tr><th class="px-5 py-4">No.</th><th class="px-4 py-4">Nama & waktu</th><th class="px-4 py-4">Posisi</th><th class="px-4 py-4">No. HP</th><th class="px-4 py-4">Tujuan</th><th class="px-4 py-4">Status pesan</th><th class="px-5 py-4">Isi pesan</th></tr></thead>
                <tbody class="divide-y divide-[#eee5d8]">
                    <tr v-for="(row,index) in rows" :key="row.id" class="align-top hover:bg-[#fffcf6]"><td class="px-5 py-5 tabular-nums text-stone-500">{{(page-1)*15+index+1}}</td><td class="max-w-56 px-4 py-5"><p class="break-words font-bold">{{row.recipient_name || 'Penerima uji'}}</p><p class="mt-1 text-xs text-stone-500">{{date(row.created_at)}}</p></td><td class="px-4 py-5">{{positions[row.recipient_position] || row.recipient_position}}</td><td class="whitespace-nowrap px-4 py-5 tabular-nums">{{row.phone || '—'}}</td><td class="max-w-64 px-4 py-5"><p class="font-semibold">{{row.channel === 'email' ? 'Email' : 'WhatsApp'}}</p><p class="mt-1 break-all text-xs text-stone-600">{{row.destination || 'Tujuan belum valid'}}</p><p class="mt-1 text-xs text-[#806329]">{{categories[row.category] || row.category}}</p></td><td class="px-4 py-5"><span class="inline-flex whitespace-nowrap rounded-full border px-3 py-1 text-xs font-bold" :class="badge(row.status)">{{statuses[row.status] || row.status}}</span></td><td class="px-5 py-4"><button type="button" @click="detail(row)" class="inline-flex min-h-11 items-center gap-2 rounded-xl border border-sky-200 bg-sky-50 px-3 font-semibold text-sky-800"><Eye class="h-4 w-4"/>Detail</button></td></tr>
                </tbody>
            </table>
        </div>
        <footer class="flex flex-wrap items-center justify-between gap-3 border-t border-[#e9decd] p-5 text-sm text-stone-600"><span>{{total}} pesan · Halaman {{page}} dari {{lastPage}}</span><div class="flex gap-2"><button type="button" :disabled="loading || page<=1" @click="load(page-1)" class="min-h-11 rounded-xl border px-4 disabled:opacity-40">Sebelumnya</button><button type="button" :disabled="loading || page>=lastPage" @click="load(page+1)" class="min-h-11 rounded-xl border px-4 disabled:opacity-40">Berikutnya</button></div></footer>
    </section>
    <dialog ref="dialog" aria-labelledby="message-detail-title" class="m-auto max-h-[85dvh] w-[calc(100%-2rem)] max-w-2xl overflow-y-auto rounded-2xl border border-[#c8ad7f] bg-[#fffcf6] p-0 text-stone-800 shadow-2xl backdrop:bg-black/50" @click="event => { if (event.target === dialog) dialog?.close(); }" @close="selected=null">
        <template v-if="selected"><header class="sticky top-0 flex items-center justify-between gap-3 border-b border-[#e9decd] bg-[#fffcf6] p-5"><h2 id="message-detail-title" class="text-xl font-black">Detail Pesan</h2><button type="button" aria-label="Tutup detail pesan" autofocus @click="dialog?.close()" class="flex h-11 w-11 items-center justify-center rounded-xl border bg-white"><X class="h-5 w-5"/></button></header>
            <div class="space-y-5 p-5 md:p-6"><dl class="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2"><div><dt class="text-xs text-stone-500">Penerima</dt><dd class="mt-1 break-words font-bold">{{selected.recipient_name || 'Penerima uji'}} · {{positions[selected.recipient_position] || selected.recipient_position}}</dd></div><div><dt class="text-xs text-stone-500">Waktu pengiriman</dt><dd class="mt-1">{{date(selected.created_at)}}</dd></div><div><dt class="text-xs text-stone-500">Tujuan {{selected.channel === 'email' ? 'Email' : 'WhatsApp'}}</dt><dd class="mt-1 break-all">{{selected.destination || 'Tujuan belum valid'}}</dd></div><div><dt class="text-xs text-stone-500">Status</dt><dd class="mt-1 font-semibold">{{statuses[selected.status]}}</dd></div></dl>
                <p v-if="detailLoading" role="status" class="text-sm">Memuat isi pesan…</p><p v-else-if="detailError" role="alert" class="text-sm text-rose-800">{{detailError}}</p><template v-else><p class="rounded-xl bg-[#f1e8d8] p-3 text-xs leading-5">{{selected.status_note}}</p><h3 v-if="selected.subject" class="break-words font-bold">{{selected.subject}}</h3><div><h3 class="mb-2 text-xs font-bold uppercase tracking-wide text-stone-500">Isi pesan</h3><pre class="whitespace-pre-wrap break-words rounded-xl border border-[#e9decd] bg-white p-4 font-sans text-sm leading-7 [overflow-wrap:anywhere]">{{selected.body}}</pre></div></template>
            </div>
        </template>
    </dialog>
</template>
