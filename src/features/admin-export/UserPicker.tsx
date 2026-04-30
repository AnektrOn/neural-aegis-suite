import { useEffect, useMemo, useState } from "react";
import { Search, X, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export interface UserOption { id: string; display_name: string | null }

interface Props {
  selected: string[];
  onChange: (ids: string[]) => void;
}

export default function UserPicker({ selected, onChange }: Props) {
  const [users, setUsers] = useState<UserOption[]>([]);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, display_name")
        .order("display_name", { ascending: true })
        .limit(1000);
      setUsers((data ?? []) as UserOption[]);
    })();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) => (u.display_name ?? "").toLowerCase().includes(q) || u.id.includes(q));
  }, [users, query]);

  const selectedSet = new Set(selected);
  const selectedUsers = users.filter((u) => selectedSet.has(u.id));

  const toggle = (id: string) => {
    if (selectedSet.has(id)) onChange(selected.filter((s) => s !== id));
    else onChange([...selected, id]);
  };

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search size={14} strokeWidth={1.5} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setOpen(true)}
          placeholder="Rechercher un utilisateur…"
          className="w-full pl-9 pr-3 py-2.5 bg-bg-elevated/60 border border-border-subtle rounded-lg text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent-warning/40"
        />
      </div>

      <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest">
        <button
          type="button"
          onClick={() => onChange(filtered.map((u) => u.id))}
          className="text-text-tertiary hover:text-accent-warning transition"
        >
          Tout sélectionner
        </button>
        <span className="text-text-tertiary/40">·</span>
        <button
          type="button"
          onClick={() => onChange([])}
          className="text-text-tertiary hover:text-accent-warning transition"
        >
          Tout effacer
        </button>
        <span className="ml-auto text-text-tertiary">
          {selected.length === 0 ? "Tous les utilisateurs" : `${selected.length} sélectionné(s)`}
        </span>
      </div>

      {open && (
        <div className="max-h-56 overflow-y-auto rounded-lg border border-border-subtle bg-bg-surface/80 backdrop-blur-xl divide-y divide-border-subtle/40">
          {filtered.slice(0, 200).map((u) => {
            const isSel = selectedSet.has(u.id);
            return (
              <button
                key={u.id}
                type="button"
                onClick={() => toggle(u.id)}
                className="w-full flex items-center gap-2 px-3 py-2 text-left text-xs hover:bg-bg-elevated/60 transition"
              >
                <div className={`w-4 h-4 rounded border flex items-center justify-center ${isSel ? "bg-accent-warning/20 border-accent-warning" : "border-border-subtle"}`}>
                  {isSel && <Check size={10} className="text-accent-warning" strokeWidth={2} />}
                </div>
                <span className="text-text-primary truncate flex-1">{u.display_name || "—"}</span>
                <span className="text-text-tertiary text-[10px] font-mono">{u.id.slice(0, 8)}</span>
              </button>
            );
          })}
          {filtered.length === 0 && (
            <div className="px-3 py-6 text-center text-xs text-text-tertiary">Aucun résultat</div>
          )}
        </div>
      )}

      {selectedUsers.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {selectedUsers.map((u) => (
            <span
              key={u.id}
              className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-accent-warning/10 border border-accent-warning/25 text-[11px] text-accent-warning"
            >
              {u.display_name || u.id.slice(0, 8)}
              <button type="button" onClick={() => toggle(u.id)} className="hover:text-text-primary">
                <X size={10} strokeWidth={2} />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
