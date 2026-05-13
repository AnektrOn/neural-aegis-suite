import { useState } from "react";
import { Eye } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger,
} from "@/components/ui/dialog";
import BreathworkWidget from "@/components/widgets/BreathworkWidget";
import FocusIntrospectifWidget from "@/components/widgets/FocusIntrospectifWidget";
import BodyScanWidget from "@/components/widgets/BodyScanWidget";
import AffirmationsWidget from "@/components/widgets/AffirmationsWidget";
import GratitudeWidget from "@/components/widgets/GratitudeWidget";
import JournalPromptWidget from "@/components/widgets/JournalPromptWidget";
import VisualizationWidget from "@/components/widgets/VisualizationWidget";
import StopProtocolWidget from "@/components/widgets/StopProtocolWidget";
import IntentionWidget from "@/components/widgets/IntentionWidget";
import MicroPracticeWidget from "@/components/widgets/MicroPracticeWidget";
import { useLanguage } from "@/i18n/LanguageContext";
import { pickLocalizedText } from "@/lib/content-i18n";
import type { Locale } from "@/i18n/translations";

interface PreviewArgs {
  contentType: string;
  title: string;
  description?: string | null;
  widgetConfig: any;
  externalUrl?: string | null;
}

export default function ToolboxItemPreview({
  contentType, title, description, widgetConfig, externalUrl,
}: PreviewArgs) {
  const [open, setOpen] = useState(false);
  const { t, locale } = useLanguage();
  const noop = () => {};
  const cfg = widgetConfig ?? {};

  const renderWidget = () => {
    switch (contentType) {
      case "breathwork":
        return widgetConfig ? <BreathworkWidget config={cfg} title={title} onComplete={noop} onAbandon={noop} /> : null;
      case "focus_introspectif":
        return widgetConfig ? <FocusIntrospectifWidget config={cfg} title={title} onComplete={noop} onAbandon={noop} /> : null;
      case "body_scan":
        return <BodyScanWidget config={cfg} title={title} onComplete={noop} onAbandon={noop} />;
      case "affirmations":
        if (cfg?.duration_min == null) return null;
        return <AffirmationsWidget config={cfg} title={title} onComplete={noop} onAbandon={noop} />;
      case "visualization":
        return <VisualizationWidget config={cfg} title={title} onComplete={noop} onAbandon={noop} />;
      case "stop_protocol":
        return <StopProtocolWidget config={cfg} title={title} onComplete={noop} onAbandon={noop} />;
      case "intention":
        return <IntentionWidget config={cfg} title={title} onComplete={noop} onAbandon={noop} />;
      case "gratitude":
        return <GratitudeWidget config={cfg} title={title} onComplete={noop} onAbandon={noop} />;
      case "micro_practice":
        return <MicroPracticeWidget config={cfg} title={title} onComplete={noop} onAbandon={noop} />;
      case "journal_prompt": {
        const prompt = pickLocalizedText(locale as Locale, cfg?.prompt_i18n, cfg?.prompt);
        if (!prompt?.trim()) return null;
        return <JournalPromptWidget config={{ ...cfg, prompt }} title={title} onComplete={noop} onAbandon={noop} />;
      }
      case "external_link":
        return externalUrl ? (
          <a href={externalUrl} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-primary underline">
            {externalUrl}
          </a>
        ) : <p className="text-sm text-muted-foreground">{t("toolbox.noContentAssigned")}</p>;
      default:
        return <p className="text-sm text-muted-foreground">No preview available for this type.</p>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="text-[9px] uppercase tracking-[0.2em] px-3 py-2 rounded-lg border border-border/40 text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-all shrink-0 flex items-center gap-1"
          title="Preview"
        >
          <Eye size={11} strokeWidth={1.5} />
          Preview
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>
        <div className="pt-2">{renderWidget()}</div>
      </DialogContent>
    </Dialog>
  );
}
