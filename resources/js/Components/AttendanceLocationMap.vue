<script setup lang="ts">
import { computed } from 'vue';
const props = withDefaults(defineProps<{ latitude: number | string | null | undefined; longitude: number | string | null | undefined; title?: string }>(), { title: 'Peta lokasi absensi' });
const coordinates = computed(() => {
    if (props.latitude == null || props.longitude == null || String(props.latitude).trim() === '' || String(props.longitude).trim() === '') return null;
    const lat = Number(props.latitude), lon = Number(props.longitude);
    return Number.isFinite(lat) && Number.isFinite(lon) && Math.abs(lat)<=90 && Math.abs(lon)<=180 ? `${lat},${lon}` : null;
});
const embedUrl = computed(() => coordinates.value ? `https://www.google.com/maps?${new URLSearchParams({ q: coordinates.value, z: '17', hl: 'id', output: 'embed' })}` : null);
const openUrl = computed(() => coordinates.value ? `https://www.google.com/maps/search/?${new URLSearchParams({ api: '1', query: coordinates.value })}` : null);
</script>
<template>
  <div v-if="embedUrl" class="min-w-0 space-y-2">
    <iframe :src="embedUrl" :title="title" loading="lazy" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen class="block h-64 w-full rounded-xl border border-stone-200 bg-stone-100"/>
    <a :href="openUrl!" target="_blank" rel="noopener noreferrer" class="inline-flex min-h-11 items-center rounded-lg px-2 text-xs font-bold text-amber-900 underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-700">Buka di Google Maps ↗</a>
  </div>
  <p v-else class="text-xs text-stone-500">Koordinat tidak tersedia pada catatan ini.</p>
</template>
