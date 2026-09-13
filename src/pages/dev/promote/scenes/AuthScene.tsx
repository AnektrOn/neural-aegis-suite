import { ArrowRight, Mail } from "lucide-react";
import aegisLogo from "@/assets/aegis-logo.png";
import { NeuralCard } from "@/components/ui/neural-card";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import ThemeToggle from "@/components/ThemeToggle";
import { copy, PROMOTE_USER } from "../promoteDemoData";
import { usePromotePlayer } from "../PromotePlayerContext";

const inputCls =
  "w-full bg-bg-base border border-border-active rounded-lg px-3 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary";

export function AuthScene() {
  const { isFR, next } = usePromotePlayer();
  return (
    <div className="flex h-full min-h-0 flex-col overflow-y-auto bg-background px-5 pb-10 pt-[max(1.25rem,env(safe-area-inset-top))]">
      <header className="flex items-center justify-between">
        <img src={aegisLogo} alt="" className="h-9 w-9 rounded-lg object-contain" />
        <div className="flex items-center gap-2">
          <LanguageSwitcher collapsed />
          <ThemeToggle collapsed />
        </div>
      </header>
      <div className="mx-auto mt-10 w-full max-w-sm">
        <p className="text-center font-display text-[10px] uppercase tracking-[0.32em] text-muted-foreground">
          Neural Aegis
        </p>
        <h1 className="mt-3 text-center font-cormorant text-3xl font-light">
          {copy(isFR, "Connexion", "Sign in")}
        </h1>
        <NeuralCard className="mt-6 space-y-4 p-5" glow="none">
          <label className="block space-y-1.5">
            <span className="font-display text-[10px] uppercase tracking-[0.15em] text-text-tertiary">
              {copy(isFR, "Email", "Email")}
            </span>
            <div className="relative">
              <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
              <input readOnly className={`${inputCls} pl-9`} value={PROMOTE_USER.email} />
            </div>
          </label>
          <label className="block space-y-1.5">
            <span className="font-display text-[10px] uppercase tracking-[0.15em] text-text-tertiary">
              {copy(isFR, "Mot de passe", "Password")}
            </span>
            <input readOnly type="password" className={inputCls} value="••••••••••" />
          </label>
          <button
            type="button"
            onClick={next}
            className="flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 font-display text-[11px] uppercase tracking-[0.18em] text-primary-foreground"
          >
            {copy(isFR, "Entrer", "Enter")}
            <ArrowRight size={14} />
          </button>
        </NeuralCard>
      </div>
    </div>
  );
}
