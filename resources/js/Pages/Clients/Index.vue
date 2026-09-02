<script setup lang="ts">
import { computed, ref } from 'vue';
import { Head, Link, router } from '@inertiajs/vue3';
import { Building2, Calendar, MapPin, MessageSquare, Search, Trash2, User, UserPlus, Users, ChevronRight } from '@lucide/vue';
import AppLayout from '@/Layouts/AppLayout.vue';

const props = defineProps<{ clients: any; search: string; stats: {total:number;individual:number;corporate:number} }>();
const query = ref(props.search || '');
const filter = ref<'all'|'individual'|'corporate'>('all');
const visible = computed(() => filter.value === 'all' ? props.clients.data : props.clients.data.filter((x:any) => x.type === filter.value));
const find = () => router.get('/dashboard/clients', { search: query.value }, { preserveState: true, replace: true });
const remove = (id:string) => confirm('Hapus data client ini secara permanen?') && router.delete(`/dashboard/clients/${id}`);
const clientId = (x:any) => `CL-${String(x.indexNo || 0).padStart(4, '0')}`;
const birthday = (x:any) => x.birthday ? new Date(x.birthday).toLocaleDateString('id-ID',{day:'numeric',month:'long'}) : '';
const cards = computed(() => [
  {id:'all',label:'Total Client',value:props.stats.total,icon:Users, active:'bg-[var(--primary)] text-white'},
  {id:'individual',label:'Perorangan',value:props.stats.individual,icon:User, active:'bg-purple-600 text-white'},
  {id:'corporate',label:'Badan Hukum',value:props.stats.corporate,icon:Building2, active:'bg-sky-600 text-white'},
]);
</script>

<template>
  <Head title="Data Client" />
  <AppLayout>
    <main class="mx-auto max-w-7xl space-y-6 p-3 sm:p-5">
      <!-- Header section -->
      <div class="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 class="text-xl sm:text-2xl font-black text-slate-900">Data Client</h1>
          <p class="mt-1 text-xs sm:text-sm font-medium text-slate-500">Kelola informasi lengkap client dan riwayat kerjasamanya.</p>
        </div>
        <Link
          href="/dashboard/clients/new"
          class="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-5 text-sm font-bold text-white shadow-md transition-all hover:opacity-90 active:scale-95"
        >
          <UserPlus class="h-4 w-4"/>
          <span>Tambah Client</span>
        </Link>
      </div>

      <!-- Stats section -->
      <div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <button
          v-for="card in cards"
          :key="card.id"
          @click="filter=card.id as any"
          class="group relative overflow-hidden rounded-2xl p-4 text-left transition-all border border-slate-200"
          :class="filter===card.id ? `${card.active} shadow-md` : 'bg-white hover:bg-slate-50 text-slate-800'"
        >
          <p class="text-[11px] font-bold uppercase tracking-wider opacity-80">{{card.label}}</p>
          <h3 class="mt-1 text-2xl font-black">{{card.value}}</h3>
          <component :is="card.icon" class="absolute -bottom-2 -right-2 h-14 w-14 opacity-15" />
        </button>
      </div>

      <!-- Search control -->
      <div class="flex items-center justify-between gap-4">
        <form @submit.prevent="find" class="relative flex-1">
          <Search class="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"/>
          <input v-model="query" class="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm font-medium focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20" placeholder="Cari nama, nomor HP, atau alamat client..." />
        </form>
      </div>

      <!-- MOBILE CARDVIEW -->
      <div class="space-y-3.5 md:hidden">
        <div v-if="!visible.length" class="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
          Tidak ada data client.
        </div>
        <div
          v-for="client in visible"
          :key="client.id"
          class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-3"
        >
          <div class="flex items-start justify-between gap-2">
            <div>
              <div class="flex items-center gap-2">
                <span class="font-bold text-sm text-slate-900">{{client.name}}</span>
                <span class="rounded px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wider bg-[var(--primary)]/10" :style="{ color: 'var(--primary)' }">{{clientId(client)}}</span>
              </div>
              <p v-if="client.birthday" class="mt-1 flex items-center gap-1 text-xs text-slate-500">
                <Calendar class="h-3 w-3" />
                <span>{{birthday(client)}}</span>
              </p>
            </div>
            <span
              class="rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider"
              :class="client.type==='corporate'?'bg-sky-100 text-sky-800 border border-sky-300':'bg-purple-100 text-purple-800 border border-purple-300'"
            >
              {{client.type==='corporate'?'Badan Hukum':'Individu'}}
            </span>
          </div>

          <div class="flex flex-wrap items-center justify-between gap-2 text-xs border-t border-slate-100 pt-3 text-slate-600">
            <div class="flex items-center gap-2">
              <code class="rounded bg-slate-100 px-2 py-0.5 font-mono text-xs">{{client.phone||'-'}}</code>
              <a v-if="client.phone" :href="`https://wa.me/${client.phone.replace(/\D/g,'')}`" target="_blank" class="grid h-7 w-7 place-items-center rounded-full bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white transition-colors">
                <MessageSquare class="h-3.5 w-3.5"/>
              </a>
            </div>
            <div class="flex items-center gap-2">
              <Link :href="`/dashboard/clients/${client.id}`" class="inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-bold transition-all hover:bg-slate-50" :style="{ borderColor: 'color-mix(in srgb, var(--primary) 30%, transparent)', color: 'var(--primary)' }">
                <span>Detail</span>
                <ChevronRight class="h-3 w-3" />
              </Link>
              <button @click="remove(client.id)" class="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors">
                <Trash2 class="h-4 w-4"/>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- DESKTOP TABLE VIEW -->
      <div class="hidden md:block overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-sm">
            <thead class="border-b border-slate-200 bg-slate-50/80 text-xs font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th class="p-4 pl-6">Client</th>
                <th>Jenis Client</th>
                <th>Nomor Handphone</th>
                <th>Alamat</th>
                <th class="pr-6 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-if="!visible.length">
                <td colspan="5" class="py-16 text-center text-slate-500">Tidak ada data client.</td>
              </tr>
              <tr v-for="client in visible" :key="client.id" class="hover:bg-slate-50/80 transition-colors">
                <td class="p-4 pl-6">
                  <div class="flex items-center gap-2">
                    <span class="font-bold text-slate-800">{{client.name}}</span>
                    <span class="rounded bg-[var(--primary)]/10 px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wider" :style="{ color: 'var(--primary)' }">{{clientId(client)}}</span>
                  </div>
                  <div v-if="client.birthday" class="mt-1 flex items-center gap-1 text-xs text-slate-500">
                    <Calendar class="h-3 w-3"/>
                    <span>{{birthday(client)}}</span>
                  </div>
                </td>
                <td>
                  <span class="rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider" :class="client.type==='corporate'?'bg-sky-100 text-sky-800 border border-sky-200':'bg-purple-100 text-purple-800 border border-purple-200'">
                    {{client.type==='corporate'?'Badan Hukum':'Individu'}}
                  </span>
                </td>
                <td>
                  <div class="flex items-center gap-2">
                    <code class="rounded bg-slate-100 px-2 py-1 font-mono text-xs text-slate-700">{{client.phone||'-'}}</code>
                    <a v-if="client.phone" :href="`https://wa.me/${client.phone.replace(/\D/g,'')}`" target="_blank" class="grid h-7 w-7 place-items-center rounded-full bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white transition-colors">
                      <MessageSquare class="h-3.5 w-3.5"/>
                    </a>
                  </div>
                </td>
                <td>
                  <div class="flex max-w-[240px] items-center gap-1.5 text-xs text-slate-600">
                    <MapPin class="h-3.5 w-3.5 shrink-0 text-slate-400"/>
                    <span class="truncate">{{client.address||'-'}}</span>
                  </div>
                </td>
                <td class="pr-6 text-right">
                  <div class="flex justify-end items-center gap-2">
                    <Link :href="`/dashboard/clients/${client.id}`" class="inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-bold transition-all hover:bg-slate-50" :style="{ borderColor: 'color-mix(in srgb, var(--primary) 30%, transparent)', color: 'var(--primary)' }">
                      <span>Detail</span>
                      <ChevronRight class="h-3 w-3" />
                    </Link>
                    <button @click="remove(client.id)" class="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors">
                      <Trash2 class="h-4 w-4"/>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </main>
  </AppLayout>
</template>
