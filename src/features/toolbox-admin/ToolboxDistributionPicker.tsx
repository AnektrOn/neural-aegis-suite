import { useEffect, useState } from "react";
import { Users, User, Globe, BookOpen, Loader2 } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import {
  previewDistributionUserCount,
  TOOLBOX_USER_DELIVERY_STATUSES,
  type ToolboxDistributionInput,
  type ToolboxDistributionMode,
  type ToolboxUserDeliveryStatus,
} from "@/services/programBuilderService";
import {
  toolboxFieldClass,
  toolboxLabelClass,
} from "@/components/admin/toolbox/ToolboxAdminUi";
import { cn } from "@/lib/utils";

export interface ProfileOption {
  id: string;
  display_name: string | null;
}

export interface CompanyOption {
  id: string;
  name: string;
}

interface Props {
  profiles: ProfileOption[];
  companies?: CompanyOption[];
  value: ToolboxDistributionInput;
  onChange: (next: ToolboxDistributionInput) => void;
  className?: string;
}

const MODES: { id: ToolboxDistributionMode; icon: typeof User; labelKey: string }[] = [
  { id: "catalog", icon: BookOpen, labelKey: "admin.toolboxDist.modeCatalog" },
  { id: "individual", icon: User, labelKey: "admin.toolboxDist.modeIndividual" },
  { id: "group", icon: Users, labelKey: "admin.toolboxDist.modeGroup" },
  { id: "global", icon: Globe, labelKey: "admin.toolboxDist.modeGlobal" },
];

export default function ToolboxDistributionPicker({
  profiles,
  companies = [],
  value,
  onChange,
  className,
}: Props) {
  const { t } = useLanguage();
  const [previewCount, setPreviewCount] = useState<number | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  useEffect(() => {
    if (value.mode === "catalog") {
      setPreviewCount(null);
      return;
    }
    let cancelled = false;
    setPreviewLoading(true);
    void previewDistributionUserCount(value)
      .then((n) => {
        if (!cancelled) setPreviewCount(n);
      })
      .catch(() => {
        if (!cancelled) setPreviewCount(null);
      })
      .finally(() => {
        if (!cancelled) setPreviewLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [value]);

  const setMode = (mode: ToolboxDistributionMode) => onChange({ ...value, mode });

  return (
    <div className={cn("space-y-5", className)}>
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        {MODES.map(({ id, icon: Icon, labelKey }) => (
          <button
            key={id}
            type="button"
            onClick={() => setMode(id)}
            className={cn(
              "flex min-h-[52px] flex-col items-center justify-center gap-1 rounded-xl border px-3 py-3 text-center transition-colors",
              value.mode === id
                ? "border-primary/40 bg-primary/10 text-primary"
                : "border-border/50 bg-secondary/10 text-muted-foreground hover:border-primary/25",
            )}
          >
            <Icon className="size-4" strokeWidth={1.5} aria-hidden />
            <span className="text-[10px] uppercase tracking-[0.18em]">{t(labelKey as any)}</span>
          </button>
        ))}
      </div>

      {value.mode === "individual" ? (
        <div className="space-y-2">
          <label className={toolboxLabelClass}>{t("admin.toolboxDist.targetUser")}</label>
          <select
            className={toolboxFieldClass}
            value={value.userId || ""}
            onChange={(e) => onChange({ ...value, userId: e.target.value })}
          >
            <option value="">{t("admin.toolboxMgmt.catalogSelectUser")}</option>
            {profiles.map((p) => (
              <option key={p.id} value={p.id}>
                {p.display_name || p.id.slice(0, 8)}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      {value.mode === "group" ? (
        <div className="space-y-4">
          {companies.length > 0 ? (
            <div className="space-y-2">
              <label className={toolboxLabelClass}>{t("admin.toolboxDist.company")}</label>
              <select
                className={toolboxFieldClass}
                value={value.companyId || ""}
                onChange={(e) =>
                  onChange({
                    ...value,
                    companyId: e.target.value || undefined,
                    userIds: e.target.value ? [] : value.userIds,
                  })
                }
              >
                <option value="">{t("admin.toolboxDist.companyOptional")}</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
          <div className="space-y-2">
            <label className={toolboxLabelClass}>{t("admin.toolboxDist.usersMulti")}</label>
            <select
              multiple
              className={cn(toolboxFieldClass, "min-h-[120px]")}
              value={value.userIds || []}
              onChange={(e) => {
                const selected = Array.from(e.target.selectedOptions).map((o) => o.value);
                onChange({ ...value, userIds: selected, companyId: undefined });
              }}
            >
              {profiles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.display_name || p.id.slice(0, 8)}
                </option>
              ))}
            </select>
          </div>
        </div>
      ) : null}

      {value.mode === "global" ? (
        <div className="space-y-2">
          <label className={toolboxLabelClass}>{t("admin.toolboxDist.locale")}</label>
          <select
            className={toolboxFieldClass}
            value={value.locale || "all"}
            onChange={(e) =>
              onChange({
                ...value,
                locale: e.target.value as "fr" | "en" | "all",
              })
            }
          >
            <option value="all">{t("admin.toolboxDist.localeAll")}</option>
            <option value="fr">{t("admin.driveImport.scopeGlobalFr")}</option>
            <option value="en">{t("admin.driveImport.scopeGlobalEn")}</option>
          </select>
        </div>
      ) : null}

      <div className="space-y-2">
        <label className={toolboxLabelClass}>{t("admin.toolboxDist.deliveryStatus")}</label>
        <select
          className={toolboxFieldClass}
          value={value.assignmentStatus || "active"}
          onChange={(e) =>
            onChange({
              ...value,
              assignmentStatus: e.target.value as ToolboxUserDeliveryStatus,
            })
          }
        >
          {TOOLBOX_USER_DELIVERY_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {value.mode !== "catalog" ? (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          {previewLoading ? <Loader2 className="size-4 animate-spin" /> : null}
          {previewCount !== null
            ? t("admin.toolboxDist.previewCount", { count: String(previewCount) })
            : null}
        </p>
      ) : (
        <p className="text-sm text-muted-foreground">{t("admin.toolboxDist.catalogHint")}</p>
      )}
    </div>
  );
}
