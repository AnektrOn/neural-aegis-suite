import { useEffect, useState, useMemo } from "react";
import { ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageContext";
import { adminFetchSharedPlaces, type AdminUserPlaceRow } from "@/services/adminPlaces";

type ProfileMini = { id: string; display_name: string | null };

export default function AdminUserPlaces() {
  const { t } = useLanguage();
  const [places, setPlaces] = useState<AdminUserPlaceRow[]>([]);
  const [profiles, setProfiles] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const list = await adminFetchSharedPlaces();
      if (cancelled) return;
      setPlaces(list);
      const ids = [...new Set(list.map((p) => p.user_id))];
      if (ids.length) {
        const { data } = await supabase.from("profiles").select("id, display_name").in("id", ids);
        const map: Record<string, string> = {};
        (data || []).forEach((r: ProfileMini) => {
          map[r.id] = r.display_name || r.id.slice(0, 8);
        });
        if (!cancelled) setProfiles(map);
      } else {
        setProfiles({});
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const byUser = useMemo(() => {
    const m = new Map<string, AdminUserPlaceRow[]>();
    for (const p of places) {
      const arr = m.get(p.user_id) || [];
      arr.push(p);
      m.set(p.user_id, arr);
    }
    return m;
  }, [places]);

  return (
    <div className="p-4 md:p-6">
      <div className="max-w-5xl space-y-4">
        <div>
          <h1 className="font-display text-xl text-text-primary">{t("admin.userPlaces.title")}</h1>
          <p className="mt-1 text-sm text-text-tertiary">{t("admin.userPlaces.subtitle")}</p>
        </div>

        {loading ? (
          <p className="text-sm text-text-tertiary">…</p>
        ) : places.length === 0 ? (
          <p className="rounded-xl border border-border-subtle bg-bg-elevated/40 p-6 text-sm text-text-tertiary">
            {t("admin.userPlaces.empty")}
          </p>
        ) : (
          <div className="space-y-6">
            {[...byUser.entries()].map(([uid, plist]) => (
              <div key={uid} className="rounded-xl border border-border-subtle bg-bg-elevated/30 p-4">
                <p className="mb-3 text-xs uppercase tracking-widest text-text-tertiary">
                  {t("admin.userPlaces.userLabel")}: <span className="text-text-primary">{profiles[uid] || uid.slice(0, 8)}</span>
                </p>
                <ul className="space-y-2">
                  {plist.map((p) => (
                    <li
                      key={p.id}
                      className="flex flex-col gap-2 rounded-lg border border-border-subtle/60 bg-bg-page/40 px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0">
                        <p className="font-medium text-text-primary">{p.name}</p>
                        <p className="truncate text-[11px] text-text-tertiary">{p.maps_url}</p>
                        {p.latitude != null && p.longitude != null && (
                          <p className="text-[10px] text-text-tertiary/80">
                            {p.latitude.toFixed(5)}, {p.longitude.toFixed(5)}
                          </p>
                        )}
                      </div>
                      <a
                        href={p.maps_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex shrink-0 items-center gap-1 text-xs text-accent-primary hover:underline"
                      >
                        <ExternalLink size={12} /> Maps
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
