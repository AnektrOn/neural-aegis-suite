import LegalPageShell from "@/components/public/LegalPageShell";
import { useLanguage } from "@/i18n/LanguageContext";

export default function TermsOfService() {
  const { locale } = useLanguage();
  const isFR = locale === "fr";

  return (
    <LegalPageShell
      title={isFR ? "Conditions générales" : "Terms & Conditions"}
      description={
        isFR
          ? "Conditions générales d'utilisation et de vente de l'application Aegis, éditée par Protocole Nomos."
          : "Terms and conditions governing the use of the Aegis application, provided by Protocole Nomos."
      }
      updated={isFR ? "Dernière mise à jour : août 2026" : "Last updated: August 2026"}
    >
      {isFR ? (
        <>
          <h2>1. Le vendeur</h2>
          <p>
            L'application Aegis (« le Service ») est éditée et fournie par{" "}
            <strong>Protocole Nomos</strong> (« nous »). En utilisant le Service, vous concluez un
            contrat avec Protocole Nomos.
          </p>

          <h2>2. Acceptation</h2>
          <p>
            En créant un compte ou en continuant à utiliser le Service, vous acceptez les présentes
            conditions. Vous déclarez être majeur et, si vous agissez pour une organisation, avoir
            le pouvoir de l'engager. Vous vous engagez à fournir des informations exactes et à
            préserver la confidentialité de vos identifiants ; vous êtes responsable de toute
            activité effectuée depuis votre compte.
          </p>

          <h2>3. Description du Service</h2>
          <p>
            Aegis est un outil d'accompagnement du leadership : journal d'humeur, journal de
            décisions, suivi d'habitudes, tableau de relations, exercices d'introspection, rapports
            et analyses, dont certains sont générés à l'aide d'intelligence artificielle. Nous vous
            accordons un droit d'utilisation limité, non exclusif et non transférable, dans les
            limites de la formule choisie.
          </p>

          <h2>4. Usage interdit</h2>
          <ul>
            <li>Usage illégal, frauduleux ou trompeur, envoi de spam.</li>
            <li>Atteinte aux droits de propriété intellectuelle de tiers.</li>
            <li>Atteinte à la sécurité du Service : logiciels malveillants, sondage, contournement des limites techniques, extraction automatisée (scraping).</li>
            <li>Rétro-ingénierie, revente ou redistribution du Service.</li>
            <li>Contenus haineux, illégaux ou portant atteinte à autrui, y compris via les fonctions d'IA.</li>
          </ul>

          <h2>5. Fonctions d'intelligence artificielle</h2>
          <p>
            Vous êtes responsable des contenus que vous saisissez, de leurs droits, et de l'usage
            que vous faites des résultats produits. Les résultats générés peuvent être inexacts et
            ne constituent ni un avis médical, psychologique, juridique, financier ou fiscal, ni une
            recommandation professionnelle : ils doivent être vérifiés avant toute décision. Nous
            pouvons filtrer, restreindre ou retirer des contenus et suspendre un compte en cas
            d'abus. Tout titulaire de droits peut demander un retrait en nous contactant ; les
            atteintes répétées entraînent la fermeture du compte.
          </p>

          <h2>6. Propriété intellectuelle</h2>
          <p>
            Protocole Nomos conserve la propriété du Service, de son logiciel, de sa documentation,
            de ses contenus éditoriaux et de sa marque. Vous conservez la propriété des contenus que
            vous créez et nous accordez une licence limitée pour les héberger et les traiter aux
            seules fins de fourniture du Service.
          </p>

          <h2>7. Paiement, abonnement et remboursement</h2>
          <p>
            Notre processus de commande est assuré par notre revendeur en ligne Paddle.com.
            Paddle.com est le Merchant of Record de toutes nos commandes. Paddle gère l'ensemble des
            demandes du service client et les retours. Les modalités de paiement, de facturation, de
            taxes, de renouvellement, d'annulation et de remboursement sont régies par les{" "}
            <a
              href="https://www.paddle.com/legal/checkout-buyer-terms"
              target="_blank"
              rel="noreferrer noopener"
            >
              Buyer Terms de Paddle
            </a>{" "}
            et par notre <a href="/legal/refund">politique de remboursement</a>. Les abonnements se
            renouvellent automatiquement jusqu'à annulation.
          </p>
          <p>
            Le forfait <strong>Matrice</strong> est un abonnement récurrent : l'annulation stoppe les
            renouvellements futurs, sans remboursement au prorata. Le forfait <strong>Ultra</strong>{" "}
            n'est pas un abonnement mensuel mais un engagement unique dont le prix total peut être
            réglé en plusieurs échéances, à titre de facilité de paiement : après la fenêtre de
            rétractation de 30 jours, vous pouvez arrêter à tout moment — les échéances restantes ne
            sont plus dues, mais les sommes déjà versées ne sont pas remboursées.

          </p>
          <p>
            Nous sommes tenus à une <strong>obligation de moyens</strong> et non à une obligation de
            résultat : aucun résultat personnel, professionnel ou financier n'est garanti.
          </p>


          <h2>8. Disponibilité</h2>
          <p>
            Le Service est fourni « en l'état ». Nous ne garantissons pas un fonctionnement
            ininterrompu ni exempt d'erreurs, et nous excluons, dans la limite permise par la loi,
            toute garantie implicite (qualité marchande, adéquation à un usage particulier).
          </p>

          <h2>9. Responsabilité</h2>
          <p>
            Notre responsabilité globale est limitée aux sommes que vous avez versées au cours des
            12 mois précédant le fait générateur. Nous excluons les dommages indirects (perte de
            profits, de données ou de réputation). Aucune limitation ne s'applique en cas de fraude,
            de décès ou de dommage corporel.
          </p>

          <h2>10. Suspension et résiliation</h2>
          <p>
            Nous pouvons suspendre ou résilier votre accès en cas de manquement grave, de défaut de
            paiement, de risque de sécurité ou de fraude, ou de violations répétées des présentes
            conditions. Vous pouvez résilier à tout moment. À la fin de l'accès, vous disposez de 30
            jours pour exporter vos données avant suppression.
          </p>

          <h2>11. Divers</h2>
          <p>
            Vous ne pouvez céder ce contrat sans notre accord ; nous pouvons le céder dans le cadre
            d'une fusion ou d'une acquisition. Notre responsabilité est suspendue en cas de force
            majeure. Le contrat est régi par le droit français et les tribunaux français sont
            compétents, sans préjudice des règles impératives protégeant les consommateurs.
          </p>
        </>
      ) : (
        <>
          <h2>1. The seller</h2>
          <p>
            The Aegis application (the "Service") is provided by <strong>Protocole Nomos</strong>{" "}
            ("we"). By using the Service you enter into a contract with Protocole Nomos.
          </p>

          <h2>2. Acceptance</h2>
          <p>
            By creating an account or continuing to use the Service you agree to these terms. You
            confirm you are of legal age and, if acting for an organisation, that you have authority
            to bind it. You must provide accurate information, keep your credentials confidential
            and remain responsible for activity under your account.
          </p>

          <h2>3. The Service</h2>
          <p>
            Aegis is a leadership coaching tool: mood log, decision log, habit tracking, relationship
            board, introspection exercises, reports and analytics, some of which are generated using
            artificial intelligence. We grant you a limited, non-exclusive, non-transferable right to
            use the Service within your selected plan.
          </p>

          <h2>4. Misuse</h2>
          <ul>
            <li>Unlawful, fraudulent or deceptive use, or spam.</li>
            <li>Infringement of third-party intellectual property rights.</li>
            <li>Interference with security: malware, probing, circumventing technical limits, scraping.</li>
            <li>Reverse engineering, resale or redistribution of the Service.</li>
            <li>Hateful, illegal or harmful content, including through AI features.</li>
          </ul>

          <h2>5. AI features</h2>
          <p>
            You are responsible for the content you submit, for holding the rights to it, and for how
            you use the outputs. Outputs may be inaccurate and are not medical, psychological, legal,
            financial or tax advice; verify them before acting. We may filter, restrict or remove
            content and suspend accounts for abuse. Rights holders may request a takedown by
            contacting us; repeated infringement leads to account termination.
          </p>

          <h2>6. Intellectual property</h2>
          <p>
            Protocole Nomos retains ownership of the Service, its software, documentation, editorial
            content and branding. You retain ownership of the content you create and grant us a
            limited licence to host and process it solely to provide the Service.
          </p>

          <h2>7. Payment, subscription and refunds</h2>
          <p>
            Our order process is conducted by our online reseller Paddle.com. Paddle.com is the
            Merchant of Record for all our orders. Paddle provides all customer service inquiries and
            handles returns. Payment, billing, tax, renewal, cancellation and refund mechanics are
            governed by the{" "}
            <a
              href="https://www.paddle.com/legal/checkout-buyer-terms"
              target="_blank"
              rel="noreferrer noopener"
            >
              Paddle Buyer Terms
            </a>{" "}
            and our <a href="/legal/refund">refund policy</a>. Subscriptions renew automatically
            until cancelled.
          </p>
          <p>
            The <strong>Matrice</strong> plan is a recurring subscription: cancelling stops future
            renewals, with no pro-rata refund. The <strong>Ultra</strong> plan is not a monthly
            subscription but a single commitment whose total price may be split into instalments as a
            payment facility: after the 30-day withdrawal window, you may stop the programme, but
            instalments already due remain payable and amounts paid are not refunded.
          </p>
          <p>
            We are bound by a <strong>best-efforts obligation</strong>, not an obligation of result:
            no personal, professional or financial outcome is guaranteed.
          </p>


          <h2>8. Availability</h2>
          <p>
            The Service is provided "as is". We do not guarantee uninterrupted or error-free
            operation and, to the fullest extent permitted by law, disclaim implied warranties of
            merchantability and fitness for a particular purpose.
          </p>

          <h2>9. Liability</h2>
          <p>
            Our aggregate liability is capped at the fees you paid in the 12 months preceding the
            claim. We exclude indirect or consequential damages (loss of profits, data or goodwill).
            Nothing limits liability for fraud, death or personal injury.
          </p>

          <h2>10. Suspension and termination</h2>
          <p>
            We may suspend or terminate access for material breach, non-payment, security or fraud
            risk, or repeated policy violations. You may terminate at any time. After access ends you
            have 30 days to export your data before deletion.
          </p>

          <h2>11. General</h2>
          <p>
            You may not assign this agreement without our consent; we may assign it in a merger or
            acquisition. Performance is excused during force majeure events. French law governs and
            French courts have jurisdiction, without prejudice to mandatory consumer protections.
          </p>
        </>
      )}
    </LegalPageShell>
  );
}
