/**
 * Caroline Myss T1 — Onboarding baseline (15 questions).
 * Myss V3 protocol: free multiple selection + per-option intensity (1–3).
 * Scoring: S(A/P) = Σ W × I via morphicField.ts.
 */

import type { PolarityWeight, QuestionSeed } from "./types";

const w = (
  archetype: PolarityWeight["archetype"],
  polarity: PolarityWeight["polarity"],
  weight: number,
): PolarityWeight => ({ archetype, polarity, weight });

export const QUESTIONS_T1: QuestionSeed[] = [
  {
    position: 1,
    type: "multiple_choice",
    dimension: "identity",
    prompt_fr: "Un projet créatif ou entrepreneurial dans lequel vous avez investi des mois d'énergie, de ressources et d'amour propre s'effondre publiquement (rejet du marché, critiques sévères ou échec technique). Comment réagissez-vous ?",
    prompt_en: "A creative or entrepreneurial project in which you invested months of energy, resources, and self-esteem collapses publicly (market rejection, harsh criticism, or technical failure). How do you react?",
    meta: { intensityEnabled: true, scoringModel: "myss-v3" },
    options: [
      {
        position: 1,
        label_fr: "Me sentir personnellement détruit, détruire ou supprimer toute trace du projet dans un élan de dégoût de moi-même, convaincu que je n'aurais jamais dû essayer.",
        label_en: "Feel personally destroyed, destroy or delete all traces of the project in a burst of self-loathing, convinced that I should never have tried.",
        polarityWeights: [
          w("saboteur", "shadow", 1.00),
          w("creator", "shadow", 0.75),
          w("victim", "shadow", 0.25),
          w("creator", "light", -1.00),
        ],
      },
      {
        position: 2,
        label_fr: "Analyser froidement et objectivement les causes techniques de l'échec pour en extraire des leçons stratégiques, assumer la responsabilité des erreurs de conception sans me laisser abattre.",
        label_en: "Coldly and objectively analyze the technical causes of the failure to extract strategic lessons, assume responsibility for design errors without letting myself be defeated.",
        polarityWeights: [
          w("sage", "light", 1.00),
          w("sovereign", "light", 0.75),
          w("victim", "shadow", -0.50),
        ],
      },
      {
        position: 3,
        label_fr: "Déclarer que le marché ou le public n'a rien compris à ma vision, rejeter leurs critères d'évaluation et partir immédiatement sur un tout autre projet.",
        label_en: "Declare that the market or public did not understand my vision, reject their evaluation criteria, and immediately move on to a completely different project.",
        polarityWeights: [
          w("rebel", "shadow", 1.00),
          w("explorer", "light", 0.75),
          w("saboteur", "shadow", 0.25),
        ],
      },
      {
        position: 4,
        label_fr: "Prendre soin de mon état émotionnel et de celui de mes collaborateurs, accepter la tristesse du deuil, et chercher à réparer les blessures d'amour-propre avec douceur.",
        label_en: "Take care of my emotional state and that of my collaborators, accept the sadness of grief, and seek to repair self-esteem wounds with gentleness.",
        polarityWeights: [
          w("healer", "light", 1.00),
          w("caregiver", "light", 0.75),
          w("child", "shadow", -0.50),
        ],
      },
      {
        position: 5,
        label_fr: "Me replier sur moi-même en me plaignant de la cruauté ou de l'injustice du public, en attendant que mes proches viennent me rassurer et me dire que le monde entier a tort.",
        label_en: "Withdraw into myself, complaining about the cruelty or injustice of the public, waiting for my loved ones to come reassure me and tell me that the whole world is wrong.",
        polarityWeights: [
          w("victim", "shadow", 1.00),
          w("child", "shadow", 0.75),
          w("sovereign", "light", -0.50),
        ],
      },
      {
        position: 6,
        label_fr: "Accueillir l'échec avec humour en tournant la situation en dérision, et utiliser ce chaos apparent comme un terreau pour rebondir vers une opportunité inattendue.",
        label_en: "Welcome the failure with humor by turning the situation into derision, and use this apparent chaos as breeding ground to bounce back toward an unexpected opportunity.",
        polarityWeights: [
          w("jester", "light", 1.00),
          w("magician", "light", 0.75),
          w("saboteur", "shadow", -0.25),
        ],
      },
      {
        position: 7,
        label_fr: "Accepter que ce projet n'était pas aligné avec mon chemin de vie supérieur, ressentir de la gratitude pour l'expérience et m'en remettre sereinement à la volonté universelle.",
        label_en: "Accept that this project was not aligned with my higher life path, feel gratitude for the experience, and serenely surrender to the universal will.",
        polarityWeights: [
          w("mystic", "light", 1.00),
          w("lover", "light", 0.75),
          w("child", "shadow", -0.50),
        ],
      },
      {
        position: 8,
        label_fr: "Réprimer ma déception, analyser les pertes financières, et chercher immédiatement un travail ou un projet alimentaire sûr pour stabiliser ma situation matérielle au détriment de mes rêves.",
        label_en: "Repress my disappointment, analyze the financial losses, and immediately seek a secure food job or project to stabilize my material situation at the expense of my dreams.",
        polarityWeights: [
          w("prostitute", "shadow", 1.00),
          w("warrior", "light", 0.75),
          w("creator", "light", -0.50),
        ],
      },
    ],
  },
  {
    position: 2,
    type: "multiple_choice",
    dimension: "identity",
    prompt_fr: "Un ami proche ou un mentor que vous respectez critique ouvertement vos choix de vie récents (professionnels ou personnels) lors d'un dîner, jugeant que vous faites fausse route. Comment réagissez-vous ?",
    prompt_en: "A close friend or mentor you respect openly criticizes your recent life choices (professional or personal) during a dinner, judging that you are on the wrong track. How do you react?",
    meta: { intensityEnabled: true, scoringModel: "myss-v3" },
    options: [
      {
        position: 1,
        label_fr: "J'écoute ses arguments avec attention, mais je poursuis ma route avec détermination, convaincu de la légitimité de mon chemin.",
        label_en: "I listen to their arguments carefully, but I continue my path with determination, convinced of the legitimacy of my way.",
        polarityWeights: [
          w("sovereign", "light", 1.00),
          w("rebel", "light", 0.75),
          w("child", "shadow", -0.50),
        ],
      },
      {
        position: 2,
        label_fr: "Je me sens profondément blessé et je cherche à me justifier longuement pour regagner son approbation et restaurer le lien.",
        label_en: "I feel deeply hurt and seek to justify myself at length to regain their approval and restore the bond.",
        polarityWeights: [
          w("child", "shadow", 1.00),
          w("caregiver", "shadow", 0.75),
          w("sovereign", "light", -0.50),
        ],
      },
      {
        position: 3,
        label_fr: "J'analyse objectivement ses critiques pour voir s'il y a une part de vérité constructive, sans me laisser déstabiliser émotionnellement.",
        label_en: "I objectively analyze their criticisms to see if there is a constructive truth, without letting myself be emotionally destabilized.",
        polarityWeights: [
          w("sage", "light", 1.00),
          w("explorer", "light", 0.75),
          w("victim", "shadow", -0.50),
        ],
      },
      {
        position: 4,
        label_fr: "Je prends la mouche, je me sens agressé, et je rejette immédiatement son avis en l'accusant de vouloir me contrôler ou me rabaisser.",
        label_en: "I get defensive, feel attacked, and immediately reject their opinion, accusing them of wanting to control or demean me.",
        polarityWeights: [
          w("victim", "shadow", 1.00),
          w("rebel", "shadow", 0.75),
          w("sovereign", "light", -0.25),
        ],
      },
      {
        position: 5,
        label_fr: "Je commence à douter secrètement de mes choix et j'envisage de modifier mes projets pour ne pas le décevoir ou risquer sa désapprobation.",
        label_en: "I start secretly doubting my choices and consider modifying my projects so as not to disappoint them or risk their disapproval.",
        polarityWeights: [
          w("prostitute", "shadow", 1.00),
          w("saboteur", "shadow", 0.75),
          w("sovereign", "light", -0.50),
        ],
      },
      {
        position: 6,
        label_fr: "Je désamorce la tension par une pirouette humoristique ou une taquinerie, tout en changeant habilement de sujet pour éviter le conflit frontal.",
        label_en: "I defuse the tension with a humorous spin or teasing, while cleverly changing the subject to avoid frontal conflict.",
        polarityWeights: [
          w("jester", "light", 1.00),
          w("magician", "light", 0.50),
          w("child", "shadow", -0.25),
        ],
      },
      {
        position: 7,
        label_fr: "Je ressens un détachement tranquille, me disant que chacun a sa propre vérité et que mon chemin est guidé par une intuition supérieure.",
        label_en: "I feel a quiet detachment, telling myself that everyone has their own truth and that my path is guided by a higher intuition.",
        polarityWeights: [
          w("mystic", "light", 1.00),
          w("explorer", "light", 0.75),
          w("child", "shadow", -0.50),
        ],
      },
      {
        position: 8,
        label_fr: "Je pose calmement mais fermement une limite, lui signifiant que mes choix ne sont pas ouverts au débat, tout en préservant notre amitié.",
        label_en: "I calmly but firmly set a boundary, letting them know that my choices are not up for debate, while preserving our friendship.",
        polarityWeights: [
          w("warrior", "light", 1.00),
          w("sovereign", "light", 0.75),
          w("prostitute", "shadow", -0.50),
        ],
      },
    ],
  },
  {
    position: 3,
    type: "multiple_choice",
    dimension: "identity",
    prompt_fr: "Vous devez intégrer un milieu d'affaires ou social très influent, mais cela exige d'adopter des codes comportementaux, des vêtements ou des discours qui vous semblent artificiels ou contraires à votre authenticité. Comment vous positionnez-vous ?",
    prompt_en: "You need to integrate a very influential business or social circle, but it requires adopting behavioral codes, clothing, or speeches that seem artificial or contrary to your authenticity. How do you position yourself?",
    meta: { intensityEnabled: true, scoringModel: "myss-v3" },
    options: [
      {
        position: 1,
        label_fr: "Je joue le jeu stratégiquement en adoptant les codes requis comme un outil de communication, sans jamais perdre de vue qui je suis vraiment.",
        label_en: "I play the game strategically by adopting the required codes as a communication tool, without ever losing sight of who I really am.",
        polarityWeights: [
          w("magician", "light", 1.00),
          w("sovereign", "light", 0.75),
          w("prostitute", "shadow", -0.50),
        ],
      },
      {
        position: 2,
        label_fr: "Je refuse catégoriquement de me conformer, préférant être rejeté plutôt que de sacrifier mon style et mon authenticité.",
        label_en: "I categorically refuse to conform, preferring to be rejected rather than sacrificing my style and authenticity.",
        polarityWeights: [
          w("rebel", "light", 1.00),
          w("creator", "light", 0.75),
          w("prostitute", "shadow", -0.50),
        ],
      },
      {
        position: 3,
        label_fr: "Je m'adapte totalement et j'adopte sincèrement leurs codes, quitte à enfouir ma personnalité profonde pour me faire accepter et sécuriser ma place.",
        label_en: "I adapt completely and sincerely adopt their codes, even if it means burying my deep personality to be accepted and secure my place.",
        polarityWeights: [
          w("prostitute", "shadow", 1.00),
          w("caregiver", "shadow", 0.50),
          w("sovereign", "light", -0.75),
        ],
      },
      {
        position: 4,
        label_fr: "J'observe d'abord froidement le fonctionnement du groupe pour comprendre leurs dynamiques de pouvoir avant de décider de mon niveau d'implication.",
        label_en: "I first coldly observe how the group works to understand their power dynamics before deciding on my level of involvement.",
        polarityWeights: [
          w("sage", "light", 1.00),
          w("explorer", "light", 0.75),
          w("victim", "shadow", -0.25),
        ],
      },
      {
        position: 5,
        label_fr: "Je me sens mal à l'aise et victime de la situation, me plaignant en secret de l'hypocrisie de ce milieu tout en y restant par obligation.",
        label_en: "I feel uncomfortable and victimized by the situation, secretly complaining about the hypocrisy of this environment while remaining by obligation.",
        polarityWeights: [
          w("victim", "shadow", 1.00),
          w("child", "shadow", 0.75),
          w("rebel", "light", -0.50),
        ],
      },
      {
        position: 6,
        label_fr: "J'entre dans ce milieu en conservant des touches subtiles d'originalité et d'humour pour tourner gentiment en dérision leur conformisme.",
        label_en: "I enter this environment keeping subtle touches of originality and humor to gently mock their conformity.",
        polarityWeights: [
          w("jester", "light", 1.00),
          w("lover", "light", 0.75),
          w("prostitute", "shadow", -0.25),
        ],
      },
      {
        position: 7,
        label_fr: "Je cherche à me rendre indispensable en rendant service et en aidant les membres du groupe, espérant que ma bienveillance me fera accepter pour ce que je suis.",
        label_en: "I seek to make myself indispensable by being of service and helping group members, hoping my benevolence will make me accepted for who I am.",
        polarityWeights: [
          w("caregiver", "light", 1.00),
          w("healer", "light", 0.75),
          w("prostitute", "shadow", -0.25),
        ],
      },
      {
        position: 8,
        label_fr: "Je traverse ce milieu sans m'y attacher, le voyant simplement comme une étape transitoire sur mon parcours de vie.",
        label_en: "I go through this environment without getting attached, seeing it simply as a transitional step on my life path.",
        polarityWeights: [
          w("explorer", "light", 1.00),
          w("mystic", "light", 0.75),
          w("child", "shadow", -0.50),
        ],
      },
    ],
  },
  {
    position: 4,
    type: "multiple_choice",
    dimension: "power",
    prompt_fr: "Un partenaire commercial majeur ou un supérieur hiérarchique vous demande d'ajuster légèrement les chiffres d'un rapport ou de minimiser un défaut technique pour sécuriser un contrat vital ou rassurer le conseil d'administration. Quelle est votre réaction ?",
    prompt_en: "A major business partner or superior asks you to slightly adjust the numbers in a report or minimize a technical flaw to secure a vital contract or reassure the board. What is your reaction?",
    meta: { intensityEnabled: true, scoringModel: "myss-v3" },
    options: [
      {
        position: 1,
        label_fr: "Refuser fermement l'altération des faits, proposer une présentation transparente de la situation accompagnée d'un plan correctif solide pour protéger la réputation à long terme.",
        label_en: "Firmly refuse the alteration of facts, suggest a transparent presentation of the situation accompanied by a solid corrective plan to protect long-term reputation.",
        polarityWeights: [
          w("sovereign", "light", 1.00),
          w("sage", "light", 0.75),
          w("prostitute", "shadow", -0.50),
          w("victim", "shadow", -0.25),
        ],
      },
      {
        position: 2,
        label_fr: "Signaler immédiatement le problème à l'équipe ou aux instances de contrôle externes si nécessaire, en refusant d'être complice d'un système qui sacrifie l'éthique pour des gains immédiats.",
        label_en: "Immediately report the problem to the team or external control bodies if necessary, refusing to be complicit in a system that sacrifices ethics for immediate gains.",
        polarityWeights: [
          w("rebel", "light", 1.00),
          w("warrior", "light", 0.75),
          w("prostitute", "shadow", -0.50),
          w("saboteur", "shadow", -0.25),
        ],
      },
      {
        position: 3,
        label_fr: "Prendre le temps de discuter en privé avec le demandeur pour comprendre ses craintes réelles (perte d'emploi, faillite) et chercher ensemble une solution éthique alternative pour désamorcer sa panique.",
        label_en: "Take the time to talk privately with the requester to understand their real fears (job loss, bankruptcy) and seek an alternative ethical solution together to defuse their panic.",
        polarityWeights: [
          w("caregiver", "light", 1.00),
          w("healer", "light", 0.75),
          w("magician", "light", 0.25),
        ],
      },
      {
        position: 4,
        label_fr: "Accepter la demande à contre-cœur en me disant que je n'ai pas le choix dans cette structure et que je dois protéger ma sécurité financière immédiate avant tout.",
        label_en: "Reluctantly accept the request, telling myself I have no choice in this structure and must protect my immediate financial security above all.",
        polarityWeights: [
          w("prostitute", "shadow", 1.00),
          w("victim", "shadow", 0.75),
          w("sovereign", "light", -0.50),
          w("warrior", "light", -0.50),
        ],
      },
      {
        position: 5,
        label_fr: "Repousser ma réponse, prétexter une surcharge de travail ou une incompréhension des consignes, en espérant que la situation se tasse ou que quelqu'un d'autre prenne la décision à ma place.",
        label_en: "Delay my response, claim a heavy workload or misunderstanding of instructions, hoping the situation blows over or someone else makes the decision for me.",
        polarityWeights: [
          w("saboteur", "shadow", 1.00),
          w("child", "shadow", 0.75),
          w("explorer", "light", -0.50),
        ],
      },
      {
        position: 6,
        label_fr: "Utiliser mes compétences de communication pour reformuler la situation dans le rapport de manière à présenter les faiblesses sous un angle d'opportunité d'amélioration stratégique, sans mentir.",
        label_en: "Use my communication skills to reframe the situation in the report to present weaknesses as strategic improvement opportunities, without lying.",
        polarityWeights: [
          w("magician", "light", 1.00),
          w("creator", "light", 0.75),
          w("sage", "light", 0.25),
        ],
      },
      {
        position: 7,
        label_fr: "Relativiser la gravité de la situation avec ironie, faire comprendre subtilement au demandeur l'absurdité de maquiller la réalité, et commencer à envisager d'autres horizons.",
        label_en: "Put the situation into perspective with irony, subtly make the requester understand the absurdity of masking reality, and begin considering other career paths.",
        polarityWeights: [
          w("jester", "light", 1.00),
          w("explorer", "light", 0.75),
          w("rebel", "light", 0.25),
        ],
      },
      {
        position: 8,
        label_fr: "Refuser le compromis en me fiant entièrement à mon intuition profonde et à ma foi en des lois supérieures, acceptant d'avance les conséquences matérielles.",
        label_en: "Refuse the compromise, relying entirely on my deep intuition and faith in higher laws, accepting the material consequences in advance.",
        polarityWeights: [
          w("mystic", "light", 1.00),
          w("lover", "light", 0.50),
          w("prostitute", "shadow", -0.75),
        ],
      },
    ],
  },
  {
    position: 5,
    type: "multiple_choice",
    dimension: "power",
    prompt_fr: "Lors d'une réunion importante, votre manager s'attribue publiquement et exclusivement le mérite d'un travail complexe ou d'une idée innovante que vous avez réalisée seule. Comment réagissez-vous ?",
    prompt_en: "During an important meeting, your manager publicly and exclusively takes credit for a complex job or innovative idea that you executed alone. How do you react?",
    meta: { intensityEnabled: true, scoringModel: "myss-v3" },
    options: [
      {
        position: 1,
        label_fr: "Intervenir immédiatement avec calme et professionnalisme pour préciser ma contribution en donnant des détails techniques que moi seule maîtrise.",
        label_en: "Intervene immediately with calm and professionalism to clarify my contribution by giving technical details that only I master.",
        polarityWeights: [
          w("warrior", "light", 1.00),
          w("sovereign", "light", 0.75),
          w("victim", "shadow", -0.50),
        ],
      },
      {
        position: 2,
        label_fr: "Ne rien dire pendant la réunion pour ne pas créer d'incident, mais solliciter un entretien privé pour clarifier la situation et réclamer ma juste reconnaissance.",
        label_en: "Say nothing during the meeting to avoid creating an incident, but request a private meeting to clarify the situation and claim my rightful recognition.",
        polarityWeights: [
          w("sage", "light", 1.00),
          w("prostitute", "shadow", -0.25),
          w("victim", "shadow", -0.25),
        ],
      },
      {
        position: 3,
        label_fr: "Lancer une pique pleine d'ironie ou d'humour noir pour souligner subtilement ma paternité du projet devant toute l'assistance.",
        label_en: "Throw a bite full of irony or black humor to subtly highlight my paternity of the project in front of the audience.",
        polarityWeights: [
          w("jester", "light", 1.00),
          w("rebel", "light", 0.75),
          w("saboteur", "shadow", -0.25),
        ],
      },
      {
        position: 4,
        label_fr: "Garder le silence, me sentir trahi et victime de l'injustice du système, et ruminer ma colère sans jamais aborder le sujet directement.",
        label_en: "Keep silent, feel betrayed and victimized by the injustice of the system, and chew my anger without ever addressing the subject directly.",
        polarityWeights: [
          w("victim", "shadow", 1.00),
          w("child", "shadow", 0.50),
          w("sovereign", "light", -0.50),
        ],
      },
      {
        position: 5,
        label_fr: "Considérer que c'est le prix à payer pour maintenir la paix avec mon manager et sécuriser mon emploi, en espérant qu'il me revaudra ça plus tard.",
        label_en: "Consider that it is the price to pay to maintain peace with my manager and secure my job, hoping they will make it up to me later.",
        polarityWeights: [
          w("prostitute", "shadow", 1.00),
          w("caregiver", "shadow", 0.50),
          w("warrior", "light", -0.75),
        ],
      },
      {
        position: 6,
        label_fr: "Utiliser cette injustice comme un signal clair qu'il est temps de quitter cette structure et commencer discrètement à chercher de nouvelles opportunités ailleurs.",
        label_en: "Use this injustice as a clear signal that it is time to leave this structure and discreetly start looking for new opportunities elsewhere.",
        polarityWeights: [
          w("explorer", "light", 1.00),
          w("rebel", "light", 0.75),
          w("saboteur", "shadow", -0.25),
        ],
      },
      {
        position: 7,
        label_fr: "Me détacher émotionnellement de l'ego de mon manager, me disant que la valeur réside dans le fait d'avoir créé l'idée, pas dans la gloire publique.",
        label_en: "Emotionally detach from my manager's ego, telling myself that the value lies in having created the idea, not in public glory.",
        polarityWeights: [
          w("mystic", "light", 1.00),
          w("creator", "light", 0.75),
          w("child", "shadow", -0.50),
        ],
      },
      {
        position: 8,
        label_fr: "Trouver un moyen de communiquer directement sur le projet avec les niveaux hiérarchiques supérieurs ou les clients, en court-circuitant gentiment mon manager.",
        label_en: "Find a way to communicate directly about the project with higher management levels or clients, gently bypassing my manager.",
        polarityWeights: [
          w("magician", "light", 1.00),
          w("sovereign", "light", 0.75),
          w("victim", "shadow", -0.50),
        ],
      },
    ],
  },
  {
    position: 6,
    type: "multiple_choice",
    dimension: "power",
    prompt_fr: "Une crise technique ou organisationnelle majeure survient soudainement. Tout le monde panique, les informations sont contradictoires, et l'équipe se tourne vers vous pour prendre une décision immédiate. Comment agissez-vous ?",
    prompt_en: "A major technical or organizational crisis suddenly occurs. Everyone panics, information is contradictory, and the team turns to you to make an immediate decision. How do you act?",
    meta: { intensityEnabled: true, scoringModel: "myss-v3" },
    options: [
      {
        position: 1,
        label_fr: "Prendre le commandement, ramener le calme, désigner les priorités urgentes et assumer pleinement la responsabilité du plan d'action immédiat.",
        label_en: "Take command, restore calm, designate urgent priorities, and fully assume responsibility for the immediate action plan.",
        polarityWeights: [
          w("sovereign", "light", 1.00),
          w("warrior", "light", 0.75),
          w("victim", "shadow", -0.75),
        ],
      },
      {
        position: 2,
        label_fr: "Isoler les experts clés pour analyser rapidement les données factuelles disponibles avant de trancher de manière rationnelle et argumentée.",
        label_en: "Isolate key experts to quickly analyze available factual data before making a rational and reasoned decision.",
        polarityWeights: [
          w("sage", "light", 1.00),
          w("magician", "light", 0.50),
          w("saboteur", "shadow", -0.25),
        ],
      },
      {
        position: 3,
        label_fr: "Désamorcer la panique par mon calme ou un trait d'esprit, puis réorienter l'énergie collective vers la recherche de solutions créatives d'urgence.",
        label_en: "Defuse the panic with my calm or a witticism, then redirect the collective energy toward seeking urgent creative solutions.",
        polarityWeights: [
          w("jester", "light", 1.00),
          w("creator", "light", 0.75),
          w("child", "shadow", -0.25),
        ],
      },
      {
        position: 4,
        label_fr: "Me sentir submergé par la pression, avoir peur de commettre une erreur fatale et attendre que quelqu'un d'autre prenne l'initiative de décider.",
        label_en: "Feel overwhelmed by pressure, fear making a fatal mistake, and wait for someone else to take the initiative to decide.",
        polarityWeights: [
          w("saboteur", "shadow", 1.00),
          w("child", "shadow", 0.75),
          w("sovereign", "light", -0.75),
        ],
      },
      {
        position: 5,
        label_fr: "Me plier aux procédures existantes ou aux ordres directs du protocole, même s'ils semblent inefficaces dans ce cas précis, pour ne pas porter le chapeau.",
        label_en: "Comply with existing procedures or direct protocol orders, even if they seem ineffective in this specific case, to avoid taking the blame.",
        polarityWeights: [
          w("prostitute", "shadow", 1.00),
          w("victim", "shadow", 0.75),
          w("warrior", "light", -0.50),
        ],
      },
      {
        position: 6,
        label_fr: "Me concentrer sur la protection physique et le soutien moral des personnes les plus vulnérables ou impactées par la crise dans l'immédiat.",
        label_en: "Focus on physical protection and moral support for the most vulnerable or impacted people by the crisis in the immediate term.",
        polarityWeights: [
          w("caregiver", "light", 1.00),
          w("healer", "light", 0.75),
          w("victim", "shadow", -0.25),
        ],
      },
      {
        position: 7,
        label_fr: "Prendre du recul physique ou mental, me fier à mon intuition profonde pour guider mon action sans me laisser polluer par l'hystérie collective.",
        label_en: "Take a physical or mental step back, relying on my deep intuition to guide my action without letting myself be polluted by collective hysteria.",
        polarityWeights: [
          w("mystic", "light", 1.00),
          w("explorer", "light", 0.75),
          w("child", "shadow", -0.50),
        ],
      },
      {
        position: 8,
        label_fr: "Saisir l'opportunité du chaos pour casser les vieilles méthodes rigides de l'organisation et imposer une manière radicalement nouvelle de fonctionner.",
        label_en: "Seize the opportunity of chaos to break the organization's old rigid methods and impose a radically new way of functioning.",
        polarityWeights: [
          w("rebel", "light", 1.00),
          w("creator", "light", 0.75),
          w("sovereign", "light", 0.25),
        ],
      },
    ],
  },
  {
    position: 7,
    type: "multiple_choice",
    dimension: "relationship",
    prompt_fr: "Un proche ou un collaborateur traverse une crise personnelle prolongée (dépression, désorganisation financière ou instabilité). Il sollicite constamment votre temps, votre attention ou votre argent, envahissant votre espace personnel et menaçant votre propre équilibre. Comment réagissez-vous ?",
    prompt_en: "A loved one or collaborator is going through a prolonged personal crisis (depression, financial disorganization, or instability). They constantly solicit your time, attention, or money, invading your personal space and threatening your own balance. How do you react?",
    meta: { intensityEnabled: true, scoringModel: "myss-v3" },
    options: [
      {
        position: 1,
        label_fr: "Poser une limite claire et non négociable : lui signifier ce que je peux et ne peux pas faire pour lui, l'orienter vers des professionnels et cesser d'intervenir au-delà.",
        label_en: "Set a clear and non-negotiable boundary: tell them what I can and cannot do for them, direct them to professionals, and stop intervening beyond this point.",
        polarityWeights: [
          w("warrior", "light", 1.00),
          w("sovereign", "light", 0.75),
          w("caregiver", "shadow", -0.50),
          w("victim", "shadow", -0.25),
        ],
      },
      {
        position: 2,
        label_fr: "M'oublier complètement pour me consacrer à sa guérison, culpabiliser dès que je prends du temps pour moi, et absorber toute sa détresse en espérant qu'il s'en sorte.",
        label_en: "Completely forget myself to dedicate myself to their healing, feel guilty as soon as I take time for myself, and absorb all their distress, hoping they make it.",
        polarityWeights: [
          w("caregiver", "shadow", 1.00),
          w("healer", "shadow", 0.75),
          w("victim", "shadow", 0.25),
          w("warrior", "light", -1.00),
        ],
      },
      {
        position: 3,
        label_fr: "Analyser objectivement ses schémas de dépendance répétitifs, refuser de lui donner des solutions prémâchées, et utiliser des questions pour le renvoyer à sa propre responsabilité.",
        label_en: "Objectively analyze their repetitive patterns of dependency, refuse to give them pre-packaged solutions, and use questions to point them back to their own responsibility.",
        polarityWeights: [
          w("sage", "light", 1.00),
          w("magician", "light", 0.75),
          w("child", "shadow", -0.25),
        ],
      },
      {
        position: 4,
        label_fr: "Continuer à répondre à ses demandes par peur de perdre son affection ou d'être jugé comme égoïste, tout en accumulant une immense rancœur silencieuse.",
        label_en: "Continue to respond to their demands out of fear of losing their affection or being judged as selfish, while accumulating immense silent resentment.",
        polarityWeights: [
          w("prostitute", "shadow", 1.00),
          w("victim", "shadow", 0.75),
          w("sovereign", "light", -0.50),
        ],
      },
      {
        position: 5,
        label_fr: "Éviter ses appels, couper les ponts temporairement sans explication pour fuir cette charge émotionnelle, ou tourner ses demandes en plaisanteries pour esquiver.",
        label_en: "Avoid their calls, cut ties temporarily without explanation to flee this emotional load, or turn their requests into jokes to dodge the subject.",
        polarityWeights: [
          w("explorer", "shadow", 1.00),
          w("jester", "shadow", 0.75),
          w("caregiver", "light", -0.50),
        ],
      },
      {
        position: 6,
        label_fr: "Lui offrir une présence aimante et une écoute profonde lorsque je suis disponible, tout en remettant son destin entre les mains de forces supérieures.",
        label_en: "Offer them a loving presence and deep listening when I am available, while placing their destiny in the hands of higher forces.",
        polarityWeights: [
          w("mystic", "light", 1.00),
          w("lover", "light", 0.75),
          w("healer", "shadow", -0.50),
        ],
      },
      {
        position: 7,
        label_fr: "Essayer d'agir discrètement en coulisses pour arranger ses affaires (contacter des gens pour lui, régler des factures) pour régler le problème sans qu'il s'en rende compte.",
        label_en: "Try to act quietly behind the scenes to settle their affairs (contact people for them, pay bills) to solve the problem without them realizing it.",
        polarityWeights: [
          w("magician", "light", 1.00),
          w("caregiver", "shadow", 0.50),
          w("victim", "shadow", -0.25),
        ],
      },
      {
        position: 8,
        label_fr: "Lui proposer de s'associer dans un projet commun ou de cohabiter pour partager les frais, fusionnant nos quotidiens pour mieux le soutenir.",
        label_en: "Propose to partner in a common project or cohabit to share costs, merging our daily lives to better support them.",
        polarityWeights: [
          w("lover", "light", 1.00),
          w("caregiver", "light", 0.50),
          w("explorer", "light", -0.50),
        ],
      },
    ],
  },
  {
    position: 8,
    type: "multiple_choice",
    dimension: "relationship",
    prompt_fr: "Un partenaire de vie ou d'affaires vous demande un engagement à très long terme qui implique de fusionner vos patrimoines ou de renoncer à une part importante de votre liberté individuelle pour bâtir un projet commun. Quelle est votre posture ?",
    prompt_en: "A life or business partner asks you for a very long-term commitment that involves merging your assets or giving up a significant part of your individual freedom to build a common project. What is your posture?",
    meta: { intensityEnabled: true, scoringModel: "myss-v3" },
    options: [
      {
        position: 1,
        label_fr: "Accepter avec enthousiasme, voyant dans cette union la possibilité d'une dévotion totale et d'une co-création passionnée.",
        label_en: "Accept with enthusiasm, seeing in this union the possibility of total devotion and passionate co-creation.",
        polarityWeights: [
          w("lover", "light", 1.00),
          w("creator", "light", 0.50),
          w("explorer", "light", -0.50),
        ],
      },
      {
        position: 2,
        label_fr: "Refuser ou hésiter fortement, ressentant le besoin viscéral de préserver mon autonomie de mouvement et ma liberté de pouvoir partir à tout moment.",
        label_en: "Refuse or hesitate strongly, feeling the visceral need to preserve my autonomy of movement and my freedom to leave at any time.",
        polarityWeights: [
          w("explorer", "light", 1.00),
          w("rebel", "light", 0.75),
          w("child", "shadow", -0.50),
        ],
      },
      {
        position: 3,
        label_fr: "Négocier des clauses juridiques ultra-précises et des limites claires pour protéger mes ressources et mes arrières avant de signer quoi que ce soit.",
        label_en: "Negotiate ultra-precise legal clauses and clear boundaries to protect my resources and back before signing anything.",
        polarityWeights: [
          w("warrior", "light", 1.00),
          w("sovereign", "light", 0.75),
          w("prostitute", "shadow", -0.50),
        ],
      },
      {
        position: 4,
        label_fr: "Accepter par peur de le perdre ou de me retrouver seul, tout en sachant au fond de moi que je sacrifie mon intégrité pour obtenir de la sécurité.",
        label_en: "Accept for fear of losing them or being alone, while knowing deep down that I am sacrificing my integrity to obtain security.",
        polarityWeights: [
          w("prostitute", "shadow", 1.00),
          w("child", "shadow", 0.75),
          w("sovereign", "light", -0.75),
        ],
      },
      {
        position: 5,
        label_fr: "Proposer une structure d'accord innovante et sur-mesure qui permet de collaborer sans aliéner la liberté de chacun, en réinventant le concept d'engagement.",
        label_en: "Propose an innovative and customized agreement structure that allows collaboration without alienating anyone's freedom, reinventing the concept of commitment.",
        polarityWeights: [
          w("creator", "light", 1.00),
          w("magician", "light", 0.75),
          w("prostitute", "shadow", -0.50),
        ],
      },
      {
        position: 6,
        label_fr: "Demander l'avis de mes proches ou d'un conseiller de confiance pour valider ma décision, n'osant pas trancher seul un choix si lourd de conséquences.",
        label_en: "Ask for the opinion of my loved ones or a trusted advisor to validate my decision, not daring to decide alone on a choice so heavy with consequences.",
        polarityWeights: [
          w("child", "shadow", 1.00),
          w("caregiver", "shadow", 0.50),
          w("sovereign", "light", -0.50),
        ],
      },
      {
        position: 7,
        label_fr: "M'engager dans l'union en posant comme condition que le projet commun serve une cause spirituelle ou humaine supérieure, et non de simples intérêts financiers.",
        label_en: "Engage in the union setting as a condition that the common project serves a higher spiritual or human cause, and not simple financial interests.",
        polarityWeights: [
          w("mystic", "light", 1.00),
          w("caregiver", "light", 0.75),
          w("prostitute", "shadow", -0.50),
        ],
      },
      {
        position: 8,
        label_fr: "Analyser rationnellement le rapport risques/bénéfices à long terme sur la base de faits et de chiffres avant de donner un accord éclairé.",
        label_en: "Rationally analyze the long-term risk/benefit ratio on the basis of facts and numbers before giving an informed agreement.",
        polarityWeights: [
          w("sage", "light", 1.00),
          w("sovereign", "light", 0.75),
          w("victim", "shadow", -0.25),
        ],
      },
    ],
  },
  {
    position: 9,
    type: "multiple_choice",
    dimension: "relationship",
    prompt_fr: "Un conflit majeur éclate au sein de votre équipe ou de votre cercle intime. Deux parties s'affrontent avec virulence, menaçant de faire exploser la structure à quelques jours d'une échéance clé. Quelle est votre attitude ?",
    prompt_en: "A major conflict breaks out within your team or inner circle. Two parties clash with virulence, threatening to blow up the structure a few days before a key deadline. What is your attitude?",
    meta: { intensityEnabled: true, scoringModel: "myss-v3" },
    options: [
      {
        position: 1,
        label_fr: "Organiser une médiation immédiate, rappeler les règles du jeu collectives, imposer le respect mutuel et forcer les parties à trouver un compromis pragmatique.",
        label_en: "Organize immediate mediation, recall the collective rules of the game, impose mutual respect, and force the parties to find a pragmatic compromise.",
        polarityWeights: [
          w("sovereign", "light", 1.00),
          w("warrior", "light", 0.50),
          w("victim", "shadow", -0.50),
        ],
      },
      {
        position: 2,
        label_fr: "Prendre du recul pour analyser froidement les causes réelles de la dispute, séparer les faits des émotions, et proposer un rapport écrit d'arbitrage neutre.",
        label_en: "Take a step back to coldly analyze the real causes of the dispute, separate facts from emotions, and propose a neutral written arbitration report.",
        polarityWeights: [
          w("sage", "light", 1.00),
          w("explorer", "light", 0.50),
          w("victim", "shadow", -0.25),
        ],
      },
      {
        position: 3,
        label_fr: "Rencontrer chaque partie individuellement pour apaiser leur colère, offrir une écoute bienveillante à leur souffrance et soigner le lien humain blessé.",
        label_en: "Meet each party individually to defuse their anger, offer a caring listening to their suffering, and heal the wounded human bond.",
        polarityWeights: [
          w("healer", "light", 1.00),
          w("caregiver", "light", 0.75),
          w("child", "shadow", -0.25),
        ],
      },
      {
        position: 4,
        label_fr: "Utiliser l'humour, l'autodérision ou une provocation théâtrale pour faire éclater de rire les opposants et relativiser la futilité de leur querelle.",
        label_en: "Use humor, self-deprecation, or a theatrical provocation to make the opponents laugh out loud and put the futility of their quarrel into perspective.",
        polarityWeights: [
          w("jester", "light", 1.00),
          w("rebel", "light", 0.50),
          w("victim", "shadow", -0.25),
        ],
      },
      {
        position: 5,
        label_fr: "Subir la tension avec angoisse, me sentir pris en otage par leur violence, et me plaindre en secret du climat toxique qu'ils m'imposent.",
        label_en: "Suffer the tension with anxiety, feel taken hostage by their violence, and secretly complain about the toxic climate they impose on me.",
        polarityWeights: [
          w("victim", "shadow", 1.00),
          w("child", "shadow", 0.75),
          w("sovereign", "light", -0.50),
        ],
      },
      {
        position: 6,
        label_fr: "Prendre parti pour la cause qui me semble la plus juste et entrer dans l'arène pour combattre la partie que je juge abusive ou malhonnête.",
        label_en: "Take sides with the cause that seems most just to me and enter the arena to fight the party I judge abusive or dishonest.",
        polarityWeights: [
          w("rebel", "light", 1.00),
          w("warrior", "light", 0.75),
          w("prostitute", "shadow", -0.25),
        ],
      },
      {
        position: 7,
        label_fr: "Manœuvrer habilement en coulisses, distiller des suggestions subtiles à l'un et à l'autre pour les amener à se réconcilier sans qu'ils s'en rendent compte.",
        label_en: "Cleverly maneuver behind the scenes, distill subtle suggestions to both to bring them to reconcile without them realizing it.",
        polarityWeights: [
          w("magician", "light", 1.00),
          w("sage", "light", 0.50),
          w("saboteur", "shadow", -0.25),
        ],
      },
      {
        position: 8,
        label_fr: "Rester neutre et impassible, placer ma confiance dans le fait que cette crise est une étape d'évolution nécessaire pour le groupe, et observer sans intervenir.",
        label_en: "Remain neutral and impassive, placing my trust in the fact that this crisis is a necessary developmental stage for the group, and observe without intervening.",
        polarityWeights: [
          w("mystic", "light", 1.00),
          w("sage", "light", 0.50),
          w("child", "shadow", -0.50),
        ],
      },
    ],
  },
  {
    position: 10,
    type: "multiple_choice",
    dimension: "work",
    prompt_fr: "L'organisation dans laquelle vous travaillez met en place de nouvelles procédures de contrôle ultra-strictes, bureaucratiques et rigides, qui ralentissent vos projets et brident votre liberté d'action. Quelle est votre réaction ?",
    prompt_en: "The organization you work for implements new ultra-strict, bureaucratic, and rigid control procedures that slow down your projects and restrict your freedom of action. What is your reaction?",
    meta: { intensityEnabled: true, scoringModel: "myss-v3" },
    options: [
      {
        position: 1,
        label_fr: "Contourner intelligemment les règles ou pirater le système bureaucratique pour continuer à avancer rapidement sur mes projets en toute discrétion.",
        label_en: "Cleverly bypass the rules or hack the bureaucratic system to continue moving forward quickly on my projects in total discretion.",
        polarityWeights: [
          w("magician", "light", 1.00),
          w("rebel", "light", 0.75),
          w("prostitute", "shadow", -0.50),
        ],
      },
      {
        position: 2,
        label_fr: "Dénoncer ouvertement l'absurdité de ces procédures en réunion, refuser de m'y soumettre, et appeler mes collègues à faire de même.",
        label_en: "Openly denounce the absurdity of these procedures in meetings, refuse to submit to them, and call on my colleagues to do the same.",
        polarityWeights: [
          w("rebel", "light", 1.00),
          w("jester", "light", 0.50),
          w("saboteur", "shadow", -0.25),
        ],
      },
      {
        position: 3,
        label_fr: "Me plier scrupuleusement aux règles imposées, me disant que c'est le prix à payer pour garder ma sécurité et éviter tout conflit avec la direction.",
        label_en: "Scrupulously comply with the imposed rules, telling myself that it is the price to pay to keep my security and avoid any conflict with management.",
        polarityWeights: [
          w("prostitute", "shadow", 1.00),
          w("caregiver", "shadow", 0.50),
          w("sovereign", "light", -0.50),
        ],
      },
      {
        position: 4,
        label_fr: "Étudier en détail les nouvelles procédures pour y trouver des failles légales ou des exceptions administratives permettant de mener mes projets à bien légalement.",
        label_en: "Study the new procedures in detail to find legal loopholes or administrative exceptions allowing me to carry out my projects legally.",
        polarityWeights: [
          w("sage", "light", 1.00),
          w("sovereign", "light", 0.75),
          w("victim", "shadow", -0.25),
        ],
      },
      {
        position: 5,
        label_fr: "Me sentir bridé, frustré et impuissant, me plaindre quotidiennement à la machine à café de la lourdeur du système tout en exécutant les tâches.",
        label_en: "Feel restricted, frustrated, and helpless, complaining daily at the coffee machine about the heaviness of the system while executing the tasks.",
        polarityWeights: [
          w("victim", "shadow", 1.00),
          w("child", "shadow", 0.50),
          w("sovereign", "light", -0.50),
        ],
      },
      {
        position: 6,
        label_fr: "Prendre les devants auprès de la direction pour proposer une refonte structurelle de ces règles afin d'optimiser le contrôle sans bloquer l'agilité.",
        label_en: "Take the lead with management to propose a structural overhaul of these rules to optimize control without blocking agility.",
        polarityWeights: [
          w("sovereign", "light", 1.00),
          w("creator", "light", 0.75),
          w("victim", "shadow", -0.50),
        ],
      },
      {
        position: 7,
        label_fr: "Considérer que ce cadre rigide est le signe qu'il est temps pour moi de quitter cette structure pour retrouver ma liberté d'action en indépendant.",
        label_en: "Consider that this rigid framework is the sign that it is time for me to leave this structure to find my freedom of action as an independent.",
        polarityWeights: [
          w("explorer", "light", 1.00),
          w("rebel", "light", 0.75),
          w("child", "shadow", -0.50),
        ],
      },
      {
        position: 8,
        label_fr: "Aider mes collègues débordés par la paperasse, prendre sur moi une partie de leurs tâches administratives pour leur éviter de craquer.",
        label_en: "Help my colleagues overwhelmed by paperwork, taking on part of their administrative tasks to prevent them from cracking.",
        polarityWeights: [
          w("caregiver", "light", 1.00),
          w("healer", "light", 0.50),
          w("prostitute", "shadow", -0.25),
        ],
      },
    ],
  },
  {
    position: 11,
    type: "multiple_choice",
    dimension: "work",
    prompt_fr: "Vous touchez enfin au but d'un objectif professionnel majeur (signature d'un contrat historique, lancement d'une offre). Au dernier moment, un obstacle imprévu surgit, menaçant de tout annuler. Quelle est votre réaction ?",
    prompt_en: "You are finally reaching a major professional goal (signing a historic contract, launching an offer). At the last moment, an unforeseen obstacle arises, threatening to cancel everything. What is your reaction?",
    meta: { intensityEnabled: true, scoringModel: "myss-v3" },
    options: [
      {
        position: 1,
        label_fr: "Me dire inconsciemment que c'était trop beau pour être vrai, paniquer, et commettre une erreur évitable qui précipite l'échec du projet.",
        label_en: "Unconsciously tell myself it was too good to be true, panic, and make an avoidable mistake that precipitates the project's failure.",
        polarityWeights: [
          w("saboteur", "shadow", 1.00),
          w("child", "shadow", 0.50),
          w("creator", "light", -1.00),
        ],
      },
      {
        position: 2,
        label_fr: "Mobiliser immédiatement toutes mes ressources, faire preuve d'une discipline de fer et travailler jour et nuit pour surmonter l'obstacle.",
        label_en: "Immediately mobilize all my resources, show iron discipline, and work day and night to overcome the obstacle.",
        polarityWeights: [
          w("warrior", "light", 1.00),
          w("sovereign", "light", 0.75),
          w("saboteur", "shadow", -0.50),
        ],
      },
      {
        position: 3,
        label_fr: "Trancher dans le vif, prendre une décision stratégique audacieuse et assumer le risque financier pour forcer le passage vers la réussite.",
        label_en: "Cut through, make a bold strategic decision, and assume the financial risk to force the way to success.",
        polarityWeights: [
          w("sovereign", "light", 1.00),
          w("magician", "light", 0.75),
          w("victim", "shadow", -0.50),
        ],
      },
      {
        position: 4,
        label_fr: "Prendre du recul pour analyser la nature exacte de l'obstacle sans céder à la panique, et concevoir une solution technique de contournement élégante.",
        label_en: "Step back to analyze the exact nature of the obstacle without panicking, and design an elegant technical workaround.",
        polarityWeights: [
          w("creator", "light", 1.00),
          w("sage", "light", 0.75),
          w("saboteur", "shadow", -0.50),
        ],
      },
      {
        position: 5,
        label_fr: "Me plaindre bruyamment du manque de chance et de la cruauté du destin, en cherchant qui est responsable de cette erreur dans mon équipe.",
        label_en: "Complain loudly about bad luck and the cruelty of fate, looking for who is responsible for this error in my team.",
        polarityWeights: [
          w("victim", "shadow", 1.00),
          w("child", "shadow", 0.50),
          w("sovereign", "light", -0.50),
        ],
      },
      {
        position: 6,
        label_fr: "Utiliser mes relations et mon influence pour trouver un accord amiable ou obtenir un délai de grâce d'urgence auprès des décideurs.",
        label_en: "Use my relationships and influence to find an amicable agreement or obtain an emergency grace period from decision-makers.",
        polarityWeights: [
          w("magician", "light", 1.00),
          w("lover", "light", 0.50),
          w("saboteur", "shadow", -0.25),
        ],
      },
      {
        position: 7,
        label_fr: "Prendre soin de l'état de stress de mon équipe, leur dire que la santé humaine passe avant le contrat, et relativiser la situation.",
        label_en: "Take care of my team's stress state, tell them that human health comes before the contract, and put the situation into perspective.",
        polarityWeights: [
          w("caregiver", "light", 1.00),
          w("healer", "light", 0.75),
          w("saboteur", "shadow", -0.25),
        ],
      },
      {
        position: 8,
        label_fr: "Accepter la situation avec sérénité, me disant que si cet obstacle surgit maintenant, c'est que ce projet devait prendre une autre forme.",
        label_en: "Accept the situation with serenity, telling myself that if this obstacle arises now, it means this project had to take another form.",
        polarityWeights: [
          w("mystic", "light", 1.00),
          w("explorer", "light", 0.75),
          w("child", "shadow", -0.50),
        ],
      },
    ],
  },
  {
    position: 12,
    type: "multiple_choice",
    dimension: "work",
    prompt_fr: "On vous propose un poste prestigieux, très bien payé et doté d'un grand pouvoir d'influence, mais qui exige de gérer des tâches administratives lourdes et vous éloigne de la création pure ou du contact humain. Quelle est votre décision ?",
    prompt_en: "You are offered a prestigious, highly paid position with great influence, but which requires managing heavy administrative tasks and distances you from pure creation or human contact. What is your decision?",
    meta: { intensityEnabled: true, scoringModel: "myss-v3" },
    options: [
      {
        position: 1,
        label_fr: "Accepter sans hésiter, y voyant l'occasion d'asseoir ma légitimité, de diriger une structure d'envergure et d'avoir un impact global.",
        label_en: "Accept without hesitation, seeing the opportunity to establish my legitimacy, direct a major structure, and have a global impact.",
        polarityWeights: [
          w("sovereign", "light", 1.00),
          w("warrior", "light", 0.50),
          w("prostitute", "shadow", -0.25),
        ],
      },
      {
        position: 2,
        label_fr: "Refuser le poste, car ma liberté de créer, d'innover et de concevoir des choses de mes propres mains est plus précieuse que tout.",
        label_en: "Refuse the position, because my freedom to create, innovate, and design things with my own hands is more precious than anything.",
        polarityWeights: [
          w("creator", "light", 1.00),
          w("rebel", "light", 0.75),
          w("prostitute", "shadow", -0.50),
        ],
      },
      {
        position: 3,
        label_fr: "Refuser, car j'ai besoin d'un contact humain direct et quotidien (soigner, enseigner, aider) pour me sentir vivant et utile.",
        label_en: "Refuse, because I need direct and daily human contact (healing, teaching, helping) to feel alive and useful.",
        polarityWeights: [
          w("healer", "light", 1.00),
          w("caregiver", "light", 0.75),
          w("prostitute", "shadow", -0.50),
        ],
      },
      {
        position: 4,
        label_fr: "Accepter le poste uniquement pour la sécurité financière et le statut social, tout en sachant que je vais m'y ennuyer et y perdre mon âme.",
        label_en: "Accept the position solely for financial security and social status, while knowing that I will be bored and lose my soul.",
        polarityWeights: [
          w("prostitute", "shadow", 1.00),
          w("victim", "shadow", 0.75),
          w("sovereign", "light", -0.75),
        ],
      },
      {
        position: 5,
        label_fr: "Accepter, mais négocier immédiatement la possibilité de déléguer toute la gestion administrative pour me concentrer sur la vision stratégique.",
        label_en: "Accept, but immediately negotiate the possibility of delegating all administrative management to focus on the strategic vision.",
        polarityWeights: [
          w("magician", "light", 1.00),
          w("sovereign", "light", 0.75),
          w("prostitute", "shadow", -0.25),
        ],
      },
      {
        position: 6,
        label_fr: "Refuser et choisir de continuer à explorer d'autres manières de travailler plus libres (freelance, voyageur) sans attache hiérarchique.",
        label_en: "Refuse and choose to continue exploring other freer ways of working (freelance, traveler) without hierarchical attachment.",
        polarityWeights: [
          w("explorer", "light", 1.00),
          w("mystic", "light", 0.50),
          w("child", "shadow", -0.50),
        ],
      },
      {
        position: 7,
        label_fr: "Hésiter indéfiniment, demander conseil à tout le monde, terrifié à l'idée de faire le mauvais choix et de le regretter amèrement.",
        label_en: "Hesitate indefinitely, ask everyone for advice, terrified of making the wrong choice and bitterly regretting it.",
        polarityWeights: [
          w("saboteur", "shadow", 1.00),
          w("child", "shadow", 0.75),
          w("sovereign", "light", -0.50),
        ],
      },
      {
        position: 8,
        label_fr: "Analyser rationnellement la grille de salaire, les perspectives de carrière à 5 ans et l'impact sur mon CV avant de prendre une décision.",
        label_en: "Rationally analyze the salary grid, 5-year career prospects, and CV impact before making a decision.",
        polarityWeights: [
          w("sage", "light", 1.00),
          w("warrior", "light", 0.50),
          w("victim", "shadow", -0.25),
        ],
      },
    ],
  },
  {
    position: 13,
    type: "multiple_choice",
    dimension: "spirituality",
    prompt_fr: "Vous avez atteint tous vos objectifs matériels et professionnels (statut, confort, reconnaissance). Pourtant, un matin, vous ressentez un vide intérieur vertigineux et une perte de sens profonde. Que faites-vous ?",
    prompt_en: "You have achieved all your material and professional goals (status, comfort, recognition). Yet, one morning, you feel a dizzying inner void and a deep loss of meaning. What do you do?",
    meta: { intensityEnabled: true, scoringModel: "myss-v3" },
    options: [
      {
        position: 1,
        label_fr: "Entamer une quête spirituelle ou philosophique profonde, me tourner vers la méditation, la retraite ou l'étude des textes sacrés.",
        label_en: "Begin a deep spiritual or philosophical quest, turn to meditation, retreat, or study of sacred texts.",
        polarityWeights: [
          w("mystic", "light", 1.00),
          w("sage", "light", 0.75),
          w("child", "shadow", -0.50),
        ],
      },
      {
        position: 2,
        label_fr: "Considérer ce vide comme le signal qu'il est temps de tout quitter (job, ville) pour partir à l'aventure sans plan précis.",
        label_en: "Consider this void as the signal that it is time to leave everything (job, city) to go on an adventure without a precise plan.",
        polarityWeights: [
          w("explorer", "light", 1.00),
          w("rebel", "light", 0.75),
          w("prostitute", "shadow", -0.50),
        ],
      },
      {
        position: 3,
        label_fr: "Ignorer ce sentiment, me lancer frénétiquement dans de nouveaux objectifs professionnels pour prouver ma valeur et combler le vide.",
        label_en: "Ignore this feeling, frantically jump into new professional goals to prove my worth and fill the void.",
        polarityWeights: [
          w("saboteur", "shadow", 1.00),
          w("warrior", "light", 0.50),
          w("creator", "light", -0.50),
        ],
      },
      {
        position: 4,
        label_fr: "Réorienter mon pouvoir et mes ressources pour servir une cause humanitaire, aider les plus démunis et donner du sens par l'action désintéressée.",
        label_en: "Reorient my power and resources to serve a humanitarian cause, help the most deprived, and give meaning through selfless action.",
        polarityWeights: [
          w("caregiver", "light", 1.00),
          w("healer", "light", 0.75),
          w("prostitute", "shadow", -0.50),
        ],
      },
      {
        position: 5,
        label_fr: "Me plaindre de l'injustice de me sentir mal alors que j'ai tout pour être heureux, et attendre qu'une relation ou un événement vienne me sauver du spleen.",
        label_en: "Complain about the injustice of feeling bad when I have everything to be happy, and wait for a relation or event to save me from spleen.",
        polarityWeights: [
          w("victim", "shadow", 1.00),
          w("child", "shadow", 0.75),
          w("sovereign", "light", -0.50),
        ],
      },
      {
        position: 6,
        label_fr: "Utiliser cette crise comme un matériau brut pour créer une œuvre d'art, écrire un livre ou concevoir quelque chose de profondément intime.",
        label_en: "Use this crisis as raw material to create a work of art, write a book, or design something deeply intimate.",
        polarityWeights: [
          w("creator", "light", 1.00),
          w("lover", "light", 0.75),
          w("prostitute", "shadow", -0.25),
        ],
      },
      {
        position: 7,
        label_fr: "Prendre la situation avec dérision, me moquer de mes propres angoisses existentielles de privilégié et cultiver l'art du moment présent.",
        label_en: "Take the situation with derision, mock my own privileged existential anxieties, and cultivate the art of the present moment.",
        polarityWeights: [
          w("jester", "light", 1.00),
          w("magician", "light", 0.50),
          w("victim", "shadow", -0.25),
        ],
      },
      {
        position: 8,
        label_fr: "Consulter un thérapeute ou un mentor pour analyser rationnellement les étapes de cette transition de vie et comprendre mes nouveaux besoins.",
        label_en: "Consult a therapist or mentor to rationally analyze the steps of this life transition and understand my new needs.",
        polarityWeights: [
          w("sage", "light", 1.00),
          w("healer", "light", 0.75),
          w("child", "shadow", -0.25),
        ],
      },
    ],
  },
  {
    position: 14,
    type: "multiple_choice",
    dimension: "spirituality",
    prompt_fr: "Vous traversez une période d'incertitude financière majeure. Vos économies fondent, aucun contrat n'est en vue, et vous ressentez une peur panique du manque matériel. Quelle est votre posture intérieure ?",
    prompt_en: "You are going through a period of major financial uncertainty. Your savings are melting, no contract is in sight, and you feel a panic fear of material lack. What is your inner posture?",
    meta: { intensityEnabled: true, scoringModel: "myss-v3" },
    options: [
      {
        position: 1,
        label_fr: "Placer ma foi dans le fait que l'univers pourvoira à mes besoins réels, lâcher prise sur le contrôle et écouter mon intuition pour agir au bon moment.",
        label_en: "Place my faith in the fact that the universe will provide for my real needs, let go of control, and listen to my intuition to act at the right time.",
        polarityWeights: [
          w("mystic", "light", 1.00),
          w("sage", "light", 0.50),
          w("prostitute", "shadow", -1.00),
        ],
      },
      {
        position: 2,
        label_fr: "Accepter immédiatement n'importe quelle tâche dégradante ou contraire à mes valeurs pour sécuriser de l'argent, me disant que l'éthique est un luxe de riche.",
        label_en: "Immediately accept any degrading task or contrary to my values to secure money, telling myself that ethics is a rich man's luxury.",
        polarityWeights: [
          w("prostitute", "shadow", 1.00),
          w("victim", "shadow", 0.75),
          w("sovereign", "light", -0.75),
          w("warrior", "light", -0.50),
        ],
      },
      {
        position: 3,
        label_fr: "Me sentir victime de la dureté du système économique, me replier sur moi-même et attendre passivement qu'une aide financière ou un miracle se produise.",
        label_en: "Feel victimized by the harshness of the economic system, withdraw into myself, and passively wait for financial help or a miracle to happen.",
        polarityWeights: [
          w("victim", "shadow", 1.00),
          w("child", "shadow", 0.75),
          w("sovereign", "light", -0.50),
        ],
      },
      {
        position: 4,
        label_fr: "Établir un budget de crise strict, réduire mes dépenses à l'essentiel, et chercher activement des solutions concrètes avec discipline et combativité.",
        label_en: "Establish a strict crisis budget, reduce my expenses to the essential, and actively seek concrete solutions with discipline and fight.",
        polarityWeights: [
          w("warrior", "light", 1.00),
          w("sovereign", "light", 0.75),
          w("prostitute", "shadow", -0.50),
        ],
      },
      {
        position: 5,
        label_fr: "Utiliser cette crise pour concevoir un projet innovant à bas coût, transformer ma contrainte matérielle en une force créative stimulante.",
        label_en: "Use this crisis to design a low-cost innovative project, transforming my material constraint into a stimulating creative force.",
        polarityWeights: [
          w("creator", "light", 1.00),
          w("magician", "light", 0.75),
          w("saboteur", "shadow", -0.25),
        ],
      },
      {
        position: 6,
        label_fr: "Demander de l'aide financière ou un hébergement à mes proches en me plaçant dans une posture de dépendance complète, n'assumant plus ma survie.",
        label_en: "Ask for financial help or accommodation from my loved ones by placing myself in a posture of complete dependence, no longer assuming my survival.",
        polarityWeights: [
          w("child", "shadow", 1.00),
          w("victim", "shadow", 0.50),
          w("sovereign", "light", -0.50),
        ],
      },
      {
        position: 7,
        label_fr: "Faire confiance à mon réseau de relations et à mes compétences d'influence pour négocier des délais de paiement ou obtenir des prêts amicaux.",
        label_en: "Trust my network of relationships and my skills of influence to negotiate payment terms or obtain friendly loans.",
        polarityWeights: [
          w("magician", "light", 1.00),
          w("lover", "light", 0.50),
          w("prostitute", "shadow", -0.25),
        ],
      },
      {
        position: 8,
        label_fr: "Considérer cette crise comme une opportunité d'expérimenter la sobriété heureuse, me libérer de mes attachements matériels et voyager léger.",
        label_en: "Consider this crisis as an opportunity to experience happy sobriety, free myself from material attachments, and travel light.",
        polarityWeights: [
          w("explorer", "light", 1.00),
          w("jester", "light", 0.50),
          w("prostitute", "shadow", -0.50),
        ],
      },
    ],
  },
  {
    position: 15,
    type: "multiple_choice",
    dimension: "spirituality",
    prompt_fr: "Vous devez faire le deuil définitif d'un cycle de vie majeur (fin d'une longue relation, vente d'une entreprise que vous avez bâtie, ou deuil d'une capacité physique). Tout est à reconstruire. Quelle est votre posture ?",
    prompt_en: "You must definitively grieve a major life cycle (end of a long relationship, sale of a business you built, or loss of a physical capacity). Everything is to be rebuilt. What is your posture?",
    meta: { intensityEnabled: true, scoringModel: "myss-v3" },
    options: [
      {
        position: 1,
        label_fr: "Traverser consciemment la douleur du vide, laisser partir l'ancien sans chercher à le retenir, et attendre dans la foi le renouveau de mon âme.",
        label_en: "Consciously go through the pain of the void, let go of the old without trying to hold it back, and wait in faith for the renewal of my soul.",
        polarityWeights: [
          w("mystic", "light", 1.00),
          w("healer", "light", 0.75),
          w("child", "shadow", -0.50),
        ],
      },
      {
        position: 2,
        label_fr: "Prendre le contrôle du nouveau départ, fixer immédiatement de nouveaux objectifs clairs et structurer ma reconstruction avec autorité.",
        label_en: "Take control of the new start, immediately set clear new goals, and structure my reconstruction with authority.",
        polarityWeights: [
          w("sovereign", "light", 1.00),
          w("warrior", "light", 0.75),
          w("victim", "shadow", -0.75),
        ],
      },
      {
        position: 3,
        label_fr: "Considérer cet effondrement comme le signe libérateur qu'aucune attache n'est permanente, et partir sur les routes pour me réinventer ailleurs.",
        label_en: "Consider this collapse as the liberating sign that no attachment is permanent, and set off on the roads to reinvent myself elsewhere.",
        polarityWeights: [
          w("explorer", "light", 1.00),
          w("rebel", "light", 0.75),
          w("child", "shadow", -0.50),
        ],
      },
      {
        position: 4,
        label_fr: "Me bloquer dans la nostalgie, ressasser le passé en refusant d'avancer, convaincu que le meilleur de ma vie est définitivement derrière moi.",
        label_en: "Block myself in nostalgia, dwell on the past, refusing to move forward, convinced that the best of my life is definitively behind me.",
        polarityWeights: [
          w("saboteur", "shadow", 1.00),
          w("victim", "shadow", 0.75),
          w("creator", "light", -0.50),
        ],
      },
      {
        position: 5,
        label_fr: "Rejeter la faute de cet effondrement sur l'autre ou sur les circonstances extérieures, ruminant mon amertume et mon statut de victime.",
        label_en: "Blame the other or external circumstances for this collapse, chewing my bitterness and my status as a victim.",
        polarityWeights: [
          w("victim", "shadow", 1.00),
          w("child", "shadow", 0.50),
          w("sovereign", "light", -0.50),
        ],
      },
      {
        position: 6,
        label_fr: "Canaliser cette immense charge émotionnelle pour créer, écrire, peindre ou concevoir une œuvre qui donne une forme et un sens à ma transition.",
        label_en: "Channel this immense emotional load to create, write, paint, or design a work that gives a form and meaning to my transition.",
        polarityWeights: [
          w("creator", "light", 1.00),
          w("lover", "light", 0.75),
          w("saboteur", "shadow", -0.25),
        ],
      },
      {
        position: 7,
        label_fr: "Chercher immédiatement à combler le vide par de nouvelles relations de dépendance, ou en vendant mes compétences au plus offrant pour me sécuriser.",
        label_en: "Immediately seek to fill the void with new dependent relationships, or by selling my skills to the highest bidder to secure myself.",
        polarityWeights: [
          w("prostitute", "shadow", 1.00),
          w("child", "shadow", 0.75),
          w("mystic", "light", -0.75),
        ],
      },
      {
        position: 8,
        label_fr: "Utiliser l'écriture et l'analyse rationnelle pour faire un bilan neutre et objectif de ce cycle passé, afin d'en tirer des leçons de sagesse.",
        label_en: "Use writing and rational analysis to make a neutral and objective review of this past cycle, to draw lessons of wisdom.",
        polarityWeights: [
          w("sage", "light", 1.00),
          w("magician", "light", 0.50),
          w("victim", "shadow", -0.25),
        ],
      },
    ],
  },
];
