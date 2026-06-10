---
# ─── Identité (obligatoire) ───────────────────────────────────────────────────
# external_key : unique, immuable après premier import — préfixe recommandé toolbox_
# content_type : voir liste dans la section « Types » en bas de ce fichier
# category     : regulation | attention | body | cognitive | journal | intentionality | custom
external_key: toolbox_CATEGORY_SLUG_001
content_type: micro_practice
is_active: true
duration: "5 MIN"
category: custom

# ─── Ciblage catalogue (optionnel) ────────────────────────────────────────────
archetype_targets: []
shadow_targets: []

# ─── Titres & descriptions (obligatoire FR + EN, textes distincts) ────────────
title:
  fr: ""
  en: ""
description:
  fr: ""
  en: ""

# ─── Distribution (obligatoire — un seul mode) ─────────────────────────────────
# mode: catalog     → gabarit catalogue seulement (défaut)
# mode: individual  → + user_id
# mode: group        → + user_ids[] et/ou company_id
# mode: global       → + locale: fr | en | all
# assignment_status : active | waiting | assigned | inactive
distribution:
  mode: catalog
  assignment_status: active
  # user_id: "00000000-0000-0000-0000-000000000000"
  # user_ids:
  #   - "00000000-0000-0000-0000-000000000000"
  # company_id: "00000000-0000-0000-0000-000000000000"
  # locale: fr

# ─── Config widget (selon content_type) ───────────────────────────────────────
# micro_practice : duration_sec, steps (dérivés du corps si absent)
# breathwork     : cycles, breath_in_sec, pause1_sec, breath_out_sec, pause2_sec
# focus_introspectif : duration_min, intention (ou section # Intention FR/EN)
# body_scan      : duration_min, zones: [head, shoulders, chest, abdomen, legs, feet]
# visualization  : total_sec + scènes (section # Scenes FR/EN)
# affirmations   : duration_min (+ liste section # Affirmations FR/EN)
# gratitude      : entries_count
# journal_prompt : prompt (section # Prompt FR/EN)
# stop_protocol  : mode: timed, step_duration_sec (+ section # Steps FR/EN)
# intention      : duration_min (+ section # Intention FR/EN)
# external_link  : external_url (pas de vidéo YouTube/Drive — utiliser la bibliothèque)
config:
  duration_sec: 300
  # instructions: ""  # surcharge optionnelle ; sinon dérivé de # Instructions FR/EN
---

# Instructions FR

(Texte principal affiché dans le widget — paragraphes libres.)

# Instructions EN

(Main instructions shown in the widget.)

# Steps FR

- Étape 1 — indice optionnel après le tiret
- Étape 2 — autre indice

# Steps EN

- Step 1 — optional hint after the dash
- Step 2 — other hint

<!--
═══════════════════════════════════════════════════════════════════════════════
RÉFÉRENCE RAPIDE — sections corps selon content_type
═══════════════════════════════════════════════════════════════════════════════

Tous les types        → # Instructions FR / # Instructions EN
micro_practice        → + # Steps FR / # Steps EN
stop_protocol         → + # Steps FR / # Steps EN  (Titre — indice)
affirmations          → # Affirmations FR / # Affirmations EN  (listes à puces)
journal_prompt        → # Prompt FR / # Prompt EN
intention             → # Intention FR / # Intention EN
focus_introspectif    → # Intention FR / # Intention EN  (optionnel si config.intention)
visualization         → # Scenes FR / # Scenes EN
                        ## Titre scène | secondes
                        Corps de la scène sur la ligne suivante.

───────────────────────────────────────────────────────────────────────────────
Types natifs (content_type)
───────────────────────────────────────────────────────────────────────────────
breathwork, focus_introspectif, body_scan, visualization, affirmations,
gratitude, journal_prompt, stop_protocol, intention, micro_practice, external_link

Types composés (slug exact = content_type)
───────────────────────────────────────────────────────────────────────────────
breath_box, breath_coherence, physiological_sigh, vagal_hum, micro_movement,
shake_release, progressive_relax, walking_meditation, cold_exposure_prep,
posture_reset, energy_activation, safe_place, open_monitoring, journal_stream,
gratitude_triple, worry_dump, letter_unsent, dialogue_parts, evening_review,
morning_pages, intention_morning, intention_week, ritual_sequence, habit_checkbox,
affirmations_cycle, belief_reframe, if_then_plan, decision_matrix, stop_rumination,
shadow_checkin, archetype_mirror, empathy_perspective, …

───────────────────────────────────────────────────────────────────────────────
Nom de fichier : {NNN}-{slug}.md  — ex. 001-respiration-4-4-6-2.md
Dossier        : content/toolbox/{category}/  (category = champ YAML ci-dessus)
───────────────────────────────────────────────────────────────────────────────

Checklist avant commit :
  [ ] external_key unique (préfixe toolbox_)
  [ ] title.fr + title.en non vides et distincts
  [ ] description.fr + description.en non vides
  [ ] Sections corps FR + EN requises pour le type
  [ ] config contient les champs requis du content_type
  [ ] Pas d’URL vidéo dans external_url
  [ ] distribution.mode cohérent (user_id / user_ids / locale si besoin)
  [ ] Texte EN ≠ copie mot pour mot du FR

Ne pas inclure : habit_items, journal_items, fichiers index readme sans external_key.
═══════════════════════════════════════════════════════════════════════════════
-->
