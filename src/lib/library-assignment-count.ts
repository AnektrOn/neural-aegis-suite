import { supabase } from "@/integrations/supabase/client";
import { pickLocalizedText } from "@/lib/content-i18n";
import { getLibraryScope } from "@/lib/library-scope";
import type { Locale } from "@/i18n/translations";

type JsonI18n = Partial<Record<Locale, string>> | Record<string, string> | null;

function toLibraryEmbedUrl(externalUrl: string): string | null {
  const raw = externalUrl.trim();
  if (!raw) return null;

  if (raw.includes("drive.google.com")) {
    const fromPath = raw.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (fromPath?.[1]) {
      return `https://drive.google.com/file/d/${fromPath[1]}/preview`;
    }
    try {
      const url = new URL(raw);
      const id = url.searchParams.get("id");
      if (id && url.hostname.includes("drive.google.com")) {
        return `https://drive.google.com/file/d/${id}/preview`;
      }
    } catch {
      return null;
    }
    return null;
  }

  if (raw.includes("youtube.com") || raw.includes("youtu.be")) {
    try {
      const url = new URL(raw);
      let vid: string | null = null;
      if (url.hostname === "youtu.be") {
        vid = url.pathname.replace(/^\//, "").split("/")[0] || null;
      } else if (url.hostname.includes("youtube.com")) {
        vid = url.searchParams.get("v");
        if (!vid && url.pathname.startsWith("/embed/")) {
          vid = url.pathname.replace(/^\/embed\//, "").split("/")[0] || null;
        }
      }
      if (vid) return `https://www.youtube.com/embed/${vid}`;
    } catch {
      return null;
    }
  }

  return null;
}

function embedDedupeKey(externalUrl: string): string | null {
  return toLibraryEmbedUrl(externalUrl);
}

function isExcludedVideo(title: string): boolean {
  const normalized = title.toLowerCase().replace(/[_\s]/g, " ");
  return normalized.includes("deep transformation") || normalized.includes("transformation profonde");
}

/** Count assigned library resources (same dedup rules as Bibliothèque page). */
export async function countAssignedLibraryResources(userId: string, locale: Locale): Promise<number> {
  const [libRes, tbRes] = await Promise.all([
    supabase
      .from("library_video_assignments")
      .select(
        `
        id,
        library_videos (
          title,
          title_i18n,
          external_url
        )
      `,
      )
      .eq("user_id", userId),
    supabase
      .from("toolbox_assignments")
      .select("id, title, title_i18n, external_url, widget_config, content_type, user_delivery_status")
      .eq("user_id", userId)
      .neq("user_delivery_status", "inactive")
      .eq("content_type", "external_link")
      .not("external_url", "is", null),
  ]);

  const seenEmbedKeys = new Set<string>();
  let count = 0;

  if (!libRes.error) {
    for (const row of libRes.data || []) {
      const vid = row.library_videos as
        | { title: string; title_i18n?: JsonI18n; external_url: string }
        | null
        | undefined;
      if (!vid?.external_url) continue;
      const dedupe = embedDedupeKey(vid.external_url);
      if (!dedupe || seenEmbedKeys.has(dedupe)) continue;
      seenEmbedKeys.add(dedupe);
      const displayTitle = pickLocalizedText(locale, vid.title_i18n, vid.title);
      if (isExcludedVideo(displayTitle)) continue;
      count += 1;
    }
  }

  if (!tbRes.error) {
    for (const row of tbRes.data || []) {
      const url = row.external_url as string | null;
      if (!url) continue;
      const dedupe = embedDedupeKey(url);
      if (!dedupe || seenEmbedKeys.has(dedupe)) continue;
      seenEmbedKeys.add(dedupe);
      const displayTitle = pickLocalizedText(locale, row.title_i18n as JsonI18n, row.title as string);
      if (isExcludedVideo(displayTitle)) continue;
      count += 1;
    }
  }

  return count;
}
