export function formatDurationSec(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  if (h > 0) {
    return m > 0 ? `${h}h ${m}min` : `${h}h`;
  }
  if (m > 0) {
    return `${m}min`;
  }
  return `${total}s`;
}

export function avgOrNull(arr: number[]): number | null {
  if (arr.length === 0) return null;
  const sum = arr.reduce((a, b) => a + b, 0);
  return Math.round((sum / arr.length) * 10) / 10;
}

export function getDayKey(isoString: string): string {
  const t = isoString.indexOf('T');
  if (t === 10) {
    return isoString.slice(0, 10);
  }
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) {
    return '';
  }
  const y = d.getUTCFullYear();
  const mo = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${mo}-${day}`;
}

export function getWeekRange(offsetWeeks = 0): { start: Date; end: Date } {
  const now = new Date();
  const day = now.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diffToMonday - offsetWeeks * 7);
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  return { start: monday, end: sunday };
}

export function deltaPercent(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return Math.round(((current - previous) / previous) * 100);
}
