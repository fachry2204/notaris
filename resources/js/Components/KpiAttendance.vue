<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useForm, usePage } from '@inertiajs/vue3';
import { CalendarDays, Plus, X } from '@lucide/vue';
import { attendanceDuration, attendanceTime } from '@/Utils/attendance';

const props = defineProps<{ employeeId: string; periodLabel: string; attendance: any[]; overtimeRequests: any[]; startTime: string }>();
const page = usePage<any>();
const own = computed(() => page.props.auth?.user?.id === props.employeeId && page.props.auth?.user?.source === 'user');
const canReview = computed(() => !own.value && ['ADMINISTRATOR','PIMPINAN'].includes(page.props.auth?.user?.role));
const modal = ref(false);
const selected = ref<any>(null);
const form = useForm({ date: '', start_time: '', end_time: '', reason: '' });
const review = useForm({ status: 'APPROVED', review_notes: '' });
const localToday = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
const date = (value: string) => new Date(value.slice(0,10)+'T00:00:00').toLocaleDateString('id-ID',{day:'numeric',month:'short',year:'numeric'});
const labels: Record<string,string> = { ACTIVE:'Sedang lembur', PENDING:'Menunggu pemeriksaan', APPROVED:'Lembur diterima', REJECTED:'Lembur ditolak' };
const total = (field: string) => props.attendance.reduce((sum,row)=>sum+(row[field] ?? 0),0);
const close = () => { if (!form.processing && !review.processing) { modal.value=false; selected.value=null; } };
let trigger: HTMLElement | null = null;
watch([modal,selected],async ([opened,item])=>{
    if(opened || item){trigger=document.activeElement as HTMLElement;await nextTick();document.querySelector<HTMLElement>('.overtime-modal input, .overtime-modal textarea')?.focus();}
    else trigger?.focus();
});
const escape = (event: KeyboardEvent) => {
    if(!modal.value && !selected.value)return;
    if(event.key==='Escape')close();
    if(event.key==='Tab'){
        const elements=Array.from(document.querySelectorAll<HTMLElement>('.overtime-modal button:not([disabled]), .overtime-modal input, .overtime-modal textarea'));
        const first=elements[0],last=elements[elements.length-1];
        if(event.shiftKey && document.activeElement===first){event.preventDefault();last?.focus();}
        else if(!event.shiftKey && document.activeElement===last){event.preventDefault();first?.focus();}
    }
};
onMounted(()=>window.addEventListener('keydown',escape));
onBeforeUnmount(()=>window.removeEventListener('keydown',escape));
const submit = () => form.post(`/dashboard/productivity/${encodeURIComponent(props.employeeId)}/overtime`,{preserveScroll:true,onSuccess:()=>{modal.value=false;form.reset();}});
const openReview = (row: any,status: string) => { review.reset();review.clearErrors();review.status=status;selected.value=row; };
const submitReview = () => review.patch(`/dashboard/productivity/${encodeURIComponent(props.employeeId)}/overtime/${selected.value.id}`,{preserveScroll:true,onSuccess:()=>{selected.value=null;}});
</script>

<template>
<section class="kpi-card xl:col-span-2" aria-labelledby="kpi-attendance-title">
  <div class="flex flex-wrap items-center justify-between gap-3"><div class="section-title"><CalendarDays class="h-5 w-5"/><h2 id="kpi-attendance-title" class="kpi-title">Riwayat Absensi</h2></div><button v-if="own" type="button" class="kpi-button" @click="form.clearErrors();modal=true"><Plus class="h-4 w-4"/>Ajukan Lembur</button></div>
  <p class="kpi-muted mt-2 text-sm">{{ periodLabel }} · Jam masuk kantor {{ startTime }}. Total lembur hanya menghitung hasil yang diterima pimpinan.</p>
  <div class="mt-4 overflow-x-auto"><table class="kpi-table attendance-table"><thead><tr><th>Tanggal</th><th>Absen Masuk</th><th>Absen Pulang</th><th>Jam Kerja</th><th>Lembur</th><th>Menit Terlambat</th></tr></thead><tbody><tr v-for="(row,i) in attendance" :key="i"><td class="whitespace-nowrap font-semibold">{{ date(row.date) }}</td><td>{{ attendanceTime(row.checkIn) }}</td><td>{{ attendanceTime(row.checkOut) }}</td><td>{{ row.invalidInterval ? 'Waktu tidak valid' : attendanceDuration(row.workMinutes) }}</td><td><span class="kpi-chip" :class="row.overtimeMinutes ? 'overtime-approved' : ''">{{ attendanceDuration(row.overtimeMinutes) }}</span></td><td><span :class="row.lateMinutes ? 'kpi-chip kpi-chip-alert' : ''">{{ row.lateMinutes == null ? '-' : `${row.lateMinutes} menit` }}</span></td></tr><tr v-if="!attendance.length"><td colspan="6" class="kpi-muted">Belum ada catatan absensi periode ini.</td></tr></tbody><tfoot v-if="attendance.length"><tr class="font-bold"><td colspan="3">Total periode</td><td>{{ attendanceDuration(total('workMinutes')) }}</td><td>{{ attendanceDuration(total('overtimeMinutes')) }}</td><td>{{ total('lateMinutes') }} menit</td></tr></tfoot></table></div>
  <p class="kpi-note mt-3">Jam kerja adalah selisih absen masuk–pulang, termasuk waktu istirahat dan lembur. Catatan tanpa absen pulang belum dihitung. Menit terlambat adalah selisih dari jam masuk kantor, sebelum toleransi potongan payroll. Lembur merupakan durasi yang diterima pimpinan, termasuk hasil absensi mulai–selesai lembur; nominal upah lembur belum dihitung di sini.</p>
  <div class="mt-6"><h3 class="font-bold">Pengajuan Lembur</h3><div v-if="overtimeRequests.length" class="mt-3 overflow-x-auto"><table class="kpi-table attendance-table"><thead><tr><th>Tanggal / Waktu</th><th>Durasi</th><th>Keperluan</th><th>Status / Catatan</th><th v-if="canReview">Tindakan</th></tr></thead><tbody><tr v-for="item in overtimeRequests" :key="item.id"><td class="whitespace-nowrap">{{ date(item.date) }}<br/><span class="kpi-muted">{{ attendanceTime(item.start_at) }}–{{ attendanceTime(item.end_at) }}</span></td><td>{{ attendanceDuration(item.minutes) }}</td><td class="request-reason">{{ item.reason }}</td><td><span class="kpi-chip" :class="item.status==='APPROVED' ? 'overtime-approved' : item.status==='REJECTED' ? 'kpi-chip-alert' : ''">{{ labels[item.status] }}</span><p v-if="item.review_notes" class="mt-2 text-xs">{{ item.review_notes }}</p></td><td v-if="canReview"><div v-if="item.status==='PENDING'" class="flex gap-2"><button class="kpi-button-secondary" @click="openReview(item,'APPROVED')">Setujui</button><button class="kpi-button-secondary" @click="openReview(item,'REJECTED')">Tolak</button></div><span v-else class="kpi-muted">Sudah diperiksa</span></td></tr></tbody></table></div><p v-else class="kpi-muted mt-2 text-sm">Belum ada pengajuan lembur pada periode ini.</p></div>
</section>
<Teleport to="body">
  <div v-if="modal || selected" class="overtime-overlay" @click.self="close"><section class="overtime-modal" role="dialog" aria-modal="true" aria-labelledby="overtime-title"><div class="flex items-center justify-between gap-4"><h2 id="overtime-title" class="text-xl font-bold">{{ selected ? (review.status==='APPROVED' ? 'Setujui Lembur' : 'Tolak Pengajuan') : 'Ajukan Lembur' }}</h2><button type="button" aria-label="Tutup pengajuan lembur" class="p-3" @click="close"><X class="h-5 w-5"/></button></div>
    <form v-if="!selected" class="mt-4 space-y-4" @submit.prevent="submit"><p class="kpi-muted text-sm">Ajukan durasi lembur untuk tanggal dengan absen masuk. Jam mulai dan selesai harus dalam tanggal yang sama.</p><label>Tanggal<input v-model="form.date" required type="date" :max="localToday()"/></label><div class="grid grid-cols-2 gap-3"><label>Mulai Lembur<input v-model="form.start_time" type="time" required/></label><label>Selesai Lembur<input v-model="form.end_time" type="time" required/></label></div><label>Keperluan Lembur<textarea v-model="form.reason" required minlength="5" maxlength="2000" rows="3"/></label><p v-if="form.hasErrors" role="alert" class="text-sm text-red-700">{{ Object.values(form.errors).join(' ') }}</p><button class="kpi-button" :disabled="form.processing">{{ form.processing ? 'Mengirim...' : 'Kirim Pengajuan' }}</button></form>
    <form v-else class="mt-4 space-y-4" @submit.prevent="submitReview"><p>{{ date(selected.date) }} · {{ attendanceDuration(selected.minutes) }}</p><p>{{ selected.reason }}</p><label>Catatan {{ review.status==='REJECTED' ? '(wajib)' : '(opsional)' }}<textarea v-model="review.review_notes" :required="review.status==='REJECTED'" maxlength="2000" rows="3"/></label><p v-if="review.hasErrors" role="alert" class="text-sm text-red-700">{{ Object.values(review.errors).join(' ') }}</p><button class="kpi-button" :disabled="review.processing">{{ review.processing ? 'Menyimpan...' : 'Simpan Keputusan' }}</button></form>
  </section></div>
</Teleport>
</template>

<style scoped>
.section-title{display:flex;align-items:center;gap:8px}.attendance-table{min-width:720px}.attendance-table tfoot{background:#faf5ec}.overtime-approved{background:#e2f3e6;color:#22623a}.request-reason{min-width:180px;max-width:320px;overflow-wrap:anywhere}.overtime-overlay{position:fixed;inset:0;z-index:120;background:#201b15aa;display:flex;align-items:center;justify-content:center;padding:16px}.overtime-modal{width:min(560px,100%);max-height:calc(100dvh - 32px);overflow-y:auto;overscroll-behavior:contain;background:#fffcf6;border:1px solid #c8ad7f;border-radius:18px;padding:24px;color:#292c2d;box-shadow:0 16px 50px #0003}.overtime-modal label{display:block;font-size:.85rem;font-weight:600}.overtime-modal input,.overtime-modal textarea{display:block;width:100%;margin-top:6px;border:1px solid #d8ccbb;border-radius:9px;padding:10px;background:white;color:#292c2d}.overtime-modal button:disabled{opacity:.6}@media(max-width:600px){.overtime-modal{padding:16px}}
</style>

