<script setup lang="ts">
import { computed } from "vue";
import { Head, useForm, usePage } from "@inertiajs/vue3";
import { LockKeyhole } from "@lucide/vue";

const props = withDefaults(
    defineProps<{ adminMode?: boolean; loginAction?: string }>(),
    { adminMode: false, loginAction: "/login" },
);
const page = usePage<any>();
const branding = computed(() => page.props.branding || {});
const content = computed(() => branding.value.frontend || {});
const officeName = computed(() => branding.value.officeName?.trim() || 'Kantor Notaris');
const form = useForm({ username: "", password: "" });
const submit = () => form.post(props.loginAction);
</script>

<template>
    <Head :title="adminMode ? 'Login Administrator' : 'Masuk'" />
    <main class="relative grid min-h-screen place-items-center overflow-hidden bg-[#0e0d0b] p-6 before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_75%_20%,rgba(201,154,61,.18),transparent_35%)]">
        <form @submit.prevent="submit" class="relative w-full max-w-md rounded-3xl border border-[#5b4825] bg-[#17140f]/95 p-8 text-[#f5ecdc] shadow-2xl shadow-black/40 backdrop-blur">
            <div class="mb-6 flex items-center gap-3">
                <img v-if="branding.logoUrl" :src="branding.logoUrl" :alt="branding.appName" class="h-12 w-12 shrink-0 rounded-xl object-contain" />
                <span v-else class="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-[#745b2c] bg-[#211b11] text-[#d7aa4d]">
                    <LockKeyhole class="h-6 w-6" />
                </span>
                <div class="min-w-0">
                    <p class="text-xs font-black uppercase tracking-[.2em] text-[#d7aa4d]">
                        {{ content.loginEyebrow || branding.appName }}
                    </p>
                    <p class="mt-1 break-words text-xs font-medium leading-relaxed text-[#D8C9AA]">{{ officeName }}</p>
                    <p v-if="adminMode" class="mt-1 text-xs font-bold text-slate-500">BACKEND ADMINISTRATOR</p>
                </div>
            </div>
            <h1 class="font-display text-3xl font-black text-[#fff8e9]">
                {{ adminMode ? "Login Administrator" : content.loginTitle }}
            </h1>
            <p class="mt-2 text-sm text-[#aaa08f]">
                {{ adminMode ? "Masuk untuk mengatur sistem dan seluruh halaman depan." : content.loginSubtitle }}
            </p>
            <label class="mt-8 block text-sm font-bold">Username</label>
            <input v-model="form.username" autocomplete="username" autofocus class="mt-2 w-full rounded-xl border-[#4e422e] bg-[#211d17] text-[#fff8e9]" />
            <p class="mt-1 text-xs text-red-600">{{ form.errors.username }}</p>
            <label class="mt-5 block text-sm font-bold">Password</label>
            <input v-model="form.password" type="password" autocomplete="current-password" class="mt-2 w-full rounded-xl border-[#4e422e] bg-[#211d17] text-[#fff8e9]" />
            <button :disabled="form.processing" class="mt-8 w-full rounded-xl bg-[#c99a3d] px-4 py-3 font-black text-[#17120a] hover:bg-[#dfb458] disabled:opacity-50">
                {{ form.processing ? "Memproses…" : "Masuk" }}
            </button>
        </form>
    </main>
</template>
