import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, Map, ExternalLink, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import CartographyFolderImportTab from "@/components/admin/cartography/CartographyFolderImportTab";
import {
  listCartographyBundlesForUser,
  setCartographyBundleStatus,
} from "@/services/cartographyService";
import { poleToPath, modeToPath } from "@/lib/archetype-cartography/registry";
import type { ArchetypePole, AnalysisMode } from "@/lib/archetype-cartography/types";
import { POLE_THEMES } from "@/lib/archetype-cartography/pole-theme";

interface Profile {
  id: string;
  display_name: string | null;
}

interface BundleRow {
  id: string;
  pole: string;
  mode: string;
  status: string;
  meta: Record<string, unknown>;
  published_at: string | null;
  updated_at: string;
}

export default function CartographyManagement() {
  const { locale } = useLanguage();
  const isFR = locale === "fr";
  const { toast } = useToast();

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [bundles, setBundles] = useState<BundleRow[]>([]);
  const [loadingProfiles, setLoadingProfiles] = useState(true);
  const [loadingBundles, setLoadingBundles] = useState(false);

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
        title: isFR ? "Erreur" : "Error",
        description: isFR ? "Impossible de charger les utilisateurs." : "Unable to load users.",
        variant: "destructive",
      });
    } finally {
      setLoadingProfiles(false);
    }
  }, [isFR, toast]);

  const loadBundles = useCallback(async () => {
    if (!selectedUserId) {
      setBundles([]);
      return;
    }
    setLoadingBundles(true);
    try {
      const rows = await listCartographyBundlesForUser(selectedUserId);
      setBundles(rows as BundleRow[]);
    } catch (err) {
      toast({
        title: isFR ? "Erreur" : "Error",
        description: err instanceof Error ? err.message : String(err),
        variant: "destructive",
      });
    } finally {
      setLoadingBundles(false);
    }
  }, [selectedUserId, isFR, toast]);

  useEffect(() => {
    loadProfiles();
  }, [loadProfiles]);

  useEffect(() => {
    loadBundles();
  }, [loadBundles]);

  const togglePublish = async (bundle: BundleRow) => {
    const next = bundle.status === "published" ? "draft" : "published";
    try {
      await setCartographyBundleStatus(bundle.id, next);
      toast({
        title: next === "published" ? (isFR ? "Publié" : "Published") : isFR ? "Brouillon" : "Draft",
      });
      loadBundles();
    } catch (err) {
      toast({
        title: isFR ? "Erreur" : "Error",
        description: err instanceof Error ? err.message : String(err),
        variant: "destructive",
      });
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-8 py-8 px-4">
      <header className="space-y-2">
        <div className="flex items-center gap-2 text-text-tertiary text-xs uppercase tracking-[0.2em] font-display">
          <Map size={14} strokeWidth={1.5} aria-hidden />
          {isFR ? "Admin · Cartographie" : "Admin · Cartography"}
        </div>
        <h1 className="font-display text-3xl tracking-[0.12em] uppercase text-text-primary">
          {isFR ? "Rapports cartographie" : "Cartography reports"}
        </h1>
        <p className="text-sm text-text-secondary max-w-2xl">
          {isFR
            ? "Déposez votre zip Myss tel quel : seul le dossier Myss/ est pris en compte (Echols/ ignoré)."
            : "Drop your Myss zip as-is: only the Myss/ folder is imported (Echols/ skipped)."}
        </p>
      </header>

      <Tabs defaultValue="import">
        <TabsList>
          <TabsTrigger value="import">{isFR ? "Import dossier" : "Folder import"}</TabsTrigger>
          <TabsTrigger value="bundles">{isFR ? "Bundles en base" : "Stored bundles"}</TabsTrigger>
        </TabsList>

        <TabsContent value="import" className="mt-6">
          {loadingProfiles ? (
            <div className="flex justify-center py-12">
              <Loader2 className="animate-spin text-text-tertiary" aria-hidden />
            </div>
          ) : (
            <CartographyFolderImportTab profiles={profiles} onImported={loadBundles} />
          )}
        </TabsContent>

        <TabsContent value="bundles" className="mt-6 space-y-4">
          <label className="block max-w-md">
            <span className="text-xs uppercase tracking-[0.15em] text-text-tertiary">
              {isFR ? "Utilisateur" : "User"}
            </span>
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-border-subtle bg-white/[0.04] px-3 py-2.5 text-sm"
            >
              <option value="">{isFR ? "— Sélectionner —" : "— Select —"}</option>
              {profiles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.display_name || p.id}
                </option>
              ))}
            </select>
          </label>

          {loadingBundles && (
            <div className="flex justify-center py-8">
              <Loader2 className="animate-spin text-text-tertiary" aria-hidden />
            </div>
          )}

          {!loadingBundles && selectedUserId && bundles.length === 0 && (
            <p className="text-sm text-text-tertiary">{isFR ? "Aucun bundle." : "No bundles."}</p>
          )}

          <ul className="space-y-3">
            {bundles.map((b) => {
              const pole = b.pole as ArchetypePole;
              const mode = b.mode as AnalysisMode;
              const poleLabel = POLE_THEMES[pole][isFR ? "labelFr" : "labelEn"];
              return (
                <li
                  key={b.id}
                  className="flex flex-wrap items-center gap-3 rounded-xl border border-border-subtle/60 bg-white/[0.03] p-4"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-display text-sm uppercase tracking-wide text-text-primary">
                      {poleLabel} · {mode === "clinique" ? (isFR ? "Clinique" : "Clinical") : "Analyse"}
                    </p>
                    <p className="text-xs text-text-tertiary mt-1">
                      {isFR ? "Mis à jour" : "Updated"}{" "}
                      {new Date(b.updated_at).toLocaleString(isFR ? "fr-FR" : "en-US")}
                    </p>
                  </div>
                  <Badge variant={b.status === "published" ? "default" : "outline"}>
                    {b.status === "published" ? (isFR ? "Publié" : "Published") : isFR ? "Brouillon" : "Draft"}
                  </Badge>
                  <Button variant="outline" size="sm" onClick={() => togglePublish(b)}>
                    {b.status === "published"
                      ? isFR
                        ? "Dépublier"
                        : "Unpublish"
                      : isFR
                        ? "Publier"
                        : "Publish"}
                  </Button>
                  <Button variant="ghost" size="sm" asChild>
                    <Link
                      to={`/cartographie/${poleToPath(pole)}/${modeToPath(mode)}`}
                      className="gap-1"
                    >
                      <Eye size={14} aria-hidden />
                      {isFR ? "Aperçu user" : "User preview"}
                    </Link>
                  </Button>
                  <Button variant="ghost" size="sm" asChild>
                    <a
                      href={`/cartographie/${poleToPath(pole)}/${modeToPath(mode)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="gap-1 inline-flex items-center"
                    >
                      <ExternalLink size={14} aria-hidden />
                    </a>
                  </Button>
                </li>
              );
            })}
          </ul>
        </TabsContent>
      </Tabs>
    </div>
  );
}
