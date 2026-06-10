import { useCallback, useEffect, useMemo, useState } from "react";
import {
  RefreshCw,
  ThumbsUp,
  ThumbsDown,
  Sparkles,
  CheckCircle2,
  Users,
  ChevronLeft,
  ChevronRight,
  Search,
  Eye,
  EyeOff,
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
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  fetchPulseSwipeLog,
  fetchPulseUsersOverview,
  fetchUserRuneProgress,
  listPulseCards,
  type PulseCardRow,
  type PulseSwipeLogEntry,
  type PulseUserOverviewRow,
  type PulseUsersOverviewFilters,
  type UserRuneProgress,
} from "./pulseAdminService";
import { PulseCardContentPreview } from "./PulseCardContentPreview";
import { cardsInUserScope } from "./pulseAdminScope";

const RUNE_COLORS: Record<string, string> = {
  MENTALISM: "text-violet-400",
  CORRESPONDENCE: "text-blue-400",
  VIBRATION: "text-emerald-400",
  POLARITY: "text-orange-400",
  RHYTHM: "text-pink-400",
  CAUSE_EFFECT: "text-amber-400",
  GENDER: "text-teal-400",
};

const PRINCIPLE_OPTIONS = [
  "MENTALISM",
  "CORRESPONDENCE",
  "VIBRATION",
  "POLARITY",
  "RHYTHM",
  "CAUSE_EFFECT",
  "GENDER",
] as const;

const PAGE_SIZE = 25;

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export function PulseUserStats() {
  const [cards, setCards] = useState<PulseCardRow[]>([]);
  const [search, setSearch] = useState("");
  const [activity, setActivity] = useState<PulseUsersOverviewFilters["activity"]>("all");
  const [principleFilter, setPrincipleFilter] = useState<string>("all");
  const [cardFilter, setCardFilter] = useState<string>("all");
  const [minAssimilated, setMinAssimilated] = useState(0);
  const [minRunes, setMinRunes] = useState(0);
  const [sort, setSort] = useState<PulseUsersOverviewFilters["sort"]>("last_activity_desc");
  const [page, setPage] = useState(0);
  const [filterRevision, setFilterRevision] = useState(0);

  const [overview, setOverview] = useState<PulseUserOverviewRow[]>([]);
  const [overviewTotal, setOverviewTotal] = useState(0);
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [overviewWarning, setOverviewWarning] = useState<string | null>(null);

  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [log, setLog] = useState<PulseSwipeLogEntry[]>([]);
  const [runes, setRunes] = useState<UserRuneProgress[]>([]);
  const [swipeSummary, setSwipeSummary] = useState({ assimilated: 0, ignored: 0, completed: 0, total: 0 });
  const [detailLoading, setDetailLoading] = useState(false);
  const [cardBrowseSearch, setCardBrowseSearch] = useState("");
  const [previewCardId, setPreviewCardId] = useState<string | null>(null);

  useEffect(() => {
    void listPulseCards().then(setCards);
  }, []);

  const loadOverview = useCallback(async () => {
    setOverviewLoading(true);
    const result = await fetchPulseUsersOverview({
      search: search.trim() || undefined,
      activity,
      principleCode: principleFilter === "all" ? null : principleFilter,
      cardId: cardFilter === "all" ? null : cardFilter,
      minAssimilated,
      minRunesUnlocked: minRunes,
      sort,
      limit: PAGE_SIZE,
      offset: page * PAGE_SIZE,
    });
    setOverview(result.users);
    setOverviewTotal(result.total);
    setOverviewWarning(result.warning ?? null);
    setOverviewLoading(false);
  }, [search, activity, principleFilter, cardFilter, minAssimilated, minRunes, sort, page, filterRevision]);

  const loadDetail = useCallback(async (userId: string) => {
    if (!userId) {
      setLog([]);
      setRunes([]);
      setSwipeSummary({ assimilated: 0, ignored: 0, completed: 0, total: 0 });
      return;
    }
    setDetailLoading(true);
    const cardId = cardFilter === "all" ? null : cardFilter;
    const [entries, userRunes] = await Promise.all([
      fetchPulseSwipeLog(userId, cardId),
      fetchUserRuneProgress(userId),
    ]);
    setLog(entries);
    if (userRunes) {
      setRunes(userRunes.runes);
      setSwipeSummary(userRunes.swipes);
    } else {
      setRunes([]);
      setSwipeSummary({
        assimilated: entries.filter((e) => e.action === "assimilated").length,
        ignored: entries.filter((e) => e.action === "ignored").length,
        completed: entries.filter((e) => e.completed_at != null).length,
        total: entries.length,
      });
    }
    setDetailLoading(false);
  }, [cardFilter]);

  useEffect(() => {
    void loadOverview();
  }, [loadOverview]);

  useEffect(() => {
    void loadDetail(selectedUserId);
  }, [selectedUserId, loadDetail]);

  const pageTotals = useMemo(
    () =>
      overview.reduce(
        (acc, row) => ({
          assimilated: acc.assimilated + row.assimilated,
          ignored: acc.ignored + row.ignored,
          completed: acc.completed + row.completed,
          runes: acc.runes + row.runes_unlocked,
        }),
        { assimilated: 0, ignored: 0, completed: 0, runes: 0 },
      ),
    [overview],
  );

  const totalPages = Math.max(1, Math.ceil(overviewTotal / PAGE_SIZE));
  const selectedRow = overview.find((r) => r.user_id === selectedUserId);

  const selectedCard = useMemo(
    () => (cardFilter === "all" ? null : cards.find((c) => c.id === cardFilter) ?? null),
    [cards, cardFilter],
  );

  const browsableCards = useMemo(() => {
    let list = cards;
    if (principleFilter !== "all") {
      list = list.filter((c) => c.principle_code === principleFilter);
    }
    const q = cardBrowseSearch.trim().toLowerCase();
    if (q) {
      list = list.filter((c) => {
        const title = (c.title_i18n?.fr ?? c.title_i18n?.en ?? "").toLowerCase();
        const key = (c.external_key ?? "").toLowerCase();
        return title.includes(q) || key.includes(q);
      });
    }
    return list;
  }, [cards, principleFilter, cardBrowseSearch]);

  const isUserScoped = Boolean(selectedUserId);

  const scopeCards = useMemo(
    () => (isUserScoped ? cardsInUserScope(cards, selectedUserId) : cards),
    [cards, selectedUserId, isUserScoped],
  );

  const scopeActive = scopeCards.filter((c) => c.is_active).length;
  const scopeDrafts = scopeCards.length - scopeActive;
  const scopePrinciples = new Set(scopeCards.map((c) => c.principle_code).filter(Boolean)).size;
  const unlockedRunes = runes.filter((r) => r.is_unlocked).length;

  const statsScopeLabel = isUserScoped
    ? selectedRow?.user_name ?? selectedUserId.slice(0, 8)
  : cardFilter !== "all"
    ? selectedCard?.title_i18n?.fr ?? "Carte filtrée"
    : null;

  const applyFilters = () => {
    setPage(0);
    setFilterRevision((r) => r + 1);
  };

  return (
    <div className="space-y-6">
      {overviewWarning ? (
        <p className="rounded-lg border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-xs text-amber-200">
          {overviewWarning}
        </p>
      ) : null}

      {statsScopeLabel ? (
        <p className="text-xs text-muted-foreground">
          Stats pour : <span className="text-cyan-400 font-medium">{statsScopeLabel}</span>
          {isUserScoped
            ? cardFilter !== "all"
              ? " · swipes filtrés sur la carte sélectionnée"
              : " · cartes assignées + swipes de cet utilisateur"
            : " · agrégat page courante"}
        </p>
      ) : null}

      {isUserScoped ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
          <ToolboxPageStat label="Cartes assignées" value={scopeCards.length} icon={Users} />
          <ToolboxPageStat label="Actives" value={scopeActive} icon={Eye} />
          <ToolboxPageStat label="Drafts" value={scopeDrafts} icon={EyeOff} />
          <ToolboxPageStat label="Principes" value={scopePrinciples} icon={Sparkles} />
          <ToolboxPageStat label="YES (user)" value={swipeSummary.assimilated} icon={ThumbsUp} />
          <ToolboxPageStat label="NO (user)" value={swipeSummary.ignored} icon={ThumbsDown} />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          <ToolboxPageStat label="Utilisateurs" value={overviewTotal} icon={Users} />
          <ToolboxPageStat label="YES (page)" value={pageTotals.assimilated} icon={ThumbsUp} />
          <ToolboxPageStat label="NO (page)" value={pageTotals.ignored} icon={ThumbsDown} />
          <ToolboxPageStat label="Cours validés (page)" value={pageTotals.completed} icon={CheckCircle2} />
          <ToolboxPageStat label="Runes (page)" value={pageTotals.runes} icon={Sparkles} />
        </div>
      )}

      {isUserScoped ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-2">
          <ToolboxPageStat label="Cours validés" value={swipeSummary.completed} icon={CheckCircle2} />
          <ToolboxPageStat label="Runes débloquées" value={unlockedRunes} icon={Sparkles} />
        </div>
      ) : null}

      <ToolboxSection
        title="Vue tous les utilisateurs"
        description="Stats Pulse agrégées par utilisateur. Cliquez sur une ligne pour le détail runes + historique."
      >
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-2 md:col-span-2 lg:col-span-3">
            <p className="text-xs text-muted-foreground">Recherche</p>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && applyFilters()}
                placeholder="Nom ou ID utilisateur…"
                className="pl-9"
              />
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Activité Pulse</p>
            <select
              value={activity}
              onChange={(e) => setActivity(e.target.value as PulseUsersOverviewFilters["activity"])}
              className={toolboxFieldClass}
            >
              <option value="all">Tous</option>
              <option value="active">Avec swipes</option>
              <option value="inactive">Sans swipe</option>
            </select>
          </div>

          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Rune / principe</p>
            <select
              value={principleFilter}
              onChange={(e) => setPrincipleFilter(e.target.value)}
              className={toolboxFieldClass}
            >
              <option value="all">Toutes</option>
              {PRINCIPLE_OPTIONS.map((code) => (
                <option key={code} value={code}>
                  {code}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Carte</p>
            <select
              value={cardFilter}
              onChange={(e) => setCardFilter(e.target.value)}
              className={toolboxFieldClass}
            >
              <option value="all">Toutes les cartes</option>
              {cards.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title_i18n?.fr ?? c.external_key ?? c.id.slice(0, 8)}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Min. YES assimilés</p>
            <Input
              type="number"
              min={0}
              value={minAssimilated}
              onChange={(e) => setMinAssimilated(Math.max(0, Number(e.target.value) || 0))}
            />
          </div>

          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Min. runes débloquées</p>
            <Input
              type="number"
              min={0}
              value={minRunes}
              onChange={(e) => setMinRunes(Math.max(0, Number(e.target.value) || 0))}
            />
          </div>

          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Tri</p>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as PulseUsersOverviewFilters["sort"])}
              className={toolboxFieldClass}
            >
              <option value="last_activity_desc">Dernière activité</option>
              <option value="assimilated_desc">Plus de YES</option>
              <option value="runes_desc">Runes débloquées</option>
              <option value="name_asc">Nom A→Z</option>
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 mt-4">
          <p className="text-xs text-muted-foreground">
            {overviewTotal} utilisateur(s) · page {page + 1}/{totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 0 || overviewLoading}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page + 1 >= totalPages || overviewLoading}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRight className="size-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={applyFilters} className="gap-2">
              <RefreshCw className="size-4" />
              Appliquer
            </Button>
          </div>
        </div>
      </ToolboxSection>

      {selectedCard ? (
        <ToolboxSection
          title="Contenu de la carte filtrée"
          badge={selectedCard.external_key ?? selectedCard.title_i18n?.fr ?? "carte"}
          description="Aperçu FR/EN du recto/verso tel que vu côté user (sans géométrie)."
        >
          <PulseCardContentPreview card={selectedCard} />
        </ToolboxSection>
      ) : null}

      <ToolboxSection
        title="Contenu des cartes Pulse"
        badge={`${browsableCards.length} carte(s)`}
        description="Parcourez le catalogue et dépliez une carte pour lire question, enseignement et cours."
      >
        <div className="grid gap-4 md:grid-cols-2 mb-4">
          <div className="space-y-2 md:col-span-2">
            <p className="text-xs text-muted-foreground">Rechercher une carte</p>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={cardBrowseSearch}
                onChange={(e) => setCardBrowseSearch(e.target.value)}
                placeholder="Titre ou clé external_key…"
                className="pl-9"
              />
            </div>
          </div>
        </div>

        {browsableCards.length === 0 ? (
          <ToolboxEmptyState
            icon={Sparkles}
            title="Aucune carte"
            hint="Ajustez la recherche ou le filtre rune ci-dessus."
          />
        ) : (
          <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
            {browsableCards.map((card) => {
              const isOpen = previewCardId === card.id;
              return (
                <div key={card.id} className="rounded-lg border border-border-subtle bg-bg-elevated/30">
                  <button
                    type="button"
                    onClick={() => setPreviewCardId(isOpen ? null : card.id)}
                    className="flex w-full items-center justify-between gap-3 p-3 text-left hover:bg-bg-elevated/50 transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-text-primary truncate">
                        {card.title_i18n?.fr ?? card.external_key ?? "—"}
                      </p>
                      <p className="text-[11px] text-muted-foreground font-mono truncate">
                        {card.principle_code} · {card.external_key ?? card.id.slice(0, 8)}
                      </p>
                    </div>
                    <Badge variant="outline" className="shrink-0 text-[10px]">
                      {isOpen ? "Masquer" : "Voir"}
                    </Badge>
                  </button>
                  {isOpen ? (
                    <div className="px-3 pb-3">
                      <PulseCardContentPreview card={card} />
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </ToolboxSection>

      <ToolboxSection title="Tableau utilisateurs" badge={`${overviewTotal} total`}>
        {overviewLoading ? (
          <ToolboxLoadingBlock message="Chargement des stats…" />
        ) : overview.length === 0 ? (
          <ToolboxEmptyState
            icon={Users}
            title="Aucun utilisateur"
            hint="Ajustez les filtres ou attendez les premiers swipes Pulse."
          />
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border-subtle">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-subtle bg-bg-elevated/50 text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                  <th className="px-3 py-2.5 font-medium">Utilisateur</th>
                  <th className="px-3 py-2.5 font-medium text-center">YES</th>
                  <th className="px-3 py-2.5 font-medium text-center">NO</th>
                  <th className="px-3 py-2.5 font-medium text-center">Validés</th>
                  <th className="px-3 py-2.5 font-medium text-center">Runes</th>
                  <th className="px-3 py-2.5 font-medium">Dernière activité</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {overview.map((row) => {
                  const isSelected = row.user_id === selectedUserId;
                  return (
                    <tr
                      key={row.user_id}
                      onClick={() => setSelectedUserId(row.user_id)}
                      className={cn(
                        "cursor-pointer transition-colors hover:bg-bg-elevated/40",
                        isSelected && "bg-primary/10 hover:bg-primary/10",
                      )}
                    >
                      <td className="px-3 py-2.5">
                        <p className="text-sm font-medium text-text-primary">{row.user_name}</p>
                        <p className="text-[10px] font-mono text-muted-foreground">{row.user_id.slice(0, 8)}…</p>
                      </td>
                      <td className="px-3 py-2.5 text-center tabular-nums text-green-400">{row.assimilated}</td>
                      <td className="px-3 py-2.5 text-center tabular-nums text-red-400">{row.ignored}</td>
                      <td className="px-3 py-2.5 text-center tabular-nums">{row.completed}</td>
                      <td className="px-3 py-2.5 text-center tabular-nums">{row.runes_unlocked}</td>
                      <td className="px-3 py-2.5 text-xs text-muted-foreground whitespace-nowrap">
                        {formatDate(row.last_swipe_at)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </ToolboxSection>

      {selectedUserId ? (
        <>
          <ToolboxSection
            title="Détail utilisateur"
            badge={selectedRow?.user_name ?? selectedUserId.slice(0, 8)}
            description="Runes et historique de swipes pour l'utilisateur sélectionné."
          >
            <div className="flex justify-end mb-3">
              <Button variant="ghost" size="sm" onClick={() => setSelectedUserId("")}>
                Fermer le détail
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-3 md:grid-cols-4 mb-6">
              <ToolboxPageStat label="YES" value={swipeSummary.assimilated} icon={ThumbsUp} />
              <ToolboxPageStat label="NO" value={swipeSummary.ignored} icon={ThumbsDown} />
              <ToolboxPageStat label="Cours validés" value={swipeSummary.completed} icon={CheckCircle2} />
              <ToolboxPageStat
                label="Runes débloquées"
                value={runes.filter((r) => r.is_unlocked).length}
                icon={Sparkles}
              />
            </div>

            {runes.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
                {runes.map((rune) => {
                  const total = rune.total_cards ?? 0;
                  const pct = total > 0 ? Math.min((rune.pulses_count / total) * 100, 100) : 0;
                  const isEmpty = total === 0 && rune.pulses_count === 0;
                  return (
                    <div
                      key={rune.principle_code}
                      className={`p-3 rounded-lg border text-center ${
                        isEmpty
                          ? "border-border-subtle/50 bg-bg-elevated/10 opacity-50"
                          : rune.is_unlocked
                            ? "border-green-400/30 bg-green-400/5"
                            : "border-border-subtle bg-bg-elevated/30"
                      }`}
                    >
                      <p
                        className={`text-[10px] font-mono uppercase tracking-wider mb-1 ${RUNE_COLORS[rune.principle_code] ?? ""}`}
                      >
                        {rune.principle_code}
                      </p>
                      <p className="text-lg font-semibold text-text-primary">
                        {rune.pulses_count}/{total}
                      </p>
                      <div className="w-full h-1 rounded-full bg-border mt-2 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${rune.is_unlocked ? "bg-green-400" : "bg-primary"}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : null}
          </ToolboxSection>

          <ToolboxSection title="Historique des swipes" badge={`${log.length} entrée(s)`}>
            {detailLoading ? (
              <ToolboxLoadingBlock message="Chargement…" />
            ) : log.length === 0 ? (
              <ToolboxEmptyState
                icon={ThumbsUp}
                title="Aucun swipe"
                hint="Cet utilisateur n'a pas encore swipé de cartes (avec les filtres actuels)."
              />
            ) : (
              <div className="overflow-x-auto rounded-lg border border-border-subtle">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border-subtle bg-bg-elevated/50 text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                      <th className="px-3 py-2.5 font-medium">Date</th>
                      <th className="px-3 py-2.5 font-medium">Carte</th>
                      <th className="px-3 py-2.5 font-medium">Rune</th>
                      <th className="px-3 py-2.5 font-medium">Action</th>
                      <th className="px-3 py-2.5 font-medium">Complété</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-subtle">
                    {log.map((entry) => (
                      <tr key={entry.id} className="hover:bg-bg-elevated/30 transition-colors">
                        <td className="px-3 py-2.5 text-xs text-muted-foreground whitespace-nowrap">
                          {formatDate(entry.swiped_at)}
                        </td>
                        <td className="px-3 py-2.5">
                          <button
                            type="button"
                            className="text-left hover:underline"
                            onClick={() => {
                              setCardFilter(entry.card_id);
                              setPreviewCardId(entry.card_id);
                            }}
                          >
                            <p className="text-sm text-text-primary">{entry.card_title}</p>
                            <p className="text-[10px] font-mono text-muted-foreground">{entry.external_key}</p>
                          </button>
                        </td>
                        <td className="px-3 py-2.5">
                          <Badge variant="outline" className={`text-[10px] ${RUNE_COLORS[entry.principle_code] ?? ""}`}>
                            {entry.principle_code}
                          </Badge>
                        </td>
                        <td className="px-3 py-2.5">
                          {entry.action === "assimilated" ? (
                            <Badge className="bg-green-500/15 text-green-400 border-green-400/30 hover:bg-green-500/15">
                              ✓ YES
                            </Badge>
                          ) : (
                            <Badge className="bg-red-500/15 text-red-400 border-red-400/30 hover:bg-red-500/15">
                              ✗ NO
                            </Badge>
                          )}
                        </td>
                        <td className="px-3 py-2.5">
                          {entry.completed_at ? (
                            <span className="flex items-center gap-1.5 text-xs text-green-400">
                              <CheckCircle2 className="size-3.5" />
                              {formatDate(entry.completed_at)}
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </ToolboxSection>
        </>
      ) : null}
    </div>
  );
}
