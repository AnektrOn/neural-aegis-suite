import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { Brain, LineChart, ListChecks, Users, Sparkles } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import ThemeToggle from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import PublicFooter from "@/components/public/PublicFooter";

export default function Landing() {
  const { locale, t } = useLanguage();
  const isFR = locale === "fr";

  const features = [
    {
      icon: Brain,
      title: isFR ? "Votre profil de décision" : "Your decision profile",
      body: isFR
        ? "Un parcours d’exploration pour nommer vos tendances, vos réflexes sous pression et les angles morts à garder en vue. Ce n’est pas une étiquette. C’est un premier langage pour vous observer."
        : "An exploration that names your tendencies, your reflexes under pressure and the blind spots worth keeping in view. It is not a label. It is a first language for observing yourself.",
    },
    {
      icon: ListChecks,
      title: isFR ? "Les arbitrages qui comptent" : "The trade-offs that matter",
      body: isFR
        ? "Vous notez la décision, le contexte, les options envisagées, le niveau de responsabilité, le temps de réflexion et ce qui a finalement orienté le choix."
        : "You note the decision, the context, the options you considered, the level of responsibility, the time you took to reflect and what ultimately shaped the choice.",
    },
    {
      icon: LineChart,
      title: isFR ? "L’état dans lequel vous décidez" : "The state you decide in",
      body: isFR
        ? "Énergie, sommeil, stress, humeur, habitudes. Quelques repères suffisent pour voir, plus tard, quels contextes soutiennent votre discernement et lesquels le fragilisent."
        : "Energy, sleep, stress, mood, habits. A few markers are enough to see, later, which contexts support your judgement and which wear it down.",
    },
    {
      icon: Users,
      title: isFR ? "Les relations autour de la décision" : "The relationships around the decision",
      body: isFR
        ? "Soutien, tension, confiance, énergie, attentes, non-dits. Une décision importante se prend rarement seul, et la qualité du lien fait partie du contexte."
        : "Support, tension, trust, energy, expectations, what goes unsaid. An important decision is rarely made alone, and the quality of the relationship is part of the context.",
    },
    {
      icon: Sparkles,
      title: isFR ? "Une relecture, pas une consigne" : "A review, not an instruction",
      body: isFR
        ? "Quand les entrées s’accumulent, AEGIS en tire des synthèses : répétitions, tensions possibles, questions utiles. Elles peuvent être incomplètes. Elles ne vous disent pas quoi faire."
        : "As entries build up, AEGIS draws syntheses from them: repetitions, possible tensions, useful questions. They can be incomplete. They do not tell you what to do.",
    },
  ];

  const steps = [
    {
      title: isFR ? "Vous ouvrez un compte et vous vous situez" : "You open an account and locate yourself",
      body: isFR
        ? "L’inscription est gratuite. Le profil de décision pose un premier repère : comment vous agissez, réagissez et portez une responsabilité. Rien n’est encore une conclusion."
        : "Signing up is free. The decision profile sets a first reference point: how you act, react and carry responsibility. Nothing here is a conclusion yet.",
    },
    {
      title: isFR ? "Vous notez ce qui s’est réellement passé" : "You note what actually happened",
      body: isFR
        ? "Au fil des jours, quelques minutes pour une décision, un état, une habitude ou un élément de contexte. Vous écrivez ce que vous voulez garder. Le reste peut rester dehors."
        : "Over the days, a few minutes for a decision, a state, a habit or a piece of context. You write what you want to keep. The rest can stay out.",
    },
    {
      title: isFR ? "Vous relisez les répétitions" : "You reread what repeats",
      body: isFR
        ? "Avec assez de traces, les synthèses montrent des tendances. Vous pouvez alors ajuster une priorité, une habitude ou la façon dont vous préparez un arbitrage. Le choix reste le vôtre."
        : "With enough of a record, the syntheses show trends. You can then adjust a priority, a habit or the way you prepare a trade-off. The choice stays yours.",
    },
  ];

  const faq = [
    {
      id: "after-start",
      q: isFR ? "Que se passe-t-il juste après l’inscription ?" : "What happens right after I sign up?",
      a: isFR
        ? "Vous créez un compte, vous explorez votre profil de décision, puis vous consignez, quand vous le décidez, vos arbitrages, votre état et vos habitudes. Les synthèses ne deviennent utiles qu’une fois ces traces accumulées. Il n’y a pas de rythme imposé."
        : "You create an account, explore your decision profile, then record — when you choose to — your trade-offs, your state and your habits. The syntheses become useful only once that record builds up. There is no required pace.",
    },
    {
      id: "not-therapy",
      q: isFR
        ? "Est-ce une thérapie, un test de personnalité ou un coach ?"
        : "Is this therapy, a personality test or a coach?",
      a: isFR
        ? "Non. AEGIS ne pose pas de diagnostic, ne propose pas de traitement et ne décide pas à votre place. Le profil décrit des tendances pour vous donner un langage. Il ne vous range pas dans une catégorie, et il ne remplace pas un accompagnement médical ou psychologique."
        : "No. AEGIS does not diagnose, offer treatment or decide for you. The profile describes tendencies so you have a language for them. It does not sort you into a category, and it does not replace medical or psychological care.",
    },
    {
      id: "ai-limits",
      q: isFR ? "Les analyses peuvent-elles se tromper ?" : "Can the analyses be wrong?",
      a: isFR
        ? "Oui. Elles s’appuient sur ce que vous avez écrit. Si le contexte manque, la synthèse peut être incomplète ou à côté. Lisez-les comme une relecture : des observations et des questions, pas un avis d’expert et pas une prédiction."
        : "Yes. They rest on what you wrote. If the context is missing, a synthesis can be incomplete or off. Read them as a review: observations and questions, not expert advice and not a prediction.",
    },
    {
      id: "privacy",
      q: isFR ? "Qui peut lire ce que j’écris ?" : "Who can read what I write?",
      a: isFR
        ? "Vos entrées sont rattachées à votre compte et ne sont pas vendues. Si le compte est lié à une organisation, un administrateur peut voir certains indicateurs d’usage ; le texte du journal et des décisions ne lui est ouvert qu’avec votre accord explicite. L’hébergement, le paiement et la production des analyses passent par des prestataires, décrits dans la politique de confidentialité. Vous pouvez exporter vos données depuis les réglages."
        : "Your entries are tied to your account and are not sold. If the account is linked to an organisation, an administrator can see certain usage indicators; the text of your journal and decisions is opened to them only with your explicit agreement. Hosting, payment and the production of analyses go through providers, described in the privacy notice. You can export your data from settings.",
    },
    {
      id: "money",
      q: isFR ? "Dois-je payer pour essayer ? Puis-je être remboursé ?" : "Do I have to pay to try it? Can I get a refund?",
      a: isFR
        ? "Le forfait Initiation est gratuit : il couvre la saisie et votre historique personnel. Les analyses approfondies font partie des forfaits payants. Vous pouvez demander un remboursement intégral dans les 30 jours suivant la commande, sans avoir à vous justifier. Au-delà, la politique de remboursement s’applique."
        : "The Initiation plan is free: it covers logging and your personal history. Deeper analyses belong to the paid plans. You can request a full refund within 30 days of the order, without having to give a reason. After that, the refund policy applies.",
    },
    {
      id: "clinical",
      q: isFR ? "AEGIS est-il validé cliniquement ?" : "Is AEGIS clinically validated?",
      a: isFR
        ? "Non. AEGIS n’est pas un dispositif de santé et ne revendique aucune validation clinique. Il ne mesure pas votre état de santé et ne promet pas de meilleur résultat."
        : "No. AEGIS is not a health device and claims no clinical validation. It does not measure your health and does not promise a better result.",
    },
  ];

  const description = isFR
    ? "AEGIS, par Protocole NOMOS, aide à relire ses décisions sous pression : un espace privé pour noter les arbitrages, l’état, les habitudes et les relations, sans diagnostic et sans décider à votre place."
    : "AEGIS, by Protocole NOMOS, helps you review decisions made under pressure: a private space to note trade-offs, state, habits and relationships, without diagnosis and without deciding for you.";

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>
          {isFR
            ? "AEGIS — Comprendre ce qui influence vos décisions | Protocole NOMOS"
            : "AEGIS — Understand what influences your decisions | Protocole NOMOS"}
        </title>
        <meta name="description" content={description} />
        <meta property="og:title" content="Aegis — Protocole Nomos" />
        <meta property="og:description" content={description} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <link rel="canonical" href="https://aegis.humancatalystbeacon.com/" />
      </Helmet>

      <header className="flex items-center justify-between px-6 py-5">
        <span className="font-display text-sm uppercase tracking-[0.24em] text-foreground">
          AEGIS
        </span>
        <div className="flex items-center gap-3">
          <Link
            to="/auth"
            className="text-[11px] uppercase tracking-[0.16em] text-text-tertiary transition-colors hover:text-foreground"
          >
            {t("auth.signIn")}
          </Link>
          <Link
            to="/pricing"
            className="text-[11px] uppercase tracking-[0.16em] text-text-tertiary transition-colors hover:text-foreground"
          >
            {isFR ? "Tarifs" : "Pricing"}
          </Link>
          <LanguageSwitcher />
          <ThemeToggle />
        </div>
      </header>

      <main>
        <section className="mx-auto max-w-3xl px-6 pb-16 pt-14 text-center">
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-[11px] uppercase tracking-[0.16em] text-text-tertiary"
          >
            {isFR ? "Quand tout repose sur vous" : "When it rests on you"}
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.05 }}
            className="mt-3 font-display text-4xl leading-tight tracking-wide text-foreground sm:text-5xl"
          >
            {isFR
              ? "Vous avez déjà tranché. Ce qui a pesé reste flou."
              : "You already made the call. What weighed on it is still unclear."}
          </motion.h1>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mx-auto mt-6 max-w-2xl space-y-4 text-left text-base leading-relaxed text-muted-foreground"
          >
            <p>
              {isFR
                ? "La journée est pleine. Une priorité en remplace une autre, quelqu’un attend une réponse, et vous décidez quand même. Sur le moment, cela tient."
                : "The day is already full. One priority replaces another, someone is waiting for an answer, and you decide anyway. In the moment, it holds."}
            </p>
            <p>
              {isFR
                ? "Ensuite, il reste peu de traces. La fatigue, l’urgence, une conversation tendue, l’habitude de tout garder, la peur de vous tromper ont pesé autant que les faits. Sans les noter, ces influences se mélangent. Les mêmes arbitrages reviennent, et le schéma n’apparaît qu’une fois le choix déjà fait."
                : "Afterwards, little of it is written down. Fatigue, urgency, a tense conversation, the habit of holding everything, the fear of getting it wrong weighed as much as the facts. Left unrecorded, these influences blur together. The same trade-offs return, and the pattern shows up only once the choice is already made."}
            </p>
          </motion.div>
        </section>

        <section className="mx-auto max-w-3xl px-6 pb-16 text-center">
          <h2 className="font-display text-2xl tracking-wide text-foreground sm:text-3xl">
            {isFR
              ? "Décidez avec plus de clarté. Comprenez ce qui vous influence."
              : "Decide with more clarity. Understand what influences you."}
          </h2>
          <div className="mx-auto mt-6 max-w-2xl space-y-4 text-left text-sm leading-relaxed text-muted-foreground">
            <p>
              {isFR
                ? "AEGIS vous aide à relier vos décisions, votre énergie, vos habitudes et vos relations, pour voir les schémas qui orientent votre manière d’agir — surtout lorsque la pression augmente."
                : "AEGIS helps you connect your decisions, your energy, your habits and your relationships, so you can see the patterns that shape how you act — especially when the pressure rises."}
            </p>
            <p>
              {isFR
                ? "Ce n’est pas un outil qui décide à votre place. C’est un espace privé pour prendre du recul, relier les faits à votre vécu, et rendre votre manière de décider plus lisible, plus cohérente, plus durable."
                : "It does not decide for you. It is a private space to step back, connect the facts with what you lived, and make the way you decide more readable, more coherent, more durable."}
            </p>
            <p>
              {isFR
                ? "Il s’adresse aux personnes qui portent des décisions aux conséquences réelles : fondateurs, dirigeants, managers, indépendants, et toute personne dont les choix engagent plus qu’elle-même."
                : "It is for people who carry decisions with real consequences: founders, executives, managers, independents, and anyone whose choices commit more than themselves."}
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-6 pb-16">
          <h2 className="text-center font-display text-2xl tracking-wide text-foreground">
            {isFR ? "Ce que vous faites une fois inscrit" : "What you do once you have signed up"}
          </h2>
          <ol className="mx-auto mt-8 max-w-3xl space-y-4 text-left text-sm leading-relaxed text-muted-foreground">
            {steps.map((step, i) => (
              <li key={step.title}>
                <strong className="block text-foreground">
                  {i + 1}. {step.title}
                </strong>
                {step.body}
              </li>
            ))}
          </ol>
          <p className="mx-auto mt-10 max-w-2xl text-center text-sm leading-relaxed text-muted-foreground">
            {isFR
              ? "Cinq matières, toujours les mêmes. Pas pour tout mesurer. Pour avoir de quoi relire."
              : "Five materials, always the same ones. Not in order to measure everything. So you have something to reread."}
          </p>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <article
                key={f.title}
                className="rounded-2xl border border-border-subtle/60 bg-card/40 p-6 backdrop-blur-xl"
              >
                <f.icon className="h-5 w-5 text-primary" strokeWidth={1.25} aria-hidden />
                <h3 className="mt-4 font-display text-base text-foreground">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-3xl px-6 pb-16 text-center">
          <h2 className="font-display text-2xl tracking-wide text-foreground">
            {isFR ? "Ce que vous pouvez vérifier avant de commencer" : "What you can check before you start"}
          </h2>
          <div className="mt-8 space-y-4 text-left text-sm leading-relaxed text-muted-foreground">
            <p>
              <strong className="text-foreground">
                {isFR ? "Vos écrits ne sont pas un produit. " : "What you write is not a product. "}
              </strong>
              {isFR
                ? "Ils restent rattachés à votre compte et ne sont pas vendus. Un administrateur d’organisation, lorsque le compte y est lié, ne lit le journal et les décisions qu’avec votre accord explicite. Vous pouvez exporter vos données depuis les réglages."
                : "It stays tied to your account and is not sold. An organisation administrator, when the account is linked to one, reads your journal and decisions only with your explicit agreement. You can export your data from settings."}
            </p>
            <p>
              <strong className="text-foreground">
                {isFR ? "Vous pouvez commencer sans payer. " : "You can start without paying. "}
              </strong>
              {isFR
                ? "Le forfait Initiation est gratuit. Les forfaits payants ajoutent les analyses. Vous pouvez en demander le remboursement intégral dans les 30 jours suivant la commande, sans justification."
                : "The Initiation plan is free. Paid plans add the analyses. You can request a full refund within 30 days of the order, without giving a reason."}
            </p>
            <p>
              <strong className="text-foreground">
                {isFR ? "Vous choisissez ce qui entre. " : "You choose what goes in. "}
              </strong>
              {isFR
                ? "Aucune saisie n’est obligatoire. AEGIS ne vous surveille pas et n’agit pas à votre place."
                : "No entry is mandatory. AEGIS does not watch you and does not act in your place."}
            </p>
            <p className="text-xs text-text-tertiary">
              <Link to="/legal/privacy" className="underline-offset-2 hover:underline">
                {isFR ? "Politique de confidentialité" : "Privacy notice"}
              </Link>
              {" · "}
              <Link to="/legal/refund" className="underline-offset-2 hover:underline">
                {isFR ? "Politique de remboursement" : "Refund policy"}
              </Link>
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-3xl px-6 pb-20 text-center">
          <h2 className="font-display text-2xl tracking-wide text-foreground">
            {isFR ? "Ce qu’AEGIS ne fait pas" : "What AEGIS does not do"}
          </h2>
          <div className="mx-auto mt-6 max-w-2xl space-y-4 text-left text-sm leading-relaxed text-muted-foreground">
            <p>
              {isFR
                ? "AEGIS n’est pas une thérapie, un diagnostic, un traitement, ni un outil de surveillance. Il n’est pas cliniquement validé. Il ne mesure pas votre santé et ne promet pas de meilleure performance."
                : "AEGIS is not therapy, a diagnosis, a treatment or a monitoring tool. It is not clinically validated. It does not measure your health and does not promise better performance."}
            </p>
            <p>
              {isFR
                ? "Les synthèses partent de vos entrées. Elles peuvent manquer l’essentiel, se tromper, ou insister sur un détail secondaire. Ce sont des pistes de relecture, pas des réponses, pas des prédictions, pas un avis professionnel."
                : "The syntheses start from your entries. They can miss what matters, get it wrong, or dwell on a secondary detail. They are lines of review, not answers, not predictions, not professional advice."}
            </p>
            <p>
              {isFR
                ? "Si une situation appelle un accompagnement médical ou psychologique, AEGIS ne le remplace pas. Le jugement, et la décision, restent les vôtres."
                : "If a situation calls for medical or psychological care, AEGIS does not replace it. The judgement, and the decision, stay yours."}
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-3xl px-6 pb-16 text-center">
          <p className="text-[11px] uppercase tracking-[0.16em] text-text-tertiary">
            {isFR
              ? "Commencez par rendre visible ce qui vous influence"
              : "Start by making visible what influences you"}
          </p>
          <h2 className="mt-3 font-display text-2xl tracking-wide text-foreground">
            {isFR
              ? "Vos décisions laissent des traces. AEGIS vous aide à les lire."
              : "Your decisions leave traces. AEGIS helps you read them."}
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            {isFR
              ? "Le compte est gratuit. Vous ouvrez un espace privé et vous notez, à votre rythme, un arbitrage, un état, une habitude. Rien d’autre n’est demandé pour commencer."
              : "The account is free. You open a private space and note, at your own pace, a trade-off, a state, a habit. Nothing else is required to begin."}
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Button asChild size="lg">
              <Link to="/auth">{isFR ? "Commencer gratuitement" : "Start for free"}</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/pricing">{isFR ? "Voir les forfaits" : "See plans"}</Link>
            </Button>
          </div>
        </section>

        <section className="mx-auto max-w-3xl px-6 pb-8">
          <h2 className="text-center font-display text-2xl tracking-wide text-foreground">
            {isFR ? "Questions avant de vous décider" : "Questions before you decide"}
          </h2>
          <Accordion type="single" collapsible className="mt-8">
            {faq.map((item) => (
              <AccordionItem key={item.id} value={item.id} className="border-border-subtle/60">
                <AccordionTrigger className="text-left text-sm font-normal text-foreground hover:no-underline">
                  {item.q}
                </AccordionTrigger>
                <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                  {item.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
          <p className="mt-12 text-center text-xs text-text-tertiary">
            {isFR
              ? "AEGIS est un protocole personnel de réflexion et de leadership créé par Protocole NOMOS."
              : "AEGIS is a personal reflection and leadership protocol created by Protocole NOMOS."}
          </p>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
