import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import { fetchPracticesHubStats, type PracticesHubStats } from "../services/fetchPracticesHubStats";

export function usePracticesHubData() {
  const { user } = useAuth();
  const { locale } = useLanguage();
  const [stats, setStats] = useState<PracticesHubStats | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user?.id) {
      setStats(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await fetchPracticesHubStats(user.id, locale);
      setStats(data);
    } catch (err) {
      console.error("[PracticesHub] load failed", err);
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, [user?.id, locale]);

  useEffect(() => {
    void load();
  }, [load]);

  return { stats, loading, reload: load, dailyScore: stats?.dailyScore ?? null };
}
