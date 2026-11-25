# Verifikasi revisi PDF KPI - 25 November 2026

Referensi: gambar pengguna codex-clipboard-b885c815-47de-4e6e-b0cd-c8a899f468f3.png (1055 x 1491).

Perubahan: header hukum dan pita emas melengkung, heading serif, foto proporsional dengan sudut membulat, kartu metrik 4 x 2, tiga panel analitik, insight empat kolom, ringkasan tugas dan absensi, catatan evaluasi serta ruang paraf. Lampiran mengalir sesuai tinggi konten; bagian kosong tidak memperoleh halaman tersendiri. Seluruh data rinci dan metode tetap tersedia.

Bukti pengujian:
- Playwright Chromium, 1440 x 1000, aplikasi lokal port 8001 dengan database notaris_test.
- Detail KPI: buka preview, canvas benar-benar tergambar, navigasi ke halaman kedua, download berhasil, tutup dialog berhasil.
- Contoh kecil: 2 halaman (sebelumnya 10). Kasus kosong murni: 1 halaman. Kasus panjang: 48 tugas berjudul panjang, 22 catatan absensi dan evaluasi panjang menghasilkan 9 halaman terisi.
- PDF final dirender melalui Poppler dan kedua halamannya diinspeksi. Semua halaman kasus panjang diinspeksi melalui PDF.js dan render Poppler saat iterasi.
- TypeScript: npx vue-tsc --noEmit lulus. Pengujian KPI: 8 tes, 78 assertion lulus.

Perbedaan yang disengaja terhadap mockup: grafik menggunakan tiga komponen skor yang benar-benar tersedia; tidak mengarang skor historis enam bulan, nilai kualitas, tanda tangan, NIP, atau aktivitas harian. Jika rentang perbandingan dipilih, panel pertama memakai perbandingan periode dengan data tercatat. Citra dekoratif memakai aset hukum project, sehingga tidak identik piksel dengan gambar acuan.

PDF contoh memakai identitas dan angka uji, foto contoh dari aset lokal, serta logo unggahan yang sudah tersedia. Ini bukan evaluasi pegawai sesungguhnya. Perubahan belum dideploy ke produksi.

Revisi gelombang: gambar header kini mencakup seluruh lengkung, tanpa bidang hitam datar. Pita memakai satu bidang kurva dengan gradasi memanjang. Kedua halaman PDF contoh terbaru diperiksa melalui Playwright dan render Poppler. TypeScript lulus. Artifact: contoh-kpi-gelombang-revisi.pdf.

Tabel absensi dan pengajuan lembur: enam kolom termasuk tanggal, masuk, pulang, durasi kerja, lembur disetujui, dan menit terlambat. Playwright menguji pengajuan owner, persetujuan akun pimpinan terpisah, perubahan 0 menjadi 90 menit, download PDF, fokus dialog dan Escape. Desktop 1440x1000 dan mobile 390x844 diverifikasi; tabel dapat digeser tanpa overflow halaman. PDF contoh dua halaman dirender dengan Poppler dan diinspeksi. TypeScript lulus; seluruh 57 tes / 964 assertion lulus. Migrasi overtime_requests hanya diterapkan ke database lokal notaris dan notaris_test. Fixture browser sudah dibersihkan. Belum ada deploy produksi.

Pengaturan Absensi: tombol khusus ADMINISTRATOR/PIMPINAN pada rekap absensi. Jam masuk/pulang dan toleransi dipindahkan dari payroll; nilai lama dibaca sebagai fallback sampai pengaturan absensi disimpan. Kuota cuti tahunan tersimpan sebagai pengaturan. Pin Leaflet/OpenStreetMap dapat diklik/digeser, radius awal 10 m dapat diubah, koordinat manual dan GPS perangkat tersedia. Pengiriman Office di luar radius ditolak server sebelum menyimpan foto. Verifikasi jarak, radius, dan pin disertakan dalam catatan absensi. GPS dengan akurasi rendah ditampilkan kepada pegawai, tanpa memperbesar radius otomatis. Pilihan WFH/WFC/Dinas Luar tetap mengikuti alur lama. Uji Playwright pada 1440x1000 dan 390x844: peta dasar termuat, pin drag, perubahan radius, simpan/muat ulang, tombol manajer dan penolakan akses pegawai, peringatan 111.2 m, posisi 0 m, kamera/foto simulasi serta check-in Office berhasil. Pencarian alamat GPS distub dalam pengujian browser; GPS/kamera disimulasikan. Seluruh 62 tes / 1064 assertion lulus; TypeScript lulus. Fixture dan foto uji dibersihkan, snapshot pengaturan notaris_test dipulihkan. Lokasi kantor sebenarnya belum ditentukan; administrator harus memasang pin dan menyimpannya. Belum dideploy.
