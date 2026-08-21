import LegalPageShell from "@/components/public/LegalPageShell";
import { useLanguage } from "@/i18n/LanguageContext";

export default function RefundPolicy() {
  const { locale } = useLanguage();
  const isFR = locale === "fr";

  return (
    <LegalPageShell
      title={isFR ? "Politique de remboursement" : "Refund Policy"}
      description={
        isFR
          ? "Garantie satisfait ou remboursé de 30 jours sur les abonnements Aegis de Protocole Nomos."
          : "30-day money-back guarantee on Aegis subscriptions from Protocole Nomos."
      }
      updated={isFR ? "Dernière mise à jour : août 2026" : "Last updated: August 2026"}
    >
      {isFR ? (
        <>
          <p>
            <strong>Protocole Nomos</strong> propose une garantie satisfait ou remboursé de{" "}
            <strong>30 jours</strong> sur les abonnements à l'application Aegis.
          </p>

          <h2>Délai</h2>
          <p>
            Si le Service ne vous convient pas, vous pouvez demander le remboursement intégral de
            votre commande dans les 30 jours suivant sa date, sans avoir à vous justifier. Cela
            s'applique aux abonnements mensuels, annuels et aux paiements échelonnés du forfait
            Ultra.
          </p>

          <h2>Comment demander un remboursement</h2>
          <p>
            Nos paiements sont traités par notre revendeur Paddle.com, Merchant of Record de toutes
            nos commandes. Pour demander un remboursement, rendez-vous sur{" "}
            <a href="https://paddle.net" target="_blank" rel="noreferrer noopener">
              paddle.net
            </a>{" "}
            avec l'e-mail utilisé lors de l'achat, ou contactez notre support depuis l'application.
            Nous transmettons alors la demande à Paddle.
          </p>

          <h2>Traitement</h2>
          <p>
            Les remboursements approuvés sont effectués sur le moyen de paiement d'origine,
            généralement sous 5 à 10 jours ouvrés selon votre banque. L'accès aux fonctionnalités
            payantes prend fin au moment du remboursement.
          </p>

          <h2>Annulation</h2>
          <p>
            Vous pouvez annuler votre abonnement à tout moment depuis votre espace de facturation
            Paddle ou depuis les réglages de l'application. L'annulation met fin aux renouvellements
            futurs ; l'accès reste actif jusqu'à la fin de la période déjà payée.
          </p>

          <h2>Au-delà de 30 jours</h2>
          <p>
            Après ce délai, nous examinons chaque demande au cas par cas, notamment en cas de
            problème technique ou de facturation. Écrivez-nous : nous cherchons toujours une
            solution équitable.
          </p>
        </>
      ) : (
        <>
          <p>
            <strong>Protocole Nomos</strong> offers a <strong>30-day money-back guarantee</strong> on
            Aegis subscriptions.
          </p>

          <h2>Refund period</h2>
          <p>
            If the Service is not right for you, you can request a full refund within 30 days of your
            order date, no justification needed. This covers monthly plans, yearly plans and Ultra
            instalment payments.
          </p>

          <h2>How to request a refund</h2>
          <p>
            Payments are processed by our reseller Paddle.com, the Merchant of Record for all our
            orders. To request a refund, visit{" "}
            <a href="https://paddle.net" target="_blank" rel="noreferrer noopener">
              paddle.net
            </a>{" "}
            using the email address you purchased with, or contact our support from inside the app
            and we will forward the request to Paddle.
          </p>

          <h2>Processing</h2>
          <p>
            Approved refunds are returned to the original payment method, typically within 5–10
            business days depending on your bank. Access to paid features ends when the refund is
            issued.
          </p>

          <h2>Cancellation</h2>
          <p>
            You can cancel your subscription at any time from your Paddle billing portal or from the
            app settings. Cancelling stops future renewals; access remains active until the end of
            the period you already paid for.
          </p>

          <h2>After 30 days</h2>
          <p>
            Beyond that window we review requests case by case, in particular for technical or
            billing issues. Get in touch and we will look for a fair outcome.
          </p>
        </>
      )}
    </LegalPageShell>
  );
}
