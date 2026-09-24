import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type PlatformRole = "superadmin" | "company_admin" | "none";

type CacheEntry = {
  isSuperAdmin: boolean;
  isCompanyAdmin: boolean;
  companyId: string | null;
  ts: number;
};

const memCache = new Map<string, CacheEntry>();
const inflight = new Map<string, Promise<CacheEntry>>();
const TTL_MS = 5 * 60 * 1000;
const storageKey = (uid: string) => `aegis_platform_roles_${uid}`;

function readPersisted(uid: string): CacheEntry | null {
  try {
    const raw = localStorage.getItem(storageKey(uid));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CacheEntry;
    if (Date.now() - parsed.ts > TTL_MS) return null;
    return parsed;
  } catch {
    return null;
  }
}

function persist(uid: string, entry: Omit<CacheEntry, "ts">) {
  const full: CacheEntry = { ...entry, ts: Date.now() };
  memCache.set(uid, full);
  try {
    localStorage.setItem(storageKey(uid), JSON.stringify(full));
  } catch {
    /* ignore */
  }
}

async function fetchPlatformRoles(uid: string): Promise<CacheEntry> {
  const existing = inflight.get(uid);
  if (existing) return existing;

  const p = (async () => {
    const [rolesRes, membershipRes, profileRes] = await Promise.all([
      supabase.from("user_roles" as never).select("role").eq("user_id", uid),
      supabase
        .from("company_memberships" as never)
        .select("company_id, role")
        .eq("user_id", uid)
        .eq("role", "company_admin"),
      supabase.from("profiles").select("company_id").eq("id", uid).maybeSingle(),
    ]);

    const roles = ((rolesRes.data as { role: string }[] | null) ?? []).map((r) => r.role);
    const isSuperAdmin =
      roles.includes("superadmin") || roles.includes("admin");
    const memberships =
      (membershipRes.data as { company_id: string; role: string }[] | null) ?? [];
    const isCompanyAdmin =
      !isSuperAdmin &&
      (roles.includes("company_admin") || memberships.length > 0);
    const companyId =
      memberships[0]?.company_id ??
      ((profileRes.data as { company_id: string | null } | null)?.company_id ?? null);

    const entry = { isSuperAdmin, isCompanyAdmin, companyId, ts: Date.now() };
    persist(uid, entry);
    return entry;
  })();

  inflight.set(uid, p);
  try {
    return await p;
  } finally {
    inflight.delete(uid);
  }
}

function emptyRoles(): CacheEntry {
  return { isSuperAdmin: false, isCompanyAdmin: false, companyId: null, ts: Date.now() };
}

export function usePlatformRoles() {
  const { user } = useAuth();

  const initial = (() => {
    if (import.meta.env.VITE_MOCK_AUTH === "true") {
      return {
        isSuperAdmin: true,
        isCompanyAdmin: false,
        companyId: null as string | null,
        loading: false,
      };
    }
    if (!user) {
      return {
        isSuperAdmin: false,
        isCompanyAdmin: false,
        companyId: null as string | null,
        loading: false,
      };
    }
    const mem = memCache.get(user.id);
    if (mem && Date.now() - mem.ts <= TTL_MS) {
      return { ...mem, loading: false };
    }
    const persisted = readPersisted(user.id);
    if (persisted) {
      memCache.set(user.id, persisted);
      return { ...persisted, loading: false };
    }
    return {
      isSuperAdmin: false,
      isCompanyAdmin: false,
      companyId: null as string | null,
      loading: true,
    };
  })();

  const [isSuperAdmin, setIsSuperAdmin] = useState(initial.isSuperAdmin);
  const [isCompanyAdmin, setIsCompanyAdmin] = useState(initial.isCompanyAdmin);
  const [companyId, setCompanyId] = useState<string | null>(initial.companyId);
  const [loading, setLoading] = useState(initial.loading);

  useEffect(() => {
    if (import.meta.env.VITE_MOCK_AUTH === "true") {
      setIsSuperAdmin(true);
      setIsCompanyAdmin(false);
      setCompanyId(null);
      setLoading(false);
      return;
    }
    if (!user) {
      setIsSuperAdmin(false);
      setIsCompanyAdmin(false);
      setCompanyId(null);
      setLoading(false);
      return;
    }

    let alive = true;
    fetchPlatformRoles(user.id)
      .then((result) => {
        if (!alive) return;
        setIsSuperAdmin(result.isSuperAdmin);
        setIsCompanyAdmin(result.isCompanyAdmin);
        setCompanyId(result.companyId);
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

  const isPlatformOperator = isSuperAdmin || isCompanyAdmin;
  /** Legacy alias: platform operators who can enter /admin */
  const isAdmin = isPlatformOperator;

  return {
    isSuperAdmin,
    isCompanyAdmin,
    isPlatformOperator,
    isAdmin,
    companyId,
    loading,
  };
}

/** @deprecated Prefer usePlatformRoles — isAdmin means any platform operator (superadmin OR company_admin). */
export function useAdmin() {
  const roles = usePlatformRoles();
  return { isAdmin: roles.isAdmin, loading: roles.loading };
}

export function useSuperAdmin() {
  const { isSuperAdmin, loading } = usePlatformRoles();
  return { isSuperAdmin, loading };
}

export function useCompanyAdmin() {
  const { isCompanyAdmin, companyId, loading } = usePlatformRoles();
  return { isCompanyAdmin, companyId, loading };
}

export function clearPlatformRoleCache(uid?: string) {
  if (uid) {
    memCache.delete(uid);
    try {
      localStorage.removeItem(storageKey(uid));
      localStorage.removeItem(`aegis_is_admin_${uid}`);
    } catch {
      /* ignore */
    }
    return;
  }
  memCache.clear();
}

void emptyRoles;
