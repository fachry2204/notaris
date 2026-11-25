<?php

namespace App\Services;

class KpiInsightService
{
    public function generate(array $employee): array
    {
        $total = $employee['completed'] + $employee['processing'];
        $completion = $total ? round($employee['completed'] / $total * 100).'%' : 'Tidak tersedia';
        $punctual = $employee['workingDays'] !== null && $employee['presentDays']
            ? round(max(0, $employee['presentDays'] - $employee['lateDays']) / $employee['presentDays'] * 100).'%'
            : 'Tidak tersedia';

        $insights = [
            "Berkas PIC: {$employee['totalJobs']}; {$employee['completed']} selesai, {$employee['processing']} aktif, {$employee['cancelled']} dibatalkan. Tingkat penyelesaian {$completion}, dihitung dari selesai / (selesai + aktif).",
            "Berkas aktif melewati deadline: {$employee['overdue']}. ".($employee['overdue'] ? 'Tinjau prioritas dan hambatan berkas yang terlambat.' : ($employee['processing'] ? 'Tinjau progres berkas aktif dan target penyelesaiannya.' : 'Tidak ada berkas aktif yang perlu ditindaklanjuti berdasarkan data ini.')),
            "Penugasan: {$employee['totalTasks']} tugas, termasuk {$employee['picTasks']} PIC dan {$employee['witnessTasks']} saksi. Jumlah tugas tidak selalu sama dengan jumlah berkas PIC.",
        ];

        if ($employee['workingDays'] !== null) {
            $insights[] = "Kehadiran: {$employee['presentDays']} hari hadir, {$employee['lateDays']} hari terlambat dan ketepatan waktu {$punctual}. Perkiraan {$employee['absentDays']} hari kerja belum memiliki catatan check-in.";
            $insights[] = 'Klarifikasi hari tanpa catatan sebelum mengambil kesimpulan. Perkiraan hari kerja belum memperhitungkan libur, cuti, jadwal khusus, atau tanggal mulai kerja sebenarnya.';
        } else {
            $insights[] = 'Data kehadiran tidak tersedia atau pegawai tidak diikutsertakan dalam absensi.';
        }

        $insights[] = 'Insight ini merupakan bahan evaluasi, bukan penilaian otomatis. Tinjau konteks dan konfirmasi data bersama pegawai.';

        return $insights;
    }
}
