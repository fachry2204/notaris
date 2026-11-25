<script setup lang="ts">
import { Link } from '@inertiajs/vue3';
import { Clock3 } from '@lucide/vue';
defineProps<{ active?: any }>();
</script>
<template>
  <div class="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-950">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div><p class="font-bold">{{ active ? 'Lembur sedang berlangsung' : 'Absensi Lembur' }}</p><p class="mt-1 text-sm">{{ active ? active.reason : 'Isi alasan, ambil selfie dan catat lokasi untuk mulai lembur.' }}</p><p v-if="active" class="mt-1 text-xs">Mulai: {{ active.start_at }} · Catat waktu selesai saat pekerjaan berakhir.</p></div>
      <Link :href="`/dashboard/pegawai/absensi/absenku?action=${active ? 'overtime-finish' : 'overtime-start'}`" class="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-amber-800 px-5 py-3 font-bold text-white hover:bg-amber-900"><Clock3 class="h-5 w-5"/>{{ active ? 'Selesai Lembur' : 'Lembur' }}</Link>
    </div>
  </div>
</template>
