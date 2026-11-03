import { useLanguage } from "@/i18n/LanguageContext";
import { TOOLBOX_TYPE_META } from "@/lib/toolbox-renderer-registry";
import type { PracticesHubToolboxFeatured } from "@/features/practices-hub/services/fetchPracticesHubToolboxFeatured";
import type { TranslationKey } from "@/i18n/translations";

type Props = {
  featured: PracticesHubToolboxFeatured;
  loading: boolean;
};

export function PracticesHubLabFeaturedToolbox({ featured, loading }: Props) {
  const { t } = useLanguage();

  if (loading) {
    return <p className="practices-hub-lab__feat-muted font-barlow">…</p>;
  }

  if (!featured) {
    return <p className="practices-hub-lab__feat-muted font-barlow">{t("hub.practices.toolboxNone")}</p>;
  }

  const meta = TOOLBOX_TYPE_META[featured.contentType];
  const typeLabel = meta ? t(meta.labelKey as TranslationKey) : featured.contentType;

  return (
    <div className="practices-hub-lab__feat-toolbox font-barlow">
      <p className="practices-hub-lab__feat-kicker">{typeLabel}</p>
      <p className="practices-hub-lab__feat-lead">{featured.title}</p>
      {featured.description ? (
        <p className="practices-hub-lab__feat-body">{featured.description}</p>
      ) : null}
    </div>
  );
}
