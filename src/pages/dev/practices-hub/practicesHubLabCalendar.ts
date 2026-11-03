export type PracticesHubLabCalendarDotKind = "neutral" | "p" | "k" | "g" | "r";

export type PracticesHubLabCalendarDay = {
  id: string;
  dayNum: string;
  weekday: string;
  isToday: boolean;
  dots: readonly PracticesHubLabCalendarDotKind[];
};

/** Decorative dots per cell (reference mockup — no backend meaning). */
const CALENDAR_DOT_COLUMNS: readonly (readonly PracticesHubLabCalendarDotKind[])[] = [
  ["neutral", "p", "k"],
  ["neutral", "k", "g"],
  ["r", "g", "neutral"],
  ["neutral", "neutral", "neutral"],
] as const;

export function buildPracticesHubLabCalendar(locale: string): PracticesHubLabCalendarDay[] {
  const today = new Date();
  today.setHours(12, 0, 0, 0);

  const weekdayFmt = new Intl.DateTimeFormat(locale, { weekday: "short" });

  return [-2, -1, 0, 1].map((offset, index) => {
    const d = new Date(today);
    d.setDate(today.getDate() + offset);
    const weekday = weekdayFmt.format(d).replace(/\.$/, "").toLowerCase();
    return {
      id: d.toISOString().slice(0, 10),
      dayNum: String(d.getDate()),
      weekday,
      isToday: offset === 0,
      dots: CALENDAR_DOT_COLUMNS[index] ?? CALENDAR_DOT_COLUMNS[0],
    };
  });
}
