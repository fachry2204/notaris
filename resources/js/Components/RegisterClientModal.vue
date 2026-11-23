<script setup lang="ts">
import { useForm } from "@inertiajs/vue3";
import { X } from "@lucide/vue";
const props = defineProps<{ open: boolean; sourceInvoiceId?: string; sourceQuotationId?: string; client: any }>();
const emit = defineEmits<{ close: []; saved: [] }>();
const clientForm = useForm({
    sourceInvoiceId: props.sourceInvoiceId || null, sourceQuotationId: props.sourceQuotationId || null,
    type: 'individual', name: props.client?.clientName || '', phone: props.client?.clientPhone || '',
    email: props.client?.clientEmail || '', address: props.client?.clientAddress || '',
    birthday: '', gender: '', citizenship: 'WNI', picName: '', npwp: '', country: 'ID',
    province: '', city: '', district: '', village: '',
});
const registerClient = () => clientForm.post('/dashboard/clients', {
    preserveScroll: true, preserveState: true,
    onSuccess: () => { emit('saved'); emit('close'); },
});
</script>
<template>
    <Teleport to="body">
            <div v-if="open" role="dialog" aria-modal="true" aria-labelledby="client-modal-title" class="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4" @click.self="!clientForm.processing && (emit('close'))" @keydown.esc="!clientForm.processing && (emit('close'))">
                <form @submit.prevent="registerClient" class="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-slate-200 bg-white p-6 text-[#1d1a15] shadow-xl">
                    <div class="flex items-start justify-between gap-3"><div><h2 id="client-modal-title" class="text-lg font-black">Daftarkan Client</h2><p class="mt-1 text-sm text-slate-500">Data dari quotation telah diisi dan dapat diperiksa sebelum disimpan.</p></div><button type="button" @click="emit('close')" :disabled="clientForm.processing" aria-label="Tutup formulir client" class="p-2"><X class="h-5 w-5" /></button></div>
                    <div class="mt-5 grid gap-4 sm:grid-cols-2">
                        <label class="text-sm font-bold">Jenis Client<select v-model="clientForm.type" class="mt-1 w-full rounded-xl border-slate-200"><option value="individual">Perorangan</option><option value="corporate">Badan Hukum</option></select></label>
                        <label class="text-sm font-bold">Nama Client <span class="text-rose-600">*</span><input v-model="clientForm.name" required maxlength="255" class="mt-1 w-full rounded-xl border-slate-200" /><span v-if="clientForm.errors.name" class="text-xs text-rose-600">{{ clientForm.errors.name }}</span></label>
                        <label class="text-sm font-bold">Telepon<input v-model="clientForm.phone" type="tel" maxlength="255" class="mt-1 w-full rounded-xl border-slate-200" /></label>
                        <label class="text-sm font-bold">Email<input v-model="clientForm.email" type="email" maxlength="255" class="mt-1 w-full rounded-xl border-slate-200" /><span v-if="clientForm.errors.email" class="text-xs text-rose-600">{{ clientForm.errors.email }}</span></label>
                        <label v-if="clientForm.type === 'corporate'" class="text-sm font-bold">Nama PIC<input v-model="clientForm.picName" maxlength="255" class="mt-1 w-full rounded-xl border-slate-200" /></label>
                        <label v-else class="text-sm font-bold">Tanggal Lahir<input v-model="clientForm.birthday" type="date" class="mt-1 w-full rounded-xl border-slate-200" /></label>
                        <label v-if="clientForm.type === 'individual'" class="text-sm font-bold">Jenis Kelamin<select v-model="clientForm.gender" class="mt-1 w-full rounded-xl border-slate-200"><option value="">Tidak diisi</option><option value="Laki-laki">Laki-laki</option><option value="Perempuan">Perempuan</option></select></label>
                        <label v-if="clientForm.type === 'individual'" class="text-sm font-bold">Kewarganegaraan<select v-model="clientForm.citizenship" class="mt-1 w-full rounded-xl border-slate-200"><option value="WNI">WNI</option><option value="WNA">WNA</option></select></label>
                        <label class="text-sm font-bold">NPWP<input v-model="clientForm.npwp" maxlength="100" class="mt-1 w-full rounded-xl border-slate-200" /></label>
                        <label class="text-sm font-bold sm:col-span-2">Alamat<textarea v-model="clientForm.address" rows="2" class="mt-1 w-full rounded-xl border-slate-200"></textarea></label>
                        <label class="text-sm font-bold">Negara<input v-model="clientForm.country" maxlength="100" class="mt-1 w-full rounded-xl border-slate-200" /></label>
                        <label v-for="field in ([['province', 'Provinsi'], ['city', 'Kota / Kabupaten'], ['district', 'Kecamatan'], ['village', 'Kelurahan / Desa']] as const)" :key="field[0]" class="text-sm font-bold">{{ field[1] }}<input v-model="clientForm[field[0]]" maxlength="100" class="mt-1 w-full rounded-xl border-slate-200" /></label>
                    </div>
                    <p v-if="(clientForm.errors.sourceInvoiceId || clientForm.errors.sourceQuotationId)" class="mt-3 text-sm font-bold text-rose-600">{{ (clientForm.errors.sourceInvoiceId || clientForm.errors.sourceQuotationId) }}</p>
                    <div class="mt-5 flex justify-end gap-2"><button type="button" @click="emit('close')" :disabled="clientForm.processing" class="rounded-xl border px-4 py-2 font-bold">Batal</button><button :disabled="clientForm.processing" class="rounded-xl bg-amber-500 px-4 py-2 font-bold text-black disabled:opacity-50">{{ clientForm.processing ? 'Menyimpan...' : 'Simpan Client' }}</button></div>
                </form>
            </div>
    </Teleport>
</template>
