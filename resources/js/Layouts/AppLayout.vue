<script setup lang="ts">
import { Link, usePage } from "@inertiajs/vue3";
import { computed, nextTick, onMounted, watch } from "vue";
import {
    LayoutDashboard,
    PieChart,
    Users,
    FileText,
    CheckCircle,
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
    FolderOpen,
    Fingerprint,
} from "@lucide/vue";
const page = usePage();
const user = computed(() => (page.props.auth as any)?.user);
const branding = computed(
    () =>
        (page.props.branding as any) || {
            appName: "Notaris Digital",
            officeName: "Kantor Notaris",
            logoUrl: null,
            faviconUrl: null,
        },
);
const appName = computed(
    () => branding.value.appName?.trim() || "Notaris Digital",
);
const officeName = computed(
    () => branding.value.officeName?.trim() || "Kantor Notaris",
);
const logoUrl = computed(() => branding.value.logoUrl || "");
const faviconUrl = computed(
    () => branding.value.faviconUrl || logoUrl.value || "",
);
const role = computed(() => user.value?.role || "");
const sections = [
    {
        title: "Utama",
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
        title: "Billing",
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
        title: "Operasional",
        items: [
            [
                "Data Client",
                Users,
                "/dashboard/clients",
                ["ADMINISTRATOR", "PIMPINAN", "STAFFADMIN"],
            ],
            [
                "Data Berkas",
                FileText,
                "/dashboard/jobs/inbound",
                ["ADMINISTRATOR", "PIMPINAN", "STAFFADMIN", "OB"],
            ],
            [
                "Daftar Akta",
                ClipboardList,
                "/dashboard/akta",
                ["ADMINISTRATOR", "PIMPINAN", "STAFFADMIN", "OB"],
            ],
        ],
    },
    {
        title: "Pegawai",
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
                PieChart,
                "/dashboard/productivity",
                ["ADMINISTRATOR", "PIMPINAN"],
            ],
        ],
    },
    {
        title: "Manajemen Sistem",
        items: [
            [
                "User Login",
                UserCog,
    FolderOpen,
    Fingerprint,
                "/dashboard/system/users",
                ["ADMINISTRATOR", "PIMPINAN"],
            ],
            [
                "Laporan",
                FileText,
                "/dashboard/reports",
                ["ADMINISTRATOR", "PIMPINAN"],
            ],
            [
                "Audit Log",
                ShieldCheck,
                "/dashboard/audit",
                ["ADMINISTRATOR", "PIMPINAN"],
            ],
            ["Settings", Settings, "/dashboard/settings", ["ADMINISTRATOR"]],
        ],
    },
];
const active = (href: string) =>
    page.url.split("?")[0] === href ||
    (href === "/dashboard/quotation" &&
        page.url.startsWith("/dashboard/quotation")) ||
    (href === "/dashboard/jobs/inbound" &&
        page.url.startsWith("/dashboard/jobs") &&
        !page.url.includes("completed"));
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
        let favicon =
            document.querySelector<HTMLLinkElement>('link[rel~="icon"]');
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
    { label: "Data Berkas", href: "/dashboard/jobs/inbound", icon: FolderOpen },
    { label: "Data Akta", href: "/dashboard/akta", icon: FileText },
    { label: "Absensi", href: "/dashboard/pegawai/absensi/absenku", icon: Fingerprint },
    { label: "Data Akta", href: "/dashboard/akta", icon: ClipboardList },
    { label: "Rekap Absen", href: "/dashboard/pegawai/absensi", icon: Clock },
]);

</script>
<template>
    <div
        class="flex h-screen overflow-hidden bg-[var(--background)] pb-16 text-[var(--foreground)] md:pb-0"
    >
        <aside
            class="relative z-50 hidden h-screen w-64 flex-col border-r border-[var(--sidebar-border)] bg-[var(--sidebar)] text-sm shadow-xl md:flex"
        >
            <div class="flex min-h-20 items-center px-5 py-3">
                <Link href="/dashboard" class="flex min-w-0 items-center gap-3">
                    <img
                        v-if="logoUrl"
                        :src="logoUrl"
                        :alt="appName"
                        class="h-12 w-12 shrink-0 rounded-xl border border-[var(--sidebar-border)] bg-[#1b1812] object-contain shadow-sm"
                    />
                    <div
                        v-else
                        class="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--primary)] shadow-lg"
                    >
                        <FileText class="h-6 w-6 text-white" />
                    </div>
                    <div class="min-w-0">
                        <span
                            class="font-display block truncate text-base font-black leading-tight text-[#f2e8d5]"
                            :title="appName"
                        >
                            {{ appName }}
                        </span>
                        <span
                            class="mt-1 block line-clamp-2 text-[10px] font-semibold uppercase leading-tight tracking-wider text-[var(--muted-foreground)]"
                            :title="officeName"
                        >
                            {{ officeName }}
                        </span>
                    </div>
                </Link>
            </div>
            <div class="custom-scrollbar min-h-0 flex-1 overflow-y-auto px-3">
                <div class="space-y-6 py-4">
                    <section v-for="s in sections" class="px-2">
                        <template
                            v-if="s.items.some((i: any) => i[3].includes(role))"
                            ><h2
                                class="mb-3 px-4 font-bold uppercase tracking-widest text-[color-mix(in_srgb,var(--muted-foreground)_60%,transparent)]"
                            >
                                {{ s.title }}
                            </h2>
                            <div class="space-y-1">
                                <template v-for="i in s.items"
                                    ><Link
                                        v-if="(i[3] as string[]).includes(role)"
                                        :href="i[2] as string"
                                        class="group relative flex h-11 items-center gap-3 rounded-xl px-4 font-semibold transition-all"
                                        :class="
                                            active(i[2] as string)
                                                ? 'bg-[var(--primary)] text-white shadow-md'
                                                : 'text-[var(--sidebar-foreground)] hover:bg-[var(--sidebar-accent)] hover:text-[var(--primary)]'
                                        "
                                        ><component
                                            :is="i[1]"
                                            class="h-[18px] w-[18px]" /><span>{{
                                            i[0]
                                        }}</span
                                        ><span
                                            v-if="active(i[2] as string)"
                                            class="absolute right-2 h-1.5 w-1.5 rounded-full bg-white"
                                        ></span></Link
                                ></template></div
                        ></template>
                    </section>
                </div>
            </div>
        </aside>
        <div class="relative z-10 flex min-w-0 flex-1 flex-col overflow-hidden">
            <!-- Mobile Top Header Bar -->
            <header class="flex h-16 items-center justify-between border-b border-[var(--sidebar-border)] bg-[var(--sidebar)] px-4 shadow-sm md:hidden">
                <Link href="/dashboard" class="flex items-center gap-2">
                    <img v-if="logoUrl" :src="logoUrl" :alt="appName" class="h-8 w-8 object-contain" />
                    <span class="font-display truncate text-base font-black text-[#f2e8d5]">{{ appName }}</span>
                </Link>
                <div class="flex items-center gap-2">
                    <div class="grid h-9 w-9 place-items-center rounded-full bg-[color-mix(in_srgb,var(--primary)_15%,white)] text-xs font-black text-[var(--primary)] border border-[var(--primary)]/20">
                        {{ user?.fullName?.slice(0, 2).toUpperCase() }}
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
            <header
                class="hidden h-20 items-center justify-between border-b border-[var(--border)] bg-[#fffdf8]/95 px-8 shadow-sm backdrop-blur md:flex"
            >
                <div class="relative w-full max-w-lg">
                    <Search
                        class="absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[var(--muted-foreground)]"
                    /><input
                        placeholder="Search..."
                        class="h-11 w-full rounded-xl border-0 bg-[color-mix(in_srgb,var(--muted)_30%,transparent)] pl-12 text-sm focus:ring-2 focus:ring-[var(--primary)]"
                    />
                </div>
                <div class="flex items-center gap-2">
                    <button
                        class="grid h-10 w-10 place-items-center rounded-full bg-[color-mix(in_srgb,var(--muted)_30%,transparent)] text-slate-600 hover:text-slate-900"
                    >
                        <Bell class="h-[18px] w-[18px]" />
                    </button>
                    <div class="mx-2 h-8 w-px bg-[var(--border)]"></div>
                    <div
                        class="grid h-10 w-10 place-items-center rounded-full border-2 border-[var(--primary)]/20 bg-[color-mix(in_srgb,var(--primary)_12%,white)] font-bold text-[var(--primary)]"
                    >
                        {{ user?.fullName?.slice(0, 2).toUpperCase() }}
                    </div>
                    <Link
                        href="/logout"
                        method="post"
                        as="button"
                        aria-label="Logout"
                        title="Logout"
                        class="ml-1 grid h-10 w-10 place-items-center rounded-full border border-[var(--border)] bg-[#fffdf8] text-[var(--muted-foreground)] shadow-sm transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600"
                    >
                        <LogOut class="h-[18px] w-[18px]" />
                    </Link>
                </div>
            </header>
            <main
                class="flex-1 overflow-y-auto bg-[var(--background)] p-4 md:p-8"
            >
                <slot />
            </main>
        </div>
        <nav aria-label="Navigasi mobile" class="fixed inset-x-0 bottom-0 z-50 flex items-end justify-around rounded-t-3xl border-t border-[#e7e2da] bg-[#fffefa] px-1 pt-2 shadow-[0_-4px_20px_rgba(0,0,0,.08)] md:hidden" style="padding-bottom:max(.5rem,env(safe-area-inset-bottom))">
            <Link v-for="(item, index) in mobile" :key="index" :href="item.href" class="flex min-h-14 w-1/5 flex-col items-center justify-center gap-1 text-center text-[10px] font-semibold leading-tight text-slate-700" :class="active(item.href) ? 'text-emerald-700' : ''">
                <span :class="index === 2 ? '-mt-7 grid h-14 w-14 place-items-center rounded-full border-4 border-[#fffefa] bg-gradient-to-b from-emerald-400 to-emerald-900 text-white shadow-md' : ''"><component :is="item.icon" :class="index === 2 ? 'h-7 w-7' : 'h-6 w-6'" /></span><span>{{ item.label }}</span>
            </Link>
        </nav>
    </div>
</template>
