import { jsPDF } from 'jspdf';

type ReportData = { employee: any; periodLabel: string; filters: { start_date: string | null; end_date: string | null; sort: string }; jobs: any[]; tasks: any[]; attendance: any[]; insights: string[]; kpiScore: any; evaluation: any | null; comparison?: { previousStart: string; previousEnd: string; currentStart: string; currentEnd: string; previousCompletions: number; currentCompletions: number; previous: any } | null };
type Branding = { appName?: string; officeName?: string; logoUrl?: string | null };

async function loadImage(path?: string | null): Promise<string | null> {
    if (!path) return null;
    try {
        const url = new URL(path, window.location.origin);
        if (url.origin !== window.location.origin) return null;
        const response = await fetch(url, { credentials: 'same-origin' });
        if (!response.ok || !response.headers.get('content-type')?.startsWith('image/')) return null;
        const image = await createImageBitmap(await response.blob());
        const canvas = document.createElement('canvas');
        canvas.width = image.width; canvas.height = image.height;
        const context = canvas.getContext('2d');
        if (!context) { image.close(); return null; }
        context.drawImage(image, 0, 0); image.close();
        return canvas.toDataURL('image/png');
    } catch { return null; }
}

export async function createEmployeeKpiPdf(data: ReportData, branding: Branding = {}): Promise<{ blob: Blob; filename: string; pages: number }> {
    const doc = new jsPDF({ unit: 'mm', format: 'a4', compress: true });
    const employee = data.employee;
    const [photo, logo] = await Promise.all([loadImage(employee.photoPath), loadImage(branding.logoUrl || '/images/dashboard/nr-gold-logo.png')]);
    const width = 210, height = 297, margin = 17, content = width - margin * 2;
    const ivory: [number, number, number] = [247, 243, 234];
    const gold: [number, number, number] = [170, 123, 32];
    const dark: [number, number, number] = [40, 34, 25];
    const muted: [number, number, number] = [110, 101, 88];
    const completion = employee.completed + employee.processing ? `${Math.round(employee.completed / (employee.completed + employee.processing) * 100)}%` : 'Tidak tersedia';
    const punctual = employee.workingDays !== null && employee.presentDays ? `${Math.round(Math.max(0, employee.presentDays - employee.lateDays) / employee.presentDays * 100)}%` : 'Tidak tersedia';
    const period = data.filters.start_date ? data.periodLabel : `Berkas dan tugas: sepanjang waktu | Absensi: ${data.periodLabel}`;
    const clean = (value: unknown) => String(value ?? '-').replace(/[–—]/g, '-').replace(/·/g, '|').replace(/\u00a0/g, ' ');
    const date = (value: unknown) => value ? new Date(`${String(value).slice(0, 10)}T00:00:00`).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-';
    const time = (value: unknown) => value ? (String(value).includes(' ') ? String(value).split(' ')[1].slice(0, 5) : String(value).slice(0, 5)) : '-';
    let position = 0;
    let currentTitle = '';
    const font = (size = 9, bold = false, color = dark) => { doc.setFont('helvetica', bold ? 'bold' : 'normal'); doc.setFontSize(size); doc.setTextColor(...color); };
    const page = (title: string, continued = false) => {
        if (doc.getNumberOfPages() > 0 && currentTitle) doc.addPage();
        currentTitle = title;
        doc.setFillColor(...ivory); doc.rect(0, 0, width, height, 'F');
        if (logo) doc.addImage(logo, 'PNG', margin, 10, 13, 13, undefined, 'FAST');
        font(10, true, gold); doc.text(clean(branding.appName || 'NOTARIS DIGITAL'), margin + 17, 15);
        font(8, false, muted); doc.text(clean(branding.officeName || 'Kantor Notaris'), margin + 17, 20, { maxWidth: 115 });
        font(8, true, muted); doc.text('DOKUMEN INTERNAL', width - margin, 16, { align: 'right' });
        doc.setDrawColor(...gold); doc.line(margin, 27, width - margin, 27);
        font(17, true); doc.text(clean(title + (continued ? ' (lanjutan)' : '')), margin, 39, { maxWidth: content });
        position = 47;
    };
    const ensure = (space: number) => { if (position + space > height - 23) page(currentTitle, true); };
    const paragraph = (text: unknown, options: { bold?: boolean; size?: number; color?: [number, number, number] } = {}) => {
        font(options.size || 9, options.bold || false, options.color || dark);
        const lines: string[] = doc.splitTextToSize(clean(text), content - 8);
        for (const item of lines) { ensure(6); doc.text(item, margin + 4, position); position += 5; }
        position += 2;
    };
    const heading = (title: string) => { ensure(15); position += 3; font(11, true, gold); doc.text(clean(title), margin + 3, position); position += 7; };
    const card = (label: string, value: unknown) => {
        font(9, false, muted); const labelLines: string[] = doc.splitTextToSize(clean(label), content * 0.42);
        font(10, true); const valueLines: string[] = doc.splitTextToSize(clean(value), content * 0.48);
        const cardHeight = Math.max(17, Math.max(labelLines.length, valueLines.length) * 5 + 8);
        ensure(cardHeight + 3); doc.setFillColor(255, 253, 249); doc.setDrawColor(230, 215, 180);
        doc.roundedRect(margin, position - 4, content, cardHeight, 2, 2, 'FD');
        font(9, false, muted); doc.text(labelLines, margin + 4, position + 2, { lineHeightFactor: 1.4 });
        font(10, true); doc.text(valueLines, width - margin - 4, position + 2, { align: 'right', lineHeightFactor: 1.4 });
        position += cardHeight + 3;
    };
    const entry = (title: string, detail: string) => {
        font(9, true); const titleLines: string[] = doc.splitTextToSize(clean(title), content - 8);
        font(8, false, muted); const detailLines: string[] = doc.splitTextToSize(clean(detail), content - 8);
        ensure(Math.min(25, (titleLines.length + detailLines.length) * 5 + 5));
        paragraph(title, { bold: true }); paragraph(detail, { size: 8, color: muted });
        doc.setDrawColor(230, 220, 201); doc.line(margin, position - 2, width - margin, position - 2); position += 2;
    };

    // Table rows are measured before drawing; unusually long records continue with a repeated header.
    const table = (columns: { title: string; width: number }[], rows: string[][]) => {
        const lineHeight = 3.8, bottom = height - 23;
        const header = () => {
            ensure(15);
            doc.setFillColor(239, 230, 211); doc.rect(margin, position - 4, content, 10, 'F');
            let x = margin;
            columns.forEach(column => { font(7, true, dark); doc.text(doc.splitTextToSize(column.title, column.width - 3), x + 1.5, position); x += column.width; });
            position += 7;
        };
        header();
        if (!rows.length) { paragraph('Tidak ada data pada cakupan laporan.', { color: muted }); return; }
        rows.forEach((row, index) => {
            font(7, false, dark);
            const cells = columns.map((column, i) => doc.splitTextToSize(clean(row[i]), column.width - 3) as string[]);
            let offset = 0;
            const totalLines = Math.max(1, ...cells.map(cell => cell.length));
            while (offset < totalLines) {
                const remainingLines = totalLines - offset;
                const pageCapacity = Math.floor((bottom - 58 - 5) / lineHeight);
                const desiredHeight = Math.min(remainingLines, pageCapacity) * lineHeight + 5;
                if (position + desiredHeight > bottom) { page(currentTitle, true); header(); }
                const available = Math.max(1, Math.floor((bottom - position - 5) / lineHeight));
                const count = Math.min(remainingLines, available);
                const rowHeight = count * lineHeight + 5;
                doc.setFillColor(...(index % 2 ? [251, 247, 239] as [number, number, number] : [255, 253, 249] as [number, number, number]));
                doc.rect(margin, position - 2, content, rowHeight, 'F');
                let x = margin;
                columns.forEach((column, i) => {
                    font(7, false, dark);
                    const lines = cells[i].slice(offset, offset + count);
                    if (lines.length) doc.text(lines, x + 1.5, position + 1.5, { lineHeightFactor: 1.5 });
                    x += column.width;
                });
                doc.setDrawColor(230, 220, 201); doc.line(margin, position + rowHeight - 2, width - margin, position + rowHeight - 2);
                position += rowHeight; offset += count;
            }
        });
        position += 3;
    };

    page('Laporan Evaluasi Kinerja Pegawai');
    position += 18; font(10, true, gold); doc.text('EVALUASI KINERJA', margin, position); position += 12;
    paragraph(employee.fullName || employee.username, { bold: true, size: 20 });
    paragraph(`Peran: ${employee.role || '-'}`); paragraph(`Periode: ${period}`);
    paragraph(`Tanggal pembuatan: ${new Date().toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' })}`);
    if (photo) { ensure(48); doc.addImage(photo, 'PNG', margin + 4, position + 4, 38, 38, undefined, 'FAST'); position += 48; }
    else paragraph('Foto pegawai tidak tersedia.', { color: muted });
    paragraph('Dokumen ini memuat informasi internal dan digunakan sebagai bahan evaluasi.', { color: muted });

    page('Biodata Pegawai');
    paragraph('Informasi pegawai yang tersimpan dalam sistem.', { color: muted });
    card('Nama lengkap', employee.fullName || employee.username || '-');
    card('Nama akun', employee.username || '-');
    card('Peran', employee.role || '-');
    card('Divisi', employee.division || 'Belum diatur');
    card('Email', employee.email || '-');
    card('Telepon', employee.phone || '-');
    card('Tanggal lahir', date(employee.birthday));
    card('Status akun', employee.isActive == null ? 'Tidak tersedia' : employee.isActive ? 'Aktif' : 'Tidak aktif');

    page('Ringkasan KPI'); paragraph(`Cakupan: ${period}`, { color: muted });
    [['Berkas PIC', employee.totalJobs], ['Berkas selesai', employee.completed], ['Berkas aktif', employee.processing], ['Tingkat penyelesaian', completion], ['Total tugas', employee.totalTasks], ['Hadir', employee.workingDays === null ? 'Tidak tersedia' : employee.presentDays], ['Terlambat', employee.workingDays === null ? 'Tidak tersedia' : employee.lateDays], ['Tepat waktu', punctual]].forEach(([label, value]) => card(String(label), value));

    heading('Skor KPI berbasis data');
    card('Skor keseluruhan', data.kpiScore.score === null ? 'Data belum mencukupi' : `${data.kpiScore.score} / 100`);
    Object.values(data.kpiScore.components).forEach((item: any) => card(`${item.label} (${item.weight}%)`, item.score === null ? 'Data belum mencukupi' : `${item.score}% (${item.numerator}/${item.denominator})`));
    paragraph(`Tugas berstatus belum diketahui: ${data.kpiScore.unknownTasks}; dibatalkan: ${data.kpiScore.excludedCancelled}. Skor hanya tersedia jika semua komponen memiliki data.`, { size: 8, color: muted });

    page('Analitik Kinerja');
    heading('Komposisi berkas PIC saat ini');
    card('Selesai', employee.completed); card('Aktif', employee.processing); card('Dibatalkan', employee.cancelled); card('Aktif melewati deadline', employee.overdue);
    heading('Perbandingan jumlah berkas');
    const maximum = Math.max(1, employee.completed, employee.processing, employee.cancelled);
    const bars: [string, number, [number, number, number]][] = [
        ['Selesai', employee.completed, [52, 142, 91]],
        ['Aktif', employee.processing, [64, 113, 177]],
        ['Dibatalkan', employee.cancelled, [139, 139, 139]],
    ];
    bars.forEach(([label, value, color]) => {
        ensure(13); font(9, false, dark); doc.text(label, margin + 4, position);
        doc.setFillColor(231, 227, 218); doc.roundedRect(margin + 37, position - 4, 100, 5, 1, 1, 'F');
        if (value > 0) { doc.setFillColor(...color); doc.roundedRect(margin + 37, position - 4, 100 * value / maximum, 5, 1, 1, 'F'); }
        font(9, true, dark); doc.text(String(value), margin + 143, position); position += 11;
    });
    paragraph('Grafik menunjukkan jumlah berkas menurut status saat laporan dibuat.', { size: 8, color: muted });
    heading('Distribusi status tugas saat laporan dibuat');
    const taskStatuses: [string, string | null][] = [['Menunggu', 'PENDING'], ['Dalam proses', 'PROSES'], ['Selesai', 'SELESAI'], ['Dibatalkan', 'CANCELLED'], ['Belum diketahui', null]];
    const taskTotal = data.tasks.length;
    ensure(55);
    const colors: [number, number, number][] = [[192,122,22], [52,123,194], [22,134,91], [153,91,83], [150,150,150]];
    const centerX = margin + 28, centerY = position + 19, radius = 20;
    let angle = -Math.PI / 2;
    if (!taskTotal) { doc.setFillColor(220, 220, 220); doc.circle(centerX, centerY, radius, 'F'); }
    taskStatuses.forEach(([label, status], index) => {
        const count = data.tasks.filter(task => (task.workStatus || null) === status).length;
        const portion = taskTotal ? count / taskTotal : 0;
        const steps = Math.ceil(portion * 80);
        doc.setFillColor(...colors[index]);
        for (let step = 0; step < steps; step++) {
            const start = angle + portion * Math.PI * 2 * step / steps, end = angle + portion * Math.PI * 2 * (step + 1) / steps;
            doc.triangle(centerX, centerY, centerX + radius * Math.cos(start), centerY + radius * Math.sin(start), centerX + radius * Math.cos(end), centerY + radius * Math.sin(end), 'F');
        }
        angle += portion * Math.PI * 2;
        const ly = position + 3 + index * 8;
        doc.setFillColor(...colors[index]); doc.circle(margin + 58, ly - 1, 1.6, 'F');
        font(9, false, dark); doc.text(clean(`${label}: ${count} (${Math.round(portion * 100)}%)`), margin + 62, ly);
    });
    doc.setFillColor(...ivory); doc.circle(centerX, centerY, 11, 'F'); font(11, true, dark); doc.text(String(taskTotal), centerX, centerY + 2, { align: 'center' });
    position += 48;
    const today = new Date(); const localToday = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
    const overdueTasks = data.tasks.filter(task => task.targetDate && task.targetDate < localToday && task.workStatus && !['SELESAI', 'CANCELLED'].includes(task.workStatus)).length;
    paragraph(`Tugas melewati target: ${overdueTasks}. Angka ini merupakan penanda tambahan, bukan status terpisah.`, { size: 8, color: muted });
    heading('Ketersediaan analitik');
    paragraph('Tren skor historis dan penilaian kualitas belum tersedia karena sumber data atau rumusnya belum ditetapkan.');

    page('Detail Pekerjaan dan Tugas'); heading(`Berkas PIC (${data.jobs.length})`);
    const jobColumns = [{ title: 'No.', width: 10 }, { title: 'Dibuat', width: 22 }, { title: 'Nomor / pekerjaan', width: 60 }, { title: 'Kategori', width: 32 }, { title: 'Status', width: 26 }, { title: 'Deadline', width: 26 }];
    table(jobColumns, data.jobs.map((job, index) => [String(index + 1), date(job.createdAt), `${job.trackingCode || '-'}\n${job.title || '-'}`, job.category || '-', job.status || '-', date(job.deadline)]));
    heading(`Penugasan (${data.tasks.length})`);
    const taskColumns = [{ title: 'No.', width: 10 }, { title: 'Dibuat', width: 22 }, { title: 'Tugas / berkas', width: 60 }, { title: 'Status', width: 32 }, { title: 'Target', width: 26 }, { title: 'Selesai', width: 26 }];
    const labels: Record<string, string> = { PENDING: 'Menunggu', PROSES: 'Dalam proses', SELESAI: 'Selesai', CANCELLED: 'Dibatalkan' };
    table(taskColumns, data.tasks.map((task, index) => [String(index + 1), date(task.createdAt), `${task.customTask || task.taskType || '-'}\n${task.jobTitle || '-'}`, labels[task.workStatus] || 'Belum diketahui', date(task.targetDate), date(task.completedAt)]));
    paragraph('Capaian dan catatan tugas individual belum tersedia dalam data. Status adalah keadaan saat laporan dibuat.', { size: 8, color: muted });

    page('Perbandingan Periode');
    if (!data.comparison) {
        paragraph('Pilih tanggal awal dan akhir pada halaman KPI untuk membandingkan dengan periode sebelumnya yang sama panjang.');
    } else {
        const previous = data.comparison.previous;
        paragraph(`Periode dipilih: ${date(data.comparison.currentStart)} - ${date(data.comparison.currentEnd)}`);
        paragraph(`Periode sebelumnya: ${date(data.comparison.previousStart)} - ${date(data.comparison.previousEnd)}`);
        const compare = (label: string, current: number | null, prior: number | null) => {
            if (current === null || prior === null) { card(label, 'Tidak tersedia'); return; }
            const change = current - prior;
            card(label, `${prior} ke ${current} (${change > 0 ? '+' : ''}${change})`);
        };
        compare('Berkas PIC dibuat', employee.totalJobs, previous.totalJobs);
        compare('Penugasan dibuat', employee.totalTasks, previous.totalTasks);
        compare('Tugas pertama kali selesai (tercatat)', data.comparison.currentCompletions, data.comparison.previousCompletions);
        paragraph('Penyelesaian dihitung dari peristiwa pertama selesai yang tercatat; riwayat sebelum fitur tersedia tidak dapat direkonstruksi.', { size: 8, color: muted });
        compare('Hari hadir', employee.workingDays === null ? null : employee.presentDays, previous.workingDays === null ? null : previous.presentDays);
        compare('Hari terlambat', employee.workingDays === null ? null : employee.lateDays, previous.workingDays === null ? null : previous.lateDays);
        paragraph('Selisih adalah perubahan jumlah, bukan persentase atau skor KPI. Berkas dan tugas dihitung berdasarkan tanggal dibuat; absensi dihitung hingga hari ini.', { size: 8, color: muted });
        paragraph('Status berkas adalah kondisi saat laporan dibuat, sehingga tidak dapat digunakan untuk menyimpulkan status atau penyelesaian pada akhir periode sebelumnya.', { size: 8, color: muted });
    }

    page('Insight dan Analisis');
    data.insights.forEach((insight, index) => entry(`Insight ${index + 1}`, insight));

    page('Rekapitulasi KPI'); heading('Kehadiran');
    if (employee.workingDays === null) paragraph('Data kehadiran tidak tersedia atau pegawai tidak diikutsertakan dalam absensi.');
    else { card('Perkiraan hari kerja', employee.workingDays); card('Hadir', employee.presentDays); card('Belum ada absensi', employee.absentDays); }
    heading(`Riwayat absensi (${data.attendance.length})`);
    if (!data.attendance.length) paragraph('Tidak ada catatan absensi dalam periode ini.');
    data.attendance.forEach((record) => entry(date(record.date), `Masuk: ${time(record.checkIn)} | Pulang: ${time(record.checkOut)}`));

    page('Tindak Lanjut dan Metode');
    heading('Evaluasi pimpinan');
    paragraph(`Catatan: ${data.evaluation?.notes || 'Belum diisi'}`);
    paragraph(`Rencana perbaikan: ${data.evaluation?.improvement_plan || 'Belum diisi'}`);
    paragraph(`Target periode berikutnya: ${data.evaluation?.next_target || 'Belum diisi'}`);

    paragraph('Tinjau berkas aktif dan konfirmasi hambatan bersama pegawai. Klarifikasi hari tanpa catatan kehadiran sebelum mengambil kesimpulan.');
    heading('Metode dan batasan');
    paragraph('Berkas dan tugas difilter berdasarkan tanggal dibuat. Status dan deadline berkas menunjukkan kondisi saat laporan dibuat.');
    paragraph('Tingkat penyelesaian = selesai / (selesai + aktif); berkas dibatalkan tidak dihitung. Hadir berarti terdapat check-in; terlambat berarti check-in setelah 08.00.');
    paragraph('Perkiraan hari kerja belum memperhitungkan hari libur, cuti, jadwal khusus, atau tanggal mulai kerja sebenarnya. Hari tanpa catatan bukan bukti mangkir.');
    paragraph('Status tugas lama yang belum diperbarui tetap tidak diketahui. Insight adalah bahan evaluasi, bukan penilaian otomatis.');

    const pages = doc.getNumberOfPages();
    for (let index = 1; index <= pages; index++) {
        doc.setPage(index); doc.setDrawColor(...gold); doc.line(margin, height - 15, width - margin, height - 15);
        font(8, false, muted); doc.text('Dokumen internal - informasi pegawai', margin, height - 9); doc.text(`Halaman ${index} / ${pages}`, width - margin, height - 9, { align: 'right' });
    }
    const filename = String(employee.fullName || employee.username || 'pegawai').replace(/[^a-zA-Z0-9_-]+/g, '_').replace(/^_+|_+$/g, '');
    const periodPart = data.filters.start_date && data.filters.end_date
        ? `${data.filters.start_date}_${data.filters.end_date}`
        : String(data.periodLabel || 'periode').replace(/[^a-zA-Z0-9_-]+/g, '_').replace(/^_+|_+$/g, '');
    return { blob: doc.output('blob'), filename: `Laporan_KPI_${filename || 'pegawai'}_${periodPart || 'periode'}.pdf`, pages };

}
