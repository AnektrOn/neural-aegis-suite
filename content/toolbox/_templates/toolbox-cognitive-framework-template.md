---
# ─── Outil cognitif → modal « Pratique guidée » (micro_practice) ─────────────
# 1 fichier = 1 outil. Import : Admin → Import MD.
external_key: toolbox_cognitive_MON_SLUG
content_type: framework
# Équivalent accepté : content_type: micro_practice
is_active: true
duration: "2 MIN"
category: cognitive
priority: P2

# Archétypes catalogue : sovereign, creator, sage, warrior, lover, healer, etc.
# Ombres (saboteur, victim, child…) → shadow_targets, pas archetype_targets
archetype_targets: [sovereign]
shadow_targets: [saboteur]

title:
  fr: "Titre FR"
  en: "Title EN"
description:
  fr: "Une phrase : à quoi sert l'outil."
  en: "One line: what this tool is for."

# ─── Distribution (un seul mode) ─────────────────────────────────────────────
# catalog     → catalogue général
# individual  → un user_id
# group       → user_ids[] ou company_id
distribution:
  mode: individual
  assignment_status: active
  user_id: "00000000-0000-0000-0000-000000000000"

# Optionnel : budget temps du modal (sinon dérivé de duration: "2 MIN")
config:
  duration_sec: 120
---

# Instructions FR

Contexte court affiché avant de démarrer (2–4 phrases).

# Instructions EN

Short context shown before start (2–4 sentences).

# Steps FR

- [Étape 1] — **Nom de l'étape** : Ce que la personne fait concrètement.
- [Étape 2] — **Deuxième étape** : Détail ou question clinique.
- [Étape 3] — **Clôture** : Action ou ancrage final.

# Steps EN

- [Step 1] — **Step name**: What the person does.
- [Step 2] — **Second step**: Detail or clinical question.
- [Step 3] — **Close**: Final action or anchor.
