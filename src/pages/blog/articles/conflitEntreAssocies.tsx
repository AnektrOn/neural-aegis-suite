import { Link } from "react-router-dom";
import { toolsProse, toolsSectionHeading } from "@/components/tools/toolsDesign";
import type { BlogLocale } from "../types";

const callout =
  "not-prose my-8 rounded-xl border border-[color:var(--aegis-hairline)] bg-white/70 px-5 py-4 text-sm text-[color:var(--aegis-text-secondary)]";

function ConflitAssociesFr() {
  return (
    <div className={toolsProse}>
      <blockquote className="border-l-4 border-[color:var(--aegis-bronze)] pl-4 text-[color:var(--aegis-text)] not-italic">
        <p>
          <strong>En bref :</strong> la majorité des startups à fort potentiel ne meurt pas du marché ni du cash — elles
          meurent de l&apos;implosion de l&apos;équipe fondatrice, nourrie par des non-dits qui s&apos;accumulent jusqu&apos;au
          dimanche soir où l&apos;email incendiaire devient inévitable. Avant les avocats, il faut dépersonnaliser le conflit :
          cartographie relationnelle, faits bruts, arbitrage formel consigné.
        </p>
      </blockquote>

      <h2>Dimanche 23 h : l&apos;email que vous n&apos;avez pas encore envoyé</h2>
      <p>
        La maison est silencieuse. Votre conjoint est couché. Sur l&apos;écran du portable, le brouillon grossit depuis
        quarante minutes. Vous reformulez la dernière phrase pour la rendre &laquo;&nbsp;professionnelle&nbsp;&raquo; tout en
        sachant qu&apos;elle est une matraque. Votre associé &laquo;&nbsp;ne comprend toujours pas&nbsp;&raquo;. Vous portez
        la trésorerie, les recrutements, la relation investisseur ; lui croit porter la vision produit — ou l&apos;inverse.
        Peu importe le découpage : la sensation est la même — étouffement, solitude au sommet, et cette colère froide qui
        vous dit que si vous n&apos;envoyez pas ce message maintenant, vous allez exploser lundi en comité.
      </p>
      <p>
        Vous n&apos;êtes pas dramatique. Vous êtes en retard sur un mécanisme prévisible. Noam Wasserman, dans ses travaux
        sur les fondateurs à Harvard, a longtemps documenté ce que l&apos;écosystème préfère occulter : environ{" "}
        <strong>65&nbsp;% des startups à fort potentiel échouent à cause de fractures au sein de l&apos;équipe fondatrice</strong>
        , bien avant un manque criant de trésorerie ou un product-market fit insuffisant. Le conflit entre associés n&apos;est
        pas un accident sentimental. C&apos;est une défaillance de gouvernance qui aurait pu être arbitrée plus tôt — quand il
        restait encore de la valeur à préserver.
      </p>

      <div className={callout}>
        <p className="mb-0 font-mono text-[10px] uppercase tracking-[0.14em] text-[color:var(--aegis-bronze-ink)]">
          Synthèse
        </p>
        <p className="mb-0 mt-2">
          Le dimanche soir n&apos;est pas le moment où le conflit naît. C&apos;est le moment où le non-dit devient
          irréversible sans intervention structurée.
        </p>
      </div>

      <h2>L&apos;anatomie d&apos;une rupture : complaisance, politesse toxique, silence</h2>
      <h3>Pourquoi les associés ne se disent jamais la vérité à temps</h3>
      <p>
        Au début, tout est fluide. On partage la pizza, on divise les titres à parts égales, on évite les sujets qui
        piquent parce que l&apos;urgence produit prime. Cette politesse toxique n&apos;est pas de la camaraderie : c&apos;est un
        report systématique du désaccord structurel. Chaque report crée une dette invisible. Vous ne dites pas que son
        recrutement senior vous semble hors budget ; il ne dit pas que votre micro-management tue l&apos;équipe tech. Vous
        appelez ça &laquo;&nbsp;gérer&nbsp;&raquo;. En réalité, vous entraînez une explosion différée.
      </p>
      <p>
        La peur du conflit n&apos;est pas de la douceur. C&apos;est un pari que la tension va redescendre seule. Elle ne
        redescend jamais seule : elle mute en ressentiment, puis en sabotage passif, puis en ultimatum. Quand la vérité
        sort enfin, elle sort en mode procès — preuves, pièces jointes, témoins — parce qu&apos;il n&apos;existe plus de canal pour
        une contradiction productive.
      </p>

      <h3>Les fausses sorties — et pourquoi elles aggravent le cas</h3>
      <ul>
        <li>
          <strong>Le restaurant / le verre &laquo;&nbsp;pour en parler&nbsp;&raquo;.</strong> Trop d&apos;alcool, trop
          d&apos;émotion, trop d&apos;ego en jeu. On pleure, on s&apos;embrasse, on &laquo;&nbsp;remet les pendules à
          zéro&nbsp;&raquo;. Quarante-huit heures plus tard, le même sujet refleurit, plus sale, parce qu&apos;aucune décision
          n&apos;a été formalisée.
        </li>
        <li>
          <strong>Le coach exécutif classique.</strong> Utile pour la posture personnelle, rarement pour l&apos;arbitrage
          binaire entre deux mandats fondateurs. Trop prudent pour braquer l&apos;un des deux payeurs. Absent le dimanche à
          23&nbsp;h. On a décrit ce plafond dans notre analyse du{" "}
          <Link to="/blog/coach-ia-dirigeants-sparring-vocal">coach IA pour dirigeants</Link> : le format mensuel arrive
          après la tempête, quand le récit a déjà été réécrit.
        </li>
        <li>
          <strong>L&apos;avocat.</strong> Son mandat n&apos;est pas la paix. C&apos;est la défense de votre position juridique
          et, si besoin, la scission des parts. Vous engagez une guerre coûteuse qui acte la mort de la confiance. Les
          honoraires s&apos;envolent ; la valeur d&apos;entreprise fond pendant que vous polissez les clauses.
        </li>
      </ul>

      <div className={callout}>
        <p className="mb-0 font-mono text-[10px] uppercase tracking-[0.14em] text-[color:var(--aegis-bronze-ink)]">
          Synthèse
        </p>
        <p className="mb-0 mt-2">
          Les solutions informelles apaisent l&apos;ego. Elles ne tranchent pas le mandat. Sans tranche nette, le conflit
          entre associés recharge.
        </p>
      </div>

      <h2>Trois archétypes d&apos;ombre qui paralysent un comité de direction</h2>
      <p>
        Sous stress aigu, les fondateurs ne jouent pas leur &laquo;&nbsp;meilleur soi&nbsp;&raquo;. Ils rejouent des
        mécanismes de survie. Les cartographier ne vous absout pas : ça vous donne un langage pour sortir du procès
        d&apos;intention.
      </p>

      <h3>Le réflexe de la Victime</h3>
      <p>
        Vous sur-compensez en silence. Vous prenez les boards investors, les négociations clients difficiles, les licenciements
        que l&apos;autre refuse de regarder. Vous vous dites que c&apos;est temporaire. Vous accumulez la rancœur comme une
        comptabilité secrète. Le jour où vous craquez, vous ne négociez plus : vous coupez. Quitter à tout perdre paraît
        préférable à encore une conversation &laquo;&nbsp;calme&nbsp;&raquo; qui ne changera rien.
      </p>

      <h3>Le réflexe du Marchandage (l&apos;ombre &laquo;&nbsp;Prostituée&nbsp;&raquo;)</h3>
      <p>
        Vous négociez votre légitimité au lieu de la tenir. Vous acceptez des compromis de roadmap mous — un pivot mal
        digéré, un recrutement de convenance, un budget marketing sacrifié — pour acheter quarante-huit heures de paix
        artificielle. Chaque compromis affaiblit la trajectoire ; chaque trajectoire affaiblie nourrit un nouveau conflit,
        plus creux, parce que vous ne combattez plus pour la bonne stratégie mais pour qu&apos;on vous reconnaisse.
      </p>

      <h3>Le réflexe du Sabotage</h3>
      <p>
        Vous ne dites pas non. Vous bloquez. Le veto par l&apos;absence : livrables en retard, réunions repoussées, recrutements
        gelés, &laquo;&nbsp;on verra après la levée&nbsp;&raquo; répété jusqu&apos;à l&apos;asphyxie. Sous la surface, la peur de
        perdre le contrôle du projet. Le sabotage n&apos;est pas de la mauvaise foi grossière ; c&apos;est une défense contre
        l&apos;impression que l&apos;autre fondateur capte trop de mandat.
      </p>

      <div className={callout}>
        <p className="mb-0 font-mono text-[10px] uppercase tracking-[0.14em] text-[color:var(--aegis-bronze-ink)]">
          Synthèse
        </p>
        <p className="mb-0 mt-2">
          Victime, marchandage, sabotage : trois fuites face au même vide — aucune règle explicite sur qui décide quoi,
          avec quel seuil, et comment on enregistre le choix.
        </p>
      </div>

      <h2>Le miroir systémique : dépersonnaliser avant de personnaliser</h2>
      <p>
        Tant que le conflit entre associés reste un duel d&apos;egos, chaque phrase est une accusation déguisée. La sortie n&apos;est
        pas &laquo;&nbsp;mieux communiquer&nbsp;&raquo;. C&apos;est changer d&apos;optique : traiter le binôme comme un système
        de mandats, de charges et de points de rupture — un objet que l&apos;on peut poser sur la table.
      </p>

      <h3>Cartographie relationnelle : le People Board comme vérité froide</h3>
      <p>
        Sur un <strong>People Board</strong> — une carte relationnelle explicite, pas un organigramme décoratif — chaque
        associé, chaque investisseur clé, chaque directeur à haute influence porte un statut : allié, tension latente,
        quarantaine. Vous ne demandez plus &laquo;&nbsp;pourquoi tu es contre moi&nbsp;&raquo;. Vous demandez : &laquo;&nbsp;quel
        nœud bloque la décision P1 cette semaine ?&nbsp;&raquo; La cartographie externalise le conflit : il n&apos;habite plus
        uniquement dans votre poitrine à 23&nbsp;h.
      </p>

      <h3>Remplacer les procès d&apos;intention par des faits bruts</h3>
      <p>
        Trois questions suffisent souvent à couper le brouillard :
      </p>
      <ul>
        <li>Qui porte le mandat écrit pour ce type de décision — produit, cash, people, cap table ?</li>
        <li>Où est l&apos;asymétrie de charge mesurable (heures, stress, exposition client, risque légal) ?</li>
        <li>Quelle décision est reportée depuis combien de cycles, et combien coûte chaque semaine de report ?</li>
      </ul>
      <p>
        Le{" "}
        <Link to="/tools/cost-of-delayed-decision-calculator">
          calculateur du coût des décisions reportées
        </Link>{" "}
        n&apos;est pas un gadget : c&apos;est un antidote au récit &laquo;&nbsp;on verra plus tard&nbsp;&raquo; qui empoisonne les
        pactes d&apos;associés.
      </p>

      <h3>Arbitrage formel et règle des 85&nbsp;%</h3>
      <p>
        Tant qu&apos;une décision reste floue, les deux côtés y projettent leur ombre. L&apos;<strong>arbitrage formel</strong>{" "}
        impose une règle simple : à partir du moment où vous atteignez environ <strong>85&nbsp;% de clarté factuelle</strong> sur
        les options et leurs conséquences, vous tranchez. Vous ne attendez pas le consensus émotionnel — il n&apos;arrivera pas
        avant minuit dans un pacte déjà fissuré. Vous consignez le choix dans un registre daté : sujet, option retenue, owner,
        prochain point de contrôle. Ce registre n&apos;est pas un registre juridique. C&apos;est un anti-gaslighting entre associés :
        la mémoire du binôme ne peut plus être réécrite chaque lundi.
      </p>
      <p>
        C&apos;est là qu&apos;un miroir socratique sans complaisance — par exemple le sparring vocal{" "}
        <Link to="/welcome">LOGOS</Link> sur l&apos;exocortex AEGIS — fait sens : pas pour vous bercer, mais pour nommer
        l&apos;angle mort en quatre minutes et pousser l&apos;arbitrage dans le registre avant que le brouillon d&apos;email
        devienne irrevocable.
      </p>

      <div className={callout}>
        <p className="mb-0 font-mono text-[10px] uppercase tracking-[0.14em] text-[color:var(--aegis-bronze-ink)]">
          Synthèse
        </p>
        <p className="mb-0 mt-2">
          Dépersonnaliser ≠ refuser l&apos;humain. C&apos;est refuser que l&apos;humain soit le seul système de mémoire du
          comité.
        </p>
      </div>

      <h2>Ce n&apos;est pas une fatalité : c&apos;est un problème d&apos;optique</h2>
      <p>
        Un conflit entre associés dans une startup ou une scale-up n&apos;est pas une malédiction émotionnelle. C&apos;est un
        signal que les mandats se chevauchent, que les charges sont mal nommées, que l&apos;ambiguïté est devenue stratégie par
        défaut. Les avocats interviennent quand l&apos;ambiguïté a déjà brûlé des millions en valeur et en confiance. Avant
        eux, vous avez une fenêtre plus étroite et plus exigeante : regarder vos propres réflexes sous tension avant la
        prochaine confrontation.
      </p>
      <p>
        <strong>Votre prochain pas n&apos;est pas un email. C&apos;est un audit.</strong> L&apos;
        <Link to="/quiz">audit des 30 questions décisionnelles d&apos;AEGIS</Link> cartographie comment vous décidez en
        solitaire — quels archétypes d&apos;ombre vous active sous pression, où vous fuyez le tranchant, où vous sabotez ou vous
        sacrifiez. Dix minutes maintenant valent mieux qu&apos;un dimanche soir à rédiger ce que vous regretterez lundi matin.
      </p>
      <p>
        Ensuite, si le binôme tient encore, alignez la cartographie relationnelle et le registre d&apos;arbitrages. Si le
        binôme ne tient plus, vous entamerez au moins la conversation avec les avocats en sachant quel système vous avez
        laissé se dégrader — pas seulement qui vous en voulez.
      </p>

      <section className="not-prose mt-12 rounded-xl border border-[color:var(--aegis-hairline)] bg-white/70 p-6">
        <h2 className={toolsSectionHeading}>Questions fréquentes</h2>
        <dl className="mt-6 space-y-6">
          <div>
            <dt className="text-sm font-semibold text-[color:var(--aegis-text)]">
              Pourquoi 65&nbsp;% des startups échouent-elles à cause des fondateurs ?
            </dt>
            <dd className="mt-2 text-sm leading-relaxed text-[color:var(--aegis-text-secondary)]">
              Les études sur les fondateurs (notamment les travaux de Noam Wasserman) montrent que les fractures humaines au
              sommet précèdent souvent l&apos;échec économique : mandats flous, non-dits, sorties sans arbitrage formel.
            </dd>
          </div>
          <div>
            <dt className="text-sm font-semibold text-[color:var(--aegis-text)]">
              Un conflit entre associés peut-il se résoudre sans avocat ?
            </dt>
            <dd className="mt-2 text-sm leading-relaxed text-[color:var(--aegis-text-secondary)]">
              Parfois, si vous tranchez tôt avec faits, cartographie et registre daté. L&apos;avocat devient incontournable
              quand la confiance est rompue et que la valeur ne peut plus être préservée sans clause.
            </dd>
          </div>
          <div>
            <dt className="text-sm font-semibold text-[color:var(--aegis-text)]">
              Que faire le dimanche soir quand la colère monte ?
            </dt>
            <dd className="mt-2 text-sm leading-relaxed text-[color:var(--aegis-text-secondary)]">
              N&apos;envoyez pas le brouillon incendiaire. Nommez le mandat en jeu, listez trois faits vérifiables, fixez un
              arbitrage formel sous 48&nbsp;h avec écrit — pas une &laquo;&nbsp;discussion ouverte&nbsp;&raquo;.
            </dd>
          </div>
          <div>
            <dt className="text-sm font-semibold text-[color:var(--aegis-text)]">
              Qu&apos;est-ce que la règle des 85&nbsp;% en arbitrage ?
            </dt>
            <dd className="mt-2 text-sm leading-relaxed text-[color:var(--aegis-text-secondary)]">
              Dès que les options et conséquences sont claires à environ 85&nbsp;%, vous décidez et consignez. Attendre le
              confort émotionnel prolonge l&apos;ambiguïté qui nourrit le conflit.
            </dd>
          </div>
          <div>
            <dt className="text-sm font-semibold text-[color:var(--aegis-text)]">
              Comment l&apos;audit AEGIS aide-t-il avant une confrontation d&apos;associés ?
            </dt>
            <dd className="mt-2 text-sm leading-relaxed text-[color:var(--aegis-text-secondary)]">
              Les 30 questions cartographient vos réflexes décisionnels sous tension — victime, marchandage, sabotage — pour que
              vous n&apos;arriviez pas à la table en pur procès d&apos;intention.
            </dd>
          </div>
        </dl>
      </section>
    </div>
  );
}

function ConflitAssociesEn() {
  return (
    <div className={toolsProse}>
      <blockquote className="border-l-4 border-[color:var(--aegis-bronze)] pl-4 text-[color:var(--aegis-text)] not-italic">
        <p>
          <strong>In short:</strong> Most high-potential startups do not die from market or cash — they die from founder-team
          implosion fed by unspoken fractures that pile up until Sunday night and the inevitable angry draft. Before lawyers,
          depersonalize the conflict: relational map, raw facts, formal arbitration on record.
        </p>
      </blockquote>

      <h2>Sunday 11 p.m.: the email you have not sent yet</h2>
      <p>
        The house is quiet. Your partner is asleep. On your phone, the draft has been swelling for forty minutes. You keep
        rephrasing the last line to make it &quot;professional&quot; while knowing it is a club. Your co-founder
        &quot;still does not get it.&quot; You carry treasury, hiring, investor relations; they believe they carry product
        vision — or the reverse. The split does not matter. The feeling is the same: suffocation, loneliness at the top, and a
        cold anger telling you that if you do not hit send now, you will detonate in Monday&apos;s leadership meeting.
      </p>
      <p>
        You are not being dramatic. You are late on a predictable mechanism. Noam Wasserman&apos;s Harvard work on founders
        documents what the ecosystem likes to hide: roughly{" "}
        <strong>65% of high-potential startups fail because of fractures within the founding team</strong>, often before acute
        cash stress or weak product-market fit. Co-founder conflict is not a sentimental accident. It is a governance failure
        that could have been arbitrated earlier — while value was still worth preserving.
      </p>

      <div className={callout}>
        <p className="mb-0 font-mono text-[10px] uppercase tracking-[0.14em] text-[color:var(--aegis-bronze-ink)]">
          Takeaway
        </p>
        <p className="mb-0 mt-2">
          Sunday night is not when the conflict is born. It is when the unspoken becomes irreversible without structured
          intervention.
        </p>
      </div>

      <h2>Anatomy of a breakup: compliance, toxic politeness, silence</h2>
      <h3>Why co-founders never tell the truth in time</h3>
      <p>
        Early on, everything feels fluid. Shared pizza, equal splits, awkward topics avoided because shipping comes first.
        That toxic politeness is not camaraderie — it is systematic deferral of structural disagreement. Every deferral creates
        invisible debt. You do not say their senior hire looks off-budget; they do not say your micromanagement is killing the
        tech team. You call it &quot;managing.&quot; In reality, you are training a delayed explosion.
      </p>
      <p>
        Fear of conflict is not kindness. It is a bet that tension will dissipate on its own. It never does on its own: it
        becomes resentment, then passive sabotage, then ultimatum. When truth finally surfaces, it surfaces as trial —
        exhibits, attachments, witnesses — because there is no channel left for productive contradiction.
      </p>

      <h3>False exits — and why they make things worse</h3>
      <ul>
        <li>
          <strong>Dinner or drinks &quot;to talk it through.&quot;</strong> Too much alcohol, too much emotion, too much ego.
          Tears, hugs, &quot;reset the clock.&quot; Forty-eight hours later the same issue returns, dirtier, because no decision
          was formalized.
        </li>
        <li>
          <strong>Classic executive coaching.</strong> Useful for personal stance, rarely for binary arbitration between two
          founder mandates. Too cautious to offend either payer. Absent Sunday at 11 p.m. We covered this ceiling in our piece
          on{" "}
          <Link to="/blog/coach-ia-dirigeants-sparring-vocal">AI coaches for executives</Link>: monthly formats arrive after
          the storm, when the narrative has already been rewritten.
        </li>
        <li>
          <strong>Lawyers.</strong> Their job is not peace. It is defending your legal position and, if needed, splitting
          equity. You launch an expensive war that certifies the death of trust. Fees rise; enterprise value melts while you
          polish clauses.
        </li>
      </ul>

      <div className={callout}>
        <p className="mb-0 font-mono text-[10px] uppercase tracking-[0.14em] text-[color:var(--aegis-bronze-ink)]">
          Takeaway
        </p>
        <p className="mb-0 mt-2">
          Informal fixes soothe ego. They do not cut mandate. Without a clean cut, co-founder conflict recharges.
        </p>
      </div>

      <h2>Three shadow archetypes that paralyze a leadership team</h2>
      <p>
        Under acute stress, founders do not play their &quot;best self.&quot; They replay survival patterns. Mapping them does
        not absolve you — it gives you language to exit character assassination.
      </p>

      <h3>The Victim reflex</h3>
      <p>
        You over-compensate in silence. You take the investor boards, the ugly customer negotiations, the layoffs the other
        refuses to face. You tell yourself it is temporary. You stockpile resentment like secret bookkeeping. The day you
        snap, you no longer negotiate — you cut. Walking away and losing everything feels better than one more
        &quot;calm&quot; conversation that changes nothing.
      </p>

      <h3>The Bargaining reflex (the &quot;Prostitute&quot; shadow)</h3>
      <p>
        You negotiate your legitimacy instead of holding it. You accept soft roadmap compromises — a badly digested pivot, a
        convenient hire, a sacrificed marketing budget — to buy forty-eight hours of artificial peace. Each compromise weakens
        trajectory; each weakened trajectory breeds a hollower fight, because you are no longer arguing for the right strategy
        but for recognition.
      </p>

      <h3>The Sabotage reflex</h3>
      <p>
        You do not say no. You block. Veto by absence: late deliverables, postponed meetings, frozen hiring, &quot;after the
        raise&quot; repeated until asphyxiation. Under the surface, fear of losing control of the project. Sabotage is not
        blunt bad faith — it is defense against the sense that the other founder is capturing too much mandate.
      </p>

      <div className={callout}>
        <p className="mb-0 font-mono text-[10px] uppercase tracking-[0.14em] text-[color:var(--aegis-bronze-ink)]">
          Takeaway
        </p>
        <p className="mb-0 mt-2">
          Victim, bargaining, sabotage: three escapes from the same void — no explicit rule on who decides what, with what
          threshold, and how the choice is recorded.
        </p>
      </div>

      <h2>The systemic mirror: depersonalize before you personalize</h2>
      <p>
        As long as co-founder conflict stays an ego duel, every sentence is a disguised accusation. The exit is not
        &quot;communicate better.&quot; It is an optics shift: treat the pair as a system of mandates, loads, and fracture
        points — an object you can put on the table.
      </p>

      <h3>Relational mapping: the People Board as cold truth</h3>
      <p>
        On a <strong>People Board</strong> — an explicit relational map, not a decorative org chart — each co-founder, key
        investor, and high-influence exec carries a status: ally, latent tension, quarantine. You stop asking &quot;why are you
        against me.&quot; You ask: &quot;which node is blocking the P1 decision this week?&quot; Mapping externalizes
        conflict: it no longer lives only in your chest at 11 p.m.
      </p>

      <h3>Replace motive trials with raw facts</h3>
      <p>Three questions often cut the fog:</p>
      <ul>
        <li>Who holds the written mandate for this decision type — product, cash, people, cap table?</li>
        <li>Where is measurable load asymmetry (hours, stress, client exposure, legal risk)?</li>
        <li>Which decision has been deferred for how many cycles, and what does each week of delay cost?</li>
      </ul>
      <p>
        The{" "}
        <Link to="/tools/cost-of-delayed-decision-calculator">cost of delayed decisions calculator</Link> is not a toy — it is
        an antidote to the &quot;we&apos;ll see later&quot; story that poisons founder agreements.
      </p>

      <h3>Formal arbitration and the 85% rule</h3>
      <p>
        While a decision stays fuzzy, both sides project shadow onto it. <strong>Formal arbitration</strong> imposes a simple
        rule: once you reach roughly <strong>85% factual clarity</strong> on options and consequences, you decide. You do not
        wait for emotional consensus — it will not arrive before midnight in a pact already cracked. You log the choice in a
        dated registry: topic, option chosen, owner, next checkpoint. This is not a legal register. It is anti-gaslighting
        between co-founders: the pair&apos;s memory can no longer be rewritten every Monday.
      </p>
      <p>
        That is where a non-flattering Socratic mirror — vocal sparring via{" "}
        <Link to="/welcome">LOGOS</Link> on the AEGIS exocortex — earns its place: not to soothe you, but to name the blind
        spot in four minutes and push arbitration into the registry before the email draft becomes irrevocable.
      </p>

      <div className={callout}>
        <p className="mb-0 font-mono text-[10px] uppercase tracking-[0.14em] text-[color:var(--aegis-bronze-ink)]">
          Takeaway
        </p>
        <p className="mb-0 mt-2">
          Depersonalize ≠ deny the human. It means refusing the human as the committee&apos;s only memory system.
        </p>
      </div>

      <h2>Not fate: an optics problem</h2>
      <p>
        Co-founder conflict in a startup or scale-up is not an emotional curse. It signals overlapping mandates, unnamed
        loads, ambiguity as default strategy. Lawyers step in when ambiguity has already burned millions in value and trust.
        Before that, you have a narrower, harder window: map your own reflexes under tension before the next confrontation.
      </p>
      <p>
        <strong>Your next move is not an email. It is an audit.</strong> The{" "}
        <Link to="/quiz">AEGIS 30-question decision audit</Link> maps how you decide alone — which shadow archetypes you
        activate under pressure, where you dodge the cut, where you sabotage or sacrifice. Ten minutes now beat a Sunday night
        writing what you will regret Monday morning.
      </p>
      <p>
        Then, if the pair still holds, align relational mapping and the arbitration registry. If it no longer holds, you at
        least enter the lawyer conversation knowing which system you let degrade — not only who you resent.
      </p>

      <section className="not-prose mt-12 rounded-xl border border-[color:var(--aegis-hairline)] bg-white/70 p-6">
        <h2 className={toolsSectionHeading}>Frequently asked questions</h2>
        <dl className="mt-6 space-y-6">
          <div>
            <dt className="text-sm font-semibold text-[color:var(--aegis-text)]">
              Why do 65% of startups fail because of founders?
            </dt>
            <dd className="mt-2 text-sm leading-relaxed text-[color:var(--aegis-text-secondary)]">
              Founder research (notably Noam Wasserman&apos;s) shows human fractures at the top often precede economic failure:
              fuzzy mandates, unspoken issues, exits without formal arbitration.
            </dd>
          </div>
          <div>
            <dt className="text-sm font-semibold text-[color:var(--aegis-text)]">
              Can co-founder conflict be resolved without lawyers?
            </dt>
            <dd className="mt-2 text-sm leading-relaxed text-[color:var(--aegis-text-secondary)]">
              Sometimes, if you decide early with facts, mapping, and a dated registry. Lawyers become unavoidable when trust
              is broken and value cannot be preserved without clauses.
            </dd>
          </div>
          <div>
            <dt className="text-sm font-semibold text-[color:var(--aegis-text)]">
              What should you do Sunday night when anger spikes?
            </dt>
            <dd className="mt-2 text-sm leading-relaxed text-[color:var(--aegis-text-secondary)]">
              Do not send the angry draft. Name the mandate at stake, list three verifiable facts, schedule formal arbitration
              within 48 hours with writing — not an &quot;open conversation.&quot;
            </dd>
          </div>
          <div>
            <dt className="text-sm font-semibold text-[color:var(--aegis-text)]">
              What is the 85% rule in arbitration?
            </dt>
            <dd className="mt-2 text-sm leading-relaxed text-[color:var(--aegis-text-secondary)]">
              Once options and consequences are ~85% clear, decide and log. Waiting for emotional comfort prolongs the
              ambiguity that feeds conflict.
            </dd>
          </div>
          <div>
            <dt className="text-sm font-semibold text-[color:var(--aegis-text)]">
              How does the AEGIS audit help before a co-founder confrontation?
            </dt>
            <dd className="mt-2 text-sm leading-relaxed text-[color:var(--aegis-text-secondary)]">
              The 30 questions map your decision reflexes under tension — victim, bargaining, sabotage — so you do not arrive
              at the table in pure motive trial mode.
            </dd>
          </div>
        </dl>
      </section>
    </div>
  );
}

export function renderConflitEntreAssociesBody(locale: BlogLocale) {
  return locale === "en" ? <ConflitAssociesEn /> : <ConflitAssociesFr />;
}