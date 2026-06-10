/** Resolve legacy / alias content_type values to a native widget slug. */
export function resolveToolboxContentSlug(
  contentType: string,
  widgetConfig?: Record<string, unknown> | null,
): string {
  const slug = (contentType || "").trim().toLowerCase();
  const cfg = widgetConfig && typeof widgetConfig === "object" ? widgetConfig : {};

  if (slug === "meditation") {
    if (Array.isArray(cfg.scenes) && cfg.scenes.length > 0) return "visualization";
    if (Array.isArray(cfg.cues) && cfg.cues.length > 0) return "visualization";
    if (Array.isArray(cfg.steps) && cfg.steps.length > 0) return "micro_practice";
    if (Array.isArray(cfg.zones) && cfg.zones.length > 0) return "body_scan";
    return "focus_introspectif";
  }

  return slug || contentType;
}
