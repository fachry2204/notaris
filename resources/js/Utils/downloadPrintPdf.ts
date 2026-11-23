export async function downloadPrintPdf(printUrl: string, filename: string): Promise<void> {
    const frame = document.createElement("iframe");
    frame.title = "Menyiapkan PDF dokumen";
    Object.assign(frame.style, { position: "fixed", left: "0", top: "0", width: "794px", height: "1123px", opacity: "0", pointerEvents: "none", border: "0", zIndex: "-1" });
    try {
        const loaded = new Promise<void>((resolve, reject) => {
            frame.onload = () => resolve();
            frame.onerror = () => reject(new Error("Halaman cetak tidak dapat dimuat"));
        });
        frame.src = printUrl;
        document.body.appendChild(frame);
        await loaded;
        const doc = frame.contentDocument;
        if (!doc) throw new Error("Halaman cetak tidak tersedia");
        const main = await new Promise<HTMLElement>((resolve, reject) => {
            const find = () => {
                const element = doc.querySelector<HTMLElement>("main");
                const qr = element?.querySelector<HTMLImageElement>('footer img[alt="QR verifikasi dokumen"]');
                const images = element ? Array.from(element.querySelectorAll<HTMLImageElement>("img")) : [];
                if (element && qr?.complete && qr.naturalWidth && images.every((image) => image.complete && image.naturalWidth)) { clearInterval(timer); clearTimeout(timeout); resolve(element); }
            };
            const timer = window.setInterval(find, 100);
            const timeout = window.setTimeout(() => { clearInterval(timer); reject(new Error("Dokumen atau QR verifikasi belum siap")); }, 10000);
            find();
        });
        await doc.fonts.ready;
        const [{ default: html2canvas }, { jsPDF }] = await Promise.all([import("html2canvas"), import("jspdf")]);
        const canvas = await html2canvas(main, {
            scale: 2, backgroundColor: "#ffffff", useCORS: true, windowWidth: 794,
            ignoreElements: (element) => element.classList.contains("print:hidden"),
            onclone: (clonedDocument) => {
                const view = clonedDocument.defaultView;
                if (!view) return;
                for (const element of clonedDocument.querySelectorAll<HTMLElement>("*")) {
                    const computed = view.getComputedStyle(element);
                    for (const property of ["color", "background-color", "border-top-color", "border-right-color", "border-bottom-color", "border-left-color"]) {
                        const original = computed.getPropertyValue(property);
                        const converted = original.replace(/color\(srgb\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+))?\)/g, (_match, r, g, b, a) => `rgba(${Math.round(Number(r) * 255)}, ${Math.round(Number(g) * 255)}, ${Math.round(Number(b) * 255)}, ${a ?? 1})`);
                        if (converted !== original) element.style.setProperty(property, converted, "important");
                    }
                }
            },
        });
        const pdf = new jsPDF({ unit: "mm", format: "a4" });
        const pageWidth = 190;
        const pageHeight = 277;
        const pixelsPerPage = Math.floor(canvas.width * pageHeight / pageWidth);
        const bounds = main.getBoundingClientRect();
        const avoidBreaks = Array.from(main.querySelectorAll("tr, footer, header, dl, section, .mt-16"))
            .map((element) => { const rect = element.getBoundingClientRect(); return { top: (rect.top - bounds.top) * 2, bottom: (rect.bottom - bounds.top) * 2 }; })
            .filter((item) => item.bottom - item.top < pixelsPerPage);
        let offset = 0;
        while (offset < canvas.height) {
            let end = Math.min(offset + pixelsPerPage, canvas.height);
            if (end < canvas.height) {
                const overlapping = avoidBreaks.filter((item) => item.top < end && item.bottom > end && item.top > offset + pixelsPerPage * 0.35);
                if (overlapping.length) end = Math.floor(Math.min(...overlapping.map((item) => item.top)));
            }
            const slice = document.createElement("canvas");
            slice.width = canvas.width;
            slice.height = end - offset;
            const context = slice.getContext("2d");
            if (!context) throw new Error("Gagal menyusun halaman PDF");
            context.fillStyle = "#ffffff";
            context.fillRect(0, 0, slice.width, slice.height);
            context.drawImage(canvas, 0, offset, canvas.width, slice.height, 0, 0, canvas.width, slice.height);
            if (offset > 0) pdf.addPage();
            pdf.addImage(slice.toDataURL("image/jpeg", 0.95), "JPEG", 10, 10, pageWidth, slice.height * pageWidth / canvas.width);
            offset = end;
        }
        pdf.save(filename);
    } finally {
        frame.remove();
    }
}
