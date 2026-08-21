import { Link } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";

export default function PublicFooter() {
  const { locale } = useLanguage();
  const isFR = locale === "fr";

  const links = [
    { to: "/pricing", label: isFR ? "Tarifs" : "Pricing" },
    { to: "/legal/terms", label: isFR ? "Conditions générales" : "Terms & Conditions" },
    { to: "/legal/refund", label: isFR ? "Politique de remboursement" : "Refund Policy" },
    { to: "/legal/privacy", label: isFR ? "Confidentialité" : "Privacy Notice" },
    { to: "/auth", label: isFR ? "Connexion" : "Sign in" },
  ];

  return (
    <footer className="mt-16 border-t border-border-subtle/50 px-6 py-10">
      <nav
        aria-label={isFR ? "Liens légaux" : "Legal links"}
        className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3"
      >
        {links.map((l) => (
          <Link
            key={l.to}
            to={l.to}
            className="text-[11px] uppercase tracking-[0.16em] text-text-tertiary transition-colors hover:text-foreground"
          >
            {l.label}
          </Link>
        ))}
      </nav>
      <p className="mt-6 text-center text-[10px] tracking-[0.14em] uppercase text-text-tertiary/60">
        © {new Date().getFullYear()} Protocole Nomos —{" "}
        {isFR
          ? "Paiements traités par Paddle.com, Merchant of Record."
          : "Payments handled by Paddle.com, Merchant of Record."}
      </p>
    </footer>
  );
}
