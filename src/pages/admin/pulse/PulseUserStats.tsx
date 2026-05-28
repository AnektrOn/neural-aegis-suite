import { useCallback, useEffect, useState } from "react";
import { RefreshCw, ThumbsUp, ThumbsDown, Sparkles, CheckCircle2 } from "lucide-react";
import {
  ToolboxSection,
  ToolboxEmptyState,
  ToolboxLoadingBlock,
  ToolboxPageStat,
  toolboxFieldClass,
} from "@/components/admin/toolbox/ToolboxAdminUi";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  fetchPulseSwipeLog,
  fetchUserRuneProgress,
  fetchProfileOptions,
  listPulseCards,
  type PulseCardRow,
  type PulseSwipeLogEntry,
  type UserRuneProgress,
  type ProfileOption,
} from "./pulseAdminService";

const RUNE_COLORS: Record<string, string> = {
  MENTALISM: "text-violet-400",
  CORRESPONDENCE: "text-blue-400",
  VIBRATION: "text-emerald-400",
  POLARITY: "text-orange-400",
  RHYTHM: "text-pink-400",
  CAUSE_EFFECT: "text-amber-400",
  GENDER: "text-teal-400",
};

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString("fr-FR", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export function PulseUserStats() {
  const [cards, setCards] = useState<PulseCardRow[]>([]);
  const [profiles, setProfiles] = useState<ProfileOption[]>([]);
  const [userId, setUserId] = useState<string>("");
  const [cardFilter, setCardFilter] = useState<string>("all");
  const [log, setLog] = useState<PulseSwipeLogEntry[]>([]);
  const [runes, setRunes] = useState<UserRuneProgress[]>([]);
  const [swipeSummary, setSwipeSummary] = useState({ assimilated: 0, ignored: 0, completed: 0, total: 0 });
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const [cardList, profileList] = await Promise.all([
      cards.length === 0 ? listPulseCards() : Promise.resolve(cards),
      profiles.length === 0 ? fetchProfileOptions() : Promise.resolve(profiles),
    ]);
    if (cards.length === 0) setCards(cardList);
    if (profiles.length === 0) setProfiles(profileList);

    const cardId = cardFilter === "all" ? null : cardFilter;
    const uid = userId || null;
    const [entries, userRunes] = await Promise.all([
      fetchPulseSwipeLog(uid, cardId),
      uid ? fetchUserRuneProgress(uid) : Promise.resolve(null),
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
    setLoading(false);
  }, [userId, cardFilter, cards, profiles]);

  useEffect(() => {
    void load();
  }, [load]);

  const totalYes = log.filter((e) => e.action === "assimilated").length;
  const totalNo = log.filter((e) => e.action === "ignored").length;
  const totalCompleted = userId ? swipeSummary.completed : log.filter((e) => e.completed_at != null).length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <ToolboxPageStat label="Swipes YES" value={userId ? swipeSummary.assimilated : totalYes} icon={ThumbsUp} />
        <ToolboxPageStat label="Swipes NO" value={userId ? swipeSummary.ignored : totalNo} icon={ThumbsDown} />
        <ToolboxPageStat label="Cours validés" value={totalCompleted} icon={CheckCircle2} />
        <ToolboxPageStat
          label="Runes débloquées"
          value={runes.filter((r) => r.is_unlocked).length}
          icon={Sparkles}
        />
        <ToolboxPageStat label="Entrées log" value={log.length} icon={RefreshCw} />
      </div>

      <ToolboxSection title="Filtrer par user" description="Sélectionnez un user pour voir ses runes et son historique de swipes.">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Utilisateur</p>
            <select
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className={toolboxFieldClass}
            >
              <option value="">Tous les users</option>
              {profiles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.display_name ?? p.id.slice(0, 8)}…
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Carte (optionnel)</p>
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
        </div>
        <div className="flex justify-end mt-3">
          <Button variant="outline" size="sm" onClick={() => void load()} className="gap-2">
            <RefreshCw className="size-4" />
            Rafraîchir
          </Button>
        </div>
      </ToolboxSection>

      {userId && runes.length > 0 && (
        <ToolboxSection title="Progression Runes" badge={`${runes.filter((r) => r.is_unlocked).length}/${runes.length}`}>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
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
                  <p className={`text-[10px] font-mono uppercase tracking-wider mb-1 ${RUNE_COLORS[rune.principle_code] ?? ""}`}>
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
                  {isEmpty ? (
                    <p className="mt-2 text-[9px] text-muted-foreground">Aucune carte</p>
                  ) : rune.is_unlocked ? (
                    <Badge variant="outline" className="mt-2 text-[9px] text-green-400 border-green-400/30">
                      Débloquée
                    </Badge>
                  ) : null}
                </div>
              );
            })}
          </div>
          <p className="text-[11px] text-muted-foreground mt-3">
            Les pulses YES (assimilées) incrémentent automatiquement le compteur de la rune correspondante.
          </p>
        </ToolboxSection>
      )}

      <ToolboxSection title="Historique des swipes" badge={`${log.length} entrée(s)`}>
        {loading ? (
          <ToolboxLoadingBlock message="Chargement…" />
        ) : log.length === 0 ? (
          <ToolboxEmptyState
            icon={ThumbsUp}
            title="Aucun swipe enregistré"
            hint={userId ? "Cet user n'a pas encore swipé de cartes Pulse." : "Sélectionnez un user ou attendez les premiers swipes."}
          />
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border-subtle">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-subtle bg-bg-elevated/50 text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                  <th className="px-3 py-2.5 font-medium">Date</th>
                  <th className="px-3 py-2.5 font-medium">User</th>
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
                      <p className="text-sm text-text-primary">{entry.user_name}</p>
                      <p className="text-[10px] font-mono text-muted-foreground">{entry.user_id.slice(0, 8)}…</p>
                    </td>
                    <td className="px-3 py-2.5">
                      <p className="text-sm text-text-primary">{entry.card_title}</p>
                      <p className="text-[10px] font-mono text-muted-foreground">{entry.external_key}</p>
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
    </div>
  );
}
