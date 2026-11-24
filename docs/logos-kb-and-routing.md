# LOGOS — KB, grilles auteurs, UI depuis n'importe quel nœud

## Modèle

1. **Agent racine** : KB complète (doctrine, grimoire, `01_MEMOIRE_VIVE`, `05_OUTPUTS` user, etc.) + RAG activé.
2. **Nœuds workflow** : ne doivent **pas** définir `conversation_config.agent.prompt.knowledge_base: []` (sinon coupure RAG). Héritage = KB intégrale sur triage, guide, checkin, analyse.
3. **Grilles auteurs** : Jung / Blavatsky = nœud unique. **Myss** = arbre **lighthouse → perspective (Archétypes sacrés) → prismes balance · light · shadow** avec KB **scopée** par feuille (air-gap : un prisme ne doit pas embarquer les rapports des deux autres).
4. **Approfondissement** : réponse courte depuis la KB, puis routage vers phare / perspective / prisme.
5. **Modals** : tous les client tools UI sur **triage** et les nœuds opérationnels ; la **phrase d'intro** varie selon le nœud.

## Fichier source workflow

[`supabase/functions/elevenlabs-knowledge/logos-workflow.json`](../supabase/functions/elevenlabs-knowledge/logos-workflow.json)

## Où déposer les fichiers (Drive → sync → KB agent ElevenLabs)

Même **racine KB** que les autres MD LOGOS du pilote Note (dossier voice outputs / prompt sources — pas un dossier par nœud EL).  
Les nœuds workflow ne dupliquent pas les fichiers : ils pointent un **sous-ensemble** via `additional_knowledge_base` + le socle agent reste visible par héritage RAG sur les nœuds qui n’écrasent pas la KB.

| Couche | Rôle KB | Fichiers typiques |
|--------|---------|-------------------|
| Socle agent | Tout LOGOS peut s’y référer | `00_SYSTEM_PROMPT_AGENT.md`, `01_MEMOIRE_VIVE_RAW.md`, `02_SYNTHESES_ET_AXIOMES_CLINIQUES.md`, `04_GRIMOIRE_PRATIQUE_VOCAL.md`, `05_DAILY_VOICE_PROMPTS.md`, dossier `05_OUTPUTS` |
| Doctrine auteur | Encyclopédie + graines, **sans** rapports LEVEL_1 longs par prisme | `03_DOCTRINE_CLINIQUE_<AUTEUR>.md` (version allégée ou index si tu éclates les rapports) |
| Perspective | Routage livre / vocabulaire Sacred Archetypes | `03_DOCTRINE_CLINIQUE_CAROLINE_MYSS.md` (corpus perspective) + `03_MATRICE_DES_5_CATEGORIES.md` |
| Prisme | **Un** rapport LEVEL_1 par fichier | Voir tableau Myss ci-dessous |

Après ajout ou découpage sur Drive : resync KB agent (admin ElevenLabs ou `elevenlabs-knowledge` upload), puis **recopier les `id` KB** dans `logos-workflow.json` et republier le workflow.

## Myss · Sacred Archetypes — cartographie fichiers ↔ nœuds

Aujourd’hui les trois rapports LEVEL_1 vivent encore **dans un seul** `03_DOCTRINE_CLINIQUE_CAROLINE_MYSS.md` (sections `# PRISME : balance / LIGHT / SHADOW`). Pour l’air-gap des feuilles workflow, **extraire** trois fichiers dédiés (même gabarit que dans la doctrine : safeguard §0, métaphysique, axes, axiomes, caps grimoire).

**Noms cibles** (à la racine KB agent, préfixe `04_` = rapport / prisme opérationnel) :

| Fichier (nom sur Drive + EL) | Nœud workflow | Contenu |
|------------------------------|---------------|---------|
| `04_RAPPORT_PRISME_MYSS_ARCHETYPES_BALANCE_LEVEL1.md` | `prism_myss_balance` | Rapport extrait de `# PRISME : balance` → fin section balance |
| `04_RAPPORT_PRISME_MYSS_ARCHETYPES_LIGHT_LEVEL1.md` | `prism_myss_light` | Rapport extrait de `# PRISME : LIGHT` |
| `04_RAPPORT_PRISME_MYSS_ARCHETYPES_SHADOW_LEVEL1.md` | `prism_myss_shadow` | Rapport extrait de `# PRISME : SHADOW` |
| `04_ONTOLOGIE_ARCHETYPES_ET_OMBRE.md` | `prism_myss_shadow` **en plus** (socle ombre / Survival Family) | Ontologie partagée ombre — **ne pas** sur balance/light |
| `03_DOCTRINE_CLINIQUE_CAROLINE_MYSS.md` | `perspective_myss_archetypes` | Doctrine perspective (de préférence **sans** les 3 rapports LEVEL_1 si éclatés) |
| `03_MATRICE_DES_5_CATEGORIES.md` | `perspective_myss_archetypes` | Graines / catégories choix UI |
| `02_SYNTHESES_ET_AXIOMES_CLINIQUES.md` | `lighthouse_myss` (+ optionnel une ligne synthèse par prisme sur les feuilles) | Index rapide, pas les rapports complets |

**État actuel du repo** (`logos-workflow.json` pilote) — à corriger après tes uploads :

| Nœud | KB scopée actuelle | Prochaine cible |
|------|-------------------|-----------------|
| `prism_myss_balance` | `02_SYNTHESES` + **toute** la doctrine Myss | `02_SYNTHESES` (extrait balance si tu veux) + **fichier balance LEVEL_1** uniquement |
| `prism_myss_light` | `02_SYNTHESES` seul | **fichier light LEVEL_1** (+ synthèse light optionnelle) |
| `prism_myss_shadow` | `02_SYNTHESES` + `04_ONTOLOGIE…` | **fichier shadow LEVEL_1** + `04_ONTOLOGIE…` |

Les `id` (`Ae8WCd6zvVTqvsODaLFC`, etc.) dans le JSON sont **propres au workspace ElevenLabs** : après sync, récupérer les IDs affichés dans la KB agent et les mettre à jour dans le JSON + push workflow.

## Pilote

Agent `agent_5601m6tdhgsbftsvtkz20d9grfvj`, branche `agtbrch_8401m6tdhhvnebtbjpnmen7dxt6d`.  
`install_logos_workflow` : ne pas lancer en masse avant validation.

## Vérification (Myss)

1. Triage / analyse : question archétypes → route `lighthouse_myss` → `perspective_myss_archetypes`.
2. « Ombre / Saboteur » → `prism_myss_shadow` : ton ombre, citations Survival Family ; **pas** pentagramme / Grâce (fuite lumière).
3. « Équilibre / Point Zéro » → `prism_myss_balance` : synthèse des deux pôles, pas coaching ombre seule.
4. « Lumière / dons » → `prism_myss_light` : Pentagramme, inviolabilité ; **pas** Survival Family brute.

Quand tes trois `04_RAPPORT_PRISME_*` sont sur la KB agent, envoie-moi un signe (ou les noms exacts si tu changes la convention) : je mets à jour les `additional_knowledge_base` + repousse le workflow pilote.