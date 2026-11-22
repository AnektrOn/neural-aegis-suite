# LOGOS — sync workflow pilote

**Agent :** `agent_5601m6tdhgsbftsvtkz20d9grfvj`

## Procédure

1. Modifier workflow + client tools sur l’agent dans le dashboard ElevenLabs (source de vérité opérationnelle).
2. Valider vocalement : list → open toolbox → wait → debrief ; pulse propose ; check-in write.
3. Exporter / aligner le fichier repo [`logos-workflow.json`](../supabase/functions/elevenlabs-knowledge/logos-workflow.json) avec les `additional_prompt` validés.
4. **Ne pas** appeler `install_logos_workflow` pour d’autres utilisateurs avant validation produit.

## Compte de test app

`profiles.elevenlabs_agent_id` ou `user_agents.elevenlabs_agent_id` doit être `agent_5601m6tdhgsbftsvtkz20d9grfvj`.

Routes de test :

- `/welcome/voice-agent` (Welcome)
- `/logos` (membre sous `AppLayout`)

## Client tools

- Tutoriel pas à pas (fr) : [`logos-tutoriel-elevenlabs.md`](./logos-tutoriel-elevenlabs.md)
- Spec complète : [`logos-client-tools-spec.md`](./logos-client-tools-spec.md)
- IDs workspace : [`elevenlabs/logos-client-tools/tool-ids.json`](./elevenlabs/logos-client-tools/tool-ids.json)

## Preuve d’invocation (app)

Pendant un appel, la console doit montrer `[logos-client-tool] <name> invoke` puis `result`.  
Sans cette ligne, le modal ne peut pas s’ouvrir — problème côté agent (edge / tool call), pas React.

## QA transcript

```bash
node scripts/assert-logos-transcript-tools.mjs transcript.json
```

Checklist live : [`LOGOS_LIVE_VALIDATION.md`](./LOGOS_LIVE_VALIDATION.md)
