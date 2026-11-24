import { describe, expect, it } from "vitest";
import {
  conversationDateFromPayload,
  extractCallDurationSecs,
  logosConversationFolderParts,
  logosUserFolderName,
  logosUserLabel,
  plainTranscriptFromTurns,
  resolveWebhookUserId,
  verifyElevenLabsSignature,
} from "../../supabase/functions/logos-post-call/helpers";

describe("logosPostCallHelpers", () => {
  it("builds compact Drive folder parts", () => {
    expect(logosUserLabel("humancatalystnote@gmail.com")).toBe("humancatalystnote");
    expect(logosUserLabel("Leo / A")).toBe("Leo");
    expect(logosUserFolderName("25d80046-d3f4-43f2-933a-ade961f20e28", "humancatalystnote@gmail.com")).toBe(
      "humancatalystnote_25d80046",
    );
    expect(logosUserFolderName("uid-1", "Leo / A")).toBe("Leo_uid1");
    const parts = logosConversationFolderParts({
      userId: "11111111-1111-1111-1111-111111111111",
      displayName: "Leo",
      date: "2026-11-18T12:00:00.000Z",
      conversationId: "conv_abc",
    });
    expect(parts).toEqual({
      userFolder: "Leo_11111111",
      year: "2026",
      date: "2026-11-18",
      conversationId: "conv_abc",
    });
  });

  it("reads ElevenLabs call duration from metadata", () => {
    expect(extractCallDurationSecs({ metadata: { call_duration_secs: 180 } })).toBe(180);
    expect(extractCallDurationSecs({ call_duration_secs: 67 })).toBe(67);
    expect(extractCallDurationSecs({ metadata: { call_duration_secs: 0 } })).toBe(null);
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
