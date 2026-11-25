import "../css/app.css";
import "./bootstrap";

import { createInertiaApp, router } from "@inertiajs/vue3";
import { resolvePageComponent } from "laravel-vite-plugin/inertia-helpers";
import { createApp, DefineComponent, h } from "vue";
import PwaInstall from "@/Components/PwaInstall.vue";
import { ZiggyVue } from "../../vendor/tightenco/ziggy";

let appName = "Notaris Digital";

const syncInstallBranding = (pwa: any) => {
    if (!pwa) return;
    for (const name of ['apple-mobile-web-app-title', 'application-name']) {
        document.querySelector<HTMLMetaElement>(`meta[name="${name}"]`)?.setAttribute('content', pwa.name);
    }
    document.querySelector<HTMLLinkElement>('link[rel="apple-touch-icon"]')?.setAttribute('href', pwa.appleIconUrl);
    document.querySelector<HTMLLinkElement>('link[rel="manifest"]')?.setAttribute('href', `${pwa.manifestUrl}?v=${encodeURIComponent(pwa.version)}`);
};
router.on('navigate', event => {
    const props = event.detail.page.props as any;
    syncInstallBranding(props.pwa);
    if (props.csrfToken) document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.setAttribute('content', props.csrfToken);
});

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) =>
        resolvePageComponent(
            `./Pages/${name}.vue`,
            import.meta.glob<DefineComponent>("./Pages/**/*.vue"),
        ),
    setup({ el, App, props, plugin }) {
        appName =
            (
                (props.initialPage.props as any).branding?.appName as string
            )?.trim() || appName;
        createApp({ render: () => [h(App, props), h(PwaInstall)] })
            .use(plugin)
            .use(ZiggyVue)
            .mount(el);
        syncInstallBranding((props.initialPage.props as any).pwa);
    },
    progress: {
        color: "#C99A3D",
    },
});

// Cache only the generic offline page; authenticated pages and data stay online.
if ("serviceWorker" in navigator && window.isSecureContext) {
    window.addEventListener("load", () => {
        const workerUrl = document.querySelector<HTMLMetaElement>('meta[name="pwa-worker-url"]')?.content;
        if (workerUrl) navigator.serviceWorker.register(workerUrl).catch(() => {});
    });
}

// iOS Safari may ignore viewport zoom limits; prevent its pinch gesture where supported.
document.addEventListener("gesturestart", (event) => event.preventDefault(), { passive: false });
