<script setup lang="ts">
import { History, Pencil, CalendarDays } from '@lucide/vue';
withDefaults(defineProps<{ title?: string; entries: Array<{ id: number; actor_name: string; created_at: string; reason: string; changes: Array<{ field: string; before: any; after: any }> }> }>(), { title: 'Riwayat Perubahan' });
const labels: Record<string, string> = { clientId: 'ID client', clientName: 'Nama client', clientPhone: 'Telepon client', clientEmail: 'Email client', clientAddress: 'Alamat client', picUserId: 'ID PIC', subject: 'Perihal', quotationDate: 'Tanggal quotation', validUntil: 'Berlaku sampai', status: 'Status', subtotal: 'Subtotal', discount: 'Diskon', taxPercent: 'Pajak (%)', taxAmount: 'Jumlah pajak', grandTotal: 'Total penawaran', notes: 'Catatan', terms: 'Syarat dan ketentuan', amount: 'Total tagihan', description: 'Keterangan', date: 'Tanggal invoice', dueDate: 'Jatuh tempo', items: 'Item' };
Object.assign(labels, { invoiceNumber: 'Nomor invoice', quotationNumber: 'Nomor quotation', paymentAmount: 'Nominal pembayaran', paymentMethod: 'Cara pembayaran', paymentDate: 'Tanggal pembayaran', proofCount: 'Jumlah bukti gambar' });
const value = (input: any): string => {
    if (Array.isArray(input)) return input.length ? input.map((item) => `${item.description} — ${item.quantity} ${item.unit} × Rp ${Number(item.unitPrice).toLocaleString('id-ID')}`).join('\n') : '—';
    return input === null || input === undefined || input === '' ? '—' : String(input);
};
const date = (input: string) => {
    const parsed = new Date(input.replace(' ', 'T'));
    return Number.isNaN(parsed.getTime()) ? input : new Intl.DateTimeFormat('id-ID', { dateStyle: 'long', timeStyle: 'short' }).format(parsed);
};
</script>

<template>
    <section class="rounded-3xl border border-slate-200 bg-white p-6">
        <h2 class="flex items-center gap-2 text-lg font-black"><History class="h-5 w-5 text-amber-700" /> {{ title }}</h2>
        <p class="mt-1 text-xs text-slate-500">Catatan aktivitas dan perubahan dokumen.</p>
        <p v-if="!entries.length" class="mt-3 text-sm text-slate-500">Belum ada perubahan yang tercatat.</p>
        <div v-for="(entry, index) in entries" :key="entry.id" class="relative ml-2 border-l-2 border-slate-200 pb-2 pl-6 last:border-transparent">
            <span class="absolute -left-[7px] top-6 h-3 w-3 rounded-full border-2 border-white" :class="index === 0 ? 'bg-orange-500 ring-2 ring-orange-300' : 'bg-slate-300'" />
            <div class="document-history-entry mt-2 rounded-xl p-4 text-sm" :class="index === 0 ? 'bg-orange-50' : 'border-b border-slate-100'">
            <div class="flex flex-wrap items-center justify-between gap-2"><strong class="flex items-center gap-2"><span class="grid h-9 w-9 place-items-center rounded-xl border border-orange-200 bg-white"><Pencil class="h-4 w-4 text-orange-600" /></span>{{ entry.actor_name }}</strong><time class="flex items-center gap-1 text-slate-500"><CalendarDays class="h-4 w-4" />{{ date(entry.created_at) }}</time></div>
            <p v-if="!entry.changes?.length" class="mt-2 whitespace-pre-wrap"><strong>Aktivitas:</strong> {{ entry.reason }}</p>
            <div v-for="(change, index) in entry.changes" :key="index" class="mt-3 border-t pt-3">
                <p class="font-bold">{{ labels[change.field] || change.field }}</p>
                <div class="mt-1 grid gap-2 sm:grid-cols-2"><p class="whitespace-pre-wrap break-words"><span class="text-slate-500">Sebelumnya: </span>{{ value(change.before) }}</p><p class="whitespace-pre-wrap break-words"><span class="text-slate-500">Sesudah: </span>{{ value(change.after) }}</p></div>
                <p class="mt-2 whitespace-pre-wrap break-words"><strong>Alasan perubahan:</strong> {{ entry.reason || 'Tidak dicatat' }}</p>
            </div>
            </div>
        </div>
    </section>
</template>

<style scoped>
@media screen and (min-width: 1024px) {
    .document-history-entry.bg-orange-50,
    .document-history-entry.bg-orange-50 :is(p, strong, time) { color: #302414 !important; }
}
</style>
