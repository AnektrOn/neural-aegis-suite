import { parseToolboxItemMarkdown } from "./parseToolboxItemMarkdown";
import type { ToolboxItem } from "./types";

type RawModule = { default: string };

/**
 * Charge tous les .md d'un répertoire Vite (ex. `import.meta.glob`).
 * Filtre les items inactifs sauf si `includeInactive`.
 */
export function loadToolboxItemsFromRawModules(
  modules: Record<string, RawModule | string>,
  options?: { includeInactive?: boolean },
): ToolboxItem[] {
  const items: ToolboxItem[] = [];

  for (const [path, mod] of Object.entries(modules)) {
    const raw = typeof mod === "string" ? mod : mod.default;
    const item = parseToolboxItemMarkdown(raw, { source: path });
    if (!options?.includeInactive && !item.is_active) continue;
    items.push(item);
  }

  return items.sort((a, b) => a.external_key.localeCompare(b.external_key));
}

// Exemple : const modules = import.meta.glob('/content/toolbox/**/*.md', { eager: true, query: '?raw', import: 'default' });
export const TOOLBOX_CONTENT_GLOB_HINT =
  "import.meta.glob('/content/toolbox/**/*.md', { eager: true, query: '?raw', import: 'default' })";
