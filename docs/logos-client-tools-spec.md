# LOGOS client tools (pilote)

**Agent ElevenLabs cible (seul) :** `agent_5601m6tdhgsbftsvtkz20d9grfvj`

Configurer les **client tools** sur cet agent avec les noms **exactement** ci-dessous. L’app (`@elevenlabs/react`) enregistre les mêmes handlers.

**JSON ElevenLabs (import CLI / dashboard)** : [`elevenlabs/logos-client-tools/`](../elevenlabs/logos-client-tools/) — un fichier par tool + `logos-client-tools-all.json`.

## Règles produit

- LOGOS = **passerelle app**, pas coach vocal de pratique.
- **`open_*` et `propose_pulse_card`** : `expectsResponse: true` (tour bloqué pendant UI).
- **Interdits** : ouverture autonome de `external_link`, vidéos, contenus `waiting`.
- Initiatives autorisées ; en cas d’ambiguïté, **lister** puis attendre.

## Tools

| Name | expectsResponse | Params | Return (string) |
|------|-----------------|--------|-------------------|
| `list_actionable_content` | false | `intent?` string, `limit?` number (max 8) | JSON catalog |
| `open_toolbox_item` | **true** | `assignment_id?` uuid, `slug?` string (title slug match) | `completed` \| `abandoned` \| `closed` \| `error:…` |
| `propose_pulse_card` | **true** | `card_id?` uuid | `assimilated` \| `ignored` \| `dismissed` |
| `record_pulse_swipe` | false | `card_id` uuid, `action` `assimilated` \| `ignored` | `ok` \| `error:…` |
| `open_quick_log` | **true** | `{}` | `saved` \| `dismissed` |
| `open_people_checkin` | **true** | `contact_id?` uuid, `contact_name?` string | `saved` \| `dismissed` |
| `open_decision_capture` | **true** | `{}` | `dismissed` (placeholder UI) |
| `write_decision` | false | `name` string, `priority?` 1-10, `responsibility?` 1-10 | `ok` \| `error:…` |
| `write_journal_entry` | false | `title` string, `content` string, `tags?` string[] | `ok` \| `error:…` |
| `write_mood_entry` | false | `value` int 1-10, `sleep?` number, `stress?` number | `ok` \| `error:…` |
| `write_relation_note` | false | `contact_id?` uuid, `contact_name?` string, `quality?` int 1-10, `note?` string | `ok` \| `error:…` |

## Nœuds workflow (outils autorisés)

| Nœud | Tools typiques |
|------|----------------|
| `triage` | `list_actionable_content` (optionnel) |
| `guide_somatique` | list, open_toolbox_item, propose_pulse_card, record_pulse_swipe |
| `checkin` | write_mood_entry, open_quick_log, open_toolbox_item (régulation) |
| `analyse` | write_journal_entry, write_decision, open_people_checkin, write_relation_note, open_toolbox_item (ancrage) |

## `list_actionable_content` — shape JSON

```json
{
  "toolbox": [{ "assignment_id": "uuid", "title": "…", "content_type": "…", "duration": "…" }],
  "pulse": [{ "card_id": "uuid", "title": "…", "principle": "…" }]
}
```

## Déploiement

- Ne pas lancer `install_logos_workflow` en masse tant que le pilote n’est pas validé.
- Référence workflow repo : [`logos-workflow.json`](../supabase/functions/elevenlabs-knowledge/logos-workflow.json).
- Guide sync : [`logos-workflow-pilot-sync.md`](./logos-workflow-pilot-sync.md).
