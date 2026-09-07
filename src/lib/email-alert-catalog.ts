import alertsMd from "../../content/email-alerts/alerts.md?raw";

export type AlertLang = "fr" | "en";

export interface EmailAlertTemplate {
  id: string;
  link: string | null;
  subject_fr: string;
  subject_en: string;
  body_fr: string;
  body_en: string;
}

/** Parse le catalogue Markdown : un bloc `## id` par alerte, champs `clé: valeur`. */
export function parseEmailAlertsMarkdown(md: string): EmailAlertTemplate[] {
  const out: EmailAlertTemplate[] = [];
  const blocks = md.split(/^##\s+/m).slice(1);

  for (const block of blocks) {
    const lines = block.split("\n");
    const id = (lines.shift() || "").trim();
    if (!id) continue;
    const fields: Record<string, string> = {};
    for (const raw of lines) {
      const line = raw.trim();
      if (!line || line.startsWith("#") || line.startsWith("---")) continue;
      const m = line.match(/^([a-z_]+)\s*:\s*(.*)$/i);
      if (m) fields[m[1].toLowerCase()] = m[2].trim();
    }
    if (!fields.subject_fr && !fields.subject_en) continue;
    out.push({
      id,
      link: fields.link || null,
      subject_fr: fields.subject_fr || fields.subject_en || "",
      subject_en: fields.subject_en || fields.subject_fr || "",
      body_fr: fields.body_fr || fields.body_en || "",
      body_en: fields.body_en || fields.body_fr || "",
    });
  }
  return out;
}

export const EMAIL_ALERT_TEMPLATES = parseEmailAlertsMarkdown(alertsMd);

export function getAlertTemplate(id: string): EmailAlertTemplate | undefined {
  return EMAIL_ALERT_TEMPLATES.find((a) => a.id === id);
}

export function renderAlert(
  tpl: EmailAlertTemplate,
  lang: AlertLang,
  name = "",
): { subject: string; body: string } {
  const subject = lang === "fr" ? tpl.subject_fr : tpl.subject_en;
  const body = (lang === "fr" ? tpl.body_fr : tpl.body_en).replace(
    /\{name\}/g,
    name || (lang === "fr" ? "" : ""),
  );
  return { subject, body: body.replace(/\s{2,}/g, " ").trim() };
}
