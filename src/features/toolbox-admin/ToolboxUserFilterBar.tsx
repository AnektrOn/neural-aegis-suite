import { Search } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { toolboxFieldClass } from "@/components/admin/toolbox/ToolboxAdminUi";
import { cn } from "@/lib/utils";

interface Profile {
  id: string;
  display_name: string | null;
}

interface Props {
  profiles: Profile[];
  search: string;
  onSearchChange: (value: string) => void;
  selectedUserId: string | null;
  onSelectedUserChange: (userId: string | null) => void;
  searchId?: string;
  hideUserSelect?: boolean;
}

export default function ToolboxUserFilterBar({
  profiles,
  search,
  onSearchChange,
  selectedUserId,
  onSelectedUserChange,
  searchId = "toolbox-user-search",
  hideUserSelect = false,
}: Props) {
  const { t } = useLanguage();

  return (
    <div
      className={
        hideUserSelect
          ? "ethereal-glass p-4 lg:p-5"
          : "ethereal-glass grid gap-3 p-4 lg:p-5 md:grid-cols-[2fr_1fr]"
      }
    >
      <div className="relative">
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
      {hideUserSelect ? null : (
        <select
          className={toolboxFieldClass}
          value={selectedUserId ?? ""}
          onChange={(e) => onSelectedUserChange(e.target.value || null)}
        >
          <option value="">{t("admin.toolboxMgmt.filterAllUsers")}</option>
          {profiles.map((profile) => (
            <option key={profile.id} value={profile.id}>
              {profile.display_name || profile.id.slice(0, 8)}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
