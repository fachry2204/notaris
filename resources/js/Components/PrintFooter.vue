<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { usePage } from "@inertiajs/vue3";
import QRCode from "qrcode";

const props = defineProps<{ verificationUrl: string }>();
const qr = ref("");
watch(() => props.verificationUrl, async (url) => {
    qr.value = url ? await QRCode.toDataURL(url, { margin: 2, width: 240, errorCorrectionLevel: "M" }) : "";
}, { immediate: true });
const page = usePage();
const branding = computed(() => (page.props.branding || {}) as { appName?: string; officeName?: string });
</script>

<template>
    <footer class="mt-10 border-t border-slate-300 pt-3 text-center text-xs text-slate-500">
        <div v-if="qr" class="mb-2 flex flex-col items-center gap-1">
            <img :src="qr" class="h-24 w-24" alt="QR verifikasi dokumen" />
            <span>Pindai untuk verifikasi dokumen</span>
        </div>
        Dicetak Melalui : {{ branding.appName || "Notaris Digital" }} | {{ branding.officeName || "Kantor Notaris" }}
    </footer>
</template>
