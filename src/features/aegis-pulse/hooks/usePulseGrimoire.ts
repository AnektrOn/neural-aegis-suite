import { useCallback, useEffect, useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import type { GrimoireLoadState } from "../domain/types";
import { fetchPulseGrimoire } from "../services/pulseService";

export function usePulseGrimoire(enabled = true) {
  const { locale } = useLanguage();
  const [state, setState] = useState<GrimoireLoadState>({ status: "idle" });

  const load = useCallback(async () => {
    if (!enabled) return;
    setState({ status: "loading" });
    const result = await fetchPulseGrimoire(locale);
    if (!result.ok) {
      setState({ status: "error", message: result.error });
      return;
    }
    setState({
      status: "ready",
      library: result.library,
      runes: result.runes,
    });
  }, [locale, enabled]);

  useEffect(() => {
    void load();
  }, [load]);

  return { state, reload: load };
}
