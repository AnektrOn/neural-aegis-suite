import { ArrowUpRight, ChevronRight, MessageSquare, Sparkles, Wrench } from "lucide-react";
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import type { BioExecutiveViewModel } from "./types";
import { BioExecutivePreviewTileDots, type PreviewSlideChrome } from "./BioExecutivePreviewTileDots";
import { mergeCarouselSlideArticleProps } from "./bioExecutiveCarouselSlide";

type ActionTileProps = {
  viewModel: BioExecutiveViewModel;
  className?: string;
  slideProps?: { "data-bento-slide"?: number };
  previewSlideChrome?: PreviewSlideChrome;
};

function actionTileClass(tone: string, extra?: string) {
  return cn(
    "aegis-bio-exec-lab__color-tile relative flex flex-col justify-between overflow-hidden rounded-[24px] p-4",
    tone,
    extra,
  );
}

export function BioExecutiveSignalBanner({ viewModel, className }: { viewModel: BioExecutiveViewModel; className?: string }) {
  const msg = viewModel.adminMessage;
  if (!msg || msg.isRead) return null;

  return (
    <NavLink
      to="/messages"
      className={cn(
        "aegis-bio-exec-lab__signal-banner flex min-h-[44px] items-center gap-2 rounded-[16px] border px-3 py-2.5 no-underline transition-opacity hover:opacity-95",
        className,
      )}
    >
      <MessageSquare size={16} className="shrink-0 opacity-80" aria-hidden />
      <span className="min-w-0 flex-1 truncate aegis-bio-exec-lab__type-body font-medium">{msg.subject}</span>
      <ChevronRight size={16} className="shrink-0 opacity-70" aria-hidden />
    </NavLink>
  );
}

export function BioExecutiveDecisionActionTile({ viewModel, className, slideProps, previewSlideChrome }: ActionTileProps) {
  const d = viewModel.pendingDecision;
  const count = viewModel.pendingDecisionCount;
  const empty = !d;

  return (
    <article
      {...mergeCarouselSlideArticleProps(slideProps)}
      className={actionTileClass(
        "aegis-bio-exec-lab__color-tile--decision sm:p-5 min-h-[210px] lg:min-h-[280px] lg:row-span-2",
        className,
      )}
    >
      <div className="z-10 flex items-start justify-between aegis-bio-exec-lab__type-body opacity-90">
        <span className="font-medium">Décision en attente</span>
        {count > 0 ? (
          <span className="aegis-bio-exec-lab__type-label-caps aegis-bio-exec-lab__tile-kicker">{count}</span>
        ) : null}
      </div>

      {empty ? (
        <div className="z-10 my-auto space-y-1">
          <p className="aegis-bio-exec-lab__type-body font-medium">Aucune décision en attente</p>
          <p className="aegis-bio-exec-lab__type-label opacity-70">Clair pour aujourd&apos;hui</p>
        </div>
      ) : (
        <>
          <div className="z-10 mt-2 space-y-2">
            <p className="aegis-bio-exec-lab__type-body text-[15px] font-medium leading-snug">{d.name}</p>
            <p className="aegis-bio-exec-lab__type-label opacity-80">Il te reste cette décision à prendre.</p>
            <p className="aegis-bio-exec-lab__type-label opacity-75">
              Depuis {d.ageDays} j
              {d.priority >= 2 ? " · Prioritaire" : ""}
            </p>
          </div>
          {viewModel.journalSnippet ? (
            <p className="z-10 mt-2 line-clamp-2 aegis-bio-exec-lab__type-label opacity-65">
              « {viewModel.journalSnippet} »
            </p>
          ) : null}
        </>
      )}

      <NavLink
        to="/decisions"
        className="z-10 mt-3 inline-flex min-h-[44px] items-center gap-1 aegis-bio-exec-lab__type-label font-semibold aegis-bio-exec-lab__accent-text no-underline"
      >
        <span>Voir les décisions</span>
        <ArrowUpRight size={14} />
      </NavLink>
      {previewSlideChrome ? <BioExecutivePreviewTileDots {...previewSlideChrome} /> : null}
    </article>
  );
}

export function BioExecutivePulseActionTile({ viewModel, className, slideProps, previewSlideChrome }: ActionTileProps) {
  const card = viewModel.pulseCard;

  return (
    <article
      {...mergeCarouselSlideArticleProps(slideProps)}
      className={actionTileClass("aegis-bio-exec-lab__color-tile--pulse min-h-[148px]", className)}
    >
      <div className="z-10 flex items-center justify-between aegis-bio-exec-lab__type-body opacity-90">
        <span className="font-medium">Pulse du jour</span>
        <Sparkles size={14} className="opacity-80" aria-hidden />
      </div>

      {card ? (
        <>
          <div className="z-10 mt-2 flex flex-wrap items-center gap-2">
            {card.isNew ? (
              <span className="rounded-full bg-[color-mix(in_srgb,var(--accent)_22%,transparent)] px-2 py-0.5 aegis-bio-exec-lab__type-label-caps">
                Nouveau
              </span>
            ) : null}
            <span className="aegis-bio-exec-lab__type-label opacity-70">{card.addedLabel}</span>
          </div>
          <p className="z-10 mt-2 line-clamp-3 aegis-bio-exec-lab__type-body font-medium leading-snug">{card.title}</p>
        </>
      ) : (
        <p className="z-10 my-auto aegis-bio-exec-lab__type-label opacity-75">Aucune carte aujourd&apos;hui</p>
      )}

      <NavLink
        to="/pulse"
        className="z-10 mt-2 inline-flex min-h-[44px] items-center gap-1 aegis-bio-exec-lab__type-label font-semibold aegis-bio-exec-lab__accent-text no-underline"
      >
        <span>Ouvrir le deck</span>
        <ChevronRight size={14} />
      </NavLink>
      {previewSlideChrome ? <BioExecutivePreviewTileDots {...previewSlideChrome} /> : null}
    </article>
  );
}

export function BioExecutiveToolboxActionTile({ viewModel, className, slideProps, previewSlideChrome }: ActionTileProps) {
  const inbox = viewModel.toolboxInbox;
  const nextTitle = inbox.nextItem?.title;

  return (
    <article
      {...mergeCarouselSlideArticleProps(slideProps)}
      className={actionTileClass("aegis-bio-exec-lab__color-tile--toolbox min-h-[148px]", className)}
    >
      <div className="z-10 flex items-center justify-between aegis-bio-exec-lab__type-body opacity-90">
        <span className="font-medium">Toolbox</span>
        <Wrench size={14} className="opacity-80" aria-hidden />
      </div>

      <p className="z-10 mt-2 line-clamp-2 aegis-bio-exec-lab__type-body font-medium">
        {nextTitle ?? (inbox.missing > 0 ? `${inbox.missing} outil(s) en attente` : "Inbox claire")}
      </p>

      <div className="z-10 mt-2 flex flex-wrap gap-x-2 gap-y-1 aegis-bio-exec-lab__type-label opacity-75">
        <span>Nouveau {inbox.newer}</span>
        <span>·</span>
        <span>En attente {inbox.missing}</span>
        <span>·</span>
        <span>Favoris {inbox.favorites}</span>
      </div>

      <NavLink
        to="/toolbox"
        className="z-10 mt-2 inline-flex min-h-[44px] items-center gap-1 aegis-bio-exec-lab__type-label font-semibold aegis-bio-exec-lab__accent-text no-underline"
      >
        <span>Ouvrir</span>
        <ArrowUpRight size={14} />
      </NavLink>
      {previewSlideChrome ? <BioExecutivePreviewTileDots {...previewSlideChrome} /> : null}
    </article>
  );
}
