#!/usr/bin/env node
/**
 * Parse QuestionnaireV4TableauScoring markdown table → questionsV4.ts
 * Usage: node scripts/generate-questions-v4.mjs [path-to-markdown]
 */
import fs from "node:fs";
import path from "node:path";
import { englishOptionLabel } from "../content/archetype-assessment/v4-option-translations-en.mjs";

const ROOT = path.resolve(import.meta.dirname, "..");
const defaultMd = path.join(
  ROOT,
  "content/archetype-assessment/QuestionnaireV4TableauScoring-2606.md",
);
const mdPath = process.argv[2] ? path.resolve(process.argv[2]) : defaultMd;
const outPath = path.join(ROOT, "src/features/archetype-assessment/domain/questionsV4.ts");

const ARCHETYPE_ALIASES = {
  sage: "sage",
  warrior: "warrior",
  lover: "lover",
  sovereign: "sovereign",
  magician: "magician",
  healer: "healer",
  creator: "creator",
  rebel: "rebel",
  caregiver: "caregiver",
  explorer: "explorer",
  mystic: "mystic",
  jester: "jester",
  child: "child",
  victim: "victim",
  saboteur: "saboteur",
  prostitute: "prostitute",
};

const DIMENSION_BY_CODE = {
  D1: "identity",
  D2: "power",
  D3: "relationship",
  D4: "creation",
  D5: "spirituality",
};

const QUESTION_PROMPTS = {
  1: [
    "Face à un effondrement soudain de vos repères (crise personnelle), quelle est votre réaction instinctive ?",
    "Facing a sudden collapse of your bearings (personal crisis), what is your instinctive reaction?",
  ],
  2: [
    "Qu'est-ce qui nourrit le plus profondément votre estime de vous-même au quotidien ?",
    "What nourishes your self-esteem most deeply on a daily basis?",
  ],
  3: [
    "Quelle est votre plus grande peur inavouable, celle qui vous réveille la nuit ?",
    "What is your greatest unspoken fear, the one that wakes you at night?",
  ],
  4: [
    "Face à une émotion douloureuse que vous cachez aux autres, vous tendez à…",
    "Facing a painful emotion you hide from others, you tend to…",
  ],
  5: [
    "Qu'est-ce qui motive le plus profondément vos choix au quotidien ?",
    "What most deeply motivates your daily choices?",
  ],
  6: [
    "Face à une règle ou une autorité qui vous contrarie, vous…",
    "When a rule or authority frustrates you, you…",
  ],
  7: [
    "Face à une décision importante à prendre, vous…",
    "When facing an important decision, you…",
  ],
  8: [
    "En plein conflit ou confrontation, vous…",
    "In the middle of conflict or confrontation, you…",
  ],
  9: [
    "Qu'est-ce qui vous donne le sentiment d'avoir du pouvoir sur votre vie ?",
    "What gives you the feeling of having power over your life?",
  ],
  10: [
    "Après un échec visible ou une humiliation, vous…",
    "After a visible failure or humiliation, you…",
  ],
  11: [
    "Votre rapport à la discipline et à la structure est…",
    "Your relationship to discipline and structure is…",
  ],
  12: [
    "Face à une injustice sociale ou un système oppressif, vous…",
    "Facing social injustice or an oppressive system, you…",
  ],
  13: [
    "Dans un groupe, vous adoptez spontanément le rôle de…",
    "In a group, you spontaneously take on the role of…",
  ],
  14: [
    "Concernant vos frontières relationnelles, vous reconnaissez que…",
    "Regarding your relational boundaries, you recognize that…",
  ],
  15: [
    "Vous exprimez votre amour ou votre affection principalement…",
    "You express love or affection mainly…",
  ],
  16: [
    "Quand on vous demande quelque chose qui dépasse vos limites, vous…",
    "When asked for something beyond your limits, you…",
  ],
  17: [
    "Face à une trahison ou une déception relationnelle, vous…",
    "Facing betrayal or relational disappointment, you…",
  ],
  18: [
    "Ce dont vous avez le plus besoin dans vos relations proches, c'est…",
    "What you need most in close relationships is…",
  ],
  19: [
    "Votre rapport à l'argent est surtout…",
    "Your relationship to money is mostly…",
  ],
  20: [
    "Quand vous créez ou réalisez un projet, vous…",
    "When you create or carry out a project, you…",
  ],
  21: [
    "Face au risque et à l'incertitude, vous…",
    "Facing risk and uncertainty, you…",
  ],
  22: [
    "Face à un dilemme où il faudrait compromettre vos valeurs pour la sécurité, vous…",
    "Facing a dilemma where you'd compromise values for security, you…",
  ],
  23: [
    "Ce que vous souhaitez apporter au monde avant tout, c'est…",
    "What you most want to bring to the world is…",
  ],
  24: [
    "Votre rapport à la perfection dans vos créations est…",
    "Your relationship to perfection in your creations is…",
  ],
  25: [
    "Votre rapport au spirituel, au mystère ou à l'invisible est…",
    "Your relationship to the spiritual, mystery, or invisible is…",
  ],
  26: [
    "Pour transformer une blessure profonde, vous…",
    "To transform a deep wound, you…",
  ],
  27: [
    "Votre rapport à la vérité est…",
    "Your relationship to truth is…",
  ],
  28: [
    "Face aux épreuves irréversibles ou à l'adversité, vous…",
    "Facing irreversible trials or adversity, you…",
  ],
  29: [
    "Votre rapport à la mort est…",
    "Your relationship to death is…",
  ],
  30: [
    "L'héritage que vous souhaitez laisser, c'est surtout…",
    "The legacy you wish to leave is mostly…",
  ],
};

function normalizeArchetype(name) {
  const key = ARCHETYPE_ALIASES[name.toLowerCase()];
  if (!key) throw new Error(`Unknown archetype: ${name}`);
  return key;
}

function parseArchetypeCell(text) {
  const t = text.trim();
  const underscore = t.match(/^(\w+)_Shadow$/i);
  if (underscore) {
    return { archetype: normalizeArchetype(underscore[1]), polarity: "shadow" };
  }
  const paren = t.match(/^(\w+)\s*\(([LS])\)$/i);
  if (paren) {
    return {
      archetype: normalizeArchetype(paren[1]),
      polarity: paren[2].toUpperCase() === "L" ? "light" : "shadow",
    };
  }
  throw new Error(`Cannot parse archetype cell: "${t}"`);
}

function parseTable(md) {
  const questions = new Map();
  const lines = md.split("\n");

  for (const line of lines) {
    if (!line.trim().startsWith("|")) continue;
    if (line.includes(":---") || line.includes("Dimension | Question")) continue;

    const cols = line
      .split("|")
      .map((c) => c.trim())
      .filter((c) => c.length > 0);
    if (cols.length < 7) continue;

    const dimCode = cols[0].toUpperCase();
    const qMatch = cols[1].match(/Q(\d+)/i);
    if (!qMatch) continue;
    const qNum = Number(qMatch[1]);
    const dimension = DIMENSION_BY_CODE[dimCode];
    if (!dimension) throw new Error(`Unknown dimension: ${dimCode}`);

    const optMatch = cols[2].match(/^\*\*([A-F])\.\*\*\s*(.+)$/);
    if (!optMatch) continue;
    const letter = optMatch[1];
    const label_fr = optMatch[2].trim();

    const cells = [cols[3], cols[4], cols[5], cols[6]];
    const points = [2, 1, 2, 1];
    const slots = cells.map((cell, i) => {
      const { archetype, polarity } = parseArchetypeCell(cell);
      return { archetype, polarity, points: points[i] };
    });

    if (!questions.has(qNum)) {
      const [prompt_fr, prompt_en] = QUESTION_PROMPTS[qNum] ?? [
        `Question ${qNum}`,
        `Question ${qNum}`,
      ];
      questions.set(qNum, {
        position: qNum,
        dimension,
        prompt_fr,
        prompt_en,
        options: [],
      });
    }

    questions.get(qNum).options.push({
      position: letter.charCodeAt(0) - 64,
      label_fr,
      label_en: englishOptionLabel(qNum, letter, label_fr),
      vector: {
        primaryLight: slots[0],
        secondaryLight: slots[1],
        primaryShadow: slots[2],
        secondaryShadow: slots[3],
      },
    });
  }

  return [...questions.values()].sort((a, b) => a.position - b.position);
}

function esc(str) {
  return str.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function emitVector(v) {
  const slot = (name, s) =>
    `${name}: { archetype: "${s.archetype}", polarity: "${s.polarity}", points: ${s.points} }`;
  return `{
            ${slot("primaryLight", v.primaryLight)},
            ${slot("secondaryLight", v.secondaryLight)},
            ${slot("primaryShadow", v.primaryShadow)},
            ${slot("secondaryShadow", v.secondaryShadow)},
          }`;
}

function emitTs(questions) {
  const blocks = questions.map((q) => {
    const opts = q.options
      .sort((a, b) => a.position - b.position)
      .map(
        (o) => `        {
          position: ${o.position},
          label_fr: "${esc(o.label_fr)}",
          label_en: "${esc(o.label_en)}",
          vector: ${emitVector(o.vector)},
        }`,
      )
      .join(",\n");

    return `  {
    position: ${q.position},
    dimension: "${q.dimension}",
    prompt_fr: "${esc(q.prompt_fr)}",
    prompt_en: "${esc(q.prompt_en)}",
    options: [
${opts}
    ],
  }`;
  });

  return `/**
 * V4 onboarding — 30 questions × 6 options (180 vecteurs).
 * AUTO-GENERATED from content/archetype-assessment/QuestionnaireV4TableauScoring-2606.md
 * Regenerate: node scripts/generate-questions-v4.mjs
 */
import type { QuestionSeed, V4QuestionSeed } from "./types";
import { SCORING_MODEL_MYSS_V4, v4VectorToPolarityWeights } from "./v4Scoring";

export function v4QuestionsToSeeds(questions: V4QuestionSeed[]): QuestionSeed[] {
  return questions.map((q) => ({
    position: q.position,
    type: "multiple_choice",
    dimension: q.dimension,
    prompt_fr: q.prompt_fr,
    prompt_en: q.prompt_en,
    helper_fr: q.helper_fr,
    helper_en: q.helper_en,
    isRequired: true,
    meta: { intensityEnabled: true, scoringModel: SCORING_MODEL_MYSS_V4 },
    options: q.options.map((o) => ({
      position: o.position,
      label_fr: o.label_fr,
      label_en: o.label_en,
      polarityWeights: v4VectorToPolarityWeights(o.vector),
    })),
  }));
}

export const V4_QUESTIONS: V4QuestionSeed[] = [
${blocks.join(",\n")}
];

export const V4_QUESTION_COUNT = ${questions.length};

export const QUESTIONS_V4 = v4QuestionsToSeeds(V4_QUESTIONS);
`;
}

if (!fs.existsSync(mdPath)) {
  console.error(`Markdown not found: ${mdPath}`);
  process.exit(1);
}

const md = fs.readFileSync(mdPath, "utf8");
const questions = parseTable(md);

if (questions.length !== 30) {
  console.error(`Expected 30 questions, parsed ${questions.length}`);
  process.exit(1);
}

const optionCount = questions.reduce((n, q) => n + q.options.length, 0);
if (optionCount !== 180) {
  console.error(`Expected 180 options, parsed ${optionCount}`);
  process.exit(1);
}

fs.writeFileSync(outPath, emitTs(questions));
console.log(`Wrote ${outPath} — ${questions.length} questions, ${optionCount} options`);
