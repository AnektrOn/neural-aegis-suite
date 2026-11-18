import { supabase } from "@/integrations/supabase/client";

export type VoiceFeedbackContext = { promptId: string; category: string };

/** Serializes SDK callbacks so an early message/disconnect cannot race the insert. */
export class VoiceFeedbackRecorder {
  private pending: Promise<void> = Promise.resolve();
  private id: string | null = null;
  private startedAt = 0;
  private messages = new Map<string, string>();
  private conversationId: string | null = null;

  constructor(private userId: string, private reportError: (error: unknown) => void) {}

  begin(context?: VoiceFeedbackContext) {
    this.startedAt = Date.now();
    this.messages.clear();
    this.conversationId = null;
    this.id = crypto.randomUUID();
    const id = this.id;
    this.enqueue(async () => {
      const { error } = await supabase.from("voice_session_feedbacks").insert({
        id, user_id: this.userId, prompt_id: context?.promptId ?? "open",
        category_slug: context?.category ?? "open",
      });
      if (error) throw error;
    });
  }

  connect(conversationId: string) { this.conversationId = conversationId; this.save(false); }
  message(event: { event_id: number; source: string; message: string }) {
    if (!this.id || !event.message.trim()) return;
    this.messages.set(`${event.source}:${event.event_id}`, `${event.source === "user" ? "Utilisateur" : "LOGOS"} : ${event.message}`);
    this.save(false);
  }
  finish() { this.save(true); }
  flush() { return this.pending; }

  private save(completed: boolean) {
    const id = this.id;
    if (!id) return;
    const transcript = [...this.messages.values()].join("\n\n");
    const payload = {
      elevenlabs_conversation_id: this.conversationId,
      transcript: transcript || null,
      ...(completed ? { duration_seconds: Math.max(0, Math.round((Date.now() - this.startedAt) / 1000)) } : {}),
      exported_to_drive: false,
    };
    if (completed) this.id = null;
    this.enqueue(async () => {
      const { error } = await supabase.from("voice_session_feedbacks").update(payload).eq("id", id).eq("user_id", this.userId);
      if (error) throw error;
      if (completed && transcript) {
        const { error: exportError } = await supabase.functions.invoke("export-to-drive", { body: { action: "export_voice", user_id: this.userId } });
        if (exportError) throw exportError;
      }
    });
  }

  private enqueue(task: () => Promise<void>) {
    this.pending = this.pending.then(task).catch(this.reportError);
  }
}