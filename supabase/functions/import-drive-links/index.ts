import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const DRIVE_SCOPE_DEFAULT = "https://www.googleapis.com/auth/drive.readonly";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";

const LIBRARY_SCOPES = ["global_fr", "global_en", "perso"] as const;
type LibraryScope = (typeof LIBRARY_SCOPES)[number];

type ImportPayload = {
  links?: unknown;
  library_scope?: unknown;
  user_ids?: unknown;
};

type DriveFileMetadata = {
  id: string;
  name: string;
  createdTime: string | null;
  mimeType: string | null;
  thumbnailLink: string | null;
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

async function getGoogleAccessToken(): Promise<string> {
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

function extractDriveFileId(rawInput: string): string | null {
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

function toPreviewUrl(fileId: string): string {
  return `https://drive.google.com/file/d/${fileId}/preview`;
}

function deriveDurationLabel(metadata: DriveFileMetadata): string | null {
  const raw = metadata.videoMediaMetadata?.durationMillis;
  if (!raw) return null;

  const totalSec = Math.floor(Number(raw) / 1000);
  if (!Number.isFinite(totalSec) || totalSec <= 0) return null;
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  if (min <= 0) return `${sec}s`;
  if (sec === 0) return `${min} min`;
  return `${min}m ${sec}s`;
}

async function fetchDriveMetadata(accessToken: string, fileId: string): Promise<DriveFileMetadata> {
  const fields = [
    "id",
    "name",
    "createdTime",
    "mimeType",
    "thumbnailLink",
    "videoMediaMetadata(durationMillis)",
  ].join(",");
  const url = `https://www.googleapis.com/drive/v3/files/${fileId}?fields=${encodeURIComponent(fields)}`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const details = await res.text();
    throw new Error(`Drive metadata request failed (${res.status}): ${details}`);
  }

  return (await res.json()) as DriveFileMetadata;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    if (!supabaseUrl || !supabaseServiceKey || !anonKey) {
      throw new Error("Missing Supabase environment variables.");
    }

    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: caller } } = await callerClient.auth.getUser();
    if (!caller) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceKey);
    const { data: roleData } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", caller.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = (await req.json()) as ImportPayload;
    const inputLinks = Array.isArray(body?.links) ? body.links : [];
    const links = inputLinks
      .filter((value): value is string => typeof value === "string")
      .map((value) => value.trim())
      .filter(Boolean);

    let libraryScope: LibraryScope = "global_fr";
    if (typeof body.library_scope === "string" && (LIBRARY_SCOPES as readonly string[]).includes(body.library_scope)) {
      libraryScope = body.library_scope as LibraryScope;
    }

    const rawUserIds = Array.isArray(body.user_ids) ? body.user_ids : [];
    const requestedUserIds = [...new Set(
      rawUserIds.filter((value): value is string => typeof value === "string").map((id) => id.trim()).filter(Boolean),
    )];

    if (links.length === 0) {
      return new Response(JSON.stringify({ error: "Payload must include a non-empty links array." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (requestedUserIds.length === 0) {
      return new Response(JSON.stringify({ error: "Payload must include a non-empty user_ids array." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (libraryScope === "perso" && requestedUserIds.length !== 1) {
      return new Response(JSON.stringify({ error: "For library_scope 'perso', user_ids must contain exactly one user." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: validProfiles, error: validProfilesError } = await adminClient
      .from("profiles")
      .select("id")
      .in("id", requestedUserIds)
      .eq("is_disabled", false);

    if (validProfilesError) {
      throw new Error(`Failed to validate users: ${validProfilesError.message}`);
    }

    const targetUserIds = (validProfiles || []).map((p: { id: string }) => p.id);
    if (targetUserIds.length !== requestedUserIds.length) {
      return new Response(JSON.stringify({ error: "One or more user_ids are invalid or disabled." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const uniqueLinks = [...new Set(links)];
    const accessToken = await getGoogleAccessToken();

    const results: Array<{
      input: string;
      fileId: string | null;
      title: string | null;
      status: "created" | "duplicate" | "failed";
      createdAssignments: number;
      skippedDuplicates: number;
      error: string | null;
    }> = [];

    let createdAssignments = 0;
    let skippedDuplicates = 0;
    let failed = 0;
    let processedVideos = 0;

    for (const input of uniqueLinks) {
      const fileId = extractDriveFileId(input);
      if (!fileId) {
        failed += 1;
        results.push({
          input,
          fileId: null,
          title: null,
          status: "failed",
          createdAssignments: 0,
          skippedDuplicates: 0,
          error: "Could not extract Drive file ID from link.",
        });
        continue;
      }

      try {
        const metadata = await fetchDriveMetadata(accessToken, fileId);
        const mime = metadata.mimeType || "";
        if (!mime.startsWith("video/")) {
          throw new Error(`Drive file is not a video (mimeType: ${mime || "unknown"}).`);
        }

        processedVideos += 1;
        const previewUrl = toPreviewUrl(fileId);
        const duration = deriveDurationLabel(metadata);
        const description = `Imported from Google Drive (${metadata.createdTime || "unknown date"})`;
        const meta = {
          drive_mime_type: metadata.mimeType,
          drive_created_time: metadata.createdTime,
          drive_thumbnail_link: metadata.thumbnailLink,
          duration_label: duration,
        };

        const { data: existingVideo, error: findVideoError } = await adminClient
          .from("library_videos")
          .select("id")
          .eq("drive_file_id", fileId)
          .eq("library_scope", libraryScope)
          .maybeSingle();

        if (findVideoError) {
          throw new Error(`Could not look up library video: ${findVideoError.message}`);
        }

        let videoId: string;
        if (existingVideo?.id) {
          videoId = existingVideo.id as string;
        } else {
          const { data: insertedVideo, error: videoInsertError } = await adminClient
            .from("library_videos")
            .insert({
              title: metadata.name || "Untitled video",
              description,
              external_url: previewUrl,
              provider: "google_drive",
              drive_file_id: fileId,
              meta,
              library_scope: libraryScope,
              created_by: caller.id,
            } as any)
            .select("id")
            .single();

          if (videoInsertError || !insertedVideo) {
            throw new Error(videoInsertError?.message || "Failed to create library video row.");
          }
          videoId = (insertedVideo as { id: string }).id;
        }

        const { data: existingAssign, error: assignReadError } = await adminClient
          .from("library_video_assignments")
          .select("user_id")
          .eq("video_id", videoId);

        if (assignReadError) {
          throw new Error(`Could not read assignments: ${assignReadError.message}`);
        }

        const already = new Set((existingAssign || []).map((row: { user_id: string }) => row.user_id));
        const usersToAdd = targetUserIds.filter((id) => !already.has(id));
        const duplicateCountForLink = targetUserIds.length - usersToAdd.length;
        skippedDuplicates += duplicateCountForLink;

        if (usersToAdd.length === 0) {
          results.push({
            input,
            fileId,
            title: metadata.name || null,
            status: "duplicate",
            createdAssignments: 0,
            skippedDuplicates: duplicateCountForLink,
            error: null,
          });
          continue;
        }

        const assignRows = usersToAdd.map((userId) => ({
          video_id: videoId,
          user_id: userId,
          assigned_by: caller.id,
        }));

        const { error: assignInsertError } = await adminClient.from("library_video_assignments").insert(assignRows as any);
        if (assignInsertError) {
          throw new Error(`Assignment insert failed: ${assignInsertError.message}`);
        }

        createdAssignments += usersToAdd.length;
        results.push({
          input,
          fileId,
          title: metadata.name || null,
          status: "created",
          createdAssignments: usersToAdd.length,
          skippedDuplicates: duplicateCountForLink,
          error: null,
        });
      } catch (error) {
        failed += 1;
        results.push({
          input,
          fileId,
          title: null,
          status: "failed",
          createdAssignments: 0,
          skippedDuplicates: 0,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return new Response(
      JSON.stringify({
        summary: {
          receivedLinks: links.length,
          uniqueLinks: uniqueLinks.length,
          processedVideos,
          targetUsers: targetUserIds.length,
          createdAssignments,
          skippedDuplicates,
          failed,
        },
        results,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
