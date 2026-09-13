import { resolveToolboxContentSlug } from "@/lib/toolbox-content-slug";
import { getBuiltinToolboxContentTypeDefinition } from "@/lib/toolbox-content-type-definitions";
import { resolveToolboxWidget } from "@/lib/toolbox-widget-resolver";
import type { ToolboxRenderableItem } from "@/lib/toolbox-renderer-registry";
import { getToolboxNebulaPreset } from "./toolboxNebulaPresets";

export function resolveToolboxNebulaPresetForItem(item: ToolboxRenderableItem) {
  const slug = resolveToolboxContentSlug(
    item.content_type_slug || item.content_type,
    item.widget_config,
  );
  const def = getBuiltinToolboxContentTypeDefinition(slug);
  const resolved = resolveToolboxWidget(slug, item.widget_config ?? {});
  return getToolboxNebulaPreset(slug, def?.category ?? "custom", resolved?.kind ?? null);
}

export function shouldEnableToolboxNebula(
  item: ToolboxRenderableItem,
  _reduceMotion = false,
): boolean {
  const cfg = item.widget_config;
  if (cfg && cfg.nebula_enabled === false) return false;
  return true;
}
