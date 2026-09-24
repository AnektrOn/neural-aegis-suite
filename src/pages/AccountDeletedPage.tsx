import { Link } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import LegalPageShell from "@/components/public/LegalPageShell";

export default function AccountDeletedPage() {
  const { locale } = useLanguage();
  const isFR = locale === "fr";

  return (
    <LegalPageShell
      title={isFR ? "Compte résilié" : "Account closed"}
      description={
        isFR
          ? "Votre compte Aegis a été supprimé ou votre abonnement a été résilié."
          : "Your Aegis account has been deleted or your subscription cancelled."
      }
      updated=""
    >
      <p>
        {isFR
          ? "Si vous avez demandé la suppression de votre compte, vos données personnelles seront effacées conformément à notre politique de confidentialité (sous réserve des obligations légales de conservation)."
          : "If you requested account deletion, your personal data will be erased in line with our privacy policy (subject to legal retention duties)."}
      </p>
      <p>
        {isFR
          ? "Pour toute question : "
          : "Questions: "}
        <a href="mailto:contact@protocolenomos.com">contact@protocolenomos.com</a>
      </p>
      <p>
        <Link to="/">{isFR ? "Retour à l'accueil" : "Back to home"}</Link>
        {" · "}
        <Link to="/pricing">{isFR ? "Voir les tarifs" : "View pricing"}</Link>
      </p>
    </LegalPageShell>
  );
}
