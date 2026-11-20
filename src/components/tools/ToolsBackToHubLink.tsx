import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/i18n/LanguageContext";
import { toolsSecondaryButton } from "./toolsDesign";

export function ToolsBackToHubLink({ className }: { className?: string }) {
  const { t } = useLanguage();
  return (
    <Link to="/tools" className={cn(toolsSecondaryButton, className)}>
      <ArrowLeft className="h-3.5 w-3.5 shrink-0" aria-hidden />
      {t("tools.backToTools")}
    </Link>
  );
}