# LOGOS — validation live (post UI-solid)

Agent pilote : `agent_5601m6tdhgsbftsvtkz20d9grfvj`  
Branche : `agtbrch_8401m6tdhhvnebtbjpnmen7dxt6d`

## Pré-requis

- Compte connecté sur `/welcome/voice-agent` ou `/logos`
- Console navigateur : filtrer `[logos-client-tool]` et `[logos-elevenlabs]`
- Export transcript ElevenLabs après l’appel

## Checklist appel (path **open**)

| Étape | Tu dis | Pass |
|-------|--------|------|
| 1 | « Une pratique » / « ouvre le toolbox » | `workflow_node_id` → `guide_somatique` + `propose_actionable_choices` + modal |
| 2 | « Quick log » | `checkin` + `open_quick_log` |
| 3 | « People » / modal People | `analyse` + `open_people_checkin` |
| 4 | « Une carte Pulse » | `propose_pulse_card` |
| 5 | Voix | un seul `voice_id` (pas `<LOGOS Female>`) |

## Analyse transcript

```bash
node scripts/assert-logos-transcript-tools.mjs path/to/transcript.json
```

Violations typiques : `announce_ui_without_tool`, `ui_intent_no_route`, `multivoice_tags`.

## Piège connu — chemin guided + Myss (`conv_2301m837…`, v `agtvrsn_5101…`)

| Signal transcript | Cause |
|-------------------|--------|
| `workflow_node_id` = `triage` tout l’appel + `rag_usage.usage_count: 0` | Pas de route `analyse` ; KB seulement via tool manuel tardif |
| `opening_prompt` du jour : pas d’auteurs / pas Myss | Le modèle refuse la doctrine au lieu de **pivot explicite** |
| « Je n’ai pas accès aux rapports externes » | Faux : `03_DOCTRINE_CLINIQUE_CAROLINE_MYSS`, `00_RAPPORT.md`, etc. sont listés en KB |
| `knowledge_base` cat sur `01_MEMOIRE_VIVE` | Mauvais doc pour « rapports Miss » → préférer doctrine + `00_RAPPORT` / synthèses Myss |
| Réponse Mystic/Sage/Healer (mémoire Deep Dive) | Pas les rapports LEVEL_1 Sacred Archetypes (doctrine Myss) |

**Attendu après correctif triage (repo)** : dès « parle-moi de mes archétypes / Myss » → KB doctrine + route `analyse` → `lighthouse_myss` (même en `session_mode=guided` après le 1er tour).

Republier le workflow sur le pilote après merge ; la version UI `5101…` peut diverger du JSON repo.

## Piège connu (corrigé 2026-11-23)

Si l’appel reste sur `guide_somatique`, seuls les tools **attachés à ce nœud** sont invoquables.  
Toolbox/Pulse marchaient ; quick log / People / décision non — tools absents du nœud.  
Correctif : bundle passerelle UI sur `guide_somatique`, `checkin`, `analyse`.

## Correctifs déployés (2026-11-22)

- `propose_actionable_choices` attaché au nœud `guide_somatique` (manquait en live)
- Prompts triage / guide / checkin / analyse durcis (pas d’annonce UI sans tool)
- Edges triage élargis (mots-clés modal, toolbox, quick log, People…)
- Multivoice désactivé : `supported_voices` vidé, `expressive_mode` false

Réf. tool IDs : [`elevenlabs/logos-client-tools/tool-ids.json`](./elevenlabs/logos-client-tools/tool-ids.json)