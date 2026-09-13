import { Hexagon, HelpCircle, Library, RotateCw } from "lucide-react";
import { SacredGeometry } from "@/features/aegis-pulse/components/SacredGeometry";
import { getRuneAccent } from "@/features/aegis-pulse/domain/runeAccent";
import { useLanguage } from "@/i18n/LanguageContext";
import { PROMOTE_PULSE_CARD } from "../promoteDemoData";

export function PulseScene() {
  const { t } = useLanguage();
  const card = PROMOTE_PULSE_CARD;
  const accent = getRuneAccent(card.principleCode);
  return (
    <div className="relative flex min-h-[70dvh] flex-col">
      <nav className="flex items-center justify-between px-1 py-2">
        <span className="inline-flex h-11 w-11 items-center justify-center text-text-secondary">
          <Hexagon size={20} strokeWidth={1.5} />
        </span>
        <h1 className="font-barlow text-xs font-medium uppercase tracking-[0.2em] text-text-secondary">
          {t("pulse.title")}
        </h1>
        <span className="relative inline-flex h-11 w-11 items-center justify-center text-text-secondary">
          <Library size={20} strokeWidth={1.5} />
        </span>
      </nav>
      <div className="relative mx-auto aspect-[3/4] w-full max-h-[58dvh] max-w-sm">
        <div
          className="absolute inset-0 flex flex-col overflow-hidden rounded-[18px] border border-border-subtle bg-bg-surface"
          style={{
            boxShadow: `0 4px 28px hsl(0 0% 0% / 0.32), 0 0 24px hsla(${accent} / 0.06)`,
          }}
        >
          <div className="relative flex items-center justify-between px-4 py-3">
            <span className="font-barlow text-[10px] font-medium uppercase tracking-[0.14em] rounded-full border border-border-subtle bg-bg-elevated/50 px-2.5 py-1 text-text-secondary">
              {card.principleName}
            </span>
            <span className="font-mono text-[10px] tracking-widest text-muted-foreground">{card.timeLabel}</span>
          </div>
          <div className="relative flex flex-1 flex-col items-center justify-center p-5">
            <div className="mb-5 h-28 w-28" style={{ filter: "drop-shadow(0 0 18px rgba(251,191,36,0.25))" }}>
              <SacredGeometry type={card.principleCode} glowIntensity={1} />
            </div>
            <h2 className="text-center font-cormorant text-xl leading-tight text-text-primary">{card.title}</h2>
            <HelpCircle size={12} className="mt-3 text-muted-foreground/40" />
          </div>
          <div className="flex items-center justify-center gap-2 border-t border-border-subtle bg-bg-base/40 px-4 py-3 text-muted-foreground">
            <RotateCw size={13} className="animate-pulse" />
            <span className="font-barlow text-[10px] font-medium uppercase tracking-[0.14em]">{t("pulse.reveal")}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
