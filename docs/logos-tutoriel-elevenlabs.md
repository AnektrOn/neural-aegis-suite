# Tutoriel ElevenLabs — LOGOS (pilote)

Ce guide suppose que **tu configures uniquement** l’agent :

`agent_5601m6tdhgsbftsvtkz20d9grfvj`

L’**app AEGIS** (site / mobile) enregistre déjà le code des client tools. Sur ElevenLabs, tu dois **déclarer les mêmes noms** + le **workflow** + les **prompts**. Sans ça, LOGOS parle mais n’ouvre rien dans l’app.

---

## 1. Les trois couches (schéma mental)

| Couche | Où ? | Rôle |
|--------|------|------|
| **Agent + workflow** | Dashboard ElevenLabs | Décide *quand* appeler un outil (triage, check-in, analyse…) |
| **Client tools** | Dashboard ElevenLabs **+** app | L’agent *demande* à l’app d’ouvrir un modal ; l’app *exécute* |
| **Session vocale** | App (`/welcome/voice-agent` ou `/logos`) | WebRTC + micro ; jamais de clé API côté navigateur |

```text
Utilisateur parle → ElevenLabs (LOGOS) → appelle open_toolbox_item
→ l’app ouvre le widget → utilisateur fait la pratique → l’app renvoie "completed"
→ LOGOS reprend une phrase courte
```

**Important :** les noms d’outils sont **sensibles à la casse**. `open_toolbox_item` dans ElevenLabs = exactement pareil dans l’app.

Référence technique : [`logos-client-tools-spec.md`](./logos-client-tools-spec.md)

### JSON prêt à importer (CLI ou copier dans le dashboard)

Dossier : [`docs/elevenlabs/logos-client-tools/`](./elevenlabs/logos-client-tools/)

- Un fichier **par outil** (`open_toolbox_item.json`, etc.) — format officiel ElevenLabs `type: "client"`.
- [`logos-client-tools-all.json`](./elevenlabs/logos-client-tools/logos-client-tools-all.json) — les **11 tools** dans un seul document.
- [`README.md`](./elevenlabs/logos-client-tools/README.md) — boucle `elevenlabs tools add … --config-path`.

**Import dashboard :** Tools → Add tool → **Import from JSON** → colle `docs/elevenlabs/logos-client-tools/open_toolbox_item.json` (etc., **un fichier = un tool**).

Le dashboard n’accepte **pas** le schéma `parameters: { type: "object", properties: … }` (doc CLI). Il faut :

- `parameters`: **tableau** de paramètres (`id`, `type`, `value_type: "llm_prompt"`, …)
- `response_timeout_secs`: **nombre obligatoire** (`20` ou `-1` si attente modal)

Exemple (extrait) :

```json
{
  "type": "client",
  "name": "open_toolbox_item",
  "expects_response": true,
  "response_timeout_secs": -1,
  "parameters": [
    {
      "id": "assignment_id",
      "type": "string",
      "value_type": "llm_prompt",
      "required": false,
      "description": "UUID assignation"
    }
  ]
}
```

---

## 2. Avant d’ouvrir ElevenLabs

1. Ton compte de test dans Supabase doit avoir  
   `profiles.elevenlabs_agent_id` = `agent_5601m6tdhgsbftsvtkz20d9grfvj`  
   (ou une ligne dans `user_agents` avec le même ID).
2. Dans l’app : connecte-toi avec ce compte → **Mon agent vocal** ou **`/logos`**.
3. Autorise le **micro** quand tu démarres l’appel.

---

## 3. Où aller sur ElevenLabs

1. Connecte-toi sur [elevenlabs.io](https://elevenlabs.io).
2. Menu **Agents** (ou **Conversational AI** / **ElevenAgents** selon le libellé actuel).
3. Ouvre l’agent dont l’ID est **`agent_5601m6tdhgsbftsvtkz20d9grfvj`**  
   (souvent visible dans l’URL ou les paramètres de l’agent).
4. Renomme l’agent **LOGOS** si ce n’est pas déjà fait — c’est le nom produit côté AEGIS.

---

## 4. Créer les client tools (étape la plus longue)

Pour **chaque** outil ci-dessous :

1. Onglet **Tools** (ou section Outils de l’agent).
2. **Add tool** → type **Client** (pas Webhook).
3. Remplis **Name**, **Description**, **Parameters**.
4. Pour les outils marqués **⏸ Attendre la réponse** : active **Wait for response** / **expects response**  
   → l’agent **se tait** tant que l’utilisateur n’a pas fermé le modal (pas de gaspillage de tokens en parlant par-dessus).

### 4.1 `list_actionable_content`

- **Attendre la réponse :** non  
- **Description :** Liste les assignations toolbox et cartes pulse ouvrables pour cet utilisateur (pas de liens externes ni vidéos). À utiliser avant de proposer 2–3 choix à l’utilisateur.  
- **Paramètres :**
  - `intent` (string, optionnel) — ex. `regulation`, `protocol`, `pulse`
  - `limit` (number, optionnel) — max 8, défaut 5

### 4.2 `open_toolbox_item` ⏸

- **Attendre la réponse :** **oui**  
- **Description :** Ouvre un exercice toolbox assigné dans l’app. Ne pas décrire les étapes à la voix : l’utilisateur fait la pratique dans l’UI. Retourne completed, abandoned ou closed.  
- **Paramètres :**
  - `assignment_id` (string, optionnel) — UUID de l’assignation
  - `slug` (string, optionnel) — fragment du titre si l’ID est inconnu  
  → au moins un des deux si possible

### 4.3 `propose_pulse_card` ⏸

- **Attendre la réponse :** **oui**  
- **Description :** Affiche une carte Pulse (assimiler au grimoire ou ignorer). Pour proposer une pulse du jour.  
- **Paramètres :**
  - `card_id` (string, optionnel) — sinon la première carte du deck

### 4.4 `record_pulse_swipe`

- **Attendre la réponse :** non  
- **Description :** Enregistre un swipe Pulse sans ouvrir l’UI complète.  
- **Paramètres :**
  - `card_id` (string, requis)
  - `action` (string, requis) — `assimilated` ou `ignored`

### 4.5 `open_quick_log` ⏸

- **Attendre la réponse :** **oui**  
- **Description :** Ouvre le tiroir humeur / sommeil / stress dans l’app.  
- **Paramètres :** aucun (objet vide)

### 4.6 `open_people_checkin` ⏸

- **Attendre la réponse :** **oui**  
- **Description :** Ouvre le formulaire relation (People board) pour noter qualité et note sur un contact.  
- **Paramètres :**
  - `contact_id` (string, optionnel)
  - `contact_name` (string, optionnel) — ex. Sophie

### 4.7 `open_decision_capture` ⏸

- **Attendre la réponse :** **oui**  
- **Description :** Rappel UI décision ; l’enregistrement se fait surtout via `write_decision`.  
- **Paramètres :** aucun

### 4.8 `write_decision`

- **Attendre la réponse :** non  
- **Paramètres :** `name` (requis), `priority` (1–10), `responsibility` (1–10)

### 4.9 `write_journal_entry`

- **Attendre la réponse :** non  
- **Paramètres :** `title` (requis), `content` (requis), `tags` (array of string, optionnel)

### 4.10 `write_mood_entry`

- **Attendre la réponse :** non  
- **Paramètres :** `value` (1–10, requis), `sleep` (number, optionnel), `stress` (number, optionnel)

### 4.11 `write_relation_note`

- **Attendre la réponse :** non  
- **Paramètres :** `contact_id` ou `contact_name`, `quality` (1–10), `note` (string)

### Attacher les tools à l’agent

Après création, chaque tool doit être **activé / rattaché** à l’agent LOGOS (liste **Tool IDs** dans le prompt de l’agent, ou cases à cocher « assign to agent » selon l’UI).

**Tous les 11 outils** doivent être disponibles pour les nœuds qui en ont besoin (voir section 6).

---

## 5. Workflow (graphe de nœuds)

LOGOS route la conversation entre **sous-agents** :

```text
start → triage → guide_somatique | checkin | analyse | (jung, myss, blavatsky) | end
```

### Attention — deux formats

- Le fichier repo [`logos-workflow.json`](../supabase/functions/elevenlabs-knowledge/logos-workflow.json) est le **wire format API** (`override_agent` + `additional_prompt`). Il **n’inclut pas** encore les `tool_ids`.
- La doc ElevenLabs **« Workflows as code »** construit le graphe avec `Workflow().converse(..., { toolIds })` — autre API, même idée.

**Ne colle pas** le JSON repo dans un script `Workflow()` sans conversion.  
**Guide dédié :** [`elevenlabs/logos-workflow-next-steps.md`](./elevenlabs/logos-workflow-next-steps.md)

### Après avoir créé les client tools (toi maintenant)

1. Assigne les **11 tools** à l’agent (niveau agent) → **Publish**.
2. Dans le **workflow visuel**, colle les `additional_prompt` depuis `logos-workflow.json` sur triage / guide_somatique / checkin / analyse.
3. (Optionnel) Restreins les tools **par nœud** selon la carte du guide next-steps.
4. **Publish** → teste `/welcome/voice-agent`.

### Option admin AEGIS (plus tard)

`install_logos_workflow` pousse le graphe wire format sur **un** user — pas en masse tant que le pilote n’est pas validé.

---

## 6. Quels tools sur quels nœuds ?

Dans le **prompt système** ou les **instructions du nœud** (dashboard), précise :

| Nœud | Comportement | Tools |
|------|--------------|-------|
| **triage** | 1 phrase, route seulement | `list_actionable_content` (optionnel) |
| **guide_somatique** | List → choix → ouvrir UI, **jamais** lire un protocole à voix haute | list, open_toolbox_item, propose_pulse_card, record_pulse_swipe |
| **checkin** | Relevé humeur/sommeil/stress + ouverture régulation si besoin | write_mood_entry, open_quick_log, open_toolbox_item |
| **analyse** | Hypothèses, journal, people, ancrage UI | write_journal_entry, write_decision, open_people_checkin, write_relation_note, open_toolbox_item |

Dynamic variable utile : `{{first_name}}` dans le first message et les prompts.

---

## 7. First message & identité

Exemple (déjà dans le repo) :

> LOGOS en ligne. Qu'est-ce que je traite pour toi, {{first_name}} ?

Rappel dans le **system prompt** (agent ou nœuds) :

- LOGOS = **passerelle** vers l’app Neural Aegis.
- **Interdit** : dérouler protocoles/pulses à la voix ; ouvrir liens externes / vidéos.
- **Autorisé** : prendre l’initiative, lister 2–3 contenus, attendre, ouvrir modal, reprendre en 1–2 phrases après fermeture.

---

## 8. Tester (checklist)

1. **App** : compte pilote → `/welcome/voice-agent` → **Parler à mon agent**.
2. **ElevenLabs** : onglet **History / Conversations** → ouvre l’appel → tu dois voir les **tool calls** (`open_toolbox_item`, etc.).
3. **Scénario toolbox**  
   - « J’ai besoin d’un exercice »  
   - LOGOS devrait appeler `list_actionable_content` puis `open_toolbox_item`  
   - Le modal toolbox s’ouvre dans l’app → tu fermes → LOGOS débriefe brièvement.
4. **Scénario pulse**  
   - « Propose-moi une pulse »  
   - `propose_pulse_card` → modal Assimiler / Ignorer.
5. **Scénario check-in**  
   - « Mon stress est à 8 »  
   - `write_mood_entry` ou `open_quick_log`.

### Si rien ne s’ouvre dans l’app

| Symptôme | Cause probable |
|----------|----------------|
| L’agent dit qu’il ouvre quelque chose, rien à l’écran | Nom du tool différent entre ElevenLabs et l’app (typo, casse) |
| Erreur « tool not found » dans la console navigateur | Tool non créé ou non attaché à l’agent |
| Appel impossible | `agent-session` non déployé ou mauvais `elevenlabs_agent_id` sur le profil |
| Modal toolbox ne s’ouvre pas sur Welcome | Normal si tu es hors shell : Welcome a son propre `LogosVoiceShell` ; utilise `/welcome/voice-agent` |

Ouvre la **console développeur** (F12) pendant l’appel : erreurs `onUnhandledClientToolCall` = nom d’outil inconnu côté app.

---

## 9. Ordre conseillé (première fois)

1. Créer **2 outils** seulement : `list_actionable_content` + `open_toolbox_item` (wait response = oui pour open).
2. Les attacher à l’agent pilote.
3. Dans le prompt du nœud **guide_somatique**, copier le texte depuis `logos-workflow.json`.
4. Tester un appel réel.
5. Ajouter les autres tools un par un (pulse, mood, journal, people).
6. Quand tout est stable, aligner le workflow complet dans ElevenLabs avec le JSON du repo.

---

## 10. Liens utiles dans le repo

- Spec outils : [`logos-client-tools-spec.md`](./logos-client-tools-spec.md)  
- Sync pilote : [`logos-workflow-pilot-sync.md`](./logos-workflow-pilot-sync.md)  
- Session vocale / deploy : [`elevenlabs-voice-agent.md`](./elevenlabs-voice-agent.md)  
- Doc ElevenLabs : [Client tools](https://elevenlabs.io/docs/eleven-agents/customization/tools/client-tools)

---

## FAQ rapide

**C’est quoi la différence webhook vs client ?**  
Webhook = ton serveur. Client = **l’app de l’utilisateur** (modals, Supabase, toolbox). LOGOS utilise **client** uniquement pour l’UI.

**Pourquoi « Wait for response » ?**  
Pour que LOGOS **attende** que l’utilisateur finit le modal avant de reparler — et pour ne pas enchaîner des tours coûteux pendant la pratique.

**Je dois refaire ça pour chaque utilisateur ?**  
Non pour les **tools** (même agent). Oui pour **l’agent_id** par user si chaque membre a son propre agent ElevenLabs — le pilote est **un seul** ID pour l’instant.

**install_logos_workflow ?**  
Uniquement quand tu veux pousser le graphe workflow sur l’agent d’un user depuis l’admin AEGIS — pas de déploiement massif avant validation.
