/**
 * Aegis Deep Dive — 70 questions, mapped to Caroline Myss' 12 houses.
 * Single source of truth for the V2 assessment. Seeded into DB on first load.
 */

import type { Question70 } from "./types";

// Helper to make declarations terser.
const w = (
  archetype: import("./types").AnyArchetypeKey,
  polarity: import("./types").Polarity,
  weight = 1
) => ({ archetype, polarity, weight });

export const QUESTIONS_70: Question70[] = [
  /* ========================== HOUSE 1 — Ego & personnalité ========================== */
  {
    id: "A1", position: 1, house: 1,
    prompt_fr: "Quand on te rencontre pour la première fois, on perçoit surtout :",
    prompt_en: "When people meet you for the first time, what they sense most is:",
    options: [
      { id: "A1A", label_fr: "Une présence calme, qui inspire confiance et autorité naturelle.", label_en: "A calm presence that inspires trust and natural authority.", weights: [w("sovereign", "light")] },
      { id: "A1B", label_fr: "Une énergie chaleureuse, qui met les autres à l'aise et les écoute.", label_en: "A warm energy that puts others at ease and listens.", weights: [w("caregiver", "light")] },
      { id: "A1C", label_fr: "Une vivacité curieuse, qui pose des questions et explore tout.", label_en: "A curious liveliness that asks questions and explores everything.", weights: [w("explorer", "light")] },
      { id: "A1D", label_fr: "Une distance protectrice, comme si tu jaugeais avant de t'ouvrir.", label_en: "A protective distance, as if you were sizing things up before opening.", weights: [w("saboteur", "shadow")] },
    ],
  },
  {
    id: "A2", position: 2, house: 1,
    prompt_fr: "Quand tu entres dans une pièce inconnue, ta réaction la plus spontanée est :",
    prompt_en: "When you walk into an unfamiliar room, your most spontaneous reaction is to:",
    options: [
      { id: "A2A", label_fr: "Scanner qui mène, qui suit, qui décide.", label_en: "Scan who leads, who follows, who decides.", weights: [w("sovereign", "light")] },
      { id: "A2B", label_fr: "Repérer qui semble seul ou en difficulté pour aller vers lui.", label_en: "Spot whoever seems alone or struggling and go toward them.", weights: [w("caregiver", "light")] },
      { id: "A2C", label_fr: "Te fondre discrètement, attendre qu'on vienne te chercher.", label_en: "Blend in quietly and wait to be approached.", weights: [w("child", "shadow")] },
      { id: "A2D", label_fr: "Chercher la sortie ou ce qui pourrait te coincer.", label_en: "Look for the exit or anything that might trap you.", weights: [w("victim", "shadow")] },
    ],
  },
  {
    id: "A9", position: 3, house: 1,
    prompt_fr: "Quand tu arrives quelque part (réunion, resto, soirée), ton énergie naturelle ressemble le plus à…",
    prompt_en: "When you arrive somewhere (meeting, restaurant, party), your natural energy looks most like…",
    options: [
      { id: "A9A", label_fr: "« Je suis là, je tiens la structure, je m'assure que tout se passe bien ».", label_en: "\"I'm here, I hold the structure, I make sure things go well.\"", weights: [w("sovereign", "light")] },
      { id: "A9B", label_fr: "« Je regarde d'abord, je me cale sur l'ambiance avant de me montrer ».", label_en: "\"I observe first, I attune to the atmosphere before showing up.\"", weights: [w("sage", "light")] },
      { id: "A9C", label_fr: "« Je fais un peu de bruit, je lance des blagues ou des piques pour tester les gens ».", label_en: "\"I make some noise, I throw jokes or jabs to test people.\"", weights: [w("jester", "shadow")] },
      { id: "A9D", label_fr: "« Je cherche instinctivement une figure plus forte à laquelle me coller pour me sentir en sécurité ».", label_en: "\"I instinctively look for a stronger figure to lean on for safety.\"", weights: [w("child", "shadow")] },
    ],
  },
  {
    id: "A10", position: 4, house: 1,
    prompt_fr: "Quand quelqu'un remet en question qui tu es (ta manière d'être, ta personnalité), tu…",
    prompt_en: "When someone questions who you are (your way of being, your personality), you…",
    options: [
      { id: "A10A", label_fr: "Te replies, tu te sens petit, et tu as du mal à te défendre.", label_en: "Withdraw, feel small, and struggle to defend yourself.", weights: [w("victim", "shadow")] },
      { id: "A10B", label_fr: "Te redresses, tu recadres calmement, tu gardes ton axe.", label_en: "Straighten up, calmly reframe, hold your axis.", weights: [w("warrior", "light")] },
      { id: "A10C", label_fr: "Pars dans l'humour ou la dérision pour ne pas montrer que ça te touche.", label_en: "Hide behind humor or mockery so it doesn't show that it hurt.", weights: [w("jester", "shadow")] },
      { id: "A10D", label_fr: "Changes de forme pour t'adapter à ce qu'on attend de toi, quitte à te perdre.", label_en: "Shape-shift to match what's expected, even if you lose yourself.", weights: [w("child", "shadow")] },
    ],
  },
  {
    id: "A11", position: 5, house: 1,
    prompt_fr: "Quand un groupe doit prendre une direction et que personne ne décide vraiment, tu…",
    prompt_en: "When a group has to choose a direction and no one really decides, you…",
    options: [
      { id: "A11A", label_fr: "Prends la tête, « quelqu'un doit décider, je m'en charge ».", label_en: "Step up — \"someone has to decide, I'll do it.\"", weights: [w("sovereign", "light")] },
      { id: "A11B", label_fr: "Essaies de rallier les gens par la persuasion, les idées, la vision.", label_en: "Try to rally people through persuasion, ideas, vision.", weights: [w("sage", "light")] },
      { id: "A11C", label_fr: "T'agaces intérieurement mais tu n'oses pas prendre la place, tu subis.", label_en: "Get internally frustrated but don't dare step in — you endure.", weights: [w("victim", "shadow")] },
      { id: "A11D", label_fr: "Commences à saboter (critiques, blagues, distance) plutôt que d'entrer dans le rôle.", label_en: "Start sabotaging (criticism, jokes, distance) rather than stepping in.", weights: [w("saboteur", "shadow")] },
    ],
  },
  {
    id: "A12", position: 6, house: 1,
    prompt_fr: "Sous gros stress (deadlines, conflit, surcharge), ta première réaction intérieure typique est…",
    prompt_en: "Under heavy stress (deadlines, conflict, overload), your typical first inner reaction is…",
    options: [
      { id: "A12A", label_fr: "« Il faut que je contrôle tout, sinon ça va s'écrouler ».", label_en: "\"I must control everything or it will collapse.\"", weights: [w("sovereign", "shadow")] },
      { id: "A12B", label_fr: "« J'ai envie de disparaître, qu'on s'occupe de moi ».", label_en: "\"I want to disappear, I want someone to take care of me.\"", weights: [w("child", "shadow")] },
      { id: "A12C", label_fr: "« Je vais me battre, je ne lâche rien ».", label_en: "\"I'll fight, I won't let go.\"", weights: [w("warrior", "light")] },
      { id: "A12D", label_fr: "« Je vais faire un pas de côté, observer, voir ce que la situation m'apprend ».", label_en: "\"I'll step aside, observe, see what the situation teaches me.\"", weights: [w("sage", "light")] },
    ],
  },

  /* ========================== HOUSE 2 — Valeurs & sécurité ========================== */
  {
    id: "A3", position: 7, house: 2,
    prompt_fr: "Devant un risque financier important, ta première impulsion est de…",
    prompt_en: "Facing a significant financial risk, your first impulse is to…",
    options: [
      { id: "A3A", label_fr: "Évaluer froidement, modéliser, sécuriser avant de bouger.", label_en: "Coolly assess, model, secure before moving.", weights: [w("sage", "light")] },
      { id: "A3B", label_fr: "Y aller : la peur de manquer t'angoisse plus que l'échec.", label_en: "Go for it: the fear of missing out hurts more than failing.", weights: [w("warrior", "light")] },
      { id: "A3C", label_fr: "Laisser quelqu'un d'autre décider à ta place.", label_en: "Let someone else decide for you.", weights: [w("victim", "shadow")] },
      { id: "A3D", label_fr: "Te dire que tu trouveras toujours un arrangement, quitte à plier tes valeurs.", label_en: "Tell yourself you'll always find a way, even if you bend your values.", weights: [w("prostitute", "shadow")] },
    ],
  },
  {
    id: "A4", position: 8, house: 2,
    prompt_fr: "Ce qui te sécurise le plus profondément, c'est :",
    prompt_en: "What makes you feel most deeply secure is:",
    options: [
      { id: "A4A", label_fr: "Un capital, une épargne, une marge tangible.", label_en: "Capital, savings, a tangible buffer.", weights: [w("sovereign", "light")] },
      { id: "A4B", label_fr: "Un cercle de personnes solides sur qui compter.", label_en: "A solid circle of people you can count on.", weights: [w("caregiver", "light")] },
      { id: "A4C", label_fr: "Ta capacité à rebondir, à recréer si tout brûle.", label_en: "Your ability to bounce back, to rebuild if everything burns.", weights: [w("warrior", "light")] },
      { id: "A4D", label_fr: "Le fait de ne dépendre de personne, même si tu es seul.", label_en: "The fact of depending on no one, even if you're alone.", weights: [w("rebel", "shadow")] },
    ],
  },
  {
    id: "A13", position: 9, house: 2,
    prompt_fr: "Face à un choix entre sécurité matérielle et respect de toi-même, tu sacrifies le plus souvent…",
    prompt_en: "Faced with a choice between material security and self-respect, you most often sacrifice…",
    options: [
      { id: "A13A", label_fr: "Ton corps (sommeil, santé) pour garder le job ou le revenu.", label_en: "Your body (sleep, health) to keep the job or income.", weights: [w("saboteur", "shadow")] },
      { id: "A13B", label_fr: "Tes envies profondes, en te disant que ce n'est « pas le moment ».", label_en: "Your deep desires, telling yourself \"it's not the right time.\"", weights: [w("prostitute", "shadow")] },
      { id: "A13C", label_fr: "Une partie de ton confort matériel pour rester aligné avec tes valeurs.", label_en: "Some material comfort to stay aligned with your values.", weights: [w("prostitute", "light")] },
      { id: "A13D", label_fr: "Ton besoin de contrôle, pour faire confiance à un projet qui te parle vraiment.", label_en: "Your need for control, to trust a project that truly speaks to you.", weights: [w("creator", "light")] },
    ],
  },
  {
    id: "A14", position: 10, house: 2,
    prompt_fr: "Ton rapport instinctif aux objets / à l'argent que tu « possèdes » ressemble plus à…",
    prompt_en: "Your instinctive relationship to the things / money you \"own\" looks more like…",
    options: [
      { id: "A14A", label_fr: "« C'est à moi, je dois le protéger et en garder le contrôle ».", label_en: "\"It's mine, I must protect it and keep control of it.\"", weights: [w("sovereign", "shadow")] },
      { id: "A14B", label_fr: "« Ça circule, l'argent doit bouger, servir, créer des choses ».", label_en: "\"It circulates, money should move, serve, create things.\"", weights: [w("creator", "light")] },
      { id: "A14C", label_fr: "« Je me sens coupable d'avoir plus ou moins que les autres ».", label_en: "\"I feel guilty for having more or less than others.\"", weights: [w("victim", "shadow")] },
      { id: "A14D", label_fr: "« Je sais qu'on peut tenter de m'acheter, j'y suis vigilant ».", label_en: "\"I know I can be tempted to be bought — I stay vigilant.\"", weights: [w("prostitute", "light")] },
    ],
  },
  {
    id: "A15", position: 11, house: 2,
    prompt_fr: "Pour te sentir vraiment en sécurité dans ta vie matérielle, il te faut avant tout…",
    prompt_en: "To truly feel safe in your material life, what you need most is…",
    options: [
      { id: "A15A", label_fr: "Une somme d'argent ou un revenu précis, même si le contexte ne te respecte pas.", label_en: "A specific amount of money or income, even in a context that disrespects you.", weights: [w("prostitute", "shadow")] },
      { id: "A15B", label_fr: "Des relations fiables, des alliances, un réseau solide.", label_en: "Reliable relationships, alliances, a strong network.", weights: [w("magician", "light")] },
      { id: "A15C", label_fr: "Sentir que tu peux te débrouiller, rebondir, créer des solutions.", label_en: "To feel you can manage, bounce back, create solutions.", weights: [w("warrior", "light")] },
      { id: "A15D", label_fr: "Un environnement où tu peux être toi-même, peu importe ce que tu gagnes.", label_en: "An environment where you can be yourself, regardless of income.", weights: [w("sage", "light")] },
    ],
  },
  {
    id: "A16", position: 12, house: 2,
    prompt_fr: "Si tu observes ta peur la plus profonde autour de l'argent, elle ressemble le plus à…",
    prompt_en: "If you watch your deepest fear around money, it looks most like…",
    options: [
      { id: "A16A", label_fr: "« Si je perds, je ne vaux plus rien ».", label_en: "\"If I lose, I'm worth nothing.\"", weights: [w("victim", "shadow")] },
      { id: "A16B", label_fr: "« Si je refuse certaines opportunités, je ne m'en sortirai jamais ».", label_en: "\"If I refuse certain opportunities, I'll never make it.\"", weights: [w("prostitute", "shadow")] },
      { id: "A16C", label_fr: "« Si j'en ai, les autres vont vouloir me le prendre ou me contrôler ».", label_en: "\"If I have it, others will try to take it or control me.\"", weights: [w("sovereign", "shadow")] },
      { id: "A16D", label_fr: "« Si j'en ai trop peu, je vais perdre ma liberté de créer ou d'explorer ».", label_en: "\"If I have too little, I'll lose my freedom to create or explore.\"", weights: [w("creator", "shadow")] },
    ],
  },

  /* ========================== HOUSE 3 — Expression & décisions ========================== */
  {
    id: "A5", position: 13, house: 3,
    prompt_fr: "Tu sens que tu deviens vraiment toi-même quand tu…",
    prompt_en: "You feel you become truly yourself when you…",
    options: [
      { id: "A5A", label_fr: "Crées quelque chose qui n'existait pas avant.", label_en: "Create something that didn't exist before.", weights: [w("creator", "light")] },
      { id: "A5B", label_fr: "Aides quelqu'un à traverser un passage difficile.", label_en: "Help someone cross a difficult passage.", weights: [w("healer", "light")] },
      { id: "A5C", label_fr: "Comprends profondément un sujet ou une personne.", label_en: "Deeply understand a topic or a person.", weights: [w("sage", "light")] },
      { id: "A5D", label_fr: "Casses un système ou une règle qui ne te convient plus.", label_en: "Break a system or rule that no longer fits you.", weights: [w("rebel", "light")] },
    ],
  },
  {
    id: "A17", position: 14, house: 3,
    prompt_fr: "Quand tu n'es pas d'accord avec quelqu'un mais que la relation compte pour toi, tu…",
    prompt_en: "When you disagree with someone but the relationship matters to you, you…",
    options: [
      { id: "A17A", label_fr: "Dis ce que tu penses clairement, même si c'est inconfortable.", label_en: "Say what you think clearly, even if it's uncomfortable.", weights: [w("warrior", "light")] },
      { id: "A17B", label_fr: "Arrondis tellement les angles que ton message ne passe presque plus.", label_en: "Soften the message so much it barely lands.", weights: [w("victim", "shadow")] },
      { id: "A17C", label_fr: "Fais passer le message par l'humour ou l'ironie.", label_en: "Pass the message through humor or irony.", weights: [w("jester", "shadow")] },
      { id: "A17D", label_fr: "Te tais, puis tu te retires progressivement de la relation.", label_en: "Stay silent, then slowly withdraw from the relationship.", weights: [w("saboteur", "shadow")] },
    ],
  },
  {
    id: "A18", position: 15, house: 3,
    prompt_fr: "Quand une décision que tu as prise tourne mal, ton réflexe le plus fréquent est de…",
    prompt_en: "When a decision you made goes wrong, your most frequent reflex is to…",
    options: [
      { id: "A18A", label_fr: "Reconnaître ta part, voir ce que tu peux ajuster.", label_en: "Own your part, see what you can adjust.", weights: [w("sage", "light")] },
      { id: "A18B", label_fr: "Blâmer quelqu'un d'autre ou « la vie », même si tu sais que tu as décidé.", label_en: "Blame someone else or \"life,\" even though you decided.", weights: [w("victim", "shadow")] },
      { id: "A18C", label_fr: "Faire comme si tu n'y étais pour rien, oublier, passer à autre chose.", label_en: "Act as if you had nothing to do with it, forget, move on.", weights: [w("child", "shadow")] },
      { id: "A18D", label_fr: "Utiliser l'échec comme matière à apprendre, en tirer du sens.", label_en: "Use the failure as material to learn from, draw meaning out of it.", weights: [w("sage", "light")] },
    ],
  },
  {
    id: "A19", position: 16, house: 3,
    prompt_fr: "Quand tu es très en colère, ta parole devient plutôt…",
    prompt_en: "When you're very angry, your speech tends to become…",
    options: [
      { id: "A19A", label_fr: "Coupante, tu cherches à toucher là où ça fait mal.", label_en: "Cutting — you aim to hit where it hurts.", weights: [w("warrior", "shadow")] },
      { id: "A19B", label_fr: "Drôle et cynique, tu ridiculises la situation ou la personne.", label_en: "Funny and cynical, you ridicule the situation or person.", weights: [w("jester", "shadow")] },
      { id: "A19C", label_fr: "Complètement bloquée, tu n'arrives plus à parler.", label_en: "Completely blocked — you can't speak anymore.", weights: [w("child", "shadow")] },
      { id: "A19D", label_fr: "Capable de nommer ce que tu ressens sans détruire l'autre.", label_en: "Able to name what you feel without destroying the other.", weights: [w("sage", "light")] },
    ],
  },
  {
    id: "A20", position: 17, house: 3,
    prompt_fr: "Quand tu dois décider vite, sans toutes les infos, tu…",
    prompt_en: "When you must decide fast, without full information, you…",
    options: [
      { id: "A20A", label_fr: "Cherches un signe extérieur ou l'avis d'une figure « plus sage ».", label_en: "Look for an external sign or the advice of a \"wiser\" figure.", weights: [w("child", "shadow")] },
      { id: "A20B", label_fr: "Te connectes à ton ressenti, tu tranches en suivant ton intuition.", label_en: "Connect to your feeling, decide by following intuition.", weights: [w("mystic", "light")] },
      { id: "A20C", label_fr: "Analyses rapidement risques et bénéfices, même imparfaitement.", label_en: "Rapidly weigh risks and benefits, even imperfectly.", weights: [w("magician", "light")] },
      { id: "A20D", label_fr: "Laisses quelqu'un d'autre décider, puis tu critiques si ça se passe mal.", label_en: "Let someone else decide, then criticize if it goes wrong.", weights: [w("saboteur", "shadow")] },
    ],
  },
  {
    id: "A21", position: 18, house: 3,
    prompt_fr: "Tu as l'impression d'être pleinement toi-même quand tu…",
    prompt_en: "You feel fully yourself when you…",
    options: [
      { id: "A21A", label_fr: "Racontes une histoire, transmets une idée, partages une compréhension.", label_en: "Tell a story, transmit an idea, share an understanding.", weights: [w("sage", "light")] },
      { id: "A21B", label_fr: "Fais rire, allèges les autres, transformes un moment lourd.", label_en: "Make people laugh, lighten others, transform a heavy moment.", weights: [w("jester", "light")] },
      { id: "A21C", label_fr: "Défends ton point de vue dans un débat, prends position.", label_en: "Defend your view in a debate, take a stand.", weights: [w("warrior", "light")] },
      { id: "A21D", label_fr: "Donnes la parole aux autres, crées un espace où chacun peut s'exprimer.", label_en: "Give voice to others, create space where everyone can express.", weights: [w("caregiver", "light")] },
    ],
  },

  /* ========================== HOUSE 4 — Foyer & racines ========================== */
  {
    id: "A6", position: 19, house: 4,
    prompt_fr: "Quand tu repenses à un échec marquant, ce qui domine, c'est…",
    prompt_en: "When you think back to a notable failure, what dominates is…",
    options: [
      { id: "A6A", label_fr: "La leçon que tu as fini par en tirer.", label_en: "The lesson you eventually drew from it.", weights: [w("sage", "light")] },
      { id: "A6B", label_fr: "Le sentiment d'avoir trahi quelqu'un (toi inclus).", label_en: "The feeling of having betrayed someone (including yourself).", weights: [w("victim", "shadow")] },
      { id: "A6C", label_fr: "La preuve que tu peux encaisser, tu en es sorti.", label_en: "The proof that you can take a hit and come out of it.", weights: [w("warrior", "light")] },
      { id: "A6D", label_fr: "L'envie de tout reprendre depuis zéro, autrement.", label_en: "The urge to start over from scratch, differently.", weights: [w("creator", "light")] },
    ],
  },
  {
    id: "A22", position: 20, house: 4,
    prompt_fr: "Tu te sens vraiment « chez toi » surtout quand…",
    prompt_en: "You truly feel \"at home\" mostly when…",
    options: [
      { id: "A22A", label_fr: "Tu es avec des personnes que tu peux protéger / soutenir.", label_en: "You're with people you can protect or support.", weights: [w("caregiver", "light")] },
      { id: "A22B", label_fr: "Tu peux être vulnérable sans avoir peur qu'on t'écrase.", label_en: "You can be vulnerable without fearing being crushed.", weights: [w("child", "light")] },
      { id: "A22C", label_fr: "Il y a de la profondeur, des conversations vraies, du sens.", label_en: "There is depth, true conversations, meaning.", weights: [w("mystic", "light")] },
      { id: "A22D", label_fr: "Tu peux partir quand tu veux, sans te sentir attaché.", label_en: "You can leave whenever you want, without feeling tied down.", weights: [w("explorer", "shadow")] },
    ],
  },
  {
    id: "A23", position: 21, house: 4,
    prompt_fr: "En pensant à ta famille d'origine, tu sens que tu as surtout hérité…",
    prompt_en: "Thinking of your family of origin, what you mainly inherited is…",
    options: [
      { id: "A23A", label_fr: "D'un sens fort de la responsabilité, parfois lourd.", label_en: "A strong sense of responsibility, sometimes heavy.", weights: [w("sovereign", "light")] },
      { id: "A23B", label_fr: "D'une tendance à te sacrifier pour que tout le monde tienne.", label_en: "A tendency to sacrifice yourself so everyone else holds up.", weights: [w("caregiver", "shadow")] },
      { id: "A23C", label_fr: "D'un sentiment profond de manque, d'abandon, de ne jamais être assez.", label_en: "A deep feeling of lack, abandonment, never being enough.", weights: [w("victim", "shadow")] },
      { id: "A23D", label_fr: "D'une capacité à te relever et à créer ton propre chemin.", label_en: "A capacity to rise back up and create your own path.", weights: [w("rebel", "light")] },
    ],
  },
  {
    id: "A24", position: 22, house: 4,
    prompt_fr: "Quand une tension familiale réapparaît (drame, reproches, vieux schémas), tu…",
    prompt_en: "When a family tension resurfaces (drama, reproach, old patterns), you…",
    options: [
      { id: "A24A", label_fr: "Essaies de réparer, de jouer le médiateur, même si tu t'épuises.", label_en: "Try to repair, mediate, even at the cost of exhaustion.", weights: [w("healer", "shadow")] },
      { id: "A24B", label_fr: "Retombes dans ton rôle d'enfant (obéissant, rebelle, invisible…).", label_en: "Fall back into your child role (obedient, rebellious, invisible…).", weights: [w("child", "shadow")] },
      { id: "A24C", label_fr: "Coupes net, tu prends de la distance, tu te protèges.", label_en: "Cut clean, take distance, protect yourself.", weights: [w("warrior", "shadow")] },
      { id: "A24D", label_fr: "Cherches à comprendre le contrat derrière, ce que ça te fait travailler.", label_en: "Try to understand the underlying contract, what it's working in you.", weights: [w("mystic", "light")] },
    ],
  },
  {
    id: "A25", position: 23, house: 4,
    prompt_fr: "Dans la façon dont tu as construit (ou veux construire) ton propre foyer, tu…",
    prompt_en: "In how you've built (or want to build) your own home, you…",
    options: [
      { id: "A25A", label_fr: "Reproduis en grande partie ce que tu as connu, même si tu le critiques.", label_en: "Largely reproduce what you knew, even while criticizing it.", weights: [w("saboteur", "shadow")] },
      { id: "A25B", label_fr: "Fais tout pour faire l'inverse de ce que tu as reçu.", label_en: "Do everything to do the opposite of what you received.", weights: [w("rebel", "shadow")] },
      { id: "A25C", label_fr: "Choisis consciemment ce que tu gardes, transformes, laisses.", label_en: "Consciously choose what you keep, transform, leave.", weights: [w("sage", "light")] },
      { id: "A25D", label_fr: "Cherches surtout à offrir un espace de guérison aux autres.", label_en: "Mostly seek to offer a healing space to others.", weights: [w("healer", "light")] },
    ],
  },
  {
    id: "A26", position: 24, house: 4,
    prompt_fr: "Quand tu te sens seul ou en difficulté, ta voix intérieure ressemble le plus à…",
    prompt_en: "When you feel lonely or in trouble, your inner voice sounds most like…",
    options: [
      { id: "A26A", label_fr: "Une voix dure, critique, qui te reproche de ne pas être assez.", label_en: "A harsh, critical voice blaming you for not being enough.", weights: [w("saboteur", "shadow")] },
      { id: "A26B", label_fr: "Une voix parentale protectrice, parfois trop, qui te garde « petit ».", label_en: "A parental, overly protective voice that keeps you \"small.\"", weights: [w("child", "shadow")] },
      { id: "A26C", label_fr: "Une présence douce qui te rappelle ce que tu as déjà traversé.", label_en: "A gentle presence reminding you of what you've already crossed.", weights: [w("healer", "light")] },
      { id: "A26D", label_fr: "Un silence, un espace où tu te relies à plus grand que toi.", label_en: "A silence, a space where you connect to something larger than you.", weights: [w("mystic", "light")] },
    ],
  },

  /* ========================== HOUSE 5 — Créativité & plaisir ========================== */
  {
    id: "A7", position: 25, house: 5,
    prompt_fr: "Pour te ressourcer en profondeur, tu as surtout besoin de…",
    prompt_en: "To deeply replenish yourself, you mostly need…",
    options: [
      { id: "A7A", label_fr: "Solitude, silence, nature.", label_en: "Solitude, silence, nature.", weights: [w("mystic", "light")] },
      { id: "A7B", label_fr: "Mouvement, sport, défoulement physique.", label_en: "Movement, sport, physical release.", weights: [w("warrior", "light")] },
      { id: "A7C", label_fr: "Conversations profondes avec quelques proches choisis.", label_en: "Deep conversations with a few chosen close ones.", weights: [w("lover", "light")] },
      { id: "A7D", label_fr: "Création, expression artistique, mains dans la matière.", label_en: "Creation, artistic expression, hands in the material.", weights: [w("creator", "light")] },
    ],
  },
  {
    id: "A27", position: 26, house: 5,
    prompt_fr: "Quand une nouvelle idée te traverse (projet, création, concept), tu…",
    prompt_en: "When a new idea crosses you (project, creation, concept), you…",
    options: [
      { id: "A27A", label_fr: "La notes, la protèges, tu vois tout de suite comment elle pourrait devenir réelle.", label_en: "Note it, protect it, immediately see how it could become real.", weights: [w("creator", "light")] },
      { id: "A27B", label_fr: "La partages tout de suite avec enthousiasme, parfois avant de l'avoir structurée.", label_en: "Share it right away with enthusiasm, sometimes before structuring it.", weights: [w("child", "light")] },
      { id: "A27C", label_fr: "La gardes pour toi par peur qu'on te la vole ou qu'on la juge.", label_en: "Keep it to yourself, fearing it'll be stolen or judged.", weights: [w("victim", "shadow")] },
      { id: "A27D", label_fr: "L'utilises pour obtenir quelque chose (attention, pouvoir) sans la développer.", label_en: "Use it to get something (attention, power) without developing it.", weights: [w("magician", "shadow")] },
    ],
  },
  {
    id: "A28", position: 27, house: 5,
    prompt_fr: "Dans ta façon d'utiliser ton charme, ton corps, ta sensualité, tu te reconnais le plus dans…",
    prompt_en: "In how you use your charm, body, sensuality, you recognize yourself most in…",
    options: [
      { id: "A28A", label_fr: "Une manière naturelle d'être vivant, présent, chaleureux, sans intention cachée.", label_en: "A natural way of being alive, present, warm, with no hidden intent.", weights: [w("lover", "light")] },
      { id: "A28B", label_fr: "Une tendance à séduire pour te rassurer sur ta valeur.", label_en: "A tendency to seduce to reassure yourself of your worth.", weights: [w("lover", "shadow")] },
      { id: "A28C", label_fr: "Une énergie plutôt retenue, qui passe beaucoup plus par l'esprit que par le corps.", label_en: "A rather restrained energy, going through the mind much more than the body.", weights: [w("sage", "light")] },
      { id: "A28D", label_fr: "Une utilisation consciente de ton charisme pour obtenir ce que tu veux.", label_en: "A conscious use of your charisma to get what you want.", weights: [w("magician", "shadow")] },
    ],
  },
  {
    id: "A29", position: 28, house: 5,
    prompt_fr: "Ta relation au jeu (plaisir, fun, légèreté) ressemble le plus à…",
    prompt_en: "Your relationship to play (pleasure, fun, lightness) looks most like…",
    options: [
      { id: "A29A", label_fr: "Tu en as besoin pour garder ton cœur ouvert et ton énergie haute.", label_en: "You need it to keep your heart open and your energy high.", weights: [w("child", "light")] },
      { id: "A29B", label_fr: "Tu te le refuses souvent, comme si tu devais d'abord « mériter ».", label_en: "You often deny it to yourself, as if you had to \"earn\" it first.", weights: [w("victim", "shadow")] },
      { id: "A29C", label_fr: "Tu en fais parfois trop, pour ne pas regarder ce qui fait mal.", label_en: "You sometimes overdo it, to avoid looking at what hurts.", weights: [w("jester", "shadow")] },
      { id: "A29D", label_fr: "Tu l'infuses dans ton travail, ta manière de créer, sans perdre le sens.", label_en: "You infuse it into your work and way of creating, without losing meaning.", weights: [w("creator", "light")] },
    ],
  },
  {
    id: "A30", position: 29, house: 5,
    prompt_fr: "Quand il t'arrive un coup de chance (opportunité, synchronicité, aide inattendue), tu…",
    prompt_en: "When you get a stroke of luck (opportunity, synchronicity, unexpected help), you…",
    options: [
      { id: "A30A", label_fr: "Dis « merci », tu vois ça comme un signe que tu es aligné.", label_en: "Say \"thank you\" — you see it as a sign you're aligned.", weights: [w("mystic", "light")] },
      { id: "A30B", label_fr: "Cherches à comprendre comment le reproduire, à décoder le « système ».", label_en: "Try to understand how to reproduce it, to decode the \"system.\"", weights: [w("magician", "light")] },
      { id: "A30C", label_fr: "Te sens presque coupable, comme si tu ne le méritais pas.", label_en: "Feel almost guilty, as if you didn't deserve it.", weights: [w("victim", "shadow")] },
      { id: "A30D", label_fr: "Le racontes avec joie pour inspirer d'autres à croire en leur chance.", label_en: "Share it joyfully to inspire others to believe in their luck.", weights: [w("jester", "light")] },
    ],
  },
  {
    id: "A31", position: 30, house: 5,
    prompt_fr: "Quand tu crées (ou que tu joues avec une idée), ton « enfant intérieur »…",
    prompt_en: "When you create (or play with an idea), your \"inner child\"…",
    options: [
      { id: "A31A", label_fr: "S'enflamme, rêve grand, voit des mondes entiers.", label_en: "Catches fire, dreams big, sees entire worlds.", weights: [w("child", "light")] },
      { id: "A31B", label_fr: "Se décourage vite, pense que ce ne sera jamais assez bien.", label_en: "Discourages quickly, thinks it'll never be good enough.", weights: [w("child", "shadow")] },
      { id: "A31C", label_fr: "Se sent utile quand ce que tu crées aide quelqu'un.", label_en: "Feels useful when what you create helps someone.", weights: [w("healer", "light")] },
      { id: "A31D", label_fr: "Se cache, laisse l'adulte rationnel gérer tout le processus.", label_en: "Hides, lets the rational adult handle the whole process.", weights: [w("saboteur", "shadow")] },
    ],
  },

  /* ========================== HOUSE 6 — Travail & santé ========================== */
  {
    id: "A8", position: 31, house: 6,
    prompt_fr: "Quand ton environnement de vie devient toxique (job, lieu, relation), tu…",
    prompt_en: "When your life environment becomes toxic (job, place, relationship), you…",
    options: [
      { id: "A8A", label_fr: "Tiens en serrant les dents, par peur de perdre la sécurité matérielle.", label_en: "Hang on through gritted teeth, fearing loss of material security.", weights: [w("prostitute", "shadow")] },
      { id: "A8B", label_fr: "Cherches activement des ajustements pour retrouver un équilibre.", label_en: "Actively seek adjustments to restore balance.", weights: [w("sovereign", "light")] },
      { id: "A8C", label_fr: "Envoies tout valser, parfois sans plan, pour arrêter d'être broyé.", label_en: "Throw it all away, sometimes without a plan, to stop being crushed.", weights: [w("saboteur", "shadow")] },
      { id: "A8D", label_fr: "Commences par t'occuper de ton corps/énergie, même si rien ne change tout de suite.", label_en: "Start by tending your body/energy, even if nothing else shifts yet.", weights: [w("healer", "light")] },
    ],
  },
  {
    id: "A32", position: 32, house: 6,
    prompt_fr: "Quand tu vois quelque chose de clairement contraire à tes valeurs au travail, tu…",
    prompt_en: "When you see something clearly against your values at work, you…",
    options: [
      { id: "A32A", label_fr: "Te tais, tu te dis que ce n'est pas ton problème.", label_en: "Stay silent, telling yourself it's not your problem.", weights: [w("victim", "shadow")] },
      { id: "A32B", label_fr: "Cherches à en parler, au bon moment, de manière constructive.", label_en: "Try to bring it up, at the right time, constructively.", weights: [w("warrior", "light")] },
      { id: "A32C", label_fr: "Utilises l'info pour te protéger ou garder un levier.", label_en: "Use the info to protect yourself or keep leverage.", weights: [w("magician", "shadow")] },
      { id: "A32D", label_fr: "Te dis que tant que tu es payé, tu n'as pas le luxe d'être trop exigeant.", label_en: "Tell yourself that as long as you're paid, you can't afford to be picky.", weights: [w("prostitute", "shadow")] },
    ],
  },
  {
    id: "A33", position: 33, house: 6,
    prompt_fr: "Quand il faut « performer » et que ton corps dit stop, tu…",
    prompt_en: "When you must \"perform\" and your body says stop, you…",
    options: [
      { id: "A33A", label_fr: "Forces malgré tout, quitte à te rendre malade.", label_en: "Push through anyway, even at the risk of getting sick.", weights: [w("saboteur", "shadow")] },
      { id: "A33B", label_fr: "Ajustes ta manière de travailler, même si ça déplaît.", label_en: "Adjust how you work, even if it displeases others.", weights: [w("warrior", "light")] },
      { id: "A33C", label_fr: "Priorises clairement ton corps, même si ça ralentit ta progression.", label_en: "Clearly prioritize your body, even if it slows your progress.", weights: [w("healer", "light")] },
      { id: "A33D", label_fr: "Te sens pris au piège, incapable de faire un choix qui te respecte.", label_en: "Feel trapped, unable to make a choice that respects you.", weights: [w("victim", "shadow")] },
    ],
  },
  {
    id: "A34", position: 34, house: 6,
    prompt_fr: "Ce qui te fait vraiment tenir dans ton travail, en profondeur, c'est surtout…",
    prompt_en: "What truly keeps you going in your work, deep down, is mostly…",
    options: [
      { id: "A34A", label_fr: "Le sentiment d'être utile, d'aider concrètement.", label_en: "The feeling of being useful, of concretely helping.", weights: [w("caregiver", "light")] },
      { id: "A34B", label_fr: "La sécurité, le salaire, le statut.", label_en: "Security, salary, status.", weights: [w("prostitute", "shadow")] },
      { id: "A34C", label_fr: "Le challenge, l'adrénaline, les problèmes à résoudre.", label_en: "The challenge, the adrenaline, the problems to solve.", weights: [w("warrior", "light")] },
      { id: "A34D", label_fr: "La liberté de créer, d'apprendre, de bouger.", label_en: "The freedom to create, learn, move.", weights: [w("creator", "light")] },
    ],
  },
  {
    id: "A35", position: 35, house: 6,
    prompt_fr: "Quand ton corps développe un symptôme (douleur, fatigue, trouble), tu…",
    prompt_en: "When your body develops a symptom (pain, fatigue, disorder), you…",
    options: [
      { id: "A35A", label_fr: "L'ignores tant que tu peux, jusqu'à ce que ça devienne critique.", label_en: "Ignore it as long as you can, until it becomes critical.", weights: [w("saboteur", "shadow")] },
      { id: "A35B", label_fr: "Cherches rapidement un sens, ce que ta vie essaie de te dire.", label_en: "Quickly look for meaning, what your life is trying to say.", weights: [w("mystic", "light")] },
      { id: "A35C", label_fr: "Prends ça au sérieux, tu ajustes ton hygiène de vie.", label_en: "Take it seriously, adjust your lifestyle.", weights: [w("healer", "light")] },
      { id: "A35D", label_fr: "Te vois comme une victime de la malchance ou de ton passé.", label_en: "See yourself as a victim of bad luck or of your past.", weights: [w("victim", "shadow")] },
    ],
  },
  {
    id: "A36", position: 36, house: 6,
    prompt_fr: "Ta valeur personnelle est, en pratique, surtout liée à…",
    prompt_en: "In practice, your sense of personal worth is mostly tied to…",
    options: [
      { id: "A36A", label_fr: "Ce que tu accomplis, produis, coches.", label_en: "What you accomplish, produce, check off.", weights: [w("warrior", "shadow")] },
      { id: "A36B", label_fr: "Le fait de tenir ton rôle auprès des autres (famille, clients, équipe).", label_en: "Holding your role for others (family, clients, team).", weights: [w("caregiver", "shadow")] },
      { id: "A36C", label_fr: "Ton alignement intérieur, même si l'extérieur n'est pas parfait.", label_en: "Your inner alignment, even if outer life isn't perfect.", weights: [w("sage", "light")] },
      { id: "A36D", label_fr: "Le regard et la reconnaissance que tu reçois pour ton travail.", label_en: "The gaze and recognition you receive for your work.", weights: [w("child", "shadow")] },
    ],
  },

  /* ========================== HOUSE 7 — Relations & partenariats ========================== */
  {
    id: "A37", position: 37, house: 7,
    prompt_fr: "Dans une relation de couple (ou partenariat très proche), tu te retrouves le plus souvent dans le rôle de…",
    prompt_en: "In a couple (or very close partnership), you most often find yourself in the role of…",
    options: [
      { id: "A37A", label_fr: "Celui/celle qui porte, organise, sécurise la relation.", label_en: "The one who carries, organizes, secures the relationship.", weights: [w("sovereign", "light")] },
      { id: "A37B", label_fr: "Celui/celle qui donne, soutient, prend soin, parfois au détriment de soi.", label_en: "The one who gives, supports, cares — sometimes at one's own cost.", weights: [w("caregiver", "shadow")] },
      { id: "A37C", label_fr: "Celui/celle qui pousse au changement, qui ne supporte pas la stagnation.", label_en: "The one who pushes for change, who can't stand stagnation.", weights: [w("rebel", "light")] },
      { id: "A37D", label_fr: "Celui/celle qui a peur d'être abandonné ou remplacé.", label_en: "The one who fears being abandoned or replaced.", weights: [w("child", "shadow")] },
    ],
  },
  {
    id: "A38", position: 38, house: 7,
    prompt_fr: "En cas de conflit dans une relation importante, tu…",
    prompt_en: "In a conflict within an important relationship, you…",
    options: [
      { id: "A38A", label_fr: "Veux surtout éviter que la relation casse, quitte à te renier.", label_en: "Mostly want to keep the relationship from breaking, even if you betray yourself.", weights: [w("prostitute", "shadow")] },
      { id: "A38B", label_fr: "Préfères dire la vérité, même si ça remet tout en question.", label_en: "Prefer to tell the truth, even if it puts everything back in question.", weights: [w("warrior", "light")] },
      { id: "A38C", label_fr: "Cherches à réparer, à comprendre, à guérir ce qui est blessé.", label_en: "Seek to repair, understand, heal what's wounded.", weights: [w("healer", "light")] },
      { id: "A38D", label_fr: "Commences à prendre tes distances, parfois sans dire ce qui se passe.", label_en: "Start taking distance, sometimes without saying what's going on.", weights: [w("saboteur", "shadow")] },
    ],
  },
  {
    id: "A39", position: 39, house: 7,
    prompt_fr: "Dans tes relations proches, ton plus grand défi est souvent…",
    prompt_en: "In your close relationships, your biggest challenge is often…",
    options: [
      { id: "A39A", label_fr: "De ne pas tout faire passer avant toi, de garder un espace pour tes besoins.", label_en: "Not putting everything before yourself, keeping space for your needs.", weights: [w("caregiver", "shadow")] },
      { id: "A39B", label_fr: "De ne pas disparaître ou fuir dès que tu te sens coincé.", label_en: "Not disappearing or fleeing the moment you feel cornered.", weights: [w("rebel", "shadow")] },
      { id: "A39C", label_fr: "De ne pas te rendre dépendant du regard ou de l'amour de l'autre.", label_en: "Not becoming dependent on the other's gaze or love.", weights: [w("child", "shadow")] },
      { id: "A39D", label_fr: "De laisser vraiment l'autre entrer dans ton espace intérieur.", label_en: "Truly letting the other into your inner space.", weights: [w("mystic", "shadow")] },
    ],
  },
  {
    id: "A40", position: 40, house: 7,
    prompt_fr: "En regardant tes expériences de trahison, tu te reconnais le plus dans…",
    prompt_en: "Looking at your experiences of betrayal, you recognize yourself most in…",
    options: [
      { id: "A40A", label_fr: "Rester avec quelqu'un en retirant ton cœur, en faisant semblant.", label_en: "Staying with someone while withdrawing your heart, pretending.", weights: [w("prostitute", "shadow")] },
      { id: "A40B", label_fr: "Partir sans expliquer, couper net quand tu n'en peux plus.", label_en: "Leaving without explanation, cutting clean when you've had enough.", weights: [w("rebel", "shadow")] },
      { id: "A40C", label_fr: "Rester malgré des signaux clairs que l'autre ne tient pas sa part.", label_en: "Staying despite clear signs the other isn't holding their part.", weights: [w("victim", "shadow")] },
      { id: "A40D", label_fr: "Dire la vérité, même si elle fait mal, pour remettre les choses en place.", label_en: "Saying the truth, even if it hurts, to set things right.", weights: [w("warrior", "light")] },
    ],
  },
  {
    id: "A41", position: 41, house: 7,
    prompt_fr: "Ta vision intime d'une relation de couple « réussie » est surtout…",
    prompt_en: "Your intimate vision of a \"successful\" couple is mostly…",
    options: [
      { id: "A41A", label_fr: "Un espace de croissance mutuelle, un dojo où l'on grandit ensemble.", label_en: "A mutual growth space, a dojo where you grow together.", weights: [w("healer", "light")] },
      { id: "A41B", label_fr: "Un refuge où on est en sécurité, où personne ne part.", label_en: "A refuge where you're safe, where nobody leaves.", weights: [w("child", "shadow")] },
      { id: "A41C", label_fr: "Une alliance pour accomplir quelque chose dans le monde.", label_en: "An alliance to accomplish something in the world.", weights: [w("sovereign", "light")] },
      { id: "A41D", label_fr: "Un lieu où l'on peut être intensément vivant, passionné, même si chaotique.", label_en: "A place to be intensely alive, passionate, even if chaotic.", weights: [w("lover", "light")] },
    ],
  },
  {
    id: "A42", position: 42, house: 7,
    prompt_fr: "En regardant ton historique de partenaires (amoureux, business), tu as surtout choisi des personnes…",
    prompt_en: "Looking at your history of partners (romantic, business), you mostly chose people…",
    options: [
      { id: "A42A", label_fr: "À « sauver » ou à aider à se reconstruire.", label_en: "To \"save\" or help rebuild.", weights: [w("healer", "shadow")] },
      { id: "A42B", label_fr: "Qui prennent les décisions à ta place.", label_en: "Who make decisions in your place.", weights: [w("victim", "shadow")] },
      { id: "A42C", label_fr: "Qui challengent ton pouvoir, ton leadership, ton autonomie.", label_en: "Who challenge your power, leadership, autonomy.", weights: [w("warrior", "light")] },
      { id: "A42D", label_fr: "Qui te permettent de rester libre, non engagé, ou hors des conventions.", label_en: "Who let you stay free, uncommitted, or outside conventions.", weights: [w("rebel", "shadow")] },
    ],
  },

  /* ========================== HOUSE 8 — Ressources partagées ========================== */
  {
    id: "A43", position: 43, house: 8,
    prompt_fr: "Quand quelqu'un te propose une aide concrète (argent, réseau, temps, ressources), tu…",
    prompt_en: "When someone offers you concrete help (money, network, time, resources), you…",
    options: [
      { id: "A43A", label_fr: "Te sens gêné, tu as du mal à vraiment recevoir.", label_en: "Feel uncomfortable, struggle to really receive.", weights: [w("victim", "shadow")] },
      { id: "A43B", label_fr: "Acceptes, en voyant comment cette ressource peut servir un projet plus grand.", label_en: "Accept, seeing how this resource can serve a larger project.", weights: [w("sovereign", "light")] },
      { id: "A43C", label_fr: "Acceptes mais te sens instantanément redevable.", label_en: "Accept but instantly feel indebted.", weights: [w("prostitute", "shadow")] },
      { id: "A43D", label_fr: "Refuses pour rester libre, même si l'aide te serait utile.", label_en: "Refuse to stay free, even if the help would be useful.", weights: [w("rebel", "shadow")] },
    ],
  },
  {
    id: "A44", position: 44, house: 8,
    prompt_fr: "Dans l'intimité profonde (émotionnelle ou sexuelle), tu as tendance à…",
    prompt_en: "In deep intimacy (emotional or sexual), you tend to…",
    options: [
      { id: "A44A", label_fr: "Tout raconter très vite, en espérant être enfin compris.", label_en: "Tell everything very fast, hoping to finally be understood.", weights: [w("child", "shadow")] },
      { id: "A44B", label_fr: "Garder une partie de toi cachée, même si l'autre est proche.", label_en: "Keep a part of yourself hidden, even with someone close.", weights: [w("mystic", "shadow")] },
      { id: "A44C", label_fr: "Utiliser la vulnérabilité de l'autre pour garder du pouvoir.", label_en: "Use the other's vulnerability to keep power.", weights: [w("magician", "shadow")] },
      { id: "A44D", label_fr: "Partager progressivement, au rythme où la confiance se construit.", label_en: "Share gradually, at the pace trust is built.", weights: [w("healer", "light")] },
    ],
  },
  {
    id: "A45", position: 45, house: 8,
    prompt_fr: "Dans une relation où l'un a plus de ressources (argent, statut, réseau), tu…",
    prompt_en: "In a relationship where one has more resources (money, status, network), you…",
    options: [
      { id: "A45A", label_fr: "Te mets spontanément en dessous, tu te sens « moins ».", label_en: "Spontaneously place yourself below, feel \"less.\"", weights: [w("victim", "shadow")] },
      { id: "A45B", label_fr: "Compenses en contrôlant sur d'autres plans (émotionnel, organisationnel).", label_en: "Compensate by controlling on other planes (emotional, organizational).", weights: [w("sovereign", "shadow")] },
      { id: "A45C", label_fr: "Vois ça comme une ressource pour la mission commune.", label_en: "See it as a resource for the shared mission.", weights: [w("sovereign", "light")] },
      { id: "A45D", label_fr: "Te méfies de toute forme de dépendance, tu fuis ce type de configuration.", label_en: "Distrust any form of dependence, flee this kind of setup.", weights: [w("rebel", "shadow")] },
    ],
  },
  {
    id: "A46", position: 46, house: 8,
    prompt_fr: "En dehors de l'argent, tu sens que tu as surtout « hérité » de ta lignée…",
    prompt_en: "Beyond money, what you mainly \"inherited\" from your lineage is…",
    options: [
      { id: "A46A", label_fr: "De blessures non résolues que tu portes ou répètes.", label_en: "Unresolved wounds you carry or repeat.", weights: [w("victim", "shadow")] },
      { id: "A46B", label_fr: "D'une force de résilience hors norme.", label_en: "An exceptional resilience.", weights: [w("warrior", "light")] },
      { id: "A46C", label_fr: "De croyances fortes sur le pouvoir, le succès, l'échec.", label_en: "Strong beliefs about power, success, failure.", weights: [w("sovereign", "light")] },
      { id: "A46D", label_fr: "D'un rapport particulier au sacré, à la spiritualité ou aux dons invisibles.", label_en: "A particular relationship to the sacred, spirituality, or invisible gifts.", weights: [w("mystic", "light")] },
    ],
  },
  {
    id: "A47", position: 47, house: 8,
    prompt_fr: "Dans les liens très fusionnels (amour, business, créatif), ton challenge est surtout…",
    prompt_en: "In very fusional bonds (love, business, creative), your challenge is mostly…",
    options: [
      { id: "A47A", label_fr: "De ne pas te dissoudre dans l'autre.", label_en: "Not dissolving into the other.", weights: [w("lover", "shadow")] },
      { id: "A47B", label_fr: "De ne pas contrôler l'autre via l'argent, le savoir ou les contacts.", label_en: "Not controlling the other through money, knowledge, or contacts.", weights: [w("magician", "shadow")] },
      { id: "A47C", label_fr: "De rester dans l'échange plutôt que dans le sacrifice ou la dette.", label_en: "Staying in exchange rather than sacrifice or debt.", weights: [w("prostitute", "shadow")] },
      { id: "A47D", label_fr: "De permettre que la fusion serve quelque chose de plus grand que vous deux.", label_en: "Letting the fusion serve something larger than the two of you.", weights: [w("mystic", "light")] },
    ],
  },
  {
    id: "A48", position: 48, house: 8,
    prompt_fr: "Quand tu dois de l'argent ou que quelqu'un te doit, ce qui t'impacte le plus, c'est…",
    prompt_en: "When you owe money or someone owes you, what impacts you most is…",
    options: [
      { id: "A48A", label_fr: "La peur de ne pas pouvoir honorer, ou de perdre la face.", label_en: "Fear of not being able to honor, or losing face.", weights: [w("victim", "shadow")] },
      { id: "A48B", label_fr: "Le sentiment d'être tenu, attaché, obligé.", label_en: "The feeling of being tied, attached, obliged.", weights: [w("prostitute", "shadow")] },
      { id: "A48C", label_fr: "La façon dont cela peut affecter la confiance et le lien.", label_en: "How it may affect trust and bond.", weights: [w("healer", "light")] },
      { id: "A48D", label_fr: "L'opportunité de clarifier, de poser un cadre sain.", label_en: "The opportunity to clarify, to set a healthy frame.", weights: [w("sovereign", "light")] },
    ],
  },

  /* ========================== HOUSE 9 — Spiritualité & quête ========================== */
  {
    id: "A49", position: 49, house: 9,
    prompt_fr: "Quand tu cherches du sens à ce que tu vis, tu as tendance à…",
    prompt_en: "When you search for meaning in what you live, you tend to…",
    options: [
      { id: "A49A", label_fr: "Te tourner vers des enseignements, des livres, des personnes sages.", label_en: "Turn to teachings, books, wise people.", weights: [w("sage", "light")] },
      { id: "A49B", label_fr: "Partir physiquement (voyage, déménagement, changement de cadre).", label_en: "Physically leave (travel, move, change of setting).", weights: [w("explorer", "light")] },
      { id: "A49C", label_fr: "T'ouvrir à des signes, synchronicités, rêves, comme si la vie te parlait.", label_en: "Open to signs, synchronicities, dreams, as if life were talking to you.", weights: [w("mystic", "light")] },
      { id: "A49D", label_fr: "Rejeter toute spiritualité, par révolte contre ce que tu as connu.", label_en: "Reject all spirituality, in revolt against what you've known.", weights: [w("rebel", "shadow")] },
    ],
  },
  {
    id: "A50", position: 50, house: 9,
    prompt_fr: "Ton rapport aux traditions spirituelles/religieuses ressemble le plus à…",
    prompt_en: "Your relationship to spiritual/religious traditions looks most like…",
    options: [
      { id: "A50A", label_fr: "Tu aimes les structures, les rituels, cela te donne un cadre.", label_en: "You love structures, rituals — they give you a frame.", weights: [w("mystic", "light")] },
      { id: "A50B", label_fr: "Tu prends des éléments partout, tu composes ta propre voie.", label_en: "You take elements from everywhere, you compose your own path.", weights: [w("explorer", "light")] },
      { id: "A50C", label_fr: "Tu rejettes en bloc ce que tu as reçu, parfois sans avoir exploré ailleurs.", label_en: "You reject wholesale what you received, sometimes without exploring elsewhere.", weights: [w("rebel", "shadow")] },
      { id: "A50D", label_fr: "Tu te sens indigne, « pas assez pur », pour t'en approcher vraiment.", label_en: "You feel unworthy, \"not pure enough,\" to truly approach it.", weights: [w("child", "shadow")] },
    ],
  },
  {
    id: "A51", position: 51, house: 9,
    prompt_fr: "Quand une décision très concrète (argent, job, couple) se présente, tu…",
    prompt_en: "When a very concrete decision (money, job, couple) arises, you…",
    options: [
      { id: "A51A", label_fr: "Cherches d'abord le sens symbolique, puis seulement les aspects pratiques.", label_en: "Look first for symbolic meaning, then practical aspects.", weights: [w("mystic", "light")] },
      { id: "A51B", label_fr: "Restes surtout sur le rationnel et le tangible.", label_en: "Stay mostly on the rational and tangible.", weights: [w("sage", "light")] },
      { id: "A51C", label_fr: "Te perds dans les concepts sans passer à l'action.", label_en: "Get lost in concepts without taking action.", weights: [w("mystic", "shadow")] },
      { id: "A51D", label_fr: "Te dis que la spiritualité, « c'est bien, mais pas pour ces sujets-là ».", label_en: "Tell yourself spirituality is \"fine, but not for these topics.\"", weights: [w("prostitute", "shadow")] },
    ],
  },
  {
    id: "A52", position: 52, house: 9,
    prompt_fr: "Quand tu traverses une crise de foi (perte de sens, perte de confiance en la vie), tu…",
    prompt_en: "When you go through a crisis of faith (loss of meaning, loss of trust in life), you…",
    options: [
      { id: "A52A", label_fr: "Te fermes, tu te sens abandonné ou puni.", label_en: "Close down, feeling abandoned or punished.", weights: [w("victim", "shadow")] },
      { id: "A52B", label_fr: "Vas chercher plus profond, tu questionnes, tu veux comprendre.", label_en: "Dig deeper, question, want to understand what's happening.", weights: [w("sage", "light")] },
      { id: "A52C", label_fr: "Te révoltes contre toute idée de « plan » ou de « contrat ».", label_en: "Revolt against any idea of \"plan\" or \"contract.\"", weights: [w("rebel", "shadow")] },
      { id: "A52D", label_fr: "Te rapproches de personnes ou d'espaces qui nourrissent ta vie intérieure.", label_en: "Get closer to people or spaces that nourish your inner life.", weights: [w("mystic", "light")] },
    ],
  },
  {
    id: "A53", position: 53, house: 9,
    prompt_fr: "Quand tu parles de spiritualité ou de sens avec quelqu'un, tu es plutôt celui/celle qui…",
    prompt_en: "When you speak of spirituality or meaning with someone, you tend to be the one who…",
    options: [
      { id: "A53A", label_fr: "Traduit les concepts en choses simples et pratico-pratiques.", label_en: "Translates concepts into simple, practical things.", weights: [w("sage", "light")] },
      { id: "A53B", label_fr: "Partage des expériences, des synchronicités, des histoires.", label_en: "Shares experiences, synchronicities, stories.", weights: [w("child", "light")] },
      { id: "A53C", label_fr: "Cherche les incohérences, challenge les croyances.", label_en: "Looks for inconsistencies, challenges beliefs.", weights: [w("rebel", "light")] },
      { id: "A53D", label_fr: "Se sent illégitime, préfère se taire même si le sujet t'appelle.", label_en: "Feels illegitimate, prefers silence even when called by the topic.", weights: [w("child", "shadow")] },
    ],
  },
  {
    id: "A54", position: 54, house: 9,
    prompt_fr: "Intérieurement, ta vie est plutôt…",
    prompt_en: "Inwardly, your life is rather…",
    options: [
      { id: "A54A", label_fr: "Une mission, un contrat, avec des choses que tu es venu offrir.", label_en: "A mission, a contract, with things you came to offer.", weights: [w("mystic", "light")] },
      { id: "A54B", label_fr: "Une succession d'événements plus ou moins aléatoires.", label_en: "A succession of more or less random events.", weights: [w("victim", "shadow")] },
      { id: "A54C", label_fr: "Une exploration, un grand voyage d'apprentissage.", label_en: "An exploration, a great learning journey.", weights: [w("explorer", "light")] },
      { id: "A54D", label_fr: "Un terrain de contestation, où tu es là pour déconstruire ce qui ne marche pas.", label_en: "A field of contestation, where you're here to deconstruct what doesn't work.", weights: [w("rebel", "light")] },
    ],
  },

  /* ========================== HOUSE 10 — Vocation & potentiel ========================== */
  {
    id: "A55", position: 55, house: 10,
    prompt_fr: "Quand tu penses à ta « vocation », tu te reconnais le plus dans…",
    prompt_en: "When you think about your \"vocation,\" you recognize yourself most in…",
    options: [
      { id: "A55A", label_fr: "« Je sais plus ou moins ce que je suis venu faire, même si ce n'est pas en place ».", label_en: "\"I roughly know what I came to do, even if it's not in place yet.\"", weights: [w("sovereign", "light")] },
      { id: "A55B", label_fr: "« Je sens que j'en ai une, mais je n'arrive pas à passer à l'action ».", label_en: "\"I feel I have one, but I can't move into action.\"", weights: [w("saboteur", "shadow")] },
      { id: "A55C", label_fr: "« Je ne crois pas à l'idée de vocation, il faut juste survivre correctement ».", label_en: "\"I don't believe in vocation — you just have to survive properly.\"", weights: [w("prostitute", "shadow")] },
      { id: "A55D", label_fr: "« Ma vocation, c'est d'aider à guérir / transformer / éveiller ».", label_en: "\"My vocation is to help heal / transform / awaken.\"", weights: [w("healer", "light")] },
    ],
  },
  {
    id: "A56", position: 56, house: 10,
    prompt_fr: "Ton rapport au pouvoir et à l'ambition ressemble le plus à…",
    prompt_en: "Your relationship to power and ambition looks most like…",
    options: [
      { id: "A56A", label_fr: "Tu assumes que tu veux avoir de l'impact, prendre des responsabilités.", label_en: "You own wanting impact and responsibility.", weights: [w("sovereign", "light")] },
      { id: "A56B", label_fr: "Tu as peur que le pouvoir te corrompe, tu te retiens.", label_en: "You fear power will corrupt you, so you hold back.", weights: [w("sovereign", "shadow")] },
      { id: "A56C", label_fr: "Tu rejettes l'idée même d'ambition, par méfiance envers ceux qui en ont.", label_en: "You reject the very idea of ambition, distrusting those who have it.", weights: [w("rebel", "shadow")] },
      { id: "A56D", label_fr: "Tu veux surtout que ton travail serve quelque chose de plus grand que toi.", label_en: "You mostly want your work to serve something larger than you.", weights: [w("mystic", "light")] },
    ],
  },
  {
    id: "A57", position: 57, house: 10,
    prompt_fr: "Quand tu imagines ta place idéale dans le monde, tu te vois plutôt comme…",
    prompt_en: "When you imagine your ideal place in the world, you see yourself rather as…",
    options: [
      { id: "A57A", label_fr: "Celui/celle qui dirige, orchestre, prend les grandes décisions.", label_en: "The one who leads, orchestrates, makes big decisions.", weights: [w("sovereign", "light")] },
      { id: "A57B", label_fr: "Celui/celle qui est « sur le terrain », qui agit concrètement.", label_en: "The one on the ground, acting concretely.", weights: [w("warrior", "light")] },
      { id: "A57C", label_fr: "Celui/celle qui conseille, éclaire, aide à voir autrement.", label_en: "The one who advises, illuminates, helps others see differently.", weights: [w("sage", "light")] },
      { id: "A57D", label_fr: "Celui/celle qui travaille en coulisses, sans trop se montrer.", label_en: "The one who works behind the scenes, staying low-profile.", weights: [w("magician", "light")] },
    ],
  },
  {
    id: "A58", position: 58, house: 10,
    prompt_fr: "Sur ton chemin pro/vocationnel, le compromis que tu fais le plus souvent, c'est…",
    prompt_en: "On your professional/vocational path, the compromise you make most often is…",
    options: [
      { id: "A58A", label_fr: "Choisir la sécurité matérielle au détriment de ce qui te fait vibrer.", label_en: "Choosing material security at the expense of what makes you vibrate.", weights: [w("prostitute", "shadow")] },
      { id: "A58B", label_fr: "Partir trop vite d'une situation avant d'avoir pu y prendre ta pleine place.", label_en: "Leaving a situation too quickly before fully taking your place.", weights: [w("saboteur", "shadow")] },
      { id: "A58C", label_fr: "Accepter des rôles en dessous de ce que tu sens possible.", label_en: "Accepting roles below what you feel possible for you.", weights: [w("victim", "shadow")] },
      { id: "A58D", label_fr: "Dire non à des opportunités non alignées, même si elles sont attractives.", label_en: "Saying no to misaligned opportunities, even attractive ones.", weights: [w("sovereign", "light")] },
    ],
  },
  {
    id: "A59", position: 59, house: 10,
    prompt_fr: "L'idée d'être pleinement vu dans ta vocation (exposé, identifié) te…",
    prompt_en: "The idea of being fully seen in your vocation (exposed, identified)…",
    options: [
      { id: "A59A", label_fr: "Donne de l'énergie, tu te sens à ta place.", label_en: "Energizes you — you feel in your place.", weights: [w("sovereign", "light")] },
      { id: "A59B", label_fr: "Fait peur, tu préfèrerais rester discret.", label_en: "Scares you — you'd rather stay discreet.", weights: [w("child", "shadow")] },
      { id: "A59C", label_fr: "Te donne envie de jouer un rôle, de porter un masque « parfait ».", label_en: "Makes you want to play a role, wear a \"perfect\" mask.", weights: [w("prostitute", "shadow")] },
      { id: "A59D", label_fr: "Inspire une forme d'humilité, tu veux que le message passe, pas ta personne.", label_en: "Inspires humility — you want the message to land, not yourself.", weights: [w("sage", "light")] },
    ],
  },
  {
    id: "A60", position: 60, house: 10,
    prompt_fr: "Quand tu penses à tes succès et échecs passés, tu as tendance à…",
    prompt_en: "When you think of your past successes and failures, you tend to…",
    options: [
      { id: "A60A", label_fr: "Voir surtout ce que tu n'as pas encore fait.", label_en: "See mostly what you haven't done yet.", weights: [w("saboteur", "shadow")] },
      { id: "A60B", label_fr: "Reconnaître ce que tu as construit, même si ce n'est pas parfait.", label_en: "Acknowledge what you built, even if imperfect.", weights: [w("sovereign", "light")] },
      { id: "A60C", label_fr: "Te définir par un échec clé que tu n'arrives pas à dépasser.", label_en: "Define yourself by a key failure you can't get past.", weights: [w("victim", "shadow")] },
      { id: "A60D", label_fr: "Voir comment chaque expérience t'a formé pour ton rôle actuel.", label_en: "See how each experience shaped you for your current role.", weights: [w("sage", "light")] },
    ],
  },

  /* ========================== HOUSE 11 — Monde & contribution ========================== */
  {
    id: "A61", position: 61, house: 11,
    prompt_fr: "Par rapport aux causes collectives (écologie, justice sociale, etc.), tu…",
    prompt_en: "Regarding collective causes (ecology, social justice, etc.), you…",
    options: [
      { id: "A61A", label_fr: "Te sens souvent appelé à agir, même modestement.", label_en: "Often feel called to act, even modestly.", weights: [w("warrior", "light")] },
      { id: "A61B", label_fr: "Te sens dépassé, tu préfères te concentrer sur ta vie.", label_en: "Feel overwhelmed, prefer to focus on your own life.", weights: [w("victim", "shadow")] },
      { id: "A61C", label_fr: "Critiques beaucoup, agis peu.", label_en: "Criticize a lot, act little.", weights: [w("rebel", "shadow")] },
      { id: "A61D", label_fr: "Préfères agir dans l'invisible (énergie, prière, soutien discret).", label_en: "Prefer to act invisibly (energy, prayer, discreet support).", weights: [w("mystic", "light")] },
    ],
  },
  {
    id: "A62", position: 62, house: 11,
    prompt_fr: "Quand tu trouves « ta tribu », tu cherches surtout…",
    prompt_en: "When you find \"your tribe,\" you mostly look for…",
    options: [
      { id: "A62A", label_fr: "Des gens avec qui tu peux te battre pour quelque chose qui compte.", label_en: "People to fight alongside for something that matters.", weights: [w("warrior", "light")] },
      { id: "A62B", label_fr: "Des gens avec qui tu peux guérir / explorer en profondeur.", label_en: "People to heal / explore deeply with.", weights: [w("healer", "light")] },
      { id: "A62C", label_fr: "Des gens qui t'admirent ou valident ton rôle.", label_en: "People who admire you or validate your role.", weights: [w("child", "shadow")] },
      { id: "A62D", label_fr: "Un espace où l'on peut rire et respirer malgré tout.", label_en: "A space to laugh and breathe despite everything.", weights: [w("jester", "light")] },
    ],
  },
  {
    id: "A63", position: 63, house: 11,
    prompt_fr: "Ta vision spontanée du monde est plutôt…",
    prompt_en: "Your spontaneous vision of the world is rather…",
    options: [
      { id: "A63A", label_fr: "« Cassé, injuste, dangereux ».", label_en: "\"Broken, unjust, dangerous.\"", weights: [w("victim", "shadow")] },
      { id: "A63B", label_fr: "« En transition, en apprentissage ».", label_en: "\"In transition, learning.\"", weights: [w("sage", "light")] },
      { id: "A63C", label_fr: "« À secouer, à défier, à hacker ».", label_en: "\"To be shaken, defied, hacked.\"", weights: [w("rebel", "light")] },
      { id: "A63D", label_fr: "« Fondamentalement vivant et porteur de sens, même dans le chaos ».", label_en: "\"Fundamentally alive and meaningful, even in chaos.\"", weights: [w("mystic", "light")] },
    ],
  },
  {
    id: "A64", position: 64, house: 11,
    prompt_fr: "Dans les grands groupes (communautés, mouvements, grosses teams), tu te trouves souvent…",
    prompt_en: "In large groups (communities, movements, big teams), you often find yourself…",
    options: [
      { id: "A64A", label_fr: "À la marge, en périphérie, avec un pied dedans un pied dehors.", label_en: "At the margin, on the periphery, half in, half out.", weights: [w("rebel", "shadow")] },
      { id: "A64B", label_fr: "Au centre, à organiser, fédérer, inspirer.", label_en: "At the center, organizing, federating, inspiring.", weights: [w("sovereign", "light")] },
      { id: "A64C", label_fr: "En soutien, à prendre soin des autres membres.", label_en: "In support, taking care of other members.", weights: [w("caregiver", "light")] },
      { id: "A64D", label_fr: "En observateur, à comprendre les dynamiques.", label_en: "As observer, understanding the dynamics.", weights: [w("sage", "light")] },
    ],
  },
  {
    id: "A65", position: 65, house: 11,
    prompt_fr: "La manière dont tu préfères impacter le monde ressemble le plus à…",
    prompt_en: "The way you prefer to impact the world looks most like…",
    options: [
      { id: "A65A", label_fr: "Transformer quelques vies en profondeur.", label_en: "Transforming a few lives deeply.", weights: [w("healer", "light")] },
      { id: "A65B", label_fr: "Créer ou lancer des choses nouvelles qui changent la donne.", label_en: "Creating or launching new things that shift the game.", weights: [w("creator", "light")] },
      { id: "A65C", label_fr: "Protéger, défendre, lutter là où il y a injustice.", label_en: "Protecting, defending, fighting where there's injustice.", weights: [w("warrior", "light")] },
      { id: "A65D", label_fr: "Détendre, faire rire, ouvrir un espace de respiration.", label_en: "Loosening up, making people laugh, opening breathing space.", weights: [w("jester", "light")] },
    ],
  },

  /* ========================== HOUSE 12 — Inconscient & patterns ========================== */
  {
    id: "A66", position: 66, house: 12,
    prompt_fr: "Si tu regardes le film de ta vie, le pattern qui revient le plus souvent, c'est…",
    prompt_en: "If you watch the film of your life, the most recurring pattern is…",
    options: [
      { id: "A66A", label_fr: "Commencer fort puis te saboter quand ça devient sérieux.", label_en: "Starting strong then sabotaging yourself when it gets serious.", weights: [w("saboteur", "shadow")] },
      { id: "A66B", label_fr: "Attirer des situations où tu te sens impuissant ou trahi.", label_en: "Attracting situations where you feel powerless or betrayed.", weights: [w("victim", "shadow")] },
      { id: "A66C", label_fr: "Être « sauvé » ou soutenu au dernier moment.", label_en: "Being \"saved\" or supported at the last minute.", weights: [w("child", "shadow")] },
      { id: "A66D", label_fr: "Te retrouver comme canal pour quelque chose de plus grand.", label_en: "Finding yourself as a channel for something larger.", weights: [w("mystic", "light")] },
    ],
  },
  {
    id: "A67", position: 67, house: 12,
    prompt_fr: "La partie de toi que tu caches le plus, même à toi-même, c'est plutôt…",
    prompt_en: "The part of you that you most hide, even from yourself, is rather…",
    options: [
      { id: "A67A", label_fr: "Ta peur de ne jamais vraiment accomplir ce que tu sens possible pour toi.", label_en: "Your fear of never truly accomplishing what you feel possible for you.", weights: [w("saboteur", "shadow")] },
      { id: "A67B", label_fr: "Ta colère, ton ressentiment envers certaines personnes/systèmes.", label_en: "Your anger, your resentment toward certain people/systems.", weights: [w("warrior", "shadow")] },
      { id: "A67C", label_fr: "Ton besoin d'être pris en charge, materné, soutenu.", label_en: "Your need to be taken care of, mothered, supported.", weights: [w("child", "shadow")] },
      { id: "A67D", label_fr: "Ta sensibilité spirituelle ou intuitive, que tu minimises ou ridiculises.", label_en: "Your spiritual or intuitive sensitivity that you minimize or ridicule.", weights: [w("mystic", "shadow")] },
    ],
  },
  {
    id: "A68", position: 68, house: 12,
    prompt_fr: "Quand tu touches un grand vide intérieur (rien n'a de sens, tout est flou), tu…",
    prompt_en: "When you touch a great inner void (nothing means anything, everything's blurred), you…",
    options: [
      { id: "A68A", label_fr: "Te distractes intensément (travail, écran, addictions douces).", label_en: "Intensely distract yourself (work, screens, soft addictions).", weights: [w("saboteur", "shadow")] },
      { id: "A68B", label_fr: "Plonges dedans, tu laisses venir ce qui doit venir.", label_en: "Dive in, let come what must come.", weights: [w("mystic", "light")] },
      { id: "A68C", label_fr: "Cherches tout de suite quelqu'un ou quelque chose pour te remplir.", label_en: "Immediately seek someone or something to fill you.", weights: [w("child", "shadow")] },
      { id: "A68D", label_fr: "Transformes cette expérience en matière pour créer, écrire, composer.", label_en: "Transform this experience into material to create, write, compose.", weights: [w("creator", "light")] },
    ],
  },
  {
    id: "A69", position: 69, house: 12,
    prompt_fr: "Quand quelque chose t'échappe complètement (maladie, perte, crise extérieure), tu…",
    prompt_en: "When something completely escapes you (illness, loss, outer crisis), you…",
    options: [
      { id: "A69A", label_fr: "Cherches qui est responsable, où est la faute.", label_en: "Look for who is responsible, where the fault lies.", weights: [w("victim", "shadow")] },
      { id: "A69B", label_fr: "Ressens l'appel à lâcher une couche de contrôle, même si c'est dur.", label_en: "Feel the call to release a layer of control, even if hard.", weights: [w("mystic", "light")] },
      { id: "A69C", label_fr: "Redoubles de contrôle sur ce que tu peux encore maîtriser.", label_en: "Double down on control over what you can still master.", weights: [w("sovereign", "shadow")] },
      { id: "A69D", label_fr: "Te sens inspiré pour aider d'autres à traverser ce type d'épreuve.", label_en: "Feel inspired to help others cross this kind of trial.", weights: [w("healer", "light")] },
    ],
  },
  {
    id: "A70", position: 70, house: 12,
    prompt_fr: "Quand tout va vraiment mal, ton refuge le plus profond, c'est…",
    prompt_en: "When everything truly goes wrong, your deepest refuge is…",
    options: [
      { id: "A70A", label_fr: "Une forme de fantasme ou de monde intérieur où tu te réfugies.", label_en: "A form of fantasy or inner world where you take refuge.", weights: [w("child", "shadow")] },
      { id: "A70B", label_fr: "Le cynisme, la blague, le fait de ne rien prendre au sérieux.", label_en: "Cynicism, jokes, taking nothing seriously.", weights: [w("jester", "shadow")] },
      { id: "A70C", label_fr: "La prière, la méditation, le lien direct avec le sacré.", label_en: "Prayer, meditation, direct connection to the sacred.", weights: [w("mystic", "light")] },
      { id: "A70D", label_fr: "L'analyse, la compréhension, le besoin de « tout expliquer ».", label_en: "Analysis, understanding, the need to \"explain everything.\"", weights: [w("sage", "shadow")] },
    ],
  },
];

/* -------------------------------------------------------------------------- */
/* Sanity self-check (executed in dev only via vitest)                        */
/* -------------------------------------------------------------------------- */
export function validateQuestions70(): { ok: true } | { ok: false; errors: string[] } {
  const errors: string[] = [];
  if (QUESTIONS_70.length !== 70) errors.push(`Expected 70 questions, got ${QUESTIONS_70.length}`);
  const ids = new Set<string>();
  for (const q of QUESTIONS_70) {
    if (ids.has(q.id)) errors.push(`Duplicate question id: ${q.id}`);
    ids.add(q.id);
    if (q.house < 1 || q.house > 12) errors.push(`${q.id}: invalid house ${q.house}`);
    if (q.options.length !== 4) errors.push(`${q.id}: expected 4 options, got ${q.options.length}`);
    const optIds = new Set<string>();
    for (const o of q.options) {
      if (optIds.has(o.id)) errors.push(`${q.id}: duplicate option id ${o.id}`);
      optIds.add(o.id);
      if (o.weights.length === 0) errors.push(`${o.id}: no weights`);
    }
  }
  return errors.length === 0 ? { ok: true } : { ok: false, errors };
}
