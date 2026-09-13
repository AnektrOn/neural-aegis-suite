import type { Locale } from "@/i18n/translations";
import type { ToolboxOnAbandon, ToolboxOnComplete } from "@/lib/toolbox-completion";
import type { ToolboxRenderableItem } from "@/lib/toolbox-renderer-registry";

export interface ToolboxNebulaPilotProps {
  slug: string;
  item: ToolboxRenderableItem;
  locale: Locale;
  embedded?: boolean;
  variant?: "modal" | "panel";
  sessionKey?: string;
  onComplete?: ToolboxOnComplete;
  onAbandon?: ToolboxOnAbandon;
}
