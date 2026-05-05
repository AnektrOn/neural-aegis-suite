export const LIBRARY_SCOPES = ["global_fr", "global_en", "perso"] as const;

export type LibraryScope = (typeof LIBRARY_SCOPES)[number];

export function isLibraryScope(value: unknown): value is LibraryScope {
  return typeof value === "string" && (LIBRARY_SCOPES as readonly string[]).includes(value);
}

/** Reads `widget_config.library_scope`; defaults to global_fr for older rows. */
export function getLibraryScope(widgetConfig: unknown): LibraryScope {
  if (widgetConfig && typeof widgetConfig === "object" && "library_scope" in widgetConfig) {
    const v = (widgetConfig as { library_scope?: unknown }).library_scope;
    if (isLibraryScope(v)) return v;
  }
  return "global_fr";
}
