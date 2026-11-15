import { Link } from "react-router-dom";
import { ArrowRight, Shield, Sparkles } from "lucide-react";
import type { ReactNode } from "react";
import type { ConversionProblemKind } from "./types";
import { toolsBento, toolsBentoElevated, toolsKicker, toolsTitle } from "./toolsDesign";

const HOOKS: Record<ConversionProblemKind, string> = {
  cost: "Vous venez de chiffrer un poste qui disparaît entre deux rendez-vous. AEGIS conserve le fil de vos arbitrages — sans facturer l'heure.",
  network: "Votre cercle de pairs coûte cher en temps calendaire. Un exocortex vous donne de la continuité entre les réunions, 24 h/24.",
  waste: "Votre second brain stocke plus qu'il ne décide. AEGIS transforme les traces en synthèses actionnables pour les dirigeants.",
  security: "Votre score d'exposition montre que le cloud grand public n'est pas un coffre-fort. AEGIS privilégie gouvernance et souveraineté des données.",
  dispersion: "Votre stack est fragmentée. AEGIS unifie contexte, décisions et outils sous un même tableau de bord exécutif.",
};

interface AegisConversionCardProps {
  problemKind: ConversionProblemKind;
  className?: string;
}

export function AegisConversionCard({ problemKind, className = "" }: AegisConversionCardProps) {
  return (
    <section
      className={`${toolsBento} relative overflow-hidden border-[color:var(--aegis-cardline-hover)] ${className}`}
      aria-labelledby="aegis-conversion-title"
    >
      <div
        className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full opacity-40"
        style={{ background: "rgba(201, 162, 75, 0.12)" }}
        aria-hidden
      />

      <p className={toolsKicker}>Exocortex décisionnel</p>
      <h2 id="aegis-conversion-title" className={`${toolsTitle} mt-2 text-[clamp(1.5rem,3vw,2rem)]`}>
        Passez de la friction à l&apos;Exocortex Décisionnel
      </h2>
      <p className="mt-4 max-w-2xl font-body text-[color:var(--aegis-ink-muted)]">{HOOKS[problemKind]}</p>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <OfferCard
          title="AEGIS Solo"
          price="35 € / mois"
          icon={<Sparkles className="h-5 w-5 text-[color:var(--aegis-gold)]" aria-hidden />}
          features={[
            "Rapport initial archétypal complet dès l'onboarding",
            "Dashboard, People Board 3D",
            "10 toolbox items & 50 interactions / semaine",
          ]}
        />
        <OfferCard
          title='Accès perpétuel "Membres Fondateurs"'
          price="350 €"
          priceNote="paiement unique — équivalent 10 mois"
          badge="20 premiers dirigeants"
          icon={<Shield className="h-5 w-5 text-[color:var(--aegis-copper)]" aria-hidden />}
          features={[
            "Même socle AEGIS Solo, sans abonnement récurrent",
            "Priorité cohorte fondateurs",
            "Garantie sérénité 30 jours",
          ]}
        />
      </div>

      <div className="mt-8 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
        <Link to="/onboarding" className="btn-solaire min-h-[44px] px-6">
          Démarrer l&apos;onboarding AEGIS
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
        <p className="font-body text-sm text-[color:var(--aegis-ink-subtle)]">
          Garantie Sérénité 30 jours : satisfait ou remboursé intégralement
        </p>
      </div>
    </section>
  );
}

function OfferCard({
  title,
  price,
  priceNote,
  badge,
  icon,
  features,
}: {
  title: string;
  price: string;
  priceNote?: string;
  badge?: string;
  icon: ReactNode;
  features: string[];
}) {
  return (
    <div className={toolsBentoElevated}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          {icon}
          <h3 className="font-barlow text-sm font-semibold text-[color:var(--aegis-ink)]">{title}</h3>
        </div>
        {badge ? (
          <span className="font-cinzel text-[9px] font-semibold uppercase tracking-[0.14em] text-[color:var(--aegis-gold)]">
            {badge}
          </span>
        ) : null}
      </div>
      <p className="mt-3 font-display text-xl text-[color:var(--aegis-gold)]">{price}</p>
      {priceNote ? (
        <p className="font-body text-xs text-[color:var(--aegis-ink-subtle)]">{priceNote}</p>
      ) : null}
      <ul className="mt-4 space-y-2 font-body text-sm text-[color:var(--aegis-ink-muted)]">
        {features.map((f) => (
          <li key={f} className="flex gap-2">
            <span className="text-[color:var(--aegis-gold)]" aria-hidden>
              ✓
            </span>
            <span>{f}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}