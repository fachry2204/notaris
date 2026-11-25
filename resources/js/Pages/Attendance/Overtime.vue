<script setup lang="ts">
import { nextTick, ref, watch } from 'vue';
import { Head, Link, useForm, usePage } from '@inertiajs/vue3';
import AppLayout from '@/Layouts/AppLayout.vue';
import { attendanceDuration } from '@/Utils/attendance';
defineProps<{ records: any; isManager: boolean }>();
const user = usePage<any>().props.auth?.user;
const selected = ref<any>(null);
const dialog = ref<HTMLElement | null>(null);
let trigger: HTMLElement | null = null;
watch(selected, async (value) => {
    if (value) { trigger = document.activeElement as HTMLElement; await nextTick(); dialog.value?.querySelector<HTMLButtonElement>('button')?.focus(); }
    else trigger?.focus();
});
const trap = (event: KeyboardEvent) => {
    if (event.key !== 'Tab') return;
    const controls = Array.from(dialog.value?.querySelectorAll<HTMLElement>('button:not([disabled]), textarea') || []);
    const first=controls[0], last=controls[controls.length-1];
    if (event.shiftKey && document.activeElement===first) { event.preventDefault(); last?.focus(); }
    else if (!event.shiftKey && document.activeElement===last) { event.preventDefault(); first?.focus(); }
};
const review = useForm({status:'APPROVED', review_notes:''});
const labels: Record<string,string> = {ACTIVE:'Sedang lembur', PENDING:'Menunggu pemeriksaan', APPROVED:'Lembur diterima', REJECTED:'Lembur ditolak'};
const notes = (row:any) => { try { return JSON.parse(row.attendance_notes || '{}'); } catch {return {};} };
const decide = (status:string) => {review.status=status; review.patch(`/dashboard/productivity/${encodeURIComponent(selected.value.user_id)}/overtime/${selected.value.id}`,{preserveScroll:true,onSuccess:()=>{selected.value=null;review.reset();}});};
</script>
<template>
<Head title="Data Lembur"/>
<AppLayout><main class="mx-auto max-w-6xl space-y-5 p-4 sm:p-6">
  <nav aria-label="Tab absensi" class="flex gap-2"><Link href="/dashboard/pegawai/absensi" class="rounded-xl border border-amber-200 bg-white px-4 py-3 font-bold text-amber-950">Absensi</Link><Link href="/dashboard/pegawai/absensi/overtime" class="rounded-xl bg-amber-100 px-4 py-3 font-bold text-amber-950">Lembur</Link></nav>
  <div><h1 class="font-serif text-3xl font-bold text-stone-900">Data Lembur</h1><p class="mt-2 text-sm text-stone-600">Pantau absensi mulai dan selesai lembur. Hanya lembur diterima yang dihitung dalam total lembur.</p></div>
  <article v-for="row in records.data" :key="row.id" class="rounded-2xl border border-[#e5d8c1] bg-[#fffcf6] p-5">
    <div class="flex flex-wrap items-start justify-between gap-3"><div><h2 class="font-bold text-stone-900">{{ row.staffName || 'Pegawai' }}</h2><p class="mt-1 text-sm text-stone-600">{{ row.date }} · {{ attendanceDuration(row.minutes) }}</p></div><span class="rounded-full px-3 py-1 text-xs font-bold" :class="row.status==='APPROVED' ? 'bg-emerald-100 text-emerald-900' : row.status==='REJECTED' ? 'bg-rose-100 text-rose-900' : 'bg-amber-100 text-amber-950'">{{ labels[row.status] }}</span></div>
    <p class="mt-3 break-words text-sm text-stone-700">{{ row.reason }}</p>
    <button type="button" class="mt-4 min-h-11 rounded-xl border border-amber-700 px-4 font-bold text-amber-900" @click="selected=row;review.clearErrors();review.reset()">Lihat Detail Lembur</button>
  </article>
  <p v-if="!records.data.length" class="rounded-2xl bg-white p-6 text-stone-600">Belum ada data lembur.</p>
  <nav class="flex flex-wrap gap-2" aria-label="Halaman lembur"><template v-for="(link,i) in records.links" :key="i"><Link v-if="link.url" :href="link.url" class="rounded-lg border border-amber-200 bg-white px-3 py-2 text-stone-900" :aria-current="link.active ? 'page' : undefined"><span v-html="link.label"/></Link></template></nav>
</main>
<Teleport to="body"><div v-if="selected" class="fixed inset-0 z-[120] flex items-center justify-center bg-stone-950/60 p-4" @click.self="!review.processing && (selected=null)" @keydown.esc="!review.processing && (selected=null)"><section ref="dialog" @keydown="trap" role="dialog" aria-modal="true" aria-labelledby="overtime-detail-title" class="max-h-[85dvh] w-full max-w-xl overflow-y-auto overscroll-contain rounded-2xl bg-[#fffcf6] p-5 text-stone-900">
  <div class="flex items-center justify-between gap-3"><h2 id="overtime-detail-title" class="font-serif text-xl font-bold">Detail Lembur · {{ selected.staffName }}</h2><button autofocus type="button" aria-label="Tutup detail lembur" :disabled="review.processing" class="min-h-11 min-w-11 font-bold" @click="selected=null">✕</button></div>
  <p class="mt-3 font-bold">{{ labels[selected.status] }}</p><p class="mt-2 break-words">Alasan: {{ selected.reason }}</p><p class="mt-3">Mulai: {{ selected.start_at }}</p><p>Selesai: {{ selected.end_at || 'Belum selesai' }}</p><p>Durasi: {{ attendanceDuration(selected.minutes) }}</p>
  <div v-for="(evidence,key) in notes(selected)" :key="key" class="mt-4 rounded-xl border border-amber-200 p-3"><p class="font-bold">{{ String(key)==='start' ? 'Absen Mulai' : 'Absen Selesai' }}</p><p class="mt-1 text-sm">{{ evidence.workLocationType }} · {{ evidence.locationLabel }}</p><p class="text-xs">GPS: {{ evidence.latitude }}, {{ evidence.longitude }}</p><img v-if="evidence.photoPath" :src="evidence.photoPath" alt="Selfie absensi lembur" class="mt-3 max-h-60 w-full rounded-xl object-contain"/></div>
  <p v-if="selected.review_notes" class="mt-4">Catatan pemeriksaan: {{ selected.review_notes }}</p>
  <div v-if="isManager && selected.user_id!==user?.id && selected.status==='PENDING'" class="mt-5 space-y-3"><label class="block text-sm font-bold">Catatan pemeriksaan (wajib jika ditolak)<textarea v-model="review.review_notes" maxlength="2000" rows="3" class="mt-2 w-full rounded-xl border border-amber-200 bg-white p-3"/></label><p v-if="review.hasErrors" role="alert" class="text-sm text-rose-700">{{ Object.values(review.errors).join(' ') }}</p><div class="flex flex-wrap gap-3"><button :disabled="review.processing" class="min-h-11 rounded-xl bg-emerald-700 px-4 font-bold text-white disabled:opacity-50" @click="decide('APPROVED')">Terima Lembur</button><button :disabled="review.processing" class="min-h-11 rounded-xl bg-rose-700 px-4 font-bold text-white disabled:opacity-50" @click="decide('REJECTED')">Tolak Lembur</button></div></div>
</section></div></Teleport>
</AppLayout>
</template>


