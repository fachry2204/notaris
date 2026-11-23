<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { CheckCircle2, Download, Smartphone, X } from "@lucide/vue";
import { installPrompt } from "@/pwaInstall";

const platform = ref<"ios" | "android" | null>(null);
const standalone = ref(false);
const hidden = ref(false);
const showGuide = ref(false);
const canInstall = computed(() => platform.value !== null && !standalone.value && !hidden.value);
const onKeydown = (event: KeyboardEvent) => { if (event.key === "Escape" && canInstall.value) dismiss(); };
const installed = () => { standalone.value = true; installPrompt.value = null; };
const dismiss = () => {
    hidden.value = true;
    try { sessionStorage.setItem("notaris-install-dismissed", "1"); } catch { /* Storage is optional. */ }
};
const install = async () => {
    if (!installPrompt.value) { showGuide.value = true; return; }
    const prompt = installPrompt.value;
    installPrompt.value = null;
    try {
        await prompt.prompt();
        const choice = await prompt.userChoice;
        if (choice.outcome === "accepted") hidden.value = true;
    } catch { showGuide.value = true; }
};
onMounted(() => {
    const ua = navigator.userAgent;
    const ios = /iPad|iPhone|iPod/i.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    platform.value = ios ? "ios" : /Android/i.test(ua) ? "android" : null;
    standalone.value = window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
    try { hidden.value = sessionStorage.getItem("notaris-install-dismissed") === "1"; } catch { /* Storage is optional. */ }
    window.addEventListener("appinstalled", installed);
    window.addEventListener("keydown", onKeydown);
});
onBeforeUnmount(() => {
    window.removeEventListener("appinstalled", installed);
    window.removeEventListener("keydown", onKeydown);
});
</script>
<template>
    <div v-if="canInstall" class="install-overlay fixed inset-0 z-[110] flex items-center justify-center bg-[#102b25]/65 p-4" @click.self="dismiss">
        <section role="dialog" aria-modal="true" aria-labelledby="install-title" aria-describedby="install-description" class="install-dialog relative w-full max-w-sm overflow-y-auto rounded-3xl border border-[#e5dac6] bg-[#fffdf8] p-6 text-[#1d1a15] shadow-2xl sm:p-7">
            <button type="button" aria-label="Tutup informasi instalasi" class="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full text-[#776d5c] hover:bg-[#f5efe3]" @click="dismiss"><X class="h-5 w-5" /></button>
            <span class="grid h-14 w-14 place-items-center rounded-2xl bg-[#f8ead0] text-[#a56d11]"><Smartphone class="h-7 w-7" /></span>
            <h2 id="install-title" class="mt-5 pr-5 text-xl font-black">Pasang aplikasi Notaris</h2>
            <p id="install-description" class="mt-2 text-sm leading-relaxed text-[#665f54]">Tambahkan aplikasi ke layar utama agar lebih mudah membuka data berkas dan mencatat absensi.</p>
            <ul class="mt-4 space-y-2 rounded-2xl bg-[#f5f1e7] p-4 text-sm text-[#514a3e]"><li class="flex items-start gap-2"><CheckCircle2 class="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />Akses cepat melalui ikon di layar utama</li><li class="flex items-start gap-2"><CheckCircle2 class="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />Tampilan yang nyaman digunakan di ponsel</li></ul>
            <p v-if="platform === 'ios'" class="mt-4 rounded-xl bg-[#fff4dd] p-3 text-sm leading-relaxed text-[#725018]">Di iPhone, buka menu <strong>Bagikan</strong> pada browser, lalu pilih <strong>Tambahkan ke Layar Utama</strong>.</p>
            <div v-if="showGuide" role="status" class="mt-4 rounded-xl bg-[#fff4dd] p-3 text-sm leading-relaxed text-[#725018]">Buka menu browser (⋮), lalu pilih <strong>Instal aplikasi</strong> atau <strong>Tambahkan ke layar utama</strong>.</div>
            <div class="mt-5 flex flex-col gap-2"><button v-if="platform === 'android'" type="button" class="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#a67218] px-4 text-sm font-black text-white hover:bg-[#895b10]" @click="install"><Download class="h-4 w-4" />Pasang aplikasi</button><button type="button" class="min-h-11 rounded-xl text-sm font-bold text-[#665f54] hover:bg-[#f5efe3]" @click="dismiss">Nanti saja</button></div>
        </section>
    </div>
</template>
<style scoped>
.install-overlay { padding-top: max(1rem, env(safe-area-inset-top)); padding-bottom: max(1rem, env(safe-area-inset-bottom)); }
.install-dialog { max-height: min(90dvh, 38rem); }
</style>
