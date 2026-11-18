import { describe, expect, it } from "vitest";
import { buildLogosTranscript, hasUserTimings } from "../../supabase/functions/export-to-drive/logos-transcript";

const base = { action: "export_logos_transcript", user_id: "25d80046-d3f4-43f2-933a-ade961f20e28", elevenlabs_conversation_id: "conv_test", date: "2026-11-18" };
describe("LOGOS post-call export contract", () => {
  it("writes TXT without user timing data", () => {
    expect(buildLogosTranscript({ ...base, transcript_text: "Bonjour" })).toMatchObject({ format: "txt", filename: "2026-11-18_conv_test_transcript.txt", content: "Bonjour" });
  });
  it("preserves the full payload when user hesitation timings exist", () => {
    const payload = { transcript: [{ role: "user", message: "Oui", time_in_call_secs: 2.4 }], metadata: { duration: 12 }, custom: { keep: true } };
    const doc = buildLogosTranscript({ ...base, transcript_payload: payload });
    expect(doc.format).toBe("json"); expect(JSON.parse(doc.content)).toEqual(payload);
  });
  it("recognizes explicit hesitations and word timings but not agent-only timestamps", () => {
    expect(hasUserTimings({ user_hesitation_timings: [{ seconds: 2 }] })).toBe(true);
    expect(hasUserTimings({ transcript: [{ role: "user", words: [{ start: 0.5 }] }] })).toBe(true);
    expect(hasUserTimings({ transcript: [{ role: "agent", time_in_call_secs: 2 }] })).toBe(false);
  });
  it("rejects traversal IDs, impossible dates and empty transcripts", () => {
    expect(() => buildLogosTranscript({ ...base, elevenlabs_conversation_id: "../escape", transcript_text: "ok" })).toThrow();
    expect(() => buildLogosTranscript({ ...base, date: "2026-02-31", transcript_text: "ok" })).toThrow();
    expect(() => buildLogosTranscript(base)).toThrow();
  });
  it("derives plain text from untimed ElevenLabs turns", () => {
    expect(buildLogosTranscript({ ...base, transcript_payload: { transcript: [{ role: "user", message: "Bonjour" }] } }).content).toBe("Utilisateur : Bonjour");
  });
});