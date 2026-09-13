import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  deriveDurationLabel,
  extractDriveFileId,
  fetchDriveMetadata,
  getGoogleAccessToken,
  isAudioDriveFile,
  parseSizeBytes,
} from "../_shared/google-drive.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LIBRARY_SCOPES = ["global_fr", "global_en", "perso"] as const;
type LibraryScope = (typeof LIBRARY_SCOPES)[number];

type ImportPayload = {
  links?: unknown;
  library_scope?: unknown;
  user_ids?: unknown;
};

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
    let processedTracks = 0;

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
        if (!isAudioDriveFile(metadata.mimeType, metadata.name || "")) {
          throw new Error(`Drive file is not audio (mimeType: ${metadata.mimeType || "unknown"}).`);
        }

        processedTracks += 1;
        const duration = deriveDurationLabel(metadata);
        const description = `Imported from Google Drive (${metadata.createdTime || "unknown date"})`;
        const meta = {
          drive_mime_type: metadata.mimeType,
          drive_created_time: metadata.createdTime,
          drive_thumbnail_link: metadata.thumbnailLink,
          duration_label: duration.label,
        };

        const { data: existingTrack, error: findTrackError } = await adminClient
          .from("meditation_tracks")
          .select("id")
          .eq("drive_file_id", fileId)
          .eq("library_scope", libraryScope)
          .maybeSingle();

        if (findTrackError) {
          throw new Error(`Could not look up meditation track: ${findTrackError.message}`);
        }

        let trackId: string;
        if (existingTrack?.id) {
          trackId = existingTrack.id as string;
        } else {
          const { data: insertedTrack, error: trackInsertError } = await adminClient
            .from("meditation_tracks")
            .insert({
              title: metadata.name || "Untitled audio",
              description,
              drive_file_id: fileId,
              mime_type: metadata.mimeType,
              size_bytes: parseSizeBytes(metadata.size),
              duration_sec: duration.sec,
              duration_label: duration.label,
              meta,
              library_scope: libraryScope,
              created_by: caller.id,
            })
            .select("id")
            .single();

          if (trackInsertError || !insertedTrack) {
            throw new Error(trackInsertError?.message || "Failed to create meditation track row.");
          }
          trackId = (insertedTrack as { id: string }).id;
        }

        const { data: existingAssign, error: assignReadError } = await adminClient
          .from("meditation_assignments")
          .select("user_id")
          .eq("track_id", trackId);

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
          track_id: trackId,
          user_id: userId,
          assigned_by: caller.id,
        }));

        const { error: assignInsertError } = await adminClient.from("meditation_assignments").insert(assignRows);
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
          processedTracks,
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
