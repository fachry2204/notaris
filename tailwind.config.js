import defaultTheme from 'tailwindcss/defaultTheme';
import forms from '@tailwindcss/forms';

/** @type {import('tailwindcss').Config} */
export default {
    // Kartu dan tabel selalu memakai tema terang sesuai alur operasional.
    // Selector ini sengaja tidak pernah dipasang oleh aplikasi.
    darkMode: ['class', '.theme-dark-disabled'],
    content: [
        './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
        './storage/framework/views/*.php',
        './resources/views/**/*.blade.php',
        './resources/js/**/*.vue',
    ],

    theme: {
        extend: {
            fontFamily: {
                sans: ['Figtree', ...defaultTheme.fontFamily.sans],
            },
            colors: {
                primary: {
                    DEFAULT: 'var(--primary)',
                    hover: 'var(--primary-hover)',
                    light: 'var(--primary-light)',
                    foreground: 'var(--primary-foreground)',
                },
            },
        },
    },

    plugins: [forms],
};
