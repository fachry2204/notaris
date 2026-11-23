<script setup lang="ts">
import type { Component } from 'vue';
defineProps<{ label: string; value: string | number; icon: Component; interactive?: boolean; selected?: boolean }>();
defineEmits<{ activate: [] }>();
</script>
<template>
<component :is="interactive ? 'button' : 'article'" :type="interactive ? 'button' : undefined" :aria-pressed="interactive ? !!selected : undefined" @click="interactive && $emit('activate')" :class="{ 'ds-stat-selected': interactive && selected }" class="ds-stat w-full text-left relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><p class="text-[11px] font-bold uppercase tracking-wider text-slate-500">{{ label }}</p><p class="mt-1 truncate text-xl font-black text-slate-800 sm:text-2xl">{{ value }}</p><component :is="icon" class="absolute -bottom-2 -right-2 h-12 w-12 text-slate-400/15" /></component>
</template>
<style scoped>
@media (min-width:1024px) { .ds-stat-selected { outline:2px solid #d4af37; outline-offset:1px; } .ds-stat { min-height:6.5rem; transition:border-color .2s, transform .2s; } .ds-stat:hover { border-color:rgba(212,175,55,.6) !important; transform:translateY(-2px); } }
</style>
