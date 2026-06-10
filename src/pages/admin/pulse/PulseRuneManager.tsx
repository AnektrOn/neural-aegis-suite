import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Search,
  Eye,
  EyeOff,
  Trash2,
  RefreshCw,
  Plus,
  ChevronDown,
  ChevronRight,
  Layers,
  Sparkles,
  Pencil,
  X,
  Check,
} from "lucide-react";
import {
  ToolboxSection,
  ToolboxEmptyState,
  ToolboxLoadingBlock,
  ToolboxPageStat,
  toolboxFieldClass,
} from "@/components/admin/toolbox/ToolboxAdminUi";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  listRuneCollections,
  listRunePrinciples,
  upsertCollection,
  upsertRune,
  toggleRuneActive,
  toggleCollectionActive,
  deleteRune,
  deleteCollection,
  type RuneCollectionRow,
  type RunePrincipleRow,
} from "./runeAdminService";

type EditingRune = Partial<RunePrincipleRow> & { code: string };
type EditingCollection = Partial<RuneCollectionRow> & { code: string };

function I18nInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: Record<string, string>;
  onChange: (v: Record<string, string>) => void;
}) {
  return (
    <div className="space-y-1">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">{label}</p>
      <div className="grid grid-cols-2 gap-2">
        <input
          value={value.fr ?? ""}
          onChange={(e) => onChange({ ...value, fr: e.target.value })}
          placeholder="FR"
          className={`${toolboxFieldClass} text-xs`}
        />
        <input
          value={value.en ?? ""}
          onChange={(e) => onChange({ ...value, en: e.target.value })}
          placeholder="EN"
          className={`${toolboxFieldClass} text-xs`}
        />
      </div>
    </div>
  );
}

export function PulseRuneManager() {
  const [collections, setCollections] = useState<RuneCollectionRow[]>([]);
  const [runes, setRunes] = useState<RunePrincipleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [collFilter, setCollFilter] = useState<string>("all");
  const [expandedColl, setExpandedColl] = useState<Set<string>>(new Set());
  const [editingRune, setEditingRune] = useState<EditingRune | null>(null);
  const [editingColl, setEditingColl] = useState<EditingCollection | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    const [colls, principles] = await Promise.all([
      listRuneCollections(),
      listRunePrinciples(),
    ]);
    setCollections(colls);
    setRunes(principles);
    setExpandedColl(new Set(colls.map((c) => c.id)));
    if (colls.length === 0 && principles.length === 0) {
      setLoadError(
        "Aucune rune chargée. Vérifiez que les migrations Pulse (aegis_runes_schema, rune_collections) sont appliquées sur Supabase.",
      );
    }
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  const runesByCollection = useMemo(() => {
    const map = new Map<string, RunePrincipleRow[]>();
    for (const r of runes) {
      const key = r.collection_id ?? "__uncategorized__";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(r);
    }
    return map;
  }, [runes]);

  const filtered = useMemo(() => {
    let result = runes;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (r) =>
          r.code.toLowerCase().includes(q) ||
          (r.name_i18n?.fr ?? "").toLowerCase().includes(q) ||
          (r.name_i18n?.en ?? "").toLowerCase().includes(q),
      );
    }
    if (collFilter !== "all") {
      result = result.filter((r) => (r.collection_id ?? "__uncategorized__") === collFilter);
    }
    return result;
  }, [runes, search, collFilter]);

  const toggleExpand = (collId: string) =>
    setExpandedColl((prev) => {
      const next = new Set(prev);
      if (next.has(collId)) next.delete(collId);
      else next.add(collId);
      return next;
    });

  const handleSaveRune = async () => {
    if (!editingRune) return;
    setSaving(true);
    const res = await upsertRune(editingRune);
    if (res.ok) {
      setEditingRune(null);
      await load();
    }
    setSaving(false);
  };

  const handleSaveColl = async () => {
    if (!editingColl) return;
    setSaving(true);
    const res = await upsertCollection(editingColl);
    if (res.ok) {
      setEditingColl(null);
      await load();
    }
    setSaving(false);
  };

  const handleToggleRune = async (rune: RunePrincipleRow) => {
    const ok = await toggleRuneActive(rune.id, !rune.is_active);
    if (ok) setRunes((prev) => prev.map((r) => (r.id === rune.id ? { ...r, is_active: !r.is_active } : r)));
  };

  const handleToggleColl = async (coll: RuneCollectionRow) => {
    const ok = await toggleCollectionActive(coll.id, !coll.is_active);
    if (ok) setCollections((prev) => prev.map((c) => (c.id === coll.id ? { ...c, is_active: !c.is_active } : c)));
  };

  const handleDeleteRune = async (rune: RunePrincipleRow) => {
    const count = runesByCollection.get(rune.collection_id ?? "")?.length ?? 0;
    if (!window.confirm(`Supprimer la rune "${rune.name_i18n?.fr ?? rune.code}" ? ${count > 0 ? "Les cartes liées perdront leur rune." : ""}`)) return;
    const ok = await deleteRune(rune.id);
    if (ok) setRunes((prev) => prev.filter((r) => r.id !== rune.id));
  };

  const handleDeleteColl = async (coll: RuneCollectionRow) => {
    const runesInColl = runesByCollection.get(coll.id)?.length ?? 0;
    if (runesInColl > 0) {
      window.alert(`Impossible : ${runesInColl} rune(s) appartiennent à cette collection.`);
      return;
    }
    if (!window.confirm(`Supprimer la collection "${coll.name_i18n?.fr ?? coll.code}" ?`)) return;
    const ok = await deleteCollection(coll.id);
    if (ok) setCollections((prev) => prev.filter((c) => c.id !== coll.id));
  };

  const startNewRune = (collectionId?: string) => {
    setEditingRune({
      code: "",
      collection_id: collectionId ?? null,
      name_i18n: { fr: "", en: "" },
      quote_i18n: { fr: "", en: "" },
      description_i18n: { fr: "", en: "" },
      icon_key: "sparkles",
      bg_class: "from-slate-900 to-black",
      text_class: "text-slate-200",
      sort_order: runes.length + 1,
      pulses_to_unlock: 3,
      is_active: true,
    });
  };

  const startNewColl = () => {
    setEditingColl({
      code: "",
      name_i18n: { fr: "", en: "" },
      description_i18n: { fr: "", en: "" },
      icon_key: "sparkles",
      sort_order: collections.length + 1,
      is_active: true,
    });
  };

  const totalActive = runes.filter((r) => r.is_active).length;

  return (
    <div className="space-y-6">
      {loadError && !loading ? (
        <p className="rounded-lg border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-xs text-amber-200">
          {loadError}
        </p>
      ) : null}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <ToolboxPageStat label="Collections" value={collections.length} icon={Layers} />
        <ToolboxPageStat label="Total runes" value={runes.length} icon={Sparkles} />
        <ToolboxPageStat label="Actives" value={totalActive} icon={Eye} />
        <ToolboxPageStat label="Drafts" value={runes.length - totalActive} icon={EyeOff} />
      </div>

      {/* ── Collections ─────────────────────────────── */}
      <ToolboxSection
        title="Collections"
        description="Groupes thématiques de runes (Kybalion, Alchimie, Tarot, etc.)"
        badge={`${collections.length}`}
      >
        <div className="flex gap-2 mb-3">
          <Button variant="outline" size="sm" className="gap-2" onClick={startNewColl}>
            <Plus className="size-3.5" />
            Nouvelle collection
          </Button>
          <Button variant="outline" size="icon" className="size-8" onClick={() => void load()}>
            <RefreshCw className="size-3.5" />
          </Button>
        </div>

        {editingColl && (
          <div className="p-4 rounded-lg border border-primary/30 bg-primary/5 space-y-3 mb-4">
            <p className="text-xs font-medium text-primary">
              {editingColl.id ? "Modifier la collection" : "Nouvelle collection"}
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1">Code (unique)</p>
                <input
                  value={editingColl.code}
                  onChange={(e) => setEditingColl({ ...editingColl, code: e.target.value.toUpperCase().replace(/\s/g, "_") })}
                  placeholder="ALCHIMIE"
                  className={`${toolboxFieldClass} text-xs font-mono`}
                  disabled={!!editingColl.id}
                />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1">Icône Lucide</p>
                <input
                  value={editingColl.icon_key ?? ""}
                  onChange={(e) => setEditingColl({ ...editingColl, icon_key: e.target.value })}
                  placeholder="scroll-text"
                  className={`${toolboxFieldClass} text-xs font-mono`}
                />
              </div>
            </div>
            <I18nInput label="Nom" value={editingColl.name_i18n ?? { fr: "", en: "" }} onChange={(v) => setEditingColl({ ...editingColl, name_i18n: v })} />
            <I18nInput label="Description" value={editingColl.description_i18n ?? { fr: "", en: "" }} onChange={(v) => setEditingColl({ ...editingColl, description_i18n: v })} />
            <div className="flex gap-2 pt-1">
              <Button size="sm" disabled={saving || !editingColl.code} onClick={() => void handleSaveColl()} className="gap-1">
                <Check className="size-3" /> Enregistrer
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setEditingColl(null)} className="gap-1">
                <X className="size-3" /> Annuler
              </Button>
            </div>
          </div>
        )}

        {loading ? (
          <ToolboxLoadingBlock message="Chargement…" />
        ) : collections.length === 0 ? (
          <ToolboxEmptyState icon={Layers} title="Aucune collection" hint="Créez votre première collection de runes." />
        ) : (
          <div className="space-y-2">
            {collections.map((coll) => {
              const collRunes = runesByCollection.get(coll.id) ?? [];
              return (
                <div key={coll.id} className="rounded-lg border border-border-subtle overflow-hidden">
                  <div className="flex items-center gap-3 p-3 bg-bg-elevated/50 hover:bg-bg-elevated/70 transition-colors">
                    <button type="button" onClick={() => toggleExpand(coll.id)} className="shrink-0">
                      {expandedColl.has(coll.id)
                        ? <ChevronDown className="size-4 text-muted-foreground" />
                        : <ChevronRight className="size-4 text-muted-foreground" />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-text-primary">{coll.name_i18n?.fr ?? coll.code}</p>
                        <Badge variant="outline" className="text-[10px] py-0 px-1.5 font-mono">{coll.code}</Badge>
                        <Badge variant="outline" className="text-[10px] py-0 px-1.5">{collRunes.length} rune(s)</Badge>
                      </div>
                      {coll.description_i18n?.fr && (
                        <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{coll.description_i18n.fr}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Switch
                        checked={coll.is_active}
                        onCheckedChange={() => void handleToggleColl(coll)}
                      />
                      <Button variant="ghost" size="icon" className="size-8" onClick={() => setEditingColl({ ...coll })}>
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="size-8 hover:text-red-400" onClick={() => void handleDeleteColl(coll)}>
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </ToolboxSection>

      {/* ── Runes catalogue ─────────────────────────────── */}
      <ToolboxSection title="Runes & Glyphes" badge={`${filtered.length} rune(s)`}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher…" className={`${toolboxFieldClass} pl-10`} />
          </div>
          <select value={collFilter} onChange={(e) => setCollFilter(e.target.value)} className={`${toolboxFieldClass} max-w-[220px]`}>
            <option value="all">Toutes collections</option>
            {collections.map((c) => (
              <option key={c.id} value={c.id}>{c.name_i18n?.fr ?? c.code}</option>
            ))}
            <option value="__uncategorized__">Sans collection</option>
          </select>
          <Button variant="outline" size="sm" className="gap-2" onClick={() => startNewRune()}>
            <Plus className="size-3.5" />
            Nouvelle rune
          </Button>
          <Button variant="outline" size="icon" className="size-8" onClick={() => void load()}>
            <RefreshCw className="size-3.5" />
          </Button>
        </div>

        {editingRune && (
          <div className="p-4 rounded-lg border border-primary/30 bg-primary/5 space-y-3 mt-3">
            <p className="text-xs font-medium text-primary">
              {editingRune.id ? "Modifier la rune" : "Nouvelle rune"}
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1">Code (unique)</p>
                <input
                  value={editingRune.code}
                  onChange={(e) => setEditingRune({ ...editingRune, code: e.target.value.toUpperCase().replace(/\s/g, "_") })}
                  placeholder="TRANSMUTATION"
                  className={`${toolboxFieldClass} text-xs font-mono`}
                  disabled={!!editingRune.id}
                />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1">Collection</p>
                <select
                  value={editingRune.collection_id ?? ""}
                  onChange={(e) => setEditingRune({ ...editingRune, collection_id: e.target.value || null })}
                  className={`${toolboxFieldClass} text-xs`}
                >
                  <option value="">Aucune</option>
                  {collections.map((c) => (
                    <option key={c.id} value={c.id}>{c.name_i18n?.fr ?? c.code}</option>
                  ))}
                </select>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1">Pulses pour débloquer</p>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={editingRune.pulses_to_unlock ?? 3}
                  onChange={(e) => setEditingRune({ ...editingRune, pulses_to_unlock: parseInt(e.target.value) || 3 })}
                  className={`${toolboxFieldClass} text-xs`}
                />
              </div>
            </div>
            <I18nInput label="Nom" value={editingRune.name_i18n ?? { fr: "", en: "" }} onChange={(v) => setEditingRune({ ...editingRune, name_i18n: v })} />
            <I18nInput label="Citation" value={editingRune.quote_i18n ?? { fr: "", en: "" }} onChange={(v) => setEditingRune({ ...editingRune, quote_i18n: v })} />
            <I18nInput label="Description" value={editingRune.description_i18n ?? { fr: "", en: "" }} onChange={(v) => setEditingRune({ ...editingRune, description_i18n: v })} />
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1">Icône Lucide</p>
                <input value={editingRune.icon_key ?? ""} onChange={(e) => setEditingRune({ ...editingRune, icon_key: e.target.value })} placeholder="sparkles" className={`${toolboxFieldClass} text-xs font-mono`} />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1">bg_class</p>
                <input value={editingRune.bg_class ?? ""} onChange={(e) => setEditingRune({ ...editingRune, bg_class: e.target.value })} placeholder="from-slate-900 to-black" className={`${toolboxFieldClass} text-xs font-mono`} />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1">text_class</p>
                <input value={editingRune.text_class ?? ""} onChange={(e) => setEditingRune({ ...editingRune, text_class: e.target.value })} placeholder="text-slate-200" className={`${toolboxFieldClass} text-xs font-mono`} />
              </div>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1">Glyphe SVG (optionnel)</p>
              <textarea
                value={editingRune.glyph_svg ?? ""}
                onChange={(e) => setEditingRune({ ...editingRune, glyph_svg: e.target.value || null })}
                placeholder='<svg viewBox="0 0 100 100">…</svg>'
                rows={3}
                className={`${toolboxFieldClass} text-xs font-mono h-auto resize-y`}
              />
            </div>
            <div className="flex gap-2 pt-1">
              <Button size="sm" disabled={saving || !editingRune.code} onClick={() => void handleSaveRune()} className="gap-1">
                <Check className="size-3" /> Enregistrer
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setEditingRune(null)} className="gap-1">
                <X className="size-3" /> Annuler
              </Button>
            </div>
          </div>
        )}

        {loading ? (
          <ToolboxLoadingBlock message="Chargement…" />
        ) : filtered.length === 0 ? (
          <ToolboxEmptyState icon={Sparkles} title="Aucune rune" hint={search ? "Essayez un autre filtre." : "Créez votre première rune."} />
        ) : (
          <div className="space-y-1.5 mt-3">
            {filtered.map((rune) => {
              const coll = collections.find((c) => c.id === rune.collection_id);
              return (
                <div
                  key={rune.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-bg-elevated/50 border border-border-subtle hover:border-border transition-colors"
                >
                  {rune.glyph_svg ? (
                    <div
                      className="size-9 shrink-0 text-text-primary opacity-60"
                      dangerouslySetInnerHTML={{ __html: rune.glyph_svg }}
                    />
                  ) : (
                    <div className="size-9 shrink-0 rounded-lg bg-bg-elevated flex items-center justify-center">
                      <Sparkles className="size-4 text-muted-foreground" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium text-text-primary">
                        {rune.name_i18n?.fr ?? rune.code}
                      </p>
                      <Badge variant="outline" className="text-[10px] py-0 px-1.5 font-mono">{rune.code}</Badge>
                      {coll && (
                        <Badge variant="outline" className="text-[10px] py-0 px-1.5 text-primary border-primary/30">
                          {coll.name_i18n?.fr ?? coll.code}
                        </Badge>
                      )}
                      {!rune.is_active && (
                        <Badge variant="secondary" className="text-[10px] py-0 px-1.5">Draft</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 text-[11px] text-muted-foreground">
                      {rune.quote_i18n?.fr && (
                        <span className="italic truncate max-w-[300px]">« {rune.quote_i18n.fr} »</span>
                      )}
                      <span>· {rune.pulses_to_unlock} pulse(s)</span>
                      <span>· #{rune.sort_order}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Switch
                      checked={rune.is_active}
                      onCheckedChange={() => void handleToggleRune(rune)}
                    />
                    <Button variant="ghost" size="icon" className="size-8" onClick={() => setEditingRune({ ...rune })}>
                      <Pencil className="size-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="size-8 hover:text-red-400" onClick={() => void handleDeleteRune(rune)}>
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </ToolboxSection>
    </div>
  );
}
