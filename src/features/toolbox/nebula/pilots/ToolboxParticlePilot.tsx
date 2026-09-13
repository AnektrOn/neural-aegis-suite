import type { StopProtocolConfig } from "@/components/widgets/StopProtocolWidget";
import type { VisualizationConfig } from "@/components/widgets/VisualizationWidget";
import type { ToolboxRenderableItem } from "@/lib/toolbox-renderer-registry";
import { JOURNAL_NEBULA_SLUGS } from "../toolboxJournalNebula";
import { resolveMatterBreathConfig } from "../resolveMatterBreathConfig";
import type { ToolboxNebulaPilotProps } from "./toolboxNebulaPilotTypes";
import { ToolboxParticleBreathwork } from "./ToolboxParticleBreathwork";
import { ToolboxParticleGeneric } from "./ToolboxParticleGeneric";
import { ToolboxParticleJournal } from "./ToolboxParticleJournal";
import { ToolboxParticleStop } from "./ToolboxParticleStop";
import { ToolboxParticleVisualization } from "./ToolboxParticleVisualization";

const BREATH_SLUGS = new Set([
  "breathwork",
  "breath_box",
  "breath_coherence",
  "physiological_sigh",
  "vagal_hum",
]);
const STOP_SLUGS = new Set(["stop_protocol", "stop_rumination"]);
const VIZ_SLUGS = new Set(["visualization", "safe_place"]);

interface ToolboxParticlePilotProps extends ToolboxNebulaPilotProps {
  item: ToolboxRenderableItem;
}

export function ToolboxParticlePilot({
  slug,
  item,
  locale,
  embedded,
  variant = "panel",
  sessionKey,
  onComplete,
  onAbandon,
}: ToolboxParticlePilotProps) {
  const cfg = item.widget_config as Record<string, unknown>;
  const title = item.title;
  const shared = { locale, embedded, variant, sessionKey, onComplete, onAbandon };

  if (BREATH_SLUGS.has(slug)) {
    return (
      <ToolboxParticleBreathwork
        config={resolveMatterBreathConfig(slug, cfg)}
        title={title}
        {...shared}
      />
    );
  }

  if (STOP_SLUGS.has(slug)) {
    return (
      <ToolboxParticleStop
        config={cfg as unknown as StopProtocolConfig}
        title={title}
        {...shared}
      />
    );
  }

  if (VIZ_SLUGS.has(slug)) {
    return (
      <ToolboxParticleVisualization
        config={cfg as unknown as VisualizationConfig}
        title={title}
        {...shared}
      />
    );
  }

  if (JOURNAL_NEBULA_SLUGS.has(slug)) {
    return (
      <ToolboxParticleJournal
        slug={slug}
        config={cfg}
        title={title}
        journal={{ slug, title }}
        embedded={embedded}
        variant={variant}
        sessionKey={sessionKey}
        onComplete={onComplete}
        onAbandon={onAbandon}
      />
    );
  }

  return (
    <ToolboxParticleGeneric slug={slug} item={item} locale={locale} embedded={embedded} variant={variant} sessionKey={sessionKey} onComplete={onComplete} onAbandon={onAbandon} />
  );
}
