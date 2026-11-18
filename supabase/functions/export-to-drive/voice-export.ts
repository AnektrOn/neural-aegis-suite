export type VoiceFeedback = {
  id: string; user_id: string; prompt_id: string; category_slug: string; clicked_at: string;
  elevenlabs_conversation_id: string | null; duration_seconds: number | null; transcript: string | null;
};

export function completedVoiceFeedback(row: VoiceFeedback): boolean {
  return row.duration_seconds !== null && Boolean(row.transcript?.trim());
}

export function voiceFeedbackDocument(row: VoiceFeedback) {
  if (!completedVoiceFeedback(row)) throw new Error("Voice feedback is not complete");
  return {
    date: row.clicked_at.slice(0, 10),
    filename: `${row.clicked_at.slice(0, 10)}_voice_${row.id}.md`,
    content: `# Session vocale — ${row.category_slug}\n\nUtilisateur : ${row.user_id}\nDate : ${row.clicked_at}\nPrompt : ${row.prompt_id}\nConversation ElevenLabs : ${row.elevenlabs_conversation_id ?? "Non disponible"}\nDurée : ${row.duration_seconds} secondes\n\n## Transcript\n\n${row.transcript}\n`,
  };
}