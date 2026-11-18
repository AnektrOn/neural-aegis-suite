export type LogosTranscriptBody = {
  action: "export_logos_transcript";
  user_id: string;
  elevenlabs_conversation_id: string;
  date: string;
  transcript_text?: string;
  transcript_payload?: Record<string, unknown>;
};

// Keep this contract explicit: mere agent timestamps do not imply user hesitations.
export function hasUserTimings(payload: Record<string, unknown>): boolean {
  if (Array.isArray(payload.user_hesitation_timings) && payload.user_hesitation_timings.length > 0) return true;
  const turns = Array.isArray(payload.transcript) ? payload.transcript : [];
  return turns.some(turn => {
    if (!turn || typeof turn !== "object") return false;
    const row = turn as Record<string, unknown>;
    if (row.role !== "user" && row.source !== "user") return false;
    return typeof row.time_in_call_secs === "number" ||
      (Array.isArray(row.words) && row.words.some(word => word && typeof word === "object" && typeof (word as Record<string, unknown>).start === "number")) ||
      (Array.isArray(row.hesitation_timings) && row.hesitation_timings.length > 0);
  });
}

export function buildLogosTranscript(body: unknown) {
  if (!body || typeof body !== "object") throw new Error("JSON object required");
  const b = body as LogosTranscriptBody;
  if (b.action !== "export_logos_transcript" || typeof b.user_id !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(b.user_id)) throw new Error("Valid user_id required");
  if (typeof b.elevenlabs_conversation_id !== "string" || !/^[a-zA-Z0-9_-]{1,160}$/.test(b.elevenlabs_conversation_id)) throw new Error("Invalid elevenlabs_conversation_id");
  if (typeof b.date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(b.date) || !Number.isFinite(Date.parse(b.date)) || new Date(b.date).toISOString().slice(0, 10) !== b.date) throw new Error("Valid date YYYY-MM-DD required");
  const payload = b.transcript_payload;
  if (payload !== undefined && (!payload || typeof payload !== "object" || Array.isArray(payload))) throw new Error("transcript_payload must be a JSON object");
  const format = payload && hasUserTimings(payload) ? "json" : "txt";
  let content: string;
  if (format === "json") content = JSON.stringify(payload, null, 2);
  else if (typeof b.transcript_text === "string" && b.transcript_text.trim()) content = b.transcript_text;
  else {
    const turns = payload && Array.isArray(payload.transcript) ? payload.transcript : [];
    content = turns.map(turn => {
      if (!turn || typeof turn !== "object") return "";
      const row = turn as Record<string, unknown>;
      const text = typeof row.message === "string" ? row.message : typeof row.text === "string" ? row.text : "";
      return text ? `${row.role === "user" || row.source === "user" ? "Utilisateur" : "LOGOS"} : ${text}` : "";
    }).filter(Boolean).join("\n\n");
  }
  if (!content.trim()) throw new Error("Nonempty transcript required");
  if (new TextEncoder().encode(content).length > 5 * 1024 * 1024) throw new Error("Transcript exceeds 5 MB");
  return { ...b, content, format, mimeType: format === "json" ? "application/json" : "text/plain", filename: `${b.date}_${b.elevenlabs_conversation_id}_transcript.${format}` };
}