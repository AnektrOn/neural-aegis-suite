/**
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
  {
    position: 1,
    dimension: "identity",
    prompt_fr: "Face à un effondrement soudain de vos repères (crise personnelle), quelle est votre réaction instinctive ?",
    prompt_en: "Facing a sudden collapse of your bearings (personal crisis), what is your instinctive reaction?",
    options: [
        {
          position: 1,
          label_fr: "J'analyse la mécanique de la crise pour en comprendre la logique, quitte à me couper de mes émotions.",
          label_en: "I dissect the crisis to grasp its mechanics, even if it distances me from my feelings.",
          vector: {
            primaryLight: { archetype: "sage", polarity: "light", points: 2 },
            secondaryLight: { archetype: "magician", polarity: "light", points: 1 },
            primaryShadow: { archetype: "child", polarity: "shadow", points: 2 },
            secondaryShadow: { archetype: "lover", polarity: "shadow", points: 1 },
          },
        },
        {
          position: 2,
          label_fr: "Je verrouille le périmètre et prends les commandes pour empêcher le chaos d'atteindre les miens.",
          label_en: "I seal the perimeter and take command so chaos cannot reach my people.",
          vector: {
            primaryLight: { archetype: "sovereign", polarity: "light", points: 2 },
            secondaryLight: { archetype: "warrior", polarity: "light", points: 1 },
            primaryShadow: { archetype: "caregiver", polarity: "shadow", points: 2 },
            secondaryShadow: { archetype: "mystic", polarity: "shadow", points: 1 },
          },
        },
        {
          position: 3,
          label_fr: "Je cherche l'origine de l'injustice pour désigner le responsable de cette souffrance.",
          label_en: "I hunt down the root injustice to hold someone accountable for the suffering.",
          vector: {
            primaryLight: { archetype: "rebel", polarity: "light", points: 2 },
            secondaryLight: { archetype: "explorer", polarity: "light", points: 1 },
            primaryShadow: { archetype: "victim", polarity: "shadow", points: 2 },
            secondaryShadow: { archetype: "saboteur", polarity: "shadow", points: 1 },
          },
        },
        {
          position: 4,
          label_fr: "Je vois immédiatement l'opportunité de tout raser pour reconstruire quelque chose de plus grand.",
          label_en: "I immediately see the chance to raze everything and rebuild something greater.",
          vector: {
            primaryLight: { archetype: "creator", polarity: "light", points: 2 },
            secondaryLight: { archetype: "rebel", polarity: "light", points: 1 },
            primaryShadow: { archetype: "saboteur", polarity: "shadow", points: 2 },
            secondaryShadow: { archetype: "sovereign", polarity: "shadow", points: 1 },
          },
        },
        {
          position: 5,
          label_fr: "Je plonge dans mon intériorité, cherchant le sens spirituel de cette épreuve imposée par l'univers.",
          label_en: "I retreat inward to find the spiritual meaning of this trial the universe imposed.",
          vector: {
            primaryLight: { archetype: "mystic", polarity: "light", points: 2 },
            secondaryLight: { archetype: "healer", polarity: "light", points: 1 },
            primaryShadow: { archetype: "prostitute", polarity: "shadow", points: 2 },
            secondaryShadow: { archetype: "warrior", polarity: "shadow", points: 1 },
          },
        },
        {
          position: 6,
          label_fr: "Je dédramatise par l'humour ou je fuis la situation en espérant qu'elle se résorbe d'elle-même.",
          label_en: "I downplay it with humor or escape it, hoping it simply fades away.",
          vector: {
            primaryLight: { archetype: "jester", polarity: "light", points: 2 },
            secondaryLight: { archetype: "child", polarity: "light", points: 1 },
            primaryShadow: { archetype: "explorer", polarity: "shadow", points: 2 },
            secondaryShadow: { archetype: "sage", polarity: "shadow", points: 1 },
          },
        }
    ],
  },
  {
    position: 2,
    dimension: "identity",
    prompt_fr: "Qu'est-ce qui nourrit le plus profondément votre estime de vous-même au quotidien ?",
    prompt_en: "What nourishes your self-esteem most deeply on a daily basis?",
    options: [
        {
          position: 1,
          label_fr: "Ma capacité à rester intègre et à ne jamais me vendre, peu importe la pression.",
          label_en: "My ability to stay true to myself and never sell out, no matter the pressure.",
          vector: {
            primaryLight: { archetype: "prostitute", polarity: "light", points: 2 },
            secondaryLight: { archetype: "sovereign", polarity: "light", points: 1 },
            primaryShadow: { archetype: "jester", polarity: "shadow", points: 2 },
            secondaryShadow: { archetype: "lover", polarity: "shadow", points: 1 },
          },
        },
        {
          position: 2,
          label_fr: "Ma liberté de mouvement, d'esprit et l'absence de contraintes pesantes.",
          label_en: "My freedom of movement and thought, and the lack of heavy constraints.",
          vector: {
            primaryLight: { archetype: "explorer", polarity: "light", points: 2 },
            secondaryLight: { archetype: "rebel", polarity: "light", points: 1 },
            primaryShadow: { archetype: "victim", polarity: "shadow", points: 2 },
            secondaryShadow: { archetype: "sovereign", polarity: "shadow", points: 1 },
          },
        },
        {
          position: 3,
          label_fr: "Le dévouement que je porte aux autres et la sécurité que je leur apporte.",
          label_en: "The devotion I pour into others and the safety I offer them.",
          vector: {
            primaryLight: { archetype: "caregiver", polarity: "light", points: 2 },
            secondaryLight: { archetype: "lover", polarity: "light", points: 1 },
            primaryShadow: { archetype: "child", polarity: "shadow", points: 2 },
            secondaryShadow: { archetype: "prostitute", polarity: "shadow", points: 1 },
          },
        },
        {
          position: 4,
          label_fr: "Ma discipline, ma capacité à atteindre mes objectifs et à affronter la douleur.",
          label_en: "My discipline, the way I chase goals and stare down pain.",
          vector: {
            primaryLight: { archetype: "warrior", polarity: "light", points: 2 },
            secondaryLight: { archetype: "creator", polarity: "light", points: 1 },
            primaryShadow: { archetype: "saboteur", polarity: "shadow", points: 2 },
            secondaryShadow: { archetype: "mystic", polarity: "shadow", points: 1 },
          },
        },
        {
          position: 5,
          label_fr: "Ma capacité à transformer les situations sombres en or, à alchimiser les énergies.",
          label_en: "My talent for turning dark situations into gold, alchemizing the energy.",
          vector: {
            primaryLight: { archetype: "magician", polarity: "light", points: 2 },
            secondaryLight: { archetype: "healer", polarity: "light", points: 1 },
            primaryShadow: { archetype: "child", polarity: "shadow", points: 2 },
            secondaryShadow: { archetype: "victim", polarity: "shadow", points: 1 },
          },
        },
        {
          position: 6,
          label_fr: "La sagesse accumulée, la connaissance claire et ma transmission de la vérité.",
          label_en: "The wisdom I've gathered, the clarity of my knowledge, and how I pass on truth.",
          vector: {
            primaryLight: { archetype: "sage", polarity: "light", points: 2 },
            secondaryLight: { archetype: "mystic", polarity: "light", points: 1 },
            primaryShadow: { archetype: "explorer", polarity: "shadow", points: 2 },
            secondaryShadow: { archetype: "rebel", polarity: "shadow", points: 1 },
          },
        }
    ],
  },
  {
    position: 3,
    dimension: "identity",
    prompt_fr: "Quelle est votre plus grande peur inavouable, celle qui vous réveille la nuit ?",
    prompt_en: "What is your greatest unspoken fear, the one that wakes you at night?",
    options: [
        {
          position: 1,
          label_fr: "La trahison, perdre le contrôle et voir mon empire s'effondrer.",
          label_en: "Betrayal, losing command, watching my realm collapse.",
          vector: {
            primaryLight: { archetype: "sovereign", polarity: "shadow", points: 2 },
            secondaryLight: { archetype: "warrior", polarity: "shadow", points: 1 },
            primaryShadow: { archetype: "child", polarity: "light", points: 2 },
            secondaryShadow: { archetype: "victim", polarity: "light", points: 1 },
          },
        },
        {
          position: 2,
          label_fr: "Être pris au piège, enfermé dans une routine ou des obligations étouffantes.",
          label_en: "Being trapped, chained to routine or suffocating duties.",
          vector: {
            primaryLight: { archetype: "explorer", polarity: "shadow", points: 2 },
            secondaryLight: { archetype: "rebel", polarity: "shadow", points: 1 },
            primaryShadow: { archetype: "caregiver", polarity: "light", points: 2 },
            secondaryShadow: { archetype: "lover", polarity: "light", points: 1 },
          },
        },
        {
          position: 3,
          label_fr: "L'abandon, ne plus être aimé, ou découvrir que je n'ai pas de valeur sans l'autre.",
          label_en: "Abandonment, falling out of love, realizing I have no worth without another.",
          vector: {
            primaryLight: { archetype: "lover", polarity: "shadow", points: 2 },
            secondaryLight: { archetype: "child", polarity: "shadow", points: 1 },
            primaryShadow: { archetype: "sovereign", polarity: "light", points: 2 },
            secondaryShadow: { archetype: "sage", polarity: "light", points: 1 },
          },
        },
        {
          position: 4,
          label_fr: "Ne pas être à la hauteur, rater mon chef-d'œuvre, l'inutilité de mon action.",
          label_en: "Not measuring up, failing my masterpiece, feeling like my effort is useless.",
          vector: {
            primaryLight: { archetype: "creator", polarity: "shadow", points: 2 },
            secondaryLight: { archetype: "sage", polarity: "shadow", points: 1 },
            primaryShadow: { archetype: "jester", polarity: "light", points: 2 },
            secondaryShadow: { archetype: "mystic", polarity: "light", points: 1 },
          },
        },
        {
          position: 5,
          label_fr: "Le vide existentiel, perdre ma connexion au divin ou devenir fou.",
          label_en: "The existential void—losing touch with the divine or slipping into madness.",
          vector: {
            primaryLight: { archetype: "mystic", polarity: "shadow", points: 2 },
            secondaryLight: { archetype: "healer", polarity: "shadow", points: 1 },
            primaryShadow: { archetype: "magician", polarity: "light", points: 2 },
            secondaryShadow: { archetype: "warrior", polarity: "light", points: 1 },
          },
        },
        {
          position: 6,
          label_fr: "Être abusé(e), qu'on se serve de moi sans que je puisse me défendre.",
          label_en: "Being used or abused with no way to defend myself.",
          vector: {
            primaryLight: { archetype: "victim", polarity: "shadow", points: 2 },
            secondaryLight: { archetype: "prostitute", polarity: "shadow", points: 1 },
            primaryShadow: { archetype: "rebel", polarity: "light", points: 2 },
            secondaryShadow: { archetype: "explorer", polarity: "light", points: 1 },
          },
        }
    ],
  },
  {
    position: 4,
    dimension: "identity",
    prompt_fr: "Face à une émotion douloureuse que vous cachez aux autres, vous tendez à…",
    prompt_en: "Facing a painful emotion you hide from others, you tend to…",
    options: [
        {
          position: 1,
          label_fr: "Je l'intellectualise pour ne pas la ressentir directement.",
          label_en: "I intellectualize it so I don't have to feel it directly.",
          vector: {
            primaryLight: { archetype: "sage", polarity: "shadow", points: 2 },
            secondaryLight: { archetype: "magician", polarity: "shadow", points: 1 },
            primaryShadow: { archetype: "child", polarity: "light", points: 2 },
            secondaryShadow: { archetype: "lover", polarity: "light", points: 1 },
          },
        },
        {
          position: 2,
          label_fr: "Je la cache sous une armure d'invincibilité ou d'autorité.",
          label_en: "I hide it behind a facade of invincibility or authority.",
          vector: {
            primaryLight: { archetype: "warrior", polarity: "shadow", points: 2 },
            secondaryLight: { archetype: "sovereign", polarity: "shadow", points: 1 },
            primaryShadow: { archetype: "caregiver", polarity: "light", points: 2 },
            secondaryShadow: { archetype: "healer", polarity: "light", points: 1 },
          },
        },
        {
          position: 3,
          label_fr: "Je m'en sers inconsciemment pour attirer l'attention ou l'aide.",
          label_en: "I unconsciously wield it to draw attention or summon support.",
          vector: {
            primaryLight: { archetype: "victim", polarity: "shadow", points: 2 },
            secondaryLight: { archetype: "child", polarity: "shadow", points: 1 },
            primaryShadow: { archetype: "explorer", polarity: "light", points: 2 },
            secondaryShadow: { archetype: "rebel", polarity: "light", points: 1 },
          },
        },
        {
          position: 4,
          label_fr: "Je la sublime à travers une création ou un projet.",
          label_en: "I channel it into a creation or project.",
          vector: {
            primaryLight: { archetype: "creator", polarity: "light", points: 2 },
            secondaryLight: { archetype: "magician", polarity: "light", points: 1 },
            primaryShadow: { archetype: "saboteur", polarity: "shadow", points: 2 },
            secondaryShadow: { archetype: "prostitute", polarity: "shadow", points: 1 },
          },
        },
        {
          position: 5,
          label_fr: "Je l'accepte comme un portail vers une guérison plus profonde.",
          label_en: "I accept it as a gateway to deeper healing.",
          vector: {
            primaryLight: { archetype: "healer", polarity: "light", points: 2 },
            secondaryLight: { archetype: "mystic", polarity: "light", points: 1 },
            primaryShadow: { archetype: "sovereign", polarity: "shadow", points: 2 },
            secondaryShadow: { archetype: "warrior", polarity: "shadow", points: 1 },
          },
        },
        {
          position: 6,
          label_fr: "Je fais de l'auto-dérision pour désamorcer la tension.",
          label_en: "I laugh at myself to defuse the tension.",
          vector: {
            primaryLight: { archetype: "jester", polarity: "light", points: 2 },
            secondaryLight: { archetype: "prostitute", polarity: "light", points: 1 },
            primaryShadow: { archetype: "victim", polarity: "shadow", points: 2 },
            secondaryShadow: { archetype: "caregiver", polarity: "shadow", points: 1 },
          },
        }
    ],
  },
  {
    position: 5,
    dimension: "identity",
    prompt_fr: "Qu'est-ce qui motive le plus profondément vos choix au quotidien ?",
    prompt_en: "What most deeply motivates your daily choices?",
    options: [
        {
          position: 1,
          label_fr: "Comprendre le \"pourquoi\" de chaque chose.",
          label_en: "Understanding the ‘why’ behind everything.",
          vector: {
            primaryLight: { archetype: "sage", polarity: "light", points: 2 },
            secondaryLight: { archetype: "explorer", polarity: "light", points: 1 },
            primaryShadow: { archetype: "child", polarity: "shadow", points: 2 },
            secondaryShadow: { archetype: "victim", polarity: "shadow", points: 1 },
          },
        },
        {
          position: 2,
          label_fr: "Être au contrôle absolu de mon environnement.",
          label_en: "Being in absolute control of my surroundings.",
          vector: {
            primaryLight: { archetype: "sovereign", polarity: "light", points: 2 },
            secondaryLight: { archetype: "magician", polarity: "light", points: 1 },
            primaryShadow: { archetype: "victim", polarity: "shadow", points: 2 },
            secondaryShadow: { archetype: "mystic", polarity: "shadow", points: 1 },
          },
        },
        {
          position: 3,
          label_fr: "Me sentir indispensable et utile aux autres.",
          label_en: "Feeling indispensable and truly useful to others.",
          vector: {
            primaryLight: { archetype: "caregiver", polarity: "light", points: 2 },
            secondaryLight: { archetype: "healer", polarity: "light", points: 1 },
            primaryShadow: { archetype: "prostitute", polarity: "shadow", points: 2 },
            secondaryShadow: { archetype: "lover", polarity: "shadow", points: 1 },
          },
        },
        {
          position: 4,
          label_fr: "Détruire ce qui est faux ou transgresser les règles.",
          label_en: "Destroying what is false or breaking the rules.",
          vector: {
            primaryLight: { archetype: "rebel", polarity: "light", points: 2 },
            secondaryLight: { archetype: "jester", polarity: "light", points: 1 },
            primaryShadow: { archetype: "sovereign", polarity: "shadow", points: 2 },
            secondaryShadow: { archetype: "caregiver", polarity: "shadow", points: 1 },
          },
        },
        {
          position: 5,
          label_fr: "Fusionner avec l'autre ou avec une cause absolue.",
          label_en: "Merging with another or surrendering to a higher cause.",
          vector: {
            primaryLight: { archetype: "lover", polarity: "light", points: 2 },
            secondaryLight: { archetype: "mystic", polarity: "light", points: 1 },
            primaryShadow: { archetype: "explorer", polarity: "shadow", points: 2 },
            secondaryShadow: { archetype: "prostitute", polarity: "shadow", points: 1 },
          },
        },
        {
          position: 6,
          label_fr: "Prouver ma valeur par l'effort et la conquête.",
          label_en: "Proving my worth through effort and conquest.",
          vector: {
            primaryLight: { archetype: "warrior", polarity: "light", points: 2 },
            secondaryLight: { archetype: "creator", polarity: "light", points: 1 },
            primaryShadow: { archetype: "child", polarity: "shadow", points: 2 },
            secondaryShadow: { archetype: "saboteur", polarity: "shadow", points: 1 },
          },
        }
    ],
  },
  {
    position: 6,
    dimension: "identity",
    prompt_fr: "Face à une règle ou une autorité qui vous contrarie, vous…",
    prompt_en: "When a rule or authority frustrates you, you…",
    options: [
        {
          position: 1,
          label_fr: "Je la respecte si elle est logique, sinon je la contourne.",
          label_en: "I respect it when it makes sense; otherwise, I sidestep it.",
          vector: {
            primaryLight: { archetype: "sage", polarity: "light", points: 2 },
            secondaryLight: { archetype: "magician", polarity: "light", points: 1 },
            primaryShadow: { archetype: "rebel", polarity: "shadow", points: 2 },
            secondaryShadow: { archetype: "child", polarity: "shadow", points: 1 },
          },
        },
        {
          position: 2,
          label_fr: "Je veux être l'autorité. Je tolère mal de recevoir des ordres.",
          label_en: "I want to be the authority and resent taking orders.",
          vector: {
            primaryLight: { archetype: "sovereign", polarity: "light", points: 2 },
            secondaryLight: { archetype: "warrior", polarity: "light", points: 1 },
            primaryShadow: { archetype: "victim", polarity: "shadow", points: 2 },
            secondaryShadow: { archetype: "prostitute", polarity: "shadow", points: 1 },
          },
        },
        {
          position: 3,
          label_fr: "Je m'y soumets par peur du rejet, quitte à nourrir du ressentiment.",
          label_en: "I submit out of fear of rejection, even if it builds resentment.",
          vector: {
            primaryLight: { archetype: "child", polarity: "shadow", points: 2 },
            secondaryLight: { archetype: "caregiver", polarity: "shadow", points: 1 },
            primaryShadow: { archetype: "rebel", polarity: "light", points: 2 },
            secondaryShadow: { archetype: "warrior", polarity: "light", points: 1 },
          },
        },
        {
          position: 4,
          label_fr: "Je m'y oppose systématiquement pour tester ses limites.",
          label_en: "I push back every time to test its limits.",
          vector: {
            primaryLight: { archetype: "rebel", polarity: "shadow", points: 2 },
            secondaryLight: { archetype: "saboteur", polarity: "shadow", points: 1 },
            primaryShadow: { archetype: "sovereign", polarity: "light", points: 2 },
            secondaryShadow: { archetype: "sage", polarity: "light", points: 1 },
          },
        },
        {
          position: 5,
          label_fr: "Je ne la vois même pas, je vis selon mes propres lois intérieures.",
          label_en: "I barely notice it—I live by my own inner laws.",
          vector: {
            primaryLight: { archetype: "explorer", polarity: "light", points: 2 },
            secondaryLight: { archetype: "mystic", polarity: "light", points: 1 },
            primaryShadow: { archetype: "victim", polarity: "shadow", points: 2 },
            secondaryShadow: { archetype: "caregiver", polarity: "shadow", points: 1 },
          },
        },
        {
          position: 6,
          label_fr: "Je m'en moque ouvertement et souligne son absurdité.",
          label_en: "I openly mock it and point out its absurdity.",
          vector: {
            primaryLight: { archetype: "jester", polarity: "light", points: 2 },
            secondaryLight: { archetype: "prostitute", polarity: "light", points: 1 },
            primaryShadow: { archetype: "sovereign", polarity: "shadow", points: 2 },
            secondaryShadow: { archetype: "warrior", polarity: "shadow", points: 1 },
          },
        }
    ],
  },
  {
    position: 7,
    dimension: "power",
    prompt_fr: "Face à une décision importante à prendre, vous…",
    prompt_en: "When facing an important decision, you…",
    options: [
        {
          position: 1,
          label_fr: "Je pèse le pour et le contre avec des données objectives.",
          label_en: "I weigh pros and cons with cold, objective data.",
          vector: {
            primaryLight: { archetype: "sage", polarity: "light", points: 2 },
            secondaryLight: { archetype: "magician", polarity: "light", points: 1 },
            primaryShadow: { archetype: "child", polarity: "shadow", points: 2 },
            secondaryShadow: { archetype: "lover", polarity: "shadow", points: 1 },
          },
        },
        {
          position: 2,
          label_fr: "Je tranche rapidement, guidé(e) par mon instinct de leader.",
          label_en: "I decide quickly, guided by my instinct to lead.",
          vector: {
            primaryLight: { archetype: "sovereign", polarity: "light", points: 2 },
            secondaryLight: { archetype: "warrior", polarity: "light", points: 1 },
            primaryShadow: { archetype: "saboteur", polarity: "shadow", points: 2 },
            secondaryShadow: { archetype: "victim", polarity: "shadow", points: 1 },
          },
        },
        {
          position: 3,
          label_fr: "Je consulte mes proches pour être sûr(e) de ne blesser personne.",
          label_en: "I consult those close to me to make sure I hurt nobody.",
          vector: {
            primaryLight: { archetype: "caregiver", polarity: "light", points: 2 },
            secondaryLight: { archetype: "child", polarity: "light", points: 1 },
            primaryShadow: { archetype: "sovereign", polarity: "shadow", points: 2 },
            secondaryShadow: { archetype: "rebel", polarity: "shadow", points: 1 },
          },
        },
        {
          position: 4,
          label_fr: "Je choisis la voie qui m'offre le plus d'inconnu.",
          label_en: "I pick the path that promises the most unknown.",
          vector: {
            primaryLight: { archetype: "explorer", polarity: "light", points: 2 },
            secondaryLight: { archetype: "rebel", polarity: "light", points: 1 },
            primaryShadow: { archetype: "prostitute", polarity: "shadow", points: 2 },
            secondaryShadow: { archetype: "caregiver", polarity: "shadow", points: 1 },
          },
        },
        {
          position: 5,
          label_fr: "J'attends une synchronicité ou un signe de l'univers.",
          label_en: "I wait for a synchronicity or sign from the universe.",
          vector: {
            primaryLight: { archetype: "mystic", polarity: "light", points: 2 },
            secondaryLight: { archetype: "healer", polarity: "light", points: 1 },
            primaryShadow: { archetype: "warrior", polarity: "shadow", points: 2 },
            secondaryShadow: { archetype: "magician", polarity: "shadow", points: 1 },
          },
        },
        {
          position: 6,
          label_fr: "Je me fie à ma passion du moment, même irrationnelle.",
          label_en: "I trust the passion of the moment, even if it defies logic.",
          vector: {
            primaryLight: { archetype: "lover", polarity: "light", points: 2 },
            secondaryLight: { archetype: "creator", polarity: "light", points: 1 },
            primaryShadow: { archetype: "sage", polarity: "shadow", points: 2 },
            secondaryShadow: { archetype: "sovereign", polarity: "shadow", points: 1 },
          },
        }
    ],
  },
  {
    position: 8,
    dimension: "power",
    prompt_fr: "En plein conflit ou confrontation, vous…",
    prompt_en: "In the middle of conflict or confrontation, you…",
    options: [
        {
          position: 1,
          label_fr: "Je reste de marbre et j'utilise des arguments froids.",
          label_en: "I stay stone-faced and deploy cold, clinical arguments.",
          vector: {
            primaryLight: { archetype: "sage", polarity: "shadow", points: 2 },
            secondaryLight: { archetype: "warrior", polarity: "light", points: 1 },
            primaryShadow: { archetype: "child", polarity: "light", points: 2 },
            secondaryShadow: { archetype: "victim", polarity: "light", points: 1 },
          },
        },
        {
          position: 2,
          label_fr: "J'écrase l'opposition par ma prestance ou ma colère.",
          label_en: "I crush opposition with my presence or boiling anger.",
          vector: {
            primaryLight: { archetype: "sovereign", polarity: "shadow", points: 2 },
            secondaryLight: { archetype: "rebel", polarity: "shadow", points: 1 },
            primaryShadow: { archetype: "caregiver", polarity: "light", points: 2 },
            secondaryShadow: { archetype: "healer", polarity: "light", points: 1 },
          },
        },
        {
          position: 3,
          label_fr: "Je cède ou m'excuse pour restaurer la paix à tout prix.",
          label_en: "I yield or apologize to restore peace at any cost.",
          vector: {
            primaryLight: { archetype: "victim", polarity: "shadow", points: 2 },
            secondaryLight: { archetype: "caregiver", polarity: "shadow", points: 1 },
            primaryShadow: { archetype: "warrior", polarity: "light", points: 2 },
            secondaryShadow: { archetype: "sovereign", polarity: "light", points: 1 },
          },
        },
        {
          position: 4,
          label_fr: "Je retourne la situation à mon avantage avec ironie.",
          label_en: "I flip the situation to my advantage with irony.",
          vector: {
            primaryLight: { archetype: "jester", polarity: "shadow", points: 2 },
            secondaryLight: { archetype: "magician", polarity: "shadow", points: 1 },
            primaryShadow: { archetype: "lover", polarity: "light", points: 2 },
            secondaryShadow: { archetype: "mystic", polarity: "light", points: 1 },
          },
        },
        {
          position: 5,
          label_fr: "Je quitte physiquement ou mentalement la pièce (fuite).",
          label_en: "I physically or mentally exit the scene.",
          vector: {
            primaryLight: { archetype: "explorer", polarity: "shadow", points: 2 },
            secondaryLight: { archetype: "child", polarity: "shadow", points: 1 },
            primaryShadow: { archetype: "warrior", polarity: "light", points: 2 },
            secondaryShadow: { archetype: "sovereign", polarity: "light", points: 1 },
          },
        },
        {
          position: 6,
          label_fr: "Je cherche à ce que le conflit fasse évoluer la relation.",
          label_en: "I let the conflict evolve the relationship.",
          vector: {
            primaryLight: { archetype: "healer", polarity: "light", points: 2 },
            secondaryLight: { archetype: "lover", polarity: "light", points: 1 },
            primaryShadow: { archetype: "saboteur", polarity: "shadow", points: 2 },
            secondaryShadow: { archetype: "prostitute", polarity: "shadow", points: 1 },
          },
        }
    ],
  },
  {
    position: 9,
    dimension: "power",
    prompt_fr: "Qu'est-ce qui vous donne le sentiment d'avoir du pouvoir sur votre vie ?",
    prompt_en: "What gives you the feeling of having power over your life?",
    options: [
        {
          position: 1,
          label_fr: "Avoir un domaine ou une entreprise que je maîtrise totalement.",
          label_en: "Have a domain or company that I master completely.",
          vector: {
            primaryLight: { archetype: "sovereign", polarity: "light", points: 2 },
            secondaryLight: { archetype: "creator", polarity: "light", points: 1 },
            primaryShadow: { archetype: "victim", polarity: "shadow", points: 2 },
            secondaryShadow: { archetype: "mystic", polarity: "shadow", points: 1 },
          },
        },
        {
          position: 2,
          label_fr: "Ne dépendre de personne et n'avoir de compte à rendre.",
          label_en: "Be independent, accountable to no one.",
          vector: {
            primaryLight: { archetype: "explorer", polarity: "light", points: 2 },
            secondaryLight: { archetype: "rebel", polarity: "light", points: 1 },
            primaryShadow: { archetype: "caregiver", polarity: "shadow", points: 2 },
            secondaryShadow: { archetype: "child", polarity: "shadow", points: 1 },
          },
        },
        {
          position: 3,
          label_fr: "Voir ceux que j'aime s'épanouir grâce à moi.",
          label_en: "Watch my loved ones flourish thanks to me.",
          vector: {
            primaryLight: { archetype: "caregiver", polarity: "light", points: 2 },
            secondaryLight: { archetype: "healer", polarity: "light", points: 1 },
            primaryShadow: { archetype: "prostitute", polarity: "shadow", points: 2 },
            secondaryShadow: { archetype: "saboteur", polarity: "shadow", points: 1 },
          },
        },
        {
          position: 4,
          label_fr: "Avoir vaincu mes peurs et repoussé mes limites.",
          label_en: "Prove I've conquered fears and pushed past my limits.",
          vector: {
            primaryLight: { archetype: "warrior", polarity: "light", points: 2 },
            secondaryLight: { archetype: "magician", polarity: "light", points: 1 },
            primaryShadow: { archetype: "victim", polarity: "shadow", points: 2 },
            secondaryShadow: { archetype: "child", polarity: "shadow", points: 1 },
          },
        },
        {
          position: 5,
          label_fr: "Laisser une œuvre qui me survivra.",
          label_en: "Leave behind work that outlives me.",
          vector: {
            primaryLight: { archetype: "creator", polarity: "light", points: 2 },
            secondaryLight: { archetype: "sage", polarity: "light", points: 1 },
            primaryShadow: { archetype: "lover", polarity: "shadow", points: 2 },
            secondaryShadow: { archetype: "jester", polarity: "shadow", points: 1 },
          },
        },
        {
          position: 6,
          label_fr: "Être en paix absolue et détaché(e) du matériel.",
          label_en: "Be utterly at peace and detached from material concerns.",
          vector: {
            primaryLight: { archetype: "mystic", polarity: "light", points: 2 },
            secondaryLight: { archetype: "healer", polarity: "light", points: 1 },
            primaryShadow: { archetype: "prostitute", polarity: "shadow", points: 2 },
            secondaryShadow: { archetype: "warrior", polarity: "shadow", points: 1 },
          },
        }
    ],
  },
  {
    position: 10,
    dimension: "power",
    prompt_fr: "Après un échec visible ou une humiliation, vous…",
    prompt_en: "After a visible failure or humiliation, you…",
    options: [
        {
          position: 1,
          label_fr: "Je me flagelle et je me sabote pour le reste de la journée.",
          label_en: "I punish myself and sabotage the rest of the day.",
          vector: {
            primaryLight: { archetype: "saboteur", polarity: "shadow", points: 2 },
            secondaryLight: { archetype: "victim", polarity: "shadow", points: 1 },
            primaryShadow: { archetype: "warrior", polarity: "light", points: 2 },
            secondaryShadow: { archetype: "creator", polarity: "light", points: 1 },
          },
        },
        {
          position: 2,
          label_fr: "Je masque mon échec et refuse de montrer ma faiblesse.",
          label_en: "I hide the failure and refuse to show weakness.",
          vector: {
            primaryLight: { archetype: "sovereign", polarity: "shadow", points: 2 },
            secondaryLight: { archetype: "prostitute", polarity: "shadow", points: 1 },
            primaryShadow: { archetype: "child", polarity: "light", points: 2 },
            secondaryShadow: { archetype: "lover", polarity: "light", points: 1 },
          },
        },
        {
          position: 3,
          label_fr: "Je rationalise pour prouver que ce n'était pas important.",
          label_en: "I rationalize it to prove it didn’t matter.",
          vector: {
            primaryLight: { archetype: "sage", polarity: "shadow", points: 2 },
            secondaryLight: { archetype: "jester", polarity: "shadow", points: 1 },
            primaryShadow: { archetype: "rebel", polarity: "light", points: 2 },
            secondaryShadow: { archetype: "explorer", polarity: "light", points: 1 },
          },
        },
        {
          position: 4,
          label_fr: "Je redouble d'efforts et je fonce dans le tas.",
          label_en: "I double down and rush back into the fray.",
          vector: {
            primaryLight: { archetype: "warrior", polarity: "shadow", points: 2 },
            secondaryLight: { archetype: "rebel", polarity: "light", points: 1 },
            primaryShadow: { archetype: "mystic", polarity: "light", points: 2 },
            secondaryShadow: { archetype: "healer", polarity: "light", points: 1 },
          },
        },
        {
          position: 5,
          label_fr: "Je l'accepte comme un message de réorientation de l'univers.",
          label_en: "I accept it as the universe urging me to change course.",
          vector: {
            primaryLight: { archetype: "mystic", polarity: "light", points: 2 },
            secondaryLight: { archetype: "explorer", polarity: "light", points: 1 },
            primaryShadow: { archetype: "sovereign", polarity: "shadow", points: 2 },
            secondaryShadow: { archetype: "warrior", polarity: "shadow", points: 1 },
          },
        },
        {
          position: 6,
          label_fr: "Je m'effondre et j'ai besoin qu'on me console.",
          label_en: "I collapse and need someone to comfort me.",
          vector: {
            primaryLight: { archetype: "child", polarity: "shadow", points: 2 },
            secondaryLight: { archetype: "lover", polarity: "shadow", points: 1 },
            primaryShadow: { archetype: "sovereign", polarity: "light", points: 2 },
            secondaryShadow: { archetype: "sage", polarity: "light", points: 1 },
          },
        }
    ],
  },
  {
    position: 11,
    dimension: "power",
    prompt_fr: "Votre rapport à la discipline et à la structure est…",
    prompt_en: "Your relationship to discipline and structure is…",
    options: [
        {
          position: 1,
          label_fr: "C'est mon épine dorsale. Sans elle, pas de liberté.",
          label_en: "It's my backbone; without it, there's no freedom.",
          vector: {
            primaryLight: { archetype: "warrior", polarity: "light", points: 2 },
            secondaryLight: { archetype: "sovereign", polarity: "light", points: 1 },
            primaryShadow: { archetype: "child", polarity: "shadow", points: 2 },
            secondaryShadow: { archetype: "saboteur", polarity: "shadow", points: 1 },
          },
        },
        {
          position: 2,
          label_fr: "C'est une prison. Je fonctionne à l'inspiration ou l'urgence.",
          label_en: "It feels like a prison; I only function from inspiration or urgency.",
          vector: {
            primaryLight: { archetype: "rebel", polarity: "light", points: 2 },
            secondaryLight: { archetype: "explorer", polarity: "light", points: 1 },
            primaryShadow: { archetype: "sage", polarity: "shadow", points: 2 },
            secondaryShadow: { archetype: "warrior", polarity: "shadow", points: 1 },
          },
        },
        {
          position: 3,
          label_fr: "Je me l'impose jusqu'à l'épuisement total (burnout).",
          label_en: "I push myself to exhaustion.",
          vector: {
            primaryLight: { archetype: "saboteur", polarity: "shadow", points: 2 },
            secondaryLight: { archetype: "caregiver", polarity: "shadow", points: 1 },
            primaryShadow: { archetype: "mystic", polarity: "light", points: 2 },
            secondaryShadow: { archetype: "lover", polarity: "light", points: 1 },
          },
        },
        {
          position: 4,
          label_fr: "Je suis discipliné(e) uniquement pour créer ou apprendre.",
          label_en: "I apply discipline only to create or learn.",
          vector: {
            primaryLight: { archetype: "creator", polarity: "light", points: 2 },
            secondaryLight: { archetype: "sage", polarity: "light", points: 1 },
            primaryShadow: { archetype: "victim", polarity: "shadow", points: 2 },
            secondaryShadow: { archetype: "prostitute", polarity: "shadow", points: 1 },
          },
        },
        {
          position: 5,
          label_fr: "Je l'utilise pour des rituels et pratiques spirituelles.",
          label_en: "I use it for rituals and spiritual practice.",
          vector: {
            primaryLight: { archetype: "magician", polarity: "light", points: 2 },
            secondaryLight: { archetype: "mystic", polarity: "light", points: 1 },
            primaryShadow: { archetype: "rebel", polarity: "shadow", points: 2 },
            secondaryShadow: { archetype: "child", polarity: "shadow", points: 1 },
          },
        },
        {
          position: 6,
          label_fr: "Je préfère me laisser porter par le flux de la vie.",
          label_en: "I’d rather ride the flow of life.",
          vector: {
            primaryLight: { archetype: "lover", polarity: "light", points: 2 },
            secondaryLight: { archetype: "jester", polarity: "light", points: 1 },
            primaryShadow: { archetype: "sovereign", polarity: "shadow", points: 2 },
            secondaryShadow: { archetype: "warrior", polarity: "shadow", points: 1 },
          },
        }
    ],
  },
  {
    position: 12,
    dimension: "power",
    prompt_fr: "Face à une injustice sociale ou un système oppressif, vous…",
    prompt_en: "Facing social injustice or an oppressive system, you…",
    options: [
        {
          position: 1,
          label_fr: "Je me sens impuissant(e) et écrasé(e).",
          label_en: "I feel powerless and crushed.",
          vector: {
            primaryLight: { archetype: "victim", polarity: "shadow", points: 2 },
            secondaryLight: { archetype: "child", polarity: "shadow", points: 1 },
            primaryShadow: { archetype: "warrior", polarity: "light", points: 2 },
            secondaryShadow: { archetype: "rebel", polarity: "light", points: 1 },
          },
        },
        {
          position: 2,
          label_fr: "Je veux organiser la rébellion et détruire le système.",
          label_en: "I organize the rebellion and aim to destroy the system.",
          vector: {
            primaryLight: { archetype: "rebel", polarity: "light", points: 2 },
            secondaryLight: { archetype: "warrior", polarity: "light", points: 1 },
            primaryShadow: { archetype: "caregiver", polarity: "shadow", points: 2 },
            secondaryShadow: { archetype: "mystic", polarity: "shadow", points: 1 },
          },
        },
        {
          position: 3,
          label_fr: "J'essaie de soulager la douleur des victimes.",
          label_en: "I try to ease the pain of victims.",
          vector: {
            primaryLight: { archetype: "healer", polarity: "light", points: 2 },
            secondaryLight: { archetype: "caregiver", polarity: "light", points: 1 },
            primaryShadow: { archetype: "explorer", polarity: "shadow", points: 2 },
            secondaryShadow: { archetype: "sage", polarity: "shadow", points: 1 },
          },
        },
        {
          position: 4,
          label_fr: "J'analyse les failles pour proposer un modèle théorique.",
          label_en: "I analyze the flaws to offer a theoretical model.",
          vector: {
            primaryLight: { archetype: "sage", polarity: "light", points: 2 },
            secondaryLight: { archetype: "creator", polarity: "light", points: 1 },
            primaryShadow: { archetype: "lover", polarity: "shadow", points: 2 },
            secondaryShadow: { archetype: "jester", polarity: "shadow", points: 1 },
          },
        },
        {
          position: 5,
          label_fr: "Je me retire, la société est de toute façon corrompue.",
          label_en: "I retreat—society is corrupt anyway.",
          vector: {
            primaryLight: { archetype: "explorer", polarity: "shadow", points: 2 },
            secondaryLight: { archetype: "prostitute", polarity: "shadow", points: 1 },
            primaryShadow: { archetype: "sovereign", polarity: "light", points: 2 },
            secondaryShadow: { archetype: "warrior", polarity: "light", points: 1 },
          },
        },
        {
          position: 6,
          label_fr: "J'utilise mon pouvoir/argent pour forcer le changement.",
          label_en: "I use my power or money to force change.",
          vector: {
            primaryLight: { archetype: "sovereign", polarity: "light", points: 2 },
            secondaryLight: { archetype: "magician", polarity: "light", points: 1 },
            primaryShadow: { archetype: "child", polarity: "shadow", points: 2 },
            secondaryShadow: { archetype: "victim", polarity: "shadow", points: 1 },
          },
        }
    ],
  },
  {
    position: 13,
    dimension: "relationship",
    prompt_fr: "Dans un groupe, vous adoptez spontanément le rôle de…",
    prompt_en: "In a group, you spontaneously take on the role of…",
    options: [
        {
          position: 1,
          label_fr: "L'observateur qui analyse les dynamiques sans s'impliquer.",
          label_en: "The observer who analyzes dynamics without getting involved.",
          vector: {
            primaryLight: { archetype: "sage", polarity: "light", points: 2 },
            secondaryLight: { archetype: "mystic", polarity: "light", points: 1 },
            primaryShadow: { archetype: "lover", polarity: "shadow", points: 2 },
            secondaryShadow: { archetype: "caregiver", polarity: "shadow", points: 1 },
          },
        },
        {
          position: 2,
          label_fr: "Le centre de gravité qui organise, distribue la parole et tranche.",
          label_en: "The center of gravity who organizes, gives voice, and decides.",
          vector: {
            primaryLight: { archetype: "sovereign", polarity: "light", points: 2 },
            secondaryLight: { archetype: "creator", polarity: "light", points: 1 },
            primaryShadow: { archetype: "child", polarity: "shadow", points: 2 },
            secondaryShadow: { archetype: "victim", polarity: "shadow", points: 1 },
          },
        },
        {
          position: 3,
          label_fr: "Le protecteur qui s'assure que personne n'est mis de côté.",
          label_en: "The protector who ensures no one is left behind.",
          vector: {
            primaryLight: { archetype: "caregiver", polarity: "light", points: 2 },
            secondaryLight: { archetype: "healer", polarity: "light", points: 1 },
            primaryShadow: { archetype: "rebel", polarity: "shadow", points: 2 },
            secondaryShadow: { archetype: "explorer", polarity: "shadow", points: 1 },
          },
        },
        {
          position: 4,
          label_fr: "L'électron libre qui entre, met l'ambiance et repart à sa guise.",
          label_en: "The free spirit who arrives, sparks energy, then leaves.",
          vector: {
            primaryLight: { archetype: "explorer", polarity: "light", points: 2 },
            secondaryLight: { archetype: "jester", polarity: "light", points: 1 },
            primaryShadow: { archetype: "sovereign", polarity: "shadow", points: 2 },
            secondaryShadow: { archetype: "prostitute", polarity: "shadow", points: 1 },
          },
        },
        {
          position: 5,
          label_fr: "Le confident magnétique qui crée des connexions intimes 1-à-1.",
          label_en: "The magnetic confidant who creates intimate one-on-one bonds.",
          vector: {
            primaryLight: { archetype: "lover", polarity: "light", points: 2 },
            secondaryLight: { archetype: "magician", polarity: "light", points: 1 },
            primaryShadow: { archetype: "warrior", polarity: "shadow", points: 2 },
            secondaryShadow: { archetype: "sage", polarity: "shadow", points: 1 },
          },
        },
        {
          position: 6,
          label_fr: "Le provocateur qui appuie là où ça fait mal pour faire réagir.",
          label_en: "The provocateur who presses where it hurts to get a reaction.",
          vector: {
            primaryLight: { archetype: "rebel", polarity: "light", points: 2 },
            secondaryLight: { archetype: "warrior", polarity: "light", points: 1 },
            primaryShadow: { archetype: "caregiver", polarity: "shadow", points: 2 },
            secondaryShadow: { archetype: "mystic", polarity: "shadow", points: 1 },
          },
        }
    ],
  },
  {
    position: 14,
    dimension: "relationship",
    prompt_fr: "Concernant vos frontières relationnelles, vous reconnaissez que…",
    prompt_en: "Regarding your relational boundaries, you recognize that…",
    options: [
        {
          position: 1,
          label_fr: "Je n'en ai pas, je coupe les ponts dès qu'on m'étouffe.",
          label_en: "I have none—I cut ties the moment I feel smothered.",
          vector: {
            primaryLight: { archetype: "explorer", polarity: "shadow", points: 2 },
            secondaryLight: { archetype: "prostitute", polarity: "shadow", points: 1 },
            primaryShadow: { archetype: "lover", polarity: "light", points: 2 },
            secondaryShadow: { archetype: "caregiver", polarity: "light", points: 1 },
          },
        },
        {
          position: 2,
          label_fr: "Je m'oublie totalement pour satisfaire les désirs de l'autre.",
          label_en: "I completely lose myself to satisfy the other's desires.",
          vector: {
            primaryLight: { archetype: "lover", polarity: "shadow", points: 2 },
            secondaryLight: { archetype: "victim", polarity: "shadow", points: 1 },
            primaryShadow: { archetype: "sovereign", polarity: "light", points: 2 },
            secondaryShadow: { archetype: "warrior", polarity: "light", points: 1 },
          },
        },
        {
          position: 3,
          label_fr: "Je me rends indispensable pour que l'autre ne puisse pas me quitter.",
          label_en: "I become indispensable so the other cannot leave.",
          vector: {
            primaryLight: { archetype: "caregiver", polarity: "shadow", points: 2 },
            secondaryLight: { archetype: "magician", polarity: "shadow", points: 1 },
            primaryShadow: { archetype: "explorer", polarity: "light", points: 2 },
            secondaryShadow: { archetype: "mystic", polarity: "light", points: 1 },
          },
        },
        {
          position: 4,
          label_fr: "Je fais des crises ou je boude pour qu'on vienne me rassurer.",
          label_en: "I throw tantrums or sulk so someone will reassure me.",
          vector: {
            primaryLight: { archetype: "child", polarity: "shadow", points: 2 },
            secondaryLight: { archetype: "saboteur", polarity: "shadow", points: 1 },
            primaryShadow: { archetype: "sage", polarity: "light", points: 2 },
            secondaryShadow: { archetype: "creator", polarity: "light", points: 1 },
          },
        },
        {
          position: 5,
          label_fr: "J'exige une loyauté absolue et je contrôle la relation.",
          label_en: "I demand absolute loyalty and control the relationship.",
          vector: {
            primaryLight: { archetype: "sovereign", polarity: "shadow", points: 2 },
            secondaryLight: { archetype: "warrior", polarity: "shadow", points: 1 },
            primaryShadow: { archetype: "healer", polarity: "light", points: 2 },
            secondaryShadow: { archetype: "jester", polarity: "light", points: 1 },
          },
        },
        {
          position: 6,
          label_fr: "Je teste l'autre en le repoussant pour voir s'il va revenir.",
          label_en: "I test the other by pushing them away to see if they come back.",
          vector: {
            primaryLight: { archetype: "rebel", polarity: "shadow", points: 2 },
            secondaryLight: { archetype: "saboteur", polarity: "shadow", points: 1 },
            primaryShadow: { archetype: "child", polarity: "light", points: 2 },
            secondaryShadow: { archetype: "lover", polarity: "light", points: 1 },
          },
        }
    ],
  },
  {
    position: 15,
    dimension: "relationship",
    prompt_fr: "Vous exprimez votre amour ou votre affection principalement…",
    prompt_en: "You express love or affection mainly…",
    options: [
        {
          position: 1,
          label_fr: "En offrant du temps de qualité, de l'écoute et du soin.",
          label_en: "By giving quality time, listening, and care.",
          vector: {
            primaryLight: { archetype: "caregiver", polarity: "light", points: 2 },
            secondaryLight: { archetype: "healer", polarity: "light", points: 1 },
            primaryShadow: { archetype: "prostitute", polarity: "shadow", points: 2 },
            secondaryShadow: { archetype: "explorer", polarity: "shadow", points: 1 },
          },
        },
        {
          position: 2,
          label_fr: "En offrant de la sécurité matérielle et un cadre protecteur.",
          label_en: "By providing material security and a protective structure.",
          vector: {
            primaryLight: { archetype: "sovereign", polarity: "light", points: 2 },
            secondaryLight: { archetype: "warrior", polarity: "light", points: 1 },
            primaryShadow: { archetype: "child", polarity: "shadow", points: 2 },
            secondaryShadow: { archetype: "mystic", polarity: "shadow", points: 1 },
          },
        },
        {
          position: 3,
          label_fr: "Par la passion, le toucher et la fusion émotionnelle.",
          label_en: "Through passion, touch, and emotional fusion.",
          vector: {
            primaryLight: { archetype: "lover", polarity: "light", points: 2 },
            secondaryLight: { archetype: "child", polarity: "light", points: 1 },
            primaryShadow: { archetype: "sage", polarity: "shadow", points: 2 },
            secondaryShadow: { archetype: "sovereign", polarity: "shadow", points: 1 },
          },
        },
        {
          position: 4,
          label_fr: "En partageant mes connaissances et en aidant l'autre à comprendre.",
          label_en: "By sharing knowledge and helping them understand.",
          vector: {
            primaryLight: { archetype: "sage", polarity: "light", points: 2 },
            secondaryLight: { archetype: "creator", polarity: "light", points: 1 },
            primaryShadow: { archetype: "victim", polarity: "shadow", points: 2 },
            secondaryShadow: { archetype: "saboteur", polarity: "shadow", points: 1 },
          },
        },
        {
          position: 5,
          label_fr: "En dédramatisant ses soucis et en le faisant rire.",
          label_en: "By de-dramatizing their worries and making them laugh.",
          vector: {
            primaryLight: { archetype: "jester", polarity: "light", points: 2 },
            secondaryLight: { archetype: "explorer", polarity: "light", points: 1 },
            primaryShadow: { archetype: "caregiver", polarity: "shadow", points: 2 },
            secondaryShadow: { archetype: "magician", polarity: "shadow", points: 1 },
          },
        },
        {
          position: 6,
          label_fr: "En poussant l'autre à se dépasser et à affronter ses peurs.",
          label_en: "By pushing them to exceed themselves and face their fears.",
          vector: {
            primaryLight: { archetype: "warrior", polarity: "light", points: 2 },
            secondaryLight: { archetype: "magician", polarity: "light", points: 1 },
            primaryShadow: { archetype: "victim", polarity: "shadow", points: 2 },
            secondaryShadow: { archetype: "lover", polarity: "shadow", points: 1 },
          },
        }
    ],
  },
  {
    position: 16,
    dimension: "relationship",
    prompt_fr: "Quand on vous demande quelque chose qui dépasse vos limites, vous…",
    prompt_en: "When asked for something beyond your limits, you…",
    options: [
        {
          position: 1,
          label_fr: "Je dis oui à tout pour faire plaisir, puis je m'épuise en silence.",
          label_en: "I say yes to everything to please others, then burn out in silence.",
          vector: {
            primaryLight: { archetype: "caregiver", polarity: "shadow", points: 2 },
            secondaryLight: { archetype: "victim", polarity: "shadow", points: 1 },
            primaryShadow: { archetype: "sovereign", polarity: "light", points: 2 },
            secondaryShadow: { archetype: "warrior", polarity: "light", points: 1 },
          },
        },
        {
          position: 2,
          label_fr: "Je dis non de manière sèche et catégorique, sans justification.",
          label_en: "I say no sharply and without explanation.",
          vector: {
            primaryLight: { archetype: "warrior", polarity: "light", points: 2 },
            secondaryLight: { archetype: "sovereign", polarity: "light", points: 1 },
            primaryShadow: { archetype: "child", polarity: "shadow", points: 2 },
            secondaryShadow: { archetype: "lover", polarity: "shadow", points: 1 },
          },
        },
        {
          position: 3,
          label_fr: "Je fuis la confrontation et je m'éclipse sans vraiment répondre.",
          label_en: "I avoid confrontation and slip away without really replying.",
          vector: {
            primaryLight: { archetype: "explorer", polarity: "shadow", points: 2 },
            secondaryLight: { archetype: "child", polarity: "shadow", points: 1 },
            primaryShadow: { archetype: "sage", polarity: "light", points: 2 },
            secondaryShadow: { archetype: "creator", polarity: "light", points: 1 },
          },
        },
        {
          position: 4,
          label_fr: "Je marchande : je dis oui mais j'attends secrètement un retour.",
          label_en: "I bargain—say yes but secretly expect reciprocity.",
          vector: {
            primaryLight: { archetype: "prostitute", polarity: "shadow", points: 2 },
            secondaryLight: { archetype: "magician", polarity: "shadow", points: 1 },
            primaryShadow: { archetype: "healer", polarity: "light", points: 2 },
            secondaryShadow: { archetype: "mystic", polarity: "light", points: 1 },
          },
        },
        {
          position: 5,
          label_fr: "Je dis non par principe, pour marquer mon indépendance.",
          label_en: "I refuse on principle to underline my independence.",
          vector: {
            primaryLight: { archetype: "rebel", polarity: "shadow", points: 2 },
            secondaryLight: { archetype: "saboteur", polarity: "shadow", points: 1 },
            primaryShadow: { archetype: "caregiver", polarity: "light", points: 2 },
            secondaryShadow: { archetype: "lover", polarity: "light", points: 1 },
          },
        },
        {
          position: 6,
          label_fr: "J'explique calmement mes limites avec bienveillance et fermeté.",
          label_en: "I calmly explain my limits with kindness and firmness.",
          vector: {
            primaryLight: { archetype: "healer", polarity: "light", points: 2 },
            secondaryLight: { archetype: "sage", polarity: "light", points: 1 },
            primaryShadow: { archetype: "victim", polarity: "shadow", points: 2 },
            secondaryShadow: { archetype: "saboteur", polarity: "shadow", points: 1 },
          },
        }
    ],
  },
  {
    position: 17,
    dimension: "relationship",
    prompt_fr: "Face à une trahison ou une déception relationnelle, vous…",
    prompt_en: "Facing betrayal or relational disappointment, you…",
    options: [
        {
          position: 1,
          label_fr: "Je bannis la personne de mon royaume sans appel.",
          label_en: "I banish the person from my realm without appeal.",
          vector: {
            primaryLight: { archetype: "sovereign", polarity: "shadow", points: 2 },
            secondaryLight: { archetype: "warrior", polarity: "shadow", points: 1 },
            primaryShadow: { archetype: "healer", polarity: "light", points: 2 },
            secondaryShadow: { archetype: "lover", polarity: "light", points: 1 },
          },
        },
        {
          position: 2,
          label_fr: "Je m'effondre en me demandant ce que j'ai fait de mal.",
          label_en: "I collapse and ask myself what I did wrong.",
          vector: {
            primaryLight: { archetype: "child", polarity: "shadow", points: 2 },
            secondaryLight: { archetype: "victim", polarity: "shadow", points: 1 },
            primaryShadow: { archetype: "warrior", polarity: "light", points: 2 },
            secondaryShadow: { archetype: "rebel", polarity: "light", points: 1 },
          },
        },
        {
          position: 3,
          label_fr: "Je prépare une vengeance froide et méthodique.",
          label_en: "I plot a cold, methodical revenge.",
          vector: {
            primaryLight: { archetype: "magician", polarity: "shadow", points: 2 },
            secondaryLight: { archetype: "saboteur", polarity: "shadow", points: 1 },
            primaryShadow: { archetype: "mystic", polarity: "light", points: 2 },
            secondaryShadow: { archetype: "sage", polarity: "light", points: 1 },
          },
        },
        {
          position: 4,
          label_fr: "Je rationalise pour étouffer ma peine et je passe à autre chose.",
          label_en: "I rationalize to dull the pain and move on.",
          vector: {
            primaryLight: { archetype: "sage", polarity: "shadow", points: 2 },
            secondaryLight: { archetype: "prostitute", polarity: "shadow", points: 1 },
            primaryShadow: { archetype: "lover", polarity: "light", points: 2 },
            secondaryShadow: { archetype: "child", polarity: "light", points: 1 },
          },
        },
        {
          position: 5,
          label_fr: "J'essaie de comprendre la blessure de l'autre qui l'a poussé à agir ainsi.",
          label_en: "I try to understand the wound that led them to act.",
          vector: {
            primaryLight: { archetype: "healer", polarity: "light", points: 2 },
            secondaryLight: { archetype: "caregiver", polarity: "light", points: 1 },
            primaryShadow: { archetype: "rebel", polarity: "shadow", points: 2 },
            secondaryShadow: { archetype: "warrior", polarity: "shadow", points: 1 },
          },
        },
        {
          position: 6,
          label_fr: "Je me détache complètement, affirmant que rien n'est permanent.",
          label_en: "I detach completely, declaring that nothing is permanent.",
          vector: {
            primaryLight: { archetype: "mystic", polarity: "light", points: 2 },
            secondaryLight: { archetype: "explorer", polarity: "light", points: 1 },
            primaryShadow: { archetype: "lover", polarity: "shadow", points: 2 },
            secondaryShadow: { archetype: "caregiver", polarity: "shadow", points: 1 },
          },
        }
    ],
  },
  {
    position: 18,
    dimension: "relationship",
    prompt_fr: "Ce dont vous avez le plus besoin dans vos relations proches, c'est…",
    prompt_en: "What you need most in close relationships is…",
    options: [
        {
          position: 1,
          label_fr: "Qu'ils reconnaissent mon autorité et me témoignent du respect.",
          label_en: "That they recognize my authority and show me respect.",
          vector: {
            primaryLight: { archetype: "sovereign", polarity: "light", points: 2 },
            secondaryLight: { archetype: "warrior", polarity: "light", points: 1 },
            primaryShadow: { archetype: "child", polarity: "shadow", points: 2 },
            secondaryShadow: { archetype: "victim", polarity: "shadow", points: 1 },
          },
        },
        {
          position: 2,
          label_fr: "Qu'ils me sauvent ou qu'ils prennent les décisions difficiles à ma place.",
          label_en: "That they rescue me or make the hard calls for me.",
          vector: {
            primaryLight: { archetype: "child", polarity: "shadow", points: 2 },
            secondaryLight: { archetype: "victim", polarity: "shadow", points: 1 },
            primaryShadow: { archetype: "sovereign", polarity: "light", points: 2 },
            secondaryShadow: { archetype: "creator", polarity: "light", points: 1 },
          },
        },
        {
          position: 3,
          label_fr: "Qu'ils m'aiment inconditionnellement, même quand je suis invivable.",
          label_en: "That they love me unconditionally, even when I'm unbearable.",
          vector: {
            primaryLight: { archetype: "lover", polarity: "light", points: 2 },
            secondaryLight: { archetype: "child", polarity: "light", points: 1 },
            primaryShadow: { archetype: "prostitute", polarity: "shadow", points: 2 },
            secondaryShadow: { archetype: "sage", polarity: "shadow", points: 1 },
          },
        },
        {
          position: 4,
          label_fr: "Qu'ils me laissent un espace de liberté absolu sans m'étouffer.",
          label_en: "That they give me absolute freedom without suffocating me.",
          vector: {
            primaryLight: { archetype: "explorer", polarity: "light", points: 2 },
            secondaryLight: { archetype: "rebel", polarity: "light", points: 1 },
            primaryShadow: { archetype: "caregiver", polarity: "shadow", points: 2 },
            secondaryShadow: { archetype: "lover", polarity: "shadow", points: 1 },
          },
        },
        {
          position: 5,
          label_fr: "Qu'ils voient l'étendue de mon savoir ou de mon talent.",
          label_en: "That they witness the breadth of my knowledge or talent.",
          vector: {
            primaryLight: { archetype: "sage", polarity: "light", points: 2 },
            secondaryLight: { archetype: "creator", polarity: "light", points: 1 },
            primaryShadow: { archetype: "saboteur", polarity: "shadow", points: 2 },
            secondaryShadow: { archetype: "mystic", polarity: "shadow", points: 1 },
          },
        },
        {
          position: 6,
          label_fr: "Qu'ils partagent ma quête de vérité et d'évolution spirituelle.",
          label_en: "That they share my quest for truth and spiritual evolution.",
          vector: {
            primaryLight: { archetype: "mystic", polarity: "light", points: 2 },
            secondaryLight: { archetype: "healer", polarity: "light", points: 1 },
            primaryShadow: { archetype: "prostitute", polarity: "shadow", points: 2 },
            secondaryShadow: { archetype: "jester", polarity: "shadow", points: 1 },
          },
        }
    ],
  },
  {
    position: 19,
    dimension: "creation",
    prompt_fr: "Votre rapport à l'argent est surtout…",
    prompt_en: "Your relationship to money is mostly…",
    options: [
        {
          position: 1,
          label_fr: "Un outil de pouvoir pour bâtir, sécuriser et dominer.",
          label_en: "A tool of power to build, secure, and dominate.",
          vector: {
            primaryLight: { archetype: "sovereign", polarity: "light", points: 2 },
            secondaryLight: { archetype: "warrior", polarity: "light", points: 1 },
            primaryShadow: { archetype: "mystic", polarity: "shadow", points: 2 },
            secondaryShadow: { archetype: "child", polarity: "shadow", points: 1 },
          },
        },
        {
          position: 2,
          label_fr: "Une énergie fluide que je manifeste quand j'en ai besoin (alchimie).",
          label_en: "A fluid energy I summon when needed—pure alchemy.",
          vector: {
            primaryLight: { archetype: "magician", polarity: "light", points: 2 },
            secondaryLight: { archetype: "creator", polarity: "light", points: 1 },
            primaryShadow: { archetype: "victim", polarity: "shadow", points: 2 },
            secondaryShadow: { archetype: "saboteur", polarity: "shadow", points: 1 },
          },
        },
        {
          position: 3,
          label_fr: "Un sujet angoissant, j'ai toujours peur d'en manquer.",
          label_en: "An anxiety-inducing subject; I'm always afraid of running out.",
          vector: {
            primaryLight: { archetype: "child", polarity: "shadow", points: 2 },
            secondaryLight: { archetype: "victim", polarity: "shadow", points: 1 },
            primaryShadow: { archetype: "sovereign", polarity: "light", points: 2 },
            secondaryShadow: { archetype: "explorer", polarity: "light", points: 1 },
          },
        },
        {
          position: 4,
          label_fr: "Une illusion. Je le rejette ou le dépense dès que je l'ai.",
          label_en: "An illusion—I reject it or burn through it as soon as I have it.",
          vector: {
            primaryLight: { archetype: "rebel", polarity: "shadow", points: 2 },
            secondaryLight: { archetype: "saboteur", polarity: "shadow", points: 1 },
            primaryShadow: { archetype: "prostitute", polarity: "light", points: 2 },
            secondaryShadow: { archetype: "caregiver", polarity: "light", points: 1 },
          },
        },
        {
          position: 5,
          label_fr: "Je suis prêt(e) à faire des choses que je déteste pour en avoir.",
          label_en: "Willing to do things I hate just to possess it.",
          vector: {
            primaryLight: { archetype: "prostitute", polarity: "shadow", points: 2 },
            secondaryLight: { archetype: "victim", polarity: "shadow", points: 1 },
            primaryShadow: { archetype: "explorer", polarity: "light", points: 2 },
            secondaryShadow: { archetype: "warrior", polarity: "light", points: 1 },
          },
        },
        {
          position: 6,
          label_fr: "Un moyen d'aider mes proches et de prendre soin d'eux.",
          label_en: "A way to support and care for my loved ones.",
          vector: {
            primaryLight: { archetype: "caregiver", polarity: "light", points: 2 },
            secondaryLight: { archetype: "healer", polarity: "light", points: 1 },
            primaryShadow: { archetype: "rebel", polarity: "shadow", points: 2 },
            secondaryShadow: { archetype: "explorer", polarity: "shadow", points: 1 },
          },
        }
    ],
  },
  {
    position: 20,
    dimension: "creation",
    prompt_fr: "Quand vous créez ou réalisez un projet, vous…",
    prompt_en: "When you create or carry out a project, you…",
    options: [
        {
          position: 1,
          label_fr: "Je planifie tout à l'avance et je m'y tiens rigoureusement.",
          label_en: "I plan everything ahead and stick to it rigorously.",
          vector: {
            primaryLight: { archetype: "warrior", polarity: "light", points: 2 },
            secondaryLight: { archetype: "sage", polarity: "light", points: 1 },
            primaryShadow: { archetype: "child", polarity: "shadow", points: 2 },
            secondaryShadow: { archetype: "jester", polarity: "shadow", points: 1 },
          },
        },
        {
          position: 2,
          label_fr: "Je reçois des fulgurances et je crée dans des états seconds.",
          label_en: "I receive flashes of insight and create from altered states.",
          vector: {
            primaryLight: { archetype: "mystic", polarity: "light", points: 2 },
            secondaryLight: { archetype: "magician", polarity: "light", points: 1 },
            primaryShadow: { archetype: "saboteur", polarity: "shadow", points: 2 },
            secondaryShadow: { archetype: "sovereign", polarity: "shadow", points: 1 },
          },
        },
        {
          position: 3,
          label_fr: "Je canalise ma colère ou mes blessures pour en faire une œuvre.",
          label_en: "I channel anger or wounds into a creation.",
          vector: {
            primaryLight: { archetype: "creator", polarity: "light", points: 2 },
            secondaryLight: { archetype: "rebel", polarity: "light", points: 1 },
            primaryShadow: { archetype: "victim", polarity: "shadow", points: 2 },
            secondaryShadow: { archetype: "prostitute", polarity: "shadow", points: 1 },
          },
        },
        {
          position: 4,
          label_fr: "Je perfectionne sans cesse, de peur que ce ne soit pas assez bien.",
          label_en: "I perfect endlessly out of fear it won’t be good enough.",
          vector: {
            primaryLight: { archetype: "creator", polarity: "shadow", points: 2 },
            secondaryLight: { archetype: "sage", polarity: "shadow", points: 1 },
            primaryShadow: { archetype: "jester", polarity: "light", points: 2 },
            secondaryShadow: { archetype: "explorer", polarity: "light", points: 1 },
          },
        },
        {
          position: 5,
          label_fr: "Je délègue l'exécution pour rester concentré sur la vision globale.",
          label_en: "I delegate execution so I can stay focused on the vision.",
          vector: {
            primaryLight: { archetype: "sovereign", polarity: "light", points: 2 },
            secondaryLight: { archetype: "creator", polarity: "light", points: 1 },
            primaryShadow: { archetype: "caregiver", polarity: "shadow", points: 2 },
            secondaryShadow: { archetype: "victim", polarity: "shadow", points: 1 },
          },
        },
        {
          position: 6,
          label_fr: "Je procrastine puis je sors quelque chose à la dernière minute.",
          label_en: "I procrastinate and then deliver something at the last minute.",
          vector: {
            primaryLight: { archetype: "saboteur", polarity: "shadow", points: 2 },
            secondaryLight: { archetype: "child", polarity: "shadow", points: 1 },
            primaryShadow: { archetype: "warrior", polarity: "light", points: 2 },
            secondaryShadow: { archetype: "sage", polarity: "light", points: 1 },
          },
        }
    ],
  },
  {
    position: 21,
    dimension: "creation",
    prompt_fr: "Face au risque et à l'incertitude, vous…",
    prompt_en: "Facing risk and uncertainty, you…",
    options: [
        {
          position: 1,
          label_fr: "Il doit être calculé, documenté et minimisé.",
          label_en: "It must be calculated, documented, and minimized.",
          vector: {
            primaryLight: { archetype: "sage", polarity: "light", points: 2 },
            secondaryLight: { archetype: "sovereign", polarity: "light", points: 1 },
            primaryShadow: { archetype: "rebel", polarity: "shadow", points: 2 },
            secondaryShadow: { archetype: "explorer", polarity: "shadow", points: 1 },
          },
        },
        {
          position: 2,
          label_fr: "C'est l'essence même de la vie, sans risque je m'éteins.",
          label_en: "It's the essence of life—without risk, I wither.",
          vector: {
            primaryLight: { archetype: "explorer", polarity: "light", points: 2 },
            secondaryLight: { archetype: "rebel", polarity: "light", points: 1 },
            primaryShadow: { archetype: "caregiver", polarity: "shadow", points: 2 },
            secondaryShadow: { archetype: "victim", polarity: "shadow", points: 1 },
          },
        },
        {
          position: 3,
          label_fr: "C'est un saut de la foi, je fais confiance à l'univers.",
          label_en: "A leap of faith; I trust the universe.",
          vector: {
            primaryLight: { archetype: "mystic", polarity: "light", points: 2 },
            secondaryLight: { archetype: "child", polarity: "light", points: 1 },
            primaryShadow: { archetype: "warrior", polarity: "shadow", points: 2 },
            secondaryShadow: { archetype: "sovereign", polarity: "shadow", points: 1 },
          },
        },
        {
          position: 4,
          label_fr: "J'évite à tout prix pour protéger ma sécurité et celle des autres.",
          label_en: "I avoid it at all costs to protect everyone's safety.",
          vector: {
            primaryLight: { archetype: "caregiver", polarity: "shadow", points: 2 },
            secondaryLight: { archetype: "child", polarity: "shadow", points: 1 },
            primaryShadow: { archetype: "warrior", polarity: "light", points: 2 },
            secondaryShadow: { archetype: "creator", polarity: "light", points: 1 },
          },
        },
        {
          position: 5,
          label_fr: "C'est un défi à conquérir, j'aime tester ma force.",
          label_en: "A challenge to conquer—I love testing my strength.",
          vector: {
            primaryLight: { archetype: "warrior", polarity: "light", points: 2 },
            secondaryLight: { archetype: "magician", polarity: "light", points: 1 },
            primaryShadow: { archetype: "victim", polarity: "shadow", points: 2 },
            secondaryShadow: { archetype: "saboteur", polarity: "shadow", points: 1 },
          },
        },
        {
          position: 6,
          label_fr: "Je joue avec le feu juste pour voir ce que ça fait (provocation).",
          label_en: "I play with fire just to see what happens.",
          vector: {
            primaryLight: { archetype: "jester", polarity: "shadow", points: 2 },
            secondaryLight: { archetype: "rebel", polarity: "shadow", points: 1 },
            primaryShadow: { archetype: "sage", polarity: "light", points: 2 },
            secondaryShadow: { archetype: "sovereign", polarity: "light", points: 1 },
          },
        }
    ],
  },
  {
    position: 22,
    dimension: "creation",
    prompt_fr: "Face à un dilemme où il faudrait compromettre vos valeurs pour la sécurité, vous…",
    prompt_en: "Facing a dilemma where you'd compromise values for security, you…",
    options: [
        {
          position: 1,
          label_fr: "J'accepte avec amertume car j'ai besoin de cette sécurité.",
          label_en: "I accept it reluctantly because I need the security.",
          vector: {
            primaryLight: { archetype: "prostitute", polarity: "shadow", points: 2 },
            secondaryLight: { archetype: "victim", polarity: "shadow", points: 1 },
            primaryShadow: { archetype: "warrior", polarity: "light", points: 2 },
            secondaryShadow: { archetype: "sovereign", polarity: "light", points: 1 },
          },
        },
        {
          position: 2,
          label_fr: "Je refuse catégoriquement et je dénonce le système.",
          label_en: "I refuse outright and denounce the system.",
          vector: {
            primaryLight: { archetype: "rebel", polarity: "light", points: 2 },
            secondaryLight: { archetype: "prostitute", polarity: "light", points: 1 },
            primaryShadow: { archetype: "lover", polarity: "shadow", points: 2 },
            secondaryShadow: { archetype: "caregiver", polarity: "shadow", points: 1 },
          },
        },
        {
          position: 3,
          label_fr: "Je trouve une faille élégante pour contourner le dilemme.",
          label_en: "I find an elegant loophole to sidestep the dilemma.",
          vector: {
            primaryLight: { archetype: "magician", polarity: "light", points: 2 },
            secondaryLight: { archetype: "sage", polarity: "light", points: 1 },
            primaryShadow: { archetype: "child", polarity: "shadow", points: 2 },
            secondaryShadow: { archetype: "victim", polarity: "shadow", points: 1 },
          },
        },
        {
          position: 4,
          label_fr: "Je l'utilise comme carburant pour créer ma propre voie (indépendance).",
          label_en: "I use it as fuel to carve my own independent path.",
          vector: {
            primaryLight: { archetype: "creator", polarity: "light", points: 2 },
            secondaryLight: { archetype: "explorer", polarity: "light", points: 1 },
            primaryShadow: { archetype: "prostitute", polarity: "shadow", points: 2 },
            secondaryShadow: { archetype: "saboteur", polarity: "shadow", points: 1 },
          },
        },
        {
          position: 5,
          label_fr: "J'en rigole et je joue le jeu sans me prendre au sérieux.",
          label_en: "I laugh it off and play the game without taking it seriously.",
          vector: {
            primaryLight: { archetype: "jester", polarity: "light", points: 2 },
            secondaryLight: { archetype: "prostitute", polarity: "light", points: 1 },
            primaryShadow: { archetype: "sage", polarity: "shadow", points: 2 },
            secondaryShadow: { archetype: "warrior", polarity: "shadow", points: 1 },
          },
        },
        {
          position: 6,
          label_fr: "Je quitte immédiatement la situation, quitte à tout perdre.",
          label_en: "I leave immediately, even if it costs me everything.",
          vector: {
            primaryLight: { archetype: "explorer", polarity: "light", points: 2 },
            secondaryLight: { archetype: "rebel", polarity: "light", points: 1 },
            primaryShadow: { archetype: "caregiver", polarity: "shadow", points: 2 },
            secondaryShadow: { archetype: "prostitute", polarity: "shadow", points: 1 },
          },
        }
    ],
  },
  {
    position: 23,
    dimension: "creation",
    prompt_fr: "Ce que vous souhaitez apporter au monde avant tout, c'est…",
    prompt_en: "What you most want to bring to the world is…",
    options: [
        {
          position: 1,
          label_fr: "Bâtir un héritage solide et structurer la société.",
          label_en: "Build a solid legacy and structure society.",
          vector: {
            primaryLight: { archetype: "sovereign", polarity: "light", points: 2 },
            secondaryLight: { archetype: "creator", polarity: "light", points: 1 },
            primaryShadow: { archetype: "mystic", polarity: "shadow", points: 2 },
            secondaryShadow: { archetype: "explorer", polarity: "shadow", points: 1 },
          },
        },
        {
          position: 2,
          label_fr: "Guérir les cœurs et soulager la souffrance ambiante.",
          label_en: "Heal hearts and relieve the surrounding suffering.",
          vector: {
            primaryLight: { archetype: "healer", polarity: "light", points: 2 },
            secondaryLight: { archetype: "caregiver", polarity: "light", points: 1 },
            primaryShadow: { archetype: "warrior", polarity: "shadow", points: 2 },
            secondaryShadow: { archetype: "saboteur", polarity: "shadow", points: 1 },
          },
        },
        {
          position: 3,
          label_fr: "Éveiller les consciences par la transmission de la vérité.",
          label_en: "Awaken consciences by transmitting truth.",
          vector: {
            primaryLight: { archetype: "sage", polarity: "light", points: 2 },
            secondaryLight: { archetype: "mystic", polarity: "light", points: 1 },
            primaryShadow: { archetype: "victim", polarity: "shadow", points: 2 },
            secondaryShadow: { archetype: "child", polarity: "shadow", points: 1 },
          },
        },
        {
          position: 4,
          label_fr: "Manifester la beauté, l'amour et l'harmonie vibratoire.",
          label_en: "Manifest beauty, love, and harmonic vibration.",
          vector: {
            primaryLight: { archetype: "lover", polarity: "light", points: 2 },
            secondaryLight: { archetype: "creator", polarity: "light", points: 1 },
            primaryShadow: { archetype: "prostitute", polarity: "shadow", points: 2 },
            secondaryShadow: { archetype: "saboteur", polarity: "shadow", points: 1 },
          },
        },
        {
          position: 5,
          label_fr: "Détruire les illusions et réveiller les gens par un choc.",
          label_en: "Break illusions and shock people awake.",
          vector: {
            primaryLight: { archetype: "rebel", polarity: "light", points: 2 },
            secondaryLight: { archetype: "jester", polarity: "light", points: 1 },
            primaryShadow: { archetype: "caregiver", polarity: "shadow", points: 2 },
            secondaryShadow: { archetype: "lover", polarity: "shadow", points: 1 },
          },
        },
        {
          position: 6,
          label_fr: "Transformer la réalité et montrer que la magie existe.",
          label_en: "Transform reality and prove that magic exists.",
          vector: {
            primaryLight: { archetype: "magician", polarity: "light", points: 2 },
            secondaryLight: { archetype: "healer", polarity: "light", points: 1 },
            primaryShadow: { archetype: "victim", polarity: "shadow", points: 2 },
            secondaryShadow: { archetype: "sage", polarity: "shadow", points: 1 },
          },
        }
    ],
  },
  {
    position: 24,
    dimension: "creation",
    prompt_fr: "Votre rapport à la perfection dans vos créations est…",
    prompt_en: "Your relationship to perfection in your creations is…",
    options: [
        {
          position: 1,
          label_fr: "Il me paralyse totalement, m'empêchant de finir mes projets.",
          label_en: "It paralyzes me and keeps me from finishing projects.",
          vector: {
            primaryLight: { archetype: "saboteur", polarity: "shadow", points: 2 },
            secondaryLight: { archetype: "creator", polarity: "shadow", points: 1 },
            primaryShadow: { archetype: "warrior", polarity: "light", points: 2 },
            secondaryShadow: { archetype: "jester", polarity: "light", points: 1 },
          },
        },
        {
          position: 2,
          label_fr: "C'est une exigence non négociable, je suis impitoyable avec les détails.",
          label_en: "It's a non-negotiable demand; I'm ruthless with details.",
          vector: {
            primaryLight: { archetype: "warrior", polarity: "shadow", points: 2 },
            secondaryLight: { archetype: "sage", polarity: "shadow", points: 1 },
            primaryShadow: { archetype: "child", polarity: "light", points: 2 },
            secondaryShadow: { archetype: "lover", polarity: "light", points: 1 },
          },
        },
        {
          position: 3,
          label_fr: "Je m'en fiche, je privilégie l'expression brute et spontanée.",
          label_en: "I don't care; I favor raw, spontaneous expression.",
          vector: {
            primaryLight: { archetype: "rebel", polarity: "light", points: 2 },
            secondaryLight: { archetype: "explorer", polarity: "light", points: 1 },
            primaryShadow: { archetype: "sovereign", polarity: "shadow", points: 2 },
            secondaryShadow: { archetype: "caregiver", polarity: "shadow", points: 1 },
          },
        },
        {
          position: 4,
          label_fr: "Je l'utilise comme outil d'excellence mais je sais quand lâcher prise.",
          label_en: "I use it as a tool for excellence but know when to let go.",
          vector: {
            primaryLight: { archetype: "creator", polarity: "light", points: 2 },
            secondaryLight: { archetype: "sovereign", polarity: "light", points: 1 },
            primaryShadow: { archetype: "prostitute", polarity: "shadow", points: 2 },
            secondaryShadow: { archetype: "victim", polarity: "shadow", points: 1 },
          },
        },
        {
          position: 5,
          label_fr: "Je m'excuse toujours en disant que ce n'est \"pas assez bien\".",
          label_en: "I always apologize, claiming it’s 'not good enough.'",
          vector: {
            primaryLight: { archetype: "child", polarity: "shadow", points: 2 },
            secondaryLight: { archetype: "victim", polarity: "shadow", points: 1 },
            primaryShadow: { archetype: "sovereign", polarity: "light", points: 2 },
            secondaryShadow: { archetype: "magician", polarity: "light", points: 1 },
          },
        },
        {
          position: 6,
          label_fr: "Je considère que les défauts font la perfection de l'âme (Wabi-Sabi).",
          label_en: "I see flaws as the perfection of the soul.",
          vector: {
            primaryLight: { archetype: "mystic", polarity: "light", points: 2 },
            secondaryLight: { archetype: "healer", polarity: "light", points: 1 },
            primaryShadow: { archetype: "saboteur", polarity: "shadow", points: 2 },
            secondaryShadow: { archetype: "sage", polarity: "shadow", points: 1 },
          },
        }
    ],
  },
  {
    position: 25,
    dimension: "spirituality",
    prompt_fr: "Votre rapport au spirituel, au mystère ou à l'invisible est…",
    prompt_en: "Your relationship to the spiritual, mystery, or invisible is…",
    options: [
        {
          position: 1,
          label_fr: "Je m'y plonge entièrement, c'est ma véritable réalité.",
          label_en: "I dive into it completely—it's my true reality.",
          vector: {
            primaryLight: { archetype: "mystic", polarity: "light", points: 2 },
            secondaryLight: { archetype: "healer", polarity: "light", points: 1 },
            primaryShadow: { archetype: "sovereign", polarity: "shadow", points: 2 },
            secondaryShadow: { archetype: "warrior", polarity: "shadow", points: 1 },
          },
        },
        {
          position: 2,
          label_fr: "Je l'étudie comme une science ésotérique avec des codes stricts.",
          label_en: "I study it like an esoteric science with strict codes.",
          vector: {
            primaryLight: { archetype: "sage", polarity: "light", points: 2 },
            secondaryLight: { archetype: "magician", polarity: "light", points: 1 },
            primaryShadow: { archetype: "child", polarity: "shadow", points: 2 },
            secondaryShadow: { archetype: "victim", polarity: "shadow", points: 1 },
          },
        },
        {
          position: 3,
          label_fr: "Je m'en méfie ou je le rejette car ce n'est pas concret.",
          label_en: "I distrust or reject it because it's not concrete.",
          vector: {
            primaryLight: { archetype: "warrior", polarity: "shadow", points: 2 },
            secondaryLight: { archetype: "sovereign", polarity: "shadow", points: 1 },
            primaryShadow: { archetype: "mystic", polarity: "light", points: 2 },
            secondaryShadow: { archetype: "explorer", polarity: "light", points: 1 },
          },
        },
        {
          position: 4,
          label_fr: "Je m'en sers consciemment pour manifester mes désirs matériels.",
          label_en: "I harness it consciously to manifest material desires.",
          vector: {
            primaryLight: { archetype: "magician", polarity: "light", points: 2 },
            secondaryLight: { archetype: "creator", polarity: "light", points: 1 },
            primaryShadow: { archetype: "prostitute", polarity: "shadow", points: 2 },
            secondaryShadow: { archetype: "victim", polarity: "shadow", points: 1 },
          },
        },
        {
          position: 5,
          label_fr: "J'en ai peur, j'ai l'impression d'être à la merci de forces obscures.",
          label_en: "I'm afraid of it, feeling at the mercy of dark forces.",
          vector: {
            primaryLight: { archetype: "child", polarity: "shadow", points: 2 },
            secondaryLight: { archetype: "victim", polarity: "shadow", points: 1 },
            primaryShadow: { archetype: "warrior", polarity: "light", points: 2 },
            secondaryShadow: { archetype: "healer", polarity: "light", points: 1 },
          },
        },
        {
          position: 6,
          label_fr: "J'aime l'explorer pour le frisson de l'inconnu, sans trop y croire.",
          label_en: "I love exploring it for the thrill of the unknown, without fully believing.",
          vector: {
            primaryLight: { archetype: "explorer", polarity: "light", points: 2 },
            secondaryLight: { archetype: "jester", polarity: "light", points: 1 },
            primaryShadow: { archetype: "sage", polarity: "shadow", points: 2 },
            secondaryShadow: { archetype: "caregiver", polarity: "shadow", points: 1 },
          },
        }
    ],
  },
  {
    position: 26,
    dimension: "spirituality",
    prompt_fr: "Pour transformer une blessure profonde, vous…",
    prompt_en: "To transform a deep wound, you…",
    options: [
        {
          position: 1,
          label_fr: "L'isolement total en pleine nature pour me recalibrer.",
          label_en: "Total isolation in nature to recalibrate.",
          vector: {
            primaryLight: { archetype: "explorer", polarity: "light", points: 2 },
            secondaryLight: { archetype: "mystic", polarity: "light", points: 1 },
            primaryShadow: { archetype: "caregiver", polarity: "shadow", points: 2 },
            secondaryShadow: { archetype: "lover", polarity: "shadow", points: 1 },
          },
        },
        {
          position: 2,
          label_fr: "Je transmute la douleur en art ou en projet porteur de sens.",
          label_en: "I transmute pain into art or a meaningful project.",
          vector: {
            primaryLight: { archetype: "creator", polarity: "light", points: 2 },
            secondaryLight: { archetype: "magician", polarity: "light", points: 1 },
            primaryShadow: { archetype: "saboteur", polarity: "shadow", points: 2 },
            secondaryShadow: { archetype: "victim", polarity: "shadow", points: 1 },
          },
        },
        {
          position: 3,
          label_fr: "L'introspection spirituelle et le pardon (de soi et de l'autre).",
          label_en: "Spiritual introspection and forgiveness—for myself and others.",
          vector: {
            primaryLight: { archetype: "healer", polarity: "light", points: 2 },
            secondaryLight: { archetype: "mystic", polarity: "light", points: 1 },
            primaryShadow: { archetype: "rebel", polarity: "shadow", points: 2 },
            secondaryShadow: { archetype: "warrior", polarity: "shadow", points: 1 },
          },
        },
        {
          position: 4,
          label_fr: "Je nie la douleur et je me replonge immédiatement dans l'action.",
          label_en: "I deny the pain and dive straight back into action.",
          vector: {
            primaryLight: { archetype: "warrior", polarity: "shadow", points: 2 },
            secondaryLight: { archetype: "saboteur", polarity: "shadow", points: 1 },
            primaryShadow: { archetype: "child", polarity: "light", points: 2 },
            secondaryShadow: { archetype: "lover", polarity: "light", points: 1 },
          },
        },
        {
          position: 5,
          label_fr: "Je cherche quelqu'un qui saura me sauver et me réparer.",
          label_en: "I look for someone to save and fix me.",
          vector: {
            primaryLight: { archetype: "child", polarity: "shadow", points: 2 },
            secondaryLight: { archetype: "victim", polarity: "shadow", points: 1 },
            primaryShadow: { archetype: "healer", polarity: "light", points: 2 },
            secondaryShadow: { archetype: "sovereign", polarity: "light", points: 1 },
          },
        },
        {
          position: 6,
          label_fr: "J'analyse les schémas cognitifs de ma blessure pour ne plus la répéter.",
          label_en: "I study the cognitive patterns of my wound to avoid repeating it.",
          vector: {
            primaryLight: { archetype: "sage", polarity: "light", points: 2 },
            secondaryLight: { archetype: "magician", polarity: "light", points: 1 },
            primaryShadow: { archetype: "child", polarity: "shadow", points: 2 },
            secondaryShadow: { archetype: "victim", polarity: "shadow", points: 1 },
          },
        }
    ],
  },
  {
    position: 27,
    dimension: "spirituality",
    prompt_fr: "Votre rapport à la vérité est…",
    prompt_en: "Your relationship to truth is…",
    options: [
        {
          position: 1,
          label_fr: "Je crois qu'il existe une Vérité absolue et je suis prêt(e) à mourir pour elle.",
          label_en: "I believe in an absolute Truth and would die for it.",
          vector: {
            primaryLight: { archetype: "warrior", polarity: "light", points: 2 },
            secondaryLight: { archetype: "mystic", polarity: "light", points: 1 },
            primaryShadow: { archetype: "jester", polarity: "shadow", points: 2 },
            secondaryShadow: { archetype: "prostitute", polarity: "shadow", points: 1 },
          },
        },
        {
          position: 2,
          label_fr: "La vérité est relative, je m'amuse de l'absurdité de nos certitudes.",
          label_en: "Truth is relative; I celebrate the absurdity of our certainties.",
          vector: {
            primaryLight: { archetype: "jester", polarity: "light", points: 2 },
            secondaryLight: { archetype: "explorer", polarity: "light", points: 1 },
            primaryShadow: { archetype: "sage", polarity: "shadow", points: 2 },
            secondaryShadow: { archetype: "sovereign", polarity: "shadow", points: 1 },
          },
        },
        {
          position: 3,
          label_fr: "Je poursuis la vérité objective par l'étude incessante.",
          label_en: "I chase objective truth through relentless study.",
          vector: {
            primaryLight: { archetype: "sage", polarity: "light", points: 2 },
            secondaryLight: { archetype: "creator", polarity: "light", points: 1 },
            primaryShadow: { archetype: "child", polarity: "shadow", points: 2 },
            secondaryShadow: { archetype: "lover", polarity: "shadow", points: 1 },
          },
        },
        {
          position: 4,
          label_fr: "Ma vérité est ce que je ressens vibratoirement au fond de mes tripes.",
          label_en: "My truth is what I feel vibrating deep in my gut.",
          vector: {
            primaryLight: { archetype: "lover", polarity: "light", points: 2 },
            secondaryLight: { archetype: "healer", polarity: "light", points: 1 },
            primaryShadow: { archetype: "sage", polarity: "shadow", points: 2 },
            secondaryShadow: { archetype: "magician", polarity: "shadow", points: 1 },
          },
        },
        {
          position: 5,
          label_fr: "Je m'approprie la vérité qui me permet de garder le pouvoir.",
          label_en: "I seize the truth that keeps me in power.",
          vector: {
            primaryLight: { archetype: "sovereign", polarity: "shadow", points: 2 },
            secondaryLight: { archetype: "prostitute", polarity: "shadow", points: 1 },
            primaryShadow: { archetype: "rebel", polarity: "light", points: 2 },
            secondaryShadow: { archetype: "mystic", polarity: "light", points: 1 },
          },
        },
        {
          position: 6,
          label_fr: "Je détruis les dogmes imposés pour que chacun trouve sa propre vérité.",
          label_en: "I destroy imposed dogmas so everyone can find their own truth.",
          vector: {
            primaryLight: { archetype: "rebel", polarity: "light", points: 2 },
            secondaryLight: { archetype: "explorer", polarity: "light", points: 1 },
            primaryShadow: { archetype: "caregiver", polarity: "shadow", points: 2 },
            secondaryShadow: { archetype: "victim", polarity: "shadow", points: 1 },
          },
        }
    ],
  },
  {
    position: 28,
    dimension: "spirituality",
    prompt_fr: "Face aux épreuves irréversibles ou à l'adversité, vous…",
    prompt_en: "Facing irreversible trials or adversity, you…",
    options: [
        {
          position: 1,
          label_fr: "Avec une grâce absolue, confiant(e) dans le plan divin.",
          label_en: "With absolute grace, confident in the divine plan.",
          vector: {
            primaryLight: { archetype: "mystic", polarity: "light", points: 2 },
            secondaryLight: { archetype: "healer", polarity: "light", points: 1 },
            primaryShadow: { archetype: "warrior", polarity: "shadow", points: 2 },
            secondaryShadow: { archetype: "sovereign", polarity: "shadow", points: 1 },
          },
        },
        {
          position: 2,
          label_fr: "En me plaignant de l'injustice cosmique qui s'acharne sur moi.",
          label_en: "I complain about the cosmic injustice targeting me.",
          vector: {
            primaryLight: { archetype: "victim", polarity: "shadow", points: 2 },
            secondaryLight: { archetype: "saboteur", polarity: "shadow", points: 1 },
            primaryShadow: { archetype: "creator", polarity: "light", points: 2 },
            secondaryShadow: { archetype: "magician", polarity: "light", points: 1 },
          },
        },
        {
          position: 3,
          label_fr: "En me battant jusqu'au dernier souffle, refusant la défaite.",
          label_en: "I fight until my last breath, refusing to accept defeat.",
          vector: {
            primaryLight: { archetype: "warrior", polarity: "shadow", points: 2 },
            secondaryLight: { archetype: "rebel", polarity: "shadow", points: 1 },
            primaryShadow: { archetype: "mystic", polarity: "light", points: 2 },
            secondaryShadow: { archetype: "child", polarity: "light", points: 1 },
          },
        },
        {
          position: 4,
          label_fr: "En riant jaune ou en faisant de l'humour noir sur mon sort.",
          label_en: "I respond with bitter laughter or dark humor.",
          vector: {
            primaryLight: { archetype: "jester", polarity: "light", points: 2 },
            secondaryLight: { archetype: "rebel", polarity: "light", points: 1 },
            primaryShadow: { archetype: "caregiver", polarity: "shadow", points: 2 },
            secondaryShadow: { archetype: "sage", polarity: "shadow", points: 1 },
          },
        },
        {
          position: 5,
          label_fr: "En l'intégrant philosophiquement comme une loi de la nature.",
          label_en: "I absorb it philosophically as a law of nature.",
          vector: {
            primaryLight: { archetype: "sage", polarity: "light", points: 2 },
            secondaryLight: { archetype: "explorer", polarity: "light", points: 1 },
            primaryShadow: { archetype: "child", polarity: "shadow", points: 2 },
            secondaryShadow: { archetype: "lover", polarity: "shadow", points: 1 },
          },
        },
        {
          position: 6,
          label_fr: "En me focalisant uniquement sur la zone que je contrôle encore.",
          label_en: "I focus only on the field I still control.",
          vector: {
            primaryLight: { archetype: "sovereign", polarity: "light", points: 2 },
            secondaryLight: { archetype: "magician", polarity: "light", points: 1 },
            primaryShadow: { archetype: "victim", polarity: "shadow", points: 2 },
            secondaryShadow: { archetype: "saboteur", polarity: "shadow", points: 1 },
          },
        }
    ],
  },
  {
    position: 29,
    dimension: "spirituality",
    prompt_fr: "Votre rapport à la mort est…",
    prompt_en: "Your relationship to death is…",
    options: [
        {
          position: 1,
          label_fr: "Une transition alchimique vers un autre état de conscience.",
          label_en: "An alchemical transition into another state of consciousness.",
          vector: {
            primaryLight: { archetype: "magician", polarity: "light", points: 2 },
            secondaryLight: { archetype: "mystic", polarity: "light", points: 1 },
            primaryShadow: { archetype: "child", polarity: "shadow", points: 2 },
            secondaryShadow: { archetype: "sovereign", polarity: "shadow", points: 1 },
          },
        },
        {
          position: 2,
          label_fr: "La perte terrifiante de tout ce que j'ai bâti et contrôlé.",
          label_en: "The terrifying loss of everything I've built and controlled.",
          vector: {
            primaryLight: { archetype: "sovereign", polarity: "shadow", points: 2 },
            secondaryLight: { archetype: "warrior", polarity: "shadow", points: 1 },
            primaryShadow: { archetype: "explorer", polarity: "light", points: 2 },
            secondaryShadow: { archetype: "healer", polarity: "light", points: 1 },
          },
        },
        {
          position: 3,
          label_fr: "Un repos bien mérité après une vie de combats et de responsabilités.",
          label_en: "A well-earned rest after a life of battles and responsibilities.",
          vector: {
            primaryLight: { archetype: "caregiver", polarity: "shadow", points: 2 },
            secondaryLight: { archetype: "warrior", polarity: "light", points: 1 },
            primaryShadow: { archetype: "creator", polarity: "light", points: 2 },
            secondaryShadow: { archetype: "lover", polarity: "light", points: 1 },
          },
        },
        {
          position: 4,
          label_fr: "Une opportunité radicale de renaître sous une nouvelle forme.",
          label_en: "A radical opportunity to be reborn in a new form.",
          vector: {
            primaryLight: { archetype: "rebel", polarity: "light", points: 2 },
            secondaryLight: { archetype: "creator", polarity: "light", points: 1 },
            primaryShadow: { archetype: "victim", polarity: "shadow", points: 2 },
            secondaryShadow: { archetype: "prostitute", polarity: "shadow", points: 1 },
          },
        },
        {
          position: 5,
          label_fr: "L'abandon suprême dans l'amour inconditionnel de la Source.",
          label_en: "The supreme surrender into the unconditional love of Source.",
          vector: {
            primaryLight: { archetype: "lover", polarity: "light", points: 2 },
            secondaryLight: { archetype: "mystic", polarity: "light", points: 1 },
            primaryShadow: { archetype: "sage", polarity: "shadow", points: 2 },
            secondaryShadow: { archetype: "explorer", polarity: "shadow", points: 1 },
          },
        },
        {
          position: 6,
          label_fr: "Une donnée biologique et inéluctable à étudier sans peur.",
          label_en: "A biological, inevitable reality to study without fear.",
          vector: {
            primaryLight: { archetype: "sage", polarity: "light", points: 2 },
            secondaryLight: { archetype: "explorer", polarity: "light", points: 1 },
            primaryShadow: { archetype: "child", polarity: "shadow", points: 2 },
            secondaryShadow: { archetype: "victim", polarity: "shadow", points: 1 },
          },
        }
    ],
  },
  {
    position: 30,
    dimension: "spirituality",
    prompt_fr: "L'héritage que vous souhaitez laisser, c'est surtout…",
    prompt_en: "The legacy you wish to leave is mostly…",
    options: [
        {
          position: 1,
          label_fr: "Une structure, un empire ou une famille à l'abri du besoin.",
          label_en: "A structure, empire, or family shielded from want.",
          vector: {
            primaryLight: { archetype: "sovereign", polarity: "light", points: 2 },
            secondaryLight: { archetype: "caregiver", polarity: "light", points: 1 },
            primaryShadow: { archetype: "explorer", polarity: "shadow", points: 2 },
            secondaryShadow: { archetype: "rebel", polarity: "shadow", points: 1 },
          },
        },
        {
          position: 2,
          label_fr: "Une œuvre d'art, une méthode ou une invention novatrice.",
          label_en: "A work of art, method, or innovative invention.",
          vector: {
            primaryLight: { archetype: "creator", polarity: "light", points: 2 },
            secondaryLight: { archetype: "magician", polarity: "light", points: 1 },
            primaryShadow: { archetype: "prostitute", polarity: "shadow", points: 2 },
            secondaryShadow: { archetype: "saboteur", polarity: "shadow", points: 1 },
          },
        },
        {
          position: 3,
          label_fr: "Le souvenir d'une personne libre qui a vécu intensément.",
          label_en: "The memory of a free person who lived intensely.",
          vector: {
            primaryLight: { archetype: "explorer", polarity: "light", points: 2 },
            secondaryLight: { archetype: "lover", polarity: "light", points: 1 },
            primaryShadow: { archetype: "victim", polarity: "shadow", points: 2 },
            secondaryShadow: { archetype: "caregiver", polarity: "shadow", points: 1 },
          },
        },
        {
          position: 4,
          label_fr: "Un enseignement, une vérité ou un livre qui éveille les esprits.",
          label_en: "A teaching, truth, or book that awakens minds.",
          vector: {
            primaryLight: { archetype: "sage", polarity: "light", points: 2 },
            secondaryLight: { archetype: "mystic", polarity: "light", points: 1 },
            primaryShadow: { archetype: "child", polarity: "shadow", points: 2 },
            secondaryShadow: { archetype: "victim", polarity: "shadow", points: 1 },
          },
        },
        {
          position: 5,
          label_fr: "Une ligne de fracture : avoir abattu un système oppressif.",
          label_en: "A fracture line—a moment when an oppressive system was toppled.",
          vector: {
            primaryLight: { archetype: "rebel", polarity: "light", points: 2 },
            secondaryLight: { archetype: "warrior", polarity: "light", points: 1 },
            primaryShadow: { archetype: "caregiver", polarity: "shadow", points: 2 },
            secondaryShadow: { archetype: "prostitute", polarity: "shadow", points: 1 },
          },
        },
        {
          position: 6,
          label_fr: "Un sillage de guérison et d'amour dans le cœur des gens.",
          label_en: "A trail of healing and love left in people's hearts.",
          vector: {
            primaryLight: { archetype: "healer", polarity: "light", points: 2 },
            secondaryLight: { archetype: "lover", polarity: "light", points: 1 },
            primaryShadow: { archetype: "saboteur", polarity: "shadow", points: 2 },
            secondaryShadow: { archetype: "sovereign", polarity: "shadow", points: 1 },
          },
        }
    ],
  }
];

export const V4_QUESTION_COUNT = 30;

export const QUESTIONS_V4 = v4QuestionsToSeeds(V4_QUESTIONS);
