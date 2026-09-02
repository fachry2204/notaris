<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from "vue";
import { Head, Link, useForm } from "@inertiajs/vue3";
import {
    ArrowLeft,
    Camera,
    CameraOff,
    CheckCircle2,
    MapPin,
    Navigation,
    RefreshCcw,
    SwitchCamera,
    UserCheck,
    X,
} from "@lucide/vue";
import AppLayout from "@/Layouts/AppLayout.vue";

const props = defineProps<{ today: any; hasStaff: boolean }>();

const f = useForm({
    workLocationType: "Office",
    locationLabel: "",
    latitude: null as number | null,
    longitude: null as number | null,
    photo: null as File | null,
});

const videoElement = ref<HTMLVideoElement | null>(null);
const canvasElement = ref<HTMLCanvasElement | null>(null);
const cameraStream = ref<MediaStream | null>(null);
const cameraActive = ref(false);
const cameraLoading = ref(false);
const cameraError = ref("");
const photoPreview = ref("");
const cameraFacing = ref<"user" | "environment">("user");
const currentTime = ref(new Date());
const locating = ref(false);
const locationError = ref("");
const locationResolved = computed(() => f.latitude !== null && f.longitude !== null && Boolean(f.locationLabel));
const currentDateTime = computed(() => {
    const pad = (value: number) => String(value).padStart(2, "0");
    const date = currentTime.value;
    return `${pad(date.getDate())}-${pad(date.getMonth() + 1)}-${date.getFullYear()} · ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
});
let clockTimer: ReturnType<typeof setInterval> | null = null;

const locate = () => {
    locationError.value = "";
    locating.value = true;
    f.locationLabel = "";

    if (!navigator.geolocation) {
        locationError.value = "GPS tidak tersedia pada browser ini.";
        locating.value = false;
        return;
    }

    navigator.geolocation.getCurrentPosition(async (position) => {
        f.latitude = position.coords.latitude;
        f.longitude = position.coords.longitude;

        try {
            const params = new URLSearchParams({
                latitude: String(position.coords.latitude),
                longitude: String(position.coords.longitude),
            });
            const response = await fetch(`/dashboard/pegawai/absensi/location?${params.toString()}`, {
                headers: { Accept: "application/json" },
                credentials: "same-origin",
            });
            const result = await response.json();
            if (!response.ok || !result.address) {
                throw new Error(result.message || "Alamat saat ini tidak dapat ditemukan.");
            }
            f.locationLabel = result.address;
            f.clearErrors("locationLabel", "latitude", "longitude");
        } catch (error) {
            locationError.value = error instanceof Error
                ? error.message
                : "Alamat saat ini tidak dapat ditemukan.";
        } finally {
            locating.value = false;
        }
    }, (error) => {
        locationError.value = error.code === error.PERMISSION_DENIED
            ? "Izin lokasi ditolak. Izinkan akses lokasi pada browser, lalu coba kembali."
            : "Lokasi GPS tidak dapat diperoleh. Aktifkan GPS dan coba kembali.";
        locating.value = false;
    }, {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 60000,
    });
};

const stopCamera = () => {
    cameraStream.value?.getTracks().forEach((track) => track.stop());
    cameraStream.value = null;
    cameraActive.value = false;
    if (videoElement.value) videoElement.value.srcObject = null;
    document.body.style.overflow = "";
};

const startCamera = async () => {
    cameraError.value = "";
    cameraLoading.value = true;
    stopCamera();

    if (!navigator.mediaDevices?.getUserMedia) {
        cameraError.value = "Kamera tidak tersedia. Gunakan browser terbaru dan pastikan aplikasi dibuka melalui HTTPS.";
        cameraLoading.value = false;
        return;
    }

    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: { ideal: cameraFacing.value },
                width: { ideal: 1280 },
                height: { ideal: 720 },
            },
            audio: false,
        });
        cameraStream.value = stream;
        cameraActive.value = true;
        document.body.style.overflow = "hidden";
        await nextTick();
        if (videoElement.value) {
            videoElement.value.srcObject = stream;
            await videoElement.value.play();
        }
    } catch (error) {
        cameraError.value = error instanceof DOMException && error.name === "NotAllowedError"
            ? "Izin kamera ditolak. Izinkan akses kamera pada browser, lalu coba kembali."
            : "Kamera tidak dapat dibuka. Pastikan kamera tidak sedang digunakan aplikasi lain.";
        stopCamera();
    } finally {
        cameraLoading.value = false;
    }
};

const switchCamera = async () => {
    cameraFacing.value = cameraFacing.value === "user" ? "environment" : "user";
    await startCamera();
};

const wrapCanvasText = (context: CanvasRenderingContext2D, text: string, maximumWidth: number) => {
    const words = text.split(/\s+/);
    const lines: string[] = [];
    let line = "";
    words.forEach((word) => {
        const candidate = line ? `${line} ${word}` : word;
        if (context.measureText(candidate).width > maximumWidth && line) {
            lines.push(line);
            line = word;
        } else {
            line = candidate;
        }
    });
    if (line) lines.push(line);
    return lines.slice(0, 3);
};

const capturePhoto = () => {
    const video = videoElement.value;
    const canvas = canvasElement.value;
    if (!video || !canvas || !video.videoWidth || !video.videoHeight) {
        cameraError.value = "Kamera belum siap. Tunggu sebentar lalu ambil foto kembali.";
        return;
    }

    const maximumWidth = 1280;
    const scale = Math.min(1, maximumWidth / video.videoWidth);
    canvas.width = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);
    const context = canvas.getContext("2d");
    if (!context) return;

    context.save();
    if (cameraFacing.value === "user") {
        context.translate(canvas.width, 0);
        context.scale(-1, 1);
    }
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    context.restore();

    const padding = Math.max(18, Math.round(canvas.width * 0.025));
    const addressFontSize = Math.max(17, Math.round(canvas.width * 0.022));
    const dateFontSize = Math.max(20, Math.round(canvas.width * 0.027));
    context.font = `600 ${addressFontSize}px sans-serif`;
    const addressLines = wrapCanvasText(context, f.locationLabel, canvas.width - (padding * 2));
    const lineHeight = Math.round(addressFontSize * 1.35);
    const overlayHeight = padding * 2 + dateFontSize + 12 + (addressLines.length * lineHeight) + lineHeight;
    context.fillStyle = "rgba(2, 6, 23, 0.72)";
    context.fillRect(0, canvas.height - overlayHeight, canvas.width, overlayHeight);
    context.fillStyle = "#ffffff";
    context.font = `700 ${dateFontSize}px sans-serif`;
    context.fillText(currentDateTime.value.replace(" · ", " - "), padding, canvas.height - overlayHeight + padding + dateFontSize);
    context.font = `600 ${addressFontSize}px sans-serif`;
    addressLines.forEach((line, index) => {
        context.fillText(line, padding, canvas.height - overlayHeight + padding + dateFontSize + 12 + ((index + 1) * lineHeight));
    });
    context.fillStyle = "#f9a8d4";
    context.font = `700 ${addressFontSize}px sans-serif`;
    context.fillText(`Lokasi Kerja: ${f.workLocationType}`, padding, canvas.height - padding);
    canvas.toBlob((blob) => {
        if (!blob) {
            cameraError.value = "Foto gagal diambil. Silakan coba kembali.";
            return;
        }
        if (photoPreview.value) URL.revokeObjectURL(photoPreview.value);
        const filename = `selfie-${new Date().toISOString().replace(/[:.]/g, "-")}.jpg`;
        f.photo = new File([blob], filename, { type: "image/jpeg" });
        photoPreview.value = URL.createObjectURL(blob);
        f.clearErrors("photo");
        stopCamera();
    }, "image/jpeg", 0.88);
};

const retakePhoto = async () => {
    if (photoPreview.value) URL.revokeObjectURL(photoPreview.value);
    photoPreview.value = "";
    f.photo = null;
    await startCamera();
};

const submit = () => {
    if (!locationResolved.value) {
        f.setError("locationLabel", "Lokasi GPS dan alamat saat ini wajib terdeteksi.");
        return;
    }
    if (!f.photo) {
        f.setError("photo", "Foto selfie wajib diambil langsung dari kamera.");
        return;
    }
    f.post("/dashboard/pegawai/absensi", {
        forceFormData: true,
        onFinish: stopCamera,
    });
};

onBeforeUnmount(() => {
    stopCamera();
    if (photoPreview.value) URL.revokeObjectURL(photoPreview.value);
    if (clockTimer) clearInterval(clockTimer);
});

onMounted(() => {
    clockTimer = setInterval(() => {
        currentTime.value = new Date();
    }, 1000);
    if (props.hasStaff && !props.today?.checkOut) locate();
});
</script>

<template>
    <Head title="Absenku" />
    <AppLayout>
        <main class="mx-auto max-w-xl space-y-6 p-4">
            <div class="flex items-center gap-4">
                <Link href="/dashboard/pegawai/absensi" class="grid h-11 w-11 place-items-center rounded-full hover:bg-pink-500/10">
                    <ArrowLeft />
                </Link>
                <div>
                    <h1 class="text-2xl font-black">Absenku</h1>
                    <p class="text-sm text-slate-500">Catat kehadiran menggunakan lokasi dan foto langsung dari kamera.</p>
                </div>
            </div>

            <div v-if="!hasStaff" class="rounded-2xl bg-rose-500/10 p-6 font-bold text-rose-600">
                Profil staff tidak ditemukan pada akun ini.
            </div>

            <section v-else class="overflow-hidden rounded-[2.5rem] bg-white shadow-2xl">
                <header class="bg-gradient-to-br from-pink-500 to-rose-500 p-7 text-white">
                    <UserCheck class="h-10 w-10" />
                    <h2 class="mt-4 text-2xl font-black">{{ today?.checkIn && !today?.checkOut ? "Absen Pulang" : "Absen Masuk" }}</h2>
                    <p class="text-sm text-white/80">
                        {{ new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" }) }}
                    </p>
                </header>

                <div v-if="today?.checkOut" class="p-8 text-center">
                    <CheckCircle2 class="mx-auto h-16 w-16 text-emerald-500" />
                    <h3 class="mt-4 text-xl font-black">Absensi Hari Ini Selesai</h3>
                    <p class="mt-2 text-sm text-slate-500">Masuk dan pulang sudah tercatat.</p>
                </div>

                <form v-else class="space-y-5 p-7" @submit.prevent="submit">
                    <label>
                        <span class="label"><MapPin class="h-4 w-4" />Lokasi Kerja</span>
                        <select v-model="f.workLocationType" required class="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 font-bold text-slate-800">
                            <option value="Office">Office</option>
                            <option value="Dinas Luar">Dinas Luar</option>
                            <option value="WFC">WFC</option>
                            <option value="WFH">WFH</option>
                        </select>
                    </label>

                    <label>
                        <span class="label"><Navigation class="h-4 w-4" />Alamat Saat Ini</span>
                        <textarea
                            :value="locating ? 'Sedang mendeteksi lokasi GPS dan alamat...' : f.locationLabel"
                            readonly
                            rows="3"
                            placeholder="Alamat akan terisi otomatis dari GPS"
                            class="w-full resize-none rounded-xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm font-semibold leading-relaxed text-slate-700 read-only:cursor-not-allowed"
                        ></textarea>
                    </label>

                    <div v-if="locationResolved" class="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-center text-xs font-bold text-emerald-700">
                        <CheckCircle2 class="mr-1 inline h-4 w-4" />Lokasi berhasil terdeteksi otomatis
                    </div>
                    <div v-if="locationError" class="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm font-semibold text-rose-700">
                        {{ locationError }}
                    </div>
                    <button type="button" :disabled="locating" class="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-blue-500/10 font-bold text-blue-600 disabled:opacity-50" @click="locate">
                        <Navigation class="h-4 w-4" :class="locating ? 'animate-pulse' : ''" />
                        {{ locating ? "Mendeteksi Lokasi..." : locationResolved ? "Perbarui Lokasi GPS" : "Coba Deteksi Lokasi" }}
                    </button>
                    <p class="text-center text-[10px] text-slate-400">
                        Data alamat © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer" class="font-bold underline">OpenStreetMap contributors</a>
                    </p>
                    <p v-if="f.errors.locationLabel || f.errors.latitude || f.errors.longitude" class="text-sm font-bold text-rose-600">
                        {{ f.errors.locationLabel || f.errors.latitude || f.errors.longitude }}
                    </p>

                    <div class="overflow-hidden rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50">
                        <div v-if="photoPreview" class="relative bg-slate-950">
                            <img :src="photoPreview" alt="Hasil foto selfie" class="aspect-[4/3] w-full object-cover" />
                            <div class="absolute inset-x-0 bottom-0 flex justify-center bg-gradient-to-t from-black/70 to-transparent p-4 pt-12">
                                <button type="button" class="flex h-11 items-center gap-2 rounded-full bg-white px-5 text-sm font-black text-slate-800 shadow-xl" @click="retakePhoto">
                                    <RefreshCcw class="h-4 w-4" />Ambil Ulang
                                </button>
                            </div>
                            <div class="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-500 px-3 py-1 text-xs font-bold text-white shadow">
                                <CheckCircle2 class="h-3.5 w-3.5" />Foto siap
                            </div>
                        </div>

                        <div v-else class="p-8 text-center">
                            <Camera class="mx-auto h-9 w-9 text-pink-500" />
                            <p class="mt-3 font-black text-slate-800">Ambil Foto Selfie Langsung</p>
                            <p class="mt-1 text-xs text-slate-500">Foto wajib diambil melalui kamera perangkat dan tidak dapat dipilih dari galeri.</p>
                            <button type="button" :disabled="cameraLoading" class="mx-auto mt-4 flex h-11 items-center justify-center gap-2 rounded-xl bg-pink-500 px-5 text-sm font-bold text-white shadow-lg shadow-pink-500/20 disabled:opacity-50" @click="startCamera">
                                <CameraOff v-if="cameraLoading" class="h-4 w-4 animate-pulse" />
                                <Camera v-else class="h-4 w-4" />
                                {{ cameraLoading ? "Membuka Kamera..." : "Buka Kamera" }}
                            </button>
                        </div>
                    </div>
                    <canvas ref="canvasElement" class="hidden"></canvas>

                    <div v-if="cameraError" class="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm font-semibold text-rose-700">
                        {{ cameraError }}
                    </div>
                    <p v-if="f.errors.photo" class="text-sm font-bold text-rose-600">{{ f.errors.photo }}</p>

                    <button :disabled="f.processing || !f.photo || !locationResolved" class="h-14 w-full rounded-2xl bg-pink-500 text-lg font-black text-white shadow-xl shadow-pink-500/20 transition disabled:cursor-not-allowed disabled:opacity-50">
                        {{ f.processing ? "Mengirim..." : today?.checkIn ? "Kirim Absen Pulang" : "Kirim Absen Masuk" }}
                    </button>
                </form>
            </section>
        </main>

        <Teleport to="body">
            <Transition
                enter-active-class="transition duration-200 ease-out"
                enter-from-class="opacity-0"
                enter-to-class="opacity-100"
                leave-active-class="transition duration-150 ease-in"
                leave-from-class="opacity-100"
                leave-to-class="opacity-0"
            >
                <div v-if="cameraActive" class="fixed inset-0 z-[200] overflow-hidden bg-black" role="dialog" aria-modal="true" aria-label="Kamera selfie absensi">
                    <video
                        ref="videoElement"
                        autoplay
                        muted
                        playsinline
                        class="h-full w-full object-cover"
                        :class="cameraFacing === 'user' ? 'scale-x-[-1]' : ''"
                    ></video>

                    <div class="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between bg-gradient-to-b from-black/75 via-black/25 to-transparent p-4 pb-16 sm:p-6">
                        <button
                            type="button"
                            aria-label="Tutup kamera"
                            class="pointer-events-auto grid h-11 w-11 place-items-center rounded-full bg-black/45 text-white shadow-lg backdrop-blur-md transition hover:bg-black/65 active:scale-95"
                            @click="stopCamera"
                        >
                            <X class="h-6 w-6" />
                        </button>
                        <div class="rounded-full bg-black/45 px-4 py-2 text-center text-xs font-bold text-white backdrop-blur-md">
                            {{ cameraFacing === "user" ? "Kamera Depan" : "Kamera Belakang" }}
                        </div>
                        <button
                            type="button"
                            aria-label="Ganti kamera depan atau belakang"
                            class="pointer-events-auto grid h-11 w-11 place-items-center rounded-full bg-black/45 text-white shadow-lg backdrop-blur-md transition hover:bg-black/65 active:scale-95"
                            @click="switchCamera"
                        >
                            <SwitchCamera class="h-6 w-6" />
                        </button>
                    </div>

                    <div class="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/55 to-transparent px-5 pb-6 pt-24 text-white sm:px-8 sm:pb-8">
                        <div class="mx-auto max-w-3xl text-center">
                            <p class="font-mono text-base font-black tracking-wide sm:text-xl">{{ currentDateTime }}</p>
                            <p class="mx-auto mt-2 max-w-2xl text-xs font-semibold leading-relaxed text-white/90 sm:text-sm">
                                <MapPin class="mr-1 inline h-4 w-4 text-pink-300" />
                                {{ locationResolved ? f.locationLabel : "Menunggu lokasi GPS dan alamat..." }}
                            </p>
                            <p class="mt-1 text-xs font-bold text-pink-300">Lokasi Kerja: {{ f.workLocationType }}</p>

                            <button
                                type="button"
                                :disabled="!locationResolved"
                                class="pointer-events-auto mx-auto mt-5 grid h-16 w-16 place-items-center rounded-full border-4 border-white bg-pink-500 text-white shadow-2xl transition hover:bg-pink-600 active:scale-90 disabled:cursor-not-allowed disabled:bg-slate-500 disabled:opacity-60 sm:h-20 sm:w-20"
                                :title="locationResolved ? 'Ambil foto' : 'Menunggu lokasi GPS'"
                                @click="capturePhoto"
                            >
                                <Camera class="h-7 w-7 sm:h-9 sm:w-9" />
                            </button>
                            <p v-if="!locationResolved" class="mt-2 text-xs font-bold text-amber-300">Foto dapat diambil setelah lokasi berhasil terdeteksi.</p>
                        </div>
                    </div>
                </div>
            </Transition>
        </Teleport>
    </AppLayout>
</template>

<style scoped>
.label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
    font-size: 0.7rem;
    font-weight: 900;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: #64748b;
}
</style>
