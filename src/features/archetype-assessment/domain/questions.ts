import type { QuestionSeed } from "./types";

/**
 * Aegis V1 — 30 onboarding questions.
 * Each option points to ONE archetype/shadow with weight 1.
 * Mapping confirmed by product owner (Caroline Myss inspired):
 *   Survival shadows: child, victim, saboteur, prostitute
 *   12 majors:       sovereign, warrior, lover, caregiver, creator,
 *                    explorer, rebel, sage, mystic, healer, magician, jester
 */
export const QUESTIONS: QuestionSeed[] = [
  // ========== Identity, security, autonomy (Q1–Q5) ==========
  {
    position: 1,
    type: "single_choice",
    dimension: "identity",
    prompt_fr:
      "Quand tu dois prendre une grande décision qui impacte ta vie (déménager, changer de job, quitter quelqu'un), tu as tendance à…",
    prompt_en:
      "When you have to make a major life decision (moving, changing jobs, leaving someone), you tend to…",
    options: [
      { position: 1, label_fr: "Attendre qu'une figure rassurante te dise quoi faire, même si tu sais déjà ce que tu ressens.", label_en: "Wait for a reassuring figure to tell you what to do, even if you already know how you feel.", shadowWeights: { child: 1 } },
      { position: 2, label_fr: "Rejouer dans ta tête tout ce que les autres t'ont fait subir, en te disant que tu n'y arrives jamais.", label_en: "Replay everything others have put you through, telling yourself you never make it.", shadowWeights: { victim: 1 } },
      { position: 3, label_fr: "Trouver une excuse pour ne rien décider maintenant, et laisser la situation se dégrader jusqu'à éclater.", label_en: "Find an excuse to decide nothing now, and let the situation rot until it explodes.", shadowWeights: { saboteur: 1 } },
      { position: 4, label_fr: "Choisir l'option la plus « sûre », même si tu trahis ce que tu veux vraiment, pour ne pas perdre ta stabilité.", label_en: "Pick the « safe » option, even if you betray what you really want, to keep your stability.", shadowWeights: { prostitute: 1 } },
    ],
  },
  {
    position: 2,
    type: "single_choice",
    dimension: "identity",
    prompt_fr: "Dans ton quotidien, ton rapport à la responsabilité ressemble plutôt à…",
    prompt_en: "In your daily life, your relationship with responsibility looks more like…",
    options: [
      { position: 1, label_fr: "Une partie de toi voudrait qu'on s'occupe de toi, comme si tu pouvais rester enfant encore un peu.", label_en: "A part of you wishes someone would take care of you, as if you could stay a child a little longer.", shadowWeights: { child: 1 } },
      { position: 2, label_fr: "Tu prends souvent tout sur tes épaules, quitte à t'épuiser pour que les autres soient bien.", label_en: "You often take everything on your shoulders, even exhausting yourself so others are okay.", archetypeWeights: { caregiver: 1 } },
      { position: 3, label_fr: "Tu assumes naturellement de décider et de trancher, même si c'est inconfortable.", label_en: "You naturally take on deciding and cutting through, even when it's uncomfortable.", archetypeWeights: { sovereign: 1 } },
      { position: 4, label_fr: "Tu préfères garder tes options ouvertes et rester en mouvement plutôt que de t'enraciner.", label_en: "You'd rather keep your options open and stay in motion than put down roots.", archetypeWeights: { explorer: 1 } },
    ],
  },
  {
    position: 3,
    type: "single_choice",
    dimension: "identity",
    prompt_fr: "Quand tu te lances dans quelque chose de nouveau (projet, relation, formation), ce qui domine au début, c'est…",
    prompt_en: "When you start something new (project, relationship, training), what dominates at first is…",
    options: [
      { position: 1, label_fr: "L'enthousiasme et la sensation que « tout est possible », comme un nouveau monde à explorer.", label_en: "Enthusiasm and the sense that « anything is possible », like a new world to explore.", shadowWeights: { child: 1 } },
      { position: 2, label_fr: "La stratégie : tu regardes les risques, les leviers, tu calcules comment optimiser.", label_en: "Strategy: you look at risks, leverage, you calculate how to optimize.", archetypeWeights: { magician: 1 } },
      { position: 3, label_fr: "Le sens : tu te demandes si ça correspond à ta vision, à ce que tu veux transmettre au monde.", label_en: "Meaning: you ask if this matches your vision, what you want to transmit to the world.", archetypeWeights: { sage: 1 } },
      { position: 4, label_fr: "La passion : tu plonges dedans parce que tu aimes fort, quitte à te brûler.", label_en: "Passion: you dive in because you love hard, even at the risk of burning out.", archetypeWeights: { lover: 1 } },
    ],
  },
  {
    position: 4,
    type: "single_choice",
    dimension: "power",
    prompt_fr: "Face à une autorité (manager, parent, figure institutionnelle) que tu trouves injuste, tu te reconnais le plus dans…",
    prompt_en: "Facing an authority (manager, parent, institution) you find unfair, you most recognize yourself in…",
    options: [
      { position: 1, label_fr: "Tu te tais, tu encaisses, tu rumines et tu te sens impuissant.", label_en: "You stay silent, you take it, you ruminate and feel powerless.", shadowWeights: { victim: 1 } },
      { position: 2, label_fr: "Tu t'adaptes, tu joues le jeu pour protéger ta position et ne pas perdre ta sécurité.", label_en: "You adapt, you play the game to protect your position and not lose your security.", shadowWeights: { prostitute: 1 } },
      { position: 3, label_fr: "Tu t'opposes frontalement, tu contestes les règles, quitte à créer un conflit.", label_en: "You openly oppose, you contest the rules, even if it creates conflict.", archetypeWeights: { rebel: 1 } },
      { position: 4, label_fr: "Tu gardes ton calme, tu négocies, tu joues avec les codes pour influencer le système de l'intérieur.", label_en: "You stay calm, you negotiate, you play with the codes to influence the system from within.", archetypeWeights: { magician: 1 } },
    ],
  },
  {
    position: 5,
    type: "single_choice",
    dimension: "identity",
    prompt_fr: "Quand tu penses à « grandir » ou « devenir adulte », ce qui te fait le plus réagir, c'est…",
    prompt_en: "When you think about « growing up » or « becoming an adult », what you most react to is…",
    options: [
      { position: 1, label_fr: "La peur de perdre ta spontanéité, ton innocence, ton côté joueur.", label_en: "The fear of losing your spontaneity, your innocence, your playful side.", shadowWeights: { child: 1 } },
      { position: 2, label_fr: "Le besoin de prouver que tu peux te battre pour ceux que tu aimes.", label_en: "The need to prove you can fight for those you love.", archetypeWeights: { warrior: 1 } },
      { position: 3, label_fr: "Le sentiment d'avoir un rôle à jouer pour guider ou inspirer les autres.", label_en: "The feeling of having a role to play to guide or inspire others.", archetypeWeights: { sage: 1 } },
      { position: 4, label_fr: "La crainte de te retrouver prisonnier d'un rôle, d'un système, d'une vie figée.", label_en: "The fear of being trapped in a role, a system, a fixed life.", archetypeWeights: { rebel: 1 } },
    ],
  },

  // ========== Relationships, attachment, intimacy (Q6–Q10) ==========
  {
    position: 6,
    type: "single_choice",
    dimension: "relationship",
    prompt_fr: "Dans une relation proche (amoureuse, amitié intime), ton schéma le plus fréquent est…",
    prompt_en: "In a close relationship (romantic, intimate friendship), your most frequent pattern is…",
    options: [
      { position: 1, label_fr: "Tu donnes énormément, tu prends soin, tu te sacrifies parfois pour le bien de l'autre.", label_en: "You give a lot, you take care, you sometimes sacrifice yourself for the other's good.", archetypeWeights: { caregiver: 1 } },
      { position: 2, label_fr: "Tu cherches l'intensité, la fusion, la passion, quitte à te perdre un peu.", label_en: "You seek intensity, fusion, passion, even at the cost of losing yourself a bit.", archetypeWeights: { lover: 1 } },
      { position: 3, label_fr: "Tu gardes une part de toi à distance, tu observes, tu « lis » l'autre et la dynamique.", label_en: "You keep part of yourself at a distance, you observe, you « read » the other and the dynamic.", archetypeWeights: { sage: 1 } },
      { position: 4, label_fr: "Quand ça devient trop sérieux, tu sabotes ou tu fais quelque chose qui casse la relation.", label_en: "When it gets too serious, you sabotage or do something that breaks the relationship.", shadowWeights: { saboteur: 1 } },
    ],
  },
  {
    position: 7,
    type: "single_choice",
    dimension: "relationship",
    prompt_fr: "Quand quelqu'un te blesse profondément, tu réagis le plus souvent en…",
    prompt_en: "When someone deeply hurts you, you most often react by…",
    options: [
      { position: 1, label_fr: "Restant dans la blessure, en attendant inconsciemment qu'on vienne te réparer.", label_en: "Staying in the wound, unconsciously waiting for someone to come repair you.", shadowWeights: { child: 1 } },
      { position: 2, label_fr: "Te convainquant que « les gens sont comme ça » et que tu finis toujours par être mal traité.", label_en: "Convincing yourself that « people are like that » and you always end up mistreated.", shadowWeights: { victim: 1 } },
      { position: 3, label_fr: "Coupant brutalement le lien, parfois sans vraiment expliquer, pour reprendre le contrôle.", label_en: "Cutting the bond brutally, sometimes without explanation, to regain control.", archetypeWeights: { rebel: 1 } },
      { position: 4, label_fr: "Acceptant des choses qui ne te respectent pas, par peur de perdre la personne.", label_en: "Accepting things that don't respect you, out of fear of losing the person.", shadowWeights: { prostitute: 1 } },
    ],
  },
  {
    position: 8,
    type: "single_choice",
    dimension: "relationship",
    prompt_fr: "Dans ton rôle auprès des autres, celui dans lequel on te reconnaît le plus souvent, c'est…",
    prompt_en: "In your role with others, the one you're most often recognized in is…",
    options: [
      { position: 1, label_fr: "Le/La confident·e qui écoute, soutient, rappelle à l'autre sa force intérieure.", label_en: "The confidant who listens, supports, reminds others of their inner strength.", archetypeWeights: { healer: 1 } },
      { position: 2, label_fr: "Celui/celle qui anime, qui fait rire, qui allège l'ambiance même dans les moments durs.", label_en: "The one who livens up, makes people laugh, lightens the mood even in hard moments.", archetypeWeights: { jester: 1 } },
      { position: 3, label_fr: "Celui/celle qui porte la vision, qui donne une direction à long terme.", label_en: "The one who carries the vision, who gives long-term direction.", archetypeWeights: { sovereign: 1 } },
      { position: 4, label_fr: "Celui/celle qui montre où sont les limites, qui n'accepte pas les injustices.", label_en: "The one who shows where the limits are, who doesn't accept injustice.", archetypeWeights: { warrior: 1 } },
    ],
  },
  {
    position: 9,
    type: "single_choice",
    dimension: "relationship",
    prompt_fr: "Quand une relation devient toxique ou étouffante, le plus grand risque pour toi est de…",
    prompt_en: "When a relationship becomes toxic or smothering, your greatest risk is to…",
    options: [
      { position: 1, label_fr: "Rester par loyauté ou par habitude, même si tu sais que ça te détruit.", label_en: "Stay out of loyalty or habit, even knowing it destroys you.", shadowWeights: { prostitute: 1 } },
      { position: 2, label_fr: "Te sacrifier davantage en espérant sauver l'autre par ton amour ou tes soins.", label_en: "Sacrifice yourself more, hoping to save the other through your love or care.", archetypeWeights: { caregiver: 1 } },
      { position: 3, label_fr: "Disparaître ou tout casser sans vraiment expliquer ce que tu vis.", label_en: "Disappear or break everything without really explaining what you're going through.", shadowWeights: { saboteur: 1 } },
      { position: 4, label_fr: "Te réfugier dans ton monde intérieur, ta spiritualité ou ton travail pour ne plus sentir.", label_en: "Retreat into your inner world, your spirituality or your work to stop feeling.", archetypeWeights: { mystic: 1 } },
    ],
  },
  {
    position: 10,
    type: "single_choice",
    dimension: "relationship",
    prompt_fr: "Quand tu tombes amoureux ou que tu as un coup de cœur fort, tu as tendance à…",
    prompt_en: "When you fall in love or have a strong crush, you tend to…",
    options: [
      { position: 1, label_fr: "Idéaliser l'autre, projeter une histoire presque « sacrée » et pleine de sens.", label_en: "Idealize the other, project an almost « sacred » meaningful story.", archetypeWeights: { mystic: 1 } },
      { position: 2, label_fr: "Voir très vite les risques et les incompatibilités, même si tu es attiré.", label_en: "Quickly see risks and incompatibilities, even if you're attracted.", archetypeWeights: { sage: 1 } },
      { position: 3, label_fr: "Te battre pour la relation, quitte à tout affronter autour.", label_en: "Fight for the relationship, even confronting everything around.", archetypeWeights: { warrior: 1 } },
      { position: 4, label_fr: "Chercher déjà la prochaine intensité ailleurs, ou garder plusieurs options ouvertes.", label_en: "Already seek the next intensity elsewhere, or keep several options open.", archetypeWeights: { lover: 1 } },
    ],
  },

  // ========== Work, contribution, power (Q11–Q16) ==========
  {
    position: 11,
    type: "single_choice",
    dimension: "work",
    prompt_fr: "Dans un projet collectif important, on vient te chercher surtout parce que…",
    prompt_en: "In an important collective project, people seek you out mainly because…",
    options: [
      { position: 1, label_fr: "Tu prends le lead, tu organises, tu portes la responsabilité globale.", label_en: "You take the lead, you organize, you carry overall responsibility.", archetypeWeights: { sovereign: 1 } },
      { position: 2, label_fr: "Tu es celui/celle qui fait avancer concrètement, qui se bat pour le résultat.", label_en: "You're the one who concretely moves things forward, who fights for the result.", archetypeWeights: { warrior: 1 } },
      { position: 3, label_fr: "Tu apportes des idées originales, des solutions créatives.", label_en: "You bring original ideas, creative solutions.", archetypeWeights: { creator: 1 } },
      { position: 4, label_fr: "Tu gardes la vision globale, le sens, tu reformules ce qui est vraiment important.", label_en: "You hold the big picture, the meaning, you reframe what really matters.", archetypeWeights: { sage: 1 } },
    ],
  },
  {
    position: 12,
    type: "single_choice",
    dimension: "work",
    prompt_fr: "Quand tu dois trancher un conflit dans une équipe, tu t'appuies surtout sur…",
    prompt_en: "When you have to settle a team conflict, you mainly rely on…",
    options: [
      { position: 1, label_fr: "La loyauté et la protection des plus vulnérables.", label_en: "Loyalty and protection of the most vulnerable.", archetypeWeights: { caregiver: 1 } },
      { position: 2, label_fr: "Les règles, la structure, l'ordre à maintenir.", label_en: "Rules, structure, the order to maintain.", archetypeWeights: { sovereign: 1 } },
      { position: 3, label_fr: "La vérité crue, même si elle dérange, parfois avec humour ou provocation.", label_en: "Raw truth, even if disturbing, sometimes with humor or provocation.", archetypeWeights: { jester: 1 } },
      { position: 4, label_fr: "L'intuition de ce qui sert le mieux l'évolution de chacun à long terme.", label_en: "Intuition of what best serves everyone's long-term growth.", archetypeWeights: { mystic: 1 } },
    ],
  },
  {
    position: 13,
    type: "single_choice",
    dimension: "work",
    prompt_fr: "Face à un risque professionnel (changer de voie, lancer un projet, devenir indépendant), ta réaction typique est…",
    prompt_en: "Facing a professional risk (changing path, launching a project, going independent), your typical reaction is…",
    options: [
      { position: 1, label_fr: "Imaginer rapidement tout ce qui peut mal tourner et freiner jusqu'à rater l'occasion.", label_en: "Quickly imagine everything that can go wrong and brake until you miss the chance.", shadowWeights: { saboteur: 1 } },
      { position: 2, label_fr: "Rester dans un job ou un contexte qui ne te respecte plus, pour la sécurité financière.", label_en: "Stay in a job or context that no longer respects you, for financial security.", shadowWeights: { prostitute: 1 } },
      { position: 3, label_fr: "Ressentir l'appel de l'aventure, de la découverte, même si tout n'est pas clair.", label_en: "Feel the call of adventure, discovery, even if not everything is clear.", archetypeWeights: { explorer: 1 } },
      { position: 4, label_fr: "Voir l'opportunité comme un terrain pour exprimer ta puissance et ton leadership.", label_en: "See the opportunity as ground to express your power and leadership.", archetypeWeights: { sovereign: 1 } },
    ],
  },
  {
    position: 14,
    type: "single_choice",
    dimension: "work",
    prompt_fr: "Ce qui t'importe le plus dans ton travail au quotidien, c'est…",
    prompt_en: "What matters most to you in your daily work is…",
    options: [
      { position: 1, label_fr: "Sentir que tu aides, que tu contribues au bien-être ou à la guérison des autres.", label_en: "Feeling you help, that you contribute to others' wellbeing or healing.", archetypeWeights: { healer: 1 } },
      { position: 2, label_fr: "Avoir un espace pour créer, imaginer, inventer des choses nouvelles.", label_en: "Having space to create, imagine, invent new things.", archetypeWeights: { creator: 1 } },
      { position: 3, label_fr: "Avoir une mission claire, des défis à relever, défendre une cause ou un objectif.", label_en: "Having a clear mission, challenges to face, defending a cause or goal.", archetypeWeights: { warrior: 1 } },
      { position: 4, label_fr: "Comprendre, apprendre, transmettre du sens ou de la connaissance.", label_en: "Understanding, learning, transmitting meaning or knowledge.", archetypeWeights: { sage: 1 } },
    ],
  },
  {
    position: 15,
    type: "single_choice",
    dimension: "power",
    prompt_fr: "Quand tu te sens menacé dans ta position (professionnelle ou sociale), tu as tendance à…",
    prompt_en: "When you feel threatened in your position (professional or social), you tend to…",
    options: [
      { position: 1, label_fr: "Devenir plus contrôlant, serrer les règles, micro-manager.", label_en: "Become more controlling, tighten rules, micromanage.", archetypeWeights: { sovereign: 1 } },
      { position: 2, label_fr: "Chercher des alliés, négocier dans l'ombre, jouer des coulisses.", label_en: "Seek allies, negotiate in the shadows, work behind the scenes.", archetypeWeights: { magician: 1 } },
      { position: 3, label_fr: "Laisser la situation pourrir en espérant que ça se résolve tout seul.", label_en: "Let the situation rot, hoping it resolves on its own.", shadowWeights: { saboteur: 1 } },
      { position: 4, label_fr: "Claquer la porte ou provoquer une rupture nette pour reprendre ta liberté.", label_en: "Slam the door or provoke a clean break to reclaim your freedom.", archetypeWeights: { rebel: 1 } },
    ],
  },
  {
    position: 16,
    type: "single_choice",
    dimension: "work",
    prompt_fr: "Dans ton rapport à l'argent et à la réussite matérielle, tu te reconnais le plus dans…",
    prompt_en: "In your relationship with money and material success, you most recognize yourself in…",
    options: [
      { position: 1, label_fr: "Une tendance à accepter des choses qui ne te respectent pas par peur de manquer.", label_en: "A tendency to accept things that don't respect you out of fear of lacking.", shadowWeights: { prostitute: 1 } },
      { position: 2, label_fr: "Un besoin de tout contrôler et d'anticiper, comme si tout reposait sur toi.", label_en: "A need to control and anticipate everything, as if everything rested on you.", archetypeWeights: { sovereign: 1 } },
      { position: 3, label_fr: "Une envie de liberté, quitte à préférer moins de sécurité mais plus d'espace pour explorer.", label_en: "A desire for freedom, even preferring less security but more space to explore.", archetypeWeights: { explorer: 1 } },
      { position: 4, label_fr: "Une vision de l'argent comme un flux qui sert surtout à créer, à partager, à soutenir.", label_en: "A vision of money as a flow that mainly serves to create, share, support.", archetypeWeights: { creator: 1 } },
    ],
  },

  // ========== Spirituality, meaning, inner world (Q17–Q21) ==========
  {
    position: 17,
    type: "single_choice",
    dimension: "spirituality",
    prompt_fr: "Quand ta vie perd du sens ou que tu traverses une crise existentielle, tu…",
    prompt_en: "When your life loses meaning or you go through an existential crisis, you…",
    options: [
      { position: 1, label_fr: "Te tournes vers la prière, la méditation, les signes, les synchronicités.", label_en: "Turn to prayer, meditation, signs, synchronicities.", archetypeWeights: { mystic: 1 } },
      { position: 2, label_fr: "Cherches des enseignements, des livres, des modèles pour comprendre ce qui se joue.", label_en: "Seek teachings, books, frameworks to understand what's at play.", archetypeWeights: { sage: 1 } },
      { position: 3, label_fr: "Pars en quête (voyage, nouvelle ville, nouvelle communauté) pour te redécouvrir.", label_en: "Set off on a quest (travel, new city, new community) to rediscover yourself.", archetypeWeights: { explorer: 1 } },
      { position: 4, label_fr: "Te jettes dans l'action ou la distraction pour ne pas trop sentir le vide.", label_en: "Throw yourself into action or distraction to avoid feeling the void.", archetypeWeights: { warrior: 1 } },
    ],
  },
  {
    position: 18,
    type: "single_choice",
    dimension: "spirituality",
    prompt_fr: "Ton rapport au « sacré » ressemble le plus à…",
    prompt_en: "Your relationship with the « sacred » most looks like…",
    options: [
      { position: 1, label_fr: "Un lien intime et direct avec quelque chose de plus grand, que tu ne peux pas toujours expliquer.", label_en: "An intimate, direct link with something greater you can't always explain.", archetypeWeights: { mystic: 1 } },
      { position: 2, label_fr: "Une recherche de règles, de structures spirituelles, de traditions à honorer.", label_en: "A search for rules, spiritual structures, traditions to honor.", archetypeWeights: { sage: 1 } },
      { position: 3, label_fr: "Une expérience à travers le corps, la nature, l'art, la beauté.", label_en: "An experience through the body, nature, art, beauty.", archetypeWeights: { lover: 1 } },
      { position: 4, label_fr: "Une méfiance ou une rébellion contre les systèmes spirituels qui ont abusé de leur pouvoir.", label_en: "Mistrust or rebellion against spiritual systems that abused their power.", archetypeWeights: { rebel: 1 } },
    ],
  },
  {
    position: 19,
    type: "single_choice",
    dimension: "spirituality",
    prompt_fr: "Quand tu « sais » intérieurement que quelque chose est juste pour toi mais que ton entourage ne comprend pas, tu…",
    prompt_en: "When you inwardly « know » something is right for you but your circle doesn't understand, you…",
    options: [
      { position: 1, label_fr: "Abandonnes ton intuition pour rester accepté et ne pas perdre ton appartenance.", label_en: "Abandon your intuition to stay accepted and not lose your belonging.", shadowWeights: { prostitute: 1 } },
      { position: 2, label_fr: "Suis ton intuition quand même, même si tu dois traverser la peur ou l'isolement.", label_en: "Follow your intuition anyway, even crossing fear or isolation.", archetypeWeights: { mystic: 1 } },
      { position: 3, label_fr: "Cherches des arguments, des preuves, du sens pour convaincre et rassurer les autres.", label_en: "Seek arguments, proofs, meaning to convince and reassure others.", archetypeWeights: { magician: 1 } },
      { position: 4, label_fr: "Fais comme tu veux sans trop expliquer, en assumant ton côté « j'avance hors des codes ».", label_en: "Do as you wish without explaining much, owning your « outside the codes » side.", archetypeWeights: { rebel: 1 } },
    ],
  },
  {
    position: 20,
    type: "single_choice",
    dimension: "spirituality",
    prompt_fr: "Dans ton dialogue intérieur, la voix qui parle le plus fort ressemble à…",
    prompt_en: "In your inner dialogue, the loudest voice resembles…",
    options: [
      { position: 1, label_fr: "Un critique interne qui te rappelle ce que tu n'as pas fait ou raté.", label_en: "An inner critic reminding you what you haven't done or have failed.", shadowWeights: { saboteur: 1 } },
      { position: 2, label_fr: "Un parent intérieur qui essaie de te protéger, parfois en te gardant petit.", label_en: "An inner parent trying to protect you, sometimes by keeping you small.", shadowWeights: { child: 1 } },
      { position: 3, label_fr: "Un guide qui t'encourage à apprendre et à tirer du sens de chaque expérience.", label_en: "A guide encouraging you to learn and draw meaning from every experience.", archetypeWeights: { sage: 1 } },
      { position: 4, label_fr: "Une présence silencieuse qui t'invite à lâcher prise et à faire confiance.", label_en: "A silent presence inviting you to let go and trust.", archetypeWeights: { mystic: 1 } },
    ],
  },
  {
    position: 21,
    type: "single_choice",
    dimension: "spirituality",
    prompt_fr: "Quand tu observes la souffrance des autres, ton premier mouvement spontané est…",
    prompt_en: "When you observe others' suffering, your first spontaneous movement is…",
    options: [
      { position: 1, label_fr: "Tu as envie de soulager, de soigner, d'être là, parfois jusqu'à l'épuisement.", label_en: "You want to relieve, heal, be there, sometimes to exhaustion.", archetypeWeights: { healer: 1 } },
      { position: 2, label_fr: "Tu ressens l'injustice et l'envie de combattre les causes systémiques.", label_en: "You feel injustice and the urge to fight systemic causes.", archetypeWeights: { warrior: 1 } },
      { position: 3, label_fr: "Tu essaies de donner du sens, des mots, une perspective plus large.", label_en: "You try to give meaning, words, a broader perspective.", archetypeWeights: { sage: 1 } },
      { position: 4, label_fr: "Tu allèges, tu apportes du rire, tu crées un espace où on respire un peu.", label_en: "You lighten up, bring laughter, create a space where one breathes.", archetypeWeights: { jester: 1 } },
    ],
  },

  // ========== Crisis, change, limits (Q22–Q26) ==========
  {
    position: 22,
    type: "single_choice",
    dimension: "crisis",
    prompt_fr: "Quand une situation devient invivable (job, relation, lieu de vie), tu…",
    prompt_en: "When a situation becomes unbearable (job, relationship, place to live), you…",
    options: [
      { position: 1, label_fr: "Restes jusqu'au bout, en espérant que quelqu'un ou quelque chose te sorte de là.", label_en: "Stay until the end, hoping someone or something pulls you out.", shadowWeights: { victim: 1 } },
      { position: 2, label_fr: "Provoques toi-même un événement qui fait exploser la situation.", label_en: "Provoke an event yourself that blows up the situation.", shadowWeights: { saboteur: 1 } },
      { position: 3, label_fr: "Prépares silencieusement ta sortie, en planifiant chaque détail.", label_en: "Silently prepare your exit, planning every detail.", archetypeWeights: { magician: 1 } },
      { position: 4, label_fr: "Prends une décision nette, même difficile, parce que tu sens que c'est le bon combat à mener.", label_en: "Make a clean decision, even hard, because you sense it's the right fight.", archetypeWeights: { warrior: 1 } },
    ],
  },
  {
    position: 23,
    type: "single_choice",
    dimension: "crisis",
    prompt_fr: "Quand tu as déjà échoué plusieurs fois dans un domaine important pour toi, tu as tendance à…",
    prompt_en: "When you've failed several times in an area important to you, you tend to…",
    options: [
      { position: 1, label_fr: "Te convaincre que tu n'es pas fait pour ça, et te retirer du jeu.", label_en: "Convince yourself you're not made for this, and withdraw from the game.", shadowWeights: { victim: 1 } },
      { position: 2, label_fr: "Recommencer avec encore plus de détermination, comme un défi personnel.", label_en: "Start again with even more determination, as a personal challenge.", archetypeWeights: { warrior: 1 } },
      { position: 3, label_fr: "Chercher un autre angle, un autre terrain, en te réinventant.", label_en: "Seek another angle, another ground, reinventing yourself.", archetypeWeights: { creator: 1 } },
      { position: 4, label_fr: "Te disperser dans d'autres plaisirs ou distractions pour ne plus penser à cet échec.", label_en: "Scatter into other pleasures or distractions to stop thinking about this failure.", archetypeWeights: { jester: 1 } },
    ],
  },
  {
    position: 24,
    type: "single_choice",
    dimension: "crisis",
    prompt_fr: "Dans les périodes de transition (changement de cycle, « mort-renaissance »), tu te reconnais le plus dans…",
    prompt_en: "In transition periods (cycle change, « death-rebirth »), you most recognize yourself in…",
    options: [
      { position: 1, label_fr: "Une impression d'être perdu, comme un enfant sans repères.", label_en: "A feeling of being lost, like a child without bearings.", shadowWeights: { child: 1 } },
      { position: 2, label_fr: "Une nécessité de tout brûler pour repartir sur autre chose.", label_en: "A need to burn it all down to restart on something else.", archetypeWeights: { rebel: 1 } },
      { position: 3, label_fr: "Un besoin de te retirer pour écouter ce que ta vie veut te dire.", label_en: "A need to withdraw to listen to what your life wants to tell you.", archetypeWeights: { mystic: 1 } },
      { position: 4, label_fr: "Une confiance profonde que chaque crise te prépare à un rôle plus grand.", label_en: "A deep trust that every crisis prepares you for a greater role.", archetypeWeights: { sovereign: 1 } },
    ],
  },
  {
    position: 25,
    type: "single_choice",
    dimension: "limits",
    prompt_fr: "Quand tu dois poser une limite claire (dire non, mettre un stop), ce qui te bloque le plus souvent, c'est…",
    prompt_en: "When you have to set a clear limit (say no, put a stop), what most often blocks you is…",
    options: [
      { position: 1, label_fr: "La peur de perdre l'amour ou l'approbation de l'autre.", label_en: "The fear of losing the other's love or approval.", shadowWeights: { prostitute: 1 } },
      { position: 2, label_fr: "La peur d'être vu comme méchant, dur ou égoïste.", label_en: "The fear of being seen as mean, harsh or selfish.", archetypeWeights: { caregiver: 1 } },
      { position: 3, label_fr: "La peur de déclencher un conflit qui t'échappe.", label_en: "The fear of triggering a conflict that escapes you.", shadowWeights: { saboteur: 1 } },
      { position: 4, label_fr: "En réalité, tu poses tes limites, quitte à accepter que certaines personnes s'éloignent.", label_en: "Actually, you set your limits, even accepting some people will drift away.", archetypeWeights: { warrior: 1 } },
    ],
  },
  {
    position: 26,
    type: "single_choice",
    dimension: "power",
    prompt_fr: "Quand tu te sens dominé ou contrôlé par quelqu'un, tu réagis le plus souvent en…",
    prompt_en: "When you feel dominated or controlled by someone, you most often react by…",
    options: [
      { position: 1, label_fr: "Te soumettant extérieurement, tout en te victimisant intérieurement.", label_en: "Submitting outwardly while victimizing yourself inwardly.", shadowWeights: { victim: 1 } },
      { position: 2, label_fr: "Résistant passivement, en ralentissant, oubliant, « faisant mal » les choses.", label_en: "Passively resisting, slowing down, forgetting, doing things « wrong ».", shadowWeights: { saboteur: 1 } },
      { position: 3, label_fr: "Rompant le lien ou l'alliance dès que tu peux, même de façon brutale.", label_en: "Breaking the bond or alliance as soon as you can, even brutally.", archetypeWeights: { rebel: 1 } },
      { position: 4, label_fr: "Reprenant progressivement ton pouvoir par la stratégie, la négociation, la redéfinition du cadre.", label_en: "Gradually reclaiming your power through strategy, negotiation, reframing.", archetypeWeights: { magician: 1 } },
    ],
  },

  // ========== Creativity, play, expression (Q27–Q30) ==========
  {
    position: 27,
    type: "single_choice",
    dimension: "creativity",
    prompt_fr: "Quand tu es dans un espace créatif (écrire, coder, cuisiner, dessiner, organiser un événement…), tu…",
    prompt_en: "When you're in a creative space (writing, coding, cooking, drawing, organizing an event…), you…",
    options: [
      { position: 1, label_fr: "Ressens une forme de canalisation, comme si quelque chose de plus grand passait à travers toi.", label_en: "Feel a form of channeling, as if something greater were passing through you.", archetypeWeights: { mystic: 1 } },
      { position: 2, label_fr: "T'amuses, joues, expérimentes, sans trop te prendre au sérieux.", label_en: "Have fun, play, experiment, without taking yourself too seriously.", archetypeWeights: { jester: 1 } },
      { position: 3, label_fr: "Cherches à améliorer, perfectionner, structurer pour que ce soit utile et durable.", label_en: "Seek to improve, perfect, structure so it's useful and lasting.", archetypeWeights: { magician: 1 } },
      { position: 4, label_fr: "Utilises la création pour transformer ta propre douleur ou celle des autres.", label_en: "Use creation to transform your own pain or others'.", archetypeWeights: { healer: 1 } },
    ],
  },
  {
    position: 28,
    type: "single_choice",
    dimension: "creativity",
    prompt_fr: "Dans les groupes ou communautés, ton style naturel est…",
    prompt_en: "In groups or communities, your natural style is…",
    options: [
      { position: 1, label_fr: "Le/La catalyseur·rice qui casse la rigidité, fait bouger les lignes, remet en question les normes.", label_en: "The catalyst who breaks rigidity, shifts the lines, questions norms.", archetypeWeights: { rebel: 1 } },
      { position: 2, label_fr: "Le/La gardien·ne du climat émotionnel, qui s'assure que chacun se sente vu et soutenu.", label_en: "The guardian of emotional climate, ensuring everyone feels seen and supported.", archetypeWeights: { caregiver: 1 } },
      { position: 3, label_fr: "Le/La conteur·se, celui/celle qui met en récit, qui donne une mémoire et une identité au groupe.", label_en: "The storyteller, who narrates, who gives memory and identity to the group.", archetypeWeights: { sage: 1 } },
      { position: 4, label_fr: "Le/La clown sacré·e qui dit des vérités à travers l'humour et la dérision.", label_en: "The sacred clown speaking truths through humor and derision.", archetypeWeights: { jester: 1 } },
    ],
  },
  {
    position: 29,
    type: "single_choice",
    dimension: "identity",
    prompt_fr: "Quand tu te sens vraiment « toi-même », c'est souvent quand…",
    prompt_en: "When you feel truly « yourself », it's often when…",
    options: [
      { position: 1, label_fr: "Tu explores, voyages, découvres de nouveaux environnements ou de nouvelles idées.", label_en: "You explore, travel, discover new environments or ideas.", archetypeWeights: { explorer: 1 } },
      { position: 2, label_fr: "Tu es plongé dans une activité qui te passionne au point de perdre la notion du temps.", label_en: "You're immersed in an activity that thrills you to the point of losing track of time.", archetypeWeights: { lover: 1 } },
      { position: 3, label_fr: "Tu accompagnes quelqu'un à travers une transformation ou une guérison.", label_en: "You accompany someone through transformation or healing.", archetypeWeights: { healer: 1 } },
      { position: 4, label_fr: "Tu mènes un projet, une équipe, une cause qui te dépasse.", label_en: "You lead a project, a team, a cause greater than you.", archetypeWeights: { sovereign: 1 } },
    ],
  },
  {
    position: 30,
    type: "single_choice",
    dimension: "creativity",
    prompt_fr: "Si tu devais choisir une manière de « jouer » avec la vie, ce serait plutôt…",
    prompt_en: "If you had to choose a way to « play » with life, it would rather be…",
    options: [
      { position: 1, label_fr: "La voir comme un terrain d'entraînement pour ton courage et ta capacité à te relever.", label_en: "See it as training ground for your courage and ability to rise.", archetypeWeights: { warrior: 1 } },
      { position: 2, label_fr: "La vivre comme une aventure initiatique, pleine de signes, de synchronicités et de rencontres-clés.", label_en: "Live it as an initiatory adventure, full of signs, synchronicities, key encounters.", archetypeWeights: { mystic: 1 } },
      { position: 3, label_fr: "La traiter comme une grande scène où l'on peut créer, raconter, transformer en beauté même le chaos.", label_en: "Treat it as a great stage where one creates, tells, turns even chaos into beauty.", archetypeWeights: { creator: 1 } },
      { position: 4, label_fr: "La considérer comme un contrat sacré où tu as une responsabilité envers les autres et le collectif.", label_en: "Consider it a sacred contract where you have responsibility to others and the collective.", archetypeWeights: { sovereign: 1 } },
    ],
  },
];
