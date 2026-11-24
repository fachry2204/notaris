import { jsPDF } from 'jspdf';

type ReportData = { employee: any; periodLabel: string; filters: { start_date: string | null; end_date: string | null; sort: string }; jobs: any[]; tasks: any[]; attendance: any[] };

async function loadPhoto(path: string | null): Promise<string | null> {
    if (!path) return null;
    try {
        const url = new URL(path, window.location.origin);
        if (url.origin !== window.location.origin) return null;
        const response = await fetch(url, { credentials: 'same-origin' });
        if (!response.ok || !response.headers.get('content-type')?.startsWith('image/')) return null;
        const blob = await response.blob();
        const image = await createImageBitmap(blob);
        const canvas = document.createElement('canvas'); canvas.width = 240; canvas.height = 240;
        const ctx = canvas.getContext('2d');
        if (!ctx) { image.close(); return null; }
        const side = Math.min(image.width, image.height);
        ctx.drawImage(image, (image.width - side) / 2, (image.height - side) / 2, side, side, 0, 0, 240, 240);
        image.close();
        return canvas.toDataURL('image/jpeg', 0.85);
    } catch { return null; }
}

export async function downloadEmployeeKpiPdf(data: ReportData): Promise<void> {
    const doc = new jsPDF({ unit: 'mm', format: 'a4', compress: true });
    const w = doc.internal.pageSize.getWidth(), h = doc.internal.pageSize.getHeight(), m = 15, content = w - 2 * m;
    const e = data.employee, photo = await loadPhoto(e.photoPath);
    let y = 17;
    const clean = (v: unknown) => String(v ?? '-').replace(/[–—]/g, '-').replace(/·/g, '|').replace(/\u00a0/g, ' ');
    const ink = (bold = false, size = 9, color: [number, number, number] = [37, 41, 48]) => { doc.setFont('helvetica', bold ? 'bold' : 'normal'); doc.setFontSize(size); doc.setTextColor(...color); };
    const ensure = (n: number) => { if (y + n > h - 19) { doc.addPage(); y = 18; } };
    const line = (value: unknown, indent = 0, bold = false) => { ink(bold); const lines: string[] = doc.splitTextToSize(clean(value), content - indent); for (const l of lines) { ensure(5); doc.text(l, m + indent, y); y += 5; } };
    const section = (title: string) => { ensure(18); y += 4; doc.setFillColor(28, 63, 100); doc.roundedRect(m, y - 5, content, 8, 1.5, 1.5, 'F'); ink(true, 10, [255,255,255]); doc.text(clean(title), m + 3, y); y += 8; };
    const date = (v: any) => v ? new Date(`${String(v).slice(0, 10)}T00:00:00`).toLocaleDateString('id-ID', { day:'numeric', month:'short', year:'numeric' }) : '-';
    const time = (v: any) => v ? (String(v).includes(' ') ? String(v).split(' ')[1].slice(0,5) : String(v).slice(0,5)) : '-';
    const completion = e.completed + e.processing ? `${Math.round(e.completed / (e.completed + e.processing) * 100)}%` : 'Tidak tersedia';
    const punctual = e.workingDays !== null && e.presentDays ? `${Math.round(Math.max(0, e.presentDays - e.lateDays) / e.presentDays * 100)}%` : 'Tidak tersedia';
    ink(true, 11, [151,106,18]); doc.text('NOTARIS DIGITAL', m, y); ink(false, 8, [98,105,112]); doc.text('DOKUMEN INTERNAL', w-m, y, { align:'right' });
    y += 4; doc.setDrawColor(193,146,45); doc.line(m,y,w-m,y); y += 9;
    ink(true, 19, [25,38,55]); doc.text('LAPORAN KPI PEGAWAI', m, y); y += 6;
    line(data.filters.start_date ? `Periode: ${data.periodLabel}` : `Berkas dan tugas: sepanjang waktu | Absensi: ${data.periodLabel}`);
    line(`Tanggal cetak: ${new Date().toLocaleString('id-ID', { dateStyle:'long', timeStyle:'short' })}`);
    section('BIODATA PEGAWAI');
    ensure(40); const profileTop = y;
    doc.setFillColor(242,245,249); doc.roundedRect(m, y - 4, content, 37, 2, 2, 'F');
    if (photo) doc.addImage(photo, 'JPEG', m+3, y-1, 30, 30);
    else { ink(false, 8, [94,101,109]); doc.text('Foto tidak', m+5, y+11); doc.text('tersedia', m+5, y+16); }
    const fields = [`Nama: ${e.fullName || e.username || '-'}`, `Akun / peran: ${e.username || '-'} / ${e.role || '-'}`, `Email: ${e.email || '-'}`, `Telepon: ${e.phone || '-'}`, `Tanggal lahir: ${date(e.birthday)} | Status: ${e.isActive ? 'Aktif' : 'Tidak aktif'}`];
    y = profileTop + 1; fields.forEach(value => { ink(false,8); const lines: string[] = doc.splitTextToSize(clean(value), content-42); lines.slice(0,2).forEach(text => { doc.text(text, m+38, y); y += 4; }); }); y = Math.max(y, profileTop + 37);
    section('RINGKASAN INDIKATOR KPI');
    const stats = [['Berkas PIC',e.totalJobs],['Selesai',e.completed],['Berkas aktif',e.processing],['Tugas',e.totalTasks],['Hadir',e.workingDays === null ? '-' : e.presentDays],['Tepat waktu',punctual]];
    const cw = (content - 10) / 3;
    stats.forEach(([label,value], i) => { if (i % 3 === 0) ensure(23); const x = m + (i%3)*(cw+5); const yy = y; doc.setFillColor(...(i % 2 ? [237,248,240] as [number,number,number] : [235,243,251] as [number,number,number])); doc.roundedRect(x, yy-4, cw, 19, 2, 2, 'F'); ink(false,8); doc.text(clean(label),x+3,yy+1); ink(true,14,[25,54,83]); doc.text(clean(value),x+3,yy+10); if (i%3===2) y += 23; });
    section('INSIGHT EVALUASI');
    line(`Berkas PIC: ${e.totalJobs}; ${e.completed} selesai, ${e.processing} aktif, ${e.cancelled} dibatalkan. Tingkat penyelesaian ${completion}, dihitung dari selesai / (selesai + aktif).`);
    line(`Berkas aktif melewati deadline: ${e.overdue}. ${e.overdue ? 'Tinjau prioritas dan hambatan berkas yang terlambat.' : e.processing ? 'Tinjau progres berkas aktif dan target penyelesaiannya.' : 'Tidak ada berkas aktif yang perlu ditindaklanjuti berdasarkan data ini.'}`);
    line(`Penugasan: ${e.totalTasks} tugas, termasuk ${e.picTasks} PIC dan ${e.witnessTasks} saksi. Jumlah tugas tidak selalu sama dengan jumlah berkas PIC.`);
    if (e.workingDays !== null) { line(`Kehadiran: ${e.presentDays} hari hadir, ${e.lateDays} hari terlambat dan ketepatan waktu ${punctual}. Perkiraan ${e.absentDays} hari kerja belum memiliki catatan check-in.`); line('Klarifikasi hari tanpa catatan sebelum mengambil kesimpulan. Perkiraan hari kerja belum memperhitungkan libur, cuti, jadwal khusus, atau tanggal mulai kerja sebenarnya.'); }
    else line('Data kehadiran tidak tersedia atau pegawai tidak diikutsertakan dalam absensi.');
    line('Insight ini merupakan bahan evaluasi, bukan penilaian otomatis. Tinjau konteks dan konfirmasi data bersama pegawai.');
    section(`RINCIAN BERKAS PIC (${data.jobs.length})`);
    if (!data.jobs.length) line('Tidak ada berkas PIC pada cakupan ini.');
    data.jobs.forEach((job,i) => { ensure(13); line(`${i+1}. ${job.trackingCode || '-'} | ${job.title || '-'}`,0,true); line(`${job.category || '-'} | Status: ${job.status || '-'} | Dibuat: ${date(job.createdAt)} | Deadline: ${date(job.deadline)}`,3); });
    section(`RINCIAN TUGAS (${data.tasks.length})`);
    if (!data.tasks.length) line('Tidak ada tugas pada cakupan ini.');
    data.tasks.forEach((task,i) => { ensure(12); line(`${i+1}. ${task.customTask || task.taskType || '-'}`,0,true); line(`Peran: ${task.taskType || '-'} | Berkas: ${task.jobTitle || '-'} | Dibuat: ${date(task.createdAt)}`,3); });
    section(`RIWAYAT ABSENSI (${data.attendance.length})`);
    if (!data.attendance.length) line('Tidak ada catatan absensi pada periode ini.');
    data.attendance.forEach((entry,i) => line(`${i+1}. ${date(entry.date)} | Masuk ${time(entry.checkIn)} | Pulang ${time(entry.checkOut)}`));
    section('METODE DAN BATASAN');
    line('Berkas dan tugas difilter berdasarkan tanggal dibuat; status dan deadline adalah kondisi saat laporan dibuat.');
    line('Hadir dihitung dari hari dengan check-in; terlambat berdasarkan check-in setelah 08.00. Tepat waktu = (hadir - terlambat) / hadir. Aturan ini mengikuti KPI dan tidak selalu sama dengan aturan payroll.');
    line('Hari tanpa catatan absensi bukan bukti mangkir. Foto ditampilkan jika tersedia dan dapat dibaca.');
    const pages=doc.getNumberOfPages(); for(let i=1;i<=pages;i++){ doc.setPage(i); doc.setDrawColor(218,207,185); doc.line(m,h-14,w-m,h-14); ink(false,8,[100,100,100]); doc.text('Dokumen internal - informasi pegawai',m,h-9); doc.text(`Halaman ${i} / ${pages}`,w-m,h-9,{align:'right'}); }
    const filename=String(e.fullName || e.username || 'pegawai').replace(/[^a-zA-Z0-9_-]+/g,'-').replace(/^-+|-+$/g,'');
    doc.save(`KPI-${filename || 'pegawai'}.pdf`);
}
