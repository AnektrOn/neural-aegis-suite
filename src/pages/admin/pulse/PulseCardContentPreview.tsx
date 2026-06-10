import { useState } from "react";
import { FileText, Globe } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { PulseCardRow } from "./pulseAdminService";

type LocaleKey = "fr" | "en";

const PRINCIPLE_COLORS: Record<string, string> = {
  MENTALISM: "text-violet-400 border-violet-400/30",
  CORRESPONDENCE: "text-blue-400 border-blue-400/30",
  VIBRATION: "text-emerald-400 border-emerald-400/30",
  POLARITY: "text-orange-400 border-orange-400/30",
  RHYTHM: "text-pink-400 border-pink-400/30",
  CAUSE_EFFECT: "text-amber-400 border-amber-400/30",
  GENDER: "text-teal-400 border-teal-400/30",
};

function pickI18n(map: Record<string, string> | undefined, locale: LocaleKey): string {
  if (!map) return "—";
  return map[locale] || map.fr || map.en || "—";
}

function pickBullets(map: Record<string, string[]> | undefined, locale: LocaleKey): string[] {
  if (!map) return [];
  return map[locale] ?? map.fr ?? map.en ?? [];
}

interface PulseCardContentPreviewProps {
  card: PulseCardRow;
  defaultLocale?: LocaleKey;
  className?: string;
}

export function PulseCardContentPreview({
  card,
  defaultLocale = "fr",
  className,
}: PulseCardContentPreviewProps) {
  const [locale, setLocale] = useState<LocaleKey>(defaultLocale);

  const title = pickI18n(card.title_i18n, locale);
  const format = pickI18n(card.format_i18n, locale);
  const problem = pickI18n(card.problem_i18n, locale);
  const bullets = pickBullets(card.bullets_i18n, locale);
  const course = card.course_content_i18n?.[locale] ?? card.course_content_i18n?.fr ?? card.course_content_i18n?.en;

  return (
    <div
      className={cn(
        "rounded-xl border border-border-subtle bg-bg-elevated/40 p-4 sm:p-5 space-y-4 text-sm",
        className,
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="outline"
              className={cn("text-[10px]", PRINCIPLE_COLORS[card.principle_code ?? ""] ?? "")}
            >
              {card.principle_code}
            </Badge>
            {!card.is_active ? (
              <Badge variant="secondary" className="text-[10px]">
                Draft
              </Badge>
            ) : null}
            {card.content_type && card.content_type !== "card" ? (
              <Badge variant="outline" className="text-[10px] text-violet-400 border-violet-400/30">
                {card.content_type}
              </Badge>
            ) : null}
          </div>
          <h3 className="font-cormorant text-xl text-text-primary leading-tight">{title}</h3>
          <p className="text-[11px] text-muted-foreground font-mono">
            {card.external_key ?? "—"} · {card.time_label} · #{card.sort_order}
          </p>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <Globe className="size-3.5 text-muted-foreground mr-1" aria-hidden />
          {(["fr", "en"] as const).map((loc) => (
            <Button
              key={loc}
              type="button"
              variant={locale === loc ? "default" : "outline"}
              size="sm"
              className="h-7 px-2 text-[10px] uppercase tracking-wider"
              onClick={() => setLocale(loc)}
            >
              {loc}
            </Button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
        <FileText className="size-3.5 shrink-0" aria-hidden />
        <span className="uppercase tracking-wider">{format}</span>
      </div>

      {(card.archetype_targets?.length ?? 0) > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {card.archetype_targets.map((a) => (
            <Badge key={a} variant="outline" className="text-[10px] border-accent-primary/30 text-accent-primary">
              {a}
            </Badge>
          ))}
        </div>
      ) : null}

      <div className="space-y-2">
        <p className="font-display text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Question</p>
        <p className="font-cormorant italic text-text-primary leading-relaxed border-l-2 border-primary/30 pl-3">
          &ldquo;{problem}&rdquo;
        </p>
      </div>

      {bullets.length > 0 ? (
        <div className="space-y-2">
          <p className="font-display text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Enseignement</p>
          <ul className="space-y-2">
            {bullets.map((bullet, idx) => (
              <li key={idx} className="flex gap-2 text-text-secondary leading-relaxed">
                <span className="mt-2 size-1 shrink-0 rounded-full bg-primary/70" aria-hidden />
                <span>{bullet}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {course && (course.hook || course.concept || course.action) ? (
        <div className="space-y-3 rounded-lg border border-border-subtle bg-bg-base/50 p-3">
          <p className="font-display text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Cours</p>
          {course.hook ? (
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Hook</p>
              <p className="text-text-secondary leading-relaxed">{course.hook}</p>
            </div>
          ) : null}
          {course.concept ? (
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Concept</p>
              <p className="text-text-secondary leading-relaxed">{course.concept}</p>
            </div>
          ) : null}
          {course.action ? (
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Action</p>
              <p className="text-text-secondary leading-relaxed">{course.action}</p>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
