<script setup lang="ts">
import { Link, router, usePage } from "@inertiajs/vue3";
import { computed, nextTick, onMounted, ref, watch } from "vue";
import {
    LayoutDashboard,
    PieChart,
    Users,
    FileText,
    ClipboardList,
    Receipt,
    FileSignature,
    CreditCard,
    Contact,
    Clock,
    FileBarChart,
    ShieldCheck,
    Settings,
    LogOut,
    Search,
    Bell,
    UserCog,
    Menu,
    FolderOpen,
    Fingerprint,
    TrendingUp,
    CircleHelp,
    Mail,
} from "@lucide/vue";

defineProps<{ hideMobileHeader?: boolean; dashboardTheme?: boolean }>();

const sidebarCollapsed = ref(false);
const searchQuery = ref("");
const searchModule = ref("jobs");

const submitSearch = () => {
    const query = searchQuery.value.trim();
    if (!query) return;
    const destinations: Record<string, string> = {
        jobs: "/dashboard/jobs",
        clients: "/dashboard/clients",
        deeds: "/dashboard/akta",
        invoices: "/dashboard/invoice",
    };
    router.get(destinations[searchModule.value] || destinations.jobs, { search: query });
};

const page = usePage();
const user = computed(() => (page.props.auth as any)?.user);
const profilePhoto = computed(() => (page.props.auth as any)?.photoUrl || "");
const branding = computed(
    () =>
        (page.props.branding as any) || {
            appName: "Notaris Digital",
            officeName: "Kantor Notaris & PPAT",
            logoUrl: null,
            faviconUrl: null,
        },
);
const appName = computed(
    () => branding.value.appName?.trim() || "Notaris Digital",
);
const officeName = computed(
    () => branding.value.officeName?.trim() || "Novia Roza, S.H., M.Kn",
);
const logoUrl = computed(() => branding.value.logoUrl || "");
const faviconUrl = computed(
    () => branding.value.faviconUrl || logoUrl.value || "",
);
const role = computed(() => user.value?.role || "");

const sections = [
    {
        title: "UTAMA",
        items: [
            [
                "Dashboard",
                LayoutDashboard,
                "/dashboard",
                ["ADMINISTRATOR", "PIMPINAN", "STAFFADMIN", "OB"],
            ],
            [
                "Statistik",
                PieChart,
                "/dashboard/stats",
                ["ADMINISTRATOR", "PIMPINAN"],
            ],

        ],
    },
    {
        title: "BILLING",
        items: [
            [
                "Quotation",
                FileSignature,
                "/dashboard/quotation",
                ["ADMINISTRATOR", "PIMPINAN", "STAFFADMIN"],
            ],
            [
                "Invoice",
                Receipt,
                "/dashboard/invoice",
                ["ADMINISTRATOR", "PIMPINAN", "STAFFADMIN", "OB"],
            ],
            [
                "Keuangan",
                CreditCard,
                "/dashboard/finance",
                ["ADMINISTRATOR", "PIMPINAN"],
            ],

        ],
    },
    {
        title: "OPERASIONAL",
        items: [
            [
                "Data Client",
                Users,
                "/dashboard/clients",
                ["ADMINISTRATOR", "PIMPINAN", "STAFFADMIN"],
            ],
            [
                "Data Berkas",
                FolderOpen,
                "/dashboard/jobs/inbound",
                ["ADMINISTRATOR", "PIMPINAN", "STAFFADMIN", "OB"],
            ],
            [
                "Daftar Akta",
                ClipboardList,
                "/dashboard/akta",
                ["ADMINISTRATOR", "PIMPINAN", "STAFFADMIN", "OB"],
            ],
            [
                "Template Dokumen",
                FileText,
                "/dashboard/modules",
                ["ADMINISTRATOR", "PIMPINAN", "STAFFADMIN"],
            ],
        ],
    },
    {
        title: "PEGAWAI",
        items: [
            [
                "Data Pegawai",
                Contact,
                "/dashboard/pegawai/data",
                ["ADMINISTRATOR", "PIMPINAN"],
            ],
            [
                "Data Tugas",
                ClipboardList,
                "/dashboard/tasks",
                ["ADMINISTRATOR", "PIMPINAN", "STAFFADMIN", "OB"],
            ],
            [
                "Absensi",
                Clock,
                "/dashboard/pegawai/absensi",
                ["ADMINISTRATOR", "PIMPINAN", "STAFFADMIN", "OB"],
            ],
            [
                "Laporan Absensi",
                FileBarChart,
                "/dashboard/pegawai/laporan",
                ["ADMINISTRATOR", "PIMPINAN"],
            ],
            [
                "Produktivitas",
                TrendingUp,
                "/dashboard/productivity",
                ["ADMINISTRATOR", "PIMPINAN"],
            ],
        ],
    },
    {
        title: "MANAJEMEN SISTEM",
        items: [
            [
                "Pengaturan",
                Settings,
                "/dashboard/settings",
                ["ADMINISTRATOR", "PIMPINAN"],
            ],
            [
                "Pengguna & Hak Akses",
                UserCog,
                "/dashboard/system/users",
                ["ADMINISTRATOR", "PIMPINAN"],
            ],
        ],
    },
];

const active = (href: string) => {
    const cleanUrl = page.url.split("?")[0].split("#")[0];
    if (href === "/dashboard") {
        return cleanUrl === "/dashboard";
    }
    if (href === "/dashboard/quotation") {
        return cleanUrl.startsWith("/dashboard/quotation");
    }
    if (href === "/dashboard/jobs/inbound") {
        return cleanUrl.startsWith("/dashboard/jobs") && !cleanUrl.includes("completed");
    }
    return cleanUrl === href;
};

const primaryColor = computed(
    () =>
        !branding.value.primaryColor || branding.value.primaryColor === "#F47EAB"
            ? "#C99A3D"
            : branding.value.primaryColor,
);

const applyPrimaryColor = (color: string) => {
    if (!color) return;
    const root = document.documentElement;
    root.style.setProperty("--primary", color);
    root.style.setProperty(
        "--primary-hover",
        `color-mix(in srgb, ${color} 85%, black)`
    );
    root.style.setProperty(
        "--primary-light",
        `color-mix(in srgb, ${color} 15%, white)`
    );
    root.style.setProperty(
        "--sidebar-accent",
        `color-mix(in srgb, ${color} 12%, transparent)`
    );
};

const syncBrowserBranding = () => {
    if (faviconUrl.value) {
        let favicon = document.querySelector<HTMLLinkElement>('link[rel~="icon"]');
        if (!favicon) {
            favicon = document.createElement("link");
            favicon.rel = "icon";
            document.head.appendChild(favicon);
        }
        favicon.href = faviconUrl.value;
    }

    const separator = " - ";
    const separatorIndex = document.title.lastIndexOf(separator);
    document.title =
        separatorIndex >= 0
            ? `${document.title.slice(0, separatorIndex)}${separator}${appName.value}`
            : `${document.title} - ${appName.value}`;
};

const queueBrowserBrandingSync = () =>
    nextTick(() => requestAnimationFrame(syncBrowserBranding));

onMounted(() => {
    document.documentElement.classList.remove("dark");
    localStorage.setItem("theme", "light");
    applyPrimaryColor(primaryColor.value);
    queueBrowserBrandingSync();
});

watch([() => page.url, appName, faviconUrl], queueBrowserBrandingSync);
watch(primaryColor, (newColor) => applyPrimaryColor(newColor));

const mobile = computed(() => [
    { label: "Data Berkas", href: "/dashboard/jobs/inbound", icon: FolderOpen, color: 'text-amber-600' },
    { label: "Data Akta", href: "/dashboard/akta", icon: FileText, color: 'text-emerald-600' },
    { label: "Absensi", href: "/dashboard/pegawai/absensi/absenku", icon: Fingerprint, color: 'text-white' },
    { label: "Data Tugas", href: "/dashboard/tasks", icon: ClipboardList, color: 'text-blue-600' },
    { label: "Rekap Absen", href: "/dashboard/pegawai/absensi", icon: Clock, color: 'text-violet-600' },
]);
</script>

<template>
    <div
        class="desktop-workspace flex h-screen overflow-hidden bg-[#F7F4EB] pb-16 text-[#1c1917] md:pb-0"
    >
        <!-- Desktop Luxury Sidebar -->
        <aside
            v-show="!sidebarCollapsed"
            class="relative z-50 hidden h-screen w-64 shrink-0 flex-col border-r border-[#2c251b] bg-[#12110e] text-sm shadow-2xl md:flex select-none"
        >
            <!-- Brand Header -->
            <div class="flex flex-col items-center px-4 pt-6 pb-4 border-b border-[#252017] text-center">
                <Link href="/dashboard" class="flex flex-col items-center group">
                    <img
                        v-if="logoUrl"
                        :src="logoUrl"
                        :alt="appName"
                        class="h-12 w-12 object-contain filter drop-shadow-[0_2px_10px_rgba(212,175,55,0.35)] transition transform group-hover:scale-105"
                    />
                    <img
                        v-else
                        src="/images/dashboard/nr-gold-logo.png"
                        alt="Logo Notaris"
                        class="h-12 w-12 object-contain filter drop-shadow-[0_2px_10px_rgba(212,175,55,0.35)] transition transform group-hover:scale-105"
                    />
                    <h1 class="mt-2.5 text-sm font-black tracking-widest text-[#E5B842] uppercase font-serif">
                        {{ appName }}
                    </h1>
                    <p class="text-[9px] font-bold tracking-widest text-[#C4B28E] uppercase mt-0.5">
                        KANTOR NOTARIS & PPAT
                    </p>
                    <p class="text-[9px] text-[#8C7D62] font-medium tracking-wide">
                        NOVIA ROZA, S.H., M.Kn
                    </p>
                </Link>
            </div>

            <!-- Navigation Menu -->
            <div class="custom-scrollbar min-h-0 flex-1 overflow-y-auto px-3 py-3 space-y-5">
                <section v-for="s in sections" :key="s.title" class="px-1">
                    <template v-if="s.items.some((i: any) => i[3].includes(role))">
                        <h2 class="mb-2 px-3 text-[10px] font-bold tracking-widest uppercase text-[#736A5B]">
                            {{ s.title }}
                        </h2>
                        <div class="space-y-1">
                            <template v-for="i in s.items" :key="i[0]">
                                <Link
                                    v-if="(i[3] as string[]).includes(role)"
                                    :href="i[2] as string"
                                    class="group relative flex h-10 items-center gap-3 rounded-xl px-3.5 text-xs font-semibold transition-all"
                                    :class="
                                        active(i[2] as string)
                                            ? 'bg-gradient-to-r from-[#F5C344] to-[#E6A817] text-stone-950 font-bold shadow-md shadow-amber-900/25'
                                            : 'text-[#AFA695] hover:bg-white/[0.06] hover:text-[#F3BA2F]'
                                    "
                                >
                                    <component
                                        :is="i[1]"
                                        class="h-4 w-4 shrink-0 transition-transform group-hover:scale-110"
                                        :class="active(i[2] as string) ? 'text-stone-950' : 'text-[#8A8170] group-hover:text-[#F3BA2F]'"
                                    />
                                    <span class="truncate">{{ i[0] }}</span>
                                    <span
                                        v-if="active(i[2] as string)"
                                        class="ml-auto h-1.5 w-1.5 rounded-full bg-stone-950/80"
                                    ></span>
                                </Link>
                            </template>
                        </div>
                    </template>
                </section>
            </div>

            <!-- Bottom Gold Wave Decoration -->
            <div class="pointer-events-none relative mt-auto w-full overflow-hidden leading-none opacity-80" style="height: 72px;">
                <img src="/images/dashboard/sidebar-gold-wave.png" alt="" class="w-full h-full object-cover object-top select-none" />
            </div>
        </aside>

        <!-- Main Body Area -->
        <div class="relative z-10 flex min-w-0 flex-1 flex-col overflow-hidden">
            <!-- Mobile Top Header Bar -->
            <header v-if="!hideMobileHeader" class="flex h-16 items-center justify-between border-b border-[#2c251b] bg-[#12110e] px-4 shadow-sm md:hidden">
                <Link href="/dashboard" class="flex items-center gap-2">
                    <img v-if="logoUrl" :src="logoUrl" :alt="appName" class="h-8 w-8 rounded-full bg-white object-contain" />
                    <img v-else src="/images/dashboard/nr-gold-logo.png" :alt="appName" class="h-8 w-8 object-contain" />
                    <span class="font-serif truncate text-base font-black text-[#f2e8d5]">{{ appName }}</span>
                </Link>
                <div class="flex items-center gap-2">
                    <div class="grid h-9 w-9 place-items-center overflow-hidden rounded-full bg-[#fef3c7] text-xs font-black text-amber-800 border border-amber-300">
                        <img v-if="profilePhoto" :src="profilePhoto" alt="Foto profil" class="h-full w-full object-cover" />
                        <span v-else>{{ user?.fullName ? user.fullName.slice(0, 2).toUpperCase() : 'NR' }}</span>
                    </div>
                    <Link
                        href="/logout"
                        method="post"
                        as="button"
                        aria-label="Logout"
                        title="Logout"
                        class="grid h-9 w-9 place-items-center rounded-full border border-[#5b4825] text-[#d8d0c0] transition hover:border-rose-500/60 hover:bg-rose-500/10 hover:text-rose-400"
                    >
                        <LogOut class="h-4 w-4" />
                    </Link>
                </div>
            </header>

            <!-- Desktop Luxury Top Header Bar -->
            <header
                class="hidden h-16 items-center justify-between border-b border-[#EAE3D2] bg-white px-6 shadow-xs md:flex shrink-0 select-none"
            >
                <!-- Left: Hamburger & Search Box -->
                <div class="flex items-center gap-3.5 flex-1 max-w-2xl">
                    <button
                        type="button"
                        class="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-stone-500 hover:bg-stone-100 hover:text-stone-800 transition"
                        :aria-label="sidebarCollapsed ? 'Buka menu' : 'Tutup menu'"
                        @click="sidebarCollapsed = !sidebarCollapsed"
                    >
                        <Menu class="h-5 w-5" />
                    </button>
                    <form class="relative flex-1 max-w-lg" role="search" @submit.prevent="submitSearch">
                        <Search class="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                        <input
                            v-model="searchQuery"
                            type="text"
                            aria-label="Cari data"
                            placeholder="Cari client, berkas, akta, invoice, atau nomor registrasi..."
                            class="h-10 w-full rounded-xl border border-stone-200 bg-[#FAF8F5] pl-10 pr-20 text-xs text-stone-800 placeholder:text-stone-400 focus:border-[#D4AF37] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20 transition"
                        />
                        <div class="absolute right-2.5 top-1/2 -translate-y-1/2 rounded border border-stone-200 bg-white px-1.5 py-0.5 text-[10px] font-semibold text-stone-400">
                            Ctrl + K
                        </div>
                    </form>
                </div>

                <!-- Right: Icons & User Profile -->
                <div class="flex items-center gap-2.5">
                    <button
                        type="button"
                        class="relative grid h-9 w-9 place-items-center rounded-lg text-stone-600 hover:bg-stone-100 hover:text-stone-900 transition"
                        title="Notifikasi"
                    >
                        <Bell class="h-4 w-4" />
                        <span class="absolute right-2 top-2 h-2 w-2 rounded-full bg-[#EAB308] ring-2 ring-white"></span>
                    </button>
                    <button
                        type="button"
                        class="grid h-9 w-9 place-items-center rounded-lg text-stone-600 hover:bg-stone-100 hover:text-stone-900 transition"
                        title="Pesan / Email"
                    >
                        <Mail class="h-4 w-4" />
                    </button>
                    <button
                        type="button"
                        class="grid h-9 w-9 place-items-center rounded-lg text-stone-600 hover:bg-stone-100 hover:text-stone-900 transition"
                        title="Bantuan"
                    >
                        <CircleHelp class="h-4 w-4" />
                    </button>

                    <div class="mx-1 h-6 w-px bg-stone-200"></div>

                    <!-- Profile Info -->
                    <div class="flex items-center gap-2.5 pl-1">
                        <div
                            class="grid h-9 w-9 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-[#F5C344] to-[#C99A3D] text-xs font-black text-stone-900 shadow-xs border border-amber-300"
                        >
                            <img v-if="profilePhoto" :src="profilePhoto" alt="" class="h-full w-full object-cover" />
                            <span v-else>{{ user?.fullName ? user.fullName.slice(0, 2).toUpperCase() : 'NR' }}</span>
                        </div>
                        <div class="text-left hidden lg:block">
                            <p class="text-xs font-bold text-stone-900 leading-tight">
                                {{ user?.fullName || 'Novia Roza, S.H., M.Kn' }}
                            </p>
                            <p class="text-[10px] font-medium text-stone-500">
                                {{ user?.role === 'ADMINISTRATOR' || user?.role === 'PIMPINAN' ? 'Kepala Notaris' : user?.role || 'Staff Notaris' }}
                            </p>
                        </div>
                        <Link
                            href="/logout"
                            method="post"
                            as="button"
                            aria-label="Logout"
                            title="Logout"
                            class="ml-1 grid h-8 w-8 place-items-center rounded-lg text-stone-400 transition hover:bg-rose-50 hover:text-rose-600"
                        >
                            <LogOut class="h-4 w-4" />
                        </Link>
                    </div>
                </div>
            </header>

            <!-- Main Content Slot -->
            <main
                class="flex-1 overflow-y-auto bg-[#F7F4EB] p-4 md:p-6"
            >
                <slot />
            </main>
        </div>

        <!-- Mobile Bottom Nav -->
        <nav aria-label="Navigasi mobile" class="fixed inset-x-0 bottom-0 z-50 flex items-end justify-around rounded-t-3xl border-t border-[#e7e2da] bg-[#fffefa] px-1 pt-2 shadow-[0_-4px_20px_rgba(0,0,0,.08)] md:hidden" style="padding-bottom:max(.5rem,env(safe-area-inset-bottom))">
            <Link v-for="(item, index) in mobile" :key="index" :href="item.href" class="flex min-h-14 w-1/5 flex-col items-center justify-center gap-1 text-center text-[10px] font-semibold leading-tight text-slate-700" :class="active(item.href) ? 'text-emerald-700' : ''">
                <span :class="index === 2 ? '-mt-7 grid h-14 w-14 place-items-center rounded-full border-4 border-[#fffefa] bg-gradient-to-b from-emerald-400 to-emerald-900 text-white shadow-md' : ''"><component :is="item.icon" aria-hidden="true" :class="[item.color, index === 2 ? 'h-8 w-8' : 'h-7 w-7']" /></span><span>{{ item.label }}</span>
            </Link>
        </nav>
    </div>
</template>
