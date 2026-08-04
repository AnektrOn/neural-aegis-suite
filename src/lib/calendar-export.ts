/**
 * Export d'un élément (toolbox / habitude) vers un calendrier personnel :
 * - Google Agenda via une URL de création d'évènement
 * - Apple Calendar / Outlook via un fichier .ics téléchargé
 */

/** Domaine public de l'app (utilisé pour les liens profonds des évènements). */
export const APP_BASE_URL = "https://aegis.humancatalystbeacon.com";

/** Construit un lien profond absolu vers l'app publique. */
export function buildAppLink(path: string): string {
  return `${APP_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export interface CalendarEventInput {
  title: string;
  description?: string;
  /** Catégorie / type (Toolbox, Habitude, ...) */
  category?: string;
  /** Libellé de durée affiché ("10 min") */
  durationLabel?: string;
  /** Lignes additionnelles ajoutées à la description */
  extraLines?: string[];
  /** Langue des libellés générés */
  lang?: "fr" | "en";
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


function buildDetails(input: CalendarEventInput): string {
  const fr = (input.lang ?? "fr") === "fr";
  const L = fr
    ? {
        what: "OBJET",
        cat: "Catégorie",
        dur: "Durée",
        how: "COMMENT FAIRE",
        steps: [
          "1. Ouvrir Aegis via le lien ci-dessous.",
          "2. Réaliser l'exercice jusqu'au bout.",
          "3. Valider la complétion dans l'app pour l'enregistrer dans ton suivi.",
        ],
        open: "OUVRIR DANS AEGIS",
        footer: "Aegis — Human Catalyst Beacon",
      }
    : {
        what: "ABOUT",
        cat: "Category",
        dur: "Duration",
        how: "HOW TO",
        steps: [
          "1. Open Aegis using the link below.",
          "2. Complete the exercise.",
          "3. Mark it as done in the app so it is tracked.",
        ],
        open: "OPEN IN AEGIS",
        footer: "Aegis — Human Catalyst Beacon",
      };

  const blocks: string[] = [];
  const head: string[] = [`${L.what} : ${input.title}`];
  if (input.category) head.push(`${L.cat} : ${input.category}`);
  if (input.durationLabel) head.push(`${L.dur} : ${input.durationLabel}`);
  blocks.push(head.join("\n"));
  if (input.description) blocks.push(input.description.trim());
  if (input.extraLines?.length) blocks.push(input.extraLines.filter(Boolean).join("\n"));
  blocks.push(`${L.how}\n${L.steps.join("\n")}`);
  if (input.url) blocks.push(`${L.open} :\n${input.url}`);
  blocks.push(L.footer);
  return blocks.join("\n\n");
}

export function buildGoogleCalendarUrl(input: CalendarEventInput): string {
  const { start, end } = resolveWindow(input);
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: input.title,
    dates: `${toUtcStamp(start)}/${toUtcStamp(end)}`,
  });
  params.set("details", buildDetails(input));
  if (input.category) params.set("location", "Aegis");
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
  lines.push(`DESCRIPTION:${escapeIcsText(buildDetails(input))}`);
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
