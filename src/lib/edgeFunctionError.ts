/** Extrait le message d'erreur renvoyé par une Edge Function (corps JSON `{ error }`). */
export async function readEdgeFunctionError(error: unknown, fallback = "Unknown error"): Promise<string> {
  const ctx = (error as { context?: Response } | null)?.context;
  if (ctx && typeof ctx.text === "function") {
    try {
      const raw = await ctx.text();
      if (raw) {
        try {
          const parsed = JSON.parse(raw) as { error?: string; message?: string };
          if (parsed?.error || parsed?.message) return String(parsed.error || parsed.message);
        } catch {
          return raw;
        }
      }
    } catch {
      /* ignore */
    }
  }
  const msg = (error as { message?: string } | null)?.message;
  return msg || fallback;
}
