import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, Map, ExternalLink, Eye, Search, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import CartographyFolderImportTab from "@/components/admin/cartography/CartographyFolderImportTab";
import {
  listAllCartographyBundles,
  setCartographyBundleStatus,
  deleteCartographyForUser,
  type CartographyBundleListItem,
} from "@/services/cartographyService";
import { poleToPath, modeToPath } from "@/lib/archetype-cartography/registry";
import type { ArchetypePole, AnalysisMode } from "@/lib/archetype-cartography/types";
import { POLE_THEMES } from "@/lib/archetype-cartography/pole-theme";

interface Profile {
  id: string;
  display_name: string | null;
}

function profileName(profiles: Profile[], userId: string): string {
  const p = profiles.find((pr) => pr.id === userId);
  return p?.display_name?.trim() || userId.slice(0, 8);
}

export default function CartographyManagement() {
  const { t, locale } = useLanguage();
  const isFR = locale === "fr";
  const dateLocale = isFR ? "fr-FR" : "en-US";
  const { toast } = useToast();

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [bundles, setBundles] = useState<CartographyBundleListItem[]>([]);
  const [filterUserId, setFilterUserId] = useState("");
  const [search, setSearch] = useState("");
  const [loadingProfiles, setLoadingProfiles] = useState(true);
  const [loadingBundles, setLoadingBundles] = useState(true);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);

  const loadProfiles = useCallback(async () => {
    setLoadingProfiles(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, display_name")
        .order("display_name");

      if (error) throw new Error(error.message);
      setProfiles((data as Profile[]) ?? []);
    } catch (err) {
      console.error("[CartographyManagement] profiles", err);
      toast({
        title: t("toast.error"),
        description: t("admin.cartography.loadUsersError"),
        variant: "destructive",
      });
    } finally {
      setLoadingProfiles(false);
    }
  }, [t, toast]);

  const loadBundles = useCallback(async () => {
    setLoadingBundles(true);
    try {
      const rows = await listAllCartographyBundles();
      setBundles(rows);
    } catch (err) {
      toast({
        title: t("toast.error"),
        description: err instanceof Error ? err.message : String(err),
        variant: "destructive",
      });
    } finally {
      setLoadingBundles(false);
    }
  }, [t, toast]);

  useEffect(() => {
    loadProfiles();
  }, [loadProfiles]);

  useEffect(() => {
    loadBundles();
  }, [loadBundles]);

  const filteredBundles = useMemo(() => {
    const q = search.trim().toLowerCase();
    return bundles.filter((b) => {
      if (filterUserId && b.userId !== filterUserId) return false;
      if (!q) return true;
      const name = profileName(profiles, b.userId).toLowerCase();
      const pole = b.pole.toLowerCase();
      const mode = b.mode.toLowerCase();
      const status = b.status.toLowerCase();
      return (
        name.includes(q) ||
        b.userId.toLowerCase().includes(q) ||
        pole.includes(q) ||
        mode.includes(q) ||
        status.includes(q)
      );
    });
  }, [bundles, filterUserId, search, profiles]);

  const usersWithCartography = useMemo(() => {
    const ids = new Set(bundles.map((b) => b.userId));
    return profiles.filter((p) => ids.has(p.id));
  }, [bundles, profiles]);

  const selectedUserBundleCount = useMemo(() => {
    if (!filterUserId) return 0;
    return bundles.filter((b) => b.userId === filterUserId).length;
  }, [bundles, filterUserId]);

  const deleteSelectedUserCartography = async () => {
    if (!filterUserId || selectedUserBundleCount === 0) return;
    const userLabel = profileName(profiles, filterUserId);
    const confirmed = window.confirm(
      t("admin.cartography.deleteUserConfirm", {
        user: userLabel,
        count: selectedUserBundleCount,
      }),
    );
    if (!confirmed) return;

    setDeletingUserId(filterUserId);
    try {
      const count = await deleteCartographyForUser(filterUserId);
      toast({
        title: t("admin.cartography.deleted"),
        description: t("admin.cartography.deletedDetail", { count }),
      });
      loadBundles();
    } catch (err) {
      toast({
        title: t("toast.error"),
        description: err instanceof Error ? err.message : String(err),
        variant: "destructive",
      });
    } finally {
      setDeletingUserId(null);
    }
  };

  const togglePublish = async (bundle: CartographyBundleListItem) => {
    const next = bundle.status === "published" ? "draft" : "published";
    try {
      await setCartographyBundleStatus(bundle.id, next);
      toast({
        title:
          next === "published"
            ? t("admin.cartography.published")
            : t("admin.cartography.draft"),
      });
      loadBundles();
    } catch (err) {
      toast({
        title: t("toast.error"),
        description: err instanceof Error ? err.message : String(err),
        variant: "destructive",
      });
    }
  };

  const renderBundleRow = (b: CartographyBundleListItem) => {
    const pole = b.pole as ArchetypePole;
    const mode = b.mode as AnalysisMode;
    const poleLabel = POLE_THEMES[pole][isFR ? "labelFr" : "labelEn"];
    const userLabel = profileName(profiles, b.userId);
    const modeLabel =
      mode === "clinique" ? t("cartography.modeClinical") : t("cartography.modeStandard");

    return (
      <li
        key={b.id}
        className="flex flex-wrap items-center gap-3 rounded-xl border border-border-subtle/60 bg-white/[0.03] p-4"
      >
        <div className="min-w-0 flex-1">
          <p className="font-display text-sm uppercase tracking-wide text-text-primary">
            {userLabel} · {poleLabel} · {modeLabel}
          </p>
          <p className="text-xs text-text-tertiary mt-1">
            {t("admin.cartography.updated")}{" "}
            {new Date(b.updatedAt).toLocaleString(dateLocale)}
          </p>
          <p className="text-[10px] font-mono text-text-tertiary mt-1 truncate">
            user_id: {b.userId}
          </p>
        </div>
        <Badge variant={b.status === "published" ? "default" : "outline"}>
          {b.status === "published"
            ? t("admin.cartography.published")
            : t("admin.cartography.draft")}
        </Badge>
        <Button variant="outline" size="sm" onClick={() => togglePublish(b)}>
          {b.status === "published"
            ? t("admin.cartography.unpublish")
            : t("admin.cartography.publish")}
        </Button>
        <Button variant="ghost" size="sm" asChild>
          <Link
            to={`/cartographie/${poleToPath(pole)}/${modeToPath(mode)}?user=${b.userId}`}
            className="gap-1"
          >
            <Eye size={14} aria-hidden />
            {t("admin.cartography.view")}
          </Link>
        </Button>
        <Button variant="ghost" size="sm" asChild>
          <a
            href={`/cartographie/${poleToPath(pole)}/${modeToPath(mode)}?user=${b.userId}`}
            target="_blank"
            rel="noreferrer"
            className="gap-1 inline-flex items-center"
            aria-label={t("admin.cartography.openNewTab")}
          >
            <ExternalLink size={14} aria-hidden />
          </a>
        </Button>
      </li>
    );
  };

  return (
    <div className="mx-auto max-w-5xl space-y-8 py-8 px-4">
      <header className="space-y-2">
        <div className="flex items-center gap-2 text-text-tertiary text-xs uppercase tracking-[0.2em] font-display">
          <Map size={14} strokeWidth={1.5} aria-hidden />
          {t("admin.cartography.kicker")}
        </div>
        <h1 className="font-display text-3xl tracking-[0.12em] uppercase text-text-primary">
          {t("admin.cartography.title")}
        </h1>
        <p className="text-sm text-text-secondary max-w-2xl">
          {t("admin.cartography.description")}
        </p>
      </header>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">{t("admin.cartography.tabAllUsers")}</TabsTrigger>
          <TabsTrigger value="import">{t("admin.cartography.tabImport")}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6 space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <label className="block flex-1 max-w-md">
              <span className="text-xs uppercase tracking-[0.15em] text-text-tertiary">
                {t("admin.cartography.search")}
              </span>
              <div className="relative mt-1.5">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary"
                  aria-hidden
                />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t("admin.cartography.searchPlaceholder")}
                  className="pl-9"
                />
              </div>
            </label>
            <label className="block w-full sm:w-56">
              <span className="text-xs uppercase tracking-[0.15em] text-text-tertiary">
                {t("admin.cartography.userFilter")}
              </span>
              <select
                value={filterUserId}
                onChange={(e) => setFilterUserId(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-border-subtle bg-white/[0.04] px-3 py-2.5 text-sm"
              >
                <option value="">{t("admin.cartography.allUsers")}</option>
                {usersWithCartography.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.display_name || p.id.slice(0, 8)}
                  </option>
                ))}
              </select>
            </label>
            {filterUserId && selectedUserBundleCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
                disabled={deletingUserId === filterUserId}
                onClick={deleteSelectedUserCartography}
              >
                {deletingUserId === filterUserId ? (
                  <Loader2 size={14} className="animate-spin" aria-hidden />
                ) : (
                  <Trash2 size={14} aria-hidden />
                )}
                {t("admin.cartography.deleteUser")}
              </Button>
            )}
          </div>

          <p className="text-xs text-text-tertiary">
            {t("admin.cartography.stats", {
              reports: filteredBundles.length,
              users: usersWithCartography.length,
            })}
          </p>

          {(loadingProfiles || loadingBundles) && (
            <div className="flex justify-center py-8">
              <Loader2 className="animate-spin text-text-tertiary" aria-hidden />
            </div>
          )}

          {!loadingBundles && filteredBundles.length === 0 && (
            <p className="text-sm text-text-tertiary">{t("admin.cartography.noReports")}</p>
          )}

          <ul className="space-y-3">{filteredBundles.map(renderBundleRow)}</ul>
        </TabsContent>

        <TabsContent value="import" className="mt-6">
          {loadingProfiles ? (
            <div className="flex justify-center py-12">
              <Loader2 className="animate-spin text-text-tertiary" aria-hidden />
            </div>
          ) : (
            <CartographyFolderImportTab
              profiles={profiles}
              bundles={bundles}
              onImported={loadBundles}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
