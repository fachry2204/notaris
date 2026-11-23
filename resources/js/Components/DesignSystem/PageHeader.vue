<script setup lang="ts">
import { Link } from '@inertiajs/vue3';
defineProps<{ title: string; description?: string; section?: string; hideMobileIcon?: boolean }>();
</script>
<template>
<header class="ds-page-header flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
  <div class="flex min-w-0 items-center gap-3"><span v-if="$slots.icon" class="h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[var(--primary)]/10 text-[var(--primary)]" :class="hideMobileIcon ? 'hidden lg:grid' : 'grid'"><slot name="icon" /></span><div class="min-w-0"><nav class="ds-breadcrumb hidden text-xs lg:block" aria-label="Breadcrumb"><Link href="/dashboard">Dashboard</Link><span aria-hidden="true"> / </span><span>{{ section || title }}</span></nav><h1 class="text-xl font-black text-slate-900 sm:text-2xl">{{ title }}</h1><p v-if="description" class="text-xs font-medium text-slate-500 sm:text-sm">{{ description }}</p></div></div>
  <div v-if="$slots.summary" class="sm:mx-auto"><slot name="summary" /></div>
  <div v-if="$slots.actions" class="flex flex-wrap items-center gap-2"><slot name="actions" /></div>
</header>
</template>
<style scoped>
.ds-breadcrumb { color:#a5a5a5; margin-bottom:.45rem; }
.ds-breadcrumb a:hover { color:#d4af37; }
@media (min-width:1024px) { .ds-page-header { padding:1.4rem 1.5rem; border:1px solid rgba(212,175,55,.25); border-radius:1rem; background:linear-gradient(110deg,#191710,#111); } }
</style>
