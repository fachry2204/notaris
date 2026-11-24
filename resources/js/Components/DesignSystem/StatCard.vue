<script setup lang="ts">
import type { Component } from 'vue';
defineProps<{ label: string; value: string | number; icon: Component; interactive?: boolean; selected?: boolean }>();
defineEmits<{ activate: [] }>();
</script>

<template>
<component
  :is="interactive ? 'button' : 'article'"
  :type="interactive ? 'button' : undefined"
  :aria-pressed="interactive ? !!selected : undefined"
  @click="interactive && $emit('activate')"
  :class="{ 'ds-stat-selected': interactive && selected }"
  class="ds-stat w-full text-left relative overflow-hidden rounded-2xl border border-[#EAE3D2] bg-white p-4 shadow-xs transition hover:shadow-md hover:-translate-y-0.5"
>
  <p class="text-[11px] font-bold uppercase tracking-wider text-stone-500">{{ label }}</p>
  <p class="mt-1 truncate text-xl font-black text-stone-900 sm:text-2xl tracking-tight">{{ value }}</p>
  <component :is="icon" class="absolute -bottom-2 -right-2 h-14 w-14 text-amber-500/10 pointer-events-none" />
</component>
</template>

<style scoped>
@media (min-width: 1024px) {
  .ds-stat-selected {
    outline: 2px solid #F5BA31;
    outline-offset: 1px;
    border-color: #F5BA31 !important;
  }
  .ds-stat {
    min-height: 6.5rem;
    transition: border-color .2s, transform .2s, box-shadow .2s;
  }
  .ds-stat:hover {
    border-color: #D4AF37 !important;
  }
}
</style>
