# Rancangan status tugas untuk laporan KPI

## Temuan

Penugasan `job_employee_task` menyimpan jenis tugas dan pembayaran, tetapi belum memiliki status, target atau waktu penyelesaian. Status berkas adalah data terpisah. Pengeditan berkas dapat menghapus penugasan, sehingga riwayat KPI tidak boleh bergantung pada status berkas saat ini atau asumsi tentang data lama. Sistem belum memiliki skor KPI berbobot atau penilaian kualitas yang disepakati.

## Usulan untuk disetujui

- Status tugas: `PENDING` (belum dimulai), `PROSES`, `SELESAI`, dan `CANCELLED` (dibatalkan). Terlambat merupakan penanda terhitung untuk tugas belum selesai dengan target sebelum hari ini, bukan status tambahan; tugas tanpa target tidak dinilai terlambat.
- Tugas baru berstatus `PENDING`. Penugasan lama tetap berstatus tidak diketahui sampai diperbarui secara sadar; tidak menyimpulkan status dari berkas atau membuat tanggal penyelesaian fiktif.
- Simpan target opsional, waktu penyelesaian aktual dan riwayat perubahan status: status lama/baru, waktu, pengguna, alasan, dan target pada saat perubahan. Atur perilaku pembukaan kembali dan pembatalan secara eksplisit. Pertahankan riwayat saat penugasan dihapus atau diganti, menggunakan arsip yang menyimpan identitas dan label tugas saat kejadian.
- Hak akses: pegawai hanya melihat tugas sendiri; perubahan status dilakukan oleh pengguna yang berwenang sesuai sistem akses. Pimpinan/administrator melihat data sesuai hak yang ada. Hak mengubah status perlu ditentukan sebelum implementasi.
- Grafik status menghitung status tugas pada waktu pembuatan laporan, dengan kategori tidak diketahui dan dibatalkan terpisah. Terlambat ditampilkan sebagai indikator tambahan agar tidak dihitung dua kali dalam persentase diagram.
- Perbandingan periode: penugasan baru dihitung dari tanggal dibuat; penyelesaian dihitung dari peristiwa pertama masuk `SELESAI` dalam periode, dengan ketentuan pembukaan kembali disepakati. Data sebelum pencatatan riwayat ditandai tidak tersedia. Status pada akhir periode hanya dihitung jika ada riwayat mencukupi.
- Pertahankan indikator dashboard yang ada. Jangan membentuk skor keseluruhan, kategori, radar kualitas, atau menganggap tugas selesai sebagai bukti kualitas tanpa bobot, definisi dan sumber data yang disetujui.
- PDF mencantumkan periode, waktu pembuatan, definisi, nilai yang tersedia dan keterbatasan. Insight dan rekomendasi hanya dari data yang mendukung.

## Validasi yang diperlukan

Uji alur status dan pembukaan kembali, pengguna tanpa izin, target kosong dan terlambat, data lama tidak diketahui, penghapusan tugas, tanggal batas periode, tidak ada data, konsistensi PDF dan dashboard, dan laporan banyak halaman. Migrasi produksi memerlukan persetujuan terpisah sesuai AGENTS.md.
