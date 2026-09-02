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
    () => branding.value.primaryColor || "#F47EAB"
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
const mobile = computed(() =>
    ["STAFFADMIN", "OB"].includes(role.value)
        ? [
              ["Home", "/dashboard", "/uploads/home.png"],
              ["Absen", "/dashboard/pegawai/absensi", "/uploads/camera.png"],
              ["Berkas", "/dashboard/jobs/inbound", "/uploads/lapor.png"],
          ]
        : [
              ["Home", "/dashboard", "/uploads/home.png"],
              ["Berkas", "/dashboard/jobs/inbound", "/uploads/lapor.png"],
              ["Setting", "/dashboard/settings", ""],
          ],
);
</script>
<template>
    <div
        class="flex h-screen overflow-hidden bg-[var(--sidebar)] pb-16 text-[var(--foreground)] md:pb-0"
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
                        class="h-12 w-12 shrink-0 rounded-xl bg-white object-contain shadow-sm"
                    />
                    <div
                        v-else
                        class="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--primary)] shadow-lg"
                    >
                        <FileText class="h-6 w-6 text-white" />
                    </div>
                    <div class="min-w-0">
                        <span
                            class="block truncate text-base font-black leading-tight"
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
            <div
                class="mt-auto border-t border-[var(--sidebar-border)] bg-[var(--muted)]/20 p-4"
            >
                <div class="flex items-center gap-3 px-2 py-3">
                    <div
                        class="grid h-10 w-10 place-items-center rounded-full bg-[color-mix(in_srgb,var(--primary)_15%,white)] font-bold text-[var(--primary)]"
                    >
                        {{ user?.fullName?.slice(0, 2).toUpperCase() }}
                    </div>
                    <div class="min-w-0 flex-1">
                        <span class="block truncate text-sm font-bold">{{
                            user?.fullName
                        }}</span
                        ><span
                            class="block truncate font-medium uppercase text-[var(--muted-foreground)]"
                            >{{ role }}</span
                        >
                    </div>
                    <Link
                        href="/logout"
                        method="post"
                        as="button"
                        class="text-[var(--muted-foreground)] hover:text-red-500"
                        ><LogOut class="h-4 w-4"
                    /></Link>
                </div>
            </div>
        </aside>
        <div class="relative z-10 flex min-w-0 flex-1 flex-col overflow-hidden">
            <!-- Mobile Top Header Bar -->
            <header class="flex h-16 items-center justify-between border-b border-[var(--border)] bg-white px-4 shadow-sm md:hidden">
                <Link href="/dashboard" class="flex items-center gap-2">
                    <img v-if="logoUrl" :src="logoUrl" :alt="appName" class="h-8 w-8 object-contain" />
                    <span class="truncate text-base font-black text-slate-800">{{ appName }}</span>
                </Link>
                <div class="flex items-center gap-2">
                    <div class="grid h-9 w-9 place-items-center rounded-full bg-[color-mix(in_srgb,var(--primary)_15%,white)] text-xs font-black text-[var(--primary)] border border-[var(--primary)]/20">
                        {{ user?.fullName?.slice(0, 2).toUpperCase() }}
                    </div>
                </div>
            </header>
            <header
                class="hidden h-20 items-center justify-between border-b border-[var(--border)] bg-[var(--background)] px-8 shadow-sm md:flex"
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
                </div>
            </header>
            <main
                class="flex-1 overflow-y-auto bg-[color-mix(in_srgb,var(--background)_80%,transparent)] p-4 backdrop-blur-sm md:p-8"
            >
                <slot />
            </main>
        </div>
        <nav
            class="fixed inset-x-0 bottom-0 z-50 flex h-16 items-center justify-around border-t bg-white/95 px-2 shadow-[0_-4px_20px_rgba(0,0,0,.06)] backdrop-blur-lg md:hidden"
        >
            <Link
                v-for="i in mobile"
                :href="i[1]"
                class="flex h-full w-full flex-col items-center justify-center gap-1 text-slate-400 transition-colors"
                :class="active(i[1]) ? 'font-bold text-[var(--primary)]' : 'hover:text-slate-600'"
                ><img
                    v-if="i[2]"
                    :src="i[2]"
                    class="h-5 w-5 object-contain"
                /><Settings v-else class="h-5 w-5" /><span
                    class="text-[11px]"
                    >{{ i[0] }}</span
                ></Link
            ><Link
                href="/logout"
                method="post"
                as="button"
                class="flex h-full w-full flex-col items-center justify-center gap-1 text-rose-500 hover:text-rose-600"
                ><img
                    src="/uploads/checkin.png"
                    class="h-5 w-5 object-contain"
                /><span class="text-[11px] font-bold">Keluar</span></Link
            >
        </nav>
    </div>
</template>
