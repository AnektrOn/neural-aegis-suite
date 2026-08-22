import LegalPageShell from "@/components/public/LegalPageShell";
import { useLanguage } from "@/i18n/LanguageContext";

export default function PrivacyPolicy() {
  const { locale } = useLanguage();
  const isFR = locale === "fr";

  return (
    <LegalPageShell
      title={isFR ? "Politique de confidentialité" : "Privacy Notice"}
      description={
        isFR
          ? "Comment Protocole Nomos collecte, utilise et protège vos données personnelles dans l'application Aegis."
          : "How Protocole Nomos collects, uses and protects your personal data within the Aegis application."
      }
      updated={isFR ? "Dernière mise à jour : août 2026" : "Last updated: August 2026"}
    >
      {isFR ? (
        <>
          <p>
            Cette politique décrit comment <strong>Protocole Nomos</strong> (« nous »), éditeur de
            l'application Aegis, traite vos données personnelles. Protocole Nomos agit en qualité de{" "}
            <strong>responsable du traitement</strong> pour les données décrites ci-dessous.
          </p>

          <h2>1. Données collectées</h2>
          <ul>
            <li>Identité et compte : prénom/nom, adresse e-mail, identifiants de connexion, langue et fuseau horaire.</li>
            <li>Contenu que vous créez : humeurs, décisions, habitudes, notes de journal, contacts du tableau de relations, réponses aux questionnaires d'archétype.</li>
            <li>Données d'usage et techniques : pages consultées, durée de session, interactions avec les exercices, type d'appareil, version de l'application, identifiants techniques et adresse IP.</li>
            <li>Support : messages que vous nous adressez.</li>
          </ul>

          <h2>2. Finalités et bases légales</h2>
          <ul>
            <li>Créer et gérer votre compte, fournir le service — exécution du contrat.</li>
            <li>Générer vos analyses, rapports et recommandations personnalisées — exécution du contrat.</li>
            <li>Sécurité, prévention de la fraude et des abus — intérêt légitime.</li>
            <li>Amélioration du produit et statistiques agrégées — intérêt légitime.</li>
            <li>Communications marketing ou notifications non essentielles — consentement.</li>
            <li>Obligations comptables et légales — obligation légale.</li>
          </ul>

          <h2>3. Partage des données</h2>
          <ul>
            <li>
              <strong>Prestataire de paiement :</strong> Stripe Payments Europe, Ltd., pour le
              traitement des paiements, la gestion des abonnements et la facturation.
            </li>
            <li>Sous-traitants techniques : hébergement, base de données, envoi d'e-mails et de notifications, stockage de fichiers, fournisseurs d'IA utilisés pour générer vos analyses.</li>
            <li>Conseils professionnels (juridiques, comptables).</li>
            <li>Autorités compétentes lorsque la loi l'exige.</li>
          </ul>
          <p>Nous ne vendons pas vos données personnelles.</p>

          <h2>4. Transferts internationaux</h2>
          <p>
            Certains prestataires peuvent être situés hors de l'Espace économique européen. Ces
            transferts sont encadrés par des clauses contractuelles types ou une décision
            d'adéquation.
          </p>

          <h2>5. Conservation</h2>
          <p>
            Vos données de compte et de contenu sont conservées tant que votre compte est actif,
            puis supprimées ou anonymisées dans un délai de 12 mois après sa fermeture. Les données
            de facturation sont conservées pour la durée légale applicable.
          </p>

          <h2>6. Vos droits</h2>
          <p>
            Vous disposez des droits d'accès, de rectification, d'effacement, de limitation, de
            portabilité, d'opposition et de retrait de votre consentement. Vous pouvez également
            introduire une réclamation auprès de votre autorité de contrôle. Nous répondons dans un
            délai d'un mois : écrivez-nous depuis l'adresse e-mail de votre compte via le support de
            l'application.
          </p>

          <h2>7. Sécurité</h2>
          <p>
            Nous mettons en œuvre des mesures techniques et organisationnelles appropriées :
            chiffrement en transit, contrôle d'accès par utilisateur (politiques de sécurité au
            niveau des lignes), journalisation et principe du moindre privilège.
          </p>

          <h2>8. Cookies et stockage local</h2>
          <p>
            Nous utilisons uniquement des cookies et un stockage local essentiels (session
            d'authentification, préférences de langue et de thème). Aucun cookie publicitaire n'est
            déposé. Vous pouvez effacer ces données depuis les réglages de votre navigateur ; la
            déconnexion sera alors automatique.
          </p>
        </>
      ) : (
        <>
          <p>
            This notice explains how <strong>Protocole Nomos</strong> ("we"), the provider of the
            Aegis application, processes your personal data. Protocole Nomos acts as the{" "}
            <strong>data controller</strong> for the data described below.
          </p>

          <h2>1. Data we collect</h2>
          <ul>
            <li>Identity and account: name, email address, login credentials, language and timezone.</li>
            <li>Content you create: moods, decisions, habits, journal entries, relationship board contacts, archetype assessment answers.</li>
            <li>Usage and technical data: pages viewed, session duration, exercise interactions, device type, app version, technical identifiers and IP address.</li>
            <li>Support: messages you send us.</li>
          </ul>

          <h2>2. Purposes and legal bases</h2>
          <ul>
            <li>Creating and managing your account and delivering the service — performance of contract.</li>
            <li>Generating your analytics, reports and personalised recommendations — performance of contract.</li>
            <li>Security, fraud and abuse prevention — legitimate interests.</li>
            <li>Product improvement and aggregated statistics — legitimate interests.</li>
            <li>Marketing or non-essential notifications — consent.</li>
            <li>Accounting and legal obligations — legal obligation.</li>
          </ul>

          <h2>3. Data sharing</h2>
          <ul>
            <li>
              <strong>Payment provider:</strong> Stripe Payments Europe, Ltd., for payment
              processing, subscription management and invoicing.
            </li>
            <li>Service providers: hosting, database, email and push notifications, file storage, AI providers used to generate your analyses.</li>
            <li>Professional advisers (legal, accounting).</li>
            <li>Authorities where required by law.</li>
          </ul>
          <p>We do not sell your personal data.</p>

          <h2>4. International transfers</h2>
          <p>
            Some providers may be located outside the EEA/UK. Such transfers rely on Standard
            Contractual Clauses or an adequacy decision.
          </p>

          <h2>5. Retention</h2>
          <p>
            Account and content data are kept while your account is active and are deleted or
            anonymised within 12 months of closure. Billing records are kept for the legally
            required period.
          </p>

          <h2>6. Your rights</h2>
          <p>
            You have the rights of access, rectification, erasure, restriction, portability,
            objection and withdrawal of consent, and may lodge a complaint with your supervisory
            authority. We respond within one month — contact us from your account email through
            in-app support.
          </p>

          <h2>7. Security</h2>
          <p>
            We apply appropriate technical and organisational measures: encryption in transit,
            per-user access control (row level security policies), logging and least privilege.
          </p>

          <h2>8. Cookies and local storage</h2>
          <p>
            We only use essential cookies and local storage (authentication session, language and
            theme preferences). No advertising cookies are set. You can clear this data in your
            browser settings, which will sign you out.
          </p>
        </>
      )}
    </LegalPageShell>
  );
}
