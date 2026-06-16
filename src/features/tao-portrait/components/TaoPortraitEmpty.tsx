import { FileQuestion, Sparkles, TreePine } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import {
  POLE_PART_META,
  WU_XING_META,
  type PolePartId,
  type WuXingPole,
} from "../domain/types";

interface TaoPortraitEmptyProps {
  variant: "pole" | "part" | "t2";
  pole?: WuXingPole;
  partId?: PolePartId;
}

export function TaoPortraitEmpty({ variant, pole = "wood", partId }: TaoPortraitEmptyProps) {
  const { locale, t } = useLanguage();
  const isFR = locale === "fr";

  const poleMeta = pole !== "transversal" ? WU_XING_META[pole] : null;
  const partMeta = partId ? POLE_PART_META[partId] : null;

  let title = t("tao.portrait.empty.title");
  let body = t("tao.portrait.empty.body");

  if (variant === "t2") {
    title = t("tao.portrait.empty.t2Title");
    body = t("tao.portrait.empty.t2Body");
  } else if (variant === "part" && partMeta) {
    title = isFR
      ? `${partMeta.code} — ${partMeta.label_fr}`
      : `${partMeta.code} — ${partMeta.label_en}`;
    body = t("tao.portrait.empty.partBody");
  } else if (variant === "pole" && poleMeta) {
    title = isFR
      ? `${poleMeta.emoji} ${poleMeta.label_fr}`
      : `${poleMeta.emoji} ${poleMeta.label_en}`;
    body = t("tao.portrait.empty.poleBody");
  }

  const Icon = variant === "t2" ? Sparkles : variant === "part" ? FileQuestion : TreePine;

  return (
    <div className="flex flex-col items-center justify-center text-center py-12 px-6 min-h-[200px]">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted/50 text-muted-foreground">
        <Icon size={22} strokeWidth={1.5} aria-hidden />
      </div>
      <p className="font-display text-sm font-medium text-foreground">{title}</p>
      <p className="mt-2 max-w-sm text-xs text-muted-foreground leading-relaxed font-body">{body}</p>
    </div>
  );
}
