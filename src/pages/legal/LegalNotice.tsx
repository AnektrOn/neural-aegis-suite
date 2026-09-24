import LegalPageShell from "@/components/public/LegalPageShell";
import { useLanguage } from "@/i18n/LanguageContext";

/**
 * Mentions légales FR — placeholders for SIRET / TVA / RCS must be filled
 * with the real Protocole Nomos registry numbers before production sign-off.
 */
export default function LegalNotice() {
  const { locale } = useLanguage();
  const isFR = locale === "fr";

  return (
    <LegalPageShell
      title={isFR ? "Mentions légales" : "Legal notice"}
      description={
        isFR
          ? "Informations légales sur l'éditeur du service Aegis (Protocole Nomos)."
          : "Legal information about the publisher of the Aegis service (Protocole Nomos)."
      }
      updated={isFR ? "Dernière mise à jour : septembre 2026" : "Last updated: September 2026"}
    >
      {isFR ? (
        <>
          <h2>1. Éditeur</h2>
          <p>
            Le site et l'application <strong>Aegis</strong> sont édités par{" "}
            <strong>Protocole Nomos</strong>.
          </p>
          <ul>
            <li>Forme juridique : à compléter (SAS / SARL / EI…)</li>
            <li>Siège social : à compléter</li>
            <li>SIRET : à compléter</li>
            <li>N° TVA intracommunautaire : à compléter</li>
            <li>RCS / RM : à compléter</li>
            <li>Capital social : à compléter</li>
            <li>
              Contact :{" "}
              <a href="mailto:contact@protocolenomos.com">contact@protocolenomos.com</a>
            </li>
          </ul>

          <h2>2. Directeur de la publication</h2>
          <p>Le directeur de la publication est le représentant légal de Protocole Nomos.</p>

          <h2>3. Hébergement</h2>
          <p>
            L'hébergement applicatif et des données est assuré via des prestataires cloud (dont
            Supabase / infrastructure associée). Pour toute question technique relative à
            l'hébergement, contactez{" "}
            <a href="mailto:contact@protocolenomos.com">contact@protocolenomos.com</a>.
          </p>

          <h2>4. Paiements et facturation</h2>
          <p>
            Les paiements sont traités par <strong>Stripe Payments Europe, Ltd.</strong> Les
            factures (PDF) et le détail TVA sont accessibles depuis le portail de facturation
            Stripe, depuis la page <a href="/pricing">Tarifs</a> (« Gérer mon abonnement »).
          </p>

          <h2>5. Propriété intellectuelle</h2>
          <p>
            L'ensemble des contenus, marques et éléments graphiques restent la propriété de
            Protocole Nomos, sauf mention contraire. Voir aussi les{" "}
            <a href="/legal/terms">Conditions générales</a>.
          </p>

          <h2>6. Données personnelles</h2>
          <p>
            Le traitement des données personnelles est décrit dans la{" "}
            <a href="/legal/privacy">politique de confidentialité</a>.
          </p>
        </>
      ) : (
        <>
          <h2>1. Publisher</h2>
          <p>
            The <strong>Aegis</strong> website and application are published by{" "}
            <strong>Protocole Nomos</strong>.
          </p>
          <ul>
            <li>Legal form: to be completed</li>
            <li>Registered office: to be completed</li>
            <li>Company registry / VAT IDs: to be completed</li>
            <li>
              Contact:{" "}
              <a href="mailto:contact@protocolenomos.com">contact@protocolenomos.com</a>
            </li>
          </ul>

          <h2>2. Payments & invoices</h2>
          <p>
            Payments are processed by <strong>Stripe Payments Europe, Ltd.</strong> Invoices (PDF)
            and VAT details are available from the Stripe billing portal via{" "}
            <a href="/pricing">Pricing</a> (“Manage my subscription”).
          </p>

          <h2>3. Privacy</h2>
          <p>
            Personal data processing is described in the{" "}
            <a href="/legal/privacy">privacy notice</a>.
          </p>
        </>
      )}
    </LegalPageShell>
  );
}
