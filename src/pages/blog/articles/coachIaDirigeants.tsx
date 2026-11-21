import { Link } from "react-router-dom";
import { toolsProse, toolsSectionHeading } from "@/components/tools/toolsDesign";
import type { BlogLocale } from "../types";

const tableWrap =
  "not-prose my-8 overflow-x-auto rounded-xl border border-[color:var(--aegis-hairline)]";

function CoachIaDirigeantsFr() {
  return (
    <div className={toolsProse}>
      <blockquote className="border-l-4 border-[color:var(--aegis-bronze)] pl-4 text-[color:var(--aegis-text)] not-italic">
        <p>
          <strong>TL;DR :</strong> un coach IA pour dirigeants utile n&apos;est ni un consultant à 500&nbsp;€/h
          disponible trop tard, ni un chatbot textuel qui flatte et fuit vos données. C&apos;est un{" "}
          <strong>sparring partner vocal souverain</strong> : confrontation socratique en temps réel, cadence
          naturelle de la parole, arbitrages consignés — avec confidentialité totale sur infrastructure dédiée.
        </p>
      </blockquote>

      <h2>Qu&apos;est-ce qu&apos;un coach IA pour dirigeants ?</h2>
      <p>
        Un <strong>coach IA pour dirigeants</strong> est un système d&apos;accompagnement à la décision conçu pour
        les fondateurs et membres de ComEx, disponible au rythme des crises — pas au rythme d&apos;un agenda mensuel.
        Contrairement aux applications de bien-être généralistes, il vise l&apos;<strong>arbitrage opérationnel</strong>{" "}
        : isoler les angles morts, confronter les rationalisations et formaliser les choix sous contrainte.
      </p>

      <h2>19h00 : le bureau se vide, les angles morts restent</h2>
      <p>
        Les écrans de l&apos;open space s&apos;éteignent un à un. Les notifications Slack ralentissent. La porte
        vitrée se referme enfin. Pour un fondateur ou un dirigeant, c&apos;est à cet instant précis que commence la
        partie la plus coûteuse de la journée : celle qui ne figure dans aucun compte de résultat.
      </p>
      <p>
        Sur le bureau restent les sujets qu&apos;on ne partage avec personne. Un conflit larvé avec un associé
        historique que chacun feint d&apos;ignorer pour préserver la paix de façade. Une trésorerie tendue à six mois
        que l&apos;on repeint en vert à coups de prévisions commerciales optimistes. Un recrutement stratégique sur
        lequel vous hésitez depuis trois semaines, tout en sachant confusément que retarder le choix revient déjà à
        mal décider.
      </p>
      <p>
        À qui soumettre ces nœuds ? Pas au board, devant lequel vous défendez votre mandat et votre sang-froid. Pas au
        ComEx, qui attend de vous un cap lisible plutôt que des états d&apos;âme. Pas à votre entourage proche, auquel
        il est injuste d&apos;imposer la guerre froide d&apos;un pacte d&apos;associés.
      </p>
      <p>
        L&apos;erreur classique consiste à croire que le dirigeant manque d&apos;intelligence, de méthode ou de
        lucidité. C&apos;est faux. La plupart des fondateurs savent lire un bilan et diagnostiquer une dérive
        organisationnelle. Ce qui leur manque n&apos;est pas un cours supplémentaire de management : c&apos;est un
        miroir instantané, neutre et incorruptible, capable d&apos;intercepter leurs propres rationalisations à la
        seconde où ils commencent à se mentir avec élégance.
      </p>

      <h2>Pourquoi le coaching exécutif et les chatbots IA échouent souvent</h2>
      <p>
        La montée rapide de l&apos;AI Executive Coaching ne doit rien au hasard : elle répond à cette solitude
        structurelle. Mais le marché actuel enferme les dirigeants dans un faux dilemme entre deux offres
        économiquement ou cognitivement défaillantes.
      </p>

      <h3>Faillite n°1 : l&apos;illusion du coaching exécutif traditionnel</h3>
      <p>
        Le coaching de direction repose sur un modèle artisanal dont les coûts sont devenus disproportionnés au regard
        de son utilité opérationnelle. Les honoraires oscillent entre 350&nbsp;€ et 1&nbsp;500&nbsp;€ de l&apos;heure,
        soit 18&nbsp;000&nbsp;€ à 50&nbsp;000&nbsp;€ par an pour un accompagnement ComEx sérieux — chiffres que vous
        pouvez modéliser avec le{" "}
        <Link to="/tools/executive-coaching-cost-calculator">calculateur du coût d&apos;un coaching dirigeant</Link>.
        Un tel budget pourrait se justifier s&apos;il sécurisait les arbitrages critiques. Or le format lui-même s&apos;y
        oppose pour deux raisons structurelles.
      </p>
      <p>
        La première est l&apos;asynchronie. Un calendrier de séances mensuelles ou bimensuelles ne correspond pas au
        tempo réel d&apos;une entreprise. Une crise de gouvernance n&apos;attend pas le troisième jeudi du mois à
        14h00. Le dimanche soir à 23h00, quand un client clé menace de rompre ou qu&apos;un directeur annonce son
        départ, le coach est injoignable. Lorsque la séance arrive dix jours plus tard, l&apos;arbitrage a déjà été pris
        dans le brouillard ; le dirigeant ne raconte plus les faits à chaud, il livre un récit déjà reconstruit pour
        sauver la face.
      </p>
      <p>
        La seconde faille est plus taboue : le biais de complaisance thérapeutique. Un coach qui facture 30&nbsp;000&nbsp;€
        par an à un dirigeant a un intérêt économique direct à préserver son contrat récurrent. Consciemment ou non,
        l&apos;incitation pousse à ménager l&apos;ego du payeur, à valider ses récits et à rendre la séance confortable.
        Or le confort est l&apos;ennemi de la gouvernance.
      </p>

      <h3>Faillite n°2 : la flagornerie des « coachs IA » génériques</h3>
      <p>
        Face aux limites du coaching humain, une vague d&apos;applications de « bien-être » et de chatbots promet un AI
        Executive Coach disponible 24h/24. Sur le papier, l&apos;équation séduit. À l&apos;usage, c&apos;est un échec.
      </p>
      <p>
        La quasi-totalité de ces outils sont des wrappers textuels calibrés pour la politesse grand public. À peine
        exposez-vous un dilemme d&apos;associé ou une impasse de trésorerie que l&apos;algorithme déploie son répertoire
        mielleux : «&nbsp;C&apos;est une excellente question&nbsp;», «&nbsp;Prenez une grande respiration&nbsp;»,
        «&nbsp;Il est tout à fait normal de ressentir cette pression&nbsp;». Cette flagornerie algorithmique noie le
        problème sous des formulations doucereuses et débite des listes de conseils génériques, strictement incapables
        de trancher un arbitrage opérationnel.
      </p>
      <p>
        S&apos;ajoute un angle mort juridique et stratégique majeur : la fuite de données. Confier ses tensions de
        capital, un projet de restructuration ou une faiblesse financière à un chatbot grand public connecté à des
        modèles ouverts expose le cœur confidentiel de l&apos;entreprise à une rétention tierce incontrôlée. Avant de
        confier quoi que ce soit à un outil cloud, le{" "}
        <Link to="/tools/cloud-ai-privacy-risk-checker">
          diagnostic de risque vie privée des IA cloud
        </Link>{" "}
        cartographie ce que vous exposez réellement.
      </p>

      <h2>Comparer coaching humain, chatbot IA et sparring vocal souverain</h2>
      <div className={tableWrap}>
        <table className="w-full min-w-[640px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-[color:var(--aegis-hairline)] bg-white/80">
              <th className="px-4 py-3 font-medium text-[color:var(--aegis-text)]">Critère</th>
              <th className="px-4 py-3 font-medium text-[color:var(--aegis-text)]">Coaching exécutif classique</th>
              <th className="px-4 py-3 font-medium text-[color:var(--aegis-text)]">Chatbot «&nbsp;coach IA&nbsp;»</th>
              <th className="px-4 py-3 font-medium text-[color:var(--aegis-text)]">Sparring vocal LOGOS + AEGIS</th>
            </tr>
          </thead>
          <tbody className="text-[color:var(--aegis-text-secondary)]">
            <tr className="border-b border-[color:var(--aegis-hairline)]/60">
              <td className="px-4 py-3">Coût indicatif</td>
              <td className="px-4 py-3">350–1&nbsp;500&nbsp;€/h · 18–50&nbsp;k€/an</td>
              <td className="px-4 py-3">Abonnement grand public</td>
              <td className="px-4 py-3">
                Dès 35&nbsp;€/mois ·{" "}
                <Link to="/pricing" className="text-[color:var(--aegis-bronze-ink)]">
                  voir les offres
                </Link>
              </td>
            </tr>
            <tr className="border-b border-[color:var(--aegis-hairline)]/60">
              <td className="px-4 py-3">Disponibilité en crise</td>
              <td className="px-4 py-3">Agenda mensuel · injoignable le dimanche 23h</td>
              <td className="px-4 py-3">24/7 mais sans trancher</td>
              <td className="px-4 py-3">24/7 · confrontation en quelques minutes</td>
            </tr>
            <tr className="border-b border-[color:var(--aegis-hairline)]/60">
              <td className="px-4 py-3">Mode d&apos;expression</td>
              <td className="px-4 py-3">Séance structurée différée</td>
              <td className="px-4 py-3">Texte · autocensure au clavier</td>
              <td className="px-4 py-3">Voix · débit et hésitations captés</td>
            </tr>
            <tr className="border-b border-[color:var(--aegis-hairline)]/60">
              <td className="px-4 py-3">Posture</td>
              <td className="px-4 py-3">Complaisance économique possible</td>
              <td className="px-4 py-3">Flagornerie algorithmique</td>
              <td className="px-4 py-3">Miroir socratique sans contrat à ménager</td>
            </tr>
            <tr>
              <td className="px-4 py-3">Données stratégiques</td>
              <td className="px-4 py-3">Cadre contractuel humain</td>
              <td className="px-4 py-3">Rétention LLM public fréquente</td>
              <td className="px-4 py-3">Vault dédié · zéro entraînement tiers</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>
        <strong>Verdict du terrain :</strong> le premier arrive trop tard et ménage son client ; le second répond trop
        vite pour ne rien trancher. La troisième voie vise la clarté d&apos;arbitrage au moment où l&apos;enjeu fait
        trembler la main.
      </p>

      <h2>La rupture cognitive : la voix contre l&apos;écran</h2>
      <p>
        Même si l&apos;on corrigeait la tonalité des chatbots actuels, ils se heurteraient à un mur ergonomique et
        neurologique : un dirigeant ne tiendra jamais un journal intime sur un clavier.
      </p>
      <p>
        À 19h00, après dix heures d&apos;e-mails, de tableurs, de présentations et de visioconférences, le cerveau
        rejette toute interface qui exige de rédiger. Demander à un fondateur épuisé d&apos;écrire quatre paragraphes
        structurés dans une fenêtre de chat pour expliquer une tension humaine garantit l&apos;abandon en moins d&apos;une
        semaine.
      </p>
      <p>
        Mais le problème est plus profond que la fatigue visuelle. Écrire censure. Dès que les doigts touchent le
        clavier, le réflexe éditorial prend le dessus : on reformule, on lisse les aspérités, on construit un
        argumentaire présentable. Le texte est l&apos;outil idéal pour convaincre les autres, et le pire outil pour
        s&apos;exposer à soi-même.
      </p>
      <p>
        La parole brute, en mouvement, produit le mécanisme inverse. Sortir du bureau, marcher et décharger verbalement
        de vive voix libère le réel avant que l&apos;autocensure ne le polisse. Dans la voix, tout transpire :
        l&apos;accélération du débit lorsqu&apos;on effleure une erreur de recrutement, la micro-hésitation avant de
        prononcer le prénom d&apos;un associé, la baisse d&apos;énergie sur un projet qu&apos;on maintient par orgueil.
      </p>
      <p>
        Un champ texte ignore ces signaux. Seul un agent vocal à latence sub-seconde peut absorber cette décharge brute
        dans la cadence naturelle de la pensée — sans blanc artificiel qui casse le fil — et renvoyer sur-le-champ la
        contradiction que l&apos;intonation vient de trahir. Pour en juger par les oreilles, la page{" "}
        <Link to="/welcome">LOGOS — démo vocale</Link> montre la différence avec un chat textuel passif.
      </p>

      <h2>Le sparring partner souverain : le modèle LOGOS + AEGIS</h2>
      <p>
        L&apos;avenir du coach IA pour dirigeants n&apos;appartient ni aux thérapeutes virtuels ni aux générateurs de
        checklists. Il appartient à une discipline plus sèche et plus exigeante : le sparring partner vocal
        d&apos;arbitrage souverain, incarné par l&apos;architecture LOGOS + AEGIS.
      </p>

      <h3>Le Miroir d&apos;Ombre : quatre minutes pour dissoudre un alibi</h3>
      <p>
        LOGOS n&apos;est pas conçu pour vous rassurer. Il opère comme un Miroir d&apos;Ombre — un miroir socratique sans
        complaisance, propulsé par une voix sub-seconde chirurgicale. Pas de préambules obséquieux, pas
        d&apos;empathie simulée. Sa fonction est d&apos;isoler l&apos;angle mort en quatre minutes chrono, avec la
        précision d&apos;un associé incorruptible&nbsp;:
      </p>
      <p className="font-mono text-sm text-[color:var(--aegis-text)]">
        «&nbsp;Sur quel sujet te caches-tu derrière des calculs de trésorerie pour fuir une confrontation
        humaine&nbsp;?&nbsp;»
      </p>
      <p>
        Une seule question de cette trempe vaut davantage que six mois de conversations courtoises. Elle force le
        dirigeant à distinguer le problème technique (souvent soluble) du problème de courage ou de posture (presque
        toujours éludé).
      </p>

      <h3>L&apos;effet cockpit : la voix qui ordonne l&apos;écran en direct</h3>
      <p>
        Une décharge verbale sans structure s&apos;évapore dès le lendemain matin. L&apos;architecture LOGOS résout cette
        déperdition par l&apos;effet cockpit : pendant que vous parlez, la voix organise et met à jour votre interface
        décisionnelle en temps réel.
      </p>
      <p>
        Une tension relationnelle qui pollue un choix stratégique est immédiatement placée en mise en quarantaine
        relationnelle afin d&apos;éviter la contamination émotionnelle des chiffres. Un choix tranché est consigné sous
        forme d&apos;arbitrage formel, daté et opposable à vos propres tergiversations futures. Vous parlez en marchant ;
        votre gouvernance se structure sans que vous ayez tapé une ligne.
      </p>

      <h3>La ligne rouge éthique : souveraineté absolue des données</h3>
      <p>
        Un outil auquel un dirigeant confie ses doutes les plus sensibles ne tolère aucun compromis sur la
        confidentialité. C&apos;est la raison d&apos;être de la couche AEGIS : sanctuarisation intégrale des échanges sur
        serveur dédié, Vault chiffré et zéro rétention sur les LLM publics. Vos arbitrages ne servent à entraîner
        aucun modèle tiers, ne transitent par aucune base mutualisée et restent votre propriété exclusive.
      </p>

      <h2>La clarté n&apos;est pas une émotion, c&apos;est une discipline d&apos;arbitrage</h2>
      <p>
        Diriger n&apos;exige pas d&apos;être apaisé en permanence ; cela exige de voir juste au moment où l&apos;enjeu
        fait trembler la main. Ni un consultant facturé 500&nbsp;€ de l&apos;heure trois semaines après la tempête, ni
        un chatbot programmé pour applaudir vos phrases ne construiront cette hygiène à votre place.
      </p>
      <p>
        La clarté n&apos;est pas une émotion, c&apos;est une discipline d&apos;arbitrage. Elle commence par une mesure
        froide de la manière dont vous décidez sous contrainte — et de ce que vous coûtent réellement les décisions
        différées. Le{" "}
        <Link to="/tools/ceo-decision-fatigue-index">bilan de fatigue décisionnelle du CEO</Link> et le{" "}
        <Link to="/tools/cost-of-delayed-decision-calculator">
          calculateur du coût des décisions reportées
        </Link>{" "}
        posent ce premier repère sans discours commercial. Pour une cartographie plus large de votre profil de
        gouvernance, le{" "}
        <Link to="/quiz">questionnaire gratuit en 30 questions</Link> complète la lecture.
      </p>
      <p>
        D&apos;autres diagnostics du{" "}
        <Link to="/tools">Vault d&apos;outils dirigeant</Link> restent ouverts en accès libre — même logique :
        mesurer avant d&apos;acheter un accompagnement.
      </p>

      <section className="not-prose mt-12 rounded-xl border border-[color:var(--aegis-hairline)] bg-white/70 p-6">
        <h2 className={toolsSectionHeading}>Questions fréquentes</h2>
        <dl className="mt-6 space-y-6">
          <div>
            <dt className="text-sm font-semibold text-[color:var(--aegis-text)]">
              Combien coûte un coach IA pour dirigeants par rapport à un coach exécutif humain ?
            </dt>
            <dd className="mt-2 text-sm leading-relaxed text-[color:var(--aegis-text-secondary)]">
              Un coaching ComEx sérieux dépasse souvent 18&nbsp;000&nbsp;€/an ; un sparring vocal souverain LOGOS +
              AEGIS démarre vers 35&nbsp;€/mois ou 350&nbsp;€ à vie, avec disponibilité immédiate hors agenda mensuel.
            </dd>
          </div>
          <div>
            <dt className="text-sm font-semibold text-[color:var(--aegis-text)]">
              Un chatbot textuel peut-il remplacer un coach IA vocal pour un CEO ?
            </dt>
            <dd className="mt-2 text-sm leading-relaxed text-[color:var(--aegis-text-secondary)]">
              Non pour l&apos;arbitrage à chaud : le texte invite à l&apos;autocensure, ignore le ton et noie les dilemmes
              sous des conseils génériques. La voix capte ce que le clavier efface.
            </dd>
          </div>
          <div>
            <dt className="text-sm font-semibold text-[color:var(--aegis-text)]">
              Est-il sûr de confier des sujets de trésorerie à une IA executive coach ?
            </dt>
            <dd className="mt-2 text-sm leading-relaxed text-[color:var(--aegis-text-secondary)]">
              Seulement si les échanges ne nourrissent aucun modèle public et restent sur infrastructure dédiée. Les
              chatbots grand public exposent un risque de rétention incontrôlée.
            </dd>
          </div>
          <div>
            <dt className="text-sm font-semibold text-[color:var(--aegis-text)]">
              Pourquoi les coachs humains arrivent-ils trop tard sur les crises de gouvernance ?
            </dt>
            <dd className="mt-2 text-sm leading-relaxed text-[color:var(--aegis-text-secondary)]">
              Le format mensuel décale l&apos;échange de dix à vingt jours après les faits. Le dirigeant raconte alors un
              récit déjà poli, pas l&apos;arbitrage à refaire.
            </dd>
          </div>
          <div>
            <dt className="text-sm font-semibold text-[color:var(--aegis-text)]">
              Qu&apos;est-ce qu&apos;un miroir d&apos;ombre en coaching IA ?
            </dt>
            <dd className="mt-2 text-sm leading-relaxed text-[color:var(--aegis-text-secondary)]">
              Un mode socratique sans complaisance : une ou deux questions tranchantes qui séparent le problème technique
              du problème de posture — en quelques minutes, pas en six mois de small talk.
            </dd>
          </div>
        </dl>
      </section>

      <h2>Conclusion</h2>
      <p>
        Votre prochain sparring partner ne devrait être ni un humain facturé 500&nbsp;€/h trois semaines après la
        tempête, ni un chatbot qui vous félicite de respirer. Si vous voulez tester la posture inverse — confrontation,
        voix, souveraineté — commencez par la démo sur <Link to="/welcome">LOGOS</Link>, puis par les outils gratuits du
        Vault listés ci-dessus.
      </p>
    </div>
  );
}

function CoachIaDirigeantsEn() {
  return (
    <div className={toolsProse}>
      <blockquote className="border-l-4 border-[color:var(--aegis-bronze)] pl-4 text-[color:var(--aegis-text)] not-italic">
        <p>
          <strong>TL;DR:</strong> A useful AI coach for executives is neither a €500/h consultant who shows up too late,
          nor a flattering text chatbot that leaks your data. It is a <strong>sovereign voice sparring partner</strong>:
          real-time Socratic challenge, natural speech cadence, formalized decisions — on dedicated, confidential
          infrastructure.
        </p>
      </blockquote>

      <h2>What is an AI coach for executives?</h2>
      <p>
        An <strong>AI coach for executives</strong> is a decision-support system built for founders and C-suite leaders,
        paced to crises — not monthly calendars. Unlike generic wellness apps, it targets{" "}
        <strong>operational arbitration</strong>: surfacing blind spots, confronting rationalizations, and locking choices
        under pressure.
      </p>

      <h2>7 p.m.: the office empties, blind spots stay</h2>
      <p>
        Screens go dark; Slack slows; the glass door closes. For a founder or CEO, the most expensive part of the day
        begins — the part that never appears on a P&amp;L. What remains are topics shared with no one: a latent co-founder
        conflict, cash runway painted green with optimistic forecasts, a strategic hire postponed until indecision becomes
        a bad decision.
      </p>
      <p>
        Not the board (you defend your mandate there). Not the exec team (they need a clear heading, not soul-searching).
        Not your inner circle (unfair to dump partnership cold war on them). What is missing is not another management
        course — it is an instant, neutral mirror that catches elegant self-deception the second it starts.
      </p>

      <h2>Why traditional coaching and generic AI coaches fail</h2>
      <h3>Failure #1: traditional executive coaching</h3>
      <p>
        Hourly rates from €350 to €1,500 mean €18k–€50k per year for serious ComEx support — model it with the{" "}
        <Link to="/tools/executive-coaching-cost-calculator">executive coaching cost calculator</Link>. Monthly cadence
        misses governance crises; by the time the session happens, the call was already made in the fog. Economic
        incentives also favor comfort over confrontation.
      </p>
      <h3>Failure #2: generic “AI executive coach” chatbots</h3>
      <p>
        Polite text wrappers praise your questions and suggest breathing exercises — useless for real arbitration.
        Pushing capital tensions or restructuring plans into public LLM stacks creates retention risk; use the{" "}
        <Link to="/tools/cloud-ai-privacy-risk-checker">cloud AI privacy risk checker</Link> before you trust any vendor.
      </p>

      <h2>Comparing human coaching, AI chatbots, and sovereign voice sparring</h2>
      <ComparisonTableEn />

      <h2>Voice vs screen: the cognitive break</h2>
      <p>
        After ten hours of email and slides, exhausted leaders will not keep a chat diary. Writing edits away truth;
        speech while walking releases it — pace, hesitation, energy drops matter. Sub-second voice agents can return the
        contradiction your tone just betrayed. Hear the difference on <Link to="/welcome">LOGOS — voice demo</Link>.
      </p>

      <h2>The sovereign sparring partner: LOGOS + AEGIS</h2>
      <p>
        LOGOS acts as a Shadow Mirror — no simulated empathy, four-minute Socratic cuts. The cockpit effect structures
        quarantines and dated arbitrations while you talk. AEGIS keeps exchanges on dedicated vaults with zero public LLM
        retention.
      </p>

      <h2>Clarity is arbitration discipline, not an emotion</h2>
      <p>
        Start with measurement: the <Link to="/tools/ceo-decision-fatigue-index">CEO decision fatigue index</Link>, the{" "}
        <Link to="/tools/cost-of-delayed-decision-calculator">cost of delayed decisions calculator</Link>, and the{" "}
        <Link to="/quiz">free 30-question governance quiz</Link>. More free tools live in the{" "}
        <Link to="/tools">executive tools vault</Link>.
      </p>

      <section className="not-prose mt-12 rounded-xl border border-[color:var(--aegis-hairline)] bg-white/70 p-6">
        <h2 className={toolsSectionHeading}>Frequently asked questions</h2>
        <dl className="mt-6 space-y-6">
          <div>
            <dt className="text-sm font-semibold text-[color:var(--aegis-text)]">
              How much does an AI executive coach cost vs a human coach?
            </dt>
            <dd className="mt-2 text-sm leading-relaxed text-[color:var(--aegis-text-secondary)]">
              Serious human ComEx coaching often exceeds €18k/year; sovereign LOGOS + AEGIS access starts around €35/month
              or €350 lifetime, with instant availability.
            </dd>
          </div>
          <div>
            <dt className="text-sm font-semibold text-[color:var(--aegis-text)]">
              Can a text chatbot replace a voice AI coach for a CEO?
            </dt>
            <dd className="mt-2 text-sm leading-relaxed text-[color:var(--aegis-text-secondary)]">
              Not for hot arbitration: text invites self-censorship and generic advice. Voice captures what keyboards
              erase.
            </dd>
          </div>
          <div>
            <dt className="text-sm font-semibold text-[color:var(--aegis-text)]">
              Is it safe to share treasury issues with an AI executive coach?
            </dt>
            <dd className="mt-2 text-sm leading-relaxed text-[color:var(--aegis-text-secondary)]">
              Only if nothing trains public models and data stays on dedicated infrastructure. Consumer chatbots carry
              uncontrolled retention risk.
            </dd>
          </div>
          <div>
            <dt className="text-sm font-semibold text-[color:var(--aegis-text)]">
              Why do human coaches arrive too late on governance crises?
            </dt>
            <dd className="mt-2 text-sm leading-relaxed text-[color:var(--aegis-text-secondary)]">
              Monthly formats delay the conversation 10–20 days after facts. Leaders then narrate polished stories, not the
              decision to remake.
            </dd>
          </div>
          <div>
            <dt className="text-sm font-semibold text-[color:var(--aegis-text)]">
              What is a shadow mirror in AI coaching?
            </dt>
            <dd className="mt-2 text-sm leading-relaxed text-[color:var(--aegis-text-secondary)]">
              A non-flattering Socratic mode: one or two sharp questions separating technical problems from courage and
              posture — in minutes, not months of small talk.
            </dd>
          </div>
        </dl>
      </section>

      <h2>Conclusion</h2>
      <p>
        Your next sparring partner should not be a €500/h human three weeks after the storm, or a bot applauding your
        breathing. Try the opposite on <Link to="/welcome">LOGOS</Link>, then the free vault tools above. See{" "}
        <Link to="/pricing">pricing</Link> when you are ready to go further.
      </p>
    </div>
  );
}

function ComparisonTableEn() {
  const tableWrapLocal =
    "not-prose my-8 overflow-x-auto rounded-xl border border-[color:var(--aegis-hairline)]";
  return (
    <div className={tableWrapLocal}>
      <table className="w-full min-w-[640px] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-[color:var(--aegis-hairline)] bg-white/80">
            <th className="px-4 py-3 font-medium">Criterion</th>
            <th className="px-4 py-3 font-medium">Traditional coaching</th>
            <th className="px-4 py-3 font-medium">Generic AI chatbot</th>
            <th className="px-4 py-3 font-medium">LOGOS + AEGIS voice</th>
          </tr>
        </thead>
        <tbody className="text-[color:var(--aegis-text-secondary)]">
          <tr className="border-b border-[color:var(--aegis-hairline)]/60">
            <td className="px-4 py-3">Indicative cost</td>
            <td className="px-4 py-3">€350–1,500/h · €18–50k/year</td>
            <td className="px-4 py-3">Consumer subscription</td>
            <td className="px-4 py-3">From €35/mo</td>
          </tr>
          <tr className="border-b border-[color:var(--aegis-hairline)]/60">
            <td className="px-4 py-3">Crisis availability</td>
            <td className="px-4 py-3">Monthly · offline Sunday 11 p.m.</td>
            <td className="px-4 py-3">24/7 but non-committal</td>
            <td className="px-4 py-3">24/7 · minutes to confront</td>
          </tr>
          <tr className="border-b border-[color:var(--aegis-hairline)]/60">
            <td className="px-4 py-3">Modality</td>
            <td className="px-4 py-3">Deferred structured session</td>
            <td className="px-4 py-3">Text · keyboard censorship</td>
            <td className="px-4 py-3">Voice · pace and tone</td>
          </tr>
          <tr>
            <td className="px-4 py-3">Strategic data</td>
            <td className="px-4 py-3">Human contract</td>
            <td className="px-4 py-3">Public LLM retention</td>
            <td className="px-4 py-3">Dedicated vault</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export function renderCoachIaDirigeantsBody(locale: BlogLocale) {
  return locale === "en" ? <CoachIaDirigeantsEn /> : <CoachIaDirigeantsFr />;
}