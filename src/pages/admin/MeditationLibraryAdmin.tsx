import { useEffect, useState } from "react";
import { Flower2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/i18n/LanguageContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { VideoLibraryProfileOption } from "@/components/admin/VideoLibraryUserPicker";
import MeditationLibraryImportTab from "@/components/admin/MeditationLibraryImportTab";
import MeditationLibraryOrganizeTab from "@/components/admin/MeditationLibraryOrganizeTab";

export default function MeditationLibraryAdmin() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [profiles, setProfiles] = useState<VideoLibraryProfileOption[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("id, display_name, is_disabled")
          .order("display_name", { ascending: true, nullsFirst: false });

        if (error) {
          toast({ title: t("toast.error"), description: error.message, variant: "destructive" });
          setProfiles([]);
          return;
        }

        const rows = (data || []).filter((p: { is_disabled?: boolean }) => !p.is_disabled);
        setProfiles(rows.map(({ id, display_name }) => ({ id, display_name })));
      } catch (e) {
        toast({
          title: t("toast.error"),
          description: e instanceof Error ? e.message : t("toast.unexpected"),
          variant: "destructive",
        });
        setProfiles([]);
      }
    })();
  }, [t, toast]);

  return (
    <div className="space-y-8 max-w-6xl">
      <div>
        <p className="text-neural-label mb-3 text-neural-accent/60">{t("admin.meditation.kicker")}</p>
        <h1 className="text-neural-title text-3xl text-foreground flex items-center gap-3">
          <Flower2 size={28} strokeWidth={1.25} className="text-primary shrink-0" />
          {t("admin.meditation.pageTitle")}
        </h1>
        <p className="text-sm text-muted-foreground mt-2 max-w-2xl">{t("admin.meditation.subtitle")}</p>
      </div>

      <Tabs defaultValue="import" className="space-y-6">
        <TabsList>
          <TabsTrigger value="import">{t("admin.videoLibrary.tabImport")}</TabsTrigger>
          <TabsTrigger value="organize">{t("admin.videoLibrary.tabOrganize")}</TabsTrigger>
        </TabsList>
        <TabsContent value="import" className="mt-0">
          <MeditationLibraryImportTab profiles={profiles} onImported={() => setRefreshKey((k) => k + 1)} />
        </TabsContent>
        <TabsContent value="organize" className="mt-0">
          <MeditationLibraryOrganizeTab profiles={profiles} refreshKey={refreshKey} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
