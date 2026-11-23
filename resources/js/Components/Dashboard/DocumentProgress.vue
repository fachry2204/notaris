<script setup lang="ts">
import { computed } from 'vue';
import { Link } from '@inertiajs/vue3';
import { ChartNoAxesCombined, FolderKanban } from '@lucide/vue';
const p = defineProps<{ stats: Record<string, number>; categories: Record<string, number> }>();
const percent = computed(() => p.stats.total ? Math.round((p.stats.completed || 0) * 100 / p.stats.total) : 0);
const categoryItems = computed(() => [
    { label: 'Badan Hukum / Usaha', count: p.categories?.badan_hukum || 0 },
    { label: 'Non Badan Hukum', count: p.categories?.non_badan_hukum || 0 },
    { label: 'PPAT', count: p.categories?.ppat || 0 },
]);
</script>
<template>
<section class="grid gap-5 xl:grid-cols-2">
  <article class="rounded-2xl border border-[#d4af37]/25 bg-[#191919] p-5 text-[#f5f5f5]"><h2 class="flex items-center gap-2 text-lg font-black"><ChartNoAxesCombined class="h-5 w-5 text-[#d4af37]"/>Progress Penyelesaian Berkas</h2><div class="mt-5 flex items-center gap-5"><div class="grid h-20 w-20 shrink-0 place-items-center rounded-full border-8 border-[#d4af37] text-lg font-black">{{ percent }}%</div><div class="flex-1"><p class="text-sm">{{ stats.completed || 0 }} dari {{ stats.total || 0 }} berkas selesai</p><div class="mt-3 h-2 overflow-hidden rounded-full bg-[#424242]"><div class="h-full rounded-full bg-[#d4af37]" :style="{width: `${percent}%`}" /></div><Link href="/dashboard/jobs?status=SELESAI" class="mt-3 inline-block text-xs font-bold text-[#f5d76e]">Lihat berkas selesai →</Link></div></div></article>
  <article class="rounded-2xl border border-[#d4af37]/25 bg-[#191919] p-5 text-[#f5f5f5]"><h2 class="flex items-center gap-2 text-lg font-black"><FolderKanban class="h-5 w-5 text-[#d4af37]"/>Berkas per Kategori</h2><p v-if="!stats.total" class="py-8 text-sm text-[#a3a3a3]">Belum ada berkas pada periode ini.</p><div v-else class="mt-3 divide-y divide-[#d4af37]/15"><div v-for="item in categoryItems" :key="item.label" class="flex items-center justify-between gap-3 py-3 text-sm"><span>{{ item.label }}</span><span class="font-bold text-[#f5d76e]">{{ item.count }} berkas</span></div></div></article>
</section>
</template>
