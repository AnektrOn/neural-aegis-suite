import { useState } from 'react';
import { Link } from 'react-router-dom';
import { KeyRound, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/i18n/LanguageContext';
import { useSubscription } from '@/hooks/useSubscription';
import { supabase } from '@/integrations/supabase/client';

export default function AppSumoRedemption() {
  const { user, isGuest, isAnonymous } = useAuth();
  const { locale } = useLanguage();
  const { refetch, subscription, isActive } = useSubscription();
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);
  const [message, setMessage] = useState('');
  const [emailsPending, setEmailsPending] = useState(false);
  const fr = locale === 'fr';
  const signedIn = !!user && !isGuest && !isAnonymous;
  const alreadyActivated = isActive && subscription?.price_id === 'appsumo_lifetime';

  async function redeemCode(resend = false) {
    if (busy) return;
    setBusy(true);
    setMessage('');
    try {
      const { data, error } = await supabase.functions.invoke('redeem-appsumo', { body: resend ? { resend: true, locale } : { code: code.trim().toUpperCase(), locale } });
      if (error) throw error;
      const result = data as { success?: boolean; error?: string; emails?: string; email_error?: string } | null;
      if (!result?.success) {
        const errors: Record<string, string> = {
          invalid_code: fr ? 'Code invalide ou désactivé.' : 'Invalid or deactivated code.',
          already_used: fr ? 'Ce code a déjà été utilisé par un autre compte.' : 'This code has already been redeemed by another account.',
          account_already_activated: fr ? 'Votre compte possède déjà un accès AppSumo.' : 'Your account already has AppSumo access.',
          sign_in_required: fr ? 'Connectez-vous pour activer votre code.' : 'Sign in to redeem your code.',
        };
        setMessage(errors[result?.error ?? ''] ?? (fr ? 'Activation impossible. Réessayez.' : 'Unable to redeem. Please try again.'));
        return;
      }
      await refetch();
      setEmailsPending(result.emails === 'pending');
      setMessage(result.emails === 'pending' && result.email_error
        ? (fr ? `Email en attente : ${result.email_error}` : `Email pending: ${result.email_error}`)
        : '');
      setSuccess(true);
    } catch {
      setMessage(fr ? 'Activation indisponible. Réessayez dans un instant.' : 'Redemption unavailable. Please try again shortly.');
    } finally { setBusy(false); }
  }

  async function redeem(e: React.FormEvent) {
    e.preventDefault();
    await redeemCode();
  }

  return <section className="space-y-4 border-b border-border py-6" aria-labelledby="appsumo-title">
    <h2 id="appsumo-title" className="flex items-center gap-2 text-xl text-foreground"><KeyRound size={20} />{fr ? 'Activer un code AppSumo' : 'Redeem an AppSumo code'}</h2>
    <p className="text-sm text-muted-foreground">AEGIS Solo · {fr ? 'Accès à vie, sans LOGOS' : 'Lifetime access, without LOGOS'}</p>
    {signedIn && (success || alreadyActivated) ? <div role="status" className="space-y-3">
      <p className="text-sm text-foreground">{fr ? 'Votre accès AEGIS Solo à vie est activé.' : 'Your AEGIS Solo lifetime access is activated.'}</p>
      {(emailsPending || !success) && <div className="space-y-2">{emailsPending && <p className="text-sm text-muted-foreground">{fr ? 'Votre accès est actif, mais l’email de confirmation est encore en attente.' : 'Your access is active, but the confirmation email is still pending.'}</p>}<Button variant="outline" disabled={busy} onClick={() => { void redeemCode(true); }}>{busy && <Loader2 size={16} className="animate-spin" />}{fr ? 'Réessayer la confirmation' : 'Retry confirmation'}</Button>{message && <p role="alert" className="text-sm text-destructive">{message}</p>}</div>}
      {success && !emailsPending && <p className="text-sm text-muted-foreground">{fr ? 'Email de confirmation envoyé.' : 'Confirmation email sent.'}</p>}
      <Button asChild><Link to="/dashboard">{fr ? 'Ouvrir AEGIS' : 'Open AEGIS'}</Link></Button>
    </div> : signedIn ? <form onSubmit={redeem} className="space-y-3">
      <label htmlFor="appsumo-code" className="block text-sm text-foreground">{fr ? 'Code AppSumo' : 'AppSumo code'}</label>
      <Input id="appsumo-code" value={code} onChange={e => setCode(e.target.value)} placeholder="AEGIS-XXXXXXXXXXXX" autoComplete="off" maxLength={18} required disabled={busy} />
      <Button type="submit" disabled={busy || !code.trim()}>{busy && <Loader2 size={16} className="animate-spin" />}{fr ? 'Activer mon accès à vie' : 'Redeem lifetime access'}</Button>
      {message && <p role="alert" className="text-sm text-destructive">{message}</p>}
    </form> : <div className="flex flex-wrap gap-3">
      <Button asChild><Link to="/auth?signup=1&redirect=/redeem">{fr ? 'Créer un compte' : 'Create an account'}</Link></Button>
      <Button asChild variant="outline"><Link to="/auth?redirect=/redeem">{fr ? 'Se connecter' : 'Sign in'}</Link></Button>
    </div>}
  </section>;
}
