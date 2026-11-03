import { useLanguage } from "@/i18n/LanguageContext";
import type { PulseCard } from "@/features/aegis-pulse/domain/types";
import { getRuneAccent } from "@/features/aegis-pulse/domain/runeAccent";
import { SacredGeometry } from "@/features/aegis-pulse/components/SacredGeometry";

type Props = {
  card: PulseCard;
};

/** Recto Pulse (swipe deck) — scaled for practices hub lab vedette. */
export function PracticesHubLabPulseMiniCard({ card }: Props) {
  const { t } = useLanguage();
  const accent = getRuneAccent(card.principleCode);

  return (
    <article
      className="practices-hub-lab__pulse-card overflow-hidden rounded-[18px] border border-border-subtle bg-bg-surface text-left select-none"
      style={{
        boxShadow: `0 4px 28px hsl(0 0% 0% / 0.32), 0 0 24px hsla(${accent} / 0.06), inset 0 1px 0 hsl(var(--foreground) / 0.04)`,
      }}
    >
      <div className="relative flex items-center justify-between px-3 py-2">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{ background: `linear-gradient(135deg, hsla(${accent} / 0.4), transparent 60%)` }}
        />
        <span className="relative font-barlow text-[9px] font-medium uppercase tracking-[0.12em] text-text-secondary">
          {card.principleName}
        </span>
        <span className="relative font-mono text-[9px] tracking-widest text-muted-foreground">
          {card.timeLabel}
        </span>
      </div>

      <div className="relative flex flex-col items-center px-3 pb-3 pt-1">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{ background: `radial-gradient(circle at 50% 40%, hsla(${accent} / 0.5), transparent 70%)` }}
        />
        <div className="relative mb-2 h-16 w-16" style={{ filter: "drop-shadow(0 0 12px rgba(251,191,36,0.2))" }}>
          <SacredGeometry type={card.principleCode} glowIntensity={0.85} />
        </div>
        <h3 className="relative text-center font-cormorant text-base leading-tight text-text-primary line-clamp-3">
          {card.title}
        </h3>
      </div>

      <div className="border-t border-border-subtle bg-bg-base/40 px-3 py-2 text-center">
        <span className="font-barlow text-[9px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
          {t("pulse.reveal")}
        </span>
      </div>
    </article>
  );
}
