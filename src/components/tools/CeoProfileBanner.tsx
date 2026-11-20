import { Link } from "react-router-dom";
import { UserRound } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import {
  CEO_ARCHETYPE_LABELS,
  CEO_STAGE_LABELS,
  getCeoProfile,
  hasCeoProfile,
} from "@/lib/tools/ceoProfile";
import { cn } from "@/lib/utils";
import { toolsSecondaryButton } from "./toolsDesign";

export function CeoProfileBanner({
  className,
  onEdit,
}: {
  className?: string;
  onEdit?: () => void;
}) {
  const { t } = useLanguage();
  const profile = getCeoProfile();
  if (!profile) {
    return (
      <button type="button" onClick={onEdit} className={cn(toolsSecondaryButton, "border-dashed", className)}>
        <UserRound className="h-3.5 w-3.5" aria-hidden />
        {t("tools.calibrateMyProfile")}
      </button>
    );
  }

  return (
    <Link
      to="/tools/profile"
      className={cn(toolsSecondaryButton, "max-w-[min(100%,18rem)] truncate", className)}
      title={hasCeoProfile() ? "Voir mon profil décisionnel" : undefined}
    >
      <UserRound className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
      <span className="truncate">
        {CEO_ARCHETYPE_LABELS[profile.archetype]} · {CEO_STAGE_LABELS[profile.stage]}
      </span>
    </Link>
  );
}