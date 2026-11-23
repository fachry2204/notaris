<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
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

const props = defineProps<{ today: any; hasStaff: boolean; checkoutRequested: boolean }>();
const checkInComplete = computed(() => Boolean(props.today?.checkIn && !props.today?.checkOut && !props.checkoutRequested));

const f = useForm({
    attendanceAction: props.checkoutRequested ? "checkout" : "checkin",
    workLocationType: "Office",
    locationLabel: "",
    locationSource: "gps" as "gps" | "manual",
    latitude: null as number | null,
    longitude: null as number | null,
    locationAccuracy: null as number | null,
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
const manualAddress = ref(false);
const photoNotice = ref("");
const locationResolved = computed(() => f.latitude !== null && f.longitude !== null && Boolean(f.locationLabel.trim()));
watch(() => [f.latitude, f.longitude, f.locationLabel, f.workLocationType], () => {
    if (!f.photo) return;
    if (photoPreview.value) URL.revokeObjectURL(photoPreview.value);
    photoPreview.value = "";
    f.photo = null;
    photoNotice.value = "Lokasi berubah. Silakan ambil ulang foto agar sesuai dengan lokasi terbaru.";
});
const currentDateTime = computed(() => {
    const pad = (value: number) => String(value).padStart(2, "0");
    const date = currentTime.value;
    return `${pad(date.getDate())}-${pad(date.getMonth() + 1)}-${date.getFullYear()} · ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
});
let clockTimer: ReturnType<typeof setInterval> | null = null;

const locate = () => {
    locationError.value = "";
    locating.value = true;
    manualAddress.value = false;
    f.locationSource = "gps";
    f.locationLabel = "";
    f.latitude = null;
    f.longitude = null;
    f.locationAccuracy = null;

    if (!navigator.geolocation || !window.isSecureContext) {
        locationError.value = "GPS tidak tersedia. Pastikan aplikasi dibuka melalui HTTPS dan izin lokasi aktif.";
        locating.value = false;
        return;
    }

    navigator.geolocation.getCurrentPosition(async (position) => {
        f.latitude = position.coords.latitude;
        f.longitude = position.coords.longitude;
        f.locationAccuracy = Number.isFinite(position.coords.accuracy) ? position.coords.accuracy : null;

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
            f.locationSource = "gps";
            f.clearErrors("locationLabel", "latitude", "longitude");
        } catch (error) {
            manualAddress.value = true;
            f.locationSource = "manual";
            locationError.value = "GPS berhasil didapat, tetapi alamat otomatis belum tersedia. Isi alamat secara manual atau coba deteksi lagi.";
        } finally {
            locating.value = false;
        }
    }, (error) => {
        locationError.value = error.code === error.PERMISSION_DENIED
            ? "Izin lokasi ditolak. Izinkan akses lokasi pada browser, lalu coba kembali."
            : error.code === error.TIMEOUT
              ? "Pencarian GPS terlalu lama. Aktifkan lokasi akurat, pindah ke area terbuka, lalu coba lagi."
              : "Lokasi GPS tidak dapat diperoleh. Aktifkan GPS dan coba kembali.";
        locating.value = false;
    }, {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
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

    const capturedLocation = JSON.stringify([f.latitude, f.longitude, f.locationLabel, f.workLocationType]);
    const maximumWidth = 1280;
    const scale = Math.min(1, maximumWidth / video.videoWidth);
    canvas.width = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);
    const context = canvas.getContext("2d");
    if (!context) {
        cameraError.value = "Foto tidak dapat diproses di browser ini. Coba browser lain.";
        return;
    }

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
    const addressLines = wrapCanvasText(context, f.locationLabel || "Lokasi belum tersedia saat foto diambil", canvas.width - (padding * 2));
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
    context.fillStyle = "#d7aa4d";
    context.font = `700 ${addressFontSize}px sans-serif`;
    context.fillText(`Lokasi Kerja: ${f.workLocationType}`, padding, canvas.height - padding);
    canvas.toBlob((blob) => {
        if (capturedLocation !== JSON.stringify([f.latitude, f.longitude, f.locationLabel, f.workLocationType])) {
            cameraError.value = "Lokasi berubah. Silakan ambil foto kembali.";
            return;
        }
        if (!blob) {
            cameraError.value = "Foto gagal diambil. Silakan coba kembali.";
            return;
        }
        if (photoPreview.value) URL.revokeObjectURL(photoPreview.value);
        const filename = `selfie-${new Date().toISOString().replace(/[:.]/g, "-")}.jpg`;
        f.photo = new File([blob], filename, { type: "image/jpeg" });
        photoPreview.value = URL.createObjectURL(blob);
        photoNotice.value = "";
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
    if (props.hasStaff && !props.today?.checkOut && !checkInComplete.value) locate();
});
</script>

<template>
    <Head title="Absenku" />
    <AppLayout>
        <main class="mx-auto max-w-5xl space-y-6 px-4 py-6 sm:px-6 sm:py-8">
            <header class="flex items-start gap-4">
                <Link
                    href="/dashboard/pegawai/absensi"
                    class="mt-1 grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-[#d8c9aa] bg-[#fffdf8] text-[#9a6b16] shadow-sm transition hover:border-[#c99a3d] hover:bg-[#f5ead1]"
                    aria-label="Kembali ke daftar absensi"
                >
                    <ArrowLeft class="h-5 w-5" />
                </Link>
                <div>
                    <p class="text-[10px] font-black uppercase tracking-[0.22em] text-[#a47118]">Absensi Pegawai</p>
                    <h1 class="mt-1 text-2xl font-black text-[#17120a] sm:text-3xl">Absenku</h1>
                    <p class="mt-1 text-sm text-[#766d5d]">Catat kehadiran menggunakan lokasi GPS dan foto langsung dari kamera.</p>
                </div>
            </header>

            <div v-if="!hasStaff" class="mx-auto max-w-2xl rounded-2xl border border-rose-200 bg-rose-50 p-6 font-bold text-rose-700 shadow-sm">
                Profil staff tidak ditemukan pada akun ini.
            </div>

            <section v-else class="mx-auto max-w-2xl overflow-hidden rounded-3xl border border-[#d8c9aa] bg-[#fffdf8] shadow-[0_22px_60px_rgba(54,41,16,0.12)]">
                <header class="relative overflow-hidden bg-[#12110e] p-6 text-[#f8f0df] sm:p-8">
                    <div class="pointer-events-none absolute -right-16 -top-20 h-52 w-52 rounded-full border-[32px] border-[#c99a3d]/10" />
                    <div class="pointer-events-none absolute -bottom-20 right-24 h-36 w-36 rounded-full bg-[#c99a3d]/10 blur-2xl" />
                    <div class="relative flex items-start justify-between gap-4">
                        <div>
                            <span class="grid h-12 w-12 place-items-center rounded-2xl border border-[#6e5729] bg-[#211b11] text-[#d7aa4d]">
                                <UserCheck class="h-6 w-6" />
                            </span>
                            <h2 class="mt-5 text-2xl font-black sm:text-3xl">{{ today?.checkOut ? "Absensi Selesai" : checkoutRequested ? "Absen Pulang" : "Absen Masuk" }}</h2>
                            <p class="mt-1 text-sm font-medium text-[#b7aa94]">
                                {{ new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" }) }}
                            </p>
                        </div>
                        <span class="rounded-full border border-[#66532d] bg-[#201b12] px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-[#d7aa4d]">
                            {{ today?.checkOut ? "Selesai" : checkoutRequested ? "Pulang" : "Masuk" }}
                        </span>
                    </div>
                </header>

                <div v-if="today?.checkOut" class="p-8 text-center sm:p-12">
                    <span class="mx-auto grid h-20 w-20 place-items-center rounded-full border border-emerald-200 bg-emerald-50 text-emerald-600">
                        <CheckCircle2 class="h-10 w-10" />
                    </span>
                    <h3 class="mt-5 text-xl font-black text-[#17120a]">Absensi Hari Ini Selesai</h3>
                    <p class="mt-2 text-sm text-[#766d5d]">Waktu masuk dan pulang Anda sudah tercatat.</p>
                    <Link href="/dashboard/pegawai/absensi" class="mt-6 inline-flex h-11 items-center gap-2 rounded-xl border border-[#d8c9aa] bg-[#f5ead1] px-5 text-sm font-black text-[#8a611c] hover:border-[#c99a3d]">
                        <ArrowLeft class="h-4 w-4" /> Lihat Riwayat Absensi
                    </Link>
                </div>

                <div v-else-if="checkInComplete" class="p-8 text-center sm:p-12">
                    <span class="mx-auto grid h-20 w-20 place-items-center rounded-full border border-emerald-200 bg-emerald-50 text-emerald-600"><CheckCircle2 class="h-10 w-10" /></span>
                    <h3 class="mt-5 text-xl font-black text-[#17120a]">Absen Masuk Berhasil</h3>
                    <p class="mt-2 text-sm text-[#766d5d]">Absen masuk hari ini sudah tercatat. Pilih tombol berikut saat waktunya absen pulang.</p>
                    <div class="mt-6 flex flex-wrap justify-center gap-3">
                        <Link href="/dashboard/pegawai/absensi" class="inline-flex h-11 items-center justify-center rounded-xl border border-[#d8c9aa] bg-white px-5 text-sm font-bold text-[#514a3e]">Lihat Riwayat</Link>
                        <Link href="/dashboard/pegawai/absensi/absenku?action=checkout" class="inline-flex h-11 items-center justify-center rounded-xl bg-[#c99a3d] px-5 text-sm font-black text-[#17120a]">Absen Pulang</Link>
                    </div>
                </div>

                <form v-else class="space-y-6 p-5 sm:p-8" @submit.prevent="submit">
                    <div class="grid gap-5">
                        <label>
                            <span class="label"><MapPin class="h-4 w-4" />Lokasi Kerja</span>
                            <select v-model="f.workLocationType" required class="h-12 w-full rounded-xl border border-[#d8c9aa] bg-[#fffefb] px-4 font-bold text-[#1d1a15]">
                                <option value="Office">Office</option>
                                <option value="Dinas Luar">Dinas Luar</option>
                                <option value="WFC">WFC</option>
                                <option value="WFH">WFH</option>
                            </select>
                        </label>

                        <label>
                            <span class="label"><Navigation class="h-4 w-4" />Alamat Saat Ini</span>
                            <textarea
                                v-model="f.locationLabel"
                                :readonly="!manualAddress"
                                :disabled="locating"
                                maxlength="255"
                                rows="3"
                                :placeholder="locating ? 'Sedang mendeteksi lokasi GPS dan alamat...' : manualAddress ? 'Masukkan alamat lokasi Anda saat ini' : 'Alamat akan terisi otomatis dari GPS'"
                                class="w-full resize-none rounded-xl border border-[#d8c9aa] bg-[#f4efe5] px-4 py-3 text-sm font-semibold leading-relaxed text-[#514a3e] read-only:cursor-not-allowed"
                            ></textarea>
                        </label>
                    </div>

                    <div v-if="locationResolved" class="flex items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-bold text-emerald-700">
                        <CheckCircle2 class="h-4 w-4" />{{ manualAddress ? "GPS terdeteksi · alamat diisi manual" : "Lokasi dan alamat terdeteksi otomatis" }}
                    </div>
                    <div v-if="f.latitude !== null && f.longitude !== null" class="rounded-xl border border-[#e0c58f] bg-[#fffaf0] p-3 text-xs leading-relaxed text-[#665330]">
                        <p class="font-bold">Koordinat GPS: {{ f.latitude.toFixed(6) }}, {{ f.longitude.toFixed(6) }}</p>
                        <p class="mt-1">{{ f.locationAccuracy !== null ? `Perkiraan akurasi perangkat: ±${Math.ceil(f.locationAccuracy)} meter.` : 'Akurasi GPS tidak tersedia dari perangkat.' }} Alamat otomatis adalah objek terdekat di peta dan dapat berbeda dari titik GPS.</p>
                    </div>
                    <div v-if="locationError" class="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm font-semibold text-rose-700">
                        {{ locationError }}
                    </div>
                    <button type="button" :disabled="locating" class="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-[#e0c58f] bg-[#f5ead1] font-black text-[#8a611c] transition hover:border-[#c99a3d] hover:bg-[#efe0c0] disabled:opacity-50" @click="locate">
                        <Navigation class="h-4 w-4" :class="locating ? 'animate-pulse' : ''" />
                        {{ locating ? "Mendeteksi Lokasi..." : locationResolved ? "Perbarui Lokasi GPS" : "Coba Deteksi Lokasi" }}
                    </button>
                    <p class="text-center text-[10px] text-[#8c826f]">
                        Data alamat © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer" class="font-bold text-[#8a611c] underline">OpenStreetMap contributors</a>
                    </p>
                    <p v-if="f.errors.locationLabel || f.errors.latitude || f.errors.longitude" class="text-sm font-bold text-rose-600">
                        {{ f.errors.locationLabel || f.errors.latitude || f.errors.longitude }}
                    </p>

                    <p v-if="photoNotice" class="text-sm font-bold text-amber-800">{{ photoNotice }}</p>
                    <div class="overflow-hidden rounded-2xl border-2 border-dashed border-[#d8c9aa] bg-[#f7f1e5]">
                        <div v-if="photoPreview" class="relative bg-[#12110e]">
                            <img :src="photoPreview" alt="Hasil foto selfie" class="aspect-[4/3] w-full object-cover" />
                            <div class="absolute inset-x-0 bottom-0 flex justify-center bg-gradient-to-t from-black/80 to-transparent p-4 pt-16">
                                <button type="button" class="flex h-11 items-center gap-2 rounded-full border border-[#d8c9aa] bg-[#fffdf8] px-5 text-sm font-black text-[#1d1a15] shadow-xl" @click="retakePhoto">
                                    <RefreshCcw class="h-4 w-4 text-[#9a6b16]" />Ambil Ulang
                                </button>
                            </div>
                            <div class="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-3 py-1 text-xs font-bold text-white shadow">
                                <CheckCircle2 class="h-3.5 w-3.5" />Foto siap
                            </div>
                        </div>

                        <div v-else class="p-8 text-center sm:p-10">
                            <span class="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-[#e0c58f] bg-[#f5ead1] text-[#9a6b16]">
                                <Camera class="h-7 w-7" />
                            </span>
                            <p class="mt-4 font-black text-[#1d1a15]">Ambil Foto Selfie Langsung</p>
                            <p class="mx-auto mt-1 max-w-md text-xs leading-relaxed text-[#766d5d]">Foto wajib diambil melalui kamera perangkat dan tidak dapat dipilih dari galeri.</p>
                            <button type="button" :disabled="cameraLoading" class="mx-auto mt-5 flex h-11 items-center justify-center gap-2 rounded-xl bg-[#c99a3d] px-6 text-sm font-black text-[#17120a] shadow-lg shadow-[#c99a3d]/20 transition hover:bg-[#d9ad52] disabled:opacity-50" @click="startCamera">
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
                    <p v-if="f.errors.attendanceAction" class="text-sm font-bold text-rose-600">{{ f.errors.attendanceAction }}</p>
                    <p v-if="f.errors.photo" class="text-sm font-bold text-rose-600">{{ f.errors.photo }}</p>

                    <button :disabled="f.processing || !f.photo || !locationResolved" class="h-14 w-full rounded-2xl bg-[#12110e] text-base font-black text-[#f7efdf] shadow-xl shadow-black/15 transition hover:bg-[#292319] disabled:cursor-not-allowed disabled:opacity-40 sm:text-lg">
                        {{ f.processing ? "Mengirim..." : checkoutRequested ? "Kirim Absen Pulang" : "Kirim Absen Masuk" }}
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
                <div v-if="cameraActive" class="fixed inset-0 z-[200] h-[100dvh] overflow-hidden bg-black" role="dialog" aria-modal="true" aria-label="Kamera selfie absensi">
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

                    <div class="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/55 to-transparent px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-12 text-white sm:px-8 sm:pb-8">
                        <div class="mx-auto max-w-3xl text-center">
                            <p class="font-mono text-base font-black tracking-wide sm:text-xl">{{ currentDateTime }}</p>
                            <p class="mx-auto mt-2 max-w-2xl text-xs font-semibold leading-relaxed text-white/90 sm:text-sm">
                                <MapPin class="mr-1 inline h-4 w-4 text-[#d7aa4d]" />
                                {{ locationResolved ? f.locationLabel : "Menunggu lokasi GPS dan alamat..." }}
                            </p>
                            <p class="mt-1 text-xs font-bold text-[#d7aa4d]">Lokasi Kerja: {{ f.workLocationType }}</p>

                            <p v-if="cameraError" role="alert" class="mx-auto mt-3 max-w-md rounded-xl bg-red-900/90 p-3 text-xs font-bold text-white">{{ cameraError }}</p>
                            <button
                                type="button"
                                aria-label="Ambil foto selfie"
                                class="pointer-events-auto mx-auto mt-5 grid h-16 w-16 place-items-center rounded-full border-4 border-[#fff8e9] bg-[#c99a3d] text-[#17120a] shadow-2xl transition hover:bg-[#d9ad52] active:scale-90 sm:h-20 sm:w-20"
                                title="Ambil foto"
                                @click="capturePhoto"
                            >
                                <Camera class="h-7 w-7 sm:h-9 sm:w-9" />
                            </button>
                            <p v-if="!locationResolved" class="mt-2 text-xs font-bold text-amber-300">Foto bisa diambil, tetapi GPS dan alamat tetap diperlukan untuk mengirim absensi. Jika lokasi berubah, foto perlu diambil ulang.</p>
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
    color: #806d4c;
}
</style>
