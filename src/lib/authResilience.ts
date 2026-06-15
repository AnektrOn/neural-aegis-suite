const AUTH_TIMEOUT_MESSAGE =
  "Le service de connexion met trop de temps à répondre. Réessaie dans une minute ; si ça persiste, augmente l’instance Backend dans les réglages avancés.";

export function authTimeoutError(): Error {
  return new Error(AUTH_TIMEOUT_MESSAGE);
}

export function withAuthTimeout<T>(promise: Promise<T>, timeoutMs = 12_000): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(authTimeoutError()), timeoutMs);
  });

  return Promise.race([promise, timeout]).finally(() => {
    if (timeoutId) clearTimeout(timeoutId);
  });
}

export function authErrorMessage(err: unknown): string {
  if (err instanceof Error && err.message.trim()) return err.message;
  if (typeof err === "string" && err.trim()) return err;
  if (err && typeof err === "object") {
    const maybeMessage = (err as { message?: unknown; error_description?: unknown; error?: unknown }).message
      ?? (err as { error_description?: unknown }).error_description
      ?? (err as { error?: unknown }).error;
    if (typeof maybeMessage === "string" && maybeMessage.trim()) return maybeMessage;
  }
  return AUTH_TIMEOUT_MESSAGE;
}