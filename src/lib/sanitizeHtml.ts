import DOMPurify from "dompurify";

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] ?? c);
}

/** Only allow inert SVG markup (no scripts, handlers or foreign objects). */
export function sanitizeSvg(svg: string | null | undefined): string {
  if (!svg) return "";
  return DOMPurify.sanitize(svg, { USE_PROFILES: { svg: true, svgFilters: true }, FORBID_TAGS: ["foreignObject", "script", "style"] });
}
