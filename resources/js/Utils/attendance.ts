export const attendanceDuration = (minutes?: number | null): string => {
    if (minutes == null || !Number.isFinite(minutes)) return '-';
    return `${Math.floor(minutes / 60)}j ${minutes % 60}m`;
};

export const attendanceTime = (value?: string | null): string => {
    if (!value) return '-';
    return String(value).match(/(?:T|\s)(\d{2}:\d{2})/)?.[1] || String(value).match(/^\d{2}:\d{2}/)?.[0] || '-';
};
