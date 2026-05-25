import { supabase } from "@/integrations/supabase/client";
import type { Locale } from "@/i18n/translations";
import type {
  RunePrincipleCode,
  RuneProgress,
  SwipeAction,
  SwipeResult,
  PulseCard,
  PulseCourseContent,
  PulseCourse,
  PulseCourseSection,
  CourseSectionType,
} from "../domain/types";

type RpcOk<T> = { ok: true } & T;
type RpcErr = { ok: false; error?: string };

interface RawDeckCard {
  id: string;
  external_key?: string | null;
  course_id?: string | null;
  principle_code: string;
  principle_name: string;
  principle_quote: string;
  principle_bg_class: string;
  principle_text_class: string;
  pulses_to_unlock: number;
  time_label: string;
  title: string;
  problem: string;
  bullets: unknown;
  format: string;
  course_content: PulseCourseContent;
  swiped_at?: string;
}

interface RawRuneProgress {
  principle_code: string;
  principle_name: string;
  pulses_to_unlock: number;
  pulses_count: number;
  is_unlocked: boolean;
  unlocked_at: string | null;
}

function asPrincipleCode(code: string): RunePrincipleCode {
  return code as RunePrincipleCode;
}

function parseBullets(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((b): b is string => typeof b === "string");
}

function mapCard(row: RawDeckCard): PulseCard {
  return {
    id: row.id,
    externalKey: row.external_key ?? null,
    courseId: row.course_id ?? null,
    principleCode: asPrincipleCode(row.principle_code),
    principleName: row.principle_name,
    principleQuote: row.principle_quote,
    principleBgClass: row.principle_bg_class,
    principleTextClass: row.principle_text_class,
    pulsesToUnlock: row.pulses_to_unlock,
    timeLabel: row.time_label,
    title: row.title,
    problem: row.problem,
    bullets: parseBullets(row.bullets),
    format: row.format,
    courseContent: row.course_content ?? {},
    swipedAt: row.swiped_at,
  };
}

function mapRune(row: RawRuneProgress): RuneProgress {
  return {
    principleCode: asPrincipleCode(row.principle_code),
    principleName: row.principle_name,
    pulsesToUnlock: row.pulses_to_unlock,
    pulsesCount: row.pulses_count,
    isUnlocked: row.is_unlocked,
    unlockedAt: row.unlocked_at,
  };
}

export async function fetchPulseDeck(
  locale: Locale,
  limit = 15,
): Promise<{ ok: true; cards: PulseCard[] } | { ok: false; error: string }> {
  try {
    const { data, error } = await supabase.rpc("get_aegis_synapse_deck" as never, {
      p_locale: locale,
      p_limit: limit,
    } as never);

    if (error) {
      console.error("get_aegis_synapse_deck:", error.message);
      return { ok: false, error: error.message };
    }

    const result = data as (RpcOk<{ cards: RawDeckCard[] }> | RpcErr) | null;
    if (!result?.ok) {
      return { ok: false, error: result?.error ?? "unknown" };
    }

    const cards = (result.cards ?? []).map(mapCard);
    return { ok: true, cards };
  } catch (err) {
    console.error("fetchPulseDeck:", err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : "unknown",
    };
  }
}

export async function recordPulseSwipe(
  cardId: string,
  action: SwipeAction,
): Promise<SwipeResult | { ok: false; error: string }> {
  try {
    const { data, error } = await supabase.rpc("record_aegis_synapse_swipe" as never, {
      p_card_id: cardId,
      p_action: action,
    } as never);

    if (error) {
      console.error("record_aegis_synapse_swipe:", error.message);
      return { ok: false, error: error.message };
    }

    const result = data as
      | (RpcOk<{
          action: string;
          principle_code: string | null;
          new_pulse_count: number | null;
          rune_unlocked: boolean;
        }>
      | RpcErr)
      | null;

    if (!result?.ok) {
      return { ok: false, error: result?.error ?? "unknown" };
    }

    return {
      ok: true,
      action: result.action as SwipeAction,
      principleCode: result.principle_code
        ? asPrincipleCode(result.principle_code)
        : null,
      newPulseCount: result.new_pulse_count ?? null,
      runeUnlocked: Boolean(result.rune_unlocked),
    };
  } catch (err) {
    console.error("recordPulseSwipe:", err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : "unknown",
    };
  }
}

export async function fetchPulseCourse(
  courseId: string,
  locale: Locale,
): Promise<{ ok: true; course: PulseCourse } | { ok: false; error: string }> {
  try {
    const { data, error } = await supabase.rpc("get_pulse_course" as never, {
      p_course_id: courseId,
      p_locale: locale,
    } as never);

    if (error) {
      console.error("get_pulse_course:", error.message);
      return { ok: false, error: error.message };
    }

    const result = data as
      | {
          ok: true;
          course: {
            id: string;
            external_key: string | null;
            principle_code: string | null;
            principle_name: string | null;
            title: string;
            description: string;
            difficulty: string;
            estimated_minutes: number;
          };
          sections: {
            id: string;
            section_type: string;
            content: string;
            sort_order: number;
          }[];
          progress: {
            started_at: string | null;
            completed_at: string | null;
            last_section_idx: number;
          };
        }
      | { ok: false; error?: string }
      | null;

    if (!result?.ok) {
      return { ok: false, error: (result as { error?: string })?.error ?? "unknown" };
    }

    const course: PulseCourse = {
      id: result.course.id,
      externalKey: result.course.external_key,
      principleCode: result.course.principle_code
        ? asPrincipleCode(result.course.principle_code)
        : null,
      principleName: result.course.principle_name,
      title: result.course.title,
      description: result.course.description,
      difficulty: result.course.difficulty,
      estimatedMinutes: result.course.estimated_minutes,
      sections: (result.sections ?? []).map((s) => ({
        id: s.id,
        sectionType: s.section_type as CourseSectionType,
        content: s.content,
        sortOrder: s.sort_order,
      })),
      progress: {
        startedAt: result.progress?.started_at ?? null,
        completedAt: result.progress?.completed_at ?? null,
        lastSectionIdx: result.progress?.last_section_idx ?? 0,
      },
    };

    return { ok: true, course };
  } catch (err) {
    console.error("fetchPulseCourse:", err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : "unknown",
    };
  }
}

export async function completePulseCourse(
  courseId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const { data, error } = await supabase.rpc("complete_pulse_course" as never, {
      p_course_id: courseId,
    } as never);

    if (error) {
      console.error("complete_pulse_course:", error.message);
      return { ok: false, error: error.message };
    }

    const result = data as { ok: boolean; error?: string } | null;
    if (!result?.ok) {
      return { ok: false, error: result?.error ?? "unknown" };
    }

    return { ok: true };
  } catch (err) {
    console.error("completePulseCourse:", err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : "unknown",
    };
  }
}

export async function recyclePulseIgnored(): Promise<
  { ok: true; recycled: number } | { ok: false; error: string }
> {
  try {
    const { data, error } = await supabase.rpc("recycle_pulse_ignored" as never);

    if (error) {
      console.error("recycle_pulse_ignored:", error.message);
      return { ok: false, error: error.message };
    }

    const result = data as { ok: boolean; recycled?: number; error?: string } | null;
    if (!result?.ok) {
      return { ok: false, error: result?.error ?? "unknown" };
    }

    return { ok: true, recycled: result.recycled ?? 0 };
  } catch (err) {
    console.error("recyclePulseIgnored:", err);
    return { ok: false, error: err instanceof Error ? err.message : "unknown" };
  }
}

export interface PulseDiagnostic {
  userId: string | null;
  total: number;
  active: number;
  forYou: number;
  swiped: number;
  rpcCards: number;
  rpcError: string | null;
  sampleKeys: string[];
}

export async function fetchPulseDiagnostic(): Promise<PulseDiagnostic> {
  try {
    const { data: authData } = await supabase.auth.getUser();
    const userId = authData.user?.id ?? null;

    const { data: allCards } = await supabase
      .from("aegis_synapse_cards" as never)
      .select("id, external_key, is_active, target_user_ids, archetype_targets" as never);

    const rows = (allCards as {
      id: string;
      external_key: string | null;
      is_active: boolean;
      target_user_ids: string[] | null;
      archetype_targets: string[] | null;
    }[]) ?? [];

    const total = rows.length;
    const active = rows.filter((c) => c.is_active).length;

    let forYou = 0;
    const sampleKeys: string[] = [];
    if (userId) {
      for (const c of rows) {
        if (!c.is_active) continue;
        const targets = c.target_user_ids ?? [];
        const visible =
          targets.length === 0
            ? true
            : targets.includes(userId);
        if (visible) {
          forYou++;
          if (c.external_key) sampleKeys.push(c.external_key);
        }
      }
    }

    let swiped = 0;
    if (userId) {
      const { count } = await supabase
        .from("aegis_user_card_interactions" as never)
        .select("id" as never, { count: "exact", head: true })
        .eq("user_id" as never, userId as never);
      swiped = count ?? 0;
    }

    let rpcError: string | null = null;
    let rpcCards = 0;
    const { data, error } = await supabase.rpc("get_aegis_synapse_deck" as never, {
      p_locale: "fr",
      p_limit: 15,
    } as never);
    if (error) {
      rpcError = error.message;
    } else {
      const result = data as { ok: boolean; error?: string; cards?: unknown[] } | null;
      if (result && !result.ok) {
        rpcError = result.error ?? "RPC returned ok:false";
      } else {
        rpcCards = result?.cards?.length ?? 0;
      }
    }

    return { userId, total, active, forYou, swiped, rpcCards, rpcError, sampleKeys };
  } catch {
    return {
      userId: null,
      total: 0,
      active: 0,
      forYou: 0,
      swiped: 0,
      rpcCards: 0,
      rpcError: null,
      sampleKeys: [],
    };
  }
}

export async function fetchPulseGrimoire(
  locale: Locale,
): Promise<
  | { ok: true; library: PulseCard[]; runes: RuneProgress[] }
  | { ok: false; error: string }
> {
  try {
    const { data, error } = await supabase.rpc("get_aegis_synapse_grimoire" as never, {
      p_locale: locale,
    } as never);

    if (error) {
      console.error("get_aegis_synapse_grimoire:", error.message);
      return { ok: false, error: error.message };
    }

    const result = data as
      | (RpcOk<{ library: RawDeckCard[]; runes: RawRuneProgress[] }> | RpcErr)
      | null;

    if (!result?.ok) {
      return { ok: false, error: result?.error ?? "unknown" };
    }

    return {
      ok: true,
      library: (result.library ?? []).map(mapCard),
      runes: (result.runes ?? []).map(mapRune),
    };
  } catch (err) {
    console.error("fetchPulseGrimoire:", err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : "unknown",
    };
  }
}
