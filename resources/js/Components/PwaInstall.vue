<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { Download, Share, X } from "@lucide/vue";

type InstallEvent = Event & {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};
const deferredPrompt = ref<InstallEvent | null>(null);
const platform = ref<"ios" | "android" | null>(null);
const standalone = ref(false);
const hidden = ref(false);
const showGuide = ref(false);
const canInstall = computed(() => platform.value !== null && !standalone.value && !hidden.value);
const beforeInstall = (event: Event) => {
    event.preventDefault();
    deferredPrompt.value = event as InstallEvent;
};
const installed = () => { standalone.value = true; deferredPrompt.value = null; };
const dismiss = () => {
    hidden.value = true;
    try { sessionStorage.setItem("notaris-install-dismissed", "1"); } catch { /* Storage is optional. */ }
};
const install = async () => {
    if (!deferredPrompt.value) { showGuide.value = true; return; }
    const prompt = deferredPrompt.value;
    deferredPrompt.value = null;
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
    window.addEventListener("beforeinstallprompt", beforeInstall);
    window.addEventListener("appinstalled", installed);
});
onBeforeUnmount(() => {
    window.removeEventListener("beforeinstallprompt", beforeInstall);
    window.removeEventListener("appinstalled", installed);
});
</script>
<template>
    <aside v-if="canInstall" aria-label="Instal aplikasi" class="fixed inset-x-3 bottom-20 z-[110] mx-auto max-w-md rounded-2xl border border-[#ded3bd] bg-[#fffdf8] p-4 text-[#1d1a15] shadow-2xl md:hidden">
        <div class="flex items-start gap-3">
            <span class="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#f5ead1] text-[#805a10]"><Download class="h-5 w-5" /></span>
            <div class="min-w-0 flex-1"><p class="text-sm font-black">Pasang aplikasi Notaris</p><p class="mt-1 text-xs text-[#665f54]">Buka lebih cepat dari layar utama ponsel.</p></div>
            <button type="button" aria-label="Tutup informasi instalasi" class="rounded-lg p-1 text-[#665f54]" @click="dismiss"><X class="h-5 w-5" /></button>
        </div>
        <div class="mt-3 flex gap-2"><button type="button" class="rounded-xl bg-[#a67218] px-4 py-2 text-xs font-black text-white" @click="install">{{ platform === 'ios' ? 'Cara memasang' : 'Pasang aplikasi' }}</button><button type="button" class="rounded-xl px-3 py-2 text-xs font-bold text-[#665f54]" @click="dismiss">Nanti</button></div>
        <div v-if="showGuide" class="mt-3 rounded-xl bg-[#f5efe3] p-3 text-xs leading-relaxed text-[#3d3528]">
            <p v-if="platform === 'ios'">Di Safari, ketuk tombol <Share class="inline h-4 w-4" /> <strong>Bagikan</strong>, pilih <strong>Tambahkan ke Layar Utama</strong>, lalu ketuk <strong>Tambah</strong>.</p>
            <p v-else>Di menu browser (⋮), pilih <strong>Instal aplikasi</strong> atau <strong>Tambahkan ke layar utama</strong>. Pastikan situs dibuka melalui HTTPS.</p>
        </div>
    </aside>
</template>
