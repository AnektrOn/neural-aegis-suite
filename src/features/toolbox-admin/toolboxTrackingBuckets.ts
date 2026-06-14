import type { TranslationKey } from "@/i18n/translations";
import type { ToolboxTrackingBucket } from "@/services/toolboxAdminService";

export const BUCKET_ORDER: ToolboxTrackingBucket[] = [
  "pending",
  "missed",
  "completed",
  "reused",
  "routine",
  "ignored",
  "dropped",
];

export const BUCKET_KEYS: Record<ToolboxTrackingBucket, TranslationKey> = {
  completed: "admin.toolboxTracking.bucket.completed",
  ignored: "admin.toolboxTracking.bucket.ignored",
  missed: "admin.toolboxTracking.bucket.missed",
  reused: "admin.toolboxTracking.bucket.reused",
  dropped: "admin.toolboxTracking.bucket.dropped",
  routine: "admin.toolboxTracking.bucket.routine",
  pending: "admin.toolboxTracking.bucket.pending",
};

export const BUCKET_STYLES: Record<
  ToolboxTrackingBucket,
  { bar: string; badge: string; ring: string }
> = {
  completed: {
    bar: "bg-primary",
    badge: "bg-primary/15 text-primary border-primary/30",
    ring: "ring-primary/20",
  },
  reused: {
    bar: "bg-neural-accent",
    badge: "bg-neural-accent/15 text-neural-accent border-neural-accent/30",
    ring: "ring-neural-accent/20",
  },
  routine: {
    bar: "bg-neural-warm",
    badge: "bg-neural-warm/15 text-neural-warm border-neural-warm/30",
    ring: "ring-neural-warm/20",
  },
  ignored: {
    bar: "bg-muted-foreground/50",
    badge: "bg-muted text-muted-foreground border-border/50",
    ring: "ring-border/30",
  },
  dropped: {
    bar: "bg-destructive/70",
    badge: "bg-destructive/10 text-destructive border-destructive/30",
    ring: "ring-destructive/20",
  },
  missed: {
    bar: "bg-accent-warning",
    badge: "bg-accent-warning/15 text-accent-warning border-accent-warning/40",
    ring: "ring-accent-warning/25",
  },
  pending: {
    bar: "bg-primary/40",
    badge: "bg-secondary/80 text-text-secondary border-border/40",
    ring: "ring-border/20",
  },
};
