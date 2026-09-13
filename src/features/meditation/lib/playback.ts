import { supabase } from "@/integrations/supabase/client";

export async function grantMeditationPlaybackUrl(trackId: string): Promise<string> {
  const { data, error } = await supabase.functions.invoke("stream-meditation-audio", {
    body: { track_id: trackId },
  });

  if (error) {
    throw new Error(error.message || "Playback grant failed");
  }

  const url = (data as { url?: unknown; error?: unknown } | null)?.url;
  if (typeof url !== "string" || !url) {
    const remote = (data as { error?: unknown } | null)?.error;
    throw new Error(typeof remote === "string" ? remote : "Playback grant failed");
  }

  return url;
}
