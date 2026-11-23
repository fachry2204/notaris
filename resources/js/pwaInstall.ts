import { shallowRef } from 'vue';

export type InstallEvent = Event & {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

export const installPrompt = shallowRef<InstallEvent | null>(null);

window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    installPrompt.value = event as InstallEvent;
});
