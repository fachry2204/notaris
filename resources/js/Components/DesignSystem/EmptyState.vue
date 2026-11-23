<script setup lang="ts">
import { FileSearch } from '@lucide/vue';
defineProps<{ title: string; description?: string }>();
</script>
<template><div class="px-5 py-12 text-center"><FileSearch aria-hidden="true" class="mx-auto h-9 w-9 text-[var(--primary)]"/><p class="mt-3 text-sm font-bold text-slate-800">{{ title }}</p><p v-if="description" class="mt-1 text-xs text-slate-500">{{ description }}</p></div></template>
