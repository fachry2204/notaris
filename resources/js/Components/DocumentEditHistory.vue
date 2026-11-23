<script setup lang="ts">
defineProps<{ entries: Array<{ id: number; actor_name: string; created_at: string; reason: string; changes: Array<{ field: string; before: any; after: any }> }> }>();
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
        <h2 class="text-lg font-black">Riwayat Perubahan</h2>
        <p v-if="!entries.length" class="mt-3 text-sm text-slate-500">Belum ada perubahan yang tercatat.</p>
        <div v-for="entry in entries" :key="entry.id" class="mt-4 rounded-xl border border-slate-200 p-4 text-sm">
            <div class="flex flex-wrap justify-between gap-2"><strong>{{ entry.actor_name }}</strong><time class="text-slate-500">{{ date(entry.created_at) }}</time></div>
            <p class="mt-2 whitespace-pre-wrap"><strong>Aktivitas / alasan:</strong> {{ entry.reason }}</p>
            <div v-for="(change, index) in entry.changes" :key="index" class="mt-3 border-t pt-3">
                <p class="font-bold">{{ labels[change.field] || change.field }}</p>
                <div class="mt-1 grid gap-2 sm:grid-cols-2"><p class="whitespace-pre-wrap break-words"><span class="text-slate-500">Sebelumnya: </span>{{ value(change.before) }}</p><p class="whitespace-pre-wrap break-words"><span class="text-slate-500">Sesudah: </span>{{ value(change.after) }}</p></div>
            </div>
        </div>
    </section>
</template>
