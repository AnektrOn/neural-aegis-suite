# Archetype Assessment Module

Self-contained module under `src/features/archetype-assessment/`.

## Structure

```
src/features/archetype-assessment/
├── domain/
│   ├── archetypes.ts          # 12 archetypes (Myss-inspired)
│   ├── questions.ts           # 30 questions across 7 dimensions
│   ├── tools.ts               # 25 tools mapped to existing widgets when applicable
│   ├── rules.ts               # 15 explicit recommendation rules
│   ├── scoringEngine.ts       # PURE: computeRawScores, normalizeScores, rankArchetypes,
│   │                          #       computeDimensionScores, detectShadowSignals,
│   │                          #       buildAnalysisResult
│   ├── recommendationEngine.ts# PURE: matchTools, applyRules, buildRationale, selectTopTools
│   └── types.ts               # ArchetypeKey, DimensionKey, ShadowKey, ToolType, …
├── services/
│   └── assessmentService.ts   # All Supabase I/O (loadActiveTemplate, createSession,
│                              # submitSession, getSessionFullDetails, …)
├── hooks/
│   └── useAssessmentSession.ts# Local multi-step state
├── pages/
│   ├── AssessmentFlow.tsx     # /onboarding/assessment
│   └── AssessmentResults.tsx  # /onboarding/results
├── components/
│   └── AssessmentCTA.tsx      # Dashboard card
└── __tests__/scoringEngine.test.ts
```

Admin view: `src/pages/admin/AdminAssessments.tsx` → `/admin/assessments`.

## Database

Eight tables (see migration): `assessment_templates`, `assessment_questions`,
`assessment_options`, `assessment_sessions`, `assessment_responses`,
`archetype_scores`, `analysis_results`, `recommendation_tools`.

RLS: students see only their own sessions/responses/scores/analysis/recommendations.
Admins read everything and manage templates/questions/options.

The TS `domain/` files are the **single source of truth**. Questions are seeded
into the DB on first load by `loadActiveTemplate()`.

## Add a new archetype

1. Append a new entry in `domain/archetypes.ts` with all bilingual fields and an HSL color.
2. Add it to `ArchetypeKey` and `ArchetypeFamily` unions in `domain/types.ts`.
3. Reference it in `archetypeWeights` of options in `domain/questions.ts`.
4. (Optional) Add tools that target it in `domain/tools.ts`.
5. (Optional) Add a rule in `domain/rules.ts`.
6. Run `vitest run src/features/archetype-assessment` — no DB migration needed.

## Add a new question

1. Append to `domain/questions.ts` (next `position`, type, prompts, options).
2. Delete existing rows of `assessment_questions` for `template-v1` if you want
   the seeder to re-run (it only seeds when the table is empty for the template).
   For production, bump the template version and create a new template row.

## Add a new tool

1. Append to `domain/tools.ts`. Set `widgetKey` if it maps to an existing
   `Toolbox` widget (e.g. `BreathworkWidget`).
2. Add or update a rule in `domain/rules.ts` to surface it.

## Add a new recommendation rule

```ts
{
  key: "rule_my_new_rule",
  description: "Plain English rationale shown in admin.",
  match: ({ topArchetypes, dimensionScores, shadowSignals }) => /* boolean */,
  toolKeys: ["tool_a", "tool_b"],
  weight: 2, // bonus added to the tool score when the rule fires
}
```

Rules are pure functions — easy to unit test, reorder, or feature-flag.

## Tests

```
bunx vitest run src/features/archetype-assessment/__tests__/scoringEngine.test.ts
```

15 tests cover scoring (raw, normalize, rank, dimensions, shadow), the full
`buildAnalysisResult` pipeline and the recommendation engine.

## Routes

- `/onboarding/assessment` — student flow (welcome → questions → review → submit)
- `/onboarding/results` — student results (radar + top 3 + tools)
- `/admin/assessments` — admin list + detail
