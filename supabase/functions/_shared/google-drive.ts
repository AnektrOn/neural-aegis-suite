const DRIVE_SCOPE_DEFAULT = "https://www.googleapis.com/auth/drive.readonly";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";

export type DriveFileMetadata = {
  id: string;
  name: string;
  createdTime: string | null;
  mimeType: string | null;
  thumbnailLink: string | null;
  size: string | null;
  videoMediaMetadata?: {
    durationMillis?: string;
  };
};

function toBase64Url(input: Uint8Array | string): string {
  const bytes = typeof input === "string" ? new TextEncoder().encode(input) : input;
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function normalizePrivateKey(rawKey: string): string {
  return rawKey.replace(/\\n/g, "\n").trim();
}

async function createServiceAccountJwt(
  clientEmail: string,
  privateKeyPem: string,
  scopes: string,
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const payload = {
    iss: clientEmail,
    scope: scopes,
    aud: GOOGLE_TOKEN_URL,
    iat: now,
    exp: now + 3600,
  };

  const encodedHeader = toBase64Url(JSON.stringify(header));
  const encodedPayload = toBase64Url(JSON.stringify(payload));
  const unsignedToken = `${encodedHeader}.${encodedPayload}`;

  const keyData = normalizePrivateKey(privateKeyPem)
    .replace("-----BEGIN PRIVATE KEY-----", "")
    .replace("-----END PRIVATE KEY-----", "")
    .replace(/\s/g, "");

  const binaryKey = Uint8Array.from(atob(keyData), (char) => char.charCodeAt(0));
  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    binaryKey.buffer,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    cryptoKey,
    new TextEncoder().encode(unsignedToken),
  );

  return `${unsignedToken}.${toBase64Url(new Uint8Array(signature))}`;
}

export async function getGoogleAccessToken(): Promise<string> {
  const clientEmail = Deno.env.get("GOOGLE_CLIENT_EMAIL");
  const privateKey = Deno.env.get("GOOGLE_PRIVATE_KEY");
  const scopes = Deno.env.get("GOOGLE_SERVICE_ACCOUNT_SCOPES") || DRIVE_SCOPE_DEFAULT;

  if (!clientEmail || !privateKey) {
    throw new Error("Missing GOOGLE_CLIENT_EMAIL or GOOGLE_PRIVATE_KEY env variables.");
  }

  const assertion = await createServiceAccountJwt(clientEmail, privateKey, scopes);
  const tokenBody = new URLSearchParams({
    grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
    assertion,
  });

  const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: tokenBody.toString(),
  });

  if (!tokenRes.ok) {
    const details = await tokenRes.text();
    throw new Error(`Failed to get Google access token (${tokenRes.status}): ${details}`);
  }

  const tokenJson = await tokenRes.json();
  if (!tokenJson?.access_token) {
    throw new Error("Google token response missing access_token.");
  }
  return tokenJson.access_token as string;
}

export function extractDriveFileId(rawInput: string): string | null {
  const input = rawInput.trim();
  if (!input) return null;

  const plainIdMatch = input.match(/^[a-zA-Z0-9_-]{20,}$/);
  if (plainIdMatch) return plainIdMatch[0];

  try {
    const url = new URL(input);
    const idFromQuery = url.searchParams.get("id");
    if (idFromQuery) return idFromQuery;

    const filePathMatch = url.pathname.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (filePathMatch?.[1]) return filePathMatch[1];

    const dPathMatch = url.pathname.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (dPathMatch?.[1]) return dPathMatch[1];
  } catch {
    return null;
  }

  return null;
}

export function isAudioDriveFile(mimeType: string | null, name: string): boolean {
  const mime = (mimeType || "").toLowerCase();
  if (mime.startsWith("audio/")) return true;
  if (mime === "application/octet-stream" || mime === "application/mp4") {
    return /\.(mp3|m4a|aac|wav|ogg|oga|flac|wma|aiff|opus)$/i.test(name);
  }
  return false;
}

export function deriveDurationLabel(metadata: DriveFileMetadata): { label: string | null; sec: number | null } {
  const raw = metadata.videoMediaMetadata?.durationMillis;
  if (!raw) return { label: null, sec: null };

  const totalSec = Math.floor(Number(raw) / 1000);
  if (!Number.isFinite(totalSec) || totalSec <= 0) return { label: null, sec: null };
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  if (min <= 0) return { label: `${sec}s`, sec: totalSec };
  if (sec === 0) return { label: `${min} min`, sec: totalSec };
  return { label: `${min}m ${sec}s`, sec: totalSec };
}

export async function fetchDriveMetadata(accessToken: string, fileId: string): Promise<DriveFileMetadata> {
  const fields = [
    "id",
    "name",
    "createdTime",
    "mimeType",
    "thumbnailLink",
    "size",
    "videoMediaMetadata(durationMillis)",
  ].join(",");
  const url = `https://www.googleapis.com/drive/v3/files/${fileId}?fields=${encodeURIComponent(fields)}&supportsAllDrives=true`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const details = await res.text();
    throw new Error(`Drive metadata request failed (${res.status}): ${details}`);
  }

  const json = await res.json();
  return {
    id: json.id,
    name: json.name,
    createdTime: json.createdTime ?? null,
    mimeType: json.mimeType ?? null,
    thumbnailLink: json.thumbnailLink ?? null,
    size: json.size ?? null,
    videoMediaMetadata: json.videoMediaMetadata,
  };
}

export function parseSizeBytes(raw: string | null | undefined): number | null {
  if (!raw) return null;
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.floor(n);
}
