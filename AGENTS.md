<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Deployment server produksi

Sebelum setiap build atau deployment ke https://cms.salfanoviaroza.com/ dan setiap pembaruan database server tersebut, jelaskan perubahan yang akan diterapkan dan minta persetujuan eksplisit pengguna. Jangan jalankan tindakan tersebut sebelum disetujui.

<!-- BEGIN:notaris-premium-design -->
## Desain Notaris Digital

Semua halaman, komponen, dashboard, grafik dan laporan PDF Notaris Digital wajib memakai `$notaris-premium-design` di `C:/Users/Administrator/.codex/skills/notaris-premium-design/SKILL.md`. Baca referensi design-system dan visual-verification yang ditautkan skill. Gunakan satu sistem token dan komponen bersama, dengan `$ui-ux-pro-max` sebagai panduan pendukung.

Identitas: latar ivory, aksen champagne gold, sidebar charcoal, card putih krem, heading serif, body sans-serif modern, border emas tipis, shadow lembut dan citra kantor hukum profesional. Hindari template dashboard generik, latar aplikasi hitam/putih penuh, terlalu banyak card kecil, spacing tidak konsisten, tipografi monoton dan layout berantakan.

Pertahankan Laravel, Vue, Inertia, TypeScript, Tailwind, MySQL, API, routing, autentikasi dan business logic yang ada. Gunakan komponen/theme existing dan jangan menimpa perubahan pengguna yang belum di-commit. Instruksi Next.js di atas hanya relevan bila benar-benar mengedit kode Next.js; README project ini menyatakan Laravel/Vue.

Setiap implementasi desain: buka dan baca gambar referensi; identifikasi komposisi dan proporsi; implementasikan; jalankan aplikasi lokal; buka lewat Playwright; ambil dan inspeksi screenshot; bandingkan dengan referensi; perbaiki; ulangi sampai kriteria visual terpenuhi. Uji viewport referensi serta mobile, tablet dan desktop yang didukung, state penting, overflow, keterbacaan dan kontrol yang berubah. Build/startup berhasil bukan bukti desain selesai. Jika referensi, runtime atau akses belum tersedia, laporkan verifikasi visual belum lengkap.

Gunakan `$playwright-interactive` di `C:/Users/Administrator/.codex/skills/playwright-interactive/SKILL.md`; runtime tooling terpisah tersedia di `C:/Users/Administrator/.codex/tools/notaris-design/node_modules`. Simpan screenshot sebelum/sesudah dan diff dalam konvensi artifact project. Render dan inspeksi setiap halaman PDF hasil ekspor. Jangan gunakan data produksi untuk pengujian visual.

Setup ini hanya mengubah skill/instruksi. Minta persetujuan pengguna sebelum perubahan halaman aplikasi pertama. Setelah disetujui, lanjutkan iterasi visual dalam lingkup yang disetujui; tetap patuhi aturan build/deployment/database di atas.
<!-- END:notaris-premium-design -->
