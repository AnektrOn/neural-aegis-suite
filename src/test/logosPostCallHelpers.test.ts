import { describe, expect, it } from "vitest";
import {
  conversationDateFromPayload,
  logosConversationFolderParts,
  logosUserFolderName,
  plainTranscriptFromTurns,
  resolveWebhookUserId,
  verifyElevenLabsSignature,
} from "../../supabase/functions/logos-post-call/helpers";

describe("logosPostCallHelpers", () => {
  it("builds stable Drive folder parts", () => {
    expect(logosUserFolderName("uid-1", "Leo / A")).toBe("uid-1_Leo _ A");
    const parts = logosConversationFolderParts({
      userId: "11111111-1111-1111-1111-111111111111",
      displayName: "Leo",
      date: "2026-11-18T12:00:00.000Z",
      conversationId: "conv_abc",
    });
    expect(parts).toEqual({
      userFolder: "11111111-1111-1111-1111-111111111111_Leo",
      year: "2026",
      date: "2026-11-18",
      conversationId: "conv_abc",
    });
  });

  it("formats plain transcript and date", () => {
    expect(
      plainTranscriptFromTurns([
        { role: "agent", message: "Salut" },
        { role: "user", message: "Go" },
      ]),
    ).toBe("LOGOS : Salut\n\nUtilisateur : Go");
    expect(
      conversationDateFromPayload({ metadata: { start_time_unix_secs: 1700000000 } }),
    ).toBe("2023-11-14");
  });

  it("resolves user id from webhook payload", () => {
    expect(
      resolveWebhookUserId({
        user_id: null,
        conversation_initiation_client_data: {
          dynamic_variables: { aegis_user_id: "22222222-2222-2222-2222-222222222222" },
        },
      }),
    ).toBe("22222222-2222-2222-2222-222222222222");
  });

  it("verifies ElevenLabs HMAC signature", async () => {
    const secret = "test_webhook_secret";
    const rawBody = JSON.stringify({ type: "post_call_transcription", data: {} });
    const timestamp = Math.floor(Date.now() / 1000);
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );
    const mac = await crypto.subtle.sign(
      "HMAC",
      key,
      new TextEncoder().encode(`${timestamp}.${rawBody}`),
    );
    const hex = [...new Uint8Array(mac)].map((b) => b.toString(16).padStart(2, "0")).join("");
    const header = `t=${timestamp},v0=${hex}`;
    await expect(verifyElevenLabsSignature(rawBody, header, secret)).resolves.toBe(true);
    await expect(verifyElevenLabsSignature(rawBody, header, "wrong")).resolves.toBe(false);
  });
});
