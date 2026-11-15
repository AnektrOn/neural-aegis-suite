# LOGOS — client tools JSON (dashboard ElevenLabs)

Agent pilote : **`agent_5601m6tdhgsbftsvtkz20d9grfvj`**

## Import dans le dashboard

1. Agent LOGOS → **Tools** → **Add tool** → **Import from JSON** (ou équivalent).
2. Colle **le contenu d’un fichier** `*.json` de ce dossier (un tool à la fois).
3. **Publish** l’agent après avoir ajouté tous les tools.

### Format attendu par le dashboard (pas le JSON Schema `properties`)

| Champ | Valeur |
|-------|--------|
| `parameters` | **tableau** `[{ "id", "type", "value_type": "llm_prompt", ... }]` — pas `{ "type": "object", "properties": ... }` |
| `response_timeout_secs` | **obligatoire** : `20` si `expects_response: false` ; `-1` ou `120` si `true` (modals longs : `-1` = attend indéfiniment) |
| `expects_response` | `true` pour `open_*` et `propose_pulse_card` |

Si tu vois `Validation Error: parameters expected array` → tu as l’ancien format ; refais l’import depuis les fichiers **mis à jour** ici.

### Outils avec attente (`expects_response: true`)

| Tool | `response_timeout_secs` |
|------|-------------------------|
| `open_toolbox_item` | `-1` |
| `propose_pulse_card` | `-1` |
| `open_quick_log` | `-1` |
| `open_people_checkin` | `-1` |
| `open_decision_capture` | `120` |

## Fichiers

Un JSON par outil, prêt à coller :

- `list_actionable_content.json` … `write_relation_note.json`

Référence champs communs : `_dashboard-template-fields.json`

## CLI ElevenLabs (format différent)

L’exemple doc `tool_configs/log_message.json` utilise encore un schéma `parameters` objet pour la **CLI**. Le dashboard utilise le format **tableau** ci-dessus. Pour LOGOS, privilégie le **dashboard** ou convertis manuellement.

## App

Handlers : [`LogosClientToolsRegistrar.tsx`](../../../src/features/logos/LogosClientToolsRegistrar.tsx) — les `name` / `id` doivent matcher.
