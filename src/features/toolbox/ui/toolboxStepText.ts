const COGNITIVE_PREFIX_RE =
  /^(?:[-*]\s*)?(?:\d+\.\s*)?\[(?:Étape|Step)\s*\d+\]\s*[—–-]\s*\*\*([^*]+)\*\*\s*:?\s*(.+)$/i;

/** Split markdown step bullets: `1. Title — body`, `Title : body`, `**Title** — body` */
export function parseToolboxStepBullet(line: string): { title: string; body: string } {
  const trimmed = line.replace(/^[-*]\s*/, "").trim();

  const cognitive = trimmed.match(COGNITIVE_PREFIX_RE);
  if (cognitive) {
    return { title: cognitive[1].trim(), body: cognitive[2].trim() };
  }

  const withoutNum = trimmed.replace(/^\d+\.\s*/, "").trim();

  const boldPrefix = withoutNum.match(/^\*\*([^*]+)\*\*\s*(?:[—–-]|:)\s*(.+)$/);
  if (boldPrefix) {
    return { title: boldPrefix[1].trim(), body: boldPrefix[2].trim() };
  }

  const emOrEnDash = withoutNum.match(/^(.+?)\s*[—–]\s*(.+)$/);
  if (emOrEnDash) {
    return {
      title: emOrEnDash[1].replace(/^\*\*|\*\*$/g, "").trim(),
      body: emOrEnDash[2].trim(),
    };
  }

  const spacedHyphen = withoutNum.match(/^(.+?)\s+-\s+(.+)$/);
  if (spacedHyphen) {
    return {
      title: spacedHyphen[1].replace(/^\*\*|\*\*$/g, "").trim(),
      body: spacedHyphen[2].trim(),
    };
  }

  const colonSplit = withoutNum.match(/^([^:]{2,80}?)\s*:\s+(.+)$/);
  if (colonSplit) {
    return {
      title: colonSplit[1].replace(/^\*\*|\*\*$/g, "").trim(),
      body: colonSplit[2].trim(),
    };
  }

  return { title: "", body: trimmed };
}

export function isLongToolboxCopy(text: string): boolean {
  const t = text.trim();
  if (t.length > 280) return true;
  return t.split(/\n+/).filter(Boolean).length > 2;
}
