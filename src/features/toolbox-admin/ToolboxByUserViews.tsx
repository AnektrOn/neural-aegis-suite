import { Search } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import type { TranslationKey } from "@/i18n/translations";
import { toolboxFieldClass } from "@/components/admin/toolbox/ToolboxAdminUi";
import type { ToolboxTrackingBucket } from "@/services/toolboxAdminService";
import { cn } from "@/lib/utils";
import { BUCKET_KEYS, BUCKET_ORDER } from "@/features/toolbox-admin/toolboxTrackingBuckets";

interface Props {
  search: string;
  onSearchChange: (value: string) => void;
  filterType: string;
  onFilterTypeChange: (value: string) => void;
  typeOptions: string[];
  searchId?: string;
  typeSelectId?: string;
  hideTypeFilter?: boolean;
}

export function ToolboxListToolbar({
  search,
  onSearchChange,
  filterType,
  onFilterTypeChange,
  typeOptions,
  searchId = "toolbox-list-search",
  typeSelectId = "toolbox-list-type",
  hideTypeFilter = false,
}: Props) {
  const { t } = useLanguage();

  return (
    <div className="ethereal-glass flex flex-col gap-3 p-4 lg:flex-row lg:items-center lg:p-5">
      <div className="relative min-w-0 flex-1">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <input
          id={searchId}
          className={cn(toolboxFieldClass, "pl-10")}
          placeholder={t("admin.toolboxMgmt.searchPlaceholder")}
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
      {!hideTypeFilter ? (
        <div className="w-full lg:w-56">
          <label htmlFor={typeSelectId} className="sr-only">
            {t("admin.toolboxMgmt.filterByType")}
          </label>
          <select
            id={typeSelectId}
            className={toolboxFieldClass}
            value={filterType}
            onChange={(e) => onFilterTypeChange(e.target.value)}
          >
            {typeOptions.map((type) => (
              <option key={type} value={type}>
                {type === "all" ? t("admin.toolboxMgmt.filterAllTypes") : type}
              </option>
            ))}
          </select>
        </div>
      ) : null}
    </div>
  );
}

export function ToolboxBucketFilterBar({
  counts,
  activeBucket,
  onBucketChange,
}: {
  counts: Record<ToolboxTrackingBucket, number>;
  activeBucket: ToolboxTrackingBucket | "all";
  onBucketChange: (bucket: ToolboxTrackingBucket | "all") => void;
}) {
  const { t } = useLanguage();

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-7">
      {BUCKET_ORDER.map((bucket) => (
        <button
          key={bucket}
          type="button"
          onClick={() => onBucketChange(activeBucket === bucket ? "all" : bucket)}
          className={cn(
            "ethereal-glass min-h-[72px] rounded-xl border p-3 text-left transition-colors",
            activeBucket === bucket ? "border-primary/40 ring-1 ring-primary/20" : "border-border/40",
          )}
          aria-pressed={activeBucket === bucket}
        >
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            {t(BUCKET_KEYS[bucket] as TranslationKey)}
          </p>
          <p className="text-xl font-semibold tabular-nums text-text-primary">{counts[bucket]}</p>
        </button>
      ))}
    </div>
  );
}

export function ToolboxUserDirectoryCard({
  userName,
  userId,
  toolCount,
  typeCount,
  onSelect,
}: {
  userName: string;
  userId: string;
  toolCount: number;
  typeCount: number;
  onSelect: () => void;
}) {
  const { t } = useLanguage();

  return (
    <button
      type="button"
      onClick={onSelect}
      className="ethereal-glass group flex h-full min-h-[140px] flex-col rounded-2xl border border-border/40 p-5 text-left transition-all hover:border-primary/30 hover:ring-1 hover:ring-primary/15"
    >
      <p className="truncate text-base font-semibold text-text-primary group-hover:text-primary">
        {userName}
      </p>
      <p className="mt-1 truncate font-mono text-xs text-muted-foreground">{userId}</p>
      <div className="mt-auto flex flex-wrap gap-3 pt-4 text-sm text-muted-foreground">
        <span>
          {toolCount} {t("admin.toolboxMgmt.colToolCount").toLowerCase()}
        </span>
        <span>
          {typeCount} {t("admin.toolboxMgmt.statTypes").toLowerCase()}
        </span>
      </div>
      <span className="mt-3 text-xs font-medium uppercase tracking-wider text-primary">
        {t("admin.toolboxMgmt.viewUserTools")}
      </span>
    </button>
  );
}

export function ToolboxToolRowIcon({ icon: Icon, className }: { icon: LucideIcon; className?: string }) {
  return (
    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted/50">
      <Icon className={cn("size-4", className)} strokeWidth={1.5} aria-hidden />
    </div>
  );
}
