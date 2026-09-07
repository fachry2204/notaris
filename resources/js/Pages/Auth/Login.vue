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
const form = useForm({ username: "", password: "" });
const submit = () => form.post(props.loginAction);
</script>

<template>
    <Head :title="adminMode ? 'Login Administrator' : 'Masuk'" />
    <main class="grid min-h-screen place-items-center bg-gradient-to-br from-slate-950 via-slate-900 to-pink-950 p-6">
        <form @submit.prevent="submit" class="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl">
            <div class="mb-6 flex items-center gap-3">
                <img v-if="branding.logoUrl" :src="branding.logoUrl" :alt="branding.appName" class="h-12 w-12 rounded-xl object-contain" />
                <span v-else class="grid h-12 w-12 place-items-center rounded-xl bg-pink-50 text-pink-600">
                    <LockKeyhole class="h-6 w-6" />
                </span>
                <div>
                    <p class="text-xs font-black uppercase tracking-[.2em] text-pink-500">
                        {{ content.loginEyebrow || branding.appName }}
                    </p>
                    <p v-if="adminMode" class="mt-1 text-xs font-bold text-slate-500">BACKEND ADMINISTRATOR</p>
                </div>
            </div>
            <h1 class="text-3xl font-black">
                {{ adminMode ? "Login Administrator" : content.loginTitle }}
            </h1>
            <p class="mt-2 text-sm text-slate-500">
                {{ adminMode ? "Masuk untuk mengatur sistem dan seluruh halaman depan." : content.loginSubtitle }}
            </p>
            <label class="mt-8 block text-sm font-bold">Username</label>
            <input v-model="form.username" autocomplete="username" autofocus class="mt-2 w-full rounded-xl border-slate-200" />
            <p class="mt-1 text-xs text-red-600">{{ form.errors.username }}</p>
            <label class="mt-5 block text-sm font-bold">Password</label>
            <input v-model="form.password" type="password" autocomplete="current-password" class="mt-2 w-full rounded-xl border-slate-200" />
            <button :disabled="form.processing" class="mt-8 w-full rounded-xl bg-pink-600 px-4 py-3 font-black text-white hover:bg-pink-700 disabled:opacity-50">
                {{ form.processing ? "Memproses…" : "Masuk" }}
            </button>
        </form>
    </main>
</template>
