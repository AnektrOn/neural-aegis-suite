/** Normalise le source Mermaid (exports NotebookLM / markdown aplati). */
export function normalizeMermaidSource(raw: string): string {
  let s = raw.trim();
  s = s.replace(/^```(?:mermaid)?\s*/i, "").replace(/```\s*$/i, "").trim();
  s = s.replace(/^mermaid\s+(graph|flowchart|sequenceDiagram|classDiagram|stateDiagram)/i, "$1");

  s = repairFlattenedMermaid(s);
  s = repairMermaidNodeLabels(s);

  return s
    .split("\n")
    .map((line) => line.trimEnd())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Restaure des sauts de ligne quand le diagramme a été aplati en une seule ligne. */
function repairFlattenedMermaid(source: string): string {
  if (source.includes("\n") && source.split("\n").length > 4) return source;

  return source
    .replace(/\s+(graph\s+(?:TD|TB|BT|RL|LR))/gi, "\n$1")
    .replace(/\s+(flowchart\s+(?:TD|TB|BT|RL|LR))/gi, "\n$1")
    .replace(/\s+(%%[^\n]*)/g, "\n$1")
    .replace(/\s+(classDef\s+\w+)/g, "\n$1")
    .replace(/\s+(class\s+[A-Za-z0-9_,\s]+;)/g, "\n$1")
    .replace(/\s+(M\d+\s*[([])/g, "\n$1")
    .trim();
}

/** Fusionne les labels de nœuds cassés sur plusieurs lignes. */
function repairMermaidNodeLabels(source: string): string {
  return source.replace(
    /(\bM\d+)\(\(([\s\S]*?)\)\)/g,
    (_, id: string, inner: string) => `${id}((${inner.replace(/\s+/g, " ").trim()}))`,
  ).replace(
    /(\bM\d+)\(([\s\S]*?)\)/g,
    (_, id: string, inner: string) => {
      const label = inner.replace(/\s+/g, " ").trim();
      if (!label) return `${id}("${id}")`;
      return `${id}("${label.replace(/"/g, "'")}")`;
    },
  );
}

export function splitTextWithEmbeddedMermaid(text: string): Array<
  | { kind: "text"; content: string }
  | { kind: "mermaid"; content: string }
> {
  const parts: Array<{ kind: "text"; content: string } | { kind: "mermaid"; content: string }> = [];
  const re = /```\s*mermaid\s*([\s\S]*?)```/gi;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = re.exec(text)) !== null) {
    const before = text.slice(lastIndex, match.index).trim();
    if (before) parts.push({ kind: "text", content: before });
    parts.push({ kind: "mermaid", content: normalizeMermaidSource(match[1]) });
    lastIndex = match.index + match[0].length;
  }

  const tail = text.slice(lastIndex).trim();
  if (tail) parts.push({ kind: "text", content: tail });

  return parts.length ? parts : [{ kind: "text", content: text }];
}
