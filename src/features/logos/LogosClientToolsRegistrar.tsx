import { useConversationClientTool } from "@elevenlabs/react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { fetchLogosActionableCatalog } from "./logosActionableCatalog";
import { useLogosToolHost } from "./LogosToolHostContext";
import {
  logosWriteDecision,
  logosWriteJournalEntry,
  logosWriteMoodEntry,
  logosWriteRelationNote,
} from "./logosWrites";
import { recordPulseSwipe } from "@/features/aegis-pulse/services/pulseService";

function asString(v: unknown): string | undefined {
  return typeof v === "string" && v.trim() ? v.trim() : undefined;
}

function asNumber(v: unknown): number | undefined {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim()) {
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
  }
  return undefined;
}

/** Registers LOGOS client tools (must render inside ConversationProvider + LogosToolHostProvider). */
export function LogosClientToolsRegistrar() {
  const { user } = useAuth();
  const { locale } = useLanguage();
  const host = useLogosToolHost();
  const userId = user?.id;

  useConversationClientTool("list_actionable_content", async (params) => {
    if (!userId) return "error:not_authenticated";
    const intent = asString(params.intent);
    const limit = asNumber(params.limit) ?? 5;
    const catalog = await fetchLogosActionableCatalog(userId, locale, limit);
    return JSON.stringify({ intent: intent ?? null, ...catalog });
  });

  useConversationClientTool("propose_actionable_choices", async (params) => {
    if (!userId) return "error:not_authenticated";
    const limit = asNumber(params.limit) ?? 3;
    return host.proposeActionableChoicesAndWait(userId, locale, limit);
  });

  useConversationClientTool("open_toolbox_item", async (params) => {
    if (!userId) return "error:not_authenticated";
    const assignmentId = asString(params.assignment_id);
    const slug = asString(params.slug);
    return host.openToolboxAndWait(userId, assignmentId, slug);
  });

  useConversationClientTool("propose_pulse_card", async (params) => {
    const cardId = asString(params.card_id);
    return host.proposePulseAndWait(locale, cardId);
  });

  useConversationClientTool("record_pulse_swipe", async (params) => {
    const cardId = asString(params.card_id);
    const action = asString(params.action);
    if (!cardId || (action !== "assimilated" && action !== "ignored")) {
      return "error:invalid_params";
    }
    const res = await recordPulseSwipe(cardId, action);
    if (!("ok" in res) || res.ok === false) {
      return `error:${"error" in res ? res.error : "swipe_failed"}`;
    }
    return "ok";
  });

  useConversationClientTool("open_quick_log", async () => host.openQuickLogAndWait());

  useConversationClientTool("open_people_checkin", async (params) => {
    if (!userId) return "error:not_authenticated";
    return host.openPeopleCheckinAndWait(
      userId,
      asString(params.contact_id),
      asString(params.contact_name),
    );
  });

  useConversationClientTool("open_decision_capture", async () => host.openDecisionCaptureAndWait());

  useConversationClientTool("write_decision", async (params) => {
    if (!userId) return "error:not_authenticated";
    const name = asString(params.name);
    if (!name) return "error:name_required";
    const res = await logosWriteDecision(userId, {
      name,
      priority: asNumber(params.priority),
      responsibility: asNumber(params.responsibility),
    });
    return res.ok ? "ok" : `error:${res.error}`;
  });

  useConversationClientTool("write_journal_entry", async (params) => {
    if (!userId) return "error:not_authenticated";
    const title = asString(params.title);
    const content = asString(params.content);
    const tagsRaw = params.tags;
    let tags: string[] | undefined;
    if (Array.isArray(tagsRaw)) {
      tags = tagsRaw.filter((t): t is string => typeof t === "string");
    } else if (typeof tagsRaw === "string" && tagsRaw.trim()) {
      tags = tagsRaw.split(",").map((t) => t.trim()).filter(Boolean);
    }
    if (!title || !content) return "error:title_and_content_required";
    const res = await logosWriteJournalEntry(userId, { title, content, tags });
    return res.ok ? "ok" : `error:${res.error}`;
  });

  useConversationClientTool("write_mood_entry", async (params) => {
    if (!userId) return "error:not_authenticated";
    const value = asNumber(params.value);
    if (value === undefined) return "error:value_required";
    const res = await logosWriteMoodEntry(userId, {
      value,
      sleep: asNumber(params.sleep),
      stress: asNumber(params.stress),
    });
    return res.ok ? "ok" : `error:${res.error}`;
  });

  useConversationClientTool("write_relation_note", async (params) => {
    if (!userId) return "error:not_authenticated";
    const res = await logosWriteRelationNote(userId, {
      contact_id: asString(params.contact_id),
      contact_name: asString(params.contact_name),
      quality: asNumber(params.quality),
      note: asString(params.note),
    });
    return res.ok ? "ok" : `error:${res.error}`;
  });

  return null;
}
