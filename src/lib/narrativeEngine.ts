/**
 * Narrative engine — pure deterministic rules.
 * Generates a 1-sentence story per metric (FR/EN) with a sentiment + optional CTA.
 * No AI, no I/O. All inputs come from already-loaded dashboard state.
 */

export type NarrativeSentiment = "positive" | "neutral" | "warning" | "critical";

export interface NarrativeContext {
  moodAvg: number;
  moodDelta: number;
  moodTrend: "up" | "down" | "stable";
  openDecisions: number;
  oldestDecisionDays: number;
  habitRate: number;
  streakDays: number;
  journalCount: number;
  contactsCount: number;
  lastContactDays: number;
  aegisScore: number;
  aegisScoreDelta: number;
}

export interface KPINarrative {
  key: "mood" | "decisions" | "habits" | "relations" | "journal";
  metric: string;
  label_fr: string;
  label_en: string;
  story_fr: string;
  story_en: string;
  sentiment: NarrativeSentiment;
  actionLabel_fr?: string;
  actionLabel_en?: string;
  actionRoute?: string;
}

const fmt = (n: number, digits = 1) =>
  Number.isFinite(n) ? n.toFixed(digits).replace(/\.0$/, "") : "—";

// ─────────────────────────────────────────────────────────────────────────────
// MOOD
// ─────────────────────────────────────────────────────────────────────────────
export function generateMoodNarrative(ctx: NarrativeContext): KPINarrative {
  const { moodAvg, moodDelta, moodTrend } = ctx;
  const base: Pick<KPINarrative, "key" | "metric" | "label_fr" | "label_en"> = {
    key: "mood",
    metric: Number.isFinite(moodAvg) && moodAvg > 0 ? `${fmt(moodAvg)}/10` : "—",
    label_fr: "Humeur",
    label_en: "Mood",
  };

  if (moodDelta > 1.5 && moodAvg > 6) {
    return {
      ...base,
      sentiment: "positive",
      story_fr: `Ta clarté est en hausse cette semaine (+${fmt(moodDelta)} pts). Bon moment pour décider.`,
      story_en: `Your clarity is rising this week (+${fmt(moodDelta)} pts). A good time to decide.`,
    };
  }
  if (moodDelta < -1.5 && moodAvg < 5) {
    return {
      ...base,
      sentiment: "warning",
      story_fr: `Ton niveau d'énergie a baissé (${fmt(moodDelta)} pts). Évite les décisions majeures aujourd'hui.`,
      story_en: `Your energy has dropped (${fmt(moodDelta)} pts). Avoid major decisions today.`,
      actionLabel_fr: "Ouvrir la boîte à outils",
      actionLabel_en: "Open toolbox",
      actionRoute: "/toolbox",
    };
  }
  if (moodAvg >= 7 && moodTrend === "stable") {
    return {
      ...base,
      sentiment: "positive",
      story_fr: "Tu maintiens un niveau élevé depuis 7 jours. Capitalise sur cette énergie.",
      story_en: "You've held a high level for 7 days. Capitalize on this energy.",
    };
  }
  if (moodAvg > 0 && moodAvg < 4) {
    return {
      ...base,
      sentiment: "critical",
      story_fr: "Mood bas 3j+. Prends soin de toi avant de prendre des décisions importantes.",
      story_en: "Low mood for 3+ days. Take care of yourself before any major decision.",
      actionLabel_fr: "Ouvrir la boîte à outils",
      actionLabel_en: "Open toolbox",
      actionRoute: "/toolbox",
    };
  }
  return {
    ...base,
    sentiment: "neutral",
    story_fr: `Humeur stable cette semaine. ${fmt(moodAvg)}/10 en moyenne.`,
    story_en: `Mood stable this week. ${fmt(moodAvg)}/10 on average.`,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// DECISIONS
// ─────────────────────────────────────────────────────────────────────────────
export function generateDecisionNarrative(ctx: NarrativeContext): KPINarrative {
  const { openDecisions, oldestDecisionDays } = ctx;
  const base: Pick<KPINarrative, "key" | "metric" | "label_fr" | "label_en"> = {
    key: "decisions",
    metric: String(openDecisions),
    label_fr: "Décisions ouvertes",
    label_en: "Open decisions",
  };

  if (openDecisions === 0) {
    return {
      ...base,
      sentiment: "positive",
      story_fr: "Aucune décision en attente. Tu es à jour.",
      story_en: "No pending decisions. You're up to date.",
    };
  }
  if (oldestDecisionDays > 7) {
    return {
      ...base,
      sentiment: "warning",
      story_fr: `Ta décision la plus ancienne attend depuis ${oldestDecisionDays}j. Un report coûte plus tard.`,
      story_en: `Your oldest decision has been waiting ${oldestDecisionDays}d. Deferring costs more later.`,
      actionLabel_fr: "Ouvrir les décisions",
      actionLabel_en: "Open decisions",
      actionRoute: "/decisions",
    };
  }
  if (openDecisions > 5) {
    return {
      ...base,
      sentiment: "warning",
      story_fr: `${openDecisions} décisions ouvertes — concentration de charge. Priorise aujourd'hui.`,
      story_en: `${openDecisions} open decisions — heavy load. Prioritize today.`,
      actionLabel_fr: "Prioriser",
      actionLabel_en: "Prioritize",
      actionRoute: "/decisions",
    };
  }
  return {
    ...base,
    sentiment: "neutral",
    story_fr: `${openDecisions} décision${openDecisions > 1 ? "s" : ""} en cours, toutes récentes.`,
    story_en: `${openDecisions} decision${openDecisions > 1 ? "s" : ""} in progress, all recent.`,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// HABITS
// ─────────────────────────────────────────────────────────────────────────────
export function generateHabitNarrative(ctx: NarrativeContext): KPINarrative {
  const { habitRate, streakDays } = ctx;
  const base: Pick<KPINarrative, "key" | "metric" | "label_fr" | "label_en"> = {
    key: "habits",
    metric: `${Math.round(habitRate)}%`,
    label_fr: "Habitudes",
    label_en: "Habits",
  };

  if (habitRate >= 80) {
    return {
      ...base,
      sentiment: "positive",
      story_fr: `Tu honores ${Math.round(habitRate)}% de tes habitudes. Discipline solide.`,
      story_en: `You're honoring ${Math.round(habitRate)}% of your habits. Solid discipline.`,
    };
  }
  if (habitRate < 30) {
    return {
      ...base,
      sentiment: "critical",
      story_fr: "Moins de 30% d'habitudes complétées. Qu'est-ce qui bloque ?",
      story_en: "Less than 30% of habits completed. What's blocking you?",
      actionLabel_fr: "Voir mes habitudes",
      actionLabel_en: "View habits",
      actionRoute: "/habits",
    };
  }
  if (habitRate < 50 && streakDays > 0) {
    return {
      ...base,
      sentiment: "warning",
      story_fr: `En dessous de 50% mais tu maintiens une série de ${streakDays}j. Tiens bon.`,
      story_en: `Below 50% but you're holding a ${streakDays}-day streak. Keep going.`,
    };
  }
  return {
    ...base,
    sentiment: "neutral",
    story_fr: `${Math.round(habitRate)}% complétées. Une habitude manquée peut devenir deux.`,
    story_en: `${Math.round(habitRate)}% completed. One missed habit can become two.`,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// RELATIONS
// ─────────────────────────────────────────────────────────────────────────────
export function generateRelationNarrative(ctx: NarrativeContext): KPINarrative {
  const { contactsCount, lastContactDays } = ctx;
  const base: Pick<KPINarrative, "key" | "metric" | "label_fr" | "label_en"> = {
    key: "relations",
    metric: String(contactsCount),
    label_fr: "Réseau",
    label_en: "Network",
  };

  if (contactsCount === 0) {
    return {
      ...base,
      sentiment: "neutral",
      story_fr: "Aucun contact dans ta carte relationnelle. Commence avec une personne clé.",
      story_en: "No contacts in your relational map yet. Start with one key person.",
      actionLabel_fr: "Ouvrir le board",
      actionLabel_en: "Open board",
      actionRoute: "/people",
    };
  }
  if (lastContactDays > 14) {
    return {
      ...base,
      sentiment: "warning",
      story_fr: `Ton dernier contact réseau date de ${lastContactDays}j. Un message entretient plus qu'on ne pense.`,
      story_en: `Your last network touch was ${lastContactDays}d ago. A short message goes a long way.`,
      actionLabel_fr: "Ouvrir le board",
      actionLabel_en: "Open board",
      actionRoute: "/people",
    };
  }
  if (lastContactDays <= 3) {
    return {
      ...base,
      sentiment: "positive",
      story_fr: "Tu es actif relationnellement cette semaine. Réseau vivant.",
      story_en: "You're relationally active this week. Living network.",
    };
  }
  return {
    ...base,
    sentiment: "neutral",
    story_fr: `${contactsCount} contacts dans ton réseau. Dernier contact il y a ${lastContactDays}j.`,
    story_en: `${contactsCount} contacts in your network. Last touch ${lastContactDays}d ago.`,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// JOURNAL
// ─────────────────────────────────────────────────────────────────────────────
export function generateJournalNarrative(ctx: NarrativeContext): KPINarrative {
  const { journalCount } = ctx;
  const base: Pick<KPINarrative, "key" | "metric" | "label_fr" | "label_en"> = {
    key: "journal",
    metric: String(journalCount),
    label_fr: "Journal",
    label_en: "Journal",
  };

  if (journalCount === 0) {
    return {
      ...base,
      sentiment: "warning",
      story_fr: "Aucune entrée cette semaine. L'écriture clarifie ce que l'action ne résout pas.",
      story_en: "No entries this week. Writing clarifies what action can't resolve.",
      actionLabel_fr: "Écrire",
      actionLabel_en: "Write",
      actionRoute: "/journal",
    };
  }
  if (journalCount >= 5) {
    return {
      ...base,
      sentiment: "positive",
      story_fr: `${journalCount} entrées cette semaine. Réflexivité élevée.`,
      story_en: `${journalCount} entries this week. High reflexivity.`,
    };
  }
  return {
    ...base,
    sentiment: "neutral",
    story_fr: `${journalCount} entrées. Continue — la régularité compte plus que la longueur.`,
    story_en: `${journalCount} entries. Keep going — regularity matters more than length.`,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// AGGREGATE
// ─────────────────────────────────────────────────────────────────────────────
export function generateAllNarratives(ctx: NarrativeContext): KPINarrative[] {
  return [
    generateMoodNarrative(ctx),
    generateDecisionNarrative(ctx),
    generateHabitNarrative(ctx),
    generateRelationNarrative(ctx),
    generateJournalNarrative(ctx),
  ];
}

/**
 * Highlight rule: priority order Mood > Decisions > Habits > Relations > Journal,
 * but skip neutral narratives so we never feature a "stable" metric when something
 * non-neutral exists. Falls back to first narrative if everything is neutral.
 */
export function pickHighlightNarrative(narratives: KPINarrative[]): KPINarrative | null {
  if (narratives.length === 0) return null;
  const order: KPINarrative["key"][] = ["mood", "decisions", "habits", "relations", "journal"];
  const byKey = new Map(narratives.map((n) => [n.key, n]));
  for (const k of order) {
    const n = byKey.get(k);
    if (n && n.sentiment !== "neutral") return n;
  }
  for (const k of order) {
    const n = byKey.get(k);
    if (n) return n;
  }
  return narratives[0];
}
