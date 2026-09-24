/** Split markdown step bullets: `1. Title — body` */
export function parseToolboxStepBullet(line: string): { title: string; body: string } {
  const trimmed = line.trim();
  const m = trimmed.match(/^(?:\d+\.\s*)?(.+?)\s*[—–-]\s*(.+)$/);
  if (m) {
    return { title: m[1].trim(), body: m[2].trim() };
  }
  return { title: "", body: trimmed };
}

export function isLongToolboxCopy(text: string): boolean {
  const t = text.trim();
  if (t.length > 280) return true;
  return t.split(/\n+/).filter(Boolean).length > 2;
}
