# LOGOS — workflow après création des client tools

## Le problème (ce que tu as vu)

Deux formats différents :

| | Repo actuel `logos-workflow.json` | Doc « Workflows as code » |
|--|-----------------------------------|---------------------------|
| Nœuds | `type: "override_agent"` + `additional_prompt` | `wf.converse(id, prompt, { toolIds })` |
| Tools | **Absents** du graphe | `toolIds: ["tool_xxx", …]` sur chaque nœud |
| Usage | PATCH API / `install_logos_workflow` | `Workflow` SDK → `agents.update` |

Notre fichier est le **wire format** déjà déployable via l’admin AEGIS, mais il **n’attache aucun tool** aux nœuds.  
La nouvelle doc SDK construit le même graphe autrement et **peut** coller les `toolIds`.

Tu ne peux **pas** coller tel quel `logos-workflow.json` dans un builder `Workflow()` sans conversion.  
Tu n’as **pas** besoin du SDK **maintenant** pour avancer.

---

## Ce que tu fais maintenant (dashboard, pilote uniquement)

Agent : `agent_5601m6tdhgsbftsvtkz20d9grfvj`

### Étape A — Tools au niveau agent (le plus simple)

1. Agent → **Tools** → tous les 11 client tools **activés / assignés** à l’agent.
2. **Publish**.

Tant que les tools sont sur l’agent, LOGOS peut les appeler depuis n’importe quel nœud.  
Les **prompts** disent *quand* (guide_somatique vs checkin vs analyse).

Ça suffit pour le **premier test** vocal.

### Étape B — Prompts des nœuds (workflow visuel)

1. Ouvre l’onglet **Workflow** de l’agent (éditeur visuel).
2. Clique chaque nœud → colle le texte `additional_prompt` depuis  
   [`logos-workflow.json`](../../supabase/functions/elevenlabs-knowledge/logos-workflow.json) :

| Nœud (id / label) | Contenu |
|-------------------|---------|
| `triage` / Triage | passerelle + routage, pas d’ouverture modal lourde |
| `guide_somatique` / Protocoles | list → open UI, **pas** de coaching vocal |
| `checkin` / Relevé du jour | mood tools + régulation UI |
| `analyse` / Analyse | journal / people / decision + ancrage |
| jung / myss / blavatsky | inchangés (grilles) |

3. Si l’UI du nœud a une case **Tools** / **tool IDs**, sélectionne selon la carte ci-dessous.
4. **Publish**.

### Étape C — Carte tools ↔ nœuds (quand tu restreins par nœud)

Les **names** doivent matcher l’app. Les **tool IDs** (`tool_…`) sont ceux générés dans ton workspace ElevenLabs — remplace après import.

| Nœud | Tools (names) |
|------|----------------|
| `triage` | `list_actionable_content` (optionnel) |
| `guide_somatique` | `propose_actionable_choices`, `open_toolbox_item`, `propose_pulse_card`, `record_pulse_swipe`, `list_actionable_content` |
| `checkin` | `write_mood_entry`, `open_quick_log`, `open_toolbox_item`, `list_actionable_content` |
| `analyse` | `write_journal_entry`, `write_decision`, `open_people_checkin`, `write_relation_note`, `open_toolbox_item`, `list_actionable_content` |
| jung / myss / blavatsky | aucun client tool (KB / lecture) |

---

## Plus tard (optionnel) — Workflow as code

Quand tu auras les IDs `tool_…` :

```ts
import { ElevenLabsClient, Workflow } from "@elevenlabs/elevenlabs-js";

const el = new ElevenLabsClient({ apiKey: process.env.ELEVENLABS_API_KEY });
const agent = await el.conversationalAi.agents.get("agent_5601m6tdhgsbftsvtkz20d9grfvj");
const wf = Workflow.fromAgent(agent);

wf.node("guide_somatique").update({
  prompt: "…texte additional_prompt…",
  toolIds: ["tool_xxx_list", "tool_xxx_open_toolbox", /* … */],
});

await el.conversationalAi.agents.update("agent_5601m6tdhgsbftsvtkz20d9grfvj", {
  workflow: wf.build(),
});
```

Ne pas lancer `install_logos_workflow` en masse tant que le pilote n’est pas validé.

Quand tu auras collé les `tool_…` IDs dans le dashboard, note-les ici pour un futur script SDK :

```
list_actionable_content=
open_toolbox_item=
propose_pulse_card=
record_pulse_swipe=
open_quick_log=
open_people_checkin=
open_decision_capture=
write_decision=
write_journal_entry=
write_mood_entry=
write_relation_note=
```

---

## Test après Publish

1. Compte AEGIS avec `elevenlabs_agent_id` = pilote.
2. `/welcome/voice-agent` → micro.
3. « J’ai besoin d’un exercice ».
4. ElevenLabs **History** → tool calls `list_actionable_content` / `open_toolbox_item`.
5. Modal toolbox dans l’app.
