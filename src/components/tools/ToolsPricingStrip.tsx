import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { toolsBento, toolsKicker } from "./toolsDesign";

export function ToolsPricingStrip({ className = "" }: { className?: string }) {
  const { locale } = useLanguage();
  const isFR = locale === "fr";

  return (
    <aside
      className={`${toolsBento} flex flex-col gap-4 border-[color:var(--aegis-bronze)]/25 sm:flex-row sm:items-center sm:justify-between ${className}`}
      aria-label={isFR ? "Offres AEGIS" : "AEGIS plans"}
    >
      <div>
        <p className={toolsKicker}>{isFR ? "Plateforme AEGIS" : "AEGIS platform"}</p>
        <p className="mt-2 text-sm text-[color:var(--aegis-text)]">
          {isFR ? (
            <>
              Solo à partir de <strong className="font-semibold text-[color:var(--aegis-bronze-ink)]">35 € HT/mois</strong>
              {" · "}
              Fondateurs <strong className="font-semibold text-[color:var(--aegis-bronze-ink)]">350 €</strong> (20 places)
            </>
          ) : (
            <>
              Solo from <strong className="font-semibold text-[color:var(--aegis-bronze-ink)]">€35 excl. tax/mo</strong>
              {" · "}
              Founders <strong className="font-semibold text-[color:var(--aegis-bronze-ink)]">€350</strong> (20 seats)
            </>
          )}
        </p>
        <p className="mt-1 text-xs text-[color:var(--aegis-text-secondary)]">
          {isFR
            ? "People Board 3D, registre, mémoire décisionnelle — paiement possible avant création de compte."
            : "3D People Board, registry, decision memory — pay before account creation."}
        </p>
      </div>
      <Link
        to="/pricing"
        className="btn-solaire inline-flex min-h-[44px] shrink-0 items-center gap-2 px-5 text-sm"
      >
        {isFR ? "Voir les offres" : "View plans"}
        <ArrowRight className="h-4 w-4" aria-hidden />
      </Link>
    </aside>
  );
}