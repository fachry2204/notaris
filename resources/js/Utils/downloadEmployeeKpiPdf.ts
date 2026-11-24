import { jsPDF } from 'jspdf';

type ReportData = {
    employee: any;
    periodLabel: string;
    filters: { start_date: string | null; end_date: string | null; sort: string };
    jobs: any[];
    tasks: any[];
    attendance: any[];
};

// The report uses only the data already authorized and returned for the KPI page.
export function downloadEmployeeKpiPdf(data: ReportData): void {
    const doc = new jsPDF({ unit: 'mm', format: 'a4', compress: true });
    const width = doc.internal.pageSize.getWidth();
    const height = doc.internal.pageSize.getHeight();
    const margin = 17;
    const usable = width - margin * 2;
    let y = 18;
    const plain = (value: unknown) => String(value ?? '-').replace(/[–—]/g, '-').replace(/·/g, '|').replace(/\u00a0/g, ' ');
    const ensure = (space: number) => { if (y + space > height - 20) { doc.addPage(); y = 18; } };
    const text = (content: unknown, options: { bold?: boolean; size?: number; color?: [number, number, number] } = {}) => {
        doc.setFont('helvetica', options.bold ? 'bold' : 'normal');
        doc.setFontSize(options.size ?? 10);
        doc.setTextColor(...(options.color ?? [44, 35, 27]));
        const lines: string[] = doc.splitTextToSize(plain(content), usable);
        for (const line of lines) { ensure(5.5); doc.text(line, margin, y); y += 5.5; }
    };
    const section = (title: string) => {
        ensure(17); y += 4; doc.setFillColor(250, 243, 229); doc.roundedRect(margin, y - 5, usable, 9, 1.5, 1.5, 'F');
        text(title, { bold: true, size: 11, color: [118, 83, 16] }); y += 3;
    };
    const date = (v: any) => v ? new Date(`${String(v).slice(0, 10)}T00:00:00`).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-';
    const time = (v: any) => v ? (String(v).includes(' ') ? String(v).split(' ')[1].slice(0, 5) : String(v).slice(0, 5)) : '-';
    const e = data.employee;
    const rate = e.completed + e.processing ? `${Math.round(e.completed / (e.completed + e.processing) * 100)}%` : 'Tidak tersedia';
    const punctual = e.workingDays !== null && e.presentDays ? `${Math.round(Math.max(0, e.presentDays - e.lateDays) / e.presentDays * 100)}%` : 'Tidak tersedia';
    const hasAttendance = e.workingDays !== null;
    text('LAPORAN KPI KARYAWAN', { bold: true, size: 18, color: [103, 72, 11] });
    text('Ringkasan pekerjaan, penugasan, dan kehadiran', { size: 10, color: [105, 93, 79] });
    y += 3;
    text(`Nama: ${e.fullName || e.username || '-'}`, { bold: true });
    text(`Akun / peran: ${e.username || '-'} / ${e.role || '-'}`);
    text(data.filters.start_date ? `Periode: ${data.periodLabel}` : `Cakupan: berkas dan tugas sepanjang waktu; absensi ${data.periodLabel}`);
    text(`Dibuat: ${new Date().toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' })}`);
    section('Ringkasan KPI');
    [
        `Berkas PIC: ${e.totalJobs}; selesai: ${e.completed}; aktif: ${e.processing}; dibatalkan: ${e.cancelled}.`,
        `Berkas aktif lewat deadline: ${e.overdue}. Tingkat penyelesaian: ${rate}.`,
        `Total tugas: ${e.totalTasks}; tugas PIC: ${e.picTasks}; tugas saksi: ${e.witnessTasks}.`,
        hasAttendance ? `Kehadiran: ${e.presentDays} hari hadir, ${e.lateDays} hari terlambat, ${punctual} tepat waktu.` : 'Kehadiran: profil absensi tidak tersedia atau tidak diikutsertakan.',
        hasAttendance ? `Perkiraan hari kerja: ${e.workingDays}; hari kerja tanpa catatan absensi: ${e.absentDays}.` : '',
    ].filter(Boolean).forEach(line => text(line));
    section('Cara membaca dan batasan');
    [
        'Berkas PIC adalah berkas yang menetapkan pegawai sebagai PIC. Status dan deadline menunjukkan kondisi saat laporan dibuat.',
        'Tingkat penyelesaian = jumlah selesai / (jumlah selesai + jumlah aktif). Berkas dibatalkan tidak masuk penyebut; jika tidak ada selesai maupun aktif, nilai tidak tersedia.',
        'Tugas dihitung berdasarkan penugasan, sehingga tidak harus sama dengan jumlah berkas PIC. Berkas dan tugas mengikuti tanggal dibuat dalam filter.',
        'Hadir dihitung dari hari dengan check-in. Terlambat menggunakan check-in setelah pukul 08.00; tepat waktu = (hari hadir - hari terlambat) / hari hadir. Ini adalah aturan KPI saat ini, bukan otomatis aturan payroll.',
        'Hari kerja adalah perkiraan Senin-Jumat sejak profil pegawai dibuat sampai akhir periode atau hari ini. Libur, cuti, jadwal khusus, dan tanggal mulai kerja sebenarnya belum diperhitungkan. Tidak ada catatan absensi bukan bukti mangkir.',
        'Angka merupakan informasi pendukung evaluasi, bukan penilaian kinerja otomatis. Periksa konteks penugasan dan klarifikasi data sebelum mengambil keputusan.',
    ].forEach(line => { text(line); y += 1; });
    section(`Berkas PIC yang ditampilkan (${data.jobs.length}, maksimal 10)`);
    if (!data.jobs.length) text('Tidak ada berkas PIC pada cakupan ini.');
    data.jobs.forEach((job, i) => { text(`${i + 1}. ${job.trackingCode || '-'} | ${job.title || '-'}`, { bold: true }); text(`Kategori: ${job.category || '-'} | Status: ${job.status || '-'} | Deadline: ${date(job.deadline)}`); });
    section(`Daftar tugas yang ditampilkan (${data.tasks.length}, maksimal 10)`);
    if (!data.tasks.length) text('Tidak ada tugas pada cakupan ini.');
    data.tasks.forEach((task, i) => text(`${i + 1}. ${task.customTask || task.taskType || '-'} | ${task.jobTitle || 'Berkas tidak tersedia'} | Dibuat ${date(task.createdAt)}`));
    section(`Riwayat absensi (${data.periodLabel})`);
    if (!data.attendance.length) text('Tidak ada catatan absensi pada periode ini.');
    data.attendance.forEach((entry, i) => text(`${i + 1}. ${date(entry.date)} | Masuk ${time(entry.checkIn)} | Pulang ${time(entry.checkOut)}`));
    const pages = doc.getNumberOfPages();
    for (let i = 1; i <= pages; i++) {
        doc.setPage(i); doc.setFontSize(8); doc.setTextColor(115, 102, 88);
        doc.text('Dokumen internal - informasi pegawai', margin, height - 9);
        doc.text(`Halaman ${i} / ${pages}`, width - margin, height - 9, { align: 'right' });
    }
    const filename = String(e.fullName || e.username || 'pegawai').replace(/[^a-zA-Z0-9_-]+/g, '-').replace(/^-+|-+$/g, '');
    doc.save(`KPI-${filename || 'pegawai'}.pdf`);
}
