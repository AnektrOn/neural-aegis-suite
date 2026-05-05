/**
 * Heuristic check: true when URL is likely a playable video resource.
 * Used to keep video content in Bibliothèque rather than Toolbox.
 */
export function isLikelyVideoUrl(rawUrl: string | null | undefined): boolean {
  const input = (rawUrl || "").trim();
  if (!input) return false;

  try {
    const url = new URL(input);
    const host = url.hostname.toLowerCase();
    const path = url.pathname.toLowerCase();

    if (host.includes("youtube.com") || host.includes("youtu.be")) return true;
    if (host.includes("vimeo.com")) return true;
    if (host.includes("drive.google.com")) return true;
    if (path.endsWith(".mp4") || path.endsWith(".webm") || path.endsWith(".mov") || path.endsWith(".m3u8")) return true;
  } catch {
    const lower = input.toLowerCase();
    if (lower.includes("youtube.com") || lower.includes("youtu.be") || lower.includes("drive.google.com")) return true;
    if (lower.endsWith(".mp4") || lower.endsWith(".webm") || lower.endsWith(".mov") || lower.endsWith(".m3u8")) return true;
  }

  return false;
}
