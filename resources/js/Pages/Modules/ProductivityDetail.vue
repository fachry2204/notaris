<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref } from "vue";
import { Head, Link, router, useForm, usePage } from "@inertiajs/vue3";
import { ArrowLeft, FileDown, BriefcaseBusiness, CheckCircle2, ClockAlert, ListChecks, Users, CalendarDays, BarChart3, ClipboardList, FolderOpen, UserRound } from "@lucide/vue";
import AppLayout from "@/Layouts/AppLayout.vue";
import KpiAttendance from "@/Components/KpiAttendance.vue";
import "@/../css/productivity.css";
const page = usePage<any>();
const canViewStaff = computed(() => ["ADMINISTRATOR", "PIMPINAN"].includes(page.props.auth?.user?.role));
const props = defineProps<{ employee: any; periodLabel: string; filters: { start_date: string | null; end_date: string | null; sort: string }; jobs: any[]; tasks: any[]; attendance: any[]; attendanceStartTime: string; attendanceGraceMinutes: number; overtimeRequests: any[]; kpiScore: any; evaluation: any | null }>();
const e = props.employee;
const evaluationForm = useForm({ start_date: props.filters.start_date || "", end_date: props.filters.end_date || "", notes: props.evaluation?.notes || "", improvement_plan: props.evaluation?.improvement_plan || "", next_target: props.evaluation?.next_target || "" });
const saveEvaluation = () => evaluationForm.put(`/dashboard/productivity/${encodeURIComponent(e.id)}/evaluation`, { preserveScroll: true });

const filter = reactive({ start_date: props.filters.start_date || "", end_date: props.filters.end_date || "", sort: props.filters.sort });
const error = ref("");
const photoUnavailable = ref(false);
const exporting = ref(false);
const exportError = ref("");
const previewUrl = ref("");
const previewFilename = ref("");
const previewPages = ref(0);
const previewCanvas = ref<HTMLCanvasElement | null>(null);
const previewPage = ref(1);
const previewScale = ref(1.2);
const previewRenderError = ref("");
const previewRendering = ref(false);
let pdfDocument: any = null;
let renderJob: any = null;
let renderVersion = 0;
const renderPreview = async () => {
    if (!pdfDocument) return;
    const version = ++renderVersion;
    if (renderJob) { renderJob.cancel(); renderJob = null; }
    previewRendering.value = true;
    try {
        const pdfPage = await pdfDocument.getPage(previewPage.value);
        await nextTick();
        if (version !== renderVersion || !previewCanvas.value) return;
        const viewport = pdfPage.getViewport({ scale: previewScale.value });
        const canvas = previewCanvas.value;
        const context = canvas.getContext("2d");
        if (!context) throw new Error("Canvas tidak tersedia");
        canvas.width = Math.ceil(viewport.width); canvas.height = Math.ceil(viewport.height);
        renderJob = pdfPage.render({ canvasContext: context, viewport });
        await renderJob.promise;
        if (version === renderVersion) previewRenderError.value = "";
    } catch (error: any) {
        if (version === renderVersion && error?.name !== "RenderingCancelledException") previewRenderError.value = "Pratinjau tidak dapat ditampilkan. Unduh PDF untuk membukanya.";
    } finally { if (version === renderVersion) { previewRendering.value = false; renderJob = null; } }
};
const movePreview = (delta: number) => { previewPage.value = Math.min(previewPages.value, Math.max(1, previewPage.value + delta)); void renderPreview(); };
const zoomPreview = (delta: number) => { previewScale.value = Math.min(2, Math.max(0.6, Math.round((previewScale.value + delta) * 10) / 10)); void renderPreview(); };

const closePreview = () => { ++renderVersion; if (renderJob) { renderJob.cancel(); renderJob = null; } if (pdfDocument) { void pdfDocument.destroy(); pdfDocument = null; } previewRenderError.value = ""; if (previewUrl.value) URL.revokeObjectURL(previewUrl.value); previewUrl.value = ""; previewFilename.value = ""; };
const onPreviewKeydown = (event: KeyboardEvent) => { if (event.key === "Escape" && previewUrl.value) closePreview(); };
onMounted(() => window.addEventListener("keydown", onPreviewKeydown));
onBeforeUnmount(() => { window.removeEventListener("keydown", onPreviewKeydown); closePreview(); });
const downloadPreview = () => { const a = document.createElement("a"); a.href = previewUrl.value; a.download = previewFilename.value; document.body.appendChild(a); a.click(); a.remove(); };

const downloadPdf = async () => {
    exporting.value = true;
    exportError.value = "";
    try {
        const { createEmployeeKpiPdf } = await import("@/Utils/downloadEmployeeKpiPdf");
        const params = new URLSearchParams({ report: "1", sort: props.filters.sort });
        if (props.filters.start_date && props.filters.end_date) {
            params.set("start_date", props.filters.start_date);
            params.set("end_date", props.filters.end_date);
        }
        const response = await fetch(`${window.location.pathname}?${params}`, { headers: { Accept: "application/json" }, credentials: "same-origin" });
        if (!response.ok) throw new Error("Gagal mengambil data laporan");
        const report = await createEmployeeKpiPdf(await response.json(), page.props.branding);
        closePreview();
        previewFilename.value = report.filename;
        previewPages.value = report.pages;
        previewUrl.value = URL.createObjectURL(report.blob);
        const currentUrl = previewUrl.value;
        previewPage.value = 1; previewScale.value = 1.2;
        try {
            const pdfjs = await import("pdfjs-dist");
            const workerUrl = (await import("pdfjs-dist/build/pdf.worker.min.mjs?url")).default;
            pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
            const document = await pdfjs.getDocument({ data: await report.blob.arrayBuffer() }).promise;
            if (previewUrl.value !== currentUrl) { await document.destroy(); return; }
            pdfDocument = document;
            await renderPreview();
        } catch { if (previewUrl.value === currentUrl) previewRenderError.value = "Pratinjau tidak dapat ditampilkan. Unduh PDF untuk membukanya."; }
    } catch {
        exportError.value = "PDF tidak dapat dibuat. Silakan coba kembali.";
    } finally {
        exporting.value = false;
    }
};
const applyFilter = () => {
    error.value = "";
    if ((filter.start_date && !filter.end_date) || (!filter.start_date && filter.end_date) || (filter.start_date && filter.end_date && filter.start_date > filter.end_date)) {
        error.value = "Pilih tanggal mulai dan akhir yang valid.";
        return;
    }
    if (filter.start_date && filter.end_date) {
        const [sy, sm] = filter.start_date.split("-").map(Number);
        const [ey, em] = filter.end_date.split("-").map(Number);
        if ((ey - sy) * 12 + em - sm > 23) { error.value = "Rentang tanggal maksimal 24 bulan."; return; }
    }
    router.get(window.location.pathname, { ...filter }, { preserveState: false, preserveScroll: true });
};
const resetFilter = () => router.get(window.location.pathname, {}, { preserveState: false, preserveScroll: true });
const completionRate = computed(() => e.completed + e.processing ? Math.round(e.completed / (e.completed + e.processing) * 100) + "%" : "—");
const punctualRate = computed(() => e.workingDays !== null && e.presentDays ? Math.round(Math.max(0, e.presentDays - e.lateDays) / e.presentDays * 100) + "%" : "—");
const cards = computed(() => [
    { label: "Berkas PIC", value: e.totalJobs, note: "Seluruh status", icon: BriefcaseBusiness, color: "blue" },
    { label: "Berkas selesai", value: e.completed, note: "Status saat ini selesai", icon: CheckCircle2, color: "green" },
    { label: "Berkas aktif", value: e.processing, note: `${e.overdue} melewati deadline`, icon: ClockAlert, color: "amber" },
    { label: "Tingkat penyelesaian", value: completionRate.value, note: "Selesai / (selesai + aktif)", icon: ListChecks, color: "violet" },
    { label: "Total tugas", value: e.totalTasks, note: `${e.picTasks} PIC · ${e.witnessTasks} saksi`, icon: Users, color: "slate" },
    { label: "Hadir", value: e.workingDays === null ? "—" : e.presentDays, note: `Hari dengan check-in · ${props.periodLabel}`, icon: CalendarDays, color: "teal" },
    { label: "Terlambat", value: e.workingDays === null ? "—" : e.lateDays, note: `Melewati jam ${props.attendanceStartTime} + toleransi ${props.attendanceGraceMinutes} menit`, icon: ClockAlert, color: "orange" },
    { label: "Tepat waktu", value: punctualRate.value, note: "Hari hadir tidak terlambat / hadir", icon: CheckCircle2, color: "mint" },
]);
const date = (v?: string | null) => v ? new Date(String(v).slice(0, 10) + "T00:00:00").toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : "—";
</script>
<template>
<Head :title="`KPI ${employee.fullName || employee.username}`" />
<AppLayout>
<main class="kpi-page mx-auto max-w-[1600px] space-y-5 p-3 sm:p-5">
  <div>
    <p class="kpi-muted text-sm">Dashboard / Pegawai / Produktivitas / Detail KPI</p>
    <Link href="/dashboard/productivity" class="kpi-back mt-3 inline-flex items-center gap-2"><ArrowLeft class="h-4 w-4" /> Kembali ke Produktivitas</Link>
    <h1 class="mt-4 text-2xl font-black sm:text-3xl">Detail KPI Pegawai</h1>
    <p class="kpi-muted mt-1">Pantau kinerja pekerjaan, tugas, dan kehadiran pegawai.</p>
  </div>
  <header class="kpi-card profile-card flex flex-wrap items-center justify-between gap-5">
    <div class="flex min-w-0 items-center gap-4">
      <span class="kpi-avatar profile-photo overflow-hidden"><img v-if="employee.photoPath && !photoUnavailable" :src="employee.photoPath" :alt="`Foto ${employee.fullName || employee.username}`" class="h-full w-full object-cover" @error="photoUnavailable = true" /><template v-else>{{ String(employee.fullName || employee.username || '?').split(/\s+/).slice(0,2).map((x: string) => x[0]).join('').toUpperCase() }}</template></span>
      <div class="min-w-0"><h2 class="break-words text-2xl font-black">{{ employee.fullName || employee.username }}</h2><p class="profile-role mt-2 inline-flex items-center gap-2"><UserRound class="h-4 w-4" /> {{ employee.role }}</p><p class="kpi-muted mt-2 text-sm">{{ employee.username }}</p></div>
    </div>
    <div class="flex flex-wrap gap-2"><Link v-if="canViewStaff" :href="`/dashboard/pegawai/${encodeURIComponent(employee.id)}`" class="kpi-button-secondary">Data Pegawai</Link><button type="button" class="kpi-button" :disabled="exporting" @click="downloadPdf"><FileDown class="h-4 w-4" /> {{ exporting ? 'Menyiapkan PDF...' : 'Preview & Download PDF' }}</button></div>
  </header>
  <p v-if="exportError" role="alert" class="rounded-xl bg-red-50 p-3 text-sm text-red-800">{{ exportError }}</p>
  <section class="kpi-card"><div class="flex items-center gap-2"><CalendarDays class="h-5 w-5 text-amber-700" /><h2 class="kpi-title">Periode dan urutan</h2></div><p class="kpi-muted mt-1 text-sm">Untuk satu hari, pilih tanggal yang sama pada kedua kolom. Maksimal 24 bulan.</p><form @submit.prevent="applyFilter" class="mt-4 flex flex-wrap items-end gap-3"><label>Dari<input v-model="filter.start_date" type="date" class="mt-1" /></label><label>Sampai<input v-model="filter.end_date" type="date" class="mt-1" /></label><label>Urutan tanggal<select v-model="filter.sort" class="mt-1"><option value="desc">Terbaru dulu</option><option value="asc">Terlama dulu</option></select></label><button class="kpi-button">Terapkan</button><button type="button" class="kpi-button-secondary" @click="resetFilter">Reset</button></form><p v-if="error" role="alert" class="mt-2 text-sm text-red-700">{{ error }}</p><p class="kpi-note mt-4">{{ filters.start_date ? `Periode ${periodLabel}. Berkas dan tugas berdasarkan tanggal dibuat; status dan deadline adalah kondisi saat ini.` : `Berkas dan tugas sepanjang waktu; absensi ${periodLabel}.` }} Absensi dibatasi sampai hari ini.</p></section>
  <section aria-labelledby="ringkasan-kpi"><div class="mb-3"><h2 id="ringkasan-kpi" class="section-heading">Ringkasan KPI</h2><p class="kpi-muted mt-1 text-sm">Gambaran kinerja dan kehadiran untuk periode yang dipilih.</p></div><div class="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 xl:grid-cols-4"><article v-for="card in cards" :key="card.label" class="kpi-card kpi-metric flex items-start gap-3" :class="`kpi-metric--${card.color}`"><span class="kpi-metric-icon grid h-11 w-11 shrink-0 place-items-center rounded-xl"><component :is="card.icon" class="h-5 w-5" /></span><div><p class="metric-label text-sm font-bold">{{ card.label }}</p><p class="kpi-stat mt-1">{{ card.value }}</p><p class="metric-note mt-2 text-xs">{{ card.note }}</p></div></article></div></section>
  <section class="kpi-card"><h2 class="kpi-title">Skor KPI berbasis data</h2><p class="kpi-muted mt-1 text-sm">{{ kpiScore.score === null ? 'Data belum mencukupi untuk skor keseluruhan.' : `Skor ${kpiScore.score} / 100` }} · Bahan evaluasi, bukan keputusan otomatis.</p><div class="mt-4 grid gap-2 md:grid-cols-3"><div v-for="item in kpiScore.components" :key="item.label" class="kpi-note"><strong>{{ item.label }} ({{ item.weight }}%)</strong><p class="mt-1">{{ item.score === null ? 'Data belum mencukupi' : `${item.score}% · ${item.numerator}/${item.denominator}` }}</p></div></div><p class="kpi-muted mt-3 text-sm">Tugas belum diketahui: {{ kpiScore.unknownTasks }} · Dibatalkan: {{ kpiScore.excludedCancelled }}. Ketepatan target hanya untuk tugas selesai dengan target dan tanggal selesai; ketepatan hadir hanya dari hari check-in.</p></section>
  <section class="kpi-card"><h2 class="kpi-title">Evaluasi Pimpinan</h2><p class="kpi-muted mt-1 text-sm">Catatan, rencana perbaikan, dan target disimpan untuk periode tanggal yang dipilih.</p><p v-if="!filters.start_date" class="kpi-note mt-3">Pilih dan terapkan tanggal awal serta akhir untuk melihat atau menyimpan evaluasi.</p><form v-else-if="canViewStaff" class="mt-4 space-y-3" @submit.prevent="saveEvaluation"><label class="block">Catatan pimpinan<textarea v-model="evaluationForm.notes" maxlength="5000" class="mt-1 w-full rounded-lg border border-stone-300 p-2"></textarea></label><label class="block">Rencana perbaikan<textarea v-model="evaluationForm.improvement_plan" maxlength="5000" class="mt-1 w-full rounded-lg border border-stone-300 p-2"></textarea></label><label class="block">Target periode berikutnya<textarea v-model="evaluationForm.next_target" maxlength="5000" class="mt-1 w-full rounded-lg border border-stone-300 p-2"></textarea></label><p v-if="evaluationForm.hasErrors" role="alert" class="text-sm text-red-700">{{ Object.values(evaluationForm.errors).join(' ') }}</p><p v-if="evaluationForm.recentlySuccessful" role="status" class="text-sm text-green-700">Evaluasi tersimpan.</p><button class="save-action kpi-button" :disabled="evaluationForm.processing">Simpan Evaluasi</button></form><div v-else-if="evaluation" class="mt-4 space-y-2 text-sm"><p><strong>Catatan:</strong> {{ evaluation.notes || '—' }}</p><p><strong>Rencana perbaikan:</strong> {{ evaluation.improvement_plan || '—' }}</p><p><strong>Target:</strong> {{ evaluation.next_target || '—' }}</p></div><p v-else class="kpi-muted mt-3 text-sm">Belum ada evaluasi untuk periode ini.</p></section>
  <div class="grid items-start gap-4 xl:grid-cols-2">
    <section class="kpi-card"><div class="section-title"><FolderOpen class="h-5 w-5" /><h2 class="kpi-title">Rincian Kinerja Berkas</h2></div><p class="kpi-muted mt-1 text-sm">Maksimal 10 berkas berdasarkan tanggal dibuat.</p><div class="mt-4 overflow-x-auto"><table class="kpi-table detail-table"><thead><tr><th>Nomor Berkas</th><th>Pekerjaan</th><th>Kategori</th><th>Deadline</th><th>Status</th><th>Aksi</th></tr></thead><tbody><tr v-for="job in jobs" :key="job.jobType + job.id"><td>{{ job.trackingCode || '—' }}</td><td class="font-bold">{{ job.title }}</td><td>{{ job.category }}</td><td>{{ date(job.deadline) }}</td><td><span class="kpi-chip">{{ job.status }}</span></td><td><Link :href="`/dashboard/jobs/${job.jobType}/${job.id}`" class="kpi-back">Detail ↗</Link></td></tr><tr v-if="!jobs.length"><td colspan="6" class="kpi-muted">Belum ada berkas sebagai PIC.</td></tr></tbody></table></div></section>
    <section class="kpi-card"><div class="section-title"><BarChart3 class="h-5 w-5" /><h2 class="kpi-title">Komposisi Pekerjaan PIC</h2></div><p class="kpi-muted mt-1 text-sm">Status saat ini; dibatalkan tidak dihitung dalam tingkat penyelesaian.</p><div class="chart-layout mt-5"><div class="donut" :style="{ '--progress': completionRate === '—' ? '0%' : completionRate }" role="img" :aria-label="`Tingkat penyelesaian ${completionRate}`"><div><strong>{{ completionRate }}</strong><span>Selesai</span></div></div><div class="chart-legend"><div><span><i class="legend-dot legend-green"></i>Selesai</span><strong>{{ e.completed }}</strong></div><div><span><i class="legend-dot legend-blue"></i>Aktif</span><strong>{{ e.processing }}</strong></div><div><span><i class="legend-dot legend-grey"></i>Dibatalkan</span><strong>{{ e.cancelled }}</strong></div><div class="legend-total"><span>Total berkas PIC</span><strong>{{ e.totalJobs }}</strong></div></div></div></section>
    <section class="kpi-card xl:col-span-2"><div class="section-title"><BarChart3 class="h-5 w-5" /><h2 class="kpi-title">Ringkasan Kehadiran</h2></div><p class="kpi-muted mt-1 text-sm">Perkiraan Senin–Jumat sejak profil pegawai dibuat dan sampai hari ini.</p><div v-if="e.workingDays !== null" class="mt-4 grid grid-cols-3 gap-2"><div v-for="item in [{label:'Hari kerja',value:e.workingDays},{label:'Hadir',value:e.presentDays},{label:'Belum ada absensi',value:e.absentDays}]" :key="item.label" class="kpi-note"><p class="text-xl font-black">{{ item.value }}</p><p>{{ item.label }}</p></div></div><p v-else class="kpi-muted mt-4 text-sm">Profil absensi belum tersedia.</p><p class="kpi-note mt-4">Belum ada absensi bukan konfirmasi mangkir; libur, cuti, jadwal khusus, dan tanggal masuk kerja belum diperhitungkan.</p></section>
    <KpiAttendance :employee-id="employee.id" :period-label="periodLabel" :attendance="attendance" :start-time="attendanceStartTime" :overtime-requests="overtimeRequests" />
  </div>
  <section class="kpi-card" aria-labelledby="daftar-tugas-title">
    <div class="section-title"><ClipboardList class="h-5 w-5"/><h2 id="daftar-tugas-title" class="kpi-title">Daftar Tugas</h2></div>
    <p class="kpi-muted mt-1 text-sm">Maksimal 10 penugasan sesuai urutan tanggal.</p>
    <div class="mt-4 overflow-x-auto rounded-xl border border-[#eee7dc]">
      <table class="kpi-table" style="min-width:560px;table-layout:fixed">
        <caption class="sr-only">Daftar tugas pegawai pada periode yang dipilih</caption>
        <colgroup><col style="width:52px"/><col style="width:28%"/><col/><col style="width:150px"/></colgroup>
        <thead><tr><th scope="col" class="text-center">No.</th><th scope="col">Tugas</th><th scope="col">Berkas / Pekerjaan</th><th scope="col">Tanggal Penugasan</th></tr></thead>
        <tbody>
          <tr v-for="(task,index) in tasks" :key="task.id"><td class="text-center text-stone-500">{{ index+1 }}</td><td class="break-words font-semibold">{{ task.customTask || task.taskType || '—' }}<span v-if="task.customTask && task.taskType" class="kpi-muted mt-1 block text-xs">{{ task.taskType }}</span></td><td class="break-words">{{ task.jobTitle || 'Berkas tidak tersedia' }}</td><td class="whitespace-nowrap">{{ date(task.createdAt) }}</td></tr>
          <tr v-if="!tasks.length"><td colspan="4" class="kpi-muted py-6 text-center">Belum ada tugas.</td></tr>
        </tbody>
      </table>
    </div>
  </section>
  <section class="kpi-card" aria-labelledby="metode-kpi">
    <h2 id="metode-kpi" class="kpi-title">Metode dan batasan KPI</h2>
    <div class="kpi-muted mt-3 grid gap-3 text-sm md:grid-cols-2">
      <p><strong>Berkas dan tugas:</strong> berdasarkan tanggal dibuat. Status dan deadline berkas menunjukkan kondisi saat ini, bukan riwayat pada akhir periode.</p>
      <p><strong>Penyelesaian:</strong> berkas selesai dibagi jumlah berkas selesai dan aktif; berkas yang dibatalkan tidak dihitung. Tanpa dasar perhitungan, nilai tidak tersedia.</p>
      <p><strong>Kehadiran:</strong> hadir adalah hari dengan check-in; terlambat berarti check-in melewati {{ attendanceStartTime }} dan toleransi {{ attendanceGraceMinutes }} menit. Tepat waktu dihitung dari hari hadir yang tidak terlambat dibagi seluruh hari hadir.</p>
      <p><strong>Interpretasi:</strong> hari tanpa absensi bukan bukti mangkir. Ketepatan tugas hanya dihitung ketika status selesai, target dan tanggal penyelesaian tersedia.</p>
    </div>
  </section>
<Teleport to="body">
<div v-if="previewUrl" class="pdf-overlay" role="dialog" aria-modal="true" aria-labelledby="pdf-preview-title" @click.self="closePreview">
  <div class="pdf-modal">
    <div class="pdf-toolbar">
      <div><h2 id="pdf-preview-title" class="font-bold text-lg">Pratinjau Laporan KPI</h2><p class="text-sm text-stone-600">{{ previewPages }} halaman · Gunakan kontrol di bawah untuk navigasi dan zoom.</p></div>
      <div class="flex flex-wrap gap-2"><a :href="previewUrl" target="_blank" rel="noopener noreferrer" class="kpi-button-secondary">Buka untuk cetak</a><button type="button" class="kpi-button" @click="downloadPreview">Download PDF</button><button type="button" class="kpi-button-secondary" aria-label="Tutup pratinjau" @click="closePreview">Tutup</button></div>
    </div>
    <div class="pdf-controls"><button type="button" class="kpi-button-secondary" :disabled="previewPage <= 1 || previewRendering" @click="movePreview(-1)">Sebelumnya</button><span>Halaman {{ previewPage }} / {{ previewPages }}</span><button type="button" class="kpi-button-secondary" :disabled="previewPage >= previewPages || previewRendering" @click="movePreview(1)">Berikutnya</button><button type="button" class="kpi-button-secondary" :disabled="previewScale <= 0.6 || previewRendering" @click="zoomPreview(-0.2)" aria-label="Perkecil">−</button><span>{{ Math.round(previewScale * 100) }}%</span><button type="button" class="kpi-button-secondary" :disabled="previewScale >= 2 || previewRendering" @click="zoomPreview(0.2)" aria-label="Perbesar">+</button></div>
    <div class="pdf-frame" aria-label="Pratinjau laporan KPI pegawai"><p v-if="previewRenderError" role="alert">{{ previewRenderError }}</p><canvas ref="previewCanvas" aria-label="Halaman laporan KPI"></canvas></div>
    <p class="pdf-help">Jika pratinjau tidak tersedia di browser Anda, pilih Download PDF atau buka dokumen untuk mencetak.</p>
  </div>
</div>
</Teleport>
</main>
</AppLayout>
</template>

<style scoped>
.pdf-overlay { position:fixed; inset:0; z-index:100; display:flex; align-items:center; justify-content:center; padding:16px; background:rgba(22,18,12,.7); }
.pdf-modal { display:flex; flex-direction:column; width:min(1100px,100%); height:min(92vh,1000px); overflow:hidden; background:#f8f4eb; border-radius:16px; box-shadow:0 16px 60px #0005; }
.pdf-toolbar { display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:12px; padding:16px; color:#291d14; }
.pdf-controls { display:flex; align-items:center; justify-content:center; gap:8px; flex-wrap:wrap; padding:8px; color:#291d14; }.pdf-frame { width:100%; flex:1; min-height:0; overflow:auto; text-align:center; background:#e6e0d6; padding:16px; }.pdf-frame canvas { display:block; max-width:none; margin:0 auto; background:white; box-shadow:0 2px 12px #0003; }
.pdf-help { padding:8px 16px; color:#665647; font-size:.75rem; }

.profile-card { background: linear-gradient(110deg,#fff 65%,#fcf6e9); }
.profile-photo { width:76px; height:76px; border-radius:16px; font-size:1.5rem; }
.profile-role { border-radius:999px; background:#f5e8ca; color:#765000; padding:5px 10px; font-size:.8rem; font-weight:700; }
.section-heading { border-left:4px solid #bc8b1b; padding-left:10px; font-size:1.2rem; font-weight:800; }
.section-title { display:flex; align-items:center; gap:9px; color:#a76d00; }
.metric-label { color:#453b33; }.metric-note { color:#5d534b; }
.detail-table { min-width:660px; }
.record-row { border-bottom:1px solid #eee7dc; }
.chart-layout { display:flex; align-items:center; flex-wrap:wrap; gap:24px; }
.donut { width:140px; height:140px; flex:none; border-radius:50%; display:grid; place-items:center; background:conic-gradient(#27945a var(--progress),#dce4ec 0); }
.donut > div { width:100px; height:100px; border-radius:50%; background:#fff; display:flex; flex-direction:column; align-items:center; justify-content:center; }
.donut strong { font-size:1.5rem; }.donut span { color:#6e665f; font-size:.75rem; }
.chart-legend { flex:1; min-width:180px; font-size:.85rem; }.chart-legend > div { display:flex; justify-content:space-between; gap:12px; padding:7px 0; }.legend-total { border-top:1px solid #eee7dc; margin-top:5px; }.legend-dot { display:inline-block; width:10px; height:10px; border-radius:50%; margin-right:8px; }.legend-green { background:#27945a; }.legend-blue { background:#9eb9d2; }.legend-grey { background:#a6a7ac; }
.kpi-metric { border-color: var(--metric-border); background: var(--metric-bg); }
.kpi-metric-icon { color: var(--metric-ink); background: var(--metric-icon); }
.kpi-metric--blue { --metric-bg:#eef5ff; --metric-border:#c3d9f5; --metric-ink:#1b5494; --metric-icon:#d9eafd; }
.kpi-metric--green { --metric-bg:#edf9f0; --metric-border:#bee3c7; --metric-ink:#187441; --metric-icon:#d7f2df; }
.kpi-metric--amber { --metric-bg:#fff7e6; --metric-border:#efd29b; --metric-ink:#875a05; --metric-icon:#ffebbd; }
.kpi-metric--violet { --metric-bg:#f5f0ff; --metric-border:#dfcef6; --metric-ink:#684097; --metric-icon:#e9defb; }
.kpi-metric--slate { --metric-bg:#f0f4f8; --metric-border:#cedce9; --metric-ink:#425a73; --metric-icon:#dfe8f1; }
.kpi-metric--teal { --metric-bg:#eaf9f6; --metric-border:#b7e1da; --metric-ink:#12665b; --metric-icon:#d2f1ea; }
.kpi-metric--orange { --metric-bg:#fff1eb; --metric-border:#f2ccb9; --metric-ink:#a34818; --metric-icon:#ffe2d1; }
.kpi-metric--mint { --metric-bg:#f1f9ea; --metric-border:#cde4bd; --metric-ink:#466e22; --metric-icon:#e3f2d6; }
</style>
