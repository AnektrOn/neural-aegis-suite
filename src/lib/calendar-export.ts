/**
 * Export d'un élément (toolbox / habitude) vers un calendrier personnel :
 * - Google Agenda via une URL de création d'évènement
 * - Apple Calendar / Outlook via un fichier .ics téléchargé
 */

export interface CalendarEventInput {
  title: string;
  description?: string;
  /** Durée en minutes (défaut : 15) */
  durationMin?: number;
  /** Date/heure de début (défaut : demain 08:00 locale) */
  start?: Date;
  /** Répétition quotidienne (rappel habitude) */
  recurringDaily?: boolean;
  /** URL à joindre à l'évènement */
  url?: string;
}

/** Parse "10 min", "5-10 minutes", "1h" → minutes */
export function parseDurationMinutes(raw: string | null | undefined, fallback = 15): number {
  if (!raw) return fallback;
  const text = String(raw).toLowerCase();
  const hour = text.match(/(\d+)\s*h/);
  if (hour) return Math.max(5, parseInt(hour[1], 10) * 60);
  const nums = text.match(/\d+/g);
  if (!nums || nums.length === 0) return fallback;
  const value = parseInt(nums[nums.length - 1], 10);
  return Number.isFinite(value) && value > 0 ? Math.min(value, 480) : fallback;
}

function defaultStart(): Date {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(8, 0, 0, 0);
  return d;
}

function toUtcStamp(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

function escapeIcsText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

function resolveWindow(input: CalendarEventInput): { start: Date; end: Date } {
  const start = input.start ?? defaultStart();
  const end = new Date(start.getTime() + (input.durationMin ?? 15) * 60_000);
  return { start, end };
}

export function buildGoogleCalendarUrl(input: CalendarEventInput): string {
  const { start, end } = resolveWindow(input);
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: input.title,
    dates: `${toUtcStamp(start)}/${toUtcStamp(end)}`,
  });
  const details = [input.description, input.url].filter(Boolean).join("\n\n");
  if (details) params.set("details", details);
  if (input.recurringDaily) params.set("recur", "RRULE:FREQ=DAILY");
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function buildIcs(input: CalendarEventInput): string {
  const { start, end } = resolveWindow(input);
  const uid = `${Date.now()}-${Math.random().toString(36).slice(2)}@aegis`;
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Aegis//Toolbox//FR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${toUtcStamp(new Date())}`,
    `DTSTART:${toUtcStamp(start)}`,
    `DTEND:${toUtcStamp(end)}`,
    `SUMMARY:${escapeIcsText(input.title)}`,
  ];
  if (input.description) lines.push(`DESCRIPTION:${escapeIcsText(input.description)}`);
  if (input.url) lines.push(`URL:${input.url}`);
  if (input.recurringDaily) lines.push("RRULE:FREQ=DAILY");
  lines.push("BEGIN:VALARM", "TRIGGER:-PT10M", "ACTION:DISPLAY", "DESCRIPTION:Reminder", "END:VALARM");
  lines.push("END:VEVENT", "END:VCALENDAR");
  return lines.join("\r\n");
}

export function downloadIcs(input: CalendarEventInput): void {
  const blob = new Blob([buildIcs(input)], { type: "text/calendar;charset=utf-8" });
  const href = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = href;
  a.download = `${input.title.replace(/[^\p{L}\p{N}]+/gu, "-").slice(0, 60) || "event"}.ics`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(href), 2000);
}
