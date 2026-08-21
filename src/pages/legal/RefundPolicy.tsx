import LegalPageShell from "@/components/public/LegalPageShell";
import { useLanguage } from "@/i18n/LanguageContext";

export default function RefundPolicy() {
  const { locale } = useLanguage();
  const isFR = locale === "fr";

  return (
    <LegalPageShell
      title={isFR ? "Politique de remboursement et d'annulation" : "Refund & Cancellation Policy"}
      description={
        isFR
          ? "Rétractation de 30 jours, puis annulation sans remboursement — conditions Aegis de Protocole Nomos."
          : "30-day withdrawal window, then cancellation without refund — Aegis terms from Protocole Nomos."
      }
      updated={isFR ? "Dernière mise à jour : août 2026" : "Last updated: August 2026"}
    >
      {isFR ? (
        <>
          <p>
            <strong>Protocole Nomos</strong> applique une fenêtre de rétractation de{" "}
            <strong>30 jours</strong> sur les commandes de l'application Aegis. Passé ce délai,
            l'abonnement ou le plan reste annulable, mais les sommes déjà versées ne sont pas
            remboursées.
          </p>

          <h2>1. Fenêtre de rétractation (30 jours)</h2>
          <p>
            Si le Service ne vous convient pas, vous pouvez demander le remboursement intégral de
            votre commande dans les 30 jours suivant sa date, sans avoir à vous justifier. Cette
            fenêtre s'applique à la première commande de chaque forfait.
          </p>

          <h2>2. Après 30 jours</h2>
          <p>
            Au-delà de la fenêtre de 30 jours, aucun remboursement, total ou partiel, n'est accordé.
            Vous pouvez annuler à tout moment : l'annulation met fin aux échéances futures lorsque
            cela s'applique, mais ne donne lieu à aucun remboursement des montants déjà réglés, ni
            au prorata de la période en cours.
          </p>

          <h2>3. Forfait Matrice (abonnement)</h2>
          <p>
            Le forfait Matrice est un abonnement récurrent, mensuel ou annuel. Vous pouvez
            l'annuler à tout moment depuis votre espace de facturation Paddle ou depuis les réglages
            de l'application. L'annulation stoppe les renouvellements suivants ; vous conservez
            l'accès jusqu'à la fin de la période déjà payée. Aucun remboursement au prorata n'est
            effectué pour la période en cours ou les périodes écoulées.
          </p>

          <h2>4. Forfait Ultra (facilité de paiement)</h2>
          <p>
            Le forfait Ultra n'est <strong>pas un abonnement mensuel</strong> : il s'agit d'un
            engagement unique dont le prix total peut être réglé comptant ou en plusieurs échéances,
            à titre de <strong>facilité de paiement</strong>.
          </p>
          <ul>
            <li>
              Vous disposez également d'une fenêtre de rétractation de 30 jours à compter de la
              première échéance.
            </li>
            <li>
              Passé ce délai, vous pouvez arrêter à tout moment : les échéances restantes ne sont
              alors plus dues, mais les montants déjà versés ne sont pas remboursés.
            </li>
            <li>
              Exemple : un arrêt demandé au 45<sup>e</sup> jour, alors que deux échéances de 1 500 €
              ont déjà été prélevées, met fin aux prélèvements suivants ; les 3 000 € déjà versés
              restent acquis à Protocole Nomos.
            </li>
            <li>
              Les montants déjà versés au titre du forfait Ultra ne sont en aucun cas remboursés
              après la fenêtre de rétractation.
            </li>

          </ul>

          <h2>5. Nature de l'engagement</h2>
          <p>
            Protocole Nomos est tenu à une <strong>obligation de moyens</strong> et non à une
            obligation de résultat. Le Service fournit des outils de suivi, d'analyse et
            d'accompagnement ; aucun résultat personnel, professionnel ou financier n'est garanti, et
            l'absence de résultat ne constitue pas un motif de remboursement.
          </p>

          <h2>6. Comment annuler ou demander un remboursement</h2>
          <p>
            Nos paiements sont traités par notre revendeur Paddle.com, Merchant of Record de toutes
            nos commandes. Pour annuler ou demander un remboursement dans la fenêtre de 30 jours,
            rendez-vous sur{" "}
            <a href="https://paddle.net" target="_blank" rel="noreferrer noopener">
              paddle.net
            </a>{" "}
            avec l'e-mail utilisé lors de l'achat, ou contactez notre support depuis l'application.
          </p>

          <h2>7. Problèmes techniques ou de facturation</h2>
          <p>
            En cas de double facturation, d'erreur de montant ou d'indisponibilité prolongée du
            Service qui nous serait imputable, contactez-nous : ces situations sont traitées au cas
            par cas, indépendamment des règles ci-dessus.
          </p>
        </>
      ) : (
        <>
          <p>
            <strong>Protocole Nomos</strong> applies a <strong>30-day withdrawal window</strong> to
            Aegis orders. After that window, plans can still be cancelled, but amounts already paid
            are not refunded.
          </p>

          <h2>1. Withdrawal window (30 days)</h2>
          <p>
            If the Service is not right for you, you can request a full refund within 30 days of
            your order date, no justification needed. This window applies to the first order of each
            plan.
          </p>

          <h2>2. After 30 days</h2>
          <p>
            Beyond the 30-day window, no refunds — full or partial — are granted. You may cancel at
            any time: cancellation stops future charges where applicable, but does not refund
            amounts already paid, and no pro-rata refund is issued for the current period.
          </p>

          <h2>3. Matrice plan (subscription)</h2>
          <p>
            Matrice is a recurring monthly or yearly subscription. You can cancel it at any time
            from your Paddle billing portal or from the app settings. Cancelling stops future
            renewals; access remains until the end of the period you already paid for. No pro-rata
            refund is issued for the current or past periods.
          </p>

          <h2>4. Ultra plan (payment plan)</h2>
          <p>
            Ultra is <strong>not a monthly subscription</strong>: it is a single commitment whose
            total price may be paid upfront or split into instalments as a{" "}
            <strong>payment facility</strong>.
          </p>
          <ul>
            <li>A 30-day withdrawal window also applies, from the first instalment.</li>
            <li>
              After that window you may stop at any time: remaining instalments are no longer owed,
              but amounts already paid are not refunded.
            </li>
            <li>
              Example: stopping on day 45, after two instalments of €1,500 have been charged, ends
              all further charges; the €3,000 already paid stays with Protocole Nomos.
            </li>
            <li>
              Amounts already paid under the Ultra plan are not refunded after the withdrawal
              window.
            </li>

          </ul>

          <h2>5. Nature of the commitment</h2>
          <p>
            Protocole Nomos is bound by a <strong>best-efforts obligation</strong>, not an
            obligation of result. The Service provides tracking, analysis and coaching tools; no
            personal, professional or financial outcome is guaranteed, and the absence of a result
            is not grounds for a refund.
          </p>

          <h2>6. How to cancel or request a refund</h2>
          <p>
            Payments are processed by our reseller Paddle.com, the Merchant of Record for all our
            orders. To cancel or request a refund within the 30-day window, visit{" "}
            <a href="https://paddle.net" target="_blank" rel="noreferrer noopener">
              paddle.net
            </a>{" "}
            using the email address you purchased with, or contact our support from inside the app.
          </p>

          <h2>7. Technical or billing issues</h2>
          <p>
            In case of duplicate charges, incorrect amounts, or prolonged unavailability of the
            Service attributable to us, get in touch: these are reviewed case by case, independently
            of the rules above.
          </p>
        </>
      )}
    </LegalPageShell>
  );
}
