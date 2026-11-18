import { describe, expect, it, vi, beforeEach } from "vitest";
import { completedVoiceFeedback, voiceFeedbackDocument } from "../../supabase/functions/export-to-drive/voice-export";
import { USER_EXPORT_TABLES, categoryForTable } from "../../supabase/functions/export-to-drive/full-export";
import { dailyVoicePaths } from "../features/logos/dailyVoicePaths";
import { VoiceFeedbackRecorder } from "../features/logos/voiceFeedbackService";

const mocks = vi.hoisted(() => ({ insert: vi.fn(), update: vi.fn(), invoke: vi.fn(), writes: [] as Record<string, unknown>[] }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: {
  from: () => ({ insert: mocks.insert, update: mocks.update }), functions: { invoke: mocks.invoke },
} }));

const feedback = { id: "session-1", user_id: "note", prompt_id: "batch:1", category_slug: "cap_decision", clicked_at: "2026-11-18T03:20:00Z", elevenlabs_conversation_id: "conv-1", duration_seconds: 12, transcript: "Utilisateur : Bonjour" };

describe("voice Drive connection", () => {
  beforeEach(() => {
    vi.clearAllMocks(); mocks.writes.length = 0;
    mocks.insert.mockResolvedValue({ error: null });
    mocks.invoke.mockResolvedValue({ error: null });
    mocks.update.mockImplementation((payload) => {
      mocks.writes.push(payload);
      return { eq: () => ({ eq: async () => ({ error: null }) }) };
    });
  });
  it("routes both private voice tables into Voice", () => {
    for (const table of ["daily_voice_prompts", "voice_session_feedbacks"]) {
      expect(USER_EXPORT_TABLES).toContain(table); expect(categoryForTable(table)).toBe("Voice");
    }
  });
  it("exports only completed sessions with a transcript", () => {
    expect(completedVoiceFeedback(feedback)).toBe(true);
    expect(completedVoiceFeedback({ ...feedback, duration_seconds: null })).toBe(false);
    expect(completedVoiceFeedback({ ...feedback, transcript: " " })).toBe(false);
  });
  it("uses stable filenames and retains prompt and conversation references", () => {
    const doc = voiceFeedbackDocument(feedback);
    expect(doc.filename).toBe("2026-11-18_voice_session-1.md");
    expect(doc.content).toContain("batch:1"); expect(doc.content).toContain("conv-1");
    expect(voiceFeedbackDocument({ ...feedback, transcript: "Updated" }).filename).toBe(doc.filename);
  });
  it("reads the real Drive v3 prompt fields without confusing mandate and greeting", () => {
    const paths = dailyVoicePaths([{ id: "batch", date: "2026-11-18", synced_at: "2026-11-18T03:20:00Z", prompts: { prompts: [{ slot_index: 1, category_slug: "cap_decision", title: "Agenda", agent_mandate: "Stratège", first_message_agent: "Bonjour Note" }] } }]);
    expect(paths[0]).toMatchObject({ id: "batch:1", openingPrompt: "Stratège", firstMessage: "Bonjour Note", category: "cap_decision" });
  });
  it("serializes early SDK callbacks and exports once after completion", async () => {
    const recorder = new VoiceFeedbackRecorder("note", (error) => { throw error; });
    recorder.begin({ promptId: "batch:1", category: "cap_decision" });
    recorder.connect("conv-1");
    recorder.message({ event_id: 1, source: "user", message: "Bonjour" });
    recorder.message({ event_id: 1, source: "user", message: "Bonjour corrigé" });
    recorder.finish(); recorder.finish(); await recorder.flush();
    expect(mocks.insert).toHaveBeenCalledOnce();
    expect(mocks.writes.at(-1)).toMatchObject({ transcript: "Utilisateur : Bonjour corrigé", elevenlabs_conversation_id: "conv-1", duration_seconds: 0 });
    expect(mocks.invoke).toHaveBeenCalledOnce();
    expect(mocks.invoke).toHaveBeenCalledWith("export-to-drive", { body: { action: "export_voice", user_id: "note" } });
  });
});