/**
 * Admin hub — Tao/Wu Xing portrait Markdown per user.
 * Single-section editor or bulk folder / zip import (Benebell Wen tree layout).
 */

import { useCallback, useEffect, useState } from "react";
import { Loader2, Save, Upload, User, TreePine } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  POLE_PART_META,
  POLE_PART_ORDER,
  WU_XING_META,
  WU_XING_POLES,
  type PolePartId,
  type WuXingPole,
} from "@/features/tao-portrait/domain/types";
import {
  loadTaoPortraitParts,
  upsertTaoPortraitPart,
} from "@/features/tao-portrait/services/taoPortraitService";
import { TaoMarkdownBody } from "@/features/tao-portrait/components/TaoMarkdownBody";
import { TaoPortraitBulkImportPanel } from "@/features/tao-portrait/components/TaoPortraitBulkImportPanel";

interface UserOption {
  id: string;
  display_name: string | null;
}

const ALL_PARTS: Array<{ pole: WuXingPole; partId: PolePartId }> = [
  { pole: "transversal", partId: "T2_SYNTHESIS" },
  ...WU_XING_POLES.flatMap((pole) =>
    POLE_PART_ORDER.map((partId) => ({ pole, partId })),
  ),
];

function partLabel(pole: WuXingPole, partId: PolePartId): string {
  const pm = POLE_PART_META[partId];
  if (pole === "transversal") return `T2 · ${pm.label_fr}`;
  const m = WU_XING_META[pole];
  return `${m.emoji} ${m.label_fr} · ${pm.code}`;
}

export default function AdminTaoPortraitHub() {
  const { toast } = useToast();
  const [users, setUsers] = useState<UserOption[]>([]);
  const [userId, setUserId] = useState("");
  const [hubTab, setHubTab] = useState<"bulk" | "single">("bulk");
  const [selectedKey, setSelectedKey] = useState("wood:P01_DIA");
  const [markdown, setMarkdown] = useState("");
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingPart, setLoadingPart] = useState(false);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<"edit" | "preview">("edit");
  const [importVersion, setImportVersion] = useState(0);

  const selected = ALL_PARTS.find(
    (p) => `${p.pole}:${p.partId}` === selectedKey,
  ) ?? ALL_PARTS[1];

  useEffect(() => {
    void (async () => {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("id, display_name")
          .order("display_name");
        if (error) throw error;
        setUsers((data ?? []) as UserOption[]);
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingUsers(false);
      }
    })();
  }, []);

  const loadPart = useCallback(async () => {
    if (!userId) {
      setMarkdown("");
      return;
    }
    setLoadingPart(true);
    try {
      const rows = await loadTaoPortraitParts(userId, selected.pole);
      const row = rows.find((r) => r.part_id === selected.partId);
      setMarkdown(row?.content_md ?? "");
    } catch (e) {
      toast({
        title: "Erreur",
        description: e instanceof Error ? e.message : String(e),
        variant: "destructive",
      });
    } finally {
      setLoadingPart(false);
    }
  }, [userId, selected.pole, selected.partId, toast]);

  useEffect(() => {
    if (hubTab === "single") void loadPart();
  }, [loadPart, hubTab, importVersion]);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    setMarkdown(text);
  };

  const handleSave = async () => {
    if (!userId) {
      toast({ title: "Sélectionnez un utilisateur", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      await upsertTaoPortraitPart(userId, selected.pole, selected.partId, markdown);
      toast({ title: "Enregistré", description: partLabel(selected.pole, selected.partId) });
    } catch (e) {
      toast({
        title: "Erreur",
        description: e instanceof Error ? e.message : String(e),
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const accent =
    selected.pole !== "transversal" ? WU_XING_META[selected.pole].color : undefined;

  return (
    <div className="max-w-6xl mx-auto space-y-6 p-4 sm:p-6">
      <header className="space-y-2">
        <div className="flex items-center gap-2 text-primary">
          <TreePine size={20} strokeWidth={1.5} aria-hidden />
          <span className="font-display text-[10px] uppercase tracking-[0.25em]">Admin</span>
        </div>
        <h1 className="font-display text-xl uppercase tracking-wide text-foreground">
          Portrait Tao · Wu Xing
        </h1>
        <p className="text-sm text-muted-foreground max-w-2xl">
          Importez un dossier Benebell Wen complet (T2 + 5 pôles × 5 parties) ou éditez une section
          à la fois. Le Markdown s&apos;affiche dans Deep Dive et en aperçu sur Persona.
        </p>
      </header>

      <Card className="p-4 sm:p-5">
        <label className="block space-y-2">
          <span className="flex items-center gap-2 text-xs font-display uppercase tracking-wider text-muted-foreground">
            <User size={14} aria-hidden />
            Utilisateur
          </span>
          <select
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            disabled={loadingUsers}
            className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm min-h-[44px]"
          >
            <option value="">— Choisir —</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.display_name?.trim() || u.id.slice(0, 8)}
              </option>
            ))}
          </select>
        </label>
      </Card>

      <Tabs value={hubTab} onValueChange={(v) => setHubTab(v as "bulk" | "single")}>
        <TabsList>
          <TabsTrigger value="bulk">Import dossier</TabsTrigger>
          <TabsTrigger value="single">Section par section</TabsTrigger>
        </TabsList>

        <TabsContent value="bulk" className="mt-4">
          <TaoPortraitBulkImportPanel
            userId={userId}
            onImported={() => setImportVersion((v) => v + 1)}
          />
        </TabsContent>

        <TabsContent value="single" className="mt-4 space-y-4">
          <Card className="p-4">
            <label className="block space-y-2">
              <span className="text-xs font-display uppercase tracking-wider text-muted-foreground">
                Section
              </span>
              <select
                value={selectedKey}
                onChange={(e) => setSelectedKey(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm min-h-[44px]"
              >
                {ALL_PARTS.map((p) => (
                  <option key={`${p.pole}:${p.partId}`} value={`${p.pole}:${p.partId}`}>
                    {partLabel(p.pole, p.partId)}
                  </option>
                ))}
              </select>
            </label>
          </Card>

          <Tabs value={tab} onValueChange={(v) => setTab(v as "edit" | "preview")}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <TabsList>
                <TabsTrigger value="edit">Édition</TabsTrigger>
                <TabsTrigger value="preview" disabled={!markdown.trim()}>
                  Aperçu
                </TabsTrigger>
              </TabsList>

              <div className="flex flex-wrap gap-2">
                <label className="cursor-pointer inline-flex">
                  <input type="file" accept=".md,text/markdown,text/plain" className="sr-only" onChange={handleFile} />
                  <span className="inline-flex items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm font-medium min-h-[40px] hover:bg-accent hover:text-accent-foreground">
                    <Upload size={14} aria-hidden />
                    Fichier .md
                  </span>
                </label>
                <Button
                  size="sm"
                  className="min-h-[40px] gap-2"
                  disabled={saving || !userId || loadingPart}
                  onClick={() => void handleSave()}
                >
                  {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                  Enregistrer
                </Button>
              </div>
            </div>

            <TabsContent value="edit" className="mt-4">
              {loadingPart ? (
                <div className="flex justify-center py-16">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <textarea
                  value={markdown}
                  onChange={(e) => setMarkdown(e.target.value)}
                  placeholder={`# P01·DIA | SEMANTIC DIAGNOSTIC: WOOD (MU - 🌲)\n\n## 1. INTRODUCTION...`}
                  className="w-full min-h-[420px] rounded-xl border border-border bg-background/50 p-4 font-mono text-xs sm:text-sm leading-relaxed resize-y"
                  spellCheck={false}
                />
              )}
              <p className="mt-2 text-[10px] text-muted-foreground">{markdown.length} caractères</p>
            </TabsContent>

            <TabsContent value="preview" className="mt-4">
              <Card className="p-6 sm:p-8">
                <TaoMarkdownBody markdown={markdown} accentColor={accent} />
              </Card>
            </TabsContent>
          </Tabs>
        </TabsContent>
      </Tabs>
    </div>
  );
}
