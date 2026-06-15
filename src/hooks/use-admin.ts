import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

/** Cache partagé en mémoire + localStorage pour éviter une requête `user_roles`
 *  par composant qui appelle `useAdmin()` (AppLayout, Newsletter, AdminRoute…).
 *  → Le bouton admin apparaît instantanément dès la 2e visite. */
type CacheEntry = { isAdmin: boolean; ts: number };
const memCache = new Map<string, CacheEntry>();
const inflight = new Map<string, Promise<boolean>>();
const TTL_MS = 5 * 60 * 1000; // 5 min
const storageKey = (uid: string) => `aegis_is_admin_${uid}`;

function readPersisted(uid: string): boolean | null {
  try {
    const raw = localStorage.getItem(storageKey(uid));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CacheEntry;
    if (Date.now() - parsed.ts > TTL_MS) return null;
    return !!parsed.isAdmin;
  } catch {
    return null;
  }
}

function persist(uid: string, isAdmin: boolean) {
  const entry: CacheEntry = { isAdmin, ts: Date.now() };
  memCache.set(uid, entry);
  try {
    localStorage.setItem(storageKey(uid), JSON.stringify(entry));
  } catch {
    /* ignore */
  }
}

async function fetchIsAdmin(uid: string): Promise<boolean> {
  const existing = inflight.get(uid);
  if (existing) return existing;

  const p = (async () => {
    const { data, error } = await supabase
      .from("user_roles" as any)
      .select("role")
      .eq("user_id", uid)
      .eq("role", "admin")
      .maybeSingle();
    const result = !!data && !error;
    persist(uid, result);
    return result;
  })();

  inflight.set(uid, p);
  try {
    return await p;
  } finally {
    inflight.delete(uid);
  }
}

export function useAdmin() {
  const { user } = useAuth();

  const initial = (() => {
    if (import.meta.env.VITE_MOCK_AUTH === "true") return { isAdmin: true, loading: false };
    if (!user) return { isAdmin: false, loading: false };
    const mem = memCache.get(user.id);
    if (mem && Date.now() - mem.ts <= TTL_MS) {
      return { isAdmin: mem.isAdmin, loading: false };
    }
    const persisted = readPersisted(user.id);
    if (persisted !== null) {
      memCache.set(user.id, { isAdmin: persisted, ts: Date.now() });
      return { isAdmin: persisted, loading: false };
    }
    return { isAdmin: false, loading: true };
  })();

  const [isAdmin, setIsAdmin] = useState(initial.isAdmin);
  const [loading, setLoading] = useState(initial.loading);

  useEffect(() => {
    if (import.meta.env.VITE_MOCK_AUTH === "true") {
      setIsAdmin(true);
      setLoading(false);
      return;
    }
    if (!user) {
      setIsAdmin(false);
      setLoading(false);
      return;
    }

    let alive = true;
    // Toujours rafraîchir en arrière-plan pour invalider un cache obsolète,
    // mais on n'affiche pas de spinner si on a déjà une valeur cache.
    fetchIsAdmin(user.id)
      .then((result) => {
        if (!alive) return;
        setIsAdmin(result);
        setLoading(false);
      })
      .catch(() => {
        if (!alive) return;
        setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [user]);

  return { isAdmin, loading };
}
