import type { AuthError } from "@supabase/supabase-js";

type AuthTranslator = (key: string) => string;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function messageOf(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (isRecord(err) && typeof err.message === "string") return err.message;
  return String(err);
}

/** True when Supabase auth origin is unreachable (paused project, 522, timeout, etc.). */
export function isAuthBackendUnavailable(err: unknown): boolean {
  const message = messageOf(err).toLowerCase();
  return (
    message.includes("failed to fetch") ||
    message.includes("networkerror") ||
    message.includes("network request failed") ||
    message.includes("load failed") ||
    message.includes("timeout") ||
    message.includes("522") ||
    message.includes("503") ||
    message.includes("504") ||
    message.includes("service unavailable") ||
    message.includes("backend d'authentification") ||
    message.includes("fetch failed")
  );
}

export function formatAuthError(t: AuthTranslator, err: unknown): string {
  if (isAuthBackendUnavailable(err)) {
    return t("auth.backendUnavailable");
  }

  const message = messageOf(err);
  const lower = message.toLowerCase();

  if (lower.includes("invalid login credentials")) {
    return t("auth.invalidCredentials");
  }

  if (isRecord(err) && (err as unknown as AuthError).status === 429) {
    return t("auth.tooManyAttempts");
  }

  return message;
}

export async function pingAuthBackend(
  supabaseUrl: string | undefined,
  apiKey: string | undefined,
  timeoutMs = 8000,
): Promise<boolean> {
  if (!supabaseUrl || !apiKey) return false;

  try {
    const response = await fetch(`${supabaseUrl.replace(/\/$/, "")}/auth/v1/health`, {
      headers: { apikey: apiKey },
      signal: AbortSignal.timeout(timeoutMs),
    });
    return response.status > 0 && response.status < 500;
  } catch {
    return false;
  }
}
