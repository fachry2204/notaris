import { jsPDF } from 'jspdf';
import { attendanceDuration, attendanceTime } from './attendance';

type ReportData = { employee: any; periodLabel: string; filters: { start_date: string | null; end_date: string | null; sort: string }; jobs: any[]; tasks: any[]; attendance: any[]; attendanceStartTime?: string; attendanceGraceMinutes?: number; overtimeRequests?: any[]; insights: string[]; kpiScore: any; evaluation: any | null; comparison?: { previousStart: string; previousEnd: string; currentStart: string; currentEnd: string; previousCompletions: number; currentCompletions: number; previous: any } | null };
type Branding = { appName?: string; officeName?: string; logoUrl?: string | null };

async function loadImage(path?: string | null, fit?: 'cover' | 'contain' | 'banner'): Promise<string | null> {
    if (!path) return null;
    try {
        const url = new URL(path, window.location.origin);
        if (url.origin !== window.location.origin) return null;
        const response = await fetch(url, { credentials: 'same-origin' });
        if (!response.ok || !response.headers.get('content-type')?.startsWith('image/')) return null;
        const image = await createImageBitmap(await response.blob());
        const canvas = document.createElement('canvas');
        canvas.width = fit === 'banner' ? 1210 : fit ? 600 : image.width;
        canvas.height = fit === 'banner' ? 360 : fit ? 600 : image.height;
        const context = canvas.getContext('2d');
        if (!context) { image.close(); return null; }
        const ratio = fit ? (fit === 'contain' ? Math.min : Math.max)(canvas.width / image.width, canvas.height / image.height) : 1;
        const w = image.width * ratio, h = image.height * ratio;
        context.drawImage(image, (canvas.width - w) / 2, (canvas.height - h) / 2, w, h); image.close();
        return canvas.toDataURL('image/png');
    } catch { return null; }
}

export async function createEmployeeKpiPdf(data: ReportData, branding: Branding = {}): Promise<{ blob: Blob; filename: string; pages: number }> {
    const doc = new jsPDF({ unit: 'mm', format: 'a4', compress: true });
    const employee = data.employee;
    const [photo, logo, legalBanner] = await Promise.all([loadImage(employee.photoPath, 'cover'), loadImage(branding.logoUrl || '/images/dashboard/nr-gold-logo.png', 'contain'), loadImage('/images/dashboard/law-scale-books.jpg', 'banner')]);
    const width = 210, height = 297, margin = 17, content = width - margin * 2;
    const ivory: [number, number, number] = [247, 243, 234];
    const gold: [number, number, number] = [170, 123, 32];
    const dark: [number, number, number] = [40, 34, 25];
    const muted: [number, number, number] = [110, 101, 88];
    const completion = employee.completed + employee.processing ? `${Math.round(employee.completed / (employee.completed + employee.processing) * 100)}%` : 'Tidak tersedia';
    const punctual = employee.workingDays !== null && employee.presentDays ? `${Math.round(Math.max(0, employee.presentDays - employee.lateDays) / employee.presentDays * 100)}%` : 'Tidak tersedia';
    const period = data.filters.start_date ? data.periodLabel : `Berkas dan tugas: sepanjang waktu | Absensi: ${data.periodLabel}`;
    const clean = (value: unknown) => String(value ?? '-').replace(/[\u2013\u2014]/g, '-').replace(/\u00b7/g, '|').replace(/\u00a0/g, ' ');
    const date = (value: unknown) => value ? new Date(`${String(value).slice(0, 10)}T00:00:00`).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-';
    const time = (value: unknown) => attendanceTime(value == null ? null : String(value));
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
        doc.setFont('times', 'bold'); doc.setFontSize(17); doc.setTextColor(...dark); doc.text(clean(title + (continued ? ' (lanjutan)' : '')), margin, 39, { maxWidth: content });
        position = 47;
    };
    const ensure = (space: number) => { if (position + space > height - 23) page(currentTitle, true); };
    const paragraph = (text: unknown, options: { bold?: boolean; size?: number; color?: [number, number, number] } = {}) => {
        font(options.size || 9, options.bold || false, options.color || dark);
        const lines: string[] = doc.splitTextToSize(clean(text), content - 8);
        const lineHeight = (options.size || 9) * 0.35278 * 1.4;
        for (const item of lines) {
            ensure(lineHeight + 1);
            // A page header changes the active font; restore body styling after pagination.
            font(options.size || 9, options.bold || false, options.color || dark);
            doc.text(item, margin + 4, position); position += lineHeight;
        }
        position += 1.6;
    };
    const heading = (title: string) => { ensure(15); position += 3; font(11, true, gold); doc.text(clean(title), margin + 3, position); position += 7; };
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

    // The overview is a single composed page. Appendices flow by measured content,
    // never by one forced page per section.
    type Color = [number, number, number];
    const cream: Color = [255, 252, 246], line: Color = [233, 216, 184];
    const green: Color = [20, 134, 71], blue: Color = [45, 114, 210], orange: Color = [214, 135, 21];
    const text = (value: unknown, x: number, y: number, size = 8, bold = false, color = dark, maxWidth?: number) => {
        font(size, bold, color); doc.text(clean(value), x, y, maxWidth ? { maxWidth } : undefined);
    };
    const serif = (value: string, x: number, y: number, size: number) => {
        doc.setFont('times', 'bold'); doc.setFontSize(size); doc.setTextColor(...dark); doc.text(clean(value), x, y);
    };
    const wrapped = (value: unknown, x: number, y: number, w: number, size = 7, maxLines = 3, color = dark) => {
        font(size, false, color);
        const lines: string[] = doc.splitTextToSize(clean(value), w);
        const visible = lines.slice(0, maxLines);
        if (lines.length > maxLines) visible[maxLines - 1] = visible[maxLines - 1].replace(/.{3}$/, '...');
        doc.text(visible, x, y, { lineHeightFactor: 1.3 });
    };
    const panel = (x: number, y: number, w: number, h: number, fill: Color = cream) => {
        doc.setFillColor(238, 228, 210); doc.roundedRect(x + .4, y + .7, w, h, 2.6, 2.6, 'F');
        doc.setFillColor(...fill); doc.setDrawColor(...line); doc.setLineWidth(.17); doc.roundedRect(x, y, w, h, 2.6, 2.6, 'FD');
    };
    // Vector icons remain sharp when printed; no emoji/font substitution.
    const icon = (x: number, y: number, kind: number, color: Color, scale = 1) => {
        doc.setDrawColor(...color); doc.setLineWidth(.4 * scale);
        if (kind % 4 === 0) {
            doc.roundedRect(x, y + 1, 4 * scale, 3 * scale, .5, .5, 'S');
            doc.line(x + scale, y + 1, x + scale, y); doc.line(x + scale, y, x + 3 * scale, y); doc.line(x + 3 * scale, y, x + 3 * scale, y + 1);
        } else if (kind % 4 === 1) {
            doc.circle(x + 2 * scale, y + 2 * scale, 2 * scale, 'S');
            doc.line(x + scale, y + 2 * scale, x + 1.8 * scale, y + 2.7 * scale); doc.line(x + 1.8 * scale, y + 2.7 * scale, x + 3.1 * scale, y + 1.2 * scale);
        } else if (kind % 4 === 2) {
            doc.circle(x + 2 * scale, y + 2 * scale, 2 * scale, 'S');
            doc.line(x + 2 * scale, y + .6 * scale, x + 2 * scale, y + 2 * scale); doc.line(x + 2 * scale, y + 2 * scale, x + 3 * scale, y + 2.6 * scale);
        } else {
            for (let r = 0; r < 3; r++) { doc.line(x + 1.4 * scale, y + r * 1.5 * scale, x + 4 * scale, y + r * 1.5 * scale); doc.circle(x + .3 * scale, y + r * 1.5 * scale, .2 * scale, 'S'); }
        }
    };
    const sectionTitle = (value: string, x: number, y: number, size = 10) => { icon(x, y - 3.3, 3, gold, .85); serif(value, x + 6, y, size); };
    const components: any[] = Object.values(data.kpiScore.components || {});
    const statuses = [
        { label: 'Selesai', status: 'SELESAI', color: green }, { label: 'Dalam proses', status: 'PROSES', color: blue },
        { label: 'Menunggu', status: 'PENDING', color: orange }, { label: 'Dibatalkan', status: 'CANCELLED', color: [149, 106, 102] as Color },
        { label: 'Belum diketahui', status: null, color: [137, 141, 145] as Color },
    ].map(s => ({ ...s, count: data.tasks.filter(t => (t.workStatus || null) === s.status).length }));
    const labels: Record<string, string> = { PENDING: 'Menunggu', PROSES: 'Dalam proses', SELESAI: 'Selesai', CANCELLED: 'Dibatalkan' };
    const delta = (current: number, previous?: number) => previous == null ? 'Data saat laporan dibuat' : `${current - previous >= 0 ? '+' : ''}${current - previous} dari periode sebelumnya`;
    const role = ({ STAFFADMIN: 'Staff Admin', ADMINISTRATOR: 'Administrator', PIMPINAN: 'Pimpinan', OB: 'Office Boy' } as Record<string, string>)[employee.role] || employee.role || '-';

    // Clip one continuous ribbon and shade along its length, rather than across
    // its thickness (which would make the ribbon look like a rounded tube).
    const ribbon = (upper: number[], lower: number[]) => {
        const stops: [number, Color][] = [[0,[161,108,26]],[.22,[224,182,91]],[.43,[255,241,191]],[.67,[190,136,35]],[.86,[235,192,91]],[1,[255,233,162]]];
        doc.saveGraphicsState();
        doc.path([{op:'m',c:[0,upper[0]]},{op:'c',c:[upper[1],upper[2],upper[3],upper[4],210,upper[5]]},{op:'l',c:[210,lower[5]]},{op:'c',c:[lower[3],lower[4],lower[1],lower[2],0,lower[0]]},{op:'h',c:[]}]);
        doc.clip(); doc.discardPath();
        for(let i=0;i<210;i++) {
            const t=i/210;
            const k=stops.findIndex(s=>s[0]>=t), end=stops[Math.max(1,k)], start=stops[Math.max(0,k-1)];
            const f=(t-start[0])/(end[0]-start[0]);
            doc.setFillColor(...start[1].map((v,j)=>Math.round(v+(end[1][j]-v)*f)) as Color);
            doc.rect(i,0,1.03,297,'F');
        }
        doc.restoreGraphicsState();
    };

    currentTitle = 'Lampiran Evaluasi KPI';
    doc.setFillColor(...ivory); doc.rect(0, 0, 210, 297, 'F');
    doc.setFillColor(36, 27, 15); doc.rect(0, 0, 210, 40, 'F');
    if (legalBanner) doc.addImage(legalBanner, 'PNG', 89, 0, 121, 36, undefined, 'FAST');
    // Mask the photo with the actual lower curve, then place the ribbon on it.
    // The image extends past that curve, eliminating the former black shelf.
    doc.setFillColor(...ivory);
    doc.path([{op:'m',c:[0,23]},{op:'c',c:[79,8,126,57,210,25]},{op:'l',c:[210,41]},{op:'l',c:[0,41]},{op:'h',c:[]}]); doc.fill();
    ribbon([22,79,7,126,51,20],[23,79,8,126,57,25]);
    if (logo) doc.addImage(logo, 'PNG', 8, 3, 15, 15, undefined, 'FAST');
    text(branding.appName || 'NOTARIS DIGITAL', 26, 10, 12, true, [239, 199, 92], 93);
    wrapped(branding.officeName || 'Profesional | Transparan | Modern', 26, 15, 67, 6.2, 2, [245, 232, 202]);
    serif('Laporan Evaluasi Kinerja Pegawai', 8, 36, 18);
    text('KPI (Key Performance Indicator)', 8, 42, 9, false, muted);
    text('Mengelola Kinerja, Membangun Profesionalisme', 8, 46.5, 6.5, false, gold);

    if (photo) {
        doc.saveGraphicsState(); doc.roundedRect(8, 51, 25, 25, 4, 4, null); doc.clip(); doc.discardPath();
        doc.addImage(photo, 'PNG', 8, 51, 25, 25, undefined, 'FAST'); doc.restoreGraphicsState();
    }
    else { panel(8, 51, 25, 25, [245, 232, 206]); text('Foto belum', 13, 62, 7, false, muted); text('tersedia', 14.5, 66, 7, false, muted); }
    doc.setFont('times', 'bold'); doc.setTextColor(...dark);
    let nameSize = 15; doc.setFontSize(nameSize);
    let nameLines: string[] = doc.splitTextToSize(clean(employee.fullName || employee.username), 67);
    while (nameLines.length > 2 && nameSize > 10) { doc.setFontSize(--nameSize); nameLines = doc.splitTextToSize(clean(employee.fullName || employee.username), 67); }
    if (nameLines.length > 2) nameLines[1] = nameLines[1].replace(/.{3}$/, '...');
    doc.text(nameLines.slice(0, 2), 38, 57, { lineHeightFactor: 1.05 });
    text(role, 38, 68, 8, true, gold); text(`Divisi: ${employee.division || 'Belum diatur'}`, 38, 73, 7, false, dark, 64);
    panel(108, 52, 49, 24);
    icon(111, 56, 3, gold); text('Periode Evaluasi', 117, 59, 7.5, true);
    wrapped(data.periodLabel, 111, 65, 43, 8, 2);
    text(data.filters.start_date ? 'Periode terpilih' : 'Absensi bulan berjalan', 111, 73, 6, false, muted);
    // Horizontal gold gradient is vector-based and print safe.
    panel(161, 50, 41, 28, [163, 112, 9]);
    for (let i = 0; i < 38; i++) { doc.setFillColor(160 + i, 111 + i, 8 + i); doc.rect(162.5 + i, 51.5, 1, 25, 'F'); }
    text('Skor KPI', 166, 57, 9, true, [255, 248, 222]);
    text(data.kpiScore.score == null ? 'Belum cukup' : data.kpiScore.score, 166, 69, data.kpiScore.score == null ? 10 : 25, true, [255, 255, 255]);
    if (data.kpiScore.score != null) text('/100', 184, 69, 9, false, [255, 248, 222]);
    text('Evaluasi berbasis data', 166, 74, 6, false, [255, 248, 222]);
    doc.setDrawColor(...line); doc.line(8, 81, 202, 81);
    sectionTitle('Ringkasan KPI Utama', 8, 87, 11);
    const overview: [string, unknown, Color, Color, string][] = [
        ['Berkas PIC', employee.totalJobs, [237,244,254], blue, delta(employee.totalJobs, data.comparison?.previous.totalJobs)],
        ['Berkas selesai', employee.completed, [237,247,232], green, 'Status saat laporan dibuat'],
        ['Berkas aktif', employee.processing, [255,244,230], orange, `${employee.overdue || 0} melewati deadline`],
        ['Tingkat penyelesaian', completion, [246,237,251], [127,71,177], 'Selesai / selesai + aktif'],
        ['Total tugas', employee.totalTasks, [239,248,235], green, delta(employee.totalTasks, data.comparison?.previous.totalTasks)],
        ['Hadir', employee.workingDays == null ? '-' : `${employee.presentDays} hari`, [232,246,243], [11,143,139], 'Hari dengan check-in'],
        ['Terlambat', employee.workingDays == null ? '-' : `${employee.lateDays} hari`, [255,239,234], [214,83,63], 'Sesuai aturan absensi sistem'],
        ['Tepat waktu hadir', punctual, [255,246,224], orange, 'Hadir tidak terlambat / hadir'],
    ];
    overview.forEach(([label, value, fill, color, detail], i) => {
        const x = 8 + i % 4 * 49.5, y = 90 + Math.floor(i / 4) * 20;
        panel(x, y, 47.5, 18, fill); doc.setFillColor(255,253,248); doc.roundedRect(x+2.5,y+4,8,8,2,2,'F'); icon(x+4.5,y+6,i,color);
        text(label, x+12, y+5, 7, false, dark, 34);
        text(value, x+12, y+11, String(value).length > 12 ? 7 : 13, true, dark, 33);
        text(detail, x+12, y+15, 5.4, false, muted, 33);
    });

    panel(8, 133, 85, 46); sectionTitle(data.comparison ? 'Perbandingan Periode' : 'Komponen Skor KPI', 11, 139, 9.5);
    if (data.comparison) {
        const c = data.comparison;
        const series = [{label:'Berkas', a:c.previous.totalJobs, b:employee.totalJobs}, {label:'Tugas',a:c.previous.totalTasks,b:employee.totalTasks}, {label:'Selesai*',a:c.previousCompletions,b:c.currentCompletions}];
        const max = Math.max(1,...series.flatMap(s=>[s.a,s.b]));
        doc.setFillColor(224,215,196); doc.rect(12,143,2,2,'F'); text('Sebelumnya',15,145,5.7,false,muted); doc.setFillColor(...gold); doc.rect(39,143,2,2,'F'); text('Sekarang',42,145,5.7,false,muted);
        series.forEach((s,i)=>{const x=19+i*25; const a=20*s.a/max,b=20*s.b/max; doc.setFillColor(224,215,196);doc.rect(x,169-a,6,a,'F');doc.setFillColor(...gold);doc.rect(x+7,169-b,6,b,'F');text(s.a,x+.5,167-a,6,true,muted);text(s.b,x+7.5,167-b,6,true,gold);text(s.label,x-1,173,6,false,dark);});
        text('*Peristiwa pertama selesai tercatat',12,177,5.5,false,muted);
    } else {
        components.forEach((c,i)=>{const y=148+i*8; text(c.label,12,y,6.5,false,dark,40);doc.setFillColor(235,228,214);doc.roundedRect(55,y-2.5,25,2.5,1,1,'F');if(c.score!=null&&c.score>0){doc.setFillColor(...gold);doc.roundedRect(55,y-2.5,25*Math.min(100,c.score)/100,2.5,1,1,'F');}text(c.score==null?'-':`${c.score}%`,82,y,6.5,true);});
        text('Tren historis belum tersedia.',12,177,5.5,false,muted);
    }
    panel(96,133,61,46); sectionTitle('Distribusi Status Tugas',99,139,8.7);
    const cx=112,cy=157,r=12.5; let angle=-Math.PI/2;
    doc.setFillColor(225,222,214);doc.circle(cx,cy,r,'F');
    statuses.forEach(s=>{const portion=data.tasks.length?s.count/data.tasks.length:0;doc.setDrawColor(...s.color);doc.setFillColor(...s.color);doc.setLineWidth(.1);const steps=Math.ceil(portion*180);for(let i=0;i<steps;i++){const a=angle+portion*2*Math.PI*i/steps,b=angle+portion*2*Math.PI*(i+1)/steps;doc.triangle(cx,cy,cx+r*Math.cos(a),cy+r*Math.sin(a),cx+r*Math.cos(b),cy+r*Math.sin(b),'FD');}angle+=portion*2*Math.PI;});
    doc.setFillColor(...cream);doc.circle(cx,cy,8,'F');text(data.tasks.length,cx-2,cy+1,14,true);text('Tugas',cx-3,cy+5,5.8,false,muted);
    statuses.forEach((s,i)=>{doc.setFillColor(...s.color);doc.circle(128,147+i*6, .8,'F');text(s.label,130,147.5+i*6,5.6,false);text(`${s.count} (${data.tasks.length?Math.round(s.count/data.tasks.length*100):0}%)`,130,150+i*6,5.5,true);});
    panel(160,133,42,46);sectionTitle('Komposisi Kinerja',163,139,8.2);
    // Three measured components, rather than inventing quality/attendance ratings.
    const rcx=181,rcy=157,rr=10;
    for(const level of [1,.66,.33]) {doc.setDrawColor(227,208,173);doc.triangle(rcx,rcy-rr*level,rcx-rr*.866*level,rcy+rr*.5*level,rcx+rr*.866*level,rcy+rr*.5*level,'S');}
    if(components.length===3&&components.every(c=>c.score!=null)){
        doc.setDrawColor(...gold);doc.setFillColor(249,220,151);const values=components.map(c=>Math.min(100,Math.max(0,c.score))/100);
        doc.triangle(rcx,rcy-rr*values[0],rcx-rr*.866*values[1],rcy+rr*.5*values[1],rcx+rr*.866*values[2],rcy+rr*.5*values[2],'FD');
    }
    text('Tugas',177,144,5.7,true);text('Target',164,166,5.7,true);text('Disiplin',188,166,5.7,true);
    text('Bobot 40% / 30% / 30%',164,173,5.6,false,muted);text('Kualitas belum dinilai',164,177,5.4,false,muted);

    panel(8,183,194,34,[255,248,232]);sectionTitle('Insight & Analisis',11,190,11);
    const insightCards = [
        ['Penyelesaian', `${employee.completed || 0} berkas selesai; ${employee.processing || 0} masih aktif. ${employee.overdue || 0} berkas melewati deadline.`],
        ['Disiplin kehadiran',employee.workingDays==null?'Data absensi tidak tersedia.':`${employee.presentDays} hari hadir dan ${employee.lateDays} hari terlambat. Ketepatan hadir ${punctual}.`],
        ['Kualitas data',`${data.kpiScore.unknownTasks || 0} tugas belum diketahui statusnya. ${data.kpiScore.excludedCancelled || 0} tugas dibatalkan.`],
        ['Rekomendasi',employee.overdue?'Prioritaskan berkas melewati deadline dan konfirmasi hambatan penyelesaiannya.':'Tinjau target tugas dan konsistensi kehadiran bersama pegawai.'],
    ];
    insightCards.forEach(([title,body],i)=>{const x=12+i*48; if(i){doc.setDrawColor(...line);doc.line(x-2,194,x-2,213);}icon(x,194,i,[green,blue,orange,gold][i]);text(title,x,201,7.1,true);wrapped(body,x,205,43,6.5,3);});
    panel(8,221,127,35);sectionTitle('Detail Tugas Periode Ini',11,228,10);
    const taskPreview=data.tasks.slice(0,3);
    text('TUGAS / BERKAS',12,234,5.6,true,muted);text('STATUS',75,234,5.6,true,muted);text('TARGET',104,234,5.6,true,muted);
    if(!taskPreview.length) text('Tidak ada tugas pada periode ini.',12,242,7,false,muted);
    taskPreview.forEach((t,i)=>{const y=240+i*5;doc.setDrawColor(...line);doc.line(12,y-3,131,y-3);wrapped(t.customTask||t.taskType||'-',12,y,60,6.5,1);text(labels[t.workStatus]||'Belum diketahui',75,y,6,false,dark,27);text(date(t.targetDate),104,y,6,false,dark,26);});
    panel(138,221,64,35);sectionTitle('Catatan Kehadiran',141,228,9.3);
    data.attendance.slice(0,3).forEach((a,i)=>{const y=236+i*6;doc.setFillColor(...gold);doc.circle(143,y-1, .7,'F');text(date(a.date),146,y,6.3,true);text(`${time(a.checkIn)} - ${time(a.checkOut)}`,174,y,6,false,muted);});
    if(!data.attendance.length) wrapped('Belum ada catatan absensi pada periode ini.',143,238,54,7,3,muted);
    sectionTitle('Catatan Evaluasi',8,264,9.5);
    wrapped(data.evaluation?.notes || 'Laporan berbasis data sistem; klarifikasi hambatan tugas dan hari tanpa absensi sebelum mengambil keputusan evaluasi.',14,269,119,6.8,3);
    text('Ditinjau oleh,',153,265,7,false,muted);doc.setDrawColor(...gold);doc.line(147,279,199,279);text('Pimpinan / evaluator',155,283,6.5,false,muted);

    // Full records are appended only when present. Sections share remaining space.
    const needsAppendix = data.jobs.length || data.tasks.length || data.attendance.length || employee.email || employee.phone || data.evaluation || data.insights.length;
    if(needsAppendix){
        page('Rincian dan Metode Evaluasi');
        heading('Identitas dan cakupan laporan');
        paragraph(`${employee.fullName || employee.username} | ${role} | Divisi: ${employee.division || 'Belum diatur'} | Akun: ${employee.username || '-'}`);
        paragraph(`Email: ${employee.email || '-'} | Telepon: ${employee.phone || '-'} | Lahir: ${date(employee.birthday)} | Status akun: ${employee.isActive == null ? 'Tidak tersedia' : employee.isActive ? 'Aktif' : 'Tidak aktif'}`,{size:8,color:muted});
        paragraph(`Cakupan: ${period}`,{size:8,color:muted});
        paragraph(`Penugasan PIC: ${employee.picTasks ?? '-'} | Saksi: ${employee.witnessTasks ?? '-'} | Berkas dibatalkan: ${employee.cancelled ?? 0}`,{size:8,color:muted});
        paragraph(employee.workingDays == null ? 'Absensi: pegawai tidak diikutsertakan atau data tidak tersedia.' : `Absensi: perkiraan ${employee.workingDays} hari kerja | Hadir ${employee.presentDays} | Terlambat ${employee.lateDays} | Tanpa catatan ${employee.absentDays ?? '-'}`,{size:8,color:muted});
        if(data.jobs.length){heading(`Seluruh berkas PIC (${data.jobs.length})`);table([{title:'No.',width:9},{title:'Dibuat',width:22},{title:'Nomor / pekerjaan',width:64},{title:'Kategori',width:29},{title:'Status',width:25},{title:'Deadline',width:27}],data.jobs.map((j,i)=>[String(i+1),date(j.createdAt),`${j.trackingCode||'-'}\n${j.title||'-'}`,j.category||'-',j.status||'-',date(j.deadline)]));}
        if(data.tasks.length){heading(`Seluruh penugasan (${data.tasks.length})`);table([{title:'No.',width:9},{title:'Dibuat',width:22},{title:'Tugas / berkas',width:64},{title:'Status',width:29},{title:'Target',width:25},{title:'Selesai',width:27}],data.tasks.map((t,i)=>[String(i+1),date(t.createdAt),`${t.customTask||t.taskType||'-'}\n${t.jobTitle||'-'}`,labels[t.workStatus]||'Belum diketahui',date(t.targetDate),date(t.completedAt)]));}
        if(data.attendance.length){
            heading(`Riwayat absensi (${data.attendance.length})`);
            table([{title:'Tanggal',width:34},{title:'Absen masuk',width:25},{title:'Absen pulang',width:25},{title:'Jam kerja',width:30},{title:'Lembur',width:30},{title:'Menit terlambat',width:32}],data.attendance.map(a=>[date(a.date),time(a.checkIn),time(a.checkOut),a.invalidInterval?'Waktu tidak valid':attendanceDuration(a.workMinutes),attendanceDuration(a.overtimeMinutes),a.lateMinutes==null?'-':`${a.lateMinutes} menit`]));
            const sum = (field: string) => data.attendance.reduce((total,row)=>total+(row[field]??0),0);
            paragraph(`Total: jam kerja ${attendanceDuration(sum('workMinutes'))} | Lembur disetujui ${attendanceDuration(sum('overtimeMinutes'))} | Terlambat ${sum('lateMinutes')} menit.`,{size:8});
            paragraph(`Jam masuk kantor ${data.attendanceStartTime || '08:00'}, toleransi ${data.attendanceGraceMinutes ?? 0} menit. Jam kerja adalah selisih masuk-pulang, termasuk istirahat dan lembur. Catatan tanpa jam pulang belum dihitung. Menit terlambat sebelum toleransi payroll. Lembur hanya dari pengajuan disetujui; bukan perhitungan upah lembur.`,{size:8,color:muted});
        }
        if(data.overtimeRequests?.length){
            heading('Riwayat pengajuan lembur');
            const overtimeLabels: Record<string,string> = {PENDING:'Menunggu',APPROVED:'Disetujui',REJECTED:'Ditolak'};
            table([{title:'Tanggal / waktu',width:37},{title:'Durasi',width:24},{title:'Status',width:27},{title:'Keperluan / catatan pemeriksa',width:88}],data.overtimeRequests.map(r=>[`${date(r.date)}\n${time(r.start_at)} - ${time(r.end_at)}`,attendanceDuration(r.minutes),overtimeLabels[r.status]||r.status,`${r.reason}${r.review_notes?'\nCatatan: '+r.review_notes:''}`]));
        }
        if(data.comparison){const c=data.comparison;heading('Perbandingan periode');paragraph(`Sekarang: ${date(c.currentStart)} - ${date(c.currentEnd)}. Sebelumnya: ${date(c.previousStart)} - ${date(c.previousEnd)}.`,{size:8});table([{title:'Indikator',width:88},{title:'Sebelumnya',width:44},{title:'Sekarang',width:44}],[['Berkas dibuat',String(c.previous.totalJobs),String(employee.totalJobs)],['Tugas dibuat',String(c.previous.totalTasks),String(employee.totalTasks)],['Pertama kali selesai tercatat',String(c.previousCompletions),String(c.currentCompletions)],['Hari hadir',c.previous.workingDays==null?'-':String(c.previous.presentDays),employee.workingDays==null?'-':String(employee.presentDays)],['Hari terlambat',c.previous.workingDays==null?'-':String(c.previous.lateDays),employee.workingDays==null?'-':String(employee.lateDays)]]);}
        // Component results are printed in the method section immediately below;
        // repeating those generated sentences here can create a nearly empty page.
        const distinctInsights = data.insights.filter(insight => !components.some(c => insight.startsWith(`${c.label}:`)));
        if(distinctInsights.length){heading('Analisis sistem');distinctInsights.forEach(insight=>paragraph(insight,{size:8}));}
        if(data.evaluation){heading('Evaluasi pimpinan dan tindak lanjut');paragraph(`Catatan: ${data.evaluation.notes || 'Belum diisi'}`,{size:8});paragraph(`Rencana perbaikan: ${data.evaluation.improvement_plan || 'Belum diisi'}`,{size:8});paragraph(`Target berikutnya: ${data.evaluation.next_target || 'Belum diisi'}`,{size:8});}
        heading('Metode penghitungan dan batasan');
        components.forEach(c=>paragraph(`${c.label} | bobot ${c.weight}% | ${c.score==null?'Data belum mencukupi':`${c.score}% (${c.numerator}/${c.denominator})`}`,{size:8}));
        paragraph('Skor tersedia jika semua komponen memiliki data. Berkas/tugas berdasarkan tanggal dibuat, status terkini. Penyelesaian berkas = selesai / (selesai + aktif).',{size:8,color:muted});
        paragraph('Hadir berarti ada check-in. Estimasi hari kerja belum memperhitungkan libur, cuti, jadwal khusus, atau tanggal masuk kerja. Absensi kosong bukan bukti mangkir. Riwayat sebelum fitur aktif, tren skor historis, dan nilai kualitas belum tersedia.',{size:8,color:muted});
    }
    const pages = doc.getNumberOfPages();
    for (let index = 1; index <= pages; index++) {
        doc.setPage(index);
        doc.setFillColor(43,33,19);doc.path([{op:'m',c:[0,285]},{op:'c',c:[58,285,105,310,210,285]},{op:'l',c:[210,297]},{op:'l',c:[0,297]},{op:'h',c:[]}]);doc.fill();
        ribbon([282,58,282,105,308,281],[285,58,285,105,310,285]);
        text('DOKUMEN INTERNAL | Evaluasi Kinerja Pegawai',8,292,6,false,[245,235,210]);
        // Page number sits above the ribbon for consistent contrast at both ends.
        text(`${index} / ${pages}`,194,281,6,false,muted);
    }
    const filename = String(employee.fullName || employee.username || 'pegawai').replace(/[^a-zA-Z0-9_-]+/g, '_').replace(/^_+|_+$/g, '');
    const periodPart = data.filters.start_date && data.filters.end_date ? `${data.filters.start_date}_${data.filters.end_date}` : String(data.periodLabel || 'periode').replace(/[^a-zA-Z0-9_-]+/g, '_');
    return { blob: doc.output('blob'), filename: `Laporan_KPI_${filename || 'pegawai'}_${periodPart || 'periode'}.pdf`, pages };
}
