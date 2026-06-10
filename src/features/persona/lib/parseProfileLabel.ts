export function parseProfileLabel(label: string): { name: string | null; classTitle: string } {
  const sep = label.includes(" — ") ? " — " : label.includes(" - ") ? " - " : null;
  if (sep) {
    const idx = label.indexOf(sep);
    return {
      name: label.slice(0, idx).trim() || null,
      classTitle: label.slice(idx + sep.length).trim(),
    };
  }
  return { name: null, classTitle: label };
}
