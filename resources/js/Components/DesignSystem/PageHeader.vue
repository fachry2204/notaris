<script setup lang="ts">
import { Link } from '@inertiajs/vue3';
defineProps<{ title: string; description?: string; section?: string; hideMobileIcon?: boolean }>();
</script>

<template>
<header class="ds-page-header flex flex-col justify-between gap-4 sm:flex-row sm:items-center rounded-2xl border border-[#EAE3D2] bg-white p-5 sm:p-6 shadow-xs">
  <div class="flex min-w-0 items-center gap-3.5">
    <span v-if="$slots.icon" class="h-11 w-11 shrink-0 place-items-center rounded-xl bg-amber-100/70 text-amber-700" :class="hideMobileIcon ? 'hidden lg:grid' : 'grid'">
      <slot name="icon" />
    </span>
    <div class="min-w-0">
      <nav class="ds-breadcrumb hidden text-xs lg:block mb-1 font-medium text-stone-500" aria-label="Breadcrumb">
        <Link href="/dashboard" class="hover:text-amber-700 transition">Dashboard</Link>
        <span aria-hidden="true" class="mx-1.5 text-stone-300">/</span>
        <span class="text-stone-700 font-semibold">{{ section || title }}</span>
      </nav>
      <h1 class="text-xl font-black text-stone-900 sm:text-2xl tracking-tight">{{ title }}</h1>
      <p v-if="description" class="text-xs font-medium text-stone-500 sm:text-sm mt-0.5">{{ description }}</p>
    </div>
  </div>
  <div v-if="$slots.summary" class="sm:mx-auto"><slot name="summary" /></div>
  <div v-if="$slots.actions" class="flex flex-wrap items-center gap-2"><slot name="actions" /></div>
</header>
</template>

<style scoped>
@media (min-width: 1024px) {
  .ds-page-header {
    background: #ffffff;
    border-color: #EAE3D2;
    box-shadow: 0 2px 10px rgba(40, 30, 10, 0.03);
  }
}
</style>
