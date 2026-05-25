import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Search,
  Eye,
  EyeOff,
  Trash2,
  RefreshCw,
  ThumbsUp,
  ThumbsDown,
  Zap,
  UserPlus,
  CheckCheck,
  X,
} from "lucide-react";
import UserPicker from "@/features/admin-export/UserPicker";
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
  listPulseCards,
  toggleCardActive,
  deleteCard,
  activateAllDrafts,
  bulkActivateCards,
  bulkAssignUsers as assignUsersToCards,
  bulkClearUserAssignment,
  fetchPulseCardStats,
  fetchProfileOptions,
  type PulseCardRow,
  type PulseCardSwipeStats,
  type ProfileOption,
} from "./pulseAdminService";

const PRINCIPLES_COLORS: Record<string, string> = {
  MENTALISM: "text-violet-400 border-violet-400/30",
  CORRESPONDENCE: "text-blue-400 border-blue-400/30",
  VIBRATION: "text-emerald-400 border-emerald-400/30",
  POLARITY: "text-orange-400 border-orange-400/30",
  RHYTHM: "text-pink-400 border-pink-400/30",
  CAUSE_EFFECT: "text-amber-400 border-amber-400/30",
  GENDER: "text-teal-400 border-teal-400/30",
};

function profileLabel(profiles: Map<string, ProfileOption>, userId: string): string {
  const p = profiles.get(userId);
  return p?.display_name ?? userId.slice(0, 8) + "…";
}

export function PulseManagement() {
  const [cards, setCards] = useState<PulseCardRow[]>([]);
  const [stats, setStats] = useState<Map<string, PulseCardSwipeStats>>(new Map());
  const [profiles, setProfiles] = useState<ProfileOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [principleFilter, setPrincipleFilter] = useState<string>("all");
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [swipeFilter, setSwipeFilter] = useState<string>("all");
  const [userFilter, setUserFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("order");
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkAssignUsers, setBulkAssignUsers] = useState<string[]>([]);
  const [showAssignPanel, setShowAssignPanel] = useState(false);
  const [bulkWorking, setBulkWorking] = useState(false);

  const profileMap = useMemo(
    () => new Map(profiles.map((p) => [p.id, p])),
    [profiles],
  );

  const load = useCallback(async () => {
    setLoading(true);
    const [data, statsData, profileData] = await Promise.all([
      listPulseCards(),
      fetchPulseCardStats(),
      fetchProfileOptions(),
    ]);
    setCards(data);
    setStats(statsData);
    setProfiles(profileData);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const totalActive = cards.filter((c) => c.is_active).length;
  const principles = [...new Set(cards.map((c) => c.principle_code).filter(Boolean))];

  const usersWithCards = useMemo(() => {
    const ids = new Set<string>();
    for (const c of cards) {
      for (const uid of c.target_user_ids ?? []) ids.add(uid);
    }
    return [...ids].sort((a, b) =>
      profileLabel(profileMap, a).localeCompare(profileLabel(profileMap, b)),
    );
  }, [cards, profileMap]);

  let totalYes = 0;
  let totalNo = 0;
  for (const s of stats.values()) {
    totalYes += s.yes_count;
    totalNo += s.no_count;
  }

  const filtered = cards
    .filter((c) => {
      if (search) {
        const q = search.toLowerCase();
        const title = (c.title_i18n?.fr ?? "").toLowerCase();
        const key = (c.external_key ?? "").toLowerCase();
        if (!title.includes(q) && !key.includes(q)) return false;
      }
      if (principleFilter !== "all" && c.principle_code !== principleFilter) return false;
      if (activeFilter === "active" && !c.is_active) return false;
      if (activeFilter === "draft" && c.is_active) return false;

      if (userFilter === "unassigned") {
        if (c.target_user_ids?.length > 0) return false;
      } else if (userFilter !== "all") {
        if (!c.target_user_ids?.includes(userFilter)) return false;
      }

      if (swipeFilter !== "all") {
        const s = stats.get(c.id);
        const yes = s?.yes_count ?? 0;
        const no = s?.no_count ?? 0;
        const total = s?.total_swipes ?? 0;

        if (swipeFilter === "no-swipes" && total > 0) return false;
        if (swipeFilter === "mostly-yes" && (total === 0 || yes <= no)) return false;
        if (swipeFilter === "mostly-no" && (total === 0 || no <= yes)) return false;
        if (swipeFilter === "has-no" && no === 0) return false;
      }

      return true;
    })
    .sort((a, b) => {
      if (sortBy === "yes-desc") {
        return (stats.get(b.id)?.yes_count ?? 0) - (stats.get(a.id)?.yes_count ?? 0);
      }
      if (sortBy === "no-desc") {
        return (stats.get(b.id)?.no_count ?? 0) - (stats.get(a.id)?.no_count ?? 0);
      }
      if (sortBy === "ratio") {
        const rA = stats.get(a.id);
        const rB = stats.get(b.id);
        const ratioA = rA && rA.total_swipes > 0 ? rA.yes_count / rA.total_swipes : -1;
        const ratioB = rB && rB.total_swipes > 0 ? rB.yes_count / rB.total_swipes : -1;
        return ratioB - ratioA;
      }
      return a.sort_order - b.sort_order;
    });

  const filteredIds = filtered.map((c) => c.id);
  const allFilteredSelected =
    filteredIds.length > 0 && filteredIds.every((id) => selectedIds.has(id));
  const selectedDraftCount = cards.filter((c) => selectedIds.has(c.id) && !c.is_active).length;

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAllFiltered = () => setSelectedIds(new Set(filteredIds));
  const clearSelection = () => setSelectedIds(new Set());

  const handleToggle = async (card: PulseCardRow, nextActive: boolean) => {
    setTogglingId(card.id);
    const ok = await toggleCardActive(card.id, nextActive);
    if (ok) {
      setCards((prev) =>
        prev.map((c) => (c.id === card.id ? { ...c, is_active: nextActive } : c)),
      );
    }
    setTogglingId(null);
  };

  const handleActivateAll = async () => {
    const drafts = cards.filter((c) => !c.is_active).length;
    if (drafts === 0) return;
    if (!window.confirm(`Activer les ${drafts} carte(s) draft ?`)) return;
    const count = await activateAllDrafts();
    if (count > 0) {
      setCards((prev) => prev.map((c) => ({ ...c, is_active: true })));
    }
  };

  const handleBulkActivate = async () => {
    const ids = [...selectedIds];
    if (ids.length === 0) return;
    setBulkWorking(true);
    const count = await bulkActivateCards(ids);
    if (count > 0) {
      setCards((prev) =>
        prev.map((c) => (selectedIds.has(c.id) ? { ...c, is_active: true } : c)),
      );
    }
    setBulkWorking(false);
  };

  const handleBulkClearUsers = async () => {
    const ids = [...selectedIds];
    if (ids.length === 0) return;
    if (!window.confirm(`Retirer l'assignation user de ${ids.length} carte(s) ? Elles deviendront universelles.`)) return;
    setBulkWorking(true);
    const count = await bulkClearUserAssignment(ids);
    if (count > 0) {
      setCards((prev) =>
        prev.map((c) => (selectedIds.has(c.id) ? { ...c, target_user_ids: [] } : c)),
      );
    }
    setBulkWorking(false);
  };

  const handleBulkAssign = async () => {
    const ids = [...selectedIds];
    if (ids.length === 0 || bulkAssignUsers.length === 0) return;
    setBulkWorking(true);
    const count = await assignUsersToCards(ids, bulkAssignUsers);
    if (count > 0) {
      setCards((prev) =>
        prev.map((c) =>
          selectedIds.has(c.id) ? { ...c, target_user_ids: bulkAssignUsers } : c,
        ),
      );
      setShowAssignPanel(false);
    }
    setBulkWorking(false);
  };

  const handleDelete = async (card: PulseCardRow) => {
    const title = card.title_i18n?.fr ?? card.external_key ?? card.id;
    if (!window.confirm(`Supprimer "${title}" ?`)) return;
    const ok = await deleteCard(card.id);
    if (ok) {
      setCards((prev) => prev.filter((c) => c.id !== card.id));
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(card.id);
        return next;
      });
    }
  };

  const draftCount = cards.length - totalActive;

  return (
    <div className="space-y-6">
      {draftCount > 0 && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-4 rounded-xl border border-amber-400/30 bg-amber-400/5">
          <div className="flex items-center gap-2 flex-1">
            <EyeOff className="size-5 text-amber-400 shrink-0" />
            <p className="text-sm font-medium text-amber-400">
              {draftCount} carte(s) en draft — invisibles côté user jusqu&apos;à activation
            </p>
          </div>
          <Button
            onClick={handleActivateAll}
            className="gap-2 bg-amber-500 hover:bg-amber-600 text-black font-medium shrink-0"
          >
            <Zap className="size-4" />
            Tout activer ({draftCount})
          </Button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        <ToolboxPageStat label="Total cartes" value={cards.length} icon={RefreshCw} />
        <ToolboxPageStat label="Actives" value={totalActive} icon={Eye} />
        <ToolboxPageStat label="Drafts" value={draftCount} icon={EyeOff} />
        <ToolboxPageStat label="Principes" value={principles.length} icon={Search} />
        <ToolboxPageStat label="Swipes YES" value={totalYes} icon={ThumbsUp} />
        <ToolboxPageStat label="Swipes NO" value={totalNo} icon={ThumbsDown} />
      </div>

      <ToolboxSection title="Catalogue Pulse" badge={`${filtered.length} carte(s)`}>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher par titre ou clé…"
                className={`${toolboxFieldClass} pl-10`}
              />
            </div>

            <select
              value={userFilter}
              onChange={(e) => setUserFilter(e.target.value)}
              className={`${toolboxFieldClass} max-w-[220px]`}
            >
              <option value="all">Tous les users</option>
              <option value="unassigned">Sans user assigné</option>
              {usersWithCards.map((uid) => (
                <option key={uid} value={uid}>
                  👤 {profileLabel(profileMap, uid)}
                </option>
              ))}
            </select>

            <select
              value={principleFilter}
              onChange={(e) => setPrincipleFilter(e.target.value)}
              className={`${toolboxFieldClass} max-w-[180px]`}
            >
              <option value="all">Tous principes</option>
              {principles.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>

            <select
              value={activeFilter}
              onChange={(e) => setActiveFilter(e.target.value)}
              className={`${toolboxFieldClass} max-w-[140px]`}
            >
              <option value="all">Tous statuts</option>
              <option value="active">Actives</option>
              <option value="draft">Drafts</option>
            </select>

            <select
              value={swipeFilter}
              onChange={(e) => setSwipeFilter(e.target.value)}
              className={`${toolboxFieldClass} max-w-[180px]`}
            >
              <option value="all">Tous swipes</option>
              <option value="mostly-yes">Surtout YES ✓</option>
              <option value="mostly-no">Surtout NO ✗</option>
              <option value="has-no">Au moins 1 NO</option>
              <option value="no-swipes">Jamais swipées</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className={`${toolboxFieldClass} max-w-[160px]`}
            >
              <option value="order">Tri par ordre</option>
              <option value="yes-desc">Plus de YES ↓</option>
              <option value="no-desc">Plus de NO ↓</option>
              <option value="ratio">Meilleur ratio ↓</option>
            </select>

            <Button variant="outline" size="icon" onClick={load} title="Rafraîchir">
              <RefreshCw className="size-4" />
            </Button>
          </div>

          {/* Bulk actions bar */}
          <div className="flex flex-wrap items-center gap-2 p-3 rounded-lg border border-border-subtle bg-bg-elevated/30">
            <Button variant="ghost" size="sm" className="h-8 text-xs gap-1" onClick={selectAllFiltered}>
              <CheckCheck className="size-3" /> Tout ({filtered.length})
            </Button>
            <Button variant="ghost" size="sm" className="h-8 text-xs gap-1" onClick={clearSelection}>
              <X className="size-3" /> Aucun
            </Button>
            <span className="text-xs text-muted-foreground mx-1">|</span>
            <span className="text-xs text-text-secondary">{selectedIds.size} sélectionnée(s)</span>

            {selectedIds.size > 0 && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs gap-1 ml-auto"
                  disabled={bulkWorking || selectedDraftCount === 0}
                  onClick={() => void handleBulkActivate()}
                >
                  <Zap className="size-3" />
                  Activer ({selectedDraftCount || selectedIds.size})
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs gap-1"
                  onClick={() => setShowAssignPanel((v) => !v)}
                >
                  <UserPlus className="size-3" />
                  Attribuer user
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs gap-1"
                  disabled={bulkWorking}
                  onClick={() => void handleBulkClearUsers()}
                >
                  Rendre universelles
                </Button>
              </>
            )}
          </div>

          {showAssignPanel && selectedIds.size > 0 && (
            <div className="p-3 rounded-lg border border-cyan-400/30 bg-cyan-400/5 space-y-3">
              <p className="text-xs text-cyan-400 font-medium">
                Attribuer {selectedIds.size} carte(s) à :
              </p>
              <UserPicker selected={bulkAssignUsers} onChange={setBulkAssignUsers} />
              <Button
                size="sm"
                disabled={bulkWorking || bulkAssignUsers.length === 0}
                onClick={() => void handleBulkAssign()}
                className="gap-2"
              >
                <UserPlus className="size-4" />
                Confirmer l&apos;attribution
              </Button>
            </div>
          )}
        </div>

        {loading ? (
          <ToolboxLoadingBlock message="Chargement des cartes…" />
        ) : filtered.length === 0 ? (
          <ToolboxEmptyState
            icon={EyeOff}
            title="Aucune carte"
            hint={search ? "Essayez un autre filtre" : "Importez des cartes via l'onglet Import."}
          />
        ) : (
          <div className="space-y-2">
            {filtered.map((card) => {
              const isSelected = selectedIds.has(card.id);
              return (
                <div
                  key={card.id}
                  className={`flex items-center gap-3 p-3 md:p-4 rounded-lg border transition-colors ${
                    isSelected
                      ? "bg-primary/5 border-primary/30"
                      : "bg-bg-elevated/50 border-border-subtle hover:border-border"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleSelect(card.id)}
                    className="size-4 shrink-0 accent-primary cursor-pointer"
                    aria-label={`Sélectionner ${card.title_i18n?.fr}`}
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium text-text-primary">
                        {card.title_i18n?.fr ?? "—"}
                      </p>
                      <Badge
                        variant="outline"
                        className={`text-[10px] py-0 px-1.5 ${PRINCIPLES_COLORS[card.principle_code ?? ""] ?? ""}`}
                      >
                        {card.principle_code}
                      </Badge>
                      {!card.is_active && (
                        <Badge variant="secondary" className="text-[10px] py-0 px-1.5">
                          Draft
                        </Badge>
                      )}
                      {card.content_type && card.content_type !== "card" && (
                        <Badge variant="outline" className="text-[10px] py-0 px-1.5 text-violet-400 border-violet-400/30">
                          {card.content_type}
                        </Badge>
                      )}
                      {card.archetype_targets?.map((a: string) => (
                        <Badge
                          key={a}
                          variant="outline"
                          className="text-[10px] py-0 px-1.5 text-accent-primary border-accent-primary/30"
                        >
                          {a}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex items-center gap-2 mt-1 flex-wrap text-[11px] text-muted-foreground">
                      <span className="font-mono">{card.external_key ?? "—"}</span>
                      <span>·</span>
                      <span>{card.time_label}</span>
                      <span>·</span>
                      <span>#{card.sort_order}</span>
                      {card.target_user_ids?.length > 0 && (
                        <>
                          <span>·</span>
                          <span className="text-cyan-400">
                            👤 {card.target_user_ids.map((uid) => profileLabel(profileMap, uid)).join(", ")}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {(() => {
                    const s = stats.get(card.id);
                    if (!s || s.total_swipes === 0) return (
                      <span className="text-[10px] text-muted-foreground/50 shrink-0 mr-2">—</span>
                    );
                    const pct = Math.round((s.yes_count / s.total_swipes) * 100);
                    return (
                      <div className="flex flex-col items-end gap-1 shrink-0 mr-2 min-w-[72px]">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] font-mono text-green-400">✓{s.yes_count}</span>
                          <span className="text-[11px] font-mono text-red-400">✗{s.no_count}</span>
                        </div>
                        <div className="w-full h-1 rounded-full bg-red-400/30 overflow-hidden">
                          <div className="h-full rounded-full bg-green-400" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })()}

                  <div className="flex items-center gap-2 shrink-0">
                    <div className="flex flex-col items-center gap-0.5">
                      <Switch
                        checked={card.is_active}
                        disabled={togglingId === card.id}
                        onCheckedChange={(checked) => void handleToggle(card, checked)}
                        aria-label={card.is_active ? "Désactiver" : "Activer"}
                      />
                      <span className={`text-[9px] uppercase tracking-wider ${card.is_active ? "text-green-400" : "text-muted-foreground"}`}>
                        {card.is_active ? "Actif" : "Draft"}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => void handleDelete(card)}
                      title="Supprimer"
                      className="h-9 w-9 hover:text-red-400"
                    >
                      <Trash2 className="size-4" />
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
