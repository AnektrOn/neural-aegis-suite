/**
 * Runtime personalization for admin-authored Tao portrait Markdown.
 * Templates use [Username] or generic "utilisateur" — replaced at display time only.
 */

const BRACKET_PLACEHOLDERS = [
  /\[Username\]/gi,
  /\[USERNAME\]/g,
  /\[Nom\]/gi,
  /\[NOM\]/g,
  /\[Name\]/gi,
  /\[NAME\]/g,
];

const CURLY_PLACEHOLDERS = [/\{\{username\}\}/gi, /\{\{name\}\}/gi, /\{username\}/gi, /\{name\}/gi];

/** l'utilisateur / l'Utilisateur with straight or curly apostrophe */
const FRENCH_USER_PHRASES = [
  /\bl['']Utilisateur\b/g,
  /\bl['']utilisateur\b/g,
  /\bde l['']Utilisateur\b/g,
  /\bde l['']utilisateur\b/g,
  /\bdu Utilisateur\b/g,
  /\bdu utilisateur\b/g,
  /\bUtilisateur\b/g,
  /\butilisateur\b/g,
];

export function personalizeTaoMarkdown(
  markdown: string,
  displayName?: string | null,
): string {
  const name = displayName?.trim();
  if (!name || !markdown) return markdown;

  let out = markdown;
  for (const pattern of BRACKET_PLACEHOLDERS) {
    out = out.replace(pattern, name);
  }
  for (const pattern of CURLY_PLACEHOLDERS) {
    out = out.replace(pattern, name);
  }
  for (const pattern of FRENCH_USER_PHRASES) {
    out = out.replace(pattern, name);
  }
  return out;
}
