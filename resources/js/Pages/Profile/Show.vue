<script setup lang="ts">
import { Head, useForm } from '@inertiajs/vue3';
import { onBeforeUnmount, ref } from 'vue';
import { ImagePlus } from '@lucide/vue';
import AppLayout from '@/Layouts/AppLayout.vue';
const props=defineProps<{profile:any}>();
const form=useForm({fullName:props.profile.fullName || '', email:props.profile.email || '', phone:props.profile.phone || '', current_password:'', password:'', password_confirmation:'', photo:null as File|null});
const photoInput = ref<HTMLInputElement | null>(null);
const photoPreview = ref('');
const clearPreview = () => { if (photoPreview.value) URL.revokeObjectURL(photoPreview.value); photoPreview.value=''; };
const choosePhoto = (event: Event) => {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    clearPreview(); form.photo=file; form.clearErrors('photo'); photoPreview.value=URL.createObjectURL(file);
};
onBeforeUnmount(clearPreview);
const save=()=>form.transform(data=>({...data,_method:'put'})).post('/dashboard/profile',{forceFormData:true,preserveScroll:true,onSuccess:()=>{form.reset('current_password','password','password_confirmation','photo');clearPreview();if(photoInput.value)photoInput.value.value='';}});
</script>
<template><Head title="Profil Saya"/><AppLayout><main class="mx-auto max-w-3xl space-y-5 p-4"><header><h1 class="text-2xl font-black">Profil Saya</h1><p class="mt-1 text-sm text-slate-600">Perbarui identitas, foto profil, dan password Anda.</p></header><form class="space-y-5 rounded-2xl border bg-white p-6" @submit.prevent="save"><p v-if="form.recentlySuccessful" role="status" class="rounded-lg bg-emerald-50 p-3 text-emerald-800">Profil berhasil diperbarui.</p><div class="space-y-3">
  <img v-if="photoPreview || profile.photoPath" :src="photoPreview || profile.photoPath" :alt="photoPreview ? 'Pratinjau foto profil baru' : 'Foto profil'" class="h-24 w-24 rounded-2xl border border-stone-200 object-cover"/>
  <p v-else class="text-sm text-slate-500">Belum ada foto profil.</p>
  <input ref="photoInput" type="file" accept="image/*" aria-label="Pilih foto profil" class="hidden" @change="choosePhoto"/>
  <button type="button" :disabled="form.processing" class="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-sky-200 bg-sky-100 px-5 py-3 text-sm font-bold text-sky-900 shadow-sm transition hover:border-sky-300 hover:bg-sky-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60" @click="photoInput?.click()"><ImagePlus aria-hidden="true" class="h-5 w-5"/>Ganti Foto</button>
  <p v-if="form.photo" role="status" class="text-xs leading-relaxed text-slate-600"><span class="break-all">{{ form.photo.name }}</span> · Tekan Simpan Profil untuk menyimpan foto.</p>
  <p v-if="form.errors.photo" role="alert" class="text-sm text-red-700">{{ form.errors.photo }}</p>
</div><label class="block font-bold">Nama lengkap<input v-model="form.fullName" required class="field"/><span class="error">{{ form.errors.fullName }}</span></label><label class="block font-bold">Email<input v-model="form.email" type="email" required class="field"/><span class="error">{{ form.errors.email }}</span></label><label class="block font-bold">Nomor handphone<input v-model="form.phone" class="field"/><span class="error">{{ form.errors.phone }}</span></label><p class="text-sm text-slate-600">Username: {{ profile.username }} · Hak akses: {{ profile.role }}</p><section class="space-y-3 border-t pt-4"><h2 class="font-bold">Ganti password (opsional)</h2><label class="block font-bold">Password saat ini<input v-model="form.current_password" type="password" autocomplete="current-password" class="field"/><span class="error">{{ form.errors.current_password }}</span></label><label class="block font-bold">Password baru<input v-model="form.password" type="password" autocomplete="new-password" class="field"/><span class="error">{{ form.errors.password }}</span></label><label class="block font-bold">Konfirmasi password baru<input v-model="form.password_confirmation" type="password" autocomplete="new-password" class="field"/></label></section><button type="submit" :disabled="form.processing" class="save-action rounded-xl px-5 py-3 font-bold">{{ form.processing ? 'Menyimpan...' : 'Simpan Profil' }}</button></form></main></AppLayout></template>
<style scoped>.field{display:block;width:100%;margin-top:.4rem;border:1px solid #d6d3d1;border-radius:.7rem;padding:.7rem;color:#1c1917;background:white}.error{display:block;color:#b91c1c;font-size:.8rem}</style>
