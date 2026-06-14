---
version: toolbox-md-batch-v1
batch_id: toolbox_CATEGORY_BATCH_01
expected_items: 10
category: regulation
---

<!--
IMPORT PAR LOT — 1 fichier = jusqu'à 10 outils
────────────────────────────────────────────────
• Chaque bloc commence par une ligne seule : toolbox-item (marqueur HTML dédié)
• Puis frontmatter YAML (--- … ---) + sections # … FR / # … EN
• external_key unique dans tout le lot
• distribution.mode: catalog par défaut (gabarit sans assignation)
• Importer ce fichier unique dans Admin → Toolbox Studio → Importer .md
-->

<!-- toolbox-item -->

---
external_key: toolbox_regulation_breath_001
content_type: breathwork
is_active: true
duration: "4 MIN"
category: regulation
archetype_targets:
  - caregiver
  - healer
title:
  fr: "Respiration 4-4-6-2"
  en: "Breathwork 4-4-6-2"
description:
  fr: "Cycles guidés pour réguler le système nerveux."
  en: "Guided cycles to regulate the nervous system."
distribution:
  mode: catalog
  assignment_status: active
config:
  cycles: 4
  breath_in_sec: 4
  pause1_sec: 4
  breath_out_sec: 6
  pause2_sec: 2
---

# Instructions FR

Inspirez par le nez, retenez, expirez lentement. Suivez le rythme affiché.

# Instructions EN

Inhale through the nose, hold, exhale slowly. Follow the displayed rhythm.

<!-- toolbox-item -->

---
external_key: toolbox_regulation_stop_002
content_type: stop_protocol
is_active: true
duration: "3 MIN"
category: regulation
title:
  fr: "STOP rapide"
  en: "Quick STOP"
description:
  fr: "Séquence S-T-O-P pour une régulation immédiate."
  en: "S-T-O-P sequence for immediate regulation."
distribution:
  mode: catalog
  assignment_status: active
config:
  mode: timed
  step_duration_sec: 45
---

# Steps FR

- Stop — Interromps l'action en cours
- Take a breath — Une respiration profonde
- Observe — Qu'est-ce qui se passe en toi ?
- Proceed — Choisis la suite consciemment

# Steps EN

- Stop — Interrupt what you are doing
- Take a breath — One deep breath
- Observe — What is happening inside?
- Proceed — Choose your next move consciously

<!-- toolbox-item -->

---
external_key: toolbox_regulation_box_003
content_type: breath_box
is_active: true
duration: "5 MIN"
category: regulation
title:
  fr: "Respiration Box"
  en: "Box breathing"
description:
  fr: "Respiration carrée 4-4-4-4."
  en: "Square breathing 4-4-4-4."
distribution:
  mode: catalog
  assignment_status: active
config:
  cycles: 15
  breath_in_sec: 4
  pause1_sec: 4
  breath_out_sec: 4
  pause2_sec: 4
  breath_visual: box
---

# Instructions FR

4 sec inspire, 4 sec pause, 4 sec expire, 4 sec pause — suis le point sur le carré.

# Instructions EN

4 sec inhale, 4 sec hold, 4 sec exhale, 4 sec hold — follow the dot on the square.

<!-- toolbox-item -->

---
external_key: toolbox_regulation_coherence_004
content_type: breath_coherence
is_active: true
duration: "5 MIN"
category: regulation
title:
  fr: "Cohérence cardiaque"
  en: "Cardiac coherence"
description:
  fr: "Respiration 5/5 en continu."
  en: "Continuous 5/5 breathing."
distribution:
  mode: catalog
  assignment_status: active
config:
  cycles: 30
  breath_in_sec: 5
  pause1_sec: 0
  breath_out_sec: 5
  pause2_sec: 0
  breath_visual: circle
---

# Instructions FR

Inspire 5 sec / Expire 5 sec, en continu.

# Instructions EN

Inhale 5 sec / Exhale 5 sec, continuously.

<!-- toolbox-item -->

---
external_key: toolbox_regulation_sigh_005
content_type: physiological_sigh
is_active: true
duration: "2 MIN"
category: regulation
title:
  fr: "Soupir physiologique"
  en: "Physiological sigh"
description:
  fr: "Double inspiration suivie d'une longue expiration."
  en: "Double inhale followed by a long exhale."
distribution:
  mode: catalog
  assignment_status: active
config:
  cycles: 8
  breath_in_sec: 2
  pause1_sec: 1
  breath_out_sec: 8
  pause2_sec: 0
---

# Instructions FR

Fais 8 répétitions lentes : double inspiration, longue expiration.

# Instructions EN

Do 8 slow repetitions: double inhale, long exhale.

<!-- toolbox-item -->

---
external_key: toolbox_regulation_vagal_006
content_type: vagal_hum
is_active: true
duration: "3 MIN"
category: regulation
title:
  fr: "Humming vagal"
  en: "Vagal humming"
description:
  fr: "Vibration vocale douce sur l'expiration."
  en: "Gentle vocal vibration on the exhale."
distribution:
  mode: catalog
  assignment_status: active
config:
  cycles: 15
  breath_in_sec: 4
  pause1_sec: 0
  breath_out_sec: 8
  pause2_sec: 0
---

# Instructions FR

Hum doucement sur chaque expiration.

# Instructions EN

Hum softly on each exhale.

<!-- toolbox-item -->

---
external_key: toolbox_regulation_shake_007
content_type: shake_release
is_active: true
duration: "2 MIN"
category: regulation
title:
  fr: "Décharge par secousses"
  en: "Shake release"
description:
  fr: "Décharge somatique par secousses lentes."
  en: "Somatic release through gentle shaking."
distribution:
  mode: catalog
  assignment_status: active
config:
  duration_sec: 90
---

# Instructions FR

Secoue bras et jambes 90 secondes, pieds ancrés au sol.

# Instructions EN

Shake arms and legs for 90 seconds, feet grounded.

<!-- toolbox-item -->

---
external_key: toolbox_regulation_cold_008
content_type: cold_exposure_prep
is_active: true
duration: "3 MIN"
category: regulation
title:
  fr: "Préparation au froid"
  en: "Cold exposure prep"
description:
  fr: "Routine de sécurité avant exposition au froid."
  en: "Safety routine before cold exposure."
distribution:
  mode: catalog
  assignment_status: active
config:
  duration_sec: 180
---

# Instructions FR

Respire calmement, adopte une posture stable, entre progressivement.

# Instructions EN

Breathe calmly, adopt a stable posture, enter gradually.

# Steps FR

- Respiration — 1 minute de cohérence
- Posture — Épaules relâchées
- Entrée — Progressive, sans forcer

# Steps EN

- Breathing — 1 minute of coherence
- Posture — Relaxed shoulders
- Entry — Gradual, without forcing

<!-- toolbox-item -->

---
external_key: toolbox_regulation_rumination_009
content_type: stop_rumination
is_active: true
duration: "3 MIN"
category: regulation
title:
  fr: "Arrêter la rumination"
  en: "Stop rumination"
description:
  fr: "Interrompre une boucle de rumination."
  en: "Interrupt a rumination loop."
distribution:
  mode: catalog
  assignment_status: active
config:
  duration_sec: 180
---

# Instructions FR

Nomme la boucle, respire, redirige ton attention.

# Instructions EN

Name the loop, breathe, redirect your attention.

# Steps FR

- Nommer la boucle — Quel scénario tourne en boucle ?
- Respirer — 3 cycles lents
- Rediriger — Une action concrète maintenant

# Steps EN

- Name the loop — Which scenario is repeating?
- Breathe — 3 slow cycles
- Redirect — One concrete action now

<!-- toolbox-item -->

---
external_key: toolbox_regulation_micro_010
content_type: micro_practice
is_active: true
duration: "5 MIN"
category: regulation
title:
  fr: "Reset posture 2 min"
  en: "2-minute posture reset"
description:
  fr: "Réalignement rapide nuque, épaules, bassin."
  en: "Quick neck, shoulders, and pelvis realignment."
distribution:
  mode: catalog
  assignment_status: active
config:
  duration_sec: 120
---

# Instructions FR

3 alignements sur 2 minutes, sans précipitation.

# Instructions EN

3 alignments over 2 minutes, without rushing.

# Steps FR

- Nuque — Longueur vers le ciel
- Épaules — Descendre et ouvrir
- Bassin — Ancrer et stabiliser

# Steps EN

- Neck — Length toward the sky
- Shoulders — Drop and open
- Pelvis — Ground and stabilize
