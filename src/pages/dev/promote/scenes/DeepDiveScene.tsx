import { archLabel } from "@/features/archetype-deepdive-v2/domain/narrativeContent";
import { SAMPLE_PROFILE_LEADER } from "@/features/archetype-deepdive-v2/domain/sampleProfile";
import { useLanguage } from "@/i18n/LanguageContext";
import { cn } from "@/lib/utils";
import { PROMOTE_USER, copy } from "../promoteDemoData";
import { usePromotePlayer } from "../PromotePlayerContext";

const PROFILE = {
  ...SAMPLE_PROFILE_LEADER,
  id: "promote-john",
  label: `${PROMOTE_USER.firstName} ${PROMOTE_USER.lastName}`,
};

const RANK_LABEL = {
  dominant: { fr: "Dominant", en: "Dominant" },
  secondaire: { fr: "Secondaire", en: "Secondary" },
  tertiaire: { fr: "Tertiaire", en: "Tertiary" },
} as const;

const ACCENT: Record<string, string> = {
  warrior: "border-rose-400/35 bg-rose-500/10 text-rose-200",
  sovereign: "border-amber-400/35 bg-amber-500/10 text-amber-200",
  mystic: "border-indigo-400/35 bg-indigo-500/10 text-indigo-200",
};

export function DeepDiveScene() {
  const { isFR } = usePromotePlayer();
  const { locale } = useLanguage();
  const n = PROFILE.narrative;
  const practice = n.practices[0];

  return (
    <div className="space-y-4 pb-8 pt-2">
      <p className="font-display text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Deep Dive</p>
      <h1 className="font-cormorant text-[1.85rem] font-light leading-tight">
        {`Portrait — ${PROMOTE_USER.firstName}`}
      </h1>
      <p className="font-display text-[11px] uppercase tracking-[0.18em] text-primary/85">
        {n.archetypeBlocks.map((b) => archLabel(b.archetype, locale)).join(" · ")}
      </p>

      <div className="dashboard-panel p-4">
        <p className="font-cormorant text-[1.05rem] font-light leading-relaxed text-foreground">
          {n.overviewLead}
        </p>
      </div>

      <div className="space-y-2.5">
        <p className="font-display text-[10px] uppercase tracking-[0.16em] text-text-tertiary">
          {copy(isFR, "Alliance lumière", "Light alliance")}
        </p>
        {n.archetypeBlocks.map((block, index) => (
          <div key={block.archetype} className="dashboard-panel px-4 py-3.5">
            <div className="flex items-start gap-3">
              <span
                className={cn(
                  "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border font-display text-xs",
                  ACCENT[block.archetype] ?? "border-white/15 bg-white/5 text-foreground",
                )}
              >
                {index + 1}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="font-display text-[12px] uppercase tracking-[0.14em] text-foreground">
                    {archLabel(block.archetype, locale)}
                  </p>
                  <span className="shrink-0 font-display text-[9px] uppercase tracking-[0.14em] text-muted-foreground">
                    {RANK_LABEL[block.rank][locale === "fr" ? "fr" : "en"]}
                  </span>
                </div>
                <p className="mt-1.5 text-[13px] leading-snug text-muted-foreground">{block.tagline}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="dashboard-panel border-accent-warning/20 p-4">
        <p className="font-display text-[10px] uppercase tracking-[0.16em] text-accent-warning/90">
          {copy(isFR, "Ombre dominante", "Dominant shadow")}
        </p>
        <p className="mt-2 text-sm font-medium leading-snug text-foreground">{n.primaryShadowTheme}</p>
        <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">{n.vigilance[0]}</p>
      </div>

      {practice ? (
        <div className="dashboard-panel p-4">
          <p className="font-display text-[10px] uppercase tracking-[0.16em] text-text-tertiary">
            {copy(isFR, "Pratique", "Practice")}
          </p>
          <p className="mt-2 font-barlow text-[15px] text-foreground">{practice.title}</p>
          <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">{practice.description}</p>
        </div>
      ) : null}
    </div>
  );
}
