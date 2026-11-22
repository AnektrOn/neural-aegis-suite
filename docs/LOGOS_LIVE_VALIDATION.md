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

## Correctifs déployés (2026-11-22)

- `propose_actionable_choices` attaché au nœud `guide_somatique` (manquait en live)
- Prompts triage / guide / checkin / analyse durcis (pas d’annonce UI sans tool)
- Edges triage élargis (mots-clés modal, toolbox, quick log, People…)
- Multivoice désactivé : `supported_voices` vidé, `expressive_mode` false

Réf. tool IDs : [`elevenlabs/logos-client-tools/tool-ids.json`](./elevenlabs/logos-client-tools/tool-ids.json)