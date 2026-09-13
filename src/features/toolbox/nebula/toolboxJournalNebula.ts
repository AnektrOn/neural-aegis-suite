/** Single routing source for the « Écriture & journal » nebula family. */

export const JOURNAL_PROMPT_NEBULA_SLUGS = new Set(["journal_prompt"]);

export const JOURNAL_TIMED_NEBULA_SLUGS = new Set([
  "journal_stream",
  "morning_pages",
  "letter_unsent",
]);

export const JOURNAL_STEP_NEBULA_SLUGS = new Set(["evening_review", "worry_dump"]);

export const JOURNAL_NEBULA_SLUGS = new Set([
  ...JOURNAL_PROMPT_NEBULA_SLUGS,
  ...JOURNAL_TIMED_NEBULA_SLUGS,
  ...JOURNAL_STEP_NEBULA_SLUGS,
]);

export function isJournalNebulaSlug(slug: string): boolean {
  return JOURNAL_NEBULA_SLUGS.has(slug);
}

export function journalNebulaMode(slug: string): "prompt" | "timed" | "steps" {
  if (JOURNAL_PROMPT_NEBULA_SLUGS.has(slug)) return "prompt";
  if (JOURNAL_TIMED_NEBULA_SLUGS.has(slug)) return "timed";
  return "steps";
}
