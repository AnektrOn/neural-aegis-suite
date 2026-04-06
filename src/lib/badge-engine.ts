// MIGRATION REQUIRED:
// ALTER TABLE profiles ADD COLUMN IF NOT EXISTS
//   last_badge_check timestamptz;

import { supabase } from "@/integrations/supabase/client";

interface BadgeDefinition {
  type: string;
  name: string;
  description: string;
  check: (userId: string) => Promise<boolean>;
}

const BADGE_DEFINITIONS: BadgeDefinition[] = [
  {
    type: "streak",
    name: "Flamme de 7 jours",
    description: "7 jours consécutifs de log d'humeur",
    check: async (userId) => {
      const { data } = await supabase
        .from("mood_entries" as any)
        .select("logged_at")
        .eq("user_id", userId)
        .order("logged_at", { ascending: false })
        .limit(30);
      const dates = [
        ...new Set(
          (data as any[] || []).map((d: any) =>
            new Date(d.logged_at).toISOString().split("T")[0]
          )
        ),
      ].sort().reverse();
      let streak = 0;
      const today = new Date();
      for (let i = 0; i < dates.length; i++) {
        const expected = new Date(today);
        expected.setDate(today.getDate() - i);
        if (dates[i] === expected.toISOString().split("T")[0]) streak++;
        else break;
      }
      return streak >= 7;
    },
  },
  {
    type: "streak",
    name: "Flamme de 30 jours",
    description: "30 jours consécutifs de log d'humeur",
    check: async (userId) => {
      const { data } = await supabase
        .from("mood_entries" as any)
        .select("logged_at")
        .eq("user_id", userId)
        .order("logged_at", { ascending: false })
        .limit(60);
      const dates = [
        ...new Set(
          (data as any[] || []).map((d: any) =>
            new Date(d.logged_at).toISOString().split("T")[0]
          )
        ),
      ].sort().reverse();
      let streak = 0;
      const today = new Date();
      for (let i = 0; i < dates.length; i++) {
        const expected = new Date(today);
        expected.setDate(today.getDate() - i);
        if (dates[i] === expected.toISOString().split("T")[0]) streak++;
        else break;
      }
      return streak >= 30;
    },
  },
  {
    type: "mood",
    name: "Observateur Émotionnel",
    description: "50 entrées d'humeur enregistrées",
    check: async (userId) => {
      const { count } = await supabase
        .from("mood_entries" as any)
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId);
      return (count || 0) >= 50;
    },
  },
  {
    type: "journal",
    name: "Scribe Intérieur",
    description: "20 entrées de journal",
    check: async (userId) => {
      const { count } = await supabase
        .from("journal_entries")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId);
      return (count || 0) >= 20;
    },
  },
  {
    type: "decision",
    name: "Décideur Souverain",
    description: "10 décisions prises",
    check: async (userId) => {
      const { count } = await supabase
        .from("decisions")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("status", "decided");
      return (count || 0) >= 10;
    },
  },
  {
    type: "habit",
    name: "Maître des Habitudes",
    description: "100 habitudes complétées",
    check: async (userId) => {
      const { count } = await supabase
        .from("habit_completions")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId);
      return (count || 0) >= 100;
    },
  },
  {
    type: "network",
    name: "Connecteur",
    description: "15 contacts ajoutés",
    check: async (userId) => {
      const { count } = await supabase
        .from("people_contacts")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId);
      return (count || 0) >= 15;
    },
  },
  {
    type: "first_steps",
    name: "Premier Pas",
    description: "Premier log d'humeur enregistré",
    check: async (userId) => {
      const { count } = await supabase
        .from("mood_entries" as any)
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId);
      return (count || 0) >= 1;
    },
  },
];

export async function checkAndAwardBadges(userId: string): Promise<string[]> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("last_badge_check")
    .eq("id", userId)
    .single();

  const lastCheck = (profile as any)?.last_badge_check;
  if (lastCheck) {
    const hoursSince = (Date.now() - new Date(lastCheck).getTime()) /
      (1000 * 60 * 60);
    if (hoursSince < 24) return [];
  }

  await supabase.from("profiles")
    .update({ last_badge_check: new Date().toISOString() } as any)
    .eq("id", userId);

  const { data: existingBadges } = await supabase
    .from("user_badges")
    .select("badge_name")
    .eq("user_id", userId);

  const existing = new Set((existingBadges || []).map((b: any) => b.badge_name));

  // Run all badge checks in parallel (skip already-earned)
  const results = await Promise.all(
    BADGE_DEFINITIONS.map(async (badge) => ({
      badge,
      earned: existing.has(badge.name) ? false : await badge.check(userId),
    }))
  );

  const newBadges: string[] = [];
  for (const { badge, earned } of results) {
    if (!earned) continue;
    await supabase.from("user_badges").insert({
      user_id: userId,
      badge_type: badge.type,
      badge_name: badge.name,
      description: badge.description,
    });
    await supabase.from("notifications").insert({
      user_id: userId,
      title: "🏆 Nouveau badge !",
      message: `Vous avez débloqué "${badge.name}" — ${badge.description}`,
      type: "badge",
    });
    newBadges.push(badge.name);
  }

  return newBadges;
}
